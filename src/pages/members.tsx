import React, { useEffect, useState, useMemo } from "react";
import { Box, Button, Icon, Input, Page, Select, Spinner, Text } from "zmp-ui";
import { useNavigate } from "zmp-ui";
import { useAtom } from "jotai";
import { currentStudentAtom } from "@/state/auth";
import { getAllStudents } from "@/services/student.service";
import { Student, getFullName, RoleEnum, StatusEnum, ROLE_LIST } from "@/types/member";
import MemberCard from "@/components/member-card";

const { Option } = Select;

type SortType = "az" | "za" | "";
type RoleFilter = "" | string;
type StatusFilter = "" | string;

function MembersPage() {
  const [currentStudent] = useAtom(currentStudentAtom);
  const navigate = useNavigate();

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortType>("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");
  const [showFilters, setShowFilters] = useState(false);

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

  return (
    <Page className="bg-gray-50 dark:bg-black min-h-screen">
      {/* Header */}
      <Box className="bg-blue-600 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Box
          className="w-8 h-8 flex items-center justify-center cursor-pointer"
          onClick={() => navigate(-1)}
        >
          <Icon icon="zi-arrow-left" className="text-white" size={24} />
        </Box>
        <Text.Title size="normal" className="!text-white font-bold flex-1">
          Thành viên
        </Text.Title>
        <Text className="!text-blue-100 text-sm">
          {filteredStudents.length} người
        </Text>
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

      {/* Members List */}
      <Box className="px-4 pb-6 space-y-3">
        {loading ? (
          <Box className="flex justify-center py-12">
            <Spinner visible />
          </Box>
        ) : filteredStudents.length === 0 ? (
          <Box className="flex flex-col items-center py-12">
            <Text className="text-gray-400 text-lg">Không tìm thấy thành viên</Text>
          </Box>
        ) : (
          filteredStudents.map((student) => (
            <MemberCard
              key={student.id}
              student={student}
              onClick={() => navigate(`/member-detail?id=${student.id}`)}
            />
          ))
        )}
      </Box>
    </Page>
  );
}

export default MembersPage;

