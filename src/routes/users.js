const express = require('express');
const router = express.Router();
const User = require('../models/user');

router.post('/register', (req, res) => {
  const store = req.app.locals.store;
  const user = store.addUser(req.body.username, req.body.password);
  res.status(201).json(user);
});

router.post('/login', (req, res) => {
  const store = req.app.locals.store;
  const user = store.findUser(req.body.username);
  if (!user || user.password !== req.body.password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  // naive login: set user in locals (no session for simplicity)
  req.app.locals.currentUser = user;
  res.json({ message: 'Logged in' });
});

module.exports = router;
