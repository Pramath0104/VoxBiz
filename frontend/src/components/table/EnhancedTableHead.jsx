import React from "react";
import {
  TableHead,
  TableRow,
  TableCell,
  Checkbox,
  TableSortLabel,
  Box,
} from "@mui/material";
import { visuallyHidden } from "@mui/utils";

function EnhancedTableHead(props) {
  const {
    onSelectAllClick,
    order,
    orderBy,
    numSelected,
    rowCount,
    onRequestSort,
    headCells,
    darkMode,
  } = props;

  const createSortHandler = (property) => (event) => {
    onRequestSort(event, property);
  };

  return (
    <TableHead>
      <TableRow>
        <TableCell
          padding="checkbox"
          sx={{
            bgcolor: darkMode ? "rgba(255, 255, 255, 0.08)" : "#f5f5f5",
            color: darkMode ? "white" : "rgba(0, 0, 0, 0.87)",
          }}
        >
          <Checkbox
            color="primary"
            indeterminate={numSelected > 0 && numSelected < rowCount}
            checked={rowCount > 0 && numSelected === rowCount}
            onChange={onSelectAllClick}
            inputProps={{
              "aria-label": "select all items",
            }}
          />
        </TableCell>
        {headCells.map((headCell) => (
          <TableCell
            key={headCell.id}
            align={headCell.numeric ? "right" : "left"}
            padding={headCell.disablePadding ? "none" : "normal"}
            sortDirection={orderBy === headCell.id ? order : false}
            sx={{
              bgcolor: darkMode ? "rgba(255, 255, 255, 0.08)" : "#f5f5f5",
              color: darkMode ? "white" : "rgba(0, 0, 0, 0.87)",
              fontWeight: 600,
            }}
          >
            <TableSortLabel
              active={orderBy === headCell.id}
              direction={orderBy === headCell.id ? order : "asc"}
              onClick={createSortHandler(headCell.id)}
              sx={{
                "&.MuiTableSortLabel-root": {
                  color: darkMode
                    ? "rgba(255, 255, 255, 0.7)"
                    : "rgba(0, 0, 0, 0.87)",
                },
                "&.MuiTableSortLabel-root.Mui-active": {
                  color: darkMode ? "white" : "primary.main",
                },
                "& .MuiTableSortLabel-icon": {
                  color: darkMode
                    ? "rgba(255, 255, 255, 0.5) !important"
                    : "rgba(0, 0, 0, 0.54) !important",
                },
              }}
            >
              {headCell.label}
              {orderBy === headCell.id ? (
                <Box component="span" sx={visuallyHidden}>
                  {order === "desc" ? "sorted descending" : "sorted ascending"}
                </Box>
              ) : null}
            </TableSortLabel>
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}

export default EnhancedTableHead;
