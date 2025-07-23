import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { MongoClient, ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import session from "express-session";
import multer from "multer";
import fs from "fs";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";
// import dns from "dns";
import telegramRouter, { sendTelegramMessage } from "./routes/telegram.js";
import { createAuthRoutes } from "./routes/auth.js";
import { createVersionsRoutes } from "./routes/versions.js";
import { createProjectsRoutes } from "./routes/projects.js";
import { createUsersRoutes } from "./routes/users.js";
import { createNotificationsRoutes } from "./routes/notifications.js";
import { createIssuesRoutes } from "./routes/issues.js";
dotenv.config();

// DNS 서버를 Google DNS로 설정 (네트워크 연결 문제 해결)
// dns.setServers(["8.8.8.8", "8.8.4.4"]);

// IPv4만 사용하도록 설정 (IPv6 연결 문제 해결)
axios.defaults.family = 4;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017";
const DB_NAME = process.env.DB_NAME || "issuetracker";
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, "uploads");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}
const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    // 한글 파일명 인코딩 처리
    const originalname = Buffer.from(file.originalname, "latin1").toString(
      "utf8"
    );
    cb(null, unique + path.extname(originalname));
  },
});
const upload = multer({
  storage,
  // 한글 파일명 지원을 위한 설정
  fileFilter: (req, file, cb) => {
    // 여러 방법으로 파일명 디코딩 시도
    const attempts = [
      { method: "original", value: file.originalname },
      {
        method: "latin1->utf8",
        value: Buffer.from(file.originalname, "latin1").toString("utf8"),
      },
      {
        method: "utf8->latin1->utf8",
        value: Buffer.from(
          Buffer.from(file.originalname, "utf8").toString("latin1"),
          "latin1"
        ).toString("utf8"),
      },
    ];

    // 한글이 제대로 보이는 방법 선택
    for (const attempt of attempts) {
      if (/[가-힣]/.test(attempt.value)) {
        file.originalname = attempt.value;
        break;
      }
    }

    // 한글이 없다면 latin1->utf8 시도
    if (!/[가-힣]/.test(file.originalname)) {
      const decoded = Buffer.from(file.originalname, "latin1").toString("utf8");
      file.originalname = decoded;
    }

    cb(null, true);
  },
});

const client = new MongoClient(MONGO_URI);
await client.connect();
const db = client.db(DB_NAME);
const issuesCollection = db.collection("issues");
const projectsCollection = db.collection("projects");
const usersCollection = db.collection("users");
const versionsCollection = db.collection("versions");
const componentsCollection = db.collection("components");
const customersCollection = db.collection("customers");
const notificationsCollection = db.collection("notifications");

const ADMIN_USERID = "apadmin";
const ADMIN_USERNAME = "관리자";
const ADMIN_PASSWORD = "0000";

const INITIAL_ISSUE_STATUS = "열림";
const DEFAULT_STATUSES = [
  { id: "open", name: "열림", color: "blue", order: 1 },
  { id: "in_progress", name: "수정 중", color: "yellow", order: 2 },
  { id: "resolved", name: "수정 완료", color: "teal", order: 3 },
  { id: "verified", name: "검증", color: "purple", order: 4 },
  { id: "closed", name: "닫힘", color: "gray", order: 5 },
  { id: "rejected", name: "원치 않음", color: "gray", order: 6 },
];
const DEFAULT_TYPES = [
  { id: "task", name: "작업", color: "sky", order: 1 },
  { id: "bug", name: "버그", color: "red", order: 2 },
  { id: "feature", name: "새 기능", color: "lime", order: 3 },
  { id: "improvement", name: "개선", color: "yellow", order: 4 },
  { id: "license", name: "라이선스", color: "purple", order: 5 },
];
const DEFAULT_PRIORITIES = [
  { id: "highest", name: "HIGHEST", color: "red", order: 1 },
  { id: "high", name: "HIGH", color: "orange", order: 2 },
  { id: "medium", name: "MEDIUM", color: "yellow", order: 3 },
  { id: "low", name: "LOW", color: "green", order: 4 },
  { id: "lowest", name: "LOWEST", color: "blue", order: 5 },
];
const DEFAULT_PRIORITY_ID = "medium";
const DEFAULT_RESOLUTIONS = [
  { id: "completed", name: "완료", color: "green", order: 1 },
  { id: "rejected", name: "원하지 않음", color: "gray", order: 2 },
  { id: "cannot_reproduce", name: "재현 불가", color: "orange", order: 3 },
];

// 기존 문자열 값을 ID로 매핑하는 함수들
function mapOldStatusToId(oldStatus) {
  const mapping = {
    열림: "open",
    "수정 중": "in_progress",
    "수정 완료": "resolved",
    검증: "verified",
    닫힘: "closed",
    "원치 않음": "rejected",
  };
  return mapping[oldStatus] || "open";
}

function mapOldTypeToId(oldType) {
  const mapping = {
    작업: "task",
    버그: "bug",
    "새 기능": "feature",
    개선: "improvement",
    라이선스: "license",
  };
  return mapping[oldType] || "task";
}

