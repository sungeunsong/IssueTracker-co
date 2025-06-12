# Issue Tracker Prototype

This project is a simple issue tracker implemented with **Node.js** and **Express**. It stores data in memory so you can test functionality without a database. You can later replace the in-memory store with a real database.

## Features

- User registration and login (no sessions yet)
- Create, view, update issues
- Assign users and change status
- Comment on issues
- Pagination for issue list
- Simple EJS-based UI with modern styling

## Getting Started

1. Install dependencies (requires internet access):
   ```bash
   npm install express body-parser ejs
   ```
2. Start the server:
   ```bash
   npm start
   ```
3. Open `http://localhost:3000` in your browser.

## Future Improvements

- Replace the in-memory store with a database (e.g., MongoDB or an RDBMS)
- Add proper authentication sessions
- Support file attachments
- Issue labels and search
- Email notifications

