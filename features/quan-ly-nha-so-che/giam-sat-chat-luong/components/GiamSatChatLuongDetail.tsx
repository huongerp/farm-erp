import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import {
  BadgeCheck,
  Ban,
  Boxes,
  Building2,
  Calendar,
  FileText,
  Hash,
  ListChecks,
  Package,
  FileText as FileTextIcon,
  LockOpen,
  RefreshCw,
  RotateCcw,
  ScanLine,
  Send,
  Tag,
  User,
} from 'lucide-react';
import GenericDrawer, { DRAWER_WIDTH_DETAIL } from '../../../../components/shared/GenericDrawer';
import DetailToolbar, { type DetailToolbarAction } from '../../../../components/shared/DetailToolbar';
import DetailSection from '../../../../components/shared/DetailSection';
import DetailField from '../../../../components/shared/DetailField';
import DetailFieldGrid from '../../../../components/shared/DetailFieldGrid';
import DetailDrawerFooter from '../../../../components/shared/DetailDrawerFooter';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { formatDateTimeShort, formatYmdToDisplay } from '../../../../lib/utils';
import { ketLuanPhieu } from '../core/ket-luan';
import {
  coTheHuy,
  coTheKhoiPhuc,
  coTheKiemThung,
  coTheMoPhieu,
  coTheNop,
  coTheSuaPhieu,
  coTheXoaPhieu,
} from '../core/trang-thai';
import { taoUrlInPhieu } from '../core/preview-url';
import type { GiamSatChatLuong, ThungMau } from '../core/types';
import { useHanhDongGiamSatChatLuong, useThungMau, type HanhDongPhieu } from '../hooks/use-giam-sat-chat-luong';
import { useGiamSatChatLuongCapCao } from '../hooks/use-giam-sat-chat-luong-view-scope';
import { KetLuanBadge, TrangThaiBadge } from './Badges';
import BangKetQuaThung from './BangKetQuaThung';
import InTemDialog from './InTemDialog';
import NhapKetQuaThungDialog from './NhapKetQuaThungDialog';
import QuetTemFlow from './QuetTemFlow';
import ApDungTieuChiDialog from './ApDungTieuChiDialog';

interface Props {
  data: GiamSatChatLuong;
  viewAll: boolean;
  allowedBranchIds: string[];
  onClose: () => void;
  onEdit?: (item: GiamSatChatLuong) => void;
  onDelete?: (id: string) => void;
  onOpenSettings: () => void;
  canUpdate?: boolean;
  canDelete?: boolean;
  /** Vừa tạo xong → mở luôn hộp in tem. */
  moInTem?: boolean;
}

