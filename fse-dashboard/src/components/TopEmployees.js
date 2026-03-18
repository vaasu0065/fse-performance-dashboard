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

function TopEmployees({ data, theme }) {

  const sorted = [...data]
    .sort((a, b) => (b.Total_Points || 0) - (a.Total_Points || 0))
    .slice(0, 10);

  const chartData = sorted.map((item) => ({
    name: item["Name"],
    Points: item["Total_Points"] || 0
  }));

  return (

    <div
      style={{
        padding: "20px",
        background: theme.card,
        borderRadius: "10px"
      }}
    >

      <h2 style={{ color: theme.text }}>
        Top 10 Employees (Points)
      </h2>

      <ResponsiveContainer width="100%" height={300}>

        <BarChart data={chartData}>

          <CartesianGrid stroke={theme.grid} />

          <XAxis
            dataKey="name"
            stroke={theme.text}
          />

          <YAxis stroke={theme.text} />

          <Tooltip
            contentStyle={{
              backgroundColor: theme.tooltipBg,
              color: theme.text
            }}
          />

          <Bar
            dataKey="Points"
            fill="#2ecc71"
          />

        </BarChart>

      </ResponsiveContainer>

    </div>

  );

}

export default TopEmployees;