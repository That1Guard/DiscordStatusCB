use serenity::client::Context;
use serenity::prelude::*;
use serenity::model::prelude::application_command::ApplicationCommandInteraction;
use serenity::model::application::interaction::InteractionResponseType;


use crate::commands::handler::hasrole;
use crate::commands::handler::input_slashcommand;

pub async fn restart_command(ctx: Context, command: ApplicationCommandInteraction) -> Result<(), SerenityError> {
    let type_guild_id = *command.guild_id.unwrap().as_u64();
    let has_perms = hasrole(ctx.clone(), &type_guild_id, command.user.id).await;
    if has_perms != true {
        _ = command.create_interaction_response(&ctx.http, |response| {
            response.kind(InteractionResponseType::ChannelMessageWithSource)
                .interaction_response_data(|data| {
                    data.ephemeral(true)
                    .content("You do not have permission to execute this command.")
                })
        }).await;
        return Ok(())
    }
    input_slashcommand("restart");
    _ = command.create_interaction_response(&ctx.http, |response| {
        response.kind(InteractionResponseType::ChannelMessageWithSource)
            .interaction_response_data(|data| {
                data.ephemeral(false)
                    .content("Running...\nPlease wait while server restarts...")
            })
    }).await;
    Ok(())
}