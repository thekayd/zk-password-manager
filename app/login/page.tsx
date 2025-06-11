'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '../components/LoadingSpinner';

interface ZKProof {
  type: string;
  proof: string;
  timestamp: string;
  details: {
    circuit: string;
    publicInputs: string[];
    witness: {
      username: string;
      passwordHash: string;
    };
    verification: {
      status: string;
      timestamp: string;
      proofId: string;
    };
  };
}

export default function Login() {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showProof, setShowProof] = useState(false);
  const [proofDetails, setProofDetails] = useState<{
    original: ZKProof;
    verification: any;
  } | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setShowProof(false);
    setProofDetails(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // this is to store the session token
      localStorage.setItem('sessionToken', data.sessionToken);
      
      // this is to show the proof details of zk proof
      setProofDetails({
        original: data.originalProof,
        verification: data.verificationResult,
      });
      setShowProof(true);

      setTimeout(() => {
        router.push('/dashboard');
      }, 9000);
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

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
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

      {showProof && proofDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-4">ZK Proof Verification</h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-2">Original Proof (Registration)</h4>
                  <pre className="bg-gray-50 p-4 rounded-md overflow-x-auto">
                    {JSON.stringify(proofDetails.original, null, 2)}
                  </pre>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Verification Result</h4>
                  <pre className="bg-gray-50 p-4 rounded-md overflow-x-auto">
                    {JSON.stringify(proofDetails.verification, null, 2)}
                  </pre>
                </div>

                <div className="text-center text-green-600 font-semibold">
                  ✓ ZK Proof verified successfully
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
