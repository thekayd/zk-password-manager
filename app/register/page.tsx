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
  const [shareEmails, setShareEmails] = useState<string[]>([
    "",
    "",
    "",
    "",
    "",
  ]);
  const [sendingEmails, setSendingEmails] = useState<boolean[]>([
    false,
    false,
    false,
    false,
    false,
  ]);
  const [emailStatus, setEmailStatus] = useState<string[]>([
    "",
    "",
    "",
    "",
    "",
  ]);
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

  // this allows for the logging in of the user after successful registration
  const autoLoginAfterRegistration = async () => {
    try {
      const response = await fetch("/api/auth/login", {
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
        throw new Error(result.error || "Auto-login failed");
      }

      // this then stores the authentication token
      localStorage.setItem("sessionToken", result.token);
      localStorage.setItem("userEmail", formData.email);

      toast.success("Auto-login successful!");

      continueRegistration();
    } catch (err: any) {
      console.error("Auto-login error:", err);
      toast.error("Auto-login failed, please login manually");
      router.push("/login");
    }
  };

  // sends email with Shamir share
  const sendShareEmail = async (
    shareIndex: number,
    email: string,
    shareValue: string
  ) => {
    if (!email.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    // updates the sending state to true for the share index and sets the sending emails state to the new sending emails
    const newSendingEmails = [...sendingEmails];
    newSendingEmails[shareIndex] = true;
    setSendingEmails(newSendingEmails);

    // sends the email with the share value to the email address
    try {
      const response = await fetch("/api/email/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: email.trim(),
          subject: `Recovery Share ${shareIndex + 1}`,
          body: `Hello,\n\nThis email contains your recovery share #${
            shareIndex + 1
          } for the ZK Password Manager.`,
          shareValue: shareValue,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to send email");
      }

      toast.success(`Share ${shareIndex + 1} sent to ${email} successfully!`);

      // updates the email status to the new email status for the share index and sets the email status to the new email status
      const newEmailStatus = [...emailStatus];
      newEmailStatus[shareIndex] = `✓ Sent to ${email}`;
      setEmailStatus(newEmailStatus);

      // clears the email input after successful send
      const newShareEmails = [...shareEmails];
      newShareEmails[shareIndex] = "";
      setShareEmails(newShareEmails);
    } catch (err: any) {
      console.error("Email send error:", err);
      toast.error(err.message || "Failed to send email");
    } finally {
      // resets the sending state to false for the share index
      const newSendingEmails = [...sendingEmails];
      newSendingEmails[shareIndex] = false;
      setSendingEmails(newSendingEmails);
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

      // if no shares, it then automatically logs the user in and continues to setup so the registration has a token
      await autoLoginAfterRegistration();
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
                recover your account. You can also send each share to trusted
                contacts via email.
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
                  <p className="text-xs font-mono break-all bg-white p-2 rounded border mb-3">
                    {share.value}
                  </p>

                  <div className="border-t pt-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <input
                        type="email"
                        placeholder="Enter recipient email"
                        value={shareEmails[index]}
                        onChange={(e) => {
                          const newShareEmails = [...shareEmails];
                          newShareEmails[index] = e.target.value;
                          setShareEmails(newShareEmails);
                        }}
                        className="flex-1 text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        disabled={sendingEmails[index]}
                      />
                      <button
                        onClick={() =>
                          sendShareEmail(index, shareEmails[index], share.value)
                        }
                        disabled={
                          sendingEmails[index] || !shareEmails[index].trim()
                        }
                        className="text-xs bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                      >
                        {sendingEmails[index] ? (
                          <>
                            <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Sending</span>
                          </>
                        ) : (
                          <span>Send</span>
                        )}
                      </button>
                    </div>

                    {emailStatus[index] && (
                      <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded border border-green-200">
                        {emailStatus[index]}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={async () => {
                  setShowShares(false);
                  await autoLoginAfterRegistration();
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