const GiamSatChatLuongDetail: React.FC<Props> = ({
  data,
  viewAll,
  allowedBranchIds,
  onClose,
  onEdit,
  onDelete,
  onOpenSettings,
  canUpdate = true,
  canDelete = true,
  moInTem = false,
}) => {
  const { t } = useTranslation();
  const confirm = useConfirmStore((s) => s.confirm);
  const capCao = useGiamSatChatLuongCapCao();
  const hanhDong = useHanhDongGiamSatChatLuong();
  const { data: thung = [], isLoading: thungLoading } = useThungMau(data.id);

  const [dialog, setDialog] = useState<null | 'in' | 'quet' | 'apDung'>(moInTem ? 'in' : null);
  const [nhapThung, setNhapThung] = useState<ThungMau | null>(null);

  const tt = data.trang_thai;
  const canKiem = canUpdate && coTheKiemThung(tt, capCao);
  const canEditPhieu = canUpdate && coTheSuaPhieu(tt, capCao);
  const canDeletePhieu = canDelete && coTheXoaPhieu(tt, data.so_thung_da_kiem, capCao);

  const daKiem = thung.filter((x) => x.da_kiem);
  const tamTinh = useMemo(
    () => (tt === 'dang_kiem' && daKiem.length > 0 ? ketLuanPhieu(data.tieu_chi, daKiem.map((x) => x.ket_qua), data.so_thung_mau).ketLuan : null),
    [tt, daKiem, data.tieu_chi, data.so_thung_mau]
  );

  const hoi = (action: HanhDongPhieu, variant: 'warning' | 'danger' = 'warning') =>
    confirm({
      title: t(`giamSatChatLuong.confirm.${action}Title`),
      message: t(`giamSatChatLuong.confirm.${action}Message`),
      variant,
      confirmText: t(`giamSatChatLuong.toolbar.${action}`),
      onConfirm: async () => {
        await hanhDong.mutateAsync({ action, id: data.id });
      },
    });

  const toolbarActions: DetailToolbarAction[] = useMemo(() => {
    // In phiếu: ai xem được phiếu cũng in được.
    const a: DetailToolbarAction[] = [
      {
        label: t('giamSatChatLuong.toolbar.inPhieu'),
        icon: <FileTextIcon />,
        onClick: () => window.open(taoUrlInPhieu(data.id), '_blank', 'noopener,noreferrer'),
        variant: 'outline',
      },
    ];
    if (tt !== 'huy') {
      a.push({ label: t('giamSatChatLuong.toolbar.inTem'), icon: <Tag />, onClick: () => setDialog('in'), variant: 'outline' });
    }
    if (canKiem) {
      a.push({ label: t('giamSatChatLuong.toolbar.quetTem'), icon: <ScanLine />, onClick: () => setDialog('quet'), variant: 'primary' });
    }
    if (!canUpdate) return a;
    if (coTheNop(tt)) {
      a.push({ label: t('giamSatChatLuong.toolbar.nop'), icon: <Send />, onClick: () => hoi('nop'), variant: 'success' });
    }
    if (coTheMoPhieu(tt, capCao)) {
      a.push({ label: t('giamSatChatLuong.toolbar.moPhieu'), icon: <LockOpen />, onClick: () => hoi('moPhieu'), variant: 'warning' });
    }
    if (coTheHuy(tt)) {
      a.push({ label: t('giamSatChatLuong.toolbar.huy'), icon: <Ban />, onClick: () => hoi('huy', 'danger'), variant: 'danger' });
    }
    if (coTheKhoiPhuc(tt)) {
      a.push({ label: t('giamSatChatLuong.toolbar.khoiPhuc'), icon: <RotateCcw />, onClick: () => hoi('khoiPhuc'), variant: 'warning' });
    }
    if (capCao && tt !== 'huy') {
      a.push({
        label: t('giamSatChatLuong.toolbar.apDungTieuChi'),
        icon: <RefreshCw />,
        onClick: () => setDialog('apDung'),
        variant: 'secondary',
      });
    }
    return a;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tt, canKiem, canUpdate, capCao, t, data.id]);

  return (
    <>
      <GenericDrawer
        title={t('giamSatChatLuong.detail.title')}
        subtitle={data.so_phieu}
        icon={<BadgeCheck className="text-primary" size={22} />}
        onClose={onClose}
        maxWidthClass={DRAWER_WIDTH_DETAIL}
        footer={
          <DetailDrawerFooter
            onClose={onClose}
            canUpdate={canEditPhieu}
            canDelete={canDeletePhieu}
            onEdit={onEdit && canEditPhieu ? () => onEdit(data) : undefined}
            onDelete={onDelete && canDeletePhieu ? () => onDelete(data.id) : undefined}
          />
        }
      >
        <div className="space-y-5">
          <div className="bg-card p-4 rounded-xl border border-border/50 shadow-sm flex items-center gap-4">
            <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex flex-col items-center justify-center text-white shadow-primary/20 shadow-lg shrink-0 tabular-nums">
              <span className="text-lg font-bold leading-none">{data.so_thung_da_kiem}</span>
              <span className="text-[10px] opacity-80 leading-none mt-1">/ {data.so_thung_mau}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold text-foreground leading-tight truncate">{data.ten_hang_hoa || '—'}</h2>
              <p className="text-body-sm text-muted-foreground mt-0.5 line-clamp-1 font-mono">
                {[data.so_phieu, data.ma_cay_hang].filter(Boolean).join(' · ')}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <TrangThaiBadge value={tt} />
                {data.ket_luan ? <KetLuanBadge value={data.ket_luan} /> : tamTinh && <KetLuanBadge value={tamTinh} tamTinh />}
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border tabular-nums">
                  {formatYmdToDisplay(data.ngay)}
                </span>
              </div>
            </div>
          </div>

          {toolbarActions.length > 0 && (
            <DetailToolbar actions={toolbarActions} className="bg-card rounded-xl border border-border" />
          )}

          <DetailSection
            title={t('giamSatChatLuong.detail.ketQua', { da: daKiem.length, n: data.so_thung_mau })}
            icon={<ListChecks size={14} />}
            variant="primary"
          >
            {thungLoading ? (
              <p className="text-sm text-muted-foreground m-0">{t('giamSatChatLuong.loading')}</p>
            ) : (
              <>
                <BangKetQuaThung
                  tieuChi={data.tieu_chi}
                  thung={thung}
                  soThungMau={data.so_thung_mau}
                  onChonThung={canKiem ? setNhapThung : undefined}
                />
                <p className="text-xs text-muted-foreground mt-2 mb-0">
                  {t(canKiem ? 'giamSatChatLuong.detail.ketQuaHint' : 'giamSatChatLuong.detail.ketQuaHintXem')}
                </p>
              </>
            )}
          </DetailSection>

          <DetailSection title={t('giamSatChatLuong.detail.thongTin')} icon={<FileText size={14} />} variant="secondary">
            <DetailFieldGrid>
              <DetailField label={t('giamSatChatLuong.col.soPhieu')} value={data.so_phieu} icon={<Hash size={12} />} />
              <DetailField label={t('giamSatChatLuong.col.ngay')} value={formatYmdToDisplay(data.ngay)} icon={<Calendar size={12} />} />
              <DetailField label={t('giamSatChatLuong.col.farm')} value={data.ten_chi_nhanh ?? ''} emptyText="—" icon={<Building2 size={12} />} />
              <DetailField
                label={t('giamSatChatLuong.col.thanhPham')}
                value={[data.ma_hang_hoa, data.ten_hang_hoa].filter(Boolean).join(' - ')}
                emptyText="—"
                icon={<Package size={12} />}
              />
              <DetailField label={t('giamSatChatLuong.col.cayHang')} value={data.ma_cay_hang ?? ''} emptyText="—" icon={<Hash size={12} />} />
              <DetailField
                label={t('giamSatChatLuong.detail.mauTrenCay')}
                value={t('giamSatChatLuong.detail.mauTrenCayValue', { mau: data.so_thung_mau, cay: data.so_thung_cay })}
                icon={<Boxes size={12} />}
              />
              <DetailField
                label={t('giamSatChatLuong.col.ghiChu')}
                value={data.ghi_chu ?? ''}
                emptyText="—"
                icon={<FileText size={12} />}
                className="col-span-1 sm:col-span-2 lg:col-span-3 whitespace-pre-line"
              />
            </DetailFieldGrid>
          </DetailSection>

          {daKiem.length > 0 && (
            <DetailSection title={t('giamSatChatLuong.detail.nguoiKiem')} icon={<User size={14} />} variant="muted">
              <ul className="m-0 p-0 list-none space-y-1 text-sm">
                {daKiem.map((x) => (
                  <li key={x.id} className="flex flex-wrap items-baseline gap-x-2">
                    <span className="font-medium tabular-nums">{t('giamSatChatLuong.quet.thungSo', { stt: x.stt_thung, n: data.so_thung_mau })}</span>
                    <span className="text-muted-foreground">
                      {[x.ten_nguoi_kiem, x.tg_kiem ? formatDateTimeShort(x.tg_kiem) : null].filter(Boolean).join(' · ')}
                    </span>
                    {x.ghi_chu && <span className="text-muted-foreground italic">— {x.ghi_chu}</span>}
                  </li>
                ))}
              </ul>
            </DetailSection>
          )}

          <DetailSection title={t('giamSatChatLuong.detail.systemInfo')} icon={<Calendar size={14} />} variant="muted">
            <DetailFieldGrid>
              <DetailField label={t('giamSatChatLuong.col.nguoiTao')} value={data.ten_nguoi_tao ?? ''} emptyText="—" icon={<User size={12} />} />
              <DetailField label={t('giamSatChatLuong.detail.tgTao')} value={formatDateTimeShort(data.tg_tao)} icon={<Calendar size={12} />} />
              <DetailField label={t('giamSatChatLuong.detail.tgCapNhat')} value={formatDateTimeShort(data.tg_cap_nhat)} icon={<Calendar size={12} />} />
              {data.tg_nop && (
                <>
                  <DetailField label={t('giamSatChatLuong.detail.nguoiNop')} value={data.ten_nguoi_nop ?? ''} emptyText="—" icon={<Send size={12} />} />
                  <DetailField label={t('giamSatChatLuong.detail.tgNop')} value={formatDateTimeShort(data.tg_nop)} icon={<Calendar size={12} />} />
                </>
              )}
            </DetailFieldGrid>
          </DetailSection>
        </div>
      </GenericDrawer>

      <AnimatePresence>
        {dialog === 'in' && thung.length > 0 && (
          <InTemDialog
            phieu={data}
            thung={thung}
            onClose={() => setDialog(null)}
            onOpenSettings={() => {
              setDialog(null);
              onOpenSettings();
            }}
          />
        )}
        {dialog === 'apDung' && <ApDungTieuChiDialog phieu={data} thung={thung} onClose={() => setDialog(null)} />}
        {dialog === 'quet' && (
          <QuetTemFlow
            viewAll={viewAll}
            allowedBranchIds={allowedBranchIds}
            capCao={capCao}
            phieu={data}
            thungCuaPhieu={thung}
            onClose={() => setDialog(null)}
          />
        )}
        {nhapThung && <NhapKetQuaThungDialog phieu={data} thung={nhapThung} onClose={() => setNhapThung(null)} />}
      </AnimatePresence>
    </>
  );
};

export default GiamSatChatLuongDetail;
