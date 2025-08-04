"use client";

import { useState } from "react";
import { useRouter } from "next-nprogress-bar";
import { deriveKey } from "@/app/lib/crypto";
import LoadingSpinner from "../components/LoadingSpinner";
import { toast } from "sonner";

export default function Register() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [shares, setShares] = useState<any[]>([]);
  const [showShares, setShowShares] = useState(false);
  const [registrationEmail, setRegistrationEmail] = useState("");
  const router = useRouter();

  // this function allows for the checking of the device, if biometrics are available
  const checkBiometricAvailability = async () => {
    try {
      if (!window.PublicKeyCredential) {
        return false;
      }
      return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    } catch (err) {
      console.error("Error checking biometric availability:", err);
      return false;
    }
  };

  // registration flow continues to biometrics
  const continueRegistration = async () => {
    console.log("Checking biometric availability...");
    const biometricsAvailable = await checkBiometricAvailability();

    if (biometricsAvailable) {
      // stores the email in sessionStorage for biometric registration
      sessionStorage.setItem("registrationEmail", registrationEmail);
      toast.info(
        "Biometric authentication is available on your device. Redirecting to setup...",
        {
          duration: 3000,
        }
      );
      setTimeout(() => {
        router.push("/biometric/register");
      }, 3000);
    } else {
      toast.info(
        "Biometric authentication is not available on your device. Redirecting to dashboard...",
        {
          duration: 3000,
        }
      );
      setTimeout(() => {
        router.push("/dashboard");
      }, 3000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      console.log("Starting registration process...");

      console.log("Registering user via API...");

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Registration failed");
      }

      console.log("Registration successful:", result);

      // if the shares were generated, it gets shown to the user
      if (result.shares && result.shares.length > 0) {
        setShares(result.shares);
        setShowShares(true);
        setRegistrationEmail(formData.email); // Stores email for biometric continuation
        toast.success(
          "Registration successful! Please save your recovery shares."
        );
        return;
      }

      toast.success("Registration successful! ✅");

      // if no shares, it continues to biometric setup or dashboard
      continueRegistration();
    } catch (err: any) {
      setError(err.message);
      console.error(err.message);
      toast.error(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div>
          <h2 className="text-3xl font-bold text-center">Register</h2>
          <p className="mt-2 text-center text-gray-600">
            Create your zero-knowledge password vault
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

        {showShares ? (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded">
              <p className="font-semibold">Registration Successful!</p>
              <p className="text-sm mt-1">
                Please save your recovery shares securely:
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Recovery Shares</h3>
              <p className="text-sm text-gray-600">
                Save these shares securely. You'll need 3 out of 5 shares to
                recover your account.
              </p>

              {shares.map((share, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded border">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Share {share.id}</span>
                    <button
                      onClick={() => navigator.clipboard.writeText(share.value)}
                      className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                    >
                      Copy
                    </button>
                  </div>
                  <p className="text-xs font-mono break-all bg-white p-2 rounded border">
                    {share.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowShares(false);
                  continueRegistration();
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Continue to Setup
              </button>
            </div>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  disabled={loading}
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  disabled={loading}
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700"
                >
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      confirmPassword: e.target.value,
                    })
                  }
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? <LoadingSpinner /> : "Register"}
            </button>
          </form>
        )}

        {!showShares && (
          <div className="text-center mt-4">
            <a
              href="/login"
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              Already have an account? Login
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
