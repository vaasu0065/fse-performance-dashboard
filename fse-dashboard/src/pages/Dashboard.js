import React, { useEffect, useMemo, useState } from "react";
import { fetchData } from "../services/api";

import { Box, Typography, useTheme } from "@mui/material";

import KPI from "../components/KPI";
import TLChart from "../components/TLChart";
import TopEmployees from "../components/TopEmployees";
import MeetingTrend from "../components/MeetingTrend";
import ProductChart from "../components/ProductChart";
import EmployeeStatusPie from "../components/EmployeeStatusPie";
import EmploymentTypePie from "../components/EmploymentTypePie";
import EmployeeStatusTable from "../components/EmployeeStatusTable";
import FiltersBar from "../components/FiltersBar";

function Dashboard() {

  const [data, setData] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [productMeta, setProductMeta] = useState({
    product_columns: [],
    product_totals: {},
    product_groups: {}
  });

  const [selectedStatus, setSelectedStatus] = useState(null);
  const [openStatusModal, setOpenStatusModal] = useState(false);

  const muiTheme = useTheme();
  const chartTheme = useMemo(() => {
    const isDark = muiTheme.palette.mode === "dark";
    return {
      background: muiTheme.palette.background.default,
      card: muiTheme.palette.background.paper,
      text: muiTheme.palette.text.primary,
      grid: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)",
      tooltipBg: isDark ? "#1f1f1f" : "#ffffff"
    };
  }, [muiTheme.palette]);

  // -----------------------------
  // LOAD DATA
  // -----------------------------

  const loadData = async () => {
    const result = await fetchData();

    // IMPORTANT FIX 👇
    const safeData = Array.isArray(result) ? result : result.raw || [];

    setData(safeData);
    if (result && !Array.isArray(result)) {
      setProductMeta({
        product_columns: result.product_columns || [],
        product_totals: result.product_totals || {},
        product_groups: result.product_groups || {}
      });
    }
  };

  useEffect(() => {

    loadData();

    const interval = setInterval(() => {
      loadData();
    }, 120000);

    return () => clearInterval(interval);

  }, []);

  const [filters, setFilters] = useState({
    tl: "",
    employee: "",
    status: "",
    employment: ""
  });

  // Pre-compute which column keys belong to which "Month Year" label
  // so the filter loop never calls new Date() per row per key
  const dateKeyToMonthLabel = useMemo(() => {
    const map = {};
    const rows = Array.isArray(data) ? data : [];
    if (rows.length === 0) return map;
    Object.keys(rows[0] || {}).forEach((key) => {
      const d = new Date(key);
      if (!Number.isNaN(d.getTime())) {
        map[key] = d.toLocaleString("default", { month: "long", year: "numeric" });
      }
    });
    return map;
  }, [data]);

  const filteredData = useMemo(() => {
    const rows = Array.isArray(data) ? data : [];

    const base = rows.filter((row) => {
      if (filters.tl && row["TL"] !== filters.tl) return false;
      if (filters.employee && row["Name"] !== filters.employee) return false;
      if (filters.status && row["Employee status"] !== filters.status) return false;
      if (filters.employment && row["Employment type"] !== filters.employment) return false;
      return true;
    });

    if (!selectedMonth) return base;

    return base.map((row) => {
      let total = 0;
      const newRow = { ...row };

      Object.keys(dateKeyToMonthLabel).forEach((key) => {
        if (dateKeyToMonthLabel[key] === selectedMonth) {
          total += Number(row[key]) || 0;
        } else {
          newRow[key] = 0;
        }
      });

      newRow["Total_Meetings_Calc"] = total;
      return newRow;
    });
  }, [data, filters, selectedMonth, dateKeyToMonthLabel]);

  // -----------------------------
  // UI
  // -----------------------------

  return (

    <Box
      sx={{
        p: { xs: 2, md: 3 },
        bgcolor: "background.default",
        minHeight: "100vh"
      }}
    >
      <Typography variant="h4" sx={{ mb: 2 }}>
        FSE Performance Dashboard
      </Typography>

      <FiltersBar
        data={data}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        filters={filters}
        setFilters={setFilters}
      />

      <KPI data={filteredData} />

      {/* PIE */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gap: 3,
          mt: 2
        }}
      >
        <EmployeeStatusPie
          data={filteredData}
          theme={chartTheme}
          setSelectedStatus={setSelectedStatus}
          setOpenStatusModal={setOpenStatusModal}
        />
        <EmploymentTypePie
          data={filteredData}
          theme={chartTheme}
        />
      </Box>

      {/* TL + TOP */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gap: 3,
          mt: 3
        }}
      >
        <TLChart data={filteredData} theme={chartTheme} />
        <TopEmployees data={filteredData} theme={chartTheme} />
      </Box>

      {/* TREND + PRODUCT */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gap: 3,
          mt: 3
        }}
      >
        <MeetingTrend data={filteredData} theme={chartTheme} />
        <ProductChart data={filteredData} theme={chartTheme} productMeta={productMeta} />
      </Box>

      <EmployeeStatusTable
        open={openStatusModal}
        handleClose={() => setOpenStatusModal(false)}
        data={filteredData}
        status={selectedStatus}
      />

    </Box>
  );
}

export default Dashboard;