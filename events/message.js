/**************************************************
 Brief: Event when anyone send message to any channel
**************************************************/

const { prefix, bot_setup_channel } = require('../config.js');
const Discord = require('discord.js');
const tools = require('../tools.js');

/**
 * @param {Discord.Client} client Discord client object
 * @param {Discord.Message} message Discord message object
 */
module.exports = async (client, message) =>
{
    // Not specificed channel, do nothing
    if (message.channel.id != bot_setup_channel) return;

    // Bot or Not start with prefix, do nothing
    if (message.author.bot) return;
    if (message.content.indexOf(prefix) !== 0) return;

    // Create an args variable that slices off the prefix entirely and then splits it into an array by spaces
    const args = message.content.slice(prefix.length).trim().split(/ +/g);
    // Create a command variable
    const cmdName = args.shift().toLowerCase();

    // Get command from collection
    const command = client.commands.get(cmdName);
    // If invalid, do nothing
    if (!command) return;

    // Need argument(s) & not have arguments left
    if (command.needArgs && !args.length)
    {
        return tools.LogErrorEmbedChannel(message.channel, 'Invalid arguments', `Try \`!help ${command.name}\` for help.`);
    }

    // Run command
    return command.run(client, message, args).catch(console.error);
};
