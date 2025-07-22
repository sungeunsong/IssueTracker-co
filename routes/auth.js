import express from "express";
import bcrypt from "bcryptjs";

const router = express.Router();

// 데이터베이스 컬렉션을 받기 위한 함수
export function createAuthRoutes(usersCollection, projectsCollection) {
  
  // 회원가입
  router.post("/register", async (req, res) => {
    if (!req.session.user || !req.session.user.isAdmin) {
      return res
        .status(403)
        .json({ message: "관리자만 사용자 등록이 가능합니다." });
    }
    const {
      userid,
      username,
      password,
      department,
      position,
      manager,
      employeeId,
      workPhone,
      email,
      role,
    } = req.body;
    if (!userid || !username || !password) {
      return res
        .status(400)
        .json({ message: "아이디, 이름, 비밀번호는 필수입니다." });
    }
    const existing = await usersCollection.findOne({ userid });
    if (existing) {
      return res.status(409).json({ message: "이미 존재하는 사용자입니다." });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    await usersCollection.insertOne({
      userid,
      username,
      passwordHash,
      isAdmin: false,
      department,
      position,
      manager,
      employeeId,
      workPhone,
      email,
      role,
    });
    res.status(201).json({ message: "등록 완료" });
  });

  // 로그인
  router.post("/login", async (req, res) => {
    const { userid, password } = req.body;
    if (!userid || !password) {
      return res.status(400).json({ message: "아이디와 비밀번호는 필수입니다." });
    }
    const user = await usersCollection.findOne({ userid });
    if (!user) {
      return res
        .status(401)
        .json({ message: "잘못된 사용자 이름 또는 비밀번호" });
    }
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res
        .status(401)
        .json({ message: "잘못된 사용자 이름 또는 비밀번호" });
    }
    req.session.user = {
      userid: user.userid,
      username: user.username,
      isAdmin: user.isAdmin || false,
    };
    res.json({
      message: "로그인 성공",
      userid: user.userid,
      username: user.username,
      isAdmin: user.isAdmin || false,
    });
  });

  // 로그아웃
  router.post("/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "로그아웃 실패" });
      }
      res.clearCookie("connect.sid");
      res.json({ message: "로그아웃" });
    });
  });

  // 현재 사용자 정보
  router.get("/current-user", async (req, res) => {
    if (req.session.user) {
      const user = await usersCollection.findOne(
        { userid: req.session.user.userid },
        { projection: { passwordHash: 0 } }
      );
      if (!user) {
        return res.status(401).json({ message: "로그인이 필요합니다." });
      }

      const projects = await projectsCollection
        .find({
          adminUsers: user.userid,
        })
        .toArray();
      const adminProjectIds = projects.map((project) => project._id.toString());

      return res.json({
        id: user._id.toString(),
        userid: user.userid,
        username: user.username,
        isAdmin: user.isAdmin || false,
        profileImage: user.profileImage,
        adminProjectIds: adminProjectIds,
      });
    }
    res.status(401).json({ message: "로그인이 필요합니다." });
  });

  return router;
}

export default router;