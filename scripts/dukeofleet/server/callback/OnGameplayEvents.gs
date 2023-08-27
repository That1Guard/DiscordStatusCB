public def OnRoundStarted()
    DiscBotLog("[Server]: Round has started.")
    
    if roundStarted == 0 then
        if newSpawnWave
            SetMTFTimer(900000.0)
            SetServerSpawnTimeout(900000.0)

            mtfSpawnWaveTimerID = CreateTimer("startMtfSpawnLoop", newSpawnWaveTimer, 1)
            remainingSpawnTime = MilliSecs() + newSpawnWaveTimer
        end
    end

    if paIntroTimerID != 0
        RemoveTimer(paIntroTimerID)
        paIntroTimerID = 0
    end

    roundStarted = 1
    CreateSound("SFX\Room\Intro\PA\scripted\scripted6.ogg",  0, 0, 0, 99999, 1.5)

    if instaMDMode == 1
        local thereIs049 = 0
        for i = 1; i < currentPlayerCount + 1; ++i
            if CurrentPlayerTypes[i] == TYPE_049
                thereIs049 = 1
            end
        end

        if thereIs049 == 0
            isTheMD = rand(1, currentPlayerCount)
            SetPlayerType(isTheMD, TYPE_049)
        end
    end

    if peanutRound == 1 then
        for i = 1; i < 4; i++
            local makePeanutButter = rand(1, currentPlayerCount)
            PlayerNut[makePeanutButter] = 1
            SetPlayerType(makePeanutButter, 5)
        end
    end
end

public def OnActivateWarheads(playerid)
    if IsPlayerValid(playerid)
        Warhead = 1
    end
end

// This signals when the round ends and, as the name states, the warheads explode.
public def OnWarheadsExplosion()
    if ended == 0 then
        
        if mtfSpawnWaveTimerID != 0 and newSpawnWave
            RemoveTimer(mtfSpawnWaveTimerID)
            mtfSpawnWaveTimerID = 0
        end
        
        SendEndScreen()
        ServerMessage("%color|2,115,132|% [SERVER ALERT] Round over!")
        DiscBotLog("[SERVER ALERT] Round over!")
        return 1
    end
end

public def OnSpawnMTF()
    commandInUse = 1
    CreateTimer("commandnotinuse", 30000, 0)
end