import React, { useRef } from "react";
import { Box, Text } from "zmp-ui";
import { Student, getFullName, StatusEnum } from "@/types/member";

interface MemberCardProps {
  student: Student;
  onClick: () => void;
  selectionMode?: boolean;
  selected?: boolean;
  onLongPress?: () => void;
  onToggleSelect?: () => void;
}

function MemberCard({
  student,
  onClick,
  selectionMode = false,
  selected = false,
  onLongPress,
  onToggleSelect,
}: MemberCardProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const movedRef = useRef(false);

  const handleTouchStart = () => {
    movedRef.current = false;
    timerRef.current = setTimeout(() => {
      if (!movedRef.current && onLongPress) {
        onLongPress();
      }
      timerRef.current = null;
    }, 500);
  };

  const handleTouchMove = () => {
    movedRef.current = true;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleTouchEnd = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleClick = () => {
    if (selectionMode) {
      onToggleSelect?.();
    } else {
      onClick();
    }
  };

  return (
    <Box
      className={`flex items-center p-4 bg-white rounded-xl shadow-sm border-2 cursor-pointer active:bg-gray-50 transition-all ${
        selected ? "border-orange-400 bg-orange-50" : "border-gray-100"
      }`}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Selection checkbox */}
      {selectionMode && (
        <Box className="flex-shrink-0 mr-3">
          <Box
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
              selected
                ? "bg-orange-500 border-orange-500"
                : "border-gray-300 bg-white"
            }`}
          >
            {selected && (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M3 7L6 10L11 4"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </Box>
        </Box>
      )}

      <Box className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
        <Text className="text-blue-600 font-bold text-lg">
          {student.firstName.charAt(0).toUpperCase()}
        </Text>
      </Box>
      <Box className="flex-1 min-w-0">
        <Text className="font-semibold text-base truncate">
          {getFullName(student)}
        </Text>
        <Text className="text-gray-500 text-sm">
          MSSV: {student.studentId}
        </Text>
      </Box>
      <Box className="flex-shrink-0 flex items-center gap-1">
        <Box
          className={`w-2 h-2 rounded-full ${
            student.status === StatusEnum.active ? "bg-green-400" : "bg-red-400"
          }`}
        />
        <Text className="text-xs text-gray-400">{student.role}</Text>
      </Box>
    </Box>
  );
}

export default MemberCard;

