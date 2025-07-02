'use client';

import { useState } from 'react';
import { useRouter } from 'next-nprogress-bar';
import LoadingSpinner from '../../components/LoadingSpinner';
import { toast } from 'sonner';
import { fetchWebAuthnID } from '@/app/supabase/queries';
import { generateToken } from '@/app/lib/jwt';

export default function BiometricLogin() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // This allows for the system to check if biometrics are available
      if (!window.PublicKeyCredential) {
        throw new Error('Biometric authentication is not supported on this device');
      }

      const isAvailable = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      if (!isAvailable) {
        throw new Error('Biometric authentication is not available on this device');
      }

      // it then fetches user's biometric ID
      const biometricId = await fetchWebAuthnID(email);

      if (!biometricId || !biometricId.webauthn_id) {
        throw new Error('No biometric credentials found for this email. Please use password login.');
      }

      const publicKey: PublicKeyCredentialRequestOptions = {
        challenge: new Uint8Array(32),
        allowCredentials: [{
          id: Uint8Array.from(atob(biometricId.webauthn_id), c => c.charCodeAt(0)),
          type: 'public-key'
        }],
        timeout: 60000,
      };

      // This then prompts biometric authentication
      const assertion = await navigator.credentials.get({ publicKey });

      if (!assertion) {
        // This allows for redirection to password login with email and fallback status
        router.push(`/login?email=${encodeURIComponent(email)}&fallback=biometric`);
        return;
      }

      // then generates the token and login
      const token = await generateToken(biometricId.id);
      localStorage.setItem('sessionToken', token);

      toast.success('Biometric authentication successful! ✅');
      router.push('/dashboard');

    } catch (err: any) {
      console.error('Biometric login error:', err);
      toast.error(err.message || 'Biometric authentication failed', {
        duration: 3000
      });
      setError(err.message);
      
      // this then redirects to password login with email and fallback status
      if (err.message !== 'No biometric credentials found for this email. Please use password login.') {
        router.push(`/login?email=${encodeURIComponent(email)}&fallback=biometric`);
      } else {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div>
          <h2 className="text-3xl font-bold text-center">Biometric Login</h2>
          <p className="mt-2 text-center text-gray-600">Login with your biometric credentials</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              placeholder="Enter your email"
            />
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? <LoadingSpinner /> : 'Login with Biometrics'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Use Password
            </button>
          </div>
        </form>

        <div className="text-center mt-4">
          <a href="/register" className="text-sm text-blue-600 hover:text-blue-500">
            Don't have an account? Register
          </a>
        </div>
      </div>
    </div>
  );
}
