export function createData(id, name, calories, fat, carbs, protein) {
  return { id, name, calories, fat, carbs, protein };
}

export function descendingComparator(a, b, orderBy) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

export function getComparator(order, orderBy) {
  return order === "desc"
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

// Generate table headers dynamically based on the first data row
export const generateHeadCells = (data) => {
  if (!data || data.length === 0) return [];

  // Collect all unique keys across all rows
  const allKeys = new Set();
  data.forEach(row => {
    Object.keys(row).forEach(key => allKeys.add(key));
  });

  return Array.from(allKeys)
    .filter((key) => key !== "id")
    .map((key) => {
      // Find the first non-null value for this key to determine if it's numeric
      const firstValidRow = data.find(row => row[key] !== null && row[key] !== undefined);
      const isNumeric = firstValidRow ? typeof firstValidRow[key] === "number" : false;
      
      return {
        id: key,
        numeric: isNumeric,
        disablePadding: false,
        label:
                    key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1"),
      };
    });
};
