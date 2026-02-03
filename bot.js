const express = require('express');
const { Client, GatewayIntentBits, Partials } = require('discord.js');
require('dotenv').config();

/* ================= WEB SERVER FOR RENDER (DO NOT TOUCH) ================= */

const app = express();

app.get('/', (req, res) => {
  res.send('Hariz bot alive');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌐 Web server running on port ${PORT}`);
});

/* ================= DISCORD BOT ================= */

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.Channel],
});

client.once('ready', () => {
  console.log('🤖 Moderator Bot is online!');
});

/* ================= MODERATION CONFIG ================= */

const badWords = ['bodoh', 'babi', 'pukimak', 'fuck', 'shit'];
const userSpamMap = new Map();

/* ================= WELCOME MESSAGE ================= */

client.on('guildMemberAdd', (member) => {
  const channel = member.guild.systemChannel;
  if (channel) {
    channel.send(`👋 Welcome ${member.user.username} to the server!`);
  }
});

/* ================= MESSAGE HANDLER ================= */

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const msg = message.content.toLowerCase();

  /* -------- BAD WORD FILTER -------- */
  if (badWords.some(word => msg.includes(word))) {
    await message.delete();
    message.channel.send(`⚠️ ${message.author}, watch your language!`);
    return;
  }

  /* -------- CAPS LOCK FILTER -------- */
  if (message.content.length > 6 && message.content === message.content.toUpperCase()) {
    await message.delete();
    message.channel.send(`⚠️ ${message.author}, no shouting please!`);
    return;
  }

  /* -------- SPAM FILTER -------- */
  const now = Date.now();
  const timestamps = userSpamMap.get(message.author.id) || [];

  timestamps.push(now);
  userSpamMap.set(message.author.id, timestamps.filter(t => now - t < 5000));

  if (userSpamMap.get(message.author.id).length > 5) {
    await message.delete();
    message.channel.send(`⚠️ ${message.author}, stop spamming!`);
    return;
  }

  /* -------- COMMANDS -------- */

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
