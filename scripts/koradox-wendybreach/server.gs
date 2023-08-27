#include "includes\multiplayer_core.inc"

#define public function = def
#define function def

////////////////////////////////////////
//              CONST                 //
//              Block                 //
//                                    //
////////////////////////////////////////

// Needed for bot.
global bot = -1

global currentPlayerCount       = 0
global prevPlayerCount          = -1
global remainingMTFEnemy        = -1
global cameraCheckTime          = 0
global cameraInCheck            = 0
global commandInUse             = 0
global roundStarted             = 0
global WaitingForSpawn          = 0
global PlayerAdmin			    = [MAX_PLAYERS, SE_INT]
global PlayerOwner              = [MAX_PLAYERS, SE_INT]
global PlayerBannedEnd		    = [MAX_PLAYERS, SE_INT]
global CurrentPlayerTypes       = [MAX_PLAYERS, SE_INT]
global foundShout               = [5, SE_INT]
global ended                    = 0
global PlayerCensorViolations   = [MAX_PLAYERS, SE_INT]
global hasPlayerGlobalMute      = [MAX_PLAYERS, SE_INT]
global doesD9341Poss            = 0
global hasAnnouncedPossToD9341  = 0
global thisD9341                = 0
global DoorID079                = 0

// Levers stuff
global lightsOn                 = 1
global gatesUnlocked            = 1
global checkpointLightUnlock    = 0

// Lightzone checkpoint array
// Array will be stored with 0 first, so if we have 10 keypads, then it'll be: 0..9
global lightzoneDoorID          = [16, SE_INT]
global lightzoneTotalDoors      = 0

// Spawnwave Stats
global remainingSpawnTime       = 0

// 'Remaining Alive' Counter.
global DeadPlayers              = 0
global SCPSAlive                = 0
global PersonnelAlive           = 0
global SecurityAlive            = 0
global CIAlive                  = 0
global ClassDAlive              = 0

// Counter DataBase
global remainingText            = [8, SE_INT]
global screen_height,screen_width


////////////////////////////////////////
//          Main Callback             //
//              Block                 //
//                                    //
////////////////////////////////////////

public def OnServerStart(port)
    ActivateFilesSending(true)

    CreateTimer("checkcommand", 1500, 1)
    CreateTimer("discordplayercountupdate", 10000, 1)
    CreateTimer("play096Sound", 60000, 1)
    CreateTimer("play106Sound", 10000, 1)
    SetMTFTickets(0)
    SetChaosTickets(0)
    CreateTimer("s2dheartbeat", 1000, 1)
    CreateTimer("paintro", 13000, 0)

    for i = 1; i < MAX_ROOMS; i++
        if IsValidRoom(i) == 1
            roomName = GetRoomName(i)
            select roomName
                case "roompj"
                    docID = CreateItem("Document SCP-372", "paper")
                    docEntityID = GetItemEntity(docID)
                    tempRE = GetRoomObjectEntity(i, 43)
                    if tempRE != 0 then
                        xpos = EntityX(tempRE)
                        ypos = EntityY(tempRE)
                        zpos = EntityZ(tempRE)
                        PositionEntity(docEntityID, xpos, ypos - 1.5, zpos, 0)
                        ResetEntity(docEntityID)
                    else
                        print("[Documenter] Failed to load Document SCP-372: EntityID-404-NotFound")
                    end
                case "room012"
                    tempDoorID = GetRoomDoor(i, 0)
                    SetDoorOpenState(tempDoorID, 1)
                case "room035"
                    tempDoorID = GetRoomDoor(i, 1)
                    SetDoorOpenState(tempDoorID, 1)
                case "173"
                    tempDoorID = GetRoomDoor(i, 1)
                    SetDoorOpenState(tempDoorID, 1)
                    tempDoorID = GetRoomDoor(i, 2)
                    SetDoorOpenState(tempDoorID, 1)
                    tempDoorID = GetRoomDoor(i, 6)
                    SetDoorOpenState(tempDoorID, 1)
                case "room079"
                    DoorID079 = GetRoomDoor(i, 0)
                case "exit1"
                    tempDoorID = GetRoomDoor(i, 5)
                    SetDoorOpenState(tempDoorID, 1)
                case "checkpoint1"
                    tempDoorID = GetRoomDoor(i, 0)
                    SetDoorKeycard(tempDoorID, 5)
                    lightzoneDoorID[lightzoneTotalDoors] = tempDoorID
                    lightzoneTotalDoors = lightzoneTotalDoors + 1
                    tempDoorID = GetRoomDoor(i, 1)
                    SetDoorKeycard(tempDoorID, 5)
                    lightzoneDoorID[lightzoneTotalDoors] = tempDoorID
                    lightzoneTotalDoors = lightzoneTotalDoors + 1
            end
        else
            break
        end
    end
end

def s2dheartbeat()
    plugin_call(bot, "s2d_heartbeat", 0)
end

public def OnGenerateWorld()
//    SetChristmasMode(true)
    bot = plugin_load("discord_bot.dll")
    plugin_call(bot, "start_bot", 0)
    if FileType("Discord/bot_game_cmd.txt") == 0 then
        CloseFile(WriteFile("Discord/bot_game_cmd.txt"))
    end
    if FileType("Discord/bot_status.txt") == 0 then
        CloseFile(WriteFile("Discord/bot_status.txt"))
    end
    if FileType("Discord/bot_players.txt") == 0 then
        CloseFile(WriteFile("Discord/bot_players.txt"))
    end
    if FileType("Discord/bot_log.txt") == 0 then
        CloseFile(WriteFile("Discord/bot_log.txt"))
    end
    if FileType("Discord/bot_admin_log.txt") == 0 then
        CloseFile(WriteFile("Discord/bot_admin_log.txt"))
    end
end


public def OnWarheadsExplosion()
    if ended == 0 then
        ServerMessage("[SERVER ALERT] Round over!")
        DiscBotLog("[SERVER ALERT] Round over!")
        return 1
    end
end

