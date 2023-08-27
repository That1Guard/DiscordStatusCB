-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Server version:               10.4.18-MariaDB - mariadb.org binary distribution
-- Server OS:                    Win64
-- HeidiSQL Version:             12.1.0.6537
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Dumping database structure for scpcb_playerstats
CREATE DATABASE IF NOT EXISTS `scpcb_playerstats` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin */;
USE `scpcb_playerstats`;

-- Dumping structure for function scpcb_playerstats.CheckPlayerBanStatus
DELIMITER //
CREATE FUNCTION `CheckPlayerBanStatus`(`playerSteamID` VARCHAR(16),
	`playerIP` VARCHAR(15),
	`returnType` VARCHAR(50)
) RETURNS int(11)
BEGIN
    DECLARE steamIDBanTime DATETIME;
    DECLARE steamIDUnbanTime DATETIME;
    DECLARE steamIDBanType ENUM('permanent','temporary');
    DECLARE ipBanTime DATETIME;
    DECLARE ipUnbanTime DATETIME;
    DECLARE ipBanType ENUM('permanent','temporary');
    DECLARE banStatus INT;
    DECLARE remainingTime INT;
    
    SET banStatus = 0; -- Default status (not banned)
    SET remainingTime = -1; -- Unpopulated time (no time set)
    
    -- Check if player's SteamID is banned
    SELECT banTime, unbanTime, banType INTO steamIDBanTime, steamIDUnbanTime, steamIDBanType
    FROM steamIdBans
    WHERE steamId = (SELECT id FROM playerInfo WHERE steamId = playerSteamID LIMIT 1) LIMIT 1;
    
    IF steamIDBanTime IS NOT NULL THEN
        IF steamIDBanType = 'permanent' THEN
            SET banStatus = 1; -- Player's SteamID is permanently banned
        ELSEIF steamIDUnbanTime IS NULL OR steamIDUnbanTime > NOW() THEN
            SET banStatus = 1; -- Player's SteamID is temporarily banned
            IF steamIDUnbanTime IS NOT NULL THEN
                SET remainingTime = TIMESTAMPDIFF(MINUTE, NOW(), steamIDUnbanTime);
            END IF;
        END IF;
    END IF;
    
    -- Check if player's IP is banned
    SELECT p.banTime, p.unbanTime, p.banType INTO ipBanTime, ipUnbanTime, ipBanType
    FROM ipBans p
    JOIN ipInfo i ON p.ipAddress = i.id
    WHERE i.ipAddress = playerIP LIMIT 1;
    
    IF ipBanTime IS NOT NULL THEN
        IF ipBanType = 'permanent' THEN
            SET banStatus = 2; -- Player's IP is permanently banned
        ELSEIF ipUnbanTime IS NULL OR ipUnbanTime > NOW() THEN
            SET banStatus = 2; -- Player's IP is temporarily banned
            IF ipUnbanTime IS NOT NULL THEN
                SET remainingTime = TIMESTAMPDIFF(MINUTE, NOW(), ipUnbanTime);
            END IF;
        END IF;
    END IF;
    
    -- Output the ban status and remaining time based on the returnType input
    IF returnType = 'Status' THEN
        RETURN banStatus;
    ELSEIF returnType = 'RemainingMinutes' THEN
        RETURN remainingTime;
    ELSE
        -- Return an error value if the returnType input is invalid
        RETURN -999;
    END IF;
    
END//
DELIMITER ;

-- Dumping structure for function scpcb_playerstats.GetMuteStatus
DELIMITER //
CREATE FUNCTION `GetMuteStatus`(`p_steamId` VARCHAR(255)
) RETURNS int(11)
BEGIN
    DECLARE v_muteStatus ENUM('N', 'Y');
    DECLARE v_numericMuteStatus INT;
    DECLARE v_playerId INT;

    -- Get the player ID from playerInfo table
    SELECT id INTO v_playerId
    FROM playerInfo
    WHERE steamId = p_steamId;

    -- Retrieve mute status
    SELECT sm.isPermaMute INTO v_muteStatus
    FROM playerInfo pi
    LEFT JOIN steamIdMute sm ON pi.id = sm.steamId
    WHERE pi.steamId = p_steamId;

    IF v_muteStatus IS NULL THEN
        SET v_numericMuteStatus = 0; -- Replace 0 with your desired default numeric value

        -- Insert new mute status data into steamIdMute table
        INSERT INTO steamIdMute (steamId, isPermaMute) VALUES (v_playerId, 'N'); -- Replace 'N' with your desired default mute status
    ELSE
        CASE v_muteStatus
            WHEN 'N' THEN SET v_numericMuteStatus = 0;
            WHEN 'Y' THEN SET v_numericMuteStatus = 1;
            ELSE SET v_numericMuteStatus = 0; -- Default numeric value for unknown ENUM
        END CASE;
    END IF;

    RETURN v_numericMuteStatus;
