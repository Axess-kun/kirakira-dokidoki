/**************************************************
 Brief: Main process

Official API Document
https://discord.js.org/#/docs/main/stable/general/welcome
**************************************************/

require('./config.js');
const tools = require('./tools.js');
const Discord = require('discord.js');

// Main discord client
const client = new Discord.Client();
// Command KeyValuePair<name, instance of exported class module>
client.commands = new Discord.Collection();

// Dynamically reading event files
const eventFolder = './events/';
const eventFiles = tools.ReadJsFileSync(eventFolder);
for (const file of eventFiles) {
    // Load file
    const event = require(`${eventFolder}${file}`);
    const eventName = file.split('.')[0];
    console.log(`Loaded event: ${eventName}`);
    // Bind event function with first argument is 'client'
    const func = event.bind(null, client);
    client.on(eventName, func);
}

// Dynamically reading command files
const cmdFolder = './commands/';
const commandFiles = tools.ReadJsFileSync(cmdFolder);
for (const file of commandFiles) {
    // Load file
    const CmdClass = require(`${cmdFolder}${file}`);
    const command = new CmdClass();
    console.log(`Loaded command: ${command.name}`);
    // Set command
    tools.RegisterCommand(client, command);
}

// Login to Discord with app's token
// If no token passed, discord.js will looks for CLIENT_TOKEN in .env file
client.login();
