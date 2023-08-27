//
// ==========================================================
// ||        Player Interaction and Events Callbacks       ||
// ||                       Block                          ||
// ==========================================================
//

public def OnPlayerDeactivateWarheads(playerid)
    Warhead = 0
end

public def OnPlayerChat(playerid, text)
    local id = 0
    local unixtime = int(getunixtime())

    if IsPlayerValid(playerid)
        if loadLibrary and chatCensor
            chatCensorVar = detectCensor(text)
            if chatCensorVar == 1
                PlayerCensorViolations[playerid] = PlayerCensorViolations[playerid] + 1
                SendMessage(playerid, "%color|204,36,34|% [CHAT] Please refrain from slurs and offensive language. Continued attempts will result in punishment. Strike: " + PlayerCensorViolations[playerid])
                if PlayerCensorViolations[playerid] >= 4
                    local steamid = GetPlayerSteamID(playerid)
                    ExecuteSQLPreparedProcedure("InsertPlayerBans", "'', '" + steamid + "', '2', '5'")
                    Kick(playerid, "%color|204,36,34|% [GOV] Government Censor banned player " + GetPlayerNickname(playerid))
                end
                return 0
            end
        end
        
        isSlash = Left(text, 3)
        if isSlash == ": /"
            if instr(text, "/time", 1)
                SendMessage(playerid, "%color|2,115,132|% The Current Epoch Time is: " + unixtime)
                return 0
            else if instr(text, "/help", 1)
                helpCat = split(text, 3, " ")
                MyHelp(playerid, helpCat)
                return 0
            else if instr(text, "/dead", 1)
                SendMessage(playerid, "%color|2,115,132|% Current players dead: " + PlayersDead)
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
            else if instr(text, "/discord", 1)
                SetPlayerMessage(playerid, "Visit our Discord @ " + serverDiscord + "", 1500)
                return 0
            else if instr(text, "/report", 1)
                DiscBotAdminLog(GetPlayerNickname(playerid) + ":" + GetPlayerSteamID(playerid) + " used /report: " + text)
                SendMessage(playerid, "%color|2,115,132|% [TO ADMINS] " + GetPlayerNickname(playerid) + ": " + text)
                SendAdminMessage(playerid, "%color|2,115,132|% [TO ADMINS] " + GetPlayerNickname(playerid) + text)
                return 0
            else if instr(text, "/donate", 1)
                SetPlayerMessage(playerid, "Donate to " + serverDonation + ".", 1500)
            else if instr(text, "/steamid", 1)
                id = int(split(text, 3, " "))

                if IsPlayerValid(id)
                    SendMessage(playerid,"%color|2,115,132|% " + GetPlayerNickname(id) + " SteamID is: " + GetPlayerSteamID(id))
                    return 0
                else
                    SendMessage(playerid, "%color|2,115,132|% Your SteamID is: " + GetPlayerSteamID(playerid))
                    return 0
                end
            else if PlayerRanks[playerid] > 1
                // by Ne4to (sample bantime, ini ban)
                if instr(text, "/ban", 1) 
                    id = int(split(text, 3, " "))
                    local minutes = int(split(text, 4, " "))
                    
                    if IsPlayerValid(id)
                        if PlayerRanks[id] > 1 and PlayerRanks[playerid] < 4
                            SendMessage(playerid, "%color|204,36,34|% [Server] You cannot ban an already logged in admin.")
                            return 0
                        end

                        steamid = GetPlayerSteamID(id)
                        local playerIp = GetPlayerIP(id)
                        ExecuteSQLPreparedProcedure("InsertPlayerBans", "'" + playerIp + "', '" + steamid + "', '2', '" + minutes + "'")

                        Kick(id, "%color|2,115,132|% [Server] Admin " + GetPlayerNickname(playerid) + " banned the player " + GetPlayerNickname(id))
                        return 0
                    else
                        SendMessage(playerid, "%color|204,36,34|% [Server] Player not connected.")
                        return 0
                    end
                else if instr(text, "/size", 1) 
                    id = int(split(text, 3, " "))
                    local crazyShit = int(split(text, 4, " "))

                    if IsPlayerValid(id) and PlayerRanks[playerid] > 2 then
                        changeplayersize(id,crazyShit)
                        SendMessage(playerid, "%color|2,115,132|% [Server] Set " + id + " size to " + crazyShit + "%")
                        SendMessage(id, "%color|2,115,132|% [Server] An admin has scaled you to " + crazyShit + "%")
                        return 0
                    else
                        SendMessage(playerid, "%color|204,36,34|% [Server] Player not connected.")
                        return 0
                    end
                else if instr(text, "/finddoor", 1) 
                    local doorIdText = int(split(text, 3, " "))
                    local roomId = GetPlayerRoomID(playerid)

                    local doorId = GetRoomDoor(roomId,doorIdText)
                    if IsValidDoor(doorId) then
                        local doorEntity = GetDoorEntity(doorId)
                        local entityX = EntityX(doorEntity)
                        local entityY = EntityY(doorEntity)
                        local entityZ = EntityZ(doorEntity)

                        SetPlayerPositionID(playerid, roomid, entityX, entityY, entityZ)
                        SendMessage(playerid, "%color|2,115,132|% [Server] Valid door, opening! ")
                        SetDoorOpenState(doorId,1)
                    else
                        SendMessage(playerid, "%color|204,36,34|% [Server] Door: " + doorIdText + " doesn't exist in " + GetRoomName(roomId))
                    end
                    return 0
                else if instr(text, "/speedmult", 1) 
                    local amountOfSpeed = float(split(text, 3, " "))
                    SetPlayerVelocity(playerid, amountOfSpeed)
                    SendMessage(playerid, "%color|2,115,132|% [Server] Set speed mult " + amountOfSpeed)
                    return 0
                else if instr(text, "/unban", 1) 
                    steamid = int(split(text, 3, " "))
                    ExecuteSQLPreparedProcedure("InsertPlayerBans", "'', '" + steamid + "', '2', '0'")
                    SendMessage(playerid, "%color|2,115,132|% Unbanned SteamID: " + unbansteamid)
                    return 0
                else if instr(text, "/scpsWin", 1) 
                    local kill = 0
                    for i = 1; i < MAX_PLAYERS; i++
                        if IsPlayerConnected(i) and IsAFakePlayer(i) then
                            select GetPlayerType(i)
                                    case 1, 2, 3, 4, 7, 8
                                        SetPlayerFakeHealth(i, -1)
                                        kill = kill + 1
                            end
                        end
                    end
                    SendMessage(playerid,"%color|2,115,132|% Killed " + kill)
                    return 0
                else if instr(text, "/pizzaday", 1) 
                    PlayPlayerSound(playerid, "SFX/Room/Intro/PA/scripted/announcement1.ogg", 900, 1.5)
                    return 0     
                else if instr(text, "/h", 1)
                    PlayerConsoleCommand(playerid, "spawnitem hazmatsuit", 1)
                    return 0
                else if instr(text, "/sus", 1)
                    PlayerConsoleCommand(playerid, "spawnitem hazmatsuit", 1)
                    PlayPlayerSound(playerid, "multiplayer/serversdata/" + serverName + "/audio/sus.ogg", 10, 7.0)
                else if instr(text, "/supersus", 1)
                    PlayerConsoleCommand(playerid, "spawnitem hazmatsuit2", 1)
                    PlayPlayerSound(playerid, "multiplayer/serversdata/" + serverName + "/audio/sus.ogg", 10, 7.0)
                else if instr(text, "/gmute", 1)
                    muteid = int(split(text, 3, " "))
                    toggleMute = split(text, 4, " ")
                    if IsPlayerValid(muteid) == 1
                        steamid = GetPlayerSteamID(muteid)
                        if toggleMute == "true"
                            ExecuteSQLPreparedProcedure("UpdateMuteStatus", "'" + steamid + "', '2'")
                            hasPlayerGlobalMute[muteid] = 1
                            SendMessage(playerid, "%color|2,115,132|% [SERVER] Globally muted " + GetPlayerNickname(muteid) + ". Status: " + hasPlayerGlobalMute[muteid])
                            return 0
                        else if toggleMute == "false"
                            ExecuteSQLPreparedProcedure("UpdateMuteStatus", "'" + steamid + "', '1'")
                            hasPlayerGlobalMute[muteid] = 0
                            SendMessage(playerid, "%color|2,115,132|% [SERVER] Globally unmuted " + GetPlayerNickname(muteid) + ". Status: " + hasPlayerGlobalMute[muteid])
                        else
                            SendMessage(playerid, "%color|2,115,132|% HELP: GlobalMute toggles mute for targeted player. Arguements: 'true' or 'false'.")
                            return 0
                        end
                    else
                        SendMessage(playerid, "%color|204,36,34|% ERROR: You need to provide a playerid.")
                    end
                    return 0
                end
                DiscBotAdminLog("[Chat] Admin " + GetPlayerNickname(playerid) + " `" + text + "`")
            end
        end
    end
    
    if PlayerRanks[playerid] == 4
        if instr(text, "/admin", 1)
            local toggleadminID = int(split(text, 3, " "))
            local adminSteamid = GetPlayerSteamID(toggleadminID)

            if PlayerRanks[toggleadminID] < 3 and IsPlayerValid(toggleadminID)
                GiveAdmin(toggleadminID)
                ExecuteSQLPreparedProcedure("UpdatePlayerTag", "'" + adminSteamid + "', 'ADMIN', '174', '100', '193'")
                ExecuteSQLPreparedProcedure("UpdatePlayerRank", "'" + adminSteamid + "', '3'")
                PlayerRanks[toggleadminID] = 3
                ChangePlayerTag(pid, "ADMIN", 174, 100, 193)
            else if PlayerRanks[toggleadminID] == 3 and IsPlayerValid(toggleadminID)
                RemoveAdmin(toggleadminID)
                ExecuteSQLPreparedProcedure("UpdatePlayerTag", "'" + adminSteamid + "', 'none', '0', '0', '0'")
                ExecuteSQLPreparedProcedure("UpdatePlayerRank", "'" + adminSteamid + "', '0'")
                PlayerRanks[toggleadminID] = 0
                ChangePlayerTag(playerid, "", 255, 255, 255)
            else
                SendMessage(playerid, "%color|2,115,132|% HELP: GiveAdmin toggles the admin tag above head. Arguements: PlayerID.")
            end
            return 0
        else if instr(text, "/createfakeplayer", 1)
            local amount = int(split(text, 3, " "))
            for i = 1; i < amount; i++
                local pid = CreateFakePlayer("FakePlayer")
            end
            return 0
        else if instr(text, "/patreon", 1)
            local togglepatreonID = int(split(text, 3, " "))
            local patreonSteamid = GetPlayerSteamID(togglepatreonID)

            if PlayerRanks[togglepatreonID] < 1 and IsPlayerValid(togglepatreonID)
                PlayerRanks[togglepatreonID] = 1
                ExecuteSQLPreparedProcedure("UpdatePlayerTag", "'" + patreonSteamid + "', 'SUPPORTER', '255', '139', '0'")
                ExecuteSQLPreparedProcedure("UpdatePlayerRank", "'" + patreonSteamid + "', '1'")
                ChangePlayerTag(pid, "SUPPORTER", 255, 139, 0)
            else if PlayerRanks[togglepatreonID] == 1 and IsPlayerValid(togglepatreonID)
                ExecuteSQLPreparedProcedure("UpdatePlayerTag", "'" + patreonSteamid + "', 'none', '0', '0', '0'")
                ExecuteSQLPreparedProcedure("UpdatePlayerRank", "'" + patreonSteamid + "', '0'")
                PlayerRanks[togglepatreonID] = 0
                ChangePlayerTag(playerid, "", 255, 255, 255)
            else
                SendMessage(playerid, "%color|2,115,132|% HELP: GivePatreon toggles the SUPPORTER tag above head. Arguements: PlayerID.")
            end
            return 0
        end
    end

    if IsPlayerValid(playerid)
        local steamids = GetPlayerSteamID(playerid)
        DiscBotLog("[Chat] " + GetPlayerNickname(playerid) + " `" + text + "`")
        if GetPlayerSteamID(playerid) == 77253552
            ServerMessage("[HSIFNF] " + GetPlayerNickname(playerid) + text)
        else if GetPlayerSteamID(playerid) == 290638902
            ServerMessage("[DBG] " + GetPlayerNickname(playerid) + text)
        else if PlayerRanks[playerid] == 1
            ServerMessage("[SUPPORTER] " + GetPlayerNickname(playerid) + text)
        else if PlayerRanks[playerid] == 2
            ServerMessage("[MOD] " + GetPlayerNickname(playerid) + text)
        else if PlayerRanks[playerid] == 3
            ServerMessage("[ADMIN] " + GetPlayerNickname(playerid) + text)
        else if PlayerRanks[playerid] == 4
            ServerMessage("[OWNER] " + GetPlayerNickname(playerid) + text)
        else
            ServerMessage(GetPlayerNickname(playerid) + text)
        end
        return 0
    end
    return 1
