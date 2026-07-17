import React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";

import { COLOR_PALETTES } from "./constants";
import CustomTooltip from "./CustomTooltip";

const EnhancedGraphRender = ({
  data,
  graphType,
  darkMode,
  isFullScreen,
  setIsFullScreen,
  chartSettings,
}) => {
  // Check if data is valid and determine possible graph types
  const [error, setError] = React.useState(null);
  const [possibleGraphTypes, setPossibleGraphTypes] = React.useState([]);

  // Transform data to match expected format based on graphType
  const transformedData = React.useMemo(() => {
    if (!data || data.length === 0) {
      setError("No data available");
      return [];
    }

    try {
      // Determine structure of data
      const firstItem = data[0];
      const keys = Object.keys(firstItem);

      // Determine which fields can be used as categories and values
      let categoryKeys = keys.filter(
        (k) => typeof firstItem[k] === "string" || firstItem[k] instanceof Date,
      );
      
      // Prefer other string keys over _id for labels
      if (categoryKeys.length > 1) {
        categoryKeys = categoryKeys.filter(k => k !== "_id");
      }

      const valueKeys = keys.filter(
        (k) => !isNaN(parseFloat(firstItem[k])) && isFinite(firstItem[k]) && k !== "_id",
      );

      // Determine possible graph types based on data structure
      const possible = [];
      if (categoryKeys.length >= 1 && valueKeys.length >= 1) {
        possible.push("bar", "line", "area", "pie");
      }
      if (valueKeys.length >= 2) {
        possible.push("scatter");
      }

      setPossibleGraphTypes(possible);

      if (!possible.includes(graphType)) {
        setError(
          `The selected graph type "${graphType}" is not compatible with this data structure`,
        );
      } else {
        setError(null);
      }

      // Get the first categorical and numerical keys for default mapping
      const categoryKey = categoryKeys[0] || "name";
      const valueKey = valueKeys[0] || "value";

      // Transform the data based on the structure
      if (graphType === "scatter") {
        // For scatter charts, we need at least two numerical values
        const xKey = valueKeys[0] || "x";
        const yKey = valueKeys[1] || valueKeys[0] || "y";

        return data.map((item, index) => ({
          name: item[categoryKey] || `Point ${index + 1}`,
          x: parseFloat(item[xKey] || 0),
          y: parseFloat(item[yKey] || 0),
          z: parseFloat(item[valueKeys[2] || valueKeys[0] || "z"] || 50),
          series: item.series || "current",
        }));
      } else {
        // For other chart types
        return data.map((item) => ({
          name: item[categoryKey] || "Unnamed",
          value: parseFloat(item[valueKey] || 0),
          // Include all numerical values for flexibility
          ...valueKeys.reduce((acc, key) => {
            acc[key] = parseFloat(item[key] || 0);
            return acc;
          }, {}),
        }));
      }
    } catch (err) {
      console.error("Error transforming data:", err);
      setError("Could not process data for visualization");
      return [];
    }
  }, [data, graphType]);

  const gridColor = darkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";
  const textColor = darkMode ? "#fff" : "#333";

  // Handle undefined chartSettings gracefully
  const colorPalette = chartSettings?.colorPalette || "default";
  const currentPalette = COLOR_PALETTES[colorPalette]?.colors || [
    "#8884d8",
    "#82ca9d",
    "#ffc658",
    "#ff8042",
    "#0088fe",
  ];

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  // Determine which numerical fields to display based on the data
  const getDataKeys = () => {
    if (!data || data.length === 0) return [];

    const firstItem = data[0];
    return Object.keys(firstItem).filter(
      (key) => !isNaN(parseFloat(firstItem[key])) && isFinite(firstItem[key]),
    );
  };

  const dataKeys = getDataKeys();

  // Render data labels for charts that support them
  const renderDataLabels = (dataKey) => {
    if (!chartSettings?.showDataLabels) return null;

    return (
      <LabelList
        dataKey={dataKey}
        position="top"
        fill={textColor}
        fontSize={12}
        formatter={(value) => value?.toFixed(0)}
      />
    );
  };

  if (error) {
    return (
      <div className="p-4 relative">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Data Visualization</h2>
        </div>
        <div
          className={`${isFullScreen ? "h-[calc(100vh-8rem)]" : "h-80"} w-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg`}
        >
          <div className="text-center p-4">
            <p className="text-red-500 font-bold mb-2">{error}</p>
            {possibleGraphTypes.length > 0 && (
              <p>
                Try one of these compatible chart types:{" "}
                {possibleGraphTypes.join(", ")}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 relative">
      <div className="min-h-10 mb-4 pr-12 flex items-center">
        <h2 className="text-lg font-bold">Data Visualization</h2>
      </div>

      <button
        type="button"
        onClick={toggleFullScreen}
        className={`absolute right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full p-2 transition-colors ${
          darkMode
            ? "text-white hover:bg-gray-700 hover:text-blue-300"
            : "text-gray-800 hover:bg-gray-200 hover:text-blue-600"
        }`}
        aria-label={isFullScreen ? "Exit full screen" : "Enter full screen"}
      >
        {isFullScreen ? (
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
        ) : (
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
              d="M15 3h6v6m0-6-7 7M9 21H3v-6m0 6 7-7"
            />
          </svg>
        )}
      </button>

      <div
        className={`${isFullScreen ? "h-[calc(100vh-8rem)]" : "h-80"} w-full transition-all duration-300`}
      >
        {data && data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            {graphType === "line" && (
              <LineChart data={transformedData}>
                {chartSettings?.showGrid && (
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                )}
                <XAxis
                  dataKey="name"
                  stroke={textColor}
                  tick={{ fill: textColor }}
                />
                <YAxis
                  stroke={
                    darkMode ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)"
                  }
                  tick={{ fill: textColor }}
                />
                <Tooltip content={<CustomTooltip darkMode={darkMode} />} />
                {chartSettings?.showLegend && (
                  <Legend wrapperStyle={{ color: textColor }} />
                )}
                {dataKeys.slice(0, 3).map((key, index) => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    name={key}
                    stroke={currentPalette[index % currentPalette.length]}
                    strokeWidth={3}
                    dot={{
                      r: 6,
                      strokeWidth: 2,
                      fill: darkMode ? "#2d3748" : "#fff",
                    }}
                    activeDot={{
                      r: 8,
                      stroke: currentPalette[index % currentPalette.length],
                      strokeWidth: 2,
                      fill: darkMode ? "#2d3748" : "#fff",
                    }}
                  >
                    {renderDataLabels(key)}
                  </Line>
                ))}
              </LineChart>
            )}
            {graphType === "area" && (
              <AreaChart data={transformedData}>
                {chartSettings?.showGrid && (
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                )}
                <XAxis
                  dataKey="name"
                  stroke={textColor}
                  tick={{ fill: textColor }}
                />
                <YAxis
                  stroke={
                    darkMode ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)"
                  }
                  tick={{ fill: textColor }}
                />
                <Tooltip content={<CustomTooltip darkMode={darkMode} />} />
                {chartSettings?.showLegend && (
                  <Legend wrapperStyle={{ color: textColor }} />
                )}
                {dataKeys.slice(0, 3).map((key, index) => (
                  <Area
                    key={key}
                    type="monotone"
                    dataKey={key}
                    name={key}
                    stroke={currentPalette[index % currentPalette.length]}
                    fill={`${currentPalette[index % currentPalette.length]}80`}
                    activeDot={{
                      r: 8,
                      stroke: currentPalette[index % currentPalette.length],
                      strokeWidth: 2,
                      fill: darkMode ? "#2d3748" : "#fff",
                    }}
                  >
                    {renderDataLabels(key)}
                  </Area>
                ))}
              </AreaChart>
            )}
            {graphType === "bar" && (
              <BarChart data={transformedData}>
                {chartSettings?.showGrid && (
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                )}
                <XAxis
                  dataKey="name"
                  stroke={textColor}
                  tick={{ fill: textColor }}
                />
                <YAxis
                  stroke={
                    darkMode ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)"
                  }
                  tick={{ fill: textColor }}
                />
                <Tooltip content={<CustomTooltip darkMode={darkMode} />} />
                {chartSettings?.showLegend && (
                  <Legend wrapperStyle={{ color: textColor }} />
                )}
                {dataKeys.slice(0, 3).map((key, index) => (
                  <Bar
                    key={key}
                    dataKey={key}
                    name={key}
                    fill={currentPalette[index % currentPalette.length]}
                    radius={[4, 4, 0, 0]}
                  >
                    {renderDataLabels(key)}
                  </Bar>
                ))}
              </BarChart>
            )}
            {graphType === "scatter" && (
              <ScatterChart>
                {chartSettings?.showGrid && (
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                )}
                <XAxis
                  dataKey="x"
                  name="X"
                  stroke={textColor}
                  tick={{ fill: textColor }}
                />
                <YAxis
                  dataKey="y"
                  name="Y"
                  stroke={
                    darkMode ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)"
                  }
                  tick={{ fill: textColor }}
                />
                <ZAxis dataKey="z" range={[60, 300]} name="Size" />
                <Tooltip content={<CustomTooltip darkMode={darkMode} />} />
                {chartSettings?.showLegend && (
                  <Legend wrapperStyle={{ color: textColor }} />
                )}
                {["current", "comparison"].map((series, index) => {
                  const seriesData = transformedData.filter(
                    (item) => item.series === series,
                  );
                  if (seriesData.length === 0) return null;

                  return (
                    <Scatter
                      key={series}
                      name={series.charAt(0).toUpperCase() + series.slice(1)}
                      data={seriesData}
                      fill={currentPalette[index % currentPalette.length]}
                      shape="circle"
                      stroke={currentPalette[index % currentPalette.length]}
                      strokeWidth={2}
                      fillOpacity={0.8}
                    >
                      {chartSettings?.showDataLabels &&
                        seriesData.map((entry, idx) => (
                          <LabelList
                            key={`label-${idx}`}
                            dataKey="name"
                            position="top"
                            style={{ fill: textColor }}
                          />
                        ))}
                    </Scatter>
                  );
                })}
              </ScatterChart>
            )}
            {graphType === "pie" && (
              <PieChart>
                <Pie
                  data={transformedData}
                  cx="50%"
                  cy="50%"
                  labelLine={chartSettings?.showDataLabels}
                  outerRadius={isFullScreen ? 180 : 100}
                  innerRadius={isFullScreen ? 120 : 60}
                  paddingAngle={5}
                  dataKey={dataKeys[0] || "value"}
                  nameKey="name"
                  label={({ name, percent }) =>
                    chartSettings?.showDataLabels
                      ? `${name}: ${(percent * 100).toFixed(0)}%`
                      : null
                  }
                >
                  {transformedData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={currentPalette[index % currentPalette.length]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip darkMode={darkMode} />} />
                {chartSettings?.showLegend && (
                  <Legend wrapperStyle={{ color: textColor }} />
                )}
              </PieChart>
            )}
          </ResponsiveContainer>
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
            <p className="text-gray-500">No data available to display</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default EnhancedGraphRender;
