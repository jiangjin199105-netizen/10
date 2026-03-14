import express from "express";
import { createServer as createViteServer } from "vite";
import axios from "axios";
import * as cheerio from "cheerio";
import https from "https";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function logError(message: string) {
  const logMessage = `[${new Date().toISOString()}] ${message}\n`;
  fs.appendFileSync(path.join(process.cwd(), 'error.log'), logMessage);
}

// Global variable to hold the latest recommendation for the script
let latestRecommendation: { period: string; numbers: number[]; step: number } | null = null;

// --- Auth & License Management ---
let authConfig = {
  password: "JH8251050",
  expiryTimestamp: Date.now() + (28 * 24 * 60 * 60 * 1000), // Initial 28 days
  failedAttempts: 0,
  lockUntil: 0
};

const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
  keepAlive: true,
});

async function fetchWithRetry(url: string, retries = 5): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      return await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Referer': 'https://api.api168168.com/'
        },
        httpsAgent,
        timeout: 90000
      });
    } catch (error: any) {
      if (i === retries - 1) throw error;
      const msg = `Fetch failed, retrying (${i + 1}/${retries})... ${error.message}`;
      console.log(msg);
      logError(msg);
      // Exponential backoff: 2s, 4s, 8s, 16s
      await new Promise(resolve => setTimeout(resolve, 2000 * Math.pow(2, i)));
    }
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check
  app.get("/api/ping", (req, res) => {
    res.json({ status: "ok", message: "pong", timestamp: Date.now() });
  });

  // --- Auth APIs ---
  app.post("/api/auth/verify", (req, res) => {
    const { password } = req.body;
    const now = Date.now();

    // Check if locked
    if (authConfig.lockUntil > now) {
      const remaining = Math.ceil((authConfig.lockUntil - now) / (60 * 60 * 1000));
      return res.status(403).json({ 
        error: `程序已锁定，请在 ${remaining} 小时后再试。`,
        locked: true
      });
    }

    if (password === authConfig.password) {
      // Success
      authConfig.failedAttempts = 0;
      authConfig.lockUntil = 0;
      
      // Add 28 days
      authConfig.expiryTimestamp = Math.max(authConfig.expiryTimestamp, now) + (28 * 24 * 60 * 60 * 1000);
      
      res.json({ 
        success: true, 
        expiry: authConfig.expiryTimestamp,
        message: "验证成功，已增加 28 天使用时间。"
      });
    } else {
      // Failure
      authConfig.failedAttempts++;
      if (authConfig.failedAttempts >= 3) {
        authConfig.lockUntil = now + (24 * 60 * 60 * 1000); // 24 hours lock
        res.status(403).json({ 
          error: "密码错误 3 次，程序已锁定 24 小时。",
          locked: true
        });
      } else {
        res.status(401).json({ 
          error: `密码错误！剩余尝试次数: ${3 - authConfig.failedAttempts}`,
          attemptsLeft: 3 - authConfig.failedAttempts
        });
      }
    }
  });

  app.post("/api/auth/change-password", (req, res) => {
    const { oldPassword, newPassword } = req.body;
    if (oldPassword === authConfig.password) {
      authConfig.password = newPassword;
      res.json({ success: true, message: "密码修改成功。" });
    } else {
      res.status(401).json({ error: "原密码不正确。" });
    }
  });

  app.get("/api/auth/status", (req, res) => {
    const now = Date.now();
    res.json({
      isExpired: now > authConfig.expiryTimestamp,
      expiry: authConfig.expiryTimestamp,
      isLocked: now < authConfig.lockUntil,
      lockUntil: authConfig.lockUntil
    });
  });

  app.post("/api/auth/extend", (req, res) => {
    const { password } = req.body;
    const now = Date.now();

    if (password === authConfig.password) {
      // Add 7 days (7 * 24 * 60 * 60 * 1000)
      authConfig.expiryTimestamp = Math.max(authConfig.expiryTimestamp, now) + (7 * 24 * 60 * 60 * 1000);
      res.json({ 
        success: true, 
        expiry: authConfig.expiryTimestamp,
        message: "续期成功！已增加 7 天使用时间。" 
      });
    } else {
      res.status(401).json({ error: "密码不正确，无法续期。" });
    }
  });

  // API for the script to get the latest recommendation
  app.get("/api/recommendation", (req, res) => {
    // Check expiry before serving data
    if (Date.now() > authConfig.expiryTimestamp) {
      return res.status(402).json({ error: "软件已过期，请重新登录激活。" });
    }
    if (latestRecommendation) {
      res.json(latestRecommendation);
    } else {
      // Return 200 with a null/empty state instead of 404 to keep the script connection "stable"
      res.json({ period: "", numbers: [], step: 0, message: "Waiting for recommendation..." });
    }
  });

  // API for the client to post the latest recommendation
  app.post("/api/update-recommendation", (req, res) => {
    const { period, numbers, step } = req.body;
    if (period && Array.isArray(numbers) && step) {
      latestRecommendation = { period, numbers, step };
      console.log("Updated recommendation via API:", latestRecommendation);
      res.status(200).json({ message: "Recommendation updated" });
    } else {
      res.status(400).json({ error: "Invalid data format" });
    }
  });

  // API to fetch draw records from a URL
  app.post("/api/fetch-draws", async (req, res) => {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    try {
      const drawsMap = new Map<string, any>();
      let nextDrawTime: string | null = null;
      let secondsLeft: number | null = null;
      let nextPeriod: string | null = null;
      
      const addDraw = (draw: any) => {
        if (draw.period && !drawsMap.has(draw.period)) {
          drawsMap.set(draw.period, draw);
        }
      };
      
      // Scraping is now the primary source
      if (true) { // Keeping structure for clarity
        try {
          const response = await fetchWithRetry(url);

          if (url.includes('api.api168168.com')) {
            // Specific scraper for api.api168168.com
            const data = response.data;
            // Handle both the old format and the new format
            const list = Array.isArray(data) ? data : (data.result?.data || data.data || [data]);
            
            list.forEach((item: any) => {
              // Try old format fields first, then new format fields
              const period = item.termNum || item.preDrawIssue;
              const result = item.openCode || item.preDrawCode;
              
              if (period && result) {
                const numbers = String(result).split(',').map((n: string) => n.trim());
                const sum = numbers.slice(0, 3).reduce((a: number, b: string) => a + (parseInt(b) || 0), 0);
                addDraw({
                  period: String(period),
                  result: numbers.join(', '),
                  sum,
                  bigSmall: sum >= 14 ? '大' : '小',
                  oddEven: sum % 2 === 0 ? '双' : '单'
                });
              }
            });
          } else {
            const $ = cheerio.load(response.data);

            // Try to find countdown or next draw time in text
            const pageText = $.text();
          
          // Pattern 1: "Next Draw: 21301196" followed by a timer "00:20"
          const nextDrawWithTimer = pageText.match(/(?:Next Draw|下期开奖).*?(\d{6,})[\s\S]*?(\d{1,2}):(\d{2})/i);
          if (nextDrawWithTimer) {
            nextPeriod = nextDrawWithTimer[1];
            const mins = parseInt(nextDrawWithTimer[2]);
            const secs = parseInt(nextDrawWithTimer[3]);
            if (mins < 6) { // Usually countdowns are short for 5-min games
              secondsLeft = mins * 60 + secs;
            }
          }

          // Pattern 2: "00:20" or "4:59" (Generic)
          const countdownMatch = pageText.match(/(\d{1,2}):(\d{2})/);
          // Pattern 3: "4分59秒"
          const countdownMatchCN = pageText.match(/(\d{1,2})\s*分\s*(\d{1,2})\s*秒/i);
          // Pattern 4: "Next Draw: 21301196" (Just period)
          const nextDrawPeriodMatch = pageText.match(/(?:Next Draw|下期开奖).*?(\d{6,})/i);
          // Pattern 5: "Next Draw: 15:55" (Just time)
          const nextDrawTimeMatch = pageText.match(/(?:Next|下期).*?(\d{1,2}:\d{2})/i);

          if (!secondsLeft) {
            if (countdownMatch) {
              const mins = parseInt(countdownMatch[1]);
              const secs = parseInt(countdownMatch[2]);
              if (mins < 6) { // Every 5 mins, so countdown should be < 5 or 6
                secondsLeft = mins * 60 + secs;
              } else if (!nextDrawTime) {
                nextDrawTime = countdownMatch[0];
              }
            } else if (countdownMatchCN) {
              secondsLeft = parseInt(countdownMatchCN[1]) * 60 + parseInt(countdownMatchCN[2]);
            }
          }

          if (nextDrawTimeMatch && !nextDrawTime) {
            nextDrawTime = nextDrawTimeMatch[1];
          }

          if (nextDrawPeriodMatch && !nextPeriod) {
            nextPeriod = nextDrawPeriodMatch[1];
          }
          
          // Look for specific countdown elements by ID or class
          const countdownEl = $('#countdown, .countdown, #timer, .timer, .draw-timer, .next-draw-timer, [class*="timer"], [id*="timer"], [class*="countdown"], [id*="countdown"]').first();
          if (countdownEl.length) {
            const timerText = countdownEl.text().trim();
            const m = timerText.match(/(\d{1,2}):(\d{2})/);
            if (m) {
              const mins = parseInt(m[1]);
              const secs = parseInt(m[2]);
              if (mins < 6) { // Strictly for 5-min games
                secondsLeft = mins * 60 + secs;
              }
            }
          }
          
          // Generic scraper for div-based tables
          if (drawsMap.size === 0) {
            $('div').each((_, el) => {
              const row = $(el);
              const text = row.text();
              // Try to find period (usually 6+ digits)
              const periodMatch = text.match(/\d{6,}/);
              // Try to find numbers (usually 10 numbers)
              const numberMatches = text.match(/\d{1,2}/g);
              
              if (periodMatch && numberMatches && numberMatches.length >= 10) {
                const period = periodMatch[0];
                const numbers = numberMatches.slice(0, 10);
                const sum = numbers.slice(0, 3).reduce((a, b) => a + (parseInt(b) || 0), 0);
                addDraw({
                  period,
                  result: numbers.join(', '),
                  sum,
                  bigSmall: sum >= 14 ? '大' : '小',
                  oddEven: sum % 2 === 0 ? '双' : '单'
                });
              }
            });
          }
          
          // Specific scraper for the provided structure
          if ($('#numlist').length > 0) {
            $('#numlist .listline').each((_, el) => {
              const row = $(el);
              const time = row.find('.graytime').eq(0).text().trim();
              const period = row.find('.graytime').eq(1).text().trim();
              const numbers: string[] = [];
              row.find('.haomali li i').each((_, ball) => {
                numbers.push($(ball).text().trim());
              });

              if (period && numbers.length >= 10) {
                const sum = numbers.slice(0, 3).reduce((a, b) => a + (parseInt(b) || 0), 0);
                addDraw({
                  period,
                  result: numbers.join(', '),
                  sum,
                  bigSmall: sum >= 14 ? '大' : '小',
                  oddEven: sum % 2 === 0 ? '双' : '单'
                });
              }
            });
          }
          
          // Specific scraper for eecc168.com
          if (url.includes('eecc168.com')) {
            // Try to find table rows or similar structures
            $('tr').each((_, el) => {
              const row = $(el);
              
              // Try to find period (usually 6+ digits in a td)
              const period = row.find('td').eq(1).text().trim();
              
              // Try to find numbers in ul.imgnumber -> li.numsmXX
              const numbers: string[] = [];
              row.find('ul.imgnumber li').each((_, li) => {
                const className = $(li).attr('class') || '';
                const match = className.match(/numsm(\d+)/);
                if (match) {
                  numbers.push(match[1]);
                }
              });
              
              if (period && /^\d+$/.test(period) && numbers.length >= 10) {
                const sum = numbers.slice(0, 3).reduce((a, b) => a + (parseInt(b) || 0), 0);
                addDraw({
                  period,
                  result: numbers.join(', '),
                  sum,
                  bigSmall: sum >= 14 ? '大' : '小',
                  oddEven: sum % 2 === 0 ? '双' : '单'
                });
              }
            });
            
            // Fallback: Generic scraper if table structure is different
            if (drawsMap.size === 0) {
                $('ul.imgnumber').each((_, ul) => {
                    const row = $(ul).closest('tr');
                    const period = row.find('td').eq(1).text().trim();
                    const numbers: string[] = [];
                    $(ul).find('li').each((_, li) => {
                        const className = $(li).attr('class') || '';
                        const match = className.match(/numsm(\d+)/);
                        if (match) numbers.push(match[1]);
                    });
                    
                    if (period && /^\d+$/.test(period) && numbers.length >= 10) {
                        const sum = numbers.slice(0, 3).reduce((a, b) => a + (parseInt(b) || 0), 0);
                        addDraw({
                          period,
                          result: numbers.join(', '),
                          sum,
                          bigSmall: sum >= 14 ? '大' : '小',
                          oddEven: sum % 2 === 0 ? '双' : '单'
                        });
                    }
                });
            }
          }
          
          // Specific scraper for auluckylottery.com
          if (url.includes('auluckylottery.com')) {
            $('.past-results-item, .result-item, .draw-item').each((_, el) => {
              const text = $(el).text();
              const drawMatch = text.match(/Draw:\s*(\d+)/i);
              
              const balls: string[] = [];
              $(el).find('.ball, .number, [class*="ball-"]').each((_, ball) => {
                const num = $(ball).text().trim();
                if (num && !isNaN(parseInt(num))) balls.push(num);
              });

              if (drawMatch && balls.length >= 10) {
                const period = drawMatch[1];
                const numbers = balls.slice(0, 10);
                const sum = numbers.slice(0, 3).reduce((a, b) => a + (parseInt(b) || 0), 0);
                addDraw({
                  period,
                  result: numbers.join(', '),
                  sum,
                  bigSmall: sum >= 14 ? '大' : '小',
                  oddEven: sum % 2 === 0 ? '双' : '单'
                });
              }
            });

            // Fallback if specific classes not found - look for any container with "Draw:" and 10 numbers
            if (drawsMap.size === 0) {
              $('div, section, li').each((_, el) => {
                const html = $(el).html() || "";
                const text = $(el).text();
                if (text.includes('Draw:') && text.match(/\d{5,}/)) {
                  const drawMatch = text.match(/Draw:\s*(\d+)/i);
                  const balls: string[] = [];
                  // Look for numbers inside spans or divs that look like balls
                  $(el).find('span, div').each((_, sub) => {
                    const val = $(sub).text().trim();
                    if (val && /^\d{1,2}$/.test(val)) balls.push(val);
                  });

                  if (drawMatch && balls.length >= 10) {
                    const period = drawMatch[1];
                    const numbers = balls.slice(0, 10);
                    const sum = numbers.slice(0, 3).reduce((a, b) => a + (parseInt(b) || 0), 0);
                    addDraw({
                      period,
                      result: numbers.join(', '),
                      sum,
                      bigSmall: sum >= 14 ? '大' : '小',
                      oddEven: sum % 2 === 0 ? '双' : '单'
                    });
                  }
                }
              });
            }
          }

          // Try to find JSON data in script tags (Generic Fallback)
          if (drawsMap.size === 0) {
            $('script').each((_, script) => {
              const content = $(script).html() || "";
              if (content.includes('results') || content.includes('draws') || content.includes('data')) {
                try {
                  const jsonMatch = content.match(/\[\s*\{.*\}\s*\]/);
                  if (jsonMatch) {
                    const data = JSON.parse(jsonMatch[0]);
                    if (Array.isArray(data)) {
                      data.forEach((r: any) => {
                        const period = r.period || r.draw_number || r.id || r.issue;
                        const resText = r.result || r.numbers || r.draw_result || r.code;
                        if (period && resText) {
                          const numbers = String(resText).split(/[\s,]+/).filter(n => n.length > 0);
                          const sum = numbers.reduce((a, b) => a + (parseInt(b) || 0), 0);
                          addDraw({
                            period: String(period),
                            result: numbers.join(', '),
                            sum,
                            bigSmall: sum >= 14 ? '大' : '小',
                            oddEven: sum % 2 === 0 ? '双' : '单'
                          });
                        }
                      });
                    }
                  }
                } catch (e) {}
              }
            });
          }

          // Table scraping fallback
          if (drawsMap.size === 0) {
            $('tr').each((_, row) => {
              const cells = $(row).find('td');
              if (cells.length >= 2) {
                const period = $(cells[0]).text().trim();
                const resultText = $(cells[1]).text().trim();

                if (period && resultText && /^\d+/.test(period)) {
                  const numbers = resultText.split(/[\s,]+/).filter(n => n.length > 0);
                  if (numbers.length > 0) {
                    const sum = numbers.reduce((a, b) => a + (parseInt(b) || 0), 0);
                    addDraw({
                      period,
                      result: numbers.join(', '),
                      sum,
                      bigSmall: sum >= 14 ? '大' : '小',
                      oddEven: sum % 2 === 0 ? '双' : '单'
                    });
                  }
                }
              }
            });
          }
          }
        } catch (e) {
          console.error(`Scraping failed for ${url}:`, e.message);
        }
      }

      // 3. Aggressive fallback: Look for any text patterns
      if (drawsMap.size === 0) {
        console.log(`No draws found, scraping response data for ${url}`);
        try {
          const response = await axios.get(url).catch(() => null);
          if (response) {
            console.log("Response data snippet:", response.data.substring(0, 500));
            const $ = cheerio.load(response.data);
            const text = $.text();
            const lines = text.split('\n');
            lines.forEach(line => {
              const matches = line.match(/(\d{6,})\s+((?:\d{1,2}\s+){9}\d{1,2})/);
              if (matches) {
                const period = matches[1];
                const numbers = matches[2].split(/\s+/);
                const sum = numbers.slice(0, 3).reduce((a, b) => a + (parseInt(b) || 0), 0);
                addDraw({
                  period,
                  result: numbers.join(', '),
                  sum,
                  bigSmall: sum >= 14 ? '大' : '小',
                  oddEven: sum % 2 === 0 ? '双' : '单'
                });
              }
            });
          }
        } catch (e) {
          console.error("Aggressive fallback failed:", e.message);
        }
      }

      const finalDraws = Array.from(drawsMap.values())
        .sort((a, b) => b.period.localeCompare(a.period))
        .slice(0, 50);
      
      console.log(`Found ${finalDraws.length} draws from ${url}`);

      res.json({ 
        draws: finalDraws,
        nextDrawTime,
        secondsLeft,
        nextPeriod
      });
    } catch (error: any) {
      console.error("Fetch error:", error.message);
      res.status(500).json({ error: "Failed to fetch data from URL", details: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
