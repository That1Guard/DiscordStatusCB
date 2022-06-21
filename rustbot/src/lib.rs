use std::ffi::CStr;
use std::ffi::CString;
use std::os::raw::c_char;

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
#[commands(list, kick, ban, admin, text, ptext)]
struct General;

struct Handler;

static mut status: String = String::new();
static mut log_queue: Vec<String> = Vec::new();
static mut admin_role: u64 = 0;
static mut prefix: String = String::new();

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
    println!("Reading \"bot_prefix.txt\"...");
    prefix = std::fs::read_to_string("bot_prefix.txt").unwrap_or(format!("~"));
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
pub unsafe extern "cdecl" fn bot_test(str_ptr: *const c_char) {
    println!("bot_test");
    let msg = CStr::from_ptr(str_ptr).to_string_lossy().into_owned();
    println!("{}", msg);
    std::fs::write("bot_test.txt", format!("{0}", msg)).unwrap();
    status = format!("bot_test");
}

#[no_mangle]
#[allow(non_snake_case)]
pub unsafe extern "cdecl" fn bot_status(str_ptr: *const c_char) {
    let st = CStr::from_ptr(str_ptr).to_string_lossy().into_owned();
    status = st;
    // status = std::fs::read_to_string("bot_status.txt").unwrap_or(format!(""));
}

#[no_mangle]
#[allow(non_snake_case)]
pub unsafe extern "cdecl" fn output_log(str_ptr: *const c_char) {
    // let mut st = std::fs::read_to_string("bot_log.txt").unwrap_or(format!(""));
    let mut st = CStr::from_ptr(str_ptr).to_string_lossy().into_owned();
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
    let pre = prefix.as_str();
    let framework = StandardFramework::new()
        .configure(|c| c.prefix(pre)) // set the bot's prefix to "~"
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

async fn input_command(name: &str, ctx: &Context, msg: &Message) -> CommandResult {
    let role_id: RoleId;
    unsafe {
        role_id = RoleId(admin_role);
    }
    let guild = msg.guild_id.unwrap();
    let hasrole = msg.author.has_role(ctx, guild, role_id).await.unwrap();
    if hasrole {
        let index = msg.content.find(" ");
        let mut msg2 = msg.content.clone().to_string();
        let repl: String;
        unsafe {
            repl = format!("{0}{1} ", prefix, name);
        }
        msg2 = msg2.replace(repl.as_str(), "");
        std::fs::write("bot_game_cmd.txt", format!("{1} {0}", msg2, name)).unwrap();
        msg.reply(ctx, "Done.").await?;
    }
    else {
        msg.reply(ctx, "No permission.").await?;
    }

    Ok(())
}

#[command]
async fn kick(ctx: &Context, msg: &Message) -> CommandResult {
    return input_command("kick", ctx, msg).await;
}

#[command]
async fn ban(ctx: &Context, msg: &Message) -> CommandResult {
    return input_command("ban", ctx, msg).await;
}

#[command]
async fn text(ctx: &Context, msg: &Message) -> CommandResult {
    return input_command("text", ctx, msg).await;
}

#[command]
async fn ptext(ctx: &Context, msg: &Message) -> CommandResult {
    return input_command("ptext", ctx, msg).await;
}

#[command]
async fn admin(ctx: &Context, msg: &Message) -> CommandResult {
    return input_command("admin", ctx, msg).await;
}