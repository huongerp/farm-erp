import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Wallet, FileText, Link2, ExternalLink, Lock, Unlock, XCircle } from 'lucide-react';
import GenericDrawer, { DRAWER_WIDTH_DETAIL } from '../../../../components/shared/GenericDrawer';
import DetailSection from '../../../../components/shared/DetailSection';
import DetailField from '../../../../components/shared/DetailField';
import DetailDrawerFooter from '../../../../components/shared/DetailDrawerFooter';
import DetailToolbar, { type DetailToolbarAction } from '../../../../components/shared/DetailToolbar';
import { formatDate, formatDateTimeShort, formatNumberVN } from '../../../../lib/utils';
import {
  NGUON_CHUNG_TU_PATH,
  getLoaiBadgeClass,
  loaiThuChiToI18nKey,
  nguonChungTuToI18nKey,
} from '../core/constants';
import {
  getTrangThaiQuyBadgeClass,
  trangThaiQuyToI18nKey,
} from '../core/trang-thai';
import { TRANG_THAI_THU_CHI_QUY } from '../core/types';
import type { ThuChiQuy, ThuChiQuyRow } from '../core/types';

/** Dòng từ view có sẵn tồn quỹ; mở từ section liên quan thì chỉ có phiếu gốc. */
type ThuChiQuyDetailData = ThuChiQuy & Partial<Pick<ThuChiQuyRow, 'ton_quy' | 'ref_ten_chi_nhanh' | 'ref_ten_hang_muc' | 'ref_ten_nguoi_tao'>>;

interface Props {
  data: ThuChiQuyDetailData;
  onClose: () => void;
  onEdit?: (item: ThuChiQuyDetailData) => void;
  onDelete?: (item: ThuChiQuyDetailData) => void;
  /** Hành động trạng thái — để trống thì nút tương ứng không hiện. */
  onKhoa?: (item: ThuChiQuyDetailData) => void;
  onXinMo?: (item: ThuChiQuyDetailData) => void;
  onDuyetMo?: (item: ThuChiQuyDetailData) => void;
  onTuChoiMo?: (item: ThuChiQuyDetailData) => void;
  trangThaiPending?: boolean;
  /** >0 khi mở chồng lên drawer khác (section trong drawer chứng từ) */
  stackLevel?: number;
}

