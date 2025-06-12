# Issue Tracker Prototype

This project is a simple issue tracker with a **Node.js** API backend and a **React** frontend. Data is stored in memory for now so you can test functionality without a database. You can later swap in a real database.


## Features

- User registration and login (no sessions yet)
- Create, view, update issues
- Assign users and change status
- Comment on issues
- Pagination for issue list

- React-based frontend separated from the backend

## Getting Started

### Backend

1. Install dependencies (requires internet access):
   ```bash
   npm install
   ```
2. Start the API server:
   ```bash
   npm start
   ```

### Frontend

1. In the `client` directory run:
   ```bash
   npm install
   npm start
   ```
   This starts a React development server on port 3001.
2. Navigate to `http://localhost:3001` to use the app.

## Future Improvements

- Replace the in-memory store with a database (e.g., MongoDB or an RDBMS)
- Add proper authentication sessions
- Support file attachments
- Issue labels and search
- Email notifications

