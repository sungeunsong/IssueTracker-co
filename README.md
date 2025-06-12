# Issue Tracker Prototype

This project now separates the **backend** and **frontend**. The backend is implemented with **Node.js** and **Express** while the frontend is a small **React** app. Data is still stored in memory so you can test functionality without a database.

## Features

- User registration and login (no sessions yet)
- Create, view, update issues
- Assign users and change status
- Comment on issues
- Pagination for issue list
- React-based UI built with **Vite** under the `frontend` directory
1. Install backend dependencies (requires internet access):
2. Install and build the frontend:
   ```bash
   cd frontend
   npm install
   npm run build
   cd ..
   ```
3. Start the server from the project root:
4. Open `http://localhost:3000` in your browser.
## Getting Started

1. Install dependencies (requires internet access):
   ```bash

   npm install
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

