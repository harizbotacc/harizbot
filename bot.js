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
const PREPARING_CHANNEL_ID = "1478997392006054012";
const SHIPPED_CHANNEL_ID = "1478997317800693822";

/* ================= INVENTORY ================= */

let stock = {
    dark: 40,
    white: 40,
    hazel: 40
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

/* ================= INVENTORY UPDATE ================= */

function updateStock(itemsText) {

    if (!itemsText) return;

    const lines = itemsText.split("\n");

    lines.forEach(line => {

        if (line.includes("Dark")) {
            const qty = parseInt(line.match(/Qty:\s*(\d+)/)?.[1] || 1);
            stock.dark -= qty;
        }

        if (line.includes("White")) {
            const qty = parseInt(line.match(/Qty:\s*(\d+)/)?.[1] || 1);
            stock.white -= qty;
        }

        if (line.includes("Hazel")) {
            const qty = parseInt(line.match(/Qty:\s*(\d+)/)?.[1] || 1);
            stock.hazel -= qty;
        }

    });

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

        if (!orderId || !name || !phone || !address || !total) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const channel = await client.channels.fetch(ORDER_CHANNEL_ID);
        const NEW_ORDER_ROLE_ID = "1478175343138312245";

        if (!channel) {
            return res.status(500).json({ error: "Channel not found" });
        }

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

const content = `<@1378311257999802418> <@1478279653864243245> 💰 Order ${orderId} received.`;

if (req.file) {
    await channel.send({
        content: content,
        embeds: [embed],
        files: [
            {
                attachment: path.join(__dirname, uploadFolder, req.file.filename),
                name: req.file.filename
            }
        ]
    });
} else {
    await channel.send({
        content: content,
        embeds: [embed]
    });
}
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

Dark Secrets: ${stock.dark}
White Symphony: ${stock.white}
Hazel B: ${stock.hazel}
`);
}

});

/* ================= START SERVER AFTER BOT READY ================= */

client.once("ready", () => {
    console.log("🤖 Dreamy Dough Order Bot Online!");

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`🌍 Server running on port ${PORT}`);
    });
});

/* ================= LOGIN ================= */

client.login(process.env.TOKEN);