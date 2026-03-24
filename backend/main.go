package main

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha1"
	"encoding/base32"
	"encoding/binary"
	"encoding/json"
	"fmt"
	"html"
	"io"
	"log"
	"math/rand"
	"net"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	openai "github.com/sashabaranov/go-openai"
)

//////////////////////////////////////////////////////////
// CONFIG
//////////////////////////////////////////////////////////

const baseURL = "https://apiconnect.angelone.in"
const masterURL = "https://margincalculator.angelbroking.com/OpenAPI_File/files/OpenAPIScripMaster.json"

var httpClient = &http.Client{Timeout: 20 * time.Second}

//////////////////////////////////////////////////////////
// GLOBALS
//////////////////////////////////////////////////////////

type Instrument struct {
	Token          string `json:"token"`
	Name           string `json:"name"`
	Symbol         string `json:"symbol"`
	Exchange       string `json:"exch_seg"`
	SymbolToken    string `json:"symbolToken"`
	InstrumentType string `json:"instrumenttype"`
}

var (
	instrumentList []Instrument
	tokenMap       = make(map[string]Instrument)
	jwtToken       string
	jwtMutex       sync.Mutex
)

type GainerRequest struct {
	Type string `json:"type"` // PercPriceGainers or PercPriceLosers
}

type ChartRequest struct {
	SymbolToken string `json:"symbolToken"`
	Timeframe   string `json:"timeframe"`
}

// ////////////////////////////////////////////////////////
// ////////////////////////////////////////////////////////

var call int = 0

func startBackgroundJobs() {
	rand.Seed(time.Now().UnixNano())

	// task1: run immediately then every 12 hours
	go func() {
		scra()
		ticker := time.NewTicker(12 * time.Hour)
		for range ticker.C {
			scra()
		}
	}()

	// task2: run randomly between 2–5 minutes
	go func() {
		for {
			gml()
			wait := time.Duration(2+rand.Intn(4)) * time.Minute
			time.Sleep(wait)
		}
	}()
}
func scra() {

	err := fetchAndStore(
		os.Getenv("u1"),
		"ipos.json",
	)

	if err != nil {
		fmt.Println("scrap error:", err)
	}
}
func gml() {

	err := fetchAndStoree(
		os.Getenv("u2"),
		"gmp.json",
	)

	if err != nil {
		fmt.Println("scrap error:", err)
	}
}
func stripHTML(input string) string {
	// Only remove HTML tags, keep text as is
	var output strings.Builder
	inTag := false
	for _, r := range input {
		switch r {
		case '<':
			inTag = true
		case '>':
			inTag = false
		default:
			if !inTag {
				output.WriteRune(r)
			}
		}
	}
	return strings.TrimSpace(html.UnescapeString(output.String()))
}

func fetchAndStoree(apiURL string, fileName string) error {
	resp, err := http.Get(apiURL)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return err
	}

	// Optional: parse JSON and only clean HTML-containing fields
	var apiResp map[string]interface{}
	if err := json.Unmarshal(data, &apiResp); err != nil {
		return err
	}

	// If reportTableData exists, strip HTML from relevant fields
	if items, ok := apiResp["reportTableData"].([]interface{}); ok {
		for _, item := range items {
			if m, ok := item.(map[string]interface{}); ok {
				for _, field := range []string{"Name", "GMP", "Rating", "Updated-On", "Anchor"} {
					if val, exists := m[field]; exists {
						if s, ok := val.(string); ok {
							m[field] = stripHTML(s)
						}
					}
				}
			}
		}
	}

	// Save cleaned JSON
	cleanedData, _ := json.MarshalIndent(apiResp, "", "  ")
	if err := os.WriteFile(fileName, cleanedData, 0644); err != nil {
		return err
	}

	fmt.Println("Saved cleaned data to:", fileName)
	return nil
}
func fetchAndStore(apiURL string, fileName string) error {

	resp, err := http.Get(apiURL)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return err
	}

	err = os.WriteFile(fileName, data, 0644)
	if err != nil {
		return err
	}

	fmt.Println("saved:", fileName)
	return nil
}

func ipoList(w http.ResponseWriter, r *http.Request) {

	// ✅ CORS headers
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	// ✅ Handle preflight request
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	// ✅ Allow GET or POST
	if r.Method != http.MethodPost && r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	file, err := os.ReadFile("ipos.json")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	call++
	fmt.Println("API calls:", call)

	// ✅ Correct content type
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write(file)
}

