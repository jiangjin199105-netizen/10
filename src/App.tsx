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

UserVar BetStep1=1 "【策略】第1轮倍数"
UserVar BetStep2=2 "【策略】第2轮倍数"
UserVar BetStep3=4 "【策略】第3轮倍数"
UserVar BetStep4=8 "【策略】第4轮倍数"
UserVar BetStep5=16 "【策略】第5轮倍数"
UserVar BetStep6=32 "【策略】第6轮倍数"

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
            ' 2. 检查轮次是否有效 (1-6轮)
            If loopPeriod <> "" And loopPeriod <> LastBetPeriod And loopStep >= 1 And loopStep <= 6 Then
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
    If CInt(stepNum) = 1 Then amt = BetStep1
    If CInt(stepNum) = 2 Then amt = BetStep2
    If CInt(stepNum) = 3 Then amt = BetStep3
    If CInt(stepNum) = 4 Then amt = BetStep4
    If CInt(stepNum) = 5 Then amt = BetStep5
    If CInt(stepNum) = 6 Then amt = BetStep6
    If CInt(stepNum) < 1 Or CInt(stepNum) > 6 Then amt = BetStep1
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
    
    ' 3. 点击小键盘“清零”
    UpdateMonitor "执行下注", "正在清零倍数...", "点击清零"
    Call SafeClick(KeyClearCoord, handle)
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
global ServerURL := "请在此处填入您的网页地址/api/recommendation"
global ClickMode := 1 ; 1=前台(Foreground), 2=后台(Background)

; 坐标配置 (完全同步自您的按键精灵脚本)
global Coords := Map()
Coords["Num1"] := [829, 481]
Coords["Num2"] := [925, 485]
Coords["Num3"] := [1024, 483]
Coords["Num4"] := [1123, 475]
Coords["Num5"] := [1198, 479]
Coords["Num6"] := [828, 573]
Coords["Num7"] := [921, 574]
Coords["Num8"] := [1037, 580]
Coords["Num9"] := [1101, 575]
Coords["Num10"] := [1209, 594]

Coords["AmountInput"] := [1049, 836]
Coords["SubmitBet"] := [1174, 999]

Coords["KeyClear"] := [1203, 730]
Coords["KeyConfirm"] := [1215, 824]
Coords["Key0"] := [944, 842]
Coords["Key1"] := [785, 626]
Coords["Key2"] := [942, 630]
Coords["Key3"] := [1084, 630]
Coords["Key4"] := [799, 700]
Coords["Key5"] := [951, 695]
Coords["Key6"] := [1086, 695]
Coords["Key7"] := [781, 769]
Coords["Key8"] := [932, 773]
Coords["Key9"] := [1073, 767]

; 倍投策略 (6轮)
global BetSteps := [10, 20, 40, 80, 160, 320]

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

MyGui.Add("GroupBox", "x10 y80 w430 h60", "控制")
MyGui.Add("Button", "x20 y100 w100 vBtnBind", "1. 绑定窗口").OnEvent("Click", BindWindow)
MyGui.Add("Button", "x130 y100 w100 vBtnTest", "测试点击").OnEvent("Click", TestClick)
MyGui.Add("Text", "x240 y105 w180 vLblStatus cBlue", "状态: 未绑定")

MyGui.Add("Button", "x20 y150 w100 vBtnStart", "2. 启动脚本").OnEvent("Click", StartScript)
MyGui.Add("Button", "x130 y150 w100 vBtnStop", "3. 停止脚本").OnEvent("Click", StopScript)
MyGui.Add("Button", "x240 y150 w100 vBtnConfig", "坐标配置").OnEvent("Click", OpenConfig)
MyGui["BtnStop"].Enabled := false

MyGui.Add("Text", "x10 y190 w380", "运行日志:")
global LogEdit := MyGui.Add("Edit", "x10 y210 w430 h300 ReadOnly vLogOutput")

MyGui.OnEvent("Close", (*) => ExitApp())
MyGui.Show("w450 h530")

