
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2, Phone, Briefcase, Building2, Mail, MapPin, IdCard } from 'lucide-react';
import { Employee } from '../core/types';
import type { Position } from '../../chuc-vu/core/types';
import { useEmployeeStore } from '../store/useEmployeeStore';
import { cn, formatDate } from '../../../../lib/utils';
import GenericTable from '../../../../components/shared/GenericTable';
import EnumBadge from '../../../../components/ui/EnumBadge';
import AvatarWithFallback from '../../../../components/ui/AvatarWithFallback';
import {
    STATUS_BADGE_CONFIG,
    GENDER_BADGE_CONFIG,
    CONTRACT_BADGE_CONFIG,
    EDUCATION_BADGE_CONFIG,
} from '../core/constants';
import { TRANG_THAI_NV } from '../../../../lib/constants';

interface Props {
    data: Employee[];
    /** Khi phân trang server: tổng số bản ghi (khác độ dài `data`). */
    totalRecordsOverride?: number;
    isLoading: boolean;
    isFetching?: boolean;
    onEdit: (item: Employee) => void;
    onDelete: (id: string) => void;
    onView: (item: Employee) => void;
    /** Danh sách chức vụ để tra cứu cấp bậc theo chức vụ khi nhân viên chưa có ten_cap_bac */
    positions?: Position[];
    /** Phân quyền: có quyền sửa (admin hoặc update) */
    canUpdate?: boolean;
    /** Phân quyền: có quyền xoá (admin hoặc delete) */
    canDelete?: boolean;
}

