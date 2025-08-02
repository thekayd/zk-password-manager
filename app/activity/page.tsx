"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import LoadingSpinner from "../components/LoadingSpinner";

interface ActivityLog {
  _id: string;
  user_id: string;
  activity: string;
  timestamp: string;
}

export default function ActivityLogs() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchActivityLogs = async () => {
      try {
        const token = localStorage.getItem("sessionToken");
        if (!token) {
          setError("No authentication token found");
          setLoading(false);
          return;
        }

        const response = await fetch("/api/activity/logs", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch activity logs");
        }

        const data = await response.json();
        setLogs(data.logs || []);
      } catch (err: any) {
        setError(err.message || "Failed to load activity logs");
      } finally {
        setLoading(false);
      }
    };

    fetchActivityLogs();
  }, []);

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getStatusFromActivity = (activity: string) => {
    if (activity.includes("Failed login attempt")) {
      return "failed";
    }
    return "success";
  };

  const getActionFromActivity = (activity: string) => {
    if (activity.includes("Added password entry")) {
      return "Password Created";
    } else if (activity.includes("Updated password")) {
      return "Password Updated";
    } else if (activity.includes("User logged in successfully")) {
      return "Login";
    } else if (activity.includes("User logged in with biometrics")) {
      return "Biometric Login";
    } else if (activity.includes("User registered successfully")) {
      return "Registration";
    } else if (activity.includes("User logged out")) {
      return "Logout";
    } else if (activity.includes("Failed login attempt")) {
      return "Failed Login";
    } else if (activity.includes("deleted")) {
      return "Password Deleted";
    }
    return activity;
  };

  const getWebsiteFromActivity = (activity: string) => {
    // gets the website from activity string
    const websiteMatch = activity.match(/for (.*?)$/);
    if (websiteMatch) {
      return websiteMatch[1];
    }
    return "ZK Password Manager";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner />
          </div>
        </div>
      </div>
    );
  }

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

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded relative">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {logs.length === 0 && !error ? (
          <div className="bg-white shadow rounded-lg p-8 text-center">
            <p className="text-gray-500 text-lg">No activity logs found.</p>
            <p className="text-gray-400 text-sm mt-2">
              Your activity will appear here once you start using the
              application.
            </p>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Website
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logs.map((log) => (
                    <tr key={log._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getActionFromActivity(log.activity)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getWebsiteFromActivity(log.activity)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatTimestamp(log.timestamp)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            getStatusFromActivity(log.activity) === "success"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {getStatusFromActivity(log.activity)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
