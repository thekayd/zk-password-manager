"use client";

import { useState, useEffect } from "react";
import LoadingSpinner from "../../components/LoadingSpinner";
import { useRouter } from "next-nprogress-bar";
import { toast } from "sonner";
import Link from "next/link";
import {
  UnifiedBiometricData,
  UnifiedBiometricSystem,
} from "../../lib/biometric";
import BiometricModal from "../../components/BiometricModal";
import { generateChallenge } from "../../lib/zkp";

export default function FaceRegister() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [biometricData, setBiometricData] =
    useState<UnifiedBiometricData | null>(null);
  const [zkpChallenge, setZkpChallenge] = useState("");
  const [showBiometricModal, setShowBiometricModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // gets the email from sessionStorage
    const registrationEmail = sessionStorage.getItem("registrationEmail");
    if (!registrationEmail) {
      toast.error("Please complete registration first");
      router.push("/register");
      return;
    }
    setEmail(registrationEmail);
  }, []);

  const handleSkip = () => {
    toast.info("Skipping biometric setup");
    sessionStorage.removeItem("registrationEmail");
    router.push("/dashboard");
  };

  const handleBiometricRead = (data: UnifiedBiometricData) => {
    setBiometricData(data);
    setError("");
    setShowBiometricModal(false);

    const methodName = data.type === "fingerprint" ? "Fingerprint" : "Face";
    toast.success(
      `${methodName} captured successfully! Now click Register to save it.`
    );
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    toast.error(errorMessage);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!biometricData) {
      setError("Please capture your biometric data first");
      toast.error("Please capture your biometric data first");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      // generates a ZKP challenge for registration
      const challenge = generateChallenge();
      setZkpChallenge(challenge);

      // generates a ZKP proof for the captured face data
      if (biometricData.faceData) {
        const biometricSystem = new UnifiedBiometricSystem();
        await biometricSystem.initialize();

        const zkpProof = await biometricSystem.generateZkpProof(
          biometricData,
          challenge
        );

        // updates the biometric data with the ZKP proof
        biometricData.zkpProof = zkpProof;
        biometricData.zkpChallenge = challenge;
      }

      // saves the biometric data to the database using a api call post
      const response = await fetch("/api/auth/biometric", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          biometricData: biometricData,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save biometric template");
      }

      const methodName =
        biometricData.type === "fingerprint" ? "Fingerprint" : "Face";
      toast.success(
        `ZKP-secured ${methodName.toLowerCase()} registration successful!`,
        {
          duration: 2000,
        }
      );

      setSuccess(true);
      sessionStorage.removeItem("registrationEmail");

      setTimeout(() => {
        router.push("/dashboard");
      }, 2500);
    } catch (err: any) {
      console.error("Biometric registration error:", err);
      toast.error(err.message || "Failed to register biometric data", {
        duration: 3000,
      });
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openBiometricModal = () => {
    setShowBiometricModal(true);
    setError("");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div>
          <h2 className="text-3xl font-bold text-center">Biometric Setup</h2>
          <p className="mt-2 text-center text-gray-600">
            Set up biometric authentication for faster login (Optional)
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
        {success && (
          <div
            className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded relative"
            role="alert"
          >
            <span className="block sm:inline">
              Biometric registration successful!
            </span>
          </div>
        )}

        <div className="mt-6">
          <button
            onClick={openBiometricModal}
            className="w-full py-3 px-4 border border-transparent rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {biometricData
              ? "Recapture Biometric Data"
              : "Setup Biometric Authentication"}
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

        <form className="mt-8 space-y-6" onSubmit={handleRegister}>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
              value={email}
              disabled
            />
            <p className="mt-2 text-sm text-gray-500">
              Email from your registration
            </p>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || !biometricData}
            >
              {loading ? <LoadingSpinner /> : "Register Biometric"}
            </button>
            <button
              type="button"
              onClick={handleSkip}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
              disabled={loading}
            >
              Skip
            </button>
          </div>
        </form>

        <div className="text-center mt-4">
          <p className="text-sm text-gray-500">
            Choose between fingerprint or face recognition
          </p>
        </div>
      </div>

      {showBiometricModal && (
        <BiometricModal
          mode="register"
          onBiometricRead={handleBiometricRead}
          onError={handleError}
          onClose={() => setShowBiometricModal(false)}
        />
      )}
    </div>
  );
}
