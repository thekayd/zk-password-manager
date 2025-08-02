"use client";

import { useState, useEffect } from "react";
import {
  decodeShare,
  Share,
  validateShares,
  reconstructSecret,
} from "../lib/shamir";

interface ShareInputProps {
  userId: string;
  onRecoverySuccess: (recoveredSecret: string) => void;
}

export default function ShareInput({
  userId,
  onRecoverySuccess,
}: ShareInputProps) {
  const [shares, setShares] = useState<string[]>(["", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [config, setConfig] = useState<{
    total_shares: number;
    required_shares: number;
  } | null>(null);

  // This loads the user's Shamir configuration
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await fetch("/api/shamir/config", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch Shamir config");
        }

        const { config: userConfig } = await response.json();
        if (userConfig) {
          setConfig(userConfig);
          // the userconfig then sets the   shares array with the correct size
          setShares(new Array(userConfig.total_shares).fill(""));
        }
      } catch (err) {
        console.error("Error loading Shamir config:", err);
      }
    };
    loadConfig();
  }, [userId]);

  const handleShareChange = (index: number, value: string) => {
    const newShares = [...shares];
    newShares[index] = value;
    setShares(newShares);
  };

  const validateAndReconstruct = async () => {
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      // Filter out empty shares
      const nonEmptyShares = shares.filter((share) => share.trim() !== "");

      if (nonEmptyShares.length < 2) {
        throw new Error("At least 2 shares are required");
      }

      if (!config) {
        throw new Error("Unable to load recovery configuration");
      }

      if (nonEmptyShares.length < config.required_shares) {
        throw new Error(
          `At least ${config.required_shares} shares are required for recovery`
        );
      }

      // This const then decodes and validates shares
      const decodedShares: Share[] = [];
      for (const encodedShare of nonEmptyShares) {
        try {
          const share = decodeShare(encodedShare);
          decodedShares.push(share);
        } catch (err) {
          throw new Error(
            `Invalid share format: ${encodedShare.substring(0, 20)}...`
          );
        }
      }

      // This validates share integrity
      if (!validateShares(decodedShares)) {
        throw new Error("Invalid or corrupted shares detected");
      }

      // This validates shares against database hashes
      for (const share of decodedShares) {
        const validateResponse = await fetch("/api/shamir/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            shareIndex: share.id,
            shareHash: share.checksum,
          }),
        });

        if (!validateResponse.ok) {
          throw new Error("Failed to validate share");
        }

        const { isValid } = await validateResponse.json();
        if (!isValid) {
          throw new Error(`Share ${share.id} validation failed`);
        }
      }

      // This then reconstructs the secret
      const recoveredSecret = reconstructSecret(decodedShares);

      // This then logs the successful recovery attempt
      await fetch("/api/shamir/recovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          success: true,
          sharesUsed: decodedShares.length,
          requiredShares: config.required_shares,
        }),
      });

      setSuccess(true);
      onRecoverySuccess(recoveredSecret);
    } catch (err: any) {
      setError(err.message);

      // thislogs failed recovery attempt
      if (config) {
        try {
          await fetch("/api/shamir/recovery", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId,
              success: false,
              sharesUsed: shares.filter((s) => s.trim() !== "").length,
              requiredShares: config.required_shares,
            }),
          });
        } catch (logErr) {
          console.error("Error logging recovery attempt:", logErr);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const clearAllShares = () => {
    setShares(new Array(shares.length).fill(""));
    setError("");
    setSuccess(false);
  };

  const pasteFromClipboard = async (index: number) => {
    try {
      const text = await navigator.clipboard.readText();
      handleShareChange(index, text);
    } catch (err) {
      setError("Unable to read from clipboard");
    }
  };

  if (!config) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading recovery configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        Account Recovery
      </h2>

      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded">
        <p className="text-sm text-blue-700">
          <strong>Recovery Configuration:</strong> You need{" "}
          {config.required_shares} out of {config.total_shares} shares to
          recover your account.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-600 rounded">
          Recovery successful! Your account has been restored.
        </div>
      )}

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Enter Recovery Shares</h3>
          <button
            onClick={clearAllShares}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            Clear All
          </button>
        </div>

        {shares.map((share, index) => (
          <div key={index} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Share {index + 1}{" "}
              {index < config.required_shares && (
                <span className="text-red-500">*</span>
              )}
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={share}
                onChange={(e) => handleShareChange(index, e.target.value)}
                placeholder={`Paste share ${index + 1} here...`}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
              <button
                onClick={() => pasteFromClipboard(index)}
                disabled={loading}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50"
              >
                Paste
              </button>
            </div>
          </div>
        ))}

        <div className="pt-4">
          <button
            onClick={validateAndReconstruct}
            disabled={
              loading ||
              shares.filter((s) => s.trim() !== "").length <
                config.required_shares
            }
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Recovering Account..." : "Recover Account"}
          </button>
        </div>

        <div className="text-xs text-gray-500 text-center">
          <p>
            Required shares: {config.required_shares} | Provided:{" "}
            {shares.filter((s) => s.trim() !== "").length}
          </p>
        </div>
      </div>

      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h4 className="font-semibold text-yellow-800 mb-2">
          Recovery Instructions:
        </h4>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>
            • Enter at least {config.required_shares} shares to recover your
            account
          </li>
          <li>• Shares can be entered in any order</li>
          <li>• Make sure to copy the entire share string</li>
          <li>• If recovery fails, double-check your shares</li>
        </ul>
      </div>
    </div>
  );
}
