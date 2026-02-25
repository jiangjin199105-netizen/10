import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  RefreshCw, 
  Clock, 
  History, 
  Settings, 
  AlertCircle,
  Database,
  GitCompare,
  List,
  CheckCircle2,
  XCircle,
  Trash2,
  Volume2,
  VolumeX,
  Download,
  Bot
} from 'lucide-react';
import { format, differenceInSeconds } from 'date-fns';
import { DrawRecord, Recommendation, AppSettings } from './types';

// Mock data generator for demo purposes
const generateMockDraws = (): DrawRecord[] => {
  const now = new Date();
  return Array.from({ length: 60 }).map((_, i) => {
    const drawTime = new Date(now.getTime() - i * 5 * 60000);
    const period = format(drawTime, 'yyyyMMdd') + String(120 - i).padStart(3, '0');
    // Generate 10 unique numbers from 1 to 10
    const numbers = Array.from({ length: 10 }, (_, i) => i + 1).sort(() => Math.random() - 0.5);
    const result = numbers.slice(0, 10); 
    const sum = result.reduce((a, b) => a + b, 0);
    const bigSmall = sum > 25 ? '大' : '小';
    const oddEven = sum % 2 === 0 ? '双' : '单';
    return {
      period,
      time: format(drawTime, 'HH:mm:ss'),
      result: result.join(', '),
      sum,
      bigSmall,
      oddEven,
    };
  });
};

const getNumberColor = (num: string) => {
  const n = parseInt(num);
  const colors: { [key: number]: string } = {
    1: 'bg-[#E6E600]', // Yellow
    2: 'bg-[#0099FF]', // Blue
    3: 'bg-[#4D4D4D]', // Dark Gray
    4: 'bg-[#FF9933]', // Orange
    5: 'bg-[#00CCCC]', // Cyan
    6: 'bg-[#6633FF]', // Purple
    7: 'bg-[#B3B3B3]', // Light Gray
    8: 'bg-[#FF3333]', // Red
    9: 'bg-[#660000]', // Dark Red
    10: 'bg-[#00CC00]', // Green
  };
  return colors[n] || 'bg-gray-400';
};

