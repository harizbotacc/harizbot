const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { Client, GatewayIntentBits } = require("discord.js");
require("dotenv").config();

/* ================= DISCORD CLIENT ================= */

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

/* ================= CHANNEL IDS ================= */

const ORDER_CHANNEL_ID = "1476398520738119800";
const STAFF_ROLE_ID = "1478279653864243245";
const PREPARING_CHANNEL_ID = "1478997392006054012";
const SHIPPED_CHANNEL_ID = "1478997317800693822";

/* ================= INVENTORY ================= */

let stock = {
    darkGift: 40,
    darkFiezta: 40,
    whiteGift: 40,
    whiteFiezta: 40,
    hazelGift: 40,
    hazelFiezta: 40
};

/* ================= DAILY STATS ================= */

let dailyStats = {
    orders: 0,
    jars: 0,
    revenue: 0,
    dark: 0,
    white: 0,
    hazel: 0
};

let weeklyStats = {
    orders: 0,
    jars: 0,
    revenue: 0,
    dark: 0,
    white: 0,
    hazel: 0
};

/* ================= EXPRESS APP ================= */

const app = express();
app.use(cors());

/* ================= FILE UPLOAD SETUP ================= */

const uploadFolder = "uploads";

if (!fs.existsSync(uploadFolder)) {
    fs.mkdirSync(uploadFolder);
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadFolder);
    },
    filename: function (req, file, cb) {
        const uniqueName = Date.now() + "-" + file.originalname;
        cb(null, uniqueName);
    }
});

const upload = multer({ storage: storage });

app.use("/uploads", express.static(path.join(__dirname, uploadFolder)));

/* ================= HEALTH CHECK ================= */

app.get("/", (req, res) => {
    res.send("Dreamy Dough Order Server Running 🚀");
});

/* ================= LOW STOCK WARNING ================= */

async function checkLowStock(channel){

const warnings = []

if(stock.darkGift <= 3) warnings.push(`⚠ Dark Secrets Gift Jar LOW STOCK (${stock.darkGift} left)`)
if(stock.darkFiezta <= 3) warnings.push(`⚠ Dark Secrets Fiezta Jar LOW STOCK (${stock.darkFiezta} left)`)

if(stock.whiteGift <= 3) warnings.push(`⚠ White Symphony Gift Jar LOW STOCK (${stock.whiteGift} left)`)
if(stock.whiteFiezta <= 3) warnings.push(`⚠ White Symphony Fiezta Jar LOW STOCK (${stock.whiteFiezta} left)`)

if(stock.hazelGift <= 3) warnings.push(`⚠ Hazel B Gift Jar LOW STOCK (${stock.hazelGift} left)`)
if(stock.hazelFiezta <= 3) warnings.push(`⚠ Hazel B Fiezta Jar LOW STOCK (${stock.hazelFiezta} left)`)

if(stock.darkGift === 0) warnings.push(`❌ Dark Secrets Gift Jar SOLD OUT`)
if(stock.darkFiezta === 0) warnings.push(`❌ Dark Secrets Fiezta Jar SOLD OUT`)

if(stock.whiteGift === 0) warnings.push(`❌ White Symphony Gift Jar SOLD OUT`)
if(stock.whiteFiezta === 0) warnings.push(`❌ White Symphony Fiezta Jar SOLD OUT`)

if(stock.hazelGift === 0) warnings.push(`❌ Hazel B Gift Jar SOLD OUT`)
if(stock.hazelFiezta === 0) warnings.push(`❌ Hazel B Fiezta Jar SOLD OUT`)

if(warnings.length > 0){
    await channel.send(
        `<@&${STAFF_ROLE_ID}> ⚠ **Low Stock Alert!**\n\n` +
        warnings.join("\n")
    );
}

}

/* ================= INVENTORY UPDATE ================= */

function minusStock(key, qty){
stock[key] = Math.max(0, stock[key] - qty);
}

