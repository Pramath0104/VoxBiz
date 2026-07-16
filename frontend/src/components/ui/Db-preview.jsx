import React, { useState } from "react";
import api from "../../services/api";

export const DbPreviewOption = ({ dbId, dbName, darkMode }) => {
  const [isHovering, setIsHovering] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPreviewData = async () => {
    if (previewData) return; // Already fetched

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get(`/database/db-info/${dbId}`);

      const dbData = response.data;
      if (dbData) {
        // Create a properly formatted preview object
        const formattedPreview = {
          name: dbData.name,
          type: dbData.type || "mongodb",
          description: "Database Schema Overview",
          tableCount: 1,
          tables: [dbData.name],
          sampleColumns: {
            [dbData.name]: dbData.schema || []
          },
        };

        setPreviewData(formattedPreview);
      } else {
        throw new Error("Database not found");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMouseEnter = () => {
    setIsHovering(true);
    fetchPreviewData();
  };

  // Create style object for dynamic styling based on dark mode
  const styles = {
    container: {
      position: "relative",
      display: "inline-block",
    },
    previewButton: {
      background: "none",
      border: "none",
      color: darkMode ? "#88aaff" : "#3366cc",
      textDecoration: "underline",
      cursor: "pointer",
      padding: "2px 4px",
    },
    previewPopup: {
      position: "absolute",
      top: "100%",
      left: "0",
      zIndex: 1000,
      width: "400px",
      background: darkMode ? "#1e1e1e" : "white",
      borderRadius: "6px",
      boxShadow: darkMode
        ? "0 4px 12px rgba(0, 0, 0, 0.4)"
        : "0 4px 12px rgba(0, 0, 0, 0.15)",
      marginTop: "12px",
      overflow: "hidden",
      color: darkMode ? "#e0e0e0" : "inherit",
    },
    previewHeader: {
      padding: "12px 16px",
      borderBottom: darkMode ? "1px solid #333" : "1px solid #eaeaea",
      background: darkMode ? "#2a2a2a" : "#f9f9f9",
    },
    headerTitle: {
      margin: "0",
      fontSize: "16px",
      fontWeight: "500",
    },
    previewContent: {
      display: "flex",
      flexDirection: "column",
    },
    previewDataImage: {
      padding: "12px 16px",
    },
    loadingErrorContainer: {
      padding: "24px",
      textAlign: "center",
    },
    spinner: {
      border: darkMode
        ? "3px solid rgba(255, 255, 255, 0.1)"
        : "3px solid rgba(0, 0, 0, 0.1)",
      borderTopColor: darkMode ? "#88aaff" : "#3366cc",
      borderRadius: "50%",
      width: "24px",
      height: "24px",
      animation: "spin 1s linear infinite",
      margin: "0 auto 12px",
    },
    previewPointer: {
      position: "absolute",
      top: "-8px",
      left: "20px",
      width: "16px",
      height: "16px",
      background: darkMode ? "#1e1e1e" : "white",
      transform: "rotate(45deg)",
      boxShadow: darkMode
        ? "-2px -2px 5px rgba(0, 0, 0, 0.2)"
        : "-2px -2px 5px rgba(0, 0, 0, 0.06)",
    },
    dbPreviewImage: {
      background: darkMode ? "#2a2a2a" : "#f8f9fa",
      border: darkMode ? "1px solid #444" : "1px solid #e0e0e0",
      borderRadius: "4px",
      fontFamily: "monospace",
      fontSize: "13px",
      lineHeight: "1.5",
      overflow: "hidden",
    },
    dbPreviewHeader: {
      padding: "8px 12px",
      background: darkMode ? "#333" : "#e9ecef",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      borderBottom: darkMode ? "1px solid #444" : "1px solid #dee2e6",
    },
    dbName: {
      fontWeight: "bold",
      fontSize: "14px",
    },
    dbType: {
      color: darkMode ? "#adb5bd" : "#6c757d",
      fontSize: "12px",
      padding: "2px 6px",
      background: darkMode ? "#444" : "#e2e6ea",
      borderRadius: "4px",
    },
    dbPreviewDescription: {
      padding: "8px 12px",
      borderBottom: darkMode ? "1px solid #444" : "1px solid #dee2e6",
      color: darkMode ? "#adb5bd" : "#6c757d",
      fontStyle: "italic",
    },
    dbPreviewTables: {
      padding: "8px 12px",
    },
    dbPreviewSectionTitle: {
      fontWeight: "bold",
      marginBottom: "6px",
      color: darkMode ? "#ddd" : "#495057",
    },
    dbTableList: {
      listStyle: "none",
      padding: "0",
      margin: "0",
    },
    dbTableItem: {
      padding: "4px 0",
    },
    tableName: {
      fontWeight: "bold",
      color: darkMode ? "#88aaff" : "#0066cc",
    },
    tableColumns: {
      color: darkMode ? "#adb5bd" : "#6c757d",
      fontSize: "12px",
      marginLeft: "6px",
    },
    moreIndicator: {
      color: darkMode ? "#adb5bd" : "#6c757d",
      fontStyle: "italic",
    },
    noTables: {
      color: darkMode ? "#adb5bd" : "#6c757d",
      fontStyle: "italic",
      padding: "4px 0",
    },
    relationships: {
      padding: "8px 12px",
      borderTop: darkMode ? "1px solid #444" : "1px solid #dee2e6",
      fontSize: "12px",
      color: darkMode ? "#bbb" : "#495057",
    },
    relationshipsTitle: {
      fontWeight: "bold",
      marginBottom: "6px",
      color: darkMode ? "#ddd" : "#495057",
    },
  };

  // Add keyframes for spinner animation to document
  React.useEffect(() => {
    // Only add if it doesn't exist
    if (!document.getElementById("spinner-keyframes")) {
      const styleSheet = document.createElement("style");
      styleSheet.id = "spinner-keyframes";
      styleSheet.textContent = `
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(styleSheet);

      // Cleanup when component unmounts
      return () => {
        const element = document.getElementById("spinner-keyframes");
        if (element) {
          document.head.removeChild(element);
        }
      };
    }
  }, []);

  return (
    <div
      style={styles.container}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setIsHovering(false)}
    >
      <button style={styles.previewButton}>Preview Data</button>

      {isHovering && (
        <div
          style={{
            ...styles.previewPopup,
            position: "fixed",
            zIndex: 9999,
            top: "50%", // Center vertically
            left: "50%", // Center horizontally
            transform: "translate(-50%, -50%)", // Adjust for perfect centering
            backgroundColor: "white", // Ensure visible background
            border: "2px solid black", // Visible border
            padding: "20px",
            boxShadow: "0 0 20px rgba(0,0,0,0.5)", // Dramatic shadow
            display: "block", // Force display
          }}
        >
          {isLoading ? (
            <div style={styles.loadingErrorContainer}>
              <div style={styles.spinner}></div>
              <p>Loading preview...</p>
            </div>
          ) : error ? (
            <div style={styles.loadingErrorContainer}>
              <p>{error}</p>
            </div>
          ) : previewData ? (
            <div style={styles.previewContent}>
              <div style={styles.previewHeader}>
                <h3 style={styles.headerTitle}>{dbName} - Preview</h3>
              </div>
              <div style={styles.previewDataImage}>
                <div style={styles.dbPreviewImage}>
                  <div style={styles.dbPreviewHeader}>
                    <span style={styles.dbName}>{previewData.name}</span>
                    <span style={styles.dbType}>{previewData.type}</span>
                  </div>

                  <div style={styles.dbPreviewDescription}>
                    {previewData.description}
                  </div>

                  <div style={styles.dbPreviewTables}>
                    <div style={styles.dbPreviewSectionTitle}>
                      Tables ({previewData.tableCount})
                    </div>
                    {previewData.tables && previewData.tables.length > 0 ? (
                      <ul style={styles.dbTableList}>
                        {previewData.tables.map((table, idx) => (
                          <li key={idx} style={styles.dbTableItem}>
                            <span style={styles.tableName}>{table}</span>
                            {previewData.sampleColumns[table] && (
                              <span style={styles.tableColumns}>
                                ({previewData.sampleColumns[table].join(", ")}
                                {previewData.sampleColumns[table].length < 3
                                  ? ""
                                  : ", ..."}
                                )
                              </span>
                            )}
                          </li>
                        ))}
                        {previewData.tableCount > previewData.tables.length && (
                          <li
                            style={{
                              ...styles.dbTableItem,
                              ...styles.moreIndicator,
                            }}
                          >
                            ... and{" "}
                            {previewData.tableCount - previewData.tables.length}{" "}
                            more
                          </li>
                        )}
                      </ul>
                    ) : (
                      <div style={styles.noTables}>No tables found</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={styles.loadingErrorContainer}>
              <p>Loading preview...</p>
            </div>
          )}

          <div style={styles.previewPointer}></div>
        </div>
      )}
    </div>
  );
};

export default DbPreviewOption;
