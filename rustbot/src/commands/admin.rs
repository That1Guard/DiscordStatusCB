use serenity::client::Context;
use serenity::model::Timestamp;
use serenity::prelude::*;
use serenity::model::prelude::application_command::{ApplicationCommandInteraction, CommandDataOptionValue};
use serenity::model::application::interaction::InteractionResponseType;


use crate::commands::handler::hasrole;
use crate::commands::handler::input_slashcommand;

pub async fn admin_command(ctx: Context, command: ApplicationCommandInteraction) -> Result<(), SerenityError> {
    let type_guild_id = *command.guild_id.unwrap().as_u64();
    let has_perms = hasrole(ctx.clone(), &type_guild_id, command.user.id).await;
    if !has_perms {
        command
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

    let v1arg = if let Some(CommandDataOptionValue::Integer(str)) = command.data.options.get(0).and_then(|option| option.resolved.as_ref()) {
        str.to_string()
    } else {
        "".to_string()
    };

    input_slashcommand(&format!("admin {}", v1arg));

    command
        .create_interaction_response(&ctx.http, |response| {
            response
                .kind(InteractionResponseType::ChannelMessageWithSource)
                .interaction_response_data(|data| {
                    data.ephemeral(false)
                        .embed(|embed| {
                            embed
                                .title("Issued Admin Command")
                                .description("Authorized user issued a slash command.")
                                .fields(vec![
                                    ("Command Executed:", "/admin", true),
                                    ("Arguments: ", &v1arg, true),
                                    ("User: ", &format!("{}#{}", command.user.name, command.user.discriminator), false),
                                ])
                                .footer(|f| f.text("Time Executed"))
                                .timestamp(Timestamp::now())
                        })
                })
        })
        .await?;

    Ok(())
}