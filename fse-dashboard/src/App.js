import React, { useState } from "react";
import Dashboard from "./pages/Dashboard";
import ProductDashboard from "./pages/ProductDashboard";

import {
  ThemeProvider,
  createTheme
} from "@mui/material/styles";

import CssBaseline from "@mui/material/CssBaseline";
import IconButton from "@mui/material/IconButton";
import Box from "@mui/material/Box";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";

import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";

function App() {

  const [mode, setMode] = useState("light");
  const [page, setPage] = useState("overview");

  const theme = createTheme({
    palette: {
      mode: mode
    }
  });

  const toggleTheme = () => {

    setMode((prev) => (prev === "light" ? "dark" : "light"));

  };

  return (

    <ThemeProvider theme={theme}>

      <CssBaseline />

      {/* TOP NAV */}
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 1100,
          bgcolor: "background.default",
          borderBottom: "1px solid",
          borderColor: "divider",
          px: { xs: 2, md: 3 },
          py: 1
        }}
      >
        <Tabs
          value={page}
          onChange={(_, v) => setPage(v)}
          textColor="inherit"
          indicatorColor="primary"
        >
          <Tab value="overview" label="Overview" />
          <Tab value="products" label="Products" />
        </Tabs>
      </Box>

      {/* THEME TOGGLE BUTTON */}

      <Box
        sx={{
          position: "fixed",
          top: 20,
          right: 20,
          zIndex: 1000
        }}
      >

        <IconButton
          onClick={toggleTheme}
          color="inherit"
        >

          {mode === "light" ? <DarkModeIcon /> : <LightModeIcon />}

        </IconButton>

      </Box>

      {page === "overview" ? <Dashboard /> : <ProductDashboard />}

    </ThemeProvider>

  );

}

export default App;