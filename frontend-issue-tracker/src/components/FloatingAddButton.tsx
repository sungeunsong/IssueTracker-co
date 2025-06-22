import React from "react";
import { PlusIcon } from "./icons/PlusIcon";

interface FloatingAddButtonProps {
  onClick: () => void;
}

export const FloatingAddButton: React.FC<FloatingAddButtonProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 inline-flex items-center justify-center p-4 rounded-full shadow-lg bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      aria-label="새 이슈 등록"
    >
      <PlusIcon className="w-6 h-6" />
    </button>
  );
};
