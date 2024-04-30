const { Client, IntentsBitField, Events } = require("discord.js");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
  ],
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });
const botInfo = {
  name: "Legemini Ai",
};

const generationConfig = {
  temperature: 0.7,
  topP: 1,
  topK: 50,
  maxOutputTokens: 2048,
};

client.once(Events.ClientReady, () => {
  console.log("csc");
});

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;
  if (message.channel.id !== process.env.DISCORD_CHANNEL_ID) return;
  if (message.content.startsWith("!")) return;

  let conversationLog = [];
  let prevRole = "model";

  try {
    await message.channel.sendTyping();
    let prevMessages = await message.channel.messages.fetch({ limit: 5 });
    prevMessages.reverse();

    prevMessages.forEach((msg) => {
      if (msg.content.startsWith("!") || msg.author.bot) return;

      if (msg.author.id === client.user.id && prevRole === "user") {
        prevRole = "model";
        conversationLog.push({ role: "model", parts: [{ text: msg.content }] });
      } else if (msg.author.id === message.author.id && prevRole === "model") {
        prevRole = "user";
        conversationLog.push({ role: "user", parts: [{ text: msg.content }] });

      }
    });

    const result = await model.generateContent({
      contents: conversationLog,
      generationConfig,
    });

    let finalText = result.response.text();

    if (finalText.length > 2000) {
      finalText = finalText.substring(0, 1997) + "...";
    }

    message.reply(finalText);
  } catch (error) {
    console.log(error);
    message.reply("Quelque chose s'est mal passé dans la procédure....");
  }
});

client.login(process.env.DISCORD_TOKEN);