end

public def OnPlayerGetNewRole(playerid, oldtype, newtype)
    if playerid < 1 then
        return 1
    end
    CurrentPlayerTypes[playerid] = int(newtype)
    if CurrentPlayerTypes[playerid] == 0 then
        SendMessage(playerid, "%color|2,115,132|% Wow! You died, check how many people are dead with /dead")
    end

    select newtype
        case 0
            sendPacketWithType(playerid, 7, 1)
        case TYPE_CLASSD
            local rndCardChance = rand(1, 5)
            if rndCardChance == 5
                SetItemPicker(playerid, CreateItem("Playing Card", "misc"))
            end
        case TYPE_NTF
            tempPrimaryID = primaryWeaponLoadout[playerid]
            tempSecondaryID = secondaryWeaponLoadout[playerid]
            SetPlayerLoadout(playerid, tempPrimaryID, tempSecondaryID)
        case TYPE_CHAOS
            tempPrimaryID = primaryWeaponLoadout[playerid]
            tempSecondaryID = secondaryWeaponLoadout[playerid]
            SetPlayerLoadout(playerid, tempPrimaryID, tempSecondaryID)
    end

    select oldtype
        case 0
            sendPacketWithType(playerid, 7, 0)
        case TYPE_NTF, TYPE_CHAOS
            // Check if item exist in array, and if true, then delete primary weapon
            if primaryWeaponItemID[playerid] != 0 then
                RemoveItem(primaryWeaponItemID[playerid])
                primaryWeaponItemID[playerid] = 0
            end
            // Check if item exist in array, and if true, then delete secondary weapon
            if secondaryWeaponItemID[playerid] != 0 then
                RemoveItem(secondaryWeaponItemID[playerid])
                secondaryWeaponItemID[playerid] = 0
            end
    end

    if not SmallRound and not BigRound then
        changeplayersize(playerid, 100)
    end

    if peanutRound == 1 
        PlayerNut[playerid] = 1
    end

    if roundStarted == 1 then 
        if SmallRound == 1 then
            changeplayersize(playerid, 65)
        end
        if BigRound == 1 then
            changeplayersize(playerid, 125)
        end
        if peanutRound == 1 and PlayerNut[playerid] == 0 then
            PlayerNut[playerid] = 1
            SetPlayerType(playerid, 3)
            for i = 1; i < MAX_ITEMS; i++
                if IsValidItem(i) then
                    if GetItemPicker(i) == playerid then RemoveItem(i)
                end
            end
        end
        if instaMDRound == 1 then
            if newtype == TYPE_ZOMBIE
                SetPlayerType(playerid, TYPE_049)
            else if newtype == TYPE_NTF or newtype == TYPE_CHAOS
                SetItemPicker(playerid, CreateItem("minigun", "minigun"))
                if newtype == TYPE_NTF
                    SetPlayerMessage(playerid, "The O-5 council has decided to supplement your squad with 1 Minigun each due to unforseen threats.", 1000)
                end
            end
        end
    end
