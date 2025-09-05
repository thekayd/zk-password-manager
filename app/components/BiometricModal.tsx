"use client";

import { useState, useEffect, useRef } from "react";
import {
  BiometricType,
  UnifiedBiometricSystem,
  UnifiedBiometricData,
} from "../lib/biometric";
import FingerprintReaderModel from "./FingerprintReaderModel";
import FaceRecognitionModal from "./FaceRecognitionModal";
import { FaceData } from "../lib/faceRecognition";
import { FingerprintData } from "../lib/fingerprint";

interface BiometricModalProps {
  mode: "register" | "login";
  onBiometricRead?: (data: UnifiedBiometricData) => void;
  onError?: (error: string) => void;
  onClose?: () => void;
  preferredMethod?: BiometricType;
}

export default function BiometricModal({
  mode,
  onBiometricRead,
  onError,
  onClose,
  preferredMethod,
}: BiometricModalProps) {
  const [availableMethods, setAvailableMethods] = useState<BiometricType[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<BiometricType | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const biometricSystemRef = useRef<UnifiedBiometricSystem | null>(null);

  useEffect(() => {
    initializeBiometricSystem();
  }, []);

  const initializeBiometricSystem = async () => {
    try {
      setIsLoading(true);
      setError("");

      const biometricSystem = new UnifiedBiometricSystem();
      biometricSystemRef.current = biometricSystem;

      // Initializes the system for fingerprint or face recognition
      await biometricSystem.initialize();

      // gets the available methods
      const methods = await biometricSystem.getAvailableMethods();
      setAvailableMethods(methods);

      // sets the preferred method or default to the first available method
      if (preferredMethod && methods.includes(preferredMethod)) {
        setSelectedMethod(preferredMethod);
      } else if (methods.length > 0) {
        setSelectedMethod(methods[0]);
      } else {
        setError("No biometric methods available on this device");
        onError?.("No biometric methods available on this device");
      }
    } catch (err: any) {
      const errorMessage =
        err.message || "Failed to initialize biometric system";
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFingerprintRead = (data: FingerprintData) => {
    if (!biometricSystemRef.current) return;

    const unifiedData: UnifiedBiometricData = {
      type: "fingerprint",
      id: data.id,
      biometricData: data.biometricData,
      quality: data.quality,
      timestamp: data.timestamp,
      deviceInfo: data.deviceInfo,
      zkpChallenge: data.zkpChallenge,
      zkpProof: data.zkpProof,
      fingerprintData: data,
    };

    onBiometricRead?.(unifiedData);
  };

  const handleFaceRead = (data: FaceData) => {
    if (!biometricSystemRef.current) return;

    const unifiedData: UnifiedBiometricData = {
      type: "face",
      id: data.id,
      biometricData: data.biometricData,
      quality: data.quality,
      timestamp: data.timestamp,
      deviceInfo: data.deviceInfo,
      zkpChallenge: data.zkpChallenge,
      zkpProof: data.zkpProof,
      faceData: data,
    };

    onBiometricRead?.(unifiedData);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    onError?.(errorMessage);
  };

  const handleMethodChange = (method: BiometricType) => {
    setSelectedMethod(method);
    setError("");
  };

  const handleClose = () => {
    onClose?.();
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Initializing biometric system...</p>
          </div>
        </div>
      </div>
    );
  }

  if (availableMethods.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-4">
              Biometric Authentication
            </h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={handleClose}
              className="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            {mode === "register" ? "Biometric Registration" : "Biometric Login"}
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {/* Method Selection */}
          {availableMethods.length > 1 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Choose Authentication Method:
              </label>
              <div className="flex gap-2">
                {availableMethods.map((method) => (
                  <button
                    key={method}
                    onClick={() => handleMethodChange(method)}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium ${
                      selectedMethod === method
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    {method === "fingerprint"
                      ? "Fingerprint"
                      : "Face Recognition"}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Biometric Components */}
          {selectedMethod === "fingerprint" && (
            <FingerprintReaderModel
              mode="read"
              onFingerprintRead={handleFingerprintRead}
              onError={handleError}
            />
          )}

          {selectedMethod === "face" && (
            <FaceRecognitionModal
              mode={mode}
              onFaceRead={handleFaceRead}
              onError={handleError}
              onClose={handleClose}
            />
          )}

          {/* Instructions */}
          <div className="text-xs text-gray-500 space-y-1">
            {selectedMethod === "fingerprint" && (
              <>
                <p>• Place your finger on the sensor</p>
                <p>• Keep your finger still during scanning</p>
                <p>• Ensure your finger is clean and dry</p>
              </>
            )}
            {selectedMethod === "face" && (
              <>
                <p>• Ensure good lighting</p>
                <p>• Look directly at the camera</p>
                <p>• Keep your face centered in the frame</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
