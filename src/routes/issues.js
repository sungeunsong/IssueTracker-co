const express = require('express');
const router = express.Router();
const Issue = require('../models/issue');

// list issues with pagination
router.get('/', (req, res) => {
  const page = parseInt(req.query.page || '1', 10);
  const limit = 10;
  const issues = req.app.locals.store.getIssues(page, limit);
  res.render('issues', { issues, page });
});

// show create issue form
router.get('/new', (req, res) => {
  res.render('newIssue');
});

// create issue
router.post('/', (req, res) => {
  const store = req.app.locals.store;
  const issue = store.addIssue(new Issue(req.body));
  res.redirect('/issues/' + issue.id);
});

// view issue details
router.get('/:id', (req, res) => {
  const issue = req.app.locals.store.getIssue(req.params.id);
  if (!issue) return res.status(404).send('Issue not found');
  res.render('issueDetail', { issue });
});

// update issue (status or assignee)
router.post('/:id', (req, res) => {
  const store = req.app.locals.store;
  const update = {
    status: req.body.status,
    assignee: req.body.assignee
  };
  store.updateIssue(req.params.id, update);
  res.redirect('/issues/' + req.params.id);
});

// add comment
router.post('/:id/comments', (req, res) => {
  const store = req.app.locals.store;
  const comment = {
    author: req.body.author,
    text: req.body.text,
    createdAt: new Date()
  };
  store.addComment(req.params.id, comment);
  res.redirect('/issues/' + req.params.id);
});

module.exports = router;
