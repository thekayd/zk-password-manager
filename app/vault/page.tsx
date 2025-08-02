"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import LoadingSpinner from "../components/LoadingSpinner";
import VaultEntry from "../components/VaultEntry";
import AuthCheck from "../components/AuthCheck";
import { encryptAESGCM, decryptAESGCM, deriveKey } from "../lib/crypto";
import { checkPasswordStrength, generatePassword } from "../lib/utils";
import { verifyToken } from "../lib/jwt";

interface VaultEntry {
  id: string;
  website: string;
  username: string;
  encrypted_password: string;
  created_at: string;
}

interface NewEntry {
  website: string;
  username: string;
  password: string;
  masterPassword: string;
}

export default function VaultPage() {
  const [entries, setEntries] = useState<VaultEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<VaultEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [newEntry, setNewEntry] = useState<NewEntry>({
    website: "",
    username: "",
    password: "",
    masterPassword: "",
  });
  const [selectedEntry, setSelectedEntry] = useState<VaultEntry | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isViewing, setIsViewing] = useState(false);
  const [decryptedPassword, setDecryptedPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadEntries();
  }, []);

  // Filter entries based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredEntries(entries);
    } else {
      const filtered = entries.filter(
        (entry) =>
          entry.website.toLowerCase().includes(searchTerm.toLowerCase()) ||
          entry.username.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredEntries(filtered);
    }
  }, [searchTerm, entries]);

  async function loadEntries() {
    try {
      const sessionToken = localStorage.getItem("sessionToken");
      if (!sessionToken) {
        toast.error("Authentication required");
        return;
      }
      const { userId } = await verifyToken(sessionToken);
      const response = await fetch(`/api/vault/entries?userId=${userId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch entries");
      }
      const { entries: data } = await response.json();
      setEntries(data);
      setFilteredEntries(data);
    } catch (error) {
      toast.error("Failed to load vault entries");
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const sessionToken = localStorage.getItem("sessionToken");
      if (!sessionToken) {
        toast.error("Authentication required");
        return;
      }

      const { userId } = await verifyToken(sessionToken);

      // Derive key and encrypt the password
      const key = await deriveKey(newEntry.masterPassword);
      const { cipherText, iv } = await encryptAESGCM(newEntry.password, key);
      const encryptedData = JSON.stringify({ cipherText, iv });

      const response = await fetch("/api/vault/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          website: newEntry.website,
          username: newEntry.username,
          encryptedPassword: encryptedData,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || "Failed to add password");
        return;
      }

      toast.success("Password added successfully");
      setIsDrawerOpen(false);
      setNewEntry({
        website: "",
        username: "",
        password: "",
        masterPassword: "",
      });
      loadEntries();
    } catch (error) {
      toast.error("Failed to add password");
    } finally {
      setLoading(false);
    }
  }

  async function handleView(entry: VaultEntry) {
    setSelectedEntry(entry);
    setIsViewing(true);
    setDecryptedPassword("");
    setShowPassword(false);
  }

  async function handleDecrypt(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedEntry || !newEntry.masterPassword) return;

    try {
      const { cipherText, iv } = JSON.parse(selectedEntry.encrypted_password);
      const key = await deriveKey(newEntry.masterPassword);
      const decrypted = await decryptAESGCM(cipherText, iv, key);
      setDecryptedPassword(decrypted);

      const sessionToken = localStorage.getItem("sessionToken");
      if (sessionToken) {
        try {
          const { userId } = await verifyToken(sessionToken);
          // Activity logging is handled by the API
        } catch (error) {
          console.error("Authentication error:", error);
        }
      }
    } catch (error) {
      toast.error(
        "Failed to decrypt password. Please check your master password."
      );
    }
  }

  async function handleEdit(entry: VaultEntry) {
    setSelectedEntry(entry);
    setIsEditing(true);
    setNewEntry({
      website: entry.website,
      username: entry.username,
      password: "",
      masterPassword: "",
    });
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedEntry) return;
    setLoading(true);

    try {
      const key = await deriveKey(newEntry.masterPassword);
      const { cipherText, iv } = await encryptAESGCM(newEntry.password, key);
      const encryptedData = JSON.stringify({ cipherText, iv });

      const response = await fetch("/api/vault/entries", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedEntry.id,
          encryptedPassword: encryptedData,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || "Failed to update password");
        return;
      }

      toast.success("Password updated successfully");
      setIsEditing(false);
      setSelectedEntry(null);
      setNewEntry({
        website: "",
        username: "",
        password: "",
        masterPassword: "",
      });
      loadEntries();
    } catch (error) {
      toast.error("Failed to update password");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(entry: VaultEntry) {
    if (!confirm("Are you sure you want to delete this entry?")) return;
    setLoading(true);

    try {
      const response = await fetch(`/api/vault/entries?id=${entry.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || "Failed to delete password");
        return;
      }

      toast.success("Password deleted successfully");
      loadEntries();
    } catch (error) {
      toast.error("Failed to delete password");
    } finally {
      setLoading(false);
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <AuthCheck>
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Password Vault</h1>
            <Link
              href="/dashboard"
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>

          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <div className="flex-1 max-w-md">
                  <input
                    type="text"
                    placeholder="Search by website or username..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <button
                  onClick={() => setIsDrawerOpen(true)}
                  className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors ml-4"
                >
                  Add New Password
                </button>
              </div>

              <div className="space-y-4">
                {filteredEntries.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-400 text-6xl mb-4">🔒</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {searchTerm
                        ? "No entries found"
                        : "No passwords stored yet"}
                    </h3>
                    <p className="text-gray-500">
                      {searchTerm
                        ? "Try adjusting your search terms."
                        : "Add your first password to get started."}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredEntries.map((entry) => (
                      <VaultEntry
                        key={entry.id}
                        entry={{ ...entry, _id: entry.id }}
                        onView={handleView}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Add New Password Drawer */}
        {isDrawerOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
            <div className="fixed inset-y-0 right-0 max-w-md w-full bg-white shadow-xl">
              <div className="h-full flex flex-col">
                <div className="px-6 py-4 border-b">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold">Add New Password</h2>
                    <button
                      onClick={() => {
                        setIsDrawerOpen(false);
                        setNewEntry({
                          website: "",
                          username: "",
                          password: "",
                          masterPassword: "",
                        });
                      }}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                <form
                  onSubmit={handleAdd}
                  className="flex-1 overflow-y-auto p-6"
                >
                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="website"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Website
                      </label>
                      <input
                        type="text"
                        id="website"
                        required
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={newEntry.website}
                        onChange={(e) =>
                          setNewEntry({ ...newEntry, website: e.target.value })
                        }
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="username"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Username
                      </label>
                      <input
                        type="text"
                        id="username"
                        required
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={newEntry.username}
                        onChange={(e) =>
                          setNewEntry({ ...newEntry, username: e.target.value })
                        }
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="password"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Password
                      </label>
                      <div className="mt-1 flex space-x-2">
                        <input
                          type="password"
                          id="password"
                          required
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          value={newEntry.password}
                          onChange={(e) =>
                            setNewEntry({
                              ...newEntry,
                              password: e.target.value,
                            })
                          }
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setNewEntry({
                              ...newEntry,
                              password: generatePassword(),
                            })
                          }
                          className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                        >
                          Generate
                        </button>
                      </div>
                      {newEntry.password && (
                        <div className="mt-1 flex items-center space-x-2">
                          <span className="text-xs text-gray-500">
                            Strength:
                          </span>
                          <span
                            className={`text-xs font-medium ${
                              checkPasswordStrength(newEntry.password).color
                            }`}
                          >
                            {checkPasswordStrength(newEntry.password).label}
                          </span>
                        </div>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="masterPassword"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Master Password
                      </label>
                      <input
                        type="password"
                        id="masterPassword"
                        required
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={newEntry.masterPassword}
                        onChange={(e) =>
                          setNewEntry({
                            ...newEntry,
                            masterPassword: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="mt-6">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50"
                    >
                      {loading ? <LoadingSpinner /> : "Save Password"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* View Password Modal */}
        {isViewing && selectedEntry && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">View Password</h2>
                <button
                  onClick={() => {
                    setIsViewing(false);
                    setSelectedEntry(null);
                    setDecryptedPassword("");
                    setShowPassword(false);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Website
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedEntry.website}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Username
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedEntry.username}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <div className="mt-1 relative">
                    <div className="flex items-center space-x-2">
                      <input
                        type={showPassword ? "text" : "password"}
                        readOnly
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50"
                        value={decryptedPassword || "••••••••"}
                      />
                      {decryptedPassword && (
                        <>
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
                          >
                            {showPassword ? "Hide" : "Show"}
                          </button>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(decryptedPassword)}
                            className="px-3 py-2 text-sm text-blue-600 hover:text-blue-800"
                          >
                            Copy
                          </button>
                        </>
                      )}
                    </div>
                    {!decryptedPassword && (
                      <form onSubmit={handleDecrypt} className="mt-2 space-y-2">
                        <input
                          type="password"
                          placeholder="Enter master password to decrypt"
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          value={newEntry.masterPassword}
                          onChange={(e) =>
                            setNewEntry({
                              ...newEntry,
                              masterPassword: e.target.value,
                            })
                          }
                          required
                        />
                        <button
                          type="submit"
                          className="w-full bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
                        >
                          Decrypt Password
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Password Modal */}
        {isEditing && selectedEntry && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Edit Password</h2>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setSelectedEntry(null);
                    setNewEntry({
                      website: "",
                      username: "",
                      password: "",
                      masterPassword: "",
                    });
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Website
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedEntry.website}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Username
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedEntry.username}
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="new-password"
                    className="block text-sm font-medium text-gray-700"
                  >
                    New Password
                  </label>
                  <div className="mt-1 flex space-x-2">
                    <input
                      type="password"
                      id="new-password"
                      required
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      value={newEntry.password}
                      onChange={(e) =>
                        setNewEntry({ ...newEntry, password: e.target.value })
                      }
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setNewEntry({
                          ...newEntry,
                          password: generatePassword(),
                        })
                      }
                      className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                    >
                      Generate
                    </button>
                  </div>
                  {newEntry.password && (
                    <div className="mt-1 flex items-center space-x-2">
                      <span className="text-xs text-gray-500">Strength:</span>
                      <span
                        className={`text-xs font-medium ${
                          checkPasswordStrength(newEntry.password).color
                        }`}
                      >
                        {checkPasswordStrength(newEntry.password).label}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="master-password"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Master Password
                  </label>
                  <input
                    type="password"
                    id="master-password"
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={newEntry.masterPassword}
                    onChange={(e) =>
                      setNewEntry({
                        ...newEntry,
                        masterPassword: e.target.value,
                      })
                    }
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  {loading ? <LoadingSpinner /> : "Update Password"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </AuthCheck>
  );
}
