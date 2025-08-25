// "use client";

// import React, { useState } from "react";
// import SimpleFingerprintReader from "../components/FingerprintReaderModel";
// import { FingerprintData } from "../lib/fingerprint";

// export default function TestSimpleFingerprintPage() {
//   const [capturedData, setCapturedData] = useState<FingerprintData | null>(
//     null
//   );
//   const [mode, setMode] = useState<"read" | "verify">("read");
//   const [error, setError] = useState<string>("");

//   const handleFingerprintRead = (data: FingerprintData) => {
//     setCapturedData(data);
//     setError("");
//     console.log("Captured fingerprint data:", data);
//   };

//   const handleError = (errorMessage: string) => {
//     setError(errorMessage);
//     console.error("Fingerprint error:", errorMessage);
//   };

//   const handleModeChange = (newMode: "read" | "verify") => {
//     setMode(newMode);
//     setError("");
//     if (newMode === "verify" && !capturedData) {
//       setError(
//         "Please read a fingerprint first before switching to verify mode"
//       );
//       setMode("read");
//     }
//   };

//   const clearData = () => {
//     setCapturedData(null);
//     setError("");
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 py-8">
//       <div className="max-w-4xl mx-auto px-4">
//         {/* Header */}
//         <div className="text-center mb-8">
//           <h1 className="text-4xl font-bold text-gray-900 mb-4">
//             Simple Fingerprint System Test
//           </h1>
//           <p className="text-lg text-gray-600 max-w-2xl mx-auto">
//             Test the simple fingerprint reading system that works directly with
//             device sensors. This system reads biometric data from the
//             fingerprint scanner without using WebAuthn.
//           </p>
//         </div>

//         {/* Mode Selection */}
//         <div className="flex justify-center mb-8">
//           <div className="bg-white rounded-lg shadow-md p-4">
//             <div className="flex space-x-2">
//               <button
//                 onClick={() => handleModeChange("read")}
//                 className={`px-6 py-3 rounded-lg font-medium transition-colors ${
//                   mode === "read"
//                     ? "bg-blue-600 text-white"
//                     : "bg-gray-200 text-gray-700 hover:bg-gray-300"
//                 }`}
//               >
//                 📱 Read Mode
//               </button>
//               <button
//                 onClick={() => handleModeChange("verify")}
//                 className={`px-6 py-3 rounded-lg font-medium transition-colors ${
//                   mode === "verify"
//                     ? "bg-green-600 text-white"
//                     : "bg-gray-200 text-gray-700 hover:bg-gray-300"
//                 }`}
//                 disabled={!capturedData}
//               >
//                 🔍 Verify Mode
//               </button>
//             </div>
//           </div>
//         </div>

//         {/* Error Display */}
//         {error && (
//           <div className="max-w-md mx-auto mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
//             <p className="text-red-800 text-center font-medium">{error}</p>
//           </div>
//         )}

//         {/* Fingerprint Reader */}
//         <SimpleFingerprintReader
//           mode={mode}
//           onFingerprintRead={handleFingerprintRead}
//           onError={handleError}
//           existingData={
//             mode === "verify" ? capturedData || undefined : undefined
//           }
//         />

//         {/* Captured Data Display */}
//         {capturedData && (
//           <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-lg">
//             <div className="flex items-center justify-between mb-4">
//               <h3 className="text-xl font-bold text-gray-800">Captured Data</h3>
//               <button
//                 onClick={clearData}
//                 className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
//               >
//                 Clear Data
//               </button>
//             </div>

//             <div className="space-y-3 text-sm">
//               <div>
//                 <span className="text-gray-600">ID:</span>
//                 <span className="ml-2 font-mono text-xs break-all">
//                   {capturedData.id}
//                 </span>
//               </div>
//               <div>
//                 <span className="text-gray-600">Quality:</span>
//                 <span className="ml-2 font-bold">
//                   {capturedData.quality.toFixed(1)}%
//                 </span>
//               </div>
//               <div>
//                 <span className="text-gray-600">Device:</span>
//                 <span className="ml-2 font-medium capitalize">
//                   {capturedData.deviceInfo}
//                 </span>
//               </div>
//               <div>
//                 <span className="text-gray-600">Timestamp:</span>
//                 <span className="ml-2 font-mono text-xs">
//                   {new Date(capturedData.timestamp).toLocaleString()}
//                 </span>
//               </div>
//               <div>
//                 <span className="text-gray-600">Biometric Data:</span>
//                 <div className="mt-1 p-2 bg-gray-100 rounded font-mono text-xs break-all">
//                   {capturedData.biometricData.substring(0, 100)}
//                   {capturedData.biometricData.length > 100 && "..."}
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Technical Information */}
//         <div className="max-w-2xl mx-auto mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
//           <h3 className="text-lg font-bold text-blue-800 mb-3">
//             🔬 How It Works
//           </h3>
//           <div className="space-y-3 text-sm text-blue-700">
//             <div>
//               <strong>Direct Sensor Access:</strong> Reads directly from device
//               fingerprint sensor
//             </div>
//             <div>
//               <strong>No WebAuthn Dependency:</strong> Works independently of
//               WebAuthn APIs
//             </div>
//             <div>
//               <strong>Platform Support:</strong> Android, iOS, Windows, Mac with
//               native APIs
//             </div>
//             <div>
//               <strong>Fallback System:</strong> Gracefully falls back when
//               native APIs aren't available
//             </div>
//             <div>
//               <strong>Biometric Extraction:</strong> Gets raw biometric data
//               from the scan
//             </div>
//           </div>
//         </div>

//         {/* Usage Instructions */}
//         <div className="max-w-2xl mx-auto mt-6 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
//           <h3 className="text-lg font-bold text-yellow-800 mb-3">
//             📋 How to Use
//           </h3>
//           <div className="space-y-2 text-sm text-yellow-700">
//             <div>
//               <strong>1.</strong> Start in Read Mode to capture your fingerprint
//             </div>
//             <div>
//               <strong>2.</strong> Place your finger on the device's fingerprint
//               sensor
//             </div>
//             <div>
//               <strong>3.</strong> Wait for the system to read and process the
//               data
//             </div>
//             <div>
//               <strong>4.</strong> Switch to Verify Mode to test authentication
//             </div>
//             <div>
//               <strong>5.</strong> Place your finger again to verify against
//               stored data
//             </div>
//           </div>
//         </div>

//         {/* Fallback Information */}
//         <div className="max-w-2xl mx-auto mt-6 p-6 bg-green-50 border border-green-200 rounded-lg">
//           <h3 className="text-lg font-bold text-green-800 mb-3">
//             🔄 Fallback System
//           </h3>
//           <div className="space-y-2 text-sm text-green-700">
//             <div>
//               • If no fingerprint sensor is detected, the system will indicate
//               this
//             </div>
//             <div>
//               • Users without fingerprint capability can still use other
//               authentication methods
//             </div>
//             <div>
//               • The system gracefully handles different device capabilities
//             </div>
//             <div>
//               • No external libraries or complex camera processing required
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
