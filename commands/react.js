/**************************************************
 Brief: Let's bot react to message
**************************************************/

const Discord = require('discord.js');
const tools = require('../tools.js');

class CmdSay
{
    constructor()
    {
        this.name = 'react';
        this.needArgs = true;
        this.usage = `Let bot say react to message.

        \`!${this.name} <+|-> <message> <channel id|mention> <emoji>\`
        > + for add react
        > - for remove react
        \*Must pass the channel argument for fast fetch message from server.`;
    }

	/**
	 * @param {Discord.Client} client Discord client object
	 * @param {Discord.Message} message Discord message object
	 * @param {String[]} args Command arguments
	 */
	async run(client, message, args)
	{
        const channel = message.channel;
        const addRemove = args[0];

        if (args.length < 4 || (addRemove != '+' && addRemove != '-'))
        {
            return tools.LogErrorEmbedChannel(channel, 'Invalid arguments', `Try \`!help ${this.name}\` for help.`);
        }

        // Parse other arguments
        const msgId = args[1];
        const maybeChannel = tools.EscapedChannelToId(args[2]);
        const reaction = tools.EscapedEmojiToId(args[3]);

        // Get channel object
        const targetChannel = message.guild.channels.get(maybeChannel);
        // Channel NG
        if (!targetChannel)
        {
            return tools.LogErrorEmbedChannel(channel, 'Error', 'Not found specified channel.')
        }

        // Fetch message
        const targetMsg = await tools.FindMessageIdInChannel(targetChannel, msgId);
        // Not found
        if (!targetMsg)
        {
            return tools.LogErrorEmbedChannel(channel, 'Error', `Not found message id \`${msgId}\` in channel ${targetChannel}.`)
        }

        // ↓↓↓ Message Found ↓↓↓

        const emoji = tools.GetEmojiObject(message, reaction);
        switch (addRemove)
        {
            case '+':
                await targetMsg.react(emoji)
                    .catch(err =>
                    {
                        tools.LogErrorEmbedChannel(channel, 'Error', tools.ToJsonSyntaxString(err));
                        return;
                    });
                break;
            case '-':
                const emojiToGetFromMap = tools.EmojiObjectToNameId(emoji);
                const reactObj = targetMsg.reactions.get(emojiToGetFromMap); // Mapped by normal emoji itself or custom emoji 'name:id'

                // Not found or deleted
                if (!reactObj)
                {
                    return tools.LogErrorEmbedChannel(channel, 'Error', `Not found reaction ${emoji} on message id \`${msgId}\``);
                }

                // Remove reaction from message
                await reactObj.remove(client.user).catch(err => tools.LogErrorEmbedChannel(channel, 'Error', tools.ToJsonSyntaxString(err)));
                break;
        }

        return tools.LogSuccessEmbedChannel(channel, 'Success');
	}
};

module.exports = CmdSay;
