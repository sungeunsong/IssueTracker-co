import express from "express";
import { ObjectId } from "mongodb";
import path from "path";
import fs from "fs";

const router = express.Router();

// 버전 매핑 함수
function mapVersion(doc) {
  const { _id, ...rest } = doc;
  return { id: _id.toString(), ...rest };
}

// 데이터베이스 컬렉션과 업로드 디렉토리를 받기 위한 함수
export function createVersionsRoutes(versionsCollection, projectsCollection, UPLOAD_DIR, upload) {

  // 프로젝트의 버전 목록 조회
  router.get("/projects/:projectId/versions", async (req, res) => {
    const { projectId } = req.params;
    const versions = await versionsCollection
      .find({ projectId })
      .sort({ createdAt: -1 })
      .toArray();
    res.json(versions.map(mapVersion));
  });

  // 프로젝트에 새 버전 생성
  router.post("/projects/:projectId/versions", async (req, res) => {
    const { projectId } = req.params;
    const { name, startDate, releaseDate, leader, description } = req.body;
    if (!name || !leader) {
      return res.status(400).json({ message: "이름과 추진자는 필수입니다." });
    }
    const doc = {
      projectId,
      name: name.trim(),
      startDate: startDate || undefined,
      releaseDate: releaseDate || undefined,
      leader,
      description: description?.trim() || undefined,
      released: false,
      createdAt: new Date().toISOString(),
    };
    const result = await versionsCollection.insertOne(doc);
    res.status(201).json({ id: result.insertedId.toString(), ...doc });
  });

  // 버전 정보 수정
  router.put("/versions/:id", async (req, res) => {
    const { id } = req.params;
    const { name, startDate, releaseDate, leader, description, released } = req.body;
    const update = { updatedAt: new Date().toISOString() };
    if (name !== undefined) update.name = name.trim();
    if (startDate !== undefined) update.startDate = startDate;
    if (releaseDate !== undefined) update.releaseDate = releaseDate;
    if (leader !== undefined) update.leader = leader;
    if (description !== undefined)
      update.description =
        description.trim() === "" ? undefined : description.trim();
    if (released !== undefined) update.released = released;
    const result = await versionsCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: update },
      { returnDocument: "after" }
    );
    if (!result) {
      return res.status(404).json({ message: "버전을 찾을 수 없습니다." });
    }
    res.json(mapVersion(result));
  });

  // 버전 삭제
  router.delete("/versions/:id", async (req, res) => {
    const { id } = req.params;
    const result = await versionsCollection.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "삭제할 버전을 찾을 수 없습니다." });
    }
    res.status(204).send();
  });

  // 버전 파일 업로드 (여러 파일 지원)
  router.post("/versions/:id/file", upload.array("files", 10), async (req, res) => {
    try {
      const { id } = req.params;

      // 버전 정보 가져오기
      const version = await versionsCollection.findOne({
        _id: new ObjectId(id),
      });
      if (!version) {
        return res.status(404).json({ message: "버전을 찾을 수 없습니다." });
      }

      // 프로젝트 정보 가져오기
      const project = await projectsCollection.findOne({
        _id: new ObjectId(version.projectId),
      });
      if (!project) {
        return res
          .status(404)
          .json({ message: "프로젝트를 찾을 수 없습니다." });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: "파일이 제공되지 않았습니다." });
      }

      // 프로젝트/버전별 디렉토리 생성
      const projectDir = path.join(UPLOAD_DIR, project.name);
      const versionDir = path.join(projectDir, version.name);

      if (!fs.existsSync(projectDir)) {
        fs.mkdirSync(projectDir, { recursive: true });
      }
      if (!fs.existsSync(versionDir)) {
        fs.mkdirSync(versionDir, { recursive: true });
      }

      // 새로 업로드된 파일들 처리
      const newAttachments = [];
      for (const file of req.files) {
        const newFilePath = path.join(versionDir, file.filename);
        fs.renameSync(file.path, newFilePath);

        newAttachments.push({
          filename: file.filename,
          originalName: file.originalname,
        });
      }

      // 기존 첨부파일 목록 가져오기
      const existingAttachments = version.attachments || [];
      const allAttachments = [...existingAttachments, ...newAttachments];

      // 버전 문서에 첨부파일 정보 업데이트
      await versionsCollection.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            attachments: allAttachments,
            updatedAt: new Date().toISOString(),
          },
        }
      );

      res.json({
        message: `${newAttachments.length}개 파일이 성공적으로 업로드되었습니다.`,
        attachments: newAttachments,
      });
    } catch (error) {
      console.error("파일 업로드 중 오류:", error);
      res.status(500).json({ message: "파일 업로드 중 오류가 발생했습니다." });
    }
  });

  // 개별 파일 다운로드
  router.get("/versions/:id/file/:filename/download", async (req, res) => {
    try {
      const { id, filename } = req.params;

      // 버전 정보 가져오기
      const version = await versionsCollection.findOne({ _id: new ObjectId(id) });
      if (!version) {
        return res.status(404).json({ message: "버전을 찾을 수 없습니다." });
      }

      if (!version.attachments || version.attachments.length === 0) {
        return res.status(404).json({ message: "첨부된 파일이 없습니다." });
      }

      // 프로젝트 정보 가져오기
      const project = await projectsCollection.findOne({
        _id: new ObjectId(version.projectId),
      });
      if (!project) {
        return res.status(404).json({ message: "프로젝트를 찾을 수 없습니다." });
      }

      // 요청된 파일 찾기
      const attachment = version.attachments.find(
        (att) => att.filename === filename
      );
      if (!attachment) {
        return res.status(404).json({ message: "해당 파일을 찾을 수 없습니다." });
      }

      const filePath = path.join(
        UPLOAD_DIR,
        project.name,
        version.name,
        attachment.filename
      );

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "파일을 찾을 수 없습니다." });
      }

      res.download(filePath, attachment.originalName);
    } catch (error) {
      console.error("파일 다운로드 중 오류:", error);
      res.status(500).json({ message: "파일 다운로드 중 오류가 발생했습니다." });
    }
  });

  // 개별 파일 삭제
  router.delete("/versions/:id/file/:filename", async (req, res) => {
    try {
      const { id, filename } = req.params;

      // 버전 정보 가져오기
      const version = await versionsCollection.findOne({ _id: new ObjectId(id) });
      if (!version) {
        return res.status(404).json({ message: "버전을 찾을 수 없습니다." });
      }

      if (!version.attachments || version.attachments.length === 0) {
        return res.status(404).json({ message: "첨부된 파일이 없습니다." });
      }

      // 프로젝트 정보 가져오기
      const project = await projectsCollection.findOne({
        _id: new ObjectId(version.projectId),
      });
      if (!project) {
        return res.status(404).json({ message: "프로젝트를 찾을 수 없습니다." });
      }

      // 삭제할 파일 찾기
      const attachmentIndex = version.attachments.findIndex(
        (att) => att.filename === filename
      );
      if (attachmentIndex === -1) {
        return res.status(404).json({ message: "해당 파일을 찾을 수 없습니다." });
      }

      const attachment = version.attachments[attachmentIndex];
      const filePath = path.join(
        UPLOAD_DIR,
        project.name,
        version.name,
        attachment.filename
      );

      // 실제 파일 삭제
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // 데이터베이스에서 첨부파일 정보 삭제
      const updatedAttachments = version.attachments.filter(
        (_, index) => index !== attachmentIndex
      );

      await versionsCollection.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            attachments: updatedAttachments,
            updatedAt: new Date().toISOString(),
          },
        }
      );

      res.json({ message: "파일이 성공적으로 삭제되었습니다." });
    } catch (error) {
      console.error("파일 삭제 중 오류:", error);
      res.status(500).json({ message: "파일 삭제 중 오류가 발생했습니다." });
    }
  });

  // 전체 파일 다운로드 (ZIP)
  router.get("/versions/:id/files/download-all", async (req, res) => {
    try {
      const { id } = req.params;

      // 버전 정보 가져오기
      const version = await versionsCollection.findOne({ _id: new ObjectId(id) });
      if (!version) {
        return res.status(404).json({ message: "버전을 찾을 수 없습니다." });
      }

      if (!version.attachments || version.attachments.length === 0) {
        return res.status(404).json({ message: "첨부된 파일이 없습니다." });
      }

      // 프로젝트 정보 가져오기
      const project = await projectsCollection.findOne({
        _id: new ObjectId(version.projectId),
      });
      if (!project) {
        return res.status(404).json({ message: "프로젝트를 찾을 수 없습니다." });
      }

      const archiver = require("archiver");
      const archive = archiver("zip", { zlib: { level: 9 } });

      res.attachment(`${project.name}-${version.name}-files.zip`);
      archive.pipe(res);

      const versionDir = path.join(UPLOAD_DIR, project.name, version.name);

      // 각 첨부파일을 ZIP에 추가
      for (const attachment of version.attachments) {
        const filePath = path.join(versionDir, attachment.filename);
        if (fs.existsSync(filePath)) {
          archive.file(filePath, { name: attachment.originalName });
        }
      }

      archive.finalize();
    } catch (error) {
      console.error("전체 파일 다운로드 중 오류:", error);
      res
        .status(500)
        .json({ message: "전체 파일 다운로드 중 오류가 발생했습니다." });
    }
  });

  return router;
}

export default router;