class InMemoryStore {
  constructor() {
    this.users = []; // { id, username, password }
    this.issues = []; // { id, title, description, status, assignee, comments }
    this.nextIssueId = 1;
    this.nextUserId = 1;
  }

  addUser(username, password) {
    const user = { id: this.nextUserId++, username, password };
    this.users.push(user);
    return user;
  }

  findUser(username) {
    return this.users.find(u => u.username === username);
  }

  addIssue(data) {
    const issue = {
      id: this.nextIssueId++,
      title: data.title,
      description: data.description,
      status: data.status || 'open',
      assignee: data.assignee || null,
      comments: []
    };
    this.issues.push(issue);
    return issue;
  }

  getIssues(page = 1, limit = 10) {
    const start = (page - 1) * limit;
    return this.issues.slice(start, start + limit);
  }

  getIssue(id) {
    return this.issues.find(i => i.id === parseInt(id, 10));
  }

  updateIssue(id, data) {
    const issue = this.getIssue(id);
    if (!issue) return null;
    Object.assign(issue, data);
    return issue;
  }

  addComment(issueId, comment) {
    const issue = this.getIssue(issueId);
    if (!issue) return null;
    issue.comments.push(comment);
    return comment;
  }
}

module.exports = InMemoryStore;
