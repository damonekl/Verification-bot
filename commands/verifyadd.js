const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const fs = require("fs");
const path = require("path");
module.exports = {
  data: new SlashCommandBuilder()
    .setName("verifyadd")
    .setDescription("Post the verification message to the chosen channel (owner only)")
    .addChannelOption(opt => opt.setName("channel").setDescription("Channel to post verification message into").setRequired(true)),
  async execute(interaction, client, getConfig) {
    if (interaction.user.id !== interaction.guild.ownerId) {
      return interaction.reply({ content: "❌ Only the server owner can use this command.", ephemeral: true });
    }
    const channel = interaction.options.getChannel("channel");
    if (!channel || !channel.isTextBased()) return interaction.reply({ content: "Invalid channel.", ephemeral: true });
    const cfgObj = getConfig(interaction.guild.id);
    const cfg = cfgObj.data;
    const guild = interaction.guild;
    if (!cfg.verifiedRole || !guild.roles.cache.has(cfg.verifiedRole)) {
      const r = await guild.roles.create({ name: "Verified", color: "Green", reason: "Auto-create Verified" });
      cfg.verifiedRole = r.id;
    }
    if (!cfg.unverifiedRole || !guild.roles.cache.has(cfg.unverifiedRole)) {
      const r = await guild.roles.create({ name: "Unverified", color: "Red", reason: "Auto-create Unverified" });
      cfg.unverifiedRole = r.id;
    }
    guild.channels.cache.forEach(ch => {
      if (!ch || !ch.isTextBased() || ch.type !== 0) return;
      try {
        ch.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: false });
        ch.permissionOverwrites.edit(cfg.verifiedRole, { SendMessages: true });
      } catch (e) {}
    });
    const embed = new EmbedBuilder().setTitle("🔐 Server verification").setDescription("Click **Verify** and complete the CAPTCHA to get access to chat.").setColor("Blue");
    const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("verify_start").setLabel("Verify").setStyle(ButtonStyle.Success));
    await channel.send({ embeds: [embed], components: [row] });
    cfg.verifyChannel = channel.id;
    fs.writeFileSync(cfgObj.path, JSON.stringify(cfg, null, 2));
    await interaction.reply({ content: "✅ Verification message posted and channels locked.", ephemeral: true });
  }
};
