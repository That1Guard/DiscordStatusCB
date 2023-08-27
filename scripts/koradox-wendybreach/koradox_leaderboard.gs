#include "includes\multiplayer_core.inc"

#define public function = def
#define function def

global MysqlConnection = 0

// Declare PlayerLevelExp and globalExpModifier
global PlayerLevelExp       = [MAX_PLAYERS, SE_INT]
global isSCP049             = [1, SE_INT]
global globalExpModifier    = 1.0
global isExpPunishEnable    = 0

// Declare a global timer variable to track the time played for each player
global TimePlayedTimer = [MAX_PLAYERS, SE_INT]

public def OnScriptLoaded()
    local host = ""
    local user = ""
    local database = ""
    local password = ""
    if FileType("MySQL/Settings.ini") == 1 then
        host  = GetINIValue("MySQL/Settings.ini", "connection", "host", "missing")
        user = GetINIValue("MySQL/Settings.ini", "connection", "username", "missing")
        database = GetINIValue("MySQL/Settings.ini", "connection", "database", "missing")
        password = GetINIValue("MySQL/Settings.ini", "connection", "password", "missing")
        isExpPunishEnable = int(GetINIValue("MySQL/Settings.ini", "settings", "password", "0"))
        globalExpModifier = int(GetINIValue("MySQL/Settings.ini", "modifiers", "expModifier", "1"))
    else
        print("[MYSQL] 'MySQL/Settings.ini' is missing. This server will create one.")
        DatabaseInput("connection", "host","missing", 0)
        DatabaseInput("connection", "username", "missing", 0)
        DatabaseInput("connection", "database", "missing", 0)
        DatabaseInput("connection", "password", "missing", 0)
        DatabaseInput("settings", "enabledExpPunishment", "1", 1)
        DatabaseInput("modifiers", "expModifier", "1", 1)
        print("[MYSQL] The server will shut down in 5 seconds. Please configure the settings and try again.")
        delay(5000)
        CloseApp()
        return 0
    end

    print("[LEADERBOARD] Exp Punishment Enabled: " + isExpPunishEnable)
    print("[LEADERBOARD] Global Exp Modifier: " + globalExpModifier)

    // Connect to MySQL database using specified connection details
    MysqlConnection = connectmysql(host, user, database, password)
    
    // If the connection fails, print an error message and close the application
    if MysqlConnection == 0 then
        print("[MYSQL] Failed to connect to MySQL. The server will shut down in 5 seconds.")
        delay(5000)
        CloseApp()
        return 0
    end
    
    print("[MYSQL] Successfully connected to MySQL [STATUS: " + MysqlConnection + "]")
end

public def OnServerStart(port)
    CreateTimer("checkcommand", 1500, 1)
end

public def OnPlayerConnect(playerid)
    // Retrieve the player's Steam ID and their perms.
    local steamid = int(GetPlayerSteamID(playerid))
    local PlayerAdmin = 0
    local PlayerOwner = 0
    
    if FileType("DataBase/" + steamid + ".ini") == 1 then
        PlayerAdmin = int(GetINIValue("DataBase/" + steamid + ".ini", steamid, "admin", "0"))
        PlayerOwner = int(GetINIValue("DataBase/" + steamid + ".ini", steamid, "owner", "0"))
    end
    
    // Check if the MySQL connection is still active
    if SQLConnected(MysqlConnection) == 1 then
        // Retrieve the player's level and level experience data from the database
        local query = SQLQuery(mysqlconnection, "SELECT `levels` FROM `profiles` WHERE `steamid` = '" + steamid + "'")
        local PlayerLevel = 1

        // If the query is successful, store the data in the global arrays
        if query > 0 then
            if SQLRowCount(query) > 0 then
                // Fetch the row and read the level and level experience data using the ReadSQLField function 
                local row = SQLFetchRow(query)
                PlayerLevel = ReadSQLField(row, "levels")
                // Free resources used by the row
                FreeSQLRow(row)
            else
                // If no data is found, set the level to 1 and level experience to 0
                print("[LEADERBOARD:NEW] Row fow Steam ID " + steamid + " is missing. Creating record...")
                AddProfile(playerid)
            end

            // Free resources used by the query
            FreeSQLQuery(query)

            ChangePlayerTag(playerid, "Level " + PlayerLevel, 150, 33, 150)
            playertext(playerid, "Level: " + PlayerLevel, 1.17, 9838998)
        else
            // If the query fails, print an error message
            print("[LEADERBOARD] Failed to retrieve player data for Steam ID " + steamid)
        end
    else
        print("[LEADERBOARD][MYSQL] MySQL connection is not active")
    end

    if PlayerAdmin == 1 or PlayerOwner == 1
        ToggleProfileVisibility(playerid, 1)
    end

    // Initialize the timer for the player
    TimePlayedTimer[playerid] = int(getunixtime())
