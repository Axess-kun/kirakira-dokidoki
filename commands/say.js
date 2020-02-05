/**************************************************
 Brief: Let's bot say something
**************************************************/

const Discord = require('discord.js');
const tools = require('../tools.js');

class CmdSay
{
    constructor()
    {
        this.name = 'say';
        this.needArgs = true;
        this.usage = `Let bot say something.

        **This channel:**
        \`!${this.name} <message>\`
        **Specific channel:**
        \`!${this.name} <channel id|mention> <message>\``;
    }

	/**
	 * @param {Discord.Client} client Discord client object
	 * @param {Discord.Message} message Discord message object
	 * @param {String[]} args Command arguments
	 */
	async run(client, message, args)
	{
        const channel = message.channel;
        const maybeChannel = tools.EscapedChannelToId(args[0]);
        const targetChannel = message.guild.channels.get(maybeChannel);
        // Available
        if (targetChannel)
        {
            args.shift();
            if (!args[0])
            {
                return tools.LogErrorEmbedChannel(channel, 'Invalid arguments', `Try \`!help ${this.name}\` for help.`);
            }
            return targetChannel.send(args.join(' ')).catch((err) => tools.LogErrorEmbedChannel(channel, 'Error!', tools.ToJsonSyntaxString(err)));
        }
        // No channel -> Delete command & Send to accepted channel
        await message.delete().catch(console.error);
		return channel.send(args.join(' ')).catch(console.error);
	}
};

module.exports = CmdSay;
