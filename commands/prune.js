/**************************************************
 Brief: Delete messages
**************************************************/

const Discord = require('discord.js');
const tools = require('../tools.js');

class CmdPrune
{
    constructor()
    {
        this.name = 'prune';
        this.usage = `\!${this.name} <number 1~100>\``;
    }

    /**
     * @param {Discord.Client} client Discord client object
     * @param {Discord.Message} message Discord message object
     * @param {String[]} args Command arguments
     */
    async run(client, message, args)
    {
        // Not bot owner, reject
        if (!tools.IsBotOwner(message))
        {
            return tools.LogErrorEmbed(message, 'Oops!', 'Sorry, this command is too dangerous.\nIt\'s available for bot owner only.');
        }

        // OK
        if (!args.length)
        {
            args[0] = 100;
        }

        return message.channel.bulkDelete(args[0]).catch(err => tools.LogErrorEmbedChannel(message.channel, 'Error', tools.ToJsonSyntaxString(err)));
    }
};

module.exports = CmdPrune;