END//
DELIMITER ;

-- Dumping structure for function scpcb_playerstats.GetPlayerRank
DELIMITER //
CREATE FUNCTION `GetPlayerRank`(`p_steamId` VARCHAR(255)
) RETURNS int(11)
BEGIN
    DECLARE v_playerRank ENUM('ALL', 'DONATOR', 'MOD', 'ADMIN', 'OWNER');
    DECLARE v_numericRank INT;
    DECLARE v_playerId INT;

    -- Retrieve player rank
    SELECT pr.playerRank INTO v_playerRank
    FROM playerInfo pi
    LEFT JOIN playerRanks pr ON pi.id = pr.playerInfoId
    WHERE pi.steamId = p_steamId;

    IF v_playerRank IS NULL THEN
        SET v_numericRank = 0; -- Replace 0 with your desired default numeric value
        
        -- Get the player ID from playerInfo table
			SELECT id INTO v_playerId 
			FROM playerInfo           
			WHERE steamId = p_steamId;

        -- Insert new player data into playerRanks table
        INSERT INTO playerRanks (playerInfoId, playerRank) VALUES (v_playerId, 'ALL'); -- Replace 'ALL' with your desired default player rank
    ELSE
        CASE v_playerRank -- Numeric orderinal for default rank setup
            WHEN 'ALL' THEN SET v_numericRank = 0;
            WHEN 'DONATOR' THEN SET v_numericRank = 1;
            WHEN 'MOD' THEN SET v_numericRank = 2;
            WHEN 'ADMIN' THEN SET v_numericRank = 3;
            WHEN 'OWNER' THEN SET v_numericRank = 4;
            ELSE SET v_numericRank = -1; -- Default numeric value for unknown ENUM
        END CASE;
    END IF;

    RETURN v_numericRank;
END//
DELIMITER ;

-- Dumping structure for procedure scpcb_playerstats.HandlePlayerUniqueLogins
DELIMITER //
CREATE PROCEDURE `HandlePlayerUniqueLogins`(
	IN `pSteamId` VARCHAR(16)
)
BEGIN
    DECLARE vPlayerInfoId INT(12);
    DECLARE vUniqueLoginId INT(12);
    
    -- Get the playerInfoId based on the steamId
    SELECT id INTO vPlayerInfoId FROM playerInfo WHERE steamId = pSteamId;
    
    -- Check if at least one player unique login exists for the current day in the playerUniqueLogins table
    SET vUniqueLoginId = (SELECT id FROM playerUniqueLogins WHERE playerInfoId = vPlayerInfoId AND DAY(`day`) = DAY(CURRENT_TIMESTAMP()) LIMIT 1);
    
    -- If vUniqueLoginId is NULL, insert a new row and retrieve the generated id
    IF vUniqueLoginId IS NULL THEN
        INSERT INTO playerUniqueLogins (playerInfoId, day) VALUES (vPlayerInfoId, CURRENT_TIMESTAMP());
        SET vUniqueLoginId = LAST_INSERT_ID();
    END IF;
END//
DELIMITER ;

