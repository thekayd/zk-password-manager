'use client';

import { useState } from 'react';
import { useRouter } from 'next-nprogress-bar';
import { supabase } from '@/app/lib/supabaseClient';
import { deriveKey } from '@/app/lib/crypto';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'sonner';
import { updateUserPasswordHash, createUserRecord } from '../supabase/mutations';

export default function Register() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      // Supabase SignUp
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw new Error(authError.message);
      if (!authData.user) throw new Error('No user data returned from signup');

      // we then derive the password hash using ZK method
      const key = await deriveKey(formData.password);
      const rawKey = await crypto.subtle.exportKey('raw', key);
      const passwordHash = btoa(String.fromCharCode(...new Uint8Array(rawKey)));

      // This then uses mutations and creates user record in users table
      const userCreated = await createUserRecord(formData.email, passwordHash, authData.user.id);
      if (!userCreated) {
        throw new Error('Failed to create user record');
      }

      // Then we update password hash in users table
      //await updateUserPasswordHash(formData.email, passwordHash);

      toast.success('Registered successfully ✅');
      router.push('/login');
    } catch (err: any) {
      setError(err.message);
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricRegistration = async () => {
    try {
      router.push('/biometric/register');
    } catch (err: any) {
      console.error('Biometric registration error:', err);
      toast.error('Failed to start biometric registration');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div>
          <h2 className="text-3xl font-bold text-center">Register</h2>
          <p className="mt-2 text-center text-gray-600">Create your zero-knowledge password vault</p>
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

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirm Password</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-4">
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? <LoadingSpinner /> : 'Register with ZK Proof'}
            </button>

            <button
              type="button"
              onClick={handleBiometricRegistration}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700"
              disabled={loading}
            >
              Register with Biometrics
            </button>
          </div>
        </form>

        <div className="text-center mt-4">
          <a href="/login" className="text-sm text-blue-600 hover:text-blue-500">
            Already have an account? Login
          </a>
        </div>
      </div>
    </div>
  );
}
