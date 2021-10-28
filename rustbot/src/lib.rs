use serenity::model::prelude::Activity;
use serenity::model::prelude::GuildId;
use serenity::async_trait;
use serenity::client::{Client, Context, EventHandler};
use serenity::model::channel::Message;
use serenity::framework::standard::{
    StandardFramework,
    CommandResult,
    macros::{
        command,
        group
    }
};

#[group]
#[commands(list)]
struct General;

struct Handler;

static mut status: String = String::new();

#[async_trait]
impl EventHandler for Handler {
    async fn cache_ready(&self, _ctx: Context, _guilds: Vec<GuildId>) {
        tokio::spawn(async move {
            loop {
                unsafe {
                    // if status != None {
                        let st = &status;
                        _ctx.set_activity(Activity::playing(&*st)).await;
                    // }
                }
                tokio::time::sleep(std::time::Duration::from_millis(10000)).await;
            }
        });
    }
}

#[no_mangle]
#[allow(non_snake_case)]
pub unsafe extern "cdecl" fn start_bot() {
    std::thread::spawn(move || {
        tokio::runtime::Builder::new_multi_thread()
            .enable_all()
            .build()
            .unwrap()
            .block_on(async {
                println!("Reading \"bot_token.txt\"...");
                let token = std::fs::read_to_string("bot_token.txt").expect("Unable to read bot token!");
                main(token.trim().as_ref()).await;
            });
    });
}

#[no_mangle]
#[allow(non_snake_case)]
pub unsafe extern "cdecl" fn bot_test() {
    println!("bot_test");
    status = format!("bot_test");
}

#[no_mangle]
#[allow(non_snake_case)]
pub unsafe extern "cdecl" fn bot_status() {
    status = std::fs::read_to_string("bot_status.txt").unwrap_or(format!(""));
}

#[no_mangle]
#[allow(non_snake_case)]
pub unsafe extern "cdecl" fn player_count(count: i32) {
    let st = format!("Players Online: {}", count);
    status = st;
}

pub async unsafe fn main(rtoken: &str) {
    println!("main");
    let framework = StandardFramework::new()
        .configure(|c| c.prefix("~")) // set the bot's prefix to "~"
        .group(&GENERAL_GROUP);

    
    let mut client = Client::builder(rtoken)
        .event_handler(Handler)
        .framework(framework)
        .await
        .expect("Error creating client");

    // start listening for events by starting a single shard
    if let Err(why) = client.start().await {
        println!("An error occurred while running the client: {:?}", why);
    }
}

#[command]
async fn list(ctx: &Context, msg: &Message) -> CommandResult {
    let mut st = std::fs::read_to_string("bot_players.txt").unwrap_or(format!(""));
    st = st.replace("@", " ").replace("\\n", "\n");
    msg.reply(ctx, st).await?;

    Ok(())
}
