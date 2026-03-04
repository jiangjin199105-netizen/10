#Requires AutoHotkey v2.0
#SingleInstance Force

; 解决 DPI 缩放导致的坐标不准问题 (强制物理像素模式)
try DllCall("SetThreadDpiAwarenessContext", "ptr", -3, "ptr")

; 请求管理员权限 (雷电模拟器必须以管理员身份运行脚本才能点击)
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
    ConfigGui.Add("Text", "x330 y175 w100 cGray", "存档保存在`nProfiles.ini")
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
        if (yPos > 550) { ; 如果太长，另起一列
            ; 这里简单处理，实际可能需要滚动条或分页，但目前按钮不多
        }
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
        oldF8 := A_HotkeyModifierTimeout
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
        HotKey "F8", "Off"
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
                stepStr := Trim(SubStr(Ret, pos1, endPos - pos1), " `t`r`n`"")
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
    currentLog := "[" timestamp "] " msg "`r`n" LogEdit.Value
    
    ; 只保留最新的 30 行日志
    linePos := 0
    Loop 30 {
        linePos := InStr(currentLog, "`n",, linePos + 1)
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
    ToolTip "已复制客户区坐标: " posStr "`n(最适合模拟器)"
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
