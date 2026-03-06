import React, { useState } from "react";
import { Box, Button, Input, Page, Text, Spinner } from "zmp-ui";
import { useAtom } from "jotai";
import { useNavigate } from "zmp-ui";
import {
  currentStudentAtom,
  zaloUserAtom,
  isRegisteredAtom,
} from "@/state/auth";
import { createStudent } from "@/services/student.service";
import { splitFullName, RoleEnum, StatusEnum, Student } from "@/types/member";

function RegisterPage() {
  const [zaloUser] = useAtom(zaloUserAtom);
  const [, setCurrentStudent] = useAtom(currentStudentAtom);
  const [, setIsRegistered] = useAtom(isRegisteredAtom);
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [grade, setGrade] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!fullName.trim() || !studentId.trim() || !grade.trim()) {
      setError("Vui lòng điền đầy đủ thông tin.");
      return;
    }

    if (!zaloUser) {
      setError("Không thể xác định tài khoản Zalo.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { firstName, lastName } = splitFullName(fullName);
      const newStudent: Omit<Student, "id"> = {
        firstName,
        lastName,
        uidZalo: zaloUser.id,
        grade: grade.trim(),
        studentId: studentId.trim(),
        role: RoleEnum.ctv,
        status: StatusEnum.active,
      };

      const created = await createStudent(newStudent);
      setCurrentStudent(created);
      setIsRegistered(true);
      navigate("/", { replace: true });
    } catch (err) {
      console.error("Registration failed:", err);
      setError("Đăng ký thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page className="bg-white min-h-screen safe-area-top">
      <Box className="flex flex-col items-center justify-center min-h-screen px-5">
      <Box className="w-full max-w-sm space-y-6">
        <Box textAlign="center" className="mb-8">
          <Text.Title size="xLarge" className="text-blue-600">
            Đăng Ký Tài Khoản
          </Text.Title>
          <Text className="text-gray-500 mt-2">
            Vui lòng điền thông tin để tiếp tục
          </Text>
        </Box>

        {zaloUser && (
          <Box className="flex items-center justify-center mb-4">
            <img
              src={zaloUser.avatar}
              alt="avatar"
              className="w-20 h-20 rounded-full border-2 border-blue-400"
            />
          </Box>
        )}

        <Box className="space-y-4">
          <Box>
            <Text className="text-sm font-medium text-gray-600 mb-1">
              Họ và tên
            </Text>
            <Input
              placeholder="Nguyễn Văn A"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </Box>

          <Box>
            <Text className="text-sm font-medium text-gray-600 mb-1">
              Mã số sinh viên
            </Text>
            <Input
              placeholder="2024001234"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
            />
          </Box>

          <Box>
            <Text className="text-sm font-medium text-gray-600 mb-1">Lớp</Text>
            <Input
              placeholder="CNTT01"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
            />
          </Box>
        </Box>

        {error && (
          <Text className="text-red-500 text-sm text-center">{error}</Text>
        )}

        <Button
          variant="primary"
          fullWidth
          onClick={handleSubmit}
          disabled={loading}
          className="mt-4"
        >
          {loading ? <Spinner visible /> : "Đăng Ký"}
        </Button>
      </Box>
      </Box>
    </Page>
  );
}

export default RegisterPage;

