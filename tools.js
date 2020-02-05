const fs = require('fs'); // File System
const config = require('./config.js');
const Discord = require('discord.js');

module.exports =
{
    //------------------------------ Common ------------------------------//
    /**
     * Sleep the thread for xx milliseconds
     * @param {Number} msec Milliseconds
     */
    Sleep(msec)
    {
        return new Promise(resolve => setTimeout(resolve, msec));
    },

    /**
     * Read file function (Synchronous)
     * @param {String} folder Relative path to folder
     */
    ReadJsFileSync(folder)
    {
        return fs.readdirSync(folder).filter(file => file.endsWith('.js'));
    },

    /**
     * Register command name and its aliases
     * @param {Discord.Client} client Discord client object
     * @param {*} cmdObject Command object from require('...') statement
     */
    RegisterCommand(client, cmdObject)
    {
        // Name
        client.commands.set(cmdObject.name, cmdObject);
        // Aliases
        if (cmdObject.aliases && Array.isArray(cmdObject.aliases))
        {
            cmdObject.aliases.forEach(element => {
                // Has value
                if (element)
                {
                    client.commands.set(element, cmdObject);
                }
            });
        }
    },

    //------------------------------ Escaped string ------------------------------//
    /**
     * Convert Escaped user ID string to number-only ID string
     * @param {String} escaped Escaped string
     * @return {String} Number-only ID string
     */
    EscapedUserToId(escaped)
    {
        if (!escaped) return null;
        return escaped.replace(/(^<@!|>$)/g, '');
    },
    /**
     * Convert Escaped role ID string to number-only ID string
     * @param {String} escaped Escaped string
     * @return {String} Number-only ID string
     */
    EscapedRoleToId(escaped)
    {
        if (!escaped) return null;
        return escaped.replace(/(^<@&|>$)/g, '');
    },
    /**
     * Convert Escaped channel ID string to number-only ID string
     * @param {String} escaped Escaped string
     * @return {String} Number-only ID string
     */
    EscapedChannelToId(escaped)
    {
        if (!escaped) return null;
        return escaped.replace(/(^<#|>$)/g, '');
    },
    /**
     * Convert Escaped emoji ID string to number-only ID string
     * @param {String} escaped Escaped string
     * @return {String} Number-only ID string
     */
    EscapedEmojiToId(escaped)
    {
        if (!escaped) return null;
        return escaped.replace(/(^<:.+:|>$)/g, '');
    },

    //------------------------------ Find ------------------------------//
    /**
     * Find specific message object from all text channels
     * @param {Discord.Message} message
     * @param {String} msgId Message ID to find
     * @return {Promise<Discord.Message>} Use with await to get resolved object or null.
     */
    async FindMessageId(message, msgId)
    {
        let foundMsg = null;
        const allChannels = message.guild.channels.filter(c => c.type == 'text').array();
        for (let channel of allChannels)
        {
            // Fetch message in channel
            await channel.fetchMessage(msgId)
                .then(msg => foundMsg = msg)
                .catch(console.error);

            // Found
            if (foundMsg) break;
        }
        return foundMsg;
    },

    /**
     * Find specific message object from specific channel
     * @param {Discord.GuildChannel} channel
     * @param {String} msgId Message ID to find
     * @return {Promise<Discord.Message>} Use with await to get resolved object or null.
     */
    async FindMessageIdInChannel(channel, msgId)
    {
        let foundMsg = null;
        // Fetch message in channel
        await channel.fetchMessage(msgId)
            .then(msg => foundMsg = msg)
            .catch(console.error);
        return foundMsg;
    },

    //------------------------------ Convert ------------------------------//
    /**
     * @param {Discord.Message} message Discord message object
     * @param {String | Discord.Emoji | Discord.ReactionEmoji} reaction
     */
    GetEmojiObject(message, reaction)
    {
        const reactObj = message.guild.emojis.get(reaction);
        let emoji = reaction;
        if (reactObj)
        {
            emoji = reactObj;
        }
        return emoji;
    },

    /**
     *
     * @param {String | Discord.Emoji | Discord.ReactionEmoji} emoji
     */
    EmojiObjectToNameId(emoji)
    {
        // Normal emoji
        if (!emoji.id)
        {
            return emoji;
        }
        // Custom emoji
        return emoji.name + ':' + emoji.id;
    },

    //------------------------------ Check ------------------------------//
    /**
     * Check user role is moderator or above
     * @param {Discord.Message} message Discord message object
     * @returns {Boolean}
     */
    IsModOrAbove(message)
    {
        if (message.member.roles.has(config.role_mod)) return true;
        return this.IsAdminOrAbove(message);
    },
    /**
     * Check user role is administrator or above
     * @param {Discord.Message} message Discord message object
     * @returns {Boolean}
     */
    IsAdminOrAbove(message)
    {
        if (message.member.roles.has(config.role_admin)) return true;
        return this.IsServerOwner(message);
    },
    /**
     * Check user is server owner
     * @param {Discord.Message} message Discord message object
     * @returns {Boolean}
     */
    IsServerOwner(message)
    {
        return (message.guild.ownerID == message.member.id);
    },
    /**
     * Check user is server owner
     * @param {Discord.Message} message Discord message object
     * @returns {Boolean}
     */
    IsBotOwner(message)
    {
        return (message.member.id == config.bot_owner);
    },

    //------------------------------ Log ------------------------------//
    /**
     * Log permission denied to specific channel
     * @param {Discord.Message} message Discord message object
     * @param {String} cmdName Command name
     * @returns {Promise<Discord.Message | Discord.Message[]>} Send message object
     */
    LogPermissionDenied(message, cmdName)
    {
        const logChannel = message.guild.channels.get(config.bot_log_channel);
        return logChannel.send(`${message.member} is trying to use command \`${cmdName}\` but not has permission.`).catch(console.error);
    },

    //------------------------------ Log RichEmbed ------------------------------//
    /**
     * Log success to channel. Fields = [{ name, value }, {name, value}, ...] (Max 25)
     * @param {Discord.TextChannel | Discord.DMChannel | Discord.GroupDMChannel} channel Discord channel object
     * @param {String} title
     * @param {String} [description = '']
     * @param {Object} fields Object { name: 'string', value: 'string' }
     * @returns {Promise<Discord.Message>} Send message object
     */
    LogSuccessEmbedChannel(channel, title, description = '', ...fields)
    {
        let embed = new Discord.RichEmbed()
            .setColor(0x20e920)
            .setTitle(title);
        if (description)
        {
            embed.setDescription(description);
        }
        if (fields && fields.length)
        {
            fields.forEach(obj => {
                embed.addField(obj.name, obj.value);
            });
        }
        return channel.send(embed).catch(console.error);
    },
    /**
     * Log success to channel. Fields = [{ name, value }, {name, value}, ...] (Max 25)
     * @param {Discord.Message} message Discord message object
     * @param {String} title
     * @param {String} [description = '']
     * @param {Object} fields Object { name: 'string', value: 'string' }
     * @returns {Promise<Discord.Message>} Send message object
     */
    LogSuccessEmbed(message, title, description = '', ...fields)
    {
        if (fields && fields.length)
        {
            return this.LogSuccessEmbedChannel(message.channel, title, description, fields);
        }
        return this.LogSuccessEmbedChannel(message.channel, title, description);
    },
    /**
     * Log error to channel. Fields = [{ name, value }, {name, value}, ...] (Max 25)
     * @param {Discord.TextChannel | Discord.DMChannel | Discord.GroupDMChannel} channel Discord channel object
     * @param {String} title
     * @param {String} [description = '']
     * @param {Object} fields Object { name: 'string', value: 'string' }
     * @returns {Promise<Discord.Message>} Send message object
     */
    LogErrorEmbedChannel(channel, title, description = '', ...fields)
    {
        let embed = new Discord.RichEmbed()
            .setColor(0xff0000)
            .setTitle(title);
        if (description)
        {
            embed.setDescription(description);
        }
        if (fields && fields.length)
        {
            fields.forEach(obj => {
                embed.addField(obj.name, obj.value);
            });
        }
        return channel.send(embed).catch(console.error);
    },
    /**
     * Log error to channel. Fields = [{ name, value }, {name, value}, ...] (Max 25)
     * @param {Discord.Message} message Discord message object
     * @param {String} title
     * @param {String} [description = '']
     * @param {Object} fields Object { name: 'string', value: 'string' }
     * @returns {Promise<Discord.Message>} Send message object
     */
    LogErrorEmbed(message, title, description = '', ...fields)
    {
        if (fields && fields.length)
        {
            return this.LogErrorEmbedChannel(message.channel, title, description, fields);
        }
        return this.LogErrorEmbedChannel(message.channel, title, description);
    },

    //------------------------------ JSON ------------------------------//
    /**
     * Convert to JSON Syntax Highlighting string
     * @param {*} obj Object to print as JSON
     * @param {Boolean} [prettyPrint = true]
     * @return {String}
     */
    ToJsonSyntaxString(obj, prettyPrint = true)
    {
        if (prettyPrint)
        {
            return `\`\`\`json\n${JSON.stringify(obj, null, 2)}\n\`\`\``;
        }
        return `\`\`\`json\n${JSON.stringify(obj)}\n\`\`\``;
    },

    //------------------------------ Debug ------------------------------//
    /**
     * @param {*} obj Any object
     * @return {String} Object's class name
     */
    GetClassName(obj)
    {
        if (typeof obj === "undefined")
        {
            return "undefined";
        }
        else if (obj === null)
        {
            return "null";
        }
        else
        {
            // Get prototype name
            /** @type {String} */
            const className = Object.prototype.toString.call(obj);
            // Get class name after "object"
            const matches = className.match(/^\[object\s(.*)\]$/);
            // Class available
            if (matches.length > 0) { return matches[1]; }
            // Not available
            else { return className; }
        }
    },

    /**
     * Safe JSON.stringify (Not thrown error for circular)
     * https://github.com/moll/json-stringify-safe
     * @param {*} obj
     * @param {String} replacer
     * @param {*} spaces
     */
    stringify(obj, replacer, spaces, cycleReplacer)
    {
        return JSON.stringify(obj, this.serializer(replacer, cycleReplacer), spaces)
    },

    serializer(replacer, cycleReplacer)
    {
        var stack = [], keys = []

        if (cycleReplacer == null) cycleReplacer = function(key, value)
        {
            if (stack[0] === value) return "[Circular ~]"
            return "[Circular ~." + keys.slice(0, stack.indexOf(value)).join(".") + "]"
        }

        return function(key, value)
            {
                if (stack.length > 0)
                {
                    var thisPos = stack.indexOf(this)
                    ~thisPos ? stack.splice(thisPos + 1) : stack.push(this)
                    ~thisPos ? keys.splice(thisPos, Infinity, key) : keys.push(key)
                    if (~stack.indexOf(value)) value = cycleReplacer.call(this, key, value)
                }
                else stack.push(value)

                return replacer == null ? value : replacer.call(this, key, value)
            }
    },
};