end

public def OnPlayerRequestNewRole(playerid, playertype)
    CurrentPlayerTypes[playerid] = int(playertype)
end

public def OnPlayerEscape(playerid, currenttype, previoustype)
    if CurrentPlayerTypes[playerid] == 3
            DEscape = DEscape + 1
    else if CurrentPlayerTypes[playerid] == 3
            SciEscape = SciEscape + 1
    end
    CurrentPlayerTypes[playerid] = int(currenttype)
end

public def OnPlayerEscapeButDead(playerid, currenttype, previoustype)
    if CurrentPlayerTypes[playerid] == 3
            DEscape = DEscape + 1
    else if CurrentPlayerTypes[playerid] == 3
            SciEscape = SciEscape + 1
    end
     CurrentPlayerTypes[playerid] = int(currenttype)
end

public def OnPlayerRequestExplosion(pid, timer)
	return pid
end

public def OnPlayerKillPlayer(pid, kid, weaponid)
    // Spawncamp Protections - Keeping players from instantly dying on spawning since ~1200 BCE
    // TODO: (@That1Guard) The checks here are good. But it doesn't do as it sister does.. well, it does, but it doesn't give any debug response
    if spawnwaveJustSpawned == 1 then
        local vvv1 = playersJustSpawned[victimid]
        if vvv1 == 1 then
            local _victimCurrentRoomID = GetPlayerRoomID(victimid)
            local _victimRoomName = GetRoomName(_victimCurrentRoomID)
            if _victimRoomName == "exit1" or _victimRoomName == "gatea" or _victimRoomName == "gateaentrance"
                return 0
            end
        end
    end

    PlayersDead = PlayersDead + 1

    DiscBotLog("[Server] Player " + GetPlayerNickname(kid) + " was killed by Player " + GetPlayerNickname(pid))
    Dead = Dead + 1
    varOnTypeChange = CurrentPlayerTypes[kid]
    select varOnTypeChange
        case 1
            MTFDead = MTFDead + 1
        case 2, 4, 8, 17
            FacilityDead = FacilityDead + 1
        case 3
            ClassDE = ClassDE + 1
        case 5, 6, 9, 10, 11, 12, 13, 14, 15, 16
            SCPSDead = SCPSDead + 1
        case 7
            CIDead = CIDead + 1
    end

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

