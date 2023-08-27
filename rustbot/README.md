# Rustbot Project

The Rustbot project presents a Discord bot script designed to provide specific functionalities for managing a game server. This bot interacts with a Discord server, handling various commands and events related to server administration and management.

## Functionality

The Rustbot performs the following functions:

- Responding to slash commands and application interactions.
- Managing server-related actions like restarting, listing players, and more.
- Administering various player actions such as kicking, banning, and messaging.
- Facilitating interactions with a leaderboard.
- Handling role-based permissions for certain actions.

## Command Creation

The Rustbot dynamically creates and handles various application commands. These commands include:

- `/restart`: Restarts the server.
- `/list`: Lists current players on the server.
- `/kick`: Kicks a player from the server.
- `/ban`: Bans a player from the server.
- `/unban`: Unbans a player from the server.
- `/xp`: Manages interactions with the leaderboard, including giving, taking, and visibility.
- `/say`: Sends a global message to the server.
- `/psay`: Sends a player-specific message on the server.
- `/admin`: Toggles RCON admin access for a player.
- `/steamid`: Looks up the Steam ID associated with a player's assigned Player ID.

## Role-Based Permissions

The bot supports role-based permissions for specific actions:

- Bot administrators can perform admin actions.
- Users with a designated leaderboard role can interact with the leaderboard.

## Configuration

To use the Rustbot, perform the following steps:

1. Create a `bot_token.txt` file in the `Discord` folder and enter the bot token.
2. Create a `bot_prefix.txt` file in the `Discord` folder and specify the command prefix.
3. Customize role IDs for bot administrators and the leaderboard in `bot_admin_role.txt` and `bot_leaderboard_role.txt`, respectively.
4. Define log channels in `bot_log_channel.txt` and `bot_admin_log_channel.txt` for chat and admin logs.
5. Additionally, create a `bot_players.txt` file in the `Discord` folder to store player-related data.

## Building the Project

You can build the Rustbot project using one of the following methods:

- On Windows: Run the `build.bat` script in the command prompt.
- On Unix-like Shell when on Windows: Run the `build.sh` script in the terminal.

Alternatively, you can use the Cargo command-line tool to build the project:

```sh
cargo build --target=i686-pc-windows-msvc --release
```

## Usage

1. Invite the bot to your Discord server.
2. Make sure to have the required configuration files set up.
3. Build the project using the provided scripts or Cargo.
4. Use the available commands to manage the server and interact with players.

## Acknowledgments

The Rustbot utilizes libraries like Serenity, Rustric, and Rust's other capabilities to provide a powerful server management tool. Special thanks to the Rust and Discord communities for their support.

## License

This project is licensed under the [MIT License](../../LICENSE).