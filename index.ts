import * as https from "https";
import tg from "node-telegram-bot-api";
import * as fs from "fs";

interface Settings {
  token: string;
  max_count: number;
}
const settings: Settings = JSON.parse(fs.readFileSync("./settings.json", "utf-8")) as any;
const TOKEN = settings["token"];
console.log(TOKEN);
const MAX_COUNT = settings.max_count;

async function doRequest(method: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https
      .request(`https://api.telegram.org/bot${TOKEN}/${method}`, (res: any) => {
        res.on("data", (chunk: any) => {
          resolve(`${chunk}`);
        });
        res.on("end", () => {});
      })
      .end();
  });
}

interface Status {
  questionCount: number;
  rightCount: number;
  rightAnswer: string;
}

const state = new Map<number, Status>();

function rand(max: number) {
  return Math.floor(Math.random() * (max + 1));
}

const bot = new tg(TOKEN, { polling: true });

const removeKeyboard = { reply_markup: { remove_keyboard: true } };
function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  let thisState = state.get(chatId);
  if (thisState) {
    if (msg.text === thisState.rightAnswer) {
      thisState.rightCount++;
      bot.sendMessage(chatId, "Good");
    } else bot.sendMessage(chatId, "Bad");
    await sleep(1000);
    if (thisState.questionCount >= MAX_COUNT) {
      bot.sendMessage(chatId, "That's enough. Type something to try again.", removeKeyboard);
      state.delete(chatId);
      return;
    }
  } else {
    thisState = { questionCount: 0, rightAnswer: "", rightCount: 0 };
    state.set(chatId, thisState);
  }
  thisState.questionCount++;
  const n1 = rand(8) + 1;
  const n2 = rand(8) + 1;
  thisState.rightAnswer = `${n1 * n2}`;
  const rightAnswerN = rand(2);
  var options: any = {
    reply_markup: JSON.stringify({
      keyboard: [0, 1, 2].map((idx) => {
        return [idx === rightAnswerN ? { text: thisState?.rightAnswer } : { text: `${rand(81) + 1}` }];
      }),
    }),
  };

  bot.sendMessage(chatId, `${n1} * ${n2}`, options);
});

bot.setMyCommands([{ command: "/start", description: "Test yourself" }]);

async function main() {
  const resp = await doRequest("getMe");
}
