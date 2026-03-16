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

function TLChart({ data, theme }) {

  // -----------------------------
  // GROUP DATA BY TL
  // -----------------------------

  const tlData = {};

  data.forEach(item => {

    const tl = item["TL"] || "Unknown";

    const meetings = item["Total_Meetings_Calc"] || 0;

    if (!tlData[tl]) {
      tlData[tl] = 0;
    }

    tlData[tl] += meetings;

  });

  const chartData = Object.keys(tlData).map(tl => ({
    TL: tl,
    Meetings: tlData[tl]
  }));


  return (

    <div style={{ marginBottom: "40px" }}>

      <h2 style={{ color: theme.text }}>Team Leader Performance</h2>

      <ResponsiveContainer width="100%" height={300}>

        <BarChart data={chartData}>

          <CartesianGrid stroke={theme.grid} strokeDasharray="3 3" />

          <XAxis dataKey="TL" stroke={theme.text} />

          <YAxis stroke={theme.text} />

          <Tooltip
            contentStyle={{
              backgroundColor: theme.tooltipBg,
              color: theme.text
            }}
          />

          <Bar dataKey="Meetings" fill="#2c7be5" />

        </BarChart>

      </ResponsiveContainer>

    </div>

  );

}

export default TLChart;