import React, { useState, useEffect, useCallback, useMemo } from "react";
import { IssueForm } from "./components/IssueForm";
import { IssueList } from "./components/IssueList";
import { ConfirmationModal } from "./components/ConfirmationModal";
import { Modal } from "./components/Modal";
// import { IssueDetailsView } from './components/IssueDetailsView'; // Not used directly here
import { Sidebar } from "./components/Sidebar";
import { ProjectForm } from "./components/ProjectForm";
import { LoginForm } from "./components/LoginForm";
import { RegisterForm } from "./components/RegisterForm";
import { TopBar } from "./components/TopBar";
import { BoardView } from "./components/BoardView";
import { IssueDetailPanel } from "./components/IssueDetailPanel";
import type {
  Issue,
  ResolutionStatus as StatusEnum,
  IssueType as TypeEnum,
  Project,
} from "./types";
import {
  ResolutionStatus,
  IssueType,
  statusDisplayNames,
  boardStatuses,
  boardStatusToTitleMap,
} from "./types";
import { LoginScreen } from "./components/LoginScreen";
// import { PlusIcon } from './components/icons/PlusIcon'; // Not used directly here

const ITEMS_PER_PAGE_LIST = 10;

export type IssueFormData = {
  content: string;
  reporter: string;
  assignee?: string;
  comment?: string;
  status?: StatusEnum; // Only for edit
  type: TypeEnum; // New, mandatory
  affectsVersion?: string; // New
  fixVersion?: string; // New, only for edit
  projectId: string;
};

export type ViewMode = "board" | "list";

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Added
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
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [selectedIssueForDetail, setSelectedIssueForDetail] =
    useState<Issue | null>(null);

  const [showAddIssueModal, setShowAddIssueModal] = useState(false);
  const [showEditIssueModal, setShowEditIssueModal] = useState(false);
  const [selectedIssueForEdit, setSelectedIssueForEdit] =
    useState<Issue | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [issueToDelete, setIssueToDelete] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusEnum | "ALL">("ALL");

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch("/api/current-user", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setIsAuthenticated(true);
          setCurrentUser(data.username);
        }
      } catch (err) {
        console.error("세션 확인 오류:", err);
      }
    };
    checkSession();
  }, []);

  const fetchIssues = useCallback(async () => {
    console.log("currentProjectId", currentProjectId);
    console.log("isLoading", isLoading);
    if (!currentProjectId) {
      setIsLoading(false);
      return;
    }
    if (issues.length === 0) setIsLoading(true);
    setError(null);
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
  }, [currentProjectId, issues.length]);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch("/api/projects");
      if (!res.ok) {
        throw new Error(
          `프로젝트 정보를 불러오는데 실패했습니다: ${res.statusText}`
        );
      }
      const data: Project[] = await res.json();
      console.log(data);
      setProjects(data);
      if (data.length > 0 && !currentProjectId) {
        setIssues([]);
        setCurrentProjectId(data[0].id);
      }
    } catch (err) {
      console.error("프로젝트 로딩 중 오류:", err);
    }
  }, [currentProjectId]);

  const handleRegister = useCallback(
    async (username: string, password: string) => {
      setIsSubmitting(true);
      try {
        const res = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });
        if (!res.ok) {
          const errData = await res
            .json()
            .catch(() => ({ message: "회원가입 실패" }));
          throw new Error(errData.message || res.statusText);
        }
        setShowRegisterModal(false);
      } catch (err) {
        console.error("회원가입 오류:", err);
        setError((err as Error).message);
      } finally {
        setIsSubmitting(false);
      }
    },
    []
  );

  const handleLogin = useCallback(
    async (username: string, password: string) => {
      setIsSubmitting(true);
      try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });
        if (!res.ok) {
          const errData = await res
            .json()
            .catch(() => ({ message: "로그인 실패" }));
          throw new Error(errData.message || res.statusText);
        }
        const data = await res.json();
        setCurrentUser(data.username);
        setShowLoginModal(false);
        handleLoginSuccess();
      } catch (err) {
        console.error("로그인 오류:", err);
        setError((err as Error).message);
      } finally {
        setIsSubmitting(false);
      }
    },
    []
  );

  const handleLoginSuccess = useCallback(() => {
    setIsAuthenticated(true);
    setError(null); // Clear any previous global errors
    // Fetch initial data after login
    fetchIssues();
  }, [fetchIssues]);

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
    }
  }, []);

  const handleSelectProject = (id: string) => {
    setIssues([]);
    setCurrentProjectId(id);
  };

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues, currentProjectId]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const baseFilteredIssues = useMemo(() => {
    let tempIssues = issues;
    if (statusFilter !== "ALL") {
      tempIssues = tempIssues.filter((issue) => issue.status === statusFilter);
    }
    if (searchTerm.trim()) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      tempIssues = tempIssues.filter(
        (issue) =>
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
        // Ensure fixVersion is not sent for new issues
        const { fixVersion, ...addData } = formData;
        if (!currentProjectId)
          throw new Error("프로젝트가 선택되지 않았습니다.");
        addData.projectId = currentProjectId;
        const response = await fetch("/api/issues", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(addData),
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
        const response = await fetch(`/api/issues/${issueId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
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
    async (issueId: string, newStatus: StatusEnum) => {
      const issueToUpdate = issues.find((issue) => issue.id === issueId);
      if (!issueToUpdate || issueToUpdate.status === newStatus) return;

      setError(null);
      const originalIssues = [...issues];
      setIssues((prevIssues) =>
        prevIssues.map((issue) =>
          issue.id === issueId ? { ...issue, status: newStatus } : issue
        )
      );
      try {
        const response = await fetch(`/api/issues/${issueId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }), // Only send status for this specific update type
        });
        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({ message: "이슈 상태 업데이트에 실패했습니다." }));
          throw new Error(
            errorData.message ||
              `이슈 상태 업데이트에 실패했습니다: ${response.statusText}`
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
      } catch (err) {
        console.error("이슈 상태 업데이트 중 오류:", err);
        setError(
          (err as Error).message ||
            "이슈 상태 업데이트 중 알 수 없는 오류가 발생했습니다."
        );
        setIssues(originalIssues); // Revert optimistic update on error
      }
    },
    [issues, selectedIssueForDetail]
  );

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
    return boardStatuses.map((status) => ({
      id: status,
      title: boardStatusToTitleMap[status],
      issues: baseFilteredIssues.filter((issue) => issue.status === status),
    }));
  }, [baseFilteredIssues]);

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
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          currentView={viewMode}
          onSetViewMode={setViewMode}
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          onCreateIssue={() => {
            setShowAddIssueModal(true);
            setError(null);
          }}
          currentUser={currentUser}
          onRequestLogin={() => {
            setShowLoginModal(true);
            setError(null);
          }}
          onRequestLogout={handleLogout}
          onRequestRegister={() => {
            setShowRegisterModal(true);
            setError(null);
          }}
          onLogout={handleLogout} // Added
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
          />
        </Modal>
      )}

      {showDeleteModal && issueToDelete && (
        <ConfirmationModal
          title="삭제 확인"
          message={`정말로 이슈 "${
            issues
              .find((i) => i.id === issueToDelete)
              ?.content.substring(0, 30) ?? "선택된 이슈"
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
    </div>
  );
};

export default App;
