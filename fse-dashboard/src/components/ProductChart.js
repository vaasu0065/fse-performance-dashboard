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

function ProductChart({ data }) {

  // -----------------------------
  // PRODUCT COLUMNS
  // -----------------------------
  const products = [
    "Tide OB",
    "Tide OB with PP",
    "Tide Insurance",
    "Tide MSME",
    "Vehicle Insurance",
    "Aditya Birla",
    "Airtel Payments Bank",
    "Hero FinCorp"
  ];

  // -----------------------------
  // CALCULATE TOTAL SALES
  // -----------------------------
  const productData = products.map(product => {

    let total = 0;

    data.forEach(row => {
      total += Number(row[product] || 0);
    });

    return {
      product: product,
      sales: total
    };

  });

  return (

    <div style={{ marginBottom: "40px" }}>

      <h2>Product Sales Performance</h2>

      <ResponsiveContainer width="100%" height={350}>

        <BarChart data={productData}>

          <CartesianGrid strokeDasharray="3 3" />

          <XAxis dataKey="product" />

          <YAxis />

          <Tooltip />

          <Bar dataKey="sales" fill="#6f42c1" />

        </BarChart>

      </ResponsiveContainer>

    </div>

  );

}

export default ProductChart;