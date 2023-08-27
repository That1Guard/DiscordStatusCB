// ====================================================================
// ||               Multiplayer Core and MySQL Includes              ||
// ====================================================================
#include "..\\..\\includes\\multiplayer_core.inc"
#include "..\\..\\includes\\mysql\\mysql.inc"
#include "constants.gs"

// ====================================================================
// ||                Public and Function Definitions                 ||
// ====================================================================
#define public function = def
#define function def

// ====================================================================
// ||             Import Shared Code: Network and Utility            ||
// ====================================================================
#include "../shared/sharedNetwork.gs"
#include "../shared/sharedUtility.gs"

// ====================================================================
// ||                    Code Modules: Server-Side                   ||
// ====================================================================
//
// ========================
// ||     Database       ||
// ||      Module        ||
// ========================
#include "database.gs"

// ========================
// ||      Discord       ||
// ||      Module        ||
// ========================
#include "discord.gs"

// ========================
// ||    External Lib    ||
// ||      Module        ||
// ========================
#include "externalLib.gs"

// ========================
// ||   Gameplay Evals   ||
// ||      Module        ||
// ========================
#include "gameplayEvals.gs"

// ========================
// || Gameplay Functions ||
// ||      Module        ||
// ========================
#include "gameplayFunctions.gs"

// ========================
// ||  Mobile TaskForce  ||
// ||      Module        ||
// ========================
#include "mtf.gs"

// ========================
// ||      Network       ||
// ||      Module        ||
// ========================
#include "network.gs"

// ==============================
// ||     Player Callbacks     ||
// ||        Sub-Module        ||
// ==============================
#include "callback\\OnPlayerEvents.gs"

// ==============================
// ||   Networking Callbacks   ||
// ||        Sub-Module        ||
// ==============================
#include "callback\\OnNetworkingEvents.gs"

#include "callback\\OnSystemEvents.gs"

#include "callback\\OnGameplayEvents.gs"


//
// =========================================
// ||          Script Initialization      ||
// ||                Block                ||
// =========================================
//

public def OnScriptLoaded()
    // Initialize MySQL connection parameters
    local host = ""
    local user = ""
    local database = ""
    local password = ""

    // Check if the Script settings file exists, read values if available
    if FileType("ScriptSettings/Settings.ini") == 1 then
        host                = GetINIValue("ScriptSettings/Settings.ini", "mysql", "host", "localhost")
        user                = GetINIValue("ScriptSettings/Settings.ini", "mysql", "username", "user")
        database            = GetINIValue("ScriptSettings/Settings.ini", "mysql", "database", "db")
        password            = GetINIValue("ScriptSettings/Settings.ini", "mysql", "password", "pass")
        serverName          = GetINIValue("ScriptSettings/Settings.ini", "settings", "serverName", "0")
        serverDiscord       = GetINIValue("ScriptSettings/Settings.ini", "settings", "serverDiscordLink", "0")
        serverDonation      = GetINIValue("ScriptSettings/Settings.ini", "settings", "serverDonationMessage", "0")
        loadLibrary         = int(GetINIValue("ScriptSettings/Settings.ini", "settings", "loadDLL", "0"))
        discordbot          = int(GetINIValue("ScriptSettings/Settings.ini", "settings", "loadDiscordBot", "0"))
        chatCensor          = int(GetINIValue("ScriptSettings/Settings.ini", "settings", "enableChatCensor", "0"))
        censorNickName      = int(GetINIValue("ScriptSettings/Settings.ini", "settings", "enableNicknameCensor", "0"))
        newSpawnWave        = int(GetINIValue("ScriptSettings/Settings.ini", "spawnwave", "enableNewSpawnWave", "0"))
        newSpawnWaveTimer   = int(GetINIValue("ScriptSettings/Settings.ini", "spawnwave", "setSpawnWaveTimer", "300000"))
        spawnWaveProtection = int(GetINIValue("ScriptSettings/Settings.ini", "spawnwave", "setSpawnProtectionTimer", "60000"))
    else
        // Print missing settings message and prompt for future input needed
        print("[WARNING] Configuration file 'ScriptSettings/Settings.ini' is missing. This server will create one.")
        DatabaseInput("ScriptSettings/Settings", "mysql", "host", "missing", 0)
        DatabaseInput("ScriptSettings/Settings", "mysql", "username", "missing", 0)
        DatabaseInput("ScriptSettings/Settings", "mysql", "database", "missing", 0)
        DatabaseInput("ScriptSettings/Settings", "mysql", "password", "missing", 0)
        DatabaseInput("ScriptSettings/Settings", "settings", "serverName", "YourServerName", 0)
        DatabaseInput("ScriptSettings/Settings", "settings", "serverDiscordLink", "YourServerDiscordLink", 0)
        DatabaseInput("ScriptSettings/Settings", "settings", "serverDonationMessage", "YourDonationMessage", 0)
        DatabaseInput("ScriptSettings/Settings", "settings", "loadDLL", "1", 0)
        DatabaseInput("ScriptSettings/Settings", "settings", "loadDiscordBot", "0", 0)
        DatabaseInput("ScriptSettings/Settings", "settings", "enableChatCensor", "1", 0)
        DatabaseInput("ScriptSettings/Settings", "settings", "enableNicknameCensor", "1", 0)
        DatabaseInput("ScriptSettings/Settings", "spawnwave", "enableNewSpawnWave", "1", 0)
        DatabaseInput("ScriptSettings/Settings", "spawnwave", "setSpawnWaveTimer", "300000", 0)
        DatabaseInput("ScriptSettings/Settings", "spawnwave", "setSpawnProtectionTimer", "60000", 1)

        // Inform the user and initiate the server shutdown
        print("[MYSQL] The server will shut down in 5 seconds. Please configure the settings and try again.")
        delay(5000)
        CloseApp()
        return 0
    end

    // Connect to MySQL database using specified connection details
    MysqlConnection = connectmysql(host, user, database, password)
    
    // Handle connection failure, print an error message and close the application
    if MysqlConnection == 0 then
        print("[" + gettime() + "] [MYSQL] Failed to connect to MySQL. The server will shut down in 5 seconds.")
        delay(5000)
        CloseApp()
        return 0
    end
    
    // Print successful connection message
    print("[" + gettime() + "] [MYSQL] Successfully connected to MySQL [STATUS: " + MysqlConnection + "]")
end

public def OnCreateNPC(npcid)
    print("[DEBUG][OnCreateNPC] NPC created ID: " + npcid + ", Type: " + GetNPCType(npcid))
end

public def OnPlayerRequestNoTarget(playerid)
    print("[DEBUG][OnPlayerRequestNoTarget] PlayerID: " + playerid)
end