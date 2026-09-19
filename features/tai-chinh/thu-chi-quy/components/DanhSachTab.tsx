import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Info } from 'lucide-react';
import { useModulePermissionFromContext } from '../../../../components/shared/ModulePermissionGuard';
import LazyExportDialog from '../../../../components/shared/LazyExportDialog';
import LazyImportDialog from '../../../../components/shared/LazyImportDialog';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { CONFIRM_DELETE, CONFIRM_DELETE_ALL, CONFIRM_YES } from '../../../../lib/button-labels';
import { formatDate } from '../../../../lib/utils';
import type { ImportErrorRow, ImportSummary } from '../../../../lib/import-types';
import { useBranches } from '../../../he-thong/chi-nhanh/hooks/use-chi-nhanh';
import { useEmployeesRefQuery } from '../../../../lib/hooks/use-supabase-ref-queries';
import type { DateRangePresetId } from '../../../he-thong/nhan-vien/core/stats-constants';
import { getDateRangeFromPreset } from '../../../he-thong/nhan-vien/utils/stats-date-range';
import { useHangMucThuChiRef } from '../../thiet-lap-quy/hooks/use-hang-muc-thu-chi';
import ThuChiQuyToolbar from './ThuChiQuyToolbar';
import ThuChiQuyList from './ThuChiQuyList';
import ThuChiQuyForm from './ThuChiQuyForm';
import ThuChiQuyDetail from './ThuChiQuyDetail';
import XinMoKhoaDialog from './XinMoKhoaDialog';
import { useThuChiQuyStore } from '../store/useThuChiQuyStore';
import { useThuChiQuyViewScope } from '../hooks/use-thu-chi-quy-view-scope';
import {
  useDeleteThuChiQuy,
  useKhoaThuChiQuy,
  useQuySoDu,
  useThuChiQuyPage,
  useXinMoThuChiQuy,
  useXuLyMoThuChiQuy,
} from '../hooks/use-thu-chi-quy';
import { useThuChiQuyPermissions } from '../hooks/use-thu-chi-quy-permissions';
import { useAuthStore } from '../../../../store/useStore';
import { buildThuChiQuyListServerQuery } from '../services/thu-chi-quy-list-query';
import { getSoPhieuBatch, getThuChiQuyAll, insertThuChiQuyBulk } from '../services/thu-chi-quy-service';
import { buildThuChiQuyImportPlan } from '../utils/import-thu-chi-quy';
import { nguonChungTuToI18nKey } from '../core/constants';
import type { ThuChiQuy, ThuChiQuyRow } from '../core/types';

