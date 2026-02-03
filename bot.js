const express = require('express');
const { Client, GatewayIntentBits, PermissionsBitField } = require('discord.js');
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

const warnings = new Map();
const spamMap = new Map();
const BAD_WORDS = ['fuck', 'babi', 'sial', 'bodoh'];

client.once('ready', () => {
  console.log('🤖 Bot is online!');
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const msg = message.content.toLowerCase();
  const logs = message.guild.channels.cache.find(c => c.name === 'logs');

  /* ===== BASIC COMMANDS ===== */
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

  /* ===== SPAM DETECTION ===== */
  const now = Date.now();
  const timestamps = spamMap.get(message.author.id) || [];
  timestamps.push(now);
  spamMap.set(message.author.id, timestamps.filter(t => now - t < 4000));

  if (spamMap.get(message.author.id).length > 5) {
    await message.delete();
    message.channel.send(`⚠️ ${message.author}, stop spamming!`);
    if (logs) logs.send(`📝 ${message.author.tag} warned for spamming`);
    return addWarning(message);
  }

  /* ===== BAD WORD FILTER ===== */
  if (BAD_WORDS.some(word => msg.includes(word))) {
    await message.delete();
    message.channel.send(`⚠️ ${message.author}, watch your language!`);
    if (logs) logs.send(`📝 ${message.author.tag} used bad language`);
    return addWarning(message);
  }

  /* ===== MOD COMMANDS ===== */
  if (msg.startsWith('!warn')) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) return;
    const user = message.mentions.members.first();
    if (!user) return message.reply('Mention a user to warn.');
    addWarning({ author: user.user, guild: message.guild, channel: message.channel });
  }

  if (msg.startsWith('!mute')) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) return;
    const user = message.mentions.members.first();
    if (!user) return message.reply('Mention a user to mute.');
    user.timeout(10 * 60 * 1000);
    message.channel.send(`🔇 ${user.user.tag} muted for 10 minutes.`);
    if (logs) logs.send(`🔇 ${user.user.tag} muted manually`);
  }
});

/* ===== WARNING SYSTEM ===== */
function addWarning(message) {
  const userId = message.author.id;
  const count = warnings.get(userId) || 0;
  warnings.set(userId, count + 1);

  message.channel.send(`⚠️ ${message.author.username} warning ${count + 1}/3`);

  if (count + 1 >= 3) {
    const member = message.guild.members.cache.get(userId);
    if (member) {
      member.timeout(10 * 60 * 1000);
      message.channel.send(`🔇 ${message.author.username} auto-muted for 10 minutes.`);
    }
    warnings.set(userId, 0);
  }
}

client.login(process.env.TOKEN);
