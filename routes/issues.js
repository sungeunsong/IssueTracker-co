import express from "express";
import { ObjectId } from "mongodb";

export function createIssuesRoutes(
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
) {
  const router = express.Router();

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

  function mapIssue(doc) {
    const {
      _id,
      createdAt,
      updatedAt,
      resolvedAt,
      comments = [],
      history = [],
      ...rest
    } = doc;
    return {
      id: _id.toString(),
      createdAt,
      updatedAt: updatedAt || createdAt,
      resolvedAt,
      comments,
      history,
      ...rest,
    };
  }

  async function mapIssueWithLookups(doc) {
    const base = mapIssue(doc);
    if (doc.componentId) {
      const comp = await componentsCollection.findOne({
        _id: new ObjectId(doc.componentId),
      });
      base.component = comp?.name;
    } else if (doc.component) {
      base.component = doc.component;
    }
    if (doc.customerId) {
      const cust = await customersCollection.findOne({
        _id: new ObjectId(doc.customerId),
      });
      base.customer = cust?.name;
    } else if (doc.customer) {
      base.customer = doc.customer;
    }
    if (doc.affectsVersionId) {
      const ver = await versionsCollection.findOne({
        _id: new ObjectId(doc.affectsVersionId),
      });
      base.affectsVersion = ver?.name;
    } else if (doc.affectsVersion) {
      base.affectsVersion = doc.affectsVersion;
    }
    if (doc.fixVersionId) {
      const ver = await versionsCollection.findOne({
        _id: new ObjectId(doc.fixVersionId),
      });
      base.fixVersion = ver?.name;
    } else if (doc.fixVersion) {
      base.fixVersion = doc.fixVersion;
    }
    return base;
  }

  // GET /api/issues
  router.get("/issues", async (req, res) => {
    const { projectId, assignee, reporter, type, priority } = req.query;
    console.log("Received query parameters:", {
      projectId,
      assignee,
      reporter,
      type,
      priority,
    });

    const currentUserId = req.session.user?.userid;

    if (!currentUserId) {
      return res.status(401).json({ message: "로그인이 필요합니다." });
    }

    // 현재 사용자 정보 조회
    const currentUser = await usersCollection.findOne({ userid: currentUserId });

    const filter = projectId ? { projectId } : {};

    // 고급 검색 필터 추가
    if (assignee && assignee !== "ALL") {
      filter.assignee = assignee;
    }
    if (reporter && reporter !== "ALL") {
      filter.reporter = reporter;
    }
    if (type && type !== "ALL") {
      filter.typeId = type; // type은 typeId로 필터링
    }
    if (priority && priority !== "ALL") {
      filter.priorityId = priority; // priority는 priorityId로 필터링
    }

    console.log("MongoDB filter object:", filter);

    // 프로젝트 권한 확인 (관리자는 모든 권한)
    if (projectId && (!currentUser || !currentUser.isAdmin)) {
      const project = await projectsCollection.findOne({
        _id: new ObjectId(projectId),
      });

      if (!project) {
        return res.status(404).json({ message: "프로젝트를 찾을 수 없습니다." });
      }

      const hasReadPermission =
        project.readUsers && project.readUsers.includes(currentUserId);
      const hasWritePermission =
        project.writeUsers && project.writeUsers.includes(currentUserId);
      const hasAdminPermission =
        project.adminUsers && project.adminUsers.includes(currentUserId);

      // 권한이 없으면 접근 거부
      if (!hasReadPermission && !hasWritePermission && !hasAdminPermission) {
        return res
          .status(403)
          .json({ message: "이 프로젝트에 접근할 권한이 없습니다." });
      }

      // 쓰기 권한만 있는 경우 본인이 작성한 이슈만 필터링 (관리자 권한이나 읽기 권한이 있으면 모든 이슈 조회)
      if (hasWritePermission && !hasReadPermission && !hasAdminPermission) {
        filter.createdBy = currentUserId;
      }
    }

    const issues = await issuesCollection
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();
    const mapped = await Promise.all(issues.map((i) => mapIssueWithLookups(i)));
    res.json(mapped);
  });

  // GET /api/issues/key/:issueKey
  router.get("/issues/key/:issueKey", async (req, res) => {
    const { issueKey } = req.params;
    const issue = await issuesCollection.findOne({ issueKey });
    if (!issue) {
      return res.status(404).json({ message: "이슈를 찾을 수 없습니다." });
    }
    res.json(await mapIssueWithLookups(issue));
  });

  // GET /api/issuesWithProject/key/:issueKey
  router.get("/issuesWithProject/key/:issueKey", async (req, res) => {
    try {
      const { issueKey } = req.params;
      const issue = await issuesCollection.findOne({ issueKey });

      if (!issue) {
        return res.status(404).json({ message: "이슈를 찾을 수 없습니다." });
      }

      const mappedIssue = await mapIssueWithLookups(issue);

      const project = await projectsCollection.findOne({
        _id: new ObjectId(issue.projectId),
      });

      // 프로젝트가 존재하면, 'show'로 시작하는 속성들을 동적으로 복사합니다.
      if (project) {
        for (const key in project) {
          // project 객체 자체의 속성인지 확인하고, 'show'로 시작하는지 검사합니다.
          if (
            Object.prototype.hasOwnProperty.call(project, key) &&
            key.startsWith("show")
          ) {
            // mappedIssue에 해당 속성을 추가합니다.
            mappedIssue[key] = project[key];
          }
        }
      }

      res.json(mappedIssue);
    } catch (error) {
      console.error("Error fetching issue with project details:", error);
      res.status(500).json({ message: "서버 오류가 발생했습니다." });
    }
  });

  // POST /api/issues
  router.post("/issues", upload.array("files"), async (req, res) => {
    const {
      title,
      content,
      reporter,
      assignee,
      comment,
      type,
      priority,
      status, // status 추가
      affectsVersion,
      component,
      customer,
      projectId,
    } = req.body;
    if (!title || !reporter) {
      // content is now optional
      return res.status(400).json({ message: "제목과 등록자는 필수입니다." }); // Updated message
    }
    if (!projectId) {
      return res.status(400).json({ message: "프로젝트 ID가 필요합니다." });
    }

    const currentUserId = req.session.user?.userid;
    if (!currentUserId) {
      return res.status(401).json({ message: "로그인이 필요합니다." });
    }

    // 현재 사용자 정보 조회
    const currentUser = await usersCollection.findOne({ userid: currentUserId });

    // 관리자가 아닌 경우 프로젝트 권한 확인
    if (!currentUser || !currentUser.isAdmin) {
      const project = await projectsCollection.findOne({
        _id: new ObjectId(projectId),
      });

      if (!project) {
        return res.status(404).json({ message: "프로젝트를 찾을 수 없습니다." });
      }

      const hasWritePermission =
        project.writeUsers && project.writeUsers.includes(currentUserId);
      const hasAdminPermission =
        project.adminUsers && project.adminUsers.includes(currentUserId);

      // 쓰기 권한 또는 관리자 권한 확인 (읽기 권한만으로는 이슈 생성 불가)
      if (
        !hasWritePermission &&
        !hasAdminPermission &&
        (project.writeUsers || project.readUsers || project.adminUsers)
      ) {
        return res
          .status(403)
          .json({ message: "이슈를 생성할 권한이 없습니다." });
      }
    }
    // Check if this is a migration request with specific issue number
    const isMigration =
      req.body.isMigration === true || req.body.isMigration === "true";
    const requestedIssueNumber = req.body.requestedIssueNumber
      ? parseInt(req.body.requestedIssueNumber)
      : null;

    let projectResult;
    let issueNumber;

    if (isMigration && requestedIssueNumber) {
      // For migration: use the requested issue number and update nextIssueNumber if needed
      projectResult = await projectsCollection.findOne({
        _id: new ObjectId(projectId),
      });
      if (!projectResult) {
        return res.status(400).json({ message: "프로젝트를 찾을 수 없습니다." });
      }

      issueNumber = requestedIssueNumber;

      // Update nextIssueNumber to be at least one more than the requested number
      if (projectResult.nextIssueNumber <= requestedIssueNumber) {
        await projectsCollection.updateOne(
          { _id: new ObjectId(projectId) },
          { $set: { nextIssueNumber: requestedIssueNumber + 1 } }
        );
        projectResult.nextIssueNumber = requestedIssueNumber + 1;
      }
    } else {
      // Normal flow: increment nextIssueNumber
      projectResult = await projectsCollection.findOneAndUpdate(
        { _id: new ObjectId(projectId) },
        { $inc: { nextIssueNumber: 1 } },
        { returnDocument: "after" }
      );
      if (!projectResult) {
        return res.status(400).json({ message: "프로젝트를 찾을 수 없습니다." });
      }
      issueNumber = projectResult.nextIssueNumber - 1;
    }
    const allowedTypes = projectResult.types || DEFAULT_TYPES;
    const typeObj = allowedTypes.find((t) =>
      typeof t === "object" ? t.id === type : t === type
    );

    if (!type || !typeObj) {
      console.log("type", type);
      console.log("typeObj", typeObj);
      return res
        .status(400)
        .json({ message: "유효한 업무 유형을 선택해야 합니다." });
    }
    const allowedPriorities = projectResult.priorities || DEFAULT_PRIORITIES;
    const comps = await componentsCollection
      .find({ projectId })
      .project({ name: 1 })
      .toArray();
    const allowedComponents = comps.map((c) => c.name);
    const custs = await customersCollection
      .find({ projectId })
      .project({ name: 1 })
      .toArray();
    const allowedCustomers = custs.map((c) => c.name);
    const priorityObj = allowedPriorities.find((p) =>
      typeof p === "object" ? p.id === priority : p === priority
    );
    const issuePriority = priorityObj
      ? typeof priorityObj === "object"
        ? priorityObj.id
        : priorityObj
      : allowedPriorities[0]
      ? typeof allowedPriorities[0] === "object"
        ? allowedPriorities[0].id
        : allowedPriorities[0]
      : DEFAULT_PRIORITY_ID;
    if (component && !allowedComponents.includes(component)) {
      return res
        .status(400)
        .json({ message: "유효한 컴포넌트를 선택해야 합니다." });
    }
    if (customer && !allowedCustomers.includes(customer)) {
      return res
        .status(400)
        .json({ message: "유효한 고객사를 선택해야 합니다." });
    }
    const issueKey = `${projectResult?.key}-${issueNumber}`;

    // Determine issue status
    let issueStatusId;
    // Admin can override status for migration
    if (currentUser.isAdmin && status) {
      const allowedStatuses = projectResult.statuses || DEFAULT_STATUSES;
      const statusObj = allowedStatuses.find(
        (s) => s.id === status || s.name === status
      );
      if (statusObj) {
        issueStatusId =
          typeof statusObj === "object"
            ? statusObj.id
            : mapOldStatusToId(statusObj);
      } else {
        // If status is not in the project's list, still use it (for migration)
        issueStatusId = status;
      }
    }

    // Fallback to initial status if not set by admin
    if (!issueStatusId) {
      const initialStatusObj = projectResult.statuses?.[0];
      const initialStatus =
        typeof initialStatusObj === "object"
          ? initialStatusObj.name
          : initialStatusObj || INITIAL_ISSUE_STATUS;
      issueStatusId =
        typeof initialStatusObj === "object"
          ? initialStatusObj.id
          : mapOldStatusToId(initialStatus);
    }

    let componentId;
    if (component) {
      if (ObjectId.isValid(component)) {
        const comp = await componentsCollection.findOne({
          _id: new ObjectId(component),
        });
        componentId = comp?._id.toString();
      } else {
        const comp = comps.find((c) => c.name === component);
        componentId = comp?._id.toString();
      }
    }

    let customerId;
    if (customer) {
      if (ObjectId.isValid(customer)) {
        const cust = await customersCollection.findOne({
          _id: new ObjectId(customer),
        });
        customerId = cust?._id.toString();
      } else {
        const cust = custs.find((c) => c.name === customer);
        customerId = cust?._id.toString();
      }
    }

    let affectsVersionId;
    if (affectsVersion) {
      if (ObjectId.isValid(affectsVersion)) {
        const ver = await versionsCollection.findOne({
          _id: new ObjectId(affectsVersion),
        });
        affectsVersionId = ver?._id.toString();
      } else {
        const ver = await versionsCollection.findOne({
          projectId,
          name: affectsVersion,
        });
        affectsVersionId = ver?._id.toString();
      }
    }

    const newIssue = {
      title: title.trim(),
      content: content.trim(),
      reporter: reporter.trim(),
      assignee: assignee?.trim() || undefined,
      comment: comment?.trim() || undefined,
      // 이제 모든 값들을 ID로 저장
      status: issueStatusId,
      statusId: issueStatusId,
      type: typeof typeObj === "object" ? typeObj.id : mapOldTypeToId(typeObj),
      typeId: typeof typeObj === "object" ? typeObj.id : mapOldTypeToId(typeObj),
      priority: issuePriority,
      priorityId: issuePriority,
      affectsVersionId,
      componentId,
      customerId,
      projectId,
      issueKey,
      fixVersion: undefined,
      resolution: undefined,
      resolutionId: undefined,
      createdBy: currentUserId,
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
      history: req.body.history
        ? JSON.parse(req.body.history)
        : [
            {
              userId: reporter.trim(),
              action: "created",
              timestamp: new Date().toISOString(),
            },
          ],
    };
    const result = await issuesCollection.insertOne(newIssue);

    if (newIssue.assignee) {
      createNotification(
        newIssue.assignee,
        "new-issue",
        `새로운 이슈 '${newIssue.title}'가 할당되었습니다.`,
        result.insertedId,
        newIssue.issueKey,
        req.body.isMigration === "true"
      );
    }
    res
      .status(201)
      .json(await mapIssueWithLookups({ _id: result.insertedId, ...newIssue }));
  });

  // PUT /api/issues/:id
  router.put("/issues/:id", upload.array("files"), async (req, res) => {
    const { id } = req.params;
    const existing = await issuesCollection.findOne({ _id: new ObjectId(id) });
    if (!existing) {
      return res.status(404).json({ message: "이슈를 찾을 수 없습니다." });
    }

    const currentUserId = req.session.user?.userid;
    if (!currentUserId) {
      return res.status(401).json({ message: "로그인이 필요합니다." });
    }

    // 현재 사용자 정보 조회
    const currentUser = await usersCollection.findOne({ userid: currentUserId });

    const {
      title,
      content,
      reporter,
      assignee,
      status,
      comment,
      type,
      priority,
      affectsVersion,
      fixVersion,
      resolution,
      component,
      customer,
      projectId,
    } = req.body;
    const project = await projectsCollection.findOne({
      _id: new ObjectId(projectId || existing.projectId),
    });
    if (!project) {
      return res.status(400).json({ message: "프로젝트를 찾을 수 없습니다." });
    }

    // 관리자가 아닌 경우 권한 확인
    if (!currentUser || !currentUser.isAdmin) {
      const hasWritePermission =
        project.writeUsers && project.writeUsers.includes(currentUserId);
      const hasReadPermission =
        project.readUsers && project.readUsers.includes(currentUserId);
      const hasAdminPermission =
        project.adminUsers && project.adminUsers.includes(currentUserId);

      // 권한 확인
      if (project.writeUsers || project.readUsers || project.adminUsers) {
        // 쓰기 권한 또는 관리자 권한이 있으면 모든 이슈 수정 가능
        if (hasWritePermission || hasAdminPermission) {
          // 권한이 있으면 통과
        } else if (hasReadPermission) {
          // 읽기 권한만 있으면 수정 불가
          return res
            .status(403)
            .json({ message: "읽기 권한만으로는 이슈를 수정할 수 없습니다." });
        } else {
          // 권한이 없으면 수정 불가
          return res
            .status(403)
            .json({ message: "이슈를 수정할 권한이 없습니다." });
        }
      }
    }
    let updateFields = {};
    let changedFields = []; // 실제로 변경된 필드를 추적
    let fieldChanges = {}; // 필드별 변경사항 (이전값 → 새값)
    let statusChanged = false;
    let fromStatus;
    let toStatus;

    if (title !== undefined && title.trim() !== existing.title) {
      updateFields.title = title.trim();
      changedFields.push("title");
      fieldChanges.title = { from: existing.title, to: title.trim() };
    }
    if (content !== undefined && content.trim() !== existing.content) {
      updateFields.content = content.trim();
      changedFields.push("content");
      fieldChanges.content = { from: existing.content, to: content.trim() };
    }
    if (reporter !== undefined && reporter.trim() !== existing.reporter) {
      updateFields.reporter = reporter.trim();
      changedFields.push("reporter");
      fieldChanges.reporter = { from: existing.reporter, to: reporter.trim() };
    }
    if (assignee !== undefined) {
      const newAssignee = assignee.trim() === "" ? undefined : assignee.trim();
      if (newAssignee !== existing.assignee) {
        updateFields.assignee = newAssignee;
        changedFields.push("assignee");
        fieldChanges.assignee = { from: existing.assignee, to: newAssignee };
      }
    }
    let commentEntry;
    if (comment !== undefined) {
      const trimmed = comment.trim();
      updateFields.comment = trimmed === "" ? undefined : trimmed;
      if (trimmed) {
        commentEntry = {
          userId: req.session.user.userid,
          text: trimmed,
          createdAt: new Date().toISOString(),
        };
      }
    }
    if (resolution !== undefined) {
      const trimmedResolution = resolution.trim();
      const newResolution =
        trimmedResolution === "" ? undefined : trimmedResolution;
      let newResolutionId;

      if (trimmedResolution) {
        const resolutionObj = project.resolutions?.find((r) =>
          typeof r === "object"
            ? r.id === trimmedResolution || r.name === trimmedResolution
            : r === trimmedResolution
        );
        newResolutionId = resolutionObj
          ? typeof resolutionObj === "object"
            ? resolutionObj.id
            : mapOldResolutionToId(resolutionObj)
          : mapOldResolutionToId(trimmedResolution);
      } else {
        newResolutionId = undefined;
      }

      if (newResolutionId !== existing.resolutionId) {
        updateFields.resolution = newResolutionId;
        updateFields.resolutionId = newResolutionId;
        changedFields.push("resolution");
        // 해결책 이름 찾기
        const oldResolutionName = existing.resolutionId
          ? project.resolutions?.find(
              (r) => (typeof r === "object" ? r.id : r) === existing.resolutionId
            )?.name || existing.resolutionId
          : undefined;
        const newResolutionName = newResolutionId
          ? project.resolutions?.find(
              (r) => (typeof r === "object" ? r.id : r) === newResolutionId
            )?.name || newResolutionId
          : undefined;
        fieldChanges.resolution = {
          from: oldResolutionName,
          to: newResolutionName,
        };
      }
    }
    if (status !== undefined) {
      const statusObj = project.statuses?.find((s) =>
        typeof s === "object"
          ? s.id === status || s.name === status
          : s === status
      );
      if (!statusObj) {
        return res
          .status(400)
          .json({ message: "유효한 상태 값을 제공해야 합니다." });
      }
      const statusName =
        typeof statusObj === "object" ? statusObj.name : statusObj;
      const statusId =
        typeof statusObj === "object"
          ? statusObj.id
          : mapOldStatusToId(statusObj);

      if (statusId !== existing.statusId && statusName !== existing.status) {
        updateFields.status = statusId;
        updateFields.statusId = statusId;
        changedFields.push("status");
        statusChanged = true;
        fromStatus = existing.status;
        toStatus = statusName;
        fieldChanges.status = { from: existing.status, to: statusName };
      }
      if (["수정 완료", "닫힘", "원치 않음"].includes(statusName)) {
        updateFields.resolvedAt = new Date().toISOString();
      }
    }
    if (type !== undefined) {
      const typeObj = project.types?.find((t) =>
        typeof t === "object" ? t.id === type || t.name === type : t === type
      );
      if (!typeObj) {
        return res
          .status(400)
          .json({ message: "유효한 업무 유형을 제공해야 합니다." });
      }
      const typeId =
        typeof typeObj === "object" ? typeObj.id : mapOldTypeToId(typeObj);

      if (typeId !== existing.typeId) {
        updateFields.type = typeId;
        updateFields.typeId = typeId;
        changedFields.push("type");
        // 타입 이름 찾기
        const oldTypeName = existing.typeId
          ? project.types?.find(
              (t) => (typeof t === "object" ? t.id : t) === existing.typeId
            )?.name || existing.typeId
          : undefined;
        const newTypeName =
          project.types?.find(
            (t) => (typeof t === "object" ? t.id : t) === typeId
          )?.name || typeId;
        fieldChanges.type = { from: oldTypeName, to: newTypeName };
      }
    }
    if (priority !== undefined) {
      const priorityObj = project.priorities?.find((p) =>
        typeof p === "object"
          ? p.id === priority || p.name === priority
          : p === priority
      );
      if (!priorityObj) {
        return res
          .status(400)
          .json({ message: "유효한 우선순위를 제공해야 합니다." });
      }
      const priorityId =
        typeof priorityObj === "object"
          ? priorityObj.id
          : mapOldPriorityToId(priorityObj);

      if (priorityId !== existing.priorityId) {
        updateFields.priority = priorityId;
        updateFields.priorityId = priorityId;
        changedFields.push("priority");
        // 우선순위 이름 찾기
        const oldPriorityName = existing.priorityId
          ? project.priorities?.find(
              (p) => (typeof p === "object" ? p.id : p) === existing.priorityId
            )?.name || existing.priorityId
          : undefined;
        const newPriorityName =
          project.priorities?.find(
            (p) => (typeof p === "object" ? p.id : p) === priorityId
          )?.name || priorityId;
        fieldChanges.priority = { from: oldPriorityName, to: newPriorityName };
      }
    }
    if (component !== undefined) {
      const comps = await componentsCollection
        .find({ projectId: project._id.toString() })
        .project({ name: 1 })
        .toArray();
      const allowed = comps.map((c) => c.name);
      if (!allowed.includes(component) && component !== "") {
        return res
          .status(400)
          .json({ message: "유효한 컴포넌트를 제공해야 합니다." });
      }

      let newComponentId;
      if (component.trim() === "") {
        newComponentId = undefined;
      } else {
        const comp = comps.find((c) => c.name === component);
        newComponentId = comp?._id.toString();
      }

      if (newComponentId !== existing.componentId) {
        updateFields.componentId = newComponentId;
        changedFields.push("component");
        // 컴포넌트 이름 찾기
        const oldComponentName = existing.componentId
          ? comps.find((c) => c._id.toString() === existing.componentId)?.name
          : undefined;
        const newComponentName = newComponentId
          ? comps.find((c) => c._id.toString() === newComponentId)?.name
          : undefined;
        fieldChanges.component = { from: oldComponentName, to: newComponentName };
      }
    }
    if (customer !== undefined) {
      const custs = await customersCollection
        .find({ projectId: project._id.toString() })
        .project({ name: 1 })
        .toArray();
      const allowedCust = custs.map((c) => c.name);
      if (!allowedCust.includes(customer) && customer !== "") {
        return res
          .status(400)
          .json({ message: "유효한 고객사를 제공해야 합니다." });
      }

      let newCustomerId;
      if (customer.trim() === "") {
        newCustomerId = undefined;
      } else {
        const cust = custs.find((c) => c.name === customer);
        newCustomerId = cust?._id.toString();
      }

      if (newCustomerId !== existing.customerId) {
        updateFields.customerId = newCustomerId;
        changedFields.push("customer");
        // 고객사 이름 찾기
        const oldCustomerName = existing.customerId
          ? custs.find((c) => c._id.toString() === existing.customerId)?.name
          : undefined;
        const newCustomerName = newCustomerId
          ? custs.find((c) => c._id.toString() === newCustomerId)?.name
          : undefined;
        fieldChanges.customer = { from: oldCustomerName, to: newCustomerName };
      }
    }
    if (affectsVersion !== undefined) {
      let newAffectsVersionId;
      if (affectsVersion.trim() === "") {
        newAffectsVersionId = undefined;
      } else {
        const ver = await versionsCollection.findOne({
          projectId: project._id.toString(),
          name: affectsVersion,
        });
        newAffectsVersionId = ver?._id.toString();
      }

      if (newAffectsVersionId !== existing.affectsVersionId) {
        updateFields.affectsVersionId = newAffectsVersionId;
        changedFields.push("affectsVersion");
        // 영향 받는 버전 이름 찾기
        const oldAffectsVersionName = existing.affectsVersionId
          ? (
              await versionsCollection.findOne({
                _id: new ObjectId(existing.affectsVersionId),
              })
            )?.name
          : undefined;
        const newAffectsVersionName = newAffectsVersionId
          ? (
              await versionsCollection.findOne({
                _id: new ObjectId(newAffectsVersionId),
              })
            )?.name
          : undefined;
        fieldChanges.affectsVersion = {
          from: oldAffectsVersionName,
          to: newAffectsVersionName,
        };
      }
    }
    if (fixVersion !== undefined) {
      let newFixVersionId;
      if (fixVersion.trim() === "") {
        newFixVersionId = undefined;
      } else {
        const ver = await versionsCollection.findOne({
          projectId: project._id.toString(),
          name: fixVersion,
        });
        newFixVersionId = ver?._id.toString();
      }

      if (newFixVersionId !== existing.fixVersionId) {
        updateFields.fixVersionId = newFixVersionId;
        changedFields.push("fixVersion");
        // 수정 버전 이름 찾기
        const oldFixVersionName = existing.fixVersionId
          ? (
              await versionsCollection.findOne({
                _id: new ObjectId(existing.fixVersionId),
              })
            )?.name
          : undefined;
        const newFixVersionName = newFixVersionId
          ? (
              await versionsCollection.findOne({
                _id: new ObjectId(newFixVersionId),
              })
            )?.name
          : undefined;
        fieldChanges.fixVersion = {
          from: oldFixVersionName,
          to: newFixVersionName,
        };
      }
    }
    if (projectId !== undefined && projectId !== existing.projectId) {
      updateFields.projectId = projectId;
      changedFields.push("project");
      // 프로젝트 이름 찾기
      const oldProject = await projectsCollection.findOne({
        _id: new ObjectId(existing.projectId),
      });
      const newProject = await projectsCollection.findOne({
        _id: new ObjectId(projectId),
      });
      fieldChanges.project = { from: oldProject?.name, to: newProject?.name };
    }

    // 실제로 변경된 필드가 있는 경우에만 updatedAt과 기록 추가
    if (changedFields.length > 0 || commentEntry) {
      updateFields.updatedAt = new Date().toISOString();
    }

    // 마이그레이션 모드 확인
    const isMigration =
      req.body.isMigration === "true" || req.body.isMigration === true;

    let historyEntry;
    if (changedFields.length > 0 && !isMigration) {
      historyEntry = {
        userId: req.session.user.userid,
        action: "updated",
        timestamp: new Date().toISOString(),
        changes: changedFields,
        fieldChanges: fieldChanges,
      };
    }
    if (statusChanged && historyEntry) {
      historyEntry.fromStatus = fromStatus;
      historyEntry.toStatus = toStatus;
    }

    const updateOperation = {
      $set: updateFields,
    };

    // 기록 또는 댓글이 있는 경우에만 $push 추가
    if (historyEntry || commentEntry) {
      updateOperation.$push = {};
      if (historyEntry) {
        updateOperation.$push.history = historyEntry;
      }
    }
    if (commentEntry) {
      if (!updateOperation.$push) {
        updateOperation.$push = {};
      }
      updateOperation.$push.comments = commentEntry;
    }
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      if (!updateOperation.$push) {
        updateOperation.$push = {};
      }
      updateOperation.$push.attachments = {
        $each: req.files.map((f, index) => {
          // 마이그레이션에서 전송한 원본 파일명이 있으면 사용
          let originalName;
          if (req.body.originalFilename) {
            originalName = Array.isArray(req.body.originalFilename)
              ? req.body.originalFilename[index]
              : req.body.originalFilename;
          } else {
            originalName = Buffer.from(f.originalname, "latin1").toString("utf8");
          }

          return {
            filename: f.filename,
            originalName: originalName,
          };
        }),
      };
    }

    // 실제 변경사항이 있는 경우에만 업데이트 수행
    let result = existing;
    if (Object.keys(updateFields).length > 0 || updateOperation.$push) {
      const updatedResult = await issuesCollection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        updateOperation,
        { returnDocument: "after" }
      );
      if (!updatedResult) {
        return res.status(404).json({ message: "이슈를 찾을 수 없습니다." });
      }
      result = updatedResult;
    }

    // 담당자 변경 알림
    if (updateFields.assignee && updateFields.assignee !== existing.assignee) {
      createNotification(
        updateFields.assignee,
        "new-issue", // 'new-issue' 타입을 재사용하여 할당 알림을 보냅니다.
        `이슈 '${result.title}'가 회원님에게 할당되었습니다.`,
        result._id,
        result.issueKey,
        req.body.isMigration === "true"
      );
    }

    res.json(await mapIssueWithLookups(result));
  });

  // POST /api/issues/:id/comments
  router.post("/issues/:id/comments", async (req, res) => {
    const { id } = req.params;
    const { text, userId, createdAt, isMigration } = req.body; // Added isMigration flag
    if (!text || !text.trim()) {
      return res.status(400).json({ message: "댓글 내용은 비워둘 수 없습니다." });
    }
    if (!req.session.user) {
      return res.status(401).json({ message: "로그인이 필요합니다." });
    }

    const isAdmin = req.session.user.isAdmin;
    const authorId = isAdmin && userId ? userId : req.session.user.userid;
    const commentDate =
      isAdmin && createdAt ? createdAt : new Date().toISOString();

    const comment = {
      userId: authorId,
      text: text.trim(),
      createdAt: commentDate,
    };

    // 마이그레이션 모드일 때는 히스토리 엔트리를 생성하지 않음
    const updateOperation = {
      $push: {
        comments: comment,
      },
      $set: { updatedAt: new Date().toISOString() },
    };

    // 마이그레이션이 아닐 때만 히스토리 엔트리 추가
    if (!isMigration) {
      updateOperation.$push.history = {
        userId: comment.userId,
        action: "commented",
        timestamp: comment.createdAt,
        comment: comment.text,
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

    // 멘션 알림 처리
    const mentionRegex = /@(\w+)/g;
    let match;
    const mentionedUsers = new Set();
    while ((match = mentionRegex.exec(text)) !== null) {
      mentionedUsers.add(match[1]);
    }

    if (mentionedUsers.size > 0) {
      const issue = result;
      for (const mentionedUserId of mentionedUsers) {
        if (mentionedUserId !== req.session.user.userid) {
          createNotification(
            mentionedUserId,
            "mention",
            `'${issue.title}' 이슈에서 ${req.session.user.username}님이 회원님을 멘션했습니다.`,
            issue._id,
            issue.issueKey,
            req.body.isMigration === "true"
          );
        }
      }
    }

    res.json(await mapIssueWithLookups(result));
  });

  // DELETE /api/issues/:id
  router.delete("/issues/:id", async (req, res) => {
    const { id } = req.params;
    const result = await issuesCollection.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "삭제할 이슈를 찾을 수 없습니다." });
    }
    res.status(204).send();
  });

  return router;
}