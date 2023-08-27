use serenity::client::Context;
use serenity::model::Timestamp;
use serenity::prelude::*;
use serenity::model::prelude::application_command::{ApplicationCommandInteraction, CommandDataOptionValue};
use serenity::model::application::interaction::InteractionResponseType;


use crate::commands::handler::hasrole;
use crate::commands::handler::input_slashcommand;

pub async fn ban_command(ctx: Context, command: ApplicationCommandInteraction) -> Result<(), SerenityError> {
    let mut v1arg: String = "".to_string();
    let mut v2arg: String = "".to_string();
    let mut v3arg: String = "".to_string();
    
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

    if let CommandDataOptionValue::String(str) = command.data.options.get(0).expect("msg").resolved.as_ref().expect("msg") {
        v1arg = str.to_string();
    }

    if let CommandDataOptionValue::Integer(str) = command.data.options.get(1).expect("msg").resolved.as_ref().expect("msg") {
        v2arg = str.to_string();
    }

    if let CommandDataOptionValue::Integer(str) = command.data.options.get(2).expect("msg").resolved.as_ref().expect("msg") {
        v3arg = str.to_string();
    }
    
    let append_cmd = format!("{} {} {}", v1arg, v2arg, v3arg);
    input_slashcommand(&("ban ".to_owned() + &append_cmd.to_string()));
    _ = command.create_interaction_response(&ctx.http, |response| {
        response.kind(InteractionResponseType::ChannelMessageWithSource)
            .interaction_response_data(|data| {
                data.ephemeral(false)
                    .embed(|embed| {
                        embed.title("Issued Admin Command")
                            .description("Authorized user issued a slash command.")
                            .fields(vec![
                                ("Command Executed:", "/ban", true),
                                ("Arguements: ", &append_cmd.to_string(), true),
                                ("User: ", &(command.user.name.as_str().to_owned() + &"#".to_string() + &command.user.discriminator.to_string()) , false),
                            ])
                            .footer(|f| f.text("Time Executed"))
                            .timestamp(Timestamp::now())
                    })
            })
    }).await;
    Ok(())
}