-- Dumping structure for procedure scpcb_playerstats.InsertPlayerBans
DELIMITER //
CREATE PROCEDURE `InsertPlayerBans`(
	IN `ipAddressParam` VARCHAR(15),
	IN `steamIdParam` VARCHAR(16),
	IN `banTypeParam` ENUM('permanent', 'temporary'),
	IN `unbanMinutesParam` INT
)
BEGIN
    DECLARE ipAddressId INT;
    DECLARE playerSteamId INT;
    DECLARE banTimeParam DATETIME;

    SET banTimeParam = NOW(); -- Set banTimeParam to the current time

    -- Get IP address and SteamID from the respective tables
    SELECT id INTO ipAddressId FROM ipInfo WHERE ipAddress = ipAddressParam LIMIT 1;
    SELECT id INTO playerSteamId FROM playerInfo WHERE steamId = steamIdParam LIMIT 1;

    -- Insert or update IP ban if ipAddressId is available
    IF ipAddressId IS NOT NULL THEN
        INSERT INTO ipBans (ipAddress, banType, banTime, unbanTime)
        VALUES (ipAddressId, banTypeParam, banTimeParam, DATE_ADD(banTimeParam, INTERVAL unbanMinutesParam MINUTE))
        ON DUPLICATE KEY UPDATE
        banType = VALUES(banType), banTime = VALUES(banTime), unbanTime = VALUES(unbanTime);
        -- SET ipAddressId = LAST_INSERT_ID();
    END IF;

    -- Insert or update SteamID ban if playerSteamId is available
    IF playerSteamId IS NOT NULL THEN
        INSERT INTO steamIdBans (steamId, banType, banTime, unbanTime)
        VALUES (playerSteamId, banTypeParam, banTimeParam, DATE_ADD(banTimeParam, INTERVAL unbanMinutesParam MINUTE))
        ON DUPLICATE KEY UPDATE
        banType = VALUES(banType), banTime = VALUES(banTime), unbanTime = VALUES(unbanTime);
        -- SET playerSteamId = LAST_INSERT_ID();
    END IF;
END//
DELIMITER ;

-- Dumping structure for procedure scpcb_playerstats.InsertPlayerData
DELIMITER //
CREATE PROCEDURE `InsertPlayerData`(
	IN `pIpAddress` VARCHAR(15),
	IN `pPlayerSteamId` VARCHAR(256),
	IN `pPlayerName` VARCHAR(50),
	IN `pPlayerVersion` VARCHAR(12)
)
BEGIN
    DECLARE vIpInfoId INT(12);
    DECLARE vPlayerInfoId INT(12);
    DECLARE vUniqueLoginId INT(12);
    DECLARE vPlayerIpId INT(12);

    -- Check if the IP address already exists in the ipInfo table
    SELECT id INTO vIpInfoId FROM ipInfo WHERE ipAddress = pIpAddress;

    -- If vIpInfoId is NULL, the IP address doesn't exist, so insert it into the ipInfo table
    IF vIpInfoId IS NULL THEN
        INSERT INTO ipInfo (ipAddress) VALUES (pIpAddress);
        SET vIpInfoId = LAST_INSERT_ID();
    END IF;
    
    -- Check if the player information already exists in the playerInfo table
    SELECT id INTO vPlayerInfoId FROM playerInfo WHERE steamId = pPlayerSteamId;
    
    -- If vPlayerInfoId is NULL, the player information doesn't exist, so insert it into the playerInfo table
    IF vPlayerInfoId IS NULL THEN
        INSERT INTO playerInfo (steamId, version) VALUES (pPlayerSteamId, pPlayerVersion);
        SET vPlayerInfoId = LAST_INSERT_ID();
    END IF;
    
    -- Check if the player IP mapping already exists in the playerIps table
    IF NOT EXISTS (SELECT 1 FROM playerIps WHERE playerInfoId = vPlayerInfoId AND ipInfoId = vIpInfoId) THEN
        -- Insert player IP mapping into the playerIps table
        INSERT INTO playerIps (playerInfoId, ipInfoId) VALUES (vPlayerInfoId, vIpInfoId);
    END IF;
    
    -- Retrieve the player IP ID from the playerIps table
    SELECT id INTO vPlayerIpId FROM playerIps WHERE playerInfoId = vPlayerInfoId AND ipInfoId = vIpInfoId;
    
    -- Call the InsertPlayerLoginSession procedure to handle player login sessions
    -- CALL InsertPlayerLoginSession(vPlayerIpId, pTimeInGame);
    
    -- Check if the player unique login already exists in the playerUniqueLogins table
    SELECT id INTO vUniqueLoginId FROM playerUniqueLogins WHERE playerInfoId = vPlayerInfoId AND DAY(`day`) = DAY(CURRENT_TIMESTAMP());
    
    -- If vUniqueLoginId is NULL, the player unique login doesn't exist, so insert it into the playerUniqueLogins table
    IF vUniqueLoginId IS NULL THEN
        INSERT INTO playerUniqueLogins (playerInfoId, day) VALUES (vPlayerInfoId, CURRENT_TIMESTAMP());
        SET vUniqueLoginId = LAST_INSERT_ID();
    END IF;
    
    -- If no vUniqueLoginId is found, insert a new row and retrieve the generated id
    IF vUniqueLoginId IS NULL THEN
        -- Retrieve the vUniqueLoginId based on the vPlayerInfoId
        SELECT id INTO vUniqueLoginId FROM playerUniqueLogins WHERE playerInfoId = vPlayerInfoId AND DAY(`day`) = DAY(CURRENT_TIMESTAMP()) LIMIT 1;
        
        IF vUniqueLoginId IS NULL THEN
            INSERT INTO playerUniqueLogins (playerInfoId, day) VALUES (vPlayerInfoId, CURRENT_TIMESTAMP());
            SET vUniqueLoginId = LAST_INSERT_ID();
        END IF;
    END IF;
