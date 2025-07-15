import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { IssueForm } from "./components/IssueForm";
import { IssueList } from "./components/IssueList";
import { ConfirmationModal } from "./components/ConfirmationModal";
import { Modal } from "./components/Modal";
import { Sidebar } from "./components/Sidebar";
import { ProjectForm } from "./components/ProjectForm";
import { LoginForm } from "./components/LoginForm";
import { RegisterForm } from "./components/RegisterForm";
import TopBar from "./components/TopBar";
import { FilterBar } from "./components/FilterBar";
import { BoardView } from "./components/BoardView";
import { IssueDetailPanel } from "./components/IssueDetailPanel";
import ResolveIssueModal from "./components/ResolveIssueModal";
import { UserSettingsPage } from "./pages/UserSettingsPage";
import ProjectVersions from "./components/ProjectVersions";
import ProjectComponents from "./components/ProjectComponents";
import type {
  Issue,
  ResolutionStatus as StatusEnum,
  IssuePriority as PriorityEnum,
  Project,
  User,
  Notification,
} from "./types";
import { DEFAULT_ISSUE_TYPES, DEFAULT_PRIORITIES } from "./types";
import { LoginScreen } from "./components/LoginScreen";
import NotificationList from "./components/NotificationList";

const ITEMS_PER_PAGE_LIST = 10;

export type IssueFormData = {
  title: string;
  content: string;
  reporter: string;
  assignee?: string;
  comment?: string;
  status?: StatusEnum; // Only for edit
  type: string; // New, mandatory
  priority: PriorityEnum;
  component?: string;
  customer?: string;
  affectsVersion?: string; // New
  fixVersion?: string; // New, only for edit
  projectId: string;
  attachments?: File[];
};

export type ViewMode = "board" | "list";
export type TabMode = "issues" | "releases" | "components";

