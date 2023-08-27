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

-- Dumping structure for procedure account.AddProfile
DELIMITER //
CREATE PROCEDURE `AddProfile`(
	IN `steamid` VARCHAR(50)
)
BEGIN
    -- Insert a new blank record into the profiles table
    INSERT INTO `profiles` (`steamid`, `levels`, `levelsexp`, `totalplaytime`, `kills`, `deaths`, `hidden`) VALUES (steamid, 1, 0, '0', 0, 0, 0);
END//
DELIMITER ;

-- Dumping structure for procedure account.AddTimePlayed
DELIMITER //
CREATE PROCEDURE `AddTimePlayed`(
	IN `playerid` INT,
	IN `timePlayedSeconds` INT
)
BEGIN
	SELECT totalplaytime FROM profiles WHERE steamid = playerid INTO @totalplaytime;
	SET @minutes = FLOOR(timePlayedSeconds / 60);
	SET @totalplaytime = @totalplaytime + @minutes;
	UPDATE profiles SET totalplaytime = @totalplaytime WHERE steamid = playerid;
END//
DELIMITER ;

-- Dumping structure for table account.profiles
CREATE TABLE IF NOT EXISTS `profiles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `steamid` varchar(50) COLLATE armscii8_bin NOT NULL DEFAULT '0',
  `levels` int(11) NOT NULL DEFAULT 0,
  `levelsexp` int(11) NOT NULL DEFAULT 0,
  `kills` int(11) NOT NULL DEFAULT 0,
  `deaths` int(11) NOT NULL DEFAULT 0,
  `hidden` tinyint(1) NOT NULL DEFAULT 0,
  `totalplaytime` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `steamid` (`steamid`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=armscii8 COLLATE=armscii8_bin;

-- Data exporting was unselected.

-- Dumping structure for procedure account.UpdateMaxLevelExp
DELIMITER //
CREATE PROCEDURE `UpdateMaxLevelExp`(
	IN `p_steamid` VARCHAR(50)
)
BEGIN
	SELECT levels FROM profiles WHERE steamid = p_steamid INTO @levels;
	
	IF @levels < 10 THEN
		SET @maxlevelexp = (1 + FLOOR(@levels/2)) * 10;
	ELSE
		SET @maxlevelexp = (1 + FLOOR(@levels/10)) * 50;
	END IF;
		
	SELECT levelsexp FROM profiles WHERE steamid = p_steamid INTO @levelsexp;
	
	-- Subtract levels and levelsexp if levelsexp is negative
	IF @levelsexp < 0 THEN
		WHILE @levelsexp < 0 DO
			SET @newlevel = @levels - 1;
			SET @newlevelsexp = @levelsexp + @maxlevelexp;
			SET @levels = @newlevel;
			SET @levelsexp = @newlevelsexp;
			
			IF @levels < 10 THEN
				SET @maxlevelexp = (1 + FLOOR(@levels/2)) * 10;
			ELSE
				SET @maxlevelexp = (1 + FLOOR(@levels/10)) * 50;
			END IF;
			
			IF @levels < 1 THEN
				SET @levels = 1;
				IF @levelsexp < 0 THEN
					SET @levelsexp = 0;
				END IF;
			END IF;
		END WHILE;
	ELSE
		WHILE @levelsexp >= @maxlevelexp DO
			SET @newlevel = @levels + 1;
			SET @newlevelsexp = @levelsexp - @maxlevelexp;
			SET @levels = @newlevel;
			SET @levelsexp = @newlevelsexp;
			
			IF @levels < 10 THEN
				SET @maxlevelexp = (1 + FLOOR(@levels/2)) * 10;
			ELSE
				SET @maxlevelexp = (1 + FLOOR(@levels/10)) * 50;
			END IF;
		END WHILE;
	END IF;
	
	UPDATE profiles SET levels = @levels, levelsexp = @levelsexp WHERE steamid = p_steamid;
END//
DELIMITER ;

-- Dumping structure for procedure account.UpdateUserHiddenPrivacy
DELIMITER //
CREATE PROCEDURE `UpdateUserHiddenPrivacy`(IN p_steamid VARCHAR(50))
BEGIN
    UPDATE profiles
    SET hidden = CASE
        WHEN hidden = 0 THEN 2
        WHEN hidden = 2 THEN 0
        ELSE hidden
    END
    WHERE steamid = p_steamid AND hidden != 1;
END//
DELIMITER ;

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