END//
DELIMITER ;

-- Dumping structure for procedure scpcb_playerstats.InsertPlayerLoginSession
DELIMITER //
CREATE PROCEDURE `InsertPlayerLoginSession`(
    IN p_playerIpId INT,
    IN p_playerInfoId INT,
    IN p_timeInGame INT
)
BEGIN
    INSERT INTO playerLoginSessions (playerIpId, playerInfoId, timeInGame)
    VALUES (p_playerIpId, p_playerInfoId, p_timeInGame);
END//
DELIMITER ;

-- Dumping structure for table scpcb_playerstats.ipBans
CREATE TABLE IF NOT EXISTS `ipBans` (
  `id` int(12) NOT NULL AUTO_INCREMENT,
  `ipAddress` int(11) NOT NULL,
  `banType` enum('permanent','temporary') COLLATE utf8mb4_bin NOT NULL,
  `banTime` datetime NOT NULL,
  `unbanTime` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ipAddress` (`ipAddress`),
  CONSTRAINT `FK_ipBans_ipInfo` FOREIGN KEY (`ipAddress`) REFERENCES `ipInfo` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Data exporting was unselected.

-- Dumping structure for table scpcb_playerstats.ipInfo
CREATE TABLE IF NOT EXISTS `ipInfo` (
  `id` int(12) NOT NULL AUTO_INCREMENT,
  `ipAddress` varchar(15) COLLATE utf8mb4_bin NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `ipAddress` (`ipAddress`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Data exporting was unselected.

-- Dumping structure for table scpcb_playerstats.logBans
CREATE TABLE IF NOT EXISTS `logBans` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `steamIdBansId` int(11) DEFAULT NULL,
  `ipBansId` int(11) DEFAULT NULL,
  `punisherSteamId` int(11) DEFAULT NULL,
  `loggedTime` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `punisherSteamId` (`punisherSteamId`),
  KEY `bannedSteamId` (`steamIdBansId`) USING BTREE,
  KEY `bannedIpId` (`ipBansId`) USING BTREE,
  CONSTRAINT `FK__playerInfo_2` FOREIGN KEY (`punisherSteamId`) REFERENCES `playerInfo` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `FK_logBans_ipBans` FOREIGN KEY (`ipBansId`) REFERENCES `ipBans` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `FK_logBans_steamIdBans` FOREIGN KEY (`steamIdBansId`) REFERENCES `steamIdBans` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Data exporting was unselected.

-- Dumping structure for table scpcb_playerstats.playerInfo
CREATE TABLE IF NOT EXISTS `playerInfo` (
  `id` int(12) NOT NULL AUTO_INCREMENT,
  `steamId` varchar(16) COLLATE utf8mb4_bin NOT NULL,
  `version` varchar(12) COLLATE utf8mb4_bin NOT NULL DEFAULT '1.2.9.2',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `uuid` (`steamId`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Data exporting was unselected.

-- Dumping structure for table scpcb_playerstats.playerIps
CREATE TABLE IF NOT EXISTS `playerIps` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `playerInfoId` int(12) NOT NULL,
  `ipInfoId` int(12) NOT NULL,
  `date` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`) USING BTREE,
  KEY `InfoId` (`playerInfoId`,`ipInfoId`) USING BTREE,
  KEY `playerIps_ibfk_1` (`ipInfoId`) USING BTREE,
  CONSTRAINT `playerIps_ibfk_1` FOREIGN KEY (`ipInfoId`) REFERENCES `ipInfo` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `playerIps_ibfk_2` FOREIGN KEY (`playerInfoId`) REFERENCES `playerInfo` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Data exporting was unselected.