end

public def OnPlayerDisconnect(playerid, message)
    // Calculate the time played for the player in seconds
    local timePlayed = int(getunixtime()) - TimePlayedTimer[playerid]

    // Call the AddTimePlayed function to add the time played to the database
    AddTimePlayed(playerid, timePlayed)
end

public def OnPlayerKillPlayer(playerid, killedid, weaponid)
    local killerType = GetPlayerType(playerid)
    local experienceCatch = 0
    // Add ### level experience points to the player who killed another player
    // Seperate into role categories should we use it for something more later
    select killerType
        case TYPE_CLASSD, TYPE_SCIENTIST, TYPE_JANITOR, TYPE_WORKER
            experienceCatch = 50 * globalExpModifier
            PlayerLevelExp[playerid] = experienceCatch
        case TYPE_NTF, TYPE_CHAOS, TYPE_GUARD
            experienceCatch = 50 * globalExpModifier
        case TYPE_173, TYPE_049, TYPE_939, TYPE_096, TYPE_860, TYPE_035, TYPE_106
            experienceCatch = 100 * globalExpModifier
    end

    // Add ### level experience points to the player who killed another player and to the array
    UpdateDeathsKills(playerid, "kill")
    UpdateLevelExp(playerid, experienceCatch, "+", 1)
end

def OnPlayerHitPlayer(playerid, hitid, damage, weaponid)
    local killerType = GetPlayerType(playerid)
    local experienceCatch = 0
    select killerType
        case TYPE_ZOMBIE, TYPE_966, TYPE_860
            experienceCatch = 20 * globalExpModifier
            UpdateLevelExp(playerid, experienceCatch, "+", 1)
    end
end

public def OnPlayerGetNewRole(playerid, previoustype, newtype)
    if not previoustype == 17
        if not previoustype == 0
            local experienceCatch = 0
            if newtype == TYPE_035
                experienceCatch = 100 * globalExpModifier
            else if newtype == TYPE_ZOMBIE
                experienceCatch = 100 * globalExpModifier
            else 
                experienceCatch = 50 * globalExpModifier
            end

            // Subtract ### level experience points from the player who was killed
            if isExpPunishEnable == 1
                UpdateLevelExp(playerid, experienceCatch, "-", 1)
            end

            UpdateDeathsKills(playerid, "death")
        end
    else
        PlayerLevelExp[playerid] = 209
    end
end

public def OnPlayerEscape(playerid, currentType, previousType)
    local experienceCatch = PlayerLevelExp[playerid] * globalExpModifier

    UpdateLevelExp(playerid, experienceCatch, "+", 1.2)

    for i = 0; i < MAX_PLAYERS; ++i
        if IsPlayerValid(i) == 1
            if GetPlayerType(i) == currentType
                UpdateLevelExp(i, 200 * globalExpModifier , "+", 1)
            end
        end
    end

    PlayerLevelExp[playerid] = 0
end

public def OnPlayerTakeItem(playerid, itemid, itemtemplateid)
//    print(GetItemTemplateName(itemtemplateid) + " " + GetItemTemplateTempName(itemtemplateid))
    temppickupname = GetItemTemplateTempName(itemtemplateid)
    if temppickupname == "paper" then
        local typeId = GetPlayerType(playerid)
        select typeId
            case TYPE_CLASSD, TYPE_SCIENTIST, TYPE_JANITOR, TYPE_WORKER 
                experienceCatch = 50 * globalExpModifier
                SendMessage(playerid, "%color|7,68,207|% You secured Foundation Intel.")
                UpdateLevelExp(playerid, experienceCatch, "+", 1)
                RemoveItem(itemid)
                return 0  // Return 0 so we don't get an "Object Not Found" error.
        end
    end
