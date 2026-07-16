import React from "react";

const MutationPreviewModal = ({ 
  proposedMutation, 
  darkMode, 
  onClose, 
  onConfirm 
}) => {
  if (!proposedMutation) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-[100] p-4 transition-opacity"
      onClick={onClose}
    >
      <div 
        className={`${darkMode ? "bg-gray-800 text-white border-gray-600 shadow-[0_0_15px_rgba(255,255,255,0.1)]" : "bg-white text-gray-800 border-gray-300 shadow-[0_0_20px_rgba(0,0,0,0.2)]"} border-2 rounded-xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`p-5 border-b flex justify-between items-center ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              {proposedMutation.intent === "delete" ? (
                <span className="text-red-500">⚠️ Review Deletion</span>
              ) : (
                <span className="text-amber-500">✍️ Review Update</span>
              )}
            </h2>
            <p className={`text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              You are about to {proposedMutation.intent} {proposedMutation.affected_rows.length} row(s).
            </p>
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer pointer-events-auto"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-0 overflow-auto flex-1">
          {proposedMutation.affected_rows.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className={`sticky top-0 shadow-sm ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
                <tr>
                  {Object.keys(proposedMutation.affected_rows[0] || {}).filter(k => k !== "_id").map((key) => (
                    <th key={key} className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className={`divide-y ${darkMode ? "divide-gray-700" : "divide-gray-200"}`}>
                {proposedMutation.affected_rows.slice(0, 100).map((row, i) => (
                  <tr key={i} className={`${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"} ${proposedMutation.intent === "delete" ? "bg-red-50 dark:bg-red-900/20" : ""}`}>
                    {Object.keys(proposedMutation.affected_rows[0] || {}).filter(k => k !== "_id").map((key, j) => {
                      const isUpdatedField = proposedMutation.intent === "update" && 
                        proposedMutation.update_statement && 
                        proposedMutation.update_statement.$set && 
                        key in proposedMutation.update_statement.$set;
                        
                      return (
                        <td key={j} className="px-6 py-4 text-sm whitespace-nowrap">
                          {isUpdatedField ? (
                            <div className="flex items-center gap-2">
                              <span className="line-through opacity-60 text-red-500">{String(row[key])}</span>
                              <span>→</span>
                              <span className="font-bold text-green-500">{String(proposedMutation.update_statement.$set[key])}</span>
                            </div>
                          ) : (
                            <span>{row[key] !== null && row[key] !== undefined ? String(row[key]) : ""}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-gray-500">No rows matched your query. Nothing will be modified.</div>
          )}
        </div>
        
        <div className={`p-4 border-t flex justify-end gap-3 ${darkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-gray-50"}`}>
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer pointer-events-auto ${
              darkMode ? "bg-gray-700 hover:bg-gray-600 text-white" : "bg-gray-200 hover:bg-gray-300 text-gray-800"
            }`}
          >
            Cancel
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onConfirm(); }}
            disabled={proposedMutation.affected_rows.length === 0}
            className={`px-6 py-2 rounded-lg font-medium transition-colors text-white shadow-md cursor-pointer pointer-events-auto ${
              proposedMutation.affected_rows.length === 0 ? "bg-gray-400 cursor-not-allowed opacity-50" :
              proposedMutation.intent === "delete" ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
            }`}
          >
            Confirm & Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default MutationPreviewModal;