const MainContent: React.FC<{
  isAuthenticated: boolean;
  isLoading: boolean;
  issues: Issue[];
  viewMode: ViewMode;
  setViewMode: React.Dispatch<React.SetStateAction<ViewMode>>;
  tabMode: TabMode;
  setTabMode: React.Dispatch<React.SetStateAction<TabMode>>;
  projects: Project[];
  currentProjectId: string | null;
  handleSelectProject: (id: string) => void;
  isAdmin: boolean;
  adminProjectIds: string[];
  handleOpenProjectSettings: (pid: string) => void;
  error: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  showAddProjectModal: boolean;
  setShowAddProjectModal: React.Dispatch<React.SetStateAction<boolean>>;
  boardColumns: any[];
  handleSelectIssueForDetail: (issue: Issue | null) => void;
  updateIssueStatus: (issueId: string, newStatus: StatusEnum) => void;
  users: User[];
  currentProject: Project | null;
  paginatedListIssues: Issue[];
  requestDeleteIssue: (issueId: string) => void;
  handleOpenEditModal: (issue: Issue) => void;
  currentPage: number;
  baseFilteredIssues: Issue[];
  handlePageChange: (newPage: number) => void;
  selectedIssueForDetail: Issue | null;
  closeDetailPanel: () => void;
  handleIssueUpdated: (updated: Issue) => void;
  showAddIssueModal: boolean;
  setShowAddIssueModal: React.Dispatch<React.SetStateAction<boolean>>;
  handleAddIssue: (formData: IssueFormData) => Promise<void>;
  isSubmitting: boolean;
  currentUserId: string | null;
  currentUser: User | null;
  showEditIssueModal: boolean;
  handleCloseEditModal: () => void;
  selectedIssueForEdit: Issue | null;
  handleEditIssue: (issueId: string, formData: IssueFormData) => Promise<void>;
  issueToDelete: string | null;
  showDeleteModal: boolean;
  confirmDeleteIssue: () => Promise<void>;
  cancelDeleteIssue: () => void;
  issueToResolve: Issue | null;
  showResolveModal: boolean;
  setShowResolveModal: React.Dispatch<React.SetStateAction<boolean>>;
  handleResolveIssue: (data: {
    assignee?: string;
    resolution: string;
    fixVersion?: string;
    attachments: File[];
    comment?: string;
  }) => Promise<void>;
  handleLoginSuccess: () => Promise<void>;
  showLoginModal: boolean;
  setShowLoginModal: React.Dispatch<React.SetStateAction<boolean>>;
  handleLogin: (userid: string, password: string) => Promise<void>;
  showRegisterModal: boolean;
  setShowRegisterModal: React.Dispatch<React.SetStateAction<boolean>>;
  handleRegister: (formData: any) => Promise<void>;
  handleLogout: () => Promise<void>;
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  statusFilter: StatusEnum | "ALL";
  setStatusFilter: React.Dispatch<React.SetStateAction<StatusEnum | "ALL">>;
  assigneeFilter: string | "ALL";
  setAssigneeFilter: React.Dispatch<React.SetStateAction<string | "ALL">>;
  reporterFilter: string | "ALL";
  setReporterFilter: React.Dispatch<React.SetStateAction<string | "ALL">>;
  typeFilter: string | "ALL";
  setTypeFilter: React.Dispatch<React.SetStateAction<string | "ALL">>;
  priorityFilter: string | "ALL";
  setPriorityFilter: React.Dispatch<React.SetStateAction<string | "ALL">>;
  handleAddProject: (name: string, key: string) => Promise<void>;
  notifications: Notification[];
  showNotifications: boolean;
  hasUnread: boolean;
  handleToggleNotifications: () => void;
  handleReadNotification: (id: string) => Promise<void>;
  onToggleSidebar: () => void; // 추가
  setShowNotifications: (flag: boolean) => void;
  setIssueToResolve: (issue: Issue | null) => void;
  isSidebarOpen: boolean;
}> = ({
  isAuthenticated,
  isLoading,
  issues,
  viewMode,
  setViewMode,
  tabMode,
  setTabMode,
  projects,
  currentProjectId,
  handleSelectProject,
  isAdmin,
  adminProjectIds,
  handleOpenProjectSettings,
  error,
  setError,
  showAddProjectModal,
  setShowAddProjectModal,
  boardColumns,
  handleSelectIssueForDetail,
  updateIssueStatus,
  users,
  currentProject,
  paginatedListIssues,
  requestDeleteIssue,
  handleOpenEditModal,
  currentPage,
  baseFilteredIssues,
  handlePageChange,
  selectedIssueForDetail,
  closeDetailPanel,
  handleIssueUpdated,
  showAddIssueModal,
  setShowAddIssueModal,
  handleAddIssue,
  isSubmitting,
  currentUserId,
  currentUser,
  showEditIssueModal,
  handleCloseEditModal,
  selectedIssueForEdit,
  handleEditIssue,
  issueToDelete,
  showDeleteModal,
  confirmDeleteIssue,
  cancelDeleteIssue,
  issueToResolve,
  showResolveModal,
  setShowResolveModal,
  handleResolveIssue,
  handleLoginSuccess,
  showLoginModal,
  setShowLoginModal,
  handleLogin,
  showRegisterModal,
  setShowRegisterModal,
  handleRegister,
  handleLogout,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  assigneeFilter,
  setAssigneeFilter,
  reporterFilter,
  setReporterFilter,
  typeFilter,
  setTypeFilter,
  priorityFilter,
  setPriorityFilter,
  handleAddProject,
  notifications,
  showNotifications,
  hasUnread,
  handleToggleNotifications,
  handleReadNotification,
  onToggleSidebar,
  setShowNotifications,
  setIssueToResolve,
  isSidebarOpen,
}) => {
  // 로딩 중일 때는 로딩 화면 표시
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-600 font-medium">로딩 중...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans">
      <Sidebar
        currentView={viewMode}
        onSetViewMode={setViewMode}
        projects={projects}
        currentProjectId={currentProjectId}
        onSelectProject={handleSelectProject}
        isAdmin={isAdmin}
        adminProjectIds={adminProjectIds}
        onOpenProjectSettings={handleOpenProjectSettings}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={onToggleSidebar}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          currentView={viewMode}
          onSetViewMode={setViewMode}
          onCreateIssue={() => {
            setShowAddIssueModal(true);
            setError(null);
          }}
          currentUser={currentUser}
          isAdmin={isAdmin}
          onRequestLogout={handleLogout}
          onRequestRegister={() => {
            setShowRegisterModal(true);
            setError(null);
          }}
          hasUnreadNotifications={hasUnread}
          onToggleNotifications={handleToggleNotifications}
          onToggleSidebar={onToggleSidebar}
          user={currentUser}
          onCreateProject={() => {
            setShowAddProjectModal(true);
            setError(null);
          }}
        />
        {/* <FilterBar
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          statuses={currentProject?.statuses || []}
          assigneeFilter={assigneeFilter}
          onAssigneeFilterChange={setAssigneeFilter}
          reporterFilter={reporterFilter}
          onReporterFilterChange={setReporterFilter}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
          priorityFilter={priorityFilter}
          onPriorityFilterChange={setPriorityFilter}
          users={users}
          types={currentProject?.types || []}
          priorities={currentProject?.priorities || []}
        /> */}
        <main className="flex-1 overflow-x-auto overflow-y-auto bg-gray-50 p-6">
          {error && (
            <div
              className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg shadow-sm"
              role="alert"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold">오류:</p>
                  <p className="text-sm">{error}</p>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="text-red-600 hover:text-red-800"
                  aria-label="오류 메시지 닫기"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                </button>
              </div>
            </div>
          )}

          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-6">
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-4xl">📁</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  프로젝트가 없습니다
                </h3>
                <p className="text-gray-600 mb-6">
                  새 프로젝트를 생성하여 이슈 추적을 시작하세요.
                </p>
                <button
                  onClick={() => {
                    setShowAddProjectModal(true);
                    setError(null);
                  }}
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                >
                  <span>+</span>
                  <span>프로젝트 생성</span>
                </button>
              </div>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="text-gray-600 font-medium">
                  이슈 로딩 중...
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
              {/* 검색 및 필터 영역 */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    {/* 현재 선택된 프로젝트 표시 */}
                    {currentProject && (
                      <div className="flex items-center space-x-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md font-medium border border-blue-200">
                        <span className="text-blue-600">📁</span>
                        <span>{currentProject.name}</span>
                      </div>
                    )}

                    {/* 검색창 */}
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="이슈 검색..."
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg
                          className="h-5 w-5 text-gray-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* <div className="flex items-center space-x-2">
                    <select className="text-sm border border-gray-300 rounded-md px-3 py-2 bg-white">
                      <option>상태</option>
                      {boardColumns.map((column) => (
                        <option key={column.id} value={column.id}>
                          {column.title}
                        </option>
                      ))}
                    </select>
                    <select className="text-sm border border-gray-300 rounded-md px-3 py-2 bg-white">
                      <option>담당자</option>
                      {users.map((user) => (
                        <option key={user.userid} value={user.userid}>
                          {user.username}
                        </option>
                      ))}
                    </select>
                    <select className="text-sm border border-gray-300 rounded-md px-3 py-2 bg-white">
                      <option>보고자</option>
                      {users.map((user) => (
                        <option key={user.userid} value={user.userid}>
                          {user.username}
                        </option>
                      ))}
                    </select>
                    <select className="text-sm border border-gray-300 rounded-md px-3 py-2 bg-white">
                      <option>버전</option>
                    </select>
                  </div> */}
                  <FilterBar
                    searchTerm={searchTerm}
                    onSearchTermChange={setSearchTerm}
                    statusFilter={statusFilter}
                    onStatusFilterChange={setStatusFilter}
                    statuses={currentProject?.statuses || []}
                    assigneeFilter={assigneeFilter}
                    onAssigneeFilterChange={setAssigneeFilter}
                    reporterFilter={reporterFilter}
                    onReporterFilterChange={setReporterFilter}
                    typeFilter={typeFilter}
                    onTypeFilterChange={setTypeFilter}
                    priorityFilter={priorityFilter}
                    onPriorityFilterChange={setPriorityFilter}
                    users={users}
                    types={currentProject?.types || []}
                    priorities={currentProject?.priorities || []}
                  />
                </div>

                {/* 탭과 View 전환 영역 */}
                <div className="flex items-center justify-between">
                  {/* 좌측: 탭들 */}
                  <div className="flex space-x-6">
                    <button 
                      onClick={() => setTabMode("issues")}
                      className={`pb-2 border-b-2 font-medium ${
                        tabMode === "issues" 
                          ? "border-blue-500 text-blue-600" 
                          : "border-transparent text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      모든 업무
                    </button>
                    <button 
                      onClick={() => setTabMode("releases")}
                      className={`pb-2 border-b-2 font-medium ${
                        tabMode === "releases" 
                          ? "border-blue-500 text-blue-600" 
                          : "border-transparent text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      릴리즈
                    </button>
                    <button 
                      onClick={() => setTabMode("components")}
                      className={`pb-2 border-b-2 font-medium ${
                        tabMode === "components" 
                          ? "border-blue-500 text-blue-600" 
                          : "border-transparent text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      컴포넌트
                    </button>
                  </div>

                  {/* 우측: View 전환 Segmented Control - 이슈 탭에서만 보이도록 */}
                  {tabMode === "issues" && (
                    <div className="flex items-center space-x-2">
                      <div className="flex bg-gray-100 rounded-lg p-1">
                        <button
                          onClick={() => setViewMode("board")}
                          className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                            viewMode === "board"
                              ? "bg-white text-gray-900 shadow-sm"
                              : "text-gray-600 hover:text-gray-900"
                          }`}
                        >
                          <svg
                            className="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span>보드</span>
                        </button>
                        <button
                          onClick={() => setViewMode("list")}
                          className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                            viewMode === "list"
                              ? "bg-white text-gray-900 shadow-sm"
                              : "text-gray-600 hover:text-gray-900"
                          }`}
                        >
                          <svg
                            className="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M3 4a1 1 0 000 2h.01a1 1 0 100-2H3zM6 4a1 1 0 000 2h11a1 1 0 100-2H6zM3 10a1 1 0 100 2h.01a1 1 0 100-2H3zM6 10a1 1 0 100 2h11a1 1 0 100-2H6zM3 16a1 1 0 100 2h.01a1 1 0 100-2H3zM6 16a1 1 0 100 2h11a1 1 0 100-2H6z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span>리스트</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 컨텐츠 영역 */}
              <div className="flex-1 overflow-hidden">
                {tabMode === "issues" && (
                  <>
                    {viewMode === "board" && (
                      <BoardView
                        columns={boardColumns}
                        onSelectIssue={handleSelectIssueForDetail}
                        onUpdateStatus={updateIssueStatus}
                        users={users}
                        project={currentProject}
                      />
                    )}
                    {viewMode === "list" && (
                      <div className="h-full overflow-y-auto">
                        <IssueList
                          issues={paginatedListIssues}
                          onUpdateStatus={updateIssueStatus}
                          onDeleteIssue={requestDeleteIssue}
                          onViewIssue={handleSelectIssueForDetail}
                          onEditIssue={handleOpenEditModal}
                          currentPage={currentPage}
                          totalIssues={baseFilteredIssues.length}
                          itemsPerPage={ITEMS_PER_PAGE_LIST}
                          onPageChange={handlePageChange}
                          users={users}
                          statuses={currentProject?.statuses || []}
                          project={currentProject}
                        />
                      </div>
                    )}
                  </>
                )}
                {tabMode === "releases" && currentProject && (
                  <div className="h-full overflow-y-auto p-6">
                    <ProjectVersions 
                      projectId={currentProject.id} 
                      users={users} 
                      currentUserId={currentUserId} 
                    />
                  </div>
                )}
                {tabMode === "components" && currentProject && (
                  <div className="h-full overflow-y-auto p-6">
                    <ProjectComponents 
                      projectId={currentProject.id} 
                      users={users} 
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {selectedIssueForDetail && (
        <IssueDetailPanel
          issue={selectedIssueForDetail}
          onClose={closeDetailPanel}
          onEditIssue={() => handleOpenEditModal(selectedIssueForDetail)}
          onDeleteIssue={() => requestDeleteIssue(selectedIssueForDetail.id)}
          onUpdateStatus={updateIssueStatus}
          users={users}
          onIssueUpdated={handleIssueUpdated}
          statuses={
            projects.find((p) => p.id === selectedIssueForDetail.projectId)
              ?.statuses || []
          }
          types={
            projects.find((p) => p.id === selectedIssueForDetail.projectId)
              ?.types || []
          }
          priorities={
            projects.find((p) => p.id === selectedIssueForDetail.projectId)
              ?.priorities || []
          }
          showCustomers={currentProject?.showCustomers}
          showComponents={currentProject?.showComponents}
        />
      )}

      <Modal
        isOpen={showAddIssueModal}
        onClose={() => {
          setShowAddIssueModal(false);
          setError(null);
        }}
        title="새 이슈 생성"
      >
        <IssueForm
          onSubmit={handleAddIssue}
          onCancel={() => {
            setShowAddIssueModal(false);
            setError(null);
          }}
          isSubmitting={isSubmitting}
          submitButtonText="이슈 추가"
          projects={projects}
          selectedProjectId={currentProjectId}
          users={users}
          currentUserId={currentUserId}
          currentUserName={currentUser?.username}
          statuses={currentProject?.statuses || []}
          priorities={currentProject?.priorities || DEFAULT_PRIORITIES}
          types={currentProject?.types || DEFAULT_ISSUE_TYPES}
          components={currentProject?.components || []}
          customers={currentProject?.customers || []}
          showCustomers={currentProject?.showCustomers}
          showComponents={currentProject?.showComponents}
        />
      </Modal>

      <Modal
        isOpen={showAddProjectModal}
        onClose={() => {
          setShowAddProjectModal(false);
          setError(null);
        }}
        title="새 프로젝트 생성"
      >
        <ProjectForm
          onSubmit={handleAddProject}
          onCancel={() => {
            setShowAddProjectModal(false);
            setError(null);
          }}
          isSubmitting={isSubmitting}
        />
      </Modal>

      {selectedIssueForEdit && (
        <Modal
          isOpen={showEditIssueModal}
          onClose={handleCloseEditModal}
          title="이슈 수정"
        >
          <IssueForm
            onSubmit={(formData) =>
              handleEditIssue(selectedIssueForEdit.id, formData)
            }
            initialData={selectedIssueForEdit}
            onCancel={handleCloseEditModal}
            isSubmitting={isSubmitting}
            submitButtonText="변경사항 저장"
            isEditMode={true}
            projects={projects}
            selectedProjectId={selectedIssueForEdit.projectId}
            users={users}
            currentUserId={currentUserId}
            currentUserName={currentUser?.username}
            statuses={
              projects.find((p) => p.id === selectedIssueForEdit.projectId)
                ?.statuses || []
            }
            priorities={
              projects.find((p) => p.id === selectedIssueForEdit.projectId)
                ?.priorities || DEFAULT_PRIORITIES
            }
            types={
              projects.find((p) => p.id === selectedIssueForEdit.projectId)
                ?.types || DEFAULT_ISSUE_TYPES
            }
            components={
              projects.find((p) => p.id === selectedIssueForEdit.projectId)
                ?.components || []
            }
            customers={
              projects.find((p) => p.id === selectedIssueForEdit.projectId)
                ?.customers || []
            }
            showCustomers={
              projects.find((p) => p.id === selectedIssueForEdit.projectId)
                ?.showCustomers
            }
            showComponents={
              projects.find((p) => p.id === selectedIssueForEdit.projectId)
                ?.showComponents
            }
          />
        </Modal>
      )}

      {showDeleteModal && issueToDelete && (
        <ConfirmationModal
          title="삭제 확인"
          message={`정말로 이슈 "${
            issues
              .find((i) => i.id === issueToDelete)
              ?.title.substring(0, 30) ?? "선택된 이슈"
          }..."을(를) 삭제하시겠습니까?`}
          onConfirm={confirmDeleteIssue}
          onCancel={cancelDeleteIssue}
          confirmText="삭제"
          cancelText="취소"
        />
      )}

      <Modal
        isOpen={showLoginModal}
        onClose={() => {
          setShowLoginModal(false);
          setError(null);
        }}
        title="로그인"
      >
        <LoginForm
          onSubmit={handleLogin}
          onCancel={() => {
            setShowLoginModal(false);
            setError(null);
          }}
          isSubmitting={isSubmitting}
        />
      </Modal>

      <Modal
        isOpen={showRegisterModal}
        onClose={() => {
          setShowRegisterModal(false);
          setError(null);
        }}
        title="회원가입"
      >
        <RegisterForm
          onSubmit={handleRegister}
          onCancel={() => {
            setShowRegisterModal(false);
            setError(null);
          }}
          isSubmitting={isSubmitting}
        />
      </Modal>

      {issueToResolve && (
        <ResolveIssueModal
          isOpen={showResolveModal}
          onClose={() => {
            setShowResolveModal(false);
            setIssueToResolve(null);
          }}
          onSubmit={handleResolveIssue}
          projectId={issueToResolve.projectId}
          users={users}
          resolutions={
            projects.find((p) => p.id === issueToResolve.projectId)
              ?.resolutions || []
          }
          initialAssignee={issueToResolve.assignee}
        />
      )}

      {showNotifications && (
        <NotificationList
          notifications={notifications}
          onClose={() => setShowNotifications(false)}
          onRead={handleReadNotification}
        />
      )}
    </div>
  );
};

