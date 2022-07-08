use std::collections::HashSet;
use std::ffi::CStr;
use std::os::raw::c_char;
use serenity::framework::standard::Args;
use serenity::framework::standard::CommandGroup;
use serenity::framework::standard::macros::help;
use serenity::model::id::UserId;
use serenity::model::prelude::RoleId;
use serenity::model::prelude::ChannelId;
use serenity::model::prelude::Activity;
use serenity::model::prelude::GuildId;
use serenity::async_trait;
use serenity::client::{Client, Context, EventHandler};
use serenity::model::{channel::Message, gateway::Ready};
use serenity::framework::standard::{
    help_commands,
    HelpOptions,
    StandardFramework,
    CommandResult,
    macros::{
        command,
        group
    }
};

#[group]
#[only_in(guilds)]
#[commands(list, kick, ban, admin, say, psay, restart, stats, unban, steamid)]
struct General;

struct Handler;

static mut status: String = String::new();
static mut log_queue: Vec<String> = Vec::new();
static mut admin_log_queue: Vec<String> = Vec::new();
static mut admin_role: u64 = 0;
static mut prefix: String = String::new();

#[async_trait]
impl EventHandler for Handler {
    async fn cache_ready(&self, _ctx: Context, _guilds: Vec<GuildId>) {
        let mut admin_id = std::fs::read_to_string("Discord/bot_admin_role.txt").unwrap_or(format!("0"));
        admin_id = format!("{}", admin_id.trim());
        let id = admin_id.parse::<u64>().unwrap();
        unsafe {
            admin_role = id;
        }
        tokio::spawn(async move {
            let mut chnl_id = std::fs::read_to_string("Discord/bot_log_channel.txt").unwrap_or(format!("0"));
            let mut admin_chnl_id = std::fs::read_to_string("Discord/bot_admin_log_channel.txt").unwrap_or(format!("0"));
            chnl_id = format!("{}", chnl_id.trim());
            admin_chnl_id = format!("{}", admin_chnl_id.trim());
            let id = chnl_id.parse::<u64>().unwrap();
            let adminid = admin_chnl_id.parse::<u64>().unwrap();
            let chnl = ChannelId(id);
            let adminchnl = ChannelId(adminid);
            
            loop {
                unsafe {
                    let st = &status;
                    _ctx.set_activity(Activity::listening(&*st)).await;
                    if id != 0 {
                        let mut chat_logs = String::new();
                        for x in &log_queue {
                            if x.is_empty() {
                                continue;
                            } else {
                                chat_logs += x;
                                chat_logs += "\n";
                            }
                        }
                        if !chat_logs.is_empty() {
                            if let Err(why) = chnl.say(&_ctx.http, &*chat_logs).await {
                                println!("[Discord] Error sending chat log message: {:?}", why);
                            }
                        }
                    }
                    if adminid != 0 {
                        let mut chat_logs = String::new();
                        for x in &admin_log_queue {
                            if x.is_empty() {
                                continue;
                            } else {
                                chat_logs += x;
                                chat_logs += "\n";
                            }
                        }
                        if !chat_logs.is_empty() {
                            if let Err(why) = adminchnl.say(&_ctx.http, &*chat_logs).await {
                                println!("[Discord] Error sending admin log message: {:?}", why);
                            }
                        }
                    }
                    log_queue.clear();
                    admin_log_queue.clear();
                }
                tokio::time::sleep(std::time::Duration::from_millis(5000)).await;
            }
        });
    }
    async fn ready(&self, _: Context, ready: Ready) {
        println!("[Discord] Bot {} is connected!", ready.user.name);
    }
}

#[no_mangle]
#[allow(non_snake_case)]
pub unsafe extern "cdecl" fn start_bot() {
    std::fs::create_dir_all("./Discord/").expect("[Discord] Unable to create folder ./Discord/");
    std::fs::create_dir_all("./DataBase/").expect("[Discord] Unable to create folder ./DataBase/");
    println!("[Discord] Reading Bot Prefix...");
    prefix = std::fs::read_to_string("Discord/bot_prefix.txt").unwrap_or(format!("~"));
    std::thread::spawn(move || {
        tokio::runtime::Builder::new_multi_thread()
            .enable_all()
            .build()
            .unwrap()
            .block_on(async {
                println!("[Discord] Reading set Bot Token...");
                let token = std::fs::read_to_string("Discord/bot_token.txt").expect("[Discord] Unable to read bot token!");
                main(token.trim().as_ref()).await;
            });
    });
}

#[no_mangle]
#[allow(non_snake_case)]
pub unsafe extern "cdecl" fn bot_status(str_ptr: *const c_char) {
    let st = CStr::from_ptr(str_ptr).to_string_lossy().into_owned();
    status = st;
}

#[no_mangle]
#[allow(non_snake_case)]
pub unsafe extern "cdecl" fn output_log(str_ptr: *const c_char) {
    let mut st = CStr::from_ptr(str_ptr).to_string_lossy().into_owned();
    st = st.replace("@", " ").replace("\\n", "\n").replace("~", "").replace("!","").replace(":", "");
    log_queue.push(st);
}

#[no_mangle]
#[allow(non_snake_case)]
pub unsafe extern "cdecl" fn output_admin_log(str_ptr: *const c_char) {
    let mut st = CStr::from_ptr(str_ptr).to_string_lossy().into_owned();
    st = st.replace("@", " ").replace("\\n", "\n").replace("~", "").replace("!","").replace(":", "");
    admin_log_queue.push(st);
}

