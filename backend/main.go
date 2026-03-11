package main

import (
	"io"
	"net/http"
)

func niftyHandler(w http.ResponseWriter, r *http.Request) {

	apiURL := "https://portal.tradebrains.in/api/index/constitients/NIFTY/?ascending=false&by=per_change&format=json&page=1&per_page=25"

	resp, err := http.Get(apiURL)
	if err != nil {
		http.Error(w, "API request failed", http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	// set JSON header
	w.Header().Set("Content-Type", "application/json")

	// copy API response to client
	io.Copy(w, resp.Body)
}

func main() {

	http.HandleFunc("/api/nifty", niftyHandler)

	http.ListenAndServe(":8080", nil)
}
