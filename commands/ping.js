/**************************************************
 Brief: Ping-pong
**************************************************/

const Discord = require('discord.js');

class CmdPing
{
	constructor()
	{
		this.name = 'ping';
	}

	/**
	 * @param {Discord.Client} client Discord client object
	 * @param {Discord.Message} message Discord message object
	 * @param {String[]} args Command arguments
	 */
	async run(client, message, args)
	{
		return message.channel.send('Pong').catch(console.error);
	}
};

module.exports = CmdPing;
