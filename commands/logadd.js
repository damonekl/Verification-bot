const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("logadd")
        .setDescription("Vybere logovací kanál. (Pouze majitel serveru)"),

    async execute(interaction) {
        if (interaction.user.id !== interaction.guild.ownerId) {
            return interaction.reply({ content: "❌ Tento příkaz může používat jen majitel serveru!", ephemeral: true });
        }

        const logChannels = interaction.client.logChannels;
        logChannels.set(interaction.guild.id, interaction.channel.id);

        interaction.reply({ content: "📘 Tento kanál je nyní nastaven jako logovací.", ephemeral: true });
    }
};
