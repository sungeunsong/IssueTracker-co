const express = require('express');
const router = express.Router();
const User = require('../models/user');

// forms are handled by frontend

router.post('/register', (req, res) => {
  const store = req.app.locals.store;
  store.addUser(req.body.username, req.body.password);
  res.json({ success: true });
});

router.post('/login', (req, res) => {
  const store = req.app.locals.store;
  const user = store.findUser(req.body.username);
  if (!user || user.password !== req.body.password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  req.app.locals.currentUser = user;
  res.json({ success: true });
});

module.exports = router;
