class Issue {
  constructor({ title, description, status = 'open', assignee = null }) {
    this.title = title;
    this.description = description;
    this.status = status;
    this.assignee = assignee;
    this.comments = [];
  }
}
module.exports = Issue;
