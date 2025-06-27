import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import IssueDetailPage from './IssueDetailPage';
import ProjectSettingsPage from './ProjectSettingsPage';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/issues/:issueKey" element={<IssueDetailPage />} />
        <Route path="/projects/:projectId/settings" element={<ProjectSettingsPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
