/**************************************************
 Brief: Show command aliases
**************************************************/

const Discord = require('discord.js');
const tools = require('../tools.js');

class CmdAlias
{
	constructor()
	{
		this.name = 'alias';
		this.needArgs = true;
		this.usage = `List all alias of given command.\n\`!${this.name} <command>\``;
	}

	/**
	 * @param {Discord.Client} client Discord client object
	 * @param {Discord.Message} message Discord message object
	 * @param {String[]} args Command arguments
	 */
	async run(client, message, args)
	{
		const cmdName = args[0];
		const cmdObj = client.commands.get(args[0]);
		if (!cmdObj)
		{
			return tools.LogErrorEmbedChannel(message.channel, `No command \`${cmdName}\``, `Try \`!allcmds\` to get all commands list.`);
		}
		if (!cmdObj.aliases || !cmdObj.aliases.length)
		{
			return tools.LogSuccessEmbedChannel(message.channel, `No alias for command \`${cmdObj.name}\``);
		}
		return tools.LogSuccessEmbedChannel(message.channel, `Alias for command \`${cmdObj.name}\``, cmdObj.aliases.join('\n'));
	}
};

module.exports = CmdAlias;
