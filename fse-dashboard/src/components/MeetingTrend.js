import React, { useMemo } from "react";
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

  const chartData = useMemo(() => {
    const trend = {};

    // Detect date keys once from first row
    const dateKeys = data.length > 0
      ? Object.keys(data[0]).filter(col => !Number.isNaN(new Date(col).getTime()))
      : [];

    data.forEach(item => {
      dateKeys.forEach(col => {
        const meetings = Number(item[col]) || 0;
        if (meetings === 0) return;
        trend[col] = (trend[col] || 0) + meetings;
      });
    });

    return Object.keys(trend)
      .sort()
      .map(day => ({ date: day, meetings: trend[day] }));
  }, [data]);


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