const ThuChiQuyDetail: React.FC<Props> = ({
  data,
  onClose,
  onEdit,
  onDelete,
  onKhoa,
  onXinMo,
  onDuyetMo,
  onTuChoiMo,
  trangThaiPending = false,
  stackLevel = 0,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const money = (v: number | null | undefined) =>
    v == null ? '—' : formatNumberVN(v, { maxFractionDigits: 0 });

  const toolbarActions = React.useMemo<DetailToolbarAction[]>(() => {
    const list: DetailToolbarAction[] = [];
    if (onKhoa) {
      list.push({
        label: t('thuChiQuy.detail.toolbar.khoa'),
        icon: <Lock size={16} />,
        variant: 'warning',
        disabled: trangThaiPending,
        onClick: () => onKhoa(data),
      });
    }
    if (onXinMo) {
      list.push({
        label: t('thuChiQuy.detail.toolbar.xinMo'),
        icon: <Unlock size={16} />,
        variant: 'outline',
        disabled: trangThaiPending,
        onClick: () => onXinMo(data),
      });
    }
    if (onDuyetMo) {
      list.push({
        label: t('thuChiQuy.detail.toolbar.duyetMo'),
        icon: <Unlock size={16} />,
        variant: 'success',
        disabled: trangThaiPending,
        onClick: () => onDuyetMo(data),
      });
    }
    if (onTuChoiMo) {
      list.push({
        label: t('thuChiQuy.detail.toolbar.tuChoiMo'),
        icon: <XCircle size={16} />,
        variant: 'danger',
        disabled: trangThaiPending,
        onClick: () => onTuChoiMo(data),
      });
    }
    return list;
  }, [data, onKhoa, onXinMo, onDuyetMo, onTuChoiMo, trangThaiPending, t]);

  return (
    <GenericDrawer
      title={data.so_phieu}
      icon={<Wallet size={20} />}
      onClose={onClose}
      footer={
        <DetailDrawerFooter
          onClose={onClose}
          onEdit={
            onEdit
              ? () => {
                  onEdit(data);
                  onClose();
                }
              : undefined
          }
          onDelete={onDelete ? () => onDelete(data) : undefined}
        />
      }
      maxWidthClass={DRAWER_WIDTH_DETAIL}
      stackLevel={stackLevel}
    >
      <div className="space-y-5">
        <div className="bg-card p-4 rounded-xl border border-border/50 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-base font-bold text-foreground leading-tight">{data.dien_giai}</h2>
              <p className="text-body-sm text-muted-foreground font-mono mt-0.5">
                {data.so_phieu} · {formatDate(data.ngay)}
              </p>
              <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getLoaiBadgeClass(data.loai)}`}
                >
                  {t(loaiThuChiToI18nKey(data.loai))}
                </span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getTrangThaiQuyBadgeClass(data.trang_thai)}`}
                >
                  {t(trangThaiQuyToI18nKey(data.trang_thai))}
                </span>
                <span className="text-xs text-muted-foreground">
                  {data.ref_ten_chi_nhanh || data.ten_chi_nhanh || '—'}
                </span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p
                className={`text-lg font-bold tabular-nums ${data.loai === 'thu' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}
              >
                {data.loai === 'thu' ? '+' : '−'}
                {money(data.so_tien)}
              </p>
              {data.ton_quy != null && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t('thuChiQuy.store.tonQuyCol')}:{' '}
                  <span className="font-semibold tabular-nums">{money(data.ton_quy)}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {toolbarActions.length > 0 && (
          <DetailToolbar
            actions={toolbarActions}
            className="bg-card rounded-xl border border-border"
          />
        )}

        {data.trang_thai === TRANG_THAI_THU_CHI_QUY.CHO_MO && (
          <DetailSection
            title={t('thuChiQuy.detail.yeuCauSection')}
            icon={<Unlock size={14} />}
            variant="secondary"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DetailField
                label={t('thuChiQuy.detail.nguoiYeuCauMo')}
                value={data.ten_nguoi_yeu_cau_mo}
              />
              <DetailField
                label={t('thuChiQuy.detail.tgYeuCauMo')}
                value={data.tg_yeu_cau_mo ? formatDateTimeShort(data.tg_yeu_cau_mo) : undefined}
              />
              <div className="col-span-1 sm:col-span-2">
                <DetailField
                  label={t('thuChiQuy.detail.lyDoYeuCauMo')}
                  value={data.ly_do_yeu_cau_mo}
                />
              </div>
            </div>
          </DetailSection>
        )}

        <DetailSection title={t('thuChiQuy.form.basicInfo')} icon={<FileText size={14} />} variant="primary">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DetailField label={t('thuChiQuy.form.ngay')} value={formatDate(data.ngay)} />
            <DetailField label={t('thuChiQuy.form.loai')} value={t(loaiThuChiToI18nKey(data.loai))} />
            <DetailField
              label={t('thuChiQuy.form.chiNhanh')}
              value={data.ref_ten_chi_nhanh || data.ten_chi_nhanh}
            />
            <DetailField
              label={t('thuChiQuy.form.hangMuc')}
              value={data.ref_ten_hang_muc || data.ten_hang_muc}
            />
            <DetailField label={t('thuChiQuy.form.soTien')} value={money(data.so_tien)} />
            {data.ton_quy != null && (
              <DetailField label={t('thuChiQuy.store.tonQuyCol')} value={money(data.ton_quy)} />
            )}
            <div className="col-span-1 sm:col-span-2">
              <DetailField label={t('thuChiQuy.form.dienGiai')} value={data.dien_giai} />
            </div>
            {data.ghi_chu ? (
              <div className="col-span-1 sm:col-span-2">
                <DetailField label={t('thuChiQuy.form.ghiChu')} value={data.ghi_chu} />
              </div>
            ) : null}
          </div>
        </DetailSection>

        {data.loai_chung_tu ? (
          <DetailSection title={t('thuChiQuy.form.chungTuSection')} icon={<Link2 size={14} />} variant="secondary">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DetailField label={t('thuChiQuy.store.nguonCol')} value={t(nguonChungTuToI18nKey(data.loai_chung_tu))} />
              <DetailField
                label={t('thuChiQuy.store.soChungTuCol')}
                value={
                  <button
                    type="button"
                    onClick={() => navigate(NGUON_CHUNG_TU_PATH[data.loai_chung_tu!])}
                    className="inline-flex items-center gap-1.5 text-primary hover:underline"
                  >
                    {data.so_chung_tu || t('thuChiQuy.detail.openSource')}
                    <ExternalLink size={13} />
                  </button>
                }
              />
            </div>
          </DetailSection>
        ) : null}

        <DetailSection title={t('thuChiQuy.detail.systemInfo')} icon={<FileText size={14} />} variant="muted">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DetailField label={t('thuChiQuy.detail.createdBy')} value={data.ref_ten_nguoi_tao || data.ten_nguoi_tao} />
            <DetailField label={t('thuChiQuy.detail.createdAt')} value={formatDateTimeShort(data.tg_tao)} />
            <DetailField label={t('thuChiQuy.store.updatedCol')} value={formatDateTimeShort(data.tg_cap_nhat)} />
            {data.ten_nguoi_xu_ly_mo ? (
              <>
                <DetailField
                  label={t('thuChiQuy.detail.nguoiXuLyMo')}
                  value={data.ten_nguoi_xu_ly_mo}
                />
                <DetailField
                  label={t('thuChiQuy.detail.tgXuLyMo')}
                  value={data.tg_xu_ly_mo ? formatDateTimeShort(data.tg_xu_ly_mo) : undefined}
                />
              </>
            ) : null}
          </div>
        </DetailSection>
      </div>
    </GenericDrawer>
  );
};

export default ThuChiQuyDetail;