export default function App() {
  const [draws, setDraws] = useState<DrawRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [countdownDuration, setCountdownDuration] = useState<number>(5);
  const [nextDrawTime, setNextDrawTime] = useState<Date>(() => {
    const now = new Date();
    const nextMins = Math.ceil((now.getMinutes() + 1) / 5) * 5;
    const d = new Date(now);
    d.setMinutes(nextMins, 0, 0);
    return d;
  });
  const [timeLeft, setTimeLeft] = useState<number>(300);
  
  // Update nextDrawTime when duration changes
  useEffect(() => {
    const now = new Date();
    const currentMins = now.getMinutes();
    const nextMins = Math.floor(currentMins / countdownDuration) * countdownDuration + countdownDuration;
    const nextBoundary = new Date(now);
    nextBoundary.setMinutes(nextMins, 0, 0);
    if (nextBoundary <= now) {
      nextBoundary.setMinutes(nextBoundary.getMinutes() + countdownDuration);
    }
    setNextDrawTime(nextBoundary);
    setTimeLeft(differenceInSeconds(nextBoundary, now));
  }, [countdownDuration]);
  const [url, setUrl] = useState<string>('https://auluckylottery.com/results/lucky-ball-10/');
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualData, setManualData] = useState<string>('');

  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [lastAttempt, setLastAttempt] = useState<Date>(new Date());

  const [nextPeriod, setNextPeriod] = useState<string | null>(null);

  // Recommendations State
  const [recommendations, setRecommendations] = useState<Recommendation[]>(() => {
    const saved = localStorage.getItem('lottery_recommendations');
    return saved ? JSON.parse(saved) : [];
  });
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [enableVoice, setEnableVoice] = useState<boolean>(() => {
    const saved = localStorage.getItem('lottery_voice_enabled');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [lastClearedPeriod, setLastClearedPeriod] = useState<string | null>(() => {
    return localStorage.getItem('lottery_last_cleared_period');
  });
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(15);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // App Settings
  const defaultMacroConfig = {
    numCoords: {
      1: "100,200", 2: "150,200", 3: "200,200", 4: "250,200", 5: "300,200",
      6: "100,250", 7: "150,250", 8: "200,250", 9: "250,250", 10: "300,250"
    },
    keypadCoords: {
      1: "50,400", 2: "150,400", 3: "250,400",
      4: "50,430", 5: "150,430", 6: "250,430",
      7: "50,460", 8: "150,460", 9: "250,460",
      0: "150,500"
    },
    keypadClear: "300,400",
    keypadConfirm: "300,500",
    amountInput: "200,300",
    submitBet: "350,600",
    betSteps: [10, 30, 70, 150]
  };

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('app_settings');
    const defaults: AppSettings = { macroHelper: false, macroConfig: defaultMacroConfig };
    const savedSettings = saved ? JSON.parse(saved) : {};
    
    // Ensure macroConfig exists and has all required fields if partially saved
    if (!savedSettings.macroConfig) {
      savedSettings.macroConfig = defaultMacroConfig;
    } else {
      savedSettings.macroConfig = { ...defaultMacroConfig, ...savedSettings.macroConfig };
    }
    
    return { ...defaults, ...savedSettings };
  });
  const [macroInfo, setMacroInfo] = useState<{ period: string, numbers: number[] } | null>(null);
  
  // Console State
  const [showConsole, setShowConsole] = useState(false);
  const [macroLogs, setMacroLogs] = useState<{ time: string; status: string; step: string; record: string }[]>([]);

  useEffect(() => {
    if (window.location.hash === '#console') {
      setShowConsole(true);
    }
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (showConsole) {
      const fetchLogs = async () => {
        try {
          const res = await fetch('/api/logs');
          if (res.ok) {
            const data = await res.json();
            setMacroLogs(data);
          }
        } catch (err) {
          console.error("Failed to fetch logs", err);
        }
      };
      fetchLogs();
      interval = setInterval(fetchLogs, 1000);
    }
    return () => clearInterval(interval);
  }, [showConsole]);

  const autoElfScriptContent = `
Rem =========================================================================================
Rem == 按键精灵 (VBScript) - 全自动投注脚本 v16.0 (网页控制台版)
Rem =========================================================================================
Rem 说明：
Rem 1. 本版本无需在按键精灵中配置任何坐标！
Rem 2. 请在网页端的【控制台】中填写所有坐标。
Rem 3. 网页端会自动计算点击流程并发送给本脚本执行。
Rem 4. 脚本运行状态和日志将实时同步到网页控制台。

Dim Hwnd
Hwnd = 0

' 启动时自动打开控制台网页
RunApp "http://127.0.0.1:3000/#console"

Function SendLog(sStatus, sStep, sRecord)
    Dim Http, url
    Set Http = CreateObject("MSXML2.XMLHTTP")
    ' 简单的 URL 编码 (替换空格)
    sStatus = Replace(sStatus, " ", "%20")
    sStep = Replace(sStep, " ", "%20")
    sRecord = Replace(sRecord, " ", "%20")
    url = "http://127.0.0.1:3000/api/log?status=" & sStatus & "&step=" & sStep & "&record=" & sRecord
    On Error Resume Next
    Http.open "GET", url, False
    Http.Send
    On Error GoTo 0
End Function

SendLog "等待操作", "请锁定窗口", "脚本已启动"
MessageBox "【第一步】请将鼠标移动到你要操作的投注软件窗口内，然后按【回车键】(Enter) 锁定该窗口。"
Do
    Dim key
    key = WaitKey()
    If key = 13 Then
        Hwnd = Plugin.Window.MousePoint()
        SendLog "正常运行", "等待网页端新指令...", "已成功锁定窗口句柄: " & Hwnd
        Exit Do
    End If
Loop

Dim HttpTask, Ret, commands, cmd, parts, i
Set HttpTask = CreateObject("MSXML2.XMLHTTP")

Do
    On Error Resume Next
    Err.Clear
    HttpTask.open "GET", "http://127.0.0.1:3000/api/task", False
    HttpTask.Send
    If Err.Number = 0 Then
        Ret = HttpTask.responseText
        If Ret <> "NO_TASK" And Ret <> "" Then
            SendLog "执行下注", "正在执行任务", "收到新任务，开始执行"
            Call Plugin.Window.Restore(Hwnd)
            Delay 500

            commands = Split(Ret, "|")
            For i = 0 To UBound(commands)
                cmd = commands(i)
                parts = Split(cmd, ",")
                If parts(0) = "CLICK" Then
                    Call Plugin.Bkgnd.LeftClick(Hwnd, CInt(parts(1)), CInt(parts(2)))
                ElseIf parts(0) = "DELAY" Then
                    Delay CInt(parts(1))
                ElseIf parts(0) = "LOG" Then
                    SendLog "执行下注", parts(1), ""
                End If
            Next

            SendLog "正常运行", "等待下一期...", "任务执行完毕"
        End If
    End If
    Delay 2000
Loop
`;

  const handleDownloadScript = () => {
    const blob = new Blob([autoElfScriptContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'AutoBetScript.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Save recommendations to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('lottery_recommendations', JSON.stringify(recommendations));
  }, [recommendations]);

  // Save voice setting
  useEffect(() => {
    localStorage.setItem('lottery_voice_enabled', JSON.stringify(enableVoice));
  }, [enableVoice]);

  // Save last cleared period
  useEffect(() => {
    if (lastClearedPeriod) {
      localStorage.setItem('lottery_last_cleared_period', lastClearedPeriod);
    }
  }, [lastClearedPeriod]);

  // Save app settings
  useEffect(() => {
    localStorage.setItem('app_settings', JSON.stringify(settings));
  }, [settings]);

  const handleClearRecommendations = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowClearConfirm(true);
  };

  const confirmClearRecommendations = () => {
    // Record the current next period to prevent immediate regeneration
    if (draws.length > 0) {
      const latestDraw = draws[0];
      const nextPeriodStr = String(BigInt(latestDraw.period) + 1n);
      setLastClearedPeriod(nextPeriodStr);
    }
    setRecommendations([]);
    localStorage.removeItem('lottery_recommendations');
    setShowClearConfirm(false);
  };

  const handleManualEntry = () => {
    try {
      // Expecting format: period,result (one per line)
      const lines = manualData.split('\n').filter(l => l.trim());
      const newDraws: DrawRecord[] = lines.map(line => {
        const [period, result] = line.split(',').map(s => s.trim());
        const numbers = result.split(/[\s]+/).filter(n => n.length > 0);
        const sum = numbers.reduce((a, b) => a + (parseInt(b) || 0), 0);
        return {
          period,
          result: numbers.join(', '),
          time: format(new Date(), 'HH:mm:ss'),
          sum,
          bigSmall: sum >= 14 ? '大' : '小',
          oddEven: sum % 2 === 0 ? '双' : '单'
        };
      });
      if (newDraws.length > 0) {
        setDraws(newDraws);
        setLastUpdated(new Date());
        setShowSettings(false);
        setError(null);
      }
    } catch (e) {
      setError("手动输入格式错误。请使用：期号,结果 (例如: 20240101001,1 2 3)");
    }
  };

  const handleRefresh = useCallback(async (targetUrl: string = url) => {
    setLoading(true);
    setError(null);
    setLastAttempt(new Date());
    try {
      const response = await fetch('/api/fetch-draws', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl })
      });
      
      if (!response.ok) throw new Error('Failed to fetch data');
      
      const data = await response.json();
      if (data.draws && data.draws.length > 0) {
        setDraws(data.draws);
        setLastUpdated(new Date());
        setNextPeriod(data.nextPeriod || null);
        
        // Sync countdown with server data
        if (data.secondsLeft !== null && data.secondsLeft !== undefined) {
          setTimeLeft(data.secondsLeft);
          setNextDrawTime(new Date(Date.now() + data.secondsLeft * 1000));
        } else if (data.nextDrawTime) {
          let nextDate = new Date(data.nextDrawTime);
          // If it's just HH:mm, parse it relative to today
          if (isNaN(nextDate.getTime()) && /^\d{1,2}:\d{2}/.test(data.nextDrawTime)) {
            const [h, m] = data.nextDrawTime.split(':').map(Number);
            nextDate = new Date();
            nextDate.setHours(h, m, 0, 0);
            // If the time is in the past, assume it's for tomorrow
            if (nextDate < new Date()) {
              nextDate.setDate(nextDate.getDate() + 1);
            }
          }
          
          if (!isNaN(nextDate.getTime())) {
            setNextDrawTime(nextDate);
            setTimeLeft(differenceInSeconds(nextDate, new Date()));
          }
        }
      } else {
        // Fallback to mock if no data found but request succeeded
        if (draws.length === 0) setDraws(generateMockDraws());
        setError("目标接口/网址未发现数据，正在显示模拟数据。");
      }
    } catch (err: any) {
      console.error(err);
      setError("连接错误，正在显示模拟数据。");
      if (draws.length === 0) setDraws(generateMockDraws());
    } finally {
      setLoading(false);
    }
  }, [url, draws.length]);

  // Initialize with real data
  useEffect(() => {
    handleRefresh();
  }, []);

  // Auto-refresh data
  useEffect(() => {
    if (autoRefreshInterval <= 0) return;

    const intervalTime = autoRefreshInterval * 1000;
    const refreshInterval = setInterval(() => {
      handleRefresh();
    }, intervalTime);

    return () => clearInterval(refreshInterval);
  }, [handleRefresh, autoRefreshInterval]);

  // Countdown timer logic
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const seconds = differenceInSeconds(nextDrawTime, now);
      
      if (seconds <= 0) {
        // When countdown hits zero, trigger a refresh to get new results
        handleRefresh();
        
        // Calculate next boundary as a fallback
        const nextBoundary = new Date(now);
        const currentMins = nextBoundary.getMinutes();
        const nextMins = Math.floor(currentMins / countdownDuration) * countdownDuration + countdownDuration;
        nextBoundary.setMinutes(nextMins, 0, 0);
        
        // If the calculated boundary is still in the past or now, add another duration
        if (nextBoundary <= now) {
          nextBoundary.setMinutes(nextBoundary.getMinutes() + countdownDuration);
        }
        
        setNextDrawTime(nextBoundary);
        setTimeLeft(differenceInSeconds(nextBoundary, now));
      } else {
        setTimeLeft(seconds);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [nextDrawTime, handleRefresh, countdownDuration]);

  // Recommendation Logic
  useEffect(() => {
    if (draws.length === 0) return;

    const latestDraw = draws[0];
    const nextPeriodStr = String(BigInt(latestDraw.period) + 1n);

    // 1. Check if we already have a recommendation for the NEXT period
    // If so, do nothing (wait for next draw)
    // BUT we also need to check if the CURRENT period (latestDraw) was predicted previously
    // and update its status if pending.

    setRecommendations(prev => {
      const newRecs = [...prev];
      let changed = false;

      // Update pending recommendations
      newRecs.forEach(rec => {
        if (rec.status === 'pending' && rec.period === latestDraw.period) {
          const champion = Array.isArray(latestDraw.result) 
            ? latestDraw.result[0] 
            : parseInt(String(latestDraw.result).split(/[,\s]+/)[0]);
          
          rec.actualChampion = champion;
          const isWon = rec.recommendedNumbers.includes(champion);
          rec.status = isWon ? 'won' : 'lost';
          
          // Calculate Profit
          // Step 1: Bet 10/num -> Cost 40. Prize 99.
          // Step 2: Bet 20/num -> Cost 80. Prize 198.
          // Step 3: Bet 40/num -> Cost 160. Prize 396.
          // Step 4: Bet 80/num -> Cost 320. Prize 792.
          const baseBet = 10 * Math.pow(2, (rec.bettingStep || 1) - 1);
          const cost = baseBet * 4;
          const prize = isWon ? (baseBet * 9.9) : 0;
          rec.profit = prize - cost;

          changed = true;
        }
      });

      // Check if we need to generate a NEW recommendation for nextPeriodStr
      const exists = newRecs.some(r => r.period === nextPeriodStr);
      if (draws.length >= 50 && !exists && nextPeriodStr !== lastClearedPeriod) {
        // Perform Analysis
        // Logic:
        // 2nd (draws[1]) vs 47th (draws[47])
        // 3rd (draws[2]) vs 48th (draws[48])
        // Latest (draws[0]) vs 46th (draws[46])

        const getPosition = (championDraw: DrawRecord, targetDraw: DrawRecord) => {
          const champion = Array.isArray(championDraw.result) 
            ? championDraw.result[0] 
            : parseInt(String(championDraw.result).split(/[,\s]+/)[0]);
          
          const targetNums = Array.isArray(targetDraw.result)
            ? targetDraw.result
            : String(targetDraw.result).split(/[,\s]+/).map(n => parseInt(n.trim()));
          
          const leftHalf = targetNums.slice(0, 5);
          const rightHalf = targetNums.slice(5);

          if (leftHalf.includes(champion)) return 'left';
          if (rightHalf.includes(champion)) return 'right';
          return 'none';
        };

        const p2 = getPosition(draws[1], draws[47]);
        const p3 = getPosition(draws[2], draws[48]);
        const p1 = getPosition(draws[0], draws[46]);

        let patternType = '';
        if (p2 === 'left' && p3 === 'left' && p1 === 'right') {
          patternType = 'Left-Right';
        } else if (p2 === 'right' && p3 === 'right' && p1 === 'left') {
          patternType = 'Right-Left';
        }

        if (patternType) {
          // Generate Prediction
          // Source: draws[45]
          // Key: draws[0].champion
          // Position Check: draws[46]
          const champion = Array.isArray(draws[0].result) 
            ? draws[0].result[0] 
            : parseInt(String(draws[0].result).split(/[,\s]+/)[0]);
          
          // Check position in 46th draw
          const targetDraw46 = draws[46];
          const targetNums46 = Array.isArray(targetDraw46.result)
            ? targetDraw46.result
            : String(targetDraw46.result).split(/[,\s]+/).map(n => parseInt(n.trim()));
          
          const index = targetNums46.indexOf(champion); // 0-based index in 46th draw

          // Pick numbers from 45th draw
          const targetDraw45 = draws[45];
          const targetNums45 = Array.isArray(targetDraw45.result)
            ? targetDraw45.result
            : String(targetDraw45.result).split(/[,\s]+/).map(n => parseInt(n.trim()));

          let recommendedNumbers: number[] = [];

          if (index === 0) { // 1st position in 46th
            // 1, 3, 4, 5名 -> indices 0, 2, 3, 4 from 45th
            recommendedNumbers = [targetNums45[0], targetNums45[2], targetNums45[3], targetNums45[4]];
          } else if (index === 9) { // 10th position in 46th
            // 6, 7, 8, 10名 -> indices 5, 6, 7, 9 from 45th
            recommendedNumbers = [targetNums45[5], targetNums45[6], targetNums45[7], targetNums45[9]];
          } else if (index >= 1 && index <= 4) { // Left half (not 1st) in 46th
            // 2, 3, 4, 5名 -> indices 1, 2, 3, 4 from 45th
            recommendedNumbers = [targetNums45[1], targetNums45[2], targetNums45[3], targetNums45[4]];
          } else if (index >= 5 && index <= 8) { // Right half (not 10th) in 46th
            // 6, 7, 8, 9名 -> indices 5, 6, 7, 8 from 45th
            recommendedNumbers = [targetNums45[5], targetNums45[6], targetNums45[7], targetNums45[8]];
          }

          if (recommendedNumbers.length > 0) {
            // Calculate betting step
            let bettingStep = 1;
            const lastRec = newRecs.find(r => r.status !== 'pending'); // Find the most recent completed recommendation
            
            if (lastRec) {
              if (lastRec.status === 'lost') {
                if (lastRec.bettingStep < 4) {
                  bettingStep = lastRec.bettingStep + 1;
                } else {
                  bettingStep = 1; // Reset after 4 losses
                }
              } else {
                bettingStep = 1; // Reset after win
              }
            }

            newRecs.unshift({
              period: nextPeriodStr,
              basedOnPeriod: latestDraw.period,
              recommendedNumbers,
              status: 'pending',
              patternType,
              createTime: Date.now(),
              bettingStep
            });
            changed = true;
            
            // Voice notification & Macro Helper update
            if (settings.macroHelper) {
              // Post the new recommendation to the server API
              fetch('/api/update-recommendation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ period: nextPeriodStr, numbers: recommendedNumbers, step: bettingStep })
              }).catch(err => console.error("Failed to update recommendation API:", err));

              // Generate the task string for the universal executor
              if (settings.macroConfig) {
                const config = settings.macroConfig;
                const commands: string[] = [];
                
                // 1. Click numbers
                commands.push(`LOG,正在选中推荐号码...`);
                recommendedNumbers.forEach(num => {
                  const coord = config.numCoords[num];
                  if (coord) {
                    commands.push(`CLICK,${coord}`);
                    commands.push(`DELAY,150`);
                  }
                });
                
                // 2. Click amount input
                commands.push(`LOG,正在唤出小键盘...`);
                commands.push(`CLICK,${config.amountInput}`);
                commands.push(`DELAY,600`);
                
                // 3. Click clear
                commands.push(`LOG,正在清零倍数...`);
                commands.push(`CLICK,${config.keypadClear}`);
                commands.push(`DELAY,300`);
                
                // 4. Click digits
                const amount = config.betSteps[bettingStep - 1] || config.betSteps[0];
                commands.push(`LOG,正在输入倍数: ${amount}`);
                const amountStr = String(amount);
                for (let i = 0; i < amountStr.length; i++) {
                  const digit = parseInt(amountStr[i]);
                  const coord = config.keypadCoords[digit];
                  if (coord) {
                    commands.push(`CLICK,${coord}`);
                    commands.push(`DELAY,200`);
                  }
                }
                
                // 5. Click confirm
                commands.push(`LOG,确认倍数...`);
                commands.push(`CLICK,${config.keypadConfirm}`);
                commands.push(`DELAY,500`);
                
                // 6. Click submit
                commands.push(`LOG,点击立即投注...`);
                commands.push(`CLICK,${config.submitBet}`);
                commands.push(`DELAY,500`);
                
                const taskString = commands.join('|');
                
                fetch('/api/update-task', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ taskString })
                }).catch(err => console.error("Failed to update task API:", err));
              }
            }

            if (enableVoice && 'speechSynthesis' in window) {
              const utterance = new SpeechSynthesisUtterance(`第${nextPeriodStr.slice(-3)}期推荐已生成，倍投策略第${bettingStep}轮`);
              utterance.lang = 'zh-CN';
              window.speechSynthesis.speak(utterance);
            }
          }
        }
      }

      return changed ? newRecs : prev;
    });
  }, [draws]);

  const handleDownload = () => {
    if (recommendations.length === 0) return;
    
    // CSV Header
    const headers = ['预测期号', '推荐号码', '倍投策略', '本轮盈亏', '状态', '实际冠军', '创建时间'];
    
    // CSV Rows
    const rows = recommendations.map(rec => [
      rec.period,
      rec.recommendedNumbers.join(' '),
      `第${rec.bettingStep}轮`,
      rec.profit !== undefined ? rec.profit : '-',
      rec.status === 'won' ? '中奖' : rec.status === 'lost' ? '未中' : '等待开奖',
      rec.actualChampion || '-',
      format(rec.createTime, 'yyyy-MM-dd HH:mm:ss')
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `lottery_recommendations_${format(new Date(), 'yyyyMMddHHmmss')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalProfit = recommendations.reduce((sum, rec) => sum + (rec.profit || 0), 0);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const renderBallRow = (result: string | number[]) => {
    const nums = Array.isArray(result) 
      ? result.map(String) 
      : String(result).split(/[,\s]+/).filter(n => n.trim());
    
    const firstHalf = nums.slice(0, 5);
    const secondHalf = nums.slice(5);

    return (
      <div className="flex items-center">
        <div className="flex gap-1.5">
          {firstHalf.map((n, i) => (
             <div key={`f-${i}`} className={`${getNumberColor(n)} text-white w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm shadow-md`}>{n}</div>
          ))}
        </div>
        <div className="w-8"></div> {/* Spacer */}
        <div className="flex gap-1.5">
          {secondHalf.map((n, i) => (
             <div key={`s-${i}`} className={`${getNumberColor(n)} text-white w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm shadow-md`}>{n}</div>
          ))}
        </div>
      </div>
    );
  };

  const renderComparisonRow = (label: string, draw: DrawRecord | undefined) => {
    if (!draw) return null;
    return (
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-mono text-gray-400 uppercase">{label}</span>
          <span className="text-lg font-mono font-bold text-white">{draw.period}</span>
        </div>
        {renderBallRow(draw.result)}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-[#141414] p-6 flex justify-between items-center bg-[#E4E3E0] sticky top-0 z-10">
        <div>
          <h1 className="text-4xl font-serif font-black uppercase tracking-tighter leading-none">
            开奖大师 <span className="text-sm font-sans font-normal normal-case tracking-normal opacity-50 ml-2">v1.0</span>
          </h1>
          <p className="text-xs font-mono mt-1 opacity-60 uppercase">实时积分开奖分析与策略</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end mr-4 border-r border-[#141414]/10 pr-4">
            <span className="text-[10px] font-mono uppercase opacity-50">最后读取</span>
            <span className="text-xs font-mono font-bold">
              {format(lastAttempt, 'HH:mm:ss')}
            </span>
          </div>
          <div className="flex flex-col items-end mr-4 border-r border-[#141414]/10 pr-4">
            <span className="text-[10px] font-mono uppercase opacity-50">最后更新</span>
            <span className="text-xs font-mono font-bold">
              {format(lastUpdated, 'HH:mm:ss')}
            </span>
          </div>
          <div className="flex flex-col items-end">
            {nextPeriod && (
              <span className="text-[10px] font-mono uppercase opacity-50">
                下期开奖: {nextPeriod}
              </span>
            )}
          </div>
          <button 
            onClick={() => setEnableVoice(!enableVoice)}
            className={`p-2 border border-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors ${!enableVoice ? 'opacity-50' : ''}`}
            title={enableVoice ? "关闭语音提示" : "开启语音提示"}
          >
            {enableVoice ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>
          <button 
            onClick={() => setShowRecommendations(true)}
            className="p-2 border border-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors relative"
          >
            <List size={20} />
            {recommendations.some(r => r.status === 'pending') && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
            )}
          </button>

          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 border border-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors"
          >
            <Settings size={20} />
          </button>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_500px] overflow-hidden">
        {/* Left Column: History */}
        <section className="border-r border-[#141414] overflow-y-auto bg-white/50">
          <div className="p-4 border-b border-[#141414] flex justify-between items-center bg-[#E4E3E0]">
            <div className="flex items-center gap-2">
              <History size={16} className="opacity-50" />
              <span className="font-serif italic text-sm uppercase font-bold">历史开奖记录</span>
            </div>
            <button 
              onClick={() => handleRefresh()}
              disabled={loading}
              className="flex items-center gap-2 text-xs font-mono uppercase hover:underline disabled:opacity-50"
            >
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
              {loading ? '正在获取...' : '刷新数据'}
            </button>
          </div>

          {error && (
            <div className="p-3 bg-orange-100 border-b border-orange-200 flex items-center gap-2 text-[10px] text-orange-800 font-mono uppercase">
              <AlertCircle size={12} />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-[100px_1fr_80px] p-4 border-b border-[#141414]/10 bg-white sticky top-0 z-[5]">
            <div className="text-sm font-sans text-gray-500 text-center">期数</div>
            <div className="flex justify-center">
              <div className="bg-[#FF9933] text-white px-12 py-1 rounded-full text-sm font-sans">号码</div>
            </div>
            <div className="text-sm font-sans text-gray-500 text-center">大小</div>
          </div>

          <AnimatePresence mode="popLayout">
            {draws.map((draw, idx) => (
              <motion.div 
                key={`${draw.period}-${idx}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.02 }}
                className="grid grid-cols-[100px_1fr_80px] p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors items-center"
              >
                <div className="text-sm text-gray-600 text-center font-sans">{draw.period}</div>
                <div className="flex justify-center gap-1.5 px-4">
                  {(Array.isArray(draw.result) ? draw.result : draw.result.split(',')).map((num, nIdx) => (
                    <div 
                      key={nIdx}
                      className={`${getNumberColor(String(num).trim())} text-white w-7 h-7 flex items-center justify-center rounded-full font-bold text-sm shadow-sm`}
                    >
                      {String(num).trim()}
                    </div>
                  ))}
                </div>
                <div className="flex justify-center">
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${draw.bigSmall === '大' ? 'border-orange-200 bg-orange-50 text-orange-700' : 'border-blue-200 bg-blue-50 text-blue-700'}`}>
                    {draw.bigSmall}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </section>

        {/* Right Column: Comparison Analysis */}
        <section className="flex flex-col bg-[#141414] text-[#E4E3E0]">
          <div className="p-4 border-b border-[#E4E3E0]/20 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <GitCompare size={18} className="text-emerald-400" />
              <span className="font-serif italic text-sm uppercase font-bold tracking-widest">历史对比分析</span>
            </div>
          </div>

          <div className="flex-1 p-8 overflow-y-auto">
            {draws.length > 0 ? (
              <div className="space-y-2">
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm font-mono text-gray-400 uppercase">最新4期冠军号码</span>
                  </div>
                  <div className="flex gap-3">
                    {draws.slice(0, 4).map((draw, idx) => {
                      const champion = Array.isArray(draw.result) 
                        ? String(draw.result[0]) 
                        : String(draw.result).split(/[,\s]+/)[0];
                      return (
                        <div key={idx} className="flex flex-col items-center gap-1">
                          <div className={`${getNumberColor(champion)} text-white w-10 h-10 flex items-center justify-center rounded-full font-bold text-lg shadow-md`}>
                            {champion}
                          </div>
                          <span className="text-[10px] font-mono text-gray-500">{draw.period.slice(-3)}期</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div className="h-px bg-[#E4E3E0]/10 my-6"></div>
                
                {draws.length > 49 ? (
                  <>
                    {renderComparisonRow("对比 - 45期", draws[45])}
                    {renderComparisonRow("对比 - 46期", draws[46])}
                    {renderComparisonRow("对比 - 47期", draws[47])}
                    {renderComparisonRow("对比 - 48期", draws[48])}
                    {renderComparisonRow("对比 - 49期", draws[49])}

                    <div className="h-px bg-[#E4E3E0]/10 my-6"></div>
                    
                    <div className="space-y-4">
                      <div className="text-sm font-mono text-gray-400 uppercase mb-2">冠军位置分析</div>
                      
                      {[
                        { championDraw: draws[3], targetDraw: draws[49], label: "第4期冠军 vs 49期" },
                        { championDraw: draws[2], targetDraw: draws[48], label: "第3期冠军 vs 48期" },
                        { championDraw: draws[1], targetDraw: draws[47], label: "第2期冠军 vs 47期" },
                        { championDraw: draws[0], targetDraw: draws[46], label: "最新冠军 vs 46期" }
                      ].map((item, idx) => {
                        const champion = Array.isArray(item.championDraw.result) 
                          ? item.championDraw.result[0] 
                          : parseInt(String(item.championDraw.result).split(/[,\s]+/)[0]);
                        
                        const targetNums = Array.isArray(item.targetDraw.result)
                          ? item.targetDraw.result
                          : String(item.targetDraw.result).split(/[,\s]+/).map(n => parseInt(n.trim()));
                        
                        const leftHalf = targetNums.slice(0, 5);
                        const rightHalf = targetNums.slice(5);
                        
                        let position = "未出现";
                        let color = "text-gray-500";
                        
                        if (leftHalf.includes(champion)) {
                          position = "左半区";
                          color = "text-yellow-400";
                        } else if (rightHalf.includes(champion)) {
                          position = "右半区";
                          color = "text-blue-400";
                        }
                        
                        return (
                          <div key={idx} className="flex justify-between items-center bg-white/5 p-3 rounded-lg">
                            <div className="flex flex-col">
                              <span className="text-xs text-gray-400">{item.label}</span>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] opacity-50">冠军:</span>
                                <span className={`w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold text-white ${getNumberColor(String(champion))}`}>
                                  {champion}
                                </span>
                              </div>
                            </div>
                            <span className={`font-mono font-bold ${color}`}>{position}</span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-10 opacity-50">
                    <p className="font-mono text-sm">需要至少50期数据进行对比分析</p>
                    <p className="text-xs mt-2">当前数据量: {draws.length}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center opacity-30 text-center">
                <p className="text-xs font-mono uppercase">等待数据加载...</p>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Recommendations Modal */}
      <AnimatePresence>
        {showRecommendations && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#141414]/80 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-[#E4E3E0] border border-[#141414] w-full max-w-4xl max-h-[80vh] flex flex-col shadow-2xl"
            >
              <div className="p-6 border-b border-[#141414] flex justify-between items-center bg-white">
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-serif font-bold italic">推荐记录</h2>
                  {recommendations.length > 0 && (
                    <>
                      <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-lg border border-gray-200">
                        <span className="text-xs text-gray-500">总盈亏:</span>
                        <span className={`text-sm font-bold font-mono ${totalProfit > 0 ? 'text-emerald-600' : totalProfit < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                          {totalProfit > 0 ? '+' : ''}{totalProfit}
                        </span>
                      </div>
                      <button 
                        onClick={handleDownload}
                        className="flex items-center gap-1 text-xs text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                      >
                        <Download size={14} />
                        下载记录
                      </button>
                      <button 
                        onClick={handleClearRecommendations}
                        className="flex items-center gap-1 text-xs text-red-600 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                      >
                        <Trash2 size={14} />
                        清空记录
                      </button>
                    </>
                  )}
                </div>
                <button onClick={() => setShowRecommendations(false)}>
                  <XCircle size={24} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                {recommendations.length === 0 ? (
                  <div className="text-center py-10 opacity-50 font-mono">暂无推荐记录</div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#141414] text-xs font-mono uppercase opacity-60">
                        <th className="py-2">预测期号</th>
                        <th className="py-2">推荐号码</th>
                        <th className="py-2">倍投策略</th>
                        <th className="py-2">本轮盈亏</th>
                        <th className="py-2">状态</th>
                        <th className="py-2">实际冠军</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recommendations.map((rec, idx) => (
                        <tr key={idx} className="border-b border-[#141414]/10 font-mono text-sm">
                          <td className="py-3">{rec.period}</td>
                          <td className="py-3">
                            <div className="flex gap-1">
                              {rec.recommendedNumbers.map(n => (
                                <span key={n} className={`${getNumberColor(String(n))} text-white w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold`}>
                                  {n}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-3">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                              rec.bettingStep === 1 ? 'bg-gray-200 text-gray-700' :
                              rec.bettingStep === 2 ? 'bg-blue-100 text-blue-700' :
                              rec.bettingStep === 3 ? 'bg-purple-100 text-purple-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              第{rec.bettingStep}轮
                            </span>
                          </td>
                          <td className="py-3">
                            {rec.profit !== undefined ? (
                              <span className={`font-mono font-bold ${rec.profit > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                {rec.profit > 0 ? '+' : ''}{rec.profit}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="py-3">
                            {rec.status === 'pending' && <span className="text-gray-500">等待开奖</span>}
                            {rec.status === 'won' && <span className="text-emerald-600 font-bold flex items-center gap-1"><CheckCircle2 size={14}/> 中奖</span>}
                            {rec.status === 'lost' && <span className="text-red-600 flex items-center gap-1"><XCircle size={14}/> 未中</span>}
                          </td>
                          <td className="py-3">
                            {rec.actualChampion ? (
                              <span className={`${getNumberColor(String(rec.actualChampion))} text-white w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold`}>
                                {rec.actualChampion}
                              </span>
                            ) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clear Confirmation Modal */}
      <AnimatePresence>
        {showClearConfirm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-[#141414]/80 backdrop-blur-sm p-4"
            onClick={() => setShowClearConfirm(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-[#E4E3E0] border border-[#141414] w-full max-w-sm p-6 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold mb-4">确认清空?</h3>
              <p className="text-sm text-gray-600 mb-6">
                确定要清空所有推荐记录吗？此操作不可恢复。
              </p>
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setShowClearConfirm(false)}
                  className="px-4 py-2 text-sm border border-gray-300 bg-white hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button 
                  onClick={confirmClearRecommendations}
                  className="px-4 py-2 text-sm bg-red-600 text-white hover:bg-red-700 transition-colors"
                >
                  确认清空
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#141414]/80 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-[#E4E3E0] border border-[#141414] w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-[#141414]/10">
                <h2 className="text-2xl font-serif font-bold italic">软件配置</h2>
              </div>
              
              <div className="p-8 space-y-6 overflow-y-auto">
                <div>
                  <label className="block text-[10px] font-mono uppercase mb-2 opacity-60">数据源网址 (网页抓取)</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Database className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" size={14} />
                      <input 
                        type="text" 
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://example.com/lottery/results"
                        className="w-full bg-white border border-[#141414] pl-10 pr-4 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-[#141414]"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase mb-2 opacity-60">自动更新间隔 (秒)</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <RefreshCw className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" size={14} />
                      <input 
                        type="number" 
                        value={autoRefreshInterval}
                        onChange={(e) => setAutoRefreshInterval(Math.max(5, parseInt(e.target.value) || 15))}
                        className="w-full bg-white border border-[#141414] pl-10 pr-4 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-[#141414]"
                      />
                    </div>
                  </div>
                </div>



                <div>
                  <label className="block text-[10px] font-mono uppercase mb-2 opacity-60">语音提示</label>
                  <button
                    onClick={() => setEnableVoice(!enableVoice)}
                    className={`flex items-center gap-2 px-4 py-2 border ${enableVoice ? 'bg-[#141414] text-white border-[#141414]' : 'bg-white text-gray-500 border-gray-300'} transition-colors w-full`}
                  >
                    {enableVoice ? <Volume2 size={16} /> : <VolumeX size={16} />}
                    <span className="text-xs font-mono font-bold uppercase">{enableVoice ? '已开启' : '已关闭'}</span>
                  </button>
                </div>

                <div className="pt-4 border-t border-[#141414]/10">
                  <label className="block text-[10px] font-mono uppercase mb-2 opacity-60">手动输入数据 (可选)</label>
                  <textarea 
                    value={manualData}
                    onChange={(e) => setManualData(e.target.value)}
                    placeholder="期号,结果 (每行一条)&#10;例如: 20240101001,1 2 3"
                    className="w-full h-32 bg-white border border-[#141414] p-3 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#141414] resize-none"
                  />
                  <button 
                    onClick={handleManualEntry}
                    className="mt-2 w-full bg-[#141414] text-[#E4E3E0] py-2 text-[10px] font-mono uppercase font-bold hover:bg-emerald-600 transition-colors"
                  >
                    应用手动数据
                  </button>
                </div>

                {/* Auto-betting Settings */}
                <div className="pt-4 border-t border-[#141414]/10">
                  <h3 className="font-serif font-bold italic text-base mb-3">按键精灵助手</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-xs font-mono">
                        <input 
                          type="checkbox" 
                          checked={settings.macroHelper}
                          onChange={e => setSettings(s => ({ ...s, macroHelper: e.target.checked }))}
                          className="w-4 h-4 accent-[#141414]"
                        />
                        启用按键精灵自动下注
                      </label>
                      <button onClick={handleDownloadScript} className="text-xs font-mono uppercase bg-white border border-[#141414] px-3 py-1 hover:bg-gray-100 transition-colors flex items-center gap-2">
                        <Download size={12} />
                        下载新版脚本
                      </button>
                    </div>
                    <p className="text-[11px] font-mono text-gray-500 pt-2">
                      启用后，网页端将通过API向按键精灵发送开奖指令。请在【脚本控制台】中配置您的屏幕坐标。
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-[#141414]/10 mt-auto bg-white/50 flex justify-end gap-4">
                  <button 
                    onClick={() => setShowSettings(false)}
                    className="text-xs font-mono uppercase hover:underline"
                  >
                    取消
                  </button>
                  <button 
                    onClick={() => setShowSettings(false)}
                    className="bg-[#141414] text-[#E4E3E0] px-6 py-2 text-xs font-mono uppercase font-bold hover:bg-emerald-600 transition-colors"
                  >
                    保存更改
                  </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Macro Helper UI */}
      <AnimatePresence>
        {macroInfo && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 right-4 bg-black text-white p-6 rounded-lg shadow-2xl z-[100] border-4 border-yellow-400"
          >
            <div className="text-center">
              <h3 className="text-lg font-bold text-yellow-400 mb-2">按键精灵助手</h3>
              <p className="text-xs uppercase text-gray-400 mb-4">期号: <span className="font-bold text-yellow-400 text-sm">{macroInfo.period}</span></p>
              <div className="mb-4">
                <p className="text-xs uppercase text-gray-400">推荐号码</p>
                <div className="flex justify-center gap-2 mt-2">
                  {macroInfo.numbers.map(n => (
                    <span key={n} className="bg-white text-black w-12 h-12 flex items-center justify-center text-2xl font-bold rounded">{n}</span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Macro Console Modal */}
      <AnimatePresence>
        {showConsole && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#141414]/90 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-[#1e1e1e] border border-gray-700 w-full max-w-5xl shadow-2xl flex flex-col h-[85vh] text-gray-300"
            >
              <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-[#141414]">
                <div className="flex items-center gap-3">
                  <Bot className="text-indigo-400" size={24} />
                  <h2 className="text-xl font-mono font-bold text-white">按键精灵 - 网页控制台</h2>
                  {macroLogs.length > 0 && (
                    <span className="ml-4 px-2 py-1 bg-green-900/50 text-green-400 text-[10px] font-mono rounded border border-green-700">
                      {macroLogs[0].status}
                    </span>
                  )}
                </div>
                <button 
                  onClick={() => {
                    setShowConsole(false);
                    window.location.hash = '';
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <XCircle size={24} />
                </button>
              </div>
              
              <div className="flex flex-1 overflow-hidden">
                {/* Left Panel: Logs & Status */}
                <div className="w-1/2 border-r border-gray-700 flex flex-col bg-[#1a1a1a]">
                  <div className="p-3 border-b border-gray-700 bg-[#222] font-mono text-xs text-gray-400 uppercase tracking-wider">
                    实时运行日志
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-xs">
                    {macroLogs.length === 0 ? (
                      <div className="text-gray-600 italic">等待脚本连接...</div>
                    ) : (
                      macroLogs.map((log, idx) => (
                        <div key={idx} className="flex gap-3 border-b border-gray-800 pb-2">
                          <span className="text-gray-500 shrink-0">[{log.time}]</span>
                          <div className="flex flex-col">
                            <span className={log.status.includes('正常') ? 'text-green-400' : 'text-indigo-400'}>
                              {log.status} - {log.step}
                            </span>
                            {log.record && <span className="text-gray-400 mt-1">{log.record}</span>}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Right Panel: Configuration */}
                <div className="w-1/2 flex flex-col bg-[#1e1e1e]">
                  <div className="p-3 border-b border-gray-700 bg-[#222] font-mono text-xs text-gray-400 uppercase tracking-wider flex justify-between items-center">
                    <span>坐标与倍数配置 (实时生效)</span>
                    <button onClick={handleDownloadScript} className="text-[10px] bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-500 transition-colors flex items-center gap-1">
                      <Download size={10} /> 下载控制台版脚本
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {settings.macroConfig && (
                      <>
                        <div>
                          <label className="block text-xs font-mono uppercase mb-3 text-gray-400">选号坐标 (1-10)</label>
                          <div className="grid grid-cols-5 gap-3">
                            {[1,2,3,4,5,6,7,8,9,10].map(num => (
                              <div key={`num-${num}`}>
                                <span className="text-[10px] text-gray-500 mb-1 block">号码 {num}</span>
                                <input 
                                  type="text" 
                                  value={settings.macroConfig!.numCoords[num] || ''}
                                  onChange={e => setSettings(s => ({
                                    ...s, 
                                    macroConfig: { ...s.macroConfig!, numCoords: { ...s.macroConfig!.numCoords, [num]: e.target.value } }
                                  }))}
                                  className="w-full bg-[#141414] border border-gray-700 px-2 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                                  placeholder="x,y"
                                />
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-mono uppercase mb-3 text-gray-400">小键盘坐标 (0-9)</label>
                          <div className="grid grid-cols-5 gap-3">
                            {[1,2,3,4,5,6,7,8,9,0].map(num => (
                              <div key={`keypad-${num}`}>
                                <span className="text-[10px] text-gray-500 mb-1 block">按键 {num}</span>
                                <input 
                                  type="text" 
                                  value={settings.macroConfig!.keypadCoords[num] || ''}
                                  onChange={e => setSettings(s => ({
                                    ...s, 
                                    macroConfig: { ...s.macroConfig!, keypadCoords: { ...s.macroConfig!.keypadCoords, [num]: e.target.value } }
                                  }))}
                                  className="w-full bg-[#141414] border border-gray-700 px-2 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                                  placeholder="x,y"
                                />
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-mono uppercase mb-1 text-gray-500">倍数输入框坐标</label>
                            <input 
                              type="text" 
                              value={settings.macroConfig!.amountInput}
                              onChange={e => setSettings(s => ({ ...s, macroConfig: { ...s.macroConfig!, amountInput: e.target.value } }))}
                              className="w-full bg-[#141414] border border-gray-700 px-2 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-mono uppercase mb-1 text-gray-500">立即投注坐标</label>
                            <input 
                              type="text" 
                              value={settings.macroConfig!.submitBet}
                              onChange={e => setSettings(s => ({ ...s, macroConfig: { ...s.macroConfig!, submitBet: e.target.value } }))}
                              className="w-full bg-[#141414] border border-gray-700 px-2 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-mono uppercase mb-1 text-gray-500">小键盘清零坐标</label>
                            <input 
                              type="text" 
                              value={settings.macroConfig!.keypadClear}
                              onChange={e => setSettings(s => ({ ...s, macroConfig: { ...s.macroConfig!, keypadClear: e.target.value } }))}
                              className="w-full bg-[#141414] border border-gray-700 px-2 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-mono uppercase mb-1 text-gray-500">小键盘确认坐标</label>
                            <input 
                              type="text" 
                              value={settings.macroConfig!.keypadConfirm}
                              onChange={e => setSettings(s => ({ ...s, macroConfig: { ...s.macroConfig!, keypadConfirm: e.target.value } }))}
                              className="w-full bg-[#141414] border border-gray-700 px-2 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-mono uppercase mb-3 text-gray-400">策略倍数 (第1-4轮)</label>
                          <div className="grid grid-cols-4 gap-3">
                            {[0, 1, 2, 3].map(idx => (
                              <div key={`step-${idx}`}>
                                <span className="text-[10px] text-gray-500 mb-1 block">第 {idx + 1} 轮</span>
                                <input 
                                  type="number" 
                                  value={settings.macroConfig!.betSteps[idx] || 0}
                                  onChange={e => {
                                    const newSteps = [...settings.macroConfig!.betSteps];
                                    newSteps[idx] = parseInt(e.target.value) || 0;
                                    setSettings(s => ({ ...s, macroConfig: { ...s.macroConfig!, betSteps: newSteps } }));
                                  }}
                                  className="w-full bg-[#141414] border border-gray-700 px-2 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
