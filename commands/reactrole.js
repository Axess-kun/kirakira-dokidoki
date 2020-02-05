/**************************************************
 Brief: Config ReactRole
**************************************************/

const Discord = require('discord.js');
const DbManager = require('../dbManager.js');
const tools = require('../tools.js');

class CmdReactRole
{
    constructor()
    {
        this.name = 'reactrole';
        this.aliases = ['rr'];
        this.needArgs = true;

        //---------- Sub Usage ----------//
        this.usageAdd = `\`!${this.name} add <message id> <emoji> <role id|mention> <channel id|mention> <type>\`
        > <type> is \`group\` or \`free\` only.
        > - group: Radio group (Toggle ON for latest react. Other will be OFF)
        > - free: Individual react (Toggle ON/OFF on that react)`;

        this.usageEdit = `\`!${this.name} edit <message id> <emoji> <new role id|mention>\``;

        this.usageDelete = `\`!${this.name} delete <message id> <emoji>\``;

        this.usageDeleteGroup = `\`!${this.name} deletegroup <message id>\``;

        this.usageList = `\`!${this.name} list\``;

        //---------- Main Usage ----------//
        this.usage = `Config ReactRole

        Alias: \`${this.aliases.join('\`, \`')}\`

        **Add:**
        ${this.usageAdd}
        **Edit:**
        ${this.usageEdit}
        **Delete:**
        ${this.usageDelete}
        **Delete group:**
        ${this.usageDeleteGroup}
        **List all registered entries**
        ${this.usageList}`;

        //---------- Main ----------//
        this.tableName = 'reaction_roles';
    }

    /**
     * @param {Discord.Client} client Discord client object
     * @param {Discord.Message} message Discord message object
     * @param {String[]} args Command arguments
     */
    async run(client, message, args)
    {
        const channel = message.channel;

        // Guarantee that main command included
        if (args.length < 1)
        {
            return tools.LogErrorEmbedChannel(channel, 'Invalid arguments', `Try \`!help ${this.name}\` for help.`);
        }

        const db = new DbManager();

        const mainCmd = args[0];
        const msgId = args[1];
        const reaction = tools.EscapedEmojiToId(args[2]);
        const roleId = tools.EscapedRoleToId(args[3]);

        db.OpenDatabase();
        switch (mainCmd)
        {
            case 'add':
                await this.DoAdd(db, message, msgId, reaction, roleId, args).catch(console.error);
                break;
            case 'edit':
                await this.DoEdit(db, message, msgId, reaction, roleId).catch(console.error);
                break;
            case 'delete':
                await this.DoDelete(db, client, message, msgId, reaction).catch(console.error);
                break;
            case 'deletegroup':
                await this.DoDeleteGroup(db, client, message, msgId).catch(console.error);
                break;
            case 'list':
                await this.DoList(db, message).catch(console.error);
                break;
        }
        db.CloseDatabase();
    }

    /**
     * @param {DbManager} db
     * @param {Discord.Message} message Discord message object
     * @param {String} msgId
     * @param {String | Discord.Emoji | Discord.ReactionEmoji} reaction
     * @param {String | Discord.Role} roleId
     * @param {String[]} args Command arguments
     */
    async DoAdd(db, message, msgId, reaction, roleId, args)
    {
        const channel = message.channel;
        const type = args[5];
        if (args.length < 6 || (type != 'group' && type != 'free'))
        {
            return tools.LogErrorEmbedChannel(channel, 'Invalid arguments', `Usage:\n${this.usageAdd}`);
        }

        const targetChannelId = tools.EscapedChannelToId(args[4]);
        const findChannel = message.guild.channels.get(targetChannelId);
        const foundMsg = await tools.FindMessageIdInChannel(findChannel, msgId);

        // Not found any message
        if (!foundMsg)
        {
            return tools.LogErrorEmbedChannel(channel, 'Not found', `Not found message id \`${msgId}\` in channel ${args[4]}`);
        }

        // Check any exists
        const row = await db.get(`SELECT * FROM ${this.tableName} WHERE message_id = $msgId`, { $msgId: msgId })
            .catch(err => tools.LogErrorEmbedChannel(channel, 'Error', tools.ToJsonSyntaxString(err)));

        // At least 1 exists.
        if (row)
        {
            if (row.type != type)
            {
                return tools.LogErrorEmbedChannel(channel, 'Type conflict', `You're trying to add type \`${type}\` to existing type \`${row.type}\` of message id \`${msgId}\``);
            }
        }

        let success = false;
        await db.beginTransaction();
        do
        {
            const insertResult = await db.run(`INSERT INTO ${this.tableName}(message_id, reaction, role_id, type, channel_id) VALUES($msgId, $react, $roleId, $type, $chan)`,
            {
                $msgId: msgId,
                $react: reaction,
                $roleId: roleId,
                $type: type,
                $chan: targetChannelId,
            })
            // Error callback is needed. Or else, it'll throw an exception that can't catch. orz
            .catch(err =>
            {
                if (err.code == 'SQLITE_CONSTRAINT')
                {
                    const emoji = tools.GetEmojiObject(message, reaction);
                    tools.LogErrorEmbedChannel(channel, 'Error SQLITE_CONSTRAINT', `Message id \`${msgId}\` & reaction ${emoji} already exists.\nTry using \`edit\` instead.`);
                    return; // Return Promise. Not DoAdd function.
                }
                tools.LogErrorEmbedChannel(channel, 'Error', `Something went wrong with adding a row to table.\n${tools.ToJsonSyntaxString(err)}`);
            });

            // INSERT Failed
            if (!insertResult || insertResult != db.runSuccessCode) break;

            // ↓↓↓ Success ↓↓↓

            // Get emoji
            const emoji = tools.GetEmojiObject(message, reaction);
            // Add Reaction to message
            const msgReactResult = await foundMsg.react(emoji)
                .catch(err =>
                    {
                        tools.LogErrorEmbedChannel(channel, 'Error reaction', tools.ToJsonSyntaxString(err));
                        return;
                    });

            // React Failed
            if (!msgReactResult) break;

            // Commit
            await db.commit();
            success = true;
        }
        while (false);

        if (!success)
        {
            await db.rollback();
            return;
        }
        // ↓↓↓ All success ↓↓↓
        const roleObj = message.guild.roles.get(roleId);
        const emoji = tools.GetEmojiObject(message, reaction);
        return tools.LogSuccessEmbedChannel(channel, 'Success', `Bind reaction ${emoji} & role ${roleObj} to message id \`${msgId}\`. Type: \`${type}\``);
    }

