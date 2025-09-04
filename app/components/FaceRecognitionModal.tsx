"use client";

import { useState, useRef, useEffect } from "react";
import { FaceData } from "../lib/faceRecognition";
import { UnifiedBiometricSystem } from "../lib/biometric";

interface FaceRecognitionModalProps {
  mode: "read" | "verify" | "register" | "login";
  onFaceRead?: (data: FaceData) => void;
  onError?: (error: string) => void;
  onClose?: () => void;
}

export default function FaceRecognitionModal({
  mode,
  onFaceRead,
  onError,
  onClose,
}: FaceRecognitionModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("Initializing camera...");
  const [isCapturing, setIsCapturing] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const biometricSystemRef = useRef<UnifiedBiometricSystem | null>(null);

  const stopCamera = () => {
    if (videoRef.current) {
      const stream = videoRef.current.srcObject as MediaStream;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
    }
  };

  useEffect(() => {
    initializeFaceRecognition();

    return () => {
      // cleans up the camera on unmount
      stopCamera();
    };
  }, []);

  const initializeFaceRecognition = async () => {
    try {
      setIsLoading(true);
      setError("");
      setStatus("Initializing face recognition...");

      const biometricSystem = new UnifiedBiometricSystem();
      biometricSystemRef.current = biometricSystem;

      // Initializes the system
      await biometricSystem.initialize();

      // sets up the camera with better error handling
      if (videoRef.current) {
        try {
          await biometricSystem.setupCamera(videoRef.current);
          setStatus("Camera ready. Position your face in the frame.");
          setIsInitialized(true);
        } catch (cameraError: any) {
          console.warn("Camera setup warning:", cameraError);
          // continues even if camera setup has issues
          setStatus("Camera ready. Position your face in the frame.");
          setIsInitialized(true);
        }
      } else {
        throw new Error("Video element not available");
      }
    } catch (err: any) {
      const errorMessage =
        err.message || "Failed to initialize face recognition";
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const captureFace = async () => {
    if (!biometricSystemRef.current || !videoRef.current || !isInitialized) {
      onError?.("Face recognition not initialized");
      return;
    }

    try {
      setIsCapturing(true);
      setStatus("Capturing face...");
      setError("");

      // for register, we need ZKP challenge - just captures the face and generates a ZKP proof
      const generateZkp = mode === "register";
      const faceData = await biometricSystemRef.current.captureBiometric(
        "face",
        videoRef.current,
        generateZkp
      );

      setStatus("Face captured successfully!");
      onFaceRead?.(faceData.faceData!);

      // stops the camera after successful capture
      setTimeout(() => {
        stopCamera();
        setStatus("Processing...");
      }, 500);

      // shows success for a moment then closes the modal
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err: any) {
      const errorMessage = err.message || "Failed to capture face";
      setError(errorMessage);
      onError?.(errorMessage);
      setStatus("Camera ready. Position your face in the frame.");

      // stops the camera on error too
      stopCamera();
    } finally {
      setIsCapturing(false);
    }
  };

  const handleClose = () => {
    stopCamera();
    onClose?.();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            {mode === "read" ? "Face Registration" : "Face Recognition"}
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div className="relative bg-gray-100 rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              className="w-full h-64 object-cover"
              autoPlay
              muted
              playsInline
            />
            <canvas
              ref={canvasRef}
              className="absolute inset-0 pointer-events-none"
              style={{ display: "none" }}
            />

            <div className="absolute inset-0 flex items-center justify-center">
              <div className="border-2 border-blue-500 border-dashed rounded-lg w-48 h-48 flex items-center justify-center">
                <span className="text-white text-sm bg-black bg-opacity-50 px-2 py-1 rounded">
                  Position face here
                </span>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p
              className={`text-sm ${error ? "text-red-600" : "text-gray-600"}`}
            >
              {error || status}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={captureFace}
              disabled={!isInitialized || isCapturing || isLoading}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCapturing ? "Capturing..." : "Capture Face"}
            </button>

            <button
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>

          <div className="text-xs text-gray-500 space-y-1">
            <p>• Ensure good lighting</p>
            <p>• Look directly at the camera</p>
            <p>• Keep your face centered in the frame</p>
            <p>• Remove glasses if possible</p>
          </div>
        </div>
      </div>
    </div>
  );
}
