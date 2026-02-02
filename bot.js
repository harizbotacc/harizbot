const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.on('messageCreate', (msg) => {
  if (msg.content === '!ping') {
    msg.reply('Pong!');
  }
});

client.once('ready', () => {
  console.log('Bot is online!');
});

// PASTE YOUR BOT TOKEN BETWEEN THE QUOTES
require('dotenv').config();
client.login(process.env.TOKEN);