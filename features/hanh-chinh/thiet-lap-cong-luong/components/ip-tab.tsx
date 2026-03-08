import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import PayrollWifiIpToolbar from './ip-toolbar';
import PayrollWifiIpTable from './ip-table';
import PayrollWifiIpForm from './ip-form';
import PayrollWifiIpDetail from './ip-detail';
import { usePayrollWifiIps, useDeletePayrollWifiIps, useUpdatePayrollWifiIpStatus, useImportPayrollWifiIps } from '../hooks/use-payroll-wifi-ip';
import { usePayrollWifiIpStore } from '../store/usePayrollWifiIpStore';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { CONFIRM_DELETE, CONFIRM_YES, CONFIRM_DELETE_ALL } from '../../../../lib/button-labels';
import { useListWithFilter } from '../../../../lib/hooks';
import { formatDateTimeShort, getLanguage } from '../../../../lib/utils';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';
import { PayrollWifiIp } from '../core/types';
import { useBranches } from '../../../he-thong/chi-nhanh/hooks/use-chi-nhanh';
import ImportDialog from '../../../../components/shared/ImportDialog';
import ExportDialog from '../../../../components/shared/ExportDialog';
import { useExportData } from '../../../../lib/useExportData';

const PayrollWifiIpTab: React.FC = () => {
  const { t } = useTranslation();
  const confirm = useConfirmStore((s) => s.confirm);
  const {
    searchTerm,
    filters,
    sort,
    resetState,
    clearSelection,
    selectedIds,
    pagination,
  } = usePayrollWifiIpStore();

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<PayrollWifiIp | null>(null);
  const [detailItem, setDetailItem] = useState<PayrollWifiIp | null>(null);
  const [openedFormFromDetailId, setOpenedFormFromDetailId] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [showExport, setShowExport] = useState(false);

  const { data: ipList = [], isLoading } = usePayrollWifiIps();
  const { data: branches = [] } = useBranches();
  const deleteMutation = useDeletePayrollWifiIps();
  const statusMutation = useUpdatePayrollWifiIpStatus();
  const importMutation = useImportPayrollWifiIps(() => setShowImport(false));

  useEffect(() => {
    return () => resetState();
  }, [resetState]);

  const filterFn = useCallback(
    (item: PayrollWifiIp, term: string, f: typeof filters) => {
      const searchLower = term.toLowerCase();
      const matchesSearch =
        !term ||
        item.ip_wifi.toLowerCase().includes(searchLower) ||
        (item.ten_chi_nhanh && item.ten_chi_nhanh.toLowerCase().includes(searchLower));
      const statusKey = item.trang_thai === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG ? 'Active' : 'Inactive';
      const matchesStatus = f.status.length === 0 || f.status.includes(statusKey);
      const matchesBranch = f.id_chi_nhanh.length === 0 || f.id_chi_nhanh.includes(item.id_chi_nhanh);
      return matchesSearch && matchesStatus && matchesBranch;
    },
    []
  );

  const filteredList = useListWithFilter(ipList, searchTerm, filters, filterFn);

  const sortedList = useMemo(() => {
    if (!sort.column || !sort.direction) return filteredList;
    const sorted = [...filteredList];
    sorted.sort((a: any, b: any) => {
      const aVal = a[sort.column!] ?? '';
      const bVal = b[sort.column!] ?? '';
      let cmp = 0;
      if (typeof aVal === 'number' && typeof bVal === 'number') cmp = aVal - bVal;
      else cmp = String(aVal).localeCompare(String(bVal), getLanguage());
      return sort.direction === 'desc' ? -cmp : cmp;
    });
    return sorted;
  }, [filteredList, sort]);

  const branchById = useMemo(
    () => new Map(branches.map((b) => [b.id, b])),
    [branches]
  );

  const IMPORT_COLUMNS = useMemo(
    () => [
      { key: 'ma_chi_nhanh', label: t('branch.store.codeCol'), required: true },
      { key: 'ip_wifi', label: t('payrollIp.store.ipCol'), required: true },
      { key: 'ghi_chu', label: t('payrollIp.store.noteCol') },
      { key: 'trang_thai', label: t('payrollIp.store.statusCol') },
    ],
    [t]
  );

  const EXPORT_COLUMNS = useMemo(
    () => [
      { key: 'ma_chi_nhanh', label: t('branch.store.codeCol') },
      { key: 'ten_chi_nhanh', label: t('payrollIp.store.branchCol') },
      { key: 'ip_wifi', label: t('payrollIp.store.ipCol') },
      { key: 'ghi_chu', label: t('payrollIp.store.noteCol') },
      { key: 'trang_thai_text', label: t('payrollIp.store.statusCol') },
      { key: 'tg_cap_nhat_text', label: t('payrollIp.store.updatedCol') },
    ],
    [t]
  );

  const exportMapFn = useCallback(
    (item: PayrollWifiIp) => {
      const branch = branchById.get(item.id_chi_nhanh);
      return {
        ma_chi_nhanh: branch?.ma_chi_nhanh ?? '',
        ten_chi_nhanh: item.ten_chi_nhanh ?? branch?.ten_chi_nhanh ?? '',
        ip_wifi: item.ip_wifi,
        ghi_chu: item.ghi_chu ?? '',
        trang_thai_text: item.trang_thai === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG ? t('payrollIp.active') : t('payrollIp.inactive'),
        tg_cap_nhat_text: formatDateTimeShort(item.tg_cap_nhat),
      };
    },
    [branchById, t]
  );

  const { exportData, paginatedData: paginatedExportData, selectedData: selectedExportData } = useExportData({
    data: filteredList,
    isOpen: showExport,
    mapFn: exportMapFn,
    pagination,
    selectedIds,
    keyExtractor: (item) => item.id,
  });

  const visibleColumnKeys = useMemo(
    () => EXPORT_COLUMNS.map((c) => c.key),
    [EXPORT_COLUMNS]
  );

  const handleView = (item: PayrollWifiIp) => {
    setEditingItem(null);
    setShowForm(false);
    setDetailItem(item);
  };

  const handleEdit = (item: PayrollWifiIp) => {
    setEditingItem(item);
    setShowForm(true);
    if (detailItem?.id === item.id) {
      setOpenedFormFromDetailId(item.id);
      setDetailItem(null);
    } else {
      setDetailItem(null);
      setOpenedFormFromDetailId(null);
    }
  };

  const handleDelete = (id: string) => {
    confirm({
      title: t('payrollIp.deleteTitle'),
      message: t('payrollIp.deleteMessage'),
      variant: 'danger',
      confirmText: CONFIRM_DELETE(),
      onConfirm: async () => {
        deleteMutation.mutate([id], {
          onSuccess: () => {
            if (detailItem?.id === id) setDetailItem(null);
          },
        });
      },
    });
  };

  const handleDeleteMany = (ids: string[]) => {
    confirm({
      title: t('payrollIp.bulkDeleteTitle'),
      message: t('payrollIp.bulkDeleteMessage', { count: ids.length }),
      variant: 'danger',
      confirmText: CONFIRM_DELETE_ALL(),
      onConfirm: async () => {
        deleteMutation.mutate(ids, {
          onSuccess: () => {
            clearSelection();
            if (detailItem && ids.includes(detailItem.id)) setDetailItem(null);
          },
        });
      },
    });
  };

  const handleStatusChangeMany = (ids: string[], status: import('../../../../lib/constants').TrangThaiHoatDong) => {
    const statusLabel = status === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG ? t('payrollIp.active') : t('payrollIp.inactive');
    confirm({
      title: t('payrollIp.statusChangeTitle'),
      message: t('payrollIp.statusChangeMessage', { count: ids.length, status: statusLabel }),
      variant: 'warning',
      confirmText: CONFIRM_YES(),
      onConfirm: async () => {
        statusMutation.mutate(
          { ids, status },
          {
            onSuccess: () => {
              clearSelection();
              if (detailItem && ids.includes(detailItem.id)) {
                const next = ipList.find((x) => x.id === detailItem.id);
                if (next) setDetailItem(next);
              }
            },
          }
        );
      },
    });
  };

  const handleImportData = async (data: Record<string, any>[]) => {
    const branchByCode = new Map(branches.map((b) => [b.ma_chi_nhanh, b.id]));
    const branchByName = new Map(branches.map((b) => [b.ten_chi_nhanh, b.id]));
    const rows: { id_chi_nhanh: string; ip_wifi: string; ghi_chu?: string; trang_thai: import('../../../../lib/constants').TrangThaiHoatDong }[] = [];
    const errors: string[] = [];

    data.forEach((row, idx) => {
      const rawBranch = String(row.ma_chi_nhanh ?? row.ten_chi_nhanh ?? row.id_chi_nhanh ?? '').trim();
      const id_chi_nhanh =
        branchByCode.get(rawBranch) || branchByName.get(rawBranch) || branchByCode.get(rawBranch.toUpperCase());
      if (!id_chi_nhanh) {
        errors.push(`Dòng ${idx + 2}: ${t('payrollIp.validation.branchRequired')}`);
        return;
      }
      const ip_wifi = String(row.ip_wifi ?? '').trim();
      if (!ip_wifi) {
        errors.push(`Dòng ${idx + 2}: ${t('payrollIp.validation.ipRequired')}`);
        return;
      }
      const statusRaw = String(row.trang_thai ?? '').toLowerCase();
      const trang_thai =
        statusRaw === '0' || statusRaw === 'inactive' || statusRaw === 'ngừng' || statusRaw === 'ngung' || statusRaw === 'ngừng hoạt động'
          ? TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG
          : TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG;
      rows.push({
        id_chi_nhanh,
        ip_wifi,
        ghi_chu: row.ghi_chu != null ? String(row.ghi_chu).trim() : undefined,
        trang_thai,
      });
    });

    if (errors.length > 0) {
      toast.warning(errors.slice(0, 3).join('; '));
    }
    if (rows.length === 0) return;
    await importMutation.mutateAsync(rows);
  };

  const handleExport = () => {
    if (filteredList.length === 0) {
      toast.warning(t('payrollIp.noExportData'));
      return;
    }
    setShowExport(true);
  };

  const handleCloseForm = () => {
    const wasFromDetail = openedFormFromDetailId != null;
    const editingId = editingItem?.id;
    setShowForm(false);
    setEditingItem(null);
    setOpenedFormFromDetailId(null);
    if (wasFromDetail && editingId) {
      const fresh = ipList.find((r) => r.id === editingId) ?? null;
      setDetailItem(fresh);
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <PayrollWifiIpToolbar
        items={ipList}
        onAdd={() => {
          setDetailItem(null);
          setEditingItem(null);
          setShowForm(true);
        }}
        onImport={() => setShowImport(true)}
        onExport={handleExport}
        onDeleteMany={handleDeleteMany}
        onStatusChangeMany={handleStatusChangeMany}
      />
      <div className="flex-1 min-h-0">
        <PayrollWifiIpTable
          data={sortedList}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={handleView}
        />
      </div>

      <AnimatePresence>
        {showForm && (
          <PayrollWifiIpForm initialData={editingItem} onClose={handleCloseForm} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {detailItem && !showForm && (
          <PayrollWifiIpDetail
            data={detailItem}
            onClose={() => setDetailItem(null)}
            onEdit={(item) => handleEdit(item)}
            onDelete={(id) => {
              setDetailItem(null);
              handleDelete(id);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showExport && (
          <ExportDialog
            open={showExport}
            onClose={() => setShowExport(false)}
            columns={EXPORT_COLUMNS}
            data={exportData}
            paginatedData={paginatedExportData}
            selectedData={selectedExportData}
            fileName={t('payrollIp.exportFileName')}
            visibleColumnKeys={visibleColumnKeys}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showImport && (
          <ImportDialog
            open={showImport}
            onClose={() => setShowImport(false)}
            columns={IMPORT_COLUMNS}
            onImport={handleImportData}
            templateFileName={t('payrollIp.importTemplateName')}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default PayrollWifiIpTab;
