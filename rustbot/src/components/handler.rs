use serenity::model::prelude::*;
use serenity::prelude::*;
use serenity::model::prelude::interaction::message_component::MessageComponentInteraction;

use crate::components::playerlist::playerlist_refresh_component;

pub async fn handle_component(ctx: Context, component: MessageComponentInteraction) -> Result<(), SerenityError> {
    match component.data.custom_id.as_str() {
        "refresh_playerlist" => playerlist_refresh_component(ctx, component).await,
        _ => unimplemented_component(ctx, component).await,
    }
}

async fn unimplemented_component(ctx: Context, component: MessageComponentInteraction) -> Result<(), SerenityError> {
    component
        .create_interaction_response(&ctx.http, |response| {
            response
                .kind(InteractionResponseType::ChannelMessageWithSource)
                .interaction_response_data(|message| {
                    message
                        .content("The current component interaction isn't implemented at this time.")
                        .ephemeral(true)
                })
        })
        .await
}
