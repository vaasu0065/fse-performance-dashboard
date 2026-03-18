import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer
} from "recharts";

function TLChart({ data, theme }) {

  const chartData = useMemo(() => {
    const tlData = {};
    data.forEach((item) => {
      const tl = item["TL"] || "Unknown";
      tlData[tl] = (tlData[tl] || 0) + (item["Total_Points"] || 0);
    });
    return Object.keys(tlData).map((tl) => ({ TL: tl, Points: tlData[tl] }));
  }, [data]);

  return (

    <div
      style={{
        padding: "20px",
        background: theme.card,
        borderRadius: "10px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
      }}
    >

      <h2 style={{ color: theme.text }}>
        Team Leader Performance (Points)
      </h2>

      <ResponsiveContainer width="100%" height={300}>

        <BarChart data={chartData}>

          <CartesianGrid stroke={theme.grid} strokeDasharray="3 3" />

          <XAxis
            dataKey="TL"
            stroke={theme.text}
          />

          <YAxis
            stroke={theme.text}
          />

          <Tooltip
            contentStyle={{
              backgroundColor: theme.tooltipBg,
              border: "none",
              color: theme.text
            }}
          />

          <Bar
            dataKey="Points"
            fill="#2ecc71"
            radius={[5, 5, 0, 0]}
          />

        </BarChart>

      </ResponsiveContainer>

    </div>

  );

}

export default TLChart;