import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  DatePicker,
  Icon,
  Modal,
  Page,
  Select,
  Spinner,
  Text,
  useSnackbar,
} from "zmp-ui";
import { useNavigate, useSearchParams } from "zmp-ui";
import { useAtom } from "jotai";
import { currentStudentAtom } from "@/state/auth";
import {
  getStudentById,
  updateStudent,
  banStudent,
  unbanStudent,
} from "@/services/student.service";
import {
  Student,
  getFullName,
  RoleEnum,
  StatusEnum,
  ROLE_LIST,
} from "@/types/member";
import { format, formatDistanceToNow, differenceInDays } from "date-fns";
import { vi } from "date-fns/locale";

const { Option } = Select;

function MemberDetailPage() {
  const [currentStudent] = useAtom(currentStudentAtom);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { openSnackbar } = useSnackbar();

  const memberId = searchParams.get("id") || "";

  const [member, setMember] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit role
  const [isEditingRole, setIsEditingRole] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");
  const [savingRole, setSavingRole] = useState(false);

  // Ban modals
  const [showBanModal, setShowBanModal] = useState(false);
  const [banType, setBanType] = useState<"timed" | "permanent">("permanent");
  const [banDate, setBanDate] = useState<Date>(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  );
  const [showConfirmBan, setShowConfirmBan] = useState(false);

  // Unban
  const [showConfirmUnban, setShowConfirmUnban] = useState(false);

  const isOwnAccount = currentStudent?.uidZalo === member?.uidZalo;
  const isBanned = member?.status === StatusEnum.banned;

  useEffect(() => {
    loadMember();
  }, [memberId]);

  const loadMember = async () => {
    if (!memberId) return;
    setLoading(true);
    try {
      const data = await getStudentById(memberId);
      setMember(data);
      if (data) setSelectedRole(data.role);
    } catch (err) {
      console.error("Failed to load member:", err);
    } finally {
      setLoading(false);
    }
  };

  // === ROLE EDIT ===
  const handleSaveRole = async () => {
    if (!member || !selectedRole) return;
    setSavingRole(true);
    try {
      await updateStudent(member.id!, { role: selectedRole });
      setMember({ ...member, role: selectedRole });
      setIsEditingRole(false);
      openSnackbar({ text: "Cập nhật vai trò thành công!", type: "success" });
    } catch (err) {
      openSnackbar({ text: "Cập nhật thất bại.", type: "error" });
    } finally {
      setSavingRole(false);
    }
  };

  // === BAN ===
  const handleBanConfirm = () => {
    // First confirmation -> show second
    setShowBanModal(false);
    setShowConfirmBan(true);
  };

  const handleBanFinal = async () => {
    if (!member) return;
    setShowConfirmBan(false);
    try {
      const until = banType === "permanent" ? null : banDate.getTime();
      await banStudent(member.id!, until);
      setMember({
        ...member,
        status: StatusEnum.banned,
        bannedUntil: until,
      });
      openSnackbar({ text: "Đã khoá tài khoản.", type: "success" });
    } catch (err) {
      openSnackbar({ text: "Khoá tài khoản thất bại.", type: "error" });
    }
  };

  // === UNBAN ===
  const handleUnbanFirst = () => {
    setShowConfirmUnban(true);
  };

  const [showUnbanFinal, setShowUnbanFinal] = useState(false);

  const handleUnbanSecond = () => {
    setShowConfirmUnban(false);
    setShowUnbanFinal(true);
  };

  const handleUnbanFinal = async () => {
    if (!member) return;
    setShowUnbanFinal(false);
    try {
      await unbanStudent(member.id!);
      setMember({
        ...member,
        status: StatusEnum.active,
        bannedUntil: undefined,
      });
      openSnackbar({ text: "Đã mở khoá tài khoản.", type: "success" });
    } catch (err) {
      openSnackbar({ text: "Mở khoá thất bại.", type: "error" });
    }
  };

  const getBanInfoText = () => {
    if (!member) return "";
    if (
      member.bannedUntil === null ||
      member.bannedUntil === undefined
    ) {
      return "Khoá vô thời hạn";
    }
    const days = differenceInDays(new Date(member.bannedUntil), new Date());
    return `Còn ${days > 0 ? days : 0} ngày (đến ${format(
      new Date(member.bannedUntil),
      "dd/MM/yyyy HH:mm",
      { locale: vi }
    )})`;
  };

  if (loading) {
    return (
      <Page className="flex items-center justify-center min-h-screen">
        <Spinner visible />
      </Page>
    );
  }

  if (!member) {
    return (
      <Page className="flex items-center justify-center min-h-screen">
        <Text className="text-gray-400">Không tìm thấy thành viên</Text>
      </Page>
    );
  }

  return (
    <Page className="bg-gray-50 min-h-screen">
      {/* Header */}
      <Box className="bg-blue-600 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Box
          className="w-8 h-8 flex items-center justify-center cursor-pointer"
          onClick={() => navigate(-1)}
        >
          <Icon icon="zi-arrow-left" className="text-white" size={24} />
        </Box>
        <Text.Title size="normal" className="!text-white font-bold">
          Chi tiết thành viên
        </Text.Title>
      </Box>

      {/* Profile Header */}
      <Box className="bg-blue-600 rounded-b-3xl pb-6 mb-3 flex flex-col items-center">
        <Box className="w-20 h-20 bg-blue-400 rounded-full flex items-center justify-center border-4 border-white">
          <Text className="text-white text-2xl font-bold">
            {member.firstName.charAt(0).toUpperCase()}
          </Text>
        </Box>
        <Text className="!text-white font-bold text-xl mt-3">
          {getFullName(member)}
        </Text>
        <Box className="flex items-center gap-2 mt-1">
          <Box
            className={`w-2 h-2 rounded-full ${
              isBanned ? "bg-red-400" : "bg-green-400"
            }`}
          />
          <Text className="!text-blue-100 text-sm">{member.status}</Text>
        </Box>
      </Box>

      {/* Info */}
      <Box className="px-4 py-4">
        <Box className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
          <InfoRow label="Họ và tên" value={getFullName(member)} />
          <InfoRow label="Mã số sinh viên" value={member.studentId} />
          <InfoRow label="Lớp" value={member.grade} />
          <InfoRow label="UID Zalo" value={member.uidZalo} />

          {/* Role - editable */}
          <Box className="space-y-1">
            <Text className="text-xs text-gray-500 font-medium">Vai trò</Text>
            {isEditingRole ? (
              <Select
                value={selectedRole}
                onChange={(val) => setSelectedRole(val as string)}
                closeOnSelect
              >
                {ROLE_LIST.map((r) => (
                  <Option key={r} value={r} title={r} />
                ))}
              </Select>
            ) : (
              <Box className="flex items-center gap-2">
                <Box className="px-3 py-1 bg-blue-50 rounded-full">
                  <Text className="text-blue-600 text-sm font-medium">
                    {member.role}
                  </Text>
                </Box>
              </Box>
            )}
          </Box>

          <InfoRow label="Trạng thái" value={member.status} />

          {isBanned && (
            <Box className="bg-red-50 rounded-xl p-3">
              <Text className="text-red-600 text-sm font-medium">
                {getBanInfoText()}
              </Text>
            </Box>
          )}
        </Box>

        {/* Actions */}
        <Box className="pt-4 space-y-3">
          {/* Edit Role */}
          {isEditingRole ? (
            <Box className="flex gap-3">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => {
                  setIsEditingRole(false);
                  setSelectedRole(member.role);
                }}
              >
                Huỷ
              </Button>
              <Button
                variant="primary"
                fullWidth
                onClick={handleSaveRole}
                loading={savingRole}
              >
                Lưu vai trò
              </Button>
            </Box>
          ) : (
            <Button
              variant="primary"
              fullWidth
              prefixIcon={<Icon icon="zi-edit" />}
              onClick={() => setIsEditingRole(true)}
              disabled={isOwnAccount}
            >
              {isOwnAccount
                ? "Không thể chỉnh sửa tài khoản mình"
                : "Chỉnh sửa vai trò"}
            </Button>
          )}

          {/* Ban / Unban */}
          {!isOwnAccount && (
            <>
              {isBanned ? (
                <Button
                  variant="secondary"
                  fullWidth
                  className="!border-green-500 !text-green-600"
                  prefixIcon={<Icon icon="zi-unlock" />}
                  onClick={handleUnbanFirst}
                >
                  Mở khoá tài khoản
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  fullWidth
                  className="!border-red-500 !text-red-600"
                  prefixIcon={<Icon icon="zi-lock" />}
                  onClick={() => setShowBanModal(true)}
                >
                  Khoá tài khoản
                </Button>
              )}
            </>
          )}
        </Box>
      </Box>

      {/* === BAN MODAL (Step 1) === */}
      <Modal
        visible={showBanModal}
        title="Khoá tài khoản"
        onClose={() => setShowBanModal(false)}
        actions={[
          {
            text: "Huỷ",
            close: true,
          },
          {
            text: "Tiếp tục",
            highLight: true,
            onClick: handleBanConfirm,
          },
        ]}
      >
        <Box className="space-y-4 py-2">
          <Text className="text-gray-600">
            Chọn hình thức khoá cho{" "}
            <Text className="font-bold inline">{getFullName(member)}</Text>:
          </Text>

          <Box className="space-y-3">
            <Box
              className={`p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                banType === "permanent"
                  ? "border-red-500 bg-red-50"
                  : "border-gray-200"
              }`}
              onClick={() => setBanType("permanent")}
            >
              <Text className="font-medium">Vô thời hạn</Text>
              <Text className="text-xs text-gray-500">
                Khoá cho đến khi quản lý mở khoá
              </Text>
            </Box>

            <Box
              className={`p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                banType === "timed"
                  ? "border-orange-500 bg-orange-50"
                  : "border-gray-200"
              }`}
              onClick={() => setBanType("timed")}
            >
              <Text className="font-medium">Có thời hạn</Text>
              <Text className="text-xs text-gray-500">
                Chọn thời điểm hết hạn khoá
              </Text>
            </Box>
          </Box>

          {banType === "timed" && (
            <Box className="pt-2">
              <Text className="text-sm text-gray-600 mb-2">
                Hết hạn khoá vào:
              </Text>
              <DatePicker
                value={banDate}
                onChange={(date) => setBanDate(date)}
                title="Chọn ngày hết hạn"
              />
            </Box>
          )}
        </Box>
      </Modal>

      {/* === BAN CONFIRM (Step 2) === */}
      <Modal
        visible={showConfirmBan}
        title="⚠️ Xác nhận khoá"
        onClose={() => setShowConfirmBan(false)}
        actions={[
          {
            text: "Huỷ",
            close: true,
          },
          {
            text: "Xác nhận khoá",
            highLight: true,
            danger: true,
            onClick: handleBanFinal,
          },
        ]}
      >
        <Box className="py-2">
          <Text className="text-gray-700">
            Bạn có chắc chắn muốn khoá tài khoản{" "}
            <Text className="font-bold inline">{getFullName(member)}</Text>?
          </Text>
          <Text className="text-red-500 font-medium mt-2">
            {banType === "permanent"
              ? "Hình thức: Vô thời hạn"
              : `Hình thức: Có thời hạn - đến ${format(
                  banDate,
                  "dd/MM/yyyy HH:mm",
                  { locale: vi }
                )}`}
          </Text>
        </Box>
      </Modal>

      {/* === UNBAN CONFIRM (Step 1) === */}
      <Modal
        visible={showConfirmUnban}
        title="Mở khoá tài khoản"
        onClose={() => setShowConfirmUnban(false)}
        actions={[
          {
            text: "Huỷ",
            close: true,
          },
          {
            text: "Tiếp tục",
            highLight: true,
            onClick: handleUnbanSecond,
          },
        ]}
      >
        <Box className="py-2">
          <Text className="text-gray-700">
            Bạn muốn mở khoá tài khoản{" "}
            <Text className="font-bold inline">{getFullName(member)}</Text>?
          </Text>
          <Box className="mt-3 p-3 bg-orange-50 rounded-xl">
            <Text className="text-orange-700 text-sm font-medium">
              Thông tin khoá hiện tại: {getBanInfoText()}
            </Text>
          </Box>
        </Box>
      </Modal>

      {/* === UNBAN CONFIRM (Step 2) === */}
      <Modal
        visible={showUnbanFinal}
        title="⚠️ Xác nhận mở khoá"
        onClose={() => setShowUnbanFinal(false)}
        actions={[
          {
            text: "Huỷ",
            close: true,
          },
          {
            text: "Xác nhận mở khoá",
            highLight: true,
            onClick: handleUnbanFinal,
          },
        ]}
      >
        <Box className="py-2">
          <Text className="text-gray-700">
            Xác nhận lần 2: Bạn chắc chắn muốn mở khoá tài khoản{" "}
            <Text className="font-bold inline">{getFullName(member)}</Text>?
          </Text>
        </Box>
      </Modal>
    </Page>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Box className="space-y-1">
      <Text className="text-xs text-gray-500 font-medium">{label}</Text>
      <Text className="text-base font-medium">{value}</Text>
    </Box>
  );
}

export default MemberDetailPage;

