import React, { useEffect, useMemo, useState } from 'react';
import i18n from '../../../../lib/i18n';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import AdminFormQuotaToolbar from './quota-toolbar';
import AdminFormQuotaTable from './quota-table';
import { useAdminFormQuotaStore, DEFAULT_COLUMNS } from '../store/useAdminFormQuotaStore';
import { useAdminFormsCuaNguoi, useAdminFormTomTat } from '../hooks/use-admin-form';
import { usePayrollAdminFormGroups } from '../../thiet-lap-cong-luong/hooks/use-payroll-form-group';
import PayrollFormGroupForm from '../../thiet-lap-cong-luong/components/group-form';
import type { PayrollAdminFormGroup } from '../../thiet-lap-cong-luong/core/types';
import { usePhieuHanhChinhViewScope } from '../hooks/use-phieu-hanh-chinh-view-scope';
import { phieuChamKy } from '../core/ky-loc';
import { khoangNgayCuaThang } from '../services/admin-form-list-query';
import { useAuthStore } from '../../../../store/useStore';
import { getAdminFormTypeLabel } from '../../thiet-lap-cong-luong/core/constants';
import { soNgayCuaPhieuTrongThang } from '../core/khoang-nghi';
import { AdminFormQuotaRow } from '../core/types';
import { useGenericToolbarSearch } from '../../../../lib/hooks/use-generic-toolbar-search';
import { createListSearchMatcher } from '../../../../lib/list-search-matcher';

/** Ô tìm kiếm quét MỌI cột của bảng, bỏ dấu tiếng Việt — xem lib/list-search-matcher.ts. */
const khopTimKiem = createListSearchMatcher<AdminFormQuotaRow>({
  columns: DEFAULT_COLUMNS,
  // Nhãn tiếng Việt của loại phiếu chỉ có sau khi dịch — không nằm trên bản ghi.
  getCellText: (colId, item) =>
    colId === 'loai_phieu' ? getAdminFormTypeLabel(item.loai_phieu, i18n.t.bind(i18n)) : '',
});

