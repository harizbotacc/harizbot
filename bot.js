const express = require('express');
const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

/* ========= WEB SERVER FOR RENDER ========= */
const app = express();
app.get('/', (req, res) => res.send('Hariz bot alive'));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Web server running on port ${PORT}`));

/* ========= DISCORD BOT ========= */
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

const BAD_WORDS = [
    'fuck','babi','sial','bodoh','pukimak','puki','kimak',
    'lanjiao','cb','cibai','knn','anjing','bangsat'
];

client.once('ready', () => {
    console.log('🤖 Hariz Moderator Bot is online!');
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const msg = message.content.toLowerCase();
    const logs = message.guild.channels.cache.find(c => c.name === 'logs');
    const member = message.member;
    const userId = message.author.id;

    /* ========= BASIC COMMANDS ========= */

if (msg === '!ping')
    return message.reply('📍 Pong!');

if (msg === '!hello')
    return message.reply(`Hello ${message.author.username} 👋`);

if (msg === '!time')
    return message.reply(`🕒 Server Time: ${new Date().toLocaleString()}`);

if (msg === '!knock')
    return message.reply('🚪 Who’s there?');

if (msg === '!joke')
    return message.reply('Why did the developer go broke? Because he used up all his cache 💸');

if (msg === '!bot')
    return message.reply('🤖 HarizBot is alive and watching you...');

if (msg === '!coin')
    return message.reply('🪙 Heads');

if (msg === '!dice')
    return message.reply(`🎲 You rolled: ${Math.floor(Math.random() * 6) + 1}`);

if (msg === '!rate')
    return message.reply(`⭐ I rate you ${Math.floor(Math.random() * 10) + 1}/10`);

if (msg === '!fact')
    return message.reply('🧠 Did you know? JavaScript was made in 10 days.');

if (msg === '!motivate')
    return message.reply('💪 Don’t stop. You’re building something most people quit on.');


if (msg === '!help') {
    return message.reply(`
🤖 **HarizBot Commands**

!ping
!hello
!time
!knock
!joke
!bot
!coin
!dice
!rate
!fact
!motivate
!help
`);
}

    /* ========= SPAM DETECTION ========= */
    const now = Date.now();
    if (!spamMap.has(userId)) spamMap.set(userId, []);
    const timestamps = spamMap.get(userId);

    timestamps.push(now);
    spamMap.set(userId, timestamps.filter(t => now - t < 5000));

    if (spamMap.get(userId).length >= 5) {
        await message.channel.send(`⚠️ ${message.author}, stop spamming!`);

        if (!warnings.has(userId)) warnings.set(userId, 0);
        warnings.set(userId, warnings.get(userId) + 1);

        const warnCount = warnings.get(userId);

        if (logs) logs.send(`📝 ${message.author.username} warned for spamming (${warnCount}/3)`);

        await message.channel.send(`⚠️ ${message.author} warning ${warnCount}/3 for spamming!`);

        /* ========= AUTO TIMEOUT AFTER 3 WARNINGS ========= */
        if (warnCount >= 3) {
            if (member && member.moderatable) {
                await member.timeout(10 * 60 * 1000, "Spam detected by HarizBot");

                await message.channel.send(`⛔ ${member.user.username} has been timed out for 10 minutes.`);
                if (logs) logs.send(`⛔ ${member.user.username} timed out for spam.`);

                warnings.set(userId, 0);
            }
        }
    }
});

client.login(process.env.TOKEN);
