const express = require("express");
const line = require("@line/bot-sdk");

const app = express();

const config = {
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const client = line.messagingApi
  ? new line.messagingApi.MessagingApiClient({
      channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
    })
  : line.LineBotClient.fromChannelAccessToken({
      channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
    });

app.post("/webhook", line.middleware(config), async (req, res) => {
  try {
    const events = req.body.events || [];
    await Promise.all(events.map(handleEvent));
    res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).send("Error");
  }
});

app.get("/", (req, res) => {
  res.status(200).send("LINE webhook server is running.");
});

async function handleEvent(event) {
  if (event.type !== "message" || event.message.type !== "text") {
    return null;
  }

  const text = event.message.text.trim();

  if (["開始", "はじめる", "メニュー", "最初に戻る", "戻る", "トップ"].includes(text)) {
    return reply(event.replyToken, [
      textMessage(
        "ご相談内容を選んでください。",
        quickReply([
          "岡山県内車庫証明",
          "普通自動車登録",
          "軽自動車登録",
          "二輪車登録",
          "県外の車庫証明と登録",
          "出張封印",
          "その他お問い合わせ"
        ])
      )
    ]);
  }

  if (text === "岡山県内車庫証明") {
    return reply(event.replyToken, [
      textMessage(
        "岡山県内車庫証明ですね。内容を選んでください。",
        quickReply(["車庫証明を依頼したい", "必要書類を知りたい", "料金を知りたい", "お問い合わせ", "最初に戻る"])
      )
    ]);
  }

  if (text === "普通自動車登録") {
    return reply(event.replyToken, [
      textMessage(
        "普通自動車の手続きですね。内容を選んでください。",
        quickReply(["新規登録", "中古新規登録", "移転登録", "変更登録", "抹消登録", "必要書類を知りたい", "最初に戻る"])
      )
    ]);
  }

  if (text === "軽自動車登録") {
    return reply(event.replyToken, [
      textMessage(
        "軽自動車の手続きですね。内容を選んでください。",
        quickReply(["新規登録", "中古新規登録", "移転登録", "変更登録", "抹消登録", "必要書類を知りたい", "最初に戻る"])
      )
    ]);
  }

  if (text === "二輪車登録") {
    return reply(event.replyToken, [
      textMessage(
        "二輪車（バイク）の手続きですね。内容を選んでください。",
        quickReply(["新規登録", "中古新規登録", "移転登録", "変更登録", "抹消登録", "必要書類を知りたい", "最初に戻る"])
      )
    ]);
  }

  if (text === "県外の車庫証明と登録") {
    return reply(event.replyToken, [
      textMessage(
        "県外の車庫証明・登録ですね。内容を選んでください。",
        quickReply(["県外の車庫証明", "県外の自動車登録", "車庫証明＋登録セット", "料金を知りたい", "最初に戻る"])
      )
    ]);
  }

  if (text === "出張封印") {
    return reply(event.replyToken, [
      textMessage(
        "出張封印ですね。内容を選んでください。",
        quickReply(["出張封印を依頼したい", "対応地域を知りたい", "受けられないケースを知りたい", "最初に戻る"])
      )
    ]);
  }

  if (text === "その他お問い合わせ" || text === "お問い合わせ") {
    return reply(event.replyToken, [
      textMessage(
        "お問い合わせはこちらです。\nhttps://contact.harenokunioffice.com/",
        quickReply(["公式サイト", "最初に戻る"])
      )
    ]);
  }

  if (text === "車庫証明を依頼したい" || text === "必要書類を知りたい" || text === "料金を知りたい") {
    return reply(event.replyToken, [
      textMessage(
        "岡山県内車庫証明の案内はこちらです。\nhttps://www.harenokunioffice.com/pref-garage-lp/",
        quickReply(["お問い合わせ", "公式サイト", "最初に戻る"])
      )
    ]);
  }

  if (["新規登録", "中古新規登録", "移転登録", "変更登録", "抹消登録", "必要書類を知りたい"].includes(text)) {
    return reply(event.replyToken, [
      textMessage(
        "普通自動車はこちら\nhttps://www.harenokunioffice.com/standard-car/\n\n軽自動車はこちら\nhttps://www.harenokunioffice.com/light-automobile/\n\n二輪車はこちら\nhttps://www.harenokunioffice.com/bike/",
        quickReply(["お問い合わせ", "公式サイト", "最初に戻る"])
      )
    ]);
  }

  if (["県外の車庫証明", "県外の自動車登録", "車庫証明＋登録セット", "料金を知りたい"].includes(text)) {
    return reply(event.replyToken, [
      textMessage(
        "県外の車庫証明と登録はこちらです。\nhttps://www.harenokunioffice.com/outofpref-garage-lp/",
        quickReply(["お問い合わせ", "公式サイト", "最初に戻る"])
      )
    ]);
  }

  if (["出張封印を依頼したい", "対応地域を知りたい", "受けられないケースを知りたい"].includes(text)) {
    return reply(event.replyToken, [
      textMessage(
        "出張封印はこちらです。\nhttps://www.harenokunioffice.com/issuance-of-seal/",
        quickReply(["お問い合わせ", "公式サイト", "最初に戻る"])
      )
    ]);
  }

  if (text === "公式サイト") {
    return reply(event.replyToken, [
      textMessage(
        "公式サイトはこちらです。\nhttps://www.harenokunioffice.com/",
        quickReply(["最初に戻る"])
      )
    ]);
  }

  return reply(event.replyToken, [
    textMessage("「開始」と送るとメニューを表示します。")
  ]);
}

function textMessage(text, quickReplyObj = null) {
  const message = { type: "text", text };
  if (quickReplyObj) message.quickReply = quickReplyObj;
  return message;
}

function quickReply(labels) {
  return {
    items: labels.map((label) => ({
      type: "action",
      action: {
        type: "message",
        label,
        text: label,
      },
    })),
  };
}

async function reply(replyToken, messages) {
  return client.replyMessage({
    replyToken,
    messages,
  });
}

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