function mapOldPriorityToId(oldPriority) {
  const mapping = {
    HIGHEST: "highest",
    HIGH: "high",
    MEDIUM: "medium",
    LOW: "low",
    LOWEST: "lowest",
  };
  return mapping[oldPriority] || "medium";
}

function mapOldResolutionToId(oldResolution) {
  const mapping = {
    완료: "completed",
    "원하지 않음": "rejected",
    "재현 불가": "cannot_reproduce",
  };
  return mapping[oldResolution] || null;
}
const DEFAULT_COMPONENTS = [];
const DEFAULT_CUSTOMERS = [];

async function ensureAdminUser() {
  const existing = await usersCollection.findOne({ userid: ADMIN_USERID });
  if (!existing) {
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await usersCollection.insertOne({
      userid: ADMIN_USERID,
      username: ADMIN_USERNAME,
      passwordHash,
      isAdmin: true,
      isActive: true,
      lastLogin: new Date(),
    });
    console.log("Default admin user created");
  }
}

await ensureAdminUser();

async function migrateProjects() {
  const cursor = projectsCollection.find({});
  for await (const proj of cursor) {
    const update = {};

    // 기존 문자열 배열을 ID 기반 객체 배열로 변환
    if (
      !proj.statuses ||
      (Array.isArray(proj.statuses) && typeof proj.statuses[0] === "string")
    ) {
      update.statuses = DEFAULT_STATUSES;
    }

    if (
      !proj.priorities ||
      (Array.isArray(proj.priorities) && typeof proj.priorities[0] === "string")
    ) {
      update.priorities = DEFAULT_PRIORITIES;
    }

    if (
      !proj.resolutions ||
      (Array.isArray(proj.resolutions) &&
        typeof proj.resolutions[0] === "string")
    ) {
      update.resolutions = DEFAULT_RESOLUTIONS;
    }

    if (
      !proj.types ||
      (Array.isArray(proj.types) && typeof proj.types[0] === "string")
    ) {
      update.types = DEFAULT_TYPES;
    }

    if (!proj.components) update.components = DEFAULT_COMPONENTS;
    if (!proj.customers) update.customers = DEFAULT_CUSTOMERS;
    if (proj.showCustomers === undefined) update.showCustomers = true;
    if (proj.showComponents === undefined) update.showComponents = true;

    if (Object.keys(update).length > 0) {
      await projectsCollection.updateOne({ _id: proj._id }, { $set: update });
      console.log(`Migrated project ${proj.name} to ID-based structure`);
    }
  }
}

await migrateProjects();

async function migrateIssues() {
  const cursor = issuesCollection.find({});
  for await (const doc of cursor) {
    const updates = {};

    // 프로젝트 정보 조회 (설정 기반 ID 매핑을 위해)
    const project = await projectsCollection.findOne({
      _id: new ObjectId(doc.projectId),
    });

    // 기존 필드 마이그레이션
    if (!doc.updatedAt) {
      updates.updatedAt = doc.createdAt || new Date().toISOString();
    }
    if (
      !doc.resolvedAt &&
      ["수정 완료", "닫힘", "원치 않음"].includes(doc.status)
    ) {
      updates.resolvedAt = updates.updatedAt || doc.updatedAt || doc.createdAt;
    }
    if (!doc.priority) {
      updates.priority = DEFAULT_PRIORITY_ID;
    }

    // 완전한 ID 기반 변환: 이제 status, type, priority를 ID로 저장
    if (doc.status && !doc.statusId) {
      // 프로젝트 설정에서 이름으로 ID 찾기
      let statusId = null;
      if (project?.statuses) {
        const statusItem = project.statuses.find((s) =>
          typeof s === "object" ? s.name === doc.status : s === doc.status
        );
        statusId = statusItem
          ? typeof statusItem === "object"
            ? statusItem.id
            : mapOldStatusToId(statusItem)
          : mapOldStatusToId(doc.status);
      } else {
        statusId = mapOldStatusToId(doc.status);
      }
      updates.statusId = statusId;
      // 이제 status 필드는 ID로 저장
      updates.status = statusId;
    }

    if (doc.type && !doc.typeId) {
      let typeId = null;
      if (project?.types) {
        const typeItem = project.types.find((t) =>
          typeof t === "object" ? t.name === doc.type : t === doc.type
        );
        typeId = typeItem
          ? typeof typeItem === "object"
            ? typeItem.id
            : mapOldTypeToId(typeItem)
          : mapOldTypeToId(doc.type);
      } else {
        typeId = mapOldTypeToId(doc.type);
      }
      updates.typeId = typeId;
      // 이제 type 필드도 ID로 저장
      updates.type = typeId;
    }

    if (doc.priority && typeof doc.priority === "string" && !doc.priorityId) {
      let priorityId = null;
      if (project?.priorities) {
        const priorityItem = project.priorities.find((p) =>
          typeof p === "object" ? p.name === doc.priority : p === doc.priority
        );
        priorityId = priorityItem
          ? typeof priorityItem === "object"
            ? priorityItem.id
            : mapOldPriorityToId(priorityItem)
          : mapOldPriorityToId(doc.priority);
      } else {
        priorityId = mapOldPriorityToId(doc.priority);
      }
      updates.priorityId = priorityId;
      // 이제 priority 필드도 ID로 저장
      updates.priority = priorityId;
    }

    if (doc.resolution && !doc.resolutionId) {
      let resolutionId = null;
      if (project?.resolutions) {
        const resolutionItem = project.resolutions.find((r) =>
          typeof r === "object"
            ? r.name === doc.resolution
            : r === doc.resolution
        );
        resolutionId = resolutionItem
          ? typeof resolutionItem === "object"
            ? resolutionItem.id
            : mapOldResolutionToId(resolutionItem)
          : mapOldResolutionToId(doc.resolution);
      } else {
        resolutionId = mapOldResolutionToId(doc.resolution);
      }
      updates.resolutionId = resolutionId;
      // 이제 resolution 필드도 ID로 저장
      updates.resolution = resolutionId;
    }

    if (doc.component && !doc.componentId) {
      const comp = await componentsCollection.findOne({
        projectId: doc.projectId,
        name: doc.component,
      });
      if (comp) {
        updates.componentId = comp._id.toString();
      }
    }

    if (doc.customer && !doc.customerId) {
      const cust = await customersCollection.findOne({
        projectId: doc.projectId,
        name: doc.customer,
      });
      if (cust) {
        updates.customerId = cust._id.toString();
      }
    }

    if (doc.affectsVersion && !doc.affectsVersionId) {
      const ver = await versionsCollection.findOne({
        projectId: doc.projectId,
        name: doc.affectsVersion,
      });
      if (ver) {
        updates.affectsVersionId = ver._id.toString();
      }
    }

    if (doc.fixVersion && !doc.fixVersionId) {
      const ver = await versionsCollection.findOne({
        projectId: doc.projectId,
        name: doc.fixVersion,
      });
      if (ver) {
        updates.fixVersionId = ver._id.toString();
      }
    }

    if (Object.keys(updates).length > 0) {
      await issuesCollection.updateOne({ _id: doc._id }, { $set: updates });
      console.log(`Migrated issue ${doc.issueKey} to full ID-based structure`);
    }
  }
}

