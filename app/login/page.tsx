'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabaseClient';
import { deriveKey } from '@/app/lib/crypto';
import LoadingSpinner from '../components/LoadingSpinner';
import { fetchUserPasswordHash } from '../supabase/queries';

export default function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Supabase Login
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw new Error(authError.message);

      // Fetch password hash for ZKP verification
      const userData = await fetchUserPasswordHash(formData.email);

      if (!userData) throw new Error('User data not found.');

      // Derive client-side hash
      const key = await deriveKey(formData.password);
      const rawKey = await crypto.subtle.exportKey('raw', key);
      const clientPasswordHash = btoa(String.fromCharCode(...new Uint8Array(rawKey)));

      if (clientPasswordHash === userData.password_hash) {
        alert('ZK Proof verified successfully ✅');
        router.push('/dashboard');
      } else {
        throw new Error('Zero-Knowledge Proof failed ❌');
      }
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

          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? <LoadingSpinner /> : 'Login with ZK Proof'}
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
