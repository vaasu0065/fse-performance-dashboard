import axios from "axios";

const API_URL = "http://127.0.0.1:8000/data";

export const fetchData = async (month) => {
  const res = await fetch(`http://127.0.0.1:8000/data?month=${month}`);
  return res.json();
};
