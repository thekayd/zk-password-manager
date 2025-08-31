"use client";

import { useState } from "react";
import { useRouter } from "next-nprogress-bar";
import LoadingSpinner from "../../components/LoadingSpinner";
import { toast } from "sonner";
import { generateToken } from "@/app/lib/jwt";
import { FingerprintData } from "../../lib/fingerprint";
import FingerprintReaderModel from "../../components/FingerprintReaderModel";
import { generateChallenge } from "../../lib/zkp";

export default function BiometricLogin() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fingerprintData, setFingerprintData] =
    useState<FingerprintData | null>(null);
  const [zkpChallenge, setZkpChallenge] = useState("");
  const router = useRouter();

  const handleFingerprintRead = (data: FingerprintData) => {
    setFingerprintData(data);
    setError("");
    toast.success("Fingerprint captured! Now click Login to authenticate.");
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    toast.error(errorMessage);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fingerprintData) {
      setError("Please capture your fingerprint first");
      toast.error("Please capture your fingerprint first");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // this generates a ZKP challenge for this session
      const challenge = generateChallenge();
      setZkpChallenge(challenge);

      // this uses a put request to verify the fingerprint using our custom API
      const response = await fetch("/api/auth/fingerprint-auth", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          fingerprintData: {
            ...fingerprintData,
            zkpChallenge: challenge,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Fingerprint verification failed");
      }

      const result = await response.json();

      // this then generates a token and logs the user in
      const token = await generateToken(result.userId);
      localStorage.setItem("sessionToken", token);

      toast.success("ZKP-secured fingerprint authentication successful!");
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Biometric login error:", err);
      toast.error(err.message || "Biometric authentication failed", {
        duration: 3000,
      });
      setError(err.message);

      // this then redirects to password login with email and fallback status
      if (
        err.message !==
        "No biometric credentials found for this email. Please use password login."
      ) {
        router.push(
          `/login?email=${encodeURIComponent(email)}&fallback=biometric`
        );
      } else {
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div>
          <h2 className="text-3xl font-bold text-center">Fingerprint Login</h2>
          <p className="mt-2 text-center text-gray-600">
            Login with your fingerprint
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

        <div className="mt-6">
          <FingerprintReaderModel
            mode="read"
            onFingerprintRead={handleFingerprintRead}
            onError={handleError}
          />
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email
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
              placeholder="Enter your email"
            />
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || !fingerprintData}
            >
              {loading ? <LoadingSpinner /> : "Login with Fingerprint"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Use Password
            </button>
          </div>
        </form>

        <div className="text-center mt-4">
          <a
            href="/register"
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            Don't have an account? Register
          </a>
        </div>
      </div>
    </div>
  );
}
