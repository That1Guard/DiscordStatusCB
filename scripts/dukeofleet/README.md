# DukeofLeet Server and Client Scripts

This repository contains scripts for the future implementation of **dukeofleet** project. These scripts encompass the fundamental components required to implement the day-to-day functionalities of the server.

## Table of Contents

- [Project Script Overview](#project-script-overview)
- [Compilation and Deployment Instructions](#compilation-and-deployment-instructions)
- [Usage](#usage)
- [Configuration](#configuration)
- [Contributing](#contributing)
- [Issues](#issues)
- [License](#license)

## Project Script Overview

This script is not currently utilized by **dukeofleet** yet, but it represents a future implementation that I intend to develop.

These scripts encompass the following functionalities:

- Handling connection joinings and ranks
- Interacting with client scripts
- Tracking player logins
- Banning and kicking of players
- Weapons choice selections
- And more...

## Compilation and Deployment Instructions

To compile and deploy the scripts, follow these steps:

1. Copy the `dukeofleet` folder to the `scripts` directory of the server folder.
2. Place the `compilersettings.ini` file into the root of the `scripts` folder.
3. Run the `compiler.exe` application to initiate the build process.
4. Move the `assets` folder to the root directory where the `server.exe` resides.
5. Place the `server.cfg` file into the root folder where the `server.exe` resides.
6. After compiling the client script, move it into the `assets` folder.

## Usage

To effectively use the server scripts, follow these steps:

1. **Initial Setup**: Before running the server, create the necessary folder structure if it doesn't exist. The server will automatically generate the `ScriptSettings\Settings.ini` configuration file if it's missing.

2. **Configuration Setup**: Open the `ScriptSettings\Settings.ini` file to configure various settings. Modify the following sections as needed:

    ```ini
    [mysql]
    host = localhost
    username = root
    database = scpcb_playerstats
    password = password

    [settings]
    serverName = Wendys
    serverDiscordLink = discord.gg/inviteme
    serverDonationMessage = my donation page @ example.com
    loadDLL = 1
    loadDiscordBot = 0
    enableChatCensor = 0
    enableNicknameCensor = 0

    [spawnwave]
    enableNewSpawnWave = 1
    setSpawnWaveTimer = 300000
    setSpawnProtectionTimer = 60000
    ```

3. **Database Configuration**: Adjust the MySQL connection settings (`host`, `username`, `database`, `password`) to match your server's database configuration.

4. **Server Settings**: Modify the `serverName`, `serverDiscordLink`, and `serverDonationMessage` to reflect your server's information.

5. **Script Loading**: Control the loading of external components using the `loadDLL` and `loadDiscordBot` options.

6. **Chat and Nickname Censorship**: Enable or disable chat and nickname censorship using the `enableChatCensor` and `enableNicknameCensor` options.

7. **Spawn Wave Configuration**: Adjust spawn wave behavior using the `enableNewSpawnWave`, `setSpawnWaveTimer`, and `setSpawnProtectionTimer` options.

8. **Customizing Roles**: Open the `ServerConfig\roles.ini` file and customize player roles as needed. For example, if you want to remove hardcoded weapons that MTF and CI spawn with, modify the roles as shown below. Note that removing these hardcoded weapons is important for proper functionality:

    ```ini
    [mtf]
    health = 150
    speedmult = 1.0
    item1 = null
    item2 = null
    item3 = Key Card Omni/key6
    item4 = null
    item5 = Small First Aid Kit/finefirstaid
    item6 = Night Vision Goggles/supernv,if scp-966 exists
    item7 = Box of ammo/boxofammo
    item8 = Handcuffs/handcuffs
    item9 = Flashbang/grenadeflashbang
    item10 = null

    [chaos soldier]
    health = 150
    speedmult = 1.0
    item1 = null
    item2 = null
    item3 = Key Card Omni/key6
    item4 = null
    item5 = Small First Aid Kit/finefirstaid
    item6 = Night Vision Goggles/supernv,if scp-966 exists
    item7 = Box of ammo/boxofammo
    item8 = Handcuffs/handcuffs
    item9 = Flashbang/grenadeflashbang
    item10 = null
    ```

    Customize the roles and items according to your preferences.

9. **Additional Customization**: Explore other configuration files to further customize the behavior and settings of the server scripts.

## Configuration

The configuration for the server scripts is managed through the `ScriptSettings\Settings.ini` file. If this file doesn't exist initially, the server will generate it when the server is run and the appropriate folder structure is present. Here's an overview of the key sections and settings you can customize:

- **MySQL Configuration** (`[mysql]`):
  - `host`: The MySQL server hostname.
  - `username`: The MySQL username for database access.
  - `database`: The name of the database for player statistics.
  - `password`: The password for the MySQL user.

- **Server Settings** (`[settings]`):
  - `serverName`: The name of your server.
  - `serverDiscordLink`: The Discord invitation link for your server.
  - `serverDonationMessage`: A message with donation information.
  - `loadDLL`: Control the loading of DLLs (0 for off, 1 for on).
  - `loadDiscordBot`: Control the loading of the Discord bot (0 for off, 1 for on).
  - `enableChatCensor`: Enable or disable chat censorship (0 for off, 1 for on).
  - `enableNicknameCensor`: Enable or disable nickname censorship (0 for off, 1 for on).

- **Spawn Wave Configuration** (`[spawnwave]`):
  - `enableNewSpawnWave`: Enable or disable the new spawn wave feature (0 for off, 1 for on).
  - `setSpawnWaveTimer`: Set the spawn wave timer in milliseconds.
  - `setSpawnProtectionTimer`: Set the spawn protection timer in milliseconds.

Modify these settings to fit your server's requirements and preferences.

## Contributing

Contributions are welcome! If you have improvements or fixes, feel free to submit a pull request. Please ensure that your code adheres to the project's coding standards. Make sure to check the [Contributing Guidelines](../../CONTRIBUTING.md) for more details.

## Issues

If you encounter any issues or have questions about the scripts, please check the [Issues](https://github.com/That1Guard/DiscordStatusCB/issues) section of this repository to see if your concern has been addressed. If not, feel free to open a new issue.

## License

This project is licensed under the [MIT License](../../LICENSE).
