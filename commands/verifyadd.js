const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName("verifyadd")
        .setDescription("Přidá verifikační zprávu. (Pouze majitel serveru)"),

    async execute(interaction) {
        if (interaction.user.id !== interaction.guild.ownerId) {
            return interaction.reply({ content: "❌ Tento příkaz může používat jen **majitel serveru**!", ephemeral: true });
        }

        const button = new ButtonBuilder()
            .setCustomId("verify_start")
            .setLabel("Začít ověření")
            .setStyle(ButtonStyle.Success);

        const row = new ActionRowBuilder().addComponents(button);

        const embed = new EmbedBuilder()
            .setTitle("🔐 Ověření uživatele")
            .setDescription("Klikni na tlačítko a splň CAPTCHA.")
            .setColor("Green");

        await interaction.channel.send({ embeds: [embed], components: [row] });

        return interaction.reply({ content: "✔ Ověřovací zpráva byla přidána.", ephemeral: true });
    }
};
