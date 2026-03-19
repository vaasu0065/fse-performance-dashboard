import React, { useMemo } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";

function getMonthOptions(data) {
  const monthMap = new Map();
  const rows = Array.isArray(data) ? data : [];
  if (rows.length === 0) return [];
  // Only scan keys from first row — date columns are the same for all rows
  Object.keys(rows[0] || {}).forEach((col) => {
    const d = new Date(col);
    if (Number.isNaN(d.getTime())) return;
    const label = d.toLocaleString("default", { month: "long", year: "numeric" });
    const key = d.getFullYear() * 100 + (d.getMonth() + 1);
    if (!monthMap.has(label)) monthMap.set(label, key);
  });
  return Array.from(monthMap.entries())
    .sort((a, b) => a[1] - b[1])
    .map(([label]) => label);
}

function uniqueValues(data, key) {
  return Array.from(
    new Set((Array.isArray(data) ? data : []).map((r) => r?.[key]).filter(Boolean))
  ).sort((a, b) => String(a).localeCompare(String(b)));
}

export default function FiltersBar({
  data,
  selectedMonth,
  setSelectedMonth,
  filters,
  setFilters,
  monthOptions: monthOptionsProp   // optional override (e.g. from _month tag)
}) {
  const monthOptionsFromData = useMemo(() => getMonthOptions(data), [data]);
  const monthOptions = monthOptionsProp || monthOptionsFromData;
  const tlOptions = useMemo(() => uniqueValues(data, "TL"), [data]);
  const employeeOptions = useMemo(() => uniqueValues(data, "Name"), [data]);
  const statusOptions = useMemo(() => uniqueValues(data, "Employee status"), [data]);
  const employmentOptions = useMemo(() => uniqueValues(data, "Employment type"), [data]);

  const resetAll = () => {
    setSelectedMonth("");
    setFilters({ tl: "", employee: "", status: "", employment: "" });
  };

  return (
    <Card variant="outlined" sx={{ mb: 3 }}>
      <CardContent>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          useFlexGap
          flexWrap="wrap"
          alignItems={{ xs: "stretch", md: "center" }}
        >
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Month</InputLabel>
            <Select
              value={selectedMonth}
              label="Month"
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              <MenuItem value="">All Months</MenuItem>
              {monthOptions.map((m) => (
                <MenuItem key={m} value={m}>
                  {m}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Autocomplete
            options={tlOptions}
            value={filters.tl || null}
            onChange={(_, v) => setFilters((p) => ({ ...p, tl: v || "" }))}
            renderInput={(params) => <TextField {...params} label="Team Leader" />}
            sx={{ minWidth: 240, flexGrow: 1 }}
          />

          <Autocomplete
            options={employeeOptions}
            value={filters.employee || null}
            onChange={(_, v) => setFilters((p) => ({ ...p, employee: v || "" }))}
            renderInput={(params) => <TextField {...params} label="Employee" />}
            sx={{ minWidth: 240, flexGrow: 1 }}
          />

          <Autocomplete
            options={statusOptions}
            value={filters.status || null}
            onChange={(_, v) => setFilters((p) => ({ ...p, status: v || "" }))}
            renderInput={(params) => <TextField {...params} label="Status" />}
            sx={{ minWidth: 220, flexGrow: 1 }}
          />

          <Autocomplete
            options={employmentOptions}
            value={filters.employment || null}
            onChange={(_, v) => setFilters((p) => ({ ...p, employment: v || "" }))}
            renderInput={(params) => <TextField {...params} label="Employment type" />}
            sx={{ minWidth: 240, flexGrow: 1 }}
          />

          <Box sx={{ flexGrow: { xs: 0, md: 0 } }} />

          <Button variant="outlined" color="inherit" onClick={resetAll} sx={{ minWidth: 120 }}>
            Reset
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}

