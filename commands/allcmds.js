/**************************************************
 Brief: List all commands
**************************************************/

const Discord = require('discord.js');
const tools = require('../tools.js');

class CmdAllcmds
{
    constructor()
    {
        this.name = 'allcmds';
        this.usage = `List all commands that this bot has.\n\`!${this.name}\``;
    }

    /**
     * @param {Discord.Client} client Discord client object
     * @param {Discord.Message} message Discord message object
     * @param {String[]} args Command arguments
     */
    async run(client, message, args)
    {
        let arr = [];
        client.commands.forEach(cmd => {
            // Add to array if didn't added yet
            if (!arr.includes(cmd.name))
            {
                arr.push(cmd.name);
            }
        });
        // Output string
        let str = '';
        arr.forEach(cmdName => {
            if (cmdName != this.name)
            {
                str += `${cmdName}\n`;
            }
        });

        return tools.LogSuccessEmbedChannel(message.channel, 'All commands', str);
    }
};

module.exports = CmdAllcmds;
