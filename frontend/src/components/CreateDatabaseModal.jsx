import React, { useCallback,useState } from "react";
import { useDropzone } from "react-dropzone";

import api from "../services/api"; // Secure instance pointing to FastAPI
import DocButton from "./ui/Document";
import Loader from "./ui/Loader";

const CreateDatabaseModal = ({ darkMode, onClose }) => {
  const [step, setStep] = useState("excel");
  const [file, setFile] = useState(null);
  const [uploadMode, setUploadMode] = useState("file"); // "file" or "sql"
  const [sqlQuery, setSqlQuery] = useState("");
  const [formData, setFormData] = useState({
    dbName: "",
  });
  const [error, setError] = useState("");

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setStep("form");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
      "application/vnd.ms-excel": [".xls"],
      "text/csv": [".csv"],
    },
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const submitForm = async (e) => {
    e.preventDefault();
    setError("");
    setStep("loading");

    try {
      let response;
      if (uploadMode === "sql") {
        response = await api.post("/database/upload-sql", {
          dbName: formData.dbName,
          query: sqlQuery
        });
      } else {
        const formPayload = new FormData();
        formPayload.append("file", file);
        formPayload.append("dbName", formData.dbName);

        response = await api.post("/database/upload-csv", formPayload, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      }

      if (response.data && response.data.success) {
        setStep("success");
      }
    } catch (error) {
      console.error("Error submitting data:", error);
      setError(
        error.response?.data?.detail ||
          "Failed to process your request. Please try again."
      );
      setStep("form");
    }
  };

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center z-50 bg-transparent bg-opacity-50`}
    >
      <div
        className={`relative w-full max-w-2xl mx-2 md:mx-auto p-6 rounded-lg shadow-xl ${darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"}`}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <h2 className="text-xl font-bold mb-4">Create Database Table</h2>

        {error && (
          <div
            className={`p-3 mb-4 rounded-md ${darkMode ? "bg-red-900 text-red-100" : "bg-red-100 text-red-800"}`}
          >
            {error}
          </div>
        )}

        <div className={`flex mb-6 border-b ${darkMode ? "border-gray-600" : "border-gray-300"}`}>
          <button
            className={`py-2 px-4 ${uploadMode === "file" ? "border-b-2 border-blue-500 font-bold" : "text-gray-500 hover:text-gray-700"}`}
            onClick={() => setUploadMode("file")}
          >
            File Upload
          </button>
          <button
            className={`py-2 px-4 ${uploadMode === "sql" ? "border-b-2 border-blue-500 font-bold" : "text-gray-500 hover:text-gray-700"}`}
            onClick={() => setUploadMode("sql")}
          >
            SQL Query
          </button>
        </div>

        {step === "excel" && uploadMode === "file" && (
          <div>
            <div
              className={`mb-6 p-4 rounded-lg ${darkMode ? "bg-blue-900 text-blue-100" : "bg-blue-100 text-blue-800"}`}
            >
              <h3 className="font-bold mb-2">Upload Your Excel or CSV File</h3>
              <p className="mb-2">
                Please upload your data file and we'll securely create a new database
                table tied to your account.
              </p>
            </div>

            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-6 mb-4 text-center cursor-pointer ${darkMode ? "border-gray-600 hover:border-gray-500" : "border-gray-300 hover:border-gray-400"}`}
            >
              <input {...getInputProps()} />
              {file ? (
                <p>Selected file: {file.name}</p>
              ) : isDragActive ? (
                <p>Drop the file here...</p>
              ) : (
                <div className="flex flex-col items-center justify-center">
                  <p className="mb-2">
                    Drag and drop your Excel/CSV file here, or click to upload
                  </p>
                  <DocButton text="Choose File" />
                </div>
              )}
            </div>

            {file && (
              <button
                onClick={() => {
                  setError(""); // Clear any existing errors
                  setStep("form");
                }}
                className={`w-full py-2 rounded-lg ${darkMode ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-500 hover:bg-blue-600"} text-white`}
              >
                {error ? "Retry" : "Continue"}
              </button>
            )}
          </div>
        )}

        {step === "excel" && uploadMode === "sql" && (
          <div>
            <div className={`mb-4 p-4 rounded-lg ${darkMode ? "bg-blue-900 text-blue-100" : "bg-blue-100 text-blue-800"}`}>
              <h3 className="font-bold mb-2">Paste SQL Query</h3>
              <p className="text-sm">Type or paste your INSERT INTO statements here.</p>
            </div>
            <textarea
              className={`w-full h-40 p-3 rounded-lg border font-mono text-sm ${darkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white text-gray-900 border-gray-300"}`}
              placeholder="INSERT INTO my_table (name, status) VALUES ('Generator A', 'Online');"
              value={sqlQuery}
              onChange={(e) => setSqlQuery(e.target.value)}
            />
            {sqlQuery.trim() && (
              <button
                onClick={() => {
                  setError("");
                  setStep("form");
                }}
                className={`w-full py-2 mt-4 rounded-lg ${darkMode ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-500 hover:bg-blue-600"} text-white`}
              >
                Continue
              </button>
            )}
          </div>
        )}

        {step === "form" && (
          <form
            onSubmit={(e) => {
              submitForm(e);
            }}
          >
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Database / Table Name
                </label>
                <input
                  type="text"
                  name="dbName"
                  value={formData.dbName}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g. Q3 Sales Data"
                  className={`w-full px-3 py-2 rounded-md ${darkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white text-gray-900 border-gray-300"} border`}
                />
              </div>
            </div>

            <button
              type="submit"
              className={`w-full py-2 rounded-lg ${darkMode ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-500 hover:bg-blue-600"} text-white`}
            >
              {error ? "Retry Upload" : "Upload and Create Table"}
            </button>
          </form>
        )}

        {step === "loading" && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader size="large" />
            <p className="mt-4">Processing and uploading your data...</p>
          </div>
        )}

        {step === "success" && (
          <div className="text-center py-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 mx-auto text-green-500 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <h3 className="text-xl font-bold mb-2">
              Database Created Successfully!
            </h3>
            <p className="mb-4">
              Your new data table is ready and successfully linked to your account.
            </p>
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-lg ${darkMode ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-500 hover:bg-blue-600"} text-white`}
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateDatabaseModal;
