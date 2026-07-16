import React, { useState } from "react";
import {
  Toolbar,
  Typography,
  IconButton,
  Tooltip,
  InputBase,
  Menu,
  MenuItem,
  FormControl,
  Select,
  InputLabel,
  Button,
  Box,
  Paper,
  Popover,
  FormGroup,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import DeleteIcon from "@mui/icons-material/Delete";
import FilterListIcon from "@mui/icons-material/FilterList";
import SearchIcon from "@mui/icons-material/Search";

function EnhancedTableToolbar(props) {
  const {
    numSelected,
    title,
    onSearch,
    searchQuery,
    setSearchQuery,
    darkMode,
    onFilter,
    filterOptions,
    onDelete,
  } = props;

  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [filterSelections, setFilterSelections] = useState({});

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    onSearch(e.target.value);
  };

  const handleFilterClick = (event) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  const handleFilterApply = () => {
    onFilter(filterSelections);
    handleFilterClose();
  };

  const handleFilterChange = (category, value) => {
    setFilterSelections((prev) => ({
      ...prev,
      [category]: value,
    }));
  };

  const filterOpen = Boolean(filterAnchorEl);

  // Use the title from props or with a fallback
  const displayTitle =
    title || "Data Table";

  return (
    <Toolbar
      sx={[
        {
          pl: { sm: 2 },
          pr: { xs: 1, sm: 1 },
          py: 1,
          borderBottom: "1px solid",
          borderColor: darkMode
            ? "rgba(255, 255, 255, 0.12)"
            : "rgba(0, 0, 0, 0.12)",
        },
        numSelected > 0 && {
          bgcolor: (theme) =>
            alpha(
              theme.palette.primary.main,
              theme.palette.action.activatedOpacity,
            ),
        },
        darkMode && {
          bgcolor:
            numSelected > 0 ? "rgba(144, 202, 249, 0.16)" : "rgb(18, 18, 18)",
          color: "white",
        },
      ]}
    >
      {numSelected > 0 ? (
        <Typography
          sx={{ flex: "1 1 100%" }}
          color="inherit"
          variant="subtitle1"
          component="div"
        >
          {numSelected} selected
        </Typography>
      ) : (
        <Typography
          sx={{ flex: "1 1 30%", fontWeight: 600 }}
          variant="h6"
          id="tableTitle"
          component="div"
        >
          {displayTitle}
        </Typography>
      )}

      <Box sx={{ display: "flex", alignItems: "center", width: "50%" }}>
        <Paper
          sx={{
            p: "2px 4px",
            display: "flex",
            alignItems: "center",
            width: "100%",
            bgcolor: darkMode ? "rgba(255, 255, 255, 0.05)" : "#f5f5f5",
            border: "1px solid",
            borderColor: darkMode
              ? "rgba(255, 255, 255, 0.12)"
              : "rgba(0, 0, 0, 0.12)",
          }}
          elevation={1}
        >
          <InputBase
            sx={{
              ml: 1,
              flex: 1,
              color: darkMode ? "white" : "rgba(0, 0, 0, 0.87)",
              "&::placeholder": {
                color: darkMode
                  ? "rgba(255, 255, 255, 0.5)"
                  : "rgba(0, 0, 0, 0.42)",
              },
            }}
            placeholder={"Search..."}
            value={searchQuery}
            onChange={handleSearchChange}
          />
          <IconButton sx={{ p: "10px" }} aria-label="search">
            <SearchIcon
              sx={{ color: darkMode ? "white" : "rgba(0, 0, 0, 0.54)" }}
            />
          </IconButton>
        </Paper>
      </Box>

      {numSelected > 0 ? (
        <Tooltip title={"Delete"}>
          <IconButton onClick={onDelete}>
            <DeleteIcon
              sx={{ color: darkMode ? "white" : "rgba(0, 0, 0, 0.54)" }}
            />
          </IconButton>
        </Tooltip>
      ) : (
        <Tooltip title={"Filter list"}>
          <IconButton onClick={handleFilterClick}>
            <FilterListIcon
              sx={{ color: darkMode ? "white" : "rgba(0, 0, 0, 0.54)" }}
            />
          </IconButton>
        </Tooltip>
      )}

      <Popover
        open={filterOpen}
        anchorEl={filterAnchorEl}
        onClose={handleFilterClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        <Box
          sx={{
            p: 2,
            width: 250,
            bgcolor: darkMode ? "rgba(18, 18, 18, 0.9)" : "white",
            color: darkMode ? "white" : "black",
            borderRadius: 2,
            boxShadow: 3,
          }}
        >
          <Typography variant="h6" sx={{ mb: 2 }}>
            {"Filter Options"}
          </Typography>

          {filterOptions &&
            Object.keys(filterOptions).map((category) => (
              <Box key={category} sx={{ mb: 2 }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    mb: 1,
                    color: darkMode ? "white" : "rgba(0, 0, 0, 0.87)",
                  }}
                >
                  {category}
                </Typography>
                <FormGroup>
                  {filterOptions[category].map((option) => (
                    <FormControlLabel
                      key={option}
                      control={
                        <Checkbox
                          checked={filterSelections[category] === option}
                          onChange={() => handleFilterChange(category, option)}
                          sx={{
                            color: darkMode ? "white" : "rgba(0, 0, 0, 0.54)",
                            "&.Mui-checked": {
                              color: darkMode ? "#90caf9" : "primary.main",
                            },
                          }}
                        />
                      }
                      label={option}
                      sx={{ color: darkMode ? "white" : "rgba(0, 0, 0, 0.87)" }}
                    />
                  ))}
                </FormGroup>
              </Box>
            ))}

          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
            <Button
              onClick={handleFilterClose}
              sx={{ mr: 1, color: darkMode ? "#90caf9" : "primary.main" }}
            >
              {"Cancel"}
            </Button>
            <Button
              onClick={handleFilterApply}
              variant="contained"
              color="primary"
            >
              {"Apply"}
            </Button>
          </Box>
        </Box>
      </Popover>
    </Toolbar>
  );
}


export default EnhancedTableToolbar;
