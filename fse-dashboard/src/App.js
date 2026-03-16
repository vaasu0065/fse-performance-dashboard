import React, { useState } from "react";
import Dashboard from "./pages/Dashboard";

import {
  ThemeProvider,
  createTheme
} from "@mui/material/styles";

import CssBaseline from "@mui/material/CssBaseline";
import IconButton from "@mui/material/IconButton";
import Box from "@mui/material/Box";

import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";

function App() {

  const [mode, setMode] = useState("light");

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

      <Dashboard />

    </ThemeProvider>

  );

}

export default App;