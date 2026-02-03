const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once('ready', () => {
  console.log('🤖 Bot is online!');
});

client.on('messageCreate', (message) => {
  if (message.author.bot) return;

  const msg = message.content.toLowerCase();

  if (msg === '!ping') {
    message.reply('🏓 Pong!');
  }

  if (msg === '!hello') {
    message.reply(`Hello ${message.author.username} 👋`);
  }

  if (msg === '!time') {
    message.reply(`⏰ Server time: ${new Date().toLocaleString()}`);
  }

  if (msg === '!roll') {
    const roll = Math.floor(Math.random() * 6) + 1;
    message.reply(`🎲 You rolled a **${roll}**`);
  }

  if (msg === '!avatar') {
    message.reply(message.author.displayAvatarURL({ size: 512 }));
  }
});

client.login(process.env.TOKEN);
