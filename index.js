require("dotenv").config();
const fs = require("fs");
const path = require("path");
const {
    Client,
    Partials,
    GatewayIntentBits,
    AttachmentBuilder,
    EmbedBuilder
} = require("discord.js");

const { generateCaptcha } = require("./utils/captcha");

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
    partials: [Partials.Channel]
});

// 🗂 Dynamické načtení příkazů
client.commands = new Map();
client.logChannels = new Map();

const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.data.name, command);
}

// Ready event
client.on("clientReady", () => {
    console.log(`🟢 Bot běží jako ${client.user.tag}`);
});

// Slash command handler
client.on("interactionCreate", async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const cmd = client.commands.get(interaction.commandName);
    if (!cmd) return;

    try {
        await cmd.execute(interaction);
    } catch (err) {
        console.log(err);
        interaction.reply({ content: "⚠️ Nastala chyba při vykonání příkazu.", ephemeral: true });
    }
});

// ---------------- CAPTCHA BUTTON ---------------- //
client.on("interactionCreate", async interaction => {
    if (!interaction.isButton()) return;
    if (interaction.customId !== "verify_start") return;

    const { text, buffer } = await generateCaptcha();
    const attachment = new AttachmentBuilder(buffer, { name: "captcha.png" });

    const embed = new EmbedBuilder()
        .setTitle("🧩 CAPTCHA Ověření")
        .setDescription("Opiš text z obrázku:")
        .setColor("Blue")
        .setImage("attachment://captcha.png");

    await interaction.reply({
        embeds: [embed],
        files: [attachment],
        ephemeral: true
    });

    const filter = m => m.author.id === interaction.user.id;
    const collector = interaction.channel.createMessageCollector({ filter, time: 15000, max: 1 });

    collector.on("collect", async m => {
        if (m.content.toUpperCase() === text) {
            const role = interaction.guild.roles.cache.find(r => r.name === "Verified");

            await m.reply("✅ Ověření úspěšné!");
            await interaction.member.roles.add(role);

            const logChannelId = client.logChannels.get(interaction.guild.id);
            const logChan = interaction.guild.channels.cache.get(logChannelId);
            logChan?.send(`✔ **${interaction.user.tag}** prošel ověřením.`);
        } else {
            await m.reply("❌ Špatně.");
        }
    });
});

client.login(process.env.TOKEN);