public def OnPlayerHitPlayer(attackerid, victimid, damage, weaponid)
    // Spawncamp Protections - Keeping players from instantly dying on spawning since ~1200 BCE
    if spawnwaveJustSpawned == 1 then
        local vvv1 = playersJustSpawned[victimid]
        if vvv1 == 1 then
            local _victimCurrentRoomID = GetPlayerRoomID(victimid)
            local _victimRoomName = GetRoomName(_victimCurrentRoomID)
            if _victimRoomName == "exit1" or _victimRoomName == "gatea" or _victimRoomName == "gateaentrance"
                return 0
            end
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

public def OnPlayerShootRocket(playerid, x:Float, y:Float, z:Float, angle:Float, pitch:Float)
    local currentMilliSecsForShoot = MilliSecs()
    if spawnwaveJustSpawned == 1 or currentMilliSecsForShoot > remainingSpawnTime - 9
        local _attackerCurrentRoomID = GetPlayerRoomID(playerid)
        local _attackerRoomName = GetRoomName(_attackerCurrentRoomID)
        if _attackerRoomName == "exit1" or _attackerRoomName == "gatea" or _attackerRoomName == "gateaentrance"
            return 0
        end
    end
end

public def OnPlayerTakeItem(playerid, itemid, itemtemplateid)
    // if thisD9341 == player and CurrentPlayerTypes[playerid] == 1    
    // end
    // print("[DEBUG][OnPlayerTakeItem] Item Picked up: " + GetItemTemplateName(itemtemplateid) + " " + GetItemTemplateTempName(itemtemplateid))
    temppickupname = GetItemTemplateTempName(itemtemplateid)
    if temppickupname == "scp513" then
        RemoveItem(itemid)
        return 0  // Return 0 so we don't get an "Object Not Found" error.
    end
