use serenity::model::prelude::RoleId;
use serenity::model::prelude::ChannelId;
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
#[commands(list, kick)]
struct General;

struct Handler;

static mut status: String = String::new();
static mut log_queue: Vec<String> = Vec::new();
static mut admin_role: u64 = 0;

#[async_trait]
impl EventHandler for Handler {
    async fn cache_ready(&self, _ctx: Context, _guilds: Vec<GuildId>) {
        let mut admin_id = std::fs::read_to_string("bot_admin_role.txt").unwrap_or(format!("0"));
        admin_id = format!("{}", admin_id.trim());
        let id = admin_id.parse::<u64>().unwrap();
        unsafe {
            admin_role = id;
        }
        tokio::spawn(async move {
            let mut chnl_id = std::fs::read_to_string("bot_log_channel.txt").unwrap_or(format!("0"));
            chnl_id = format!("{}", chnl_id.trim());
            let id = chnl_id.parse::<u64>().unwrap();
            let chnl = ChannelId(id);
            loop {
                unsafe {
                    let st = &status;
                    _ctx.set_activity(Activity::playing(&*st)).await;
                    if id != 0 {
                        for x in &log_queue {
                            chnl.say(&_ctx.http, &*x).await;
                        }
                    }
                    log_queue.clear();
                }
                tokio::time::sleep(std::time::Duration::from_millis(1000)).await;
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
pub unsafe extern "cdecl" fn output_log() {
    let mut st = std::fs::read_to_string("bot_log.txt").unwrap_or(format!(""));
    st = st.replace("@", " ").replace("\\n", "\n");
    log_queue.push(st);
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

#[command]
async fn kick(ctx: &Context, msg: &Message) -> CommandResult {
    let role_id: RoleId;
    unsafe {
        role_id = RoleId(admin_role);
    }
    let guild = msg.guild_id.unwrap();
    let hasrole = msg.author.has_role(ctx, guild, role_id).await.unwrap();
    if hasrole {
        let index = msg.content.find(" ");
        let mut msg2 = msg.content.clone().to_string();
        msg2 = msg2.replace("~kick ", "");
        std::fs::write("bot_game_cmd.txt", format!("kick {}", msg2)).unwrap();
        msg.reply(ctx, "Done.").await?;
    }
    else {
        msg.reply(ctx, "No permission.").await?;
    }

    Ok(())
}
