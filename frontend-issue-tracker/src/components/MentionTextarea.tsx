import React, { useState, useEffect, useRef } from "react";
import { MentionDropdown } from "./MentionDropdown";

interface User {
  id: string;
  userid: string;
  username: string;
  name: string;
  profileImage?: string;
}

interface MentionTextareaProps {
  value: string;
  onChange: (value: string) => void;
  projectId?: string;
  placeholder?: string;
  rows?: number;
  className?: string;
}

export const MentionTextarea: React.FC<MentionTextareaProps> = ({
  value,
  onChange,
  projectId,
  placeholder = "텍스트를 입력하세요...",
  rows = 3,
  className = "",
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [mentionDropdown, setMentionDropdown] = useState<{
    isVisible: boolean;
    position: { x: number; y: number };
    searchTerm: string;
    startPos: number;
  }>({
    isVisible: false,
    position: { x: 0, y: 0 },
    searchTerm: "",
    startPos: 0,
  });

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);

  // 프로젝트 사용자 목록 가져오기
  useEffect(() => {
    const fetchUsers = async () => {
      if (!projectId) return;

      try {
        const response = await fetch(`/api/projects/${projectId}/users`, {
          credentials: "include",
        });
        if (response.ok) {
          const userData = await response.json();
          setUsers(userData);
        }
      } catch (error) {
        console.error("사용자 목록 가져오기 실패:", error);
      }
    };

    fetchUsers();
  }, [projectId]);

  // 사용자 필터링
  useEffect(() => {
    if (mentionDropdown.searchTerm) {
      const filtered = users.filter(
        (user) =>
          user.username
            .toLowerCase()
            .includes(mentionDropdown.searchTerm.toLowerCase()) ||
          user.userid
            .toLowerCase()
            .includes(mentionDropdown.searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
    setSelectedIndex(0);
  }, [users, mentionDropdown.searchTerm]);

  // @ 문자 위치 계산을 위한 헬퍼 함수
  const getCaretPosition = (textArea: HTMLTextAreaElement, atIndex: number) => {
    // 임시 요소를 만들어서 정확한 텍스트 크기 측정
    const tempDiv = document.createElement("div");
    const styles = window.getComputedStyle(textArea);

    // textarea 스타일을 복사
    tempDiv.style.position = "absolute";
    tempDiv.style.visibility = "hidden";
    tempDiv.style.whiteSpace = "pre-wrap";
    tempDiv.style.wordWrap = "break-word";
    tempDiv.style.fontSize = styles.fontSize;
    tempDiv.style.fontFamily = styles.fontFamily;
    tempDiv.style.lineHeight = styles.lineHeight;
    tempDiv.style.padding = styles.padding;
    tempDiv.style.border = styles.border;
    tempDiv.style.width = styles.width;

    document.body.appendChild(tempDiv);

    // @ 문자까지의 텍스트를 설정
    const textBeforeAt = textArea.value.substring(0, atIndex + 1);
    tempDiv.textContent = textBeforeAt;

    // 마지막 문자(@) 위치 측정
    const range = document.createRange();
    const textNode = tempDiv.firstChild;
    if (textNode) {
      range.setStart(textNode, Math.max(0, textBeforeAt.length - 1));
      range.setEnd(textNode, textBeforeAt.length);
      const rangeRect = range.getBoundingClientRect();

      document.body.removeChild(tempDiv);

      const textareaRect = textArea.getBoundingClientRect();

      return {
        x: rangeRect.right,
        y: rangeRect.bottom + 5,
      };
    }

    document.body.removeChild(tempDiv);

    // fallback to original method
    const rect = textArea.getBoundingClientRect();
    return {
      x: rect.left + 10,
      y: rect.bottom + 5,
    };
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    const text = target.value;
    const cursorPos = target.selectionStart;

    // @ 문자 찾기
    const atIndex = text.lastIndexOf("@", cursorPos - 1);
    if (atIndex !== -1) {
      const textAfterAt = text.substring(atIndex + 1, cursorPos);
      // @ 이후 공백이 없고 길이가 20자 미만인 경우에만 멘션으로 처리
      if (!/\s/.test(textAfterAt) && textAfterAt.length < 20) {
        // @ 문자 위치 계산
        const position = getCaretPosition(target, atIndex);

        setMentionDropdown({
          isVisible: true,
          position,
          searchTerm: textAfterAt,
          startPos: atIndex,
        });
        return;
      }
    }

    // @ 문자가 없거나 조건에 맞지 않으면 드롭다운 숨기기
    setMentionDropdown((prev) => ({ ...prev, isVisible: false }));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // 드롭다운이 열려있을 때 키 이벤트 처리
    if (mentionDropdown.isVisible && filteredUsers.length > 0) {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < filteredUsers.length - 1 ? prev + 1 : 0
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : filteredUsers.length - 1
          );
          break;
        case "Enter":
          e.preventDefault();
          if (filteredUsers[selectedIndex]) {
            handleMentionSelect(filteredUsers[selectedIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          setMentionDropdown((prev) => ({ ...prev, isVisible: false }));
          break;
      }
    }
  };

  const handleMentionSelect = (user: User) => {
    if (!textareaRef.current) return;

    const beforeMention = value.substring(0, mentionDropdown.startPos);
    const afterMention = value.substring(
      mentionDropdown.startPos + mentionDropdown.searchTerm.length + 1
    );

    // 멘션 후 스페이스 추가
    const newValue = beforeMention + `@${user.userid} ` + afterMention;
    onChange(newValue);

    setMentionDropdown((prev) => ({ ...prev, isVisible: false }));

    // 포커스 다시 설정
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = beforeMention.length + user.userid.length + 2; // +2 for @ and space
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const handleMentionClose = () => {
    setMentionDropdown((prev) => ({ ...prev, isVisible: false }));
  };

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyUp={handleKeyUp}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        className={`w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${className}`}
      />
      <MentionDropdown
        users={filteredUsers}
        isVisible={mentionDropdown.isVisible}
        position={mentionDropdown.position}
        searchTerm={mentionDropdown.searchTerm}
        selectedIndex={selectedIndex}
        onSelect={handleMentionSelect}
        onClose={handleMentionClose}
      />
    </div>
  );
};