const AdminFormQuotaTab: React.FC = () => {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const { searchInput, setSearchInput } = useGenericToolbarSearch(useAdminFormQuotaStore);
  const searchTerm = useAdminFormQuotaStore((s) => s.searchTerm);
  const filters = useAdminFormQuotaStore((s) => s.filters);
  const setFilter = useAdminFormQuotaStore((s) => s.setFilter);
  const columns = useAdminFormQuotaStore((s) => s.columns);
  const toggleColumn = useAdminFormQuotaStore((s) => s.toggleColumn);
  const reorderColumns = useAdminFormQuotaStore((s) => s.reorderColumns);
  const resetColumns = useAdminFormQuotaStore((s) => s.resetColumns);
  const resetColumnWidths = useAdminFormQuotaStore((s) => s.resetColumnWidths);
  const selectedIds = useAdminFormQuotaStore((s) => s.selectedIds);
  const clearSelection = useAdminFormQuotaStore((s) => s.clearSelection);
  const resetState = useAdminFormQuotaStore((s) => s.resetState);

  const currentUserId = user?.id ?? '';
  const { viewAll } = usePhieuHanhChinhViewScope();
  const [editingGroup, setEditingGroup] = useState<PayrollAdminFormGroup | null>(null);

  // Định mức tính theo tháng → luôn là tháng hiện tại (đã bỏ chip thời gian ở tab này).
  const thangHienTai = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }, []);
  const thangLabel = `${thangHienTai.slice(5, 7)}/${thangHienTai.slice(0, 4)}`;

  // Người quyền cao (viewAll) xem được định mức của người khác; còn lại luôn là chính mình.
  const nguoiDangXem = viewAll && filters.nguoiXem ? filters.nguoiXem : currentUserId;
  const { data: forms = [], isLoading } = useAdminFormsCuaNguoi(nguoiDangXem, thangHienTai);
  const { data: groups = [] } = usePayrollAdminFormGroups();

  // Danh sách người đã gửi phiếu — dùng chung cache với chip Người gửi của tab Phiếu.
  const { data: tomTat = [] } = useAdminFormTomTat(null, viewAll);
  const personOptions = useMemo(() => {
    if (!viewAll) return undefined;
    const kyThang = khoangNgayCuaThang(thangHienTai);
    const ten = new Map<string, string>();
    const dem: Record<string, number> = {};
    for (const f of tomTat) {
      if (!f.nguoi_tao_id) continue;
      if (!ten.has(f.nguoi_tao_id)) ten.set(f.nguoi_tao_id, f.ten_nguoi_tao);
      if (phieuChamKy(f, kyThang)) dem[f.nguoi_tao_id] = (dem[f.nguoi_tao_id] ?? 0) + 1;
    }
    if (currentUserId && !ten.has(currentUserId)) ten.set(currentUserId, user?.ho_va_ten ?? '');
    const opts = Array.from(ten, ([id, tenNv]) => ({
      value: id,
      label: id === currentUserId ? `${tenNv || id} (${t('adminForm.filter.me')})` : tenNv || id,
      count: dem[id] ?? 0,
    }));
    return opts.sort((a, b) =>
      a.value === currentUserId ? -1 : b.value === currentUserId ? 1 : a.label.localeCompare(b.label, 'vi')
    );
  }, [viewAll, tomTat, thangHienTai, currentUserId, user?.ho_va_ten, t]);

  const handleEdit = (row: AdminFormQuotaRow) => {
    const group = groups.find((g) => g.id === row.id);
    if (group) setEditingGroup(group);
  };

  useEffect(() => {
    return () => resetState();
  }, [resetState]);

  // Danh sách loại phiếu và định mức lấy từ nhóm hành chính (fp_hr_nhom_phieu_hanh_chinh).
  // Đã dùng = tổng số ngày của phiếu chờ duyệt + đã duyệt (không cộng từ chối, đã hủy);
  // phiếu vắt qua tháng chỉ cộng phần rơi vào tháng hiện tại. Còn lại = định mức − đã dùng.
  const rows = useMemo<AdminFormQuotaRow[]>(() => {
    const usedByType = new Map<string, number>();
    const statusCount = ['pending', 'manager_approved', 'approved'];
    forms.forEach((f) => {
      if (!statusCount.includes(f.trang_thai)) return; // bỏ qua từ chối, đã hủy
      const soNgay = soNgayCuaPhieuTrongThang(f, thangHienTai);
      usedByType.set(f.loai_phieu, (usedByType.get(f.loai_phieu) ?? 0) + soNgay);
    });
    return groups.map((g) => {
      const used = usedByType.get(g.loai_phieu) ?? 0;
      return {
        id: g.id,
        loai_phieu: g.loai_phieu,
        so_luong_thang: g.so_luong_thang,
        da_dung: used,
        con_lai: Math.max(0, g.so_luong_thang - used),
      };
    });
  }, [forms, groups, thangHienTai]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const matchesSearch = khopTimKiem(row, searchTerm);
      const matchesType = filters.type.length === 0 || filters.type.includes(row.loai_phieu);
      return matchesSearch && matchesType;
    });
  }, [rows, searchTerm, filters.type]);

  return (
    <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <AdminFormQuotaToolbar
        items={rows}
        searchTerm={searchInput}
        setSearchTerm={setSearchInput}
        filters={filters}
        setFilter={setFilter}
        columns={columns}
        toggleColumn={toggleColumn}
        reorderColumns={reorderColumns}
        resetColumns={resetColumns}
        resetColumnWidths={resetColumnWidths}
        selectedIds={selectedIds}
        clearSelection={clearSelection}
        thangLabel={thangLabel}
        personOptions={personOptions}
        nguoiDangXem={nguoiDangXem}
        currentUserId={currentUserId}
      />
      <div className="flex-1 min-h-0">
        <AdminFormQuotaTable
          data={filteredRows}
          isLoading={isLoading}
          useStore={useAdminFormQuotaStore}
          onEdit={viewAll ? handleEdit : undefined}
        />
      </div>

      <AnimatePresence>
        {editingGroup && (
          <PayrollFormGroupForm initialData={editingGroup} onClose={() => setEditingGroup(null)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminFormQuotaTab;