function toYyyyMmDd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const DanhSachTab: React.FC = () => {
  const { t } = useTranslation();
  const { canCreate, canUpdate, canDelete } = useModulePermissionFromContext();
  const perms = useThuChiQuyPermissions();
  const user = useAuthStore((s) => s.user);
  const confirm = useConfirmStore((s) => s.confirm);

  const { searchTerm, filters, pagination, setPage, resetState, clearSelection, selectedIds } =
    useThuChiQuyStore();

  const viewScope = useThuChiQuyViewScope();
  const { data: branches = [] } = useBranches();
  const { data: hangMucList = [] } = useHangMucThuChiRef();
  const { data: employees = [] } = useEmployeesRefQuery();

  const [chiNhanhDangXem, setChiNhanhDangXem] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ThuChiQuy | null>(null);
  const [detailItem, setDetailItem] = useState<ThuChiQuyRow | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [exportRows, setExportRows] = useState<ThuChiQuyRow[]>([]);
  const [exportLoading, setExportLoading] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [xinMoItem, setXinMoItem] = useState<ThuChiQuy | null>(null);
  const [importErrors, setImportErrors] = useState<ImportErrorRow[]>([]);

  useEffect(() => () => resetState(), [resetState]);

  const allowedBranches = useMemo(() => {
    if (viewScope.viewAll) return branches;
    const allowed = new Set(viewScope.allowedBranchIds.map(String));
    return branches.filter((b) => allowed.has(String(b.id)));
  }, [branches, viewScope.viewAll, viewScope.allowedBranchIds]);

  /**
   * Mặc định để TRỐNG = tất cả farm trong phạm vi xem (cấp bậc 1 / quyền admin
   * thấy mọi farm, người thường thấy các farm được phân). Chọn một farm cụ thể
   * chỉ để đọc cột Tồn quỹ lũy kế — lũy kế tính riêng từng farm.
   */

  const dateRange = useMemo(() => {
    const preset = filters.datePreset || 'all';
    if (preset === 'all') return { start: '', end: '' };
    const range = getDateRangeFromPreset(
      preset as DateRangePresetId,
      filters.customDateFrom ? new Date(filters.customDateFrom) : undefined,
      filters.customDateEnd ? new Date(filters.customDateEnd) : undefined
    );
    return { start: toYyyyMmDd(range.start), end: toYyyyMmDd(range.end) };
  }, [filters.datePreset, filters.customDateFrom, filters.customDateEnd]);

  const listQuery = useMemo(
    () =>
      buildThuChiQuyListServerQuery({
        searchTerm,
        filters,
        ngayFrom: dateRange.start,
        ngayTo: dateRange.end,
        chiNhanhDangXem,
        viewScope: { viewAll: viewScope.viewAll, allowedBranchIds: viewScope.allowedBranchIds },
      }),
    [searchTerm, filters, dateRange.start, dateRange.end, chiNhanhDangXem, viewScope.viewAll, viewScope.allowedBranchIds]
  );

  const pageIndex = Math.max(0, pagination.page - 1);
  const pageQuery = useThuChiQuyPage(pageIndex, listQuery, !viewScope.isLoading);
  const rows = useMemo(() => pageQuery.data?.data ?? [], [pageQuery.data]);
  const totalCount = pageQuery.data?.totalCount ?? 0;

  const soDuQuery = useQuySoDu(listQuery.chiNhanhIds, !viewScope.isLoading);
  const tonQuyHienTai = useMemo(
    () => (soDuQuery.data ?? []).reduce((sum, r) => sum + r.ton_quy_hien_tai, 0),
    [soDuQuery.data]
  );

  const deleteMutation = useDeleteThuChiQuy();
  const khoaMutation = useKhoaThuChiQuy();
  const xinMoMutation = useXinMoThuChiQuy(() => setXinMoItem(null));
  const xuLyMoMutation = useXuLyMoThuChiQuy();
  const trangThaiPending =
    khoaMutation.isPending || xinMoMutation.isPending || xuLyMoMutation.isPending;

  const hasOtherFilter =
    filters.loai.length > 0 ||
    filters.hangMucIds.length > 0 ||
    filters.nguonChungTu.length > 0 ||
    (filters.datePreset || 'all') !== 'all' ||
    !!searchTerm.trim();

  /**
   * Sửa/xóa một phiếu không phải mới nhất sẽ dời tồn quỹ của mọi phiếu sau nó —
   * đúng nghiệp vụ nhưng phải nói rõ để người dùng khỏi hoảng.
   */
  const warnIfBackdated = useCallback(
    (item: ThuChiQuy, onOk: () => void, isDelete: boolean) => {
      const soDu = (soDuQuery.data ?? []).find((s) => s.id_chi_nhanh === item.id_chi_nhanh);
      const laMoiNhat = !soDu?.ngay_cuoi || item.ngay >= soDu.ngay_cuoi;
      if (laMoiNhat && !isDelete) {
        onOk();
        return;
      }
      confirm({
        title: isDelete ? t('thuChiQuy.deleteTitle') : t('thuChiQuy.editBackdatedTitle'),
        message: laMoiNhat
          ? t('thuChiQuy.deleteMessage', { soPhieu: item.so_phieu })
          : t('thuChiQuy.backdatedMessage', { ngay: formatDate(item.ngay) }),
        variant: isDelete ? 'danger' : 'warning',
        confirmText: isDelete ? CONFIRM_DELETE() : undefined,
        onConfirm: onOk,
      });
    },
    [confirm, t, soDuQuery.data]
  );

  const handleEdit = (item: ThuChiQuy) => {
    if (!perms.canEditRow(item)) {
      toast.error(t('thuChiQuy.toast.lockedEdit'));
      return;
    }
    warnIfBackdated(
      item,
      () => {
        setEditingItem(item);
        setShowForm(true);
        if (detailItem?.id === item.id) setDetailItem(null);
      },
      false
    );
  };

  const handleDelete = (item: ThuChiQuy) => {
    if (!perms.canDeleteRow(item)) {
      toast.error(t('thuChiQuy.toast.lockedEdit'));
      return;
    }
    warnIfBackdated(
      item,
      () =>
        deleteMutation.mutate([item.id], {
          onSuccess: () => {
            if (detailItem?.id === item.id) setDetailItem(null);
          },
        }),
      true
    );
  };

  /**
   * Xoá hàng loạt chỉ chạy trên các phiếu người dùng thật sự được xoá — phiếu đã
   * khoá bị loại ngay ở đây, báo rõ đã bỏ bao nhiêu dòng thay vì lặng lẽ xoá thiếu.
   */
  const handleDeleteMany = (ids: string[]) => {
    if (ids.length === 0) return;
    const byId = new Map(rows.map((r) => [r.id, r]));
    const allowed = ids.filter((id) => {
      const row = byId.get(id);
      return row ? perms.canDeleteRow(row) : true;
    });
    const skipped = ids.length - allowed.length;
    if (allowed.length === 0) {
      toast.error(t('thuChiQuy.toast.lockedAllBulkDelete'));
      return;
    }
    confirm({
      title: t('thuChiQuy.bulkDeleteTitle'),
      message: t('thuChiQuy.bulkDeleteMessage', { count: allowed.length }),
      variant: 'danger',
      confirmText: CONFIRM_DELETE_ALL(),
      onConfirm: async () => {
        if (skipped > 0) toast.warning(t('thuChiQuy.toast.lockedBulkDelete', { count: skipped }));
        deleteMutation.mutate(allowed, { onSuccess: () => clearSelection() });
      },
    });
  };

  /* --- Khoá / mở khoá ------------------------------------------------- */

  const handleKhoa = (item: ThuChiQuy) => {
    confirm({
      title: t('thuChiQuy.moKhoa.khoaTitle'),
      message: t('thuChiQuy.moKhoa.khoaMessage', { soPhieu: item.so_phieu }),
      variant: 'warning',
      confirmText: CONFIRM_YES(),
      onConfirm: () => khoaMutation.mutate(item.id),
    });
  };

  const handleXuLyMo = (item: ThuChiQuy, duyet: boolean) => {
    confirm({
      title: t(duyet ? 'thuChiQuy.moKhoa.duyetTitle' : 'thuChiQuy.moKhoa.tuChoiTitle'),
      message: t(duyet ? 'thuChiQuy.moKhoa.duyetMessage' : 'thuChiQuy.moKhoa.tuChoiMessage', {
        soPhieu: item.so_phieu,
      }),
      variant: duyet ? 'warning' : 'danger',
      confirmText: CONFIRM_YES(),
      onConfirm: () =>
        xuLyMoMutation.mutate({
          id: item.id,
          extra: {
            duyet,
            idNguoiXuLy: user?.id ?? null,
            tenNguoiXuLy: user?.ho_va_ten || user?.full_name || null,
          },
        }),
    });
  };

  const handleImport = useCallback(
    async (data: Record<string, unknown>[]): Promise<ImportSummary> => {
      setImportErrors([]);
      if (chiNhanhDangXem.length !== 1) {
        const msg = t('thuChiQuy.import.errChiNhanh');
        setImportErrors([{ row: 0, msg }]);
        return { created: 0, skipped: data.length };
      }
      const farmId = chiNhanhDangXem[0];
      const branch = branches.find((b) => String(b.id) === farmId);
      const plan = buildThuChiQuyImportPlan(data, {
        hangMuc: hangMucList.map((hm) => ({ id: hm.id, ma: hm.ma, ten: hm.ten, loai: hm.loai })),
        idChiNhanh: farmId,
        tenChiNhanh: branch?.ten_chi_nhanh ?? null,
      });
      setImportErrors(plan.errors);
      if (plan.toInsert.length === 0) {
        return { created: 0, skipped: plan.errors.length };
      }
      // Số phiếu lấy trọn lô từ cùng dãy sequence với phiếu nhập tay (2 request).
      const soThu = plan.toInsert.filter((p) => p.payload.loai === 'thu').length;
      const soChi = plan.toInsert.length - soThu;
      const [soPhieuThu, soPhieuChi] = await Promise.all([
        getSoPhieuBatch('thu', soThu),
        getSoPhieuBatch('chi', soChi),
      ]);
      let iThu = 0;
      let iChi = 0;
      const rowsPayload = plan.toInsert.map((p) => ({
        ...p.payload,
        so_phieu: p.payload.loai === 'thu' ? soPhieuThu[iThu++] : soPhieuChi[iChi++],
      }));

      const outcome = await insertThuChiQuyBulk(rowsPayload as unknown as Record<string, unknown>[]);
      if (outcome.failed.length > 0) {
        setImportErrors([
          ...plan.errors,
          ...outcome.failed.map((f) => ({ row: 0, msg: f.msg })),
        ]);
      }
      pageQuery.refetch();
      return { created: outcome.done, skipped: plan.errors.length + outcome.failed.length };
    },
    [chiNhanhDangXem, branches, hangMucList, t, pageQuery]
  );

  const exportColumns = useMemo(
    () => [
      { key: 'ngay', label: t('thuChiQuy.store.ngayCol') },
      { key: 'so_phieu', label: t('thuChiQuy.store.soPhieuCol') },
      { key: 'dien_giai', label: t('thuChiQuy.store.dienGiaiCol') },
      { key: 'hang_muc', label: t('thuChiQuy.store.hangMucCol') },
      { key: 'thu', label: t('thuChiQuy.store.thuCol') },
      { key: 'chi', label: t('thuChiQuy.store.chiCol') },
      { key: 'ton_quy', label: t('thuChiQuy.store.tonQuyCol') },
      { key: 'so_chung_tu', label: t('thuChiQuy.store.soChungTuCol') },
      { key: 'nguon', label: t('thuChiQuy.store.nguonCol') },
      { key: 'ghi_chu', label: t('thuChiQuy.store.ghiChuCol') },
      { key: 'chi_nhanh', label: t('thuChiQuy.store.chiNhanhCol') },
      { key: 'nguoi_tao', label: t('thuChiQuy.store.nguoiTaoCol') },
    ],
    [t]
  );

  const exportData = useMemo(
    () =>
      exportRows.map((r) => ({
        ngay: formatDate(r.ngay),
        so_phieu: r.so_phieu,
        dien_giai: r.dien_giai,
        hang_muc: r.ref_ten_hang_muc || r.ten_hang_muc || '',
        thu: r.thu || '',
        chi: r.chi || '',
        ton_quy: r.ton_quy,
        so_chung_tu: r.so_chung_tu || '',
        nguon: r.loai_chung_tu ? t(nguonChungTuToI18nKey(r.loai_chung_tu)) : '',
        ghi_chu: r.ghi_chu || '',
        chi_nhanh: r.ref_ten_chi_nhanh || r.ten_chi_nhanh || '',
        nguoi_tao: r.ref_ten_nguoi_tao || r.ten_nguoi_tao || '',
      })),
    [exportRows, t]
  );

  const importColumns = useMemo(
    () => [
      { key: 'ngay', label: t('thuChiQuy.store.ngayCol'), required: true },
      { key: 'dien_giai', label: t('thuChiQuy.store.dienGiaiCol'), required: true },
      { key: 'so_luong', label: t('thuChiQuy.store.soLuongCol') },
      { key: 'don_gia', label: t('thuChiQuy.store.donGiaCol') },
      { key: 'hang_muc', label: t('thuChiQuy.store.hangMucCol') },
      { key: 'thu', label: t('thuChiQuy.store.thuCol') },
      { key: 'chi', label: t('thuChiQuy.store.chiCol') },
      { key: 'so_chung_tu', label: t('thuChiQuy.store.soChungTuCol') },
      { key: 'ghi_chu', label: t('thuChiQuy.store.ghiChuCol') },
    ],
    [t]
  );

  /** Xuất TẤT CẢ bản ghi khớp filter, không chỉ trang đang xem. */
  const handleOpenExport = useCallback(async () => {
    setExportLoading(true);
    try {
      const all = await getThuChiQuyAll(listQuery);
      setExportRows(all);
      setShowExport(true);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setExportLoading(false);
    }
  }, [listQuery]);

  /** Nhãn cho hàng tổng: tên farm khi chỉ chọn một, còn lại để trống (= tất cả). */
  const tenChiNhanhDangXem =
    chiNhanhDangXem.length === 1
      ? (branches.find((b) => String(b.id) === chiNhanhDangXem[0])?.ten_chi_nhanh ?? '')
      : '';

  return (
    <div className="flex flex-col flex-1 min-h-0 rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <ThuChiQuyToolbar
        branches={allowedBranches.map((b) => ({ id: String(b.id), ten_chi_nhanh: b.ten_chi_nhanh }))}
        chiNhanhDangXem={chiNhanhDangXem}
        onChangeChiNhanh={(ids) => {
          setChiNhanhDangXem(ids);
          setPage(1);
        }}
        hangMucList={hangMucList}
        nguoiTaoList={employees.map((e) => ({ id: e.id, ho_ten: e.ho_ten }))}
        onAdd={() => {
          setEditingItem(null);
          setShowForm(true);
        }}
        onDeleteMany={handleDeleteMany}
        onExport={handleOpenExport}
        exportLoading={exportLoading}
        onImport={canCreate ? () => setShowImport(true) : undefined}
        canCreate={canCreate}
        canDelete={canDelete}
      />

      {hasOtherFilter && (
        <p className="px-3 pt-2 text-xs text-muted-foreground inline-flex items-center gap-1.5">
          <Info size={13} />
          {t('thuChiQuy.summary.filterHint')}
        </p>
      )}

      <div className="flex-1 min-h-0 overflow-auto px-2 pb-2">
        <ThuChiQuyList
          data={rows}
          tonQuyHienTai={tonQuyHienTai}
          tenChiNhanhDangXem={tenChiNhanhDangXem}
          isLoading={!pageQuery.data && pageQuery.isPending}
          isFetching={!!pageQuery.data && pageQuery.isFetching}
          isError={pageQuery.isError}
          onRetry={() => pageQuery.refetch()}
          totalCount={totalCount}
          onEdit={canUpdate ? handleEdit : undefined}
          onDelete={canDelete ? handleDelete : undefined}
          canEditRow={perms.canEditRow}
          canDeleteRow={perms.canDeleteRow}
          onRowClick={setDetailItem}
        />
      </div>

      <AnimatePresence>
        {showForm && (
          <ThuChiQuyForm
            initialData={editingItem}
            defaultChiNhanhId={chiNhanhDangXem.length === 1 ? chiNhanhDangXem[0] : ''}
            allowedBranchIds={viewScope.viewAll ? [] : viewScope.allowedBranchIds}
            onClose={() => {
              setShowForm(false);
              setEditingItem(null);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {detailItem && (
          <ThuChiQuyDetail
            data={detailItem}
            onClose={() => setDetailItem(null)}
            onEdit={canUpdate && perms.canEditRow(detailItem) ? handleEdit : undefined}
            onDelete={canDelete && perms.canDeleteRow(detailItem) ? handleDelete : undefined}
            onKhoa={perms.canKhoa(detailItem) ? handleKhoa : undefined}
            onXinMo={perms.canXinMo(detailItem) ? (item) => setXinMoItem(item) : undefined}
            onDuyetMo={perms.canDuyetMo(detailItem) ? (item) => handleXuLyMo(item, true) : undefined}
            onTuChoiMo={
              perms.canTuChoiMo(detailItem) ? (item) => handleXuLyMo(item, false) : undefined
            }
            trangThaiPending={trangThaiPending}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {xinMoItem && (
          <XinMoKhoaDialog
            soPhieu={xinMoItem.so_phieu}
            isPending={xinMoMutation.isPending}
            onClose={() => setXinMoItem(null)}
            onConfirm={(lyDo) =>
              xinMoMutation.mutate({
                id: xinMoItem.id,
                extra: {
                  lyDo,
                  idNguoiYeuCau: user?.id ?? null,
                  tenNguoiYeuCau: user?.ho_va_ten || user?.full_name || null,
                },
              })
            }
          />
        )}
      </AnimatePresence>

      <LazyExportDialog
        open={showExport}
        onClose={() => {
          setShowExport(false);
          setExportRows([]);
        }}
        columns={exportColumns}
        data={exportData}
        selectedData={exportData.filter((_, idx) => selectedIds.has(exportRows[idx]?.id))}
        paginatedData={exportData.filter((_, idx) => rows.some((r) => r.id === exportRows[idx]?.id))}
        fileName={t('thuChiQuy.export.fileName')}
        sheetName={t('thuChiQuy.export.sheetName')}
      />

      <LazyImportDialog
        open={showImport}
        onClose={() => {
          setShowImport(false);
          setImportErrors([]);
        }}
        columns={importColumns}
        importErrors={importErrors}
        templateFileName={t('thuChiQuy.import.templateName')}
        onImport={async (data) => {
          const summary = await handleImport(data);
          if ((summary.created ?? 0) > 0) {
            toast.success(t('thuChiQuy.import.success', { count: summary.created }));
          }
          return summary;
        }}
      />
    </div>
  );
};

export default DanhSachTab;
