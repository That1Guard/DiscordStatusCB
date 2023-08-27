//
// =====================================
// ||         Constants Definition    ||
// ||               Block             ||
// =====================================
//
// MYSQL Database Connection ID
global MysqlConnection          = 0

// ================================
// ||    External Lib Variables  ||
// ================================
//
// DLL ID for Discord Bot/Function Lib
global bot                      = -1


// Script settings
global serverName               = "YourServerName"
global serverDiscord            = "YourServerDiscordLink"
global serverDonation           = "YourDonationPageMessage"
global chatCensor               = 0
global censorNickName           = 0
global loadLibrary              = 0
global discordbot               = 0
global newSpawnWave             = 0
global newSpawnWaveTimer        = 300000
global spawnWaveProtection      = 60000

// =====================================
// ||     Gameplay and State Data     ||
// =====================================
//
// General Round and Player Data
global roundStartTime           = 0
global currentPlayerCount       = 0
global prevPlayerCount          = -1
global remainingMTFEnemy        = -1
global paIntroTimerID           = 0
global mtfSpawnWaveTimerID      = 0
global cameraCheckTime          = 0
global cameraInCheck            = 0
global commandInUse             = 0
global roundStarted             = 0
global PlayersDead              = 0
global SmallRound               = 0
global BigRound                 = 0
global peanutRound              = 0
global instaMDRound             = 0
global PlayerNut			    = [MAX_PLAYERS, SE_INT]

// Player Permission and Ranking Manager
global PlayerRanks			    = [MAX_PLAYERS, SE_INT]

global CurrentPlayerTypes       = [MAX_PLAYERS, SE_INT]
global foundShout               = [5, SE_INT]

// EndScreen data
global Dead                     = 0
global SCPSDead                 = 0
global FacilityDead             = 0
global MTFDead                  = 0
global CIDead                   = 0
global ClassDE                  = 0
global SciEscape                = 0
global DEscape                  = 0
global Warhead                  = 0
global ended                    = 0

// Word Censor, Voice Censor
global PlayerCensorViolations   = [MAX_PLAYERS, SE_INT]
global hasPlayerGlobalMute      = [MAX_PLAYERS, SE_INT]

// Event Data
global doesD9341Poss            = 0
global hasAnnouncedPossToD9341  = 0
global thisD9341                = 0
global DoorID079                = 0
global nutSpawned               = false

// Spawnwave Timer Stats and Anti-Spawncamp
global remainingSpawnTime       = 0
global spawnwaveJustSpawned     = 0
global playersJustSpawned       = [MAX_PLAYERS, SE_INT]

// Levers Stuff
// global lightsOn                 = 1   // Uncomment this to allow control of lights, experimental
global gatesUnlocked            = 0     // Failsafe in case room isn't generated. We turn it on when the room is available.
global checkpointLightUnlock    = 1     // Failsafe in case room isn't generated. We turn it on when the room is available.

// GateA and GateB Lockdown Checks
global gateALockdownID          = 0
global gateBLockdownID          = 0

// Lightzone Checkpoint Array
// Array will be stored with 0 first, so if we have 10 keypads, then it'll be: 0..9
global lightzoneDoorID          = [16, SE_INT]
global lightzoneTotalDoors      = 0

// Item Possession Manager for MTF/CI on Primary/Secondary Weapon Loadout
global primaryWeaponLoadout     = [MAX_PLAYERS, SE_INT] // Stores a byte of choice id
global primaryWeaponItemID      = [MAX_PLAYERS, SE_INT] // Stores an integer of weapon id
global secondaryWeaponLoadout   = [MAX_PLAYERS, SE_INT] // Stores a byte of choice id
global secondaryWeaponItemID    = [MAX_PLAYERS, SE_INT] // Stores an integer of weapon id
global explosiveWeaponLoadout   = [MAX_PLAYERS, SE_INT] // 
global explosiveWeaponItemID    = [MAX_PLAYERS, SE_INT] //