use serenity::{
    builder::CreateApplicationCommands, 
    model::{
        application::interaction::{
            InteractionResponseType, 
            application_command::ApplicationCommandInteraction
        }, 
        prelude::{
            command::CommandOptionType, 
            RoleId, 
            UserId
        }
    }, 
    prelude::*
};

use crate::commands::admin::admin_command;
use crate::commands::ban::ban_command;
use crate::commands::list::list_command;
use crate::commands::kick::kick_command;
use crate::commands::psay::psay_command;
use crate::commands::restart::restart_command;
use crate::commands::say::say_command;
use crate::commands::steamid::steamid_command;
use crate::commands::unban::unban_command;
use crate::commands::xp::xp_command;

use crate::ADMIN_ROLE;
use crate::LEADERBOARD_ROLE;

pub fn create_commands(commands: &mut CreateApplicationCommands) -> &mut CreateApplicationCommands {
    commands
        .create_application_command(|command| {
            command.name("restart")
            .description("Restarts the server.")
            .dm_permission(false)
        })
        .create_application_command(|command| {
            command.name("list")
            .description("Lists the current players on the server.")
            .dm_permission(false)
        })
        .create_application_command(|command| {
            command.name("kick")
            .description("Kicks a player from the server.")
            .dm_permission(false)
            .create_option(|option| {
                option
                    .name("playerid")
                    .description("The user playerid for the server to kick.")
                    .kind(CommandOptionType::Integer)
                    .min_int_value(1)
                    .max_int_value(64)
                    .required(true)
            })
            .create_option(|option| {
                option
                    .name("reason")
                    .description("The kick message to send to server")
                    .kind(CommandOptionType::String)
                    .required(true)
            })
        })
        .create_application_command(|command| {
            command.name("xp")
            .description("Command for interacting with the Leaderboard.")
            .dm_permission(false)
            .create_option(|option| {
                option
                    .name("option")
                    .description("Specifies to the interaction option for the leaderboard.")
                    .kind(CommandOptionType::String)
                    .required(true)
                    .add_string_choice(
                        "Give",
                        "give",
                    )
                    .add_string_choice(
                        "Take",
                        "take",
                    )
                    .add_string_choice(
                        "Visibility",
                        "visibility",
                    )
            })
            .create_option(|option| {
                option
                    .name("steamid")
                    .description("The Stean ID for the that you determined from previous option to interact with the leaderboard.")
                    .kind(CommandOptionType::Integer)
                    .min_int_value(65)
                    .required(true)
            })
            .create_option(|option| {
                option
                    .name("value")
                    .description("The operation value to interact with the leaderboard.")
                    .kind(CommandOptionType::Integer)
                    .min_int_value(0)
                    .max_int_value(2147483647)
                    .required(true)
            })
        })
        .create_application_command(|command| {
            command.name("ban")
            .description("Bans a player from the server.")
            .dm_permission(false)
            .create_option(|option| {
                option
                    .name("playertype")
                    .description("Specifies to the server what playertype you wish to ban with.")
                    .kind(CommandOptionType::String)
                    .required(true)
                    .add_string_choice(
                        "Steam ID",
                        "steamid",
                    )
                    .add_string_choice(
                        "Player ID",
                        "pid",
                    )
            })
            .create_option(|option| {
                option
                    .name("id")
                    .description("The user ID for the server to kick that you determined from previous option.")
                    .kind(CommandOptionType::Integer)
                    .min_int_value(1)
                    .required(true)
            })
            .create_option(|option| {
                option
                    .name("minutes")
                    .description("The amount of time in minutes that the player should be banned for.")
                    .kind(CommandOptionType::Integer)
                    .min_int_value(1)
                    .max_int_value(2147483647)
                    .required(true)
            })
        })
        .create_application_command(|command| {
            command.name("unban")
            .description("Kicks a player from the server.")
            .dm_permission(false)
            .create_option(|option| {
                option
                    .name("steamid")
                    .description("Unbans the user Steam ID from the server database.")
                    .kind(CommandOptionType::Integer)
                    .min_int_value(1)
                    .required(true)
            })
        })
        .create_application_command(|command| {
            command.name("say")
            .description("Send a global message to the server.")
            .dm_permission(false)
            .create_option(|option| {
                option
                    .name("message")
                    .description("A global message to send to server")
                    .kind(CommandOptionType::String)
                    .required(true)
            })
        })
        .create_application_command(|command| {
            command.name("psay")
            .description("Send a player specific message with a valid Player ID currently on the server.")
            .dm_permission(false)
            .create_option(|option| {
                option
                    .name("playerid")
                    .description("The user playerid that the target player is using.")
                    .kind(CommandOptionType::Integer)
                    .min_int_value(1)
                    .max_int_value(64)
                    .required(true)
            })
            .create_option(|option| {
                option
                    .name("message")
                    .description("The message to send to that specific player on the server.")
                    .kind(CommandOptionType::String)
                    .required(true)
            })
        })
        .create_application_command(|command| {
            command.name("admin")
            .description("Toggle RCON admin access for user playerid that is currently on the server.")
            .dm_permission(false)
            .create_option(|option| {
                option
                    .name("playerid")
                    .description("The user playerid that the target player is using.")
                    .kind(CommandOptionType::Integer)
                    .min_int_value(1)
                    .max_int_value(64)
                    .required(true)
            })
        })
        .create_application_command(|command| {
            command.name("steamid")
            .description("Lookup the current Steam is associated with the assigned Player ID.")
            .dm_permission(false)
            .create_option(|option| {
                option
                    .name("playerid")
                    .description("The user playerid that the target player is using.")
                    .kind(CommandOptionType::Integer)
                    .min_int_value(1)
                    .max_int_value(64)
                    .required(true)
            })
        })
}

