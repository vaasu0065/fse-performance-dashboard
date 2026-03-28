import React, { useState } from "react";
import {
  Box, Card, CardContent, TextField, Button,
  Typography, Alert, InputAdornment, IconButton
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { BRAND } from "../theme";

const ADMIN_USERS = [
  { username: "admin", email: "admin@vegavruddhi.com", password: "admin@123" },
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login({ onLogin }) {
  const [tab, setTab]           = useState("login");
  const [username, setUsername] = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");

  const getUsers  = () => JSON.parse(localStorage.getItem("vv_users") || "[]");
  const saveUsers = (u) => localStorage.setItem("vv_users", JSON.stringify(u));

  const handleLogin = () => {
    setError("");
    const allUsers = [...ADMIN_USERS, ...getUsers()];
    const match = allUsers.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    if (!match) { setError("Invalid email or password."); return; }
    localStorage.setItem("vv_auth", JSON.stringify({ email: match.email, username: match.username }));
    onLogin({ email: match.email, username: match.username });
  };

  const handleSignup = () => {
    setError(""); setSuccess("");
    if (!username.trim() || !email.trim() || !password) {
      setError("All fields are required."); return;
    }
    if (!EMAIL_REGEX.test(email)) {
      setError("Please enter a valid email address."); return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters."); return;
    }
    const allUsers = [...ADMIN_USERS, ...getUsers()];
    if (allUsers.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
      setError("An account with this email already exists."); return;
    }
    saveUsers([...getUsers(), { username: username.trim(), email: email.trim(), password }]);
    setSuccess("Account created! You can now log in.");
    setTab("login");
    setUsername(""); setEmail(""); setPassword("");
  };

  const switchTab = (t) => { setTab(t); setError(""); setSuccess(""); setUsername(""); setEmail(""); setPassword(""); };

  return (
    <Box sx={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #071a0f 0%, #0f3320 50%, #1a5c38 100%)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", px: 2,
    }}>
      {/* Logo */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 4 }}>
        <Box component="img" src="/logo-full.png" alt="Vegavruddhi"
          sx={{ height: 52, objectFit: "contain", filter: "brightness(0) invert(1)" }} />
        <Box>
          <Typography sx={{ fontFamily: "'Georgia', serif", fontWeight: 700, fontSize: "1.4rem", color: "#fff", letterSpacing: 2, textTransform: "uppercase", lineHeight: 1.2 }}>
            Vegavruddhi
          </Typography>
          <Typography sx={{ fontSize: "0.65rem", color: BRAND.accent, letterSpacing: 3, textTransform: "uppercase", fontWeight: 600 }}>
            FSE Dashboard
          </Typography>
        </Box>
      </Box>

      {/* Card */}
      <Card sx={{ width: "100%", maxWidth: 420, borderRadius: 3, boxShadow: "0 8px 40px rgba(0,0,0,0.4)" }}>
        <CardContent sx={{ p: 4 }}>

          {/* Tab switcher */}
          <Box sx={{ display: "flex", mb: 3, borderRadius: 2, overflow: "hidden", border: "1px solid", borderColor: "divider" }}>
            {["login", "signup"].map((t) => (
              <Box key={t} onClick={() => switchTab(t)} sx={{
                flex: 1, py: 1.2, textAlign: "center", cursor: "pointer", fontWeight: 600,
                fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: 1,
                bgcolor: tab === t ? BRAND.primary : "transparent",
                color: tab === t ? "#fff" : "text.secondary",
                transition: "all 0.2s",
              }}>
                {t === "login" ? "Login" : "Register"}
              </Box>
            ))}
          </Box>

          <Typography variant="h6" sx={{ mb: 2.5, fontWeight: 700 }}>
            {tab === "login" ? "Admin Login" : "Create Admin Account"}
          </Typography>

          {error   && <Alert severity="error"   sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

          {/* Username — signup only */}
          {tab === "signup" && (
            <TextField fullWidth label="Username" variant="outlined"
              value={username} onChange={(e) => setUsername(e.target.value)}
              sx={{ mb: 2 }}
              onKeyDown={(e) => e.key === "Enter" && handleSignup()}
            />
          )}

          {/* Email */}
          <TextField fullWidth label="Email Address" type="email" variant="outlined"
            value={email} onChange={(e) => setEmail(e.target.value)}
            sx={{ mb: 2 }}
            onKeyDown={(e) => e.key === "Enter" && (tab === "login" ? handleLogin() : handleSignup())}
          />

          {/* Password */}
          <TextField fullWidth label="Password" variant="outlined"
            type={showPass ? "text" : "password"}
            value={password} onChange={(e) => setPassword(e.target.value)}
            sx={{ mb: 2 }}
            onKeyDown={(e) => e.key === "Enter" && (tab === "login" ? handleLogin() : handleSignup())}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPass((p) => !p)} edge="end" size="small">
                    {showPass ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Button fullWidth variant="contained" size="large"
            onClick={tab === "login" ? handleLogin : handleSignup}
            sx={{
              mt: 1, py: 1.4, fontWeight: 700, fontSize: "0.95rem",
              background: `linear-gradient(90deg, ${BRAND.primary}, #2d8a55)`,
              "&:hover": { background: `linear-gradient(90deg, #0d3d24, ${BRAND.primary})` },
            }}
          >
            {tab === "login" ? "Login" : "Create Account"}
          </Button>

          {tab === "login" && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: "center" }}>
              Default: admin@vegavruddhi.com / admin@123
            </Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
