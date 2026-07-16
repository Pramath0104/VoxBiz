import React from "react";

const CustomTooltip = ({ active, payload, label, darkMode }) => {
  if (active && payload && payload.length) {
    return (
      <div
        className={`p-3 rounded shadow-lg border ${
          darkMode
            ? "bg-gray-800 border-gray-700 text-gray-200"
            : "bg-white border-gray-300 text-gray-800"
        }`}
      >
        <p className="font-medium">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default CustomTooltip;
