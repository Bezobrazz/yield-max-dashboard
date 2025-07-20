const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();
const PORT = 3003;

// Налаштування CORS
app.use(cors());
app.use(express.json());

// Проксі для Yahoo Finance API
app.get("/api/yahoo-finance/:symbol", async (req, res) => {
  try {
    const { symbol } = req.params;
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Помилка проксі:", error);
    res.status(500).json({ error: error.message });
  }
});

// Проксі для Alpha Vantage API
app.get("/api/alpha-vantage/:symbol", async (req, res) => {
  try {
    const { symbol } = req.params;
    const apiKey = req.query.apiKey || "demo";
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Помилка проксі:", error);
    res.status(500).json({ error: error.message });
  }
});

// Тестовий endpoint
app.get("/api/test", (req, res) => {
  res.json({ message: "Проксі сервер працює!" });
});

app.listen(PORT, () => {
  console.log(`🚀 Проксі сервер запущено на порту ${PORT}`);
  console.log(
    `📊 Yahoo Finance: http://localhost:${PORT}/api/yahoo-finance/SYMBOL`
  );
  console.log(
    `📈 Alpha Vantage: http://localhost:${PORT}/api/alpha-vantage/SYMBOL?apiKey=YOUR_KEY`
  );
});
