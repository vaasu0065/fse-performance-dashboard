import React, { useEffect, useState } from "react";
import { fetchData } from "../services/api";

import KPI from "../components/KPI";
import TLChart from "../components/TLChart";
import TopEmployees from "../components/TopEmployees";
import MeetingTrend from "../components/MeetingTrend";
import ProductChart from "../components/ProductChart";
import DynamicFilter from "../components/DynamicFilter";
import EmployeeStatusPie from "../components/EmployeeStatusPie";
import EmploymentTypePie from "../components/EmploymentTypePie";
import EmployeeStatusTable from "../components/EmployeeStatusTable";
import MonthSlicer from "../components/MonthSlicer";

import { lightTheme, darkTheme } from "../theme";

function Dashboard() {

  const [allData, setAllData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("");

  const [selectedStatus, setSelectedStatus] = useState(null);
  const [openStatusModal, setOpenStatusModal] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const theme = darkMode ? darkTheme : lightTheme;

  // -----------------------------
  // LOAD DATA
  // -----------------------------

  const loadData = async () => {

    const result = await fetchData();

    setAllData(result);
    setFilteredData(result);

  };

  useEffect(() => {

    loadData();

    const interval = setInterval(() => {
      loadData();
    }, 120000);

    return () => clearInterval(interval);

  }, []);

  // -----------------------------
  // MONTH FILTER FUNCTION
  // -----------------------------

  const applyMonthFilter = (month) => {

    if (!month) {
      setFilteredData(allData);
      return;
    }

    const filtered = allData.map((row) => {

      let total = 0;
      let newRow = { ...row };

      Object.keys(row).forEach((key) => {

        if (key.toLowerCase().includes(month.toLowerCase())) {

          const value = Number(row[key]) || 0;
          total += value;

        } else if (!isNaN(row[key])) {

          newRow[key] = 0;

        }

      });

      newRow.Total_Meetings_Calc = total;

      return newRow;

    });

    setFilteredData(filtered);

  };

  // -----------------------------
  // RUN MONTH FILTER
  // -----------------------------

  useEffect(() => {

    applyMonthFilter(selectedMonth);

  }, [selectedMonth, allData]);

  return (

    <div
      style={{
        padding: "20px",
        background: theme.background,
        minHeight: "100vh"
      }}
    >

      <h1 style={{ color: theme.text }}>
        FSE Performance Dashboard
      </h1>

      <DynamicFilter
        data={allData}
        setFilteredData={setFilteredData}
      />

      <MonthSlicer
        data={allData}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
      />

      <KPI data={filteredData} theme={theme} />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "30px",
          marginTop: "20px"
        }}
      >

        <EmployeeStatusPie
          data={filteredData}
          theme={theme}
          setSelectedStatus={setSelectedStatus}
          setOpenStatusModal={setOpenStatusModal}
        />

        <EmploymentTypePie
          data={filteredData}
          theme={theme}
        />

      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "30px",
          marginTop: "30px"
        }}
      >

        <TLChart data={filteredData} theme={theme} />

        <TopEmployees data={filteredData} theme={theme} />

      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "30px",
          marginTop: "30px"
        }}
      >

        <MeetingTrend data={filteredData} theme={theme} />

        <ProductChart data={filteredData} theme={theme} />

      </div>

      <EmployeeStatusTable
        open={openStatusModal}
        handleClose={() => setOpenStatusModal(false)}
        data={filteredData}
        status={selectedStatus}
      />

    </div>

  );

}

export default Dashboard;