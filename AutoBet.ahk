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

; 倍投策略 (6轮)
global BetSteps := [5, 10, 20, 40, 80, 160]

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
MyGui.Add("Button", "x350 y150 w80 vBtnPass", "修改密码").OnEvent("Click", OpenChangePass)
MyGui.Add("Button", "x350 y100 w80 vBtnExtend", "增加7天").OnEvent("Click", OpenExtendValidity)
MyGui["BtnStop"].Enabled := false

MyGui.Add("Text", "x10 y190 w380", "运行日志:")
global LogEdit := MyGui.Add("Edit", "x10 y210 w430 h240 ReadOnly vLogOutput")

MyGui.Add("GroupBox", "x10 y460 w430 h60", "倍投金额配置 (1-6轮)")
global EditSteps := []
Loop 6 {
    EditSteps.Push(MyGui.Add("Edit", "x" (20 + (A_Index-1)*70) " y" 485 " w60 vStep" A_Index, BetSteps[A_Index]))
}
MyGui.Add("Button", "x10 y525 w430 h30 vBtnSave", "保存金额配置").OnEvent("Click", SaveBetSteps)

MyGui.OnEvent("Close", (*) => ExitApp())

; --- 启动时显示登录界面 ---
ShowLogin()

; ==============================================================================
; 登录与授权逻辑 (Auth Logic)
; ==============================================================================
ShowLogin() {
    global LoginGui := Gui("+AlwaysOnTop", "软件登录验证")
    LoginGui.SetFont("s10", "Microsoft YaHei")
    LoginGui.Add("Text", "w250", "请输入登录密码以激活软件：")
    global PassEdit := LoginGui.Add("Edit", "w250 Password")
    BtnLogin := LoginGui.Add("Button", "w250 h40 Default", "登录并激活 (28天)")
    BtnLogin.OnEvent("Click", ProcessLogin)
    LoginGui.OnEvent("Close", (*) => ExitApp())
    LoginGui.Show()
}

ProcessLogin(*) {
    pass := PassEdit.Value
    if (pass == "") {
        MsgBox "请输入密码！"
        return
    }
    
    try {
        whr := ComObject("WinHttp.WinHttpRequest.5.1")
        ; 从 ServerURL 推导基础地址
        baseUrl := RegExReplace(ServerURL, "/api/.*", "")
        whr.Open("POST", baseUrl "/api/auth/verify", false)
        whr.SetRequestHeader("Content-Type", "application/json")
        whr.Send('{"password": "' pass '"}')
        
        if (whr.Status == 200) {
            MsgBox "登录成功！已增加 28 天使用时间。", "成功", "Iconi"
            LoginGui.Destroy()
            MyGui.Show("w450 h570")
        } else {
            errMsg := "登录失败"
            try {
                res := whr.ResponseText
                if InStr(res, "error")
                    errMsg := RegExReplace(res, '.*"error":"([^"]+)".*', "$1")
            }
            MsgBox errMsg, "错误", "Iconx"
        }
    } catch as err {
        MsgBox "连接服务器失败: " err.Message, "网络错误", "Iconx"
    }
}

OpenChangePass(*) {
    CPGui := Gui("+Owner" MyGui.Hwnd, "修改登录密码")
    CPGui.SetFont("s9", "Microsoft YaHei")
    CPGui.Add("Text", "w200", "原密码:")
    oldP := CPGui.Add("Edit", "w200 Password")
    CPGui.Add("Text", "w200", "新密码:")
    newP := CPGui.Add("Edit", "w200 Password")
    
    CPGui.Add("Button", "w200 h35 Default", "确认修改").OnEvent("Click", (*) => DoChangePass(oldP.Value, newP.Value, CPGui))
    CPGui.Show()
}

