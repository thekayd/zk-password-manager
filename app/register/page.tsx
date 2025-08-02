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
  const router = useRouter();

  // Function to check if biometrics are available
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

      toast.success("Registration successful! ✅");

      console.log("Checking biometric availability...");
      // checks if biometrics are available
      const biometricsAvailable = await checkBiometricAvailability();

      if (biometricsAvailable) {
        // This then stores the email in sessionStorage for biometric registration
        sessionStorage.setItem("registrationEmail", formData.email);
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
                  setFormData({ ...formData, confirmPassword: e.target.value })
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

        <div className="text-center mt-4">
          <a
            href="/login"
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            Already have an account? Login
          </a>
        </div>
      </div>
    </div>
  );
}
