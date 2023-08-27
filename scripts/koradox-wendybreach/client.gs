#PLAYERSCRIPT

global mScale = float(float(GetMonitorHeight())/1080.0)
global wScale = float(GetMonitorWidth())
global gamefont = LoadFont("cour", 24, 1,0,0)
global prevPlayerCam = 0
global spawnwaveCountdown = 0
global brrtzCountdownAvoider
global currentPlayerType

public def OnDisconnect()
    FreeFont(gamefont)
end

////////////////////////////////////////
//     Main Client/Game Callbacks     //
//               Block                //
//                                    //
////////////////////////////////////////

public def OnUpdate()
    if GetPlayerCamera() != prevPlayerCam then
        sendPacket(1)
        prevPlayerCam = GetPlayerCamera()
    end

    if currentPlayerType == 0 then
        if spawnwaveCountdown > 0 then
            local timeTilSpawnwaveSeconds = ((spawnwaveCountdown - MilliSecs()) / 1000) % 60
            local timeTilSpawnwaveMinutes = ((spawnwaveCountdown - MilliSecs()) / 1000) / 60
            local spookyCountdownSFX = 0
            
            if timeTilSpawnwaveSeconds < 10
                spookyCountdownSFX = 1
                timeTilSpawnwaveSeconds = "0" + timeTilSpawnwaveSeconds
            end
            
            SetFont(gamefont)
            text(wScale / 2, 50.0 * mscale, "You will respawn in: " + timeTilSpawnwaveMinutes + ":" + timeTilSpawnwaveSeconds, true, false)
            
            if timeTilSpawnwaveMinutes == 0 and spookyCountdownSFX == 1 and brrtzCountdownAvoider != timeTilSpawnwaveSeconds
                brrtzCountdownAvoider = timeTilSpawnwaveSeconds
                CreateLocalSound("SFX\Radio\Buzz.ogg", 5.0)
            end
        end
    end
end

////////////////////////////////////////
//     Network Functions/Callbacks    //
//               Block                //
//                                    //
////////////////////////////////////////

////// NETWORK CALLBACK //////

public def OnReceiveRawPacket(bnk)
    if BankSize(bnk) > 0 then
        b = PeekByte(bnk, 0)
        select b
            case 1 // Basic Info - i.e. Role, ID, maybe something else in the future.
                data2 = PeekInt(bnk, 1)
                select data2
                    case 1
                        currentPlayerType = PeekInt(bnk, 5)
                        if currentPlayerType == 0
                            sendPacket(2)
                        end
                end
            case 2 // Recieves time in milliseconds; used for spawnwave timer
                spawnwaveCountdown = PeekInt(bnk, 1)
                spawnwaveCountdown = (spawnwaveCountdown + MilliSecs())
        end
    end
end

////// NETWORK FUNCTIONS //////

public def sendPacket(type)
    local bank = CreateBank(1)
    PokeByte(bank,0,type)
    SendRawPacket(bank)
    FreeBank(bank)
end

////////////////////////////////////////
//            END OF CODE             //
//              Block                 //
//                                    //
////////////////////////////////////////