public def OnPlayerConnect(playerid)
    local steamid = GetPlayerSteamID(playerid)
    
    // Remaining Stats to be update on connection
    local remainingPopConnect = GetPlayerType(playerid)

    updateRemainingStats(remainingPopConnect, "kNULL")

    PlayerCensorViolations[playerid]    = 0
    hasPlayerGlobalMute[playerid]       = 0

    DiscBotLog("[Server] Player " + GetPlayerNickname(playerid) + " [STEAMID32|" + steamid + "] has joined...")
    PlayerAdmin[playerid]   = 0
    PlayerOwner[playerid]   = 0

    RemoveAdmin(playerid)
    if FileType("DataBase/" + steamid + ".ini") == 1 then
        PlayerAdmin[playerid]		        = int(GetINIValue("DataBase/" + steamid + ".ini", steamid, "admin", "0"))
        PlayerOwner[playerid]		        = int(GetINIValue("DataBase/" + steamid + ".ini", steamid, "owner", "0"))
        hasPlayerGlobalMute[playerid]       = int(GetINIValue("DataBase/" + steamid + ".ini", steamid, "globalMute", "0"))
        local hasPlayerTag                  = GetINIValue("DataBase/" + steamid + ".ini", steamid, "tagNameText", "none")
        local hasHideTag                    = GetINIValue("DataBase/" + steamid + ".ini", steamid, "tagNameText", "off")
        if hasPlayerTag != "none" and hasHideTag != "off"
            tagColourR = int(GetINIValue("DataBase/" + steamid + ".ini", steamid, "tagColourR", "0"))
            tagColourG = int(GetINIValue("DataBase/" + steamid + ".ini", steamid, "tagColourG", "0"))
            tagColourB = int(GetINIValue("DataBase/" + steamid + ".ini", steamid, "tagColourB", "0"))
            ChangePlayerTag(playerid, hasPlayerTag, tagColourR, tagColourG, tagColourB)
        end
    end
	
    if PlayerAdmin[playerid] == 1 or PlayerOwner[playerid] then
        GiveAdmin(playerid)
    end

    select steamid
            case 290638902
                PlayerAdmin[playerid] = 1
                GiveAdmin(playerid)
            case 215311577
                ChangePlayerTag(playerid, "DEVELOPER", 200,0,0)
    end
    currentPlayerCount = currentPlayerCount + 1

    updateRemainingGraphics()
end

public def OnPlayerDisconnect(pid, message)
    local steamid = GetPlayerSteamID(pid)
    local remainingPopDisconnect = GetPlayerType(pid)
    
    DiscBotLog("[Server] Player " + GetPlayerNickname(pid) + " [STEAMID32|" + steamid + "] has left...")
    
    updateRemainingStats("kNULL", remainingPopDisconnect)

	if FileType("DataBase/" + steamid + ".ini") == 1 then
        DatabaseInput(steamid, "nickname", GetPlayerNickname(pid), 1)
    end
    PlayerAdmin[pid] = 0
    PlayerOwner[pid] = 0
    RemoveAdmin(pid)

    PlayerCensorViolations[playerid] = 0
    hasPlayerGlobalMute[playerid] = 0

    currentPlayerCount = currentPlayerCount - 1
    updateRemainingGraphics()
end

def detectCensor(data)
    plugin_poke(bot, data + Chr(0), P_TYPE_STRING)
    result = plugin_call(bot, "isTextCensorable", P_TYPE_INT)
    return result
end

