/**************************************************
 Brief: Reload command js script
**************************************************/

const Discord = require('discord.js');
const tools = require('../tools.js');

class CmdReload
{
    constructor()
    {
        this.name = 'reload';
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

        if (cmdName == 'reload')
        {
            return tools.LogErrorEmbedChannel(channel, 'Can\'t reload command itself', `Usage:\n${this.usage}`);
        }
        else
        {
            // Get command
            const command = client.commands.get(cmdName);
            // Error case
            if (!command)
            {
                return tools.LogErrorEmbedChannel(channel, `No command \`${cmdName}\``, `Try \`!allcmds\` to get all commands list.`);
            }

            // ↓↓↓ OK ↓↓↓

            // Resolve alias to file name
            const cmdFileName = command.name;
            // Delete old aliases
            if (command.aliases && Array.isArray(command.aliases))
            {
                command.aliases.forEach(element => {
                    client.commands.delete(element);
                });
            }
            // Delete cache
            delete require.cache[require.resolve(`./${cmdFileName}.js`)];
            // Re-load
            try
            {
                const CmdClass = require(`./${cmdFileName}.js`);
                const newCommand = new CmdClass();
                tools.RegisterCommand(client, newCommand);
            }
            catch (error)
            {
                console.log(error);
                return tools.LogErrorEmbedChannel(channel, `There was an error while reloading command \`${cmdName}\``, error.message);
            }

            return tools.LogSuccessEmbedChannel(channel, `Command \`${cmdName}\` reloaded!`);
        }
    }
};

module.exports = CmdReload;
