import CloseIcon from "@mui/icons-material/Close";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import React from "react";

export default function RefineQueryDialog({
  open,
  onClose,
  darkMode,
  refinementFeedback,
  setRefinementFeedback,
  currentQuery,
  onSubmit
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: darkMode ? "#1E1E1E" : "#FFFFFF",
          color: darkMode ? "#FFFFFF" : "inherit",
        },
      }}
    >
      <DialogTitle>
        Refine Your Query
        <IconButton
          onClick={onClose}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: darkMode ? "#FFFFFF" : "inherit",
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Not seeing the results you expected? Describe what you're looking
          for, and we'll try to improve your query.
        </Typography>
        <TextField
          autoFocus
          multiline
          rows={4}
          label="What were you looking for?"
          fullWidth
          variant="outlined"
          value={refinementFeedback}
          onChange={(e) => setRefinementFeedback(e.target.value)}
          sx={{
            mb: 2,
            "& .MuiOutlinedInput-root": {
              color: darkMode ? "#FFFFFF" : "inherit",
              "& fieldset": {
                borderColor: darkMode
                  ? "rgba(255,255,255,0.23)"
                  : "rgba(0,0,0,0.23)",
              },
            },
            "& .MuiInputLabel-root": {
              color: darkMode ? "rgba(255,255,255,0.7)" : "inherit",
            },
          }}
        />
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Current Query:
        </Typography>
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            mb: 2,
            bgcolor: darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
            borderColor: darkMode
              ? "rgba(255,255,255,0.12)"
              : "rgba(0,0,0,0.12)",
            fontFamily: "monospace",
          }}
        >
          <code>{currentQuery || "No active query"}</code>
        </Paper>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button onClick={onSubmit} variant="contained" color="primary">
          Submit Feedback
        </Button>
      </DialogActions>
    </Dialog>
  );
}
