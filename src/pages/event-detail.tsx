import React, { useEffect, useState, useMemo, useRef } from "react";
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
import { useNavigate, useSearchParams } from "zmp-ui";
import { useAtom } from "jotai";
import { currentStudentAtom } from "@/state/auth";
import {
  getEventById,
  updateEvent,
  addAttendee,
  removeAttendees,
} from "@/services/event.service";
import {
  getAllStudents,
} from "@/services/student.service";
import {
  AttendanceEvent,
  EventStatusEnum,
  EVENT_STATUS_LIST,
} from "@/types/event";
import { Student, getFullName, RoleEnum, ROLE_LIST } from "@/types/member";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { scanQRCode } from "zmp-sdk";

const { Option } = Select;

type AttendeeEntry = {
  studentId: string;
  student: Student | null;
  scannedAt: number;
};

type SortType = "az" | "za" | "time-asc" | "time-desc" | "";
type RoleFilter = "" | string;

function EventDetailPage() {
  const [currentStudent] = useAtom(currentStudentAtom);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { openSnackbar } = useSnackbar();

  const eventId = searchParams.get("id") || "";
  const isAdmin = currentStudent?.role === RoleEnum.admin;

  const [event, setEvent] = useState<AttendanceEvent | null>(null);
  const [loading, setLoading] = useState(true);

  // Tabs
  const [activeTab, setActiveTab] = useState<"scan" | "list">("scan");

  // QR scan
  const [scanning, setScanning] = useState(false);
  const [scanCount, setScanCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  // Attendee list
  const [attendeeList, setAttendeeList] = useState<AttendeeEntry[]>([]);
  const [studentsMap, setStudentsMap] = useState<Record<string, Student>>({});
  const studentsMapRef = useRef<Record<string, Student>>({});
  const [loadingAttendees, setLoadingAttendees] = useState(false);

  // Attendee filters
  const [attendeeSearch, setAttendeeSearch] = useState("");
  const [attendeeSortBy, setAttendeeSortBy] = useState<SortType>("");
  const [attendeeRoleFilter, setAttendeeRoleFilter] = useState<RoleFilter>("");
  const [showAttendeeFilters, setShowAttendeeFilters] = useState(false);

  // Attendee multi-select
  const [attendeeSelectionMode, setAttendeeSelectionMode] = useState(false);
  const [selectedAttendeeIds, setSelectedAttendeeIds] = useState<Set<string>>(
    new Set()
  );
  const [showDeleteAttendeeConfirm, setShowDeleteAttendeeConfirm] =
    useState(false);
  const [deletingAttendees, setDeletingAttendees] = useState(false);

  // Edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [editDesc, setEditDesc] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editExp, setEditExp] = useState<Date>(new Date());
  const [editHasExp, setEditHasExp] = useState(true);
  const [savingEdit, setSavingEdit] = useState(false);

  // Exit confirmation
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const isClosed =
    event?.status === EventStatusEnum.closed ||
    event?.status === EventStatusEnum.paused;

  useEffect(() => {
    loadEvent();
    preloadStudents();
  }, [eventId]);

  useEffect(() => {
    if (event) {
      if (
        event.status === EventStatusEnum.closed ||
        event.status === EventStatusEnum.paused
      ) {
        setActiveTab("list");
      }
      buildAttendeeList();
    }
  }, [event, studentsMap]);

  const preloadStudents = async () => {
    setLoadingAttendees(true);
    try {
      const allStudents = await getAllStudents();
      const map: Record<string, Student> = {};
      allStudents.forEach((s) => {
        map[s.studentId] = s;
      });
      setStudentsMap(map);
      studentsMapRef.current = map;
    } catch (err) {
      console.error("Failed to preload students:", err);
    } finally {
      setLoadingAttendees(false);
    }
  };

  const loadEvent = async () => {
    if (!eventId) return;
    setLoading(true);
    try {
      const data = await getEventById(decodeURIComponent(eventId));
      setEvent(data);
    } catch (err) {
      console.error("Failed to load event:", err);
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch event from Firestore (sync with other scanners)
  const refreshEvent = async () => {
    if (!eventId) return;
    setRefreshing(true);
    try {
      const data = await getEventById(decodeURIComponent(eventId));
      if (data) setEvent(data);
    } catch (err) {
      console.error("Failed to refresh event:", err);
    } finally {
      setRefreshing(false);
    }
  };

  const buildAttendeeList = () => {
    if (!event || !event.attendee) {
      setAttendeeList([]);
      return;
    }
    const sMap = studentsMapRef.current;
    const entries: AttendeeEntry[] = Object.entries(event.attendee).map(
      ([sid, ts]) => ({
        studentId: sid,
        student: sMap[sid] || null,
        scannedAt: ts,
      })
    );
    setAttendeeList(entries);
  };

  const filteredAttendees = useMemo(() => {
    let result = [...attendeeList];

    if (attendeeSearch.trim()) {
      const q = attendeeSearch.trim().toLowerCase();
      result = result.filter(
        (a) =>
          a.studentId.toLowerCase().includes(q) ||
          (a.student && getFullName(a.student).toLowerCase().includes(q))
      );
    }

    if (attendeeRoleFilter) {
      result = result.filter(
        (a) => a.student && a.student.role === attendeeRoleFilter
      );
    }

    if (attendeeSortBy === "az") {
      result.sort((a, b) => {
        const na = a.student ? getFullName(a.student) : a.studentId;
        const nb = b.student ? getFullName(b.student) : b.studentId;
        return na.localeCompare(nb, "vi");
      });
    } else if (attendeeSortBy === "za") {
      result.sort((a, b) => {
        const na = a.student ? getFullName(a.student) : a.studentId;
        const nb = b.student ? getFullName(b.student) : b.studentId;
        return nb.localeCompare(na, "vi");
      });
    } else if (attendeeSortBy === "time-asc") {
      result.sort((a, b) => a.scannedAt - b.scannedAt);
    } else if (attendeeSortBy === "time-desc") {
      result.sort((a, b) => b.scannedAt - a.scannedAt);
    } else {
      result.sort((a, b) => b.scannedAt - a.scannedAt);
    }

    return result;
  }, [attendeeList, attendeeSearch, attendeeSortBy, attendeeRoleFilter]);

  // === QR Scan (optimized for high-volume) ===
  const handleScan = async () => {
    if (isClosed) {
      openSnackbar({ text: "Sự kiện đã đóng, không thể quét.", type: "error" });
      return;
    }

    setScanning(true);
    try {
      const { content } = await scanQRCode({});
      if (!content) {
        openSnackbar({ text: "Không đọc được mã QR.", type: "error" });
        return;
      }

      const scannedStudentId = content.trim();

      // Check duplicate (local, instant)
      if (event?.attendee && event.attendee[scannedStudentId]) {
        const existingTime = event.attendee[scannedStudentId];
        openSnackbar({
          text: `${scannedStudentId} đã điểm danh lúc ${format(
            new Date(existingTime),
            "HH:mm",
            { locale: vi }
          )}`,
          type: "warning",
        });
        return;
      }

      // Validate student (local lookup, instant)
      const sMap = studentsMapRef.current;
      const student = sMap[scannedStudentId] || null;
      if (!student) {
        openSnackbar({
          text: `Không tìm thấy MSSV: ${scannedStudentId}`,
          type: "error",
        });
        return;
      }

      // Optimistic local update first (instant UI feedback)
      const now = Date.now();
      const updatedAttendee = {
        ...event!.attendee,
        [scannedStudentId]: now,
      };
      setEvent({ ...event!, attendee: updatedAttendee });
      setScanCount((c) => c + 1);

      openSnackbar({
        text: `Quét được: ${getFullName(student)} (${scannedStudentId})`,
        type: "success",
      });

      // Persist to Firestore in background (non-blocking)
      addAttendee(event!.eventId, scannedStudentId, now).catch(() => {
        openSnackbar({ text: "Lỗi lưu điểm danh, thử lại!", type: "error" });
      });
    } catch (err: any) {
      openSnackbar({ text: "Lỗi quét QR. Thử lại!", type: "error" });
    } finally {
      setScanning(false);
    }
  };

  // === Attendee multi-select ===
  const enterAttendeeSelection = (sid?: string) => {
    if (!isAdmin) return;
    setAttendeeSelectionMode(true);
    if (sid) setSelectedAttendeeIds(new Set([sid]));
  };

  const exitAttendeeSelection = () => {
    setAttendeeSelectionMode(false);
    setSelectedAttendeeIds(new Set());
  };

  const toggleAttendeeSelect = (sid: string) => {
    setSelectedAttendeeIds((prev) => {
      const next = new Set(prev);
      if (next.has(sid)) next.delete(sid);
      else next.add(sid);
      return next;
    });
  };

  const allAttendeesSelected =
    filteredAttendees.length > 0 &&
    filteredAttendees.every((a) => selectedAttendeeIds.has(a.studentId));

  const selectAllAttendees = () => {
    setSelectedAttendeeIds(
      new Set(filteredAttendees.map((a) => a.studentId))
    );
  };

  const deselectAllAttendees = () => setSelectedAttendeeIds(new Set());

  const handleDeleteAttendees = async () => {
    if (!event) return;
    setDeletingAttendees(true);
    try {
      const ids = Array.from(selectedAttendeeIds);
      await removeAttendees(event.eventId, ids);

      const updatedAttendee = { ...event.attendee };
      ids.forEach((id) => delete updatedAttendee[id]);
      setEvent({ ...event, attendee: updatedAttendee });

      setShowDeleteAttendeeConfirm(false);
      exitAttendeeSelection();
      openSnackbar({
        text: `Đã xoá ${ids.length} điểm danh.`,
        type: "success",
      });
    } catch (err) {
      openSnackbar({ text: "Xoá thất bại.", type: "error" });
    } finally {
      setDeletingAttendees(false);
    }
  };

  // === Edit mode ===
  const startEditing = () => {
    if (!event) return;
    setEditDesc(event.desc);
    setEditStatus(event.status);
    setEditHasExp(event.exp !== null);
    setEditExp(
      event.exp
        ? new Date(event.exp)
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    );
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    if (!event) return;
    setSavingEdit(true);
    try {
      const updates: any = {
        desc: editDesc.trim(),
        status: editStatus,
        exp: editHasExp ? editExp.getTime() : null,
      };
      await updateEvent(event.eventId, updates);
      setEvent({ ...event, ...updates });
      setIsEditing(false);
      openSnackbar({ text: "Cập nhật thành công!", type: "success" });
    } catch (err) {
      openSnackbar({ text: "Cập nhật thất bại.", type: "error" });
    } finally {
      setSavingEdit(false);
    }
  };

  // === Back / Exit confirm ===
  const handleBack = () => {
    if (isEditing) {
      setShowExitConfirm(true);
    } else {
      navigate(-1);
    }
  };

  const handleExitConfirm = () => {
    setShowExitConfirm(false);
    setIsEditing(false);
    navigate(-1);
  };

  if (loading) {
    return (
      <Page className="flex items-center justify-center min-h-screen">
        <Spinner visible />
      </Page>
    );
  }

  if (!event) {
    return (
      <Page className="flex items-center justify-center min-h-screen">
        <Text className="text-gray-400">Không tìm thấy sự kiện</Text>
      </Page>
    );
  }

  const statusColor =
    event.status === EventStatusEnum.open
      ? "bg-green-400"
      : event.status === EventStatusEnum.paused
      ? "bg-yellow-400"
      : "bg-red-400";

  return (
    <Page className="bg-gray-50 min-h-screen">
      {/* Header */}
      <Box className="bg-blue-600 px-4 py-3 flex items-center gap-3 sticky top-0 z-10 safe-area-top">
        <Box
          className="w-8 h-8 flex items-center justify-center cursor-pointer"
          onClick={handleBack}
        >
          <Icon icon="zi-arrow-left" className="text-white" size={24} />
        </Box>
        <Box className="flex-1 min-w-0">
          <Text.Title size="normal" className="!text-white font-bold truncate">
            {event.title}
          </Text.Title>
        </Box>
        <Box className="flex items-center gap-1">
          <Box className={`w-2 h-2 rounded-full ${statusColor}`} />
          <Text className="!text-blue-100 text-xs">{event.status}</Text>
        </Box>
        {isAdmin && !isEditing && (
          <Box
            className="w-8 h-8 flex items-center justify-center cursor-pointer"
            onClick={startEditing}
          >
            <Icon icon="zi-edit" className="text-white" size={20} />
          </Box>
        )}
      </Box>

      {/* Edit Mode */}
      {isEditing && (
        <Box className="px-4 py-4 bg-white border-b border-gray-200">
          <Text className="font-bold text-lg mb-3">Chỉnh sửa sự kiện</Text>
          <Box className="space-y-4">
            <Box>
              <Text className="text-sm text-gray-500 mb-1">
                Tiêu đề (không thể sửa)
              </Text>
              <Box className="px-3 py-2 bg-gray-100 rounded-lg">
                <Text className="text-gray-600">{event.title}</Text>
              </Box>
            </Box>
            <Box>
              <Text className="text-sm text-gray-600 mb-1">Mô tả</Text>
              <Input
                placeholder="Nhập mô tả..."
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
              />
            </Box>
            <Box>
              <Text className="text-sm text-gray-600 mb-1">Trạng thái</Text>
              <Select
                value={editStatus}
                onChange={(val) => setEditStatus(val as string)}
                closeOnSelect
              >
                {EVENT_STATUS_LIST.map((s) => (
                  <Option key={s} value={s} title={s} />
                ))}
              </Select>
            </Box>
            <Box>
              <Box className="flex items-center gap-2 mb-2">
                <Text className="text-sm text-gray-600">Thời điểm đóng</Text>
                <Box
                  className={`w-10 h-5 rounded-full cursor-pointer transition-colors flex items-center px-0.5 ${
                    editHasExp
                      ? "bg-blue-500 justify-end"
                      : "bg-gray-300 justify-start"
                  }`}
                  onClick={() => setEditHasExp(!editHasExp)}
                >
                  <Box className="w-4 h-4 bg-white rounded-full shadow" />
                </Box>
              </Box>
              {editHasExp && (
                <DatePicker
                  value={editExp}
                  onChange={(date) => setEditExp(date)}
                  title="Chọn thời điểm đóng"
                />
              )}
            </Box>
            <Box className="flex gap-3">
              <Button variant="secondary" fullWidth onClick={cancelEditing} disabled={savingEdit}>
                Huỷ
              </Button>
              <Button
                variant="primary"
                fullWidth
                onClick={handleSaveEdit}
                loading={savingEdit}
                disabled={savingEdit}
              >
                Lưu
              </Button>
            </Box>
          </Box>
        </Box>
      )}

      {/* Event Info (when not editing) */}
      {!isEditing && (
        <Box className="px-4 py-3 bg-white border-b border-gray-200">
          {event.desc && (
            <Text className="text-gray-600 text-sm mb-2">{event.desc}</Text>
          )}
          <Box className="flex items-center gap-4 text-xs text-gray-500">
            <Text className="text-xs">
              Tạo:{" "}
              {format(new Date(event.date), "dd/MM/yyyy HH:mm", {
                locale: vi,
              })}
            </Text>
            {event.exp && (
              <Text className="text-xs">
                Đóng:{" "}
                {format(new Date(event.exp), "dd/MM/yyyy HH:mm", {
                  locale: vi,
                })}
              </Text>
            )}
            <Text className="text-xs ml-auto">
              {Object.keys(event.attendee || {}).length} người
            </Text>
          </Box>
        </Box>
      )}

      {/* Tabs */}
      {!isEditing && (
        <Box className="flex bg-white border-b border-gray-200">
          <Box
            className={`flex-1 py-3 text-center cursor-pointer transition-colors ${
              activeTab === "scan"
                ? "border-b-2 border-blue-600"
                : "text-gray-400"
            }`}
            onClick={() => !isClosed && setActiveTab("scan")}
          >
            <Text
              className={`text-sm font-medium ${
                activeTab === "scan" ? "text-blue-600" : "text-gray-400"
              } ${isClosed ? "opacity-50" : ""}`}
            >
              Điểm danh
            </Text>
          </Box>
          <Box
            className={`flex-1 py-3 text-center cursor-pointer transition-colors ${
              activeTab === "list"
                ? "border-b-2 border-blue-600"
                : "text-gray-400"
            }`}
            onClick={() => {
              setActiveTab("list");
              refreshEvent();
            }}
          >
            <Text
              className={`text-sm font-medium ${
                activeTab === "list" ? "text-blue-600" : "text-gray-400"
              }`}
            >
              Danh sách ({Object.keys(event.attendee || {}).length})
            </Text>
          </Box>
        </Box>
      )}

      {/* === SCAN TAB === */}
      {!isEditing && activeTab === "scan" && (
        <Box className="flex flex-col items-center justify-center py-16 px-4">
          {isClosed ? (
            <Box className="text-center space-y-3">
              <Box className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <Icon icon="zi-lock" className="text-red-500" size={36} />
              </Box>
              <Text className="text-gray-600 font-medium">
                Sự kiện đã đóng
              </Text>
              <Text className="text-gray-400 text-sm">
                Không thể quét điểm danh khi sự kiện đã đóng hoặc tạm đóng.
              </Text>
            </Box>
          ) : (
            <Box className="text-center space-y-6">
              <Box className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 7V5a2 2 0 012-2h2" />
                  <path d="M17 3h2a2 2 0 012 2v2" />
                  <path d="M21 17v2a2 2 0 01-2 2h-2" />
                  <path d="M7 21H5a2 2 0 01-2-2v-2" />
                  <line x1="7" y1="12" x2="17" y2="12" />
                </svg>
              </Box>
              <Box>
                <Text className="text-gray-700 font-medium text-lg">
                  Quét QR điểm danh
                </Text>
                <Text className="text-gray-400 text-sm mt-1">
                  Quét xong sẽ tự động hiện kết quả, bấm tiếp để quét tiếp
                </Text>
              </Box>

              {/* Scan count badge */}
              <Box className="flex items-center justify-center gap-3">
                <Box className="px-4 py-2 bg-blue-50 rounded-full">
                  <Text className="text-blue-600 font-semibold text-sm">
                    Tổng: {Object.keys(event.attendee || {}).length} người
                  </Text>
                </Box>
                {scanCount > 0 && (
                  <Box className="px-4 py-2 bg-green-50 rounded-full">
                    <Text className="text-green-600 font-semibold text-sm">
                      Phiên này: +{scanCount}
                    </Text>
                  </Box>
                )}
              </Box>

              <Button
                variant="primary"
                size="large"
                onClick={handleScan}
                loading={scanning}
                disabled={scanning}
                className="!px-12 !py-4 !text-sm"
              >
                {scanning ? "Đang quét..." : "Quét QR"}
              </Button>
            </Box>
          )}
        </Box>
      )}

      {/* === LIST TAB === */}
      {!isEditing && activeTab === "list" && (
        <Box>
          {/* Refreshing indicator */}
          {refreshing && (
            <Box className="flex items-center justify-center gap-2 py-2 bg-blue-50">
              <Spinner visible />
              <Text className="text-blue-600 text-xs">Đang đồng bộ...</Text>
            </Box>
          )}

          {/* Attendee Search + Refresh */}
          <Box className="px-4 pt-3 pb-2 flex items-center gap-2">
            <Box className="flex-1">
              <Input
                className="px-4"
                placeholder="Tìm theo tên hoặc MSSV..."
                value={attendeeSearch}
                onChange={(e) => setAttendeeSearch(e.target.value)}
                prefix={<Icon icon="zi-search" />}
                allowClear
              />
            </Box>
            <Box
              className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-50 cursor-pointer active:bg-blue-100"
              onClick={() => !refreshing && refreshEvent()}
            >
              <Icon icon="zi-restore" size={20} className={`text-blue-600 ${refreshing ? "animate-spin" : ""}`} />
            </Box>
          </Box>

          {/* Attendee Filter Toggle */}
          <Box className="px-4 pb-2">
            <Box
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => setShowAttendeeFilters(!showAttendeeFilters)}
            >
              <Icon icon="zi-filter" size={18} className="text-blue-600" />
              <Text className="text-blue-600 text-sm font-medium">
                {showAttendeeFilters ? "Ẩn bộ lọc" : "Hiện bộ lọc"}
              </Text>
            </Box>
          </Box>

          {showAttendeeFilters && (
            <Box className="px-4 pb-3 space-y-3">
              <Box className="grid grid-cols-2 gap-2">
                <Select
                  placeholder="Sắp xếp"
                  value={attendeeSortBy}
                  onChange={(val) => setAttendeeSortBy(val as SortType)}
                  closeOnSelect
                >
                  <Option value="" title="Mới nhất" />
                  <Option value="az" title="A → Z" />
                  <Option value="za" title="Z → A" />
                  <Option value="time-asc" title="Giờ quét ↑" />
                  <Option value="time-desc" title="Giờ quét ↓" />
                </Select>

                <Select
                  placeholder="Vai trò"
                  value={attendeeRoleFilter}
                  onChange={(val) => setAttendeeRoleFilter(val as string)}
                  closeOnSelect
                >
                  <Option value="" title="Tất cả" />
                  {ROLE_LIST.map((r) => (
                    <Option key={r} value={r} title={r} />
                  ))}
                </Select>
              </Box>
            </Box>
          )}

          {/* Attendee Selection Toolbar */}
          {attendeeSelectionMode && (
            <Box className="px-4 pb-3">
              <Box className="flex items-center gap-2">
                <Box
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full border border-gray-200 cursor-pointer active:bg-gray-100"
                  onClick={
                    allAttendeesSelected
                      ? deselectAllAttendees
                      : selectAllAttendees
                  }
                >
                  <Box
                    className={`w-4 h-4 rounded border flex items-center justify-center ${
                      allAttendeesSelected
                        ? "bg-orange-500 border-orange-500"
                        : "border-gray-400"
                    }`}
                  >
                    {allAttendeesSelected && (
                      <Icon icon="zi-check" size={10} className="text-white" />
                    )}
                  </Box>
                  <Text className="text-sm font-medium">
                    {allAttendeesSelected
                      ? "Bỏ chọn tất cả"
                      : "Chọn tất cả"}
                  </Text>
                </Box>
                <Box
                  className="ml-auto cursor-pointer"
                  onClick={exitAttendeeSelection}
                >
                  <Icon icon="zi-close" size={20} className="text-gray-500" />
                </Box>
              </Box>
            </Box>
          )}

          {/* Attendee List */}
          <Box
            className={`px-4 space-y-2 ${
              attendeeSelectionMode ? "pb-28" : "pb-6"
            }`}
          >
            {loadingAttendees ? (
              <Box className="flex justify-center py-12">
                <Spinner visible />
              </Box>
            ) : filteredAttendees.length === 0 ? (
              <Box className="flex flex-col items-center py-12">
                <Text className="text-gray-400">Chưa có điểm danh</Text>
              </Box>
            ) : (
              filteredAttendees.map((entry) => {
                const isSelected = selectedAttendeeIds.has(entry.studentId);
                return (
                  <AttendeeCard
                    key={entry.studentId}
                    entry={entry}
                    selectionMode={attendeeSelectionMode}
                    selected={isSelected}
                    onClick={() => {
                      if (attendeeSelectionMode) {
                        toggleAttendeeSelect(entry.studentId);
                      }
                    }}
                    onLongPress={
                      isAdmin
                        ? () => enterAttendeeSelection(entry.studentId)
                        : undefined
                    }
                  />
                );
              })
            )}
          </Box>

          {/* Attendee batch delete bar */}
          {attendeeSelectionMode && selectedAttendeeIds.size > 0 && (
            <Box className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-gray-200 px-4 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.1)]">
              <Box className="flex items-center gap-2 mb-2">
                <Text className="text-sm text-gray-600">
                  Đã chọn{" "}
                  <Text className="font-bold inline">
                    {selectedAttendeeIds.size}
                  </Text>{" "}
                  điểm danh
                </Text>
              </Box>
              <Button
                variant="secondary"
                fullWidth
                className="!border-red-500 !text-red-600"
                prefixIcon={<Icon icon="zi-delete" />}
                onClick={() => setShowDeleteAttendeeConfirm(true)}
                loading={deletingAttendees}
                disabled={deletingAttendees}
              >
                Xoá ({selectedAttendeeIds.size})
              </Button>
            </Box>
          )}
        </Box>
      )}


      {/* === DELETE ATTENDEE CONFIRM === */}
      <Modal
        visible={showDeleteAttendeeConfirm}
        title="⚠️ Xác nhận xoá điểm danh"
        onClose={() => !deletingAttendees && setShowDeleteAttendeeConfirm(false)}
        actions={[
          { text: "Huỷ", close: true, disabled: deletingAttendees },
          {
            text: deletingAttendees ? "Đang xoá..." : `Xoá ${selectedAttendeeIds.size}`,
            highLight: true,
            danger: true,
            onClick: handleDeleteAttendees,
            disabled: deletingAttendees,
          },
        ]}
      >
        <Box className="py-2">
          <Text className="text-gray-700">
            Xoá{" "}
            <Text className="font-bold inline">
              {selectedAttendeeIds.size}
            </Text>{" "}
            điểm danh? Hành động này không thể hoàn tác.
          </Text>
        </Box>
      </Modal>

      {/* === EXIT EDIT CONFIRM === */}
      <Modal
        visible={showExitConfirm}
        title="Thoát chế độ chỉnh sửa?"
        onClose={() => setShowExitConfirm(false)}
        actions={[
          { text: "Ở lại", close: true },
          {
            text: "Thoát",
            highLight: true,
            danger: true,
            onClick: handleExitConfirm,
          },
        ]}
      >
        <Box className="py-2">
          <Text className="text-gray-700">
            Các thay đổi chưa lưu sẽ bị mất nếu bạn thoát. Bạn có chắc chắn
            muốn thoát?
          </Text>
        </Box>
      </Modal>
    </Page>
  );
}

