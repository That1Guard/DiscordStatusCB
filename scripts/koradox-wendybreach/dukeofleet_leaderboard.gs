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

// Declare packet variable to track the storage of players levels to be sent when ready
global playerLevel2Packet   = [MAX_PLAYERS, SE_INT]

////////////////////////////////////////
//     Main Client/Game Callbacks     //
//               Block                //
//                                    //
////////////////////////////////////////

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
        globalExpModifier = float(GetINIValue("MySQL/Settings.ini", "modifiers", "expModifier", "1"))
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

    // Message to make it more readable on script startup
    local isExpPunishEnableMsg = ""
    if isExpPunishEnable == 1
        isExpPunishEnableMsg = "True"
    else 
        isExpPunishEnableMsg = "False"
    end
    
    print("[" + gettime() + "] [LEADERBOARD] Exp Punishment Enabled: " + isExpPunishEnableMsg)
    print("[" + gettime() + "] [LEADERBOARD] Global Exp Modifier: " + globalExpModifier)

    // Connect to MySQL database using specified connection details
    MysqlConnection = connectmysql(host, user, database, password)
    
    // If the connection fails, print an error message and close the application
    if MysqlConnection == 0 then
        print("[" + gettime() + "] [MYSQL] Failed to connect to MySQL. The server will shut down in 5 seconds.")
        delay(5000)
        CloseApp()
        return 0
    end
    
    print("[" + gettime() + "] [MYSQL] Successfully connected to MySQL [STATUS: " + MysqlConnection + "]")
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
        local query = SQLQuery(mysqlconnection, "SELECT `levels`, `hidden` FROM `profiles` WHERE `steamid` = '" + steamid + "'")
        local PlayerLevel = 1
        local PlayerHidden = 0
        
        // If the query is successful, store the data in the global arrays
        if query > 0 then
            if SQLRowCount(query) > 0 then
                // Fetch the row and read the level and level experience data using the ReadSQLField function 
                local row = SQLFetchRow(query)
                PlayerLevel = ReadSQLField(row, "levels")
                PlayerHidden = ReadSQLField(row, "hidden")
                // Free resources used by the row
                FreeSQLRow(row)
            else
                // If no data is found, set the level to 1 and level experience to 0
                print("[LEADERBOARD:NEW] Row fow Steam ID " + steamid + " is missing. Creating record...")
                AddProfile(playerid)
            end

            // Free resources used by the query
            FreeSQLQuery(query)

            tempPlayerNickName = GetPlayerNickname(playerid)
            if PlayerHidden == 0 then
                ChangePlayerName(playerid, "("+ PlayerLevel + ") " + tempPlayerNickName)
            end

            playerLevel2Packet[playerid] = PlayerLevel
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

    // Make sure to append death if they were evading a potential kill to prevent kdr becoming 'clean' record
    local lastTypeOnLeave = GetPlayerType(playerid)
    if lastTypeOnLeave != 0
        UpdateDeathsKills(playerid, "death")
    end
end

public def OnPlayerKillPlayer(playerid, killedid, weaponid)
    local victimType = GetPlayerType(killedid)
    // Inplementation of spawn protections for MTF/CI
    local tempSpawnCampProtect2FileInitializer = int(GetINIValue("ServerConfig/backend_sharing.ini", "DONOTMODIFY", "enableSpawnCampProtection", "0"))
    if tempSpawnCampProtect2FileInitializer then
        local _victimCurrentRoomID = GetPlayerRoomID(killedid)
        local _victimRoomName = GetRoomName(_victimCurrentRoomID)
        if _victimRoomName == "exit1" or _victimRoomName == "gatea" or _victimRoomName == "gateaentrance"
            select victimType
                case TYPE_NTF, TYPE_CHAOS
                    return 0
            end
        end
    end

    local experienceCatch = 0
    local killerType = GetPlayerType(playerid)
    // Add ### level experience points to the player who killed another player
    // Seperate into role categories should we use it for something more later
    select killerType
        case TYPE_CLASSD, TYPE_SCIENTIST, TYPE_JANITOR, TYPE_WORKER, 17
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
    local tempSpawnCampProtect2FileInitializer = int(GetINIValue("ServerConfig/backend_sharing.ini", "DONOTMODIFY", "enableSpawnCampProtection", "0"))
    if tempSpawnCampProtect2FileInitializer then
        local _victimCurrentRoomID = GetPlayerRoomID(hitid)
        local victimType = GetPlayerType(hitid)
        local _victimRoomName = GetRoomName(_victimCurrentRoomID)
        if _victimRoomName == "exit1" or _victimRoomName == "gatea" or _victimRoomName == "gateaentrance"
            select victimType
                case TYPE_NTF, TYPE_CHAOS
                    return 0
            end
        end
    end

    local killerType = GetPlayerType(playerid)
    local experienceCatch = 0
    select killerType
        case TYPE_ZOMBIE, TYPE_966, TYPE_860
            experienceCatch = 20 * globalExpModifier
            UpdateLevelExp(playerid, experienceCatch, "+", 1)
    end
end

public def OnPlayerGetNewRole(playerid, previoustype, newtype)
    if not previoustype == 18
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
        local pickupname = GetItemTemplateName(itemtemplateid)

        // Make sure that we don't pick up 'important' documents
        if pickupname != "Document SCP-372" and pickupname != "Burnt Note"
            local typeId = GetPlayerType(playerid)
            select typeId
                case TYPE_CLASSD, TYPE_SCIENTIST, TYPE_JANITOR, TYPE_WORKER, 17
                    experienceCatch = 50 * globalExpModifier
                    SendMessage(playerid, "%color|7,68,207|% You secured Foundation Intel.")
                    UpdateLevelExp(playerid, experienceCatch, "+", 1)
                    RemoveItem(itemid)
                    return 0  // Return 0 so we don't get an "Object Not Found" error.
            end
        end
    end
