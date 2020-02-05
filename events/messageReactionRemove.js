/**************************************************
 Brief: Event when anyone remove reaction or react on some message
**************************************************/

const Discord = require('discord.js');
const DbManager = require('../dbManager.js');
const { bot_react_event_channel } = require('../config.js');

/**
 * @param {Discord.Client} client Discord client object
 * @param {Discord.MessageReaction} messageReaction Discord messageReaction object
 * @param {Discord.User} user Discord user object
 */
module.exports = async (client, messageReaction, user) =>
{
    // Wrong channel or Bot, do nothing
    if (messageReaction.message.channel.id != bot_react_event_channel) return;
    if (user.bot) return;

    // Role given
    const db = new DbManager();
    db.OpenDatabase();
    do
    {
        // emoji.id            // Normal emoji = null | Custom emoji = number-only ID
        // emoji.identifier    // Normal emoji = escaped code | Custom emoji = `name:number-only ID` format
        // emoji.name          // Normal emoji = emoji itself | Custom emoji = custom name without ':' prefix/suffix

        const rows = await db.all(`SELECT * FROM reaction_roles WHERE message_id = $msgId`, { $msgId: messageReaction.message.id }).catch(console.error);

        // If no result, end here
        if (!rows || !rows.length) break;

        // Type ['group' or 'free']
        const type = rows[0].type;
        // Not 'free' type, end here
        if (type != 'free') break;

        // Cache
        const guild = messageReaction.message.guild;
        // Find member who react as GuildMember class
        const member = await guild.fetchMember(user).catch(console.error);
        if (!member) break;

        // Search until find it
        for (let i = 0; i < rows.length; ++i)
        {
            const row = rows[i];

            const role = guild.roles.find(r => r.id == row.role_id);
            if (!role) continue;

            // Normal emoji
            if (messageReaction.emoji.id == null)
            {
                // Specific Reaction -> Remove role
                if (row.reaction == messageReaction.emoji.name)
                {
                    if (member.roles.has(role.id))
                    {
                        await member.removeRole(role).catch(console.error);
                    }
                    // End
                    break;
                }
            }
            else
            {
                // Specific Reaction -> Remove role
                if (row.reaction == messageReaction.emoji.id)
                {
                    if (member.roles.has(role.id))
                    {
                        await member.removeRole(role).catch(console.error);
                    }
                    // End
                    break;
                }
            }
        }
    }
    while (false);
    db.CloseDatabase();
};
