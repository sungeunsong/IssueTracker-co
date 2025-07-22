import express from "express";
import bcrypt from "bcryptjs";

const router = express.Router();

// 사용자 매핑 함수
function mapUser(user) {
  return {
    id: user._id.toString(),
    userid: user.userid,
    username: user.username,
    name: user.username,
    isAdmin: user.isAdmin || false,
    profileImage: user.profileImage,
  };
}

// 데이터베이스 컬렉션과 업로드 미들웨어를 받기 위한 함수
export function createUsersRoutes(usersCollection, upload) {

  // 사용자 목록 조회
  router.get("/users", async (req, res) => {
    const { username } = req.query;
    const filter = {};
    if (username) {
      filter.username = username;
    }

    const users = await usersCollection
      .find(filter, {
        projection: {
          userid: 1,
          username: 1,
          isAdmin: 1,
          _id: 1,
          profileImage: 1,
        },
      })
      .toArray();

    const mappedUsers = users.map(mapUser);
    res.json(mappedUsers);
  });

  // 특정 사용자 정보 조회
  router.get("/users/:userId", async (req, res) => {
    const { userId } = req.params;
    const user = await usersCollection.findOne(
      { userid: userId },
      { projection: { passwordHash: 0 } }
    );
    if (!user) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }
    res.json(mapUser(user));
  });

  // 비밀번호 변경
  router.put("/users/:userId/password", async (req, res) => {
    const { userId } = req.params;
    const { currentPassword, newPassword } = req.body;

    if (req.session.user?.userid !== userId) {
      return res.status(403).json({ message: "권한이 없습니다." });
    }

    const user = await usersCollection.findOne({ userid: userId });
    if (!user) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }

    const match = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!match) {
      return res
        .status(400)
        .json({ message: "현재 비밀번호가 일치하지 않습니다." });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await usersCollection.updateOne(
      { userid: userId },
      { $set: { passwordHash: newPasswordHash } }
    );

    res.json({ message: "비밀번호가 성공적으로 변경되었습니다." });
  });

  // 프로필 이미지 업로드
  router.post(
    "/users/:userId/profile-image",
    upload.single("profileImage"),
    async (req, res) => {
      const { userId } = req.params;

      if (req.session.user?.userid !== userId) {
        return res.status(403).json({ message: "권한이 없습니다." });
      }

      if (!req.file) {
        return res.status(400).json({ message: "이미지 파일이 필요합니다." });
      }

      const profileImage = `/uploads/${req.file.filename}`;
      await usersCollection.updateOne(
        { userid: userId },
        { $set: { profileImage } }
      );

      res.json({
        message: "프로필 이미지가 성공적으로 업로드되었습니다.",
        profileImage,
      });
    }
  );

  // 사용자 상세 정보 수정
  router.put("/users/:userId/details", async (req, res) => {
    const { userId } = req.params;
    const { department, position, manager, employeeId, workPhone, email, role } =
      req.body;

    if (req.session.user?.userid !== userId) {
      return res.status(403).json({ message: "권한이 없습니다." });
    }

    const user = await usersCollection.findOne({ userid: userId });
    if (!user) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }

    const updateFields = {
      department,
      position,
      manager,
      employeeId,
      workPhone,
      email,
      role,
    };

    await usersCollection.updateOne({ userid: userId }, { $set: updateFields });

    res.json({ message: "프로필 정보가 성공적으로 업데이트되었습니다." });
  });

  return router;
}

export default router;