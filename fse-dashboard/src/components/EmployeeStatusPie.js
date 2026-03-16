import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

function EmployeeStatusPie({ data, theme, setSelectedStatus, setOpenStatusModal }) {

  // -----------------------------
  // STATUS GROUPS
  // -----------------------------

  const statusGroups = {
    Active: ["Working", "Workng", "Will start work for 21 feb"],
    Resigned: ["Resigned"],
    Terminated: ["Termination Sent", "Termination based on PIP"],
    "Offer Issues": [
      "Offer letter pending",
      "Offer Revoked",
      "Offer Revoked - PIP"
    ],
    Left: ["Left", "Left - never started"]
  };

  // -----------------------------
  // INITIAL COUNT
  // -----------------------------

  const statusCount = {
    Active: 0,
    Resigned: 0,
    Terminated: 0,
    "Offer Issues": 0,
    Left: 0,
    Other: 0
  };

  // -----------------------------
  // COUNT LOGIC
  // -----------------------------

  data.forEach((item) => {

    const status = item["Employee status"];

    if (!status || status === "Unknown") return;

    let found = false;

    Object.keys(statusGroups).forEach((group) => {

      if (statusGroups[group].includes(status)) {
        statusCount[group] += 1;
        found = true;
      }

    });

    if (!found) {
      statusCount["Other"] += 1;
    }

  });

  // -----------------------------
  // PREPARE CHART DATA
  // -----------------------------

  const chartData = Object.keys(statusCount)
    .map((key) => ({
      name: key,
      value: statusCount[key]
    }))
    .filter((item) => item.value > 0);

  // -----------------------------
  // COLORS
  // -----------------------------

  const COLORS = [
    "#2ecc71",
    "#e74c3c",
    "#f39c12",
    "#3498db",
    "#9b59b6",
    "#95a5a6"
  ];
  const handlePieClick = (data) => {

  const status = data.name;

  setSelectedStatus(status);
  setOpenStatusModal(true);

};

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
        Employee Status Distribution
      </h2>

      <ResponsiveContainer width="100%" height={350}>

        <PieChart>

          <Pie
  data={chartData}
  dataKey="value"
  nameKey="name"
  outerRadius={120}
  label
  onClick={handlePieClick}
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

export default EmployeeStatusPie;