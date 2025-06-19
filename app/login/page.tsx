'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next-nprogress-bar';
import { supabase } from '@/app/lib/supabaseClient';
import { generateToken } from '@/app/lib/jwt';
import { generateChallenge, generateProof, validateProof } from '@/app/lib/zkp';
import { fetchUserAuthData, fetchWebAuthnID } from '../supabase/queries';
import { setNewChallenge, recordFailedAttempt, resetFailedAttempts } from '../supabase/mutations';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'sonner';

export default function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const [challenge, setChallenge] = useState('');

  // when an email is provided, it generates and stores a new challenge
  useEffect(() => {
    async function createChallenge() {
      if (!formData.email) return;
      const newChallenge = generateChallenge();
      setChallenge(newChallenge);
      await setNewChallenge(formData.email, newChallenge);
    }

    createChallenge();
  }, [formData.email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('Attempting to sign in with Supabase...');
      
      // we then first check if the user exists and if they're locked out
      const userData = await fetchUserAuthData(formData.email);
      if (!userData) {
        console.error('User data not found for email:', formData.email);
        toast.error('Invalid login credentials');
        throw new Error('Invalid login credentials');
      }

      // then we check if account is locked based on brute force amount
      //lock out after too many attempts to log in
      if (userData.locked_until && new Date(userData.locked_until) > new Date()) {
        const timeLeft = Math.ceil((new Date(userData.locked_until).getTime() - new Date().getTime()) / 60000);
        const errorMessage = `Account is locked. Please try again in ${timeLeft} minutes.`;
        toast.error(errorMessage, {
          duration: 5000,
          description: 'Too many failed login attempts'
        });
        throw new Error(errorMessage);
      }

      // this checks failed attempts
      if (userData.failed_attempts >= 5) {
        // if we reach here, it means the account was locked but the time has expired
        // This then resets the lock and failed attempts
        await resetFailedAttempts(formData.email);
        toast.info('Account lock has expired. You can try logging in again.', {
          duration: 4000
        });
      }

      // Uses Supabase auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (authError) {
        console.error('Supabase auth error:', authError);
        // Records the failed attempt before throwing the error using query
        await recordFailedAttempt(formData.email);
        
        // this nthen fetches updated user data to check if this attempt caused a lock
        const updatedUserData = await fetchUserAuthData(formData.email);
        if (updatedUserData?.failed_attempts >= 5) {
          toast.error('Account has been locked for 10 minutes due to too many failed attempts.', {
            duration: 5000
          });
          throw new Error('Account has been locked for 10 minutes due to too many failed attempts.');
        } else {
          const remainingAttempts = 5 - (updatedUserData?.failed_attempts || 0);
          toast.error(`Invalid login credentials. ${remainingAttempts} attempts remaining before account lock.`, {
            duration: 4000
          });
          throw new Error('Invalid login credentials');
        }
      }

      console.log('Supabase auth successful, fetching user data...');

      // A ZKP proof is then generated and stored
      console.log('Generating ZKP proof...');
      const clientProof = await generateProof(formData.password, userData.challenge);

      // This vaidates proof
      console.log('Validating ZKP proof...');
      const isValid = await validateProof(userData.password_hash, clientProof, userData.challenge);

      if (isValid) {
        await resetFailedAttempts(formData.email);

        const token = await generateToken(userData.id);
        localStorage.setItem('sessionToken', token);

        toast.success('ZK Proof verified successfully ✅');
        router.push('/dashboard');
      } else {
        await recordFailedAttempt(formData.email);
        
        // using queries this then fetches the updated user data to check if this attempt caused a lock
        const updatedUserData = await fetchUserAuthData(formData.email);
        if (updatedUserData?.failed_attempts >= 5) {
          toast.error('Account has been locked for 10 minutes due to too many failed attempts.', {
            duration: 5000
          });
        } else {
          const remainingAttempts = 5 - (updatedUserData?.failed_attempts || 0);
          toast.error(`Zero-Knowledge Proof failed. ${remainingAttempts} attempts remaining before account lock.`, {
            duration: 4000
          });
        }
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'An unexpected error occurred during login');
      if (!err.message || err.message === 'An unexpected error occurred during login') {
        toast.error('An unexpected error occurred during login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
  setLoading(true);
  setError('');

  try {
    // This uses query to fetch user biometric ID
    const biometricId = await fetchWebAuthnID(formData.email)

    if (!biometricId || !biometricId.webauthn_id) {
      throw new Error('Biometric ID not found.');
    }

    const publicKey: PublicKeyCredentialRequestOptions = {
      challenge: new Uint8Array(32),
      allowCredentials: [{
        id: Uint8Array.from(atob(biometricId.webauthn_id), c => c.charCodeAt(0)),
        type: 'public-key'
      }],
      timeout: 60000,
    };

    // Then using navigator prompts biometric login
    const assertion = await navigator.credentials.get({ publicKey });

    if (!assertion) throw new Error('Biometric authentication failed.');

    // on biometric success it then generates token and login
    const token = await generateToken(biometricId.id);
    localStorage.setItem('sessionToken', token);

    alert('Biometric authentication successful ✅');
    router.push('/dashboard');

  } catch (err: any) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div>
          <h2 className="text-3xl font-bold text-center">Login</h2>
          <p className="mt-2 text-center text-gray-600">Access your zero-knowledge password vault</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                disabled={loading}
              />
            </div>
          </div>

          <div className='flex justify-between gap-4'>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? <LoadingSpinner /> : 'Login with ZK Proof'}
            </button>
            <button
  onClick={handleBiometricLogin}
  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700"
  disabled={loading}
>
  {loading ? <LoadingSpinner /> : 'Login with Biometrics'}
</button>

          </div>
        </form>

        <div className="text-center mt-4 space-y-2">
          <div>
            <a href="/register" className="text-sm text-blue-600 hover:text-blue-500">
              Don't have an account? Register
            </a>
          </div>
          <div>
            <a href="/recover" className="text-sm text-blue-600 hover:text-blue-500">
              Forgot your password? Recover Account
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
