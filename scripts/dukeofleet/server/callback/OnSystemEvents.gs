//
// ======================================
// ||     World Generation Callback    ||
// ||               Block              ||
// ======================================
//

public def OnGenerateWorld()
    // Load Discord bot library and start the bot if enabled
    if loadLibrary
        bot = plugin_load("discord_bot.dll")
        if discordbot
            bot = plugin_load("discord_bot.dll")
            plugin_call(bot, "start_bot", 0)

            // Create necessary files if they don't exist
            if FileType("Discord/bot_game_cmd.txt") == 0 then
                CloseFile(WriteFile("Discord/bot_game_cmd.txt"))
            end
            if FileType("Discord/bot_players.txt") == 0 then
                CloseFile(WriteFile("Discord/bot_players.txt"))
            end
            if FileType("ServerConfig/backend_sharing.ini") == 0 then
                CloseFile(WriteFile("ServerConfig/backend_sharing.ini"))
            end
        end
    end

    // Initialize the various death counters
    Dead                 = 0
    SCPSDead             = 0
    FacilityDead         = 0
    MTFDead              = 0
    CIDead               = 0
    ClassDE              = 0
    SciEscape            = 0
    DEscape              = 0
    Warhead              = 0
end

//
// ==============================================
// ||            Server Initialization         ||
// ||                  Block                   ||
// ==============================================
//

public def OnServerStart(port)
    ActivateFilesSending(true)
    if loadLibrary
        CreateTimer("s2dheartbeat", 1000, 1)
        if discordbot
            CreateTimer("discordplayercountupdate", 10000, 1)
            CreateTimer("checkcommand", 1500, 1)
        end
    end
    CreateTimer("play096Sound", 60000, 1)
    CreateTimer("play106Sound", 10000, 1)
    paIntroTimerID = CreateTimer("paintro", 30000, 1)
    
    if newSpawnWave
        SetMTFTickets(0)
        SetChaosTickets(0)
    end

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
                    gateBLockdownID = GetRoomDoor(i, 4)
                    tempDoorID = GetRoomDoor(i, 5)
                    SetDoorOpenState(tempDoorID, 1)
                case "gateaentrance"
                    gateALockdownID = GetRoomDoor(i, 1)
                case "checkpoint1"
                    tempDoorID = GetRoomDoor(i, 0)
                    // SetDoorKeycard(tempDoorID, 4)
                    lightzoneDoorID[lightzoneTotalDoors] = tempDoorID
                    lightzoneTotalDoors = lightzoneTotalDoors + 1
                    
                    tempDoorID = GetRoomDoor(i, 1)
                    // SetDoorKeycard(tempDoorID, 4)
                    lightzoneDoorID[lightzoneTotalDoors] = tempDoorID
                    lightzoneTotalDoors = lightzoneTotalDoors + 1
                case "room2ccont"
                    gatesUnlocked = 0
                case "room2sl"
                    checkpointLightUnlock = 0
            end
        else
            break
        end
    end

    if gatesUnlocked == 1 then
        SetDoorKeycard(gateALockdownID, 3)
        SetDoorKeycard(gateBLockdownID, 3)
    end

    if checkpointLightUnlock == 0
        for i = 0; i < lightzoneTotalDoors; i++
            tempDoorID = lightzoneDoorID[i]
            SetDoorKeycard(tempDoorID, 4)
        end
    end
end

public def OnServerRestart(playerid)
    DiscBotLog("[Server]: Round is restarting...")
    cameraInCheck = 0
    roundStarted = 0
    nutSpawned = false
    Dead = 0
    SmallRound = 0
    BigRound = 0
    peanutRound = 0
    paIntroTimerID = CreateTimer("paintro", 30000, 1)
    ended = 0

    if newSpawnWave
        SetMTFTickets(0)
        SetChaosTickets(0)
    end

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
                    gateBLockdownID = GetRoomDoor(i, 4)
                    tempDoorID = GetRoomDoor(i, 5)
                    SetDoorOpenState(tempDoorID, 1)
                case "gateaentrance"
                    gateALockdownID = GetRoomDoor(i, 1)
                case "checkpoint1"
                    tempDoorID = GetRoomDoor(i, 0)
                    // SetDoorKeycard(tempDoorID, 4)
                    lightzoneDoorID[lightzoneTotalDoors] = tempDoorID
                    lightzoneTotalDoors = lightzoneTotalDoors + 1
                    
                    tempDoorID = GetRoomDoor(i, 1)
                    // SetDoorKeycard(tempDoorID, 4)
                    lightzoneDoorID[lightzoneTotalDoors] = tempDoorID
                    lightzoneTotalDoors = lightzoneTotalDoors + 1
                case "room2ccont"
                    gatesUnlocked = 0
                case "room2sl"
                    checkpointLightUnlock = 0
            end
        else
            break
        end
    end

    if gatesUnlocked == 1 then
        SetDoorKeycard(gateALockdownID, 3)
        SetDoorKeycard(gateBLockdownID, 3)
    end

    if checkpointLightUnlock == 0
        for i = 0; i < lightzoneTotalDoors; i++
            tempDoorID = lightzoneDoorID[i]
            SetDoorKeycard(tempDoorID, 4)
        end
    end
end

public def OnPlayerRconAuthorized(playerid)
    SetList()
    DiscBotAdminLog("[RCON] Player " + GetPlayerNickname(playerid) + " [" + GetPlayerSteamID(playerid) + "] has admined...")
end

public def OnPlayerRconIncorrect(playerid)
    DiscBotAdminLog("[RCON] Player " + GetPlayerNickname(playerid) + " has failed to admined...")
end

public def OnPlayerConsole(playerid, text, isadmin)
    
    if PlayerRanks[playerid] > 2
        DiscBotAdminLog("[Console Command:SUCCESS] " + GetPlayerNickname(playerid) + " [" + GetPlayerSteamID(playerid) + "]: " + text)
    else
        DiscBotAdminLog("[Console Command:WARNING] " + GetPlayerNickname(playerid) + " [" + GetPlayerSteamID(playerid) + "]: Attempted command: `" + text + "`")
    end
    
end