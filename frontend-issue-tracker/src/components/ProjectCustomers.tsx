import React, { useState, useEffect, useCallback, useRef } from "react";
import { Modal } from "./Modal";
import { ConfirmationModal } from "./ConfirmationModal";
import CustomerForm from "./CustomerForm";
import type { Customer, User } from "../types";
import { EllipsisVerticalIcon } from "./icons/EllipsisVerticalIcon";

interface ActionMenuProps {
  onEdit: () => void;
  onDelete: () => void;
}

const ActionMenu: React.FC<ActionMenuProps> = ({ onEdit, onDelete }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        className="flex items-center text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100"
        onClick={() => setOpen(!open)}
      >
        <EllipsisVerticalIcon className="h-5 w-5" />
      </button>
      {open && (
        <div className="origin-top-right absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
          <div className="py-1">
            <button
              onClick={() => {
                onEdit();
                setOpen(false);
              }}
              className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
            >
              수정
            </button>
            <button
              onClick={() => {
                onDelete();
                setOpen(false);
              }}
              className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              삭제
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

interface Props {
  projectId: string;
  users: User[];
}

export const ProjectCustomers: React.FC<Props> = ({ projectId, users }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchComponents = useCallback(async () => {
    const res = await fetch(`/api/projects/${projectId}/customers`);
    if (res.ok) {
      const data: Customer[] = await res.json();
      setCustomers(data);
    }
  }, [projectId]);

  useEffect(() => {
    fetchComponents();
  }, [fetchComponents]);

  const handleSave = async (data: Partial<Component>) => {
    if (editCustomer) {
      await fetch(`/api/customers/${editCustomer.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } else {
      await fetch(`/api/projects/${projectId}/customers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    }
    setShowModal(false);
    setEditCustomer(null);
    fetchComponents();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await fetch(`/api/customers/${deleteId}`, { method: "DELETE" });
    setDeleteId(null);
    fetchComponents();
  };

  return (
    <div>
      <button
        onClick={() => setShowModal(true)}
        className="mb-4 px-3 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"
      >
        고객사 만들기
      </button>
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead>
          <tr className="bg-slate-50">
            <th className="px-3 py-2 text-left font-semibold">고객사</th>
            <th className="px-3 py-2 text-left font-semibold">설명</th>
            <th className="px-3 py-2 text-left font-semibold">담당자</th>
            <th className="px-3 py-2 text-center font-semibold">이슈</th>
            <th className="px-3 py-2 text-center font-semibold">추가 작업</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {customers.map((c) => (
            <tr key={c.id}>
              <td className="px-3 py-2 whitespace-nowrap">{c.name}</td>
              <td className="px-3 py-2 whitespace-nowrap">
                {c.description || "-"}
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                {c.owners
                  .map((o) => users.find((u) => u.userid === o)?.username || o)
                  .join(", ") || "-"}
              </td>
              <td className="px-3 py-2 whitespace-nowrap text-center">
                {c.issueCount ?? 0}
              </td>
              <td className="px-3 py-2 whitespace-nowrap text-center">
                <ActionMenu
                  onEdit={() => {
                    setEditCustomer(c);
                    setShowModal(true);
                  }}
                  onDelete={() => setDeleteId(c.id)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditCustomer(null);
        }}
        title="고객사"
      >
        <CustomerForm
          initialData={editCustomer || undefined}
          onSubmit={handleSave}
          onCancel={() => {
            setShowModal(false);
            setEditCustomer(null);
          }}
          users={users}
          submitText={editCustomer ? "저장" : "생성"}
        />
      </Modal>
      {deleteId && (
        <ConfirmationModal
          title="고객사 삭제"
          message="선택한 고객사를 삭제하시겠습니까?"
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
};

export default ProjectCustomers;
