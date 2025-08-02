"use client";

import { useState, useEffect } from "react";
import LoadingSpinner from "../../components/LoadingSpinner";

import { useRouter } from "next-nprogress-bar";
import { toast } from "sonner";
import Link from "next/link";

export default function BiometricRegister() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // This gets the email from sessionStorage
    const registrationEmail = sessionStorage.getItem("registrationEmail");
    if (!registrationEmail) {
      toast.error("Please complete registration first");
      router.push("/register");
      return;
    }
    setEmail(registrationEmail);
  }, []);

  const handleSkip = () => {
    toast.info("Skipping biometric setup");
    sessionStorage.removeItem("registrationEmail");
    router.push("/dashboard");
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      // this prepares a browser challenge and makes a public key with challange, user and keycardparams
      // checks if if biometrics are available
      if (!window.PublicKeyCredential) {
        throw new Error(
          "Biometric authentication is not supported on this device"
        );
      }

      const isAvailable =
        await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      if (!isAvailable) {
        throw new Error(
          "Biometric authentication is not available on this device"
        );
      }

      // Then prepares the browser challanger on the publickey
      const publicKey: PublicKeyCredentialCreationOptions = {
        challenge: new Uint8Array(32),
        rp: {
          name: "ZK Password Manager",
        },
        user: {
          id: new TextEncoder().encode(email),
          name: email,
          displayName: email,
        },
        pubKeyCredParams: [
          {
            type: "public-key",
            alg: -7, // ES256
          },
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
        },
        timeout: 60000,
        attestation: "none" as AttestationConveyancePreference,
      };

      // This then proceedes to start WebAuthn registration
      const credential = (await navigator.credentials.create({
        publicKey,
      })) as PublicKeyCredential;

      if (!credential) {
        toast.error("Biometric registration failed");
        throw new Error("Biometric registration failed.");
      }

      const credentialId = btoa(
        String.fromCharCode(...new Uint8Array(credential.rawId))
      );

      // then saves the credentials to MongoDB
      const publicKeyString = btoa(
        String.fromCharCode(
          ...new Uint8Array(
            (
              credential.response as AuthenticatorAttestationResponse
            ).getPublicKey() as ArrayBuffer
          )
        )
      );

      const response = await fetch("/api/auth/biometric", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          credentialId,
          publicKey: publicKeyString,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save biometric data");
      }

      toast.success("Biometric registration successful! ✅", {
        duration: 2000,
      });

      setSuccess(true);
      sessionStorage.removeItem("registrationEmail");

      setTimeout(() => {
        router.push("/dashboard");
      }, 2500);
    } catch (err: any) {
      console.error("Biometric registration error:", err);
      toast.error(err.message || "Failed to register biometrics", {
        duration: 3000,
      });
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div>
          <h2 className="text-3xl font-bold text-center">Biometric Setup</h2>
          <p className="mt-2 text-center text-gray-600">
            Set up biometric authentication for faster login (Optional)
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
        {success && (
          <div
            className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded relative"
            role="alert"
          >
            <span className="block sm:inline">
              Biometric registration successful!
            </span>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleRegister}>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
              value={email}
              disabled
            />
            <p className="mt-2 text-sm text-gray-500">
              Email from your registration
            </p>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? <LoadingSpinner /> : "Set Up Biometrics"}
            </button>
            <button
              type="button"
              onClick={handleSkip}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
              disabled={loading}
            >
              Skip
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