func gmList(w http.ResponseWriter, r *http.Request) {

	// ✅ CORS headers
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	// ✅ Handle preflight request
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	// ✅ Allow GET or POST
	if r.Method != http.MethodPost && r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	file, err := os.ReadFile("gmp.json")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	call++
	fmt.Println("API calls:", call)

	// ✅ Correct content type
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write(file)
}

// ///////
func main() {

	// godotenv.Load()

	log.Println("Loading Master Contract...")
	err := loadMasterContract()
	if err != nil {
		log.Fatal("Master contract error:", err)
	}
	startBackgroundJobs()

	http.HandleFunc("/ipo", ipoList)
	http.HandleFunc("/GM", gmList)
	log.Println("Logging in at startup...")
	token, err := login()
	if err != nil {
		log.Fatal("Login failed:", err)
	}
	jwtToken = token
	log.Println("Login successful")
	startMarketUpdater()
	http.HandleFunc("/api/search", searchHandler)
	http.HandleFunc("/api/prices", pricesHandler)
	http.HandleFunc("/logout", func(w http.ResponseWriter, r *http.Request) {
		logoutAndExit()
	})
	http.HandleFunc("/api/chat", StockChatHandler)
	http.HandleFunc("/api/chart", chartHandler)
	http.HandleFunc("/api/gainers", gainersHandler)

	log.Println("Server started at :8080")
	log.Fatal(http.ListenAndServe(":8080", corsMiddleware(http.DefaultServeMux)))
}
func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

//chart

func fetchHistorical(jwt, symbolToken, interval, fromDate, toDate, tf string) ([]map[string]interface{}, error) {

	url := baseURL + "/rest/secure/angelbroking/historical/v1/getCandleData"

	reqData := map[string]interface{}{
		"exchange":    "NSE",
		"symboltoken": symbolToken,
		"interval":    interval,
		"fromdate":    fromDate,
		"todate":      toDate,
	}

	jsonData, _ := json.Marshal(reqData)

	req, _ := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	setCommonHeaders(req)
	req.Header.Set("Authorization", "Bearer "+jwt)

	res, err := httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()

	body, _ := io.ReadAll(res.Body)

	var result map[string]interface{}
	json.Unmarshal(body, &result)

	rawData, ok := result["data"].([]interface{})
	if !ok {
		return nil, fmt.Errorf("no data")
	}

	var formatted []map[string]interface{}

	for _, candle := range rawData {

		row := candle.([]interface{})
		timeStr := row[0].(string)
		closePrice := row[4].(float64)

		formatted = append(formatted, map[string]interface{}{
			"time":  formatTimeForFrontend(timeStr, tf),
			"value": closePrice,
		})
	}

	return formatted, nil
}

