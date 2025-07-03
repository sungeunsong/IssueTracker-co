# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Korean-language Issue Tracker application similar to Jira, built with:
- **Backend**: Node.js/Express server with MongoDB
- **Frontend**: React/TypeScript with Vite
- **Database**: MongoDB with collections for issues, projects, users, versions, components, customers

## Development Commands

### Local Development
```bash
# Install dependencies
npm install

# Run development server (includes both frontend and backend)
npm run dev

# Frontend only (from frontend-issue-tracker/)
cd frontend-issue-tracker
npm run dev

# Backend only
npm start
```

### Docker Development
```bash
# Run with MongoDB using Docker Compose
docker-compose up --build

# Access at http://localhost:3000
```

### Code Quality
```bash
# Lint frontend code
cd frontend-issue-tracker
npm run lint

# Build frontend
cd frontend-issue-tracker
npm run build
```

## Architecture

### Full-Stack Structure
- **Monorepo**: Backend at root, React frontend in `frontend-issue-tracker/`
- **API Layer**: Express REST API with session-based authentication
- **Database**: MongoDB with automatic migrations on startup
- **File Uploads**: Multer handles attachments stored in `/uploads`

### Key Data Models
- **Issue**: Core entity with status workflow, comments, history, attachments
- **Project**: Container for issues with customizable statuses, priorities, types
- **User**: Authentication with admin/regular user roles
- **Version/Component/Customer**: Project metadata for issue categorization

### Frontend Architecture
- **React Router**: Client-side routing with protected routes
- **State Management**: React hooks with prop drilling (no global state library)
- **UI Components**: Headless UI + Heroicons with custom Tailwind styling
- **Forms**: Custom form components with validation
- **Views**: Board view (DnD Kit) and List view for issues

### Authentication Flow
- Session-based auth with Express sessions
- Protected API routes (except `/api/login`, `/api/current-user`)
- Auto-created admin user: `apadmin` / `0000`
- Frontend handles login state and redirects

### Issue Workflow
- **Statuses**: 열림 → 수정 중 → 수정 완료 → 검증 → 닫힘
- **Types**: 작업, 버그, 새 기능, 개선
- **Priorities**: HIGHEST, HIGH, MEDIUM, LOW, LOWEST
- **History**: Automatic tracking of all changes with timestamps

### Database Schema
- Issues linked to projects via `projectId`
- Automatic issue key generation (`{PROJECT_KEY}-{NUMBER}`)
- Migration logic runs on server startup
- MongoDB ObjectId mapped to string `id` in API responses

## File Organization

### Backend (`/`)
- `server.js`: Main Express server with all API routes
- `types.ts`: Shared TypeScript interfaces
- `uploads/`: File attachment storage

### Frontend (`/frontend-issue-tracker/src/`)
- `App.tsx`: Main application component with routing
- `types.ts`: Frontend-specific TypeScript interfaces
- `components/`: Reusable UI components
- `components/icons/`: Custom SVG icon components

### Key Components
- **IssueDetailPanel**: Side panel for issue details with edit capabilities
- **BoardView**: Kanban-style board with drag-and-drop
- **IssueList**: Table view with pagination and filtering
- **ProjectSettings**: Multi-tab settings for project configuration
- **RichTextEditor/Viewer**: HTML content editing for issue descriptions

## Development Notes

### Korean Language Support
- All UI text, statuses, and default values are in Korean
- Issue types: 작업, 버그, 새 기능, 개선
- Default statuses: 열림, 수정 중, 수정 완료, 검증, 닫힘, 원치 않음

### Project Settings
- Projects have toggleable `showComponents` and `showCustomers` flags
- Custom statuses, priorities, and types per project
- Version management with release tracking

### API Patterns
- RESTful endpoints under `/api/`
- Consistent error handling with Korean messages
- File uploads via multipart form data
- Session-based authentication middleware

### Data Migration
- Automatic migrations run on server startup
- Handles missing fields in existing documents
- Preserves backward compatibility

### Environment Variables
- `MONGODB_URI`: Database connection (default: mongodb://localhost:27017)
- `DB_NAME`: Database name (default: issuetracker)
- `SESSION_SECRET`: Session encryption key
- `UPLOAD_DIR`: File upload directory (default: ./uploads)
- `PORT`: Server port (default: 3000)