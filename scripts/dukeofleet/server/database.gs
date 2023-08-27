// INI DATABASE FUNCTIONS

public def DatabaseInput(fileLocationName, header, category, value, doUpdate)
    if FileType(fileLocationName + ".ini") == 0 then
        CloseFile(WriteFile(fileLocationName + ".ini"))
    end
    PutINIValue(fileLocationName + ".ini", header, category, value)
    if doUpdate == 1
        UpdateINIFile(fileLocationName + ".ini")
    end
end


// MYSQL DATABASE FUNCTIONS

// Mysql Prepared Connection State Function
def connectmysql(host, user, database, password)
	return OpenSQLStream(host, 3306, user, password, database, 1)
end

public def ExecuteSQLPreparedQuery(sqlCode)
    // Check if the MySQL connection is still active
    if SQLConnected(MysqlConnection) == 1 then
        // Call the prepared query from stored parameter and execute to database
        local query = SQLQuery(MysqlConnection, sqlCode)

        if query > 0 then
            // If query was successful, do nothing...
        else
            // If query failed, print an error message
            print("[MYSQL] Failed to Execute: " + sqlCode)
        end

        // Free resources used by the query
        FreeSQLQuery(query)
    else
        // If the MySQL connection is not active, print an error message
        print("[MYSQL] MySQL connection is not active")
    end
end

public def ExecuteSQLPreparedProcedure(procedureName, paramValues)
    // Check if the MySQL connection is still active
    if SQLConnected(MysqlConnection) == 1 then
        // Call the prepared query from stored parameter and execute to database
        local query = SQLQuery(MysqlConnection, "CALL `" + procedureName + "`(" + paramValues+ ");")

        if query > 0 then
            // If query was successful, do nothing...
        else
            // If query failed, print an error message
            print("[MYSQL] Failed to Execute: " + procedureName)
        end

        // Free resources used by the query
        FreeSQLQuery(query)
    else
        // If the MySQL connection is not active, print an error message
        print("[MYSQL] MySQL connection is not active")
    end
end

public def ExecuteSQLPreparedFunction(functionName, paramValues)
    // Check if the MySQL connection is still active
    if SQLConnected(MysqlConnection) == 1 then
        local final_status = 0
        local query = SQLQuery(MysqlConnection, "SELECT " + functionName + "(" + paramValues + ") AS ResultMessage;")
        
        if query > 0 then
            if SQLRowCount(query) > 0 then
                
                // Fetch the row and read the return result from the ReadSQLField function 
                local row = SQLFetchRow(query)
                final_status = ReadSQLField(row, "ResultMessage")
                
                // Free resources used by the row
                FreeSQLRow(row)
            else
                // This is in case something weird or unexpected happens.
                print("[MySQL] Failed to read returned result from Row...")
            end
        else
            print("[MYSQL] Failed to retrieve SQL function query...")
        end

        // Free resources used by the query
        FreeSQLQuery(query)
        
        return final_status
    else
        print("[MYSQL] MySQL connection is not active")
        return 0
    end
end

