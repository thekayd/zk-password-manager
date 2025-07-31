"use client";

import { useState } from "react";
import {
  generateShares,
  encodeShare,
  Share,
  ShamirConfig,
  generateShareHash,
} from "../lib/shamir";
import { saveShamirShares } from "../supabase/mutations";

interface ShareGeneratorProps {
  userId: string;
  masterKey: string;
  onComplete?: () => void;
}

export default function ShareGenerator({
  userId,
  masterKey,
  onComplete,
}: ShareGeneratorProps) {
  const [config, setConfig] = useState<ShamirConfig>({
    totalShares: 5,
    requiredShares: 3,
  });
  const [shares, setShares] = useState<Share[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const generateSharesHandler = async () => {
    if (config.requiredShares > config.totalShares) {
      setError("Required shares cannot be greater than total shares");
      return;
    }

    if (config.requiredShares < 2) {
      setError("At least 2 shares are required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const generatedShares = generateShares(masterKey, config);
      setShares(generatedShares);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const saveSharesToDatabase = async () => {
    if (shares.length === 0) return;

    setLoading(true);
    setError("");

    try {
      const shareData = shares.map((share) => ({
        index: share.id,
        hash: generateShareHash(share),
      }));

      const success = await saveShamirShares(
        userId,
        shareData,
        config.totalShares,
        config.requiredShares
      );

      if (success) {
        setSuccess(true);
        onComplete?.();
      } else {
        setError("Failed to save shares to database");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyShareToClipboard = (share: Share) => {
    const encodedShare = encodeShare(share);
    navigator.clipboard.writeText(encodedShare);
  };

  const downloadShares = () => {
    const shareData = shares.map((share) => ({
      share: encodeShare(share),
      index: share.id,
      checksum: share.checksum,
    }));

    const blob = new Blob([JSON.stringify(shareData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "recovery-shares.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        Generate Recovery Shares
      </h2>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-600 rounded">
          Shares generated successfully! Please save them securely.
        </div>
      )}

      {/* Configuration Section */}
      <div className="mb-6 p-4 bg-gray-50 rounded">
        <h3 className="text-lg font-semibold mb-4">Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Total Shares (n)
            </label>
            <input
              type="number"
              min="2"
              max="10"
              value={config.totalShares}
              onChange={(e) =>
                setConfig({ ...config, totalShares: parseInt(e.target.value) })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Total number of shares to generate (2-10)
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Required Shares
            </label>
            <input
              type="number"
              min="2"
              max={config.totalShares}
              value={config.requiredShares}
              onChange={(e) =>
                setConfig({
                  ...config,
                  requiredShares: parseInt(e.target.value),
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Minimum shares needed to recover (2-{config.totalShares})
            </p>
          </div>
        </div>
        <button
          onClick={generateSharesHandler}
          disabled={loading}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Generating..." : "Generate Shares"}
        </button>
      </div>

      {/* Shares Display Section */}
      {shares.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Generated Shares</h3>
            <div className="space-x-2">
              <button
                onClick={downloadShares}
                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
              >
                Download All
              </button>
              <button
                onClick={saveSharesToDatabase}
                disabled={loading}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save to Database"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {shares.map((share, index) => (
              <div
                key={index}
                className="p-4 border border-gray-200 rounded-lg"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-700">
                    Share {share.id}
                  </span>
                  <button
                    onClick={() => copyShareToClipboard(share)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Copy
                  </button>
                </div>
                <div className="bg-gray-100 p-2 rounded text-xs font-mono break-all">
                  {encodeShare(share)}
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Checksum: {share.checksum}
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
            <h4 className="font-semibold text-yellow-800 mb-2">
              Important Security Notes:
            </h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Store shares in different secure locations</li>
              <li>• Never share all shares with one person</li>
              <li>
                • Keep at least {config.requiredShares} shares to recover your
                account
              </li>
              <li>
                • Consider using trusted family members or friends as recovery
                agents
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