public def OnPlayerChat(playerid, text)
    local id = 0
    local unixtime = int(getunixtime())

    if IsPlayerValid(playerid)
        chatCensorVar = detectCensor(text)
        if chatCensorVar == 1
            PlayerCensorViolations[playerid] = PlayerCensorViolations[playerid] + 1
            SendMessage(playerid, "[CHAT] Please refrain from slurs and offensive language. Continued attempts will result in punishment. Strike: " + PlayerCensorViolations[playerid])
            if PlayerCensorViolations[playerid] >= 4
                local steamidCensor = GetPlayerSteamID(playerid)
                local epochCensorFinal = int(5 * 60)
                local tempBanCensorTime = unixtime + epochCensorFinal
                DatabaseInput(steamidCensor, "banned", tempBanCensorTime, 0)
                DatabaseInput(steamidCensor, "nickname", GetPlayerNickname(playerid), 1)
                Kick(playerid, "[GOV] Government Censor banned player " + GetPlayerNickname(playerid))
            end
            return 0
        end
        isSlash = Left(text, 3)
        if isSlash == ": /"
            if instr(text, "/time", 1)
                SendMessage(playerid, "The Current Epoch Time is: " + unixtime)
                return 0
            else if instr(text, "/help", 1)
                helpCat = split(text, 3, " ")
                MyHelp(playerid, helpCat)
                return 0
            else if instr(text, "/groom", 1)
                // TODO: Remove from production
                objid1 = split(text, 3, " ")
                results113 = GetRoomDoor(GetPlayerRoomID(playerid), objid1)
                print("RoomID: " + results113)
                return 0
            else if instr(text, "/keycard", 1)
                // TODO: Remove from production
                objid2 = split(text, 3, " ")
                objid3 = split(text, 4, " ")
                SetDoorKeycard(objid2, objid3)
                print("Door Locked Status: " + GetDoorKeycard(objid2))
                return 0
            else if instr(text, "/cc", 1) or instr(text, "/cameracheck", 1)
                if CurrentPlayerTypes[playerid] == 1 or CurrentPlayerTypes[playerid] == 2
                    if commandInUse == 0
                        if cameraCheckTime < unixtime
                            commandInUse = 1
                            cameraInCheck = 2
                            CameraCheck(playerid)
                            return 0
                        else
                            ccCooldownRemains = cameraCheckTime - unixtime
                            SetPlayerMessage(playerid, "[Control] We are currently undergoing an overwatch, try again later in " + ccCooldownRemains + " seconds.", 700)
                            return 0
                        end
                    else
                        SetPlayerMessage(playerid, "We're undergoing OP performance. Please wait until we're finished.", 1000)
                        return 0
                    end
                else
                    SetPlayerMessage(playerid, "You must be MTF/Guard to activate this command.", 1000)
                    return 0
                end
            else if instr(text, "/steamid", 1)
                id = int(split(text, 3, " "))

                if IsPlayerValid(id)
                    SendMessage(playerid, GetPlayerNickname(id) + " SteamID is: " + GetPlayerSteamID(id))
                    return 0
                else
                    SendMessage(playerid, "Your SteamID is: " + GetPlayerSteamID(playerid))
                    return 0
                end
            else if PlayerAdmin[playerid] == 1
                // by Ne4to (sample bantime, ini ban)
                if instr(text, "/ban", 1) 
                    id = int(split(text, 3, " "))
                    local minutes = int(split(text, 4, " "))
                    
                    if IsPlayerValid(id)
                        if PlayerAdmin[playerid] == 1 and PlayerOwner[playerid] != 1
                            SendMessage(playerid, "[Server] You cannot ban an already logged in admin.")
                            return 0
                        end
                        local epochFinal = int(minutes * 60)
                        PlayerBannedEnd[id] = unixtime + epochFinal
                        if PlayerBannedEnd[id] > unixtime then
                            local steamid = GetPlayerSteamID(id)
                            
                            DatabaseInput(steamid, "banned", PlayerBannedEnd[id], 0)
                            DatabaseInput(steamid, "nickname", GetPlayerNickname(id), 1)
                        end
                        Kick(id, "[Server] Admin " + GetPlayerNickname(playerid) + " banned the player " + GetPlayerNickname(id))
                        return 0
                    else
                        SendMessage(playerid, "[Server] Player not connected.")
                        return 0
                    end
                else if instr(text, "/unban", 1) 
                    unbansteamid = int(split(text, 3, " "))
                    if FileType("DataBase/" + unbansteamid + ".ini") == 1 then
                        DatabaseInput(unbansteamid, "banned", "0", 0)
                        DatabaseInput(unbansteamid, "permaBanned", "0", 1)
                        SendMessage(playerid, "Unbanned SteamID: " + unbansteamid)
                        return 0
                    else
                        SendMessage(playerid, "[Server] Player database not found.")
                        return 0
                    end
                else if instr(text, "/admintag", 1)
                    local toggletag = split(text, 3, " ")

                    if toggletag == "on"
                        local hasPlayerTag = GetINIValue("DataBase/" + steamid + ".ini", steamid, "tagNameText", "none")
                        if not hasPlayerTag != "none"
                            ChangePlayerTag(playerid, hasPlayerTag, 184, 137, 203)
                            DatabaseInput(GetPlayerSteamID(playerid), "tagshow", "1", 1)
                        end
                        return 0
                    else if toggletag == "off"
                        ChangePlayerTag(playerid, "", 255, 255, 255)
                        DatabaseInput(GetPlayerSteamID(playerid), "tagshow", "0", 1)
                        return 0
                    else
                        SendMessage(playerid, "HELP: AdminTagToggle toggles the admin tag above head. Arguements: 'On' or 'Off'.")
                        return 0
                    end
                else if instr(text, "/gmute", 1)
                    muteid = int(split(text, 3, " "))
                    toggleMute = split(text, 4, " ")
                    if IsPlayerValid(muteid) == 1
                        steamid = GetPlayerSteamID(muteid)
                        if toggleMute == "true"
                            DatabaseInput(steamid, "globalMute", 1, 1)
                            hasPlayerGlobalMute[muteid] = 1
                            SendMessage(playerid, "[SERVER] Globally muted " + GetPlayerNickname(muteid) + ". Status: " + hasPlayerGlobalMute[muteid])
                            return 0
                        else if toggleMute == "false"
                            DatabaseInput(steamid, "globalMute", 0, 1)
                            hasPlayerGlobalMute[muteid] = 0
                            SendMessage(playerid, "[SERVER] Globally unmuted " + GetPlayerNickname(muteid) + ". Status: " + hasPlayerGlobalMute[muteid])
                        else
                            SendMessage(playerid, "HELP: GlobalMute toggles mute for targeted player. Arguements: 'true' or 'false'.")
                            return 0
                        end
                    else
                        SendMessage(playerid, "ERROR: You need to provide a playerid.")
                    end
                    return 0
                end
                DiscBotAdminLog("[Chat] Admin " + GetPlayerNickname(playerid) + " `" + text + "`")
            end
        end
    end
    
    if PlayerOwner[playerid] == 1
        if instr(text, "/admin", 1)
            local toggleadminID = int(split(text, 3, " "))
            local adminSteamid = GetPlayerSteamID(toggleadminID)

            if PlayerAdmin[toggleadminID] == 0 and IsPlayerValid(toggleadminID)
                GiveAdmin(toggleadminID)
                DatabaseInput(adminSteamid, "tagNameText", "ADMIN", 0)
                DatabaseInput(adminSteamid, "tagColourR", 174, 0)
                DatabaseInput(adminSteamid, "tagColourG", 100, 0)
                DatabaseInput(adminSteamid, "tagColourB", 193, 0)
                DatabaseInput(adminSteamid, "admin", "1", 1)
                PlayerAdmin[toggleadminID] = 1
                ChangePlayerTag(pid, "ADMIN", 174, 100, 193)
            else if PlayerAdmin[toggleadminID] == 1 and IsPlayerValid(toggleadminID)
                RemoveAdmin(toggleadminID)
                DatabaseInput(adminSteamid, "tagNameText", "none", 0)
                DatabaseInput(adminSteamid, "admin", "0", 1)
                PlayerAdmin[toggleadminID] = 0
                ChangePlayerTag(playerid, "", 255, 255, 255)
            else
                SendMessage(playerid, "HELP: GiveAdmin toggles the admin tag above head. Arguements: PlayerID.")
            end
            return 
        else if instr(text, "/createfakeplayer", 1)
            local amount = int(split(text, 3, " "))
            for i=1; i<amount; i++
                local pid = CreateFakePlayer("FakePlayer" + i)
            end
            return 0
        end
    end
	
	if IsPlayerValid(playerid)
		local steamids = GetPlayerSteamID(playerid)
        DiscBotLog("[Chat] " + GetPlayerNickname(playerid) + " `" + text + "`")
	end
    return 1
end


public def OnPlayerGetNewRole(playerid, oldtype, newtype)
    if playerid <= 0 then
        return 1
    end
    updateRemainingStats(newtype, oldtype)
    CurrentPlayerTypes[playerid] = int(newtype)
    updateRemainingGraphics()
    sendPacketWithDataInt2(playerid, 1, 1, newtype)
end

public def OnPlayerRequestNewRole(playerid, playertype)
    CurrentPlayerTypes[playerid] = int(playertype)
end

public def OnPlayerSpeaking(playerid, data, radio)
    hasGMute = hasPlayerGlobalMute[playerid]
    if hasGMute == 1
        return 0
    end
end

public def OnPlayerEscape(playerid, currenttype, previoustype)
    CurrentPlayerTypes[playerid] = int(currenttype)
end

public def OnPlayerEscapeButDead(playerid, currenttype, previoustype)
     CurrentPlayerTypes[playerid] = int(currenttype)
end

public def OnPlayerRconAuthorized(playerid)
    SetList()
    DiscBotAdminLog("[RCON] Player " + GetPlayerNickname(playerid) + " [" + GetPlayerSteamID(playerid) + "] has admined...")
end

