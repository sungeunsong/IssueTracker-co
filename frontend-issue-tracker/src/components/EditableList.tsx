import React, { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// ID-이름 쌍을 위한 인터페이스
interface KeyValueItem {
  id: string;
  name: string;
  color: string;
  order: number;
}

// 개별 아이템을 위한 Sortable 컴포넌트 (문자열용)
const SortableItem = ({
  id,
  item,
  index,
  handleUpdateItem,
  handleRemoveItem,
}: any) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    boxShadow: isDragging
      ? "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)"
      : undefined,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex items-center space-x-2 p-2 rounded-md transition-shadow ${
        isDragging ? "bg-slate-100" : "bg-transparent"
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab p-1 text-slate-400"
      >
        {/* Drag Handle Icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>
      <input
        value={item}
        onChange={(e) => handleUpdateItem(index, e.target.value)}
        className="border border-slate-300 rounded-md px-3 py-1.5 flex-1 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        placeholder="항목 이름"
      />
      <button
        onClick={() => handleRemoveItem(index)}
        className="text-slate-500 hover:text-red-600 p-1.5 rounded-full hover:bg-red-50"
      >
        {/* Trash Icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      </button>
    </li>
  );
};

// 키-값 쌍을 위한 Sortable 컴포넌트
const SortableKeyValueItem = <T extends KeyValueItem>({
  id,
  item,
  index,
  handleUpdateItem,
  handleRemoveItem,
}: {
  id: string;
  item: T;
  index: number;
  handleUpdateItem: (
    index: number,
    field: "id" | "name",
    value: string
  ) => void;
  handleRemoveItem: (index: number) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    boxShadow: isDragging
      ? "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)"
      : undefined,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex items-center space-x-2 p-2 rounded-md transition-shadow ${
        isDragging ? "bg-slate-100" : "bg-transparent"
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab p-1 text-slate-400"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>
      <input
        value={item.id}
        // key(id)는 수정 불가(readOnly)
        readOnly
        className="border border-slate-300 rounded-md px-3 py-1.5 w-32 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm bg-slate-100 cursor-not-allowed"
        placeholder="ID (예: open)"
      />
      <input
        value={item.name}
        onChange={(e) => handleUpdateItem(index, "name", e.target.value)}
        className="border border-slate-300 rounded-md px-3 py-1.5 flex-1 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        placeholder="표시 이름 (예: 열림)"
      />
      <button
        onClick={() => handleRemoveItem(index)}
        className="text-slate-500 hover:text-red-600 p-1.5 rounded-full hover:bg-red-50"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      </button>
    </li>
  );
};

interface Props {
  title: string;
  items: string[];
  setItems: React.Dispatch<React.SetStateAction<string[]>>;
  placeholder: string;
}

const EditableList: React.FC<Props> = ({
  title,
  items,
  setItems,
  placeholder,
}) => {
  const [newItem, setNewItem] = useState("");
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleAddItem = () => {
    if (newItem.trim() && !items.includes(newItem.trim())) {
      setItems([...items, newItem.trim()]);
      setNewItem("");
    }
  };

  const handleUpdateItem = (index: number, value: string) => {
    setItems(items.map((v, i) => (i === index ? value : v)));
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setItems((currentItems) => {
        const oldIndex = currentItems.indexOf(active.id as string);
        const newIndex = currentItems.indexOf(over.id as string);
        return arrayMove(currentItems, oldIndex, newIndex);
      });
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
      <h3 className="text-xl font-semibold mb-4 text-slate-800">{title}</h3>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          <ul className="space-y-2 mb-4">
            {items.map((item, idx) => (
              <SortableItem
                key={item}
                id={item}
                item={item}
                index={idx}
                handleUpdateItem={handleUpdateItem}
                handleRemoveItem={handleRemoveItem}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>

      <div className="mt-4 flex space-x-2">
        <input
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddItem()}
          className="border border-slate-300 rounded-md px-3 py-1.5 flex-1 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder={placeholder}
        />
        <button
          onClick={handleAddItem}
          className="px-4 py-1.5 bg-slate-700 text-white rounded-md hover:bg-slate-800 flex items-center space-x-2"
        >
          {/* Plus Icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          <span>추가</span>
        </button>
      </div>
    </div>
  );
};

// 키-값 쌍을 위한 EditableKeyValueList 컴포넌트
interface KeyValueProps<T extends KeyValueItem> {
  title: string;
  items: T[];
  setItems: React.Dispatch<React.SetStateAction<T[]>>;
  defaultColor?: string;
}

export const EditableKeyValueList = <T extends KeyValueItem>({
  title,
  items,
  setItems,
  defaultColor = "blue",
}: KeyValueProps<T>) => {
  const [newId, setNewId] = useState("");
  const [newName, setNewName] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleAddItem = () => {
    if (
      newId.trim() &&
      newName.trim() &&
      !items.find((item) => item.id === newId.trim())
    ) {
      const newItem = {
        id: newId.trim(),
        name: newName.trim(),
        color: defaultColor,
        order: items.length + 1,
      } as T;
      setItems([...items, newItem]);
      setNewId("");
      setNewName("");
    }
  };

  const handleUpdateItem = (
    index: number,
    field: "id" | "name",
    value: string
  ) => {
    setItems(
      items.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setItems((currentItems) => {
        const oldIndex = currentItems.findIndex(
          (item) => item.id === active.id
        );
        const newIndex = currentItems.findIndex((item) => item.id === over.id);
        return arrayMove(currentItems, oldIndex, newIndex);
      });
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
      <h3 className="text-xl font-semibold mb-4 text-slate-800">{title}</h3>

      <div className="mb-3 text-xs text-slate-500 flex">
        <span className="w-32 pl-8">ID</span>
        <span className="flex-1">표시 이름</span>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <ul className="space-y-2 mb-4">
            {items.map((item, idx) => (
              <SortableKeyValueItem
                key={item.id}
                id={item.id}
                item={item}
                index={idx}
                handleUpdateItem={handleUpdateItem}
                handleRemoveItem={handleRemoveItem}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>

      <div className="mt-4 flex space-x-2">
        <div className="w-8"></div> {/* 드래그 핸들 공간 */}
        <input
          value={newId}
          onChange={(e) => setNewId(e.target.value)}
          onKeyDown={(e) =>
            e.key === "Enter" && newName.trim() && handleAddItem()
          }
          className="border border-slate-300 rounded-md px-3 py-1.5 w-32 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
          placeholder="ID"
        />
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) =>
            e.key === "Enter" && newId.trim() && handleAddItem()
          }
          className="border border-slate-300 rounded-md px-3 py-1.5 flex-1 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="표시 이름"
        />
        <button
          onClick={handleAddItem}
          className="px-4 py-1.5 bg-slate-700 text-white rounded-md hover:bg-slate-800 flex items-center space-x-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          <span>추가</span>
        </button>
      </div>
    </div>
  );
};

export default EditableList;
