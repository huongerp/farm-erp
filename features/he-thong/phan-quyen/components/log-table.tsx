
import React from 'react';
import { useTranslation } from 'react-i18next';
import { User, Monitor, Clock, MapPin, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { AccessLog } from '../core/types';
import { useLogStore } from '../store/useLogStore';
import GenericTable from '../../../../components/shared/GenericTable';
import { formatDateTime, formatTimeDateShort } from '../../../../lib/utils';

interface Props {
  data: AccessLog[];
  isLoading: boolean;
}

const LogTable: React.FC<Props> = ({ data, isLoading }) => {
  const { t } = useTranslation();
  const { 
    columns, pagination, setPage, setPageSize 
  } = useLogStore();

  const getStatusBadge = (status: string) => {
      switch(status) {
          case 'Success': return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900"><CheckCircle2 size={12}/> {t('permission.log.success')}</span>;
          case 'Warning': return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900"><AlertTriangle size={12}/> {t('permission.log.warning')}</span>;
          default: return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-900"><XCircle size={12}/> {t('permission.log.error')}</span>;
      }
  };

  const renderCell = (colId: string, item: AccessLog) => {
    switch (colId) {
        case 'nguoi_dung':
            return (
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground border border-border"><User size={16}/></div>
                    <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-foreground text-sm truncate">{item.ten_nguoi_dung}</span>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin size={10} /> {item.dia_chi_ip}
                        </div>
                    </div>
                </div>
            );
        case 'hanh_dong':
            return (
                <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium text-foreground">{item.hanh_dong}</span>
                    <span className="text-body-sm text-muted-foreground italic line-clamp-1">{item.mo_ta}</span>
                </div>
            );
        case 'thong_tin':
            return (
                <div className="flex items-center gap-2 text-body-sm text-muted-foreground">
                    <Monitor size={14} className="text-muted-foreground" />
                    <span className="font-medium">{item.thiet_bi}</span>
                </div>
            );
        case 'tg_thuc_hien':
            return (
                <div className="flex flex-col">
                    <span className="text-body-sm font-medium text-foreground">{formatDateTime(item.tg_thuc_hien)}</span>
                    <span className="text-xs text-muted-foreground">{t('permission.log.systemTime')}</span>
                </div>
            );
        case 'trang_thai':
            return getStatusBadge(item.trang_thai);
        case 'actions': return null;
        default: return null;
    }
  };

  const renderMobileCard = (item: AccessLog) => (
      <div key={item.id} className="bg-card rounded-xl border p-4 shadow-sm border-border">
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-muted text-muted-foreground"><User size={16}/></div>
                    <div>
                        <h4 className="font-semibold text-foreground text-sm">{item.ten_nguoi_dung}</h4>
                        <p className="text-xs text-muted-foreground">{item.dia_chi_ip}</p>
                    </div>
                </div>
                {getStatusBadge(item.trang_thai)}
            </div>
            <div className="bg-muted p-3 rounded-xl mb-3 border border-border">
                <p className="text-xs text-muted-foreground mb-1">{t('permission.log.action')}</p>
                <p className="text-body-sm font-medium text-foreground">{item.hanh_dong}</p>
                <p className="text-body-sm text-muted-foreground mt-1">{item.mo_ta}</p>
            </div>
            <div className="flex justify-between items-center text-xs text-muted-foreground">
                <div className="flex items-center gap-1"><Monitor size={12}/> {item.thiet_bi}</div>
                <div className="flex items-center gap-1"><Clock size={12}/> {formatTimeDateShort(item.tg_thuc_hien)}</div>
            </div>
      </div>
  );

  return (
    <GenericTable
        data={data}
        columns={columns}
        isLoading={isLoading}
        loadingText={t('permission.matrix.loading')}
        selectedIds={new Set()}
        onToggleSelection={() => {}}
        onToggleAll={() => {}}
        page={pagination.page}
        pageSize={pagination.pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        renderCell={renderCell}
        renderMobileCard={renderMobileCard}
        keyExtractor={item => item.id}
    />
  );
};

export default LogTable;
