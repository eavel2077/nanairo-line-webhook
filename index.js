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

  // 「LINEで問い合わせ」を押したときは、通常チャットに移行
  if (text === "LINEで問い合わせ") {
    return reply(event.replyToken, [
      textMessage(
        "担当者へのお問い合わせを受け付けました。\nこのまま内容をメッセージでお送りください。\n※担当者が確認して順番に返信するため、返信までお時間をいただく場合があります。"
      ),
    ]);
  }

  // それ以外の文字が送られたら、2つのボタンを表示
  return reply(event.replyToken, [contactMenuFlexMessage()]);
}

function textMessage(text) {
  return {
    type: "text",
    text,
  };
}

function contactMenuFlexMessage() {
  return {
    type: "flex",
    altText: "お問い合わせ方法を選択してください",
    contents: {
      type: "bubble",
      size: "mega",
      body: {
        type: "box",
        layout: "vertical",
        spacing: "lg",
        contents: [
          {
            type: "text",
            text: "お問い合わせ方法をお選びください",
            weight: "bold",
            size: "xl",
            wrap: true,
          },
          {
            type: "text",
            text: "ご希望の方法をタップしてください。",
            size: "sm",
            color: "#666666",
            wrap: true,
          },
          {
            type: "box",
            layout: "horizontal",
            spacing: "md",
            margin: "lg",
            contents: [
              {
                type: "button",
                style: "primary",
                color: "#06c755",
                flex: 1,
                height: "md",
                action: {
                  type: "message",
                  label: "LINEで問い合わせ",
                  text: "LINEで問い合わせ",
                },
              },
              {
                type: "button",
                style: "primary",
                color: "#4d96ff",
                flex: 1,
                height: "md",
                action: {
                  type: "uri",
                  label: "公式サイトで問い合わせ",
                  uri: "https://contact.harenokunioffice.com/",
                },
              },
            ],
          },
          {
            type: "text",
            text: "LINEで問い合わせ：担当者が返信するため、返信が遅くなる可能性があります。",
            size: "xs",
            color: "#666666",
            wrap: true,
            margin: "lg",
          },
          {
            type: "text",
            text: "公式サイトで問い合わせ：24時間365日お問い合わせ可能です。",
            size: "xs",
            color: "#666666",
            wrap: true,
            margin: "sm",
          },
        ],
      },
    },
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
