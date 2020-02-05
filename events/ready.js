/**************************************************
 Brief: On bot ready for process
**************************************************/

const Discord = require('discord.js');
const DbManager = require('../dbManager.js');

/**
 * @param {Discord.Client} client Discord client object
 */
module.exports = async (client) =>
{
    // Table defined check
    const db = new DbManager();
    db.OpenDatabase();
    await db.DefineTables().catch(console.error);
    db.CloseDatabase();

    console.log(`Logged in as: ${client.user.tag}`);
};
