import React, { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, History, Info, Printer, Trash2, Wrench } from 'lucide-react';
import GenericDrawer, { DRAWER_WIDTH_DETAIL } from '../../../../components/shared/GenericDrawer';
import DetailSection from '../../../../components/shared/DetailSection';
import Button from '../../../../components/ui/Button';
import { useEmployeesRefQuery } from '../../../../lib/hooks/use-ref-queries';
import { cn, formatYmdToDisplay } from '../../../../lib/utils';
import type { NhatKyBaoDuong, ThietBi, ViecBaoDuong } from '../core/types';
import type { LichBaoDuongRow, NhatKyRow } from '../core/list-types';
import { useTaiSanRef, useThietBiChiTiet } from '../hooks/use-bao-duong-thiet-bi';
import { KetQuaBadge } from './Badges';
import ViecEditor from './ViecEditor';

interface Props {
  id: string;
  onClose: () => void;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  /** Không truyền = ẩn nút Sửa / Xoá (mở từ tab Lịch bảo dưỡng chỉ để xem lịch sử). */
  onEdit?: (tb: ThietBi) => void;
  onDelete?: (tb: ThietBi) => void;
  onGhiNhan: (row: LichBaoDuongRow) => void;
  /** Mở xong cuộn tới mục Nhật ký (xem lịch sử ghi nhận). */
  cuonToiNhatKy?: boolean;
}

/** Mảng rỗng cố định khi chưa có dữ liệu — tránh tham chiếu mới mỗi render. */
const KHONG_CO_VIEC: ViecBaoDuong[] = [];
const KHONG_CO_NHAT_KY: NhatKyBaoDuong[] = [];

const InfoRow: React.FC<{ label: string; value: React.ReactNode; className?: string }> = ({ label, value, className }) => (
  <div className={cn('min-w-0', className)}>
    <p className="text-xs text-muted-foreground">{label}</p>
    <div className="text-sm mt-0.5 break-words">{value}</div>
  </div>
);

