const { createCanvas } = require("canvas");
function randomText(length = 6) {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < length; i++) s += chars.charAt(Math.floor(Math.random() * chars.length));
  return s;
}
async function generateImage(code) {
  const width = 300;
  const height = 120;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#f0f0f0";
  ctx.fillRect(0, 0, width, height);
  for (let i = 0; i < 6; i++) {
    ctx.strokeStyle = `rgba(0,0,0,${Math.random() * 0.2 + 0.05})`;
    ctx.beginPath();
    ctx.moveTo(Math.random() * width, Math.random() * height);
    ctx.lineTo(Math.random() * width, Math.random() * height);
    ctx.stroke();
  }
  const fontSize = 48;
  ctx.font = `${fontSize}px Sans`;
  const startX = 30;
  for (let i = 0; i < code.length; i++) {
    const ch = code[i];
    const x = startX + i * (fontSize - 6) + (Math.random() * 6 - 3);
    const y = height / 2 + (Math.random() * 10 - 5);
    ctx.save();
    const angle = (Math.random() * 0.4 - 0.2);
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = `rgb(${20 + Math.random() * 80}, ${20 + Math.random() * 80}, ${20 + Math.random() * 80})`;
    ctx.fillText(ch, 0, 0);
    ctx.restore();
  }
  for (let i = 0; i < 80; i++) {
    ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.15})`;
    ctx.beginPath();
    ctx.arc(Math.random() * width, Math.random() * height, Math.random() * 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
  return canvas.toBuffer();
}
async function createCaptcha() {
  const code = randomText(6);
  const buffer = await generateImage(code);
  return { code, buffer };
}
module.exports = { createCaptcha };
