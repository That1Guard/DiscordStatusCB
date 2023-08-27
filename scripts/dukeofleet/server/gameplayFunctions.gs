def SetPlayerLoadout(playerid, tempPrimaryID, tempSecondaryID, tempExplosiveID) // TODO: (@That1Guard) Complete the integration of explosive loadout
    select tempPrimaryID
        case 0 // Random draw
            if rand(0, 1)
                primaryWeaponItemID[playerid] = CreateItem("M4A4", "m4a4")
            else if rand(0, 1)
                primaryWeaponItemID[playerid] = CreateItem("SPAS-12", "spas12")
            else if rand(0, 1)
                primaryWeaponItemID[playerid] = CreateItem("FN P90", "p90")
            else
                primaryWeaponItemID[playerid] = CreateItem("HK-G36", "hkg36")
            end
        case 1 // M4A4
            primaryWeaponItemID[playerid] = CreateItem("M4A4", "m4a4")
        case 2 // SPAS-12
            primaryWeaponItemID[playerid] = CreateItem("SPAS-12", "spas12")
        case 3 // FN P90
            primaryWeaponItemID[playerid] = CreateItem("FN P90", "p90")
        case 4 // HK-G36
            primaryWeaponItemID[playerid] = CreateItem("HK-G36", "hkg36")
    end
    select tempSecondaryID
        case 0 // Random draw
            if rand(0, 1)
                secondaryWeaponItemID[playerid] = CreateItem("USP Tactical", "usp")
            else if rand(0, 1)
                secondaryWeaponItemID[playerid] = CreateItem("Desert Eagle", "deagle")
            else
                secondaryWeaponItemID[playerid] = CreateItem("MP5-SD", "mp5sd")
            end
        case 1 // USP Tactical
            secondaryWeaponItemID[playerid] = CreateItem("USP Tactical", "usp")
        case 2 // Desert Eagle
            secondaryWeaponItemID[playerid] = CreateItem("Desert Eagle", "deagle")
        case 3 // MP5-SD
            secondaryWeaponItemID[playerid] = CreateItem("MP5-SD", "mp5sd")
		case 4 // Combat knife
            secondaryWeaponItemID[playerid] = CreateItem("Combat knife", "knife")
    end
    select tempExplosiveID
        case 0 // Random draw
            if rand(0, 1)
                // explosiveWeaponItemID[playerid] =
            else if rand(0, 1)
                // explosiveWeaponItemID[playerid] =
            else
                // explosiveWeaponItemID[playerid] =
            end
        case 1 // Frag
            // explosiveWeaponItemID[playerid] = 
        case 2 // Smoke
            // explosiveWeaponItemID[playerid] = 
        case 3 // Flash
            // explosiveWeaponItemID[playerid] = 
    end
    SetItemPicker(playerid, primaryWeaponItemID[playerid])
    SetItemPicker(playerid, secondaryWeaponItemID[playerid])
    // SetItemPicker(playerid, explosiveWeaponItemID[playerid])
end

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

def MyHelp(playerid, arguement)
    arguement = Lower(arguement)
    if arguement == "mtf" or arguement == "guard"
        SendMessage(playerid, "%color|2,115,132|% ---=--- ---=---")
        SendMessage(playerid, "%color|2,115,132|% Help Page: /help mtf/guard")
        SendMessage(playerid, "%color|2,115,132|% /cc or /cameracheck - Check cameras for Chaos/Class D.")
        SendMessage(playerid, "%color|2,115,132|% ---=--- ---=---")
    else if arguement == "general"
        SendMessage(playerid, "%color|2,115,132|% ---=--- ---=---")
        SendMessage(playerid, "%color|2,115,132|% Help Page: /help general")
        SendMessage(playerid, "%color|2,115,132|% /time - Check Epoch Time")
        SendMessage(playerid, "%color|2,115,132|% /steamid [playerid] - Checks connected playerid's SteamId. Default: Your steamid.")
        SendMessage(playerid, "%color|2,115,132|% /donate - Gives you donation link to view " + serverName + " Donation site.")
        SendMessage(playerid, "%color|2,115,132|% /discord - Gives you discord invite link to discord server.")
        SendMessage(playerid, "%color|2,115,132|% ---=--- ---=---")
    else
        SendMessage(playerid, "%color|2,115,132|% ---=--- ---=---")
        SendMessage(playerid, "%color|2,115,132|% Help Page: /help")
        SendMessage(playerid, "%color|2,115,132|% To use /help, please provide one of the roles below.")
        SendMessage(playerid, "")
        SendMessage(playerid, "%color|2,115,132|% Roles: general, mtf, guard")
        SendMessage(playerid, "%color|2,115,132|% Example: /help general")
        SendMessage(playerid, "%color|2,115,132|% To request admin assistance please use /report")
        SendMessage(playerid, "%color|2,115,132|% Example: /report help i'm stuck")
        SendMessage(playerid, "%color|2,115,132|% ---=--- ---=---")
    end
end

def paintro()
    if roundStarted == 0
        randomi = rand(1,7)
        CreateSound("SFX\Room\Intro\PA\scripted\announcement" + randomi + ".ogg",  0, 0, 0, 99999, 2)
    end
end

def contain173pa()
    CreateSound("SFX\Character\MTF\Announc173Contain.ogg",  0, 0, 0, 99999, 1.5)
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

public def SendAdminMessage(textMessagess)
    for i=1; i<=MAX_PLAYERS; ++i
        if IsPlayerConnected(i) and IsPlayerAdmin(i)
            SendMessage(i,textMessagess)
        end
    end
end