end

////////////////////////////////////////
//          Discord Functions         //
//               Block                //
//                                    //
////////////////////////////////////////

// Discord command checker
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

////////////////////////////////////////
//       SQL Functions/Callbacks      //
//               Block                //
//                                    //
////////////////////////////////////////

// Mysql connection function
def connectmysql(host, user, database, password)
	return OpenSQLStream(host, 3306, user, password, database, 1)
end

// This function is called when an SQL command is received from a discord command
def OnSQLCommand(operation, steamid, value)
    // Check the operation type
    select operation
        case "give" // If operation is "give", increase the level experience of the player
            UpdateLevelExp(steamid, value, "+", 1)
        case "take" // If operation is "take", decrease the level experience of the player
            UpdateLevelExp(steamid, value, "-", 1)
        case "visibility" // If operation is "visibility", toggle the profile visibility of the player
            ToggleProfileVisibility(steamid, value)
    end
end

// This function adds a new profile for a player to the database
def AddProfile(playerid)
    local steamid = int(GetPlayerSteamID(playerid))

    // Check if the MySQL connection is still active
    if SQLConnected(MysqlConnection) == 1 then
        // Call the stored procedure to add the new profile record to the database
        local query = SQLQuery(mysqlconnection, "CALL AddProfile(" + steamid + ")")

        if query > 0 then
            // If query was successful, print a success message
            print("[LEADERBOARD] Successfully added new profile record for Steam ID " + steamid)
        else
            // If query failed, print an error message
            print("[LEADERBOARD] Failed to add new profile record for Steam ID " + steamid)
        end

        // Free resources used by the query
        FreeSQLQuery(query)
    else
        // If the MySQL connection is not active, print an error message
        print("[LEADERBOARD][MYSQL] MySQL connection is not active")
    end
end

// This function toggle the users privacy setting to hide leaderboard state. Packet 100
def ToggleUserPrivacy(playerid)
    // Get the Steam ID of the player, safeguard
    if playerid > 0 and playerid < MAX_PLAYERS
        local steamid = int(GetPlayerSteamID(playerid))
    else
        steamid = int(playerid)
    end

    // Check if the MySQL connection is still active
    if SQLConnected(MysqlConnection) == 1 then
        // Call the stored procedure to add the new profile record to the database
        local query = SQLQuery(mysqlconnection, "CALL UpdateUserHiddenPrivacy(" + steamid + ")")

        if query > 0 then
            local final_hidden_query = SQLQuery(mysqlconnection, "SELECT `hidden` FROM `profiles` WHERE `steamid` = '" + steamid + "';")
            if final_hidden_query > 0 then
                if SQLRowCount(final_hidden_query) > 0 then
                    // Fetch the row and read the level and level experience data using the ReadSQLField function 
                    local row = SQLFetchRow(final_hidden_query)
                    final_hidden = ReadSQLField(row, "hidden")
                    // Free resources used by the row
                    FreeSQLRow(row)

                    select final_hidden
                        case 0
                            SendMessage(playerid, "%color|0,201,23|% You have opt-in of being displayed on the leaderboard")
                        case 1
                            SendMessage(playerid, "%color|204,36,34|% You are not allowed to opt-in into the leaderboard")
                        case 2
                            SendMessage(playerid, "%color|0,201,23|% You have opt-out of being displayed on the leaderboard")
                    end

                    // Print the success message and final hidden value
                    print("[LEADERBOARD] Successfully updated profile privacy record for Steam ID " + steamid)
                else
                    print("[LEADERBOARD] Failed to fetch hidden value in row.")
                end
            else
                // If the query fails, print an error message
                print("[LEADERBOARD] Failed to retrieve player data 'hidden' for Steam ID " + steamid)
            end
            
            // Free resources used by the query
            FreeSQLQuery(final_hidden_query)
        else
            // If query failed, print an error message
            print("[LEADERBOARD] Failed to update profile privacy record for Steam ID " + steamid)
        end

        // Free resources used by the query
        FreeSQLQuery(query)
    else
        // If the MySQL connection is not active, print an error message
        print("[LEADERBOARD][MYSQL] MySQL connection is not active")
    end
end

// This function toggles the profile visibility of the specified player
def ToggleProfileVisibility(playerid, hide)
    // Get the Steam ID of the player
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
         // If the MySQL connection is not active, print an error message
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


////////////////////////////////////////
//     Network Callback/Functions     //
//               Block                //
//                                    //
////////////////////////////////////////

////// NETWORK CALLBACK //////

public def OnReceiveRawPacket(id, bnk)
    RecievedRawPacket(id,bnk)
end

public def RecievedRawPacket(playerid, bnk)
    if BankSize(bnk) > 0 then
        b = PeekByte(bnk)
        select b
            case 100 // Packet to determine if client has fully loaded in. Used to determine if script is ready to draw.
                ToggleUserPrivacy(playerid)
            case 101
                sendPacketWithDataInt1(playerid, 9, playerLevel2Packet[playerid])

                // Remove it when requested as soon as possible since we aren't holding it anyways
                playerLevel2Packet[playerid] = 0
        end
    end
end

////// NETWORK FUNCTIONS //////

public def sendPacket(playerid, postData)
    local bank = CreateBank(1)
    PokeByte(bank, 0, postData)
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

////////////////////////////////////////
////////////////////////////////////////
////////////////////////////////////////
////////////////////////////////////////