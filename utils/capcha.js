const Jimp = require("jimp");

async function generateCaptcha() {
    const text = Math.random().toString(36).substring(2, 7).toUpperCase();

    const image = new Jimp(300, 100, "#2f3136");
    const font = await Jimp.loadFont(Jimp.FONT_SANS_64_WHITE);

    image.print(font, 50, 20, text);
    const buffer = await image.getBufferAsync(Jimp.MIME_PNG);

    return { text, buffer };
}

module.exports = { generateCaptcha };