DoChangePass(old, new, gui) {
    if (old == "" || new == "") {
        MsgBox "请填写完整信息！"
        return
    }
    try {
        whr := ComObject("WinHttp.WinHttpRequest.5.1")
        baseUrl := RegExReplace(ServerURL, "/api/.*", "")
        whr.Open("POST", baseUrl "/api/auth/change-password", false)
        whr.SetRequestHeader("Content-Type", "application/json")
        whr.Send('{"oldPassword": "' old '", "newPassword": "' new '"}')
        
        if (whr.Status == 200) {
            MsgBox "密码修改成功！", "成功"
            gui.Destroy()
        } else {
            MsgBox "修改失败：原密码错误或服务器异常。", "错误", "Iconx"
        }
    } catch as err {
        MsgBox "连接服务器失败: " err.Message
    }
}

OpenExtendValidity(*) {
    EVGui := Gui("+Owner" MyGui.Hwnd, "增加软件有效期")
    EVGui.SetFont("s9", "Microsoft YaHei")
    EVGui.Add("Text", "w200", "请输入授权密码以增加7天:")
    pass := EVGui.Add("Edit", "w200 Password")
    
    EVGui.Add("Button", "w200 h35 Default", "确认增加").OnEvent("Click", (*) => DoExtendValidity(pass.Value, EVGui))
    EVGui.Show()
}

DoExtendValidity(pass, gui) {
    if (pass == "") {
        MsgBox "请输入密码！"
        return
    }
    try {
        whr := ComObject("WinHttp.WinHttpRequest.5.1")
        baseUrl := RegExReplace(ServerURL, "/api/.*", "")
        whr.Open("POST", baseUrl "/api/auth/extend", false)
        whr.SetRequestHeader("Content-Type", "application/json")
        whr.Send('{"password": "' pass '"}')
        
        if (whr.Status == 200) {
            res := whr.ResponseText
            msg := "续期成功！"
            if InStr(res, "message")
                msg := RegExReplace(res, '.*"message":"([^"]+)".*', "$1")
            MsgBox msg, "成功", "Iconi"
            gui.Destroy()
        } else {
            MsgBox "续期失败：密码错误或服务器异常。", "错误", "Iconx"
        }
    } catch as err {
        MsgBox "连接服务器失败: " err.Message
    }
}

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
    ConfigGui.Add("GroupBox", "x620 y40 w120 h160", "存档管理")
    ProfileDDL := ConfigGui.Add("DropDownList", "x630 y65 w100 Choose1", ["存档 1", "存档 2", "存档 3", "存档 4", "存档 5"])
    ConfigGui.Add("Button", "x630 y100 w100", "保存到存档").OnEvent("Click", (*) => DoSaveProfile(ProfileDDL.Value))
    ConfigGui.Add("Button", "x630 y135 w100", "从存档加载").OnEvent("Click", (*) => DoLoadProfile(ProfileDDL.Value))
    ConfigGui.Add("Text", "x630 y175 w100 cGray", "存档保存在`nProfiles.ini")
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

    DoSaveProfile(idx) {
        iniFile := A_ScriptDir "\Profiles.ini"
        section := "Profile" idx
        for key, editCtrl in Edits {
            IniWrite(editCtrl.Value, iniFile, section, key)
            IniWrite(Modes[key].Value, iniFile, section, key "_mode")
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
                modeVal := IniRead(iniFile, section, key "_mode", "1")
                Modes[key].Value := Number(modeVal)
                
                ; 同步到全局 Coords 映射，实现“加载即生效”
                parts := StrSplit(val, [",", " ", ";"])
                cleanParts := []
                for p in parts {
                    if (IsNumber(Trim(p)))
                        cleanParts.Push(Number(Trim(p)))
                }
                if (cleanParts.Length == 2) {
                    Coords[key] := [cleanParts[1], cleanParts[2], Number(modeVal)]
                }

                ; 如果是金额输入框，同步到主界面
                if (key == "AmountInput") {
                    MyGui["InputMode"].Value := Number(modeVal)
                }
            }
        }
        ToolTip "已加载存档 " idx " 并立即生效"
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