; ==============================================================================
; 坐标配置窗口 (Coordinate Configuration GUI)
; ==============================================================================
OpenConfig(*)
{
    ConfigGui := Gui("+Owner" MyGui.Hwnd, "坐标配置 - 请确保已绑定窗口")
    ConfigGui.SetFont("s9", "Microsoft YaHei")
    
    ConfigGui.Add("Text", "x10 y10 w400 cGray", "提示: 点击'抓取'后，将鼠标移至目标位置按 F8 即可自动填入。")
    
    ; --- 存档管理区域 ---
    ConfigGui.Add("GroupBox", "x320 y40 w120 h160", "存档管理")
    ProfileDDL := ConfigGui.Add("DropDownList", "x330 y65 w100 Choose1", ["存档 1", "存档 2", "存档 3", "存档 4", "存档 5"])
    ConfigGui.Add("Button", "x330 y100 w100", "保存到存档").OnEvent("Click", (*) => DoSaveProfile(ProfileDDL.Value))
    ConfigGui.Add("Button", "x330 y135 w100", "从存档加载").OnEvent("Click", (*) => DoLoadProfile(ProfileDDL.Value))
    ConfigGui.Add("Text", "x330 y175 w100 cGray", "存档保存在\`nProfiles.ini")
    ; --------------------

    ; 定义显示名称映射
    Names := Map()
    Names["Num1"] := "号码 01", Names["Num2"] := "号码 02", Names["Num3"] := "号码 03", Names["Num4"] := "号码 04", Names["Num5"] := "号码 05"
    Names["Num6"] := "号码 06", Names["Num7"] := "号码 07", Names["Num8"] := "号码 08", Names["Num9"] := "号码 09", Names["Num10"] := "号码 10"
    Names["AmountInput"] := "倍数输入框", Names["SubmitBet"] := "立即投注按钮"
    Names["KeyClear"] := "键盘-清零", Names["KeyConfirm"] := "键盘-确认"
    Names["Key0"] := "键盘-0", Names["Key1"] := "键盘-1", Names["Key2"] := "键盘-2", Names["Key3"] := "键盘-3", Names["Key4"] := "键盘-4"
    Names["Key5"] := "键盘-5", Names["Key6"] := "键盘-6", Names["Key7"] := "键盘-7", Names["Key8"] := "键盘-8", Names["Key9"] := "键盘-9"

    yPos := 40
    ConfigGui.SetFont("bold")
    ConfigGui.Add("Text", "x10 y" yPos " w100", "按钮名称")
    ConfigGui.Add("Text", "x120 y" yPos " w120", "当前坐标 (X, Y)")
    ConfigGui.SetFont("norm")
    yPos += 25

    ; 遍历坐标 Map 创建编辑框
    Edits := Map()
    for key, val in Coords {
        displayName := Names.Has(key) ? Names[key] : key
        ConfigGui.Add("Text", "x10 y" yPos " w100", displayName ":")
        Edits[key] := ConfigGui.Add("Edit", "x120 y" yPos-3 " w120", val[1] ", " val[2])
        
        ; 闭包处理抓取按钮
        currentKey := key
        ConfigGui.Add("Button", "x250 y" (yPos-5) " w60", "抓取").OnEvent("Click", ((k, e, *) => CaptureSpecific(k, e)).Bind(currentKey, Edits[key]))
        
        yPos += 30
    }

    ConfigGui.Add("Button", "x120 y" (yPos+10) " w100 Default", "保存配置").OnEvent("Click", SaveConfig)
    ConfigGui.Show("w460")

    DoSaveProfile(idx) {
        iniFile := A_ScriptDir "\Profiles.ini"
        section := "Profile" idx
        for key, editCtrl in Edits {
            IniWrite(editCtrl.Value, iniFile, section, key)
        }
        ToolTip "已保存到存档 " idx
        SetTimer () => ToolTip(), -2000
    }

    DoLoadProfile(idx) {
        iniFile := A_ScriptDir "\Profiles.ini"
        section := "Profile" idx
        try {
            ; 检查存档是否存在
            IniRead(iniFile, section, "Num1")
        } catch {
            MsgBox "该存档为空或不存在！", "提示"
            return
        }
        
        for key, editCtrl in Edits {
            try {
                val := IniRead(iniFile, section, key)
                editCtrl.Value := val
            }
        }
        ToolTip "已加载存档 " idx
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
                Coords[key] := [cleanParts[1], cleanParts[2]]
            }
        }
        AddLog("坐标配置已更新。")
        ConfigGui.Destroy()
    }
}

