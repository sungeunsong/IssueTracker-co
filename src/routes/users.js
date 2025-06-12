const express = require('express');
const router = express.Router();
const User = require('../models/user');

// login form
router.get('/login', (req, res) => {
  res.render('login');
});

// register form
router.get('/register', (req, res) => {
  res.render('register');
});

router.post('/register', (req, res) => {
  const store = req.app.locals.store;
  store.addUser(req.body.username, req.body.password);
  res.redirect('/login');
});

router.post('/login', (req, res) => {
  const store = req.app.locals.store;
  const user = store.findUser(req.body.username);
  if (!user || user.password !== req.body.password) {
    return res.render('login', { error: 'Invalid credentials' });
  }
  // naive login: set user in locals (no session for simplicity)
  req.app.locals.currentUser = user;
  res.redirect('/issues');
});

module.exports = router;
