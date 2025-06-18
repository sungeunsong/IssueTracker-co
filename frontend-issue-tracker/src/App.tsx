import React, { useState, useEffect, useCallback, useMemo } from "react";
import { IssueForm } from "./components/IssueForm";
import { IssueList } from "./components/IssueList";
import { ConfirmationModal } from "./components/ConfirmationModal";
import { Modal } from "./components/Modal";
import { IssueDetailsView } from "./components/IssueDetailsView";
import type { Issue, ResolutionStatus as StatusEnum } from "./types"; // Renamed to avoid conflict
import { ResolutionStatus, statusDisplayNames } from "./types"; // Keep for enum values, import statusDisplayNames
import { PlusIcon } from "./components/icons/PlusIcon";

const ITEMS_PER_PAGE = 10;

// Type for data submitted from IssueForm
export type IssueFormData = {
  content: string;
  reporter: string;
  assignee?: string;
  comment?: string;
  status?: StatusEnum; // Status is optional during add, but required for edit
};

const App: React.FC = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showAddIssueModal, setShowAddIssueModal] = useState(false);
  const [showEditIssueModal, setShowEditIssueModal] = useState(false);
  const [selectedIssueForEdit, setSelectedIssueForEdit] =
    useState<Issue | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [issueToDelete, setIssueToDelete] = useState<string | null>(null);
  const [showViewIssueModal, setShowViewIssueModal] = useState(false);
  const [selectedIssueForView, setSelectedIssueForView] =
    useState<Issue | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  // Search state
  const [searchTerm, setSearchTerm] = useState("");
  // Filter states
  const [statusFilter, setStatusFilter] = useState<StatusEnum | "ALL">("ALL");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("ALL"); // 'ALL', 'UNASSIGNED', or specific assignee name

  const uniqueAssignees = useMemo(() => {
    const assignees = new Set<string>();
    issues.forEach((issue) => {
      if (issue.assignee && issue.assignee.trim() !== "") {
        assignees.add(issue.assignee.trim());
      }
    });
    return Array.from(assignees).sort((a, b) =>
      a.toLowerCase().localeCompare(b.toLowerCase())
    );
  }, [issues]);

  const fetchIssues = useCallback(async () => {
    if (issues.length === 0) setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/issues");
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
  }, [issues.length]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  const filteredIssues = useMemo(() => {
    let tempIssues = issues;

    // Apply status filter
    if (statusFilter !== "ALL") {
      tempIssues = tempIssues.filter((issue) => issue.status === statusFilter);
    }

    // Apply assignee filter
    if (assigneeFilter !== "ALL") {
      if (assigneeFilter === "UNASSIGNED") {
        tempIssues = tempIssues.filter(
          (issue) => !issue.assignee || issue.assignee.trim() === ""
        );
      } else {
        tempIssues = tempIssues.filter(
          (issue) => issue.assignee === assigneeFilter
        );
      }
    }

    // Then apply search term filter
    if (searchTerm.trim()) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      tempIssues = tempIssues.filter(
        (issue) =>
          issue.content.toLowerCase().includes(lowerSearchTerm) ||
          issue.reporter.toLowerCase().includes(lowerSearchTerm) ||
          (issue.assignee &&
            issue.assignee.toLowerCase().includes(lowerSearchTerm)) ||
          (issue.comment &&
            issue.comment.toLowerCase().includes(lowerSearchTerm))
      );
    }
    return tempIssues;
  }, [issues, searchTerm, statusFilter, assigneeFilter]);

  // Reset to page 1 when filters change or issues are modified
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, assigneeFilter, issues.length]);

  const handleAddIssue = useCallback(
    async (formData: IssueFormData) => {
      setError(null);
      setIsSubmitting(true);
      try {
        const response = await fetch("/api/issues", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
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
        await fetchIssues();
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
    [fetchIssues]
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
        await fetchIssues();
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
    [fetchIssues]
  );

  const updateIssueStatus = useCallback(
    async (issueId: string, newStatus: StatusEnum) => {
      const issueToUpdate = issues.find((issue) => issue.id === issueId);
      if (!issueToUpdate) {
        setError("상태를 업데이트할 이슈를 찾지 못했습니다.");
        return;
      }
      if (issueToUpdate.status === newStatus) {
        return;
      }

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
          body: JSON.stringify({ status: newStatus }),
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
      } catch (err) {
        console.error("이슈 상태 업데이트 중 오류:", err);
        setError(
          (err as Error).message ||
            "이슈 상태 업데이트 중 알 수 없는 오류가 발생했습니다."
        );
        setIssues(originalIssues);
      }
    },
    [issues]
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
        await fetchIssues();
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
  }, [issueToDelete, fetchIssues]);

  const cancelDeleteIssue = useCallback(() => {
    setIssueToDelete(null);
    setShowDeleteModal(false);
  }, []);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleOpenViewModal = (issue: Issue) => {
    setSelectedIssueForView(issue);
    setShowViewIssueModal(true);
  };
  const handleCloseViewModal = () => {
    setSelectedIssueForView(null);
    setShowViewIssueModal(false);
  };

  const handleOpenEditModal = (issue: Issue) => {
    setSelectedIssueForEdit(issue);
    setShowEditIssueModal(true);
  };
  const handleCloseEditModal = () => {
    setSelectedIssueForEdit(null);
    setShowEditIssueModal(false);
    setError(null);
  };

  const paginatedIssues = filteredIssues.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (isLoading && issues.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-2xl font-semibold text-slate-600">
          이슈 로딩 중...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-2 sm:px-4 lg:px-4">
      {" "}
      {/* Reduced horizontal padding */}
      <div className="max-w-screen-xl mx-auto">
        {" "}
        {/* Increased max-width */}
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold text-slate-800 sm:text-5xl">
            웹 이슈 트래커
          </h1>
        </header>
        {error && (
          <div
            className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md shadow"
            role="alert"
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="font-bold">오류 발생:</p>
                <p>{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-700 hover:text-red-900"
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
        <main>
          <div className="mb-6 flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
            <div className="w-full sm:w-auto sm:flex-grow-[2] max-w-xs sm:max-w-sm md:max-w-md">
              <label htmlFor="search-issues" className="sr-only">
                이슈 검색
              </label>
              <input
                type="search"
                id="search-issues"
                placeholder="내용, 등록자, 담당자, 코멘트 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div className="w-full sm:w-auto sm:flex-grow-[1] max-w-full sm:max-w-xs">
              <label htmlFor="status-filter" className="sr-only">
                상태 필터
              </label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as StatusEnum | "ALL")
                }
                className="block w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="ALL">전체 상태</option>
                {(
                  Object.keys(ResolutionStatus) as Array<
                    keyof typeof ResolutionStatus
                  >
                ).map((key) =>
                  ResolutionStatus[key] ? (
                    <option key={key} value={ResolutionStatus[key]}>
                      {statusDisplayNames[ResolutionStatus[key]]}
                    </option>
                  ) : null
                )}
              </select>
            </div>
            <div className="w-full sm:w-auto sm:flex-grow-[1] max-w-full sm:max-w-xs">
              <label htmlFor="assignee-filter" className="sr-only">
                담당자 필터
              </label>
              <select
                id="assignee-filter"
                value={assigneeFilter}
                onChange={(e) => setAssigneeFilter(e.target.value)}
                className="block w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="ALL">전체 담당자</option>
                <option value="UNASSIGNED">미지정</option>
                {uniqueAssignees.map((assignee) => (
                  <option key={assignee} value={assignee}>
                    {assignee}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => setShowAddIssueModal(true)}
              className="w-full sm:w-auto sm:flex-shrink-0 inline-flex items-center justify-center px-5 py-2.5 sm:px-6 sm:py-3 border border-transparent text-sm sm:text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-150"
            >
              <PlusIcon className="w-5 h-5 mr-2 -ml-1" />새 이슈 등록
            </button>
          </div>

          <section aria-labelledby="issue-list-title">
            <div className="bg-white shadow-xl rounded-lg overflow-hidden">
              {isLoading && issues.length > 0 && (
                <div className="p-4 text-center text-slate-500">
                  목록 새로고침 중...
                </div>
              )}
              <IssueList
                issues={paginatedIssues}
                onUpdateStatus={updateIssueStatus}
                onDeleteIssue={requestDeleteIssue}
                onViewIssue={handleOpenViewModal}
                onEditIssue={handleOpenEditModal}
                currentPage={currentPage}
                totalIssues={filteredIssues.length}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={handlePageChange}
              />
            </div>
          </section>
        </main>
      </div>
      {/* Add Issue Modal */}
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
        />
      </Modal>
      {/* Edit Issue Modal */}
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
          />
        </Modal>
      )}
      {/* View Issue Modal */}
      {selectedIssueForView && (
        <Modal
          isOpen={showViewIssueModal}
          onClose={handleCloseViewModal}
          title="이슈 상세 정보"
        >
          <IssueDetailsView issue={selectedIssueForView} />
        </Modal>
      )}
      {/* Delete Confirmation Modal */}
      {showDeleteModal && issueToDelete && (
        <ConfirmationModal
          title="삭제 확인"
          message={`정말로 이슈 "${
            issues
              .find((i) => i.id === issueToDelete)
              ?.content.substring(0, 30) ?? "선택된 이슈"
          }..."을(를) 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
          onConfirm={confirmDeleteIssue}
          onCancel={cancelDeleteIssue}
          confirmText="삭제"
          cancelText="취소"
        />
      )}
    </div>
  );
};

export default App;
