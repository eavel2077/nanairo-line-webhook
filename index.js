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
      mainMenuFlexMessage()
    ]);
  }

  if (text === "岡山県内車庫証明") {
    return reply(event.replyToken, [
      subMenuFlexMessage(
        "岡山県内車庫証明",
        "内容を選んでください。",
        [
          "車庫証明を依頼したい",
          "必要書類を知りたい",
          "料金を知りたい",
          "お問い合わせ",
          "最初に戻る"
        ]
      )
    ]);
  }

  if (text === "普通自動車登録") {
    return reply(event.replyToken, [
      subMenuFlexMessage(
        "普通自動車登録",
        "内容を選んでください。",
        [
          "新規登録",
          "中古新規登録",
          "移転登録",
          "変更登録",
          "抹消登録",
          "必要書類を知りたい",
          "最初に戻る"
        ]
      )
    ]);
  }

  if (text === "軽自動車登録") {
    return reply(event.replyToken, [
      subMenuFlexMessage(
        "軽自動車登録",
        "内容を選んでください。",
        [
          "新規登録",
          "中古新規登録",
          "移転登録",
          "変更登録",
          "抹消登録",
          "必要書類を知りたい",
          "最初に戻る"
        ]
      )
    ]);
  }

  if (text === "二輪車登録") {
    return reply(event.replyToken, [
      subMenuFlexMessage(
        "二輪車登録",
        "内容を選んでください。",
        [
          "新規登録",
          "中古新規登録",
          "移転登録",
          "変更登録",
          "抹消登録",
          "必要書類を知りたい",
          "最初に戻る"
        ]
      )
    ]);
  }

  if (text === "県外の車庫証明と登録") {
    return reply(event.replyToken, [
      subMenuFlexMessage(
        "県外の車庫証明と登録",
        "内容を選んでください。",
        [
          "県外の車庫証明",
          "県外の自動車登録",
          "車庫証明＋登録セット",
          "料金を知りたい",
          "最初に戻る"
        ]
      )
    ]);
  }

  if (text === "出張封印") {
    return reply(event.replyToken, [
      subMenuFlexMessage(
        "出張封印",
        "内容を選んでください。",
        [
          "出張封印を依頼したい",
          "対応地域を知りたい",
          "受けられないケースを知りたい",
          "最初に戻る"
        ]
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

function mainMenuFlexMessage() {
  const items = [
    { label: "岡山県内車庫証明", color: "#ff6b6b" },
    { label: "普通自動車登録", color: "#f7b801" },
    { label: "軽自動車登録", color: "#6bcB77" },
    { label: "二輪車登録", color: "#4d96ff" },
    { label: "県外の車庫証明と登録", color: "#845ef7" },
    { label: "出張封印", color: "#ff4fa3" },
    { label: "その他お問い合わせ", color: "#00b894" }
  ];

  return {
    type: "flex",
    altText: "ご相談内容メニュー",
    contents: {
      type: "bubble",
      size: "mega",
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        contents: [
          {
            type: "text",
            text: "ご相談内容を選んでください",
            weight: "bold",
            size: "xl",
            wrap: true
          },
          {
            type: "text",
            text: "見やすい大きめボタンから選択できます。",
            size: "sm",
            color: "#666666",
            wrap: true,
            margin: "md"
          },
          ...items.map((item) => largeButton(item.label, item.color))
        ]
      }
    }
  };
}

function subMenuFlexMessage(title, description, labels) {
  const rainbowColors = [
    "#ff6b6b",
    "#f7b801",
    "#6bcB77",
    "#4d96ff",
    "#845ef7",
    "#ff4fa3",
    "#00b894"
  ];

  return {
    type: "flex",
    altText: `${title}メニュー`,
    contents: {
      type: "bubble",
      size: "mega",
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        contents: [
          {
            type: "text",
            text: title,
            weight: "bold",
            size: "xl",
            wrap: true
          },
          {
            type: "text",
            text: description,
            size: "sm",
            color: "#666666",
            wrap: true,
            margin: "md"
          },
          ...labels.map((label, index) =>
            largeButton(label, rainbowColors[index % rainbowColors.length])
          )
        ]
      }
    }
  };
}

function largeButton(label, color) {
  return {
    type: "button",
    style: "primary",
    color,
    height: "md",
    margin: "sm",
    action: {
      type: "message",
      label,
      text: label
    }
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
