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
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('app_settings');
    const defaults: AppSettings = { macroHelper: false };
    const savedSettings = saved ? JSON.parse(saved) : {};
    return { ...defaults, ...savedSettings };
  });
  const [macroInfo, setMacroInfo] = useState<{ period: string, numbers: number[] } | null>(null);

  const autoElfScriptContent = `
Rem =========================================================================================
Rem == 按键精灵 (VBScript) - 全自动投注脚本 v19.0 (高级定制窗体版)
Rem =========================================================================================
Rem 说明：
Rem 1. 请在按键精灵的【界面】选项卡中，创建一个窗体 (默认名称 Form1)
Rem 2. 在窗体上添加以下组件并严格按照括号内的名称修改【名称】属性：
Rem    [状态区]
Rem    - 标签 (名称: LblStatus，标题: 已停止)
Rem    - 标签 (名称: LblPeriod，标题: --)
Rem    - 标签 (名称: LblStep，标题: --)
Rem    [控制区]
Rem    - 按钮 (名称: BtnBind，标题: 绑定窗口)
Rem    - 按钮 (名称: BtnStart，标题: 启动)
Rem    - 按钮 (名称: BtnStop，标题: 停止)
Rem    [参数区]
Rem    - 输入框 (名称: InpStep1，文本: 10)
Rem    - 输入框 (名称: InpStep2，文本: 30)
Rem    - 输入框 (名称: InpStep3，文本: 70)
Rem    - 输入框 (名称: InpStep4，文本: 150)
Rem    - 输入框 (名称: InpInterval，文本: 30)
Rem    [日志区]
Rem    - 输入框 (名称: TxtLog，请在属性中设置"多行"为"是")
Rem 3. 将本代码全部复制到【源码】选项卡中。

UserVar ServerURL="${window.location.origin}/api/recommendation" "【系统】开奖大师数据接口"
UserVar ClickMode=1 "【系统】点击模式 (1=前台真实点击, 2=后台模拟点击)"

UserVar Num1Coord="100,200" "【选号】号码 01 坐标"
UserVar Num2Coord="150,200" "【选号】号码 02 坐标"
UserVar Num3Coord="200,200" "【选号】号码 03 坐标"
UserVar Num4Coord="250,200" "【选号】号码 04 坐标"
UserVar Num5Coord="300,200" "【选号】号码 05 坐标"
UserVar Num6Coord="100,250" "【选号】号码 06 坐标"
UserVar Num7Coord="150,250" "【选号】号码 07 坐标"
UserVar Num8Coord="200,250" "【选号】号码 08 坐标"
UserVar Num9Coord="250,250" "【选号】号码 09 坐标"
UserVar Num10Coord="300,250" "【选号】号码 10 坐标"

UserVar AmountInputCoord="200,300" "【操作】'倍数'输入框坐标"
UserVar SubmitBetCoord="350,600" "【操作】'立即投注'按钮坐标"

UserVar KeyClearCoord="300,400" "【键盘】'清零'按钮坐标"
UserVar KeyConfirmCoord="300,500" "【键盘】'确认'按钮坐标"
UserVar Key0Coord="150,500" "【键盘】数字 0 坐标"
UserVar Key1Coord="50,400" "【键盘】数字 1 坐标"
UserVar Key2Coord="150,400" "【键盘】数字 2 坐标"
UserVar Key3Coord="250,400" "【键盘】数字 3 坐标"
UserVar Key4Coord="50,430" "【键盘】数字 4 坐标"
UserVar Key5Coord="150,430" "【键盘】数字 5 坐标"
UserVar Key6Coord="250,430" "【键盘】数字 6 坐标"
UserVar Key7Coord="50,460" "【键盘】数字 7 坐标"
UserVar Key8Coord="150,460" "【键盘】数字 8 坐标"
UserVar Key9Coord="250,460" "【键盘】数字 9 坐标"

Dim LastBetPeriod, Hwnd, IsRunning
LastBetPeriod = ""
Hwnd = 0
IsRunning = False

' --- 界面按钮事件 ---
Event Form1.BtnBind.Click
    Call AddLog("请将鼠标移至游戏窗口内，按【回车键】(Enter) 绑定...")
    Dim key
    Do
        key = WaitKey()
        If key = 13 Then 
            Hwnd = Plugin.Window.MousePoint()
            Call AddLog("绑定成功！窗口句柄: " & Hwnd)
            Form1.LblStatus.Caption = "已绑定"
            Exit Do
        End If
    Loop
End Event

Event Form1.BtnStart.Click
    If Hwnd = 0 Then
        Call AddLog("【警告】请先点击“绑定窗口”！")
    Else
        IsRunning = True
        Form1.LblStatus.Caption = "运行中"
        Call AddLog("脚本已启动，开始监听网页端指令...")
    End If
End Event

Event Form1.BtnStop.Click
    IsRunning = False
    Form1.LblStatus.Caption = "已停止"
    Call AddLog("脚本已停止运行。")
End Event

' --- 日志输出函数 ---
Sub AddLog(msg)
    Dim currentText
    currentText = Form1.TxtLog.Text
    ' 保持日志不要太长
    If Len(currentText) > 2000 Then
        currentText = Left(currentText, 2000)
    End If
    Form1.TxtLog.Text = "[" & Time & "] " & msg & vbCrLf & currentText
End Sub

' --- 主循环 ---
Do
    If IsRunning = True Then
        Call CheckAPI()
        
        ' 获取界面上设置的轮询间隔
        Dim intervalSec
        intervalSec = CInt(Form1.InpInterval.Text)
        If intervalSec < 5 Then intervalSec = 5 ' 最低5秒
        
        ' 每次检查完等待。为了防止界面卡死，分成多次1秒的延时
        Dim i
        For i = 1 To intervalSec
            If IsRunning = False Then Exit For
            Delay 1000
        Next
    Else
        Delay 1000
    End If
Loop

' --- 检查API并执行下注 ---
Sub CheckAPI()
    Dim Http, Ret, loopPeriod, loopNumbers, loopStep
    Set Http = CreateObject("MSXML2.XMLHTTP")
    On Error Resume Next 
    Err.Clear 
    Http.open "GET", ServerURL & "?t=" & Timer, False
    Http.Send
    If Err.Number <> 0 Then
        Call AddLog("【网络错误】无法连接到网页端，请检查网络或确认网页端已开启。")
        Exit Sub
    End If
    
    If Http.Status = 200 Then
        Ret = Http.responseText
        If InStr(Ret, """period""") > 0 Then
            loopPeriod = Split(Split(Ret, """period"":""")(1), """")(0)
            
            Dim stepStr
            stepStr = Split(Split(Ret, """step"":")(1), ",")(0)
            stepStr = Replace(stepStr, "}", "")
            stepStr = Replace(stepStr, "]", "")
            loopStep = CInt(stepStr)
            
            loopNumbers = Split(Split(Ret, """numbers"":[")(1), "]")(0)
            loopNumbers = Replace(loopNumbers, ",", " ")
            
            If loopPeriod <> "" And loopPeriod <> LastBetPeriod And loopStep >= 1 And loopStep <= 4 Then
                Form1.LblPeriod.Caption = loopPeriod
                Form1.LblStep.Caption = "第 " & CStr(loopStep) & " 轮"
                Call AddLog("获取到新期号: " & loopPeriod & ", 轮次: " & loopStep)
                Call PlaceBet(Hwnd, loopNumbers, loopStep)
                LastBetPeriod = loopPeriod
                Call AddLog("期号 " & loopPeriod & " 下注完毕，等待下期")
            End If
        End If
    ElseIf Http.Status = 404 Then
        ' 404表示网页端还没有生成推荐号码，静默等待即可
    Else
        Call AddLog("【网络异常】服务器返回状态码: " & Http.Status)
    End If
End Sub

' --- 辅助函数: 获取对应轮次的金额 ---
Function GetBetAmount(stepNum)
    Dim amt
    If CInt(stepNum) = 1 Then amt = Form1.InpStep1.Text
    If CInt(stepNum) = 2 Then amt = Form1.InpStep2.Text
    If CInt(stepNum) = 3 Then amt = Form1.InpStep3.Text
    If CInt(stepNum) = 4 Then amt = Form1.InpStep4.Text
    If CInt(stepNum) < 1 Or CInt(stepNum) > 4 Then amt = Form1.InpStep1.Text
    GetBetAmount = CInt(amt)
End Function

' --- 辅助函数: 获取选号坐标 ---
Function GetCoordByNum(num)
    Select Case CInt(num)
        Case 1: GetCoordByNum = Num1Coord
        Case 2: GetCoordByNum = Num2Coord
        Case 3: GetCoordByNum = Num3Coord
        Case 4: GetCoordByNum = Num4Coord
        Case 5: GetCoordByNum = Num5Coord
        Case 6: GetCoordByNum = Num6Coord
        Case 7: GetCoordByNum = Num7Coord
        Case 8: GetCoordByNum = Num8Coord
        Case 9: GetCoordByNum = Num9Coord
        Case 10: GetCoordByNum = Num10Coord
    End Select
End Function

' --- 辅助函数: 获取小键盘数字坐标 ---
Function GetKeyCoordByDigit(digit)
    Select Case CStr(digit)
        Case "0": GetKeyCoordByDigit = Key0Coord
        Case "1": GetKeyCoordByDigit = Key1Coord
        Case "2": GetKeyCoordByDigit = Key2Coord
        Case "3": GetKeyCoordByDigit = Key3Coord
        Case "4": GetKeyCoordByDigit = Key4Coord
        Case "5": GetKeyCoordByDigit = Key5Coord
        Case "6": GetKeyCoordByDigit = Key6Coord
        Case "7": GetKeyCoordByDigit = Key7Coord
        Case "8": GetKeyCoordByDigit = Key8Coord
        Case "9": GetKeyCoordByDigit = Key9Coord
    End Select
End Function

' --- 辅助函数: 安全点击 (支持前台和后台) ---
Sub SafeClick(coordStr, handle)
    Dim coords, x, y
    coords = Split(coordStr, ",")
    If UBound(coords) >= 1 Then
        x = CInt(coords(0))
        y = CInt(coords(1))
        If CInt(ClickMode) = 1 Then
            MoveTo x, y
            Delay 80
            LeftClick 1
            Delay 80
        Else
            Call Plugin.Bkgnd.LeftClick(handle, x, y)
            Delay 150
        End If
    End If
End Sub

' --- 子程序: 后台下注流程 ---
Sub PlaceBet(handle, numbersStr, stepNum)
    Dim BetAmount
    BetAmount = GetBetAmount(stepNum)

    If CInt(ClickMode) = 1 Then
        Call AddLog("正在激活窗口(前台)...")
        Call Plugin.Window.Restore(handle)
        Call Plugin.Window.Active(handle)
        Delay 800
    Else
        Call AddLog("准备后台点击...")
        Delay 300
    End If

    ' 1. 选中推荐号码
    Call AddLog("正在选中推荐号码: " & numbersStr)
    Dim arrNumbers, num
    arrNumbers = Split(numbersStr, " ")
    For Each num In arrNumbers
        If IsNumeric(num) Then
            Call SafeClick(GetCoordByNum(num), handle)
            Delay 150
        End If
    Next
    
    ' 2. 点击“倍数”输入框，唤出小键盘
    Call SafeClick(AmountInputCoord, handle)
    Delay 600 
    
    ' 3. 点击小键盘“清零”
    Call SafeClick(KeyClearCoord, handle)
    Delay 300
    
    ' 4. 拆分金额数字并在小键盘上依次点击
    Call AddLog("正在输入倍数: " & BetAmount)
    Dim amountStr, i, digit
    amountStr = CStr(BetAmount)
    For i = 1 To Len(amountStr)
        digit = Mid(amountStr, i, 1)
        Call SafeClick(GetKeyCoordByDigit(digit), handle)
        Delay 200
    Next
    
    ' 5. 点击小键盘“确认”
    Call SafeClick(KeyConfirmCoord, handle)
    Delay 500
    
    ' 6. 点击“立即投注”
    Call AddLog("点击立即投注")
    Call SafeClick(SubmitBetCoord, handle)
    Delay 500
    
End Sub
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
                  <h3 className="font-serif font-bold italic text-base mb-3">按键精灵助手 (独立运行程序版)</h3>
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
                      <button onClick={handleDownloadScript} className="text-xs font-mono uppercase bg-[#141414] text-[#E4E3E0] px-3 py-1 hover:bg-emerald-600 transition-colors flex items-center gap-2">
                        <Download size={12} />
                        下载新版脚本
                      </button>
                    </div>
                    <div className="text-[11px] font-mono text-gray-500 pt-2 space-y-1">
                      <p>1. 在按键精灵中新建一个脚本，点击<strong className="text-[#141414]">【界面】</strong>选项卡。</p>
                      <p>2. 按照脚本顶部的注释说明，添加对应的<strong className="text-[#141414]">【标签】、【按钮】和【输入框】</strong>，并修改它们的<strong className="text-[#141414]">【名称】</strong>属性。</p>
                      <p>3. 点击上方按钮下载脚本，并全部粘贴到<strong className="text-[#141414]">【源码】</strong>选项卡中。</p>
                      <p>4. 运行脚本，您将看到自己设计的高级控制终端！</p>
                    </div>
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
    </div>
  );
}
