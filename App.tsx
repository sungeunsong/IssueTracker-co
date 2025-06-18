import React, { useState, useEffect, useCallback } from "react";
import { IssueForm } from "./components/IssueForm";
import { IssueList } from "./components/IssueList";
import { ConfirmationModal } from "./components/ConfirmationModal";
import type { Issue } from "./types";
import { ResolutionStatus } from "./types";

const App: React.FC = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [issueToDelete, setIssueToDelete] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchIssues = async () => {
      setIsLoading(true);
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
    };
    fetchIssues();
  }, []);

  const addIssue = useCallback(
    async (newIssueData: Omit<Issue, "id" | "createdAt" | "status">) => {
      setError(null);
      try {
        const response = await fetch("/api/issues", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newIssueData),
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
        const addedIssue: Issue = await response.json();
        setIssues((prevIssues) => [addedIssue, ...prevIssues]);
      } catch (err) {
        console.error("이슈 추가 중 오류:", err);
        setError(
          (err as Error).message ||
            "이슈 추가 중 알 수 없는 오류가 발생했습니다."
        );
      }
    },
    []
  );

  const updateIssueStatus = useCallback(
    async (issueId: string, newStatus: ResolutionStatus) => {
      setError(null);
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
        const updatedIssue: Issue = await response.json();
        setIssues((prevIssues) =>
          prevIssues.map((issue) =>
            issue.id === updatedIssue.id ? updatedIssue : issue
          )
        );
      } catch (err) {
        console.error("이슈 상태 업데이트 중 오류:", err);
        setError(
          (err as Error).message ||
            "이슈 상태 업데이트 중 알 수 없는 오류가 발생했습니다."
        );
      }
    },
    []
  );

  const requestDeleteIssue = useCallback((issueId: string) => {
    setIssueToDelete(issueId);
    setShowDeleteModal(true);
  }, []);

  const confirmDeleteIssue = useCallback(async () => {
    if (issueToDelete) {
      setError(null);
      try {
        const response = await fetch(`/api/issues/${issueToDelete}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          // 204 No Content is also response.ok === true
          const errorData =
            response.status === 204
              ? {}
              : await response
                  .json()
                  .catch(() => ({ message: "이슈 삭제에 실패했습니다." }));
          throw new Error(
            errorData.message ||
              `이슈 삭제에 실패했습니다: ${response.statusText}`
          );
        }
        setIssues((prevIssues) =>
          prevIssues.filter((issue) => issue.id !== issueToDelete)
        );
      } catch (err) {
        console.error("이슈 삭제 중 오류:", err);
        setError(
          (err as Error).message ||
            "이슈 삭제 중 알 수 없는 오류가 발생했습니다."
        );
      } finally {
        setIssueToDelete(null);
        setShowDeleteModal(false);
      }
    }
  }, [issueToDelete]);

  const cancelDeleteIssue = useCallback(() => {
    setIssueToDelete(null);
    setShowDeleteModal(false);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-2xl font-semibold text-slate-600">
          이슈 로딩 중...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold text-slate-800 sm:text-5xl">
            웹 이슈 트래커
          </h1>
        </header>

        {error && (
          <div
            className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md"
            role="alert"
          >
            <p className="font-bold">오류 발생:</p>
            <p>{error}</p>
          </div>
        )}

        <main>
          <section aria-labelledby="create-issue-title" className="mb-12">
            <div className="bg-white shadow-xl rounded-lg p-6 sm:p-8">
              <h2
                id="create-issue-title"
                className="text-2xl font-semibold text-slate-700 mb-6"
              >
                새 이슈 생성
              </h2>
              <IssueForm onAddIssue={addIssue} />
            </div>
          </section>

          <section aria-labelledby="issue-list-title">
            <div className="bg-white shadow-xl rounded-lg p-6 sm:p-8">
              <h2
                id="issue-list-title"
                className="text-2xl font-semibold text-slate-700 mb-6"
              >
                현재 이슈 목록
              </h2>
              <IssueList
                issues={issues}
                onUpdateStatus={updateIssueStatus}
                onDeleteIssue={requestDeleteIssue}
              />
            </div>
          </section>
        </main>
      </div>
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
