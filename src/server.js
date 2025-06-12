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
app.use(express.static(path.join(__dirname, '..', 'public')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.locals.store = new InMemoryStore();

app.use('/', userRoutes);
app.use('/issues', issueRoutes);

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
