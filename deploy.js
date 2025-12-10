
---

### deploy.js
```js
require("dotenv").config({ path: "./INFO.env" });
const fs = require("fs");
const path = require("path");
const { REST, Routes } = require("discord.js");
const commands = [];
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith(".js"));
for (const file of commandFiles) {
  const cmd = require(`./commands/${file}`);
  commands.push(cmd.data.toJSON());
}
const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);
(async () => {
  try {
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
    console.log("✔ Slash commands registered");
  } catch (err) {
    console.error(err);
  }
})();