end

// ======================================
// ||    Player Drop Item Callback     ||
// ||               Block              ||
// ======================================
//
public def OnPlayerDropItem(playerid, itemid, itemtemplateid)
    if CurrentPlayerTypes[playerid] == TYPE_NTF or CurrentPlayerTypes[playerid] == TYPE_CHAOS

        // Check if item in array matches matches drop, and if true, then delete primary weapon
        if primaryWeaponItemID[playerid] == itemid then
            primaryWeaponItemID[playerid] = 0
        end

        // Check if item in array matches matches drop, and if true, then delete secondary weapon
        if secondaryWeaponItemID[playerid] == itemid then
            secondaryWeaponItemID[playerid] = 0
        end
    end
end

// ======================================
// ||   Player Release Sound Callback  ||
// ||               Block              ||
// ======================================
//
public def OnPlayerReleaseSound(playerid, filename, volume, dist)
    if GetPlayerType(playerid) == TYPE_NTF
        local tempStepString = Left(filename, 13)
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

// ======================================
// ||   Player Rotate Lever Callback   ||
// ||              Block               ||
// ======================================
//
public def OnPlayerRotateLever(playerid, objectid, pitch, yaw, roll)
    local roomID = GetPlayerRoomID(playerid)
    local roomName = GetRoomName(roomID)
    select roomName
        case "room2ccont"
            //if objectid == 1
            //    if pitch < 0 and lightsOn == 1
            //        lightsOn = 0
            //        SetLightVolume(0.07)
            //    else if pitch > 40 and lightsOn == 0
            //        lightsOn = 1
            //        SetLightVolume(1.0)
            //    end
            //else 
            if objectid == 5 then
                if pitch < 0 and gatesUnlocked == 0
                    if CurrentPlayerTypes[playerid] != TYPE_NTF and CurrentPlayerTypes != TYPE_GUARD and CurrentPlayerTypes != TYPE_CHAOS
                        gatesUnlocked = 1
                        SetDoorKeycard(gateALockdownID, 3)
                        SetDoorKeycard(gateBLockdownID, 3)
                        SetPlayerMessage(playerid, "Gate A and Gate B lockdown has been lifted.", 500)
                        CreateSound("SFX\SCP\079\GateB.ogg", 0, 0, 0, 99999, 1.7)
                    end
                else if pitch > 55 and gatesUnlocked == 1
                    if CurrentPlayerTypes[playerid] == TYPE_NTF or CurrentPlayerTypes == TYPE_GUARD or CurrentPlayerTypes == TYPE_CHAOS
                        gatesUnlocked = 0
                        SetDoorKeycard(gateALockdownID, 5)
                        SetDoorKeycard(gateBLockdownID, 5)
                        SetPlayerMessage(playerid, "Gate A and Gate B has been locked down.", 500)
                        CreateSound("SFX\Character\MTF\AnnouncAfter2.ogg", 0, 0, 0, 99999, 1.7)
                    end
                end
            end
        case "room2sl"
            if objectid == 19 then
                if pitch < 0 and checkpointLightUnlock == 0
                    checkpointLightUnlock = 1
                    for i = 0; i < lightzoneTotalDoors; i++
                        tempDoorID = lightzoneDoorID[i]
                        SetDoorKeycard(tempDoorID, 2)
                    end
                    SetPlayerMessage(playerid, "Light Containment Zone lockdown has been lifted.", 500)
                end
            end
    end
