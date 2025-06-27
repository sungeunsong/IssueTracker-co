import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { MongoClient, ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import session from "express-session";
import multer from "multer";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017";
const DB_NAME = process.env.DB_NAME || "issuetracker";

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, "uploads");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}
const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

const client = new MongoClient(MONGO_URI);
await client.connect();
const db = client.db(DB_NAME);
const issuesCollection = db.collection("issues");
const projectsCollection = db.collection("projects");
const usersCollection = db.collection("users");

const ADMIN_USERID = "apadmin";
const ADMIN_USERNAME = "관리자";
const ADMIN_PASSWORD = "0000";

async function ensureAdminUser() {
  const existing = await usersCollection.findOne({ userid: ADMIN_USERID });
  if (!existing) {
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await usersCollection.insertOne({
      userid: ADMIN_USERID,
      username: ADMIN_USERNAME,
      passwordHash,
      isAdmin: true,
    });
    console.log("Default admin user created");
  }
}

await ensureAdminUser();

async function migrateIssues() {
  const cursor = issuesCollection.find({
    $or: [{ updatedAt: { $exists: false } }, { resolvedAt: { $exists: false } }],
  });
  for await (const doc of cursor) {
    const updates = {};
    if (!doc.updatedAt) {
      updates.updatedAt = doc.createdAt || new Date().toISOString();
    }
    if (
      !doc.resolvedAt &&
      ["RESOLVED", "CLOSED", "WONT_DO"].includes(doc.status)
    ) {
      updates.resolvedAt = updates.updatedAt || doc.updatedAt || doc.createdAt;
    }
    if (Object.keys(updates).length > 0) {
      await issuesCollection.updateOne({ _id: doc._id }, { $set: updates });
    }
  }
}

await migrateIssues();

const INITIAL_ISSUE_STATUS = "OPEN";
const VALID_STATUSES = [
  "OPEN",
  "IN_PROGRESS",
  "RESOLVED",
  "VALIDATING",
  "CLOSED",
  "WONT_DO",
];
const VALID_ISSUE_TYPES = ["TASK", "BUG", "NEW_FEATURE", "IMPROVEMENT"];

app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "change_this_secret",
    resave: false,
    saveUninitialized: false,
  })
);
app.use("/uploads", express.static(UPLOAD_DIR, { fallthrough: false }));

app.use("/api", (req, res, next) => {
  const openPaths = ["/login", "/current-user"];
  if (openPaths.includes(req.path)) {
    return next();
  }
  if (!req.session.user) {
    return res.status(401).json({ message: "로그인이 필요합니다." });
  }
  next();
});

function mapIssue(doc) {
  const { _id, createdAt, updatedAt, resolvedAt, comments = [], ...rest } = doc;
  return {
    id: _id.toString(),
    createdAt,
    updatedAt: updatedAt || createdAt,
    resolvedAt,
    comments,
    ...rest,
  };
}

function mapProject(doc) {
  const { _id, nextIssueNumber, ...rest } = doc;
  return { id: _id.toString(), ...rest };
}

app.get("/api/projects", async (req, res) => {
  const projects = await projectsCollection.find().toArray();
  res.json(projects.map(mapProject));
});

app.post("/api/projects", async (req, res) => {
  const { name, key } = req.body;
  if (!name || !key) {
    return res
      .status(400)
      .json({ message: "프로젝트 이름과 키는 필수입니다." });
  }
  const existingKey = await projectsCollection.findOne({ key: key.trim() });
  if (existingKey) {
    return res
      .status(409)
      .json({ message: "이미 존재하는 프로젝트 키입니다." });
  }
  const result = await projectsCollection.insertOne({
    name: name.trim(),
    key: key.trim().toUpperCase(),
    nextIssueNumber: 1,
  });
  res.status(201).json({
    id: result.insertedId.toString(),
    name: name.trim(),
    key: key.trim().toUpperCase(),
  });
});
app.post("/api/register", async (req, res) => {
  if (!req.session.user || !req.session.user.isAdmin) {
    return res.status(403).json({ message: "관리자만 사용자 등록이 가능합니다." });
  }
  const { userid, username, password } = req.body;
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
  await usersCollection.insertOne({ userid, username, passwordHash, isAdmin: false });
  res.status(201).json({ message: "등록 완료" });
});

