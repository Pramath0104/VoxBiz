import BarChartIcon from "@mui/icons-material/BarChart";
import DownloadIcon from "@mui/icons-material/Download";
import EmailIcon from "@mui/icons-material/Email";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import TuneIcon from "@mui/icons-material/Tune";
import { ButtonBase } from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";

import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Switch from "@mui/material/Switch";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import * as React from "react";
import { useEffect, useRef,useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";

import EmailDataModal from "../components/EmailDataModal";
import Loader from "../components/ui/Loader";
import { ErrorBoundary } from "../components/ErrorBoundary";
import EnhancedTableHead from "../components/table/EnhancedTableHead";
import EnhancedTableToolbar from "../components/table/EnhancedTableToolbar";
import RefineQueryDialog from "../components/table/RefineQueryDialog";
import TableSidebar from "../components/table/TableSidebar";
import { generateHeadCells,getComparator } from "../components/table/tableUtils";
import { useTheme } from "../contexts/ThemeContext";
import api from "../services/api";
export default function DataTable() {
  const location = useLocation();
  const { dbId } = location.state || {};
  const navigate = useNavigate();
  const [order, setOrder] = useState("asc");
  const [orderBy, setOrderBy] = useState("calories");
  const [selected, setSelected] = useState([]);
  const [page, setPage] = useState(0);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [customColumns, setCustomColumns] = useState([]);
  const [dense, setDense] = useState(false);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [rows, setRows] = useState([]);
  const [filteredRows, setFilteredRows] = useState([]);
  const [headCells, setHeadCells] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const { isDarkMode: darkMode } = useTheme();
  const [tableTitle, setTableTitle] = useState("");
  const [customQuery, setCustomQuery] = useState("");
  const [filterOptions, setFilterOptions] = useState({});
  const [densePaddingLabel] = useState("Dense padding");



  const handleDownloadCSV = () => {
    try {
      // Create CSV from selected rows if any, otherwise all filtered rows
      const dataToDownload = selected.length > 0 
        ? filteredRows.filter(row => selected.includes(row.id || row._id)) 
        : filteredRows;
        
      if (dataToDownload.length === 0) return;

      const headers = Object.keys(dataToDownload[0] || {})
        .filter((key) =>
          customColumns && customColumns.length > 0
            ? customColumns.includes(key)
            : true,
        )
        .join(",");

      const csvRows = dataToDownload.map((row) => {
        return Object.keys(row)
          .filter((key) =>
            customColumns && customColumns.length > 0
              ? customColumns.includes(key)
              : true,
          )
          .map((key) => {
            // Handle CSV special characters
            let cellValue = row[key];

            // Convert to string and handle nulls/undefined
            cellValue =
              cellValue === null || cellValue === undefined
                ? ""
                : String(cellValue);

            // If contains comma, quote, or newline, wrap in quotes and escape internal quotes
            if (
              cellValue.includes(",") ||
              cellValue.includes('"') ||
              cellValue.includes("\n")
            ) {
              cellValue = '"' + cellValue.replace(/"/g, '""') + '"';
            }

            return cellValue;
          })
          .join(",");
      });

      const csvContent = [headers, ...csvRows].join("\n");

      // Create blob and trigger download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `${tableTitle.replace(/\s+/g, "_")}_data_${new Date().toISOString().slice(0, 10)}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Show success notification (if you have notification system)
      // setNotification({ open: true, message: 'Download successful', severity: 'success' });
    } catch (error) {
      console.error("Error downloading data:", error);
      // Show error notification (if you have notification system)
      // setNotification({ open: true, message: 'Download failed', severity: 'error' });
    }
  };
  let data;
  // Fetch data from backend
  useEffect(() => {
    const processData = async () => {
      try {
        setLoading(true);

        // Use the data passed as prop instead of fetching
        let passedData = location.state?.visualizationData;
        if (passedData && passedData.data && Array.isArray(passedData.data)) {
          passedData = passedData.data;
        }
        data = passedData;

        if (!data || data.length === 0) {
          
          // Instead of using sample data, just set empty arrays
          setRows([]);
          setFilteredRows([]);
          setTableTitle("No Data Available");

          // Set empty headCells when no data
          setHeadCells([]);
          setCustomColumns([]);
        } else {
          // Process the data passed from props
          const title = "Visualization Data";

          if (
            window.currentPageTranslationKeys &&
            !window.currentPageTranslationKeys.includes("title")
          ) {
            window.currentPageTranslationKeys.push("title");
          }

          if (window.currentPageDefaultTexts) {
            window.currentPageDefaultTexts.title = title;
          }

          setRows(data);
          setFilteredRows(data);
          setTableTitle(title);

          // Generate head cells dynamically based on data
          const dynamicHeadCells = generateHeadCells(data);
          setHeadCells(dynamicHeadCells);
          setCustomColumns(dynamicHeadCells.map((cell) => cell.id));

          // Set default orderBy to the first column (after id)
          if (dynamicHeadCells.length > 0) {
            setOrderBy(dynamicHeadCells[0].id);
          }

          // Extract filter options from visualization data if they exist
          if (data && data.length > 0) {
            // Find all tag properties in the first data item
            const firstItem = data[0];
            const tagKeys = Object.keys(firstItem?.tags || {});

            // Create dynamic filters for each tag type
            const dynamicFilters = {};

            tagKeys.forEach((tagKey) => {
              // For each tag type, collect all unique values across all data items
              const uniqueValues = [
                ...new Set(
                  data
                    .map((item) => {
                      const tagValue = item.tags?.[tagKey];
                      // Handle both array and string values
                      return Array.isArray(tagValue)
                        ? tagValue
                        : tagValue
                          ? [tagValue]
                          : [];
                    })
                    .flat()
                    .filter(Boolean),
                ),
              ];

              // Only add to filters if values exist
              if (uniqueValues.length > 0) {
                dynamicFilters[tagKey] = uniqueValues;
              }
            });

            setFilterOptions(dynamicFilters);
          }
        }
        
        setLoading(false);
      } catch (err) {
        setError("Failed to process data");
        setLoading(false);
        console.error("Error processing data:", err);
      }
    };

    processData();
  }, [location.state?.visualizationData]);




  const handleSearch = (query) => {
    
    if (!query) {
      setFilteredRows(rows);
      return;
    }



    const searchTerms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
    

    const filtered = rows.filter((row) => {
      // Stringify the entire row (ignoring keys, just values) to make it highly robust
      // and case-insensitive, ensuring we catch any nested data or missing columns.
      // But we must stringify safely.
      
      const match = searchTerms.every((term) =>
        Object.keys(row).some((column) => {
          const value = row[column];
          if (value == null) return false;
          if (typeof value === 'object') {
            // Also search inside objects (like tags or nested info)
            return JSON.stringify(value).toLowerCase().includes(term);
          }
          return String(value).toLowerCase().includes(term);
        })
      );
      return match;
    });

    
    setFilteredRows(filtered);
    setPage(0);
  };

  const handleFilter = () => {
    // Implement the filter logic here
    

    // This is just a simple example - modify based on your needs
    let filtered = [...rows];

    // Apply actual filters if they were implemented for real data
    // For now just log the selected filters

    setFilteredRows(filtered);
    setPage(0);
  };

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelected = filteredRows.map((n, index) => n.id || n._id || `row-${index}`);
      setSelected(newSelected);
      return;
    }
    setSelected([]);
  };

  const handleClick = (event, id) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1),
      );
    }
    setSelected(newSelected);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleChangeDense = (event) => {
    setDense(event.target.checked);
  };

  // State variables
  const [notExpectedDialogOpen, setNotExpectedDialogOpen] = useState(false);
  const [refinementFeedback, setRefinementFeedback] = useState("");
  const [currentQuery, setCurrentQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false); // Default to closed
  const [voiceCommandActive, setVoiceCommandActive] = useState(false);
  const [transcribedCommand, setTranscribedCommand] = useState("");
  const [, setIsListening] = useState(false);
  const [, setTranscript] = useState("");
  const [, setMessage] = useState(
    "Click the microphone to start speaking",
  );
  const recognitionRef = useRef(null);

  // Toggle voice recognition on/off
  const toggleVoiceCommand = () => {
    if (voiceCommandActive) {
      stopVoiceRecording();
    } else {
      startVoiceRecording();
    }
    setVoiceCommandActive(!voiceCommandActive);
  };

  // Start listening to voice input
  const startVoiceRecording = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setMessage("Voice recognition is not supported in your browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false; // stop after pause
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
      setMessage("Listening... Speak your query");
      setTranscript("");
    };

    recognition.onresult = (event) => {
      const finalTranscript = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join("");
      
      setTranscript(finalTranscript);
      setTranscribedCommand(finalTranscript);
      setMessage("Transcription complete. You can submit your query.");
    };

    recognition.onerror = (event) => {
      console.error("Recognition error:", event.error);
      setMessage(`Error: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      setMessage("Recording stopped.");
    };

    recognition.start(); // 👈 ACTUALLY START RECOGNITION
    recognitionRef.current = recognition;
  };

  // Stop listening
  const stopVoiceRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setMessage("Voice input stopped.");
      setIsListening(false);
    }
  };
  // Process the voice command for query refinement
  const processVoiceCommand = async () => {
    if (!transcribedCommand) return;

    setLoading(true);

    try {
      const response = await api.post(`/query/`, {
        query: `Refine data for: ${transcribedCommand}`,
        collection_name: dbId,
        schema_context: "Mock Schema"
      });

      if (response.status !== 200) {
        throw new Error("Failed to refine data");
      }

      const result = response.data;

      // Update current query for potential refinement
      if (result.refinedQuery) {
        setCurrentQuery(result.refinedQuery);
        setCustomQuery(result.refinedQuery);
      }

      // Update data if available
      if (result.data) {
        setRows(result.data);
        setFilteredRows(result.data);

        // Update head cells if structure changed
        if (result.data.length > 0) {
          const dynamicHeadCells = generateHeadCells(result.data);
          setHeadCells(dynamicHeadCells);
          setCustomColumns(dynamicHeadCells.map((cell) => cell.id));
        }
      }



      // Clear the transcribed command
      setTranscribedCommand("");
    } catch (error) {
      console.error("Error processing voice refinement:", error);
      setError("Failed to process voice refinement");
    } finally {
      setLoading(false);
    }
  };

  // Handle custom query submission
  const handleCustomQuerySubmit = async () => {
    if (!customQuery.trim()) return;

    setLoading(true);

    try {
      const response = await api.post(`/query/`, {
        query: `Custom request: ${customQuery}`,
        collection_name: dbId,
        schema_context: "Mock Schema"
      });

      if (response.status !== 200) {
        throw new Error("Failed to execute custom query");
      }

      const result = response.data;

      // Update current query for potential refinement
      setCurrentQuery(customQuery);

      // Update data if available
      if (result.data) {
        setRows(result.data);
        setFilteredRows(result.data);

        // Update head cells if structure changed
        if (result.data.length > 0) {
          const dynamicHeadCells = generateHeadCells(result.data);
          setHeadCells(dynamicHeadCells);
        }
      }


    } catch (error) {
      console.error("Error processing custom query:", error);
      setError("Failed to process custom query");
    } finally {
      setLoading(false);
    }
  };

  // Handle column toggle in customization
  const handleColumnToggle = (event, columnId) => {
    if (event.target.checked) {
      setCustomColumns((prev) => [...prev, columnId]);
    } else {
      setCustomColumns((prev) => prev.filter((id) => id !== columnId));
    }
  };



  // Handle "Not What You Expected" button click
  const handleNotWhatYouExpected = () => {
    setNotExpectedDialogOpen(true);
  };

  // Handle submission of refinement feedback
  const handleRefinementSubmit = async () => {
    if (!refinementFeedback.trim()) return;

    setLoading(true);
    setNotExpectedDialogOpen(false);

    try {
      const response = await api.post(`/query/`, {
        query: `Refine this: ${refinementFeedback}`,
        collection_name: dbId,
        schema_context: "Mock Schema"
      });

      if (response.status !== 200) {
        throw new Error("Failed to refine data");
      }

      const result = response.data;

      // Update query if a new one was generated
      if (result.refinedQuery) {
        setCurrentQuery(result.refinedQuery);
        setCustomQuery(result.refinedQuery);
      }

      // Update data if available
      if (result.data) {
        setRows(result.data);
        setFilteredRows(result.data);

        // Update head cells if structure changed
        if (result.data.length > 0) {
          const dynamicHeadCells = generateHeadCells(result.data);
          setHeadCells(dynamicHeadCells);
          setCustomColumns(dynamicHeadCells.map((cell) => cell.id));
          
        }
      }

      // Reset feedback
      setRefinementFeedback("");
    } catch (error) {
      console.error("Error processing refinement:", error);
      setError("Failed to refine query");
    } finally {
      setLoading(false);
    }
  };


  const isSelected = (id) => selected.indexOf(id) !== -1;

  // Avoid a layout jump when reaching the last page with empty rows
  const emptyRows =
    page > 0 ? Math.max(0, (1 + page) * rowsPerPage - filteredRows.length) : 0;

  const visibleRows = React.useMemo(
    () =>
      filteredRows
        .slice()
        .sort(getComparator(order, orderBy))
        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [order, orderBy, page, rowsPerPage, filteredRows],
  );  const handleDeleteSelected = async () => {
    if (!dbId || selected.length === 0) return;
    setIsDeleting(true);
    try {
      await api.post(`/database/${dbId}/data/delete`, { row_ids: selected });
      
      // Update local state by removing deleted rows
      const remainingRows = rows.filter(row => {
        const rowId = row.id || row._id;
        return !selected.includes(rowId);
      });
      const remainingFiltered = filteredRows.filter(row => {
        const rowId = row.id || row._id;
        return !selected.includes(rowId);
      });
      
      setRows(remainingRows);
      setFilteredRows(remainingFiltered);
      setSelected([]);
      setDeleteConfirmOpen(false);
      
      import("react-hot-toast").then(module => {
        module.toast.success(`Successfully deleted ${selected.length} records.`);
      });
    } catch (error) {
      console.error("Error deleting records:", error);
      import("react-hot-toast").then(module => {
        module.toast.error("Failed to delete records.");
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <ErrorBoundary>
    <Box
      sx={{
        width: "100vw",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        pt: 0,
      }}
    >
<Box sx={{ display: "flex", flexGrow: 1, position: "relative" }}>
        {/* Customization Sidebar */}
        <TableSidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          darkMode={darkMode}
          customQuery={customQuery}
          setCustomQuery={setCustomQuery}
          handleCustomQuerySubmit={handleCustomQuerySubmit}
          headCells={headCells}
          customColumns={customColumns}
          handleColumnToggle={handleColumnToggle}
          voiceCommandActive={voiceCommandActive}
          toggleVoiceCommand={toggleVoiceCommand}
          transcribedCommand={transcribedCommand}
          processVoiceCommand={processVoiceCommand}
        />

        {/* Main content */}
        <Paper
          sx={{
            width: "100%",
            mb: 2,
            background: darkMode ? "rgba(30, 41, 59, 0.5)" : "rgba(255, 255, 255, 0.5)",
            backdropFilter: "blur(12px)",
            border: darkMode ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid rgba(226, 232, 240, 1)",
            boxShadow: darkMode ? "0 4px 6px -1px rgba(0, 0, 0, 0.5)" : "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            borderRadius: 3,
            overflow: "hidden",
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            transition:
              "background-color 0.3s ease-in-out, color 0.3s ease-in-out",
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <EnhancedTableToolbar
              numSelected={selected.length}
              title={tableTitle}
              onSearch={handleSearch}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              darkMode={darkMode}
              onFilter={handleFilter}
              filterOptions={filterOptions}
              onDelete={() => setDeleteConfirmOpen(true)}
            />

            {/* Navigation to Graphs Button with persistent text next to icon */}
            <ButtonBase
              onClick={() =>
                navigate("/rendergraph", { state: { visualizationData: data } })
              }
              sx={{
                display: "flex",
                alignItems: "center",
                mx: 1,
                p: 1,
                borderRadius: 1,
                color: darkMode ? "#90caf9" : "primary.main",
                "&:hover": {
                  bgcolor: darkMode
                    ? "rgba(144, 202, 249, 0.08)"
                    : "rgba(25, 118, 210, 0.04)",
                },
              }}
            >
              <BarChartIcon
                sx={{
                  color: darkMode ? "white" : "rgba(0, 0, 0, 0.54)",
                  mr: 1,
                }}
              />
              <Typography
                variant="body2"
                sx={{ color: darkMode ? "white" : "rgba(0, 0, 0, 0.87)" }}
              >
                View Graphs
              </Typography>
            </ButtonBase>

            <IconButton
              onClick={() => setSidebarOpen(!sidebarOpen)}
              sx={{
                mr: 2,
                color: darkMode ? "white" : "inherit",
                bgcolor: darkMode ? "action.selected" : "action.hover",
                "&:hover": {
                  bgcolor: darkMode ? "action.focus" : "action.selected",
                },
              }}
              aria-label="open customization panel"
            >
              <TuneIcon />
            </IconButton>
          </Box>

          <TableContainer sx={{ flexGrow: 1 }}>
            {loading ? (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "300px",
                }}
              >
                <Loader />
              </Box>
            ) : error ? (
              <Box sx={{ p: 3, textAlign: "center" }}>
                <Typography color="error">{error}</Typography>
              </Box>
            ) : filteredRows.length === 0 ? (
              <Box sx={{ p: 3, textAlign: "center" }}>
                <Typography
                  sx={{ color: darkMode ? "white" : "rgba(0, 0, 0, 0.87)" }}
                >
                  No data found
                </Typography>
              </Box>
            ) : (
              <Table
                sx={{ minWidth: 750 }}
                aria-labelledby="tableTitle"
                size={dense ? "small" : "medium"}
              >
                <EnhancedTableHead
                  numSelected={selected.length}
                  order={order}
                  orderBy={orderBy}
                  onSelectAllClick={handleSelectAllClick}
                  onRequestSort={handleRequestSort}
                  rowCount={filteredRows.length}
                  headCells={
                    customColumns && customColumns.length > 0
                      ? headCells.filter((cell) =>
                        customColumns.includes(cell.id),
                      )
                      : headCells
                  }
                  darkMode={darkMode}
                />
                <TableBody>
                  {visibleRows.map((row, index) => {
                    const rowId = row.id || row._id || `row-${index}`;
                    const isItemSelected = isSelected(rowId);
                    const labelId = `enhanced-table-checkbox-${index}`;

                    return (
                      <TableRow
                        hover
                        onClick={(event) => handleClick(event, rowId)}
                        role="checkbox"
                        aria-checked={isItemSelected}
                        tabIndex={-1}
                        key={rowId}
                        selected={isItemSelected}
                        sx={{
                          cursor: "pointer",
                          bgcolor: "transparent",
                          "&.Mui-selected": {
                            bgcolor: darkMode
                              ? "rgba(144, 202, 249, 0.2)"
                              : "rgba(25, 118, 210, 0.15)",
                          },
                          "&.Mui-selected:hover": {
                            bgcolor: darkMode
                              ? "rgba(144, 202, 249, 0.3)"
                              : "rgba(25, 118, 210, 0.25)",
                          },
                          "&:hover": {
                            bgcolor: darkMode
                              ? "rgba(255, 255, 255, 0.05)"
                              : "rgba(0, 0, 0, 0.04)",
                          },
                        }}
                      >
                        <TableCell
                          padding="checkbox"
                          sx={{
                            color: darkMode ? "white" : "rgba(0, 0, 0, 0.87)",
                            borderBottomColor: darkMode
                              ? "rgba(255, 255, 255, 0.12)"
                              : "rgba(0, 0, 0, 0.12)",
                          }}
                        >
                          <Checkbox
                            color="primary"
                            checked={isItemSelected}
                            inputProps={{
                              "aria-labelledby": labelId,
                            }}
                          />
                        </TableCell>

                        {(customColumns && customColumns.length > 0
                          ? headCells.filter((headCell) =>
                            customColumns.includes(headCell.id),
                          )
                          : headCells
                        ).map((headCell, idx) => (
                          <TableCell
                            key={headCell.id}
                            align={headCell.numeric ? "right" : "left"}
                            component={idx === 0 ? "th" : "td"}
                            id={idx === 0 ? labelId : undefined}
                            scope={idx === 0 ? "row" : undefined}
                            padding={
                              idx === 0 && !headCell.disablePadding
                                ? "none"
                                : "normal"
                            }
                            sx={{
                              color: darkMode
                                ? "rgba(255, 255, 255, 0.87)"
                                : "rgba(0, 0, 0, 0.87)",
                              borderBottomColor: darkMode
                                ? "rgba(255, 255, 255, 0.12)"
                                : "rgba(0, 0, 0, 0.12)",
                              fontWeight: idx === 0 ? 500 : 400,
                            }}
                          >
                            {typeof row[headCell.id] === "boolean"
                              ? row[headCell.id]
                                ? "True"
                                : "False"
                              : typeof row[headCell.id] === "object" && row[headCell.id] !== null
                              ? JSON.stringify(row[headCell.id])
                              : row[headCell.id]}
                          </TableCell>
                        ))}
                      </TableRow>
                    );
                  })}
                  {emptyRows > 0 && (
                    <TableRow
                      style={{
                        height: (dense ? 33 : 53) * emptyRows,
                      }}
                    >
                      <TableCell
                        colSpan={
                          (customColumns && customColumns.length > 0
                            ? customColumns.length
                            : headCells.length) + 1
                        }
                        sx={{
                          bgcolor: "transparent",
                          borderBottom: "none",
                        }}
                      />
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
            {/* Debug display */}
            {/* {!loading && !error && filteredRows.length > 0 && (
  <Box sx={{ p: 2, display: 'block' }}> 
    <Typography variant="caption">Data Sample (Debug): </Typography>
    <pre>{JSON.stringify(visibleRows[0], null, 2)}</pre>
  </Box>
)} */}
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredRows.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={{
              color: darkMode ? "white" : "inherit",
              ".MuiSvgIcon-root": {
                color: darkMode ? "white" : "inherit",
              },
              ".MuiTablePagination-selectLabel": {
                color: darkMode ? "white" : "inherit",
              },
              ".MuiTablePagination-displayedRows": {
                color: darkMode ? "white" : "inherit",
              },
              ".MuiTablePagination-select": {
                color: darkMode ? "white" : "inherit",
              },
            }}
          />
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              p: 2,
            }}
          >
            {/* Dense Padding Toggle */}
            <FormControlLabel
              control={
                <Switch
                  checked={dense}
                  onChange={handleChangeDense}
                  color="primary"
                />
              }
              label={densePaddingLabel}
              sx={{ color: darkMode ? "white" : "black" }}
            />

            <Box sx={{ display: "flex", gap: 2, pr: { xs: 8, sm: 10 } }}>
              <Button
                variant="outlined"
                color="warning"
                size="small"
                onClick={handleNotWhatYouExpected}
                startIcon={<HelpOutlineIcon />}
              >
                Not What You Expected?
              </Button>

              <Button
                variant="outlined"
                color="warning"
                size="small"
                onClick={handleDownloadCSV}
                startIcon={<DownloadIcon />}
                disabled={filteredRows.length === 0}
              >
                {selected.length > 0 ? `Download Selected (${selected.length})` : "Download CSV"}
              </Button>

              <Button
                variant="outlined"
                color="warning"
                size="small"
                onClick={() => setEmailModalOpen(true)}
                startIcon={<EmailIcon />}
                disabled={filteredRows.length === 0}
              >
                {selected.length > 0 ? `Email Selected (${selected.length})` : "Email Data"}
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>
{/* Dialog for "Not What You Expected" */}
      <RefineQueryDialog
        open={notExpectedDialogOpen}
        onClose={() => setNotExpectedDialogOpen(false)}
        darkMode={darkMode}
        refinementFeedback={refinementFeedback}
        setRefinementFeedback={setRefinementFeedback}
        currentQuery={currentQuery}
        onSubmit={handleRefinementSubmit}
      />
      {/* Email Data Modal */}
      <EmailDataModal
        open={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        data={selected.length > 0 ? filteredRows.filter(row => selected.includes(row.id || row._id)) : filteredRows}
        tableTitle={tableTitle}
        darkMode={darkMode}
      />
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => !isDeleting && setDeleteConfirmOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: darkMode ? "rgba(30, 30, 30, 0.95)" : "white",
            color: darkMode ? "white" : "black",
          }
        }}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: darkMode ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.6)" }}>
            Are you sure you want to permanently delete {selected.length} selected row{selected.length !== 1 ? 's' : ''}? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)} disabled={isDeleting} sx={{ color: darkMode ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.6)" }}>
            Cancel
          </Button>
          <Button onClick={handleDeleteSelected} color="error" variant="contained" disabled={isDeleting}>
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
      
    </Box>
    </ErrorBoundary>
  );
}
