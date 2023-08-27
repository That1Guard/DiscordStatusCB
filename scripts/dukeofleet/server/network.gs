////// NETWORK FUNCTIONS //////
// These functions are used for sending packets over the network.

public def sendString(packetIndex, string, playerid)
    local stringLength = len string
    local byteLength = 3
    local bank = CreateBank(stringLength + byteLength)
    PokeByte(bank, 0, packetIndex)
    PokeString(bank, 1, string)
    SendRawPacket(playerid, bank)
    FreeBank(bank)
end

public def sendPacket(playerid, postData)
    local bank = CreateBank(1)
    PokeByte(bank, 0, postData)
    SendRawPacket(playerid, bank)
    FreeBank(bank)
end

public def sendPacketWithType(playerid, type, dataType)
    local bank = CreateBank(2)
    PokeByte(bank, 0, type)
    PokeByte(bank, 1, dataType)
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

public def sendDetails(id, pids)
    local bankers = CreateBank(28)
    PokeByte(bankers, 0, 5)
    PokeByte(bankers, 1, CurrentPlayerTypes[pids])
    if PlayerRanks[pids] > 2
        PokeByte(bankers, 2, 1)
    else
        PokeByte(bankers, 2, 0)
    end
    local roomid = GetPlayerRoomID(pids)
    PokeString(bankers, 3, GetRoomName(roomid))
    SendRawPacket(id, bankers)
    FreeBank(bankers)
end

def sendPlayersNames(playerid, playerName, cache4PlayerID)
    local PlayerNameLength = len playerName
    PlayerNameLength = PlayerNameLength + 6
    local bankers = CreateBank(PlayerNameLength)
    PokeByte(bankers, 0, 4)
    PokeByte(bankers, 1, cache4PlayerID)
    PokeString(bankers, 2, playerName)
    SendRawPacket(playerid, bankers)
    //print("[DEBUG] sanity check: [" + cache4PlayerID + ":" + bankers + "] " + PeekString(bankers, 2))
    FreeBank(bankers)
end

public def SendEndScreen()
    local bank = CreateBank(38)

    print("[ENDSCREEN] Show end screen: " + Dead + "-" + SCPSDead + "-" + FacilityDead + "-" + MTFDead + "-" + CIDead + "-" + ClassDE + "-" + SciEscape + "-" + DEscape + "-" + Warhead)

    PokeByte(bank, 0, 0)
    PokeInt(bank, 1, Dead)
    PokeInt(bank, 5, SCPSDead)
    PokeInt(bank, 9, FacilityDead)
    PokeInt(bank, 13, MTFDead)
    PokeInt(bank, 17, CIDead)
    PokeInt(bank, 21, ClassDE)
    PokeInt(bank, 25, SciEscape)
    PokeInt(bank, 29, DEscape)
    PokeInt(bank, 33, Warhead)
    for i = 1; i < MAX_PLAYERS; i++
        if IsPlayerConnected(i) then
            SendRawPacket(i, bank)
        end
    end
    FreeBank(bank)
    ended = 1
end

