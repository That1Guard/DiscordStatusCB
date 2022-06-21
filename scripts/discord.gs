#include "includes\multiplayer_core.inc"
#include "str_util.gs"

public def OnServerStart(port)
    global bot = plugin_load("discord_bot.dll")

    // plugin_poke(bot, "bot_test complete" + Chr(0), P_TYPE_STRING)
    // plugin_call(bot, "bot_test", 0)

    plugin_call(bot, "start_bot", 0)
    DiscBotLog("Server is online...")
end

global prevPlayerCount = -1

public def OnPlayerConnect(playerid)
    DiscBotLog("Player " + GetPlayerNickname(playerid) + " joined...")
end

public def OnPlayerChat(playerid, text)
    DiscBotLog("Chat: " + GetPlayerNickname(playerid) + text)
end

public def OnPlayerDisconnect(playerid, message)
    DiscBotLog("Player " + GetPlayerNickname(playerid) + " left...")
end

public def OnPlayerRconAuthorized(playerid)
    SetList()
    DiscBotLog("Player " + GetPlayerNickname(playerid) + " given admin...")
end

public def OnPlayerRconIncorrect(playerid)
    SetList()
    DiscBotLog("Player " + GetPlayerNickname(playerid) + " not given admin (bad rcon password)...")
end

public def OnServerUpdate()
    j = 0
    for i=1; i<=MAX_PLAYERS; ++i
        if IsPlayerConnected(i) then
            j++
        end
    end
    if not j == prevPlayerCount then
        SetStatus("Players Online: " + j)
        SetList()
        prevPlayerCount = j
    end
    CheckCommand()
end

def CheckCommand()
    fs = ReadFile("bot_game_cmd.txt")
    if fs == 0 then
        return
    end
    local line = ReadLine(fs)
    CloseFile(fs)
    if len line != 0 then
        fs = WriteFile("bot_game_cmd.txt")
        CloseFile(fs)
    else
        return
    end
    DiscParseCommand(line)
end

def DiscParseCommand(line)
    local spl = SplitStr(line, " ")
    if spl[0] == "kick" then
        id = Int(spl[1])
        msg = ""
        for i=2; i<len spl; i++
            msg = msg + " " + spl[i]
        end
        if IsPlayerConnected(id) then
            Kick(id, msg)
        end
    else if spl[0] == "ban"
        id = Int(spl[1])
        msg = ""
        for i=2; i<len spl; i++
            msg = msg + " " + spl[i]
        end
        if IsPlayerConnected(id) then
            ip = GetPlayerIP(id)
            BanIP(ip)
        end
    else if spl[0] == "ptext"
        id = Int(spl[1])
        msg = ""
        for i=2; i<len spl; i++
            msg = msg + " " + spl[i]
        end
        if IsPlayerConnected(id) then
            SendMessage(id, msg)
        end
    else if spl[0] == "text"
        msg = ""
        for i=1; i<len spl; i++
            msg = msg + " " + spl[i]
        end
        for i=1; i<=MAX_PLAYERS; ++i
            if IsPlayerConnected(i) then
                SendMessage(i, msg)
            end
        end
    else if spl[0] == "admin"
        id = Int(spl[1])
        if IsPlayerConnected(id) then
            if IsPlayerAdmin(id) then
                RemoveAdmin(id)
                SetList()
            else
                GiveAdmin(id)
                SetList()
            end
        end
    end
end

def DiscBotLog(data)
    // fs = WriteFile("bot_log.txt")
    // WriteLine(fs, data)
    // CloseFile(fs)
    // return
    plugin_poke(bot, data + Chr(0), P_TYPE_STRING)
    plugin_call(bot, "output_log", 0)
end

def SetList()
    // return
    data = "```\nPlayers:"
    for i=1; i<=MAX_PLAYERS; ++i
        if IsPlayerConnected(i) then
            prefix = "[ ]"
            if IsPlayerAdmin(i) then
                prefix = "[X]"
            end
            data = data + "\n" + prefix + "[" + i + "] " + GetPlayerNickname(i)
        end
    end
    data = data + "\n```"
    fs = WriteFile("bot_players.txt")
    WriteLine(fs, data)
    CloseFile(fs)
end

def SetStatus(status)
    // return
    // fs = WriteFile("bot_status.txt")
    // WriteLine(fs, status)
    // CloseFile(fs)
    plugin_poke(bot, status + Chr(0), P_TYPE_STRING)
    plugin_call(bot, "bot_status", 0)
end