    /**
     * @param {DbManager} db
     * @param {Discord.Message} message Discord message object
     * @param {String} msgId
     * @param {String | Discord.Emoji | Discord.ReactionEmoji} reaction
     * @param {String | Discord.Role} roleId
     */
    async DoEdit(db, message, msgId, reaction, roleId)
    {
        const channel = message.channel;
        if (!msgId || !reaction || !roleId)
        {
            return tools.LogErrorEmbedChannel(channel, 'Invalid arguments', `Usage:\n${this.usageEdit}`);
        }

        // Reaction emoji
        const emoji = tools.GetEmojiObject(message, reaction);

        // Exist check
        const row = await db.get(`SELECT * FROM ${this.tableName} WHERE message_id = $msgId AND reaction = $react`,
        {
            $msgId: msgId,
            $react: reaction,
        }).catch(err =>
        {
            tools.LogErrorEmbedChannel(channel, 'Error', tools.ToJsonSyntaxString(err));
            return null;
        });

        // Not exist
        if (!row)
        {
            return tools.LogErrorEmbedChannel(channel, 'Error', `No data found for message id \`${msgId}\` and reaction ${emoji}`)
        }

        // Old role
        let oldRole = message.guild.roles.get(row.role_id);

        let success = false;
        await db.beginTransaction();
        do
        {
            // UPDATE
            const updateResult = await db.run(`UPDATE ${this.tableName} SET role_id = $roleId WHERE message_id = $msgId AND reaction = $react`,
            {
                $roleId: roleId,
                $msgId: msgId,
                $react: reaction,
            })
            .catch(err =>
            {
                tools.LogErrorEmbedChannel(channel, 'Error', tools.ToJsonSyntaxString(err));
                return;
            });
            // Failed
            if (!updateResult || updateResult != db.runSuccessCode) break;
            // Success
            await db.commit();
            success = true;
        }
        while (false);

        if (!success)
        {
            await db.rollback();
            return;
        }
        // ↓↓↓ All success ↓↓↓
        const roleObj = message.guild.roles.get(roleId);
        if (!oldRole)
        {
            oldRole = '`<Deleted>`';
        }
        return tools.LogSuccessEmbedChannel(channel, 'Success', `Re-Bind message id \`${msgId}\` & reaction ${emoji} from role ${oldRole} to role ${roleObj}.`);
    }

