"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import LoadingSpinner from "../components/LoadingSpinner";
import ShareInput from "../components/ShareInput";

export default function Recovery() {
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"email" | "recovery" | "success">("email");
  const [recoveredPassword, setRecoveredPassword] = useState("");
  const router = useRouter();

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const userResponse = await fetch("/api/auth/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!userResponse.ok) {
        throw new Error("User not found");
      }

      const { user: userData } = await userResponse.json();
      if (!userData) {
        throw new Error("User not found");
      }

      setUserId(userData.id);
      setStep("recovery");
    } catch (err: any) {
      setError(err.message || "Failed to find user");
    } finally {
      setLoading(false);
    }
  };

  const handleRecoverySuccess = async (recoveredSecret: string) => {
    setRecoveredPassword(recoveredSecret);
    setStep("success");

    // Automatically log the user in with the recovered password
    try {
      const loginResponse = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password: recoveredSecret,
        }),
      });

      if (loginResponse.ok) {
        // Login successful, user can go to dashboard when ready
        console.log("Auto-login successful");
      }
    } catch (err) {
      console.error("Auto-login failed:", err);
      // Even if auto-login fails, user can still see their password and login manually
    }
  };

  if (step === "success") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
        <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-lg shadow-md">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                ></path>
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-center text-green-600">
              Recovery Successful!
            </h2>
            <p className="mt-2 text-center text-gray-600">
              Your password has been recovered successfully.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">
              Your Recovered Password:
            </h3>
            <div className="bg-white border border-blue-300 rounded p-3">
              <code className="text-lg font-mono text-blue-900 break-all">
                {recoveredPassword}
              </code>
            </div>
            <p className="text-sm text-blue-700 mt-2">
              Please save this password securely. You are now logged in and can
              access your dashboard.
            </p>
          </div>

          <div className="text-center">
            <button
              onClick={() => router.push("/dashboard")}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Go to Dashboard Now
            </button>
          </div>

          <div className="text-center">
            <button
              onClick={() => router.push("/login")}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === "recovery" && userId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
        <ShareInput userId={userId} onRecoverySuccess={handleRecoverySuccess} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div>
          <h2 className="text-3xl font-bold text-center">Account Recovery</h2>
          <p className="mt-2 text-center text-gray-600">
            Enter your email to begin the recovery process
          </p>
        </div>

        {error && (
          <div
            className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded relative"
            role="alert"
          >
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleEmailSubmit}>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? <LoadingSpinner /> : "Continue to Recovery"}
          </button>
        </form>

        <div className="text-center">
          <button
            onClick={() => router.push("/login")}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}
