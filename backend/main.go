package main

import (
	"io"
	"net/http"
)

func niftyHandler(w http.ResponseWriter, r *http.Request) {

	url := "https://portal.tradebrains.in/api/index/constitients/NIFTY/?ascending=false&by=per_change&format=json&page=1&per_page=25"

	req, _ := http.NewRequest("GET", url, nil)

	req.Header.Set("User-Agent", "Mozilla/5.0")
	req.Header.Set("Accept", "application/json")
	req.Header.Set("Referer", "https://portal.tradebrains.in/")
	req.Header.Set("Origin", "https://portal.tradebrains.in")

	client := &http.Client{}

	resp, err := client.Do(req)
	if err != nil {
		http.Error(w, "request failed", 500)
		return
	}

	defer resp.Body.Close()

	w.Header().Set("Content-Type", "application/json")
	io.Copy(w, resp.Body)
}

func main() {
	http.HandleFunc("/api/nifty", niftyHandler)
	http.ListenAndServe(":8080", nil)
}