// A function to retrieve user tag information based on the player's ID and SteamID
// Parameters:
//   @param playerid:   The ID of the player
//   @param steamid:    The SteamID of the player
public def GetUserTag(playerid, steamid)
    // Check if the MySQL connection is still active
    if SQLConnected(MysqlConnection) == 1 then

        // Construct a query to retrieve user tag information from the database
        local query = SQLQuery(mysqlconnection, "SELECT `tagName`, `tagColourR`, `tagColourG`, `tagColourB` FROM `playerTags` WHERE `steamid` = '" + steamid + "' UNION ALL SELECT 'none' AS `tagName`, NULL AS `tagColourR`, NULL AS `tagColourG`, NULL AS `tagColourB` FROM DUAL WHERE NOT EXISTS (SELECT `steamId` FROM `playerTags` WHERE `steamid` = '" + steamid + "');")

        // Check if the query was successful
        if query > 0 then
            // Check if the query returned any rows
            if SQLRowCount(query) > 0 then

                // Fetch the row containing tag information
                local row = SQLFetchRow(query)
                local hasPlayerTag = ReadSQLField(row, "tagName")

                // Check if the player has a tag
                if hasPlayerTag != "none"
                    local tagColourR = ReadSQLField(row, "tagColourR")
                    local tagColourG = ReadSQLField(row, "tagColourG")
                    local tagColourB = ReadSQLField(row, "tagColourB")

                    // Apply the player's tag and tag colors
                    ChangePlayerTag(playerid, hasPlayerTag, tagColourR, tagColourG, tagColourB)
                end

                // Free resources used by the row
                FreeSQLRow(row)
            else
                // Print an error message if no value was fetched from the row
                print("[MYSQL] Failed to fetch value in row for user tags.")
            end
        else
            // If query failed, print an error message
            print("[MYSQL] Failed retrieved user tag for Steam ID " + steamid)
        end

        // Free resources used by the query
        FreeSQLQuery(query)
    else
        // If the MySQL connection is not active, print an error message
        print("[MYSQL] MySQL connection is not active")
    end
end

// A function to retrieve user weapons loadout based on the player's ID and SteamID
// Parameters:
//   @param playerid:   The ID of the player
//   @param steamid:    The SteamID of the player
public def GetUserWeaponsLoadout(playerid, steamid)
    // Check if the MySQL connection is still active
    if SQLConnected(MysqlConnection) == 1 then

        // Construct a query to retrieve user weapons loadout information from the database
        local query = SQLQuery(mysqlconnection, "SELECT CASE `primaryWeapon` WHEN 'random' THEN 0 WHEN 'm4a4' THEN 1 WHEN 'spas12' THEN 2 WHEN 'p90' THEN 3 WHEN 'hkg36' THEN 4 END AS `primaryWeapon`,CASE `secondaryWeapon` WHEN 'random' THEN 0 WHEN 'usp' THEN 1 WHEN 'deagle' THEN 2 WHEN 'mp5sd' THEN 3 WHEN 'knife' THEN 4 END AS `secondaryWeapon`,CASE `explosiveWeapon` WHEN 'random' THEN 0 WHEN 'frag' THEN 1 WHEN 'smoke' THEN 2 WHEN 'flash' THEN 3 END AS `explosiveWeapon` FROM `weaponLoadout` WHERE `steamid` = '" + steamid + "' AND (`primaryWeapon` IN ('random', 'm4a4', 'spas12', 'p90', 'hkg36') OR `secondaryWeapon` IN ('random', 'usp', 'deagle', 'mp5sd', 'knife') OR `explosiveWeapon` IN ('random', 'frag', 'smoke', 'flash')) UNION ALL SELECT 0 AS `primaryWeapon`, 0 AS `secondaryWeapon`, 0 AS `explosiveWeapon` FROM DUAL WHERE NOT EXISTS (SELECT `steamId` FROM `weaponLoadout` WHERE `steamid` = '" + steamid + "');")

        // Check if the query was successful
        if query > 0 then

            // Check if the query returned any rows
            if SQLRowCount(query) > 0 then

                // Fetch the row containing weapon loadout information
                local row = SQLFetchRow(query)
                primaryWeaponLoadout[playerid] = ReadSQLField(row, "primaryWeapon")
                secondaryWeaponLoadout[playerid] = ReadSQLField(row, "secondaryWeapon")
                explosiveWeaponLoadout[playerid] = ReadSQLField(row, "explosiveWeapon")
                
                // Free resources used by the row
                FreeSQLRow(row)
            else
                // Print an error message if no value was fetched from the row
                print("[MYSQL] Failed to fetch value in row for weapon loadout.")
            end
        else
            // If query failed, print an error message
            print("[MYSQL] Failed retrieved user tag for Steam ID " + steamid)
        end

        // Free resources used by the query
        FreeSQLQuery(query)
    else
        // If the MySQL connection is not active, print an error message
        print("[MYSQL] MySQL connection is not active")
    end
end