func chartHandler(w http.ResponseWriter, r *http.Request) {

	var reqBody ChartRequest
	err := json.NewDecoder(r.Body).Decode(&reqBody)
	if err != nil || reqBody.SymbolToken == "" {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	jwt, err := getJWT()
	if err != nil {
		http.Error(w, "login failed", http.StatusInternalServerError)
		return
	}

	timeframes := []string{"1D", "1W", "1M", "1Y", "ALL"}

	response := make(map[string]interface{})

	for _, tf := range timeframes {

		interval, fromDate, toDate := resolveTimeframe(tf)

		data, err := fetchHistorical(jwt, reqBody.SymbolToken, interval, fromDate, toDate, tf)
		if err != nil {
			response[tf] = []interface{}{}
			continue
		}

		response[tf] = data
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}
func resolveTimeframe(tf string) (string, string, string) {

	now := time.Now()
	layout := "2006-01-02 15:04"

	switch tf {

	case "1D":
		return "ONE_HOUR",
			now.AddDate(0, 0, -1).Format(layout),
			now.Format(layout)

	case "1W":
		return "ONE_DAY",
			now.AddDate(0, 0, -7).Format(layout),
			now.Format(layout)

	case "1M":
		return "ONE_DAY",
			now.AddDate(0, -1, 0).Format(layout),
			now.Format(layout)

	case "1Y":
		return "ONE_DAY",
			now.AddDate(-1, 0, 0).Format(layout),
			now.Format(layout)

	case "ALL":
		return "ONE_DAY",
			now.AddDate(-5, 0, 0).Format(layout),
			now.Format(layout)

	default:
		return "ONE_DAY",
			now.AddDate(0, -1, 0).Format(layout),
			now.Format(layout)
	}
}
func formatTimeForFrontend(timeStr string, tf string) string {

	// 🔥 Correct parsing (SmartAPI returns RFC3339)
	t, err := time.Parse(time.RFC3339, timeStr)
	if err != nil {
		return ""
	}

	switch tf {

	case "1D":
		return t.Format("15:04") // 09:15

	case "1W", "1M":
		return t.Format("02 Jan") // 28 Feb

	case "1Y", "ALL":
		return t.Format("Jan 2006") // Feb 2026

	default:
		return t.Format("02 Jan")
	}
}

// ////////////////////////////////////////////////////////
// LOAD MASTER CONTRACT
// ////////////////////////////////////////////////////////
func loadMasterContract() error {

	resp, err := http.Get(masterURL)
	if err != nil {
		log.Println("master download error:", err)
		return err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Println("read body error:", err)
		return err
	}

	log.Println("master file size:", len(body))
	log.Println("first 200 chars:", string(body[:200]))

	var instruments []Instrument
	err = json.Unmarshal(body, &instruments)
	if err != nil {
		log.Println("json parse error:", err)
		return err
	}

	for _, inst := range instruments {

		if inst.Exchange != "NSE" {
			continue
		}

		inst.SymbolToken = inst.Token // map token

		instrumentList = append(instrumentList, inst)
		tokenMap[inst.Token] = inst
	}

	log.Println("loaded instruments:", len(instrumentList))
	return nil
}
func logoutAndExit() {

	if jwtToken == "" {
		fmt.Println("No active token. Skipping logout.")
		os.Exit(0)
	}

	fmt.Println("🚪 Logging out...")

	url := baseURL + "/rest/secure/angelbroking/user/v1/logout"

	logoutData := map[string]string{
		"clientcode": os.Getenv("CLIENT_CODE"),
	}

	jsonData, _ := json.Marshal(logoutData)

	req, _ := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	setCommonHeaders(req)
	req.Header.Set("Authorization", "Bearer "+jwtToken)

	res, err := httpClient.Do(req)
	if err != nil {
		fmt.Println("Logout error:", err)
		os.Exit(1)
	}
	defer res.Body.Close()

	body, _ := io.ReadAll(res.Body)

	fmt.Println("LOGOUT RESPONSE:")
	fmt.Println(string(body))

	os.Exit(0)
}

var cacheFile = "market_cache.json"

func startMarketUpdater() {
	go func() {
		for {
			updateMarketCache()
			time.Sleep(5 * time.Second)
		}
	}()
}

func updateMarketCache() {

	jwt, err := getJWT()
	if err != nil {
		return
	}

	url := baseURL + "/rest/secure/angelbroking/marketData/v1/gainersLosers"

	callAPI := func(datatype string) ([]interface{}, error) {

		reqData := map[string]interface{}{
			"datatype":   datatype,
			"expirytype": "NEAR",
		}

		jsonData, _ := json.Marshal(reqData)

		req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
		if err != nil {
			return nil, err
		}

		setCommonHeaders(req)
		req.Header.Set("Authorization", "Bearer "+jwt)

		res, err := httpClient.Do(req)
		if err != nil {
			return nil, err
		}
		defer res.Body.Close()

		body, err := io.ReadAll(res.Body)
		if err != nil {
			return nil, err
		}

		var result map[string]interface{}
		if err := json.Unmarshal(body, &result); err != nil {
			return nil, err
		}

		status, ok := result["status"].(bool)
		if !ok || !status {
			return []interface{}{}, nil
		}

		dataRaw, ok := result["data"]
		if !ok {
			return []interface{}{}, nil
		}

		data, ok := dataRaw.([]interface{})
		if !ok {
			return []interface{}{}, nil
		}

		// map company name
		for _, item := range data {
			row, ok := item.(map[string]interface{})
			if !ok {
				continue
			}

			tokenVal, exists := row["symbolToken"]
			if !exists {
				continue
			}

			var tokenStr string
			switch v := tokenVal.(type) {
			case float64:
				tokenStr = fmt.Sprintf("%.0f", v)
			case string:
				tokenStr = v
			default:
				continue
			}

			if inst, found := tokenMap[tokenStr]; found {
				row["companyName"] = inst.Name
			}
		}

		return data, nil
	}

	// load existing cache (if any)
	old := map[string]interface{}{
		"gainers": []interface{}{},
		"losers":  []interface{}{},
	}

	if b, err := os.ReadFile(cacheFile); err == nil {
		_ = json.Unmarshal(b, &old)
	}

	// fetch new (but if fails -> use old)
	gainers, err1 := callAPI("PercPriceGainers")
	if err1 != nil || len(gainers) == 0 {
		gainers = old["gainers"].([]interface{})
	}

	losers, err2 := callAPI("PercPriceLosers")
	if err2 != nil || len(losers) == 0 {
		losers = old["losers"].([]interface{})
	}

	cache := map[string]interface{}{
		"gainers": gainers,
		"losers":  losers,
	}

	file, _ := json.MarshalIndent(cache, "", "  ")
	_ = os.WriteFile(cacheFile, file, 0644)
}
func gainersHandler(w http.ResponseWriter, r *http.Request) {

	w.Header().Set("Content-Type", "application/json")

	// read cache
	data, err := os.ReadFile(cacheFile)
	if err != nil {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"gainers": []interface{}{},
			"losers":  []interface{}{},
		})
		return
	}

	w.Write(data)
}