app.post("/api/login", async (req, res) => {
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

app.post("/api/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "로그아웃 실패" });
    }
    res.clearCookie("connect.sid");
    res.json({ message: "로그아웃" });
  });
});

app.get("/api/current-user", (req, res) => {
  if (req.session.user) {
    return res.json({
      userid: req.session.user.userid,
      username: req.session.user.username,
      isAdmin: req.session.user.isAdmin || false,
    });
  }
  res.status(401).json({ message: "로그인이 필요합니다." });
});

app.get("/api/users", async (req, res) => {
  const users = await usersCollection
    .find({}, { projection: { userid: 1, username: 1, isAdmin: 1, _id: 0 } })
    .toArray();
  res.json(users);
});

app.get("/api/issues", async (req, res) => {
  const { projectId } = req.query;
  const filter = projectId ? { projectId } : {};
  const issues = await issuesCollection
    .find(filter)
    .sort({ createdAt: -1 })
    .toArray();
  res.json(issues.map(mapIssue));
});

app.get("/api/issues/key/:issueKey", async (req, res) => {
  const { issueKey } = req.params;
  const issue = await issuesCollection.findOne({ issueKey });
  if (!issue) {
    return res.status(404).json({ message: "이슈를 찾을 수 없습니다." });
  }
  res.json(mapIssue(issue));
});

app.post("/api/issues", upload.array("files"), async (req, res) => {
  const {
    title,
    content,
    reporter,
    assignee,
    comment,
    type,
    affectsVersion,
    projectId,
  } = req.body;
  if (!title || !content || !reporter) {
    return res
      .status(400)
      .json({ message: "제목, 내용과 등록자는 필수입니다." });
  }
  if (!type || !VALID_ISSUE_TYPES.includes(type)) {
    return res.status(400).json({
      message: `유효한 업무 유형을 선택해야 합니다. 유효한 값: ${VALID_ISSUE_TYPES.join(
        ", "
      )}`,
    });
  }
  if (!projectId) {
    return res.status(400).json({ message: "프로젝트 ID가 필요합니다." });
  }
  console.log(projectId);
  const projectResult = await projectsCollection.findOneAndUpdate(
    { _id: new ObjectId(projectId) },
    { $inc: { nextIssueNumber: 1 } },
    { returnDocument: "after" }
  );
  if (!projectResult) {
    return res.status(400).json({ message: "프로젝트를 찾을 수 없습니다." });
  }
  const issueNumber = projectResult?.nextIssueNumber - 1;
  const issueKey = `${projectResult?.key}-${String(issueNumber).padStart(
    4,
    "0"
  )}`;

  const newIssue = {
    title: title.trim(),
    content: content.trim(),
    reporter: reporter.trim(),
    assignee: assignee?.trim() || undefined,
    comment: comment?.trim() || undefined,
    status: INITIAL_ISSUE_STATUS,
    type,
    affectsVersion: affectsVersion?.trim() || undefined,
    projectId,
    issueKey,
    fixVersion: undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    attachments: (req.files || []).map((f) => ({
      filename: f.filename,
      originalName: Buffer.from(f.originalname, "latin1").toString("utf8"),
    })),
    comments:
      comment && comment.trim()
        ? [
            {
              userId: reporter.trim(),
              text: comment.trim(),
              createdAt: new Date().toISOString(),
            },
          ]
        : [],
  };
  const result = await issuesCollection.insertOne(newIssue);
  res.status(201).json({ id: result.insertedId.toString(), ...newIssue });
});

