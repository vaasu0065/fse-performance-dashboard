import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer
} from "recharts";

function TopEmployees({ data }) {

  // -----------------------------
  // PREPARE EMPLOYEE DATA
  // -----------------------------

  const employeeData = data.map(item => ({
    name: item["Name"] || "Unknown",
    meetings: item["Total_Meetings_Calc"] || 0
  }));

  // -----------------------------
  // SORT BY MEETINGS
  // -----------------------------

  const topEmployees = employeeData
    .sort((a, b) => b.meetings - a.meetings)
    .slice(0, 10);

  return (

    <div style={{ marginBottom: "40px" }}>

      <h2>Top 10 Employees</h2>

      <ResponsiveContainer width="100%" height={400}>

        <BarChart
          data={topEmployees}
          layout="vertical"
        >

          <CartesianGrid strokeDasharray="3 3" />

          <XAxis type="number" />

          <YAxis
            dataKey="name"
            type="category"
            width={150}
          />

          <Tooltip />

          <Bar
            dataKey="meetings"
            fill="#28a745"
          />

        </BarChart>

      </ResponsiveContainer>

    </div>

  );

}

export default TopEmployees;