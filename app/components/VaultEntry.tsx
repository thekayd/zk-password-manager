import React from "react";

interface VaultEntryProps {
  entry: {
    id: string;
    _id: string;
    website: string;
    username: string;
    encrypted_password: string;
    created_at: string;
  };
  onView: (entry: any) => void;
  onEdit: (entry: any) => void;
  onDelete: (entry: any) => void;
}

export default function VaultEntry({
  entry,
  onView,
  onEdit,
  onDelete,
}: VaultEntryProps) {
  const getWebsiteIcon = (website: string) => {
    const domain = website.toLowerCase();
    return "🌐";
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">{getWebsiteIcon(entry.website)}</div>
          <div>
            <h3 className="font-medium text-gray-900">{entry.website}</h3>
            <p className="text-sm text-gray-500">{entry.username}</p>
            <p className="text-xs text-gray-400">
              Created {new Date(entry.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => onView(entry)}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
          >
            View
          </button>
          <button
            onClick={() => onEdit(entry)}
            className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(entry)}
            className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
