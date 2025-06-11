'use client';

import { useState } from 'react';
import Link from 'next/link';

// this is dummy activity data
const dummyActivities = [
  {
    id: 1,
    action: 'Password Viewed',
    website: 'github.com',
    timestamp: '2024-03-20 14:30:00',
    status: 'success'
  },
  {
    id: 2,
    action: 'Password Updated',
    website: 'twitter.com',
    timestamp: '2024-03-20 13:15:00',
    status: 'success'
  },
  {
    id: 3,
    action: 'Failed Login Attempt',
    website: 'facebook.com',
    timestamp: '2024-03-20 12:45:00',
    status: 'failed'
  },
  {
    id: 4,
    action: 'Password Viewed',
    website: 'linkedin.com',
    timestamp: '2024-03-20 11:20:00',
    status: 'success'
  },
  {
    id: 5,
    action: 'Password Created',
    website: 'instagram.com',
    timestamp: '2024-03-20 10:00:00',
    status: 'success'
  }
];

export default function ActivityLogs() {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Activity Logs</h1>
          <Link 
            href="/dashboard"
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
        
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Website</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dummyActivities.map((activity) => (
                  <tr key={activity.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{activity.action}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{activity.website}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{activity.timestamp}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        activity.status === 'success' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {activity.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 