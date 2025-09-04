"use client";

import { useState } from "react";
import { UnifiedBiometricSystem } from "../lib/biometric";
import BiometricModal from "../components/BiometricModal";
import { UnifiedBiometricData } from "../lib/biometric";

export default function TestFaceRecognition() {
  const [availableMethods, setAvailableMethods] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [biometricData, setBiometricData] =
    useState<UnifiedBiometricData | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");

  const checkAvailableMethods = async () => {
    setIsLoading(true);
    setError("");

    try {
      const biometricSystem = new UnifiedBiometricSystem();
      await biometricSystem.initialize();

      const methods = await biometricSystem.getAvailableMethods();
      setAvailableMethods(methods);

      console.log("Available biometric methods:", methods);
    } catch (err: any) {
      setError(err.message || "Failed to check available methods");
      console.error("Error checking methods:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricRead = (data: UnifiedBiometricData) => {
    setBiometricData(data);
    setShowModal(false);
    console.log("Biometric data captured:", data);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    console.error("Biometric error:", errorMessage);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-2xl space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div>
          <h1 className="text-3xl font-bold text-center">
            Face Recognition Test
          </h1>
          <p className="mt-2 text-center text-gray-600">
            Test the unified biometric system with both fingerprint and face
            recognition
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={checkAvailableMethods}
            disabled={isLoading}
            className="w-full py-3 px-4 border border-transparent rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? "Checking..." : "Check Available Methods"}
          </button>

          {availableMethods.length > 0 && (
            <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded">
              <p className="font-medium">Available Methods:</p>
              <ul className="mt-2 space-y-1">
                {availableMethods.map((method) => (
                  <li key={method} className="text-sm">
                    •{" "}
                    {method === "fingerprint"
                      ? "Fingerprint"
                      : "Face Recognition"}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {availableMethods.length > 0 && (
            <button
              onClick={() => setShowModal(true)}
              className="w-full py-3 px-4 border border-transparent rounded-md text-white bg-green-600 hover:bg-green-700"
            >
              Test Biometric Capture
            </button>
          )}

          {biometricData && (
            <div className="bg-blue-50 border border-blue-200 text-blue-600 px-4 py-3 rounded">
              <p className="font-medium">Biometric Data Captured:</p>
              <div className="mt-2 text-sm space-y-1">
                <p>Type: {biometricData.type}</p>
                <p>ID: {biometricData.id}</p>
                <p>Quality: {biometricData.quality}%</p>
                <p>Device: {biometricData.deviceInfo}</p>
                <p>
                  Timestamp:{" "}
                  {new Date(biometricData.timestamp).toLocaleString()}
                </p>
                {biometricData.zkpChallenge && (
                  <p>
                    ZKP Challenge: {biometricData.zkpChallenge.substring(0, 16)}
                    ...
                  </p>
                )}
                {biometricData.zkpProof && (
                  <p>ZKP Proof: {biometricData.zkpProof.substring(0, 16)}...</p>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              <p className="font-medium">Error:</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          )}
        </div>

        <div className="text-center">
          <a
            href="/dashboard"
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            ← Back to Dashboard
          </a>
        </div>
      </div>

      {showModal && (
        <BiometricModal
          mode="register"
          onBiometricRead={handleBiometricRead}
          onError={handleError}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
