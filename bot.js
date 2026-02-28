const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { Client, GatewayIntentBits } = require("discord.js");
require("dotenv").config();

/* ================= DISCORD CLIENT ================= */

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

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

        const ORDER_CHANNEL_ID = "1476398520738119800";
        const channel = await client.channels.fetch(ORDER_CHANNEL_ID);

        if (!channel) {
            return res.status(500).json({ error: "Channel not found" });
        }

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
        { name: "Total", value: "RM " + total, inline: true }
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
    await channel.send({
        embeds: [embed]
    });
}

        await channel.send({
            embeds: [{
                title: "🛒 New Dreamy Dough Order",
                color: 0xb88a44,
                fields: [
                    { name: "Order ID", value: orderId, inline: true },
                    { name: "Customer Name", value: name, inline: true },
                    { name: "Phone", value: phone, inline: true },
                    { name: "Email", value: email || "Not provided", inline: true },
                    { name: "Address", value: address },
                    { name: "Items Ordered", value: items || "Not provided" },
                    { name: "Total", value: "RM " + total, inline: true },
                    { name: "Receipt", value: receiptLink }
                ],
                timestamp: new Date()
            }]
        });

        res.json({ success: true });

    } catch (err) {
        console.error("Order error:", err);
        res.status(500).json({ error: "Server error" });
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