function updateStock(itemsText) {

if (!itemsText) return;

const lines = itemsText.split("\n");

lines.forEach(line => {

const qty = parseInt(line.match(/Qty:\s*(\d+)/)?.[1] || 1);

if (line.includes("Dark") && line.includes("Gift")) {
minusStock("darkGift", qty)
dailyStats.jars += qty
weeklyStats.jars += qty

dailyStats.dark += qty
weeklyStats.dark += qty
}

if (line.includes("Dark") && line.includes("Fiezta")) {
minusStock("darkFiezta", qty)
dailyStats.jars += qty
weeklyStats.jars += qty

dailyStats.dark += qty
weeklyStats.dark += qty
}

if (line.includes("White") && line.includes("Gift")) {
minusStock("whiteGift", qty)
dailyStats.jars += qty
weeklyStats.jars += qty

dailyStats.white += qty
weeklyStats.white += qty
}

if (line.includes("White") && line.includes("Fiezta")) {
minusStock("whiteFiezta", qty)
dailyStats.jars += qty
weeklyStats.jars += qty

dailyStats.white += qty
weeklyStats.white += qty
}

if (line.includes("Hazel") && line.includes("Gift")) {
minusStock("hazelGift", qty)
dailyStats.jars += qty
weeklyStats.jars += qty

dailyStats.hazel += qty
weeklyStats.hazel += qty
}

if (line.includes("Hazel") && line.includes("Fiezta")) {
minusStock("hazelFiezta", qty)
dailyStats.jars += qty
weeklyStats.jars += qty

dailyStats.hazel += qty
weeklyStats.hazel += qty
}

})
}

/* ================= ORDER ROUTE ================= */

