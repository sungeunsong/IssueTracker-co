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
import { TopBar } from "./components/TopBar";
import { BoardView } from "./components/BoardView";
import { IssueDetailPanel } from "./components/IssueDetailPanel";
import ResolveIssueModal from "./components/ResolveIssueModal";
import { UserSettingsPage } from "./pages/UserSettingsPage";
import type {
  Issue,
  ResolutionStatus as StatusEnum,
  IssuePriority as PriorityEnum,
  Project,
  User,
} from "./types";
import { DEFAULT_ISSUE_TYPES, DEFAULT_PRIORITIES } from "./types";
import { LoginScreen } from "./components/LoginScreen";

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

const MainContent: React.FC<any> = ({ // Define props for MainContent
  isAuthenticated,
  isLoading,
  issues,
  viewMode,
  setViewMode,
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
  handleAddProject,
}) => {
  if (isLoading && issues.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-100">
        <div className="text-2xl font-semibold text-slate-700">
          이슈 로딩 중...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex h-screen bg-white text-slate-800 font-sans">
      <Sidebar
        currentView={viewMode}
        onSetViewMode={setViewMode}
        onCreateProject={() => {
          setShowAddProjectModal(true);
          setError(null);
        }}
        projects={projects}
        currentProjectId={currentProjectId}
        onSelectProject={handleSelectProject}
        isAdmin={isAdmin}
        adminProjectIds={adminProjectIds}
        onOpenProjectSettings={handleOpenProjectSettings}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          currentView={viewMode}
          onSetViewMode={setViewMode}
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          statuses={currentProject?.statuses || []}
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
        />
        <main className="flex-1 overflow-x-auto overflow-y-auto bg-slate-50 p-4 sm:p-6">
          {error && (
            <div
              className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-md shadow-sm"
              role="alert"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-bold">오류:</p>
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
            <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-4">
              <p className="text-lg">
                프로젝트가 없습니다. 새 프로젝트를 추가하세요.
              </p>
              <button
                onClick={() => {
                  setShowAddProjectModal(true);
                  setError(null);
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                프로젝트 생성
              </button>
            </div>
          ) : (
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
                <div className="bg-white shadow-md rounded-lg overflow-hidden">
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
          currentUserName={currentUser}
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
            currentUserName={currentUser}
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
    </div>
  );
}

const App: React.FC = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<ViewMode>("board");
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
      const response = await fetch(`/api/issues?projectId=${currentProjectId}`);
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
  }, [currentProjectId]);

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
          issue.id.toLowerCase().includes(lowerSearchTerm) || // Search by ID
          (issue.affectsVersion &&
            issue.affectsVersion.toLowerCase().includes(lowerSearchTerm)) ||
          (issue.fixVersion &&
            issue.fixVersion.toLowerCase().includes(lowerSearchTerm))
      );
    }
    return tempIssues;
  }, [issues, searchTerm, statusFilter]);

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
      <Route path="/" element={
        <MainContent 
          {...{
            isAuthenticated, isLoading, issues, viewMode, setViewMode, projects, currentProjectId, handleSelectProject, isAdmin, adminProjectIds, handleOpenProjectSettings, error, setError, showAddProjectModal, setShowAddProjectModal, handleAddProject, boardColumns, handleSelectIssueForDetail, updateIssueStatus, users, currentProject, paginatedListIssues, requestDeleteIssue, handleOpenEditModal, currentPage, baseFilteredIssues, handlePageChange, selectedIssueForDetail, closeDetailPanel, handleIssueUpdated, showAddIssueModal, setShowAddIssueModal, handleAddIssue, isSubmitting, currentUserId, currentUser, showEditIssueModal, handleCloseEditModal, selectedIssueForEdit, handleEditIssue, issueToDelete, showDeleteModal, confirmDeleteIssue, cancelDeleteIssue, issueToResolve, showResolveModal, setShowResolveModal, handleResolveIssue, handleLoginSuccess, showLoginModal, setShowLoginModal, handleLogin, showRegisterModal, setShowRegisterModal, handleRegister, handleLogout, searchTerm, setSearchTerm, statusFilter, setStatusFilter
          }}
        />
      } />
      <Route path="/settings/user" element={<UserSettingsPage />} />
    </Routes>
  );
};

export default App;