end

// =======================================
// || Player Click Button/Door Callback ||
// ||             Block                 ||
// =======================================
//
public def OnPlayerClickButton(playerid, doorid, open, locked, UseWithItem, code)
    if CurrentPlayerTypes[playerid] == 1 and locked == 0
        PlayPlayerSound(playerid, "SFX\Character\MTF\Beep.ogg", 5, 5.0)
    end

    local roomID = GetPlayerRoomID(playerid)
    local roomName = GetRoomName(roomID)

    if doorid == DoorID079
        if DoorID079 != 0
            return 0
        end
    end

    select roomName
        case "room2poffices2" 
            if doorid == GetRoomDoor(roomID, 0)
                if GetDoorOpenState(doorid) == 0
                    SetDoorLock(doorid, 0)
                else
                    SetDoorLock(doorid, 1)
                end
            end
        case "checkpoint1"
            if checkpointLightUnlock != 1
                if UseWithItem > 0 then
                    local keyReturn = CheckKeyCardLvl(UseWithItem)
                    local checkCardLvl = GetDoorKeycard(doorid)
                    if keyReturn < 4 and checkCardLvl > 3
                        SetPlayerMessage(playerid, "The keycard was inserted into the slot but nothing happened.", 500)
                        SendMessage(playerid, "%color|204,36,34|% You need to turn off Light Containment Zone Lockdown in the Surveillance Room or have a Lvl. 4 Keycard")
                    end
                end
            end
        case "gateaentrance", "exit1"
            if UseWithItem > 0 then
                if gatesUnlocked != 1 then
                    keyReturn = CheckKeyCardLvl(UseWithItem)
                    checkCardLvl = GetDoorKeycard(doorid)
                    if keyReturn < 5 and checkCardLvl > 4
                        SetPlayerMessage(playerid, "The keycard was inserted into the slot but nothing happened.", 500)
                        SendMessage(playerid, "%color|204,36,34|% You need to turn off Remote Door Control in the Electrical/Intercom Room, wait for MTF/CI, or have a Lvl. 5 Keycard.")
                    end
                end
            end
    end
end

// =======================================
// ||    Player Cuff Player Callback    ||
// ||               Block               ||
// =======================================
//
public def OnPlayerCuffPlayer(playerid, cuffplayerid)
    if GetPlayerHoldingGun(cuffplayerid) != 0
        SetPlayerMessage(playerid, "Cannot cuff the player that is brandishing a weapon.", 600)
        return 0
    end
end