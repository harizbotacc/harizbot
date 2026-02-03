const express = require('express');
const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

/* ================= WEB SERVER FOR RENDER ================= */
const app = express();
app.get('/', (req, res) => res.send('Hariz bot alive'));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Web server running on port ${PORT}`));
/* ========================================================= */

/* ================= DISCORD BOT ================= */
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

/* ================= MEMORY ================= */
const warnings = new Map();
const spamMap = new Map();

/* ============== BIG SWEAR LIST ============== */
const BAD_WORDS = [
  'fuck','fucker','fucking','fk','fuk',
  'babi','sial','bodoh','pukimak','puki',
  'anjing','bangsat','kontol','kote','butoh',
  'shit','bitch','asshole','dumbass','retard'
];

/* ================= READY ================= */
client.once('ready', () => {
  console.log('🤖 Moderator Bot is online!');
});

/* ================= MESSAGE ================= */
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const msg = message.content.toLowerCase();
  const member = message.member;
  const userId = message.author.id;
  const logs = message.guild.channels.cache.find(c => c.name === 'logs');

  /* ============== BASIC COMMANDS ============== */
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

  /* ============== SWEAR DETECTION ============== */
  if (BAD_WORDS.some(word => msg.includes(word))) {
    await message.delete().catch(() => {});
    await message.channel.send(`⚠️ ${message.author}, watch your language!`);

    if (logs) {
      logs.send(`📝 ${message.author.tag} used bad word: "${message.content}"`);
    }

    addWarning(message, member, userId, logs, "Bad language");
    return;
  }

  /* ============== SPAM DETECTION ============== */
  const now = Date.now();
  if (!spamMap.has(userId)) spamMap.set(userId, []);
  const timestamps = spamMap.get(userId);

  timestamps.push(now);
  spamMap.set(userId, timestamps.filter(t => now - t < 5000));

  if (spamMap.get(userId).length >= 6) {
    await message.channel.send(`⚠️ ${message.author}, stop spamming!`);
    addWarning(message, member, userId, logs, "Spamming");
  }
});

/* ============== WARNING + TIMEOUT SYSTEM ============== */
async function addWarning(message, member, userId, logs, reason) {
  const current = warnings.get(userId) || 0;
  const newCount = current + 1;
  warnings.set(userId, newCount);

  await message.channel.send(`⚠️ ${message.author} warning ${newCount}/3 (${reason})`);

  if (logs) {
    logs.send(`📝 ${message.author.tag} warned ${newCount}/3 for ${reason}`);
  }

  if (newCount >= 3) {
    if (member && member.moderatable) {
      await member.timeout(10 * 60 * 1000, reason);
      await message.channel.send(`🔇 ${message.author} muted for 10 minutes.`);
      if (logs) logs.send(`🔇 ${message.author.tag} timed out (3/3 warnings)`);
      warnings.set(userId, 0);
    }
  }
}

client.login(process.env.TOKEN);
