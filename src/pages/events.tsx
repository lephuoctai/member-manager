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
  getAllEvents,
  createEvent,
  deleteEvents,
  updateEvent,
} from "@/services/event.service";
import {
  AttendanceEvent,
  EventStatusEnum,
  EVENT_STATUS_LIST,
} from "@/types/event";
import { RoleEnum } from "@/types/member";
import EventCard from "@/components/event-card";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

const { Option } = Select;

type SortType = "az" | "za" | "";
type StatusFilter = "" | string;

function EventsPage() {
  const [currentStudent] = useAtom(currentStudentAtom);
  const navigate = useNavigate();
  const { openSnackbar } = useSnackbar();

  const isAdmin = currentStudent?.role === RoleEnum.admin;

  const [events, setEvents] = useState<AttendanceEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortType>("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");
  const [dateRangeFilter, setDateRangeFilter] = useState<number | "">("");
  const [showFilters, setShowFilters] = useState(false);

  // Multi-select
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Create event
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newStatus, setNewStatus] = useState(EventStatusEnum.open);
  const [newExp, setNewExp] = useState<Date>(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  );
  const [hasExp, setHasExp] = useState(true);
  const [creating, setCreating] = useState(false);

  // Edit event
  const [showEditModal, setShowEditModal] = useState(false);
  const [editDesc, setEditDesc] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editExp, setEditExp] = useState<Date>(new Date());
  const [editHasExp, setEditHasExp] = useState(true);
  const [saving, setSaving] = useState(false);

  // Delete confirm
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const all = await getAllEvents();
      setEvents(all);
    } catch (err) {
      console.error("Failed to load events:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = useMemo(() => {
    let result = [...events];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((e) => e.title.toLowerCase().includes(q));
    }

    if (statusFilter) {
      result = result.filter((e) => e.status === statusFilter);
    }

    if (dateRangeFilter !== "") {
      const now = Date.now();
      const rangeMs = Number(dateRangeFilter) * 24 * 60 * 60 * 1000;
      result = result.filter((e) => now - e.date <= rangeMs);
    }

    if (sortBy === "az") {
      result.sort((a, b) => a.title.localeCompare(b.title, "vi"));
    } else if (sortBy === "za") {
      result.sort((a, b) => b.title.localeCompare(a.title, "vi"));
    } else {
      result.sort((a, b) => b.date - a.date);
    }

    return result;
  }, [events, search, sortBy, statusFilter, dateRangeFilter]);

  // === Multi-select ===
  const enterSelectionMode = (eventId?: string) => {
    if (!isAdmin) return;
    setSelectionMode(true);
    if (eventId) setSelectedIds(new Set([eventId]));
  };

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const toggleSelect = (eventId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(eventId)) next.delete(eventId);
      else next.add(eventId);
      return next;
    });
  };

  const allSelected =
    filteredEvents.length > 0 &&
    filteredEvents.every((e) => selectedIds.has(e.eventId));

  const selectAll = () => {
    setSelectedIds(new Set(filteredEvents.map((e) => e.eventId)));
  };

  const deselectAll = () => setSelectedIds(new Set());

  // === Create ===
  const handleCreate = async () => {
    if (!newTitle.trim()) {
      openSnackbar({ text: "Tiêu đề không được để trống!", type: "error" });
      return;
    }
    setCreating(true);
    try {
      const now = Date.now();
      const eventId = `${newTitle.trim()}_${now}`;
      const newEvent: AttendanceEvent = {
        eventId,
        title: newTitle.trim(),
        desc: newDesc.trim(),
        attendee: {},
        date: now,
        exp: hasExp ? newExp.getTime() : null,
        status: newStatus,
      };
      await createEvent(newEvent);
      setEvents((prev) => [newEvent, ...prev]);
      setShowCreateModal(false);
      setNewTitle("");
      setNewDesc("");
      setNewStatus(EventStatusEnum.open);
      setHasExp(true);
      setNewExp(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
      openSnackbar({ text: "Tạo sự kiện thành công!", type: "success" });
    } catch (err) {
      openSnackbar({ text: "Tạo sự kiện thất bại.", type: "error" });
    } finally {
      setCreating(false);
    }
  };

  // === Edit (single select) ===
  const selectedEvent = useMemo(() => {
    if (selectedIds.size !== 1) return null;
    const id = Array.from(selectedIds)[0];
    return events.find((e) => e.eventId === id) || null;
  }, [events, selectedIds]);

  const handleOpenEdit = () => {
    if (!selectedEvent) return;
    setEditDesc(selectedEvent.desc);
    setEditStatus(selectedEvent.status);
    setEditHasExp(selectedEvent.exp !== null);
    setEditExp(
      selectedEvent.exp ? new Date(selectedEvent.exp) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    );
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedEvent) return;
    setSaving(true);
    try {
      const updates: any = {
        desc: editDesc.trim(),
        status: editStatus,
        exp: editHasExp ? editExp.getTime() : null,
      };
      await updateEvent(selectedEvent.eventId, updates);
      setEvents((prev) =>
        prev.map((e) =>
          e.eventId === selectedEvent.eventId ? { ...e, ...updates } : e
        )
      );
      setShowEditModal(false);
      exitSelectionMode();
      openSnackbar({ text: "Cập nhật thành công!", type: "success" });
    } catch (err) {
      openSnackbar({ text: "Cập nhật thất bại.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  // === Delete ===
  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      const ids = Array.from(selectedIds);
      await deleteEvents(ids);
      setEvents((prev) => prev.filter((e) => !selectedIds.has(e.eventId)));
      setShowDeleteConfirm(false);
      exitSelectionMode();
      openSnackbar({
        text: `Đã xoá ${ids.length} sự kiện.`,
        type: "success",
      });
    } catch (err) {
      openSnackbar({ text: "Xoá thất bại.", type: "error" });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Page className="bg-gray-50 min-h-screen">
      {/* Header */}
      <Box className="bg-blue-600 px-4 pt-4 pb-3 flex items-center gap-3 sticky top-0 z-10 safe-area-top">
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
            <Text.Title size="normal" className="!text-white font-bold flex-1">
              Sự kiện
            </Text.Title>
            <Text className="!text-blue-100 text-sm">
              {filteredEvents.length} sự kiện
            </Text>
          </>
        )}
      </Box>

      {/* Search */}
      <Box className="px-4 pt-4 pb-2">
        <Input
          className="px-4"
          placeholder="Tìm theo tên sự kiện..."
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
            <Select
              placeholder="Sắp xếp"
              value={sortBy}
              onChange={(val) => setSortBy(val as SortType)}
              closeOnSelect
            >
              <Option value="" title="Mới nhất" />
              <Option value="az" title="A → Z" />
              <Option value="za" title="Z → A" />
            </Select>

            <Select
              placeholder="Trạng thái"
              value={statusFilter}
              onChange={(val) => setStatusFilter(val as string)}
              closeOnSelect
            >
              <Option value="" title="Tất cả" />
              {EVENT_STATUS_LIST.map((s) => (
                <Option key={s} value={s} title={s} />
              ))}
            </Select>

            <Select
              placeholder="Khoảng TG"
              value={dateRangeFilter as string}
              onChange={(val) =>
                setDateRangeFilter(val === "" ? "" : Number(val))
              }
              closeOnSelect
            >
              <Option value="" title="Tất cả" />
              <Option value="1" title="1 ngày" />
              <Option value="7" title="7 ngày" />
              <Option value="30" title="30 ngày" />
              <Option value="90" title="90 ngày" />
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
              Nhấn để chọn/bỏ chọn
            </Text>
          </Box>
        </Box>
      )}

      {/* Events List */}
      <Box className={`px-4 space-y-3 ${selectionMode ? "pb-28" : "pb-24"}`}>
        {loading ? (
          <Box className="flex justify-center py-12">
            <Spinner visible />
          </Box>
        ) : filteredEvents.length === 0 ? (
          <Box className="flex flex-col items-center py-12">
            <Text className="text-gray-400 text-lg">
              Không tìm thấy sự kiện
            </Text>
          </Box>
        ) : (
          filteredEvents.map((event) => (
            <EventCard
              key={event.eventId}
              event={event}
              onClick={() =>
                navigate(
                  `/event-detail?id=${encodeURIComponent(event.eventId)}`
                )
              }
              selectionMode={selectionMode}
              selected={selectedIds.has(event.eventId)}
              onLongPress={
                isAdmin ? () => enterSelectionMode(event.eventId) : undefined
              }
              onToggleSelect={
                isAdmin ? () => toggleSelect(event.eventId) : undefined
              }
            />
          ))
        )}
      </Box>

      {/* Batch Action Bar */}
      {selectionMode && selectedIds.size > 0 && (
        <Box className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-gray-200 px-4 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.1)]">
          <Box className="flex items-center gap-2 mb-2">
            <Text className="text-sm text-gray-600">
              Đã chọn{" "}
              <Text className="font-bold inline">{selectedIds.size}</Text> sự
              kiện
            </Text>
          </Box>
          <Box className="flex gap-3">
            {selectedIds.size === 1 && (
              <Button
                variant="primary"
                fullWidth
                prefixIcon={<Icon icon="zi-edit" />}
                onClick={handleOpenEdit}
                disabled={deleting}
              >
                Sửa
              </Button>
            )}
            <Button
              variant="secondary"
              fullWidth
              className="!border-red-500 !text-red-600"
              prefixIcon={<Icon icon="zi-delete" />}
              onClick={() => setShowDeleteConfirm(true)}
              loading={deleting}
              disabled={deleting}
            >
              Xoá ({selectedIds.size})
            </Button>
          </Box>
        </Box>
      )}

      {/* FAB - Create Event (admin only) */}
      {isAdmin && !selectionMode && (
        <Box
          className="fixed left-1/2 -translate-x-1/2 z-30"
          style={{ bottom: "calc(20vh / 5 + 16px)" }}
        >
          <Box
            className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg cursor-pointer active:scale-95 transition-transform"
            style={{
              background: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
            }}
            onClick={() => setShowCreateModal(true)}
          >
            <Icon icon="zi-plus" className="text-white" size={28} />
          </Box>
        </Box>
      )}

      {/* === CREATE EVENT MODAL === */}
      <Modal
        visible={showCreateModal}
        title="Tạo sự kiện mới"
        onClose={() => !creating && setShowCreateModal(false)}
        actions={[
          { text: "Huỷ", close: true, disabled: creating },
          {
            text: creating ? "Đang tạo..." : "Tạo",
            highLight: true,
            onClick: handleCreate,
            disabled: creating,
          },
        ]}
      >
        <Box className="space-y-4 py-2">
          <Box>
            <Text className="text-sm text-gray-600 mb-1">
              Tiêu đề <Text className="text-red-500 inline">*</Text>
            </Text>
            <Input
              placeholder="Nhập tiêu đề sự kiện..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
          </Box>
          <Box>
            <Text className="text-sm text-gray-600 mb-1">Mô tả</Text>
            <Input
              placeholder="Nhập mô tả (tuỳ chọn)..."
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
            />
          </Box>
          <Box>
            <Text className="text-sm text-gray-600 mb-1">Trạng thái</Text>
            <Select
              value={newStatus}
              onChange={(val) => setNewStatus(val as string)}
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
                  hasExp ? "bg-blue-500 justify-end" : "bg-gray-300 justify-start"
                }`}
                onClick={() => setHasExp(!hasExp)}
              >
                <Box className="w-4 h-4 bg-white rounded-full shadow" />
              </Box>
            </Box>
            {hasExp && (
              <DatePicker
                value={newExp}
                onChange={(date) => setNewExp(date)}
                title="Chọn thời điểm đóng"
              />
            )}
          </Box>
        </Box>
      </Modal>

      {/* === EDIT EVENT MODAL === */}
      <Modal
        visible={showEditModal}
        title={`Sửa: ${selectedEvent?.title || ""}`}
        onClose={() => !saving && setShowEditModal(false)}
        actions={[
          { text: "Huỷ", close: true, disabled: saving },
          {
            text: saving ? "Đang lưu..." : "Lưu",
            highLight: true,
            onClick: handleSaveEdit,
            disabled: saving,
          },
        ]}
      >
        <Box className="space-y-4 py-2">
          <Box>
            <Text className="text-sm text-gray-500 mb-1">Tiêu đề (không thể sửa)</Text>
            <Box className="px-3 py-2 bg-gray-100 rounded-lg">
              <Text className="text-gray-600">{selectedEvent?.title}</Text>
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
                  editHasExp ? "bg-blue-500 justify-end" : "bg-gray-300 justify-start"
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
        </Box>
      </Modal>

      {/* === DELETE CONFIRM === */}
      <Modal
        visible={showDeleteConfirm}
        title="⚠️ Xác nhận xoá"
        onClose={() => !deleting && setShowDeleteConfirm(false)}
        actions={[
          { text: "Huỷ", close: true, disabled: deleting },
          {
            text: deleting ? "Đang xoá..." : `Xoá ${selectedIds.size} sự kiện`,
            highLight: true,
            danger: true,
            onClick: handleDeleteConfirm,
            disabled: deleting,
          },
        ]}
      >
        <Box className="py-2">
          <Text className="text-gray-700">
            Bạn có chắc chắn muốn xoá{" "}
            <Text className="font-bold inline">{selectedIds.size}</Text> sự
            kiện? Hành động này không thể hoàn tác.
          </Text>
        </Box>
      </Modal>
    </Page>
  );
}

export default EventsPage;

