'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Recovery() {
  const [formData, setFormData] = useState({
    username: '',
    shares: ['', '', '']
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch('/api/auth/recover', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          shares: formData.shares.filter(share => share.trim() !== ''),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Recovery failed');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 2000);
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
          <h2 className="text-3xl font-bold text-center">Account Recovery</h2>
          <p className="mt-2 text-center text-gray-600">Enter your recovery shares to regain access</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">Account recovered successfully! Redirecting to login...</span>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Recovery Shares
              </label>
              {formData.shares.map((share, index) => (
                <input
                  key={index}
                  type="text"
                  required
                  placeholder={`Share ${index + 1}`}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={share}
                  onChange={(e) => {
                    const newShares = [...formData.shares];
                    newShares[index] = e.target.value;
                    setFormData({...formData, shares: newShares});
                  }}
                  disabled={loading}
                />
              ))}
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? <LoadingSpinner /> : 'Recover Account'}
            </button>
          </div>
        </form>

        <div className="text-center mt-4">
          <a href="/login" className="text-sm text-blue-600 hover:text-blue-500">
            Remember your password? Login
          </a>
        </div>
      </div>
    </div>
  );
} 