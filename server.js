
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

// 초기 이슈 상태 (types.ts의 ResolutionStatus.OPEN에 해당)
const INITIAL_ISSUE_STATUS = "OPEN";

// Helper to read issues from file
async function readIssuesFromFile() {
  console.log(`Attempting to read issues from: ${ISSUES_FILE_PATH}`);
  try {
    await fs.access(ISSUES_FILE_PATH);
    const data = await fs.readFile(ISSUES_FILE_PATH, 'utf-8');
    console.log('Successfully read issues.json.');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('issues.json not found. Attempting to create it.');
      try {
        await fs.writeFile(ISSUES_FILE_PATH, JSON.stringify([], null, 2), 'utf-8');
        console.log(`Created empty issues.json at: ${ISSUES_FILE_PATH}`);
        return [];
      } catch (writeError) {
        console.error(`Failed to create issues.json at ${ISSUES_FILE_PATH}:`, writeError);
        // Even if creation fails, return empty array to prevent API crash,
        // but the server log will indicate a persistent problem.
        return [];
      }
    }
    console.error('Error reading issues.json (it might be malformed or inaccessible):', error);
    // 오류 발생 시 빈 배열 반환하여 애플리케이션 중단 방지
    return [];
  }
}

// Helper to write issues to file
async function writeIssuesToFile(issues) {
  try {
    await fs.writeFile(ISSUES_FILE_PATH, JSON.stringify(issues, null, 2), 'utf-8');
    console.log('Successfully wrote to issues.json.');
  } catch (error) {
    console.error('Error writing to issues.json:', error);
  }
}

app.use(express.json()); // JSON 요청 본문 파싱을 위한 미들웨어

// API Routes
// GET all issues
app.get('/api/issues', async (req, res) => {
  const issues = await readIssuesFromFile();
  res.json(issues);
});

// POST a new issue
app.post('/api/issues', async (req, res) => {
  const { content, reporter, assignee, comment } = req.body;
  if (!content || !reporter) {
    return res.status(400).json({ message: '이슈 내용과 등록자는 필수입니다.' });
  }
  const newIssue = {
    id: crypto.randomUUID(),
    content,
    reporter,
    assignee: assignee || undefined,
    comment: comment || undefined,
    status: INITIAL_ISSUE_STATUS,
    createdAt: new Date().toISOString(),
  };
  const issues = await readIssuesFromFile();
  issues.unshift(newIssue); // 새 이슈를 배열 맨 앞에 추가
  await writeIssuesToFile(issues);
  res.status(201).json(newIssue);
});

// PUT (update) an issue
app.put('/api/issues/:id', async (req, res) => {
  const { id } = req.params;
  const { content, reporter, assignee, status, comment } = req.body;

  let issues = await readIssuesFromFile();
  const issueIndex = issues.findIndex(issue => issue.id === id);

  if (issueIndex === -1) {
    return res.status(404).json({ message: '이슈를 찾을 수 없습니다.' });
  }

  const issueToUpdate = { ...issues[issueIndex] }; // Create a copy to modify

  // Update fields if they are provided in the request
  if (content !== undefined) issueToUpdate.content = content;
  if (reporter !== undefined) issueToUpdate.reporter = reporter;
  // Handle empty string for assignee/comment to effectively unset them
  if (assignee !== undefined) issueToUpdate.assignee = assignee.trim() === '' ? undefined : assignee;
  if (comment !== undefined) issueToUpdate.comment = comment.trim() === '' ? undefined : comment;
  
  if (status !== undefined) {
    const validStatuses = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED", "WONT_DO"]; // Added WONT_DO
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: '유효한 상태 값을 제공해야 합니다.' });
    }
    issueToUpdate.status = status;
  }

  issues[issueIndex] = issueToUpdate;
  await writeIssuesToFile(issues);
  res.json(issues[issueIndex]);
});

// DELETE an issue
app.delete('/api/issues/:id', async (req, res) => {
  const { id } = req.params;
  let issues = await readIssuesFromFile();
  const initialLength = issues.length;
  issues = issues.filter(issue => issue.id !== id);

  if (issues.length === initialLength) {
    return res.status(404).json({ message: '삭제할 이슈를 찾을 수 없습니다.' });
  }

  await writeIssuesToFile(issues);
  res.status(204).send(); // 성공적으로 삭제되었으나 응답 본문은 없음
});

// Configuration for serving the frontend (Vite build)
// This assumes you have built your frontend into 'frontend-issue-tracker/dist'
const frontendDistPath = path.join(__dirname, 'frontend-issue-tracker', 'dist');

// Serve static files from the Vite build directory
app.use(express.static(frontendDistPath));

// SPA fallback: all other GET requests not handled above (and not static files)
// should serve the frontend's index.html
app.get('*', (req, res) => {
  // If it's an API path that wasn't matched by a specific API route handler
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ message: `API endpoint not found: ${req.method} ${req.path}` });
  }
  // For non-API routes, serve the main HTML file of the SPA
  // This is important for client-side routing to work correctly on page refresh.
  const indexPath = path.join(frontendDistPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      // If index.html itself is not found (e.g., frontend not built)
      console.error(`Error sending index.html from ${indexPath}:`, err);
      res.status(500).json({ message: 'Frontend application not found. Please build the frontend.' });
    }
  });
});


app.listen(port, () => {
  console.log(`웹 이슈 트래커 앱이 http://localhost:${port} 에서 실행 중입니다.`);
  console.log(`데이터는 다음 파일에 저장됩니다: ${path.resolve(ISSUES_FILE_PATH)}`);
  console.log(`정적 프론트엔드 파일은 다음 경로에서 제공됩니다: ${path.resolve(frontendDistPath)}`);
  console.log(`(개발 시에는 Vite 개발 서버(예: http://localhost:5173)를 통해 프론트엔드에 접속하고, 이 서버는 API 백엔드로 사용됩니다.)`);
});