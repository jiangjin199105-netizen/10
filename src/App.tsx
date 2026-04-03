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
  Bot,
  Lock,
  Key,
  Calendar,
  ShieldAlert,
  UserPlus,
  UserMinus,
  Plus,
  Minus,
  Snowflake,
  Flame,
  RotateCcw,
  Search,
  Users,
  Activity
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

interface User {
  username: string;
  password: string;
  expiry: number; // timestamp
  isAdmin: boolean;
  isActivated: boolean;
  registrationDate: number;
  isFrozen: boolean;
}

const LOCAL_USERS_KEY = 'lottery_app_users';
const ADMIN_DEFAULT_PASS = 'JH8251050';

const getLocalUsers = (): User[] => {
  const saved = localStorage.getItem(LOCAL_USERS_KEY);
  if (!saved) {
    // Initial admin account
    const admin: User = {
      username: 'admin',
      password: ADMIN_DEFAULT_PASS,
      expiry: Date.now() + 100 * 365 * 24 * 60 * 60 * 1000, // 100 years
      isAdmin: true,
      isActivated: true,
      registrationDate: Date.now(),
      isFrozen: false
    };
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify([admin]));
    return [admin];
  }
  const users: User[] = JSON.parse(saved);
  // Migration: ensure new fields exist
  return users.map(u => ({
    ...u,
    registrationDate: u.registrationDate || Date.now(),
    isFrozen: u.isFrozen || false
  }));
};

