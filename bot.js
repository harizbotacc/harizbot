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
    if (msg === '!ping') return message.reply('🏓 Pong!');
    if (msg === '!hello') return message.reply(`Hello ${message.author.username} 👋`);
    if (msg === '!time') return message.reply(`🕒 Server time: ${new Date().toLocaleString()}`);

    /* ========= SWEAR DETECTION ========= */
    if (BAD_WORDS.some(word => msg.includes(word))) {
        await message.delete().catch(() => {});
        await message.channel.send(`⚠️ ${message.author}, watch your language!`);
        if (logs) logs.send(`🚨 ${message.author.username} used a bad word: "${message.content}"`);
        return;
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
