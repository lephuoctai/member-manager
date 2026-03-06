import React from "react";
import { Box, Text } from "zmp-ui";
import { Student } from "@/types/member";
import { format, formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

interface BannedNoticeProps {
  student: Student;
}

function BannedNotice({ student }: BannedNoticeProps) {
  const isPermanent = student.bannedUntil === null || student.bannedUntil === undefined;

  return (
    <Box className="flex flex-col h-full w-full items-center justify-center px-6">
      <Box className="bg-red-50 border-2 border-red-300 rounded-2xl p-8 text-center space-y-4 max-w-sm w-full">
        <Box className="text-6xl">🔒</Box>
        <Text.Title size="large" className="!text-red-600 font-bold">
          Tài khoản bị khoá
        </Text.Title>

        {isPermanent ? (
          <Text className="text-red-500 text-lg font-medium">
            Khoá vô thời hạn
          </Text>
        ) : (
          <Box className="space-y-2">
            <Text className="text-red-500 font-medium">
              Hết hạn khoá:
            </Text>
            <Text className="text-red-700 text-lg font-bold">
              {format(new Date(student.bannedUntil!), "dd/MM/yyyy HH:mm", {
                locale: vi,
              })}
            </Text>
            <Text className="text-gray-500 text-sm">
              (còn{" "}
              {formatDistanceToNow(new Date(student.bannedUntil!), {
                locale: vi,
              })}
              )
            </Text>
          </Box>
        )}

        <Text className="text-gray-500 text-sm mt-4">
          Vui lòng liên hệ quản lý để được hỗ trợ
        </Text>
      </Box>
    </Box>
  );
}

export default BannedNotice;

