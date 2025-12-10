require("dotenv").config({ path: "./INFO.env" });
const fs = require("fs");
const path = require("path");
const {
  Client,
  GatewayIntentBits,
  Partials,
  AttachmentBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require("discord.js");
const { createCaptcha } = require("./utils/captcha");
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages],
  partials: [Partials.Channel]
});
if (!fs.existsSync(path.join(__dirname, "data"))) fs.mkdirSync(path.join(__dirname, "data"));
const captchaMap = new Map();
client.commands = new Map();
const commandsPath = path.join(__dirname, "commands");
fs.readdirSync(commandsPath).filter(f => f.endsWith(".js")).forEach(file => {
  const cmd = require(path.join(commandsPath, file));
  client.commands.set(cmd.data.name, cmd);
});
function getConfig(guildId) {
  const file = path.join(__dirname, "data", `${guildId}.json`);
  if (!fs.existsSync(file)) {
    const init = { verifiedRole: null, unverifiedRole: null, verifyChannel: null, logChannel: null };
    fs.writeFileSync(file, JSON.stringify(init, null, 2));
    return { path: file, data: init };
  }
  return { path: file, data: JSON.parse(fs.readFileSync(file)) };
}
async function ensureRoles(guild) {
  const cfgObj = getConfig(guild.id);
  let changed = false;
  if (!cfgObj.data.verifiedRole || !guild.roles.cache.has(cfgObj.data.verifiedRole)) {
    const r = await guild.roles.create({ name: "Verified", color: "Green", reason: "Auto-create Verified role" });
    cfgObj.data.verifiedRole = r.id;
    changed = true;
  }
  if (!cfgObj.data.unverifiedRole || !guild.roles.cache.has(cfgObj.data.unverifiedRole)) {
    const r = await guild.roles.create({ name: "Unverified", color: "Red", reason: "Auto-create Unverified role" });
    cfgObj.data.unverifiedRole = r.id;
    changed = true;
  }
  if (changed) fs.writeFileSync(cfgObj.path, JSON.stringify(cfgObj.data, null, 2));
  return cfgObj.data;
}
async function lockChannelsForGuild(guild, verifiedRoleId) {
  guild.channels.cache.forEach(ch => {
    if (!ch || !ch.isTextBased() || ch.type !== 0) return;
    try {
      ch.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: false });
      ch.permissionOverwrites.edit(verifiedRoleId, { SendMessages: true });
    } catch (e) {}
  });
}
client.once("ready", async () => {
  for (const [guildId, guild] of client.guilds.cache) {
    try {
      await ensureRoles(guild);
    } catch (e) {}
  }
});
client.on("guildCreate", async guild => {
  try {
    await ensureRoles(guild);
  } catch (e) {}
});
client.on("guildMemberAdd", async member => {
  const cfg = getConfig(member.guild.id).data;
  if (cfg.unverifiedRole) {
    try {
      await member.roles.add(cfg.unverifiedRole);
    } catch (e) {}
  }
  if (cfg.logChannel) {
    const ch = member.guild.channels.cache.get(cfg.logChannel);
    ch?.send(`👤 New member ${member.user.tag} assigned Unverified`);
  }
});
client.on("interactionCreate", async interaction => {
  try {
    if (interaction.isChatInputCommand()) {
      const cmd = client.commands.get(interaction.commandName);
      if (!cmd) return;
      return cmd.execute(interaction, client, getConfig);
    }
    if (interaction.isButton() && interaction.customId === "verify_start") {
      const { code, buffer } = await createCaptcha();
      const attachment = new AttachmentBuilder(buffer, { name: "captcha.png" });
      captchaMap.set(`${interaction.guild.id}:${interaction.user.id}`, code);
      const embed = new EmbedBuilder().setTitle("🧩 CAPTCHA").setDescription("Press Answer and enter the code shown in the image.").setImage("attachment://captcha.png");
      const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("captcha_answer").setLabel("Answer").setStyle(ButtonStyle.Primary));
      await interaction.reply({ embeds: [embed], files: [attachment], components: [row], ephemeral: true });
      return;
    }
    if (interaction.isButton() && interaction.customId === "captcha_answer") {
      const modal = new ModalBuilder().setCustomId("captcha_modal").setTitle("Enter CAPTCHA");
      const input = new TextInputBuilder().setCustomId("captcha_input").setLabel("CAPTCHA code").setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(10);
      const firstRow = new ActionRowBuilder().addComponents(input);
      modal.addComponents(firstRow);
      await interaction.showModal(modal);
      return;
    }
    if (interaction.isModalSubmit() && interaction.customId === "captcha_modal") {
      const answer = interaction.fields.getTextInputValue("captcha_input").trim().toUpperCase();
      const key = `${interaction.guild.id}:${interaction.user.id}`;
      const expected = captchaMap.get(key);
      if (!expected) {
        await interaction.reply({ content: "No active CAPTCHA. Click the verify button first.", ephemeral: true });
        return;
      }
      if (answer === expected) {
        const cfgObj = getConfig(interaction.guild.id);
        const cfg = cfgObj.data;
        await ensureRoles(interaction.guild);
        try {
          const member = await interaction.guild.members.fetch(interaction.user.id);
          if (cfg.unverifiedRole && member.roles.cache.has(cfg.unverifiedRole)) {
            await member.roles.remove(cfg.unverifiedRole);
          }
          if (cfg.verifiedRole) {
            await member.roles.add(cfg.verifiedRole);
          }
          if (cfg.logChannel) {
            const ch = interaction.guild.channels.cache.get(cfg.logChannel);
            ch?.send(`✅ **${interaction.user.tag}** verified.`);
          }
          captchaMap.delete(key);
          await interaction.reply({ content: "✅ Verification successful — you have been given the Verified role!", ephemeral: true });
        } catch (e) {
          await interaction.reply({ content: `❌ Error assigning role: ${e.message}`, ephemeral: true });
        }
      } else {
        await interaction.reply({ content: "❌ Wrong code. Please try again by clicking Verify.", ephemeral: true });
      }
    }
  } catch (err) {
    if (!interaction.replied && !interaction.deferred) {
      try { await interaction.reply({ content: "⚠️ An error occurred.", ephemeral: true }); } catch {}
    }
  }
});
client.login(process.env.TOKEN);
