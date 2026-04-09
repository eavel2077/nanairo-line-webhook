const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const line = require("@line/bot-sdk");

admin.initializeApp();
const db = admin.firestore();

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

const CONTACT_URL = "https://contact.harenokunioffice.com/";
const URLS = {
  official: "https://www.harenokunioffice.com/",
  inquiry: "https://contact.harenokunioffice.com/",
  garageOkayama: "https://www.harenokunioffice.com/pref-garage-lp/",
  carStandard: "https://www.harenokunioffice.com/standard-car/",
  carLight: "https://www.harenokunioffice.com/light-automobile/",
  bike: "https://www.harenokunioffice.com/bike/",
  outsidePref: "https://www.harenokunioffice.com/outofpref-garage-lp/",
  seal: "https://www.harenokunioffice.com/issuance-of-seal/",
};

exports.lineWebhook = onRequest({ region: "asia-northeast1" }, (req, res) => {
  line.middleware(config)(req, res, async () => {
    try {
      const events = req.body.events || [];
      await Promise.all(events.map(handleEvent));
      res.status(200).json({ ok: true });
    } catch (error) {
      logger.error("Webhook error:", error);
      res.status(500).send("Error");
    }
  });
});

async function handleEvent(event) {
  if (!event.source || !event.source.userId) return null;

  const userId = event.source.userId;
  const stateRef = db.collection("lineFlowState").doc(userId);

  if (event.type === "follow") {
    await resetState(userId);
    return replyMessages(event.replyToken, [
      textMessage(
        "なないろ行政書士法人です。ご相談内容を選んでください。",
        mainMenuQuickReply()
      ),
    ]);
  }

  if (event.type !== "message" || event.message.type !== "text") {
    return null;
  }

  const text = event.message.text.trim();
  const stateSnap = await stateRef.get();
  const state = stateSnap.exists ? stateSnap.data() : { step: "main" };

  if (
    ["開始", "はじめる", "メニュー", "最初に戻る", "戻る", "トップ"].includes(text)
  ) {
    await resetState(userId);
    return replyMessages(event.replyToken, [
      textMessage(
        "ご相談内容を選んでください。",
        mainMenuQuickReply()
      ),
    ]);
  }

  if (text === "公式サイト") {
    await resetState(userId);
    return replyMessages(event.replyToken, [
      textMessage(
        `公式サイトはこちらです。\n${URLS.official}\n\n続けてご相談内容を選ぶ場合は、下のメニューからお進みください。`,
        mainMenuQuickReply()
      ),
    ]);
  }

  if (text === "お問い合わせ") {
    await resetState(userId);
    return replyMessages(event.replyToken, [
      textMessage(
        `お問い合わせフォームはこちらです。\n${URLS.inquiry}\n\nLINEで続けて案内を受ける場合は、下のメニューから選んでください。`,
        mainMenuQuickReply()
      ),
    ]);
  }

  if (MAIN_MENU[text]) {
    const next = MAIN_MENU[text];
    await stateRef.set({
      step: next.step,
      category: text,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return replyMessages(event.replyToken, [
      textMessage(next.message, next.quickReply()),
    ]);
  }

  if (state.step === "garageType" && GARAGE_TYPE[text]) {
    return handleGarageType(text, stateRef, event.replyToken);
  }

  if (state.step === "carType" && CAR_TYPE[text]) {
    return handleCarType(text, stateRef, event.replyToken);
  }

  if (state.step === "lightType" && LIGHT_TYPE[text]) {
    return handleLightType(text, stateRef, event.replyToken);
  }

  if (state.step === "bikeType" && BIKE_TYPE[text]) {
    return handleBikeType(text, stateRef, event.replyToken);
  }

  if (state.step === "outsidePrefType" && OUTSIDE_PREF_TYPE[text]) {
    return handleOutsidePrefType(text, stateRef, event.replyToken);
  }

  if (state.step === "sealType" && SEAL_TYPE[text]) {
    return handleSealType(text, stateRef, event.replyToken);
  }

  if (state.step === "freeQuestion") {
    await stateRef.set(
      {
        step: "waitingStaff",
        freeQuestion: text,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return replyMessages(event.replyToken, [
      textMessage(
        `ご相談内容を受け付けました。\n\n【入力内容】\n${text}\n\n担当者が確認しやすいよう、詳細なご相談はお問い合わせフォームからも送信できます。\n${CONTACT_URL}`,
        finalQuickReply()
      ),
    ]);
  }

  return replyMessages(event.replyToken, [
    textMessage(
      "うまく読み取れませんでした。下のメニューから選んでください。",
      mainMenuQuickReply()
    ),
  ]);
}

/* =========================
   分岐定義
========================= */

const MAIN_MENU = {
  "岡山県内車庫証明": {
    step: "garageType",
    message: "岡山県内車庫証明ですね。次に内容を選んでください。",
    quickReply: garageQuickReply,
  },
  "普通自動車登録": {
    step: "carType",
    message: "普通自動車の手続きですね。内容を選んでください。",
    quickReply: carQuickReply,
  },
  "軽自動車登録": {
    step: "lightType",
    message: "軽自動車の手続きですね。内容を選んでください。",
    quickReply: lightQuickReply,
  },
  "二輪車登録": {
    step: "bikeType",
    message: "二輪車（バイク）の手続きですね。内容を選んでください。",
    quickReply: bikeQuickReply,
  },
  "県外の車庫証明と登録": {
    step: "outsidePrefType",
    message: "県外の車庫証明・登録ですね。内容を選んでください。",
    quickReply: outsidePrefQuickReply,
  },
  "出張封印": {
    step: "sealType",
    message: "出張封印ですね。内容を選んでください。",
    quickReply: sealQuickReply,
  },
  "その他お問い合わせ": {
    step: "freeQuestion",
    message: "ご相談内容を自由に入力してください。",
    quickReply: freeQuestionQuickReply,
  },
};

const GARAGE_TYPE = {
  "車庫証明を依頼したい": true,
  "必要書類を知りたい": true,
  "料金を知りたい": true,
};

const CAR_TYPE = {
  "新規登録": true,
  "中古新規登録": true,
  "移転登録": true,
  "変更登録": true,
  "抹消登録": true,
  "必要書類を知りたい": true,
};

const LIGHT_TYPE = {
  "新規登録": true,
  "中古新規登録": true,
  "移転登録": true,
  "変更登録": true,
  "抹消登録": true,
  "必要書類を知りたい": true,
};

const BIKE_TYPE = {
  "新規登録": true,
  "中古新規登録": true,
  "移転登録": true,
  "変更登録": true,
  "抹消登録": true,
  "必要書類を知りたい": true,
};

const OUTSIDE_PREF_TYPE = {
  "県外の車庫証明": true,
  "県外の自動車登録": true,
  "車庫証明＋登録セット": true,
  "料金を知りたい": true,
};

const SEAL_TYPE = {
  "出張封印を依頼したい": true,
  "対応地域を知りたい": true,
  "受けられないケースを知りたい": true,
};

/* =========================
   各処理
========================= */

async function handleGarageType(text, stateRef, replyToken) {
  await stateRef.set(
    {
      step: "done",
      subCategory: text,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  if (text === "車庫証明を依頼したい") {
    return replyMessages(replyToken, [
      textMessage(
        `岡山県内の車庫証明はこちらからご確認ください。\n${URLS.garageOkayama}\n\n必要書類や地域別の料金確認のあと、お問い合わせフォームからご依頼いただけます。`,
        finalQuickReply()
      ),
    ]);
  }

  if (text === "必要書類を知りたい") {
    return replyMessages(replyToken, [
      textMessage(
        `岡山県内車庫証明の案内ページです。\n${URLS.garageOkayama}\n\nページ内で対応エリア・料金・申込導線をご確認ください。`,
        finalQuickReply()
      ),
    ]);
  }

  return replyMessages(replyToken, [
    textMessage(
      `岡山県内車庫証明の料金・対応エリアはこちらです。\n${URLS.garageOkayama}`,
      finalQuickReply()
    ),
  ]);
}

async function handleCarType(text, stateRef, replyToken) {
  await stateRef.set(
    {
      step: "done",
      subCategory: text,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  if (text === "必要書類を知りたい") {
    return replyMessages(replyToken, [
      textMessage(
        `普通自動車の名義変更・登録ページはこちらです。\n${URLS.carStandard}\n\n主な必要書類\n・車検証\n・譲渡証明書\n・旧所有者の印鑑証明書\n・旧所有者の委任状\n・新所有者の印鑑証明書\n・新所有者の委任状\n・保管場所証明書（車庫証明）\n・返送用封筒\n・ナンバープレート（変更時）`,
        finalQuickReply()
      ),
    ]);
  }

  return replyMessages(replyToken, [
    textMessage(
      `普通自動車の「${text}」ですね。\n詳しい案内ページはこちらです。\n${URLS.carStandard}\n\n内容確認後、お問い合わせフォームからご連絡ください。`,
      finalQuickReply()
    ),
  ]);
}

async function handleLightType(text, stateRef, replyToken) {
  await stateRef.set(
    {
      step: "done",
      subCategory: text,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  if (text === "必要書類を知りたい") {
    return replyMessages(replyToken, [
      textMessage(
        `軽自動車の名義変更・登録ページはこちらです。\n${URLS.carLight}\n\n主な必要書類\n・車検証\n・旧所有者の申請依頼書\n・新所有者の申請依頼書\n・新所有者の住民票\n・返送用封筒\n・ナンバープレート（変更時）`,
        finalQuickReply()
      ),
    ]);
  }

  return replyMessages(replyToken, [
    textMessage(
      `軽自動車の「${text}」ですね。\n詳しい案内ページはこちらです。\n${URLS.carLight}`,
      finalQuickReply()
    ),
  ]);
}

async function handleBikeType(text, stateRef, replyToken) {
  await stateRef.set(
    {
      step: "done",
      subCategory: text,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  if (text === "必要書類を知りたい") {
    return replyMessages(replyToken, [
      textMessage(
        `二輪車（バイク）の登録・名義変更ページはこちらです。\n${URLS.bike}\n\n詳細確認後、お問い合わせフォームからご相談ください。`,
        finalQuickReply()
      ),
    ]);
  }

  return replyMessages(replyToken, [
    textMessage(
      `二輪車（バイク）の「${text}」ですね。\n詳しい案内ページはこちらです。\n${URLS.bike}`,
      finalQuickReply()
    ),
  ]);
}

async function handleOutsidePrefType(text, stateRef, replyToken) {
  await stateRef.set(
    {
      step: "done",
      subCategory: text,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  if (text === "料金を知りたい") {
    return replyMessages(replyToken, [
      textMessage(
        `県外の車庫証明・登録の料金ページはこちらです。\n${URLS.outsidePref}\n\n目安\n・県外の車庫証明取得代行 16,500円（税込）\n・県外の自動車登録代行 16,500円（税込）\n・車庫証明＋登録セット 30,000円（税込）`,
        finalQuickReply()
      ),
    ]);
  }

  return replyMessages(replyToken, [
    textMessage(
      `県外手続きの「${text}」ですね。\n詳しい案内ページはこちらです。\n${URLS.outsidePref}`,
      finalQuickReply()
    ),
  ]);
}

async function handleSealType(text, stateRef, replyToken) {
  await stateRef.set(
    {
      step: "done",
      subCategory: text,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  if (text === "対応地域を知りたい") {
    return replyMessages(replyToken, [
      textMessage(
        `出張封印の案内ページはこちらです。\n${URLS.seal}\n\n岡山県全域に対応し、県外封印も全国ネットワークで調整可能です。`,
        finalQuickReply()
      ),
    ]);
  }

  if (text === "受けられないケースを知りたい") {
    return replyMessages(replyToken, [
      textMessage(
        `出張封印ページはこちらです。\n${URLS.seal}\n\n主な対応不可例\n・車台番号が確認できない車両\n・ネジの錆や特殊形状で取り外し困難な場合\n・不正改造車など`,
        finalQuickReply()
      ),
    ]);
  }

  return replyMessages(replyToken, [
    textMessage(
      `出張封印のご相談ですね。\n詳しい案内ページはこちらです。\n${URLS.seal}\n\n必要ならお問い合わせフォームから送信してください。`,
      finalQuickReply()
    ),
  ]);
}

/* =========================
   共通
========================= */

async function resetState(userId) {
  await db.collection("lineFlowState").doc(userId).set({
    step: "main",
    category: null,
    subCategory: null,
    freeQuestion: null,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

function textMessage(text, quickReply = null) {
  const message = {
    type: "text",
    text,
  };
  if (quickReply) {
    message.quickReply = quickReply;
  }
  return message;
}

async function replyMessages(replyToken, messages) {
  return client.replyMessage({
    replyToken,
    messages,
  });
}

function qr(items) {
  return {
    items: items.map((label) => ({
      type: "action",
      action: {
        type: "message",
        label,
        text: label,
      },
    })),
  };
}

function mainMenuQuickReply() {
  return qr([
    "岡山県内車庫証明",
    "普通自動車登録",
    "軽自動車登録",
    "二輪車登録",
    "県外の車庫証明と登録",
    "出張封印",
    "その他お問い合わせ",
  ]);
}

function garageQuickReply() {
  return qr([
    "車庫証明を依頼したい",
    "必要書類を知りたい",
    "料金を知りたい",
    "お問い合わせ",
    "最初に戻る",
  ]);
}

function carQuickReply() {
  return qr([
    "新規登録",
    "中古新規登録",
    "移転登録",
    "変更登録",
    "抹消登録",
    "必要書類を知りたい",
    "最初に戻る",
  ]);
}

function lightQuickReply() {
  return qr([
    "新規登録",
    "中古新規登録",
    "移転登録",
    "変更登録",
    "抹消登録",
    "必要書類を知りたい",
    "最初に戻る",
  ]);
}

function bikeQuickReply() {
  return qr([
    "新規登録",
    "中古新規登録",
    "移転登録",
    "変更登録",
    "抹消登録",
    "必要書類を知りたい",
    "最初に戻る",
  ]);
}

function outsidePrefQuickReply() {
  return qr([
    "県外の車庫証明",
    "県外の自動車登録",
    "車庫証明＋登録セット",
    "料金を知りたい",
    "最初に戻る",
  ]);
}

function sealQuickReply() {
  return qr([
    "出張封印を依頼したい",
    "対応地域を知りたい",
    "受けられないケースを知りたい",
    "最初に戻る",
  ]);
}

function freeQuestionQuickReply() {
  return qr([
    "最初に戻る",
    "お問い合わせ",
  ]);
}

function finalQuickReply() {
  return qr([
    "お問い合わせ",
    "公式サイト",
    "最初に戻る",
  ]);
}