pub async unsafe fn main(rtoken: &str) {
    log_panics::init();
    let pre = prefix.as_str();
    let framework = StandardFramework::new()
        .configure(|c| c.prefix(pre)) // set the bot's prefix to "~"
        .help(&MY_HELP)
        .group(&GENERAL_GROUP);

    
    let mut client = Client::builder(rtoken)
        .event_handler(Handler)
        .framework(framework)
        .await
        .expect("[Discord] Error creating client");

    // start listening for events by starting a single shard
    if let Err(why) = client.start().await {
        println!("[Discord] An error occurred while running the client: {:?}", why);
    }
}

#[command]
#[num_args(0)]
#[description = "Lists all users available on the server at the current time."]
#[aliases("online")]
#[help_available]
async fn list(ctx: &Context, msg: &Message) -> CommandResult {
    let mut st = std::fs::read_to_string("Discord/bot_players.txt").unwrap_or(format!(""));
    st = st.replace("@", " ").replace("\\n", "\n").replace("~", "").replace("!","");
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
        std::fs::write("Discord/bot_game_cmd.txt", format!("{1} {0}", msg2, name)).unwrap();
        msg.reply(ctx, "Running...").await?;
    }
    else {
        msg.reply(ctx, "No permission.").await?;
    }

    Ok(())
}

#[command]
#[num_args(1)]
#[description = "Kicks user from SCP:CB Server. Arguements: ID"]
#[example = "3"]
#[help_available]
async fn kick(ctx: &Context, msg: &Message) -> CommandResult {
    return input_command("kick", ctx, msg).await;
}

#[command]
#[description = "Bans user from SCP:CB Server. Arguements: BANTYPE, ID, MINUTES"]
#[num_args(3)]
#[example = "steamid 294563211 5"]
#[example = "pid 8 5"]
#[help_available]
async fn ban(ctx: &Context, msg: &Message) -> CommandResult {
    return input_command("ban", ctx, msg).await;
}

#[command]
#[min_args(1)]
#[description = "Sends a global message to the SCP Server chat, appearing in their in-game chat. Arguements: [STRING]"]
#[aliases("say")]
#[example = "Hello everyone."]
#[help_available]
async fn say(ctx: &Context, msg: &Message) -> CommandResult {
    return input_command("say", ctx, msg).await;
}

#[command]
#[min_args(1)]
#[description = "Sends a private message to specific user, appearing in their in-game chat. Arguements: [STRING]"]
#[aliases("psay")]
#[example = "1 Hello random username1."]
#[help_available]
async fn psay(ctx: &Context, msg: &Message) -> CommandResult {
    return input_command("psay", ctx, msg).await;
}

#[command]
#[num_args(1)]
#[description = "Toggle admin privileges for a specific user. Arguements: ID"]
#[example = "1"]
#[help_available]
#[aliases("toggleadmin", "ta")]
async fn admin(ctx: &Context, msg: &Message) -> CommandResult {
    return input_command("admin", ctx, msg).await;
}

#[command]
#[num_args(1)]
#[description = "Show stats of a specific user logged in by ID. ID's obtainable using `list` command. Arguements: ID"]
#[example = "1"]
#[help_available]
#[aliases("stat")]
async fn stats(ctx: &Context, msg: &Message) -> CommandResult {
    return input_command("stats", ctx, msg).await;
}

#[command]
#[num_args(1)]
#[description = "Unban player from SCPCB and allows them to join. Arguements: SteamID"]
#[example = "1280464321"]
#[help_available]
async fn unban(ctx: &Context, msg: &Message) -> CommandResult {
    return input_command("unban", ctx, msg).await;
}

#[command]
#[num_args(1)]
#[description = "Lookup SteamID from connected PlayerID. Arguements: PlayerID"]
#[example = "6"]
#[help_available]
async fn steamid(ctx: &Context, msg: &Message) -> CommandResult {
    return input_command("steamid", ctx, msg).await;
}

#[command]
#[num_args(1)]
#[description = "Forcefully restarts the SCP:CB server. Arguements: STRING"]
#[example = "confirm"]
#[help_available]
async fn restart(ctx: &Context, msg: &Message, args: Args) -> CommandResult {
    let _response = args.rest();
    if _response == "confirm" {
        msg.channel_id.say(&ctx.http, "Please wait while server restarts...").await?;
        return input_command("restart", ctx, msg).await;
    } 
    msg.channel_id.say(&ctx.http, "Either no permission or invalid arguement detected.").await?;
    Ok(())
}


#[help]
#[individual_command_tip = "SCP:CB Multiplayer Bot Help Page\n\n
If you want more information about a specific command, just pass the command as argument.\n\n
Example:\n
```help list```"]
#[command_not_found_text = "ERROR. Could not find: `{}`."]
#[max_levenshtein_distance(3)]
#[indention_prefix = "+"]
#[lacking_permissions = "hide"]
#[lacking_ownership = "hide"]
#[lacking_role = "nothing"]
#[strikethrough_commands_tip_in_guild = ""]
#[strikethrough_commands_tip_in_dm = ""]
#[group_prefix = "Available Commands:"]
async fn my_help(
    context: &Context,
    msg: &Message,
    args: Args,
    help_options: &'static HelpOptions,
    groups: &[&'static CommandGroup],
    owners: HashSet<UserId>,
) -> CommandResult {
    let _ = help_commands::with_embeds(context, msg, args, help_options, groups, owners).await;
    Ok(())
}