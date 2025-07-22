import express from "express";
import { ObjectId } from "mongodb";

const router = express.Router();

// 기본 상태, 우선순위, 해결상태, 타입
const DEFAULT_STATUSES = ["열림", "수정 중", "수정 완료", "검증", "닫힘", "원치 않음"];
const DEFAULT_PRIORITIES = ["HIGHEST", "HIGH", "MEDIUM", "LOW", "LOWEST"];
const DEFAULT_RESOLUTIONS = ["수정됨", "원치 않음", "중복", "해결할 수 없음"];
const DEFAULT_TYPES = ["작업", "버그", "새 기능", "개선"];

// 매핑 함수들
function mapProject(doc) {
  const { _id, nextIssueNumber, ...rest } = doc;
  return { id: _id.toString(), ...rest };
}

function mapComponent(doc) {
  const { _id, ...rest } = doc;
  return { id: _id.toString(), ...rest };
}

function mapCustomer(doc) {
  const { _id, ...rest } = doc;
  return { id: _id.toString(), ...rest };
}

// 데이터베이스 컬렉션을 받기 위한 함수
export function createProjectsRoutes(
  projectsCollection,
  usersCollection,
  componentsCollection,
  customersCollection,
  issuesCollection
) {

  // 프로젝트 목록 조회
  router.get("/projects", async (req, res) => {
    const currentUserId = req.session.user?.userid;
    const { key, name } = req.query;

    if (!currentUserId) {
      return res.status(401).json({ message: "로그인이 필요합니다." });
    }

    const projects = await projectsCollection.find().toArray();
    
    const filteredProjects = projects.filter((project) => {
      const readUsers = project.readUsers || [];
      const writeUsers = project.writeUsers || [];
      const adminUsers = project.adminUsers || [];
      
      const hasAccess =
        req.session.user?.isAdmin ||
        readUsers.includes(currentUserId) ||
        writeUsers.includes(currentUserId) ||
        adminUsers.includes(currentUserId);

      if (!hasAccess) return false;

      // 키 또는 이름으로 필터링
      if (key && !project.key.toLowerCase().includes(key.toLowerCase())) {
        return false;
      }
      if (name && !project.name.toLowerCase().includes(name.toLowerCase())) {
        return false;
      }

      return true;
    });

    res.json(filteredProjects.map(mapProject));
  });

  // 새 프로젝트 생성
  router.post("/projects", async (req, res) => {
    const { name, key } = req.body;
    if (!name || !key) {
      return res
        .status(400)
        .json({ message: "프로젝트 이름과 키는 필수입니다." });
    }

    const existing = await projectsCollection.findOne({ key: key.toUpperCase() });
    if (existing) {
      return res.status(409).json({ message: "이미 존재하는 프로젝트 키입니다." });
    }

    const doc = {
      name,
      key: key.toUpperCase(),
      nextIssueNumber: 1,
      statuses: DEFAULT_STATUSES,
      priorities: DEFAULT_PRIORITIES,
      resolutions: DEFAULT_RESOLUTIONS,
      types: DEFAULT_TYPES,
      createdAt: new Date().toISOString(),
      readUsers: [],
      writeUsers: [],
      adminUsers: [req.session.user?.userid].filter(Boolean),
      showCustomers: true,
      showComponents: true,
    };

    const result = await projectsCollection.insertOne(doc);
    res.status(201).json({
      id: result.insertedId.toString(),
      name: doc.name,
      key: doc.key,
      nextIssueNumber: doc.nextIssueNumber,
      statuses: doc.statuses,
      priorities: doc.priorities,
      resolutions: doc.resolutions,
      types: doc.types,
      createdAt: doc.createdAt,
      readUsers: doc.readUsers,
      writeUsers: doc.writeUsers,
      adminUsers: doc.adminUsers,
      showCustomers: true,
      showComponents: true,
    });
  });

  // 특정 프로젝트 조회
  router.get("/projects/:projectId", async (req, res) => {
    const { projectId } = req.params;
    const project = await projectsCollection.findOne({
      _id: new ObjectId(projectId),
    });
    if (!project) {
      return res.status(404).json({ message: "프로젝트를 찾을 수 없습니다." });
    }
    res.json(mapProject(project));
  });

  // 프로젝트 설정 업데이트
  router.put("/projects/:projectId", async (req, res) => {
    const { projectId } = req.params;
    const { showCustomers, showComponents } = req.body;
    const update = {};
    if (showCustomers !== undefined) update.showCustomers = !!showCustomers;
    if (showComponents !== undefined) update.showComponents = !!showComponents;
    
    await projectsCollection.updateOne(
      { _id: new ObjectId(projectId) },
      { $set: update }
    );
    
    const proj = await projectsCollection.findOne({
      _id: new ObjectId(projectId),
    });
    
    if (!proj) {
      return res.status(404).json({ message: "프로젝트를 찾을 수 없습니다." });
    }
    
    res.json(mapProject(proj));
  });

  return router;
}

export default router;