public def OnPlayerConsole(playerid, text)
    DiscBotAdminLog("[Console Command] " + GetPlayerNickname(playerid) + " [" + GetPlayerSteamID(playerid) + "]: " + text)
end

local timerId = 0

public def OnServerRestart(playerid)
    DiscBotLog("[Server]: Round is restarting...")
    cameraInCheck = 0
    roundStarted = 0
    RemoveTimer(timerId)
    CreateTimer("paintro", 13000, 0)
    ended = 0

    for i = 1; i < MAX_ROOMS; i++
        if IsValidRoom(i) == 1
            roomName = GetRoomName(i)
            select roomName
                case "roompj"
                    docID = CreateItem("Document SCP-372", "paper")
                    docEntityID = GetItemEntity(docID)
                    tempRE = GetRoomObjectEntity(i, 43)
                    if tempRE != 0 then
                        xpos = EntityX(tempRE)
                        ypos = EntityY(tempRE)
                        zpos = EntityZ(tempRE)
                        PositionEntity(docEntityID, xpos, ypos - 1.5, zpos, 0)
                        ResetEntity(docEntityID)
                        print("[Documenter] Loading where E-ID: " + tempRE + " at X:" + xpos + ", Y:" + ypos + ", Z:" + zpos)
                        print("[Documenter] Loaded Document SCP-372")
                    else
                        print("[Documenter] Failed to load Document SCP-372: EntityID-404-NotFound")
                    end
                case "room012"
                    tempDoorID = GetRoomDoor(i, 0)
                    SetDoorOpenState(tempDoorID, 1)
                case "room035"
                    tempDoorID = GetRoomDoor(i, 1)
                    SetDoorOpenState(tempDoorID, 1)
                case "173"
                    tempDoorID = GetRoomDoor(i, 1)
                    SetDoorOpenState(tempDoorID, 1)
                    tempDoorID = GetRoomDoor(i, 2)
                    SetDoorOpenState(tempDoorID, 1)
                    tempDoorID = GetRoomDoor(i, 6)
                    SetDoorOpenState(tempDoorID, 1)
            end
        else
            break
        end
    end
end

public def OnRoundStarted()
    DiscBotLog("[Server]: Round has started.")
    
    if roundStarted == 0 then
        timerId = CreateTimer("mtf_timerLoop", 1500, 1)
    end

    roundStarted = 1
    CreateSound("SFX\Room\Intro\PA\scripted\scripted6.ogg",  0, 0, 0, 99999, 1.5)
end

public def OnPlayerRequestExplosion(pid, timer)
	return pid
end

public def OnPlayerRconIncorrect(playerid)
    DiscBotAdminLog("[RCON] Player " + GetPlayerNickname(playerid) + " has failed to admined...")
end

public def OnIncomingConnection(nickname, ip, steamid, version, ispatron)
	//by senpai
    nicknameCensorVar = detectCensor(nickname)
    if nicknameCensorVar == 1
        return "Username is not allowed." + Chr(13) + Chr(10) + " Contains a possiblly censored word."
    end
    
    newPlayerCount = prevPlayerCount + 1
    if newPlayerCount < 60
        if FileType("DataBase/" + steamid + ".ini") == 1 then
            local banend = int(GetINIValue("DataBase/" + steamid + ".ini", steamid, "banned", "0"))
            local permaBanned = int(GetINIValue("DataBase/" + steamid + ".ini", steamid, "permaBanned", "0"))
            if banend < 0 or permaBanned then
                return "You're banned permanently." + Chr(13) + Chr(10) + "Head to our discord to appeal."
            end

            if getunixtime() < banend then
                return "You're banned." + Chr(13) + Chr(10) + "(wait "+int((banend-getunixtime())/60)+" min)"
            end
        end
    else
        if FileType("DataBase/" + steamid + ".ini") == 1 then
            local connectingPlayerAdmin	    = int(GetINIValue("DataBase/" + steamid + ".ini", steamid, "admin", "0"))
            local connectingPlayerOwner     = int(GetINIValue("DataBase/" + steamid + ".ini", steamid, "owner", "0"))
            if connectingPlayerAdmin == 1 or connectingPlayerOwner == 1
                banend = int(GetINIValue("DataBase/" + steamid + ".ini", steamid, "banned", "0"))
                permaBanned = int(GetINIValue("DataBase/" + steamid + ".ini", steamid, "permaBanned", "0"))
                if banend < 0 or permaBanned then
                    return "You're banned permanently." + Chr(13) + Chr(10) + "Head to our discord to appeal."
                end

                if getunixtime() < banend then
                    return "You're banned." + Chr(13) + Chr(10) + "(wait "+int((banend-getunixtime())/60)+" min)"
                end
                return
            end
        end
        return "Slots above 60 are " + Chr(13) + Chr(10) + "Reserved."
    end

	if instr(nickname, "[ADMIN]", 1) then
		return "Change nick name, cannot contain [ADMIN]"
	end

    if instr(nickname, "}", 1) or instr(nickname, "{", 1) then
		return "Change nick name, cannot contain invalid character."
	end
end

def unbanFromLocalFile(unbanidentity, banfilename)
    local f = ReadFile(banfilename)
    local msg = ""
    local nmsgBody = ""
    while not eof(f)
        msg = ReadLine(f)
        if len msg != 0 and msg != "" and msg != " "
            if msg != unbanidentity then
                nmsgBody = nmsgBody + msg + Chr(13) + Chr(10)
            end
        end
    end
    CloseFile(f)
    fw = WriteFile(banfilename)
    WriteLine(fw, nmsgBody)
    CloseFile(fw)
end

public def OnPlayerKillPlayer(pid, kid, weaponid)
    DiscBotLog("[Server] Player " + GetPlayerNickname(kid) + " was killed by Player " + GetPlayerNickname(pid))

    if CurrentPlayerTypes[pid] == 1
        local victimid = CurrentPlayerTypes[kid]

        select victimid
//            case 5
//                PlayPlayerSound(pid, "SFX\Character\MTF\173\Cont3.ogg", 10, 3)
//                CreateTimer("contain173pa", 6000, 0)
            case 13
                PlayPlayerSound(pid, "SFX\Character\MTF\049\Player0492_2.ogg", 10, 7)
        end
    end
end

