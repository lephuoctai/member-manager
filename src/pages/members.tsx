import React, { useEffect, useState, useMemo } from "react";
import {
  Box,
  Button,
  DatePicker,
  Icon,
  Input,
  Modal,
  Page,
  Select,
  Spinner,
  Text,
  useSnackbar,
} from "zmp-ui";
import { useNavigate } from "zmp-ui";
import { useAtom } from "jotai";
import { currentStudentAtom } from "@/state/auth";
import {
  getAllStudents,
  batchBanStudents,
  batchUnbanStudents,
} from "@/services/student.service";
import {
  Student,
  getFullName,
  RoleEnum,
  StatusEnum,
  ROLE_LIST,
} from "@/types/member";
import MemberCard from "@/components/member-card";

const { Option } = Select;

type SortType = "az" | "za" | "";
type RoleFilter = "" | string;
type StatusFilter = "" | string;

function MembersPage() {
  const [currentStudent] = useAtom(currentStudentAtom);
  const navigate = useNavigate();
  const { openSnackbar } = useSnackbar();

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortType>("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");
  const [showFilters, setShowFilters] = useState(false);

  // Multi-select state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Batch action modals
  const [showBanModal, setShowBanModal] = useState(false);
  const [banType, setBanType] = useState<"timed" | "permanent">("permanent");
  const [banDate, setBanDate] = useState<Date>(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  );
  const [showConfirmBan, setShowConfirmBan] = useState(false);
  const [showConfirmUnban, setShowConfirmUnban] = useState(false);
  const [batchLoading, setBatchLoading] = useState(false);

  // Guard: only admin
  useEffect(() => {
    if (currentStudent && currentStudent.role !== RoleEnum.admin) {
      navigate("/", { replace: true });
    }
  }, [currentStudent]);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const all = await getAllStudents();
      setStudents(all);
    } catch (err) {
      console.error("Failed to load students:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = useMemo(() => {
    let result = [...students];

    // Search filter
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (s) =>
          getFullName(s).toLowerCase().includes(q) ||
          s.studentId.toLowerCase().includes(q)
      );
    }

    // Role filter
    if (roleFilter) {
      result = result.filter((s) => s.role === roleFilter);
    }

    // Status filter
    if (statusFilter) {
      result = result.filter((s) => s.status === statusFilter);
    }

    // Sort
    if (sortBy === "az") {
      result.sort((a, b) => getFullName(a).localeCompare(getFullName(b), "vi"));
    } else if (sortBy === "za") {
      result.sort((a, b) => getFullName(b).localeCompare(getFullName(a), "vi"));
    }

    return result;
  }, [students, search, sortBy, roleFilter, statusFilter]);

  // ===== Multi-select handlers =====
  const enterSelectionMode = (studentId?: string) => {
    setSelectionMode(true);
    if (studentId) {
      setSelectedIds(new Set([studentId]));
    }
  };

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const toggleSelect = (studentId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) {
        next.delete(studentId);
      } else {
        next.add(studentId);
      }
      return next;
    });
  };

  const selectableStudents = useMemo(() => {
    // Exclude current admin's own account from selection
    return filteredStudents.filter(
      (s) => s.uidZalo !== currentStudent?.uidZalo
    );
  }, [filteredStudents, currentStudent]);

  const selectAll = () => {
    const ids = new Set(
      selectableStudents.map((s) => s.id!).filter(Boolean)
    );
    setSelectedIds(ids);
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const allSelected =
    selectableStudents.length > 0 &&
    selectableStudents.every((s) => selectedIds.has(s.id!));

  // Selected student objects
  const selectedStudents = useMemo(
    () => students.filter((s) => s.id && selectedIds.has(s.id)),
    [students, selectedIds]
  );

  // ===== Batch Ban =====
  const handleBatchBanStart = () => {
    if (selectedIds.size === 0) return;
    setBanType("permanent");
    setBanDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
    setShowBanModal(true);
  };

  const handleBanConfirm = () => {
    setShowBanModal(false);
    setShowConfirmBan(true);
  };

  const handleBanFinal = async () => {
    setShowConfirmBan(false);
    setBatchLoading(true);
    try {
      const until = banType === "permanent" ? null : banDate.getTime();
      const ids = Array.from(selectedIds);
      await batchBanStudents(ids, until);
      // Update local state
      setStudents((prev) =>
        prev.map((s) =>
          selectedIds.has(s.id!)
            ? { ...s, status: StatusEnum.banned, bannedUntil: until }
            : s
        )
      );
      openSnackbar({
        text: `Đã khoá ${ids.length} tài khoản.`,
        type: "success",
      });
      exitSelectionMode();
    } catch (err) {
      openSnackbar({ text: "Khoá tài khoản thất bại.", type: "error" });
    } finally {
      setBatchLoading(false);
    }
  };

  // ===== Batch Unban =====
  const handleBatchUnbanStart = () => {
    if (selectedIds.size === 0) return;
    setShowConfirmUnban(true);
  };

  const handleUnbanFinal = async () => {
    setShowConfirmUnban(false);
    setBatchLoading(true);
    try {
      const ids = Array.from(selectedIds);
      await batchUnbanStudents(ids);
      // Update local state
      setStudents((prev) =>
        prev.map((s) =>
          selectedIds.has(s.id!)
            ? { ...s, status: StatusEnum.active, bannedUntil: undefined }
            : s
        )
      );
      openSnackbar({
        text: `Đã mở khoá ${ids.length} tài khoản.`,
        type: "success",
      });
      exitSelectionMode();
    } catch (err) {
      openSnackbar({ text: "Mở khoá thất bại.", type: "error" });
    } finally {
      setBatchLoading(false);
    }
  };

  // Count selected by status
  const selectedBannedCount = selectedStudents.filter(
    (s) => s.status === StatusEnum.banned
  ).length;
  const selectedActiveCount = selectedStudents.filter(
    (s) => s.status === StatusEnum.active
  ).length;

  return (
    <Page className="bg-gray-50 dark:bg-black min-h-screen">
      {/* Header */}
      <Box className="bg-blue-600 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        {selectionMode ? (
          <>
            <Box
              className="w-8 h-8 flex items-center justify-center cursor-pointer"
              onClick={exitSelectionMode}
            >
              <Icon icon="zi-close" className="text-white" size={24} />
            </Box>
            <Text.Title size="normal" className="!text-white font-bold flex-1">
              Đã chọn {selectedIds.size}
            </Text.Title>
          </>
        ) : (
          <>
            <Box
              className="w-8 h-8 flex items-center justify-center cursor-pointer"
              onClick={() => navigate(-1)}
            >
              <Icon icon="zi-arrow-left" className="text-white" size={24} />
            </Box>
            <Text.Title
              size="normal"
              className="!text-white font-bold flex-1"
            >
              Thành viên
            </Text.Title>
            <Text className="!text-blue-100 text-sm">
              {filteredStudents.length} người
            </Text>
          </>
        )}
      </Box>

      {/* Search */}
      <Box className="px-4 pt-4 pb-2">
        <Input
          className="px-4"
          placeholder="Tìm theo họ tên hoặc MSSV..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          prefix={<Icon icon="zi-search" />}
          allowClear
        />
      </Box>

      {/* Filter Toggle */}
      <Box className="px-4 pb-2">
        <Box
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Icon icon="zi-filter" size={18} className="text-blue-600" />
          <Text className="text-blue-600 text-sm font-medium">
            {showFilters ? "Ẩn bộ lọc" : "Hiện bộ lọc"}
          </Text>
        </Box>
      </Box>

      {/* Filters */}
      {showFilters && (
        <Box className="px-4 pb-3 space-y-3">
          <Box className="grid grid-cols-3 gap-2">
            {/* Sort */}
            <Select
              placeholder="Sắp xếp"
              value={sortBy}
              onChange={(val) => setSortBy(val as SortType)}
              closeOnSelect
            >
              <Option value="" title="Mặc định" />
              <Option value="az" title="A → Z" />
              <Option value="za" title="Z → A" />
            </Select>

            {/* Role Filter */}
            <Select
              placeholder="Vai trò"
              value={roleFilter}
              onChange={(val) => setRoleFilter(val as string)}
              closeOnSelect
            >
              <Option value="" title="Tất cả" />
              {ROLE_LIST.map((r) => (
                <Option key={r} value={r} title={r} />
              ))}
            </Select>

            {/* Status Filter */}
            <Select
              placeholder="Trạng thái"
              value={statusFilter}
              onChange={(val) => setStatusFilter(val as string)}
              closeOnSelect
            >
              <Option value="" title="Tất cả" />
              <Option value={StatusEnum.active} title={StatusEnum.active} />
              <Option value={StatusEnum.banned} title={StatusEnum.banned} />
            </Select>
          </Box>
        </Box>
      )}

      {/* Selection Mode Toolbar */}
      {selectionMode && (
        <Box className="px-4 pb-3">
          <Box className="flex items-center gap-2">
            <Box
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full border border-gray-200 cursor-pointer active:bg-gray-100"
              onClick={allSelected ? deselectAll : selectAll}
            >
              <Box
                className={`w-4 h-4 rounded border flex items-center justify-center ${
                  allSelected
                    ? "bg-orange-500 border-orange-500"
                    : "border-gray-400"
                }`}
              >
                {allSelected && (
                  <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
                    <path
                      d="M3 7L6 10L11 4"
                      stroke="white"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </Box>
              <Text className="text-sm font-medium">
                {allSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
              </Text>
            </Box>
            <Text className="text-xs text-gray-400 ml-auto">
              Nhấn vào thành viên để chọn/bỏ chọn
            </Text>
          </Box>
        </Box>
      )}

      {/* Members List */}
      <Box className={`px-4 space-y-3 ${selectionMode ? "pb-28" : "pb-6"}`}>
        {loading ? (
          <Box className="flex justify-center py-12">
            <Spinner visible />
          </Box>
        ) : filteredStudents.length === 0 ? (
          <Box className="flex flex-col items-center py-12">
            <Text className="text-gray-400 text-lg">
              Không tìm thấy thành viên
            </Text>
          </Box>
        ) : (
          filteredStudents.map((student) => {
            const isOwnAccount =
              student.uidZalo === currentStudent?.uidZalo;
            return (
              <MemberCard
                key={student.id}
                student={student}
                onClick={() =>
                  navigate(`/member-detail?id=${student.id}`)
                }
                selectionMode={selectionMode}
                selected={selectedIds.has(student.id!)}
                onLongPress={
                  !isOwnAccount
                    ? () => enterSelectionMode(student.id!)
                    : undefined
                }
                onToggleSelect={
                  !isOwnAccount
                    ? () => toggleSelect(student.id!)
                    : undefined
                }
              />
            );
          })
        )}
      </Box>

      {/* Batch Action Bar (sticky bottom) */}
      {selectionMode && selectedIds.size > 0 && (
        <Box className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-gray-200 px-4 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.1)]">
          <Box className="flex items-center gap-2 mb-2">
            <Text className="text-sm text-gray-600">
              Đã chọn <Text className="font-bold inline">{selectedIds.size}</Text> thành viên
            </Text>
            {selectedActiveCount > 0 && (
              <Box className="px-2 py-0.5 bg-green-100 rounded-full">
                <Text className="text-xs text-green-700">{selectedActiveCount} hoạt động</Text>
              </Box>
            )}
            {selectedBannedCount > 0 && (
              <Box className="px-2 py-0.5 bg-red-100 rounded-full">
                <Text className="text-xs text-red-700">{selectedBannedCount} đang khoá</Text>
              </Box>
            )}
          </Box>
          <Box className="flex gap-3">
            {selectedActiveCount > 0 && (
              <Button
                variant="secondary"
                fullWidth
                className="!border-red-500 !text-red-600"
                prefixIcon={<Icon icon="zi-lock" />}
                onClick={handleBatchBanStart}
                loading={batchLoading}
              >
                Khoá ({selectedActiveCount})
              </Button>
            )}
            {selectedBannedCount > 0 && (
              <Button
                variant="secondary"
                fullWidth
                className="!border-green-500 !text-green-600"
                prefixIcon={<Icon icon="zi-unlock" />}
                onClick={handleBatchUnbanStart}
                loading={batchLoading}
              >
                Mở khoá ({selectedBannedCount})
              </Button>
            )}
          </Box>
        </Box>
      )}

      {/* === BATCH BAN MODAL (Step 1) === */}
      <Modal
        visible={showBanModal}
        title="Khoá hàng loạt"
        onClose={() => setShowBanModal(false)}
        actions={[
          { text: "Huỷ", close: true },
          { text: "Tiếp tục", highLight: true, onClick: handleBanConfirm },
        ]}
      >
        <Box className="space-y-4 py-2">
          <Text className="text-gray-600">
            Khoá <Text className="font-bold inline">{selectedActiveCount}</Text> tài
            khoản đang hoạt động. Chọn hình thức:
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

      {/* === BATCH BAN CONFIRM (Step 2) === */}
      <Modal
        visible={showConfirmBan}
        title="⚠️ Xác nhận khoá hàng loạt"
        onClose={() => setShowConfirmBan(false)}
        actions={[
          { text: "Huỷ", close: true },
          {
            text: `Khoá ${selectedActiveCount} tài khoản`,
            highLight: true,
            danger: true,
            onClick: handleBanFinal,
          },
        ]}
      >
        <Box className="py-2">
          <Text className="text-gray-700">
            Bạn có chắc chắn muốn khoá{" "}
            <Text className="font-bold inline">{selectedActiveCount}</Text> tài khoản?
          </Text>
          <Text className="text-red-500 font-medium mt-2">
            {banType === "permanent"
              ? "Hình thức: Vô thời hạn"
              : `Hình thức: Có thời hạn`}
          </Text>
          <Box className="mt-3 max-h-32 overflow-y-auto space-y-1 bg-gray-50 rounded-xl p-3">
            {selectedStudents
              .filter((s) => s.status === StatusEnum.active)
              .map((s) => (
                <Text key={s.id} className="text-sm text-gray-700">
                  • {getFullName(s)} ({s.studentId})
                </Text>
              ))}
          </Box>
        </Box>
      </Modal>

      {/* === BATCH UNBAN CONFIRM === */}
      <Modal
        visible={showConfirmUnban}
        title="Mở khoá hàng loạt"
        onClose={() => setShowConfirmUnban(false)}
        actions={[
          { text: "Huỷ", close: true },
          {
            text: `Mở khoá ${selectedBannedCount} tài khoản`,
            highLight: true,
            onClick: handleUnbanFinal,
          },
        ]}
      >
        <Box className="py-2">
          <Text className="text-gray-700">
            Bạn có chắc chắn muốn mở khoá{" "}
            <Text className="font-bold inline">{selectedBannedCount}</Text> tài khoản?
          </Text>
          <Box className="mt-3 max-h-32 overflow-y-auto space-y-1 bg-gray-50 rounded-xl p-3">
            {selectedStudents
              .filter((s) => s.status === StatusEnum.banned)
              .map((s) => (
                <Text key={s.id} className="text-sm text-gray-700">
                  • {getFullName(s)} ({s.studentId})
                </Text>
              ))}
          </Box>
        </Box>
      </Modal>
    </Page>
  );
}

export default MembersPage;

