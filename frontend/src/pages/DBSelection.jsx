import { useState, useRef, useEffect } from "react";
import CreateDatabaseModal from "../components/CreateDatabaseModal";

import { useNavigate } from "react-router-dom";
import VoiceSearchModal from "../components/VoiceSearchModal";
import Loader from "../components/ui/Loader";
import DbPreviewOption from "../components/ui/Db-preview";
import api from "../services/api";
import { useTheme } from "../contexts/ThemeContext";

const DatabaseDashboard = () => {
  const navigate = useNavigate();
  const { isDarkMode: darkMode } = useTheme();
  const [databases, setDatabases] = useState([]);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [showVoiceModal1, setShowVoiceModal1] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [processingVoice, setProcessingVoice] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
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



  const handleVoiceSearch = () => {
    // Make sure we have databases loaded before opening the modal
    if (databases.length === 0 && !isLoading) {
      fetchDatabases().then(() => {
        setShowVoiceModal1(true);
      });
    } else {
      setShowVoiceModal1(true);
    }
  };
  const handleCloseVoiceModal = () => {
    setShowVoiceModal1(false);
  };
  // Add database refresh on modal close to update list when new database is added or connected
  const handleModalClose = () => {
    fetchDatabases();
  };
  const handleDatabaseFound = async (dbId) => {
    console.log("Database found:", dbId);
    navigateToDatabase(dbId);
  };

  const handleDbVoiceQuery = (dbId, query) => {
    setProcessingVoice(true);

    if (!dbId) {
      setProcessingVoice(false);
      setErrorMessage("Database ID not found. Please try again.");
      return;
    }
    // Check if query is empty
    if (!query) {
      console.error("Query is empty");
      setProcessingVoice(false);
      setErrorMessage("Query cannot be empty. Please try again.");
      return;
    }
    // Make an API call to the backend database service
    api.post(`/query/`, { 
      query: query,
      collection_name: dbId,
      schema_context: "Mock Schema"
    })
      .then((response) => {
        return response.data;
      })
      .then((response) => {
        console.log("Database query successful:", response.data);
        setProcessingVoice(false);

        // Save the data to sessionStorage
        try {
          sessionStorage.setItem(
            "visualizationData",
            JSON.stringify(response.data),
          );
          console.log(sessionStorage.getItem("visualizationData"));
          console.log("Data saved to sessionStorage successfully");
        } catch (err) {
          console.error("Error saving to sessionStorage:", err);
          // If storage fails, continue with navigation anyway
        }

        // On success, navigate to the choice page
        navigate("/table", { state: { visualizationData: response.data } });
      })
      .catch((error) => {
        console.error("Error processing database query:", error);
        setProcessingVoice(false);

        // Show failure message
        setErrorMessage("Database query failed. Please try again.");

        // Clear error message after 5 seconds
        setTimeout(() => {
          setErrorMessage("");
        }, 5000);
      });
  };
  const navigateToDatabase = async (dbId) => {
    try {
      console.log("Selected DB ID:", dbId);

      const response = await api.get(`/database/db-info/${dbId}`);
      const dbInfo = response.data;
      
      console.log("Database Info:", dbInfo);
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
  const [activeDbId, setActiveDbId] = useState(null);
  const handleVoiceInput = (dbId) => {
    setActiveDbId(dbId);
    setShowVoiceModal(true);
  };

  // Voice Search Modal Component
  const VoiceSearchModal1 = ({
    darkMode,
    onClose,
    onDatabaseFound,
    databases,
  }) => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [message, setMessage] = useState("Click to start speaking");
    const [matchedDbs, setMatchedDbs] = useState([]);
    const recognitionRef = useRef(null);
    const latestTranscriptRef = useRef(""); // Store latest transcript for use in callbacks

    // Debug logging
    useEffect(() => {
      if (databases && databases.length > 0) {
        console.log(
          "Available databases:",
          databases.map((db) => db.name),
        );
      }
    }, [databases]);

    useEffect(() => {
      // Check if browser supports SpeechRecognition
      if (
        !("webkitSpeechRecognition" in window) &&
        !("SpeechRecognition" in window)
      ) {
        setMessage("Voice recognition is not supported in your browser.");
        return;
      }

      // Initialize speech recognition
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = navigator.language || "en-US";

      recognition.onstart = () => {
        setIsListening(true);
        setMessage("Listening...");
        setMatchedDbs([]);
        latestTranscriptRef.current = ""; // Reset transcript reference
      };

      recognition.onresult = (event) => {
        const current = event.resultIndex;
        const transcriptText = event.results[current][0].transcript.trim();
        console.log("Transcript received:", transcriptText);

        // Update both state and ref
        setTranscript(transcriptText);
        latestTranscriptRef.current = transcriptText;

        // Find potential matches as user speaks
        if (databases && databases.length > 0) {
          const searchText = transcriptText.toLowerCase();
          const potentialMatches = databases.filter(
            (db) =>
              db.name.toLowerCase().includes(searchText) ||
              searchText.includes(db.name.toLowerCase()),
          );

          console.log(
            "Potential matches found:",
            potentialMatches.map((db) => db.name),
          );
          setMatchedDbs(potentialMatches);
        }
      };

      recognition.onend = () => {
        setIsListening(false);

        // Use the ref value instead of state to ensure we have latest transcript
        const currentTranscript = latestTranscriptRef.current;
        console.log("Recognition ended with transcript:", currentTranscript);
        console.log("Current databases available:", databases);

        if (currentTranscript && databases && databases.length > 0) {
          setMessage("Processing...");
          console.log("Processing final transcript:", currentTranscript);

          // Find exact or best match with more lenient matching
          const cleanTranscript = currentTranscript.toLowerCase().trim();
          console.log("Cleaned transcript:", cleanTranscript);

          // Try exact match first
          const exactMatch = databases.find(
            (db) => db.name.toLowerCase() === cleanTranscript,
          );
          console.log("Exact match result:", exactMatch);

          // Try searching for the database name in the transcript
          const includedMatch = exactMatch
            ? null
            : databases.find((db) =>
                cleanTranscript.includes(db.name.toLowerCase()),
              );
          console.log("Included match result:", includedMatch);

          // Try searching for transcript in the database name
          const reversedMatch =
            !exactMatch && !includedMatch
              ? databases.find((db) =>
                  db.name.toLowerCase().includes(cleanTranscript),
                )
              : null;
          console.log("Reversed match result:", reversedMatch);

          const bestMatch = exactMatch || includedMatch || reversedMatch;
          console.log("Best match determined:", bestMatch);

          if (bestMatch) {
            console.log(
              "Found matching database:",
              bestMatch.name,
              "with ID:",
              bestMatch.id,
            );
            setMessage(`Found database: ${bestMatch.name}`);

            // Short delay before closing modal and navigating
            const matchId = bestMatch.id; // Store ID locally to ensure it's available in timeout

            setTimeout(() => {
              console.log("Navigation timeout triggered for ID:", matchId);
              onClose();
              onDatabaseFound(matchId);
            }, 1000);
          } else {
            // Check for any potential matches from the latest state
            const currentMatches = databases.filter(
              (db) =>
                db.name.toLowerCase().includes(cleanTranscript) ||
                cleanTranscript.includes(db.name.toLowerCase()),
            );

            if (currentMatches && currentMatches.length > 0) {
              console.log(
                "Found similar matches:",
                currentMatches.map((db) => `${db.name} (${db.id})`),
              );
              setMatchedDbs(currentMatches); // Update matched DBs state
              setMessage(
                `Found ${currentMatches.length} similar matches. Click one to select.`,
              );
            } else {
              console.log(
                "No matches found for transcript:",
                currentTranscript,
              );
              console.log(
                "Available databases:",
                databases
                  ? databases.map((db) => `${db.name} (${db.id})`)
                  : "None",
              );
              setMessage("No matching database found. Please try again.");
            }
          }
        } else {
          setMessage("Click to start speaking");
        }
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
        setMessage(`Error occurred: ${event.error}`);
      };

      // Store recognition instance
      recognitionRef.current = recognition;

      // Cleanup
      return () => {
        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
          } catch (err) {
            // Ignore errors when stopping recognition on cleanup
          }
        }
      };
    }, [databases, onClose, onDatabaseFound]);

    // Start listening function
    const startListening = () => {
      setTranscript("");
      setMatchedDbs([]);
      latestTranscriptRef.current = "";

      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (err) {
          console.error("Failed to start recognition:", err);
          // Recreate recognition instance if there's an error
          resetRecognition();
          // Try starting again
          recognitionRef.current.start();
        }
      }
    };

    // Reset recognition instance
    const resetRecognition = () => {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();

      // Set up event handlers again
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = navigator.language || "en-US";

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setMessage("Listening...");
        latestTranscriptRef.current = "";
      };

      recognitionRef.current.onresult = (event) => {
        const current = event.resultIndex;
        const transcriptText = event.results[current][0].transcript.trim();
        console.log("Transcript received:", transcriptText);
        setTranscript(transcriptText);
        latestTranscriptRef.current = transcriptText;

        // Find potential matches
        if (databases && databases.length > 0) {
          const searchText = transcriptText.toLowerCase();
          const potentialMatches = databases.filter(
            (db) =>
              db.name.toLowerCase().includes(searchText) ||
              searchText.includes(db.name.toLowerCase()),
          );
          setMatchedDbs(potentialMatches);
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        const currentTranscript = latestTranscriptRef.current;
        if (currentTranscript && databases && databases.length > 0) {
          processTranscript(currentTranscript);
        } else {
          setMessage("Click to start speaking");
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
        setMessage(`Error occurred: ${event.error}`);
      };
    };

    const processTranscript = (currentTranscript) => {
      if (!currentTranscript || !databases || databases.length === 0) return;

      setMessage("Processing...");
      console.log("Processing transcript:", currentTranscript);

      // Find exact or best match with more lenient matching
      const cleanTranscript = currentTranscript.toLowerCase().trim();

      // Try exact match first
      const exactMatch = databases.find(
        (db) => db.name.toLowerCase() === cleanTranscript,
      );

      // Try searching for the database name in the transcript
      const includedMatch = exactMatch
        ? null
        : databases.find((db) =>
            cleanTranscript.includes(db.name.toLowerCase()),
          );

      // Try searching for transcript in the database name
      const reversedMatch =
        !exactMatch && !includedMatch
          ? databases.find((db) =>
              db.name.toLowerCase().includes(cleanTranscript),
            )
          : null;

      const bestMatch = exactMatch || includedMatch || reversedMatch;

      if (bestMatch) {
        console.log("Found matching database:", bestMatch.name);
        setMessage(`Found database: ${bestMatch.name}`);
        // Short delay before closing modal and navigating
        setTimeout(() => {
          onClose();
          console.log("Navigating to database ID:", bestMatch.id);
          onDatabaseFound(bestMatch.id);
        }, 1000);
      } else {
        // Find any potential matches
        const potentialMatches = databases.filter(
          (db) =>
            db.name.toLowerCase().includes(cleanTranscript) ||
            cleanTranscript.includes(db.name.toLowerCase()),
        );

        if (potentialMatches.length > 0) {
          console.log(
            "Found similar matches:",
            potentialMatches.map((db) => db.name),
          );
          setMatchedDbs(potentialMatches);
          setMessage(
            `Found ${potentialMatches.length} similar matches. Click one to select.`,
          );
        } else {
          console.log("No matches found for:", currentTranscript);
          console.log(
            "Available databases:",
            databases.map((db) => db.name),
          );
          setMessage("No matching database found. Please try again.");
        }
      }
    };

    const stopListening = () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (err) {
          console.error("Error stopping recognition:", err);
        }
      }
      setIsListening(false);
    };

    const toggleListening = () => {
      if (isListening) {
        stopListening();
      } else {
        startListening();
      }
    };

    const selectDatabase = (dbId) => {
      const selectedDb = databases.find((db) => db.id === dbId);
      if (selectedDb) {
        console.log("User selected database:", selectedDb.name);
        setMessage(`Selected database: ${selectedDb.name}`);
        setTimeout(() => {
          onClose();
          onDatabaseFound(dbId);
        }, 500);
      }
    };

    return (
      <div className="fixed inset-0 bg-transparent bg-opacity-50 flex items-center justify-center z-50">
        <div
          className={`rounded-lg p-6 max-w-md w-full ${darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800"}`}
        >
          <h2 className="text-lg font-bold mb-4">
            Voice Database Search
          </h2>

          <div className="flex flex-col items-center space-y-4">
            <button
              onClick={toggleListening}
              className={`p-4 rounded-full ${
                isListening
                  ? darkMode
                    ? "bg-red-600 animate-pulse"
                    : "bg-red-500 animate-pulse"
                  : darkMode
                    ? "bg-blue-600"
                    : "bg-blue-500"
              } text-white`}
              aria-label={isListening ? "Stop listening" : "Start listening"}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
            </button>

            <p className="text-sm">{message}</p>

            {transcript && (
              <div
                className={`mt-4 p-3 rounded-lg w-full ${darkMode ? "bg-gray-700" : "bg-transparent"}`}
              >
                <p className="text-sm font-medium">
                  You said:
                </p>
                <p className="text-md">{transcript}</p>
              </div>
            )}

            {matchedDbs.length > 0 && (
              <div
                className={`mt-2 w-full ${darkMode ? "text-white" : "text-gray-800"}`}
              >
                <p className="text-sm font-medium mb-2">
                  Possible matches:
                </p>
                <div className="max-h-40 overflow-y-auto">
                  {matchedDbs.map((db) => (
                    <div
                      key={db.id}
                      onClick={() => selectDatabase(db.id)}
                      className={`p-2 mb-1 rounded cursor-pointer ${
                        darkMode
                          ? "bg-gray-700 hover:bg-gray-600"
                          : "bg-transparent hover:bg-gray-200"
                      }`}
                    >
                      {db.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end mt-6">
            <button
              onClick={onClose}
              className={`px-3 py-1 text-sm rounded-lg ${
                darkMode
                  ? "bg-gray-700 hover:bg-gray-600"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              Cancel
            </button>
          </div>
        </div>
        </div>
    );
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
      {processingVoice && (
        <div className="fixed inset-0 flex items-center justify-center bg-transparent bg-opacity-50 z-50">
          <Loader />
        </div>
      )}

      {showCreateModal && (
        <CreateDatabaseModal
          darkMode={darkMode}
          onClose={() => {
            setShowCreateModal(false);
            handleModalClose();
          }}
        />
      )}

      {/* Voice Search Modal */}
      {showVoiceModal1 && (
        <VoiceSearchModal1
          darkMode={darkMode}
          onClose={handleCloseVoiceModal}
          onDatabaseFound={handleDatabaseFound}
          databases={databases}
          
        />
      )}
      {showVoiceModal && (
        <VoiceSearchModal
          open={showVoiceModal}
          onClose={() => setShowVoiceModal(false)}
          onQuery={(transcript) => {
            setShowVoiceModal(false);
            handleDbVoiceQuery(activeDbId, transcript); // Now properly passes both parameters
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