// === Attendee Card Component ===
function AttendeeCard({
  entry,
  selectionMode,
  selected,
  onClick,
  onLongPress,
}: {
  entry: AttendeeEntry;
  selectionMode: boolean;
  selected: boolean;
  onClick: () => void;
  onLongPress?: () => void;
}) {
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const movedRef = React.useRef(false);

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

  const name = entry.student
    ? getFullName(entry.student)
    : entry.studentId;

  return (
    <Box
      className={`flex items-center p-3 bg-white rounded-xl shadow-sm border-2 cursor-pointer active:bg-gray-50 transition-all ${
        selected ? "border-orange-400 bg-orange-50" : "border-gray-100"
      }`}
      onClick={onClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
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
              <Icon icon="zi-check" size={14} className="text-white" />
            )}
          </Box>
        </Box>
      )}

      <Box className="flex-1 min-w-0">
        <Text className="font-semibold text-base truncate">{name}</Text>
        <Text className="text-gray-500 text-sm">{entry.studentId}</Text>
      </Box>
      <Box className="flex-shrink-0 text-right">
        <Text className="text-sm font-medium text-gray-700">
          {format(new Date(entry.scannedAt), "HH:mm", { locale: vi })}
        </Text>
        <Text className="text-xs text-gray-400">
          {format(new Date(entry.scannedAt), "dd/MM/yyyy", { locale: vi })}
        </Text>
      </Box>
    </Box>
  );
}

export default EventDetailPage;

