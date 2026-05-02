import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { BookOpen, Package } from 'lucide-react';
import TabGroup from '../../../components/ui/TabGroup';
import { useModulePermissionFromContext } from '../../../components/shared/ModulePermissionGuard';
import DanhMucToolbar from './components/DanhMucToolbar';
import DanhMucList from './components/DanhMucList';
import DanhMucForm from './components/DanhMucForm';
import DanhMucDetail from './components/DanhMucDetail';
import HangHoaToolbar from './components/HangHoaToolbar';
import HangHoaList from './components/HangHoaList';
import HangHoaForm from './components/HangHoaForm';
import HangHoaDetail from './components/HangHoaDetail';
import {
  useFarmDanhMucList,
  useDeleteFarmDanhMuc,
  useDeleteFarmDanhMucMany,
} from './hooks/use-farm-danh-muc';
import { useFarmHangHoaList, useDeleteFarmHangHoa, useDeleteFarmHangHoaMany } from './hooks/use-farm-hang-hoa';
import { useFarmDanhMucStore } from './store/useFarmDanhMucStore';
import { useFarmHangHoaStore } from './store/useFarmHangHoaStore';
import { useConfirmStore } from '../../../store/useConfirmStore';
import { CONFIRM_DELETE, CONFIRM_DELETE_ALL } from '../../../lib/button-labels';
import { useListWithFilter } from '../../../lib/hooks';
import type { FarmDanhMuc } from './core/types';
import type { FarmHangHoa } from './core/types';

