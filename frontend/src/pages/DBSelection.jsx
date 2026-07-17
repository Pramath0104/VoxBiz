import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import CreateDatabaseModal from "../components/CreateDatabaseModal";
import DbPreviewOption from "../components/ui/Db-preview";

import { useTheme } from "../contexts/ThemeContext";
import api from "../services/api";

const DatabaseDashboard = () => {
  const navigate = useNavigate();
  const { isDarkMode: darkMode } = useTheme();
  const [databases, setDatabases] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [, setErrorMessage] = useState("");
  const [dbToDelete, setDbToDelete] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [previewTableData, setPreviewTableData] = useState(null);
  const [previewDbName, setPreviewDbName] = useState("");

  const [pagination, setPagination] = useState({ page: 1, total_pages: 1 });

  const fetchDatabases = async (page = 1) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get(`/database/list?page=${page}&page_size=50`);
      // The API now returns a paginated object: { data, page, total_pages, ... }
      if (response.data && response.data.data) {
        setDatabases(response.data.data);
        setPagination({ 
          page: response.data.page, 
          total_pages: response.data.total_pages 
        });
      } else {
        // Fallback in case of old API response
        setDatabases(response.data || []);
      }
    } catch (err) {
      console.error("Error fetching databases:", err);
      setError("Failed to load databases. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch of databases on component mount
  useEffect(() => {
    fetchDatabases();
  }, []);

  // Initialize from localStorage on component mount


  const handleCreateDatabase = () => {
    setShowCreateModal(true);
  };



  // Add database refresh on modal close to update list when new database is added or connected
  const handleModalClose = () => {
    fetchDatabases();
  };


  const navigateToDatabase = async (dbId) => {
    try {

      const response = await api.get(`/database/db-info/${dbId}`);
      const dbInfo = response.data;
      
      navigate(`/database/${dbId}`, { state: { dbInfo } });
    } catch (error) {
      console.error("Error navigating to database:", error);
    }
  };

  const handleViewData = async (dbId, dbName) => {
    try {
      setIsLoading(true);
      const response = await api.get(`/database/${dbId}/data`);
      setPreviewTableData(response.data.data || []);
      setPreviewDbName(dbName);
    } catch (error) {
      console.error("Error fetching database data:", error);
      setErrorMessage("Failed to fetch database data. Please try again.");
      setTimeout(() => setErrorMessage(""), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const confirmDeleteDatabase = async () => {
    if (!dbToDelete) return;
    
    try {
      setIsLoading(true);
      await api.delete(`/database/${dbToDelete.id}`);
      setShowDeleteConfirm(false);
      setDbToDelete(null);
      await fetchDatabases();
    } catch (error) {
      console.error("Error deleting database:", error);
      setErrorMessage("Failed to delete database. Please try again.");
      setTimeout(() => setErrorMessage(""), 5000);
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <>
<div className="flex-grow relative">


        <div className="container mx-auto px-2 py-4">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-lg font-bold">Database Access Selection</h1>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigate("/database/hub")}
                className={`px-3 py-1.5 text-sm font-semibold rounded-lg shadow-sm border ${
                  darkMode
                    ? "bg-indigo-600 hover:bg-indigo-700 border-indigo-500"
                    : "bg-indigo-500 hover:bg-indigo-600 border-indigo-400"
                } text-white transition-colors duration-200 flex items-center gap-1`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Open Query Desk
              </button>
              
              <button
                onClick={handleCreateDatabase}
                className={`px-2 py-1.5 text-sm font-semibold rounded-lg shadow-sm border ${
                  darkMode
                    ? "bg-blue-600 hover:bg-blue-700 border-blue-500"
                    : "bg-blue-500 hover:bg-blue-600 border-blue-400"
                } text-white transition-colors duration-200`}
              >
                Create New Table
              </button>
            </div>
          </div>

          <div
            className={`rounded-xl overflow-hidden shadow-[0_4px_30px_rgba(0,0,0,0.1)] backdrop-blur-md border ${
              darkMode ? "bg-gray-900/50 border-gray-700/50" : "bg-white/50 border-white/50"
            }`}
          >
            {isLoading ? (
              <div className="p-6 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-t-transparent border-b-transparent border-l-gray-300 border-r-gray-300"></div>
                <p className="mt-2 text-sm">Loading databases...</p>
              </div>
            ) : error ? (
              <div className="p-4 text-center text-red-500">
                <p>{error}</p>
                <button
                  onClick={fetchDatabases}
                  className="mt-2 text-sm underline hover:no-underline"
                >
                  Retry
                </button>
              </div>
            ) : databases.length > 0 ? (
              <>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className={darkMode ? "bg-gray-800/50" : "bg-gray-100/50"}>
                  <tr>
                    <th className="px-3 py-3 text-left text-xxs font-medium uppercase tracking-wider">
                      Database Name
                    </th>
                    <th className="px-3 py-3 text-left text-xxs font-medium uppercase tracking-wider">
                      Access Level
                    </th>
                    <th className="px-3 py-3 text-left text-xxs font-medium uppercase tracking-wider">
                      Last Accessed
                    </th>
                    <th className="px-3 py-3 text-left text-xxs font-medium uppercase tracking-wider">
                      Preview
                    </th>
                    <th className="px-3 py-3 text-left text-xxs font-medium uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody
                  className={`divide-y ${darkMode ? "divide-gray-700/50" : "divide-gray-200/50"}`}
                >
                  {databases.map((db) => (
                    <tr
                      key={db.id}
                      onClick={() => navigateToDatabase(db.id)}
                      className={`cursor-pointer transition-colors ${
                        darkMode ? "hover:bg-gray-800/50" : "hover:bg-white/50"
                      }`}
                    >
                      <td className="px-3 py-4 text-xs whitespace-nowrap">
                        {db.name}
                      </td>
                      <td className="px-3 py-4 text-xs whitespace-nowrap">
                        <span
                          className={`px-1 py-0.5 inline-flex text-xxs leading-4 font-semibold rounded-full ${
                            db.permissions === "readOnly"
                              ? darkMode
                                ? "bg-yellow-800 text-yellow-100"
                                : "bg-yellow-100 text-yellow-800"
                              : darkMode
                                ? "bg-green-800 text-green-100"
                                : "bg-green-100 text-green-800"
                          }`}
                        >
                          {db.permissions === "readOnly"
                            ? "Read Only"
                            : "Read / Write"}
                        </span>
                      </td>
                      <td className="px-3 py-4 text-xs whitespace-nowrap">
                        {new Date(db.lastAccessed).toLocaleDateString()}
                      </td>
                      <td className="px-3 py-4 text-xs whitespace-nowrap">
                        <DbPreviewOption
                          dbId={db.id}
                          dbName={db.name}
                          darkMode={darkMode}
                        />
                      </td>
                      <td className="px-3 py-4 text-xs whitespace-nowrap">
                        <div className="flex items-center space-x-8">
                          {/* View Data Button */}
                          
                          {/* View Data Button */}
                          <div className="relative group">
                            <button
                              onClick={() => handleViewData(db.id, db.name)}
                              className={`p-1 rounded ${
                                darkMode
                                  ? "bg-emerald-600 hover:bg-emerald-700"
                                  : "bg-emerald-500 hover:bg-emerald-600"
                              } text-white`}
                              title="View Data"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            {/* Tooltip */}
                            <div className={`absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-2 py-1 text-xs rounded whitespace-nowrap hidden group-hover:block z-40 ${darkMode ? "bg-gray-700 text-white" : "bg-gray-800 text-white"}`}>
                              View Data
                              <div className={`absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent ${darkMode ? "border-t-gray-700" : "border-t-gray-800"}`}></div>
                            </div>
                          </div>

                          {/* Delete Button */}
                          <div className="relative group">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDbToDelete(db);
                                setShowDeleteConfirm(true);
                              }}
                              className={`p-1 rounded ${
                                darkMode
                                  ? "bg-red-900/50 hover:bg-red-800 text-red-400"
                                  : "bg-red-100 hover:bg-red-200 text-red-600"
                              } transition-colors`}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                            {/* Tooltip */}
                            <div
                              className={`absolute right-0 bottom-full mb-2 px-2 py-1 text-xs rounded whitespace-nowrap hidden group-hover:block z-40 ${
                                darkMode
                                  ? "bg-gray-700 text-white"
                                  : "bg-gray-800 text-white"
                              }`}
                            >
                              Delete database
                              <div
                                className={`absolute top-full right-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent ${
                                  darkMode
                                    ? "border-t-gray-700"
                                    : "border-t-gray-800"
                                }`}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* Pagination Controls */}
              {pagination && pagination.total_pages > 1 && (
                <div className="flex justify-between items-center p-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => fetchDatabases(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className={`px-3 py-1 rounded text-sm ${
                      pagination.page <= 1 
                        ? "opacity-50 cursor-not-allowed" 
                        : darkMode ? "bg-gray-700 hover:bg-gray-600 text-white" : "bg-gray-200 hover:bg-gray-300"
                    }`}
                  >
                    Previous
                  </button>
                  <span className="text-sm">
                    Page {pagination.page} of {pagination.total_pages}
                  </span>
                  <button
                    onClick={() => fetchDatabases(pagination.page + 1)}
                    disabled={pagination.page >= pagination.total_pages}
                    className={`px-3 py-1 rounded text-sm ${
                      pagination.page >= pagination.total_pages 
                        ? "opacity-50 cursor-not-allowed" 
                        : darkMode ? "bg-gray-700 hover:bg-gray-600 text-white" : "bg-gray-200 hover:bg-gray-300"
                    }`}
                  >
                    Next
                  </button>
                </div>
              )}
              </>
            ) : (
              <div className="p-3 text-xs text-center">
                No connections available
              </div>
            )}
          </div>
        </div>
      </div>

      {showCreateModal && (
        <CreateDatabaseModal
          darkMode={darkMode}
          onClose={() => {
            setShowCreateModal(false);
            handleModalClose();
          }}
        />
      )}



      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity">
          <div className={`${darkMode ? "bg-gray-800 text-white border-gray-600 shadow-[0_0_15px_rgba(255,255,255,0.1)]" : "bg-white text-gray-800 border-gray-300 shadow-[0_0_20px_rgba(0,0,0,0.2)]"} border-2 p-6 rounded-xl max-w-sm w-full mx-4`}>
            <h2 className="text-xl font-bold mb-4">Confirm Deletion</h2>
            <p className="mb-6">Are you sure you want to delete the database <strong>{dbToDelete?.name}</strong>? This action cannot be undone.</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => { setShowDeleteConfirm(false); setDbToDelete(null); }}
                className={`px-4 py-2 rounded ${darkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300"}`}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteDatabase}
                className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Data Preview Modal */}
      {previewTableData && (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity">
          <div className={`${darkMode ? "bg-gray-800 text-white border-gray-600 shadow-[0_0_15px_rgba(255,255,255,0.1)]" : "bg-white text-gray-800 border-gray-300 shadow-[0_0_20px_rgba(0,0,0,0.2)]"} border-2 rounded-xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden`}>
            <div className={`p-4 border-b flex justify-between items-center ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
              <h2 className="text-xl font-bold">Data Preview: {previewDbName}</h2>
              <button 
                onClick={() => { setPreviewTableData(null); setPreviewDbName(""); }}
                className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-0 overflow-auto flex-1">
              {previewTableData.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className={`sticky top-0 shadow-sm ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
                    <tr>
                      {Object.keys(previewTableData[0] || {}).map((key) => (
                        <th key={key} className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${darkMode ? "divide-gray-700" : "divide-gray-200"}`}>
                    {previewTableData.slice(0, 100).map((row, i) => (
                      <tr key={i} className={darkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"}>
                        {Object.keys(previewTableData[0] || {}).map((key, j) => (
                          <td key={j} className="px-6 py-4 text-sm whitespace-nowrap">
                            {row[key] !== null && row[key] !== undefined ? String(row[key]) : ""}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-8 text-center text-gray-500">No data found in this database.</div>
              )}
            </div>
            {previewTableData.length > 100 && (
              <div className={`p-3 text-sm text-center border-t ${darkMode ? "border-gray-700 text-gray-400" : "border-gray-200 text-gray-500"}`}>
                Showing top 100 rows for preview.
              </div>
            )}
          </div>
        </div>
      )}
</>
  );
};

export default DatabaseDashboard;