public def OnPlayerHitPlayer(attackerid, victimid, damage)
    if CurrentPlayerTypes[attackerid] == CurrentPlayerTypes[victimid]
        if not victimid == attackerid and CurrentPlayerTypes[attackerid] == 17
            SendMessage(attackerid, "[Server] Teamkilling is not allowed. Please refrain from it.")
            DiscBotAdminLog("[TeamKill Detection] Detected Player " + GetPlayerNickname(attackerid) + " attacking " + GetPlayerNickname(victimid))
        end
    end
    
    if CurrentPlayerTypes[attackerid] == 1 and CurrentPlayerTypes[victimid] == 5 and foundShout[0] == 0
        foundShout[0] = 1
        PlayPlayerSound(attackerid, "SFX\Character\MTF\173\Spotted" + rand(1,3) + ".ogg", 10, 7)
        CreateTimer("canfoundshoutnow", 60000, 0, 0)
    else if CurrentPlayerTypes[attackerid] == 1 and CurrentPlayerTypes[victimid] == 6 and foundShout[1] == 0
        foundShout[1] = 1
        PlayPlayerSound(attackerid, "SFX\Character\MTF\049\Spotted" + rand(1,5) + ".ogg", 10, 7)
        CreateTimer("canfoundshoutnow", 60000, 0, 1)
    else if CurrentPlayerTypes[attackerid] == 1 and CurrentPlayerTypes[victimid] == 11 and foundShout[2] == 0
        foundShout[2] = 1
        PlayPlayerSound(attackerid, "SFX\Character\MTF\106\Spotted" + rand(1,2) + ".ogg", 10, 7)
        CreateTimer("canfoundshoutnow", 60000, 0, 2)
    else if CurrentPlayerTypes[attackerid] == 1 and CurrentPlayerTypes[victimid] == 14 and foundShout[3] == 0
        foundShout[3] = 1
        PlayPlayerSound(attackerid, "SFX\Character\MTF\096\Spotted" + rand(1,2) + ".ogg", 10, 7)
        CreateTimer("canfoundshoutnow", 60000, 0, 3)
    else if CurrentPlayerTypes[attackerid] == 1 and CurrentPlayerTypes[victimid] == 13 and foundShout[4] == 0
        foundShout[4] = 1
        PlayPlayerSound(attackerid, "SFX\Character\MTF\049\Player0492_1.ogg", 10, 7)
        CreateTimer("canfoundshoutnow", 50000, 0, 4)
    end
end

// public def OnPlayerTakeItem(playerid, itemid, itemtemplateid)
    // if thisD9341 == player and CurrentPlayerTypes[playerid] == 1    
    // end
    // print(GetItemTemplateName(itemtemplateid) + " " + GetItemTemplateTempName(itemtemplateid))
    // temppickupname = GetItemTemplateName(itemtemplateid)
    // if temppickupname == "SCP-513" then
    //     RemoveItem(itemid)
    //     return 0  // Return 0 so we don't get an "Object Not Found" error.
    // end
// end

public def OnPlayerReleaseSound(playerid, filename, volume, dist)
    if GetPlayerType(playerid) == TYPE_NTF
        tempStepString = Left(filename, 13)
        if tempStepString == "SFX\Step\Step"
            PlayPlayerSound(playerid, "SFX\Character\MTF\Step" + rand(1,3) + ".ogg", dist, volume)
            return 0
        end
        select filename
            case "SFX\Character\D9341\breath0.ogg"
                PlayPlayerSound(playerid, "SFX\Character\MTF\Breath.ogg", dist, volume)
                return 0
            case "SFX\Character\D9341\breath1.ogg"
                PlayPlayerSound(playerid, "SFX\Character\MTF\Breath.ogg", dist, volume)
                return 0
            case "SFX\Character\D9341\breath2.ogg"
                PlayPlayerSound(playerid, "SFX\Character\MTF\Breath.ogg", dist, volume)
                return 0
            case "SFX\Character\D9341\breath3.ogg"
                PlayPlayerSound(playerid, "SFX\Character\MTF\Breath.ogg", dist, volume)
                return 0
            case "SFX\Character\D9341\breath4.ogg"
                PlayPlayerSound(playerid, "SFX\Character\MTF\Breath.ogg", dist, volume)
                return 0
        end
    end
end

public def OnPlayerRotateLever(playerid, objectid, pitch, yaw, roll)
    local roomID = GetPlayerRoomID(playerid)
    local roomName = GetRoomName(roomID)
    select roomName
        case "room2ccont"
            if objectid == 1
                if pitch < 0 and lightsOn == 1
                    lightsOn = 0
                    SetLightVolume(0.07)
                else if pitch > 40 and lightsOn == 0
                    lightsOn = 1
                    SetLightVolume(1.0)
                end
            else if objectid == 5
                if pitch < 0 and gatesUnlocked == 1
                    gatesUnlocked = 0
                else if pitch > 55 and gatesUnlocked == 0
                    gatesUnlocked = 1
                end
            end
        case "room2sl"
            if objectid == 19
                if pitch < 0 and lightsOn == 1
                // todo: fill here or destroy to prevent abuse.
                else if pitch > 55 and lightsOn == 0
                // todo: add trigger to unlock light zone.
                end
            end
    end
end

public def OnPlayerClickButton(playerid, doorid, open, locked, UseWithItem, code)
//    playerType = GetPlayerType(playerid)
    if CurrentPlayerTypes[playerid] == 1 and locked == 0
        PlayPlayerSound(playerid, "SFX\Character\MTF\Beep.ogg", 5, 5.0)
    end

    roomID = GetPlayerRoomID(playerid)
    roomName = GetRoomName(roomID)
//    for i = 0; i < 6; i++
//        tempMSG = GetRoomDoor(roomID, i)
//        print("RoomDoorID: " + i + " - " + tempMSG)
//    end
    if doorid == DoorID079
        if DoorID079 != 0
            return 0
        end
    end

    if roomName == "room2poffices2" 
        if doorid == GetRoomDoor(roomID, 0)
            if GetDoorOpenState(doorid) == 0
                SetDoorLock(doorid, 0)
            else
                SetDoorLock(doorid, 1)
            end
        else if CurrentPlayerTypes[playerid] == 1 and locked == 0
            if code == "0000"
                if GetDoorType(doorid) == 0
                    if GetDoorOpenState(doorid) == 0
                        SetDoorOpenState(doorid, 1)
                    else
                        SetDoorOpenState(doorid, 0)
                    end
                    return 0
                end
            end
        end
    else if roomName == "checkpoint1"
        // return 0
    end
end

