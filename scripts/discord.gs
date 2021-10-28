#include "includes\multiplayer_core.inc"

global bot = plugin_load("discord_bot.dll")
plugin_call(bot, "start_bot", 0)

public def OnServerStart(port)
end

global prevPlayerCount = -1

public def OnServerUpdate()
    j = 0
    for i=1; i<=MAX_PLAYERS; ++i
        if IsPlayerConnected(i) then
            j++
        end
    end
    if not j == prevPlayerCount then
        SetStatus("Players Online: " + j)
        SetList()
        prevPlayerCount = j
    end
end

def SetList()
    data = "```\nPlayers:"
    for i=1; i<=MAX_PLAYERS; ++i
        if IsPlayerConnected(i) then
            data = data + "\n" + GetPlayerNickname(i)
        end
    end
    data = data + "\n```"
    fs = WriteFile("bot_players.txt")
    WriteLine(fs, data)
    CloseFile(fs)
end

def SetStatus(status)
    fs = WriteFile("bot_status.txt")
    WriteLine(fs, status)
    CloseFile(fs)
    plugin_call(bot, "bot_status", 0)
end