await migrateIssues();

// CORS 설정
app.use(
  cors({
    origin: function (origin, callback) {
      // 개발 환경에서는 모든 origin 허용
      if (process.env.NODE_ENV === "development") {
        callback(null, true);
      } else {
        // 프로덕션에서는 허용된 도메인만
        const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
          .split(",")
          .filter(Boolean);
        if (
          process.env.ALLOWED_ORIGINS === "*" ||
          !origin ||
          allowedOrigins.includes(origin)
        ) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      }
    },
    credentials: true, // 세션 쿠키 허용
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "change_this_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // HTTPS에서만 secure 쿠키
      httpOnly: true, // XSS 방지
      maxAge: 24 * 60 * 60 * 1000, // 24시간
      sameSite: "lax", // 크로스 도메인 허용
    },
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

// DB 컬렉션을 req에 추가하는 미들웨어
app.use((req, res, next) => {
  req.usersCollection = usersCollection;
  req.issuesCollection = issuesCollection;
  req.projectsCollection = projectsCollection;
  req.notificationsCollection = notificationsCollection;
  next();
});

// 텔레그램 라우터 연결
app.use("/api/telegram", telegramRouter);

// Auth 라우터 연결
const authRouter = createAuthRoutes(usersCollection, projectsCollection);
app.use("/api", authRouter);

// Versions 라우터 연결
const versionsRouter = createVersionsRoutes(versionsCollection, projectsCollection, UPLOAD_DIR, upload);
app.use("/api", versionsRouter);

// Projects 라우터 연결
const projectsRouter = createProjectsRoutes(projectsCollection, usersCollection, componentsCollection, customersCollection, issuesCollection);
app.use("/api", projectsRouter);

// Users 라우터 연결
const usersRouter = createUsersRoutes(usersCollection, upload);
app.use("/api", usersRouter);

// Notifications 라우터 연결
const { router: notificationsRouter, createNotification } = createNotificationsRoutes(
  notificationsCollection, 
  usersCollection, 
  sendTelegramMessage
);
app.use("/api", notificationsRouter);

// Issues 라우터 연결
const issuesRouter = createIssuesRoutes(
  issuesCollection,
  projectsCollection,
  usersCollection,
  versionsCollection,
  componentsCollection,
  customersCollection,
  upload,
  createNotification,
  DEFAULT_STATUSES,
  DEFAULT_TYPES,
  DEFAULT_PRIORITIES,
  DEFAULT_PRIORITY_ID,
  DEFAULT_RESOLUTIONS,
  INITIAL_ISSUE_STATUS
);
app.use("/api", issuesRouter);










































const frontendDistPath = path.join(__dirname, "frontend-dist");
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