    /**
     * @param {DbManager} db
     * @param {Discord.Client} client Discord client object
     * @param {Discord.Message} message Discord message object
     * @param {String} msgId
     */
    async DoDelete(db, client, message, msgId, reaction)
    {
        const channel = message.channel;
        if (!msgId || !reaction)
        {
            return tools.LogErrorEmbedChannel(channel, 'Invalid arguments', `Usage:\n${this.usageDelete}`);
        }

        // Exist check
        const row = await db.get(`SELECT * FROM ${this.tableName} WHERE message_id = $msgId AND reaction = $react`,
        {
            $msgId: msgId,
            $react: reaction,
        })
        .catch(err =>
        {
            tools.LogErrorEmbedChannel(channel, 'Error', tools.ToJsonSyntaxString(err));
            return null;
        });

        // Reaction Emoji
        const emoji = tools.GetEmojiObject(message, reaction);

        // Not exist
        if (!row)
        {
            return tools.LogErrorEmbedChannel(channel, 'Error', `No data found for message id \`${msgId}\` and reaction ${emoji}`)
        }

        // Announce
        await message.reply(`The bot will delete message id \`${msgId}\` that has reaction ${emoji} settings.\n` +
        'Confirm with \`yes\` or deny with \`no\` within 10 seconds.').catch(console.error);

        // Wait confirmation
        // First argument is a filter function which is made of conditions
        // --> only accept messages by the user who sent the command
        // Accept only 1 message, and return the promise after 10000ms = 10s
        const collected = await message.channel.awaitMessages(msgObj => msgObj.author.id == message.author.id, {max: 1, time: 10000}).catch(console.error);

        // Like .catch(). Just in case...
        if (!collected)
        {
            return tools.LogErrorEmbedChannel(channel, 'Unknown Error');
        }

        const first = collected.first();
        // No response
        if (!first)
        {
            return tools.LogErrorEmbedChannel(channel, 'Timeout', 'No response. The delete action was canceled.');
        }
        // Anything but not 'yes'
        else if (first.content.toLowerCase() != 'yes')
        {
            return tools.LogSuccessEmbedChannel(channel, 'Canceled');
        }

        // ↓↓↓ Confirmed ↓↓↓
        let success = false;
        await db.beginTransaction();
        do
        {
            // DELETE
            const deleteResult = await db.run(`DELETE FROM ${this.tableName} WHERE message_id = $msgId AND reaction = $react`,
            {
                $msgId: msgId,
                $react: reaction,
            })
            .catch(err =>
            {
                tools.LogErrorEmbedChannel(channel, 'Error', tools.ToJsonSyntaxString(err));
                return;
            });

            // DELETE Failed
            if (!deleteResult || deleteResult != db.runSuccessCode) break;

            // ↓↓↓ DELETE Success ↓↓↓

            // Get target message
            const searchChannel = message.guild.channels.get(row.channel_id);
            const targetMsg = await tools.FindMessageIdInChannel(searchChannel, msgId);
            // Not found (Maybe deleted)
            if (!targetMsg)
            {
                await tools.LogErrorEmbedChannel(channel, '(Maybe) Error', `Not found message id \`${msgId}\`.\nMaybe it was deleted.`)
            }
            // Found
            else
            {
                const emojiToGetFromMap = tools.EmojiObjectToNameId(emoji);
                const reactObj = targetMsg.reactions.get(emojiToGetFromMap); // Mapped by normal emoji itself or custom emoji 'name:id'

                // Not found or deleted
                if (!reactObj) continue;

                // Remove reaction from message
                await reactObj.remove(client.user).catch(err => tools.LogErrorEmbedChannel(channel, 'Error remove reaction', tools.ToJsonSyntaxString(err)));
                // *** Even failed, also delete it!
            }

            // Commit
            await db.commit();
            success = true;
        }
        while (false);

        if (!success)
        {
            await db.rollback();
            return;
        }

        // ↓↓↓ All success ↓↓↓
        return tools.LogSuccessEmbedChannel(channel, 'Success', `Delete registered entry with message id \`${msgId}\` and reaction ${emoji}.`);
    }

