import React from "react";
import { FormControl, InputLabel, Select, MenuItem } from "@mui/material";

function MonthSlicer({ data, selectedMonth, setSelectedMonth }) {

  const getMonths = () => {
    if (!data || data.length === 0) return [];
    const months = new Set();
    data.forEach(item => {
      Object.keys(item).forEach(col => {
        const date = new Date(col);
        if (!isNaN(date)) {
          const monthName = date.toLocaleString("default", { month: "long" });
          months.add(monthName);
        }
      });
    });
    return [...months];
  };

  return (

    <FormControl style={{ minWidth: 200, marginBottom: "20px" }}>

      <InputLabel>Month</InputLabel>

      <Select
        value={selectedMonth}
        label="Month"
        onChange={(e) => setSelectedMonth(e.target.value)}
      >

        <MenuItem value="">All</MenuItem>

        {getMonths().map((month, index) => (

          <MenuItem key={index} value={month}>
            {month}
          </MenuItem>

        ))}

      </Select>

    </FormControl>

  );

}

export default MonthSlicer;