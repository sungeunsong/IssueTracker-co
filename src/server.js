const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const InMemoryStore = require('./data/inMemoryStore');
const issueRoutes = require('./routes/issues');
const userRoutes = require('./routes/users');


app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// serve React build files if present
app.use(express.static(path.join(__dirname, '..', 'client', 'build')));

app.locals.store = new InMemoryStore();

app.use('/api/users', userRoutes);
app.use('/api/issues', issueRoutes);

// react client routing support
app.get('*', (req, res, next) => {
  const indexPath = path.join(__dirname, '..', 'client', 'build', 'index.html');
  if (require('fs').existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    next();
  }
});


app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
