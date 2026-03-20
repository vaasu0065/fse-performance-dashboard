import React from "react";
import { Card, CardContent, Typography } from "@mui/material";

// "Active" = any status that looks like working/active — detected dynamically
const ACTIVE_KEYWORDS = ["working", "will start", "active"];

function isActiveStatus(status) {
  if (!status) return false;
  const s = status.toLowerCase();
  return ACTIVE_KEYWORDS.some((kw) => s.includes(kw));
}

function KPI({ data }) {
  const rows = Array.isArray(data) ? data : [];

  const totalEmployees = new Set(rows.map((r) => r["Email ID"]).filter(Boolean)).size;
  const totalMeetings  = rows.reduce((s, r) => s + (Number(r["Total_Meetings_Calc"]) || 0), 0);
  const avgMeetings    = totalEmployees > 0 ? (totalMeetings / totalEmployees).toFixed(2) : 0;
  const totalSales     = rows.reduce((s, r) => s + (Number(r["Total_Product_Sales"]) || 0), 0);
  // Dynamic active detection — no hardcoded status strings
  const activeEmployees = rows.filter((r) => isActiveStatus(r["Employee status"])).length;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "20px", marginBottom: "30px" }}>
      <KPIBox title="Total Employees"    value={totalEmployees} color="#7c3aed" />
      <KPIBox title="Total Meetings"     value={totalMeetings}  color="#3b82f6" />
      <KPIBox title="Avg Meetings / FSE" value={avgMeetings}    color="#f59e0b" />
      <KPIBox title="Total Product Sales" value={totalSales}   color="#10b981" />
      <KPIBox title="Active Employees"   value={activeEmployees} color="#14b8a6" />
    </div>
  );
}

function KPIBox({ title, value, color }) {
  return (
    <Card elevation={3}>
      <CardContent style={{ textAlign: "center" }}>
        <Typography variant="h6">{title}</Typography>
        <Typography variant="h4" sx={{ mt: 1, color: color || "primary.main", fontWeight: 700 }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default KPI;
