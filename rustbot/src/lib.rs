mod commands;
mod components;

use commands::handler::handle_command;
use components::handler::handle_component;
use commands::handler::create_commands;

use lazy_static::lazy_static;
use std::collections::HashSet;
use std::ffi::CStr;
use std::os::raw::c_char;
use std::sync::Mutex;
use std::time::SystemTime;
use std::time::UNIX_EPOCH;
use rustrict::{CensorStr, Type};
use serenity::model::prelude::interaction::Interaction;
use serenity::framework::standard::{Args, CommandGroup};
use serenity::framework::standard::macros::help;
use serenity::model::id::UserId;
use serenity::model::prelude::ChannelId;
use serenity::model::prelude::Activity;
use serenity::model::prelude::GuildId;
use serenity::model::application::command::Command;
use serenity::async_trait;
use serenity::client::{Client, Context, EventHandler};
use serenity::model::{channel::Message, gateway::Ready, gateway::GatewayIntents};
use serenity::http::Http;
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

#[group("Hoster")]
#[owners_only]
#[commands(upload, emergency_kill, force_exit)]
struct Hoster;

struct Handler;

static mut LOG_QUEUE: Vec<String> = Vec::new();
static mut ADMIN_LOG_QUEUE: Vec<String> = Vec::new();
static mut ADMIN_ROLE: u64 = 0;
static mut LEADERBOARD_ROLE: u64 = 0;
static mut COST_TIME: u64 = 0;
static mut HEARTBEAT_TIME: u64 = 0;

// TODO: (@That1Guard) Use once_cell since lazy_static is now deprecated
lazy_static! {
    static ref PREFIX: Mutex<String> = Mutex::new(String::new());
    static ref STATUS: Mutex<String> = Mutex::new(String::new());
}