app.put("/api/issues/:id", upload.array("files"), async (req, res) => {
  const { id } = req.params;
  const {
    title,
    content,
    reporter,
    assignee,
    status,
    comment,
    type,
    affectsVersion,
    fixVersion,
    projectId,
  } = req.body;
  let updateFields = {};
  if (title !== undefined) updateFields.title = title.trim();
  if (content !== undefined) updateFields.content = content.trim();
  if (reporter !== undefined) updateFields.reporter = reporter.trim();
  if (assignee !== undefined)
    updateFields.assignee =
      assignee.trim() === "" ? undefined : assignee.trim();
  if (comment !== undefined)
    updateFields.comment = comment.trim() === "" ? undefined : comment.trim();
  if (status !== undefined) {
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        message: `유효한 상태 값을 제공해야 합니다. 유효한 값: ${VALID_STATUSES.join(
          ", "
        )}`,
      });
    }
    updateFields.status = status;
    if (["RESOLVED", "CLOSED", "WONT_DO"].includes(status)) {
      updateFields.resolvedAt = new Date().toISOString();
    }
  }
  if (type !== undefined) {
    if (!VALID_ISSUE_TYPES.includes(type)) {
      return res.status(400).json({
        message: `유효한 업무 유형을 제공해야 합니다. 유효한 값: ${VALID_ISSUE_TYPES.join(
          ", "
        )}`,
      });
    }
    updateFields.type = type;
  }
  if (affectsVersion !== undefined)
    updateFields.affectsVersion =
      affectsVersion.trim() === "" ? undefined : affectsVersion.trim();
  if (fixVersion !== undefined)
    updateFields.fixVersion =
      fixVersion.trim() === "" ? undefined : fixVersion.trim();
  if (projectId !== undefined) updateFields.projectId = projectId;
  updateFields.updatedAt = new Date().toISOString();
  const updateOperation = { $set: updateFields };
  if (req.files && Array.isArray(req.files) && req.files.length > 0) {
    updateOperation.$push = {
      attachments: {
        $each: req.files.map((f) => ({
          filename: f.filename,
          originalName: f.originalname,
        })),
      },
    };
  }

  const result = await issuesCollection.findOneAndUpdate(
    { _id: new ObjectId(id) },
    updateOperation,
    { returnDocument: "after" }
  );
  if (!result) {
    return res.status(404).json({ message: "이슈를 찾을 수 없습니다." });
  }
  res.json(mapIssue(result));
});

app.post("/api/issues/:id/comments", async (req, res) => {
  const { id } = req.params;
  const { text } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ message: "댓글 내용은 비워둘 수 없습니다." });
  }
  if (!req.session.user) {
    return res.status(401).json({ message: "로그인이 필요합니다." });
  }
  const comment = {
    userId: req.session.user.userid,
    text: text.trim(),
    createdAt: new Date().toISOString(),
  };
  const result = await issuesCollection.findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $push: { comments: comment }, $set: { updatedAt: new Date().toISOString() } },
    { returnDocument: "after" }
  );
  if (!result) {
    return res.status(404).json({ message: "이슈를 찾을 수 없습니다." });
  }
  res.json(mapIssue(result));
});

app.delete("/api/issues/:id", async (req, res) => {
  const { id } = req.params;
  const result = await issuesCollection.deleteOne({ _id: new ObjectId(id) });
  if (result.deletedCount === 0) {
    return res.status(404).json({ message: "삭제할 이슈를 찾을 수 없습니다." });
  }
  res.status(204).send();
});

const frontendDistPath = path.join(__dirname, "frontend-issue-tracker", "dist");
app.use(express.static(frontendDistPath));

app.get("*", (req, res) => {
  if (req.path.startsWith("/api/")) {
    return res
      .status(404)
      .json({ message: `API endpoint not found: ${req.method} ${req.path}` });
  }
  const indexPath = path.join(frontendDistPath, "index.html");
  res.sendFile(indexPath, (err) => {
    console.log(indexPath);
    if (err) {
      console.error(`Error sending index.html from ${indexPath}:`, err);
      res.status(500).json({
        message: "Frontend application not found. Please build the frontend.",
      });
    }
  });
});

app.listen(port, () => {
  console.log(
    `웹 이슈 트래커 앱이 http://localhost:${port} 에서 실행 중입니다.`
  );
  console.log(`MongoDB 연결: ${MONGO_URI}, DB: ${DB_NAME}`);
  console.log(
    `정적 프론트엔드 파일은 다음 경로에서 제공됩니다: ${path.resolve(
      frontendDistPath
    )}`
  );
});
