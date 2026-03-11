package main

import (
	"io"
	"net/http"
)

func ipoHandler(w http.ResponseWriter, r *http.Request) {

	url := "https://portal.tradebrains.in/_next/data/ausjJSiSNKMo2cwg3NZYn/ipo.json"

	resp, err := http.Get(url)
	if err != nil {
		http.Error(w, "Failed to fetch IPO data", 500)
		return
	}
	defer resp.Body.Close()

	w.Header().Set("Content-Type", "application/json")

	io.Copy(w, resp.Body)
}

func main() {
	http.HandleFunc("/api/ipo", ipoHandler)
	http.ListenAndServe(":8080", nil)
}
