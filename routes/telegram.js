import express from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// 텔레그램 봇 관련 함수들 - 직접 Chat ID 입력 방식
async function sendTelegramMessage(chatId, message) {
  if (!TELEGRAM_BOT_TOKEN) {
    console.log("TELEGRAM_BOT_TOKEN이 설정되지 않았습니다.");
    // 에러를 던져서 호출한 쪽에서 실패를 인지할 수 있도록 함
    throw new Error("TELEGRAM_BOT_TOKEN이 설정되지 않았습니다.");
  }

  try {
    const response = await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
      }
    );
    return response.data;
  } catch (error) {
    console.error(
      "텔레그램 메시지 전송 실패:",
      error.response?.data || error.message
    );
    // 여기서도 에러를 다시 던져서 호출 측에서 처리하도록 함
    throw error;
  }
}

// 텔레그램 Chat ID 저장 및 테스트 API
router.post("/save-chat-id", async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: "로그인이 필요합니다." });
  }

  const { chatId } = req.body;
  const userId = req.session.user.userid;

  if (!chatId || !/^-?\d+$/.test(chatId)) {
    return res
      .status(400)
      .json({ message: "유효한 숫자 형식의 Chat ID를 입력해주세요." });
  }

  try {
    // 1. 테스트 메시지 발송 시도
    await sendTelegramMessage(
      chatId,
      "✅ 이슈 트래커 텔레그램 연동 테스트 메시지입니다. 이 메시지를 받으셨다면 연동이 성공적으로 완료된 것입니다."
    );

    // 2. 테스트 성공 시 사용자 정보 업데이트
    const user = await req.usersCollection.findOneAndUpdate(
      { userid: userId },
      {
        $set: {
          telegramChatId: chatId,
          // telegramUsername은 더 이상 알 수 없으므로, chatId로 대체하거나 비워둠
          telegramUsername: `ID:${chatId}`,
          telegramAlertEnabled: true,
        },
      },
      { returnDocument: "after" }
    );

    if (!user) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }

    console.log(`사용자 ${userId} 텔레그램 연동 완료: Chat ID ${chatId}`);
    res.json({
      message:
        "텔레그램 연동이 성공적으로 완료되었습니다. 테스트 메시지를 확인해주세요.",
      isConnected: true,
      telegramUsername: user.telegramUsername,
    });
  } catch (error) {
    console.error(
      `Chat ID ${chatId}로 테스트 메시지 발송 실패:`,
      error.message
    );
    // 사용자에게 친절한 에러 메시지 제공
    if (error.response && error.response.status === 400) {
      return res
        .status(400)
        .json({
          message:
            "잘못된 Chat ID이거나 봇이 차단되었습니다. Chat ID를 확인하고 봇을 차단 해제한 후 다시 시도해주세요.",
        });
    }
    res
      .status(500)
      .json({
        message:
          "텔레그램 연동 중 서버 오류가 발생했습니다. Chat ID를 확인하고 다시 시도해주세요.",
      });
  }
});

// 텔레그램 연동 해제
router.post("/disconnect", async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: "로그인이 필요합니다." });
  }

  try {
    const result = await req.usersCollection.updateOne(
      { userid: req.session.user.userid },
      {
        $unset: {
          telegramChatId: 1,
          telegramUsername: 1,
          telegramAlertEnabled: 1,
          telegramTempToken: 1,
        },
      }
    );

    if (result.modifiedCount > 0) {
      res.json({ message: "텔레그램 연동이 해제되었습니다." });
    } else {
      res.status(404).json({ message: "연동 정보를 찾을 수 없습니다." });
    }
  } catch (error) {
    console.error("텔레그램 연동 해제 오류:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

// 텔레그램 연동 상태 확인
router.get("/status", async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: "로그인이 필요합니다." });
  }

  try {
    const user = await req.usersCollection.findOne({
      userid: req.session.user.userid,
    });
    const isConnected = !!(user?.telegramChatId && user?.telegramAlertEnabled);

    res.json({
      isConnected,
      telegramUsername: user?.telegramUsername || null,
    });
  } catch (error) {
    console.error("텔레그램 연동 상태 확인 오류:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

// sendTelegramMessage 함수를 외부에서 사용할 수 있도록 export
export { sendTelegramMessage };
export default router;