//public def OnItemRefine(setting, outputX, outputY, outputZ, itemid, playerid)
//    itemName = GetItemTemplateName(GetItemTemplate(itemid))
//    if setting == "very fine"
//        select itemName
//            case "Gas Mask"
//                refinedItemID = CreateItem("SCP-1499", "scp1499")
//                refinedEntityID = GetItemEntity(refinedItemID)
//                PositionEntity(refinedEntityID, outputX, outputY, outputZ, 0)
//                ResetEntity(refinedEntityID)
//                return 0
//        end
//    end
//end

public def OnPlayerCuffPlayer(playerid, cuffplayerid)
    if GetPlayerHoldingGun(cuffplayerid) != 0
        SetPlayerMessage(playerid, "Cannot cuff the player that is brandishing a weapon.", 600)
        return 0
    end
end

public def OnSpawnMTF()
    commandInUse = 1
    CreateTimer("commandnotinuse", 30000, 0)
end

def IsPlayerValid(pid)
	if MAX_PLAYERS > pid and pid > 0
		return IsPlayerConnected(pid)
	end
	return 0
end

////////////////////////////////////////
//     Discord Command Callback       //
//               Block                //
//                                    //
////////////////////////////////////////

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
        for i=2; i<len spl; i++
            msg = msg + " " + spl[i]
        end
        if IsPlayerConnected(id) then
            Kick(id, msg)
        end
    else if spl[0] == "ban"
        args1 = spl[1]
        aID = Int(spl[2])
        local minutes = Int(spl[3])
        local epochFinal = int(minutes * 60)
        local unixtime = int(getunixtime())

        PlayerBannedEnd[aID] = unixtime + epochFinal

        if args1 == "steamid"
            DatabaseInput(aID, "banned", unixtime + epochFinal, 1)
            DiscBotAdminLog("Banned SteamID: " + aID + ". Please kick player manually if still on.")
        else if args1 == "pid"
            if PlayerBannedEnd[aID] > unixtime then
                local steamid = GetPlayerSteamID(aID)
                DatabaseInput(steamid, "banned", PlayerBannedEnd[aID], 1)
                Kick(aID, "[Server] CONSOLE banned player " + GetPlayerNickname(aID))
            end
        else
            DiscBotAdminLog("Please specify if you're using 'steamid' or 'pid'.")
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
    else if spl[0] == "unban"
        steamid = Int(spl[1])
			
        if FileType("DataBase/" + steamid + ".ini") == 1 then
            DatabaseInput(steamid, "banned", "0", 0)
            DatabaseInput(steamid, "permaBanned", "0", 1)
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
    else if spl[0] == "gmute"
        muID = Int(spl[1])
        steamid = GetPlayerSteamID(muID)
        muNickname = GetPlayerNickname(muID)

        if IsPlayerValid(muID)
            DatabaseInput(steamid, "globalMute", hasPlayerGlobalMute[muID], 1)
            DiscBotAdminLog("Global Mute applied to " + muNickname)
        else
            DiscBotAdminLog("[ERROR] Invalid; Provide a valid playid to lookup.")
        end
    end
end

def DiscBotLog(data)
    plugin_poke(bot, data + Chr(0), P_TYPE_STRING)
    plugin_call(bot, "output_log", 0)
end

def DiscBotAdminLog(data)
    plugin_poke(bot, data + Chr(0), P_TYPE_STRING)
    plugin_call(bot, "output_admin_log", 0)
end

def SetList()
    data = "```\nPlayers:"
    for i=1; i<=MAX_PLAYERS; ++i
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

def SetStatus(status)
    plugin_poke(bot, status + Chr(0), P_TYPE_STRING)
    plugin_call(bot, "bot_status", 0)
end

////////////////////////////////////////
//          Random Functions          //
//               Block                //
//                                    //
////////////////////////////////////////

def targetD9341(playerid, runSection)
    if CurrentPlayerTypes[playerid] == 3
        local rndMTime = rand(45000, 135000)
        select runSection
            case 1
                CreateSound("SFX\Character\MTF\ThreatAnnounc1.ogg",  0, 0, 0, 99999, 1.7)
                local rndARunSection = rand(2, 3)
                CreateTimer(targetD9341, rndmTime, 0, playerid, rndMRunSection)
            case 2
                CreateSound("SFX\Character\MTF\ThreatAnnounc2.ogg",  0, 0, 0, 99999, 1.7)
                local rndBRunSection = rand(3, 4)
                CreateTimer(targetD9341, rndmTime, 0, playerid, rndMRunSection)
            case 3
                CreateSound("SFX\Character\MTF\ThreatAnnounc3.ogg",  0, 0, 0, 99999, 1.7)
                CreateTimer(targetD9341, rndmTime, 0, playerid, 4)
            case 4
                if doesD9341Poss == 1 and hasAnnouncedPossToD9341 == 0
                    CreateSound("SFX\Character\MTF\ThreatAnnouncPossession.ogg",  0, 0, 0, 99999, 1.7)
                    hasAnnouncedPossToD9341 = 0
                    CreateTimer(targetD9341, rndmTime, 0, playerid, 4)
                else
                    CreateSound("SFX\Character\MTF\ThreatAnnouncFinal.ogg",  0, 0, 0, 99999, 1.7)
                end
        end
    end
end

def CameraCheck(playerid)
    if cameraInCheck == 0 or cameraInCheck == 2
        cameraInCheck = 1
        local minutes = 2
        local unixtime = int(getunixtime())
        local epochFinal = int(minutes * 60)

        CreateSound("SFX\Character\MTF\AnnouncCameraCheck.ogg",  0, 0, 0, 99999, 1.7)
        for i=1; i<=MAX_PLAYERS; i++
            local lvarTypes = CurrentPlayerTypes[i]
            select lvarTypes
                case 3
                    t++
                    local isD9341Real = GetPlayerNickname(i)
                    if isD9341Real == "D9341" or isD9341Real == "D-9341"
                        local rndmTime = rand(45000, 135000)
                        thisD9341 == playerid
                        CreateTimer(targetD9341, rndmTime, 0, playerid, 1)
                    end
                case 7
                    t++
            end
        end
        remainingMTFEnemy = t   
        cameraCheckTime = unixtime + epochFinal
        CreateTimer("remainingcheck", 30000, 0)
    end
end

