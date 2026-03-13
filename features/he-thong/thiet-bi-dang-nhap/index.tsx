import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useModulePermissionFromContext } from '../../../components/shared/ModulePermissionGuard';
import LoginDeviceToolbar from './components/thiet-bi-dang-nhap-toolbar';
import LoginDeviceTable from './components/thiet-bi-dang-nhap-table';
import ExportDialog from '../../../components/shared/ExportDialog';

import {
  useLoginDevices,
  useLogoutDevice,
  useLogoutDevices,
} from './hooks/use-thiet-bi-dang-nhap';
import { useLoginDeviceStore } from './store/useLoginDeviceStore';
import { useConfirmStore } from '../../../store/useConfirmStore';
import { useListWithFilter } from '../../../lib/hooks';
import { useExportData } from '../../../lib/useExportData';
import { getLanguage, formatDateTimeShort } from '../../../lib/utils';
import type { LoginDevice } from './core/types';
import { TRANG_THAI_HOAT_DONG } from '../../../lib/constants';

const LoginDevicePage: React.FC = () => {
  const { t } = useTranslation();
  const { canUpdate } = useModulePermissionFromContext();
  const confirm = useConfirmStore((s) => s.confirm);

  const [showExport, setShowExport] = useState(false);

  const {
    searchTerm,
    filters,
    sort,
    resetState,
    clearSelection,
    selectedIds,
    pagination,
    columns,
  } = useLoginDeviceStore();

  const { data: devices = [], isLoading } = useLoginDevices();
  const logoutMutation = useLogoutDevice();
  const logoutManyMutation = useLogoutDevices();

  useEffect(() => {
    return () => resetState();
  }, [resetState]);

  const filterFn = useCallback(
    (item: LoginDevice, term: string, f: typeof filters) => {
      const searchLower = term.toLowerCase();
      const matchesSearch =
        !term ||
        item.ten_user.toLowerCase().includes(searchLower) ||
        item.email_user.toLowerCase().includes(searchLower) ||
        item.ten_thiet_bi.toLowerCase().includes(searchLower) ||
        item.dia_chi_ip.includes(term);
      const statusKey = item.trang_thai === 1 ? 'Active' : 'Inactive';
      const matchesStatus = f.status.length === 0 || f.status.includes(statusKey);
      return matchesSearch && matchesStatus;
    },
    []
  );

  const filteredDevices = useListWithFilter(
    devices,
    searchTerm,
    filters,
    filterFn
  );

  const sortedDevices = useMemo(() => {
    if (!sort.column || !sort.direction) return filteredDevices;
    const sorted = [...filteredDevices];
    sorted.sort((a: LoginDevice, b: LoginDevice) => {
      const aVal = (a as Record<string, unknown>)[sort.column!] ?? '';
      const bVal = (b as Record<string, unknown>)[sort.column!] ?? '';
      let cmp = 0;
      if (typeof aVal === 'number' && typeof bVal === 'number') cmp = aVal - bVal;
      else if (sort.column === 'tg_dang_nhap_cuoi') {
        cmp =
          new Date(a.tg_dang_nhap_cuoi).getTime() -
          new Date(b.tg_dang_nhap_cuoi).getTime();
      } else {
        cmp = String(aVal).localeCompare(String(bVal), getLanguage());
      }
      return sort.direction === 'desc' ? -cmp : cmp;
    });
    return sorted;
  }, [filteredDevices, sort]);

  const EXPORT_COLUMNS = useMemo(
    () => [
      { key: 'ten_user', label: t('loginDevices.store.userCol') },
      { key: 'email_user', label: t('employee.email') },
      { key: 'ten_thiet_bi', label: t('loginDevices.store.deviceCol') },
      { key: 'dia_chi_ip', label: t('loginDevices.store.ipCol') },
      { key: 'tg_dang_nhap_cuoi', label: t('loginDevices.store.lastLoginCol') },
      { key: 'trang_thai_text', label: t('loginDevices.store.statusCol') },
    ],
    [t]
  );

  const exportMapFn = useCallback(
    (item: LoginDevice) => ({
      ten_user: item.ten_user,
      email_user: item.email_user,
      ten_thiet_bi: item.ten_thiet_bi,
      dia_chi_ip: item.dia_chi_ip,
      tg_dang_nhap_cuoi: formatDateTimeShort(item.tg_dang_nhap_cuoi),
      trang_thai_text:
        item.trang_thai === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG
          ? t('loginDevices.status.active')
          : t('loginDevices.status.inactive'),
    }),
    [t]
  );

  const {
    exportData,
    paginatedData: paginatedExportData,
    selectedData: selectedExportData,
  } = useExportData({
    data: filteredDevices,
    isOpen: showExport,
    mapFn: exportMapFn,
    pagination,
    selectedIds,
    keyExtractor: (d) => d.id,
  });

  const visibleColumnKeys = useMemo(
    () => EXPORT_COLUMNS.map((c) => c.key),
    [EXPORT_COLUMNS]
  );

  const handleLogout = (item: LoginDevice) => {
    if (item.la_thiet_bi_hien_tai) {
      toast.warning(t('loginDevices.cannotLogoutCurrent'));
      return;
    }
    if (item.trang_thai === TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG) return;
    confirm({
      title: t('loginDevices.logoutDeviceConfirmTitle'),
      message: t('loginDevices.logoutDeviceConfirmMessage', {
        device: item.ten_thiet_bi,
      }),
      variant: 'warning',
      confirmText: t('loginDevices.logoutDevice'),
      onConfirm: () => logoutMutation.mutate(item.id),
    });
  };

  const handleLogoutMany = (ids: string[]) => {
    if (ids.length === 0) return;
    confirm({
      title: t('loginDevices.logoutDevicesConfirmTitle'),
      message: t('loginDevices.logoutDevicesConfirmMessage', { count: ids.length }),
      variant: 'warning',
      confirmText: t('loginDevices.logoutDevice'),
      onConfirm: () => {
        logoutManyMutation.mutate(ids, {
          onSuccess: () => clearSelection(),
        });
      },
    });
  };

  const handleExport = () => {
    if (filteredDevices.length === 0) {
      toast.warning(t('loginDevices.noExportData'));
      return;
    }
    setShowExport(true);
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)] relative">
      <div className="flex-1 min-h-0 flex flex-col mt-1.5 rounded-xl border border-border bg-card shadow-sm overflow-hidden relative z-0">
        <LoginDeviceToolbar
          devices={devices}
          onExport={handleExport}
          onLogoutMany={handleLogoutMany}
          canUpdate={canUpdate}
        />

        <div className="flex-1 min-h-0">
          <LoginDeviceTable
            data={sortedDevices}
            isLoading={isLoading}
            onLogout={handleLogout}
            canUpdate={canUpdate}
          />
        </div>
      </div>

      {showExport && (
        <ExportDialog
          open={showExport}
          onClose={() => setShowExport(false)}
          columns={EXPORT_COLUMNS}
          data={exportData}
          paginatedData={paginatedExportData}
          selectedData={selectedExportData}
          fileName="Thiet_Bi_Dang_Nhap"
          visibleColumnKeys={visibleColumnKeys}
        />
      )}
    </div>
  );
};

export default LoginDevicePage;
