import express from "express";
import { ObjectId } from "mongodb";

const router = express.Router();

// 기본 알림 설정
const DEFAULT_SETTINGS = {
  newIssueAssigned: true,
  mentions: true,
  issueStatusChanged: true,
  issueCommented: true,
  messengerNotifications: false,
  messengerType: null,
  messengerIntegrated: false,
};

// 데이터베이스 컬렉션과 텔레그램 메시지 전송 함수를 받기 위한 함수
export function createNotificationsRoutes(
  notificationsCollection, 
  usersCollection, 
  sendTelegramMessage
) {

  // 알림 생성 함수
  async function createNotification(
    userId,
    type,
    message,
    issueId,
    issueKey,
    isMigration = false
  ) {
    if (!userId) return;
    // 마이그레이션 모드에서는 알림을 생성하지 않음
    if (isMigration) return;

    try {
      // 사용자의 알림 설정 확인
      const user = await usersCollection.findOne({ userid: userId });
      if (!user) return;

      const settings = user.notificationSettings || DEFAULT_SETTINGS;

      // 알림 타입에 따라 설정 확인
      let shouldSendNotification = false;
      switch (type) {
        case "new-issue":
          shouldSendNotification = settings.newIssueAssigned;
          break;
        case "mention":
          shouldSendNotification = settings.mentions;
          break;
        case "status-change":
          shouldSendNotification = settings.issueStatusChanged;
          break;
        case "comment":
          shouldSendNotification = settings.issueCommented;
          break;
        default:
          shouldSendNotification = true; // 기본적으로 모든 알림 허용
      }

      if (!shouldSendNotification) return;

      // 일반 알림 저장
      await notificationsCollection.insertOne({
        userId,
        type,
        message,
        issueId: issueId.toString(),
        issueKey,
        read: false,
        createdAt: new Date().toISOString(),
      });

      // 텔레그램 알림 전송 (메신저 알림이 활성화된 경우)
      if (
        settings.messengerNotifications &&
        settings.messengerType === "telegram" &&
        user.telegramChatId &&
        user.telegramAlertEnabled
      ) {
        try {
          const telegramMessage = `🔔 <b>이슈 트래커 알림</b>\n\n${message}\n\n이슈: ${issueKey}`;
          await sendTelegramMessage(user.telegramChatId, telegramMessage);
        } catch (error) {
          console.error("텔레그램 메시지 전송 실패:", error);
        }
      }
    } catch (error) {
      console.error("알림 생성 오류:", error);
    }
  }

  // 알림 목록 조회
  router.get("/notifications", async (req, res) => {
    if (!req.session.user) {
      return res.status(401).json({ message: "로그인이 필요합니다." });
    }
    const notifications = await notificationsCollection
      .find({ userId: req.session.user.userid })
      .sort({ createdAt: -1 })
      .toArray();
    res.json(
      notifications.map((n) => ({
        id: n._id.toString(),
        ...n,
      }))
    );
  });

  // 알림을 읽음으로 표시
  router.post("/notifications/:id/read", async (req, res) => {
    const { id } = req.params;
    if (!req.session.user) {
      return res.status(401).json({ message: "로그인이 필요합니다." });
    }
    const result = await notificationsCollection.updateOne(
      { _id: new ObjectId(id), userId: req.session.user.userid },
      { $set: { read: true } }
    );
    if (result.modifiedCount === 0) {
      return res
        .status(404)
        .json({ message: "알림을 찾을 수 없거나 권한이 없습니다." });
    }
    res.status(200).json({ message: "알림을 읽음으로 표시했습니다." });
  });

  // 알림 설정 조회
  router.get("/notification-settings", async (req, res) => {
    if (!req.session.user) {
      return res.status(401).json({ message: "로그인이 필요합니다." });
    }

    try {
      const user = await usersCollection.findOne({
        userid: req.session.user.userid,
      });
      if (!user) {
        return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
      }

      const settings = user.notificationSettings || DEFAULT_SETTINGS;
      res.json(settings);
    } catch (error) {
      console.error("알림 설정 조회 오류:", error);
      res.status(500).json({ message: "서버 오류가 발생했습니다." });
    }
  });

  // 알림 설정 업데이트
  router.put("/notification-settings", async (req, res) => {
    if (!req.session.user) {
      return res.status(401).json({ message: "로그인이 필요합니다." });
    }

    const {
      newIssueAssigned,
      mentions,
      issueStatusChanged,
      issueCommented,
      messengerNotifications,
      messengerType,
      messengerIntegrated,
    } = req.body;

    // 유효성 검사
    if (
      typeof newIssueAssigned !== "boolean" ||
      typeof mentions !== "boolean" ||
      typeof issueStatusChanged !== "boolean" ||
      typeof issueCommented !== "boolean" ||
      typeof messengerNotifications !== "boolean" ||
      (messengerType !== null &&
        !["slack", "telegram"].includes(messengerType)) ||
      typeof messengerIntegrated !== "boolean"
    ) {
      return res.status(400).json({ message: "잘못된 설정 값입니다." });
    }

    try {
      const settings = {
        newIssueAssigned,
        mentions,
        issueStatusChanged,
        issueCommented,
        messengerNotifications,
        messengerType,
        messengerIntegrated,
      };

      const result = await usersCollection.updateOne(
        { userid: req.session.user.userid },
        { $set: { notificationSettings: settings } }
      );

      if (result.modifiedCount === 0) {
        return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
      }

      res.json({ message: "알림 설정이 업데이트되었습니다." });
    } catch (error) {
      console.error("알림 설정 업데이트 오류:", error);
      res.status(500).json({ message: "서버 오류가 발생했습니다." });
    }
  });

  return { router, createNotification };
}

export default router;