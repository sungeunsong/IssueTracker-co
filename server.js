
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;
const ISSUES_FILE_PATH = path.join(__dirname, 'issues.json');

const INITIAL_ISSUE_STATUS = "OPEN";
const DEFAULT_ISSUE_TYPE = "TASK"; // Default if not provided, though it should be.

// Valid enum values from frontend types.ts
const VALID_STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED", "VALIDATING", "CLOSED", "WONT_DO"];
const VALID_ISSUE_TYPES = ["TASK", "BUG", "NEW_FEATURE", "IMPROVEMENT"];

async function readIssuesFromFile() {
  try {
    await fs.access(ISSUES_FILE_PATH);
    const data = await fs.readFile(ISSUES_FILE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      await fs.writeFile(ISSUES_FILE_PATH, JSON.stringify([], null, 2), 'utf-8');
      return [];
    }
    console.error('Error reading issues.json:', error);
    return [];
  }
}

async function writeIssuesToFile(issues) {
  try {
    await fs.writeFile(ISSUES_FILE_PATH, JSON.stringify(issues, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing to issues.json:', error);
  }
}

app.use(express.json());

app.get('/api/issues', async (req, res) => {
  const issues = await readIssuesFromFile();
  res.json(issues);
});

app.post('/api/issues', async (req, res) => {
  const { content, reporter, assignee, comment, type, affectsVersion } = req.body;
  
  if (!content || !reporter) {
    return res.status(400).json({ message: '이슈 내용과 등록자는 필수입니다.' });
  }
  if (!type || !VALID_ISSUE_TYPES.includes(type)) {
    return res.status(400).json({ message: `유효한 업무 유형을 선택해야 합니다. 유효한 값: ${VALID_ISSUE_TYPES.join(', ')}` });
  }

  const newIssue = {
    id: crypto.randomUUID(),
    content: content.trim(),
    reporter: reporter.trim(),
    assignee: assignee?.trim() || undefined,
    comment: comment?.trim() || undefined,
    status: INITIAL_ISSUE_STATUS,
    type,
    affectsVersion: affectsVersion?.trim() || undefined,
    fixVersion: undefined, // fixVersion is not set on creation
    createdAt: new Date().toISOString(),
  };
  const issues = await readIssuesFromFile();
  issues.unshift(newIssue);
  await writeIssuesToFile(issues);
  res.status(201).json(newIssue);
});

app.put('/api/issues/:id', async (req, res) => {
  const { id } = req.params;
  const { content, reporter, assignee, status, comment, type, affectsVersion, fixVersion } = req.body;

  let issues = await readIssuesFromFile();
  const issueIndex = issues.findIndex(issue => issue.id === id);

  if (issueIndex === -1) {
    return res.status(404).json({ message: '이슈를 찾을 수 없습니다.' });
  }

  const issueToUpdate = { ...issues[issueIndex] };

  if (content !== undefined) issueToUpdate.content = content.trim();
  if (reporter !== undefined) issueToUpdate.reporter = reporter.trim();
  if (assignee !== undefined) issueToUpdate.assignee = assignee.trim() === '' ? undefined : assignee.trim();
  if (comment !== undefined) issueToUpdate.comment = comment.trim() === '' ? undefined : comment.trim();
  
  if (status !== undefined) {
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ message: `유효한 상태 값을 제공해야 합니다. 유효한 값: ${VALID_STATUSES.join(', ')}` });
    }
    issueToUpdate.status = status;
  }

  if (type !== undefined) {
    if (!VALID_ISSUE_TYPES.includes(type)) {
      return res.status(400).json({ message: `유효한 업무 유형을 제공해야 합니다. 유효한 값: ${VALID_ISSUE_TYPES.join(', ')}` });
    }
    issueToUpdate.type = type;
  }
  
  if (affectsVersion !== undefined) issueToUpdate.affectsVersion = affectsVersion.trim() === '' ? undefined : affectsVersion.trim();
  if (fixVersion !== undefined) issueToUpdate.fixVersion = fixVersion.trim() === '' ? undefined : fixVersion.trim();


  issues[issueIndex] = issueToUpdate;
  await writeIssuesToFile(issues);
  res.json(issues[issueIndex]);
});

app.delete('/api/issues/:id', async (req, res) => {
  const { id } = req.params;
  let issues = await readIssuesFromFile();
  const initialLength = issues.length;
  issues = issues.filter(issue => issue.id !== id);

  if (issues.length === initialLength) {
    return res.status(404).json({ message: '삭제할 이슈를 찾을 수 없습니다.' });
  }

  await writeIssuesToFile(issues);
  res.status(204).send();
});

const frontendDistPath = path.join(__dirname, 'frontend-issue-tracker', 'dist');
app.use(express.static(frontendDistPath));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ message: `API endpoint not found: ${req.method} ${req.path}` });
  }
  const indexPath = path.join(frontendDistPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error(`Error sending index.html from ${indexPath}:`, err);
      res.status(500).json({ message: 'Frontend application not found. Please build the frontend.' });
    }
  });
});

app.listen(port, () => {
  console.log(`웹 이슈 트래커 앱이 http://localhost:${port} 에서 실행 중입니다.`);
  console.log(`데이터는 다음 파일에 저장됩니다: ${path.resolve(ISSUES_FILE_PATH)}`);
  console.log(`정적 프론트엔드 파일은 다음 경로에서 제공됩니다: ${path.resolve(frontendDistPath)}`);
});
