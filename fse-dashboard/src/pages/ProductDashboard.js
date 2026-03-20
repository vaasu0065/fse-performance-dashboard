import React, { useEffect, useMemo, useState } from "react";
import {
  Box, Card, CardContent, Typography, useTheme, Grid, Chip, IconButton, Tooltip as MuiTooltip
} from "@mui/material";
import TableChartIcon from "@mui/icons-material/TableChart";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  ComposedChart, Line, Label,
  XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend
} from "recharts";

import { fetchData } from "../services/api";
import FiltersBar from "../components/FiltersBar";
import TideDrillTable from "../components/TideDrillTable";
import MeetingTrend from "../components/MeetingTrend";

const COLORS = ["#7c3aed", "#10b981", "#3b82f6", "#f59e0b", "#14b8a6", "#ec4899", "#0ea5e9", "#ef4444"];

function toChartTheme(muiTheme) {
  const isDark = muiTheme.palette.mode === "dark";
  return {
    background: muiTheme.palette.background.default,
    card: muiTheme.palette.background.paper,
    text: muiTheme.palette.text.primary,
    grid: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)",
    tooltipBg: isDark ? "#1f1f1f" : "#ffffff"
  };
}

// ── KPI strip ──────────────────────────────────────────────────────────────
function TideKPI({ rows }) {
  // KPI 1: Tide (All applied cases) — every case where Tide was applied
  const totalAllApplied = rows.reduce((s, r) => s + (Number(r["Tide (All applied cases)"]) || 0), 0);
  // KPI 2: Done transactions — Tide OB (UPI - BC011+QRPPVV01)
  const totalDone = rows.reduce((s, r) => s + (Number(r["Tide OB (UPI - BC011+QRPPVV01)"]) || 0), 0);
  // KPI 3: Pending = All applied - Done
  const totalPending = totalAllApplied - totalDone;
  const totalIns = rows.reduce((s, r) => s + (Number(r["Tide Insurance"]) || 0), 0);
  const totalMSME = rows.reduce((s, r) => s + (Number(r["Tide MSME"]) || 0), 0);
  const totalPPI = rows.reduce((s, r) => s + (Number(r["Tide - PPI"]) || 0), 0);

  const totalCorrectRef = rows.reduce((s, r) => s + (Number(r["Tide OB(with correct ref. code)"]) || 0), 0);

  const kpis = [
    { label: "Tide (All Applied Cases)", value: totalAllApplied, color: "#7c3aed" },
    { label: "Tide Correct Referral Code", value: totalCorrectRef, color: "#14b8a6" },
    { label: "Done Transactions (UPI)", value: totalDone, color: "#10b981" },
    { label: "Pending Transactions", value: totalPending < 0 ? 0 : totalPending, color: "#ef4444" },
    { label: "Tide Insurance", value: totalIns, color: "#f59e0b" },
    { label: "Tide MSME", value: totalMSME, color: "#3b82f6" },
    { label: "Tide - PPI", value: totalPPI, color: "#ec4899" },
    { label: "Tide OB with PP", value: rows.reduce((s, r) => s + (Number(r["Tide OB with PP"]) || 0), 0), color: "#0ea5e9" },
    { label: "Tide Incorrect Referral Code", value: rows.reduce((s, r) => s + (Number(r["Tide - incorrect referral code"]) || 0), 0), color: "#f97316" },
  ];

  return (
    <Box sx={{ display: "grid", gridTemplateColumns: "repeat(9,1fr)", gap: 2, mb: 3 }}>
      {kpis.map((k) => (
        <Card key={k.label} variant="outlined">
          <CardContent sx={{ textAlign: "center", py: 1.5 }}>
            <Typography variant="body2" color="text.secondary">{k.label}</Typography>
            <Typography variant="h5" sx={{ color: k.color, fontWeight: 700 }}>{k.value}</Typography>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}

// ── Reusable chart card ─────────────────────────────────────────────────────
function ChartCard({ title, subtitle, children }) {
  return (
    <Card variant="outlined" sx={{ height: "100%" }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 0.5 }}>{title}</Typography>
        {subtitle && <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{subtitle}</Typography>}
        {children}
      </CardContent>
    </Card>
  );
}

export default function ProductDashboard() {
  const muiTheme = useTheme();
  const ct = useMemo(() => toChartTheme(muiTheme), [muiTheme]);

  const [raw, setRaw] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [filters, setFilters] = useState({ tl: "", employee: "", status: "", employment: "" });
  const [productMeta, setProductMeta] = useState({ product_columns: [], product_totals: {}, product_groups: {} });

  // drill-down state
  const [drill, setDrill] = useState({ open: false, title: "", rows: [], editableCols: undefined });
  const openDrill = (title, rows, editableCols) => setDrill({ open: true, title, rows, editableCols: editableCols || undefined });
  const closeDrill = () => setDrill((p) => ({ ...p, open: false }));

  const load = async () => {
    const result = await fetchData();
    const safeRaw = Array.isArray(result) ? result : result.raw || [];
    setRaw(safeRaw);
    if (result && !Array.isArray(result)) {
      setProductMeta({
        product_columns: result.product_columns || [],
        product_totals: result.product_totals || {},
        product_groups: result.product_groups || {}
      });
    }
  };

  useEffect(() => {
    load();
    const iv = setInterval(load, 120000);
    return () => clearInterval(iv);
  }, []);

  // ── Detect available months from _month tag ──────────────────────────────
  const monthOptions = useMemo(() => {
    const seen = new Set();
    const result = [];
    (Array.isArray(raw) ? raw : []).forEach((row) => {
      const m = row["_month"];
      if (m && !seen.has(m)) { seen.add(m); result.push(m); }
    });
    // Sort chronologically using month name parsing
    result.sort((a, b) => {
      const parse = (s) => { const [mon, yr] = s.split(" "); return parseInt(yr) * 100 + new Date(`${mon} 1`).getMonth(); };
      return parse(a) - parse(b);
    });
    return result;
  }, [raw]);

  // ── Auto-select latest month on first load ─────────────────────────────────
  useEffect(() => {
    if (selectedMonth || monthOptions.length === 0) return;
    setSelectedMonth(monthOptions[monthOptions.length - 1]);
  }, [monthOptions]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── filtered rows — filter by _month tag, then by other filters ───────────
  const rows = useMemo(() => {
    return (Array.isArray(raw) ? raw : []).filter((row) => {
      // Month filter: use _month tag which is set per-sheet on the backend
      if (selectedMonth && row["_month"] !== selectedMonth) return false;
      if (filters.tl && row["TL"] !== filters.tl) return false;
      if (filters.employee && row["Name"] !== filters.employee) return false;
      if (filters.status && row["Employee status"] !== filters.status) return false;
      if (filters.employment && row["Employment type"] !== filters.employment) return false;
      return true;
    });
  }, [raw, filters, selectedMonth]);

  // // ── CHART 1: Tide OB vs OB with PP by TL (pending per TL) ─────────────────
  // const tlPendingData = useMemo(() => {
  //   const map = {};
  //   rows.forEach((r) => {
  //     const tl = r["TL"] || "Unknown";
  //     if (!map[tl]) map[tl] = { tl, ob: 0, pp: 0 };
  //     map[tl].ob += Number(r["Tide OB"]) || 0;
  //     map[tl].pp += Number(r["Tide OB with PP"]) || 0;
  //   });
  //   return Object.values(map)
  //     .map((d) => ({ ...d, pending: d.ob - d.pp }))
  //     .filter((d) => d.ob > 0)
  //     .sort((a, b) => b.pending - a.pending);
  // }, [rows]);

  // // ── CHART 2: Conversion rate OB → PP per TL ───────────────────────────────
  // const conversionData = useMemo(() => {
  //   return tlPendingData
  //     .filter((d) => d.ob > 0)
  //     .map((d) => ({
  //       tl: d.tl,
  //       rate: Math.round((d.pp / d.ob) * 100),
  //       ob: d.ob,
  //       pp: d.pp
  //     }))
  //     .sort((a, b) => b.rate - a.rate);
  // }, [tlPendingData]);

  // ── CHART 3: Offer Revoked employees who still have Tide OB ───────────────
  const revokedWithTide = useMemo(() => {
    return rows.filter(
      (r) => r["Offer letter status"] === "Offer Revoked" && (Number(r["Tide OB"]) || 0) > 0
    );
  }, [rows]);

  const revokedByTL = useMemo(() => {
    const map = {};
    revokedWithTide.forEach((r) => {
      const tl = r["TL"] || "Unknown";
      map[tl] = (map[tl] || 0) + 1;
    });
    return Object.entries(map).map(([tl, count]) => ({ tl, count })).sort((a, b) => b.count - a.count);
  }, [revokedWithTide]);

  // ── CHART 1 data: All Applied Cases vs Correct Referral Code by TL ─────────
  const appliedVsRefData = useMemo(() => {
    const map = {};
    rows.forEach((r) => {
      const tl = r["TL"] || "Unknown";
      if (!map[tl]) map[tl] = { tl, allApplied: 0, correctRef: 0 };
      map[tl].allApplied += Number(r["Tide (All applied cases)"]) || 0;
      map[tl].correctRef += Number(r["Tide OB(with correct ref. code)"]) || 0;
    });
    return Object.values(map).filter((d) => d.allApplied > 0).sort((a, b) => b.allApplied - a.allApplied);
  }, [rows]);

  // Rows sorted to match graph order (by allApplied desc, then by TL order in chart)
  const appliedVsRefTableRows = useMemo(() => {
    const tlOrder = appliedVsRefData.map((d) => d.tl);
    return rows
      .filter((r) => (Number(r["Tide (All applied cases)"]) || 0) > 0)
      .sort((a, b) => {
        const ai = tlOrder.indexOf(a["TL"] || "Unknown");
        const bi = tlOrder.indexOf(b["TL"] || "Unknown");
        if (ai !== bi) return ai - bi;
        return (Number(b["Tide (All applied cases)"]) || 0) - (Number(a["Tide (All applied cases)"]) || 0);
      });
  }, [rows, appliedVsRefData]);

  // ── CHART 2 data: Onboarded Tide — All Applied Cases vs OB with PP by TL ───
  const onboardedTideData = useMemo(() => {
    const map = {};
    rows.forEach((r) => {
      const tl = r["TL"] || "Unknown";
      if (!map[tl]) map[tl] = { tl, allApplied: 0, obWithPP: 0 };
      map[tl].allApplied += Number(r["Tide (All applied cases)"]) || 0;
      map[tl].obWithPP  += Number(r["Tide OB with PP"]) || 0;
    });
    return Object.values(map)
      .filter((d) => d.allApplied > 0)
      .map((d) => ({ ...d, gap: d.allApplied - d.obWithPP }))
      .sort((a, b) => b.allApplied - a.allApplied);
  }, [rows]);

  // ── CHART 3 data: UPI Done vs PPI by Employee (independent, not related) ──
  const upiVsPpiData = useMemo(() => {
    return rows
      .filter((r) => (Number(r["Tide OB (UPI - BC011+QRPPVV01)"]) || 0) > 0 || (Number(r["Tide - PPI"]) || 0) > 0)
      .map((r) => ({
        name:    r["Name"] || "Unknown",
        tl:      r["TL"]   || "Unknown",
        upi:     Number(r["Tide OB (UPI - BC011+QRPPVV01)"]) || 0,
        ppi:     Number(r["Tide - PPI"]) || 0,
      }))
      .sort((a, b) => (b.upi + b.ppi) - (a.upi + a.ppi))
      .slice(0, 20);
  }, [rows]);

  const upiVsPpiTableRows = useMemo(() => {
    const nameOrder = upiVsPpiData.map((d) => d.name);
    return rows
      .filter((r) => (Number(r["Tide OB (UPI - BC011+QRPPVV01)"]) || 0) > 0 || (Number(r["Tide - PPI"]) || 0) > 0)
      .sort((a, b) => {
        const ai = nameOrder.indexOf(a["Name"] || "Unknown");
        const bi = nameOrder.indexOf(b["Name"] || "Unknown");
        if (ai !== -1 && bi !== -1) return ai - bi;
        return (Number(b["Tide OB (UPI - BC011+QRPPVV01)"]) || 0) - (Number(a["Tide OB (UPI - BC011+QRPPVV01)"]) || 0);
      });
  }, [rows, upiVsPpiData]);

  const onboardedTideTableRows = useMemo(() => {
    const tlOrder = onboardedTideData.map((d) => d.tl);
    return rows
      .filter((r) => (Number(r["Tide (All applied cases)"]) || 0) > 0)
      .sort((a, b) => {
        const ai = tlOrder.indexOf(a["TL"] || "Unknown");
        const bi = tlOrder.indexOf(b["TL"] || "Unknown");
        if (ai !== bi) return ai - bi;
        return (Number(b["Tide (All applied cases)"]) || 0) - (Number(a["Tide (All applied cases)"]) || 0);
      });
  }, [rows, onboardedTideData]);

  const productBreakdown = useMemo(() => [
    { name: "All Applied Cases",    col: "Tide (All applied cases)",          value: rows.reduce((s, r) => s + (Number(r["Tide (All applied cases)"]) || 0), 0) },
    { name: "Correct Ref. Code",    col: "Tide OB(with correct ref. code)",   value: rows.reduce((s, r) => s + (Number(r["Tide OB(with correct ref. code)"]) || 0), 0) },
    { name: "UPI Done",             col: "Tide OB (UPI - BC011+QRPPVV01)",    value: rows.reduce((s, r) => s + (Number(r["Tide OB (UPI - BC011+QRPPVV01)"]) || 0), 0) },
    { name: "OB with PP",           col: "Tide OB with PP",                   value: rows.reduce((s, r) => s + (Number(r["Tide OB with PP"]) || 0), 0) },
    { name: "PPI",                  col: "Tide - PPI",                        value: rows.reduce((s, r) => s + (Number(r["Tide - PPI"]) || 0), 0) },
    { name: "Insurance",            col: "Tide Insurance",                    value: rows.reduce((s, r) => s + (Number(r["Tide Insurance"]) || 0), 0) },
    { name: "MSME",                 col: "Tide MSME",                         value: rows.reduce((s, r) => s + (Number(r["Tide MSME"]) || 0), 0) },
    { name: "Incorrect Ref. Code",  col: "Tide - incorrect referral code",    value: rows.reduce((s, r) => s + (Number(r["Tide - incorrect referral code"]) || 0), 0), color: "#ef4444" },
  ].filter((d) => d.value > 0), [rows]);

  // ── CHART 5: Employees with pending transactions (OB > PP) ────────────────
  const pendingEmployees = useMemo(() => {
    return rows
      .filter((r) => (Number(r["Tide OB"]) || 0) > (Number(r["Tide OB with PP"]) || 0))
      .map((r) => ({
        ...r,
        pending: (Number(r["Tide OB"]) || 0) - (Number(r["Tide OB with PP"]) || 0)
      }))
      .sort((a, b) => b.pending - a.pending);
  }, [rows]);

  // ── CHART 5 data: Correct Ref Code vs Incorrect Ref Code by TL ─────────────
  const refCodeData = useMemo(() => {
    const map = {};
    rows.forEach((r) => {
      const tl = r["TL"] || "Unknown";
      if (!map[tl]) map[tl] = { tl, correct: 0, incorrect: 0 };
      map[tl].correct   += Number(r["Tide OB(with correct ref. code)"]) || 0;
      map[tl].incorrect += Number(r["Tide - incorrect referral code"]) || 0;
    });
    return Object.values(map)
      .filter((d) => d.correct > 0 || d.incorrect > 0)
      .map((d) => ({
        ...d,
        total:       d.correct + d.incorrect,
        correctPct:  d.correct + d.incorrect > 0 ? Math.round((d.correct / (d.correct + d.incorrect)) * 100) : 0
      }))
      .sort((a, b) => b.total - a.total);
  }, [rows]);

  const refCodeTableRows = useMemo(() => {
    const tlOrder = refCodeData.map((d) => d.tl);
    return rows
      .filter((r) => (Number(r["Tide OB(with correct ref. code)"]) || 0) > 0 || (Number(r["Tide - incorrect referral code"]) || 0) > 0)
      .sort((a, b) => {
        const ai = tlOrder.indexOf(a["TL"] || "Unknown");
        const bi = tlOrder.indexOf(b["TL"] || "Unknown");
        if (ai !== bi) return ai - bi;
        return (Number(b["Tide OB(with correct ref. code)"]) || 0) - (Number(a["Tide OB(with correct ref. code)"]) || 0);
      });
  }, [rows, refCodeData]);

  // ── CHART 6 data: Correct vs Incorrect Referral Code by Employee ────────────
  const refCodeByEmpData = useMemo(() => {
    return rows
      .filter((r) => (Number(r["Tide OB(with correct ref. code)"]) || 0) > 0 || (Number(r["Tide - incorrect referral code"]) || 0) > 0)
      .map((r) => {
        const correct   = Number(r["Tide OB(with correct ref. code)"]) || 0;
        const incorrect = Number(r["Tide - incorrect referral code"]) || 0;
        const total     = correct + incorrect;
        return {
          name:       r["Name"] || "Unknown",
          tl:         r["TL"]   || "Unknown",
          correct,
          incorrect,
          total,
          correctPct: total > 0 ? Math.round((correct / total) * 100) : 0
        };
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 20);
  }, [rows]);

  const refCodeByEmpTableRows = useMemo(() => {
    const nameOrder = refCodeByEmpData.map((d) => d.name);
    return rows
      .filter((r) => (Number(r["Tide OB(with correct ref. code)"]) || 0) > 0 || (Number(r["Tide - incorrect referral code"]) || 0) > 0)
      .sort((a, b) => {
        const ai = nameOrder.indexOf(a["Name"] || "Unknown");
        const bi = nameOrder.indexOf(b["Name"] || "Unknown");
        if (ai !== -1 && bi !== -1) return ai - bi;
        return (Number(b["Tide OB(with correct ref. code)"]) || 0) - (Number(a["Tide OB(with correct ref. code)"]) || 0);
      });
  }, [rows, refCodeByEmpData]);

  // ── CHART 7 data: Tide MSME by Employee ──────────────────────────────────
  const msmData = useMemo(() => {
    return rows
      .filter((r) => (Number(r["Tide MSME"]) || 0) > 0)
      .map((r) => ({
        name:  r["Name"] || "Unknown",
        tl:    r["TL"]   || "Unknown",
        msme:  Number(r["Tide MSME"]) || 0,
      }))
      .sort((a, b) => b.msme - a.msme)
      .slice(0, 15);
  }, [rows]);

  // ── CHART 8 data: Tide Insurance by Employee ──────────────────────────────
  const insData = useMemo(() => {
    return rows
      .filter((r) => (Number(r["Tide Insurance"]) || 0) > 0)
      .map((r) => ({
        name: r["Name"] || "Unknown",
        tl:   r["TL"]   || "Unknown",
        ins:  Number(r["Tide Insurance"]) || 0,
      }))
      .sort((a, b) => b.ins - a.ins)
      .slice(0, 15);
  }, [rows]);

  // ── CHART 9 data: All Tide product columns — count + % of All Applied Cases ──
  const allProductsData = useMemo(() => {
    const totalApplied = rows.reduce((s, r) => s + (Number(r["Tide (All applied cases)"]) || 0), 0);
    const cols = [
      { product: "All Applied",      col: "Tide (All applied cases)" },
      { product: "Correct Ref Code", col: "Tide OB(with correct ref. code)" },
      { product: "UPI Done",         col: "Tide OB (UPI - BC011+QRPPVV01)" },
      { product: "OB with PP",       col: "Tide OB with PP" },
      { product: "PPI",              col: "Tide - PPI" },
      { product: "Insurance",        col: "Tide Insurance" },
      { product: "MSME",             col: "Tide MSME" },
      { product: "Incorrect Ref",    col: "Tide - incorrect referral code" },
    ];
    return cols.map(({ product, col }) => {
      const sales = rows.reduce((s, r) => s + (Number(r[col]) || 0), 0);
      const pct = totalApplied > 0 ? Math.round((sales / totalApplied) * 100) : 0;
      return { product, col, sales, pct };
    }).filter((d) => d.sales > 0);
  }, [rows]);

  // ── CHART 10 data: Tide Onboarding Conversion Rate by Month ─────────────
  const conversionByMonthData = useMemo(() => {
    const map = {};
    (Array.isArray(raw) ? raw : []).forEach((r) => {
      const month = r["_month"] || "Unknown";
      if (!map[month]) map[month] = { month, applied: 0, obWithPP: 0 };
      map[month].applied  += Number(r["Tide (All applied cases)"]) || 0;
      map[month].obWithPP += Number(r["Tide OB with PP"]) || 0;
    });
    return Object.values(map)
      .filter((d) => d.applied > 0)
      .map((d) => ({
        ...d,
        rate: Math.round((d.obWithPP / d.applied) * 100),
        pending: d.applied - d.obWithPP,
      }))
      .sort((a, b) => {
        // Sort chronologically
        const parse = (s) => {
          const [mon, yr] = (s || "").split(" ");
          return parseInt(yr || 0) * 100 + (new Date(`${mon} 1`).getMonth() + 1 || 0);
        };
        return parse(a.month) - parse(b.month);
      });
  }, [raw]);

  const tooltipStyle = { backgroundColor: ct.tooltipBg, color: ct.text, border: "none" };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "background.default", minHeight: "100vh" }}>
      <Typography variant="h4" sx={{ mb: 1 }}>Tide Product Analytics</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Click any bar or slice to see the employee drill-down table. Click a number in the table to edit and sync to Google Sheet.
      </Typography>

      <FiltersBar
        data={raw}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        filters={filters}
        setFilters={setFilters}
        monthOptions={monthOptions}
      />

      <TideKPI rows={rows} />

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3 }}>

        {/* CHART 1 — All Applied Cases vs Correct Referral Code by TL */}
        <ChartCard
          title="Tide: All Applied Cases vs Correct Referral Code by TL"
          subtitle="Compare total applied cases against those with correct referral codes per Team Leader"
        >
          <Box sx={{ position: "relative" }}>
            <MuiTooltip title="View full table sorted by chart order">
              <IconButton
                size="small"
                onClick={() => openDrill("All Applied Cases vs Correct Referral Code — by TL", appliedVsRefTableRows, ["Tide (All applied cases)", "Tide OB(with correct ref. code)"])}
                sx={{ position: "absolute", top: -8, right: 0, zIndex: 1, opacity: 0.7, "&:hover": { opacity: 1 } }}
              >
                <TableChartIcon fontSize="small" />
              </IconButton>
            </MuiTooltip>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                data={appliedVsRefData}
                onClick={(e) => {
                  if (!e?.activePayload) return;
                  const tl = e.activePayload[0]?.payload?.tl;
                  openDrill(`TL: ${tl} — Applied vs Correct Ref`, rows.filter((r) => r["TL"] === tl && (Number(r["Tide (All applied cases)"]) || 0) > 0).sort((a, b) => (Number(b["Tide (All applied cases)"]) || 0) - (Number(a["Tide (All applied cases)"]) || 0)), ["Tide (All applied cases)", "Tide OB(with correct ref. code)"]);
                }}
              >
                <CartesianGrid stroke={ct.grid} strokeDasharray="3 3" />
                <XAxis dataKey="tl" stroke={ct.text} tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={50} />
                <YAxis stroke={ct.text} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Bar dataKey="allApplied" name="All Applied Cases" fill="#7c3aed" radius={[4, 4, 0, 0]} style={{ cursor: "pointer" }} />
                <Bar dataKey="correctRef" name="Correct Referral Code" fill="#14b8a6" radius={[4, 4, 0, 0]} style={{ cursor: "pointer" }} />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </ChartCard>

        {/* CHART 2 — Onboarded Tide */}
        <ChartCard
          title="Onboarded Tide"
          subtitle="All Applied Cases vs OB with PP per TL — line shows gap (not yet onboarded)"
        >
          <Box sx={{ position: "relative" }}>
            <MuiTooltip title="View full table sorted by chart order">
              <IconButton
                size="small"
                onClick={() => openDrill("Onboarded Tide — by TL", onboardedTideTableRows, ["Tide (All applied cases)", "Tide OB with PP"])}
                sx={{ position: "absolute", top: -8, right: 0, zIndex: 1, opacity: 0.7, "&:hover": { opacity: 1 } }}
              >
                <TableChartIcon fontSize="small" />
              </IconButton>
            </MuiTooltip>
            <ResponsiveContainer width="100%" height={320}>
              <ComposedChart
                data={onboardedTideData}
                onClick={(e) => {
                  if (!e?.activePayload) return;
                  const tl = e.activePayload[0]?.payload?.tl;
                  openDrill(`TL: ${tl} — Onboarded Tide`, rows.filter((r) => r["TL"] === tl && (Number(r["Tide (All applied cases)"]) || 0) > 0).sort((a, b) => (Number(b["Tide (All applied cases)"]) || 0) - (Number(a["Tide (All applied cases)"]) || 0)), ["Tide (All applied cases)", "Tide OB with PP"]);
                }}
              >
                <CartesianGrid stroke={ct.grid} strokeDasharray="3 3" />
                <XAxis dataKey="tl" stroke={ct.text} tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={50} />
                <YAxis yAxisId="left" stroke={ct.text} />
                <YAxis yAxisId="right" orientation="right" stroke="#ef4444" tickFormatter={(v) => v} label={{ value: "Gap", angle: 90, position: "insideRight", fill: "#ef4444", fontSize: 11 }} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(val, name) => [val, name]}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="allApplied" name="All Applied Cases" fill="#7c3aed" radius={[4, 4, 0, 0]} style={{ cursor: "pointer" }} />
                <Bar yAxisId="left" dataKey="obWithPP" name="OB with PP" fill="#10b981" radius={[4, 4, 0, 0]} style={{ cursor: "pointer" }} />
                <Line yAxisId="right" type="monotone" dataKey="gap" name="Gap (not onboarded)" stroke="#ef4444" strokeWidth={2} dot={{ r: 4, fill: "#ef4444" }} strokeDasharray="5 3" />
              </ComposedChart>
            </ResponsiveContainer>
          </Box>
        </ChartCard>

        {/* CHART 3 — UPI vs PPI Transaction Breakdown by Employee */}
        <ChartCard
          title="UPI vs PPI Transactions by Employee"
          subtitle="Side-by-side comparison — UPI (BC011+QRPPVV01) and PPI are independent payment methods"
        >
          <Box sx={{ position: "relative" }}>
            <MuiTooltip title="View full table sorted by chart order">
              <IconButton
                size="small"
                onClick={() => openDrill("UPI vs PPI — by Employee", upiVsPpiTableRows, ["Tide OB (UPI - BC011+QRPPVV01)", "Tide - PPI"])}
                sx={{ position: "absolute", top: -8, right: 0, zIndex: 1, opacity: 0.7, "&:hover": { opacity: 1 } }}
              >
                <TableChartIcon fontSize="small" />
              </IconButton>
            </MuiTooltip>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                data={upiVsPpiData}
                barCategoryGap="20%"
                barGap={3}
                onClick={(e) => {
                  if (!e?.activePayload) return;
                  const name = e.activePayload[0]?.payload?.name;
                  openDrill(`Employee: ${name} — UPI vs PPI`, rows.filter((r) => r["Name"] === name), ["Tide OB (UPI - BC011+QRPPVV01)", "Tide - PPI"]);
                }}
              >
                <CartesianGrid stroke={ct.grid} strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke={ct.text} tick={{ fontSize: 10 }} interval={0} angle={-30} textAnchor="end" height={60} />
                <YAxis stroke={ct.text} allowDecimals={false} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(val, name) => [val, name]}
                />
                <Legend />
                <Bar dataKey="upi" name="Tide OB (UPI)" fill="#3b82f6" radius={[4, 4, 0, 0]} style={{ cursor: "pointer" }} />
                <Bar dataKey="ppi" name="Tide - PPI" fill="#f59e0b" radius={[4, 4, 0, 0]} style={{ cursor: "pointer" }} />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </ChartCard>

        {/* CHART 4 — Tide Product Mix (enhanced donut) */}
        <ChartCard
          title="Tide Product Mix"
          subtitle="All Tide transaction types — click a slice to drill into employees"
        >
          <Box sx={{ position: "relative" }}>
            <MuiTooltip title="View full table for all Tide columns">
              <IconButton
                size="small"
                onClick={() => openDrill("Tide Product Mix — All Employees", rows.filter((r) => productBreakdown.some((d) => (Number(r[d.col]) || 0) > 0)), productBreakdown.map((d) => d.col))}
                sx={{ position: "absolute", top: -8, right: 0, zIndex: 1, opacity: 0.7, "&:hover": { opacity: 1 } }}
              >
                <TableChartIcon fontSize="small" />
              </IconButton>
            </MuiTooltip>
            <ResponsiveContainer width="100%" height={360}>
              <PieChart>
                <Pie
                  data={productBreakdown}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={130}
                  paddingAngle={3}
                  label={({ name, percent, value }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={{ stroke: ct.text, strokeWidth: 1 }}
                  onClick={(entry) => {
                    if (entry?.col) openDrill(`${entry.name} — Employee Breakdown`, rows.filter((r) => (Number(r[entry.col]) || 0) > 0), [entry.col]);
                  }}
                  style={{ cursor: "pointer" }}
                >
                  {productBreakdown.map((d, i) => (
                    <Cell key={i} fill={d.color || COLORS[i % COLORS.length]} stroke={ct.card} strokeWidth={2} />
                  ))}
                  <Label
                    content={({ viewBox }) => {
                      const { cx, cy } = viewBox;
                      const total = productBreakdown.reduce((s, d) => s + d.value, 0);
                      return (
                        <g>
                          <text x={cx-70} y={cy - 10} textAnchor="middle" dominantBaseline="middle"
                            style={{ fontSize: 24, fontWeight: 700, fill: ct.text }}>
                            {total}
                          </text>
                          <text x={cx-70} y={cy + 14} textAnchor="middle" dominantBaseline="middle"
                            style={{ fontSize: 12, fill: ct.text, opacity: 0.55 }}>
                            Total
                          </text>
                        </g>
                      );
                    }}
                  />
                </Pie>
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(val, name) => [val, name]}
                />
                <Legend
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  formatter={(value, entry) => (
                    <span style={{ color: ct.text, fontSize: 12 }}>
                      {value} <strong style={{ color: entry.color }}>{entry.payload.value}</strong>
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </Box>
        </ChartCard>

        {/* CHART 5 — Correct vs Incorrect Referral Code by TL */}
        <ChartCard
          title="Referral Code Quality by Team Leader"
          subtitle="Correct vs incorrect referral codes per TL — line shows correct code success rate %"
        >
          <Box sx={{ position: "relative" }}>
            <MuiTooltip title="View full table sorted by chart order">
              <IconButton
                size="small"
                onClick={() => openDrill("Referral Code Quality — by TL", refCodeTableRows, ["Tide OB(with correct ref. code)", "Tide - incorrect referral code"])}
                sx={{ position: "absolute", top: -8, right: 0, zIndex: 1, opacity: 0.7, "&:hover": { opacity: 1 } }}
              >
                <TableChartIcon fontSize="small" />
              </IconButton>
            </MuiTooltip>
            <ResponsiveContainer width="100%" height={320}>
              <ComposedChart
                data={refCodeData}
                barCategoryGap="25%"
                barGap={4}
                onClick={(e) => {
                  if (!e?.activePayload) return;
                  const tl = e.activePayload[0]?.payload?.tl;
                  openDrill(`TL: ${tl} — Referral Code Quality`, refCodeTableRows.filter((r) => r["TL"] === tl), ["Tide OB(with correct ref. code)", "Tide - incorrect referral code"]);
                }}
              >
                <CartesianGrid stroke={ct.grid} strokeDasharray="3 3" />
                <XAxis dataKey="tl" stroke={ct.text} tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={50} />
                <YAxis yAxisId="left" stroke={ct.text} allowDecimals={false} label={{ value: "Count", angle: -90, position: "insideLeft", fill: ct.text, fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" stroke="#10b981" unit="%" domain={[0, 100]} tickFormatter={(v) => `${v}%`} label={{ value: "Success %", angle: 90, position: "insideRight", fill: "#10b981", fontSize: 11 }} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(val, name) => name === "Correct Code %" ? [`${val}%`, name] : [val, name]}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="correct" name="Correct Referral Code" fill="#10b981" radius={[4, 4, 0, 0]} style={{ cursor: "pointer" }} />
                <Bar yAxisId="left" dataKey="incorrect" name="Incorrect Referral Code" fill="#ef4444" radius={[4, 4, 0, 0]} style={{ cursor: "pointer" }} />
                <Line yAxisId="right" type="monotone" dataKey="correctPct" name="Correct Code %" stroke="#10b981" strokeWidth={2.5} dot={{ r: 5, fill: "#10b981", strokeWidth: 2, stroke: "#fff" }} strokeDasharray="5 3" />
              </ComposedChart>
            </ResponsiveContainer>
          </Box>
        </ChartCard>

        {/* CHART 6 — Correct vs Incorrect Referral Code by Employee */}
        <ChartCard
          title="Referral Code Quality by Employee"
          subtitle="Top 20 employees — correct vs incorrect referral codes. Line = correct code success rate %"
        >
          <Box sx={{ position: "relative" }}>
            <MuiTooltip title="View full table sorted by chart order">
              <IconButton
                size="small"
                onClick={() => openDrill("Referral Code Quality — by Employee", refCodeByEmpTableRows, ["Tide OB(with correct ref. code)", "Tide - incorrect referral code"])}
                sx={{ position: "absolute", top: -8, right: 0, zIndex: 1, opacity: 0.7, "&:hover": { opacity: 1 } }}
              >
                <TableChartIcon fontSize="small" />
              </IconButton>
            </MuiTooltip>
            <ResponsiveContainer width="100%" height={320}>
              <ComposedChart
                data={refCodeByEmpData}
                barCategoryGap="25%"
                barGap={4}
                onClick={(e) => {
                  if (!e?.activePayload) return;
                  const name = e.activePayload[0]?.payload?.name;
                  openDrill(`Employee: ${name} — Referral Code Quality`, rows.filter((r) => r["Name"] === name), ["Tide OB(with correct ref. code)", "Tide - incorrect referral code"]);
                }}
              >
                <CartesianGrid stroke={ct.grid} strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke={ct.text} tick={{ fontSize: 10 }} interval={0} angle={-30} textAnchor="end" height={60} />
                <YAxis yAxisId="left" stroke={ct.text} allowDecimals={false} label={{ value: "Count", angle: -90, position: "insideLeft", fill: ct.text, fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" stroke="#10b981" unit="%" domain={[0, 100]} tickFormatter={(v) => `${v}%`} label={{ value: "Success %", angle: 90, position: "insideRight", fill: "#10b981", fontSize: 11 }} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(val, name) => name === "Correct Code %" ? [`${val}%`, name] : [val, name]}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="correct" name="Correct Referral Code" fill="#10b981" radius={[4, 4, 0, 0]} style={{ cursor: "pointer" }} />
                <Bar yAxisId="left" dataKey="incorrect" name="Incorrect Referral Code" fill="#ef4444" radius={[4, 4, 0, 0]} style={{ cursor: "pointer" }} />
                <Line yAxisId="right" type="monotone" dataKey="correctPct" name="Correct Code %" stroke="#10b981" strokeWidth={2.5} dot={{ r: 5, fill: "#10b981", strokeWidth: 2, stroke: "#fff" }} strokeDasharray="5 3" />
              </ComposedChart>
            </ResponsiveContainer>
          </Box>
        </ChartCard>

        {/* CHART 7 — Tide MSME by Employee */}
        <ChartCard
          title="Tide MSME — Top 15 Employees"
          subtitle="Employees with highest Tide MSME count — horizontal bars for easy name reading"
        >
          <Box sx={{ position: "relative" }}>
            <MuiTooltip title="View full table">
              <IconButton
                size="small"
                onClick={() => openDrill("Tide MSME — All Employees", rows.filter((r) => (Number(r["Tide MSME"]) || 0) > 0).sort((a, b) => (Number(b["Tide MSME"]) || 0) - (Number(a["Tide MSME"]) || 0)), ["Tide MSME"])}
                sx={{ position: "absolute", top: -8, right: 0, zIndex: 1, opacity: 0.7, "&:hover": { opacity: 1 } }}
              >
                <TableChartIcon fontSize="small" />
              </IconButton>
            </MuiTooltip>
            <ResponsiveContainer width="100%" height={360}>
              <BarChart
                data={msmData}
                layout="vertical"
                margin={{ left: 10, right: 30 }}
                onClick={(e) => {
                  if (!e?.activePayload) return;
                  const name = e.activePayload[0]?.payload?.name;
                  openDrill(`Employee: ${name} — Tide MSME`, rows.filter((r) => r["Name"] === name), ["Tide MSME"]);
                }}
              >
                <CartesianGrid stroke={ct.grid} strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" stroke={ct.text} allowDecimals={false} />
                <YAxis dataKey="name" type="category" stroke={ct.text} width={120} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(val, _, props) => [`${val} (TL: ${props.payload.tl})`, "Tide MSME"]}
                />
                <Bar dataKey="msme" name="Tide MSME" radius={[0, 6, 6, 0]} style={{ cursor: "pointer" }}>
                  {msmData.map((_, i) => (
                    <Cell key={i} fill={`hsl(${200 + i * 8}, 70%, ${55 - i * 1.5}%)`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </ChartCard>

        {/* CHART 8 (new) — Tide Insurance by Employee */}
        <ChartCard
          title="Tide Insurance — Top 15 Employees"
          subtitle="Employees with highest Tide Insurance count — click a bar to drill down"
        >
          <Box sx={{ position: "relative" }}>
            <MuiTooltip title="View full table">
              <IconButton
                size="small"
                onClick={() => openDrill("Tide Insurance — All Employees", rows.filter((r) => (Number(r["Tide Insurance"]) || 0) > 0).sort((a, b) => (Number(b["Tide Insurance"]) || 0) - (Number(a["Tide Insurance"]) || 0)), ["Tide Insurance"])}
                sx={{ position: "absolute", top: -8, right: 0, zIndex: 1, opacity: 0.7, "&:hover": { opacity: 1 } }}
              >
                <TableChartIcon fontSize="small" />
              </IconButton>
            </MuiTooltip>
            <ResponsiveContainer width="100%" height={360}>
              <BarChart
                data={insData}
                layout="vertical"
                margin={{ left: 10, right: 30 }}
                onClick={(e) => {
                  if (!e?.activePayload) return;
                  const name = e.activePayload[0]?.payload?.name;
                  openDrill(`Employee: ${name} — Tide Insurance`, rows.filter((r) => r["Name"] === name), ["Tide Insurance"]);
                }}
              >
                <CartesianGrid stroke={ct.grid} strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" stroke={ct.text} allowDecimals={false} />
                <YAxis dataKey="name" type="category" stroke={ct.text} width={120} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(val, _, props) => [`${val} (TL: ${props.payload.tl})`, "Tide Insurance"]}
                />
                <Bar dataKey="ins" name="Tide Insurance" radius={[0, 6, 6, 0]} style={{ cursor: "pointer" }}>
                  {insData.map((_, i) => (
                    <Cell key={i} fill={`hsl(${150 + i * 6}, 65%, ${50 - i * 1.5}%)`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </ChartCard>

        {/* CHART 9 — All Tide Products Breakdown with % */}
        <ChartCard
          title="All Tide Products — Volume & Share"
          subtitle="Every Tide product column: total count + % share of all applied cases. Click a bar to drill down."
        >
          <Box sx={{ position: "relative" }}>
            <MuiTooltip title="View full table for all Tide products">
              <IconButton
                size="small"
                onClick={() => openDrill("All Tide Products — All Employees", rows.filter((r) => allProductsData.some((d) => (Number(r[d.col]) || 0) > 0)), allProductsData.map((d) => d.col))}
                sx={{ position: "absolute", top: -8, right: 0, zIndex: 1, opacity: 0.7, "&:hover": { opacity: 1 } }}
              >
                <TableChartIcon fontSize="small" />
              </IconButton>
            </MuiTooltip>
            <ResponsiveContainer width="100%" height={380}>
              <ComposedChart
                data={allProductsData}
                margin={{ top: 20, right: 50, left: 10, bottom: 80 }}
                onClick={(e) => {
                  if (!e?.activePayload) return;
                  const d = e.activePayload[0]?.payload;
                  if (!d) return;
                  openDrill(`${d.product} — Employee Breakdown`, rows.filter((r) => (Number(r[d.col]) || 0) > 0).sort((a, b) => (Number(b[d.col]) || 0) - (Number(a[d.col]) || 0)), [d.col]);
                }}
              >
                <CartesianGrid stroke={ct.grid} strokeDasharray="3 3" />
                <XAxis
                  dataKey="product"
                  stroke={ct.text}
                  tick={{ fontSize: 10 }}
                  interval={0}
                  angle={-35}
                  textAnchor="end"
                  height={90}
                />
                <YAxis yAxisId="left" stroke={ct.text} allowDecimals={false} label={{ value: "Count", angle: -90, position: "insideLeft", fill: ct.text, fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" stroke="#a78bfa" unit="%" domain={[0, 100]} tickFormatter={(v) => `${v}%`} label={{ value: "% of Applied", angle: 90, position: "insideRight", fill: "#a78bfa", fontSize: 11 }} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(val, name) => name === "% of Applied" ? [`${val}%`, name] : [val, name]}
                  labelFormatter={(label) => `Product: ${label}`}
                />
                <Legend verticalAlign="top" />
                <Bar yAxisId="left" dataKey="sales" name="Total Count" radius={[6, 6, 0, 0]} style={{ cursor: "pointer" }} label={{ position: "top", fontSize: 11, fill: ct.text, formatter: (v) => v > 0 ? v : "" }}>
                  {allProductsData.map((d, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
                <Line yAxisId="right" type="monotone" dataKey="pct" name="% of Applied" stroke="#a78bfa" strokeWidth={2.5} dot={{ r: 5, fill: "#a78bfa", strokeWidth: 2, stroke: "#fff" }} />
              </ComposedChart>
            </ResponsiveContainer>
          </Box>
        </ChartCard>

        {/* CHART 10 — Tide Onboarding Conversion Rate by Month */}
        <ChartCard
          title="Tide Onboarding Conversion Rate by Month"
          subtitle="All Applied Cases vs OB with PP — conversion rate % across Jan, Feb, Mar. Shows how many applied cases got fully onboarded each month."
        >
          <Box sx={{ position: "relative" }}>
            <MuiTooltip title="View full table for all months">
              <IconButton
                size="small"
                onClick={() => openDrill(
                  "Tide Conversion — All Months",
                  (Array.isArray(raw) ? raw : []).filter((r) => (Number(r["Tide (All applied cases)"]) || 0) > 0),
                  ["Tide (All applied cases)", "Tide OB with PP"]
                )}
                sx={{ position: "absolute", top: -8, right: 0, zIndex: 1, opacity: 0.7, "&:hover": { opacity: 1 } }}
              >
                <TableChartIcon fontSize="small" />
              </IconButton>
            </MuiTooltip>
            <ResponsiveContainer width="100%" height={340}>
              <ComposedChart data={conversionByMonthData} margin={{ top: 20, right: 50, left: 10, bottom: 10 }}>
                <CartesianGrid stroke={ct.grid} strokeDasharray="3 3" />
                <XAxis dataKey="month" stroke={ct.text} tick={{ fontSize: 12, fontWeight: 600 }} />
                <YAxis yAxisId="left" stroke={ct.text} allowDecimals={false}
                  label={{ value: "Count", angle: -90, position: "insideLeft", fill: ct.text, fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" stroke="#10b981" unit="%" domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                  label={{ value: "Conv. Rate %", angle: 90, position: "insideRight", fill: "#10b981", fontSize: 11 }} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(val, name) => name === "Conversion Rate %" ? [`${val}%`, name] : [val, name]}
                  labelFormatter={(label) => `Month: ${label}`}
                />
                <Legend verticalAlign="top" />
                <Bar yAxisId="left" dataKey="applied" name="All Applied Cases" fill="#7c3aed" radius={[4, 4, 0, 0]}
                  label={{ position: "top", fontSize: 11, fill: ct.text, formatter: (v) => v > 0 ? v : "" }} />
                <Bar yAxisId="left" dataKey="obWithPP" name="OB with PP (Onboarded)" fill="#10b981" radius={[4, 4, 0, 0]}
                  label={{ position: "top", fontSize: 11, fill: ct.text, formatter: (v) => v > 0 ? v : "" }} />
                <Bar yAxisId="left" dataKey="pending" name="Pending (Not Onboarded)" fill="#ef444466" radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="rate" name="Conversion Rate %"
                  stroke="#10b981" strokeWidth={3}
                  dot={{ r: 7, fill: "#10b981", stroke: "#fff", strokeWidth: 2 }}
                  label={{ position: "top", fontSize: 13, fontWeight: 700, fill: "#10b981", formatter: (v) => `${v}%` }} />
              </ComposedChart>
            </ResponsiveContainer>
          </Box>
        </ChartCard>

      </Box>

      {/* Meeting Trend — same as Overview page, filtered by current month/filters */}
      <Box sx={{ mt: 3 }}>
        <MeetingTrend data={rows} theme={ct} />
      </Box>

      <TideDrillTable
        open={drill.open}
        onClose={closeDrill}
        title={drill.title}
        rows={drill.rows}
        editableCols={drill.editableCols}
      />
    </Box>
  );
}