const EmployeeTable: React.FC<Props> = ({ data, totalRecordsOverride, isLoading, isFetching, onEdit, onDelete, onView, positions = [], canUpdate = true, canDelete = true }) => {
    const { t } = useTranslation();
    const {
        columns, pagination, setPage, setPageSize,
        selectedIds, toggleSelection, toggleAllSelection,
        sort, setSort, resizeColumn
    } = useEmployeeStore();

    const renderCell = (colId: string, item: Employee) => {
        switch (colId) {
            case 'ma_nhan_vien':
                return <span className="font-mono text-xs font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border">{item.ma_nhan_vien}</span>;
            case 'ho_ten':
                return (
                    <div className="flex items-center gap-2.5">
                        <AvatarWithFallback src={item.anh_dai_dien} name={item.ho_ten} seed={item.id} size="sm" alt={item.ho_ten} />
                        <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-foreground text-sm truncate">{item.ho_ten}</span>
                            <span className="text-xs text-muted-foreground truncate">{item.so_dien_thoai}</span>
                        </div>
                    </div>
                );
            case 'gioi_tinh':
                return <EnumBadge value={item.gioi_tinh} config={GENDER_BADGE_CONFIG} />;
            case 'email':
                return (
                    <a href={`mailto:${item.email}`} className="flex items-center gap-1.5 text-body-sm text-foreground hover:text-primary transition-colors truncate" onClick={e => e.stopPropagation()}>
                        <Mail size={12} className="text-primary/60 shrink-0" />
                        <span className="truncate">{item.email}</span>
                    </a>
                );
            case 'lien_he':
                return (
                    <div className="flex items-center gap-1.5 text-body-sm text-foreground">
                        <Phone size={12} className="text-primary/60 shrink-0" /> {item.so_dien_thoai}
                    </div>
                );
            case 'ten_chuc_vu':
                return (
                    <div className="flex items-center gap-1.5 text-body-sm font-semibold text-foreground">
                        <Briefcase size={11} className="text-primary shrink-0" />
                        <span className="truncate">{item.ten_chuc_vu || t('employee.unassigned')}</span>
                    </div>
                );
            case 'ten_phong_ban':
                return (
                    <div className="flex items-center gap-1.5 text-body-sm text-foreground">
                        <Building2 size={12} className="text-primary/60 shrink-0" />
                        <span className="truncate">{item.ten_phong_ban || '--'}</span>
                    </div>
                );
            case 'ten_cap_bac': {
                const displayCapBac = item.ten_cap_bac
                    ?? (item.id_chuc_vu && positions.length > 0
                        ? positions.find((p) => p.id === item.id_chuc_vu)?.ten_cap_bac
                        : undefined);
                return displayCapBac
                    ? <span className="text-body-sm font-medium text-foreground">{displayCapBac}</span>
                    : <span className="text-xs text-muted-foreground italic">--</span>;
            }
            case 'ten_chi_nhanh':
                return item.ten_chi_nhanh
                    ? <div className="flex items-center gap-1.5 text-body-sm text-foreground"><MapPin size={12} className="text-primary/60 shrink-0" /><span className="truncate">{item.ten_chi_nhanh}</span></div>
                    : <span className="text-xs text-muted-foreground italic">--</span>;
            case 'loai_hop_dong':
                return item.loai_hop_dong
                    ? <EnumBadge value={item.loai_hop_dong} config={CONTRACT_BADGE_CONFIG} />
                    : <span className="text-xs text-muted-foreground italic">--</span>;
            case 'trang_thai':
                return <EnumBadge value={item.trang_thai} config={STATUS_BADGE_CONFIG} />;
            case 'ngay_vao_lam':
                return (
                    <span className="text-body-sm text-muted-foreground tabular-nums">{formatDate(item.ngay_vao_lam)}</span>
                );
            case 'ngay_sinh':
                return item.ngay_sinh
                    ? <span className="text-body-sm text-muted-foreground tabular-nums">{formatDate(item.ngay_sinh)}</span>
                    : <span className="text-xs text-muted-foreground italic">--</span>;
            case 'noi_lam_viec':
                return item.noi_lam_viec
                    ? <div className="flex items-center gap-1.5 text-body-sm text-foreground"><MapPin size={12} className="text-primary/60 shrink-0" /><span className="truncate">{item.noi_lam_viec}</span></div>
                    : <span className="text-xs text-muted-foreground italic">--</span>;
            case 'tinh_thanh':
                return item.tinh_thanh
                    ? <span className="text-body-sm text-foreground truncate">{item.tinh_thanh}</span>
                    : <span className="text-xs text-muted-foreground italic">--</span>;
            case 'trinh_do_hoc_van':
                return item.trinh_do_hoc_van
                    ? <EnumBadge value={item.trinh_do_hoc_van} config={EDUCATION_BADGE_CONFIG} />
                    : <span className="text-xs text-muted-foreground italic">--</span>;
            case 'cmnd_cccd':
                return item.cmnd_cccd
                    ? <div className="flex items-center gap-1.5 text-body-sm text-foreground"><IdCard size={12} className="text-muted-foreground/60 shrink-0" /><span className="font-mono tabular-nums">{item.cmnd_cccd}</span></div>
                    : <span className="text-xs text-muted-foreground italic">--</span>;
            case 'actions':
                return (
                    <div className="flex items-center justify-center gap-0.5">
                        {canUpdate && <button onClick={(e) => { e.stopPropagation(); onEdit(item); }} className="p-2 text-primary hover:bg-primary/10 rounded-md transition-all"><Edit size={15} /></button>}
                        {canDelete && <button onClick={(e) => { e.stopPropagation(); onDelete(item.id); }} className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md transition-all"><Trash2 size={15} /></button>}
                    </div>
                );
            default:
                return null;
        }
    };

    const renderMobileCard = (item: Employee, isSelected: boolean) => (
        <div key={item.id} onClick={() => onView(item)} className={cn(
            "bg-card rounded-xl border p-3.5 shadow-sm transition-all active:scale-[0.98]",
            isSelected ? 'border-primary ring-2 ring-primary/10' : 'border-border'
        )}>
            <div className="flex items-center gap-3 mb-3">
                <div className="relative shrink-0">
                    <AvatarWithFallback src={item.anh_dai_dien} name={item.ho_ten} seed={item.id} size="lg" rounded="lg" alt={item.ho_ten} />
                    <div className={cn(
                        "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card",
                        item.trang_thai === TRANG_THAI_NV.DANG_LAM_VIEC ? "bg-emerald-500" : "bg-muted-foreground/30"
                    )}></div>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-foreground text-sm truncate">{item.ho_ten}</h4>
                        <div onClick={e => e.stopPropagation()} className="ml-2">
                            <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelection(item.id)}
                                className="w-4 h-4 rounded border-border text-primary accent-primary cursor-pointer"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">{item.ma_nhan_vien}</span>
                        <EnumBadge value={item.trang_thai} config={STATUS_BADGE_CONFIG} />
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-2 px-3 py-2 bg-muted/30 rounded-lg mb-3 text-body-sm">
                <div>
                    <p className="text-muted-foreground mb-0.5">{t('employee.position')}</p>
                    <p className="font-medium text-foreground truncate">{item.ten_chuc_vu}</p>
                </div>
                <div className="text-right">
                    <p className="text-muted-foreground mb-0.5">{t('employee.department')}</p>
                    <p className="font-medium text-foreground truncate">{item.ten_phong_ban}</p>
                </div>
            </div>
            <div className="flex justify-between items-center pt-2.5 border-t border-border">
                <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                    <Phone size={12} />
                    <span>{item.so_dien_thoai}</span>
                </div>
                <div className="flex gap-1.5">
                    {canUpdate && <button onClick={e => { e.stopPropagation(); onEdit(item); }} aria-label={t('common.edit')} className="min-h-[44px] min-w-[44px] flex items-center justify-center text-primary bg-primary/5 hover:bg-primary/10 rounded-lg transition-all active:scale-90"><Edit size={14} /></button>}
                    {canDelete && <button onClick={e => { e.stopPropagation(); onDelete(item.id); }} aria-label={t('common.delete')} className="min-h-[44px] min-w-[44px] flex items-center justify-center text-rose-500 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 rounded-lg transition-all active:scale-90"><Trash2 size={14} /></button>}
                </div>
            </div>
        </div>
    );

    return (
        <GenericTable
            data={data}
            totalRecordsOverride={totalRecordsOverride}
            columns={columns}
            isLoading={isLoading}
            isFetching={isFetching}
            loadingText={t('common.loadingData')}
            selectedIds={selectedIds}
            onToggleSelection={toggleSelection}
            onToggleAll={toggleAllSelection}
            page={pagination.page}
            pageSize={pagination.pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            sort={sort}
            onSort={setSort}
            renderCell={renderCell}
            renderMobileCard={renderMobileCard}
            onRowClick={onView}
            keyExtractor={item => item.id}
            onResizeColumn={resizeColumn}
            stickyLeftCount={2}
        />
    );
};

export default EmployeeTable;
