"use client";

import React, { useState, useEffect } from "react";
import { FingerprintReader, FingerprintData } from "../lib/fingerprint";

interface FingerprintReaderModelProps {
  onFingerprintRead: (data: FingerprintData) => void;
  onError: (error: string) => void;
  mode: "read" | "verify";
  existingData?: FingerprintData;
}

export default function FingerprintReaderModel({
  onFingerprintRead,
  onError,
  mode,
  existingData,
}: FingerprintReaderModelProps) {
  const [reader, setReader] = useState<FingerprintReader | null>(null);
  const [hasFingerprint, setHasFingerprint] = useState<boolean>(false);
  const [isReading, setIsReading] = useState<boolean>(false);
  const [status, setStatus] = useState<string>("");
  const [matchResult, setMatchResult] = useState<{
    isMatch: boolean;
    score: number;
  } | null>(null);

  useEffect(() => {
    const initReader = async () => {
      try {
        const newReader = new FingerprintReader();
        const hasCapability = await newReader.hasFingerprintCapability();
        setHasFingerprint(hasCapability);
        setReader(newReader);

        if (hasCapability) {
          setStatus("Fingerprint sensor available");
        } else {
          setStatus("No fingerprint sensor detected");
        }
      } catch (error) {
        setStatus("Failed to initialize fingerprint reader");
        onError(`Initialization error: ${error}`);
      }
    };

    // device information for log
    if (typeof window !== "undefined") {
      console.log("Device Information:", {
        platform: navigator.platform || "Unknown",
        userAgent: navigator.userAgent || "Unknown",
      });
    }

    initReader();
  }, [onError]);

  const handleReadFingerprint = async () => {
    if (!reader) {
      onError("Fingerprint reader not initialized");
      return;
    }

    try {
      setIsReading(true);
      setStatus("Reading fingerprint...");

      const fingerprintData = await reader.readFingerprint();

      if (mode === "verify" && existingData) {
        // this allows for the comparison with existing data
        const result = await reader.matchFingerprints(
          fingerprintData,
          existingData
        );
        setMatchResult({
          isMatch: result.isMatch,
          score: result.matchScore,
        });

        if (result.isMatch) {
          setStatus(
            `Fingerprint verified! Match score: ${result.matchScore.toFixed(
              1
            )}%`
          );
        } else {
          setStatus(
            `Verification failed. Match score: ${result.matchScore.toFixed(1)}%`
          );
        }
      } else {
        // Read mode which then sends data to the parent based on read
        setStatus("Fingerprint read successfully!");
        onFingerprintRead(fingerprintData);
      }
    } catch (error) {
      setStatus("Failed to read fingerprint");
      onError(`Fingerprint reading error: ${error}`);
    } finally {
      setIsReading(false);
    }
  };

  //clean up design

  const getStatusColor = () => {
    if (matchResult) {
      return matchResult.isMatch ? "text-green-600" : "text-red-600";
    }
    if (isReading) return "text-blue-600";
    if (hasFingerprint) return "text-green-600";
    return "text-red-600";
  };

  const getButtonText = () => {
    if (isReading) return "Reading...";
    if (mode === "verify") return "Verify Fingerprint";
    return "Read Fingerprint";
  };

  const getButtonColor = () => {
    if (isReading) return "bg-gray-400 cursor-not-allowed";
    if (mode === "verify") return "bg-green-600 hover:bg-green-700";
    return "bg-blue-600 hover:bg-blue-700";
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          {mode === "read" ? "Read Fingerprint" : "Verify Fingerprint"}
        </h2>
        <p className="text-gray-600">
          {mode === "read"
            ? "Place your finger on the sensor to read your fingerprint"
            : "Place your finger on the sensor to verify your identity"}
        </p>
      </div>

      {/* Status Display if fingerprint sensor is found*/}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-gray-700 font-medium">Status:</span>
          <span className={`font-medium ${getStatusColor()}`}>
            {status || "Initializing..."}
          </span>
        </div>

        {hasFingerprint && (
          <div className="mt-2 text-sm text-green-600">
            Fingerprint sensor detected
          </div>
        )}

        {!hasFingerprint && (
          <div className="mt-2 text-sm text-red-600">
            No fingerprint sensor available
          </div>
        )}
      </div>

      {/* Fingerprint read button */}
      <div className="mb-6">
        <button
          onClick={handleReadFingerprint}
          disabled={!hasFingerprint || isReading}
          className={`w-full py-3 px-6 text-white font-medium rounded-lg transition-colors ${getButtonColor()}`}
        >
          {getButtonText()}
        </button>
      </div>

      {/* Match Result */}
      {matchResult && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-800 mb-2">
            Verification Result:
          </h3>
          <div className="text-center">
            <div
              className={`text-2xl font-bold mb-2 ${
                matchResult.isMatch ? "text-green-600" : "text-red-600"
              }`}
            >
              {matchResult.score.toFixed(1)}%
            </div>
            <div
              className={`text-sm font-medium ${
                matchResult.isMatch ? "text-green-600" : "text-red-600"
              }`}
            >
              {matchResult.isMatch
                ? "Verified Successfully"
                : "Verification Failed"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