; 启动时尝试加载存档 1
try {
    iniFile := A_ScriptDir "\Profiles.ini"
    if FileExist(iniFile) {
        for key, val in Coords {
            str := IniRead(iniFile, "Profile1", key, "")
            if (str != "") {
                parts := StrSplit(str, [",", " ", ";"])
                if (parts.Length >= 2) {
                    x := Number(Trim(parts[1]))
                    y := Number(Trim(parts[2]))
                    modeVal := IniRead(iniFile, "Profile1", key "_mode", "1")
                    Coords[key] := [x, y, Number(modeVal)]
                    
                    ; 如果是金额输入框，同步到主界面
                    if (key == "AmountInput") {
                        MyGui["InputMode"].Value := Number(modeVal)
                    }
                }
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
    Loop 6 {
        val := MyGui["Step" A_Index].Value
        if IsNumber(val)
            BetSteps[A_Index] := Number(val)
    }
    AddLog("倍投金额配置已保存: [" BetSteps[1] ", " BetSteps[2] ", " BetSteps[3] ", " BetSteps[4] ", " BetSteps[5] ", " BetSteps[6] "]")
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
    Loop 6 {
        val := MyGui["Step" A_Index].Value
        if IsNumber(val)
            BetSteps[A_Index] := Number(val)
    }
    AddLog("当前倍投序列: [" BetSteps[1] ", " BetSteps[2] ", " BetSteps[3] ", " BetSteps[4] ", " BetSteps[5] ", " BetSteps[6] "]")
    
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
            if (whr.Status == 402) {
                AddLog("软件已过期，请重新登录激活！")
                StopScript()
                MsgBox "软件已过期，请重新登录激活！", "过期提醒", "Icon!"
                Reload()
            }
            AddLog("网络错误: 状态码 " whr.Status)
            if (IsRunning)
                SetTimer CheckAPI, 10000 ; 错误后10秒重试
            return
        }
        
        Ret := whr.ResponseText
        loopPeriod := "", loopStep := 0, loopNumbersStr := ""
        
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
            pos2 := InStr(Ret, ",",, pos1), pos3 := InStr(Ret, "}",, pos1)
            endPos := (pos2 > 0 && pos3 > 0) ? Min(pos2, pos3) : (pos2 > 0 ? pos2 : pos3)
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
        
        ; 3. 点击小键盘“清零”
        if (Coords.Has("KeyClear")) {
            SafeClick(Coords["KeyClear"], hwnd, mode)
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

    if (mode == "前台点击") {
        ; 强制激活并置顶窗口
        WinActivate "ahk_id " hwnd
        WinWaitActive "ahk_id " hwnd,, 1
        
        ; 切换到客户区坐标系 (Client)
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
        ; --- 增强型后台点击 (针对模拟器优化) ---
        try {
            ; 使用 ControlClick 的坐标模式，NA 参数表示不激活窗口
            ControlClick("x" x " y" y, "ahk_id " hwnd, , "LEFT", 1, "NA")
        } catch {
            ; 如果 ControlClick 失败，回退到底层的同步消息注入
            lparam := (y << 16) | x
            SendMessage(0x0201, 1, lparam, , "ahk_id " hwnd) ; WM_LBUTTONDOWN
            Sleep 50
            SendMessage(0x0202, 0, lparam, , "ahk_id " hwnd) ; WM_LBUTTONUP
        }
        Sleep 1000
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
        ; --- 增强型后台输入 (同步消息注入) ---
        if (coord[1] > 0 && coord[2] > 0) {
            AddLog("后台聚焦: " coord[1] ", " coord[2])
            SafeClick(coord, hwnd, mode)
            Sleep 1200
        }
        
        AddLog("后台同步输入: " text)
        
        ; 1. 后台清空 (发送 WM_KEYDOWN 退格消息)
        Loop 15 {
            SendMessage(0x0100, 0x08, 0, , "ahk_id " hwnd) ; WM_KEYDOWN VK_BACK
            Sleep 30
        }
        Sleep 500
        
        ; 2. 后台输入 (发送 WM_CHAR 字符消息)
        Loop Parse, text {
            char := Ord(A_LoopField)
            SendMessage(0x0102, char, 0, , "ahk_id " hwnd) ; WM_CHAR
            Sleep 100
        }
        Sleep 800
        
        ; 3. 后台回车
        SendMessage(0x0100, 0x0D, 0, , "ahk_id " hwnd) ; VK_RETURN
        Sleep 500
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