//////////////////////////////////////////////////////////
// 🔎 SEARCH API
// GET /api/search?q=reli
//////////////////////////////////////////////////////////

func searchHandler(w http.ResponseWriter, r *http.Request) {

	w.Header().Set("Content-Type", "application/json")

	query := strings.ToLower(strings.TrimSpace(r.URL.Query().Get("q")))
	if query == "" {
		http.Error(w, "query required", http.StatusBadRequest)
		return
	}

	log.Println("🔎 search query:", query)
	log.Println("instrument count:", len(instrumentList))

	var results []Instrument

	for _, inst := range instrumentList {

		name := strings.ToLower(inst.Name)
		symbol := strings.ToLower(inst.Symbol)

		if strings.HasPrefix(name, query) ||
			strings.HasPrefix(symbol, query) ||
			strings.Contains(name, query) ||
			strings.Contains(symbol, query) {

			results = append(results, Instrument{
				Name:        inst.Name,
				Symbol:      inst.Symbol,
				SymbolToken: inst.Token,
				Exchange:    inst.Exchange,
			})

			log.Println("match:", inst.Name, inst.Symbol)
		}

		if len(results) >= 20 {
			break
		}
	}

	log.Println("results found:", len(results))

	if len(results) == 0 {
		// return empty array (frontend handles no result)
		json.NewEncoder(w).Encode([]Instrument{})
		return
	}

	json.NewEncoder(w).Encode(results)
}

//////////////////////////////////////////////////////////
// 💰 GLOBAL PRICE API
// POST /api/prices
// { "tokens": ["2885", "3045"] }
//////////////////////////////////////////////////////////

type PriceRequest struct {
	Tokens []string `json:"tokens"`
}