; ==============================================================================
; 核心逻辑 (Core Logic)
; ==============================================================================

; 启动时尝试加载存档 1
try {
    iniFile := A_ScriptDir "\Profiles.ini"
    if FileExist(iniFile) {
        for key, val in Coords {
            str := IniRead(iniFile, "Profile1", key, "")
            if (str != "") {
                parts := StrSplit(str, [",", " ", ";"])
                if (parts.Length >= 2)
                    Coords[key] := [Number(Trim(parts[1])), Number(Trim(parts[2]))]
            }
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

StartScript(*)
{
    global IsRunning, TargetHwnd
    if (!TargetHwnd) {
        MsgBox("请先绑定游戏窗口！", "错误", "Icon!")
        return
    }
    
    IsRunning := true
    MyGui["BtnStart"].Enabled := false
    MyGui["BtnStop"].Enabled := true
    MyGui["BtnBind"].Enabled := false
    
    AddLog("脚本已启动，开始监听网页端指令...")
    SetTimer CheckAPI, 15000 ; 每15秒检查一次
    CheckAPI() ; 立即运行一次
}

StopScript(*)
{
    global IsRunning
    IsRunning := false
    MyGui["BtnStart"].Enabled := true
    MyGui["BtnStop"].Enabled := false
    MyGui["BtnBind"].Enabled := true
    
    SetTimer CheckAPI, 0 ; 关闭定时器
    AddLog("脚本已停止。")
}

CheckAPI()
{
    global ServerURL, LastBetPeriod, BetSteps, TargetHwnd, IsRunning
    
    if (!IsRunning)
        return

    savedURL := MyGui["ServerURL"].Value
    
    try {
        whr := ComObject("WinHttp.WinHttpRequest.5.1")
        whr.SetTimeouts(2000, 2000, 2000, 5000) ; Resolve, Connect, Send, Receive timeouts
        whr.Open("GET", savedURL "?t=" A_TickCount, true) ; Async=true
        whr.Send()
        
        ; Wait for response with timeout (5 seconds)
        if (whr.WaitForResponse(5) == 0) { ; 0 = Timeout
            AddLog("连接超时 (5s) - 正在重试...")
            return
        }
        
        if (whr.Status != 200) {
            AddLog("网络错误: 状态码 " whr.Status)
            return
        }
        
        Ret := whr.ResponseText
        
        ; 使用最简单的字符串查找来解析 JSON
        loopPeriod := ""
        loopStep := 0
        loopNumbersStr := ""
        
        ; 解析 period
        pos1 := InStr(Ret, '"period":"')
        if (pos1 > 0) {
            pos1 += 10
            pos2 := InStr(Ret, '"',, pos1)
            if (pos2 > 0)
                loopPeriod := SubStr(Ret, pos1, pos2 - pos1)
        }
        
        ; 解析 step
        pos1 := InStr(Ret, '"step":')
        if (pos1 > 0) {
            pos1 += 7
            ; 找到下一个逗号或右大括号
            pos2 := InStr(Ret, ",",, pos1)
            pos3 := InStr(Ret, "}",, pos1)
            
            endPos := 0
            if (pos2 > 0 && pos3 > 0)
                endPos := Min(pos2, pos3)
            else if (pos2 > 0)
                endPos := pos2
            else if (pos3 > 0)
                endPos := pos3
                
            if (endPos > 0) {
                stepStr := Trim(SubStr(Ret, pos1, endPos - pos1), " \`t\`r\`n\`"")
                if IsNumber(stepStr)
                    loopStep := Integer(stepStr)
            }
        }
        
        ; 解析 numbers
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
        
        if (loopPeriod != "" && loopPeriod != LastBetPeriod && loopStep >= 1 && loopStep <= 6) {
            AddLog(">>> 获取新指令: " loopPeriod " 期, 第 " loopStep " 轮")
            
            PlaceBet(TargetHwnd, loopNumbersStr, loopStep)
            
            LastBetPeriod := loopPeriod
            AddLog("<<< 期号 " loopPeriod " 下注完成，等待下期")
        } else {
            ; 无论是否有新号，都记录心跳日志，确保用户知道程序在运行
            curStatus := (loopPeriod != "") ? "当前期号: " loopPeriod : "等待数据..."
            
            ; 调试信息：如果期号变了但没下注，说明 Step 解析失败或范围不对
            if (loopPeriod != "" && loopPeriod != LastBetPeriod) {
                AddLog("警告: 检测到新期号但未下注! 解析Step: " loopStep)
                AddLog("调试数据: " Ret)
            }
            
            AddLog("运行正常: 监听中... (" curStatus ")")
        }
        
    } catch as err {
        AddLog("请求失败: " err.Message)
    }
}

PlaceBet(hwnd, numbersStr, stepNum)
{
    global BetSteps, Coords
    
    betAmount := BetSteps[stepNum]
    mode := MyGui["ClickMode"].Value ; 1=Foreground, 2=Background
    
    if (mode == "前台点击") {
        AddLog("激活窗口(前台)...")
        try {
            WinActivate "ahk_id " hwnd
            WinWaitActive "ahk_id " hwnd,, 2
        }
        Sleep 800
    } else {
        AddLog("准备后台点击...")
        Sleep 300
    }
    
    ; 1. 选中推荐号码
    AddLog("选中号码: " numbersStr)
    nums := StrSplit(numbersStr, " ")
    for n in nums {
        n := Trim(n)
        if IsNumber(n) {
            if (Coords.Has("Num" n)) {
                SafeClick(Coords["Num" n], hwnd, mode)
                Sleep 150
            }
        }
    }
    
    ; 2. 点击“倍数”输入框
    SafeClick(Coords["AmountInput"], hwnd, mode)
    Sleep 600 
    
    ; 3. 点击小键盘“清零”
    SafeClick(Coords["KeyClear"], hwnd, mode)
    Sleep 300
    
    ; 4. 输入倍数
    AddLog("输入倍数: " betAmount)
    amountStr := String(betAmount)
    Loop Parse, amountStr {
        digit := A_LoopField
        if (Coords.Has("Key" digit)) {
            SafeClick(Coords["Key" digit], hwnd, mode)
            Sleep 200
        }
    }
    
    ; 5. 点击小键盘“确认”
    SafeClick(Coords["KeyConfirm"], hwnd, mode)
    Sleep 500
    
    ; 6. 点击“立即投注”
    AddLog("点击立即投注")
    SafeClick(Coords["SubmitBet"], hwnd, mode)
    Sleep 500
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
        Sleep 100
    } else {
        try {
            ; 后台点击尝试 (后台通常也基于客户区)
            ControlClick "x" x " y" y, "ahk_id " hwnd,,,, "NA"
            Sleep 200
        }
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
            // 6, 7, 8, 10名 -> indices 5, 6, 7, 9 from 45th
            recommendedNumbers = [targetNums45[5], targetNums45[6], targetNums45[7], targetNums45[9]];
          } else if (index === 9) { // 10th position in 46th
            // 1, 3, 4, 5名 -> indices 0, 2, 3, 4 from 45th
            recommendedNumbers = [targetNums45[0], targetNums45[2], targetNums45[3], targetNums45[4]];
          } else if (index >= 1 && index <= 4) { // Left half (not 1st) in 46th
            // 6, 7, 8, 9名 -> indices 5, 6, 7, 8 from 45th
            recommendedNumbers = [targetNums45[5], targetNums45[6], targetNums45[7], targetNums45[8]];
          } else if (index >= 5 && index <= 8) { // Right half (not 10th) in 46th
            // 2, 3, 4, 5名 -> indices 1, 2, 3, 4 from 45th
            recommendedNumbers = [targetNums45[1], targetNums45[2], targetNums45[3], targetNums45[4]];
          }

          if (recommendedNumbers.length > 0) {
            // Calculate betting step
            let bettingStep = 1;
            const lastRec = newRecs.find(r => r.status !== 'pending'); // Find the most recent completed recommendation
            
            if (lastRec) {
              if (lastRec.status === 'lost') {
                if (lastRec.bettingStep < 6) {
                  bettingStep = lastRec.bettingStep + 1;
                } else {
                  bettingStep = 1; // Reset after 6 losses
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
                              rec.bettingStep === 4 ? 'bg-orange-100 text-orange-700' :
                              rec.bettingStep === 5 ? 'bg-red-100 text-red-700' :
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
