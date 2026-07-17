import AttachFileIcon from "@mui/icons-material/AttachFile";
import CloseIcon from "@mui/icons-material/Close";
import DownloadIcon from "@mui/icons-material/Download";
import EmailIcon from "@mui/icons-material/Email";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import React, { useState } from "react";

import api from "../services/api";

const EmailDataModal = ({ open, onClose, data, tableTitle, darkMode }) => {
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState(`${tableTitle} Data Export`);
  const [message, setMessage] = useState(
    `Here is the requested data for ${tableTitle}.`,
  );
  const [loading, setLoading] = useState(false);
  const [sendCopy, setSendCopy] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const handleSendEmail = async () => {
    if (!email) {
      setNotification({
        open: true,
        message: "Please enter an email address.",
        severity: "error",
      });
      return;
    }
    setLoading(true);
    try {
      await api.post("/query/send-data-email", {
        recipientEmail: email,
        subject: subject || `${tableTitle} Data Export`,
        message: message,
        data: data,
        tableTitle: tableTitle,
        sendCopy: sendCopy
      });
      
      setNotification({
        open: true,
        message: "Email sent successfully!",
        severity: "success",
      });
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      setNotification({
        open: true,
        message: error.response?.data?.detail || "Failed to send email.",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };
  const handleDownload = () => {
    // Create CSV from data
    const headers = Object.keys(data[0] || {}).join(",");
    const csvRows = data.map((row) => Object.values(row).join(","));
    const csvContent = [headers, ...csvRows].join("\n");

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `${tableTitle.replace(/\s+/g, "_")}_data.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const closeNotification = () => {
    setNotification({ ...notification, open: false });
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={loading ? null : onClose}
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
          Share Data
          <IconButton
            onClick={onClose}
            disabled={loading}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
              color: darkMode ? "#FFFFFF" : "inherit",
              "&.Mui-disabled": {
                color: darkMode ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)",
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2, mt: 1 }}>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Send the current data view via email or download it as a CSV file.
            </Typography>

            <Box sx={{ display: "flex", mb: 3 }}>
              <Box
                sx={{
                  p: 2,
                  border: "1px dashed",
                  borderColor: darkMode
                    ? "rgba(255,255,255,0.23)"
                    : "rgba(0,0,0,0.23)",
                  borderRadius: 1,
                  display: "flex",
                  alignItems: "center",
                  mr: 2,
                }}
              >
                <AttachFileIcon sx={{ mr: 1 }} />
                <Typography variant="body2">
                  {data.length} records will be attached as CSV
                </Typography>
              </Box>

              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={handleDownload}
                sx={{ flexShrink: 0 }}
              >
                Download CSV
              </Button>
            </Box>

            <TextField
              label="Recipient Email"
              type="email"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
              sx={{
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

            <TextField
              label="Subject"
              fullWidth
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              margin="normal"
              sx={{
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

            <TextField
              label="Message"
              fullWidth
              multiline
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              margin="normal"
              sx={{
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

            <FormControlLabel
              control={
                <Checkbox
                  checked={sendCopy}
                  onChange={(e) => setSendCopy(e.target.checked)}
                  sx={{
                    color: darkMode ? "rgba(255,255,255,0.7)" : undefined,
                    "&.Mui-checked": {
                      color: darkMode ? "primary.light" : undefined,
                    },
                  }}
                />
              }
              label="Send me a copy"
              sx={{
                mt: 1,
                color: darkMode ? "#FFFFFF" : "inherit",
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} color="inherit" disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSendEmail}
            variant="contained"
            color="primary"
            startIcon={
              loading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <EmailIcon />
              )
            }
            disabled={!email || loading}
          >
            {loading ? "Sending..." : "Send Email"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={notification.open}
        autoHideDuration={5000}
        onClose={closeNotification}
      >
        <Alert
          onClose={closeNotification}
          severity={notification.severity}
          sx={{ width: "100%" }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default EmailDataModal;
