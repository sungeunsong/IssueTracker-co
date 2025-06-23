import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { MongoClient, ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'tracker';

const client = new MongoClient(MONGO_URI);
await client.connect();
const db = client.db(DB_NAME);
const issuesCollection = db.collection('issues');
const projectsCollection = db.collection('projects');
const usersCollection = db.collection('users');

const ADMIN_USERNAME = 'apadmin';
const ADMIN_PASSWORD = 'ehfpal!!';

async function ensureAdminUser() {
  const existing = await usersCollection.findOne({ username: ADMIN_USERNAME });
  if (!existing) {
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await usersCollection.insertOne({ username: ADMIN_USERNAME, passwordHash });
    console.log('Default admin user created');
  }
}

await ensureAdminUser();

const INITIAL_ISSUE_STATUS = 'OPEN';
const VALID_STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'VALIDATING', 'CLOSED', 'WONT_DO'];
const VALID_ISSUE_TYPES = ['TASK', 'BUG', 'NEW_FEATURE', 'IMPROVEMENT'];

app.use(express.json());

function mapIssue(doc) {
  const { _id, ...rest } = doc;
  return { id: _id.toString(), ...rest };
}

function mapProject(doc) {
  const { _id, ...rest } = doc;
  return { id: _id.toString(), ...rest };
}

app.get('/api/projects', async (req, res) => {
  const projects = await projectsCollection.find().toArray();
  res.json(projects.map(mapProject));
});

app.post('/api/projects', async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ message: '프로젝트 이름은 필수입니다.' });
  }
  const result = await projectsCollection.insertOne({ name: name.trim() });
  res.status(201).json({ id: result.insertedId.toString(), name: name.trim() });
});

app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: '아이디와 비밀번호는 필수입니다.' });
  }
  const existing = await usersCollection.findOne({ username });
  if (existing) {
    return res.status(409).json({ message: '이미 존재하는 사용자입니다.' });
  }
  const passwordHash = await bcrypt.hash(password, 10);
  await usersCollection.insertOne({ username, passwordHash });
  res.status(201).json({ message: '등록 완료' });
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: '아이디와 비밀번호는 필수입니다.' });
  }
  const user = await usersCollection.findOne({ username });
  if (!user) {
    return res.status(401).json({ message: '잘못된 사용자 이름 또는 비밀번호' });
  }
  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    return res.status(401).json({ message: '잘못된 사용자 이름 또는 비밀번호' });
  }
  res.json({ message: '로그인 성공' });
});

app.get('/api/issues', async (req, res) => {
  const issues = await issuesCollection.find().sort({ createdAt: -1 }).toArray();
  res.json(issues.map(mapIssue));
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
    content: content.trim(),
    reporter: reporter.trim(),
    assignee: assignee?.trim() || undefined,
    comment: comment?.trim() || undefined,
    status: INITIAL_ISSUE_STATUS,
    type,
    affectsVersion: affectsVersion?.trim() || undefined,
    fixVersion: undefined,
    createdAt: new Date().toISOString(),
  };
  const result = await issuesCollection.insertOne(newIssue);
  res.status(201).json({ id: result.insertedId.toString(), ...newIssue });
});

app.put('/api/issues/:id', async (req, res) => {
  const { id } = req.params;
  const { content, reporter, assignee, status, comment, type, affectsVersion, fixVersion } = req.body;
  let updateFields = {};
  if (content !== undefined) updateFields.content = content.trim();
  if (reporter !== undefined) updateFields.reporter = reporter.trim();
  if (assignee !== undefined) updateFields.assignee = assignee.trim() === '' ? undefined : assignee.trim();
  if (comment !== undefined) updateFields.comment = comment.trim() === '' ? undefined : comment.trim();
  if (status !== undefined) {
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ message: `유효한 상태 값을 제공해야 합니다. 유효한 값: ${VALID_STATUSES.join(', ')}` });
    }
    updateFields.status = status;
  }
  if (type !== undefined) {
    if (!VALID_ISSUE_TYPES.includes(type)) {
      return res.status(400).json({ message: `유효한 업무 유형을 제공해야 합니다. 유효한 값: ${VALID_ISSUE_TYPES.join(', ')}` });
    }
    updateFields.type = type;
  }
  if (affectsVersion !== undefined) updateFields.affectsVersion = affectsVersion.trim() === '' ? undefined : affectsVersion.trim();
  if (fixVersion !== undefined) updateFields.fixVersion = fixVersion.trim() === '' ? undefined : fixVersion.trim();

  const result = await issuesCollection.findOneAndUpdate({ _id: new ObjectId(id) }, { $set: updateFields }, { returnDocument: 'after' });
  if (!result.value) {
    return res.status(404).json({ message: '이슈를 찾을 수 없습니다.' });
  }
  res.json(mapIssue(result.value));
});

app.delete('/api/issues/:id', async (req, res) => {
  const { id } = req.params;
  const result = await issuesCollection.deleteOne({ _id: new ObjectId(id) });
  if (result.deletedCount === 0) {
    return res.status(404).json({ message: '삭제할 이슈를 찾을 수 없습니다.' });
  }
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
  console.log(`MongoDB 연결: ${MONGO_URI}, DB: ${DB_NAME}`);
  console.log(`정적 프론트엔드 파일은 다음 경로에서 제공됩니다: ${path.resolve(frontendDistPath)}`);
});
