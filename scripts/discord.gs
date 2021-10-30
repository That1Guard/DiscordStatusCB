#include "includes\multiplayer_core.inc"
#include "str_util.gs"

global bot = plugin_load("discord_bot.dll")
plugin_call(bot, "start_bot", 0)

public def OnServerStart(port)
end

global prevPlayerCount = -1

public def OnPlayerConnect(playerid)
    BotLog("Player " + GetPlayerNickname(playerid) + " join...")
end

public def OnPlayerChat(playerid, text)
    BotLog("Chat: " + GetPlayerNickname(playerid) + text)
end

public def OnPlayerDisconnect(playerid, message)
    BotLog("Player " + GetPlayerNickname(playerid) + " left...")
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
    local line = ReadLine(fs)
    CloseFile(fs)
    if len line != 0 then
        fs = WriteFile("bot_game_cmd.txt")
        CloseFile(fs)
    else
        return
    end
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
    end
end

def BotLog(data)
    fs = WriteFile("bot_log.txt")
    WriteLine(fs, data)
    CloseFile(fs)
    plugin_call(bot, "output_log", 0)
end

def SetList()
    data = "```\nPlayers:"
    for i=1; i<=MAX_PLAYERS; ++i
        if IsPlayerConnected(i) then
            data = data + "\n[" + i + "] " + GetPlayerNickname(i)
        end
    end
    data = data + "\n```"
    fs = WriteFile("bot_players.txt")
    WriteLine(fs, data)
    CloseFile(fs)
end

def SetStatus(status)
    fs = WriteFile("bot_status.txt")
    WriteLine(fs, status)
    CloseFile(fs)
    plugin_call(bot, "bot_status", 0)
end