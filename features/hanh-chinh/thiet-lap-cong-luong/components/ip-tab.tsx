import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import PayrollWifiIpToolbar from './ip-toolbar';
import PayrollWifiIpTable from './ip-table';
import PayrollWifiIpForm from './ip-form';
import PayrollWifiIpDetail from './ip-detail';
import { usePayrollWifiIps, useDeletePayrollWifiIps, useUpdatePayrollWifiIpStatus } from '../hooks/use-payroll-wifi-ip';
import { useIpWifiImport } from '../hooks/use-ip-wifi-import';
import { usePayrollWifiIpStore, DEFAULT_COLUMNS } from '../store/usePayrollWifiIpStore';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { CONFIRM_DELETE, CONFIRM_YES, CONFIRM_DELETE_ALL } from '../../../../lib/button-labels';
import { useListWithFilter } from '../../../../lib/hooks';
import { formatDateTimeShort, getLanguage } from '../../../../lib/utils';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';
import { PayrollWifiIp } from '../core/types';
import { useBranches } from '../../../he-thong/chi-nhanh/hooks/use-chi-nhanh';
import ImportDialog from '../../../../components/shared/LazyImportDialog';
import ExportDialog from '../../../../components/shared/LazyExportDialog';
import { useExportData } from '../../../../lib/useExportData';
import { createListSearchMatcher } from '../../../../lib/list-search-matcher';

/** Ô tìm kiếm quét MỌI cột của bảng, bỏ dấu tiếng Việt — xem lib/list-search-matcher.ts. */
const khopTimKiem = createListSearchMatcher({ columns: DEFAULT_COLUMNS });

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
  const [showExport, setShowExport] = useState(false);

  const { data: ipList = [], isLoading } = usePayrollWifiIps();
  const { data: branches = [] } = useBranches();
  const deleteMutation = useDeletePayrollWifiIps();
  const statusMutation = useUpdatePayrollWifiIpStatus();
  const importer = useIpWifiImport(branches);

  useEffect(() => {
    return () => resetState();
  }, [resetState]);

  const filterFn = useCallback(
    (item: PayrollWifiIp, term: string, f: typeof filters) => {
      const matchesSearch = khopTimKiem(item, term);
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
      const cmp =
        typeof aVal === 'number' && typeof bVal === 'number'
          ? aVal - bVal
          : String(aVal).localeCompare(String(bVal), getLanguage());
      return sort.direction === 'desc' ? -cmp : cmp;
    });
    return sorted;
  }, [filteredList, sort]);

  const branchById = useMemo(
    () => new Map(branches.map((b) => [b.id, b])),
    [branches]
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
        onImport={importer.openImport}
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
        {importer.showImport && (
          <ImportDialog
            open={importer.showImport}
            onClose={importer.closeImport}
            columns={importer.importColumns}
            sampleRows={importer.sampleRows}
            referenceSheets={importer.referenceSheets}
            importErrors={importer.importErrors}
            onImport={importer.handleImport}
            templateFileName={importer.templateFileName}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default PayrollWifiIpTab;
