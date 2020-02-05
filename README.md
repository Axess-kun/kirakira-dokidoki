# Just a certain discord bot on a certain discord server
## Requirement Dependencies
### [node.js](https://nodejs.org/en/download/package-manager/)
Linux
> apt-get install node.js

MacOS
> brew install node

### Node package manager
> apt-get install npm

### Packages
discord.js
> npm install discord.js

dotenv-flow (process.env)
> npm install dotenv-flow

sqlite3
> npm install sqlite3

**OR...** Using below command
> npm update

---
## Optional
### eslint for dev (not for release)
> npm install eslint --save-dev

---
## Setup

1. Create `.env` file by copy `.env.sample` or rename it.
2. Copy bot token from `https://discordapp.com/developers/applications/__YOUR_APP_ID__/bots` and paste it after `CLIENT_TOKEN=` without space to `.env` file.
3. Config other settings.
4. Make sure that `database.sqlite` is readable & writable. Otherwise, use `chmod u+rw database.sqlite` to resolve.
5. Run

---
## Keep the bot alive & Monitoring
There's many ways to keep the bot alive. [Here](https://www.writebots.com/discord-bot-hosting/)'s some hint.

And [here](https://qiita.com/poruruba/items/10df0d94e9127797498f) for monitoring with gui if you're using `pm2`. (Japanese site)
> Well, `pm2-gui`'s security is (probably) bad.
> You need to BLOCK `pm2-gui`'s TCP-Port from all IPs except localhost allowed. And use `nginx` or something like that listen some port with SSL, then forward.... blah blah blah... (TL).