const saveLocalUsers = (users: User[]) => {
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = sessionStorage.getItem('current_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [view, setView] = useState<'login' | 'register' | 'admin' | 'app'>(() => {
    const saved = sessionStorage.getItem('current_user');
    if (!saved) return 'login';
    const user = JSON.parse(saved);
    return user.isAdmin ? 'admin' : 'app';
  });

  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState<boolean>(false);
  const [adminSearch, setAdminSearch] = useState('');
  const [expiryModalUser, setExpiryModalUser] = useState<User | null>(null);

  const [draws, setDraws] = useState<DrawRecord[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
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
  const [url, setUrl] = useState<string>('https://api.api168168.com/pks/getPksHistoryList.do?lotCode=10012');
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
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // App Settings
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('app_settings');
    const defaults: AppSettings = { macroHelper: false, autoRefreshInterval: 15, bettingRounds: 6, predictionLogic: 'logic1' };
    const savedSettings = saved ? JSON.parse(saved) : {};
    return { ...defaults, ...savedSettings };
  });

  useEffect(() => {
    localStorage.setItem('app_settings', JSON.stringify(settings));
  }, [settings]);

  const [macroInfo, setMacroInfo] = useState<{ period: string, numbers: number[] } | null>(null);

  // Check expiry and frozen status for current user
  useEffect(() => {
    if (currentUser && !currentUser.isAdmin) {
      if (currentUser.isFrozen) {
        setLoginError('您的账号已被冻结，请联系管理员');
        handleLogout();
        return;
      }
      if (currentUser.expiry < Date.now()) {
        setLoginError('您的账号已过期，请联系管理员续费');
        handleLogout();
      }
    }
  }, [currentUser]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    const users = getLocalUsers();
    const user = users.find(u => u.username === loginUsername && u.password === loginPassword);
    
    if (user) {
      if (user.isFrozen) {
        setLoginError('账号已被冻结');
        return;
      }
      if (!user.isAdmin && user.expiry < Date.now()) {
        setLoginError('账号已过期');
        return;
      }
      setCurrentUser(user);
      sessionStorage.setItem('current_user', JSON.stringify(user));
      setView(user.isAdmin ? 'admin' : 'app');
    } else {
      setLoginError('用户名或密码错误');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    
    if (regPassword !== regConfirmPassword) {
      setLoginError('两次输入的密码不一致');
      return;
    }
    
    if (regUsername.length < 3) {
      setLoginError('用户名长度至少为3位');
      return;
    }
    
    if (regPassword.length < 6) {
      setLoginError('密码长度至少为6位');
      return;
    }

    const users = getLocalUsers();
    if (users.find(u => u.username === regUsername)) {
      setLoginError('用户名已存在');
      return;
    }
    const newUser: User = {
      username: regUsername,
      password: regPassword,
      expiry: Date.now() + 24 * 60 * 60 * 1000, // Default 1 day for new users
      isAdmin: false,
      isActivated: true,
      registrationDate: Date.now(),
      isFrozen: false
    };
    saveLocalUsers([...users, newUser]);
    setRegSuccess(true);
    setTimeout(() => {
      setRegSuccess(false);
      setView('login');
      setLoginUsername(regUsername);
      setLoginPassword('');
    }, 2000);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem('current_user');
    setView('login');
  };

  const autoElfScriptContent = `
' ///////////////////////////////////////////////////////////////////////////////////////////
' ///////////////////////////// 【可视化界面代码区域】 //////////////////////////////////////
' ///////////////////////////////////////////////////////////////////////////////////////////

UserVar ServerURL="http://127.0.0.1:3000/api/recommendation" "【系统】开奖大师数据接口"
UserVar ClickMode=1 "【系统】点击模式 (1=前台真实点击, 2=后台模拟点击)"

UserVar Num1Coord="829,481" "【选号】号码 01 坐标"
UserVar Num2Coord="925,485" "【选号】号码 02 坐标"
UserVar Num3Coord="1024,483" "【选号】号码 03 坐标"
UserVar Num4Coord="1123,475" "【选号】号码 04 坐标"
UserVar Num5Coord="1198,479" "【选号】号码 05 坐标"
UserVar Num6Coord="828,573" "【选号】号码 06 坐标"
UserVar Num7Coord="921,574" "【选号】号码 07 坐标"
UserVar Num8Coord="1037,580" "【选号】号码 08 坐标"
UserVar Num9Coord="1101,575" "【选号】号码 09 坐标"
UserVar Num10Coord="1209,594" "【选号】号码 10 坐标"

UserVar AmountInputCoord="1049,836" "【操作】'倍数'输入框坐标"
UserVar SubmitBetCoord="1174,999" "【操作】'立即投注'按钮坐标"

UserVar KeyClearCoord="1203,730" "【键盘】'清零'按钮坐标"
UserVar KeyConfirmCoord="1215,824" "【键盘】'确认'按钮坐标"
UserVar Key0Coord="944,842" "【键盘】数字 0 坐标"
UserVar Key1Coord="785,626" "【键盘】数字 1 坐标"
UserVar Key2Coord="942,630" "【键盘】数字 2 坐标"
UserVar Key3Coord="1084,630" "【键盘】数字 3 坐标"
UserVar Key4Coord="799,700" "【键盘】数字 4 坐标"
UserVar Key5Coord="951,695" "【键盘】数字 5 坐标"
UserVar Key6Coord="1086,695" "【键盘】数字 6 坐标"
UserVar Key7Coord="781,769" "【键盘】数字 7 坐标"
UserVar Key8Coord="932,773" "【键盘】数字 8 坐标"
UserVar Key9Coord="1073,767" "【键盘】数字 9 坐标"
UserVar KeyReturnCoord="1215,900" "【键盘】'返回'按钮坐标"

UserVar BetStep1=1 "【策略】第1轮倍数"
UserVar BetStep2=2 "【策略】第2轮倍数"
UserVar BetStep3=4 "【策略】第3轮倍数"
UserVar BetStep4=8 "【策略】第4轮倍数"
UserVar BetStep5=16 "【策略】第5轮倍数"
UserVar BetStep6=32 "【策略】第6轮倍数"
UserVar BetStep7=64 "【策略】第7轮倍数"
UserVar BetStep8=128 "【策略】第8轮倍数"
UserVar BetStep9=256 "【策略】第9轮倍数"
UserVar BetStep10=512 "【策略】第10轮倍数"
UserVar BetStep11=1024 "【策略】第11轮倍数"
UserVar BetStep12=2048 "【策略】第12轮倍数"
UserVar MaxRounds=6 "【策略】倍投轮数 (4, 6, 9 或 12)"

' ///////////////////////////// 【可视化界面代码结束】 //////////////////////////////////////
' ///////////////////////////////////////////////////////////////////////////////////////////

Dim LastBetPeriod, Hwnd
Dim LogWindow

LastBetPeriod = ""
Hwnd = 0

' --- 初始化日志窗口 ---
Sub InitLogWindow()
    On Error Resume Next
    Set LogWindow = CreateObject("InternetExplorer.Application")
    LogWindow.Navigate "about:blank"
    LogWindow.ToolBar = False
    LogWindow.StatusBar = False
    LogWindow.MenuBar = False
    LogWindow.Width = 450
    LogWindow.Height = 650
    LogWindow.Visible = True
    LogWindow.Document.Title = "开奖大师 - 运行状态监控"
    LogWindow.Document.Body.Style.backgroundColor = "#1e1e1e"
    LogWindow.Document.Body.Style.color = "#d4d4d4"
    LogWindow.Document.Body.Style.fontFamily = "Microsoft YaHei, Consolas, monospace"
    LogWindow.Document.Body.Style.fontSize = "13px"
    LogWindow.Document.Body.Style.margin = "15px"
    LogWindow.Document.Body.InnerHTML = "<h3 style='color:#4ade80; margin-top:0; border-bottom:1px solid #333; padding-bottom:10px;'>开奖大师 - 自动投注监控</h3><div id='statusBox' style='background:#2d2d2d; padding:10px; border-radius:5px; margin-bottom:10px;'><strong style='color:#60a5fa;'>当前状态:</strong> <span id='sysStatus'>初始化</span><br><strong style='color:#60a5fa;'>当前步骤:</strong> <span id='sysStep'>准备启动</span></div><div style='font-weight:bold; margin-bottom:5px; color:#9ca3af;'>操作日志:</div><div id='logContent' style='height:420px; overflow-y:auto; background:#141414; padding:10px; border:1px solid #333;'></div>"
    
End Sub

Call InitLogWindow()

' --- 状态更新与日志记录函数 ---
Sub UpdateMonitor(sStatus, sStep, sRecord)
    On Error Resume Next
    
    ' 检查窗口是否被关闭，如果关闭则重新创建
    Dim test
    test = LogWindow.Name
    If Err.Number <> 0 Then
        Err.Clear
        Call InitLogWindow()
    End If
    
    ' 更新状态
    If sStatus <> "" Then LogWindow.Document.getElementById("sysStatus").innerText = sStatus
    If sStep <> "" Then LogWindow.Document.getElementById("sysStep").innerText = sStep
    
    ' 追加日志 (最新的在最上面)
    If sRecord <> "" Then 
        Dim logHtml, currentHtml
        logHtml = "<div style='margin-bottom:5px; border-bottom:1px dashed #333; padding-bottom:5px;'><span style='color:#8b949e;'>[" & Time & "]</span> <span style='color:#a5d6ff;'>" & sRecord & "</span></div>"
        currentHtml = LogWindow.Document.getElementById("logContent").innerHTML
        LogWindow.Document.getElementById("logContent").innerHTML = logHtml & currentHtml
    End If
    
   
End Sub

UpdateMonitor "等待操作", "请将鼠标移至投注软件并按回车键(Enter)", "脚本已启动"
MessageBox "【第一步】请将鼠标移动到你要操作的投注软件窗口内，然后按【回车键】(Enter) 锁定该窗口。"
Do
    Dim key
    key = WaitKey()
    If key = 13 Then 
        Hwnd = Plugin.Window.MousePoint()
        UpdateMonitor "正常运行", "等待网页端新指令...", "已成功锁定窗口句柄: " & Hwnd
        Exit Do
    End If
Loop

' --- 2. 主循环 (通过API获取数据并操作) ---
Dim Http, Ret, loopPeriod, loopNumbers, loopStep
Set Http = CreateObject("MSXML2.ServerXMLHTTP")

On Error Resume Next 

Do
    Err.Clear 
    ' 添加时间戳防止 XMLHTTP 缓存导致数据不更新
    Http.open "GET", ServerURL & "?t=" & Timer, False
    Http.Send
    If Err.Number = 0 Then
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
            
            ' 1. 对比期数，保证下注不会重复
            ' 2. 检查轮次是否有效
            If loopPeriod <> "" And loopPeriod <> LastBetPeriod And loopStep >= 1 And loopStep <= MaxRounds Then
                UpdateMonitor "接收指令", "准备执行下注流程", "获取到新期号: " & loopPeriod & ", 轮次: " & loopStep
                
                Call PlaceBet(Hwnd, loopNumbers, loopStep)
                LastBetPeriod = loopPeriod
                
                UpdateMonitor "正常运行", "等待下一期...", "期号 " & loopPeriod & " 下注流程完毕"
            ElseIf loopPeriod = LastBetPeriod Then
                UpdateMonitor "正常运行", "等待新期号...", "当前期号 " & loopPeriod & " 已下注，等待更新"
            End If
        End If
    Else
        UpdateMonitor "网络异常", "连接失败", "无法连接到: " & ServerURL
    End If
    ' 每30秒自动获取一次
    Delay 30000 
Loop

' --- 辅助函数: 获取对应轮次的金额 ---
Function GetBetAmount(stepNum)
    Dim amt
    Select Case CInt(stepNum)
        Case 1: amt = BetStep1
        Case 2: amt = BetStep2
        Case 3: amt = BetStep3
        Case 4: amt = BetStep4
        Case 5: amt = BetStep5
        Case 6: amt = BetStep6
        Case 7: amt = BetStep7
        Case 8: amt = BetStep8
        Case 9: amt = BetStep9
        Case 10: amt = BetStep10
        Case 11: amt = BetStep11
        Case 12: amt = BetStep12
        Case Else: amt = BetStep1
    End Select
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
    
    If BetAmount = 0 Then
        UpdateMonitor "跳过下注", "当前轮次金额为 0", "跳过第 " & stepNum & " 轮"
        Exit Sub
    End If

    If CInt(ClickMode) = 1 Then
        UpdateMonitor "执行下注", "正在激活窗口(前台)...", "开始第 " & stepNum & " 轮, 倍数: " & BetAmount
        Call Plugin.Window.Restore(handle)
        Call Plugin.Window.Active(handle)
        Delay 800
    Else
        UpdateMonitor "执行下注", "准备后台点击...", "开始第 " & stepNum & " 轮, 倍数: " & BetAmount
        Delay 300
    End If

    ' 1. 选中推荐号码
    UpdateMonitor "执行下注", "正在选中推荐号码...", "点击号码: " & numbersStr
    Dim arrNumbers, num
    arrNumbers = Split(numbersStr, " ")
    For Each num In arrNumbers
        If IsNumeric(num) Then
            Call SafeClick(GetCoordByNum(num), handle)
            Delay 150
        End If
    Next
    
    ' 2. 点击“倍数”输入框，唤出小键盘
    UpdateMonitor "执行下注", "正在唤出小键盘...", "点击倍数输入框"
    Call SafeClick(AmountInputCoord, handle)
    Delay 600 
    
    ' 3. 点击小键盘“清零” (执行5次确保清空)
    UpdateMonitor "执行下注", "正在清零倍数...", "点击清零"
    For 5
        Call SafeClick(KeyClearCoord, handle)
        Delay 50
    Next
    Delay 300
    
    ' 4. 拆分金额数字并在小键盘上依次点击
    UpdateMonitor "执行下注", "正在输入倍数: " & BetAmount, "输入倍数: " & BetAmount
    Dim amountStr, i, digit
    amountStr = CStr(BetAmount)
    For i = 1 To Len(amountStr)
        digit = Mid(amountStr, i, 1)
        Call SafeClick(GetKeyCoordByDigit(digit), handle)
        Delay 200
    Next
    
    ' 5. 点击小键盘“确认”
    UpdateMonitor "执行下注", "确认倍数...", "点击确认"
    Call SafeClick(KeyConfirmCoord, handle)
    Delay 500
    
    ' 6. 点击“立即投注”
    UpdateMonitor "执行下注", "点击立即投注...", "点击立即投注"
    Call SafeClick(SubmitBetCoord, handle)
    Delay 500
    
    ' 7. 点击“返回”
    UpdateMonitor "执行下注", "点击返回...", "点击返回"
    Call SafeClick(KeyReturnCoord, handle)
    Delay 500
    
End Sub
`;

  const autoAhkScriptContent = `#Requires AutoHotkey v2.0
#SingleInstance Force

; 解决 DPI 缩放导致的坐标不准问题 (强制物理像素模式)
try DllCall("SetThreadDpiAwarenessContext", "ptr", -3, "ptr")

; ==============================================================================
; 请求管理员权限 (雷电模拟器必须以管理员身份运行脚本才能点击)
; ==============================================================================
if not A_IsAdmin
{
    try {
        Run '*RunAs "' A_ScriptFullPath '"'
    }
    ExitApp
}

; ==============================================================================
; 开奖大师 - AutoHotkey 全自动投注脚本 (v22.0 兼容版)
; ==============================================================================

; ==============================================================================
; 配置区域 (Configuration)
; ==============================================================================
global ServerURL := "http://localhost:3000/api/recommendation"
global ClickMode := 1 ; 1=前台(Foreground), 2=后台(Background)

; 坐标配置 (完全同步自您的按键精灵脚本)
; 格式: [X, Y, 模式] (模式: 1=点击, 2=输入)
global Coords := Map()
Coords["Num1"] := [829, 481, 1], Coords["Num2"] := [925, 485, 1], Coords["Num3"] := [1024, 483, 1], Coords["Num4"] := [1123, 475, 1], Coords["Num5"] := [1198, 479, 1]
Coords["Num6"] := [828, 573, 1], Coords["Num7"] := [921, 574, 1], Coords["Num8"] := [1037, 580, 1], Coords["Num9"] := [1101, 575, 1], Coords["Num10"] := [1209, 594, 1]

Coords["AmountInput"] := [1049, 836, 1] ; 默认点击模式，可选输入模式
Coords["SubmitBet"] := [1174, 999, 1]

Coords["KeyClear"] := [1203, 730, 1]
Coords["KeyConfirm"] := [1215, 824, 1]
Coords["Key0"] := [944, 842, 1], Coords["Key1"] := [785, 626, 1], Coords["Key2"] := [942, 630, 1], Coords["Key3"] := [1084, 630, 1]
Coords["Key4"] := [799, 700, 1], Coords["Key5"] := [951, 695, 1], Coords["Key6"] := [1086, 695, 1], Coords["Key7"] := [781, 769, 1]
Coords["Key8"] := [932, 773, 1], Coords["Key9"] := [1073, 767, 1], Coords["KeyReturn"] := [1215, 900, 1]

; 倍投策略 (12轮)
global BetSteps := [10, 20, 40, 80, 160, 320, 640, 1280, 2560, 5120, 10240, 20480]
global MaxRounds := 6

; ==============================================================================
; 全局变量 (Global Variables)
; ==============================================================================
global TargetHwnd := 0
global LastBetPeriod := ""
global IsRunning := false

; ==============================================================================
; 图形界面 (GUI)
; ==============================================================================
MyGui := Gui(, "开奖大师 - AutoHotkey版")
MyGui.SetFont("s9", "Microsoft YaHei")

MyGui.Add("Text", "x10 y15 w80", "接口地址:")
MyGui.Add("Edit", "x90 y12 w300 vServerURL", ServerURL)

MyGui.Add("Text", "x10 y45 w80", "点击模式:")
MyGui.Add("DropDownList", "x90 y42 w100 vClickMode Choose1", ["前台点击", "后台点击"])

MyGui.Add("Text", "x210 y45 w80", "金额输入:")
MyGui.Add("DropDownList", "x290 y42 w100 vInputMode Choose1", ["点击模式", "输入模式"]).OnEvent("Change", SyncInputMode)

MyGui.Add("GroupBox", "x10 y80 w430 h60", "控制")
MyGui.Add("Button", "x20 y100 w100 vBtnBind", "1. 绑定窗口").OnEvent("Click", BindWindow)
MyGui.Add("Button", "x130 y100 w80 vBtnTest", "测试点击").OnEvent("Click", TestClick)
MyGui.Add("Button", "x220 y100 w80 vBtnTestInput", "测试输入").OnEvent("Click", TestInput)
MyGui.Add("Text", "x310 y105 w130 vLblStatus cBlue", "状态: 未绑定")

MyGui.Add("Button", "x20 y150 w100 vBtnStart", "2. 启动脚本").OnEvent("Click", StartScript)
MyGui.Add("Button", "x130 y150 w100 vBtnStop", "3. 停止脚本").OnEvent("Click", StopScript)
MyGui.Add("Button", "x240 y150 w100 vBtnConfig", "坐标配置").OnEvent("Click", OpenConfig)
MyGui["BtnStop"].Enabled := false

MyGui.Add("Text", "x10 y190 w380", "运行日志:")
global LogEdit := MyGui.Add("Edit", "x10 y210 w430 h220 ReadOnly vLogOutput")

MyGui.Add("Text", "x10 y445 w80", "倍投轮数:")
MyGui.Add("Radio", "x90 y442 w60 vRounds4", "4 轮").OnEvent("Click", (*) => ChangeRounds(4))
MyGui.Add("Radio", "x160 y442 w60 vRounds6 Checked", "6 轮").OnEvent("Click", (*) => ChangeRounds(6))
MyGui.Add("Radio", "x230 y442 w60 vRounds9", "9 轮").OnEvent("Click", (*) => ChangeRounds(9))
MyGui.Add("Radio", "x300 y442 w60 vRounds12", "12 轮").OnEvent("Click", (*) => ChangeRounds(12))

MyGui.Add("GroupBox", "x10 y470 w430 h100", "倍投金额配置")
global EditSteps := []
Loop 12 {
    col := Mod(A_Index - 1, 6)
    row := (A_Index - 1) // 6
    EditSteps.Push(MyGui.Add("Edit", "x" (20 + col*70) " y" (495 + row*30) " w60 vStep" A_Index, BetSteps[A_Index]))
}
MyGui.Add("Button", "x10 y580 w430 h30 vBtnSave", "保存金额配置").OnEvent("Click", SaveBetSteps)

ChangeRounds(n) {
    global MaxRounds := n
    Loop 12 {
        MyGui["Step" A_Index].Enabled := (A_Index <= n)
    }
    AddLog("倍投轮数已切换为: " n " 轮")
}

MyGui.OnEvent("Close", (*) => ExitApp())
MyGui.Show("w450 h630")

; ==============================================================================
; 坐标配置窗口 (Coordinate Configuration GUI)
; ==============================================================================
OpenConfig(*)
{
    local Edits, Modes, Names, ProfileDDL, ConfigGui
    ConfigGui := Gui("+Owner" MyGui.Hwnd, "坐标配置 - 请根据您的界面类型配置")
    ConfigGui.SetFont("s9", "Microsoft YaHei")
    
    ConfigGui.Add("Text", "x10 y10 w600 cGray", "提示: 点击'抓取'后，将鼠标移至目标位置按 F8 即可自动填入。输入模式下，键盘坐标可不填。")
    
    ; --- 存档管理区域 ---
    ConfigGui.Add("GroupBox", "x620 y40 w120 h240", "存档管理")
    ConfigGui.Add("Text", "x630 y65 w100", "当前名称:")
    ProfileNameEdit := ConfigGui.Add("Edit", "x630 y85 w100", "默认配置")
    
    ConfigGui.Add("Text", "x630 y115 w100", "已有存档:")
    ProfileDDL := ConfigGui.Add("DropDownList", "x630 y135 w100", GetProfileList())
    ProfileDDL.OnEvent("Change", (*) => (ProfileNameEdit.Value := ProfileDDL.Text))
    
    ConfigGui.Add("Button", "x630 y170 w100", "保存存档").OnEvent("Click", (*) => DoSaveProfile(ProfileNameEdit.Value))
    ConfigGui.Add("Button", "x630 y205 w100", "加载存档").OnEvent("Click", (*) => DoLoadProfile(ProfileDDL.Text))
    ConfigGui.Add("Button", "x630 y240 w100", "删除存档").OnEvent("Click", (*) => DoDeleteProfile(ProfileDDL.Text))
    ; --------------------

    ; 定义显示名称映射
    Names := Map()
    Names["Num1"] := "号码 01", Names["Num2"] := "号码 02", Names["Num3"] := "号码 03", Names["Num4"] := "号码 04", Names["Num5"] := "号码 05"
    Names["Num6"] := "号码 06", Names["Num7"] := "号码 07", Names["Num8"] := "号码 08", Names["Num9"] := "号码 09", Names["Num10"] := "号码 10"
    Names["AmountInput"] := "倍数输入框", Names["SubmitBet"] := "立即投注按钮"
    Names["KeyClear"] := "键盘-清零", Names["KeyConfirm"] := "键盘-确认"
    Names["Key0"] := "键盘-0", Names["Key1"] := "键盘-1", Names["Key2"] := "键盘-2", Names["Key3"] := "键盘-3", Names["Key4"] := "键盘-4"
    Names["Key5"] := "键盘-5", Names["Key6"] := "键盘-6", Names["Key7"] := "键盘-7", Names["Key8"] := "键盘-8", Names["Key9"] := "键盘-9", Names["KeyReturn"] := "键盘-返回"

    Edits := Map()
    Modes := Map()

    ; --- 第一列：号码配置 ---
    ConfigGui.Add("GroupBox", "x10 y40 w290 h340", "1. 号码选择坐标 (必填)")
    yPos := 65
    Loop 10 {
        key := "Num" A_Index
        val := Coords[key]
        ConfigGui.Add("Text", "x20 y" yPos " w60", Names[key] ":")
        Edits[key] := ConfigGui.Add("Edit", "x85 y" yPos-3 " w80", val[1] ", " val[2])
        
        currentKey := key
        ConfigGui.Add("Button", "x170 y" (yPos-5) " w40", "抓取").OnEvent("Click", ((k, e, *) => CaptureSpecific(k, e)).Bind(currentKey, Edits[key]))
        ConfigGui.Add("Text", "x220 y" yPos " w60 cGray", "点击")
        yPos += 30
    }

    ; --- 第二列：下注控制 ---
    ConfigGui.Add("GroupBox", "x310 y40 w290 h100", "2. 下注动作坐标 (必填)")
    yPos := 65
    ; 倍数输入框
    key := "AmountInput"
    val := Coords[key]
    ConfigGui.Add("Text", "x320 y" yPos " w70", Names[key] ":")
    Edits[key] := ConfigGui.Add("Edit", "x395 y" yPos-3 " w80", val[1] ", " val[2])
    Modes[key] := ConfigGui.Add("DropDownList", "x480 y" yPos-3 " w50 Choose" val[3], ["点击", "输入"])
    ConfigGui.Add("Button", "x540 y" (yPos-5) " w40", "抓取").OnEvent("Click", ((k, e, *) => CaptureSpecific(k, e)).Bind(key, Edits[key]))
    
    yPos += 35
    ; 立即投注
    key := "SubmitBet"
    val := Coords[key]
    ConfigGui.Add("Text", "x320 y" yPos " w70", Names[key] ":")
    Edits[key] := ConfigGui.Add("Edit", "x395 y" yPos-3 " w80", val[1] ", " val[2])
    ConfigGui.Add("Button", "x480 y" (yPos-5) " w40", "抓取").OnEvent("Click", ((k, e, *) => CaptureSpecific(k, e)).Bind(key, Edits[key]))
    ConfigGui.Add("Text", "x530 y" yPos " w60 cGray", "点击")

    ; --- 第三列：虚拟键盘 (仅点击模式需要) ---
    ConfigGui.Add("GroupBox", "x310 y150 w290 h230", "3. 虚拟键盘坐标 (仅点击模式必填)")
    yPos := 175
    keyboardKeys := ["Key1", "Key2", "Key3", "Key4", "Key5", "Key6", "Key7", "Key8", "Key9", "Key0", "KeyClear", "KeyConfirm", "KeyReturn"]
    
    ; 使用两列排版键盘
    Loop keyboardKeys.Length {
        key := keyboardKeys[A_Index]
        val := Coords[key]
        
        ; 计算行列
        col := (A_Index-1) // 6
        row := Mod(A_Index-1, 6)
        
        curX := 320 + (col * 145)
        curY := 175 + (row * 30)
        
        ConfigGui.Add("Text", "x" curX " y" curY " w60", Names[key] ":")
        Edits[key] := ConfigGui.Add("Edit", "x" (curX+55) " y" (curY-3) " w50", val[1] ", " val[2])
        ConfigGui.Add("Button", "x" (curX+110) " y" (curY-5) " w30", "抓").OnEvent("Click", ((k, e, *) => CaptureSpecific(k, e)).Bind(key, Edits[key]))
    }

    ConfigGui.Add("Button", "x310 y400 w150 h40 Default", "保存并应用配置").OnEvent("Click", SaveConfig)
    ConfigGui.Show("w750 h460")

    GetProfileList() {
        iniFile := A_ScriptDir "\Profiles.ini"
        if !FileExist(iniFile)
            return ["默认配置"]
        
        try {
            sections := IniRead(iniFile)
            list := StrSplit(sections, "\`n")
            if (list.Length == 0)
                return ["默认配置"]
            return list
        } catch {
            return ["默认配置"]
        }
    }

    DoSaveProfile(name) {
        if (name == "") {
            MsgBox "请输入存档名称！"
            return
        }
        iniFile := A_ScriptDir "\Profiles.ini"
        section := name
        for key, editCtrl in Edits {
            IniWrite(editCtrl.Value, iniFile, section, key)
            if Modes.Has(key)
                IniWrite(Modes[key].Value, iniFile, section, key "_mode")
        }
        
        ; 刷新下拉列表
        ProfileDDL.Delete()
        ProfileDDL.Add(GetProfileList())
        ProfileDDL.Text := name
        
        ToolTip "已保存存档: " name
        SetTimer () => ToolTip(), -2000
    }

    DoLoadProfile(name) {
        if (name == "") {
            MsgBox "请选择要加载的存档！"
            return
        }
        iniFile := A_ScriptDir "\Profiles.ini"
        section := name
        
        for key, editCtrl in Edits {
            try {
                val := IniRead(iniFile, section, key)
                editCtrl.Value := val
                if Modes.Has(key) {
                    modeVal := IniRead(iniFile, section, key "_mode", "1")
                    Modes[key].Value := Number(modeVal)
                }
            }
        }
        ProfileNameEdit.Value := name
        ToolTip "已加载存档: " name
        SetTimer () => ToolTip(), -2000
    }

    DoDeleteProfile(name) {
        if (name == "" || name == "默认配置") {
            MsgBox "无法删除该存档！"
            return
        }
        if (MsgBox("确定要删除存档 [" name "] 吗？", "确认删除", "YesNo") == "No")
            return
            
        iniFile := A_ScriptDir "\Profiles.ini"
        IniDelete(iniFile, name)
        
        ProfileDDL.Delete()
        ProfileDDL.Add(GetProfileList())
        ProfileDDL.Choose(1)
        ProfileNameEdit.Value := ProfileDDL.Text
        
        ToolTip "已删除存档: " name
        SetTimer () => ToolTip(), -2000
    }

    CaptureSpecific(key, editCtrl) {
        if (TargetHwnd == 0) {
            MsgBox "请先在主界面绑定窗口！"
            return
        }
        MsgBox "请将鼠标移至 [" Names[key] "] 位置，然后按 F8 键抓取坐标。", "抓取提示", "Iconi T3"
        
        ; 临时重定向 F8
        HotKey "F8", (*) => DoCapture(key, editCtrl), "On"
    }

    DoCapture(key, editCtrl) {
        if (!WinExist("ahk_id " TargetHwnd)) {
            ToolTip "错误：目标窗口已失效"
            return
        }
        ; 确保窗口在抓取时是激活的，这样 Client 坐标才准确
        WinActivate "ahk_id " TargetHwnd
        WinWaitActive "ahk_id " TargetHwnd,, 1
        
        CoordMode "Mouse", "Client"
        MouseGetPos &x, &y
        editCtrl.Value := x ", " y
        ToolTip "已抓取 " Names[key] ": " x ", " y
        SetTimer () => ToolTip(), -2000
        HotKey "F8", "Off" ; 抓取一次后关闭
    }

    SaveConfig(*) {
        for key, editCtrl in Edits {
            parts := StrSplit(editCtrl.Value, [",", " ", ";"])
            cleanParts := []
            for p in parts {
                if (IsNumber(Trim(p)))
                    cleanParts.Push(Number(Trim(p)))
            }
            if (cleanParts.Length == 2) {
                mode := Modes.Has(key) ? Modes[key].Value : 1
                Coords[key] := [cleanParts[1], cleanParts[2], mode]
                
                ; 如果是金额输入框，同步到主界面
                if (key == "AmountInput") {
                    MyGui["InputMode"].Value := mode
                }
            }
        }
        AddLog("坐标配置已更新。")
        ConfigGui.Destroy()
    }
}

SyncInputMode(*) {
    global Coords
    Coords["AmountInput"][3] := MyGui["InputMode"].Value
    AddLog("金额输入模式已切换为: " MyGui["InputMode"].Text)
}

; ==============================================================================
; 核心逻辑 (Core Logic)
; ==============================================================================

; 启动时尝试加载第一个存档
try {
    iniFile := A_ScriptDir "\Profiles.ini"
    if FileExist(iniFile) {
        sections := IniRead(iniFile)
        firstSection := StrSplit(sections, "\`n")[1]
        if (firstSection != "") {
            for key, val in Coords {
                str := IniRead(iniFile, firstSection, key, "")
                if (str != "") {
                    parts := StrSplit(str, [",", " ", ";"])
                    if (parts.Length >= 2) {
                        x := Number(Trim(parts[1]))
                        y := Number(Trim(parts[2]))
                        modeVal := IniRead(iniFile, firstSection, key "_mode", "1")
                        Coords[key] := [x, y, Number(modeVal)]
                        
                        ; 如果是金额输入框，同步到主界面
                        if (key == "AmountInput") {
                            MyGui["InputMode"].Value := Number(modeVal)
                        }
                    }
                }
            }
            AddLog("已自动加载存档: " firstSection)
        }
    }
}

; 测试点击功能
TestClick(*)
{
    global TargetHwnd
    if (TargetHwnd == 0) {
        MsgBox "请先绑定窗口！"
        return
    }
    mode := MyGui["ClickMode"].Text
    AddLog("正在测试点击 [号码 01]...")
    SafeClick(Coords["Num1"], TargetHwnd, mode)
    AddLog("测试指令已发送")
}

TestInput(*)
{
    global TargetHwnd
    if (TargetHwnd == 0) {
        MsgBox "请先绑定窗口！"
        return
    }
    mode := MyGui["ClickMode"].Text
    AddLog("正在测试输入 [倍数输入框] (输入: 88)...")
    SafeType(Coords["AmountInput"], TargetHwnd, mode, "88")
    AddLog("测试输入指令已发送")
}

BindWindow(*)
{
    global TargetHwnd
    AddLog("请将鼠标移至游戏窗口内，按【回车键】(Enter) 绑定...")
    
    ; 注册 Enter 键热键，仅触发一次
    HotKey "Enter", CaptureWindow, "On"
}

CaptureWindow(*)
{
    global TargetHwnd
    MouseGetPos ,, &TargetHwnd
    HotKey "Enter", CaptureWindow, "Off" ; 关闭热键
    
    if (TargetHwnd) {
        try {
            Title := WinGetTitle("ahk_id " TargetHwnd)
            MyGui["LblStatus"].Text := "已绑定: " SubStr(Title, 1, 15) "..."
            MyGui["LblStatus"].Opt("cGreen")
            AddLog("绑定成功! 句柄: " TargetHwnd " 标题: " Title)
        } catch {
            AddLog("绑定成功，但无法获取标题。句柄: " TargetHwnd)
            MyGui["LblStatus"].Text := "已绑定: (无标题)"
        }
    } else {
        AddLog("绑定失败，未获取到窗口句柄")
    }
}

SaveBetSteps(*)
{
    global BetSteps
    Loop 12 {
        val := MyGui["Step" A_Index].Value
        if IsNumber(val)
            BetSteps[A_Index] := Number(val)
    }
    AddLog("倍投金额配置已保存")
    MsgBox "倍投金额配置已保存！", "成功", "Iconi"
}

StartScript(*)
{
    global IsRunning, TargetHwnd, BetSteps
    if (!TargetHwnd) {
        MsgBox("请先绑定游戏窗口！", "错误", "Icon!")
        return
    }
    
    ; 同步 GUI 中的倍投金额
    Loop 12 {
        val := MyGui["Step" A_Index].Value
        if IsNumber(val)
            BetSteps[A_Index] := Number(val)
    }
    
    IsRunning := true
    MyGui["BtnStart"].Enabled := false
    MyGui["BtnStop"].Enabled := true
    MyGui["BtnBind"].Enabled := false
    
    AddLog("脚本已启动，开始监听网页端指令...")
    SetTimer CheckAPI, 1000 ; 1秒后开始第一次检查
}

StopScript(*)
{
    global IsRunning
    IsRunning := false
    MyGui["BtnStart"].Enabled := true
    MyGui["BtnStop"].Enabled := false
    MyGui["BtnBind"].Enabled := true
    
    SetTimer CheckAPI, 0 ; 彻底关闭定时器
    AddLog("脚本已停止。")
}

CheckAPI()
{
    global ServerURL, LastBetPeriod, BetSteps, TargetHwnd, IsRunning
    
    ; 1. 立即停止定时器，防止在下注过程中触发第二次检查
    SetTimer CheckAPI, 0
    
    if (!IsRunning)
        return

    savedURL := MyGui["ServerURL"].Value
    
    try {
        whr := ComObject("WinHttp.WinHttpRequest.5.1")
        whr.SetTimeouts(2000, 2000, 2000, 5000)
        whr.Open("GET", savedURL "?t=" A_TickCount, true)
        whr.Send()
        
        if (whr.WaitForResponse(5) == 0) {
            AddLog("连接超时 (5s) - 稍后重试...")
            if (IsRunning)
                SetTimer CheckAPI, 5000 ; 超时后5秒重试
            return
        }
        
        if (whr.Status != 200) {
            AddLog("网络错误: 状态码 " whr.Status)
            if (IsRunning)
                SetTimer CheckAPI, 10000 ; 错误后10秒重试
            return
        }
        
        Ret := whr.ResponseText
        loopPeriod := "", loopStep := 0, loopNumbersStr := ""
        
        ; 解析逻辑 (略...)
        pos1 := InStr(Ret, '"period":"')
        if (pos1 > 0) {
            pos1 += 10
            pos2 := InStr(Ret, '"',, pos1)
            if (pos2 > 0)
                loopPeriod := SubStr(Ret, pos1, pos2 - pos1)
        }
        pos1 := InStr(Ret, '"step":')
        if (pos1 > 0) {
            pos1 += 7
            pos2 := InStr(Ret, ",",, pos1), pos3 := InStr(Ret, "}",, pos1)
            endPos := (pos2 > 0 && pos3 > 0) ? Min(pos2, pos3) : (pos2 > 0 ? pos2 : pos3)
            if (endPos > 0) {
                stepStr := Trim(SubStr(Ret, pos1, endPos - pos1), " \`t\`r\`n\`"")
                if IsNumber(stepStr)
                    loopStep := Integer(stepStr)
            }
        }
        pos1 := InStr(Ret, '"numbers":[')
        if (pos1 > 0) {
            pos1 += 11
            pos2 := InStr(Ret, "]",, pos1)
            if (pos2 > 0) {
                nums := SubStr(Ret, pos1, pos2 - pos1)
                loopNumbersStr := StrReplace(nums, ",", " ")
                loopNumbersStr := StrReplace(loopNumbersStr, '"', "")
            }
        }
        
        if (loopPeriod != "" && loopPeriod != LastBetPeriod && loopStep >= 1 && loopStep <= MaxRounds) {
            AddLog(">>> 发现新指令: " loopPeriod " 期, 第 " loopStep " 轮")
            
            ; 关键：先更新期号，防止下注过程中重复触发
            LastBetPeriod := loopPeriod
            
            ; 执行下注 (这是一个耗时操作)
            PlaceBet(TargetHwnd, loopNumbersStr, loopStep)
            
            AddLog("<<< 期号 " loopPeriod " 下注动作执行完毕")
        } else {
            curStatus := (loopPeriod != "") ? "当前期号: " loopPeriod : "等待数据..."
            AddLog("运行正常: 监听中... (" curStatus ")")
        }
        
    } catch as err {
        AddLog("请求失败: " err.Message)
    }
    
    ; 2. 任务彻底结束后，重新开启定时器 (15秒后进行下一次检查)
    if (IsRunning)
        SetTimer CheckAPI, 15000
}

PlaceBet(hwnd, numbersStr, stepNum)
{
    global BetSteps, Coords
    
    betAmount := BetSteps[stepNum]
    
    if (betAmount == 0) {
        AddLog("当前轮次金额为 0，跳过下注。")
        return
    }

    mode := MyGui["ClickMode"].Text ; 获取选中的文本，例如 "前台点击"
    
    if (mode == "前台点击") {
        AddLog("激活窗口(前台)...")
        try {
            WinActivate "ahk_id " hwnd
            WinWaitActive "ahk_id " hwnd,, 2
        }
        Sleep 1000
    } else {
        AddLog("准备后台点击...")
        Sleep 1000
    }
    
    ; 1. 选中推荐号码
    AddLog("选中号码: " numbersStr)
    nums := StrSplit(numbersStr, " ")
    for n in nums {
        n := Trim(n)
        if IsNumber(n) {
            if (Coords.Has("Num" n)) {
                SafeClick(Coords["Num" n], hwnd, mode)
            }
        }
    }
    
    ; 2. 点击“倍数”输入框
    inputCoord := Coords["AmountInput"]
    if (inputCoord[3] == 2) { ; 输入模式 (直接键盘输入)
        AddLog(">>> 模式: 直接键盘输入 (倍数: " betAmount ")")
        SafeType(inputCoord, hwnd, mode, String(betAmount))
    } else {
        ; 点击模式 (使用虚拟键盘坐标)
        AddLog(">>> 模式: 虚拟键盘点击 (倍数: " betAmount ")")
        SafeClick(inputCoord, hwnd, mode)
        
        ; 3. 点击小键盘“清零” (执行5次确保清空)
        if (Coords.Has("KeyClear")) {
            Loop 5 {
                SafeClick(Coords["KeyClear"], hwnd, mode)
                Sleep 50
            }
        }
        
        ; 4. 输入倍数
        amountStr := String(betAmount)
        Loop Parse, amountStr {
            digit := A_LoopField
            if (Coords.Has("Key" digit)) {
                SafeClick(Coords["Key" digit], hwnd, mode)
            }
        }
        
        ; 5. 点击小键盘“确认”
        if (Coords.Has("KeyConfirm")) {
            SafeClick(Coords["KeyConfirm"], hwnd, mode)
        }
    }
    
    ; 6. 点击“立即投注”
    AddLog("点击立即投注")
    SafeClick(Coords["SubmitBet"], hwnd, mode)
    
    ; 7. 点击“返回”
    if (Coords.Has("KeyReturn")) {
        AddLog("点击返回")
        SafeClick(Coords["KeyReturn"], hwnd, mode)
    }
}

SafeClick(coord, hwnd, mode)
{
    x := coord[1]
    y := coord[2]
    
    if (!WinExist("ahk_id " hwnd)) {
        AddLog("错误：目标窗口不存在")
        return
    }

    ; 1. 强制激活并置顶窗口
    WinActivate "ahk_id " hwnd
    WinWaitActive "ahk_id " hwnd,, 1

    if (mode == "前台点击") {
        ; 切换到客户区坐标系 (Client)，这通常与按键精灵坐标一致
        CoordMode "Mouse", "Client"
        SetDefaultMouseSpeed 5
        
        ; 移动前显示目标提示
        ToolTip "目标坐标: " x ", " y " (客户区模式)"
        SetTimer () => ToolTip(), -2000
        
        ; 移动鼠标并停留
        MouseMove x, y
        Sleep 200
        
        ; 模拟真实触控：按下 -> 停留 -> 抬起
        Click "Down"
        Sleep 200 ; 模拟器识别触控通常需要 >150ms 的停留
        Click "Up"
        Sleep 1000 ; 每步操作后延迟1秒
    } else {
        try {
            ; 后台点击尝试 (后台通常也基于客户区)
            ControlClick "x" x " y" y, "ahk_id " hwnd,,,, "NA"
            Sleep 1000 ; 每步操作后延迟1秒
        }
    }
}

SafeType(coord, hwnd, mode, text)
{
    if (mode == "前台点击") {
        ; --- 前台模式：已验证成功 ---
        try {
            WinActivate "ahk_id " hwnd
            WinWaitActive "ahk_id " hwnd,, 2
        }
        
        if (coord[1] > 0 && coord[2] > 0) {
            AddLog("前台聚焦: " coord[1] ", " coord[2])
            SafeClick(coord, hwnd, mode)
            Sleep 1200
        }
        
        AddLog("前台输入倍数: " text)
        SetKeyDelay 150, 100
        
        ; 清空
        SendEvent "^a"
        Sleep 300
        SendEvent "{BackSpace}"
        Sleep 300
        Loop 10 {
            SendEvent "{BackSpace}"
            Sleep 30
        }
        Sleep 600
        
        ; 输入
        SendEvent "{Text}" text
        Sleep 800
        SendEvent "{Enter}"
        Sleep 500
    } else {
        ; --- 后台模式：使用兼容性更好的 ControlSend ---
        if (coord[1] > 0 && coord[2] > 0) {
            AddLog("后台聚焦: " coord[1] ", " coord[2])
            SafeClick(coord, hwnd, mode)
            Sleep 1200
        }
        
        AddLog("后台尝试输入: " text)
        ; 清空
        ControlSend "^a", , "ahk_id " hwnd
        Sleep 300
        ControlSend "{BackSpace}", , "ahk_id " hwnd
        Sleep 300
        Loop 10 {
            ControlSend "{BackSpace}", , "ahk_id " hwnd
            Sleep 30
        }
        Sleep 600
        
        ; 输入 (使用 Text 模式)
        ControlSend "{Text}" text, , "ahk_id " hwnd
        Sleep 800
        ControlSend "{Enter}", , "ahk_id " hwnd
        Sleep 500
    }
}

AddLog(msg)
{
    timestamp := FormatTime(, "HH:mm:ss")
    currentLog := "[" timestamp "] " msg "\`r\`n" LogEdit.Value
    
    ; 只保留最新的 30 行日志
    linePos := 0
    Loop 30 {
        linePos := InStr(currentLog, "\`n",, linePos + 1)
        if (linePos == 0)
            break
    }
    
    if (linePos > 0)
        currentLog := SubStr(currentLog, 1, linePos)
        
    try {
        LogEdit.Value := currentLog
    }
}

; ==============================================================================
; 辅助工具：按 F8 获取当前鼠标坐标 (客户区模式 - 推荐用于模拟器)
; ==============================================================================
F8::
{
    CoordMode "Mouse", "Client"
    MouseGetPos &x, &y
    posStr := "[" x ", " y "]"
    A_Clipboard := posStr
    ToolTip "已复制客户区坐标: " posStr "\`n(最适合模拟器)"
    SetTimer () => ToolTip(), -2000
}

; ==============================================================================
; 辅助工具：按 F7 锁定当前活动窗口为操作目标
; ==============================================================================
F7::
{
    global TargetHwnd := WinExist("A")
    title := WinGetTitle("ahk_id " TargetHwnd)
    AddLog("已手动锁定目标窗口: " title " (ID: " TargetHwnd ")")
    ToolTip "已锁定窗口: " title
    SetTimer () => ToolTip(), -2000
}
`;

  const handleDownload = (recsToDownload: Recommendation[] = recommendations) => {
    if (recsToDownload.length === 0) return;
    
    // CSV Header
    const headers = ['预测期号', '推荐号码', '倍投策略', '本轮盈亏', '状态', '实际冠军', '创建时间'];
    
    // CSV Rows
    const rows = recsToDownload.map(rec => [
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

  const handleDownloadAhkScript = () => {
    const blob = new Blob([autoAhkScriptContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'AutoBetScript.ahk';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

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
    // Auto-download and archive when reaching 400 records
    if (recommendations.length >= 400) {
      // Trigger download with current records
      handleDownload(recommendations);
      
      // Keep the latest 20 records to maintain UI context and any pending bets
      // Use setTimeout to ensure the state update happens after the download is initiated
      setTimeout(() => {
        setRecommendations(prev => prev.slice(0, 20));
      }, 500);
      return; // The state update will trigger this effect again
    }

    // Limit recommendations to the latest 500 to prevent memory leaks (fallback)
    if (recommendations.length > 500) {
      setRecommendations(prev => prev.slice(0, 500));
      return;
    }
    
    localStorage.setItem('lottery_recommendations', JSON.stringify(recommendations));
    
    // Always ensure the backend has the latest pending recommendation
    if (recommendations.length > 0) {
      const latestRec = recommendations[0];
      if (latestRec.status === 'pending') {
        fetch('/api/update-recommendation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            period: latestRec.period, 
            numbers: latestRec.recommendedNumbers, 
            step: latestRec.bettingStep || 1 
          })
        }).catch(err => console.error("Failed to sync recommendation API:", err));
      }
    } else {
      // Clear the backend recommendation if there are no recommendations
      fetch('/api/clear-recommendation', { method: 'POST' })
        .catch(err => console.error("Failed to clear recommendation API:", err));
    }
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
    setDataLoading(true);
    setError(null);
    setLastAttempt(new Date());
    try {
      // First, check if the server is even reachable
      try {
      // Local-only mode: skip ping
      const pingRes = null;
        if (!pingRes) {
          console.warn("Server unreachable via /api/ping");
        }
      } catch (e) {
        console.error("Ping failed", e);
      }

      // Fetch data from the backend
      const response = await fetch('/api/fetch-draws', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl })
      });
      
      if (!response.ok) {
        throw new Error('读取失败');
      }
      
      const data = await response.json();
      console.log("API response data:", data);
      if (data.draws && data.draws.length > 0) {
        // Limit draws to the latest 500 to prevent memory leaks
        const limitedDraws = data.draws.slice(0, 500);
        setDraws(limitedDraws);
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
        setError("读取失败");
      }
    } catch (err: any) {
      console.error(err);
      setError("读取失败");
    } finally {
      setDataLoading(false);
    }
  }, [url, draws.length]);

  // Initialize with real data
  useEffect(() => {
    handleRefresh();
  }, []);

  // Auto-refresh data
  useEffect(() => {
    if (settings.autoRefreshInterval <= 0) return;

    const intervalTime = settings.autoRefreshInterval * 1000;
    const refreshInterval = setInterval(() => {
      handleRefresh();
    }, intervalTime);

    return () => clearInterval(refreshInterval);
  }, [handleRefresh, settings.autoRefreshInterval]);

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
          const cost = baseBet * rec.recommendedNumbers.length;
          const prize = isWon ? (baseBet * 9.9) : 0;
          rec.profit = prize - cost;

          changed = true;
        }
      });

      // Check if we need to generate a NEW recommendation for nextPeriodStr
      const exists = newRecs.some(r => r.period === nextPeriodStr);
      if (draws.length >= 5 && !exists && nextPeriodStr !== lastClearedPeriod) {
        // Perform Analysis
        // Logic (Reduced Offset for 5-period support):
        // 2nd (draws[1]) vs 4th (draws[3])
        // 3rd (draws[2]) vs 5th (draws[4])
        // Latest (draws[0]) vs 3rd (draws[2])

        let recommendedNumbers: number[] = [];
        let patternType = '';

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

        const p2 = getPosition(draws[1], draws[3]);
        const p3 = getPosition(draws[2], draws[4]);
        const p1 = getPosition(draws[0], draws[2]);

        if (p2 === 'left' && p3 === 'left' && p1 === 'right') {
          patternType = 'Left-Right';
        } else if (p2 === 'right' && p3 === 'right' && p1 === 'left') {
          patternType = 'Right-Left';
        }

        const lastRec = newRecs.find(r => r.status !== 'pending');
        const isContinuing = lastRec && lastRec.status === 'lost' && lastRec.bettingStep < settings.bettingRounds;

        let shouldGenerate = false;
        if (patternType) {
          shouldGenerate = true;
        }

        if (shouldGenerate) {
          if (settings.predictionLogic === 'logic1') {
            const champion = Array.isArray(draws[0].result) 
              ? draws[0].result[0] 
              : parseInt(String(draws[0].result).split(/[,\s]+/)[0]);
            
            const targetDraw2 = draws[2];
            const targetNums2 = Array.isArray(targetDraw2.result)
              ? targetDraw2.result
              : String(targetDraw2.result).split(/[,\s]+/).map(n => parseInt(n.trim()));
            
            const index = targetNums2.indexOf(champion);

            const targetDraw1 = draws[1];
            const targetNums1 = Array.isArray(targetDraw1.result)
              ? targetDraw1.result
              : String(targetDraw1.result).split(/[,\s]+/).map(n => parseInt(n.trim()));

            if (index === 0) {
              recommendedNumbers = [targetNums1[0], targetNums1[2], targetNums1[3], targetNums1[4]];
            } else if (index === 9) {
              recommendedNumbers = [targetNums1[5], targetNums1[6], targetNums1[7], targetNums1[9]];
            } else if (index >= 1 && index <= 4) {
              recommendedNumbers = [targetNums1[1], targetNums1[2], targetNums1[3], targetNums1[4]];
            } else if (index >= 5 && index <= 8) {
              recommendedNumbers = [targetNums1[5], targetNums1[6], targetNums1[7], targetNums1[8]];
            }
          } else if (settings.predictionLogic === 'logic2') {
            const champion = Array.isArray(draws[0].result) 
              ? draws[0].result[0] 
              : parseInt(String(draws[0].result).split(/[,\s]+/)[0]);
            
            const targetDraw2 = draws[2];
            const targetNums2 = Array.isArray(targetDraw2.result)
              ? targetDraw2.result
              : String(targetDraw2.result).split(/[,\s]+/).map(n => parseInt(n.trim()));
            
            const index = targetNums2.indexOf(champion);

            const targetDraw1 = draws[1];
            const targetNums1 = Array.isArray(targetDraw1.result)
              ? targetDraw1.result
              : String(targetDraw1.result).split(/[,\s]+/).map(n => parseInt(n.trim()));

            if (index === 0) { // Situation A: 1st position
              recommendedNumbers = [targetNums1[5], targetNums1[6], targetNums1[7], targetNums1[9]];
            } else if (index === 9) { // Situation B: 10th position
              recommendedNumbers = [targetNums1[0], targetNums1[2], targetNums1[3], targetNums1[4]];
            } else if (index >= 1 && index <= 4) { // Situation C: Left half (not 1st)
              recommendedNumbers = [targetNums1[5], targetNums1[6], targetNums1[7], targetNums1[8]];
            } else if (index >= 5 && index <= 8) { // Situation D: Right half (not 10th)
              recommendedNumbers = [targetNums1[1], targetNums1[2], targetNums1[3], targetNums1[4]];
            }
          } else if (settings.predictionLogic === 'logic3') {
            if (newRecs.length === 0) {
              const champion = Array.isArray(draws[0].result) 
                ? draws[0].result[0] 
                : parseInt(String(draws[0].result).split(/[,\s]+/)[0]);
              
              const targetDraw2 = draws[2];
              const targetNums2 = Array.isArray(targetDraw2.result)
                ? targetDraw2.result
                : String(targetDraw2.result).split(/[,\s]+/).map(n => parseInt(n.trim()));
              
              const index = targetNums2.indexOf(champion);

              const targetDraw1 = draws[1];
              const targetNums1 = Array.isArray(targetDraw1.result)
                ? targetDraw1.result
                : String(targetDraw1.result).split(/[,\s]+/).map(n => parseInt(n.trim()));

              if (index === 0) {
                recommendedNumbers = [targetNums1[0], targetNums1[2], targetNums1[3], targetNums1[4]];
              } else if (index === 9) {
                recommendedNumbers = [targetNums1[5], targetNums1[6], targetNums1[7], targetNums1[9]];
              } else if (index >= 1 && index <= 4) {
                recommendedNumbers = [targetNums1[1], targetNums1[2], targetNums1[3], targetNums1[4]];
              } else if (index >= 5 && index <= 8) {
                recommendedNumbers = [targetNums1[5], targetNums1[6], targetNums1[7], targetNums1[8]];
              }
            } else {
              const champion = lastRec?.actualChampion ?? (Array.isArray(draws[0].result) 
                ? draws[0].result[0] 
                : parseInt(String(draws[0].result).split(/[,\s]+/)[0]));
              
              const calcNum = (num: number) => {
                let res = num % 10;
                if (res <= 0) res += 10;
                return res;
              };

              const nums = [
                calcNum(champion),
                calcNum(champion + 4),
                calcNum(champion + 6),
                calcNum(champion + 8)
              ];
              recommendedNumbers = Array.from(new Set(nums)).sort((a, b) => a - b);
            }
          }
        }

        if (recommendedNumbers.length > 0) {
          // Calculate betting step
          let bettingStep = 1;
          if (lastRec) {
            if (lastRec.status === 'lost') {
              if (lastRec.bettingStep < settings.bettingRounds) {
                bettingStep = lastRec.bettingStep + 1;
              } else {
                bettingStep = 1; // Reset after max losses
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
          
          // Voice notification
          if (enableVoice && 'speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(`第${nextPeriodStr.slice(-3)}期推荐已生成，倍投策略第${bettingStep}轮`);
            utterance.lang = 'zh-CN';
            window.speechSynthesis.speak(utterance);
          }
        }
      }

      return changed ? newRecs : prev;
    });
  }, [draws, settings.bettingRounds, settings.predictionLogic, enableVoice, lastClearedPeriod]);

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

  if (view === 'login' || view === 'register') {
    return (
      <div className="min-h-screen bg-[#141414] flex items-center justify-center p-4 font-sans">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-[#E4E3E0] border border-[#141414] p-8 shadow-2xl"
        >
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-[#141414] rounded-full flex items-center justify-center mb-4">
              <Lock className="text-[#E4E3E0] w-8 h-8" />
            </div>
            <h1 className="text-2xl font-serif font-bold italic text-[#141414] mb-2">开奖大师 - {view === 'login' ? '账号登录' : '用户注册'}</h1>
            <p className="text-gray-600 text-sm text-center font-mono">{view === 'login' ? '请输入您的账号信息' : '请填写注册信息'}</p>
          </div>

          <form onSubmit={view === 'login' ? handleLogin : handleRegister} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest mb-2">用户名</label>
                <div className="relative">
                  <Bot className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="text"
                    value={view === 'login' ? loginUsername : regUsername}
                    onChange={(e) => view === 'login' ? setLoginUsername(e.target.value) : setRegUsername(e.target.value)}
                    className="w-full bg-white border border-[#141414] py-3 pl-10 pr-4 text-[#141414] font-mono focus:outline-none focus:ring-1 focus:ring-[#141414] transition-all"
                    placeholder="请输入用户名..."
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest mb-2">密码</label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="password"
                    value={view === 'login' ? loginPassword : regPassword}
                    onChange={(e) => view === 'login' ? setLoginPassword(e.target.value) : setRegPassword(e.target.value)}
                    className="w-full bg-white border border-[#141414] py-3 pl-10 pr-4 text-[#141414] font-mono focus:outline-none focus:ring-1 focus:ring-[#141414] transition-all"
                    placeholder="请输入密码..."
                    required
                  />
                </div>
              </div>
              {view === 'register' && (
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest mb-2">确认密码</label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="password"
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      className="w-full bg-white border border-[#141414] py-3 pl-10 pr-4 text-[#141414] font-mono focus:outline-none focus:ring-1 focus:ring-[#141414] transition-all"
                      placeholder="请再次输入密码..."
                      required
                    />
                  </div>
                </div>
              )}
            </div>

            {loginError && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-red-50 border border-red-200 p-3 flex items-center gap-3"
              >
                <AlertCircle className="text-red-500 w-4 h-4 shrink-0" />
                <span className="text-red-600 text-xs font-mono">{loginError}</span>
              </motion.div>
            )}

            {regSuccess && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-emerald-50 border border-emerald-200 p-3 flex items-center gap-3"
              >
                <CheckCircle2 className="text-emerald-500 w-4 h-4 shrink-0" />
                <span className="text-emerald-600 text-xs font-mono">注册成功！正在跳转登录...</span>
              </motion.div>
            )}

            <button 
              type="submit"
              disabled={loginLoading}
              className="w-full bg-[#141414] hover:bg-emerald-600 disabled:opacity-50 text-[#E4E3E0] font-bold py-3 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-sm"
            >
              {loginLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {view === 'login' ? '立即登录' : '立即注册'}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between text-[10px] font-mono uppercase tracking-widest">
            <button 
              onClick={() => {
                setView(view === 'login' ? 'register' : 'login');
                setLoginError(null);
              }}
              className="text-gray-500 hover:text-[#141414] transition-colors"
            >
              {view === 'login' ? '没有账号？去注册' : '已有账号？去登录'}
            </button>
            {view === 'login' && (
              <button 
                onClick={() => {
                  setLoginUsername('admin');
                  setLoginPassword('');
                  setLoginError('请输入管理员密码');
                }}
                className="text-gray-400 hover:text-[#141414] transition-colors flex items-center gap-1"
              >
                <ShieldAlert size={12} />
                后台管理
              </button>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  if (view === 'admin') {
    const users = getLocalUsers();
    const filteredUsers = users.filter(u => u.username.toLowerCase().includes(adminSearch.toLowerCase()));
    
    const stats = {
      total: users.length,
      active: users.filter(u => u.expiry > Date.now() && !u.isFrozen).length,
      expired: users.filter(u => u.expiry <= Date.now() && !u.isAdmin).length,
      frozen: users.filter(u => u.isFrozen).length
    };

    return (
      <div className="min-h-screen bg-[#141414] text-[#141414] font-sans p-6">
        <div className="max-w-7xl mx-auto bg-[#E4E3E0] border border-[#141414] shadow-2xl min-h-[90vh] flex flex-col">
          <div className="p-8 border-b border-[#141414] flex justify-between items-center bg-white">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#141414] rounded-full flex items-center justify-center">
                <ShieldAlert className="text-[#E4E3E0] w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-serif font-bold italic">管理后台</h1>
                <p className="text-gray-500 text-[10px] font-mono uppercase tracking-widest">用户授权与系统管理</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text"
                  placeholder="搜索用户名..."
                  value={adminSearch}
                  onChange={(e) => setAdminSearch(e.target.value)}
                  className="bg-gray-100 border border-gray-200 py-2 pl-10 pr-4 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#141414] transition-all w-64"
                />
              </div>
              <button 
                onClick={handleLogout}
                className="px-6 py-2 bg-[#141414] text-white font-mono text-xs uppercase tracking-widest hover:bg-red-600 transition-colors"
              >
                退出管理
              </button>
            </div>
          </div>

          <div className="p-8 grid grid-cols-1 md:grid-cols-4 gap-6 bg-white/50 border-b border-[#141414]">
            <div className="bg-white p-4 border border-[#141414] shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-4 h-4 text-gray-400" />
                <span className="text-[10px] font-mono uppercase text-gray-400">总用户</span>
              </div>
              <div className="text-2xl font-serif font-bold">{stats.total}</div>
            </div>
            <div className="bg-white p-4 border border-[#141414] shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <Activity className="w-4 h-4 text-emerald-500" />
                <span className="text-[10px] font-mono uppercase text-gray-400">活跃用户</span>
              </div>
              <div className="text-2xl font-serif font-bold text-emerald-600">{stats.active}</div>
            </div>
            <div className="bg-white p-4 border border-[#141414] shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-4 h-4 text-orange-500" />
                <span className="text-[10px] font-mono uppercase text-gray-400">已到期</span>
              </div>
              <div className="text-2xl font-serif font-bold text-orange-600">{stats.expired}</div>
            </div>
            <div className="bg-white p-4 border border-[#141414] shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <Snowflake className="w-4 h-4 text-blue-500" />
                <span className="text-[10px] font-mono uppercase text-gray-400">已冻结</span>
              </div>
              <div className="text-2xl font-serif font-bold text-blue-600">{stats.frozen}</div>
            </div>
          </div>

          <div className="flex-1 p-8 overflow-y-auto">
            <div className="bg-white border border-[#141414] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-100 text-gray-500 text-[10px] uppercase tracking-widest font-mono border-b border-[#141414]">
                      <th className="px-6 py-4 font-bold">用户信息</th>
                      <th className="px-6 py-4 font-bold">注册日期</th>
                      <th className="px-6 py-4 font-bold">到期时间</th>
                      <th className="px-6 py-4 font-bold">状态</th>
                      <th className="px-6 py-4 font-bold text-right">管理操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#141414]/10">
                    {filteredUsers.map((user, idx) => (
                      <tr key={idx} className={`hover:bg-gray-50 transition-colors group font-mono text-xs ${user.isFrozen ? 'opacity-60 grayscale' : ''}`}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${user.isAdmin ? 'bg-amber-500' : 'bg-[#141414]'}`}>
                              {user.username.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold flex items-center gap-2">
                                {user.username}
                                {user.isAdmin && <span className="text-[8px] bg-amber-100 text-amber-700 px-1 rounded border border-amber-200">ADMIN</span>}
                              </div>
                              <div className="text-[9px] text-gray-400">ID: {idx + 1}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-gray-500">{format(new Date(user.registrationDate || Date.now()), 'yyyy-MM-dd')}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3 h-3 opacity-30" />
                            <span className={user.expiry < Date.now() && !user.isAdmin ? 'text-red-600 font-bold' : 'text-gray-600'}>
                              {format(new Date(user.expiry), 'yyyy-MM-dd HH:mm')}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {user.isFrozen ? (
                              <span className="flex items-center gap-1 text-[9px] text-blue-600 font-bold uppercase bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                <Snowflake size={10} /> 已冻结
                              </span>
                            ) : user.expiry < Date.now() && !user.isAdmin ? (
                              <span className="flex items-center gap-1 text-[9px] text-red-600 font-bold uppercase bg-red-50 px-2 py-0.5 rounded border border-red-200">
                                <XCircle size={10} /> 已过期
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-[9px] text-emerald-600 font-bold uppercase bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                <CheckCircle2 size={10} /> 正常
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {!user.isAdmin && (
                            <div className="flex items-center justify-end gap-1">
                              <button 
                                onClick={() => setExpiryModalUser(user)}
                                className="p-2 hover:bg-emerald-50 text-emerald-600 rounded transition-colors"
                                title="调整时间"
                              >
                                {Number(user.expiry) > Date.now() ? <Clock size={16} /> : <UserPlus size={16} />}
                              </button>
                              <button 
                                onClick={() => {
                                  const allUsers = getLocalUsers();
                                  const uIdx = allUsers.findIndex(u => u.username === user.username);
                                  if (uIdx !== -1) {
                                    allUsers[uIdx].isFrozen = !allUsers[uIdx].isFrozen;
                                    saveLocalUsers(allUsers);
                                    window.location.reload();
                                  }
                                }}
                                className={`p-2 rounded transition-colors ${user.isFrozen ? 'hover:bg-orange-50 text-orange-600' : 'hover:bg-blue-50 text-blue-600'}`}
                                title={user.isFrozen ? "解冻" : "冻结"}
                              >
                                {user.isFrozen ? <Flame size={16} /> : <Snowflake size={16} />}
                              </button>
                              <button 
                                onClick={() => {
                                  const newPass = prompt(`重置用户 ${user.username} 的密码:`, '123456');
                                  if (newPass) {
                                    const allUsers = getLocalUsers();
                                    const uIdx = allUsers.findIndex(u => u.username === user.username);
                                    if (uIdx !== -1) {
                                      allUsers[uIdx].password = newPass;
                                      saveLocalUsers(allUsers);
                                      alert('密码重置成功');
                                    }
                                  }
                                }}
                                className="p-2 hover:bg-gray-100 text-gray-600 rounded transition-colors"
                                title="重置密码"
                              >
                                <RotateCcw size={16} />
                              </button>
                              <button 
                                onClick={() => {
                                  if (confirm(`确定要彻底删除用户 ${user.username} 吗？此操作不可撤销。`)) {
                                    const allUsers = getLocalUsers().filter(u => u.username !== user.username);
                                    saveLocalUsers(allUsers);
                                    window.location.reload();
                                  }
                                }}
                                className="p-2 hover:bg-red-50 text-red-600 rounded transition-colors"
                                title="删除用户"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-10 text-center text-gray-400 font-mono italic">未找到匹配的用户</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <AnimatePresence>
            {expiryModalUser && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-[#E4E3E0] border border-[#141414] shadow-2xl w-full max-w-md overflow-hidden"
                >
                  <div className="p-6 border-b border-[#141414] bg-white flex justify-between items-center">
                    <div>
                      <h2 className="text-xl font-serif font-bold italic">调整到期时间</h2>
                      <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">用户: {expiryModalUser.username}</p>
                    </div>
                    <button onClick={() => setExpiryModalUser(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="p-8 space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono uppercase text-gray-500 tracking-widest">当前到期时间</label>
                      <div className="p-4 bg-white border border-[#141414] font-mono text-sm flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {format(new Date(expiryModalUser.expiry), 'yyyy-MM-dd HH:mm:ss')}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-[10px] font-mono uppercase text-gray-500 tracking-widest">快捷调整</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button 
                          onClick={() => {
                            const allUsers = getLocalUsers();
                            const uIdx = allUsers.findIndex(u => u.username === expiryModalUser.username);
                            if (uIdx !== -1) {
                              allUsers[uIdx].expiry += 1 * 24 * 60 * 60 * 1000;
                              saveLocalUsers(allUsers);
                              setExpiryModalUser(allUsers[uIdx]);
                            }
                          }}
                          className="flex items-center justify-center gap-2 py-3 bg-white border border-[#141414] hover:bg-emerald-50 text-emerald-700 font-mono text-xs transition-colors"
                        >
                          <Plus size={14} /> 增加 1 天
                        </button>
                        <button 
                          onClick={() => {
                            const allUsers = getLocalUsers();
                            const uIdx = allUsers.findIndex(u => u.username === expiryModalUser.username);
                            if (uIdx !== -1) {
                              allUsers[uIdx].expiry += 7 * 24 * 60 * 60 * 1000;
                              saveLocalUsers(allUsers);
                              setExpiryModalUser(allUsers[uIdx]);
                            }
                          }}
                          className="flex items-center justify-center gap-2 py-3 bg-white border border-[#141414] hover:bg-emerald-50 text-emerald-700 font-mono text-xs transition-colors"
                        >
                          <Plus size={14} /> 增加 7 天
                        </button>
                        <button 
                          onClick={() => {
                            const allUsers = getLocalUsers();
                            const uIdx = allUsers.findIndex(u => u.username === expiryModalUser.username);
                            if (uIdx !== -1) {
                              allUsers[uIdx].expiry += 30 * 24 * 60 * 60 * 1000;
                              saveLocalUsers(allUsers);
                              setExpiryModalUser(allUsers[uIdx]);
                            }
                          }}
                          className="flex items-center justify-center gap-2 py-3 bg-white border border-[#141414] hover:bg-emerald-50 text-emerald-700 font-mono text-xs transition-colors"
                        >
                          <Plus size={14} /> 增加 30 天
                        </button>
                        <button 
                          onClick={() => {
                            const allUsers = getLocalUsers();
                            const uIdx = allUsers.findIndex(u => u.username === expiryModalUser.username);
                            if (uIdx !== -1) {
                              allUsers[uIdx].expiry += 365 * 24 * 60 * 60 * 1000;
                              saveLocalUsers(allUsers);
                              setExpiryModalUser(allUsers[uIdx]);
                            }
                          }}
                          className="flex items-center justify-center gap-2 py-3 bg-white border border-[#141414] hover:bg-emerald-50 text-emerald-700 font-mono text-xs transition-colors"
                        >
                          <Plus size={14} /> 增加 1 年
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <button 
                          onClick={() => {
                            const allUsers = getLocalUsers();
                            const uIdx = allUsers.findIndex(u => u.username === expiryModalUser.username);
                            if (uIdx !== -1) {
                              allUsers[uIdx].expiry -= 1 * 24 * 60 * 60 * 1000;
                              saveLocalUsers(allUsers);
                              setExpiryModalUser(allUsers[uIdx]);
                            }
                          }}
                          className="flex items-center justify-center gap-2 py-3 bg-white border border-[#141414] hover:bg-red-50 text-red-700 font-mono text-xs transition-colors"
                        >
                          <Minus size={14} /> 扣除 1 天
                        </button>
                        <button 
                          onClick={() => {
                            const allUsers = getLocalUsers();
                            const uIdx = allUsers.findIndex(u => u.username === expiryModalUser.username);
                            if (uIdx !== -1) {
                              allUsers[uIdx].expiry = Date.now();
                              saveLocalUsers(allUsers);
                              setExpiryModalUser(allUsers[uIdx]);
                            }
                          }}
                          className="flex items-center justify-center gap-2 py-3 bg-white border border-[#141414] hover:bg-red-50 text-red-700 font-mono text-xs transition-colors"
                        >
                          <Clock size={14} /> 立即到期
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-mono uppercase text-gray-500 tracking-widest">自定义天数</label>
                      <div className="flex gap-2">
                        <input 
                          type="number"
                          id="customDays"
                          placeholder="输入天数..."
                          className="flex-1 p-3 bg-white border border-[#141414] font-mono text-xs focus:outline-none focus:ring-1 focus:ring-[#141414]"
                        />
                        <button 
                          onClick={() => {
                            const input = document.getElementById('customDays') as HTMLInputElement;
                            const days = Number(input.value);
                            if (days && !isNaN(days)) {
                              const allUsers = getLocalUsers();
                              const uIdx = allUsers.findIndex(u => u.username === expiryModalUser.username);
                              if (uIdx !== -1) {
                                allUsers[uIdx].expiry += days * 24 * 60 * 60 * 1000;
                                saveLocalUsers(allUsers);
                                setExpiryModalUser(allUsers[uIdx]);
                                input.value = '';
                              }
                            }
                          }}
                          className="px-6 bg-[#141414] text-white font-mono text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-colors"
                        >
                          应用
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-gray-50 border-t border-[#141414] flex justify-end">
                    <button 
                      onClick={() => {
                        setExpiryModalUser(null);
                        window.location.reload();
                      }}
                      className="px-8 py-3 bg-[#141414] text-white font-mono text-xs uppercase tracking-widest hover:bg-gray-800 transition-colors"
                    >
                      完成并关闭
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Expiry Alert */}
      {currentUser && !currentUser.isAdmin && currentUser.expiry < Date.now() && (
        <div className="bg-red-600 text-white p-2 text-center text-[10px] font-mono uppercase tracking-widest flex items-center justify-center gap-2">
          <ShieldAlert size={12} />
          软件已过期，请重新激活以获取最新推荐
          <button onClick={handleLogout} className="underline ml-2">退出登录</button>
        </div>
      )}
      {/* Header */}
      <header className="border-b border-[#141414] p-6 flex justify-between items-center bg-[#E4E3E0] sticky top-0 z-10">
        <div>
          <h1 className="text-4xl font-serif font-black uppercase tracking-tighter leading-none">
            开奖大师 <span className="text-sm font-sans font-normal normal-case tracking-normal opacity-50 ml-2">v1.0</span>
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-xs font-mono opacity-60 uppercase">实时积分开奖分析与策略</p>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono bg-[#141414]/5 px-2 py-0.5 rounded border border-[#141414]/10">
                用户: {currentUser?.username}
              </span>
              {!currentUser?.isAdmin && (
                <span className="text-[10px] font-mono bg-[#141414]/5 px-2 py-0.5 rounded border border-[#141414]/10">
                  有效期至: {format(new Date(currentUser?.expiry || 0), 'yyyy-MM-dd')}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={handleLogout}
            className="p-2 hover:bg-[#141414]/5 rounded transition-colors text-gray-500 hover:text-[#141414]"
            title="退出登录"
          >
            <XCircle size={20} />
          </button>
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

      <main className="flex-1 overflow-hidden">
        {/* Left Column: History */}
        <section className="overflow-y-auto bg-white/50">
          <div className="p-4 border-b border-[#141414] flex justify-between items-center bg-[#E4E3E0]">
            <div className="flex items-center gap-2">
              <History size={16} className="opacity-50" />
              <span className="font-serif italic text-sm uppercase font-bold">历史开奖记录</span>
            </div>
            <button 
              onClick={() => handleRefresh()}
              disabled={dataLoading}
              className="flex items-center gap-2 text-xs font-mono uppercase hover:underline disabled:opacity-50"
            >
              <RefreshCw size={12} className={dataLoading ? 'animate-spin' : ''} />
              {dataLoading ? '正在获取...' : '刷新数据'}
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
                              rec.bettingStep === 4 ? 'bg-orange-100 text-orange-700' :
                              rec.bettingStep === 5 ? 'bg-red-100 text-red-700' :
                              rec.bettingStep === 6 ? 'bg-pink-100 text-pink-700' :
                              rec.bettingStep === 7 ? 'bg-indigo-100 text-indigo-700' :
                              rec.bettingStep === 8 ? 'bg-teal-100 text-teal-700' :
                              rec.bettingStep === 9 ? 'bg-cyan-100 text-cyan-700' :
                              rec.bettingStep === 10 ? 'bg-amber-100 text-amber-700' :
                              rec.bettingStep === 11 ? 'bg-lime-100 text-lime-700' :
                              'bg-rose-900 text-white'
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
                
                <div className="bg-white/50 p-4 rounded border border-gray-200">
                  <h3 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                    <GitCompare size={14} className="text-emerald-600"/>
                    当前选号逻辑 (v21.0 6轮倍投版)
                  </h3>
                  <div className="text-[11px] font-mono text-gray-600 space-y-1.5 leading-relaxed">
                    <p>定位：取【最新1期】冠军号码，看它在【倒数第47期】排第几名(N)。</p>
                    <div className="pl-2 border-l-2 border-emerald-200 space-y-1">
                      <p>• 若 N=1 (第1名) → 取第 6, 7, 8, 10 名</p>
                      <p>• 若 N=10 (第10名) → 取第 1, 3, 4, 5 名</p>
                      <p>• 若 N=2~5 (左半区) → 取第 6, 7, 8, 9 名</p>
                      <p>• 若 N=6~9 (右半区) → 取第 2, 3, 4, 5 名</p>
                    </div>
                    <p className="text-gray-400 italic mt-1">* 数据源自倒数第46期</p>
                    <p className="text-blue-600 font-bold mt-2">策略：6轮倍投 (1-2-4-8-16-32)</p>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase mb-2 opacity-60 text-emerald-600 font-bold">软件续期 (增加7天)</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" size={14} />
                      <input 
                        type="password" 
                        id="extendPassword"
                        placeholder="输入授权密码..."
                        className="w-full bg-white border border-[#141414] pl-10 pr-4 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-[#141414]"
                        onKeyDown={async (e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const input = e.target as HTMLInputElement;
                            const pwd = input.value;
                            if (!pwd) return;
                            
                            if (pwd === 'JH8251050') {
                                if (currentUser) {
                                    const users = getLocalUsers();
                                    const idx = users.findIndex(u => u.username === currentUser.username);
                                    if (idx !== -1) {
                                        users[idx].expiry += 7 * 24 * 60 * 60 * 1000;
                                        saveLocalUsers(users);
                                        setCurrentUser({...users[idx]});
                                        sessionStorage.setItem('current_user', JSON.stringify(users[idx]));
                                        alert('续期成功！增加 7 天');
                                        input.value = '';
                                    }
                                }
                            } else {
                                alert('授权密码错误');
                            }
                          }
                        }}
                      />
                    </div>
                    <button 
                      onClick={async () => {
                        const input = document.getElementById('extendPassword') as HTMLInputElement;
                        const pwd = input?.value;
                        if (!pwd) {
                          alert('请输入密码');
                          return;
                        }
                        if (pwd === 'JH8251050') {
                            if (currentUser) {
                                const users = getLocalUsers();
                                const idx = users.findIndex(u => u.username === currentUser.username);
                                if (idx !== -1) {
                                    users[idx].expiry += 7 * 24 * 60 * 60 * 1000;
                                    saveLocalUsers(users);
                                    setCurrentUser({...users[idx]});
                                    sessionStorage.setItem('current_user', JSON.stringify(users[idx]));
                                    alert('续期成功！增加 7 天');
                                    input.value = '';
                                }
                            }
                        } else {
                            alert('授权密码错误');
                        }
                      }}
                      className="bg-[#141414] text-white px-4 py-2 text-[10px] font-mono uppercase font-bold hover:bg-emerald-600 transition-colors shrink-0"
                    >
                      确认续费
                    </button>
                  </div>
                  <p className="text-[9px] text-gray-400 mt-1 font-mono italic">* 输入密码并按回车或点击按钮，每次成功增加 7 天</p>
                </div>

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
                        value={settings.autoRefreshInterval}
                        onChange={(e) => setSettings(s => ({ ...s, autoRefreshInterval: Math.max(5, parseInt(e.target.value) || 15) }))}
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

                {/* Betting Strategy Settings */}
                <div className="pt-4 border-t border-[#141414]/10">
                  <h3 className="font-serif font-bold italic text-base mb-3">推荐逻辑设置</h3>
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-xs font-mono">预测逻辑:</span>
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                      {['logic1', 'logic2', 'logic3'].map((l) => (
                        <button
                          key={l}
                          onClick={() => setSettings(s => ({ ...s, predictionLogic: l as 'logic1' | 'logic2' | 'logic3' }))}
                          className={`px-4 py-1 text-xs font-mono rounded-md transition-all ${
                            settings.predictionLogic === l
                              ? 'bg-[#141414] text-[#E4E3E0] shadow-md'
                              : 'text-gray-500 hover:text-[#141414]'
                          }`}
                        >
                          {l === 'logic1' ? '逻辑 1' : l === 'logic2' ? '逻辑 2' : '逻辑 3'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <h3 className="font-serif font-bold italic text-base mb-3">倍投策略设置</h3>
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-mono">倍投轮数:</span>
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                      {[4, 6, 9, 12].map((rounds) => (
                        <button
                          key={rounds}
                          onClick={() => setSettings(s => ({ ...s, bettingRounds: rounds as 4 | 6 | 9 | 12 }))}
                          className={`px-4 py-1 text-xs font-mono rounded-md transition-all ${
                            settings.bettingRounds === rounds
                              ? 'bg-[#141414] text-[#E4E3E0] shadow-md'
                              : 'text-gray-500 hover:text-[#141414]'
                          }`}
                        >
                          {rounds} 轮
                        </button>
                      ))}
                    </div>
                    <span className="text-[10px] text-gray-400 font-mono">
                      (当前: {settings.bettingRounds === 4 ? '10-20-40-80' : settings.bettingRounds === 6 ? '10-20-40-80-160-320' : settings.bettingRounds === 9 ? '9轮倍投模式' : '12轮倍投模式'})
                    </span>
                  </div>
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
                      <button onClick={handleDownloadAhkScript} className="text-xs font-mono uppercase bg-[#141414] text-[#E4E3E0] px-3 py-1 hover:bg-emerald-600 transition-colors flex items-center gap-2 ml-2">
                        <Download size={12} />
                        下载 AHK 脚本
                      </button>
                    </div>
                    <div className="text-[11px] font-mono text-gray-500 pt-2 space-y-1">
                      <p>1. <strong>按键精灵用户：</strong>点击“下载新版脚本”，在按键精灵中新建脚本，按照代码顶部的注释说明设置界面，然后粘贴源码。</p>
                      <p>2. <strong>AutoHotkey用户：</strong>点击“下载 AHK 脚本”，安装 AutoHotkey v2 后直接运行即可。</p>
                      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="font-bold text-yellow-800 mb-1">⚠️ 信号稳定性提示：</p>
                        <p className="text-yellow-700">请确保在 AHK 脚本的“接口地址”中填入以下地址：</p>
                        <div className="flex items-center gap-2 mt-2">
                          <code className="bg-white px-2 py-1 rounded border border-yellow-300 text-yellow-900 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                            {window.location.origin}/api/recommendation
                          </code>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(`${window.location.origin}/api/recommendation`);
                              alert('接口地址已复制！请粘贴到 AHK 脚本中。');
                            }}
                            className="bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700 transition-colors"
                          >
                            复制
                          </button>
                        </div>
                        <p className="mt-2 text-yellow-700">注意：请务必开启上面的“启用按键精灵自动下注”开关，否则接口将不会更新数据。</p>
                      </div>
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
