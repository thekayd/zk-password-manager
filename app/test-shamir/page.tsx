"use client";

import { useState } from "react";
import {
  generateShares,
  reconstructSecret,
  encodeShare,
  decodeShare,
  generateRandomSecret,
  Share,
  ShamirConfig,
} from "../lib/shamir";

export default function TestShamir() {
  const [secret, setSecret] = useState(generateRandomSecret(16));
  const [config, setConfig] = useState<ShamirConfig>({
    totalShares: 5,
    requiredShares: 3,
  });
  const [shares, setShares] = useState<Share[]>([]);
  const [encodedShares, setEncodedShares] = useState<string[]>([]);
  const [recoveredSecret, setRecoveredSecret] = useState("");
  const [testResults, setTestResults] = useState<string[]>([]);

  const generateTestShares = () => {
    try {
      const generatedShares = generateShares(secret, config);
      setShares(generatedShares);

      const encoded = generatedShares.map((share) => encodeShare(share));
      setEncodedShares(encoded);

      setTestResults((prev) => [
        ...prev,
        `✅ Generated ${config.totalShares} shares with required=${config.requiredShares}`,
      ]);
    } catch (error: any) {
      setTestResults((prev) => [
        ...prev,
        `❌ Error generating shares: ${error.message}`,
      ]);
    }
  };

  const testReconstruction = () => {
    try {
      // Test with all shares
      const reconstructed = reconstructSecret(shares);
      setRecoveredSecret(reconstructed);

      const success = reconstructed === secret;
      setTestResults((prev) => [
        ...prev,
        success
          ? "✅ Reconstruction successful with all shares"
          : "❌ Reconstruction failed with all shares",
      ]);

      // Test with minimum shares
      if (shares.length >= config.requiredShares) {
        const minShares = shares.slice(0, config.requiredShares);
        const reconstructedMin = reconstructSecret(minShares);
        const minSuccess = reconstructedMin === secret;
        setTestResults((prev) => [
          ...prev,
          minSuccess
            ? `✅ Reconstruction successful with ${config.requiredShares} shares`
            : `❌ Reconstruction failed with ${config.requiredShares} shares`,
        ]);
      }

      // Test with fewer than required shares (should fail)
      if (shares.length > config.requiredShares) {
        try {
          const insufficientShares = shares.slice(0, config.requiredShares - 1);
          reconstructSecret(insufficientShares);
          setTestResults((prev) => [
            ...prev,
            "❌ Reconstruction should have failed with insufficient shares",
          ]);
        } catch (error) {
          setTestResults((prev) => [
            ...prev,
            "✅ Reconstruction correctly failed with insufficient shares",
          ]);
        }
      }
    } catch (error: any) {
      setTestResults((prev) => [
        ...prev,
        `❌ Error during reconstruction: ${error.message}`,
      ]);
    }
  };

  const testEncodingDecoding = () => {
    try {
      const decodedShares = encodedShares.map((encoded) =>
        decodeShare(encoded)
      );
      const encodingSuccess = decodedShares.every(
        (share, index) =>
          share.id === shares[index].id &&
          share.value === shares[index].value &&
          share.checksum === shares[index].checksum
      );

      setTestResults((prev) => [
        ...prev,
        encodingSuccess
          ? "✅ Encoding/decoding successful"
          : "❌ Encoding/decoding failed",
      ]);
    } catch (error: any) {
      setTestResults((prev) => [
        ...prev,
        `❌ Error during encoding/decoding: ${error.message}`,
      ]);
    }
  };

  const runAllTests = () => {
    setTestResults([]);
    generateTestShares();
    setTimeout(() => {
      testReconstruction();
      setTimeout(() => {
        testEncodingDecoding();
      }, 100);
    }, 100);
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-center">
          Shamir's Secret Sharing Test
        </h1>

        {/* Configuration */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Configuration</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Secret</label>
              <input
                type="text"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Total Shares
              </label>
              <input
                type="number"
                min="2"
                max="10"
                value={config.totalShares}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    totalShares: parseInt(e.target.value),
                  })
                }
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
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
                className="w-full px-3 py-2 border rounded"
              />
            </div>
          </div>
          <button
            onClick={runAllTests}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Run All Tests
          </button>
        </div>

        {/* Test Results */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          <div className="space-y-2">
            {testResults.map((result, index) => (
              <div key={index} className="p-2 bg-gray-50 rounded">
                {result}
              </div>
            ))}
          </div>
        </div>

        {/* Generated Shares */}
        {shares.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Generated Shares</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {shares.map((share, index) => (
                <div key={index} className="p-4 border rounded">
                  <h3 className="font-medium mb-2">Share {share.id}</h3>
                  <p className="text-sm text-gray-600">
                    Value: {share.value.substring(0, 20)}...
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Checksum: {share.checksum}
                  </p>
                  <p className="text-xs font-mono mt-2 break-all bg-gray-100 p-2 rounded">
                    {encodedShares[index]}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recovery Test */}
        {recoveredSecret && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Recovery Test</h2>
            <div className="space-y-2">
              <p>
                <strong>Original Secret:</strong> {secret}
              </p>
              <p>
                <strong>Recovered Secret:</strong> {recoveredSecret}
              </p>
              <p>
                <strong>Match:</strong>{" "}
                {secret === recoveredSecret ? "✅ Yes" : "❌ No"}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
