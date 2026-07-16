import React, { useState, useEffect } from "react";
import api from "../../services/api";
const AIInsightsPanel = ({ data, graphType, darkMode }) => {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentInsightIndex, setCurrentInsightIndex] = useState(null);
  const [explanation, setExplanation] = useState("");
  const [suggestions, setSuggestions] = useState("");
  const [roadmap, setRoadmap] = useState(null);
  const [industryHistory, setIndustryHistory] = useState([]);
  const [goalsHistory, setGoalsHistory] = useState([]);
  const [challengesHistory, setChallengesHistory] = useState([]);
  const [showIndustryDropdown, setShowIndustryDropdown] = useState(false);
  const [showGoalsDropdown, setShowGoalsDropdown] = useState(false);
  const [showChallengesDropdown, setShowChallengesDropdown] = useState(false);

  // Onboarding state
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [businessInfo, setBusinessInfo] = useState({
    industry: "",
    stage: "startup",
    revenue: "",
    employees: "",
    goals: "",
    challenges: "",
  });

  // Process data for insights
  useEffect(() => {
    if (!data || data.length === 0) {
      setInsights([]);
      setLoading(false);
      return;
    }
  }, [data, graphType]);

  useEffect(() => {
    try {
      // Load history from localStorage
      const storedIndustryHistory = localStorage.getItem("industryHistory");
      const storedGoalsHistory = localStorage.getItem("goalsHistory");
      const storedChallengesHistory = localStorage.getItem("challengesHistory");

      // Parse and set history (if exists)
      if (storedIndustryHistory) {
        setIndustryHistory(JSON.parse(storedIndustryHistory));
      }

      if (storedGoalsHistory) {
        setGoalsHistory(JSON.parse(storedGoalsHistory));
      }

      if (storedChallengesHistory) {
        setChallengesHistory(JSON.parse(storedChallengesHistory));
      }
    } catch (error) {
      console.error("Error loading history from localStorage:", error);
    }
  }, []);

  const saveInputToHistory = (type, value) => {
    if (!value.trim()) return; // Don't save empty values

    try {
      switch (type) {
        case "industry":
          // Add to industry history if not already there
          if (!industryHistory.includes(value)) {
            const updatedIndustryHistory = [value, ...industryHistory].slice(
              0,
              5,
            ); // Keep only latest 5
            setIndustryHistory(updatedIndustryHistory);
            localStorage.setItem(
              "industryHistory",
              JSON.stringify(updatedIndustryHistory),
            );
          }
          break;

        case "goals":
          // Add to goals history if not already there
          if (!goalsHistory.includes(value)) {
            const updatedGoalsHistory = [value, ...goalsHistory].slice(0, 5); // Keep only latest 5
            setGoalsHistory(updatedGoalsHistory);
            localStorage.setItem(
              "goalsHistory",
              JSON.stringify(updatedGoalsHistory),
            );
          }
          break;

        case "challenges":
          // Add to challenges history if not already there
          if (!challengesHistory.includes(value)) {
            const updatedChallengesHistory = [
              value,
              ...challengesHistory,
            ].slice(0, 5); // Keep only latest 5
            setChallengesHistory(updatedChallengesHistory);
            localStorage.setItem(
              "challengesHistory",
              JSON.stringify(updatedChallengesHistory),
            );
          }
          break;

        default:
          break;
      }
    } catch (error) {
      console.error(`Error saving ${type} to history:`, error);
    }
  };

  // Handle onboarding input changes
  const handleInputChange = (field, value) => {
    setBusinessInfo((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Modified function to handle dropdown item selection
  const handleHistoryItemClick = (field, value) => {
    // Update the input field
    handleInputChange(field, value);

    // Close the dropdown
    switch (field) {
      case "industry":
        setShowIndustryDropdown(false);
        break;
      case "goals":
        setShowGoalsDropdown(false);
        break;
      case "challenges":
        setShowChallengesDropdown(false);
        break;
      default:
        break;
    }
  };

  // Generate AI insights using Gemini API with business context
  const generateInsights = async (data, chartType, businessContext) => {
    try {
      const dataContext = JSON.stringify(data.slice(0, 10));
      const businessContextStr = `Industry: ${businessContext.industry}, Stage: ${businessContext.stage}, Revenue: ${businessContext.revenue}, Employees: ${businessContext.employees}, Goals: ${businessContext.goals}, Challenges: ${businessContext.challenges}, ChartType: ${chartType}`;

      const response = await api.post(`/query/insights`, {
        data_context: dataContext,
        business_context: businessContextStr
      });

      const parsedInsights = JSON.parse(response.data.insights || response.data);
      return parsedInsights;
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      throw error;
    }
  };

  // Process AI response and update states
  const processAIResponse = (response) => {
    if (response) {
      // Set chart explanation
      setExplanation(response.chartExplanation || "");

      // Set insights
      setInsights(response.insights || []);

      // Convert insights to bullet-point suggestions
      const suggestionsText = (response.insights || [])
        .map((insight) => `• ${insight.title}: ${insight.description}`)
        .join("\n\n");

      setSuggestions(suggestionsText);

      // Set roadmap
      setRoadmap(response.roadmap || null);
    }
  };

  // Function to fetch insights with business context
  const fetchAIInsights = () => {
    setLoading(true);
    setError(null);

    generateInsights(data, graphType, businessInfo)
      .then((response) => {
        processAIResponse(response);
        setShowOnboarding(false); // Close onboarding after processing
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error generating insights:", err);
        setError("Failed to generate AI insights. Please try again later.");
        setLoading(false);
        setShowOnboarding(false);
      });
  };

  // Start onboarding
  const startOnboarding = () => {
    setShowOnboarding(true);
    setOnboardingStep(0);
  };

  // Handle onboarding completion
  const completeOnboarding = () => {
    // Save current inputs to history
    if (businessInfo.industry)
      saveInputToHistory("industry", businessInfo.industry);
    if (businessInfo.goals) saveInputToHistory("goals", businessInfo.goals);
    if (businessInfo.challenges)
      saveInputToHistory("challenges", businessInfo.challenges);

    // Continue with existing functionality
    fetchAIInsights();
  };

  // Handle text-to-speech for insights
  const speakInsight = (insight, index) => {
    // Stop any current speech
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    if (isSpeaking && currentInsightIndex === index) {
      // Toggle off if already speaking this insight
      setIsSpeaking(false);
      setCurrentInsightIndex(null);
      window.speechSynthesis.cancel();
    } else {
      // Speak the new insight
      const textToSpeak = `${insight.title}. ${insight.description}`;
      const utterance = new SpeechSynthesisUtterance(textToSpeak);

      // Configure speech settings
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      // Get available voices and try to select a good one
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(
        (voice) =>
          voice.name.includes("Google") ||
          voice.name.includes("Female") ||
          voice.name.includes("US English"),
      );

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      // Set speaking state
      setIsSpeaking(true);
      setCurrentInsightIndex(index);

      // Handle speech end
      utterance.onend = () => {
        setIsSpeaking(false);
        setCurrentInsightIndex(null);
      };

      // Start speaking
      window.speechSynthesis.speak(utterance);
    }
  };

  // Get icon for insight type
  const getInsightIcon = (type) => {
    switch (type) {
      case "trend":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
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
        );
      case "anomaly":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        );
      case "opportunity":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        );
      case "risk":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      default:
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        );
    }
  };

  // Get color for insight type
  const getInsightColor = (type) => {
    switch (type) {
      case "trend":
        return darkMode ? "blue-500" : "blue-600";
      case "anomaly":
        return darkMode ? "yellow-400" : "yellow-500";
      case "opportunity":
        return darkMode ? "green-400" : "green-500";
      case "risk":
        return darkMode ? "red-400" : "red-500";
      case "error":
        return darkMode ? "red-400" : "red-500";
      default:
        return darkMode ? "purple-400" : "purple-500";
    }
  };

  // Modified input with history component that properly handles dropdown selection
  const renderInputWithHistory = (
    field,
    value,
    placeholder,
    historyItems,
    showDropdown,
    setShowDropdown,
  ) => {
    return (
      <div className="relative">
        <input
          type="text"
          className={`w-full p-2 border rounded ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"}`}
          placeholder={placeholder}
          value={value}
          onChange={(e) => handleInputChange(field, e.target.value)}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
        />

        {/* History dropdown - removed onBlur event that was causing the issue */}
        {showDropdown && historyItems.length > 0 && (
          <div
            className={`absolute z-10 mt-1 w-full border rounded shadow-lg ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-200"}`}
          >
            {historyItems.map((item, index) => (
              <div
                key={index}
                className={`p-2 cursor-pointer ${darkMode ? "hover:bg-gray-600 text-gray-200" : "hover:bg-gray-100 text-gray-800"}`}
                // Use mousedown instead of click to ensure it fires before blur
                onMouseDown={(e) => {
                  e.preventDefault(); // Prevent focus loss
                  handleHistoryItemClick(field, item);
                }}
              >
                {item}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Onboarding form components based on current step
  const renderOnboardingStep = () => {
    switch (onboardingStep) {
      case 0:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">About Your Business</h3>
            <div>
              <label
                className={`block mb-1 font-medium text-${darkMode ? "gray-300" : "gray-700"}`}
              >
                Industry
              </label>
              {renderInputWithHistory(
                "industry",
                businessInfo.industry,
                "e.g. SaaS, E-commerce, Health Tech",
                industryHistory,
                showIndustryDropdown,
                setShowIndustryDropdown,
              )}
            </div>
            <div>
              <label
                className={`block mb-1 font-medium text-${darkMode ? "gray-300" : "gray-700"}`}
              >
                Business Stage
              </label>
              <select
                className={`w-full p-2 border rounded ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"}`}
                value={businessInfo.stage}
                onChange={(e) => handleInputChange("stage", e.target.value)}
              >
                <option value="startup">Startup</option>
                <option value="growth">Growth</option>
                <option value="established">Established</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setOnboardingStep(1)}
                className={`px-4 py-2 bg-${darkMode ? "blue-600" : "blue-500"} hover:bg-${darkMode ? "blue-700" : "blue-600"} text-white rounded`}
              >
                Next
              </button>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Business Details</h3>
            <div>
              <label
                className={`block mb-1 font-medium text-${darkMode ? "gray-300" : "gray-700"}`}
              >
                Current Revenue
              </label>
              <input
                type="text"
                className={`w-full p-2 border rounded ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"}`}
                placeholder="e.g. $100K annually, $10K monthly"
                value={businessInfo.revenue}
                onChange={(e) => handleInputChange("revenue", e.target.value)}
              />
            </div>
            <div>
              <label
                className={`block mb-1 font-medium text-${darkMode ? "gray-300" : "gray-700"}`}
              >
                Number of Employees
              </label>
              <input
                type="text"
                className={`w-full p-2 border rounded ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"}`}
                placeholder="e.g. 5, 20-50, 100+"
                value={businessInfo.employees}
                onChange={(e) => handleInputChange("employees", e.target.value)}
              />
            </div>
            <div className="flex justify-between mt-4">
              <button
                onClick={() => setOnboardingStep(0)}
                className={`px-4 py-2 bg-${darkMode ? "gray-600" : "gray-300"} hover:bg-${darkMode ? "gray-700" : "gray-400"} text-${darkMode ? "white" : "gray-800"} rounded`}
              >
                Back
              </button>
              <button
                onClick={() => setOnboardingStep(2)}
                className={`px-4 py-2 bg-${darkMode ? "blue-600" : "blue-500"} hover:bg-${darkMode ? "blue-700" : "blue-600"} text-white rounded`}
              >
                Next
              </button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">
              Business Goals & Challenges
            </h3>
            <div>
              <label
                className={`block mb-1 font-medium text-${darkMode ? "gray-300" : "gray-700"}`}
              >
                Business Goals
              </label>
              {/* Modified textarea with history implementation */}
              <div className="relative">
                <textarea
                  className={`w-full p-2 border rounded ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"}`}
                  placeholder="e.g. Increase customer retention, Expand to new markets"
                  rows={3}
                  value={businessInfo.goals}
                  onChange={(e) => handleInputChange("goals", e.target.value)}
                  onFocus={() => setShowGoalsDropdown(true)}
                  onBlur={() => setTimeout(() => setShowGoalsDropdown(false), 150)}
                />

                {/* History dropdown for goals - modified to use mousedown */}
                {showGoalsDropdown && goalsHistory.length > 0 && (
                  <div
                    className={`absolute z-10 mt-1 w-full border rounded shadow-lg ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-200"}`}
                  >
                    {goalsHistory.map((item, index) => (
                      <div
                        key={index}
                        className={`p-2 cursor-pointer ${darkMode ? "hover:bg-gray-600 text-gray-200" : "hover:bg-gray-100 text-gray-800"}`}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleHistoryItemClick("goals", item);
                        }}
                      >
                        {item.length > 50
                          ? item.substring(0, 50) + "..."
                          : item}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label
                className={`block mb-1 font-medium text-${darkMode ? "gray-300" : "gray-700"}`}
              >
                Current Challenges
              </label>
              {/* Modified textarea with history implementation */}
              <div className="relative">
                <textarea
                  className={`w-full p-2 border rounded ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"}`}
                  placeholder="e.g. High customer acquisition cost, Seasonal sales fluctuations"
                  rows={3}
                  value={businessInfo.challenges}
                  onChange={(e) =>
                    handleInputChange("challenges", e.target.value)
                  }
                  onFocus={() => setShowChallengesDropdown(true)}
                  onBlur={() => setTimeout(() => setShowChallengesDropdown(false), 150)}
                />

                {/* History dropdown for challenges - modified to use mousedown */}
                {showChallengesDropdown && challengesHistory.length > 0 && (
                  <div
                    className={`absolute z-10 mt-1 w-full border rounded shadow-lg ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-200"}`}
                  >
                    {challengesHistory.map((item, index) => (
                      <div
                        key={index}
                        className={`p-2 cursor-pointer ${darkMode ? "hover:bg-gray-600 text-gray-200" : "hover:bg-gray-100 text-gray-800"}`}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleHistoryItemClick("challenges", item);
                        }}
                      >
                        {item.length > 50
                          ? item.substring(0, 50) + "..."
                          : item}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-between mt-4">
              <button
                onClick={() => setOnboardingStep(1)}
                className={`px-4 py-2 bg-${darkMode ? "gray-600" : "gray-300"} hover:bg-${darkMode ? "gray-700" : "gray-400"} text-${darkMode ? "white" : "gray-800"} rounded`}
              >
                Back
              </button>
              <button
                onClick={completeOnboarding}
                disabled={loading}
                className={`px-4 py-2 bg-${darkMode ? "green-600" : "green-500"} hover:bg-${darkMode ? "green-700" : "green-600"} text-white rounded ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {loading ? "Generating..." : "Generate Insights & Roadmap"}
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // Render business roadmap
  const renderRoadmap = () => {
    if (!roadmap) return null;

    const months = ["month1", "month2", "month3", "month4", "month5", "month6"];

    return (
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">
          Your 6-Month Strategic Roadmap
        </h3>
        <div className="space-y-6">
          {months.map((month, index) => {
            if (!roadmap[month]) return null;

            return (
              <div
                key={month}
                className={`p-4 rounded-lg border ${darkMode ? "border-gray-700 bg-gray-750" : "border-gray-200 bg-gray-50"}`}
              >
                <h4
                  className={`font-medium text-${darkMode ? "blue-400" : "blue-600"} mb-2`}
                >
                  {roadmap[month].title}
                </h4>
                <ul className="list-disc pl-5 space-y-1">
                  {roadmap[month].actions.map((action, actionIndex) => (
                    <li
                      key={actionIndex}
                      className={`text-${darkMode ? "gray-300" : "gray-700"}`}
                    >
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div
      className={`rounded-2xl border ${darkMode ? "border-white/10 bg-transparent/50" : "border-slate-200 bg-white/50"} backdrop-blur-md shadow-lg overflow-hidden transition-all duration-300 h-full max-h-[500px] flex flex-col`}
    >
      <div className={`p-4 border-b ${darkMode ? "border-gray-700/50" : "border-gray-200/50"} flex justify-between items-center`}>
        <h2 className="text-lg font-bold">AI Business Insights</h2>
      </div>

      <div className="p-4 flex-grow overflow-y-auto">
        {showOnboarding ? (
          <div
            className={`p-6 rounded-lg ${darkMode ? "bg-gray-750" : "bg-transparent"}`}
          >
            {renderOnboardingStep()}
          </div>
        ) : error ? (
          <div
            className={`flex flex-col items-center justify-center h-full text-${darkMode ? "red-400" : "red-600"}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <p className="text-center">{error}</p>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center h-full py-8">
            <div className="animate-pulse flex flex-col items-center">
              <div
                className={`h-4 bg-${darkMode ? "gray-700" : "gray-300"} rounded w-3/4 mb-4`}
              ></div>
              <div
                className={`h-4 bg-${darkMode ? "gray-700" : "gray-300"} rounded w-2/3 mb-4`}
              ></div>
              <div
                className={`h-4 bg-${darkMode ? "gray-700" : "gray-300"} rounded w-1/2 mb-8`}
              ></div>

              <div
                className={`h-4 bg-${darkMode ? "gray-700" : "gray-300"} rounded w-full mb-2`}
              ></div>
              <div
                className={`h-4 bg-${darkMode ? "gray-700" : "gray-300"} rounded w-full mb-2`}
              ></div>
              <div
                className={`h-4 bg-${darkMode ? "gray-700" : "gray-300"} rounded w-3/4`}
              ></div>
            </div>
          </div>
        ) : !explanation && !suggestions ? (
          <div
            className={`flex flex-col items-center justify-center h-full text-${darkMode ? "gray-400" : "gray-500"}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
            <p className="text-center">
              Generate AI insights and a strategic roadmap for your business
            </p>
            <button
              onClick={startOnboarding}
              className={`mt-4 px-4 py-2 bg-${darkMode ? "blue-600" : "blue-500"} hover:bg-${darkMode ? "blue-700" : "blue-600"} text-white rounded`}
            >
              Get Started
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h3 className="text-md font-semibold mb-2">Chart Analysis</h3>
              <p className={`text-${darkMode ? "gray-300" : "gray-700"}`}>
                {explanation}
              </p>
            </div>

            <div className="mb-6">
              <h3 className="text-md font-semibold mb-2">
                Business Insights & Recommendations
              </h3>
              <div
                className={`text-${darkMode ? "gray-300" : "gray-700"} whitespace-pre-line`}
              >
                {suggestions.split("\n").map((line, index) => (
                  <p
                    key={index}
                    className={line.trim().startsWith("•") ? "ml-4 mb-3" : ""}
                  >
                    {line}
                  </p>
                ))}
              </div>
            </div>

            {renderRoadmap()}
          </>
        )}
      </div>
    </div>
  );
};
export default AIInsightsPanel;
