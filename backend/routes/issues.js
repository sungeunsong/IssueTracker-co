const express = require('express');
const router = express.Router();
const Issue = require('../models/issue');

// list issues with pagination
router.get('/', (req, res) => {
  const page = parseInt(req.query.page || '1', 10);
  const limit = 10;
  const issues = req.app.locals.store.getIssues(page, limit);
  res.json({ issues, page });
});

// show create issue form
// frontend will handle form rendering

// create issue
router.post('/', (req, res) => {
  const store = req.app.locals.store;
  const issue = store.addIssue(new Issue(req.body));
  res.json(issue);
});

// view issue details
router.get('/:id', (req, res) => {
  const issue = req.app.locals.store.getIssue(req.params.id);
  if (!issue) return res.status(404).json({ error: 'Issue not found' });
  res.json(issue);
});

// update issue (status or assignee)
router.post('/:id', (req, res) => {
  const store = req.app.locals.store;
  const update = {
    status: req.body.status,
    assignee: req.body.assignee
  };
  const issue = store.updateIssue(req.params.id, update);
  if (!issue) return res.status(404).json({ error: 'Issue not found' });
  res.json(issue);
});

// add comment
router.post('/:id/comments', (req, res) => {
  const store = req.app.locals.store;
  const comment = {
    author: req.body.author,
    text: req.body.text,
    createdAt: new Date()
  };
  const result = store.addComment(req.params.id, comment);
  if (!result) return res.status(404).json({ error: 'Issue not found' });
  res.json(result);
});

module.exports = router;