#[async_trait]
impl EventHandler for Handler {
    async fn interaction_create(&self, ctx: Context, interactions: Interaction) {
        match interactions {
            // std::mem::forget(interactions);
            Interaction::ApplicationCommand(command) => {
                // Commands are implemented in src/commands/**/
                if let Err(why) = handle_command(ctx, command).await {
                    println!("Slash command failed: {}", why);
                };
            },
            Interaction::MessageComponent(component) => {
                // Components are implemented in src/components/**/
                if let Err(why) = handle_component(ctx, component).await {
                    println!("Message component failed: {}", why);
                }
            },
            _ => println!("Missing an interaction: {}", interactions.kind().num())
        }
    }
    async fn cache_ready(&self, _ctx: Context, _guilds: Vec<GuildId>) {
        let admin_id = std::fs::read_to_string("Discord/bot_admin_role.txt").unwrap_or_default().trim().parse::<u64>().unwrap_or(0);
        let leaderboard_id = std::fs::read_to_string("Discord/bot_leaderboard_role.txt").unwrap_or_default().trim().parse::<u64>().unwrap_or(0);
        
        unsafe {
            ADMIN_ROLE = admin_id;
            LEADERBOARD_ROLE = leaderboard_id;
        }

        let chnl_id = std::fs::read_to_string("Discord/bot_log_channel.txt").unwrap_or_default().trim().parse::<u64>().unwrap_or(0);
        let admin_chnl_id = std::fs::read_to_string("Discord/bot_admin_log_channel.txt").unwrap_or_default().trim().parse::<u64>().unwrap_or(0);

        let chnl = ChannelId(chnl_id);
        let adminchnl = ChannelId(admin_chnl_id);
        tokio::spawn(async move {            
            loop {
                unsafe {
                    let status_clone = STATUS.lock().unwrap().clone();
                    _ctx.set_activity(Activity::listening(&status_clone)).await;
                    if chnl != 0 {
                        let mut chat_logs = String::new();
                        for x in &LOG_QUEUE {
                            if !x.is_empty() {
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
                    LOG_QUEUE.clear();

                    if adminchnl != 0 {
                        let mut chat_logs = String::new();
                        for x in &ADMIN_LOG_QUEUE {
                            if !x.is_empty() {
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
                    ADMIN_LOG_QUEUE.clear();
                    COST_TIME = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();
                    if HEARTBEAT_TIME != 0 && COST_TIME > HEARTBEAT_TIME + 70  {
                        // println!("[Discord][DEBUG] Cost Time detected as: {:?} while Heartbeat is {:?}", COST_TIME, HEARTBEAT_TIME);
                        std::process::exit(0);
                    }
                }
                tokio::time::sleep(std::time::Duration::from_millis(5000)).await;
            }
        });
    }
    async fn ready(&self, ctx: Context, ready: Ready) {        
        println!("[Discord] Bot {} is connected!", ready.user.name);

        Command::set_global_application_commands(&ctx.http, create_commands)
        .await.expect("Failed to set application commands");
    }
}

#[no_mangle]
#[allow(non_snake_case)]
pub unsafe extern "cdecl" fn s2d_heartbeat() {
    HEARTBEAT_TIME = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();
}

fn set_prefix(prefix: String) {
    *PREFIX.lock().unwrap() = prefix;
}

#[no_mangle]
#[allow(non_snake_case)]
pub extern "cdecl" fn start_bot() {
    std::fs::create_dir_all("./Discord/").expect("[Discord] Unable to create folder ./Discord/");
    std::fs::create_dir_all("./DataBase/").expect("[Discord] Unable to create folder ./DataBase/");
    println!("[Discord] Reading Bot Prefix...");
    let prefix = std::fs::read_to_string("Discord/bot_prefix.txt").unwrap_or(format!("~"));
    set_prefix(prefix);
    
    std::thread::spawn(move || {
        tokio::runtime::Builder::new_multi_thread()
            .enable_all()
            .build()
            .unwrap()
            .block_on(async {
                println!("[Discord] Reading set Bot Token...");
                let token = std::fs::read_to_string("Discord/bot_token.txt").expect("[Discord] Unable to read bot token!");
                if let Err(err) = main(token.trim().as_ref()).await {
                    eprintln!("[Discord] An error occurred during execution: {}", err);
                }
            });
    });
}

#[no_mangle]
#[allow(non_snake_case)]
pub extern "cdecl" fn isTextCensorable(str_ptr: *const c_char) -> i32 {

    // Safety: Ensure the input pointer is valid and not null.
    if str_ptr.is_null() {
        return 0;
    }

    // Safety: Convert the input C string to Rust String.
    let cstr = unsafe { CStr::from_ptr(str_ptr) };
    let st = match cstr.to_str() {
        Ok(s) => s.to_lowercase(),
        Err(_) => return 0, // Return 0 if the C string is not valid UTF-8.
    };

    let shouldCensor = st.is(Type::SEVERE) && st.isnt(Type::SPAM); // Predefine the `rustric` word filter
    
    // Convert the boolean result to i32
    if shouldCensor {
        return 1;
    } else {
        return 0;
    }
}

#[no_mangle]
#[allow(non_snake_case)]
pub extern "cdecl" fn bot_status(str_ptr: *const c_char) {

    // Safety: Ensure the input pointer is valid and not null.
    if str_ptr.is_null() {
        return;
    }

    // Safety: Convert the input C string to Rust String.
    let cstr = unsafe { CStr::from_ptr(str_ptr) };
    let st = match cstr.to_str() {
        Ok(s) => s.to_owned(),
        Err(_) => return, // Return early if the C string is not valid UTF-8.
    };
    STATUS.lock().unwrap().clear();
    STATUS.lock().unwrap().push_str(&st);
}

#[no_mangle]
#[allow(non_snake_case)]
pub unsafe extern "cdecl" fn output_log(str_ptr: *const c_char) {
    let mut st = CStr::from_ptr(str_ptr).to_string_lossy().into_owned();
    st = st.replace("@", " ").replace("\\n", "\n").replace("~", "").replace("!","").replace(":", "");
    LOG_QUEUE.push(st);
}

#[no_mangle]
#[allow(non_snake_case)]
pub unsafe extern "cdecl" fn output_admin_log(str_ptr: *const c_char) {
    let mut st = CStr::from_ptr(str_ptr).to_string_lossy().into_owned();
    st = st.replace("@", " ").replace("\\n", "\n").replace("~", "").replace("!","").replace(":", "");
    ADMIN_LOG_QUEUE.push(st);
}

pub async fn main(rtoken: &str) -> Result<(), Box<dyn std::error::Error>> {
    let http = Http::new(&rtoken);
    let owner = match http.get_current_application_info().await {
        Ok(info) => info.owner.id,
        Err(err) => return Err(format!("Failed to get application info: {}", err).into()),
    };

    let mut owners = HashSet::new();
    owners.insert(owner);
    
    let framework = StandardFramework::new()
    .configure(|configuration| {
        configuration
            .prefix(&*PREFIX.lock().unwrap())
            .ignore_webhooks(false)
            .ignore_bots(true)
            .no_dm_prefix(true)
            .with_whitespace(true)
            .owners(owners)
            .case_insensitivity(true)
    })
    .help(&MY_HELP)
    .group(&HOSTER_GROUP);
    
    // Set intents, which we only want non-privileged anyways. TODO: Restrict intents to only what we need.
    let intents = GatewayIntents::non_privileged();
    
    println!("[Discord] Starting client.");
    
    let mut client = Client::builder(rtoken, intents)
        .event_handler(Handler)
        .framework(framework)
        // Apparently we can still define intent after we already passed intent required beforehand anyways.
        // What? Lol.
        // .intents(intents)
        .await
        .map_err(|err| format!("[Discord] Error creating client: {}", err))?;
    
    // Start listening for events by starting a single shard
    if let Err(why) = client.start().await {
        println!("[Discord] An error occurred while running the client: {:?}", why);
        return Err(why.into());
    }

    Ok(())
}

#[command]
#[owners_only]
#[description = "Manipulates the server to think into closing itself with a valid exit."]
#[help_available]
async fn force_exit(_ctx: &Context, _msg: &Message) -> CommandResult {
    std::process::exit(0);
}

#[command]
#[owners_only]
#[description = "Will kill the server if normal killing is impossible, but can result in SEGFAULT. \n
WARNING: Do not use unless necessary or security concerns prokes this."]
#[help_available]
async fn emergency_kill(_ctx: &Context,_msgg: &Message) -> CommandResult {
    std::process::abort();
}

#[command]
#[owners_only]
//#[only_in(dms)]
#[description = "Upload a script a that will replace the current discord.gs or provide other supplementary .gsc scripts'."]
#[help_available]
async fn upload(ctx: &Context, msg: &Message) -> CommandResult {
    println!(
        "[Discord] Received upload command from {}#{}",
        msg.author.name, msg.author.discriminator
    );

    if msg.attachments.is_empty() {
        msg.channel_id
            .say(&ctx.http, "Attachment required for this command.")
            .await?;
        return Ok(());
    }

    for attachment in &msg.attachments {
        if attachment.size < 1 || !attachment.filename.contains(".gsc") {
            msg.channel_id
                .say(
                    &ctx.http,
                    "Attachment contained no bytes to download or did not have the .gsc extension.",
                )
                .await?;
            continue;
        }

        let content = match attachment.download().await {
            Ok(content) => content,
            Err(why) => {
                println!("[Discord] Error downloading attachment: {:?}", why);
                msg.channel_id
                    .say(&ctx.http, "Error downloading attachment.")
                    .await?;
                continue;
            }
        };

        match tokio::fs::write(&attachment.filename, content).await {
            Ok(_) => {
                msg.channel_id
                    .say(&ctx.http, &format!("Saved {:?}", attachment.filename))
                    .await?;
                println!(
                    "[Discord] Done downloading/updating script: {:?}.",
                    attachment.filename
                );
            }
            Err(why) => {
                println!("[Discord] Error writing file: {:?}", why);
                msg.channel_id
                    .say(&ctx.http, "Error writing file.")
                    .await?;
            }
        }
    }

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