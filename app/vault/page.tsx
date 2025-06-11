'use client';

import Link from 'next/link';
import { useState } from 'react';

// this is the dummy vault data
const dummyVault = [
  {
    id: 1,
    website: 'github.com',
    username: 'johndoe',
    password: '••••••••',
    createdAt: '2024-03-20'
  },
  {
    id: 2,
    website: 'twitter.com',
    username: '@johndoe',
    password: '••••••••',
    createdAt: '2024-03-19'
  },
  {
    id: 3,
    website: 'linkedin.com',
    username: 'john.doe@email.com',
    password: '••••••••',
    createdAt: '2024-03-18'
  },
  {
    id: 4,
    website: 'facebook.com',
    username: 'johndoe123',
    password: '••••••••',
    createdAt: '2024-03-17'
  }
];

export default function Vault() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [newPassword, setNewPassword] = useState({
    website: '',
    username: '',
    password: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    setIsDrawerOpen(false);
    setNewPassword({ website: '', username: '', password: '' });
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Password Vault</h1>
          <Link 
            href="/dashboard"
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="p-6">
            <div className="flex justify-end mb-4">
              <button 
                onClick={() => setIsDrawerOpen(true)}
                className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors"
              >
                Add New Password
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Website</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Password</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dummyVault.map((entry) => (
                    <tr key={entry.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.website}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.username}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.password}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.createdAt}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <button className="text-blue-600 hover:text-blue-800 mr-3">View</button>
                        <button className="text-green-600 hover:text-green-800 mr-3">Edit</button>
                        <button className="text-red-600 hover:text-red-800">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Drawer Modal */}
      {isDrawerOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
          <div className="fixed inset-y-0 right-0 max-w-md w-full bg-white shadow-xl">
            <div className="h-full flex flex-col">
              <div className="px-6 py-4 border-b">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Add New Password</h2>
                  <button 
                    onClick={() => setIsDrawerOpen(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="website" className="block text-sm font-medium text-gray-700">
                      Website
                    </label>
                    <input
                      type="text"
                      id="website"
                      required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      value={newPassword.website}
                      onChange={(e) => setNewPassword({...newPassword, website: e.target.value})}
                    />
                  </div>

                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                      Username
                    </label>
                    <input
                      type="text"
                      id="username"
                      required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      value={newPassword.username}
                      onChange={(e) => setNewPassword({...newPassword, username: e.target.value})}
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                      Password
                    </label>
                    <input
                      type="password"
                      id="password"
                      required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      value={newPassword.password}
                      onChange={(e) => setNewPassword({...newPassword, password: e.target.value})}
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    type="submit"
                    className="w-full bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
                  >
                    Save Password
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 