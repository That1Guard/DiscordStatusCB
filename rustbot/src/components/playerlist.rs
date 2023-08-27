use serenity::model::prelude::*;
use serenity::prelude::*;
use serenity::model::prelude::interaction::message_component::MessageComponentInteraction;
use std::fs;

use crate::commands::handler::hasrole;

pub async fn playerlist_refresh_component(ctx: Context, component: MessageComponentInteraction) -> Result<(), SerenityError> {
    let type_guild_id = *component.guild_id.as_ref().unwrap().as_u64();
    let has_perms = hasrole(ctx.clone(), &type_guild_id, component.user.id).await;
    if !has_perms {
        component
            .create_interaction_response(&ctx.http, |response| {
                response
                    .kind(InteractionResponseType::ChannelMessageWithSource)
                    .interaction_response_data(|data| {
                        data.ephemeral(true)
                            .content("You do not have permission to execute this command.")
                    })
            })
            .await?;
        return Ok(());
    }
    component.defer(&ctx.http).await?;
    let buf = fs::read("Discord/bot_players.txt")?;
    let st = String::from_utf8_lossy(&buf)
        .to_string()
        .replace("@", " ")
        .replace("\\n", "\n")
        .replace("~", "")
        .replace("!", "");
    component
        .edit_original_interaction_response(&ctx.http, |response| {
            response.content(st)
        })
        .await?;
    Ok(())
}