const HangHoaPhanThuocPage: React.FC = () => {
  const { t } = useTranslation();
  const { canCreate, canUpdate, canDelete } = useModulePermissionFromContext();
  const confirm = useConfirmStore((s) => s.confirm);

  const [activeTab, setActiveTab] = useState<'danhMuc' | 'hangHoa'>('danhMuc');

  const dmStore = useFarmDanhMucStore();
  const {
    searchTerm: dmSearch,
    filters: dmFilters,
    resetState: resetDmState,
    selectedIds: dmSelectedIds,
    columns: dmColumns,
    clearSelection: clearDmSelection,
    toggleSelection: toggleDmSelection,
    toggleAllSelection: toggleDmAllSelection,
  } = dmStore;

  const hhStore = useFarmHangHoaStore();
  const {
    searchTerm: hhSearch,
    filters: hhFilters,
    resetState: resetHhState,
    selectedIds: hhSelectedIds,
    columns: hhColumns,
    clearSelection: clearHhSelection,
    toggleSelection: toggleHhSelection,
    toggleAllSelection: toggleHhAllSelection,
    pagination: hhPagination,
    setPage: setHhPage,
    setPageSize: setHhPageSize,
  } = hhStore;

  const [showDmForm, setShowDmForm] = useState(false);
  const [dmEditing, setDmEditing] = useState<FarmDanhMuc | null>(null);
  const [dmViewing, setDmViewing] = useState<FarmDanhMuc | null>(null);
  const [dmDefaultParentId, setDmDefaultParentId] = useState<string | null>(null);
  const [dmPage, setDmPage] = useState(1);
  const [dmPageSize, setDmPageSize] = useState(20);

  const [showHhForm, setShowHhForm] = useState(false);
  const [hhEditing, setHhEditing] = useState<FarmHangHoa | null>(null);
  const [hhViewing, setHhViewing] = useState<FarmHangHoa | null>(null);

  const { data: dmList = [], isLoading: dmLoading } = useFarmDanhMucList();
  const { data: hhList = [], isLoading: hhLoading } = useFarmHangHoaList();

  const nextDmThuTu = useMemo(
    () => (dmList.length === 0 ? 1 : Math.max(...dmList.map((d) => d.thu_tu ?? 0)) + 1),
    [dmList]
  );
  const deleteDm = useDeleteFarmDanhMuc();
  const deleteDmMany = useDeleteFarmDanhMucMany();

  const existingDvtList = useMemo(
    () =>
      [...new Set(hhList.map((h) => h.dvt).filter((x): x is string => x != null && x.trim() !== ''))].sort((a, b) =>
        a.localeCompare(b)
      ),
    [hhList]
  );
  const deleteHh = useDeleteFarmHangHoa();
  const deleteHhMany = useDeleteFarmHangHoaMany();

  useEffect(() => {
    return () => {
      resetDmState();
      resetHhState();
    };
  }, [resetDmState, resetHhState]);

  useEffect(() => {
    if (!dmViewing) return;
    const fresh = dmList.find((d) => d.id === dmViewing.id);
    if (fresh && fresh !== dmViewing) setDmViewing(fresh);
  }, [dmList, dmViewing?.id]);

  useEffect(() => {
    if (!hhViewing) return;
    const fresh = hhList.find((h) => h.id === hhViewing.id);
    if (fresh && fresh !== hhViewing) setHhViewing(fresh);
  }, [hhList, hhViewing?.id]);

  const dmFilterFn = useCallback((item: FarmDanhMuc, term: string, _f: typeof dmFilters) => {
    const searchLower = term.toLowerCase();
    return (
      !term ||
      item.ten_danh_muc.toLowerCase().includes(searchLower) ||
      item.ma_danh_muc.toLowerCase().includes(searchLower)
    );
  }, []);

  const filteredDm = useListWithFilter(dmList, dmSearch, dmFilters, dmFilterFn);

  useEffect(() => {
    setDmPage(1);
  }, [filteredDm.length]);

  const dmMaxPage = Math.max(1, Math.ceil(filteredDm.length / dmPageSize));
  useEffect(() => {
    setDmPage((p) => Math.min(p, dmMaxPage));
  }, [dmPageSize, dmMaxPage]);

  const hhFilterFn = useCallback((item: FarmHangHoa, term: string, f: typeof hhFilters) => {
    const searchLower = term.toLowerCase();
    const matchesSearch =
      !term ||
      item.ten_hang_hoa.toLowerCase().includes(searchLower) ||
      item.ma_hang_hoa.toLowerCase().includes(searchLower) ||
      (item.ten_danh_muc?.toLowerCase().includes(searchLower) ?? false) ||
      (item.dvt?.toLowerCase().includes(searchLower) ?? false);
    const matchesDanhMucCha =
      f.id_danh_muc_cha.length === 0 ||
      (item.danh_muc_cha_id != null && f.id_danh_muc_cha.includes(item.danh_muc_cha_id));
    const matchesDanhMucCon =
      f.id_danh_muc.length === 0 || (item.danh_muc_id != null && f.id_danh_muc.includes(item.danh_muc_id));
    const matchesDvt =
      f.dvt.length === 0 || (item.dvt != null && item.dvt.trim() !== '' && f.dvt.includes(item.dvt.trim()));
    return matchesSearch && matchesDanhMucCha && matchesDanhMucCon && matchesDvt;
  }, []);

  const filteredHh = useListWithFilter(hhList, hhSearch, hhFilters, hhFilterFn);

  useEffect(() => {
    setHhPage(1);
  }, [filteredHh.length, setHhPage]);

  const hhMaxPage = Math.max(1, Math.ceil(filteredHh.length / hhPagination.pageSize));
  useEffect(() => {
    if (hhPagination.page > hhMaxPage) setHhPage(hhMaxPage);
  }, [hhPagination.page, hhPagination.pageSize, hhMaxPage, setHhPage]);

  const tabs = useMemo(
    () => [
      { id: 'danhMuc', label: t('farmHangHoaPhanThuoc.tabs.danhMuc'), icon: BookOpen },
      { id: 'hangHoa', label: t('farmHangHoaPhanThuoc.tabs.hangHoa'), icon: Package },
    ],
    [t]
  );

  const handleDmDelete = (id: string) => {
    confirm({
      title: t('farmHangHoaPhanThuoc.danhMuc.deleteTitle'),
      message: t('farmHangHoaPhanThuoc.danhMuc.deleteMessage'),
      variant: 'danger',
      confirmText: CONFIRM_DELETE(),
      onConfirm: () => {
        deleteDm.mutate(id, {
          onSuccess: () => {
            if (dmViewing?.id === id) setDmViewing(null);
          },
        });
      },
    });
  };

  const handleDmDeleteMany = () => {
    const ids = Array.from(dmSelectedIds);
    confirm({
      title: t('farmHangHoaPhanThuoc.danhMuc.deleteTitle'),
      message: t('common.deleteManyConfirm', { count: ids.length }),
      variant: 'danger',
      confirmText: CONFIRM_DELETE_ALL(),
      onConfirm: () => {
        deleteDmMany.mutate(ids, {
          onSuccess: () => {
            clearDmSelection();
            if (dmViewing && ids.includes(dmViewing.id)) setDmViewing(null);
          },
        });
      },
    });
  };

  const handleHhDelete = (id: string) => {
    confirm({
      title: t('farmHangHoaPhanThuoc.hangHoa.deleteTitle'),
      message: t('farmHangHoaPhanThuoc.hangHoa.deleteMessage'),
      variant: 'danger',
      confirmText: CONFIRM_DELETE(),
      onConfirm: () => {
        deleteHh.mutate(id, {
          onSuccess: () => {
            if (hhViewing?.id === id) setHhViewing(null);
          },
        });
      },
    });
  };

  const handleHhDeleteMany = () => {
    const ids = Array.from(hhSelectedIds);
    confirm({
      title: t('farmHangHoaPhanThuoc.hangHoa.deleteTitle'),
      message: t('common.deleteManyConfirm', { count: ids.length }),
      variant: 'danger',
      confirmText: CONFIRM_DELETE_ALL(),
      onConfirm: () => {
        deleteHhMany.mutate(ids, {
          onSuccess: () => {
            clearHhSelection();
            if (hhViewing && ids.includes(hhViewing.id)) setHhViewing(null);
          },
        });
      },
    });
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)] relative">
      <div className="shrink-0 relative z-0">
        <TabGroup tabs={tabs} activeTab={activeTab} onChange={(id) => setActiveTab(id as 'danhMuc' | 'hangHoa')} />
      </div>

      {activeTab === 'danhMuc' && (
        <div className="flex-1 min-h-0 flex flex-col mt-1.5 rounded-xl border border-border bg-card shadow-sm overflow-hidden relative z-0">
          <DanhMucToolbar
            selectedCount={dmSelectedIds.size}
            onAdd={() => {
              setDmEditing(null);
              setDmDefaultParentId(null);
              setShowDmForm(true);
            }}
            onDeleteMany={handleDmDeleteMany}
            canCreate={canCreate}
            canDelete={canDelete}
          />
          <div className="flex-1 min-h-0 flex flex-col px-4 pb-4 pt-1">
            <DanhMucList
              data={filteredDm}
              columns={dmColumns}
              selectedIds={dmSelectedIds}
              onToggleSelection={toggleDmSelection}
              onToggleAllSelection={toggleDmAllSelection}
              isLoading={dmLoading}
              page={dmPage}
              pageSize={dmPageSize}
              onPageChange={setDmPage}
              onPageSizeChange={setDmPageSize}
              onEdit={canUpdate ? (item) => { setDmEditing(item); setDmDefaultParentId(null); setShowDmForm(true); } : undefined}
              onDelete={canDelete ? handleDmDelete : undefined}
              onAddChild={
                canCreate
                  ? (parent) => {
                      setDmEditing(null);
                      setDmDefaultParentId(parent.id);
                      setShowDmForm(true);
                    }
                  : undefined
              }
              onView={setDmViewing}
            />
          </div>
        </div>
      )}

      {activeTab === 'hangHoa' && (
        <div className="flex-1 min-h-0 flex flex-col mt-1.5 rounded-xl border border-border bg-card shadow-sm overflow-hidden relative z-0">
          <HangHoaToolbar
            data={hhList}
            selectedCount={hhSelectedIds.size}
            onAdd={() => {
              setHhEditing(null);
              setShowHhForm(true);
            }}
            onDeleteMany={handleHhDeleteMany}
            canCreate={canCreate}
            canDelete={canDelete}
          />
          <div className="flex-1 min-h-0 flex flex-col">
            <HangHoaList
              data={filteredHh}
              columns={hhColumns}
              selectedIds={hhSelectedIds}
              onToggleSelection={toggleHhSelection}
              onToggleAllSelection={toggleHhAllSelection}
              isLoading={hhLoading}
              page={hhPagination.page}
              pageSize={hhPagination.pageSize}
              onPageChange={setHhPage}
              onPageSizeChange={setHhPageSize}
              onEdit={canUpdate ? (item) => { setHhEditing(item); setShowHhForm(true); } : undefined}
              onDelete={canDelete ? handleHhDelete : undefined}
              onView={setHhViewing}
            />
          </div>
        </div>
      )}

      <AnimatePresence>
        {showDmForm && (
          <DanhMucForm
            initialData={dmEditing}
            allDanhMuc={dmList}
            defaultThuTu={nextDmThuTu}
            onClose={() => {
              setShowDmForm(false);
              setDmEditing(null);
              setDmDefaultParentId(null);
            }}
            defaultParentId={dmDefaultParentId}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {dmViewing && !showDmForm && (
          <DanhMucDetail
            data={dmViewing}
            allDanhMuc={dmList}
            onClose={() => setDmViewing(null)}
            onEdit={
              canUpdate
                ? (item) => {
                    setDmViewing(null);
                    setDmEditing(item);
                    setDmDefaultParentId(null);
                    setShowDmForm(true);
                  }
                : undefined
            }
            onDelete={canDelete ? (id) => { setDmViewing(null); handleDmDelete(id); } : undefined}
            onAddChild={
              canCreate
                ? (parent) => {
                    setDmViewing(null);
                    setDmEditing(null);
                    setDmDefaultParentId(parent.id);
                    setShowDmForm(true);
                  }
                : undefined
            }
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showHhForm && (
          <HangHoaForm
            initialData={hhEditing}
            existingDvtList={existingDvtList}
            onClose={() => {
              setShowHhForm(false);
              setHhEditing(null);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {hhViewing && !showHhForm && (
          <HangHoaDetail
            data={hhViewing}
            onClose={() => setHhViewing(null)}
            onEdit={
              canUpdate
                ? (item) => {
                    setHhViewing(null);
                    setHhEditing(item);
                    setShowHhForm(true);
                  }
                : undefined
            }
            onDelete={canDelete ? (id) => { setHhViewing(null); handleHhDelete(id); } : undefined}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default HangHoaPhanThuocPage;
