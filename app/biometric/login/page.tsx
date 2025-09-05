"use client";

import { useState } from "react";
import { useRouter } from "next-nprogress-bar";
import LoadingSpinner from "../../components/LoadingSpinner";
import { toast } from "sonner";
import { generateToken } from "@/app/lib/jwt";
import { UnifiedBiometricData } from "../../lib/biometric";
import BiometricModal from "../../components/BiometricModal";
import { generateChallenge } from "../../lib/zkp";

export default function BiometricLogin() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [biometricData, setBiometricData] =
    useState<UnifiedBiometricData | null>(null);
  const [zkpChallenge, setZkpChallenge] = useState("");
  const [showBiometricModal, setShowBiometricModal] = useState(false);
  const router = useRouter();

  const handleBiometricRead = (data: UnifiedBiometricData) => {
    setBiometricData(data);
    setError("");
    setShowBiometricModal(false);

    const methodName = data.type === "fingerprint" ? "Fingerprint" : "Face";
    toast.success(`${methodName} captured! Now click Login to authenticate.`);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    toast.error(errorMessage);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!biometricData) {
      setError("Please capture your biometric data first");
      toast.error("Please capture your biometric data first");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // calls api to verify the biometric data and then the ZKP challenge will be retrieved from stored data
      const response = await fetch("/api/auth/biometric", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          biometricData: biometricData,
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

      const methodName =
        biometricData.type === "fingerprint" ? "Fingerprint" : "Face";
      toast.success(
        `ZKP-secured ${methodName.toLowerCase()} authentication successful!`
      );
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
          <h2 className="text-3xl font-bold text-center">Biometric Login</h2>
          <p className="mt-2 text-center text-gray-600">
            Login with your biometric authentication
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
          <button
            onClick={() => setShowBiometricModal(true)}
            className="w-full py-3 px-4 border border-transparent rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {biometricData
              ? "Recapture Biometric Data"
              : "Authenticate with Biometric"}
          </button>
        </div>

        {biometricData && (
          <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded">
            <p className="text-sm">
              ✓ {biometricData.type === "fingerprint" ? "Fingerprint" : "Face"}{" "}
              data captured
            </p>
            <p className="text-xs text-green-500 mt-1">
              Quality: {biometricData.quality}% | Device:{" "}
              {biometricData.deviceInfo}
            </p>
          </div>
        )}

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
              disabled={loading || !biometricData}
            >
              {loading ? <LoadingSpinner /> : "Login with Biometric"}
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

        <div className="text-center">
          <p className="text-sm text-gray-500">
            Choose between fingerprint or face recognition
          </p>
        </div>
      </div>

      {showBiometricModal && (
        <BiometricModal
          mode="login"
          onBiometricRead={handleBiometricRead}
          onError={handleError}
          onClose={() => setShowBiometricModal(false)}
        />
      )}
    </div>
  );
}
