import React, { useState, useEffect, useRef } from "react";
import Loader from "../components/ui/Loader";
import { 
  ToggleButtonGroup, 
  ToggleButton, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel,
  Box,
  Typography
} from "@mui/material";
import LanguageIcon from "@mui/icons-material/Language";
import StorageIcon from "@mui/icons-material/Storage";
// Import icons
import {
  Mic,
  Edit,
  Save,
  Database,
  Key,
  Lock,
  Cog,
  Send,
  MessageSquare,
} from "lucide-react";
import VoiceSearchModal from "../components/VoiceSearchModal";
import MutationPreviewModal from "../components/MutationPreviewModal";
import DatabaseCredentials from "../components/DatabaseCredentials";
import { useLocation, Link, useNavigate, useParams } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import api from "../services/api";
import { 
  analyzeQueryForClarification, 
  generateEnhancedJoinQuery, 
  generateDuplicateHandlingQuery, 
  handleDuplicateDataClarification 
} from "../services/queryAnalysisService";

const DatabaseDetailsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: routeDbId } = useParams();
  const dbInfo = location.state?.dbInfo || {};
  
  const isHubMode = routeDbId === "hub";
  const [queryMode, setQueryMode] = useState("global");
  const [availableDbs, setAvailableDbs] = useState([]);
  const [selectedDbId, setSelectedDbId] = useState("");

  const dbId = isHubMode 
    ? (queryMode === "specific" ? selectedDbId : null) 
    : (routeDbId || dbInfo?.id);
  // Static database data for testing
  const [database, setDatabase] = useState({
    id: "",
    name: "",
    type: "",
    status: "",
    lastAccessed: "",
  });
  const [credentials, setCredentials] = useState({
    connectionString: "",
    permissions: "readOnly",
  });
  const [queryContext, setQueryContext] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [processingVoice, setProcessingVoice] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const { isDarkMode: darkMode } = useTheme();

  // New state variables for text query and interactive capabilities
  const [textQuery, setTextQuery] = useState("");
  const [conversation, setConversation] = useState([]);
  const [awaitingClarification, setAwaitingClarification] = useState(false);
  const [clarificationQuestion, setClarificationQuestion] = useState("");
  const [tempQuery, setTempQuery] = useState("");
  const [proposedMutation, setProposedMutation] = useState(null);

  useEffect(() => {
    if (isHubMode) {
      api.get(`/database/list?page=1&page_size=100`)
        .then((res) => {
          if (res.data && res.data.data) {
            setAvailableDbs(res.data.data);
          } else {
            setAvailableDbs(res.data || []);
          }
        })
        .catch((err) => {
          console.error("Failed to fetch databases for dropdown", err);
        });
    }
  }, [isHubMode]);

  useEffect(() => {
    if (dbId) {
      // Fetch fresh DB info to ensure permissions are up to date
      api.get(`/database/db-info/${dbId}`)
        .then((res) => {
          const freshDbInfo = res.data;
          setDatabase({
            id: freshDbInfo?.id || "123",
            name: freshDbInfo?.name || "Database",
            type: freshDbInfo?.type || "MongoDB",
            status: freshDbInfo?.status || "Connected",
            lastAccessed: freshDbInfo?.lastAccessed || new Date().toISOString().split('T')[0],
          });

          setCredentials({
            connectionString:
              freshDbInfo?.connectionString || `mongodb+srv://admin:****@cluster.mongodb.net/${freshDbInfo?.name || "voxbiz_db"}`,
            permissions: freshDbInfo?.permissions || "readWrite",
          });
        })
        .catch((err) => {
          console.error("Failed to fetch fresh db info:", err);
          // Fallback to location state if fetch fails
          setDatabase({
            id: dbInfo?.id || "123",
            name: dbInfo?.name || "Database",
            type: dbInfo?.type || "MongoDB",
            status: dbInfo?.status || "Connected",
            lastAccessed: dbInfo?.lastAccessed || new Date().toISOString().split('T')[0],
          });

          setCredentials({
            connectionString:
              dbInfo?.connectionString || `mongodb+srv://admin:****@cluster.mongodb.net/${dbInfo?.name || "voxbiz_db"}`,
            permissions: dbInfo?.permissions || "readWrite",
          });
        });
    }
  }, [dbId, dbInfo?.id]);



  const handleCredentialChange = (e) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleVoiceInput = () => {
    setShowVoiceModal(true);
  };



  const executeQuery = (finalQuery) => {
    setProcessingVoice(true);
    const isGlobal = isHubMode && queryMode === "global";
    
    if (!isGlobal && !dbId) {
      console.error("Database ID not found");
      setProcessingVoice(false);
      setErrorMessage("Database ID not found. Please try again.");

      setConversation((prev) => {
        const newConversation = [...prev];
        newConversation[newConversation.length - 1] = {
          type: "system",
          text: "Database ID not found. Please try again.",
        };
        return newConversation;
      });

      return;
    }

    // Check if query is empty
    if (!finalQuery) {
      console.error("Query is empty");
      setProcessingVoice(false);
      setErrorMessage("Query cannot be empty. Please try again.");

      setConversation((prev) => {
        const newConversation = [...prev];
        newConversation[newConversation.length - 1] = {
          type: "system",
          text: "Query cannot be empty. Please try again.",
        };
        return newConversation;
      });

      return;
    }

    // Make an API call to the backend database service
    const apiCall = isGlobal 
      ? api.post("/query/global", { query: finalQuery })
      : api.post("/query/", {
          query: finalQuery,
          collection_name: dbId,
          schema_context: JSON.stringify(dbInfo?.schema || [])
        });

    apiCall
      .then((response) => response.data)
      .then((responseData) => {
        console.log("Database query successful:", responseData);
        setProcessingVoice(false);

        // Check if response indicates duplicate data that needs handling
        if (responseData.hasDuplicates) {
          // Ask user how to handle duplicates
          handleDuplicateDataResponse(finalQuery, responseData.data);
          return;
        }

        // Update conversation with success
        setConversation((prev) => {
          const newConversation = [...prev];
          newConversation[newConversation.length - 1] = {
            type: "system",
            text: "Query processed successfully! Redirecting to results...",
          };
          return newConversation;
        });

        // Save the data to sessionStorage
        try {
          sessionStorage.setItem(
            "visualizationData",
            JSON.stringify(responseData),
          );
          console.log("Data saved to sessionStorage successfully");
        } catch (err) {
          console.error("Error saving to sessionStorage:", err);
        }

        // Reset the text query field
        setTextQuery("");

        // Intercept mutations
        if (responseData.intent === "update" || responseData.intent === "delete") {
          setProposedMutation({
            intent: responseData.intent,
            update_statement: responseData.update_statement,
            affected_rows: responseData.data,
            mutation_id: responseData.mutation_id,
            target_ids: responseData.data.map((row) => row._id).filter(Boolean),
            pipeline: responseData.pipeline_used
          });
        } else {
          // On success, navigate to the choice page (select intent)
          navigate("/table", { state: { visualizationData: responseData, dbId: dbId } });
        }
      })
      .catch((error) => {
        console.error("Error processing database query:", error);
        setProcessingVoice(false);

        // Extract specific error message from backend if available
        const errorMsg = error.response?.data?.detail || "Database query failed. Please try again.";

        // Show failure message
        setErrorMessage(errorMsg);

        // Update conversation with error
        setConversation((prev) => {
          const newConversation = [...prev];
          newConversation[newConversation.length - 1] = {
            type: "system",
            text: errorMsg,
          };
          return newConversation;
        });

        // Clear error message after 5 seconds
        setTimeout(() => {
          setErrorMessage("");
        }, 5000);
      });
  };

  const handleConfirmMutation = async () => {
    if (!proposedMutation) return;
    
    const currentDbId = dbId;
    if (!dbId) {
      setErrorMessage("Database ID not found. Please try again.");
      return;
    }

    setProcessingVoice(true);
    try {
      const response = await api.post("/query/execute-mutation", {
        collection_name: dbId,
        mutation_id: proposedMutation.mutation_id
      });
      
      if (response.data.success) {
        setSuccessMessage("Done: Changes applied successfully.");
        setTimeout(() => setSuccessMessage(""), 5000);
        console.log("Done");
        setConversation((prev) => [
          ...prev,
          {
            type: "system",
            text: `Successfully modified ${response.data.modified_count} records.`,
          }
        ]);
        setProposedMutation(null);
        // Optionally fetch the full data again if we want to show it, or let user query it.
      }
    } catch (error) {
      const errorMsg = error.response?.data?.detail || "Failed to apply changes. Please try again.";
      setErrorMessage(errorMsg);
      setTimeout(() => setErrorMessage(""), 5000);
      console.log("Failed");
      console.error("Error executing mutation:", error);
    } finally {
      setProcessingVoice(false);
    }
  };
  const handleDuplicateDataResponse = (query, data) => {
    // Get clarification on how to handle duplicates
    handleDuplicateDataClarification(query)
      .then((clarificationQuestion) => {
        setTempQuery(query);
        setAwaitingClarification(true);
        setClarificationQuestion(clarificationQuestion);
        setQueryContext({ duplicateHandling: true, originalData: data });

        // Add the question to conversation
        setConversation((prev) => [
          ...prev,
          {
            type: "system",
            text: `I found ${data.duplicateCount || "some"} duplicate rows in the results. ${clarificationQuestion}`,
          },
        ]);
      })
      .catch((error) => {
        console.error("Error getting duplicate clarification:", error);
        // Fallback question
        const fallbackQuestion =
          "I noticed there are duplicate entries in the results. Would you like to keep all duplicates, remove them, or handle them in a specific way?";

        setTempQuery(query);
        setAwaitingClarification(true);
        setClarificationQuestion(fallbackQuestion);
        setQueryContext({ duplicateHandling: true, originalData: data });

        // Add the question to conversation
        setConversation((prev) => [
          ...prev,
          {
            type: "system",
            text: `I found duplicate rows in the results. ${fallbackQuestion}`,
          },
        ]);
      });
  };

  const handleClarificationResponse = (clarificationResponse, queryContext) => {
    // Clear clarification state
    setAwaitingClarification(false);
    setClarificationQuestion("");

    // Add to conversation history
    setConversation((prev) => [
      ...prev,
      { type: "user", text: clarificationResponse },
      { type: "system", text: "Processing your clarified query..." },
    ]);

    // Combine original query with clarification
    const originalQuery = tempQuery;

    // For join operations, generate an enhanced query
    if (queryContext.joinType) {
      generateEnhancedJoinQuery(
        originalQuery,
        clarificationResponse,
        queryContext.joinType,
      )
        .then((enhancedQuery) => {
          console.log("Enhanced join query:", enhancedQuery);
          executeQuery(enhancedQuery);
        })
        .catch((error) => {
          console.error("Error generating enhanced join query:", error);
          // Fallback to using original query + clarification
          executeQuery(
            `${originalQuery} (Clarification: ${clarificationResponse})`,
          );
        });
    }
    // For duplicate handling
    else if (queryContext.duplicateHandling) {
      generateDuplicateHandlingQuery(originalQuery, clarificationResponse)
        .then((enhancedQuery) => {
          console.log("Enhanced duplicate handling query:", enhancedQuery);
          executeQuery(enhancedQuery);
        })
        .catch((error) => {
          console.error("Error generating duplicate handling query:", error);
          // Fallback to using original query + clarification
          executeQuery(
            `${originalQuery} (Clarification: ${clarificationResponse})`,
          );
        });
    }
    // For other types of clarification
    else {
      executeQuery(
        `${originalQuery} (Clarification: ${clarificationResponse})`,
      );
    }
  };

  const processDatabaseQuery = (
    query,
    isClarification = false,
    queryContext = {},
  ) => {
    // If not a clarification, analyze the query first
    if (!isClarification) {
      // Here we make this an async operation
      analyzeQueryForClarification(query)
        .then((analysis) => {
          // If query needs clarification, save temp query and ask for clarification
          if (analysis.needsClarification) {
            setTempQuery(query);
            setAwaitingClarification(true);
            setClarificationQuestion(analysis.question);

            // Save additional context if this is a join operation or duplicate handling
            if (analysis.joinType) {
              setQueryContext((prev) => ({
                ...prev,
                joinType: analysis.joinType,
              }));
            }

            if (analysis.duplicateHandling) {
              setQueryContext((prev) => ({ ...prev, duplicateHandling: true }));
            }

            // Add the question to conversation
            setConversation((prev) => [
              ...prev,
              { type: "user", text: query },
              { type: "system", text: analysis.question },
            ]);

            return;
          } else {
            // If no clarification needed, proceed with the query
            executeQuery(query);
          }
        })
        .catch((error) => {
          console.error("Error analyzing query:", error);
          // Handle error and add to conversation
          setConversation((prev) => [
            ...prev,
            { type: "user", text: query },
            {
              type: "system",
              text: "Error analyzing your query. Please try again.",
            },
          ]);
        });
    } else {
      // We're processing a clarification response
      handleClarificationResponse(query, queryContext);
    }
  };



  // Handle text query submission
  const handleTextQuerySubmit = (e) => {
    e.preventDefault();
    if (awaitingClarification) {
      processDatabaseQuery(textQuery, true, queryContext);
    } else {
      processDatabaseQuery(textQuery, false);
    }
    setTextQuery("");
  };

  // Handle voice query from voice modal
  const handleDatabaseQuery = (query) => {
    processDatabaseQuery(query, false);
  };



  // Get translated text with fallback to default
  const getText = (key) => {
    if (!key) return ""; // Return empty string if key is undefined/null
    return window.currentPageDefaultTexts?.[key] || key;
  };

  if (loading) {
    return (
      <>
        <div className="flex justify-center items-center h-screen">
          <Loader />
        </div>
      </>
    );
  }

  if (error || !database) {
    return (
      <div className="flex justify-center items-center h-full min-h-[50vh]">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">
            {error || getText("noData")}
          </h2>
          <p>{getText("noData")}</p>
        </div>
      </div>
    );
  }

  return (
    <>
{/* Main Content */}
      <div className="container mx-auto px-4 py-6 md:px-6 lg:flex">
        {/* Left Sidebar - 40% width */}
        <div className="lg:w-2/5 mb-6 lg:mb-0 lg:pr-6">
          <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-transparent">
            {isHubMode ? (
              <Box sx={{ width: '100%', mb: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography variant="h4" fontWeight="bold" sx={{ mb: 3, color: darkMode ? 'white' : 'text.primary' }}>
                  Centralized Query Hub
                </Typography>
                
                <ToggleButtonGroup
                  color="primary"
                  value={queryMode}
                  exclusive
                  onChange={(e, newMode) => { if (newMode) setQueryMode(newMode); }}
                  aria-label="Query Mode"
                  sx={{ mb: 4, bgcolor: darkMode ? 'rgba(255,255,255,0.05)' : 'white' }}
                >
                  <ToggleButton value="global" aria-label="global mode" sx={{ px: 2 }}>
                    <LanguageIcon sx={{ mr: 1 }} /> Global Search
                  </ToggleButton>
                  <ToggleButton value="specific" aria-label="specific mode" sx={{ px: 2 }}>
                    <StorageIcon sx={{ mr: 1 }} /> Specific DB
                  </ToggleButton>
                </ToggleButtonGroup>

                {queryMode === "specific" && (
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel id="db-select-label">Select Database</InputLabel>
                    <Select
                      labelId="db-select-label"
                      value={selectedDbId}
                      label="Select Database"
                      onChange={(e) => setSelectedDbId(e.target.value)}
                    >
                      {availableDbs.map((db) => (
                        <MenuItem key={db.id} value={db.id}>
                          {db.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              </Box>
            ) : (
              <>
                <h2 className="text-2xl font-bold mb-2">{database.name}</h2>
                <p className="text-lg mb-4">{database.type} Database</p>
                <div
                  className={`px-4 py-2 rounded-full ${darkMode ? "bg-indigo-600 text-white" : "bg-indigo-100 text-indigo-800"}`}
                >
                  {database.status || "Connected"}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Main Content - Right side */}
        <div className="lg:w-3/5">
          {/* Database Name Header */}
          <div className="mb-6 flex justify-between items-center">
            {!(isHubMode && queryMode === "global") ? (
              <div>
                <h1 className="text-3xl font-bold">{database.name}</h1>
                <p
                  className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                >
                  {database.type} • {database.lastAccessed}
                </p>
              </div>
            ) : (
              <div>
                <h1 className="text-3xl font-bold">Global Search</h1>
                <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Query across all connected databases
                </p>
              </div>
            )}
          </div>

          <div
            className={`mb-8 p-6 rounded-2xl backdrop-blur-xl border ${darkMode ? "bg-slate-800 bg-opacity-10 border-slate-600 border-opacity-30 shadow-xl" : "bg-white bg-opacity-10 border-white border-opacity-40 shadow-xl"}`}
          >

            <p
              className={`mb-4 ${darkMode ? "text-gray-300" : "text-gray-600"}`}
            >
              {"Ask a question about your data..."}
            </p>

            {/* Display error message if present */}
            {errorMessage && (
              <div className="p-3 mb-4 bg-red-100 border border-red-400 text-red-700 rounded">
                {errorMessage}
              </div>
            )}

            {/* Display success message if present */}
            {successMessage && (
              <div className="p-3 mb-4 bg-green-100 border border-green-400 text-green-700 rounded">
                {successMessage}
              </div>
            )}

            {/* Voice search button */}
            <button
              onClick={handleVoiceInput}
              disabled={processingVoice}
              className={`w-full text-white py-4 rounded-lg flex items-center justify-center mb-4 ${
                processingVoice
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
              }`}
            >
              <Mic className="h-6 w-6 mr-2" />
              {processingVoice
                ? "Processing..."
                : "Voice Search"}
            </button>

            {/* Text query input */}
            <form onSubmit={handleTextQuerySubmit} className="relative mt-4">
              <input
                type="text"
                value={textQuery}
                onChange={(e) => setTextQuery(e.target.value)}
                placeholder={
                  awaitingClarification
                    ? clarificationQuestion
                    : getText("typeQuery")
                }
                className={`w-full p-3 pr-12 rounded-lg border ${
                  darkMode
                    ? "bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                    : "bg-white border-gray-300 placeholder-gray-500"
                } ${awaitingClarification ? "border-indigo-500 ring-2 ring-indigo-200" : ""}`}
                disabled={processingVoice}
              />
              <button
                type="submit"
                disabled={processingVoice || !textQuery.trim()}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-indigo-500 hover:text-indigo-600 disabled:text-gray-400"
              >
                <Send className="h-5 w-5" />
              </button>
            </form>

            {/* Conversation History */}
            {conversation.length > 0 && (
              <div
                className={`mt-6 p-4 rounded-lg ${darkMode ? "bg-slate-700" : "bg-transparent"} max-h-64 overflow-y-auto`}
              >
                <h3 className="text-sm font-medium mb-2 flex items-center">
                  <MessageSquare className="h-4 w-4 mr-1" />
                  {getText("conversationHistory")}
                </h3>
                <div className="space-y-2">
                  {conversation.map((msg, index) => (
                    <div
                      key={index}
                      className={`p-2 rounded-lg text-sm ${
                        msg.type === "user"
                          ? darkMode
                            ? "bg-indigo-500 text-white ml-8"
                            : "bg-indigo-100 text-indigo-800 ml-8"
                          : darkMode
                            ? "bg-slate-600 text-gray-200 mr-8"
                            : "bg-white text-gray-800 mr-8 border border-gray-200"
                      }`}
                    >
                      {msg.text}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Performance Analytics Card */}
          {dbInfo && (
            <div className="group relative flex w-full mb-8 flex-col rounded-xl bg-slate-950 p-4 shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-indigo-500/20">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-20 blur-sm transition-opacity duration-300 group-hover:opacity-30" />
              <div className="absolute inset-px rounded-[11px] bg-slate-950" />
              <div className="relative">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500">
                      <svg
                        className="h-4 w-4 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                        />
                      </svg>
                    </div>
                    <h3 className="text-sm font-semibold text-white">
                      Interactions
                    </h3>
                  </div>
                  <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Live
                  </span>
                </div>

                <div className="mb-4 grid grid-cols-3 gap-4">
                  <div className="rounded-lg bg-transparent/50 p-3">
                    <p className="text-xs font-medium text-slate-400">
                      Total Queries
                    </p>
                    <p className="text-lg font-semibold text-white">
                      {dbInfo?.totalQueries || "1,245"}
                    </p>
                  </div>
                  <div className="rounded-lg bg-transparent/50 p-3">
                    <p className="text-xs font-medium text-slate-400">
                      Success Rate
                    </p>
                    <p className="text-lg font-semibold text-white">
                      {dbInfo?.successRate || "98.2%"}
                    </p>
                  </div>
                  <div className="rounded-lg bg-transparent/50 p-3">
                    <p className="text-xs font-medium text-slate-400">
                      Avg Response Time
                    </p>
                    <p className="text-lg font-semibold text-white">
                      {dbInfo?.avgResponseTime || "124ms"}
                    </p>
                  </div>
                </div>

                <div className="mb-4 h-24 w-full overflow-hidden rounded-lg bg-transparent/50 p-3">
                  <div className="flex h-full w-full items-end justify-between gap-1">
                    {([
                      { total: 35, success: 30 },
                      { total: 20, success: 19 },
                      { total: 45, success: 40 },
                      { total: 38, success: 35 },
                      { total: 42, success: 38 },
                      { total: 50, success: 48 },
                      { total: 45, success: 42 }
                    ]).map((day, index) => {
                      const max = 50;
                      const totalHeight = (day.total / max) * 100;
                      const successPercent = (day.success / day.total) * 100;
                      
                      return (
                        <div
                          key={index}
                          className="w-4 h-full rounded-sm group relative flex items-end"
                        >
                          <div
                            className="w-full flex flex-col justify-end overflow-hidden rounded-sm transition-all duration-300 hover:opacity-80"
                            style={{ height: `${totalHeight}%` }}
                          >
                            {/* Failed (Light) */}
                            <div
                              className="w-full bg-indigo-400/40"
                              style={{ height: `${100 - successPercent}%` }}
                            />
                            {/* Success (Dark) */}
                            <div
                              className="w-full bg-indigo-600"
                              style={{ height: `${successPercent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400">
                    Last 7 days
                  </span>
                  <button 
                    onClick={() => alert("Detailed analytics dashboard is currently under development.")}
                    className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 px-3 py-1 text-xs font-medium text-white transition-all duration-300 hover:from-indigo-600 hover:to-purple-600"
                  >
                    View Details
                    <svg
                      className="h-3 w-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          {processingVoice && (
            <div className="fixed inset-0 bg-transparent bg-opacity-50 flex justify-center items-center z-50">
              <Loader />
            </div>
          )}

          {!(isHubMode && queryMode === "global") && (
            <DatabaseCredentials
              dbId={dbId}
              credentials={credentials}
              setCredentials={setCredentials}
              darkMode={darkMode}
            />
          )}
        </div>
      </div>
      {showVoiceModal && (
        <VoiceSearchModal
          darkMode={darkMode}
          onClose={() => setShowVoiceModal(false)}
          onQuery={handleDatabaseQuery}
        />
      )}
      <MutationPreviewModal
        proposedMutation={proposedMutation}
        darkMode={darkMode}
        onClose={() => setProposedMutation(null)}
        onConfirm={handleConfirmMutation}
      />
    </>
  );
};

export default DatabaseDetailsPage;
