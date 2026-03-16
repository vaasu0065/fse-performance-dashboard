import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer
} from "recharts";

function MeetingTrend({ data, theme }) {

  // Example aggregation (modify if needed)
  const trend = {};

  data.forEach(item => {

    Object.keys(item).forEach(col => {

      const date = new Date(col);

      if (!isNaN(date)) {

        const day = col;

        const meetings = Number(item[col]) || 0;

        if (!trend[day]) {
          trend[day] = 0;
        }

        trend[day] += meetings;

      }

    });

  });

  const chartData = Object.keys(trend).map(day => ({
    date: day,
    meetings: trend[day]
  }));


  return (

    <div style={{ marginBottom: "40px" }}>

      <h2 style={{ color: theme.text }}>Meeting Trend</h2>

      <ResponsiveContainer width="100%" height={300}>

        <LineChart data={chartData}>

          <CartesianGrid stroke={theme.grid} />

          <XAxis dataKey="date" stroke={theme.text} />

          <YAxis stroke={theme.text} />

          <Tooltip
            contentStyle={{
              backgroundColor: theme.tooltipBg,
              color: theme.text
            }}
          />

          <Line
            type="monotone"
            dataKey="meetings"
            stroke="#2c7be5"
            strokeWidth={2}
          />

        </LineChart>

      </ResponsiveContainer>

    </div>

  );

}

export default MeetingTrend;