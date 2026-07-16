import { useState } from "react";
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
} from "@mui/material";
import ScheduleIcon from "@mui/icons-material/Schedule";
import CloseIcon from "@mui/icons-material/Close";

// Email scheduling modal component
const ScheduleEmailModal = ({ open, onClose, query }) => {
  const [email, setEmail] = useState("");
  const [frequency, setFrequency] = useState("once");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");

  const handleSubmit = () => {
    // Send request to backend with parameters
    const scheduleParams = {
      query,
      email,
      frequency,
      scheduledDate,
      scheduledTime,
    };

    // Call your backend API here
    console.log("Sending schedule request:", scheduleParams);

    // Close the modal
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Schedule Email for Query
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: "absolute", right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <TextField
            label="Email Address"
            type="email"
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <FormControl fullWidth>
            <InputLabel>Frequency</InputLabel>
            <Select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              label="Frequency"
            >
              <MenuItem value="once">Once</MenuItem>
              <MenuItem value="daily">Daily</MenuItem>
              <MenuItem value="weekly">Weekly</MenuItem>
              <MenuItem value="monthly">Monthly</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Date"
            type="date"
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />

          <TextField
            label="Time"
            type="time"
            value={scheduledTime}
            onChange={(e) => setScheduledTime(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />

          <Box sx={{ bgcolor: "#f5f5f5", p: 2, borderRadius: 1 }}>
            <strong>Query:</strong> {query.slice(0, 100)}
            {query.length > 100 ? "..." : ""}
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={!email || !scheduledDate || !scheduledTime}
        >
          Schedule
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ScheduleEmailModal;
