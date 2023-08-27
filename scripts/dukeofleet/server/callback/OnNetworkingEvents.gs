// This callback function is called whenever a new player initiates a new connection to the server
public def OnIncomingConnection(nickname, ip, steamid, version, ispatron)
    
    // EXTERNAL DLL - Check the word filter if nickname contains any censored words
    if loadLibrary and censorNickName
        local nicknameCensorVar = detectCensor(nickname)
        if nicknameCensorVar == 1
            // If nickname contains censored words, return an error message
            return "This nick name is not allowed." + Chr(13) + Chr(10) + " Contains a possiblly censored word."
        end
    end

    local bannedStatus = ExecuteSQLPreparedFunction("CheckPlayerBanStatus", "'" + steamid + "', '" + ip + "', 'Status'")
    local banRemainingTime = ExecuteSQLPreparedFunction("CheckPlayerBanStatus", "'" + steamid + "', '" + ip + "', 'RemainingMinutes'")
    select bannedStatus
        case 0 // No ban, continue
        case 1 // SteamID Ban
            if banRemainingTime < 0
                return "You're permanently Steam ID banned." + Chr(13) + Chr(10) + "Visit " + serverName + " discord to appeal."
            else if banRemainingTime > 0
                return "You're Steam ID banned." + Chr(13) + Chr(10) + "(wait " + banRemainingTime + " min)"
            else
                return "You're Steam ID banned." + Chr(13) + Chr(10) + "(wait less than 1 min)"
            end
        case 2 // IP Ban
            if banRemainingTime < 0
                return "You're permanently IP banned." + Chr(13) + Chr(10) + "Visit " + serverName + " discord to appeal."
            else if banRemainingTime > 0
                return "You're IP banned." + Chr(13) + Chr(10) + "(wait " + banRemainingTime + " min)"
            else
                return "You're IP banned." + Chr(13) + Chr(10) + "(wait less than 1 min)"
            end
    end

    local newPlayerCount = prevPlayerCount + 1
    if newPlayerCount > 59
        return "Slots above 60 are " + Chr(13) + Chr(10) + "Reserved."
    end

	if instr(nickname, "[ADMIN]", 1) then
		return "Change nick name, cannot contain [ADMIN]"
	end

    if instr(nickname, "}", 1) or instr(nickname, "{", 1) or instr(nickname, "%", 1) then
		return "Change nick name, cannot contain invalid character."
	end

    ExecuteSQLPreparedProcedure("InsertPlayerData", "'" + ip  + "', '" + steamid + "', 'NameHolder', '1.2.9.3'")
end

public def OnPlayerConnect(playerid)
    local steamid = GetPlayerSteamID(playerid)

    // Clear Player Rank var
    PlayerRanks[playerid]               = 0
    
    // Clear Censor var
    PlayerCensorViolations[playerid]    = 0
    hasPlayerGlobalMute[playerid]       = 0

    // Clear Weapons Loadout var
    primaryWeaponLoadout[playerid]      = 0
    secondaryWeaponLoadout[playerid]    = 0
    explosiveWeaponLoadout[playerid]    = 0

    // Clear Misc var
    PlayerNut[playerid]                 = 0
    RemoveAdmin(playerid)

    DiscBotLog("[Server] Player " + GetPlayerNickname(playerid) + " [STEAMID32|" + steamid + "] has joined...")
    
    if not IsAFakePlayer(playerid)
        PlayerRanks[playerid]               = ExecuteSQLPreparedFunction("GetPlayerRank", "'" + steamid + "'")
        hasPlayerGlobalMute[playerid]       = ExecuteSQLPreparedFunction("GetMuteStatus", "'" + steamid + "'")
        GetUserTag(playerid, steamid)
        GetUserWeaponsLoadout(playerid, steamid)
    end
	
    if PlayerRanks[playerid] > 2 then
        GiveAdmin(playerid)
    end

    select steamid
            case 290638902
                PlayerRanks[playerid] = 4
                GiveAdmin(playerid)
            case 77253552
                ChangePlayerTag(playerid, "HOLY SHIT ITS FRIDAY NIGHT FUNKIN", 0, 255, 0)
            case 215311577
                ChangePlayerTag(playerid, "DEVELOPER", 200,0,0)
    end

    if roundStarted == 1 then
        PlayersDead = PlayersDead + 1
    end

    currentPlayerCount = currentPlayerCount + 1
end

public def OnPlayerDisconnect(playerid, message)
    local steamid = GetPlayerSteamID(playerid)

    DiscBotLog("[Server] Player " + GetPlayerNickname(playerid) + " [STEAMID32|" + steamid + "] has left...")

    // Clear Player Rank var
    PlayerRanks[playerid]               = 0
    
    // Clear Censor var
    PlayerCensorViolations[playerid]    = 0
    hasPlayerGlobalMute[playerid]       = 0

    // Clear Weapons Loadout var
    primaryWeaponLoadout[playerid]      = 0
    secondaryWeaponLoadout[playerid]    = 0
    explosiveWeaponLoadout[playerid]    = 0

    // Clear Misc var
    PlayerNut[playerid]                 = 0
    RemoveAdmin(playerid)
    
    if roundStarted == 1 then
        if GetPlayerType(playerid) == 0 then
            PlayersDead = PlayersDead - 1
        end
    end

    currentPlayerCount = currentPlayerCount - 1
end

public def OnReceiveRawPacket(id, bnk)
    RawPacket(id,bnk)
end

public def OnPlayerRequestFiles(playerid)
    SendFile(playerid, "assets/sus.ogg", serverName + "/audio/sus.ogg", 0)
    SendFile(playerid, "assets/join.ogg", serverName + "/audio/join.ogg", 0)
    SendFile(playerid, "assets/UI/BackgroundUI.jpg", serverName + "/ui/BackgroundUI.jpg", 0)
    SendFile(playerid, "assets/UI/Button.png", serverName + "/ui/Button.png", 0)
    SendFile(playerid, "assets/UI/ButtonActive.png", serverName + "/ui/ButtonActive.png", 0)
    SendFile(playerid, "assets/UI/ButtonSmall.png", serverName + "/ui/ButtonSmall.png", 0)
    SendFile(playerid, "assets/UI/ButtonSmallActive.png", serverName + "/ui/ButtonSmallActive.png", 0)
    SendFile(playerid, "assets/UI/Check.png", serverName + "/ui/Check.png", 0)
    SendFile(playerid, "assets/UI/CheckActive.png", serverName + "/ui/CheckActive.png", 0)
    SendFile(playerid, "assets/UI/tempCursor.png", serverName + "/ui/tempCursor.png", 0)
    SendFile(playerid, "assets/MTFAnnounc.ogg", serverName + "/audio/MTFAnnounc.ogg", 9)
    SendScript(playerid,"assets/main.gsc", serverName + "/script/client.gsc")
end

public def OnPlayerReceiveFile(playerid, filename, result)
    print("[DOWNLOADER] " + playerid + " recieved '" + filename + "'")
end

public def OnPlayerSpeaking(playerid, data, radio)
    local hasGMute = hasPlayerGlobalMute[playerid]
    if hasGMute == 1
        return 0
    end
end