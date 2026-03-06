import React from "react";
import { Box, Text } from "zmp-ui";
import { QRCodeSVG } from "qrcode.react";
import { Student, getFullName, StatusEnum } from "@/types/member";

interface QRCardProps {
  student: Student;
}

function QRCard({ student }: QRCardProps) {
  return (
    <Box className="flex flex-col h-full w-full">
      {/* QR Section - flexible, takes remaining space */}
      <Box className="flex-1 flex items-center justify-center p-4 min-h-0">
        <QRCodeSVG
          value={student.studentId}
          style={{ width: "100%", height: "100%", minWidth: 150, minHeight: 150 }}
          level="H"
          includeMargin={true}
        />
      </Box>

      {/* Info Section - fixed height */}
      <Box className="flex-shrink-0 bg-blue-600 text-white rounded-t-2xl px-6 py-5 space-y-2">
        <Text.Title size="large" className="!text-white text-center font-bold">
          {getFullName(student)}
        </Text.Title>
        <Box className="flex justify-between items-center">
          <Text className="!text-blue-100 text-sm">MSSV</Text>
          <Text className="!text-white font-semibold">{student.studentId}</Text>
        </Box>
        <Box className="flex justify-between items-center">
          <Text className="!text-blue-100 text-sm">Lớp</Text>
          <Text className="!text-white font-semibold">{student.grade}</Text>
        </Box>
        <Box className="flex justify-between items-center">
          <Text className="!text-blue-100 text-sm">Trạng thái</Text>
          <Box className="flex items-center gap-2">
            <Box
              className={`w-2 h-2 rounded-full ${
                student.status === StatusEnum.active
                  ? "bg-green-400"
                  : "bg-red-400"
              }`}
            />
            <Text className="!text-white font-semibold">{student.status}</Text>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default QRCard;

