import React, { useState } from "react";
import { Edit, Save, Database } from "lucide-react";
import api from "../services/api";
import toast from "react-hot-toast";

const DatabaseCredentials = ({ dbId, credentials, setCredentials, darkMode }) => {
  const [isEditing, setIsEditing] = useState(false);

  const handleCredentialChange = (e) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const saveCredentials = async () => {
    try {
      if (!dbId) {
        throw new Error("Database ID not found");
      }
      
      await api.put(`/database/${dbId}/permissions`, { 
        permissions: credentials.permissions 
      });
      
      setIsEditing(false);
      toast.success("Database permissions updated successfully", {
        style: {
          background: darkMode ? "#333" : "#fff",
          color: darkMode ? "#fff" : "#333",
        },
      });
    } catch (err) {
      console.error("Error saving credentials:", err);
      toast.error("Failed to update database permissions", {
        style: {
          background: darkMode ? "#333" : "#fff",
          color: darkMode ? "#fff" : "#333",
        },
      });
      
      // Revert changes on error if needed
      // (Optional: fetch fresh info here to reset)
    }
  };

  return (
    <div className={`rounded-xl p-6 ${darkMode ? "bg-slate-800" : "bg-white shadow"}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">{"Database Credentials"}</h2>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className={`flex items-center gap-1 px-3 py-1 rounded ${
              darkMode ? "bg-slate-700 hover:bg-slate-600" : "bg-transparent hover:bg-gray-200"
            }`}
          >
            <Edit className="h-4 w-4" />
            <span>{"Edit"}</span>
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(false)}
              className={`px-3 py-1 rounded ${
                darkMode ? "bg-slate-700 hover:bg-slate-600" : "bg-transparent hover:bg-gray-200"
              }`}
            >
              {"Cancel"}
            </button>
            <button
              onClick={saveCredentials}
              className="flex items-center gap-1 px-3 py-1 rounded bg-indigo-500 hover:bg-indigo-600 text-white"
            >
              <Save className="h-4 w-4" />
              <span>{"Save"}</span>
            </button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
            {"Connection String"}
          </label>
          {isEditing ? (
            <input
              type="text"
              name="connectionString"
              value={credentials.connectionString}
              disabled
              className={`w-full p-2 rounded border opacity-70 cursor-not-allowed ${
                darkMode ? "bg-slate-700 border-slate-600 text-gray-400" : "bg-gray-100 border-gray-300 text-gray-500"
              }`}
            />
          ) : (
            <div className="flex items-center">
              <Database className="h-4 w-4 mr-2 text-gray-400" />
              <span className="text-sm font-mono">{credentials.connectionString}</span>
            </div>
          )}
        </div>

        <div>
          <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
            {"Permissions"}
          </label>
          {isEditing ? (
            <select
              name="permissions"
              value={credentials.permissions}
              onChange={handleCredentialChange}
              className={`w-full p-2 rounded border ${
                darkMode ? "bg-slate-700 border-slate-600 text-white" : "bg-white border-gray-300"
              }`}
            >
              <option value="readOnly">{"Read Only"}</option>
              <option value="readWrite">{"Read / Write"}</option>
            </select>
          ) : (
            <div
              className={`inline-flex items-center px-2 py-1 rounded ${
                credentials.permissions === "readWrite"
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
              }`}
            >
              {credentials.permissions === "readWrite" ? "Read / Write" : "Read Only"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DatabaseCredentials;
