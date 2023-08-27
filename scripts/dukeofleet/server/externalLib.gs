def s2dheartbeat()
    if loadLibrary
        plugin_call(bot, "s2d_heartbeat", 0)
    end
end

public def detectCensor(data)
    if loadLibrary
        plugin_poke(bot, data + Chr(0), P_TYPE_STRING)
        result = plugin_call(bot, "isTextCensorable", P_TYPE_INT)
        return result
    else
        return 0
    end
end

def DiscBotLog(data)
    if loadLibrary == 1 and discordbot == 1
        plugin_poke(bot, data + Chr(0), P_TYPE_STRING)
        plugin_call(bot, "output_log", 0)
    end
end

def DiscBotAdminLog(data)
    if loadLibrary == 1 and discordbot == 1
        plugin_poke(bot, data + Chr(0), P_TYPE_STRING)
        plugin_call(bot, "output_admin_log", 0)
    end
end

def SetStatus(status)
    if loadLibrary == 1 and discordbot == 1
        plugin_poke(bot, status + Chr(0), P_TYPE_STRING)
        plugin_call(bot, "bot_status", 0)
    end
end