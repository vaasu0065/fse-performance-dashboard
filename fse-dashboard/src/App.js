import React, { useState } from "react";
import Dashboard from "./pages/Dashboard";
import ProductDashboard from "./pages/ProductDashboard";

import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import IconButton from "@mui/material/IconButton";
import Box from "@mui/material/Box";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";

import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";

import { BRAND } from "./theme";
import "./App.css";

function App() {
  const [mode, setMode] = useState("light");
  const [page, setPage] = useState("overview");

  const theme = createTheme({
    palette: {
      mode,
      primary: { main: BRAND.primary, light: BRAND.primaryMid, dark: "#0d3d24" },
      secondary: { main: BRAND.accent },
      background: {
        default: mode === "dark" ? "#111827" : "#f0f7f3",
        paper:   mode === "dark" ? "#1c2a3a" : "#ffffff",
      },
      text: {
        primary:   mode === "dark" ? "#f1f5f9" : "#1a2e22",
        secondary: mode === "dark" ? "#94a3b8" : "#4a7060",
      },
    },
    typography: {
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      h6: { fontWeight: 700, letterSpacing: 0.4 },
    },
    shape: { borderRadius: 12 },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 14,
            transition: "box-shadow 0.25s, transform 0.2s",
            // off-white tint in dark mode for cards/KPIs
            ...(mode === "dark" && {
              background: "#1e2d3d",
              border: "1px solid rgba(255,255,255,0.07)",
            }),
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            ...(mode === "dark" && { background: "#1e2d3d" }),
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            fontWeight: 600,
            fontSize: "0.82rem",
            letterSpacing: 1,
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.65)",
            minWidth: 100,
            "&.Mui-selected": { color: "#ffffff" },
            transition: "color 0.2s",
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          indicator: { backgroundColor: BRAND.accent, height: 3, borderRadius: 2 },
        },
      },
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      {/* ── NAVBAR ─────────────────────────────────────────────────── */}
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 1100,
          background: "linear-gradient(90deg, #071a0f 0%, #0f3320 40%, #1a5c38 100%)",
          borderBottom: `2.5px solid ${BRAND.accent}`,
          px: { xs: 2, md: 4 },
          py: 0,
          height: 62,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 2px 20px rgba(0,0,0,0.55)",
        }}
      >
        {/* LEFT — Logo image + FSE label */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexShrink: 0 }}>
          <Box
            component="img"
            src="/vegavruddhi-logo.svg"
            alt="Vegavruddhi"
            sx={{
              height: 44,
              width: 44,
              objectFit: "contain",
              filter: "brightness(0) invert(1)",   // makes the green logo white on dark nav
              animation: "pulse 3.5s ease-in-out infinite",
            }}
          />
          <Box sx={{ lineHeight: 1 }}>
            <Typography
              sx={{
                fontFamily: "'Georgia', serif",
                fontWeight: 700,
                fontSize: { xs: "0.95rem", md: "1.1rem" },
                color: "#ffffff",
                letterSpacing: 1.8,
                textTransform: "uppercase",
                lineHeight: 1.15,
              }}
            >
              Vegavruddhi
            </Typography>
            <Typography
              sx={{
                fontSize: "0.58rem",
                color: BRAND.accent,
                letterSpacing: 2.5,
                textTransform: "uppercase",
                fontWeight: 600,
              }}
            >
              FSE
            </Typography>
          </Box>
        </Box>

        {/* RIGHT — Tabs + Theme toggle */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Tabs
            value={page}
            onChange={(_, v) => setPage(v)}
            textColor="inherit"
          >
            <Tab value="overview" label="Overview" />
            <Tab value="products" label="Products" />
          </Tabs>

          <Box sx={{ width: "1px", height: 28, bgcolor: "rgba(255,255,255,0.15)", mx: 1 }} />

          <Tooltip title={mode === "dark" ? "Light Mode" : "Dark Mode"}>
            <IconButton
              onClick={() => setMode((p) => (p === "light" ? "dark" : "light"))}
              sx={{
                color: "#fff",
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.18)",
                width: 36,
                height: 36,
                "&:hover": {
                  background: "rgba(255,255,255,0.18)",
                  transform: "rotate(22deg) scale(1.1)",
                },
                transition: "all 0.25s ease",
              }}
              size="small"
            >
              {mode === "light" ? <DarkModeIcon fontSize="small" /> : <LightModeIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* ── PAGE CONTENT ───────────────────────────────────────────── */}
      <Box
        key={page}
        className="page-enter"
        sx={{
          minHeight: "calc(100vh - 62px)",
          bgcolor: "background.default",
          transition: "background-color 0.3s",
        }}
      >
        {page === "overview" ? <Dashboard /> : <ProductDashboard />}
      </Box>
    </ThemeProvider>
  );
}

export default App;