-- Dumping structure for table scpcb_playerstats.playerLoginSessions
CREATE TABLE IF NOT EXISTS `playerLoginSessions` (
  `id` int(12) NOT NULL AUTO_INCREMENT,
  `playerIpId` int(12) NOT NULL,
  `playerInfoId` int(11) DEFAULT NULL,
  `lastSessionTime` timestamp NOT NULL DEFAULT current_timestamp(),
  `timeInGame` int(8) NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `playerIpId` (`playerIpId`) USING BTREE,
  KEY `playerNameId` (`playerInfoId`) USING BTREE,
  CONSTRAINT `FK_playerLoginSessions_playerInfo` FOREIGN KEY (`playerInfoId`) REFERENCES `playerInfo` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `FK_playerLoginSessions_playerIps` FOREIGN KEY (`playerIpId`) REFERENCES `playerIps` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Data exporting was unselected.

-- Dumping structure for table scpcb_playerstats.playerName
CREATE TABLE IF NOT EXISTS `playerName` (
  `id` int(11) NOT NULL,
  `playerNickname` varchar(50) COLLATE utf8mb4_bin DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `playerNickname` (`playerNickname`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Data exporting was unselected.

-- Dumping structure for table scpcb_playerstats.playerRanks
CREATE TABLE IF NOT EXISTS `playerRanks` (
  `playerInfoId` int(11) NOT NULL,
  `playerRank` enum('ALL','DONATOR','MOD','ADMIN','OWNER') COLLATE utf8mb4_bin NOT NULL DEFAULT 'ALL',
  PRIMARY KEY (`playerInfoId`) USING BTREE,
  CONSTRAINT `FK_playerRanks_playerInfo` FOREIGN KEY (`playerInfoId`) REFERENCES `playerInfo` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Data exporting was unselected.

-- Dumping structure for table scpcb_playerstats.playerTags
CREATE TABLE IF NOT EXISTS `playerTags` (
  `steamId` varchar(16) COLLATE utf8mb4_bin NOT NULL DEFAULT '',
  `tagName` varchar(50) COLLATE utf8mb4_bin NOT NULL,
  `tagColourR` tinyint(3) unsigned NOT NULL DEFAULT 0,
  `tagColourG` tinyint(3) unsigned NOT NULL DEFAULT 0,
  `tagColourB` tinyint(3) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`steamId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Data exporting was unselected.

-- Dumping structure for table scpcb_playerstats.playerUniqueLogins
CREATE TABLE IF NOT EXISTS `playerUniqueLogins` (
  `id` int(12) NOT NULL AUTO_INCREMENT,
  `playerInfoId` int(12) NOT NULL,
  `playerNameId` int(11) DEFAULT NULL,
  `day` date NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `playerInfoId` (`playerInfoId`) USING BTREE,
  KEY `Column 4` (`playerNameId`),
  CONSTRAINT `FK_playerUniqueLogins_playerInfo` FOREIGN KEY (`playerInfoId`) REFERENCES `playerInfo` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `FK_playerUniqueLogins_playerName` FOREIGN KEY (`playerNameId`) REFERENCES `playerName` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Data exporting was unselected.

-- Dumping structure for table scpcb_playerstats.steamIdBans
CREATE TABLE IF NOT EXISTS `steamIdBans` (
  `id` int(12) NOT NULL AUTO_INCREMENT,
  `steamId` int(11) NOT NULL,
  `banType` enum('permanent','temporary') COLLATE utf8mb4_bin NOT NULL,
  `banTime` datetime DEFAULT NULL,
  `unbanTime` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `steamId` (`steamId`),
  CONSTRAINT `FK_steamIdBans_playerInfo` FOREIGN KEY (`steamId`) REFERENCES `playerInfo` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Data exporting was unselected.

-- Dumping structure for table scpcb_playerstats.steamIdMute
CREATE TABLE IF NOT EXISTS `steamIdMute` (
  `steamId` int(11) NOT NULL,
  `isPermaMute` enum('N','Y') COLLATE utf8mb4_bin NOT NULL DEFAULT 'N',
  UNIQUE KEY `steamId` (`steamId`),
  CONSTRAINT `FK_steamIdMute_playerInfo` FOREIGN KEY (`steamId`) REFERENCES `playerInfo` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Data exporting was unselected.

-- Dumping structure for procedure scpcb_playerstats.UpdateMuteStatus
DELIMITER //
CREATE PROCEDURE `UpdateMuteStatus`(
	IN `p_steamId` INT,
	IN `p_isPermaMute` ENUM('N','Y')
)
BEGIN
    DECLARE player_id INT;
    
    -- Find the corresponding player id for the given steamId
    SELECT id INTO player_id FROM playerInfo WHERE steamId = p_steamId;
    
    IF player_id IS NOT NULL THEN
        -- Update the mute status for the player
        UPDATE steamIdMute
        SET isPermaMute = p_isPermaMute
        WHERE steamId = player_id;
    END IF;
END//
DELIMITER ;

-- Dumping structure for procedure scpcb_playerstats.UpdatePlayerRank
DELIMITER //
CREATE PROCEDURE `UpdatePlayerRank`(
	IN `p_steamId` VARCHAR(16),
	IN `p_newRank` INT
)
BEGIN
    DECLARE v_playerInfoId INT;
    
    -- Get the playerInfoId associated with the steamId
    SELECT id INTO v_playerInfoId FROM playerInfo WHERE steamId = p_steamId;

    IF v_playerInfoId IS NOT NULL THEN
        -- Update the existing playerRank or insert a new record
        INSERT INTO playerRanks (playerInfoId, playerRank)
        VALUES (v_playerInfoId, 
            CASE
                WHEN p_newRank = 0 THEN 'ALL'
                WHEN p_newRank = 1 THEN 'DONATOR'
                WHEN p_newRank = 2 THEN 'MOD'
                WHEN p_newRank = 3 THEN 'ADMIN'
                WHEN p_newRank = 4 THEN 'OWNER'
                ELSE 'ALL' -- Default rank when the value is not in the specified range
            END
        )
        ON DUPLICATE KEY UPDATE playerRank = VALUES(playerRank);
    END IF;
END//
DELIMITER ;

-- Dumping structure for procedure scpcb_playerstats.UpdatePlayerTag
DELIMITER //
CREATE PROCEDURE `UpdatePlayerTag`(
	IN `p_steamId` INT,
	IN `p_tagName` VARCHAR(50),
	IN `p_tagColourR` TINYINT,
	IN `p_tagColourG` TINYINT,
	IN `p_tagColourB` TINYINT
)
BEGIN
    INSERT INTO playerTags (steamId, tagName, tagColourR, tagColourG, tagColourB)
    VALUES (p_steamId, p_tagName, p_tagColourR, p_tagColourG, p_tagColourB)
    ON DUPLICATE KEY UPDATE
        tagName = VALUES(tagName),
        tagColourR = VALUES(tagColourR),
        tagColourG = VALUES(tagColourG),
        tagColourB = VALUES(tagColourB);
END//
DELIMITER ;

-- Dumping structure for procedure scpcb_playerstats.UpdateWeaponLoadout
DELIMITER //
CREATE PROCEDURE `UpdateWeaponLoadout`(
	IN `p_steamId` INT,
	IN `p_primaryWeapon` ENUM('random','m4a4','spas12','p90','hkg36'),
	IN `p_secondaryWeapon` ENUM('random','usp','deagle','mp5sd','knife'),
	IN `p_explosiveWeapon` ENUM('random','frag','smoke','flash')
)
BEGIN
    -- Insert or update the weapon loadout using the ON DUPLICATE KEY UPDATE statement
    INSERT INTO weaponLoadout (steamId, primaryWeapon, secondaryWeapon, explosiveWeapon)
    VALUES (p_steamId, p_primaryWeapon, p_secondaryWeapon, p_explosiveWeapon)
    ON DUPLICATE KEY UPDATE
        primaryWeapon = p_primaryWeapon,
        secondaryWeapon = p_secondaryWeapon,
        explosiveWeapon = p_explosiveWeapon;
END//
DELIMITER ;

-- Dumping structure for table scpcb_playerstats.weaponLoadout
CREATE TABLE IF NOT EXISTS `weaponLoadout` (
  `steamId` int(11) NOT NULL,
  `primaryWeapon` enum('random','m4a4','spas12','p90','hkg36') COLLATE utf8mb4_bin NOT NULL DEFAULT 'random',
  `secondaryWeapon` enum('random','usp','deagle','mp5sd','knife') COLLATE utf8mb4_bin NOT NULL DEFAULT 'random',
  `explosiveWeapon` enum('random','frag','smoke','flash') COLLATE utf8mb4_bin NOT NULL DEFAULT 'random',
  PRIMARY KEY (`steamId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Data exporting was unselected.

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
