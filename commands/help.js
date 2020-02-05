/**************************************************
 Brief: Help for any command
**************************************************/

const Discord = require('discord.js');
const tools = require('../tools.js');

class CmdHelp
{
    constructor()
    {
        this.name = 'help';
        this.needArgs = true;
        this.usage = `\`!${this.name} <command>\``;
    }

    /**
     * @param {Discord.Client} client Discord client object
     * @param {Discord.Message} message Discord message object
     * @param {String[]} args Command arguments
     */
    async run(client, message, args)
    {
        const channel = message.channel;
        const cmdName = args[0].toLowerCase();

        const command = client.commands.get(cmdName);
        // No command
        if (!command)
        {
            return tools.LogErrorEmbedChannel(channel, `No command \`${cmdName}\``, `Try \`!allcmds\` to get all commands list.`);
        }
        // No help defined
        if (!command.usage)
        {
            return tools.LogErrorEmbedChannel(channel, `No help defined for \`${cmdName}\``);
        }
        // OK
        return tools.LogSuccessEmbedChannel(channel, `Help for \`${command.name}\` command`, command.usage);
    }
};

module.exports = CmdHelp;