// This callback function is called when a raw packet is received from a client.
public def RawPacket(id, bnk)
    // Peek the first byte of the bank.
    b = PeekByte(bnk, 0)

    // Select the case based on the first byte.
    select b
        case 1
            // If the round has not started yet, play a sound and print a message.
            if roundStarted == 0 then
                print("[JOIN] I am assuming that " + id + " has loaded!")
                PlayPlayerSound(id, "multiplayer/serversdata/" + serverName + "/audio/join.ogg", 10, 6)
            end

            // Create a bank for the player's loadout, and set its contents.
            local loadoutBank = CreateBank(3)
            PokeByte(loadoutBank, 0, 6)
            PokeByte(loadoutBank, 1, primaryWeaponLoadout[id])
            PokeByte(loadoutBank, 2, secondaryWeaponLoadout[id])
            SendRawPacket(id, loadoutBank)
            FreeBank(loadoutBank)

            // If the player type is spectator, send a packet with the true boolean.
            if GetPlayerType(id) == 0
                sendPacketWithType(id, 7, 1)
            end

            // If the player is an admin or owner, send a packet and print a message.
            if PlayerRanks[id] > 2 then
                sendPacket(id, 3)
                print("[JOIN] SteamID Authed as an admin (for " + id + ")")
            end

            // If the player is a Patreon supporter, send a supporter message. Otherwise, send default message.
            if PlayerRanks[id] == 1 then
                SetPlayerMessage(id, "Thanks for your support " + GetPlayerNickname(id) + "!", 1500)
            else
                SetPlayerMessage(id, "This server uses custom commands in-game. Type /help in chat to get started.", 1500)
            end

            // If any event type is active, concat previous message and send the message.
            if SmallRound == 1 or BigRound == 1 or peanutRound == 1 then
                local message = "[Server] Hello! Currently this is an event round, and the current events are: "
                
                if SmallRound == 1 
                    message = message + "50% Size, "
                end
                
                if BigRound == 1 
                    message = message + "125% Size, "
                end

                if peanutRound == 1 
                    message = message + "3 Peanuts and all class-d's, "
                end

                SendMessage(id, message + "please enjoy.")
            end
        case 2
            if not PlayerRanks[id] > 2
                return
            end

            eventType = PeekByte(bnk,1)
            select eventType
                case 1
                    if roundStarted == 0 and SmallRound == 0 then
                        SmallRound = 1
                        ServerMessage("%color|2,115,132|% [Server] !! BONUS ROUND !! 50% SIZE - Admin: " + GetPlayerNickname(id))
                    else
                        SendMessage(id, "%color|204,36,34|% [ERROR] Error setting event.")
                    end
                case 2
                    if roundStarted == 0 and peanutRound == 0 then
                        peanutRound = 1
                        ServerMessage("%color|2,115,132|% [Server] !! BONUS ROUND !! PEANUT ROUND - Admin: " + GetPlayerNickname(id))
                    else
                        SendMessage(id, "%color|204,36,34|% [ERROR] Error setting event.")
                    end
                case 3
                    if roundStarted == 0 and BigRound == 0 then
                        BigRound = 1
                        ServerMessage("%color|2,115,132|% [Server] !! BONUS ROUND !! 125% SIZE - Admin: " + GetPlayerNickname(id))
                    else
                        SendMessage(id, "%color|204,36,34|% [ERROR] Error setting event.")
                    end                
                case 6
                    if roundStarted == 0 and instaMDRound == 0 then
                        instaMDRound = 1
                        ServerMessage("%color|2,115,132|% [Server] !! BONUS ROUND !! INSTANT M.D. GRADUATION - Admin: " + GetPlayerNickname(id))
                    else
                        SendMessage(id, "%color|204,36,34|% [ERROR] Error setting event.")
                    end
            end
        case 3 // This case is used to receive player requests for weapon loadouts for MTF/CI.
            // Retrieve the primary and secondary weapon loadouts requested by the player.
            local primaryWeaponLBank = PeekByte(bnk, 1)
            local secondaryWeaponLBank = PeekByte(bnk, 2)
            local explosiveWeaponLBank = PeekByte(bnk, 3)

            if ValidateCheckWeaponData(primaryWeaponLBank, secondaryWeaponLBank, explosiveWeaponLBank)

                // Get the Steam ID of the player making the request.
                steamid = GetPlayerSteamID(id)

                if primaryWeaponLoadout[id] != primaryWeaponLBank
                    primaryWeaponLoadout[id] = primaryWeaponLBank
                end

                if secondaryWeaponLoadout[id] != secondaryWeaponLBank
                    secondaryWeaponLoadout[id] = secondaryWeaponLBank
                end

                if explosiveWeaponLoadout[id] != explosiveWeaponLBank
                    explosiveWeaponLoadout[id] = explosiveWeaponLBank
                end

                local primaryWeaponLBankSQL = primaryWeaponLBank + 1
                local secondaryWeaponLBankSQL = secondaryWeaponLBank + 1
                local explosiveWeaponLBankSQL = explosiveWeaponLBank + 1

                ExecuteSQLPreparedProcedure("UpdateWeaponLoadout", "'" + steamid + "', '" + primaryWeaponLBankSQL + "', '" + secondaryWeaponLBankSQL + "', '" + explosiveWeaponLBankSQL + "'")
            end
        case 4 // Trigger to spawn MTF/CI using newSpawnWave system
            if not PlayerRanks[id] > 2
                return
            end

            if roundStarted == 1 then
                RemoveTimer(mtfSpawnWaveTimerID)
                mtfSpawnWaveTimerID = 0 // In case something else runs...?
                spawnMtfChaosUnits()
                mtfSpawnWaveTimerID = CreateTimer("startMtfSpawnLoop", newSpawnWaveTimer, 1)
                remainingSpawnTime = MilliSecs() + newSpawnWaveTimer
            else
                SendMessage(id, "%color|204,36,34|% [ERROR] Error setting event, round not started.")
            end
        case 5
            if not PlayerRanks[id] > 2
                return
            end

            if roundStarted == 1 then
                ActivateWarheads()
            else
                SendMessage(id, "%color|204,36,34|% [ERROR] Error, round not started.")
            end
        case 6
            if not PlayerRanks[id] > 2
                return
            end

            if roundStarted == 1 then
                DeactivateWarheads()
            else
                SendMessage(id, "%color|204,36,34|% [ERROR] Error, round not started.")
            end
        case 7
            if not PlayerRanks[id] > 1
                return
            end
            
            print("[CLIENT CACHE] PlayerID: " + id + " is making an attempt to cache playernames from playerlist.")
            for i = 1; i < MAX_PLAYERS; ++i
                if IsPlayerConnected(i) then
                    playerName = GetPlayerNickname(i)
                    sendPlayersNames(id, playerName, i)
                end
            end
        case 8
            if not PlayerRanks[id] > 1
                return
            end

            local type = PeekByte(bnk,1)
            local pids = PeekByte(bnk,2)

            // lil check
            if pids == 0 or pids > MAX_PLAYERS then
                return
            end

            print("[ADMIN GUI] Processing admin command " + type + " from " + id + " targeting " + pids)

            if not IsPlayerConnected(pids)
                SendMessage(id,"%color|204,36,34|% [SERVER] That player isn't connected anymore! Targeted: " + pids)
                return     
            end
            local getEntityP = GetPlayerEntity(pids)
            local getEntityAd = GetPlayerEntity(id)
            local enX = EntityX(getEntityP)
            local enY = EntityY(getEntityP)
            local enZ = EntityZ(getEntityP)
            local enXAd = EntityX(getEntityAd)
            local enYAd = EntityY(getEntityAd)
            local enZAd = EntityZ(getEntityAd)
            local roomId = GetPlayerRoomID(pids)
            local roomIdAd = GetPlayerRoomID(id)

            select type
                case 1
                    // teleport to
                    SendMessage(id,"%color|2,115,132|% [Server] Teleported to " + GetPlayerNickname(pids) + " [" + pids + "]")
                    SetPlayerPosition(id,GetRoomName(roomid),enX,enY,enZ)
                    sendDetails(id, pids)
                case 2
                    // telport player to
                    SendMessage(id,"%color|2,115,132|% [Server] Teleported " + GetPlayerNickname(pids) + " [" + pids + "] to you!")
                    SetPlayerPosition(pids,GetRoomName(roomIdAd),enXAd,enYAd,enZAd)
                    sendDetails(id, pids)
                case 3
                    // kick player
                    SendMessage(id,"%color|2,115,132|% [Server] Kicked " + GetPlayerNickname(pids) + " [" + pids + "]!")
                    Kick(pids,"%color|2,115,132|% [Server] Admin " + GetPlayerNickname(id) + " kicked the player " + GetPlayerNickname(pids))
                case 4
                    // ban player
                    local time = PeekInt(bnk,3)
                    local steamid = GetPlayerSteamID(pids)
                    
                    if time > 0
                        ExecuteSQLPreparedProcedure("InsertPlayerBans", "'', '" + steamid + "', '2', '" + time + "'")
                        SendMessage(id,"[Server] Banned " + GetPlayerNickname(pids) + " [" + pids + "]!")
                        Kick(pids, "%color|2,115,132|% [Server] Admin " + GetPlayerNickname(id) + " banned the player " + GetPlayerNickname(pids))
                    else
                        SendMessage(id, "%color|2,115,132|% [Server][BAN] Set a time that is greater than 0.")
                    end
                case 5
                    // size player
                    local sizess = PeekByte(bnk,3)
                    changeplayersize(pids,sizess)
                    SendMessage(id, "%color|2,115,132|% [Server] Set " + id + "'s size to " + sizess + "%")
                    SendMessage(pids, "%color|2,115,132|% [Server] An admin has scaled you to " + sizess + "%")
                case 6
                    // kill player
                    SendMessage(id,"%color|2,115,132|% [Server] Killed " + GetPlayerNickname(pids) + " [" + pids + "]!")
                    SetPlayerType(pids, 0)
                    sendDetails(id, pids)
                case 7
                    // give role
                    local roleidss = PeekByte(bnk,3)
                    SendMessage(id,"%color|2,115,132|% [Server] Set " + GetPlayerNickname(pids) + " [" + pids + "]'s role to " + roleidss + "!")
                    SetPlayerType(pids, roleidss)
                    sendDetails(id, pids)
                case 8
                    // give details
                    sendDetails(id, pids)
                case 9
                    // Permanent ban of players IP and SteamID3
                    local playerIp = GetPlayerSteamID(pids)
                    steamid = GetPlayerSteamID(pids)

                    ExecuteSQLPreparedProcedure("InsertPlayerBans", "'"+ playerIp +"', '" + steamid + "', '1', '0'")
                    SendMessage(id,"%color|2,115,132|% [Server] IP Banned " + GetPlayerNickname(pids) + " [" + pids + "]!")
                    Kick(pids, "%color|2,115,132|% [Server] Admin " + GetPlayerNickname(id) + " perma-banned the player " + GetPlayerNickname(pids))
            end
        case 9 // Send the name of server to player first for misc. and important reasons.
            sendString(1, serverName, id)
        case 10 // Client -> Server request for spawnwave timer information.
            if remainingSpawnTime > 0 then
                local differenceSpawnTime = (remainingSpawnTime - MilliSecs())
                sendPacketWithDataInt1(id, 8, differenceSpawnTime)
            end
        case 13
            if not PlayerRanks[id] > 2
                return
            end
            
            local types = PeekByte(bnk,1)
            local pidss = PeekByte(bnk,2)

            // lil check
            if pidss == 0 or pidss > MAX_PLAYERS then
                return
            end

            print("[ADMIN GUI] Processing admin command 13 - " + types + " from " + id + " targeting " + pidss)

            if not IsPlayerConnected(pidss)
                SendMessage(id,"%color|204,36,34|% [Server] That player isn't connected anymore! Targeted: " + pidss)
                return     
            end

            local data = PeekInt(bnk,3)

            select types
                case 1
                    SetPlayerFakeHealth(pidss, data)
                    SendMessage(id,"%color|2,115,132|% [Server] Set " + GetPlayerNickname(pidss) + " [" + pidss + "]'s health to " + data + "!")

            end
        case 21
            if not PlayerRanks[id] > 1
                return
            end
            
            local mutepid = PeekByte(bnk,2)

            // lil check
            if mutepid == 0 or mutepid > MAX_PLAYERS then
                return
            end

            print("[ADMIN GUI] Processing admin command 21 from " + id + " targeting " + mutepid)

            if IsPlayerConnected(mutepid)
                steamid = GetPlayerSteamID(mutepid)
                muteBoolType = hasPlayerGlobalMute[mutepid]
                select muteBoolType
                    case 0
                        hasPlayerGlobalMute[mutepid] = 1
                        ExecuteSQLPreparedProcedure("UpdateMuteStatus", "'" + steamid + "', '2'")
                        SendMessage(id,"%color|2,115,132|% [Server] That player has been perma-muted! Targeted: " + mutepid)
                    case 1
                        hasPlayerGlobalMute[mutepid] = 0
                        ExecuteSQLPreparedProcedure("UpdateMuteStatus", "'" + steamid + "', '1'")
                        SendMessage(id,"%color|2,115,132|% [Server] That player has been unmuted! Targeted: " + mutepid)
                end
            else
                SendMessage(id,"%color|204,36,34|% [Server] That player isn't connected anymore! Targeted: " + mutepid)
                return     
            end
    end
end