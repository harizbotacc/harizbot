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

/* ========= ARRAYS ========= */

const eightBall = [
  "Yes 👍",
  "No 👎",
  "Maybe 🤔",
  "Definitely 💯",
  "Ask again later ⏳",
  "I don’t think so 😅",
  "Without a doubt 😎",
  "Very unlikely 🚫",
  "Signs point to yes ✨",
  "Better not tell you now 🤫"
];

const memes = [
  "https://i.imgur.com/1ZQZ1ZQ.jpeg",
  "https://i.imgur.com/2YQZ2YQ.jpeg",
  "https://i.imgur.com/3XQZ3XQ.jpeg",
  "https://i.imgur.com/4WQZ4WQ.jpeg",
  "https://i.imgur.com/5VQZ5VQ.jpeg",
  "https://i.imgur.com/6UQZ6UQ.jpeg",
  "https://i.imgur.com/7TQZ7TQ.jpeg",
  "https://i.imgur.com/8SQZ8SQ.jpeg"
];

const jokes = [
"Why did the developer go broke? Because he used up all his cache 💸",
"I told my computer I needed a break… it said no problem and froze 🥶",
"Debugging: Being the detective in a crime movie where you are also the murderer 🕵️",
"Why do programmers prefer dark mode? Because light attracts bugs 🐛",
"There are only 10 types of people. Those who understand binary and those who don’t 😎",
"I would tell you a UDP joke… but you might not get it 📡",
"My code works. I have no idea why 🤯",
"My code doesn’t work. I have no idea why 😭",
"Programming is 10% writing code and 90% wondering why it doesn’t work",
"I love deadlines. I love the whooshing sound they make as they fly by ✈️",
"Why did the function return early? It had a date 🗓️",
"Computers make very fast, very accurate mistakes ⚡",
"To understand recursion, you must first understand recursion 🔁",
"Why did the array break up? Too many issues 💔",
"I don’t always test my code… but when I do, I do it in production 😬"
];

/* ========= FUN COMMANDS ========= */

if (msg === '!joke')
  return message.reply(jokes[Math.floor(Math.random() * jokes.length)]);

if (msg === '!meme') {
  const meme = memes[Math.floor(Math.random() * memes.length)];
  return message.reply(meme);
}

if (msg.startsWith('!8ball')) {
  const answer = eightBall[Math.floor(Math.random() * eightBall.length)];
  return message.reply(`🎱 ${answer}`);
}

if (msg === '!bot')
    return message.reply('🤖 HarizBot is alive and watching you...');

if (msg === '!coin')
    return message.reply(Math.random() < 0.5 ? "🪙 Heads" : "🪙 Tails");

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
!meme
!8ball <question>
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
