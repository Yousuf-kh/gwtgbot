const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");

const TOKEN = "8986705612:AAH8od2VrBAOFwzulweQwuujAUgZOzQKkrI";
const YOUR_USER_ID = 925359952; // твой ID (@userinfobot)
const GROUPS_FILE = "groups.json";

// Загрузка сохранённых групп
function loadGroups() {
 if (fs.existsSync(GROUPS_FILE)) {
   return new Set(JSON.parse(fs.readFileSync(GROUPS_FILE)));
 }
 return new Set();
}

// Сохранение групп
function saveGroups(groups) {
 fs.writeFileSync(GROUPS_FILE, JSON.stringify([...groups]));
}

const groups = loadGroups();
const bot = new TelegramBot(TOKEN, { polling: true });

// Бот добавлен или удалён из группы
bot.on("my_chat_member", (msg) => {
 const chatId = msg.chat.id;
 const status = msg.new_chat_member.status;

 if (status === "member" || status === "administrator") {
   groups.add(chatId);
   saveGroups(groups);
   console.log(`✅ Добавлен в группу: ${chatId}`);
 } else if (status === "left" || status === "kicked") {
   groups.delete(chatId);
   saveGroups(groups);
   console.log(`❌ Удалён из группы: ${chatId}`);
 }
});

// Рассылка сообщения
bot.on("message", async (msg) => {
 // Игнорируем сообщения из групп
 if (msg.chat.type !== "private") return;

 // Проверяем что это ты
 if (msg.from.id !== YOUR_USER_ID) {
   bot.sendMessage(msg.chat.id, "❌ У тебя нет доступа.");
   return;
 }

 const text = msg.text;
 let success = 0;

 for (const chatId of groups) {
   try {
     await bot.sendMessage(chatId, text);
     success++;
   } catch (e) {
     console.log(`Ошибка ${chatId}: ${e.message}`);
   }
 }

 bot.sendMessage(msg.chat.id, `✅ Отправлено в ${success}/${groups.size} групп`);
});

console.log("🤖 Бот запущен...");