end

//      FUNCTIONS      \\

// Discord stuff

def checkcommand()
    fs = ReadFile("Discord/bot_leaderboard_cmd.txt")
    local line = ReadLine(fs)
    CloseFile(fs)
    if len line != 0 then
        fs = WriteFile("Discord/bot_leaderboard_cmd.txt")
        CloseFile(fs)
    else
        return
    end
    local spl = SplitStr(line, " ")
    if spl[0] == "xp"
        operation = spl[1]
        steamid = Int(spl[2])
        value = Int(spl[3])
        OnSQLCommand(operation, steamid, value)
    end

end

def OnSQLCommand(operation, steamid, value)
    select operation
        case "give"
            UpdateLevelExp(steamid, value, "+", 1)
        case "take"
            UpdateLevelExp(steamid, value, "-", 1)
        case "visibility"
            ToggleProfileVisibility(steamid, value)
    end
end

////

def AddProfile(playerid)
    local steamid = int(GetPlayerSteamID(playerid))

    // Check if the MySQL connection is still active
    if SQLConnected(MysqlConnection) == 1 then
        // Call the stored procedure to add the new profile record to the database
        local query = SQLQuery(mysqlconnection, "CALL AddProfile(" + steamid + ")")

        if query > 0 then
            print("[LEADERBOARD] Successfully added new profile record for Steam ID " + steamid)
        else
            print("[LEADERBOARD] Failed to add new profile record for Steam ID " + steamid)
        end

        // Free resources used by the query
        FreeSQLQuery(query)
    else
        print("[LEADERBOARD][MYSQL] MySQL connection is not active")
    end
end

def ToggleProfileVisibility(playerid, hide)
    if playerid > 0 and playerid < MAX_PLAYERS
        local steamid = int(GetPlayerSteamID(playerid))
    else
        steamid = int(playerid)
    end

    // Check if the MySQL connection is still active
    if SQLConnected(MysqlConnection) == 1 then
        // Update the `hidden` column for the specified `steamid`
        local query = SQLQuery(mysqlconnection, "UPDATE `profiles` SET `hidden` = '" + hide + "' WHERE `steamid` = '" + steamid + "'")
        
        // If the query is successful, print a message
        if query > 0 then
            print("[LEADERBOARD] Successfully updated the visibility of profile for Steam ID " + steamid)
        else
            // If the query fails, print an error message
            print("[LEADERBOARD] Failed to update the visibility of profile for Steam ID " + steamid)
        end
    else
        print("[LEADERBOARD][MYSQL] MySQL connection is not active")
    end
end

def UpdateLevelExp(playerid, value, operation, expModifier)
    if playerid > 0 and playerid < MAX_PLAYERS
        local steamid = int(GetPlayerSteamID(playerid))
    else
        steamid = int(playerid)
    end
    
    // Check if the MySQL connection is still active
    if SQLConnected(MysqlConnection) == 1 then
        // Determine the operation to perform based on the value of the operation parameter
        if operation == "+"
            // Add the value to the current level experience, multiplied by the experience modifier
            local query = SQLQuery(mysqlconnection, "UPDATE `profiles` SET `levelsexp` = `levelsexp` + " + value * expModifier + " WHERE `steamid` = '" + steamid + "'")
            SendMessage(playerid, "%color|7,68,207|% You earned " + value * expModifier + " XP! ")
        else if operation == "-"
            // Subtract the value from the current level experience, multiplied by the experience modifier
            query = SQLQuery(mysqlconnection, "UPDATE `profiles` SET `levelsexp` = `levelsexp` - " + value * expModifier + " WHERE `steamid` = '" + steamid + "'")
            SendMessage(playerid, "%color|7,68,207|% You lost " + value * expModifier + " XP! ")
        else
            // If an invalid operation is specified, return without performing any updates
            print("[LEADERBOARD] Failed from invalid operation for " + steamid + ". Arguement: " + operation)
            return 0
        end

        // If the query is successful, print a message and trigger the `UpdateMaxLevelExp` stored procedure
        if query > 0 then
            print("[LEADERBOARD] Successfully updated level experience for Steam ID " + steamid)
        
            // Call the `UpdateMaxLevelExp` stored procedure using the steamid variable
            local procedure = SQLQuery(mysqlconnection, "CALL `UpdateMaxLevelExp`(" + steamid + ")")
            FreeSQLQuery(procedure)

        else
            // If the query fails, print an error message
            print("[LEADERBOARD] Failed to update level experience for Steam ID " + steamid)
        end

        // Free resources used by the query
        FreeSQLQuery(query)
    else
        print("[LEADERBOARD][MYSQL] MySQL connection is not active")
    end
