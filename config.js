require('dotenv-flow').config(); // .env Config

module.exports = {
    bot_owner: process.env.BOT_OWNER,
    prefix: process.env.PREFIX,
    bot_setup_channel: process.env.BOT_SETUP_CHANNEL,
    bot_log_channel: process.env.BOT_LOG_CHANNEL,
    bot_react_event_channel: process.env.BOT_REACT_EVENT_CHANNEL,
    role_admin: process.env.ROLE_ADMIN,
    role_mod: process.env.ROLE_MOD,
};
