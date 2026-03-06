import React from "react";
import { Box, Text } from "zmp-ui";
import { Student, getFullName, StatusEnum } from "@/types/member";

interface MemberCardProps {
  student: Student;
  onClick: () => void;
}

function MemberCard({ student, onClick }: MemberCardProps) {
  return (
    <Box
      className="flex items-center p-4 bg-white rounded-xl shadow-sm border border-gray-100 cursor-pointer active:bg-gray-50 transition-colors"
      onClick={onClick}
    >
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

