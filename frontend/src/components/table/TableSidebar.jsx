import CloseIcon from "@mui/icons-material/Close";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormGroup from "@mui/material/FormGroup";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import React from "react";

export default function TableSidebar({
  sidebarOpen,
  setSidebarOpen,
  darkMode,
  customQuery,
  setCustomQuery,
  handleCustomQuerySubmit,
  headCells,
  customColumns,
  handleColumnToggle,
  voiceCommandActive,
  toggleVoiceCommand,
  transcribedCommand,
  processVoiceCommand,
}) {
  return (
    <Drawer
      variant="temporary"
      anchor="right"
      open={sidebarOpen}
      onClose={() => setSidebarOpen(false)}
      sx={{
        width: 320,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: 320,
          boxSizing: "border-box",
          bgcolor: darkMode ? "#1E1E1E" : "#FFFFFF",
          color: darkMode ? "#FFFFFF" : "#000000",
          borderLeft: "1px solid",
          borderColor: darkMode ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)",
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="h6">Customizations</Typography>
          <IconButton onClick={() => setSidebarOpen(false)} size="small">
            <CloseIcon sx={{ color: darkMode ? "#FFFFFF" : "#000000" }} />
          </IconButton>
        </Box>

        <Divider
          sx={{
            mb: 2,
            bgcolor: darkMode ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)",
          }}
        />

        {/* Custom SQL Query */}
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Custom SQL Query
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={4}
          placeholder="Enter custom SQL query..."
          value={customQuery}
          onChange={(e) => setCustomQuery(e.target.value)}
          variant="outlined"
          size="small"
          sx={{
            mb: 2,
            "& .MuiOutlinedInput-root": {
              color: darkMode ? "#FFFFFF" : "inherit",
              "& fieldset": {
                borderColor: darkMode ? "rgba(255,255,255,0.23)" : "rgba(0,0,0,0.23)",
              },
              "&:hover fieldset": {
                borderColor: darkMode ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)",
              },
            },
          }}
        />

        <Button
          variant="contained"
          color="primary"
          onClick={handleCustomQuerySubmit}
          fullWidth
          sx={{ mb: 2 }}
        >
          Apply Query
        </Button>

        <Divider
          sx={{
            mb: 2,
            bgcolor: darkMode ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)",
          }}
        />

        {/* Column Selection */}
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Display Columns
        </Typography>
        <FormGroup sx={{ mb: 2 }}>
          {headCells.map((cell) => (
            <FormControlLabel
              key={cell.id}
              control={
                <Checkbox
                  checked={customColumns?.includes(cell.id)}
                  onChange={(e) => handleColumnToggle(e, cell.id)}
                  sx={{
                    color: darkMode ? "rgba(255,255,255,0.7)" : undefined,
                    "&.Mui-checked": {
                      color: darkMode ? "primary.light" : undefined,
                    },
                  }}
                />
              }
              label={cell.label}
              sx={{ color: darkMode ? "#FFFFFF" : "inherit" }}
            />
          ))}
        </FormGroup>

        <Divider
          sx={{
            mb: 2,
            bgcolor: darkMode ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)",
          }}
        />

        {/* Voice Commands for Refinement */}
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Voice Query Refinement
        </Typography>
        <Button
          variant={voiceCommandActive ? "contained" : "outlined"}
          color={voiceCommandActive ? "error" : "primary"}
          startIcon={voiceCommandActive ? <MicIcon /> : <MicOffIcon />}
          onClick={toggleVoiceCommand}
          fullWidth
          sx={{ mb: 2 }}
        >
          {voiceCommandActive ? "Stop Recording" : "Start Voice Refinement"}
        </Button>

        {transcribedCommand && (
          <Paper
            variant="outlined"
            sx={{
              p: 1,
              mb: 2,
              bgcolor: darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
              borderColor: darkMode ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)",
            }}
          >
            <Typography variant="body2" sx={{ fontStyle: "italic" }}>
              "{transcribedCommand}"
            </Typography>
          </Paper>
        )}

        <Button
          variant="outlined"
          color="primary"
          onClick={processVoiceCommand}
          fullWidth
          disabled={!transcribedCommand}
          sx={{ mb: 2 }}
        >
          Process Voice Refinement
        </Button>

        <Divider
          sx={{
            mb: 2,
            bgcolor: darkMode ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)",
          }}
        />
      </Box>
    </Drawer>
  );
}
