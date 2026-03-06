import React, { useEffect, useState } from "react";

export default function IpoGmpPage() {
  const [ipoData, setIpoData] = useState([]);
  const [gmpData, setGmpData] = useState([]);
  const [view, setView] = useState("ipo");

  useEffect(() => {
    async function loadData() {
      try {
        const [ipoRes, gmpRes] = await Promise.all([
          fetch("https://b.jpassociate.co.in/ipo"),
          fetch("https://b.jpassociate.co.in/GM")
        ]);

        const ipoJson = await ipoRes.json();
        const gmpJson = await gmpRes.json();

        setIpoData(ipoJson?.ipoDropDownList || []);
        setGmpData(gmpJson?.reportTableData || []);

      } catch (err) {
        console.error("API error:", err);
      }
    }

    loadData();
  }, []);

  return (
    <div style={{ padding: 30, fontFamily: "Arial" }}>

      <h2 style={{ marginBottom: 20 }}>IPO & GMP Tracker</h2>

      <div style={{ marginBottom: 20 }}>
        <button
          onClick={() => setView("ipo")}
          style={{
            padding: "8px 16px",
            background: view === "ipo" ? "#007bff" : "#ddd",
            color: view === "ipo" ? "BLACK" : "black",
            border: "none",
            marginRight: 10,
            cursor: "pointer"
          }}
        >
          IPO List
        </button>

        <button
          onClick={() => setView("gmp")}
          style={{
            padding: "8px 16px",
            background: view === "gmp" ? "#007bff" : "#ddd",
            color: view === "gmp" ? "white" : "black",
            border: "none",
            cursor: "pointer"
          }}
        >
          GMP List
        </button>
      </div>

      {/* IPO TABLE */}

      {view === "ipo" && (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            boxShadow: "0 0 10px rgba(0,0,0,0.1)"
          }}
        >
          <thead style={{ background: "#000" }}>
            <tr>
              <th style={th}>Company</th>
              <th style={th}>Opening Date</th>
              <th style={th}>Closing Date</th>
              <th style={th}>Listing Date</th>
              <th style={th}>Category</th>
            </tr>
          </thead>

          <tbody>
            {ipoData.map((row, i) => {
              const [openDate, closeDate] =
                (row.ipo_period || "").split(" - ");

              return (
                <tr key={i} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={td}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {row.logo_url && (
                        <img
                          src={`https://b.jpassociate.co.in/${row.logo_url}`}
                          width="28"
                          alt=""
                        />
                      )}
                      {row.ipo_news_title}
                    </div>
                  </td>

                  <td style={td}>{openDate}</td>
                  <td style={td}>{closeDate}</td>

                  <td style={td}>
                    {row.orderdate
                      ? new Date(row.orderdate).toLocaleDateString()
                      : "-"}
                  </td>

                  <td style={td}>{row.issue_category}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* GMP TABLE */}

      {view === "gmp" && (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            boxShadow: "0 0 10px rgba(0,0,0,0.1)"
          }}
        >
          <thead style={{ background: "#000" }}>
            <tr>
              <th style={th}>Name</th>
              <th style={th}>GMP</th>
              <th style={th}>Rating</th>
              <th style={th}>Sub</th>
              <th style={th}>Price (₹)</th>
              <th style={th}>IPO Size</th>
              <th style={th}>Lot</th>
              <th style={th}>Open</th>
              <th style={th}>Close</th>
              <th style={th}>BoA Dt</th>
              <th style={th}>Listing</th>
              <th style={th}>Updated</th>
            </tr>
          </thead>

          <tbody>
            {gmpData.map((row, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #eee" }}>
                <td style={td}>{row["Name"]}</td>
                <td style={td}>{row["GMP"]}</td>
                <td style={td}>{row["Rating"]}</td>
                <td style={td}>{row["Sub"]}</td>
                <td style={td}>{row["Price (₹)"]}</td>
                <td style={td}>{row["IPO Size (₹ in cr)"]}</td>
                <td style={td}>{row["Lot"]}</td>
                <td style={td}>{row["Open"]}</td>
                <td style={td}>{row["Close"]}</td>
                <td style={td}>{row["BoA Dt"]}</td>
                <td style={td}>{row["Listing"]}</td>
                <td style={td}>{row["Updated-On"]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const th = {
  padding: "10px",
  textAlign: "left",
  fontWeight: "600",
  fontSize: "14px"
};

const td = {
  padding: "10px",
  fontSize: "14px"
};