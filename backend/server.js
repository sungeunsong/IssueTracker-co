const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

const InMemoryStore = require('./data/inMemoryStore');
const issueRoutes = require('./routes/issues');
const userRoutes = require('./routes/users');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// serve public assets (css, etc.) and React frontend
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(express.static(path.join(__dirname, '..', 'frontend', 'public')));


app.locals.store = new InMemoryStore();

app.use('/api/users', userRoutes);
app.use('/api/issues', issueRoutes);

// send the React application's HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