end

def AddTimePlayed(playerid, timePlayed)
    local steamid = int(GetPlayerSteamID(playerid))
    
    // Check if the MySQL connection is still active
    if SQLConnected(MysqlConnection) == 1 then
        // Call the stored procedure to add the time played data to the database
        local query = SQLQuery(mysqlconnection, "CALL AddTimePlayed(" + steamid + "," + timePlayed + ")")

        if query > 0 then
            print("[LEADERBOARD] Successfully added time played data for Steam ID " + steamid)
        else
            print("[LEADERBOARD] Failed to add time played data for Steam ID " + steamid)
        end

        // Free resources used by the query
        FreeSQLQuery(query)
    else
        print("[LEADERBOARD][MYSQL] MySQL connection is not active")
    end
end

def UpdateDeathsKills(playerid, operation)
    local steamid = int(GetPlayerSteamID(playerid))
    // Check if the MySQL connection is still active
    if SQLConnected(MysqlConnection) == 1 then
        // Determine the operation to perform based on the value of the operation parameter
        if operation == "death"
            // Increment the player's death count by 1
            local query = SQLQuery(mysqlconnection, "UPDATE `profiles` SET `deaths` = `deaths` + 1 WHERE `steamid` = '" + steamid + "'")

            if query > 0 then
                print("[LEADERBOARD] Successfully incremented death count for Steam ID " + steamid)
            else
                print("[LEADERBOARD] Failed to increment death count for Steam ID " + steamid)
            end
        else if operation == "kill"
            // Increment the player's kill count by 1
            query = SQLQuery(mysqlconnection, "UPDATE `profiles` SET `kills` = `kills` + 1 WHERE `steamid` = '" + steamid + "'")

            if query > 0 then
                print("[LEADERBOARD] Successfully incremented kill count for Steam ID " + steamid)
            else
                print("[LEADERBOARD] Failed to increment kill count for Steam ID " + steamid)
            end
        else
            print("[LEADERBOARD] Failed to specify operation")
        end

        // Free resources used by the query
        FreeSQLQuery(query)
    else
        print("[LEADERBOARD][MYSQL] MySQL connection is not active")
    end
end

//Updates the INI database
def DatabaseInput(tag, category, value, doUpdate)
    if FileType("MySQL/Settings.ini") == 0 then
        CloseFile(WriteFile("MySQL/Settings.ini"))
    end
    PutINIValue("MySQL/Settings.ini", tag, category, value)
    if doUpdate == 1
        UpdateINIFile("MySQL/Settings.ini")
    end
end

def IsPlayerValid(pid)
	if MAX_PLAYERS > pid and pid > 0
		return IsPlayerConnected(pid)
	end
	return 0
end

def playertext(plr,txt,y,clr)
    local screen_width = GetPlayerMonitorWidth(plr)/45
    local screen_height = GetPlayerMonitorHeight(plr)
    CreatePlayerText(plr,txt, screen_width, screen_height/y, clr, "Courier New Rus.ttf", 24)
end

// Mysql
def connectmysql(host, user, database, password)
	return OpenSQLStream(host, 3306, user, password, database, 1)
end

// 3rd Party Functions

// By VirtualBrightz
public def SplitStr(text, ch)
    local a = []
    local i = 1
    while true
        local sloc = InStr(text, ch, i)
        if sloc == 0 then
            local l2 = len text
            local st = Mid(text, i, l2 - i + 1)
            addarrayelements(a, 1)
            local lt = len a
            a[lt - 1] = st
            break
        end
        local s = Mid(text, i, sloc - i)
        addarrayelements(a, 1)
        local l = len a
        a[l - 1] = s
        i = sloc + 1
    end
    return a
end