app.post("/order", upload.single("receipt"), async (req, res) => {
    try {

        if (!client.isReady()) {
            return res.status(503).json({ error: "Bot not ready yet" });
        }

        const {
            orderId,
            name,
            phone,
            email,
            address,
            items,
            total
        } = req.body;

dailyStats.orders += 1
dailyStats.revenue += parseFloat(total) || 0

weeklyStats.orders += 1
weeklyStats.revenue += parseFloat(total) || 0

        if (!orderId || !name || !phone || !address || !total) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const channel = await client.channels.fetch(ORDER_CHANNEL_ID);

        updateStock(items);

        const embed = {
            title: "🛒 New Dreamy Dough Order",
            color: 0xb88a44,
            fields: [
                { name: "Order ID", value: orderId, inline: true },
                { name: "Customer Name", value: name, inline: true },
                { name: "Phone", value: phone, inline: true },
                { name: "Email", value: email || "Not provided", inline: true },
                { name: "Address", value: address },
                { name: "Items Ordered", value: items || "Not provided" },
                { name: "Final Total", value: "RM " + total, inline: true }
            ],
            timestamp: new Date()
        };

        if (req.file) {
            await channel.send({
                embeds: [embed],
                files: [
                    {
                        attachment: path.join(__dirname, uploadFolder, req.file.filename),
                        name: req.file.filename
                    }
                ]
            });
        } else {
            await channel.send({ embeds: [embed] });
        }

        await checkLowStock(channel)

        res.json({ success: true });

    } catch (err) {
        console.error("Order error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

/* ================= DISCORD COMMANDS ================= */

client.on("messageCreate", async (message) => {

if (message.author.bot) return;

const content = message.content.trim();

/* ===== VERIFY ===== */

if (content.startsWith("!verify")) {

const args = content.split(" ");
const orderId = args[1];

const messages = await message.channel.messages.fetch({ limit: 50 });

const target = messages.find(msg =>
msg.embeds.length > 0 &&
msg.embeds[0].fields?.some(field =>
field.name === "Order ID" && field.value === orderId
)
);

if (!target) return message.reply("Order not found.");

const preparingChannel = await client.channels.fetch(PREPARING_CHANNEL_ID);

const embed = target.embeds[0].data;
embed.title = "🍪 Dreamy Dough Order — PREPARING";

await preparingChannel.send({
embeds: [embed],
files: target.attachments.map(a => a.url)
});

await target.delete();

return message.reply(`✅ ORDER ${orderId} moved to PREPARING`);

}

/* ===== SHIP ===== */

if (content.startsWith("!ship")) {

const args = content.split(" ");
const orderId = args[1];

const preparingChannel = await client.channels.fetch(PREPARING_CHANNEL_ID);
const shippedChannel = await client.channels.fetch(SHIPPED_CHANNEL_ID);

const messages = await preparingChannel.messages.fetch({ limit: 50 });

const target = messages.find(msg =>
msg.embeds.length > 0 &&
msg.embeds[0].fields?.some(field =>
field.name === "Order ID" && field.value === orderId
)
);

if (!target) return message.reply("Order not found in preparing.");

const embed = target.embeds[0].data;
embed.title = "📦 Dreamy Dough Order — SHIPPED";

await shippedChannel.send({
embeds: [embed],
files: target.attachments.map(a => a.url)
});

await target.delete();

return message.reply(`📦 ORDER ${orderId} SHIPPED`);

}

/* ===== STOCK ===== */

if (content === "!stock") {

return message.reply(`
🍪 Dreamy Dough Stock

Dark Secrets
Gift Jar: ${stock.darkGift}
Fiezta Jar: ${stock.darkFiezta}

White Symphony
Gift Jar: ${stock.whiteGift}
Fiezta Jar: ${stock.whiteFiezta}

Hazel B
Gift Jar: ${stock.hazelGift}
Fiezta Jar: ${stock.hazelFiezta}
`);
}

if (content === "!lowstock") {

let msg = "⚠ Low Stock Items\n\n";

if(stock.darkGift <= 3) msg += `Dark Gift: ${stock.darkGift}\n`;
if(stock.darkFiezta <= 3) msg += `Dark Fiezta: ${stock.darkFiezta}\n`;

if(stock.whiteGift <= 3) msg += `White Gift: ${stock.whiteGift}\n`;
if(stock.whiteFiezta <= 3) msg += `White Fiezta: ${stock.whiteFiezta}\n`;

if(stock.hazelGift <= 3) msg += `Hazel Gift: ${stock.hazelGift}\n`;
if(stock.hazelFiezta <= 3) msg += `Hazel Fiezta: ${stock.hazelFiezta}\n`;

if(msg === "⚠ Low Stock Items\n\n") msg += "✅ No low stock items";

return message.reply(msg);
}

if (content === "!weeklyreport") {

const report = `
📊 Weekly Performance Report

🧾 Orders: ${weeklyStats.orders}
🍪 Jars Sold: ${weeklyStats.jars}

🍫 Dark: ${weeklyStats.dark}
🤍 White: ${weeklyStats.white}
🌰 Hazel: ${weeklyStats.hazel}

💰 Revenue: RM ${weeklyStats.revenue}
`;

return message.reply(report);
}

/* ===== RESTOCK ===== */

if (content.startsWith("!restock")) {

const args = content.split(" ");

const flavor = args[1]?.toLowerCase();

if (flavor === "all") {
const amount = parseInt(args[2]);
if (isNaN(amount)) return message.reply("⚠ Enter valid amount");
Object.keys(stock).forEach(k => stock[k] = amount);
return message.reply(`🍪 All stock reset to ${amount}`);
}

const size = args[2]?.toLowerCase();
const amount = parseInt(args[3]);

if (isNaN(amount)) return message.reply("⚠ Enter valid amount");

const map = {
dark: ["darkGift", "darkFiezta"],
white: ["whiteGift", "whiteFiezta"],
hazel: ["hazelGift", "hazelFiezta"]
};

if (!map[flavor]) return message.reply("⚠ Flavor not found");

if (!size) {
map[flavor].forEach(k => stock[k] = amount);
return message.reply(`🍪 ${flavor} all sizes restocked to ${amount}`);
}

const key = flavor + (size === "gift" ? "Gift" : "Fiezta");

if (!stock.hasOwnProperty(key)) return message.reply("⚠ Size not found");

stock[key] = amount;

return message.reply(`🍪 ${flavor} ${size} restocked to ${amount}`);
}

});

/* ================= DAILY REPORT ================= */

async function sendDailyReport(){

const channel = await client.channels.fetch(ORDER_CHANNEL_ID)

const report = `
📊 Dreamy Dough Daily Report

🧾 Orders Today: ${dailyStats.orders}
🍪 Jars Sold: ${dailyStats.jars}

🍫 Dark Secrets Sold: ${dailyStats.dark}
🤍 White Symphony Sold: ${dailyStats.white}
🌰 Hazel B Sold: ${dailyStats.hazel}

💰 Revenue: RM ${dailyStats.revenue}

📦 Remaining Stock

Dark Secrets
• Gift: ${stock.darkGift}
• Fiezta: ${stock.darkFiezta}

White Symphony
• Gift: ${stock.whiteGift}
• Fiezta: ${stock.whiteFiezta}

Hazel B
• Gift: ${stock.hazelGift}
• Fiezta: ${stock.hazelFiezta}
`

await channel.send(report)

dailyStats = {
   orders: 0,
   jars: 0,
   revenue: 0,
   dark: 0,
   white: 0,
   hazel: 0
}

const day = new Date().getDay();
if(day === 0){
weeklyStats = {
   orders: 0,
   jars: 0,
   revenue: 0,
   dark: 0,
   white: 0,
   hazel: 0
};
}

}

/* ================= START SERVER AFTER BOT READY ================= */

client.once("ready", () => {

console.log("🤖 Dreamy Dough Order Bot Online!")

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
console.log(`🌍 Server running on port ${PORT}`)
})

/* ================= DAILY REPORT TIMER ================= */

let lastReportDate = null;

setInterval(() => {

const now = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Kuala_Lumpur" })
);

const today = now.toDateString();

if(now.getHours() === 22 && now.getMinutes() === 0){
    if(lastReportDate !== today){
        sendDailyReport();
        lastReportDate = today;
    }
}

}, 60000)

/* ================= LOGIN ================= */
})

client.login(process.env.TOKEN)
