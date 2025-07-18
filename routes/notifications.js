import express from "express";
import { ObjectId } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

// 알림 목록 조회
router.get("/", async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: "로그인이 필요합니다." });
  }
  
  const notifications = await req.notificationsCollection
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

// 알림 읽음 처리
router.post("/:id/read", async (req, res) => {
  const { id } = req.params;
  if (!req.session.user) {
    return res.status(401).json({ message: "로그인이 필요합니다." });
  }
  
  const result = await req.notificationsCollection.updateOne(
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
router.get("/settings", async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: "로그인이 필요합니다." });
  }

  try {
    const user = await req.usersCollection.findOne({
      userid: req.session.user.userid,
    });
    
    if (!user) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }

    // 기본 알림 설정
    const defaultSettings = {
      newIssueAssigned: true,
      mentions: true,
      issueStatusChanged: true,
      issueCommented: true,
      messengerNotifications: false,
      messengerType: null,
      messengerIntegrated: false,
    };

    const settings = user.notificationSettings || defaultSettings;
    res.json(settings);
  } catch (error) {
    console.error("알림 설정 조회 오류:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

// 알림 설정 업데이트
router.put("/settings", async (req, res) => {
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

    const result = await req.usersCollection.updateOne(
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

export default router;