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

  // 프로젝트 사용자 목록 조회
  router.get("/projects/:projectId/users", async (req, res) => {
    const { projectId } = req.params;
    const currentUserId = req.session.user?.userid;

    if (!currentUserId) {
      return res.status(401).json({ message: "로그인이 필요합니다." });
    }

    const project = await projectsCollection.findOne({
      _id: new ObjectId(projectId),
    });

    if (!project) {
      return res.status(404).json({ message: "프로젝트를 찾을 수 없습니다." });
    }

    const readUsers = project.readUsers || [];
    const writeUsers = project.writeUsers || [];
    const adminUsers = project.adminUsers || [];

    const allUserIds = [...new Set([...readUsers, ...writeUsers, ...adminUsers])];
    const users = await usersCollection
      .find(
        { userid: { $in: allUserIds } },
        {
          projection: {
            userid: 1,
            username: 1,
            isAdmin: 1,
            _id: 1,
            profileImage: 1,
          },
        }
      )
      .toArray();

    const mappedUsers = users.map((user) => ({
      id: user._id.toString(),
      userid: user.userid,
      username: user.username,
      isAdmin: user.isAdmin || false,
      profileImage: user.profileImage,
    }));

    res.json(mappedUsers);
  });

  // 프로젝트 이슈 설정 조회
  router.get("/projects/:projectId/issue-settings", async (req, res) => {
    const { projectId } = req.params;
    const project = await projectsCollection.findOne({
      _id: new ObjectId(projectId),
    });
    if (!project) {
      return res.status(404).json({ message: "프로젝트를 찾을 수 없습니다." });
    }

    const comps = await componentsCollection
      .find({ projectId })
      .sort({ name: 1 })
      .toArray();

    res.json({
      statuses: project.statuses || DEFAULT_STATUSES,
      priorities: project.priorities || DEFAULT_PRIORITIES,
      resolutions: project.resolutions || DEFAULT_RESOLUTIONS,
      types: project.types || DEFAULT_TYPES,
      components: comps.map((c) => c.name),
    });
  });

  // 프로젝트 이슈 설정 업데이트
  router.put("/projects/:projectId/issue-settings", async (req, res) => {
    const { projectId } = req.params;
    const { statuses, priorities, resolutions, types } = req.body;
    if (
      !Array.isArray(statuses) ||
      !Array.isArray(priorities) ||
      !Array.isArray(resolutions) ||
      !Array.isArray(types)
    ) {
      return res.status(400).json({ message: "올바르지 않은 형식입니다." });
    }
    
    await projectsCollection.updateOne(
      { _id: new ObjectId(projectId) },
      { $set: { statuses, priorities, resolutions, types } }
    );
    
    res.json({ message: "업데이트 완료" });
  });

  // 프로젝트 컴포넌트 목록 조회
  router.get("/projects/:projectId/components", async (req, res) => {
    const { projectId } = req.params;
    const comps = await componentsCollection
      .find({ projectId })
      .sort({ name: 1 })
      .toArray();
    const countsArr = await issuesCollection
      .aggregate([
        { $match: { projectId, component: { $ne: null } } },
        { $group: { _id: "$component", count: { $sum: 1 } } },
      ])
      .toArray();
    const countMap = Object.fromEntries(countsArr.map((c) => [c._id, c.count]));
    res.json(
      comps.map((c) => ({
        id: c._id.toString(),
        name: c.name,
        description: c.description,
        owners: c.owners,
        issueCount: countMap[c.name] || 0,
      }))
    );
  });

  // 프로젝트에 새 컴포넌트 생성
  router.post("/projects/:projectId/components", async (req, res) => {
    const { projectId } = req.params;
    const { name, description, owners } = req.body;
    if (!name) {
      return res.status(400).json({ message: "이름은 필수입니다." });
    }
    const doc = {
      projectId,
      name: name.trim(),
      description: description?.trim() || undefined,
      owners: owners || [],
      createdAt: new Date().toISOString(),
    };
    const result = await componentsCollection.insertOne(doc);
    res.status(201).json({ id: result.insertedId.toString(), ...doc });
  });

  // 컴포넌트 수정
  router.put("/components/:id", async (req, res) => {
    const { id } = req.params;
    const { name, description, owners } = req.body;
    const update = { updatedAt: new Date().toISOString() };
    if (name !== undefined) update.name = name.trim();
    if (description !== undefined)
      update.description = description.trim() === "" ? undefined : description.trim();
    if (owners !== undefined) update.owners = owners;
    
    const result = await componentsCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: update },
      { returnDocument: "after" }
    );
    
    if (!result) {
      return res.status(404).json({ message: "컴포넌트를 찾을 수 없습니다." });
    }
    
    res.json(mapComponent(result));
  });

  // 컴포넌트 삭제
  router.delete("/components/:id", async (req, res) => {
    const { id } = req.params;
    const existing = await componentsCollection.findOne({ _id: new ObjectId(id) });
    if (!existing) {
      return res.status(404).json({ message: "삭제할 컴포넌트를 찾을 수 없습니다." });
    }
    
    await componentsCollection.deleteOne({ _id: new ObjectId(id) });
    
    // 이슈에서 해당 컴포넌트 제거
    await issuesCollection.updateMany(
      { component: existing.name },
      { $unset: { component: "" } }
    );
    
    // 프로젝트에서 컴포넌트 제거
    await projectsCollection.updateMany(
      { components: existing.name },
      { $pull: { components: existing.name } }
    );
    
    res.status(204).send();
  });

  // 프로젝트 고객 목록 조회
  router.get("/projects/:projectId/customers", async (req, res) => {
    const { projectId } = req.params;
    const custs = await customersCollection
      .find({ projectId })
      .sort({ name: 1 })
      .toArray();
    const countsArr = await issuesCollection
      .aggregate([
        { $match: { projectId, customer: { $ne: null } } },
        { $group: { _id: "$customer", count: { $sum: 1 } } },
      ])
      .toArray();
    const countMap = Object.fromEntries(countsArr.map((c) => [c._id, c.count]));
    res.json(
      custs.map((c) => ({
        id: c._id.toString(),
        name: c.name,
        description: c.description,
        owners: c.owners,
        issueCount: countMap[c.name] || 0,
      }))
    );
  });

  // 프로젝트에 새 고객 생성
  router.post("/projects/:projectId/customers", async (req, res) => {
    const { projectId } = req.params;
    const { name, description, owners } = req.body;
    if (!name) {
      return res.status(400).json({ message: "이름은 필수입니다." });
    }
    const doc = {
      projectId,
      name: name.trim(),
      description: description?.trim() || undefined,
      owners: owners || [],
      createdAt: new Date().toISOString(),
    };
    const result = await customersCollection.insertOne(doc);
    res.status(201).json({ id: result.insertedId.toString(), ...doc });
  });

  // 고객 수정
  router.put("/customers/:id", async (req, res) => {
    const { id } = req.params;
    const { name, description, owners } = req.body;
    const update = { updatedAt: new Date().toISOString() };
    if (name !== undefined) update.name = name.trim();
    if (description !== undefined)
      update.description = description.trim() === "" ? undefined : description.trim();
    if (owners !== undefined) update.owners = owners;
    
    const result = await customersCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: update },
      { returnDocument: "after" }
    );
    
    if (!result) {
      return res.status(404).json({ message: "고객을 찾을 수 없습니다." });
    }
    
    res.json(mapCustomer(result));
  });

  // 고객 삭제
  router.delete("/customers/:id", async (req, res) => {
    const { id } = req.params;
    const existing = await customersCollection.findOne({ _id: new ObjectId(id) });
    if (!existing) {
      return res.status(404).json({ message: "삭제할 고객을 찾을 수 없습니다." });
    }
    
    await customersCollection.deleteOne({ _id: new ObjectId(id) });
    
    // 이슈에서 해당 고객 제거
    await issuesCollection.updateMany(
      { customer: existing.name },
      { $unset: { customer: "" } }
    );
    
    // 프로젝트에서 고객 제거
    await projectsCollection.updateMany(
      { customers: existing.name },
      { $pull: { customers: existing.name } }
    );
    
    res.status(204).send();
  });

  // 프로젝트 권한 조회
  router.get("/projects/:projectId/permissions", async (req, res) => {
    const { projectId } = req.params;
    const project = await projectsCollection.findOne({
      _id: new ObjectId(projectId),
    });
    if (!project) {
      return res.status(404).json({ message: "프로젝트를 찾을 수 없습니다." });
    }
    res.json({
      readUsers: project.readUsers || [],
      writeUsers: project.writeUsers || [],
      adminUsers: project.adminUsers || [],
    });
  });

  // 프로젝트 권한 업데이트
  router.put("/projects/:projectId/permissions", async (req, res) => {
    const { projectId } = req.params;
    const { readUsers, writeUsers, adminUsers } = req.body;

    const project = await projectsCollection.findOne({
      _id: new ObjectId(projectId),
    });
    if (!project) {
      return res.status(404).json({ message: "프로젝트를 찾을 수 없습니다." });
    }

    const update = {};
    if (Array.isArray(readUsers)) update.readUsers = readUsers;
    if (Array.isArray(writeUsers)) update.writeUsers = writeUsers;
    if (Array.isArray(adminUsers)) update.adminUsers = adminUsers;

    await projectsCollection.updateOne(
      { _id: new ObjectId(projectId) },
      { $set: update }
    );

    res.json({ message: "권한이 업데이트되었습니다." });
  });

  return router;
}

export default router;