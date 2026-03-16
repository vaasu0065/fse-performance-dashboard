import React from "react";
import { Card, CardContent, Typography } from "@mui/material";

function KPI({ data }) {

  const totalEmployees = new Set(
    (Array.isArray(data) ? data : []).map(item => item["Email ID"])
  ).size;

  const totalMeetings = data.reduce(
    (sum, item) => sum + (item["Total_Meetings_Calc"] || 0),
    0
  );

  const avgMeetings =
    totalEmployees > 0
      ? (totalMeetings / totalEmployees).toFixed(2)
      : 0;

  const totalSales = data.reduce(
    (sum, item) => sum + (item["Total_Product_Sales"] || 0),
    0
  );

  const activeStatuses = [
  "Working",
  "Workng",
  "Will start work for 21 feb"
];

const activeEmployees = data.filter(
  item => activeStatuses.includes(item["Employee status"])
).length;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(5, 1fr)",
        gap: "20px",
        marginBottom: "30px"
      }}
    >
      <KPIBox title="Total Employees" value={totalEmployees} />
      <KPIBox title="Total Meetings" value={totalMeetings} />
      <KPIBox title="Average Meetings" value={avgMeetings} />
      <KPIBox title="Total Product Sales" value={totalSales} />
      <KPIBox title="Active Employees" value={activeEmployees} />
    </div>
  );
}


// KPI BOX COMPONENT

function KPIBox({ title, value }) {

  return (
    <Card elevation={3}>
      <CardContent style={{ textAlign: "center" }}>

        <Typography variant="h6">
          {title}
        </Typography>

        <Typography
          variant="h4"
          style={{ color: "#1976d2", marginTop: "10px" }}
        >
          {value}
        </Typography>

      </CardContent>
    </Card>
  );

}

export default KPI;