const App: React.FC = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<ViewMode>("board");
  const [tabMode, setTabMode] = useState<TabMode>("issues");
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [adminProjectIds, setAdminProjectIds] = useState<string[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedIssueForDetail, setSelectedIssueForDetail] =
    useState<Issue | null>(null);

  const [isSidebarOpen, setSidebarOpen] = useState(true);

  const onToggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  const currentProject = useMemo(
    () => projects.find((p) => p.id === currentProjectId) || null,
    [projects, currentProjectId]
  );

  const [showAddIssueModal, setShowAddIssueModal] = useState(false);
  const [showEditIssueModal, setShowEditIssueModal] = useState(false);
  const [selectedIssueForEdit, setSelectedIssueForEdit] =
    useState<Issue | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [issueToDelete, setIssueToDelete] = useState<string | null>(null);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [issueToResolve, setIssueToResolve] = useState<Issue | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusEnum | "ALL">("ALL");
  const [assigneeFilter, setAssigneeFilter] = useState<string | "ALL">("ALL");
  const [reporterFilter, setReporterFilter] = useState<string | "ALL">("ALL");
  const [typeFilter, setTypeFilter] = useState<string | "ALL">("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string | "ALL">("ALL");

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const hasUnread = useMemo(
    () => notifications.some((n) => !n.read),
    [notifications]
  );

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", { credentials: "include" });
      if (!res.ok) {
        throw new Error("알림 정보를 불러오는데 실패했습니다.");
      }
      const data: Notification[] = await res.json();
      setNotifications(data);
    } catch (err) {
      console.error("알림 로딩 중 오류:", err);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/users", { credentials: "include" });
      console.log(res);
      if (!res.ok) {
        throw new Error(
          `사용자 정보를 불러오는데 실패했습니다: ${res.statusText}`
        );
      }
      const data: User[] = await res.json();
      setUsers(data);
    } catch (err) {
      console.error("사용자 로딩 중 오류:", err);
    }
  }, []);

  const handleToggleNotifications = () => {
    setShowNotifications((prev) => !prev);
  };

  const handleReadNotification = useCallback(async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: "POST",
        credentials: "include",
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error("알림 읽음 처리 중 오류:", err);
    }
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch("/api/current-user", {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setIsAuthenticated(true);
          setCurrentUser(data);
          setCurrentUserId(data.userid);
          setIsAdmin(!!data.isAdmin);
          setAdminProjectIds(data.adminProjectIds || []);
          fetchUsers();
          fetchNotifications();
          setIsLoading(false); // 인증 성공 시 로딩 상태 해제
        } else {
          setIsAuthenticated(false);
          setIsLoading(false);
          setCurrentUser(null);
          setCurrentUserId(null);
          setIsAdmin(false);
        }
      } catch (err) {
        console.error("세션 확인 오류:", err);
        setIsAuthenticated(false);
        setIsLoading(false);
        setIsAdmin(false);
      }
    };
    checkSession();
  }, [fetchUsers]);

  const fetchIssues = useCallback(async () => {
    if (!currentProjectId) {
      setIsLoading(false);
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      queryParams.append("projectId", currentProjectId);
      if (statusFilter !== "ALL") queryParams.append("status", statusFilter);
      if (assigneeFilter !== "ALL")
        queryParams.append("assignee", assigneeFilter);
      if (reporterFilter !== "ALL")
        queryParams.append("reporter", reporterFilter);
      if (typeFilter !== "ALL") queryParams.append("type", typeFilter);
      if (priorityFilter !== "ALL")
        queryParams.append("priority", priorityFilter);

      const response = await fetch(`/api/issues?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error(
          `데이터를 불러오는데 실패했습니다: ${response.statusText}`
        );
      }
      const data: Issue[] = await response.json();
      setIssues(data);
    } catch (err) {
      console.error("이슈 로딩 중 오류:", err);
      setError((err as Error).message || "알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [
    currentProjectId,
    statusFilter,
    assigneeFilter,
    reporterFilter,
    typeFilter,
    priorityFilter,
  ]);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch("/api/projects");
      if (!res.ok) {
        throw new Error(
          `프로젝트 정보를 불러오는데 실패했습니다: ${res.statusText}`
        );
      }
      const data: Project[] = await res.json();
      setProjects(data);
    } catch (err) {
      console.error("프로젝트 로딩 중 오류:", err);
      setProjects([]);
    }
  }, []);

  const handleRegister = useCallback(
    async (formData: any) => {
      setIsSubmitting(true);
      try {
        const res = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (!res.ok) {
          const errData = await res
            .json()
            .catch(() => ({ message: "회원가입 실패" }));
          throw new Error(errData.message || res.statusText);
        }
        setShowRegisterModal(false);
        fetchUsers();
      } catch (err) {
        console.error("회원가입 오류:", err);
        setError((err as Error).message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [fetchUsers]
  );

  const handleLoginSuccess = useCallback(async () => {
    setError(null); // 이전 오류 메시지 제거
    try {
      const res = await fetch("/api/current-user", {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data);
        setCurrentUserId(data.userid);
        setIsAdmin(!!data.isAdmin);
        setAdminProjectIds(data.adminProjectIds || []);
        await fetchUsers();
        fetchNotifications(); // 로그인 성공 시 알림 가져오기
        setIsAuthenticated(true); // 이 상태 변경이 프로젝트 및 이슈 로딩을 트리거합니다.
      } else {
        setIsAuthenticated(false);
        setIsAdmin(false);
        throw new Error("로그인 후 사용자 정보를 가져오는데 실패했습니다.");
      }
    } catch (err) {
      console.error("로그인 성공 후 처리 오류:", err);
      setError((err as Error).message);
      setIsAuthenticated(false);
      setIsAdmin(false);
    }
  }, [fetchUsers]);

  const handleLogin = useCallback(
    async (userid: string, password: string) => {
      setIsSubmitting(true);
      setError(null);
      try {
        const res = await fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ userid, password }),
        });
        if (!res.ok) {
          const errData = await res
            .json()
            .catch(() => ({ message: "로그인 실패" }));
          throw new Error(errData.message || res.statusText);
        }
        setShowLoginModal(false);
        await handleLoginSuccess();
      } catch (err) {
        console.error("로그인 오류:", err);
        setError((err as Error).message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [handleLoginSuccess]
  );

  const handleLogout = useCallback(async () => {
    try {
      await fetch("/api/logout", { method: "POST", credentials: "include" });
    } catch (err) {
      console.error("로그아웃 오류:", err);
    } finally {
      setIsAuthenticated(false);
      setIssues([]);
      setSelectedIssueForDetail(null);
      setSearchTerm("");
      setStatusFilter("ALL");
      setCurrentPage(1);
      setError(null);
      setCurrentUser(null);
      setCurrentUserId(null);
      setIsAdmin(false);
      setUsers([]);
    }
  }, []);

  const handleSelectProject = (id: string) => {
    // 같은 프로젝트를 다시 선택한 경우 아무것도 하지 않음
    if (currentProjectId === id) {
      return;
    }
    setIssues([]);
    setCurrentProjectId(id);
  };

  const handleOpenProjectSettings = (pid: string) => {
    const project = projects.find((p) => p.id === pid);
    navigate(`/projects/${pid}/settings`, {
      state: { projectName: project?.name },
    });
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchProjects();
    }
  }, [isAuthenticated, fetchProjects]);

  useEffect(() => {
    if (projects.length > 0 && !currentProjectId) {
      setCurrentProjectId(projects[0].id);
    }
  }, [projects, currentProjectId]);

  useEffect(() => {
    if (currentProjectId && isAuthenticated) {
      fetchIssues();
    }
  }, [currentProjectId, fetchIssues, isAuthenticated]);

  const baseFilteredIssues = useMemo(() => {
    let tempIssues = issues;

    if (statusFilter !== "ALL") {
      tempIssues = tempIssues.filter(
        (issue) => issue.statusId === statusFilter
      );
    }
    if (assigneeFilter !== "ALL") {
      tempIssues = tempIssues.filter(
        (issue) => issue.assignee === assigneeFilter
      );
    }
    if (reporterFilter !== "ALL") {
      tempIssues = tempIssues.filter(
        (issue) => issue.reporter === reporterFilter
      );
    }
    if (typeFilter !== "ALL") {
      tempIssues = tempIssues.filter((issue) => issue.typeId === typeFilter);
    }
    if (priorityFilter !== "ALL") {
      tempIssues = tempIssues.filter(
        (issue) => issue.priorityId === priorityFilter
      );
    }

    if (searchTerm.trim()) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      tempIssues = tempIssues.filter(
        (issue) =>
          issue.title.toLowerCase().includes(lowerSearchTerm) ||
          issue.content.toLowerCase().includes(lowerSearchTerm) ||
          issue.reporter.toLowerCase().includes(lowerSearchTerm) ||
          (issue.assignee &&
            issue.assignee.toLowerCase().includes(lowerSearchTerm)) ||
          (issue.comment &&
            issue.comment.toLowerCase().includes(lowerSearchTerm)) ||
          issue.issueKey.toLowerCase().includes(lowerSearchTerm) || // Search by issueKey
          (issue.affectsVersion &&
            issue.affectsVersion.toLowerCase().includes(lowerSearchTerm)) ||
          (issue.fixVersion &&
            issue.fixVersion.toLowerCase().includes(lowerSearchTerm))
      );
    }
    return tempIssues;
  }, [
    issues,
    searchTerm,
    statusFilter,
    assigneeFilter,
    reporterFilter,
    typeFilter,
    priorityFilter,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, issues.length]);

  const handleAddIssue = useCallback(
    async (formData: IssueFormData) => {
      setError(null);
      setIsSubmitting(true);
      try {
        const { fixVersion, attachments, ...addData } = formData;
        if (!currentProjectId)
          throw new Error("프로젝트가 선택되지 않았습니다.");
        addData.projectId = currentProjectId;
        const body = new FormData();
        Object.entries(addData).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            body.append(key, String(value));
          }
        });
        (attachments || []).forEach((file) => body.append("files", file));
        const response = await fetch("/api/issues", {
          method: "POST",
          body,
        });
        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({ message: "이슈 추가에 실패했습니다." }));
          throw new Error(
            errorData.message ||
              `이슈 추가에 실패했습니다: ${response.statusText}`
          );
        }
        await fetchIssues(); // Refetch all issues
        setShowAddIssueModal(false);
      } catch (err) {
        console.error("이슈 추가 중 오류:", err);
        setError(
          (err as Error).message ||
            "이슈 추가 중 알 수 없는 오류가 발생했습니다."
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [fetchIssues, currentProjectId]
  );

  const handleAddProject = useCallback(
    async (name: string, key: string) => {
      setIsSubmitting(true);
      try {
        const response = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, key }),
        });
        if (!response.ok) {
          const errData = await response
            .json()
            .catch(() => ({ message: "프로젝트 생성 실패" }));
          throw new Error(errData.message || response.statusText);
        }
        const created: Project = await response.json();
        await fetchProjects();
        await handleLoginSuccess(); // Refresh user's project admin permissions
        setCurrentProjectId(created.id);
        setShowAddProjectModal(false);
      } catch (err) {
        console.error("프로젝트 생성 중 오류:", err);
        setError((err as Error).message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [fetchProjects]
  );

  const handleEditIssue = useCallback(
    async (issueId: string, formData: IssueFormData) => {
      setError(null);
      setIsSubmitting(true);
      try {
        const { attachments, ...rest } = formData;
        const body = new FormData();
        Object.entries(rest).forEach(([k, v]) => {
          if (v !== undefined && v !== null) body.append(k, String(v));
        });
        (attachments || []).forEach((f) => body.append("files", f));
        const response = await fetch(`/api/issues/${issueId}`, {
          method: "PUT",
          body,
        });
        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({ message: "이슈 수정에 실패했습니다." }));
          throw new Error(
            errorData.message ||
              `이슈 수정에 실패했습니다: ${response.statusText}`
          );
        }
        const updatedIssueFromServer: Issue = await response.json();
        setIssues((prevIssues) =>
          prevIssues.map((issue) =>
            issue.id === updatedIssueFromServer.id
              ? updatedIssueFromServer
              : issue
          )
        );

        if (selectedIssueForDetail?.id === issueId) {
          setSelectedIssueForDetail(updatedIssueFromServer);
        }
        setShowEditIssueModal(false);
        setSelectedIssueForEdit(null);
      } catch (err) {
        console.error("이슈 수정 중 오류:", err);
        setError(
          (err as Error).message ||
            "이슈 수정 중 알 수 없는 오류가 발생했습니다."
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [fetchIssues, selectedIssueForDetail]
  );

  const updateIssueStatus = useCallback(
    (issueId: string, newStatus: StatusEnum) => {
      const issueToUpdate = issues.find((issue) => issue.id === issueId);
      if (!issueToUpdate || issueToUpdate.status === newStatus) return;

      if (newStatus === "수정 완료") {
        setIssueToResolve(issueToUpdate);
        setShowResolveModal(true);
        return;
      }

      setError(null);
      const originalIssues = [...issues];
      setIssues((prevIssues) =>
        prevIssues.map((issue) =>
          issue.id === issueId ? { ...issue, status: newStatus } : issue
        )
      );
      fetch(`/api/issues/${issueId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
        .then(async (response) => {
          if (!response.ok) {
            const errorData = await response
              .json()
              .catch(() => ({ message: "이슈 상태 업데이트에 실패했습니다." }));
            throw new Error(
              errorData.message ||
                `이슈 상태 업데이트에 실패했습니다: ${response.statusText}`
            );
          }
          return response.json();
        })
        .then((updatedIssueFromServer: Issue) => {
          setIssues((prevIssues) =>
            prevIssues.map((issue) =>
              issue.id === updatedIssueFromServer.id
                ? updatedIssueFromServer
                : issue
            )
          );
          if (selectedIssueForDetail?.id === issueId) {
            setSelectedIssueForDetail(updatedIssueFromServer);
          }
        })
        .catch((err) => {
          console.error("이슈 상태 업데이트 중 오류:", err);
          setError(
            (err as Error).message ||
              "이슈 상태 업데이트 중 알 수 없는 오류가 발생했습니다."
          );
          setIssues(originalIssues);
        });
    },
    [issues, selectedIssueForDetail]
  );

  const handleResolveIssue = useCallback(
    async (data: {
      assignee?: string;
      resolution: string;
      fixVersion?: string;
      attachments: File[];
      comment?: string;
    }) => {
      if (!issueToResolve) return;
      setError(null);
      setIsSubmitting(true);
      const body = new FormData();
      body.append("status", "수정 완료");
      body.append("resolution", data.resolution);
      if (data.assignee) body.append("assignee", data.assignee);
      if (data.fixVersion) body.append("fixVersion", data.fixVersion);
      if (data.comment) body.append("comment", data.comment);
      data.attachments.forEach((f) => body.append("files", f));
      try {
        const response = await fetch(`/api/issues/${issueToResolve.id}`, {
          method: "PUT",
          body,
        });
        if (!response.ok) {
          const errData = await response
            .json()
            .catch(() => ({ message: "이슈 업데이트 실패" }));
          throw new Error(errData.message);
        }
        const updatedIssue: Issue = await response.json();
        setIssues((prev) =>
          prev.map((i) => (i.id === updatedIssue.id ? updatedIssue : i))
        );
        if (selectedIssueForDetail?.id === updatedIssue.id) {
          setSelectedIssueForDetail(updatedIssue);
        }
        setShowResolveModal(false);
        setIssueToResolve(null);
      } catch (err) {
        console.error("상태 업데이트 오류:", err);
        setError(
          (err as Error).message || "이슈 상태 업데이트 중 오류가 발생했습니다."
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [issueToResolve, selectedIssueForDetail]
  );

  const handleIssueUpdated = useCallback((updated: Issue) => {
    setIssues((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    setSelectedIssueForDetail(updated);
  }, []);

  const requestDeleteIssue = useCallback((issueId: string) => {
    setIssueToDelete(issueId);
    setShowDeleteModal(true);
  }, []);

  const confirmDeleteIssue = useCallback(async () => {
    if (issueToDelete) {
      setError(null);
      setShowDeleteModal(false);
      try {
        const response = await fetch(`/api/issues/${issueToDelete}`, {
          method: "DELETE",
        });
        if (!response.ok && response.status !== 204) {
          const errorData = await response
            .json()
            .catch(() => ({ message: "이슈 삭제에 실패했습니다." }));
          throw new Error(
            errorData.message ||
              `이슈 삭제에 실패했습니다: ${response.statusText}`
          );
        }
        await fetchIssues(); // Refetch issues
        if (selectedIssueForDetail?.id === issueToDelete) {
          setSelectedIssueForDetail(null);
        }
      } catch (err) {
        console.error("이슈 삭제 중 오류:", err);
        setError(
          (err as Error).message ||
            "이슈 삭제 중 알 수 없는 오류가 발생했습니다."
        );
      } finally {
        setIssueToDelete(null);
      }
    }
  }, [issueToDelete, fetchIssues, selectedIssueForDetail]);

  const cancelDeleteIssue = useCallback(() => {
    setIssueToDelete(null);
    setShowDeleteModal(false);
  }, []);

  const handlePageChange = (newPage: number) => setCurrentPage(newPage);

  const handleOpenEditModal = (issue: Issue) => {
    setSelectedIssueForEdit(issue);
    setShowEditIssueModal(true);
    setError(null);
  };

  const handleCloseEditModal = () => {
    setSelectedIssueForEdit(null);
    setShowEditIssueModal(false);
    setError(null);
  };

  const handleSelectIssueForDetail = (issue: Issue | null) => {
    setSelectedIssueForDetail(issue);
  };

  const closeDetailPanel = () => setSelectedIssueForDetail(null);

  const paginatedListIssues = baseFilteredIssues.slice(
    (currentPage - 1) * ITEMS_PER_PAGE_LIST,
    currentPage * ITEMS_PER_PAGE_LIST
  );

  const boardColumns = useMemo(() => {
    const statuses = currentProject?.statuses || [];
    return statuses.map((status) => {
      const statusName = typeof status === "object" ? status.name : status;
      const statusId = typeof status === "object" ? status.id : status;

      return {
        id: statusName,
        title: statusName,
        issues: baseFilteredIssues.filter(
          (issue) => issue.statusId === statusId
        ),
      };
    });
  }, [baseFilteredIssues, currentProject]);

  return (
    <Routes>
      <Route
        path="/"
        element={
          <MainContent
            {...{
              isAuthenticated,
              isLoading,
              issues,
              viewMode,
              setViewMode,
              tabMode,
              setTabMode,
              projects,
              currentProjectId,
              handleSelectProject,
              isAdmin,
              adminProjectIds,
              handleOpenProjectSettings,
              error,
              setError,
              showAddProjectModal,
              setShowAddProjectModal,
              handleAddProject,
              boardColumns,
              handleSelectIssueForDetail,
              updateIssueStatus,
              users,
              currentProject,
              paginatedListIssues,
              requestDeleteIssue,
              handleOpenEditModal,
              currentPage,
              baseFilteredIssues,
              handlePageChange,
              selectedIssueForDetail,
              closeDetailPanel,
              handleIssueUpdated,
              showAddIssueModal,
              setShowAddIssueModal,
              handleAddIssue,
              isSubmitting,
              currentUserId,
              currentUser,
              showEditIssueModal,
              handleCloseEditModal,
              selectedIssueForEdit,
              handleEditIssue,
              issueToDelete,
              showDeleteModal,
              confirmDeleteIssue,
              cancelDeleteIssue,
              issueToResolve,
              showResolveModal,
              setShowResolveModal,
              handleResolveIssue,
              handleLoginSuccess,
              showLoginModal,
              setShowLoginModal,
              handleLogin,
              showRegisterModal,
              setShowRegisterModal,
              handleRegister,
              handleLogout,
              searchTerm,
              setSearchTerm,
              statusFilter,
              setStatusFilter,
              assigneeFilter,
              setAssigneeFilter,
              reporterFilter,
              setReporterFilter,
              typeFilter,
              setTypeFilter,
              priorityFilter,
              setPriorityFilter,
              notifications,
              showNotifications,
              hasUnread,
              handleToggleNotifications,
              handleReadNotification,
              onToggleSidebar,
              user: currentUser,
              setShowNotifications: setShowNotifications,
              setIssueToResolve: setIssueToResolve,
              isSidebarOpen: isSidebarOpen,
            }}
          />
        }
      />
      <Route path="/settings/user" element={<UserSettingsPage />} />
    </Routes>
  );
};

export default App;
