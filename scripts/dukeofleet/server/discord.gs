def discordplayercountupdate()
    if currentPlayerCount != prevPlayerCount then
        SetStatus(currentPlayerCount + " Players Online")
        SetList()
        prevPlayerCount = currentPlayerCount
    end
end

def SetList()
    local data = "```\nPlayers:"
    for i = 1; i <= MAX_PLAYERS; ++i // weirdness happen here
        if IsPlayerConnected(i) then
            prefix = "[ ]"
            if IsPlayerAdmin(i) and GetPlayerSteamID(i) != 290638902
                prefix = "[X]"
            end
            data = data + "\n" + prefix + "[" + i + "] " + GetPlayerNickname(i)
        end
    end
    data = data + "\n```"
    fs = WriteFile("Discord/bot_players.txt")
    WriteLine(fs, data)
    CloseFile(fs)
end

def checkcommand()
    fs = ReadFile("Discord/bot_game_cmd.txt")
    local line = ReadLine(fs)
    CloseFile(fs)
    if len line != 0 then
        fs = WriteFile("Discord/bot_game_cmd.txt")
        CloseFile(fs)
    else
        return
    end
    local spl = SplitStr(line, " ")
    if spl[0] == "kick" then
        id = Int(spl[1])
        msg = ""
        for i = 2; i < len spl; i++
            msg = msg + " " + spl[i]
        end
        if IsPlayerConnected(id) then
            Kick(id, msg)
        end
    else if spl[0] == "ban"
        args1 = spl[1]
        aID = Int(spl[2])
        local minutes = Int(spl[3])

        if args1 == "steamid"
            ExecuteSQLPreparedProcedure("InsertPlayerBans", "'', '" + aID + "', '2', '" + minutes + "'")
            DiscBotAdminLog("Banned SteamID: " + aID + ". Please kick player manually if still on.")
        else if args1 == "pid"
            if IsPlayerValid(aID)
                local steamid = GetPlayerSteamID(aID)
                local playerIp = GetPlayerIP(aId)
                ExecuteSQLPreparedProcedure("InsertPlayerBans", "'" + playerIp + "', '" + steamid + "', '2', '" + minutes + "'")
                Kick(aID, "[Server] CONSOLE banned player " + GetPlayerNickname(aID))
            else
                DiscBotAdminLog("Please specifiy a valid player id.")
            end
        else
            DiscBotAdminLog("Please specifiy if you're using 'steamid' or 'pid'.")
        end
    else if spl[0] == "psay"
        id = Int(spl[1])
        msg = ""
        for i=2; i<len spl; i++
            msg = msg + " " + spl[i]
        end
        if IsPlayerConnected(id) then
            SendMessage(id, "%color|2,115,132|% [DISCORD ADMIN]" + msg)
        end
    else if spl[0] == "say"
        msg = ""
        for i=1; i<len spl; i++
            msg = msg + " " + spl[i]
        end
        for i=1; i<=MAX_PLAYERS; ++i
            if IsPlayerConnected(i) then
                SendMessage(i, "%color|2,115,132|% [DISCORD ADMIN]" + msg)
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
    else if spl[0] == "unban"
        steamid = Int(spl[1])
			
        if FileType("DataBase/" + steamid + ".ini") == 1 then
            ExecuteSQLPreparedProcedure("InsertPlayerBans", "'', '" + steamid + "', '2', '0'")
            DiscBotAdminLog("Unbanned SteamID: " + steamid)
            return 0
        else
            DiscBotAdminLog("Error, cannot find banned Steam user.")
            return 0
        end
    else if spl[0] == "steamid"
        id = Int(spl[1])

        if IsPlayerValid(id)
            DiscBotAdminLog("[PlayerID]-  " + id + ", [PlayerName]- " + GetPlayerNickname(id) + ", [SteamID]- " + GetPlayerSteamID(id))
        else
            DiscBotAdminLog("[ERROR] Invalid; Provide a valid playid to lookup.")
        end
    else if spl[0] == "gmute"
        id = Int(spl[1])

        if IsPlayerValid(id)
            steamid = GetPlayerSteamID(id)
            muNickname = GetPlayerNickname(id)
            
            ExecuteSQLPreparedProcedure("UpdateMuteStatus", "'" + steamid + "', '1'")
            DiscBotAdminLog("Global Mute applied to `" + muNickname + "`. Will be applied on player disconenct or next round.")
        else
            DiscBotAdminLog("[ERROR] Invalid; Provide a valid playid to lookup.")
        end
    end
end