const ThietBiDrawer: React.FC<Props> = ({
  id,
  onClose,
  canCreate,
  canUpdate,
  canDelete,
  onEdit,
  onDelete,
  onGhiNhan,
  cuonToiNhatKy = false,
}) => {
  const { t } = useTranslation();
  const { data: chiTiet, isLoading } = useThietBiChiTiet(id);
  const { data: taiSanList = [] } = useTaiSanRef();
  const { data: nhanVienList = [] } = useEmployeesRefQuery();

  const thietBi = chiTiet?.thietBi ?? null;
  const viec = chiTiet?.viec ?? KHONG_CO_VIEC;
  const nhatKy = chiTiet?.nhatKy ?? KHONG_CO_NHAT_KY;

  const taiSan = useMemo(
    () => taiSanList.find((x) => x.id === thietBi?.id_tai_san) ?? null,
    [taiSanList, thietBi?.id_tai_san]
  );

  const nhatKyRows = useMemo<NhatKyRow[]>(() => {
    const viecById = new Map(viec.map((v) => [v.id, v.noi_dung]));
    const nvById = new Map(nhanVienList.map((n) => [n.id, n.ho_ten]));
    return nhatKy.map((n) => ({
      ...n,
      viec_noi_dung: viecById.get(n.id_viec) ?? '—',
      nguoi_thuc_hien_ten: n.id_nguoi_thuc_hien ? (nvById.get(n.id_nguoi_thuc_hien) ?? null) : null,
    }));
  }, [nhatKy, viec, nhanVienList]);

  const nhatKyRef = useRef<HTMLDivElement>(null);
  const daCuon = useRef(false);
  useEffect(() => {
    if (!cuonToiNhatKy || daCuon.current || isLoading || !chiTiet) return;
    daCuon.current = true;
    // Chờ drawer trượt vào xong rồi mới cuộn.
    const id = window.setTimeout(() => nhatKyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 350);
    return () => window.clearTimeout(id);
  }, [cuonToiNhatKy, isLoading, chiTiet]);

  const footer = (
    <div className="flex items-center justify-between w-full gap-3">
      <Button variant="outline" size="sm" onClick={onClose} className="border-border text-muted-foreground">
        {t('common.close')}
      </Button>
      {thietBi && (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              window.open(
                `/quan-ly-nha-so-che/bao-duong-thiet-bi/preview/${thietBi.id}`,
                '_blank',
                'noopener,noreferrer'
              )
            }
          >
            <Printer className="mr-2 h-4 w-4" />
            {t('baoDuongThietBi.hanhDong.inLyLich')}
          </Button>
          {canUpdate && onEdit && (
            <Button size="sm" variant="outline" onClick={() => onEdit(thietBi)}>
              <Edit className="mr-2 h-4 w-4" />
              {t('common.edit')}
            </Button>
          )}
          {canDelete && onDelete && (
            <Button size="sm" variant="outline" onClick={() => onDelete(thietBi)} className="border-destructive/30 text-destructive hover:bg-destructive/10">
              <Trash2 className="mr-2 h-4 w-4" />
              {t('common.delete')}
            </Button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <GenericDrawer
      title={thietBi?.ten ?? t('baoDuongThietBi.thietBi.drawer.title')}
      subtitle={thietBi?.ma_ts ?? undefined}
      icon={<Wrench className="text-primary" size={22} />}
      onClose={onClose}
      maxWidthClass={DRAWER_WIDTH_DETAIL}
      footer={footer}
    >
      <div className="space-y-5 pb-4">
        {isLoading && !thietBi ? (
          <p className="text-sm text-muted-foreground">{t('baoDuongThietBi.loading')}</p>
        ) : thietBi ? (
          <>
            <DetailSection title={t('baoDuongThietBi.thietBi.info')} icon={<Info size={14} className="text-primary" />}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                <InfoRow label={t('baoDuongThietBi.col.soLuong')} value={thietBi.so_luong || '—'} />
                <InfoRow label={t('baoDuongThietBi.col.khuVuc')} value={thietBi.khu_vuc || '—'} />
                <InfoRow
                  label={t('baoDuongThietBi.col.taiSan')}
                  value={taiSan ? `${taiSan.ma_tai_san} — ${taiSan.ten_tai_san}` : '—'}
                />
                <InfoRow label={t('baoDuongThietBi.col.thuTu')} value={thietBi.thu_tu} />
                <div className="sm:col-span-2">
                  <InfoRow label={t('baoDuongThietBi.thietBi.form.ghiChu')} value={thietBi.ghi_chu || '—'} />
                </div>
              </div>
              <span
                className={cn(
                  'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border mt-1',
                  thietBi.dang_dung
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                    : 'bg-muted text-muted-foreground border-border'
                )}
              >
                {thietBi.dang_dung ? t('baoDuongThietBi.thietBi.dangDung') : t('baoDuongThietBi.thietBi.ngungDung')}
              </span>
            </DetailSection>

            <ViecEditor
              idThietBi={thietBi.id}
              thietBi={thietBi}
              viec={viec}
              canCreate={canCreate}
              canUpdate={canUpdate}
              canDelete={canDelete}
              onGhiNhan={onGhiNhan}
            />
          </>
        ) : (
          <p className="text-sm text-muted-foreground">{t('baoDuongThietBi.service.khongTimThayThietBi')}</p>
        )}

        <div ref={nhatKyRef} className="scroll-mt-4">
        <DetailSection title={t('baoDuongThietBi.nhatKy.tieuDe')} icon={<History size={14} className="text-primary" />}>
          {nhatKyRows.length === 0 ? (
            <p className="text-sm text-muted-foreground m-0">{t('baoDuongThietBi.nhatKy.chuaCo')}</p>
          ) : (
            <ul className="m-0 p-0 list-none space-y-3">
              {nhatKyRows.map((n) => (
                <li key={n.id} className="rounded-xl border border-border bg-muted/20 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{n.viec_noi_dung}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 tabular-nums">
                        {formatYmdToDisplay(n.ngay_thuc_hien)}
                        {n.nguoi_thuc_hien_ten ? ` · ${n.nguoi_thuc_hien_ten}` : ''}
                      </p>
                    </div>
                    <KetQuaBadge ketQua={n.ket_qua} />
                  </div>
                  {n.noi_dung && <p className="text-sm mt-1.5 break-words">{n.noi_dung}</p>}
                  {n.hinh_anh.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {n.hinh_anh.map((src, i) => (
                        <img key={i} src={src} alt="" className="h-14 w-14 rounded-lg object-cover border border-border" />
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </DetailSection>
        </div>
      </div>
    </GenericDrawer>
  );
};

export default ThietBiDrawer;
