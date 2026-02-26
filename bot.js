const express = require("express");
const cors = require("cors");
const { Client, GatewayIntentBits } = require("discord.js");
require("dotenv").config();

/* ========= DISCORD BOT ========= */

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ],
});

/* ========= WEB SERVER FOR RENDER ========= */

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Hariz bot alive");
});

app.post("/order", async (req, res) => {
    console.log("New Order:", req.body);

    try {
        const { orderId, items, total, bank, status } = req.body;

        const ORDER_CHANNEL_ID = "1476398520738119800"; // <-- CHANGE THIS

        const channel = await client.channels.fetch(ORDER_CHANNEL_ID);

        const itemText = items.map(i =>
            `• ${i.name} (${i.sizeText}) - RM ${i.price}`
        ).join("\n");

        await channel.send({
            embeds: [{
                title: "🛒 New Dreamy Dough Order",
                color: 0xb88a44,
                fields: [
                    { name: "Order ID", value: orderId },
                    { name: "Bank", value: bank },
                    { name: "Status", value: status },
                    { name: "Items", value: itemText },
                    { name: "Total", value: "RM " + total }
                ],
                timestamp: new Date()
            }]
        });

        res.json({ success: true });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🌍 Web server running on port ${PORT}`);
});

/* ========= DATA STORAGE ========= */

const warnings = new Map();
const spamMap = new Map();

/* ========= CONSTANTS ========= */

const BAD_WORDS = [
    'fuck','babi','sial','bodoh','pukimak','puki','kimak',
    'lanjiao','cb','cibai','knn','anjing','bangsat'
];

const eightBall = [
  "Yes 👍","No 👎","Maybe 🤔","Definitely 💯",
  "Ask again later ⏳","I don’t think so 😅",
  "Without a doubt 😎","Very unlikely 🚫",
  "Signs point to yes ✨","Better not tell you now 🤫"
];

const memes = [
  "https://i.imgur.com/1ZQZ1ZQ.jpeg",
  "https://i.imgur.com/2YQZ2YQ.jpeg",
  "https://i.imgur.com/3XQZ3XQ.jpeg",
  "https://i.imgur.com/4WQZ4WQ.jpeg"
];

const jokes = [
"Why did the developer go broke? Because he used up all his cache 💸",
"I told my computer I needed a break… it said no problem and froze 🥶",
"Debugging: Being the detective where you are also the murderer 🕵️",
"Why do programmers prefer dark mode? Because light attracts bugs 🐛",
"There are only 10 types of people. Those who understand binary and those who don’t 😎"
];

/* ========= COMMAND SYSTEM ========= */

const commands = {
    ping: () => '📍 Pong!',
    hello: (msg) => `Hello ${msg.author.username} 👋`,
    time: () => `🕒 Server Time: ${new Date().toLocaleString()}`,
    knock: () => '🚪 Who’s there?',
    joke: () => jokes[Math.floor(Math.random() * jokes.length)],
    meme: () => memes[Math.floor(Math.random() * memes.length)],
    bot: () => '🤖 HarizBot is alive and watching you...',
    coin: () => Math.random() < 0.5 ? "🪙 Heads" : "🪙 Tails",
    dice: () => `🎲 You rolled: ${Math.floor(Math.random() * 6) + 1}`,
    rate: () => `⭐ I rate you ${Math.floor(Math.random() * 10) + 1}/10`,
    fact: () => '🧠 Did you know? JavaScript was made in 10 days.',
    motivate: () => '💪 Don’t stop. You’re building something most people quit on.',
    help: () => `
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
`
};

/* ========= BOT READY ========= */

client.once('ready', () => {
    console.log('🤖 Hariz Moderator Bot is online!');
});

/* ========= MESSAGE HANDLER ========= */

client.on('messageCreate', async (message) => {
    if (!message.guild) return;
    if (message.author.bot) return;

    const msg = message.content.toLowerCase();
    const userId = message.author.id;
    const member = message.member;
    const logs = message.guild.channels.cache.find(c => c.name === 'logs');

    for (const word of BAD_WORDS) {
        if (msg.includes(word)) {
            await message.delete();
            return message.channel.send(`⚠️ ${message.author}, watch your language.`);
        }
    }

    if (msg.startsWith('!')) {
        const args = msg.slice(1).split(" ");
        const command = args[0];

        if (command === '8ball') {
            const answer = eightBall[Math.floor(Math.random() * eightBall.length)];
            return message.reply(`🎱 ${answer}`);
        }

        if (commands[command]) {
            return message.reply(commands[command](message));
        }
    }

    const now = Date.now();
    if (!spamMap.has(userId)) spamMap.set(userId, []);
    const timestamps = spamMap.get(userId);

    timestamps.push(now);
    spamMap.set(userId, timestamps.filter(t => now - t < 5000));

    if (spamMap.get(userId).length >= 5) {
        await message.channel.send(`⚠️ ${message.author}, stop spamming!`);

        const warnCount = (warnings.get(userId) || 0) + 1;
        warnings.set(userId, warnCount);

        if (logs) logs.send(`📝 ${message.author.username} warned for spamming (${warnCount}/3)`);

        await message.channel.send(`⚠️ ${message.author} warning ${warnCount}/3 for spamming!`);

        if (warnCount >= 3 && member && member.moderatable) {
            await member.timeout(10 * 60 * 1000, "Spam detected by HarizBot");
            await message.channel.send(`⛔ ${member.user.username} has been timed out for 10 minutes.`);
            if (logs) logs.send(`⛔ ${member.user.username} timed out for spam.`);
            warnings.set(userId, 0);
        }
    }
});

/* ========= LOGIN ========= */

client.login(process.env.TOKEN);