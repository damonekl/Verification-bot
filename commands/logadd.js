const { SlashCommandBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");
module.exports = {
  data: new SlashCommandBuilder()
    .setName("logadd")
    .setDescription("Set this channel as the log channel (owner only)"),
  async execute(interaction, client, getConfig) {
    if (interaction.user.id !== interaction.guild.ownerId) {
      return interaction.reply({ content: "❌ Only the server owner can use this command.", ephemeral: true });
    }
    const cfgObj = getConfig(interaction.guild.id);
    cfgObj.data.logChannel = interaction.channel.id;
    fs.writeFileSync(cfgObj.path, JSON.stringify(cfgObj.data, null, 2));
    await interaction.reply({ content: `📘 This channel has been set for logs.`, ephemeral: true });
  }
};
