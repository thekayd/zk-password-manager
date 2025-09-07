"use client";

import { useState } from "react";
import { runAllTests } from "@/app/lib/simpleTests";
import { runLoadTests } from "@/app/lib/loadTests";
import { runSecurityTests } from "@/app/lib/securityTests";

export default function TestPage() {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runTests = async (type: string) => {
    setLoading(true);
    try {
      let testResults;
      switch (type) {
        case "all":
          testResults = await runAllTests();
          break;
        case "load":
          testResults = await runLoadTests();
          break;
        case "security":
          testResults = await runSecurityTests();
          break;
        default:
          testResults = await runAllTests();
      }
      setResults(testResults);
    } catch (error) {
      console.error("Test error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">
          ZK Password Manager - Simple Tests
        </h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Run Tests</h2>
          <div className="space-x-4">
            <button
              onClick={() => runTests("all")}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Running..." : "Run All Tests"}
            </button>
            <button
              onClick={() => runTests("load")}
              disabled={loading}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
              Load Tests
            </button>
            <button
              onClick={() => runTests("security")}
              disabled={loading}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
            >
              Security Tests
            </button>
          </div>
        </div>

        {results && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Test Results</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(results, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
