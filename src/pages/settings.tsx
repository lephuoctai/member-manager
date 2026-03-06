import React, { useState } from "react";
import { Box, Button, Icon, Input, Page, Text, useSnackbar } from "zmp-ui";
import { useNavigate } from "zmp-ui";
import { useAtom } from "jotai";
import { currentStudentAtom, zaloUserAtom } from "@/state/auth";
import { updateStudent } from "@/services/student.service";
import { getFullName, splitFullName } from "@/types/member";

function SettingsPage() {
  const [currentStudent, setCurrentStudent] = useAtom(currentStudentAtom);
  const [zaloUser] = useAtom(zaloUserAtom);
  const navigate = useNavigate();
  const { openSnackbar } = useSnackbar();

  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(
    currentStudent ? getFullName(currentStudent) : ""
  );
  const [studentId, setStudentId] = useState(
    currentStudent?.studentId || ""
  );
  const [grade, setGrade] = useState(currentStudent?.grade || "");
  const [saving, setSaving] = useState(false);

  if (!currentStudent) return null;

  const handleSave = async () => {
    if (!fullName.trim() || !studentId.trim() || !grade.trim()) {
      openSnackbar({ text: "Vui lòng điền đầy đủ thông tin.", type: "error" });
      return;
    }

    setSaving(true);
    try {
      const { firstName, lastName } = splitFullName(fullName);
      await updateStudent(currentStudent.id!, {
        firstName,
        lastName,
        studentId: studentId.trim(),
        grade: grade.trim(),
      });

      // Update local state without refetch
      setCurrentStudent({
        ...currentStudent,
        firstName,
        lastName,
        studentId: studentId.trim(),
        grade: grade.trim(),
      });

      setIsEditing(false);
      openSnackbar({ text: "Cập nhật thành công!", type: "success" });
    } catch (err) {
      console.error("Update failed:", err);
      openSnackbar({ text: "Cập nhật thất bại.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFullName(getFullName(currentStudent));
    setStudentId(currentStudent.studentId);
    setGrade(currentStudent.grade);
    setIsEditing(false);
  };

  return (
    <Page className="bg-gray-50 min-h-screen">
      {/* Header */}
      <Box className="bg-blue-600 px-4 py-3 flex items-center gap-3 sticky top-0 z-10 safe-area-top">
        <Box
          className="w-8 h-8 flex items-center justify-center cursor-pointer"
          onClick={() => navigate(-1)}
        >
          <Icon icon="zi-arrow-left" className="text-white" size={24} />
        </Box>
        <Text.Title size="normal" className="!text-white font-bold">
          Cài đặt
        </Text.Title>
      </Box>

      {/* Avatar Section */}
      <Box className="flex flex-col items-center py-6 bg-blue-600 rounded-b-3xl mb-3">
        {zaloUser?.avatar ? (
          <img
            src={zaloUser.avatar}
            alt="avatar"
            className="w-24 h-24 rounded-full border-4 border-white shadow-lg"
          />
        ) : (
          <Box className="w-24 h-24 rounded-full bg-blue-400 flex items-center justify-center border-4 border-white">
            <Text className="text-white text-3xl font-bold">
              {currentStudent.firstName.charAt(0).toUpperCase()}
            </Text>
          </Box>
        )}
        <Text className="!text-white font-semibold text-lg mt-3">
          {zaloUser?.name || "Zalo User"}
        </Text>
      </Box>

      {/* Info Section */}
      <Box className="px-4 py-4 space-y-3">
        <Box className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
          <Text className="font-bold text-base text-gray-800 mb-2">
            Thông tin cá nhân
          </Text>

          {/* Họ và tên */}
          <Box className="space-y-1">
            <Text className="text-xs text-gray-500 font-medium">
              Họ và tên
            </Text>
            {isEditing ? (
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Họ và tên"
              />
            ) : (
              <Text className="text-base font-medium">
                {getFullName(currentStudent)}
              </Text>
            )}
          </Box>

          {/* Tên Zalo */}
          <Box className="space-y-1">
            <Text className="text-xs text-gray-500 font-medium">Tên Zalo</Text>
            <Text className="text-base font-medium">
              {zaloUser?.name || "—"}
            </Text>
          </Box>

          {/* MSSV */}
          <Box className="space-y-1">
            <Text className="text-xs text-gray-500 font-medium">
              Mã số sinh viên
            </Text>
            {isEditing ? (
              <Input
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="MSSV"
              />
            ) : (
              <Text className="text-base font-medium">
                {currentStudent.studentId}
              </Text>
            )}
          </Box>

          {/* Lớp */}
          <Box className="space-y-1">
            <Text className="text-xs text-gray-500 font-medium">Lớp</Text>
            {isEditing ? (
              <Input
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder="Lớp"
              />
            ) : (
              <Text className="text-base font-medium">
                {currentStudent.grade}
              </Text>
            )}
          </Box>

          {/* Vai trò */}
          <Box className="space-y-1">
            <Text className="text-xs text-gray-500 font-medium">Vai trò</Text>
            <Box className="flex items-center gap-2">
              <Box className="px-3 py-1 bg-blue-50 rounded-full">
                <Text className="text-blue-600 text-sm font-medium">
                  {currentStudent.role}
                </Text>
              </Box>
            </Box>
          </Box>

          {/* Trạng thái */}
          <Box className="space-y-1">
            <Text className="text-xs text-gray-500 font-medium">
              Trạng thái
            </Text>
            <Box className="flex items-center gap-2">
              <Box
                className={`w-2 h-2 rounded-full ${
                  currentStudent.status === "Hoạt động"
                    ? "bg-green-500"
                    : "bg-red-500"
                }`}
              />
              <Text className="text-base font-medium">
                {currentStudent.status}
              </Text>
            </Box>
          </Box>
        </Box>

        {/* Action Buttons */}
        <Box className="pt-2 space-y-3">
          {isEditing ? (
            <Box className="flex gap-3">
              <Button
                variant="secondary"
                fullWidth
                onClick={handleCancel}
                disabled={saving}
              >
                Huỷ
              </Button>
              <Button
                variant="primary"
                fullWidth
                onClick={handleSave}
                loading={saving}
                disabled={saving}
              >
                Cập nhật
              </Button>
            </Box>
          ) : (
            <Button
              variant="primary"
              fullWidth
              prefixIcon={<Icon icon="zi-edit" />}
              onClick={() => setIsEditing(true)}
            >
              Chỉnh sửa thông tin
            </Button>
          )}
        </Box>
      </Box>
    </Page>
  );
}

export default SettingsPage;