    /**
     * @param {DbManager} db
     * @param {Discord.Client} client Discord client object
     * @param {Discord.Message} message Discord message object
     * @param {String} msgId
     */
    async DoDeleteGroup(db, client, message, msgId)
    {
        const channel = message.channel;
        if (!msgId)
        {
            return tools.LogErrorEmbedChannel(channel, 'Invalid arguments', `Usage:\n${this.usageDeleteGroup}`);
        }
        // Exist check
        const rows = await db.all(`SELECT * FROM ${this.tableName} WHERE message_id = $msgId`,
        {
            $msgId: msgId,
        })
        .catch(err =>
        {
            tools.LogErrorEmbedChannel(channel, 'Error', tools.ToJsonSyntaxString(err));
            return null;
        });

        // Not exist
        if (!rows || !rows.length)
        {
            return tools.LogErrorEmbedChannel(channel, 'Error', `No data found for message id \`${msgId}\``);
        }

        // List all reaction & role
        let rowListStr = '';
        rows.forEach(row => {
            const emoji = tools.GetEmojiObject(message, row.reaction);
            const role = message.guild.roles.get(row.role_id);
            if (!role) role = '`<Deleted>`';
            rowListStr += `${emoji} : ${role} [Type: \`${row.type}\`]\n`;
        });

        // Announce
        await message.reply(`The bot will delete ALL message id \`${msgId}\` settings.\n` +
        'Confirm with \`yes\` or deny with \`no\` within 10 seconds.\n\n' +

        'Here\'s list of registered entries.\n' +
        `${rowListStr}`).catch(console.error);

        // Wait confirmation
        // First argument is a filter function which is made of conditions
        // --> only accept messages by the user who sent the command
        // Accept only 1 message, and return the promise after 10000ms = 10s
        const collected = await message.channel.awaitMessages(msgObj => msgObj.author.id == message.author.id, {max: 1, time: 10000}).catch(console.error);

        // Like .catch(). Just in case...
        if (!collected)
        {
            return tools.LogErrorEmbedChannel(channel, 'Unknown Error');
        }

        const first = collected.first();
        // No response
        if (!first)
        {
            return tools.LogErrorEmbedChannel(channel, 'Timeout', 'No response. The delete group action was canceled.');
        }
        // Anything but not 'yes'
        else if (first.content.toLowerCase() != 'yes')
        {
            return tools.LogSuccessEmbedChannel(channel, 'Canceled');
        }

        // ↓↓↓ Confirmed ↓↓↓
        let success = false;
        await db.beginTransaction();
        do
        {
            // DELETE
            const deleteResult = await db.run(`DELETE FROM ${this.tableName} WHERE message_id = $msgId`,
            {
                $msgId: msgId,
            })
            .catch(err =>
            {
                tools.LogErrorEmbedChannel(channel, 'Error', tools.ToJsonSyntaxString(err));
                return;
            });

            // DELETE Failed
            if (!deleteResult || deleteResult != db.runSuccessCode) break;

            // ↓↓↓ DELETE Success ↓↓↓

            // Get target message
            const searchChannel = message.guild.channels.get(rows[0].channel_id);
            const targetMsg = await tools.FindMessageIdInChannel(searchChannel, msgId);
            // Not found (Maybe deleted)
            if (!targetMsg)
            {
                await tools.LogErrorEmbedChannel(channel, '(Maybe) Error', `Not found message id \`${msgId}\`.\nMaybe it was deleted.`)
            }
            // Found
            else
            {
                for (let row of rows)
                {
                    // Get emoji
                    let emoji = tools.GetEmojiObject(message, row.reaction);
                    emoji = tools.EmojiObjectToNameId(emoji);
                    const reactObj = targetMsg.reactions.get(emoji); // Mapped by normal emoji itself or custom emoji 'name:id'

                    // Not found or deleted
                    if (!reactObj) continue;

                    // Remove reaction from message
                    await reactObj.remove(client.user).catch(err => tools.LogErrorEmbedChannel(channel, 'Error remove reaction', tools.ToJsonSyntaxString(err)));
                    // *** Even failed, also delete all!
                }
            }

            // Commit
            await db.commit();
            success = true;
        }
        while (false);

        if (!success)
        {
            await db.rollback();
            return;
        }

        // ↓↓↓ All success ↓↓↓
        return tools.LogSuccessEmbedChannel(channel, 'Success', `Delete all registered entries with message id \`${msgId}\`.`);
    }

    /**
     * @param {DbManager} db
     * @param {Discord.Message} message Discord message object
     */
    async DoList(db, message)
    {
        const channel = message.channel;
        // Exist check
        const rows = await db.all(`SELECT * FROM ${this.tableName} ORDER BY message_id ASC`, [])
        .catch(err =>
        {
            tools.LogErrorEmbedChannel(channel, 'Error', tools.ToJsonSyntaxString(err));
            return null;
        });

        // Not exist
        if (!rows || !rows.length)
        {
            // Send to channel
            await channel.send('No data found.');
        }
        // List all reaction & role and send to channel
        else
        {
            // Send every 10 rows
            let rowListStr = '';
            let i = 0;
            for (let row of rows)
            {
                const emoji = tools.GetEmojiObject(message, row.reaction);
                const role = message.guild.roles.get(row.role_id);
                if (!role) role = '`<Deleted>`';
                rowListStr += `${emoji} : ${role} [Message ID: \`${row.message_id}\`] [Type: \`${row.type}\`]\n`;

                ++i;
                if (i % 10 == 0)
                {
                    // Send to channel
                    await this.PrintMessage(channel, rowListStr);
                    // Clear
                    rowListStr = '';
                }
            }
            // Some text remaining -> Send the remaining
            if (rowListStr && rowListStr != '')
            {
                await this.PrintMessage(channel, rowListStr);
            }
        }
        // Print success
        return tools.LogSuccessEmbedChannel(channel, 'Success');
    }

    /**
     * @param {Discord.TextChannel} channel
     * @param {String} msg
     */
    async PrintMessage(channel, msg)
    {
        await channel.send(msg).catch(console.error);
    }
};

module.exports = CmdReactRole;
