import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

function EmploymentTypePie({ data, theme }) {

  // -----------------------------
  // COUNT EMPLOYMENT TYPES
  // -----------------------------

  const typeCount = {};

  data.forEach(item => {

    const type = item["Employment type"];

    if (!type || type === "Unknown") return;

    if (!typeCount[type]) {
      typeCount[type] = 0;
    }

    typeCount[type] += 1;

  });

  const chartData = Object.keys(typeCount).map(type => ({
    name: type,
    value: typeCount[type]
  }));


  // COLORS

  const COLORS = [
    "#3498db",
    "#2ecc71",
    "#f39c12",
    "#9b59b6",
    "#e74c3c"
  ];

  return (

    <div
  style={{
    marginBottom: "20px",
    padding: "20px",
    background: theme.card,
    borderRadius: "10px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
  }}
>

      <h2 style={{ color: theme.text }}>
        Employment Type Distribution
      </h2>

      <ResponsiveContainer width="100%" height={350}>

        <PieChart>

          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            outerRadius={120}
            label
          >

            {chartData.map((entry, index) => (

              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />

            ))}

          </Pie>

          <Tooltip
            contentStyle={{
              backgroundColor: theme.tooltipBg,
              color: theme.text
            }}
          />

          <Legend />

        </PieChart>

      </ResponsiveContainer>

    </div>

  );

}

export default EmploymentTypePie;