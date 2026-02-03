const express = require('express');
const { Client, GatewayIntentBits, PermissionsBitField } = require('discord.js');
require('dotenv').config();

/* ================= WEB SERVER FOR RENDER ================= */
const app = express();
app.get('/', (req, res) => res.send('Hariz bot alive'));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Web server running on port ${PORT}`));
/* ========================================================= */

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

const warnings = new Map();
const spamMap = new Map();

/* ================= BAD WORDS LIST (BIG) ================= */
const BAD_WORDS = [
  "fuck","fucker","fucking","shit","bitch","asshole","dick","pussy","cunt",
  "babi","sial","bodoh","bangang","kimak","pantat","pukimak",
  "idiot","stupid","retard","noob","moron","loser",
  "wtf","dafuq","cb","knn","lanjiao","pukimak","punde",
  "bastard","motherfucker","slut","whore"
];
/* ======================================================== */

client.once('ready', () => {
  console.log('🤖 Moderator Bot is online!');
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const msg = message.content.toLowerCase();
  const userId = message.author.id;
  const member = message.member;
  const logs = message.guild.channels.cache.find(c => c.name === "logs");

  /* ================= BASIC COMMANDS ================= */
  if (msg === '!ping') return message.reply('🏓 Pong!');
  if (msg === '!hello') return message.reply(`Hello ${message.author.username} 👋`);
  if (msg === '!time') return message.reply(`⏰ Server time: ${new Date().toLocaleString()}`);
  if (msg === '!roll') {
    const roll = Math.floor(Math.random() * 6) + 1;
    return message.reply(`🎲 You rolled **${roll}**`);
  }
  if (msg === '!avatar') {
    return message.reply(message.author.displayAvatarURL({ size: 512 }));
  }
  /* ================================================= */

  /* ================= SWEAR DETECTION ================= */
  if (BAD_WORDS.some(word => msg.includes(word))) {
    await message.reply(`⚠️ ${message.author}, watch your language!`);

    if (logs) logs.send(`📝 ${message.author.username} used a bad word: "${message.content}"`);
  }
  /* =================================================== */

  /* ================= SPAM DETECTION =================== */
  const now = Date.now();
  if (!spamMap.has(userId)) spamMap.set(userId, []);
  const timestamps = spamMap.get(userId);

  timestamps.push(now);
  spamMap.set(userId, timestamps.filter(t => now - t < 5000));

  if (spamMap.get(userId).length >= 6) {
    await message.reply(`⚠️ ${message.author}, stop spamming!`);

    if (!warnings.has(userId)) warnings.set(userId, 0);
    warnings.set(userId, warnings.get(userId) + 1);

    const warnCount = warnings.get(userId);

    if (logs) logs.send(`📒 ${message.author.username} warned for spamming (${warnCount}/3)`);

    await message.channel.send(`⚠️ ${message.author} warning ${warnCount}/3 for spamming!`);

    /* ========== AUTO TIMEOUT AFTER 3 WARNINGS ========== */
    if (warnCount >= 3) {
      if (member && member.moderatable) {
        await member.timeout(10 * 60 * 1000, "Spam detected by HarizBot");

        await message.channel.send(`🚫 ${member.user.username} has been timed out for 10 minutes.`);
        if (logs) logs.send(`⛔ ${member.user.username} timed out for spam (3/3 warnings).`);

        warnings.set(userId, 0);
      }
    }
  }
  /* =================================================== */
});

client.login(process.env.TOKEN);
