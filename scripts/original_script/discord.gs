#include "includes\multiplayer_core.inc"
#include "str_util.gs"

public def OnServerStart(port)
    global bot = plugin_load("discord_bot.dll")

    plugin_call(bot, "start_bot", 0)
    DiscBotLog("Server is online...")
end

global PlayerBannedEnd = [MAX_PLAYERS, SE_INT]
global prevPlayerCount = -1

public def OnPlayerConnect(playerid)
    local steamid = GetPlayerSteamID(playerid)
    DiscBotLog("[Server] Player " + GetPlayerNickname(playerid) + " [STEAMID32|" + steamid + "] has joined...")
end

public def OnPlayerChat(playerid, text)
    DiscBotLog("[Chat] " + GetPlayerNickname(playerid) + " `" + text + "`")
end

public def OnPlayerDisconnect(playerid, message)
    local steamid = GetPlayerSteamID(playerid)
    DiscBotLog("[Server] Player " + GetPlayerNickname(playerid) + " [STEAMID32|" + steamid + "] has left...")
end

public def OnPlayerRconAuthorized(playerid)
    SetList()
    DiscBotLog("[RCON] Player " + GetPlayerNickname(playerid) + " given admin...")
end

public def OnPlayerRconIncorrect(playerid)
    SetList()
    DiscBotLog("[RCON] Player " + GetPlayerNickname(playerid) + " not given admin (bad rcon password)...")
end

public def OnPlayerConsole(playerid, text)
    DiscBotAdminLog("[Console Command] " + GetPlayerNickname(playerid) + text)
end

public def OnIncomingConnection(nickname, ip, steamid, version, ispatron)
    if FileType("DataBase/" + steamid + ".ini") == 1 then
        local banend = int(GetINIValue("DataBase/" + steamid + ".ini", steamid, "banned", "0"))

        if getunixtime() < banend
            return "You're banned." + Chr(13) + Chr(10) + "(wait "+int((banend-getunixtime())/60)+" min)"
        end
    end
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
    fs = ReadFile("Discord/bot_game_cmd.txt")
    if fs == 0 then
        return
    end
    local line = ReadLine(fs)
    CloseFile(fs)
    if len line != 0 then
        fs = WriteFile("Discord/bot_game_cmd.txt")
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
    else if spl[0] == "psay"
        id = Int(spl[1])
        msg = ""
        for i=2; i<len spl; i++
            msg = msg + " " + spl[i]
        end
        if IsPlayerConnected(id) then
            SendMessage(id, msg)
        end
    else if spl[0] == "say"
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
    else if spl[0] == "restart"
        DiscBotAdminLog("[Server] Force restart now fired...")
        RestartServer()
    else if spl[0] == "ban"
        args1 = spl[1]
        aID = Int(spl[2])
        local minutes = Int(spl[3])
        local epochFinal = int(minutes * 60)
        local unixtime = int(getunixtime())

        PlayerBannedEnd[aID] = unixtime + epochFinal

        if args1 == "steamid"
            DatabaseInput(aID, "banned", unixtime + epochFinal, 1)
            DiscBotAdminLog("Banned SteamID: " + aID + ". Please kick player manually if they are still on the server.")
        else if args1 == "pid"
            if PlayerBannedEnd[aID] > unixtime then
                local steamid = GetPlayerSteamID(aID)
                DatabaseInput(steamid, "banned", PlayerBannedEnd[aID], 1)
                Kick(aID, "[Server] CONSOLE banned player " + GetPlayerNickname(aID))
            end
        else
            DiscBotAdminLog("Please specifiy if you're using 'steamid' or 'pid'.")
        end
    else if spl[0] == "unban"
        steamid = Int(spl[1])
			
        if FileType("DataBase/" + steamid + ".ini") == 1 then
            PutINIValue("DataBase/" + steamid + ".ini", steamid, "banned", "0")
            UpdateINIFile("DataBase/" + steamid + ".ini")
            DiscBotAdminLog("Unbanned SteamID: " + steamid)
            return 0
        else
            DiscBotAdminLog("Error, cannot find banned Steam user.")
            return 0
        end
    else if spl[0] == "steamid"
        steamidlookup = Int(spl[1])

        if IsPlayerValid(steamidlookup)
            DiscBotAdminLog("[PlayerID]-  " + steamidlookup + ", [PlayerName]- " + GetPlayerNickname(steamidlookup) + ", [SteamID]- " + GetPlayerSteamID(steamidlookup))
        else
            DiscBotAdminLog("[ERROR] Invalid; Provide a valid playid to lookup.")
        end
    end
end

public def DiscBotLog(data)
    plugin_poke(bot, data + Chr(0), P_TYPE_STRING)
    plugin_call(bot, "output_log", 0)
end

public def DiscBotAdminLog(data)
    plugin_poke(bot, data + Chr(0), P_TYPE_STRING)
    plugin_call(bot, "output_admin_log", 0)
end

def SetList()
    data = "```\nPlayers:"
    for i=1; i<=MAX_PLAYERS; ++i
        if IsPlayerConnected(i) then
            prefix = "[ ]"
            if IsPlayerAdmin(i) then
                prefix = "[X]"
            end
            local steamid = GetPlayerSteamID(i)
            data = data + "\n" + prefix + "[" + i + "][" + steamid + "] " + GetPlayerNickname(i)
        end
    end
    data = data + "\n```"
    fs = WriteFile("Discord/bot_players.txt")
    WriteLine(fs, data)
    CloseFile(fs)
end

def SetStatus(status)
    plugin_poke(bot, status + Chr(0), P_TYPE_STRING)
    plugin_call(bot, "bot_status", 0)
end

def IsPlayerValid(pid)
	if MAX_PLAYERS > pid and pid > 0
		return IsPlayerConnected(pid)
	end
	return 0
end

def DatabaseInput(steamid, category, value, doUpdate)
    if FileType("DataBase/" + steamid + ".ini") == 0 then
        CloseFile(WriteFile("DataBase/" + steamid + ".ini"))
    end
    PutINIValue("DataBase/" + steamid + ".ini", steamid, category, value)
    if doUpdate == 1
        UpdateINIFile("DataBase/" + steamid + ".ini")
    end
end