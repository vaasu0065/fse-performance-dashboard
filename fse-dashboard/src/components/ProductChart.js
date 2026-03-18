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

function ProductChart({ data, theme, productMeta }) {
  const columns =
    productMeta?.product_columns && productMeta.product_columns.length > 0
      ? productMeta.product_columns
      : [];

  const productData = useMemo(() => {
    return columns
      .map((col) => {
        let total = 0;
        data.forEach((row) => { total += Number(row?.[col] || 0); });
        return { product: col, sales: total };
      })
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 12);
  }, [data, columns]);

  return (

    <div style={{ marginBottom: "40px" }}>

      <h2 style={{ color: theme?.text }}>Product Sales (Top Columns)</h2>

      <ResponsiveContainer width="100%" height={350}>

        <BarChart data={productData}>

          <CartesianGrid stroke={theme?.grid} strokeDasharray="3 3" />

          <XAxis dataKey="product" stroke={theme?.text} />

          <YAxis stroke={theme?.text} />

          <Tooltip
            contentStyle={{
              backgroundColor: theme?.tooltipBg,
              color: theme?.text
            }}
          />

          <Bar dataKey="sales" fill="#6f42c1" />

        </BarChart>

      </ResponsiveContainer>

    </div>

  );

}

export default ProductChart;