func pricesHandler(w http.ResponseWriter, r *http.Request) {

	var reqBody PriceRequest
	err := json.NewDecoder(r.Body).Decode(&reqBody)
	if err != nil || len(reqBody.Tokens) == 0 {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	jwt, err := getJWT()
	if err != nil {
		http.Error(w, "login failed", http.StatusInternalServerError)
		return
	}

	response, err := fetchPrices(jwt, reqBody.Tokens)
	if err != nil {
		http.Error(w, "price fetch failed", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(response)
}

//////////////////////////////////////////////////////////
// FETCH PRICES (MULTI OR SINGLE)
//////////////////////////////////////////////////////////

func fetchPrices(jwt string, tokens []string) ([]byte, error) {

	url := baseURL + "/rest/secure/angelbroking/market/v1/quote/"

	requestData := map[string]interface{}{
		"mode": "FULL",
		"exchangeTokens": map[string][]string{
			"NSE": tokens,
		},
	}

	jsonData, _ := json.Marshal(requestData)

	req, _ := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	setCommonHeaders(req)
	req.Header.Set("Authorization", "Bearer "+jwt)

	res, err := httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()

	return io.ReadAll(res.Body)
}

//////////////////////////////////////////////////////////
// JWT HANDLING
//////////////////////////////////////////////////////////

func getJWT() (string, error) {

	jwtMutex.Lock()
	defer jwtMutex.Unlock()

	if jwtToken != "" {
		return jwtToken, nil
	}

	token, err := login()
	if err != nil {
		return "", err
	}

	jwtToken = token
	return jwtToken, nil
}

//////////////////////////////////////////////////////////
// LOGIN
//////////////////////////////////////////////////////////

func login() (string, error) {

	url := baseURL + "/rest/auth/angelbroking/user/v1/loginByPassword"

	loginData := map[string]string{
		"clientcode": os.Getenv("CLIENT_CODE"),
		"password":   os.Getenv("PASSWORD"),
		"totp":       generateTOTP(os.Getenv("TOTP_SECRET")),
	}

	jsonData, _ := json.Marshal(loginData)

	req, _ := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	setCommonHeaders(req)

	res, err := httpClient.Do(req)
	if err != nil {
		return "", err
	}
	defer res.Body.Close()

	body, _ := io.ReadAll(res.Body)

	var result map[string]interface{}
	json.Unmarshal(body, &result)

	data := result["data"].(map[string]interface{})
	// fmt.Print(data["jwtToken"])
	return data["jwtToken"].(string), nil
}

//////////////////////////////////////////////////////////
// HEADERS
//////////////////////////////////////////////////////////

func setCommonHeaders(req *http.Request) {

	req.Header.Set("Accept", "application/json")
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-UserType", "USER")
	req.Header.Set("X-SourceID", "WEB")
	req.Header.Set("X-PrivateKey", os.Getenv("API_KEY"))
	req.Header.Set("X-ClientLocalIP", getLocalIP())
	req.Header.Set("X-ClientPublicIP", getPublicIP())
	req.Header.Set("X-MACAddress", getMacAddress())
}

//////////////////////////////////////////////////////////
// TOTP
//////////////////////////////////////////////////////////

func generateTOTP(secret string) string {

	secret = strings.ToUpper(strings.ReplaceAll(secret, " ", ""))
	key, _ := base32.StdEncoding.WithPadding(base32.NoPadding).DecodeString(secret)

	counter := time.Now().Unix() / 30
	var counterBytes [8]byte
	binary.BigEndian.PutUint64(counterBytes[:], uint64(counter))

	h := hmac.New(sha1.New, key)
	h.Write(counterBytes[:])
	hash := h.Sum(nil)

	offset := hash[len(hash)-1] & 0x0F
	code := binary.BigEndian.Uint32(hash[offset : offset+4])
	code &= 0x7FFFFFFF

	return fmt.Sprintf("%06d", code%1000000)
}

//////////////////////////////////////////////////////////
// NETWORK HELPERS
//////////////////////////////////////////////////////////

func getLocalIP() string {
	addrs, _ := net.InterfaceAddrs()
	for _, addr := range addrs {
		if ipnet, ok := addr.(*net.IPNet); ok && !ipnet.IP.IsLoopback() {
			if ipnet.IP.To4() != nil {
				return ipnet.IP.String()
			}
		}
	}
	return "127.0.0.1"
}

func getPublicIP() string {
	resp, err := http.Get("https://api.ipify.org")
	if err != nil {
		return ""
	}
	defer resp.Body.Close()
	ip, _ := io.ReadAll(resp.Body)
	return string(ip)
}

func getMacAddress() string {
	interfaces, _ := net.Interfaces()
	for _, i := range interfaces {
		if mac := i.HardwareAddr.String(); mac != "" {
			return mac
		}
	}
	return ""
}

// //////////
// //chatgpt////////
type ChatRequest struct {
	Message string `json:"message"`
}

type ChatResponse struct {
	Reply string `json:"reply"`
}

func StockChatHandler(w http.ResponseWriter, r *http.Request) {
	var client = openai.NewClient(os.Getenv("chatKey"))
	var req ChatRequest

	// ✅ Decode request with error handling
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		log.Println("JSON Decode Error:", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Message == "" {
		log.Println("Empty message received")
		http.Error(w, "Message is required", http.StatusBadRequest)
		return
	}

	log.Println("User Message:", req.Message)

	systemPrompt := `
You are an AI chatbot for an Indian stock market website.

STRICT RULES:
- ONLY answer about Indian stock market
- If unrelated → reply: "Please ask questions related to Indian stock market."
- Keep answers SHORT (max 3-4 lines)

STOCK RESPONSE FORMAT:
[Stock Name]:
Price: ₹XXXX 
Trend: Bullish / Bearish / Sideways
View: Short suggestion (no direct buy/sell)

- If stock name is unclear, still try to guess common Indian stocks (Reliance, TCS, Infosys, etc.)
- Do NOT mention crypto or global markets
- This is assumed data, so DO NOT say "live" or "real-time"
`

	// ✅ API Call
	resp, err := client.CreateChatCompletion(
		context.Background(),
		openai.ChatCompletionRequest{
			Model:       "gpt-4o-mini", // ✅ fixed model
			MaxTokens:   80,
			Temperature: 0.2,
			Messages: []openai.ChatCompletionMessage{
				{Role: "system", Content: systemPrompt},
				{Role: "user", Content: req.Message},
			},
		},
	)

	// ✅ Proper error logging
	if err != nil {
		log.Println("OpenAI API Error:", err)

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"reply": "Error: " + err.Error(), // shows real issue
		})
		return
	}

	// ✅ Prevent crash if empty response
	if len(resp.Choices) == 0 {
		log.Println("No choices returned from API")
		http.Error(w, "No response from AI", http.StatusInternalServerError)
		return
	}

	reply := resp.Choices[0].Message.Content
	log.Println("AI Reply:", reply)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(ChatResponse{
		Reply: reply,
	})
}
