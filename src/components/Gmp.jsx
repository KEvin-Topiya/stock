import React, { useEffect, useState } from "react";

export default function GmpTable() {
  const [data, setData] = useState([]);
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("asc");

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("https://b.jpassociate.co.in/GM");
        const json = await res.json();

        const arr = json?.data || json?.gmp || json || [];
        setData(Array.isArray(arr) ? arr : []);
      } catch (err) {
        console.error("GMP API error:", err);
      }
    }

    fetchData();
  }, []);

  const getVal = (row, keys) => {
    for (let k of keys) {
      if (row[k] !== undefined && row[k] !== null) return row[k];
    }
    return "-";
  };

  const sortTable = (keys) => {
    const dir = sortKey === keys[0] && sortDir === "asc" ? "desc" : "asc";

    const sorted = [...data].sort((a, b) => {
      const aVal = getVal(a, keys);
      const bVal = getVal(b, keys);

      if (aVal < bVal) return dir === "asc" ? -1 : 1;
      if (aVal > bVal) return dir === "asc" ? 1 : -1;
      return 0;
    });

    setSortKey(keys[0]);
    setSortDir(dir);
    setData(sorted);
  };

  const columns = [
    { title: "Name", keys: ["name", "company"] },
    { title: "GMP", keys: ["gmp"] },
    { title: "Rating", keys: ["rating"] },
    { title: "Sub", keys: ["sub", "subscription"] },
    { title: "Price (₹)", keys: ["price"] },
    { title: "IPO Size (₹ in cr)", keys: ["ipo_size", "issue_size"] },
    { title: "Lot", keys: ["lot"] },
    { title: "Open", keys: ["open_date"] },
    { title: "Close", keys: ["close_date"] },
    { title: "BoA Dt", keys: ["boa_date", "allotment_date"] },
    { title: "Listing", keys: ["listing_date"] },
    { title: "Updated-On", keys: ["updated_on", "updated"] }
  ];

  return (
    <div style={{ padding: 20 }}>
      <h2>IPO GMP List</h2>

      <table border="1" cellPadding="8" style={{ width: "100%" }}>
        <thead>
          <tr>
            {columns.map((col, i) => (
              <th
                key={i}
                onClick={() => sortTable(col.keys)}
                style={{ cursor: "pointer" }}
              >
                {col.title} ▲▼
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {data.map((row, i) => (
            <tr key={i}>
              {columns.map((col, j) => (
                <td key={j}>{getVal(row, col.keys)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}