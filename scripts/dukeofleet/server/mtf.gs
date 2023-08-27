//
// ======================================
// ||        MTF Module Functions      ||
// ||               Block              ||
// ======================================
//

def startMtfSpawnLoop()
    SetMTFTimer(900000.0)
    SetServerSpawnTimeout(900000.0)
    if roundStarted == 1 and ended == 0
        print("[MTF] Spawning MTF/Chaos...")
        spawnMtfChaosUnits()
        remainingSpawnTime = MilliSecs() + newSpawnWaveTimer
    end
end

public def spawnMtfChaosUnits()   
    local foundDead = 0
    for i=1; i<MAX_PLAYERS; i++
        if IsPlayerConnected(i) then
            local playerTypeSpawnCallback = GetPlayerType(i)                
            if playerTypeSpawnCallback == 0
                foundDead++
                SetPlayerType(i,1)
                playersJustSpawned[i] = 1
            else
                playersJustSpawned[i] = 0
            end
        end
    end

    if foundDead > 0 then
        spawnwaveJustSpawned = 1
        
        print("[MTF] Dead players being spawned: " + foundDead)
        CreateSound("multiplayer/serversdata/" + serverName + "/audio/MTFAnnounc.ogg",  0, 0, 0, 99999, 1.5)
        ServerMessage("%color|2,115,132|% [SYSTEM ALERT] MTF/CI Spawnwave")
        PlayersDead = 0
        CreateTimer("disableSpawncampProtection", spawnWaveProtection)
    else
        print("[MTF] No dead players found, skipping.")
    end
end

// Flip to turn off anti-spawn camping protections
def disableSpawncampProtection()
    spawnwaveJustSpawned = 0

    // For leaderboard because it's the only way
    PutINIValue("ServerConfig/backend_sharing.ini", "DONOTMODIFY", "enableSpawnCampProtection", "0")
    UpdateINIFile("ServerConfig/backend_sharing.ini")
end