import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Безкоштовні API ключі (можна отримати на сайтах)
// Alpha Vantage: https://www.alphavantage.co/support/#api-key
// Yahoo Finance API (без ключа)
const ALPHA_VANTAGE_API_KEY = "demo"; // Замініть на ваш ключ
const USE_YAHOO_FINANCE = true; // Використовувати Yahoo Finance замість Alpha Vantage

// Список тикерів ETF, які нас цікавлять
const TICKERS = ["MSTY", "TSLY", "NVDY", "CONY", "ULTY", "YMAX"];

// Функція для визначення рекомендації на основі NAV та Yield
const getRecommendation = (navChange, dividendYield) => {
  if (navChange > -20 && dividendYield > 50) {
    return "Hold";
  } else if (navChange < -50 || dividendYield < 30) {
    return "Replace";
  } else if (navChange < -30) {
    return "Reduce";
  } else {
    return "Hold";
  }
};

export default function YieldMaxDashboard() {
  const [etfData, setEtfData] = useState([]); // Стейт для збереження даних про ETF
  const [error, setError] = useState(null); // Стейт для збереження помилок
  const [loading, setLoading] = useState(true); // Стейт для індикатора завантаження
  const [dataSource, setDataSource] = useState(""); // Джерело даних

  // Функція для форматування дати в українському форматі
  const formatDate = (timestamp) => {
    if (typeof timestamp !== "number") return "—";

    const date = new Date(timestamp * 1000);
    return date.toLocaleString("uk-UA", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Функція для отримання даних з Yahoo Finance API через проксі
  const fetchFromYahooFinance = async () => {
    try {
      const promises = TICKERS.map(async (ticker) => {
        try {
          // Використовуємо наш локальний проксі сервер та інші проксі для обходу CORS
          const proxyUrls = [
            `http://localhost:3003/api/yahoo-finance/${ticker}`,
            `https://api.allorigins.win/raw?url=${encodeURIComponent(
              `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`
            )}`,
            `https://cors-anywhere.herokuapp.com/https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`,
            `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`,
          ];

          let data = null;
          let lastError = null;

          for (const url of proxyUrls) {
            try {
              const res = await fetch(url, {
                headers: {
                  Accept: "application/json",
                  "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                },
              });

              if (res.ok) {
                data = await res.json();
                break;
              }
            } catch (error) {
              lastError = error;
              continue;
            }
          }

          if (!data) {
            throw lastError || new Error("Не вдалося отримати дані");
          }

          if (data.chart && data.chart.result && data.chart.result[0]) {
            const result = data.chart.result[0];
            const meta = result.meta;
            const quote = result.indicators.quote[0];

            const currentPrice = meta.regularMarketPrice;
            const previousClose = meta.previousClose;
            const changePercent =
              ((currentPrice - previousClose) / previousClose) * 100;

            return {
              symbol: ticker,
              name: meta.longName || meta.shortName || ticker,
              price: currentPrice,
              changesPercentage: changePercent,
              timestamp: meta.regularMarketTime,
              previousClose: previousClose,
              volume: quote.volume ? quote.volume[quote.volume.length - 1] : 0,
              // Додаткові поля з API або розраховані значення
              dividendYield: meta.trailingAnnualDividendYield
                ? meta.trailingAnnualDividendYield * 100
                : null,
              monthlyPayout: meta.trailingAnnualDividendRate
                ? meta.trailingAnnualDividendRate / 12
                : null,
              expenseRatio: 0.99, // Стандартний для YieldMax ETF
              returnOfCapital: null, // Потрібен окремий API
              navChange1Y: meta.fiftyTwoWeekChange
                ? meta.fiftyTwoWeekChange * 100
                : null,
            };
          }
          return null;
        } catch (error) {
          console.error(`Помилка для ${ticker}:`, error);
          return null;
        }
      });

      const results = await Promise.all(promises);
      const validResults = results.filter((result) => result !== null);

      if (validResults.length > 0) {
        setEtfData(validResults);
        setDataSource("Yahoo Finance API");
        setError(null);
      } else {
        throw new Error("Не вдалося отримати дані з Yahoo Finance");
      }
    } catch (error) {
      console.error("Помилка завантаження даних з Yahoo Finance:", error);
      throw error;
    }
  };

  // Функція для отримання даних з Alpha Vantage API (безкоштовно з обмеженнями)
  const fetchFromAlphaVantage = async () => {
    try {
      const promises = TICKERS.map(async (ticker) => {
        try {
          const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${ALPHA_VANTAGE_API_KEY}`;
          const res = await fetch(url);

          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }

          const data = await res.json();

          if (data["Global Quote"]) {
            const quote = data["Global Quote"];
            return {
              symbol: quote["01. symbol"],
              name: quote["01. symbol"], // Alpha Vantage не надає назву
              price: parseFloat(quote["05. price"]),
              changesPercentage: parseFloat(
                quote["10. change percent"].replace("%", "")
              ),
              timestamp: Math.floor(Date.now() / 1000),
              previousClose: parseFloat(quote["08. previous close"]),
              volume: parseInt(quote["06. volume"]),
              // Alpha Vantage не надає додаткові дані про дивіденди
              dividendYield: null,
              monthlyPayout: null,
              expenseRatio: 0.99, // Стандартний для YieldMax ETF
              returnOfCapital: null,
              navChange1Y: null,
            };
          }
          return null;
        } catch (error) {
          console.error(`Помилка для ${ticker}:`, error);
          return null;
        }
      });

      const results = await Promise.all(promises);
      const validResults = results.filter((result) => result !== null);

      if (validResults.length > 0) {
        setEtfData(validResults);
        setDataSource("Alpha Vantage API");
        setError(null);
      } else {
        throw new Error("Не вдалося отримати дані з Alpha Vantage");
      }
    } catch (error) {
      console.error("Помилка завантаження даних з Alpha Vantage:", error);
      throw error;
    }
  };

  // Функція для отримання даних з API
  const fetchETFData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (USE_YAHOO_FINANCE) {
        try {
          await fetchFromYahooFinance();
        } catch (error) {
          console.log("Yahoo Finance не працює, спробуємо Alpha Vantage...");
          try {
            await fetchFromAlphaVantage();
          } catch (alphaError) {
            console.log("Alpha Vantage не працює, показуємо помилку...");
            setError(
              "Не вдалося отримати дані з жодного API. Перевірте підключення до інтернету або спробуйте пізніше."
            );
            setDataSource("Помилка підключення");
          }
        }
      } else {
        try {
          await fetchFromAlphaVantage();
        } catch (error) {
          console.log("Alpha Vantage не працює, показуємо помилку...");
          setError(
            "Не вдалося отримати дані з Alpha Vantage API. Перевірте API ключ або спробуйте пізніше."
          );
          setDataSource("Помилка підключення");
        }
      }
    } catch (error) {
      console.error("Всі API не працюють:", error);
      setError(
        "Критична помилка підключення до API. Спробуйте оновити сторінку."
      );
      setDataSource("Помилка підключення");
    } finally {
      setLoading(false);
    }
  };

  // Виконується при монтуванні компонента та встановлює інтервал для автооновлення даних
  useEffect(() => {
    fetchETFData();
    const interval = setInterval(fetchETFData, 1000 * 60 * 5); // Оновлення кожні 5 хвилин
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">
        📊 YieldMax ETF Live Dashboard
      </h1>

      <div className="mb-4 text-sm text-gray-600">
        Дані з: {dataSource || "Завантаження..."}
      </div>

      {/* Відображення помилки, якщо вона є */}
      {error && (
        <div className="text-red-600 font-semibold mb-4 p-3 bg-red-50 border border-red-200 rounded">
          ⚠️ Помилка при завантаженні даних: {error}
        </div>
      )}

      <Card>
        <CardContent className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Завантаження даних...</span>
            </div>
          ) : etfData.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>📊 Дані для обраних ETF не знайдено</p>
              <p className="text-sm mt-2">
                API не повернув дані для обраних тикерів
              </p>
              <div className="mt-4 text-xs text-gray-400">
                <p>💡 Можливі причини:</p>
                <p>• Тикери можуть бути недоступні в обраному API</p>
                <p>• Проблеми з підключенням до API</p>
                <p>• Ліміти запитів для безкоштовного плану</p>
                <p>• Ринок закритий або дані ще не оновлені</p>
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Тикер</TableHead>
                      <TableHead>Назва ETF</TableHead>
                      <TableHead>Ціна</TableHead>
                      <TableHead>Зміна (%)</TableHead>
                      <TableHead>Дивідендний дохід (%)</TableHead>
                      <TableHead>Місячний виплата ($)</TableHead>
                      <TableHead>Комісія (%)</TableHead>
                      <TableHead>Повернення капіталу (%)</TableHead>
                      <TableHead>Зміна NAV 1р (%)</TableHead>
                      <TableHead>Рекомендація</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {etfData.map((etf) => (
                      <TableRow key={etf.symbol}>
                        <TableCell className="font-medium">
                          {etf.symbol}
                        </TableCell>
                        <TableCell
                          className="text-sm text-gray-700 max-w-xs truncate"
                          title={etf.name}
                        >
                          {etf.name || "—"}
                        </TableCell>
                        <TableCell>
                          {typeof etf.price === "number"
                            ? `$${etf.price.toFixed(2)}`
                            : "—"}
                        </TableCell>
                        <TableCell
                          className={
                            typeof etf.changesPercentage === "number" &&
                            etf.changesPercentage < 0
                              ? "text-red-600 font-medium"
                              : "text-green-600 font-medium"
                          }
                        >
                          {typeof etf.changesPercentage === "number"
                            ? `${
                                etf.changesPercentage > 0 ? "+" : ""
                              }${etf.changesPercentage.toFixed(2)}%`
                            : "—"}
                        </TableCell>

                        <TableCell className="text-green-600 font-medium">
                          {typeof etf.dividendYield === "number"
                            ? `${etf.dividendYield.toFixed(1)}%`
                            : "—"}
                        </TableCell>
                        <TableCell className="text-green-600">
                          {typeof etf.monthlyPayout === "number"
                            ? `$${etf.monthlyPayout.toFixed(2)}`
                            : "—"}
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {typeof etf.expenseRatio === "number"
                            ? `${etf.expenseRatio}%`
                            : "—"}
                        </TableCell>
                        <TableCell className="text-orange-600">
                          {typeof etf.returnOfCapital === "number"
                            ? `${etf.returnOfCapital.toFixed(1)}%`
                            : "—"}
                        </TableCell>
                        <TableCell
                          className={
                            typeof etf.navChange1Y === "number" &&
                            etf.navChange1Y < 0
                              ? "text-red-600 font-medium"
                              : "text-green-600 font-medium"
                          }
                        >
                          {typeof etf.navChange1Y === "number"
                            ? `${
                                etf.navChange1Y > 0 ? "+" : ""
                              }${etf.navChange1Y.toFixed(1)}%`
                            : "—"}
                        </TableCell>
                        <TableCell>
                          {typeof etf.navChange1Y === "number" &&
                          typeof etf.dividendYield === "number" ? (
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                getRecommendation(
                                  etf.navChange1Y,
                                  etf.dividendYield
                                ) === "Hold"
                                  ? "bg-green-100 text-green-800"
                                  : getRecommendation(
                                      etf.navChange1Y,
                                      etf.dividendYield
                                    ) === "Reduce"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {getRecommendation(
                                etf.navChange1Y,
                                etf.dividendYield
                              )}
                            </span>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