def remainingcheck()
    if remainingMTFEnemy > 1 then
        for i=1; i<=MAX_PLAYERS; i++
            if CurrentPlayerTypes[i] == 1 or CurrentPlayerTypes[i] == 2 then
                SetPlayerMessage(i, "[CONTROL] There is currently " + remainingMTFEnemy + " intruder's/escapee's left on Site [REDACTED].", 2000)
            end
        end
        CreateSound("SFX\Character\MTF\AnnouncCameraFound1.ogg",  0, 0, 0, 99999, 1.7)
    else if remainingMTFEnemy == 1
        for i=1; i<=MAX_PLAYERS; i++
            if CurrentPlayerTypes[i] == 1 or CurrentPlayerTypes[i] == 2 then
                SetPlayerMessage(i, "[CONTROL] There is currently only 1 intruder/escapee left on Site [REDACTED].", 2000)
            end
        end
        CreateSound("SFX\Character\MTF\AnnouncCameraFound2.ogg",  0, 0, 0, 99999, 1.7)
    else
        for i=1; i<=MAX_PLAYERS; i++
            if CurrentPlayerTypes[i] == 1 or CurrentPlayerTypes[i] == 2 then
                SetPlayerMessage(i, "[CONTROL] There is currently NO intruder's/escapee's left on Site [REDACTED].", 2000)
            end
        end
        CreateSound("SFX\Character\MTF\AnnouncCameraNoFound.ogg",  0, 0, 0, 99999, 1.7)
    end
    CreateTimer("commandnotinuse", 15000, 0)
end

def commandnotinuse()
    commandInUse = 0
end

def canfoundshoutnow(id)
    foundShout[id] = 0
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

def MyHelp(playerid, arguement)
    arguement = Lower(arguement)
    if arguement == "mtf" or arguement == "guard"
        SendMessage(playerid, "---=--- ---=---")
        SendMessage(playerid, "Help Page: /help mtf/guard")
        SendMessage(playerid, "/cc or /cameracheck - Check cameras for Chaos/Class D.")
        SendMessage(playerid, "---=--- ---=---")
    else if arguement == "general"
        SendMessage(playerid, "---=--- ---=---")
        SendMessage(playerid, "Help Page: /help general")
        SendMessage(playerid, "/time - Check Epoch Time")
        SendMessage(playerid, "/steamid [playerid] - Checks connected playerid's SteamId. Default: Your steamid.")
        SendMessage(playerid, "---=--- ---=---")
    else
        SendMessage(playerid, "---=--- ---=---")
        SendMessage(playerid, "Help Page: /help")
        SendMessage(playerid, "To use /help, please provide one of the roles below.")
        SendMessage(playerid, "")
        SendMessage(playerid, "Roles: general, mtf, guard")
        SendMessage(playerid, "Example: /help general")
        SendMessage(playerid, "To request admin assistance please use /report")
        SendMessage(playerid, "Example: /report help i'm stuck")
        SendMessage(playerid, "---=--- ---=---")
    end
end

def paintro()
    if roundStarted == 0
        randomi = rand(1,7)
        CreateSound("SFX\Room\Intro\PA\scripted\announcement" + randomi + ".ogg",  0, 0, 0, 99999, 2)
        CreateTimer("paintro", 30000, 0)
    end
end

def contain173pa()
    CreateSound("SFX\Character\MTF\Announc173Contain.ogg",  0, 0, 0, 99999, 1.5)
end

def discordplayercountupdate()
    j = 0
    for i=1; i<=MAX_PLAYERS; ++i
        if IsPlayerConnected(i) then
            j++
        end
    end
    if not j == prevPlayerCount then
        SetStatus(j + " Players Online")
        SetList()
        prevPlayerCount = j
    end
end

def teslajokewait()
    local randomi = rand(1,3)
    CreateSound("SFX\Character\MTF\Tesla" + randomi + ".ogg",  0, 0, 0, 99999, 1.5)
end

def play096Sound()
    if not currentPlayerCount == 0
        for i = 1; i <= currentPlayerCount; i++
            if IsPlayerValid(i) then
                if GetPlayerType(i) == 14
                    PlayPlayerSound(i, "SFX\Music\096.ogg", 22, 9.0)
                end
            end
        end
    end
end

def play106Sound()
    if not currentPlayerCount == 0
        for i = 1; i <= currentPlayerCount; i++
            if IsPlayerValid(i) then
                if GetPlayerType(i) == 11
                    PlayPlayerSound(i, "SFX\SCP\106\Breathing.ogg", 10, 7.0)
                end
            end
        end
    end
end

////////////////////////////////////////
//        MTF SPAWNWAVE Function      //
//               Block                //
//             (c) 2022               //
////////////////////////////////////////

def mtf_timerLoop()
    SetMTFTimer(9000)
    SetServerSpawnTimeout(9000)
    SetMTFTickets(0)
    SetChaosTickets(0)
    if WaitingForSpawn == 0 and roundStarted == 1 and ended == 0
        WaitingForSpawn = 1
        print("spawning mtf/chaos")
        CreateTimer("mtf_callbackSpawn", 240000)
        CreateTimer("updateSpawnwaveTimer", 240000)
        remainingSpawnTime = MilliSecs() + 240000
        for i = 1 ; i < MAX_PLAYERS; i++
            local differenceSpawnTime = (remainingSpawnTime - MilliSecs())
            sendPacketWithDataInt1(i, 2, differenceSpawnTime)
        end
    end
end

public def mtf_callbackSpawn()   
        WaitingForSpawn = 0
        local foundDead = 0
        
        for i=1; i<MAX_PLAYERS; i++
            if IsPlayerConnected(i) then
                local playerTypeSpawnCallback = GetPlayerType(i)                
                select playerTypeSpawnCallback
                    case 0
                        foundDead++
                end
            end
        end

        if foundDead == 0 then
            print("[MTF Module] No dead players found, skipping.")
            return 0
        end

        print("[SPAWN] Dead players being spawned: " + foundDead)

        local spawned = 0
        local toSpawn = int(foundDead / 2)

        if (toSpawn + toSpawn) != foundDead then
            toSpawn = toSpawn + 1
        end

        for i=1; i<MAX_PLAYERS; i++
            if spawned != toSpawn
                if IsPlayerConnected(i) then
                    if GetPlayerType(i) == 0
                        spawned++
                        SetPlayerType(i,1)
                        // plEntity = GetPlayerEntity(i)
                        // ResetEntity(plEntity)
                    end
                end
            else
                break
            end
        end

        spawned = 0

        for i=1; i<MAX_PLAYERS; i++
            if spawned != toSpawn
                if IsPlayerConnected(i) then
                    if GetPlayerType(i) == 0
                        spawned++
                        SetPlayerType(i,7)
                        // plEntity = GetPlayerEntity(i)
                        // ResetEntity(plEntity)
                    end
                end
            else
                break
            end
        end

        CreateSound("SFX\Character\MTF\Announc.ogg",  0, 0, 0, 99999, 1.5)
