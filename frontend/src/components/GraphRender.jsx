import React, { useState, useEffect, useRef } from "react";
import api from "../services/api";
import { useLocation } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import { COLOR_PALETTES } from "./graph/constants";
import EnhancedGraphRender from "./graph/EnhancedGraphRender";
import AIInsightsPanel from "./graph/AIInsightsPanel";

const Graphrender = () => {
  const location = useLocation();

  // Initialize graphType from location state if available
  const [graphType, setGraphType] = useState("bar");
  const { isDarkMode: darkMode } = useTheme();
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");


  const [chartData, setChartData] = useState([]);

  const [showCustomizePanel, setShowCustomizePanel] = useState(false);
  const [loading, setLoading] = useState({
    chart: true,
  });
  const [error, setError] = useState({
    chart: null,
  });
  const [chartSettings, setChartSettings] = useState({
    showLegend: false,
    showGrid: true,
    showDataLabels: false,
    colorPalette: 0,
    dateRange: {
      start: null,
      end: null,
    },
  });

  // Fetch chart data from location state or session storage as fallback
  const fetchChartData = () => {
    try {
      setLoading((prev) => ({ ...prev, chart: true }));
      setError((prev) => ({ ...prev, chart: null }));

      let data = null;

      // First check if location state has data
      if (location.state && location.state.visualizationData) {
        let passedData = location.state.visualizationData;
        if (passedData && passedData.data && Array.isArray(passedData.data)) {
          passedData = passedData.data;
        }
        data = passedData;
        console.log("Data loaded from location state:", data);
      }
      // If not, try to get from session storage
      else {
        const storedData = sessionStorage.getItem("visualizationData");
        if (storedData) {
          let parsed = JSON.parse(storedData);
          if (parsed && parsed.data && Array.isArray(parsed.data)) {
            parsed = parsed.data;
          }
          data = parsed;
          console.log("Data loaded from session storage:", data);
        } else {
          console.warn(
            "No visualization data found in location state or session storage",
          );
          setError((prev) => ({
            ...prev,
            chart: "No data available for visualization",
          }));
        }
      }

      // Process and set the data if we have it
      if (data) {
        // Make sure data is in the right format before setting it
        if (Array.isArray(data)) {
          setChartData(data);
          console.log("Chart data set:", data);
        } else if (typeof data === "object") {
          // If data is an object but not an array, convert it to an array
          setChartData([data]);
          console.log("Chart data set from object:", [data]);
        } else {
          console.error("Visualization data is in an unexpected format:", data);
          setError((prev) => ({ ...prev, chart: "Invalid data format" }));
        }
      }
    } catch (err) {
      console.error("Error processing chart data:", err);
      setError((prev) => ({ ...prev, chart: "Failed to load chart data" }));
    } finally {
      setLoading((prev) => ({ ...prev, chart: false }));
    }
  };



  // Fetch data on component mount
  useEffect(() => {
    console.log("Location state on mount:", location.state);
    fetchChartData();


  }, []); // Only run once on mount

  // Separate effect to update graph type when location state changes
  useEffect(() => {
    if (location.state?.selectedGraphType) {
      // Convert the first letter to lowercase for proper graph type matching
      const graphTypeValue = location.state.selectedGraphType;
      console.log("Location Graph sent:", graphTypeValue);

      // Convert first letter to lowercase (e.g., "Bar" becomes "bar")
      const formattedGraphType =
        graphTypeValue.charAt(0).toLowerCase() + graphTypeValue.slice(1);
      setGraphType(formattedGraphType);
    }
  }, [location.state]);

  // Separate effect for date range filters
  useEffect(() => {
    if (chartData.length > 0) {
      // Apply date range filtering if needed
      // This could be implemented here
    }
  }, [chartSettings.dateRange.start, chartSettings.dateRange.end, chartData]);

  // Update chart settings
  const handleSettingChange = (setting, value) => {
    setChartSettings((prev) => ({
      ...prev,
      [setting]: value,
    }));
  };

  // Update color palette
  const handleColorPaletteChange = (index) => {
    setChartSettings((prev) => ({
      ...prev,
      colorPalette: index,
    }));
  };


  return (
    <div
      className={`App p-6 min-h-screen w-screen transition-colors duration-300 ${darkMode ? "bg-transparent text-white" : "bg-transparent text-black"}`}
    >
      {!isFullScreen && (
        <>
          {/* Tabs Navigation */}
          <div className="flex border-b mb-6 pt-4">
            <button
              className={`py-2 px-4 font-medium transition-colors ${
                activeTab === "dashboard"
                  ? `border-b-2 border-${darkMode ? "blue-400" : "blue-600"} text-${darkMode ? "blue-400" : "blue-600"}`
                  : `text-${darkMode ? "gray-400" : "gray-500"} hover:text-${darkMode ? "gray-200" : "gray-700"}`
              }`}
              onClick={() => setActiveTab("dashboard")}
            >
              Dashboard
            </button>
            {/* <button 
              className={`py-2 px-4 font-medium transition-colors ${
                activeTab === "history" 
                  ? `border-b-2 border-${darkMode ? 'blue-400' : 'blue-600'} text-${darkMode ? 'blue-400' : 'blue-600'}`
                  : `text-${darkMode ? 'gray-400' : 'gray-500'} hover:text-${darkMode ? 'gray-200' : 'gray-700'}`
              }`}
              onClick={() => setActiveTab("history")}
            >
              Query History
            </button> */}
            <button
              className={`py-2 px-4 font-medium transition-colors ${
                activeTab === ""
                  ? `border-b-2 border-${darkMode ? "blue-400" : "blue-600"} text-${darkMode ? "blue-400" : "blue-600"}`
                  : `text-${darkMode ? "gray-400" : "gray-500"} hover:text-${darkMode ? "gray-200" : "gray-700"}`
              }`}
              onClick={() => setShowCustomizePanel(!showCustomizePanel)}
            >
              Customize
            </button>
          </div>
        </>
      )}

      {/* Customize Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-80 bg-${darkMode ? "gray-800" : "white"} shadow-xl transform transition-transform duration-300 ease-in-out z-50 ${showCustomizePanel ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="p-4 h-full flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Chart Customization</h2>
            <button
              onClick={() => setShowCustomizePanel(false)}
              className={`p-2 rounded-full ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
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
          </div>

          <div className="flex-grow overflow-y-auto">
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Display Options</h3>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={chartSettings.showLegend}
                    onChange={(e) =>
                      handleSettingChange("showLegend", e.target.checked)
                    }
                    className="rounded"
                  />
                  <span>Show Legend</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={chartSettings.showGrid}
                    onChange={(e) =>
                      handleSettingChange("showGrid", e.target.checked)
                    }
                    className="rounded"
                  />
                  <span>Show Grid</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={chartSettings.showDataLabels}
                    onChange={(e) =>
                      handleSettingChange("showDataLabels", e.target.checked)
                    }
                    className="rounded"
                  />
                  <span>Show Data Labels</span>
                </label>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold mb-2">Color Palette</h3>
              <div className="flex flex-wrap gap-2">
                {COLOR_PALETTES.map((palette, index) => (
                  <button
                    key={index}
                    onClick={() => handleColorPaletteChange(index)}
                    className={`p-2 rounded border ${chartSettings.colorPalette === index ? "border-blue-500" : darkMode ? "border-gray-600" : "border-gray-300"}`}
                    title={palette.name}
                  >
                    <div className="flex h-4">
                      {palette.colors.map((color, i) => (
                        <div
                          key={i}
                          className="w-4 h-full"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* <div className="mb-6">
              <h3 className="font-semibold mb-2">Date Range</h3>
              <div className="space-y-2">
                <div>
                  <label className="block text-sm mb-1">Start Date</label>
                  <input
                    type="date"
                    className={`w-full p-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                    onChange={(e) => handleSettingChange('dateRange', {
                      ...chartSettings.dateRange,
                      start: e.target.value
                    })}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">End Date</label>
                  <input
                    type="date"
                    className={`w-full p-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                    onChange={(e) => handleSettingChange('dateRange', {
                      ...chartSettings.dateRange,
                      end: e.target.value
                    })}
                  />
                </div>
              </div>
            </div> */}
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setShowCustomizePanel(false)}
              className={`w-full py-2 px-4 rounded font-medium ${darkMode ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-500 hover:bg-blue-600"} text-white`}
            >
              Apply Settings
            </button>
          </div>
        </div>
      </div>

      {/* Dashboard Tab */}
      {(activeTab === "dashboard" || isFullScreen) && (
        <>
          {!isFullScreen && (
            <div className="relative mb-6 w-full md:w-64">
              <select
                value={graphType}
                onChange={(e) => setGraphType(e.target.value)}
                className={`w-full p-3 pr-10 rounded appearance-none border-b-2 border-blue-500 focus:outline-none focus:border-pink-500 transition-colors ${
                  darkMode
                    ? "bg-gray-800 text-white"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                <option value="line">Line Chart</option>
                <option value="area">Area Chart</option>
                <option value="bar">Bar Chart</option>
                <option value="pie">Pie Chart</option>
                <option value="scatter">Scatter Chart</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <svg
                  className="w-5 h-5 text-blue-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          )}

          <div
            className={`grid ${isFullScreen ? "" : "grid-cols-1 lg:grid-cols-3"} gap-6`}
          >
            <div
              className={`${
                isFullScreen ? "w-full h-screen" : "lg:col-span-2"
              } rounded-2xl border ${darkMode ? "border-white/10 bg-transparent/50" : "border-slate-200 bg-white/50"} backdrop-blur-md shadow-lg overflow-hidden transition-all duration-300`}
            >
              {loading.chart ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <svg
                      className="animate-spin h-12 w-12 mx-auto text-blue-500"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <p className="mt-4">loading chart data...</p>
                  </div>
                </div>
              ) : error.chart ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center p-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-12 w-12 mx-auto text-red-500"
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
                    <p className="mt-2">{error.chart}</p>
                    <button
                      onClick={fetchChartData}
                      className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              ) : (
                <EnhancedGraphRender
                  data={chartData}
                  graphType={graphType}
                  darkMode={darkMode}
                  isFullScreen={isFullScreen}
                  setIsFullScreen={setIsFullScreen}
                  chartSettings={chartSettings}
                />
              )}
            </div>

            {!isFullScreen && (
              <div className="lg:col-span-1">
                <AIInsightsPanel
                  data={chartData}
                  graphType={graphType}
                  darkMode={darkMode}
                  loading={loading.chart}
                  error={error.chart}
                />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Graphrender;
