use serenity::client::Context;
use serenity::model::prelude::component::ButtonStyle;
use serenity::prelude::*;
use serenity::model::prelude::application_command::ApplicationCommandInteraction;
use serenity::model::application::interaction::InteractionResponseType;

use std::{
    fs::File, 
    io::{BufReader, Read}
};

use crate::commands::handler::hasrole;

pub async fn list_command(ctx: Context, command: ApplicationCommandInteraction) -> Result<(), SerenityError> {
    let type_guild_id = *command.guild_id.unwrap().as_u64();
    let has_perms = hasrole(ctx.clone(), &type_guild_id, command.user.id).await;
    if !has_perms {
        command
            .create_interaction_response(&ctx.http, |response| {
                response
                    .kind(InteractionResponseType::ChannelMessageWithSource)
                    .interaction_response_data(|data| {
                        data.ephemeral(true).content("You do not have permission to execute this command.")
                    })
            })
            .await?;
        return Ok(());
    }
    let file = File::open("Discord/bot_players.txt")?;
    let mut reader = BufReader::new(file);
    let mut buf = Vec::<u8>::new();
    reader.read_to_end(&mut buf)?;
    let st = String::from_utf8_lossy(&buf)
        .replace("@", " ")
        .replace("\\n", "\n")
        .replace("~", "")
        .replace("!", "");
    command
        .create_interaction_response(&ctx.http, |response| {
            response
                .kind(InteractionResponseType::ChannelMessageWithSource)
                .interaction_response_data(|data| {
                    data.ephemeral(true)
                        .content(st.to_string())
                        .components(|components| {
                            components.create_action_row(|action_row| {
                                action_row.create_button(|button| {
                                    button
                                        .style(ButtonStyle::Secondary)
                                        .emoji('🔁')
                                        .custom_id("refresh_playerlist")
                                })
                            })
                        })
                })
        })
        .await?;
    Ok(())
}