pub async fn handle_command(ctx: Context, command: ApplicationCommandInteraction) -> Result<(), SerenityError> {
    match command.data.name.as_str() {
        "restart" => restart_command(ctx, command).await,
        "list" => list_command(ctx, command).await,
        "kick" => kick_command(ctx, command).await,
        "ban" => ban_command(ctx, command).await,
        "unban" => unban_command(ctx, command).await,
        "xp" => xp_command(ctx, command).await,
        "say" => say_command(ctx, command).await,
        "psay" => psay_command(ctx, command).await,
        "admin" => admin_command(ctx, command).await,
        "steamid" => steamid_command(ctx, command).await,
        _ => unimplemented_command(ctx, command).await
    }
}

async fn unimplemented_command(ctx: Context, command: ApplicationCommandInteraction) -> Result<(), SerenityError> {
    command.create_interaction_response(&ctx.http, |response| {
        response.kind(InteractionResponseType::ChannelMessageWithSource)
            .interaction_response_data(|message| {
                message.content("The executed command isn't implemented at this time.").ephemeral(true)
            })
    }).await
}

pub fn input_slashcommand(msg: &str) {
    std::fs::write("Discord/bot_game_cmd.txt", msg).expect("Failed to write to file");
}

pub fn leaderboard_slashcommand(msg: &str) {
    std::fs::write("Discord/bot_leaderboard_cmd.txt", msg).expect("Failed to write to file");
}

pub async fn hasrole(ref_ctx: Context, guild: &u64, user_id: UserId) -> bool {
    let role_id = RoleId(unsafe { ADMIN_ROLE });
    let ctx_http = ref_ctx.http.clone();
    let perm_check = user_id
        .to_user(ctx_http.clone())
        .await
        .expect("Failed to fetch user")
        .has_role(ctx_http, *guild, role_id)
        .await;
    perm_check.unwrap_or(false)
}

pub async fn hasrole_leaderboard(ref_ctx: Context, guild: &u64, user_id: UserId) -> bool {
    let role_id = RoleId(unsafe { LEADERBOARD_ROLE });
    let ctx_http = ref_ctx.http.clone();
    let perm_check = user_id
        .to_user(ctx_http.clone())
        .await
        .expect("Failed to fetch user")
        .has_role(ctx_http, *guild, role_id)
        .await;
    perm_check.unwrap_or(false)
}