end

////////////////////////////////////////
//     RemainingCallback Callback     //
//               Block                //
//                                    //
////////////////////////////////////////

def updateRemainingStats(addType, removeType)

    if addType != "kNULL"
        select addType
            case 0
                DeadPlayers++
            case TYPE_NTF
                SecurityAlive++
            case TYPE_CLASSD
                ClassDAlive++
            case TYPE_CHAOS
                CIAlive++
            case TYPE_GUARD, TYPE_SCIENTIST, TYPE_JANITOR, TYPE_WORKER
                PersonnelAlive++
            case TYPE_173, TYPE_049, TYPE_939, TYPE_106, TYPE_966, TYPE_ZOMBIE, TYPE_096, TYPE_860, TYPE_035
                SCPSAlive++
        end
    end

    if removeType != "kNULL"
        select removeType
            case 0
                if DeadPlayers > 0 then
                    DeadPlayers--
                end
            case TYPE_NTF
                SecurityAlive--
            case TYPE_CLASSD
                ClassDAlive--
            case TYPE_CHAOS
                CIAlive--
            case TYPE_GUARD, TYPE_SCIENTIST, TYPE_JANITOR, TYPE_WORKER
                PersonnelAlive--
            case TYPE_173, TYPE_049, TYPE_939, TYPE_106, TYPE_966, TYPE_ZOMBIE, TYPE_096, TYPE_860, TYPE_035
                SCPSAlive--
        end
    end

end

def updateRemainingGraphics()

    for spec; spec < MAX_PLAYERS; spec++
        if IsPlayerConnected(spec) == 1 then
            for x = 0; x < 8; x++; RemovePlayerText(spec, remainingText[x]); end
            currenttype = GetPlayerType(spec)
            if currenttype != 17 then
                screen_width = GetPlayerMonitorWidth(spec)/45
                screen_height = GetPlayerMonitorHeight(spec)
                remainingText[0] = playertext(spec,"Class-D Remaining: " + ClassDAlive, 2.4,14638080) //red
                remainingText[1] = playertext(spec,"Personnel Remaining: " + PersonnelAlive, 2.31,16776960) //red
                remainingText[2] = playertext(spec,"Security Remaining: " + SecurityAlive, 2.23, 1999280) //blue
                remainingText[3] = playertext(spec,"Insurgency Remaining: " + CIAlive, 2.15, 25600) //green
                remainingText[4] = playertext(spec,"SCP Remaining: " + SCPSAlive, 2.08,16711680) //red
                remainingText[5] = playertext(spec,"Dead Players: " + DeadPlayers, 2.02, 12174536) //God knows
            end
        end
    end

end

////////////////////////////////////////
//     SCP-2-Client File Downloader   //
//            Callback Block          //
//                                    //
////////////////////////////////////////

public def OnPlayerRequestFiles(playerid)
//    SendFile(playerid, "somedirectory/example.ogg", "example/audio/example.ogg", 0)    // Sends over a file to the client.
    SendScript(playerid,"client.gsc", "wendys/temp/client.gsc")    // Sends over a script to the client.
end

public def OnPlayerReceiveFile(playerid, filename, result)
    print(playerid + " recieved " + filename)
end

////////////////////////////////////////
//     Network Callback/Functions     //
//               Block                //
//                                    //
////////////////////////////////////////

////// NETWORK CALLBACK //////

public def OnReceiveRawPacket(id, bnk)
    RecievedRawPacket(id,bnk)
end

public def RecievedRawPacket(playerid, bnk)
    if BankSize(bnk) > 0 then
        b = PeekByte(bnk)
        select b
            case 1 // Packet to determine if client has fully loaded in. Used to determine if script is ready to draw.
                print("[PACKET:1][PlayerID:" + playerid + "] Client has sent sent the all-ready and is ready to draw from clientside.")
                sendPacketWithDataInt2(playerid, 1, 1, GetPlayerType(playerid))
            case 2 // Client -> Server request for spawnwave timer information.
                if remainingSpawnTime > 0 then
                    local differenceSpawnTime = (remainingSpawnTime - MilliSecs())
                    sendPacketWithDataInt1(playerid, 2, differenceSpawnTime)
                end
        end
    end
end

////// NETWORK FUNCTIONS //////

public def sendPacket(playerid, postData)
    local bank = CreateBank(1)
    PokeByte(bank, 0, postData)
    SendRawPacket(playerid, bank)
    FreeBank(bank)
end

public def sendPacketWithDataInt1(playerid, postData, dataInt1)
    local bank = CreateBank(5)
    PokeByte(bank, 0, postData)
    PokeInt(bank, 1, dataInt1)
    SendRawPacket(playerid, bank)
    FreeBank(bank)
end

public def sendPacketWithDataInt2(playerid, postData, dataInt1, dataInt2)
    local bank = CreateBank(9)
    PokeByte(bank, 0, postData)
    PokeInt(bank, 1, dataInt1)
    PokeInt(bank, 5, dataInt2)
    SendRawPacket(playerid, bank)
    FreeBank(bank)
end

////////////////////////////////////////
//         3rd-Party Function         //
//               Block                //
//                                    //
////////////////////////////////////////

// By Ne4to
def split(s, entry, char)
    while Instr(s,char+char, 1)
        s = Replace(s, char+char,char)
    end
    for n = 1; n < entry; n++
        p = Instr(s, char, 1)
        s = Right(s, Len s-p)
    end
    p = Instr(s, char, 1)
    If p < 1 then
        a = s
    else
        a = Left(s,p-1)
    end
    return a
end


// By VirtualBrightz
public def SplitStr(text, ch)
    local a = []
    local i = 1
    while true
        local sloc = InStr(text, ch, i)
        if sloc == 0 then
            local l2 = len text
            local st = Mid(text, i, l2 - i + 1)
            addarrayelements(a, 1)
            local lt = len a
            a[lt - 1] = st
            break
        end
        local s = Mid(text, i, sloc - i)
        addarrayelements(a, 1)
        local l = len a
        a[l - 1] = s
        i = sloc + 1
    end
    return a
end

// By Goodman
def playertext(plr,txt,y,clr)
    return CreatePlayerText(plr,txt, screen_width, screen_height/y, clr, "Courier New Rus.ttf", 18)
end

////////////////////////////////////////
//            END OF CODE             //
//              Block                 //
//                                    //
////////////////////////////////////////