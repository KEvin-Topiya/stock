package main

import (
	"io"
	"net/http"
)

func ipoHandler(w http.ResponseWriter, r *http.Request) {

	url := "https://portal.tradebrains.in/ipo/open_data"

	req, _ := http.NewRequest("GET", url, nil)
	req.Header.Set("User-Agent", "Mozilla/5.0")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		http.Error(w, "Failed to fetch IPO data", 500)
		return
	}
	defer resp.Body.Close()

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	io.Copy(w, resp.Body)
}

func main() {
	http.HandleFunc("/api/ipo", ipoHandler)
	http.ListenAndServe(":8080", nil)
}
