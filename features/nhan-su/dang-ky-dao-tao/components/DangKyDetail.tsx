import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ExternalLink, PlayCircle, Trash2 } from 'lucide-react';
import GenericDrawer, { DRAWER_WIDTH_DETAIL } from '../../../../components/shared/GenericDrawer';
import DetailSection from '../../../../components/shared/DetailSection';
import DetailField from '../../../../components/shared/DetailField';
import Button from '../../../../components/ui/Button';
import { BTN_CLOSE, BTN_DELETE } from '../../../../lib/button-labels';
import { getTrangThaiDangKyLabel, getTrangThaiDangKyBadgeClass, getLoaiDangKyLabel } from '../core/constants';
import type { DangKyThamGia } from '../core/types';

interface Props {
  data: DangKyThamGia;
  onClose: () => void;
  onVaoHoc: (item: DangKyThamGia) => void;
  onHuyDangKy: (id: string) => void;
}

const DangKyDetail: React.FC<Props> = ({ data, onClose, onVaoHoc, onHuyDangKy }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleVaoHoc = () => {
    onClose();
    onVaoHoc(data);
    navigate(`/nhan-su/dang-ky-dao-tao/hoc/${data.id}`);
  };

  const handleXemKhoa = () => {
    onClose();
    navigate('/nhan-su/khoa-dao-tao', { state: { openDetailId: data.id_khoa_hoc } });
  };

  const footer = (
    <div className="flex items-center justify-between w-full flex-wrap gap-2">
      <Button
        variant="ghost"
        onClick={onClose}
        className="text-muted-foreground hover:text-foreground border border-border"
      >
        {BTN_CLOSE()}
      </Button>
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant="secondary"
          onClick={handleXemKhoa}
          className="border border-border"
        >
          <ExternalLink size={16} className="mr-2" /> {t('dangKyDaoTao.xemKhoa')}
        </Button>
        {(data.trang_thai === 1 || data.trang_thai === 2) && (
          <Button
            onClick={handleVaoHoc}
            className="bg-primary text-white shadow-lg hover:bg-primary/90"
          >
            <PlayCircle size={16} className="mr-2" /> {t('dangKyDaoTao.vaoHoc')}
          </Button>
        )}
        {data.trang_thai !== 4 && (
          <Button
            variant="ghost"
            onClick={() => onHuyDangKy(data.id)}
            className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 border border-rose-200 dark:border-rose-800"
          >
            <Trash2 size={16} className="mr-2" /> {t('dangKyDaoTao.huyDangKy')}
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <GenericDrawer
      title={data.ten_khoa_hoc ?? data.ma_khoa_hoc ?? ''}
      icon={<BookOpen size={20} />}
      subtitle={data.ma_khoa_hoc}
      onClose={onClose}
      footer={footer}
      maxWidthClass={DRAWER_WIDTH_DETAIL}
    >
      <div className="space-y-5">
        <div className="bg-card p-4 rounded-xl border border-border/50 shadow-sm flex items-center gap-4">
          <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white shadow-primary/20 shadow-lg shrink-0">
            <BookOpen size={24} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-foreground leading-tight truncate">
              {data.ten_khoa_hoc ?? '—'}
            </h2>
            <p className="text-body-sm text-muted-foreground font-mono mt-0.5">
              {data.ma_khoa_hoc ?? '—'} · {data.ten_nhan_vien ?? '—'}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${getTrangThaiDangKyBadgeClass(data.trang_thai)}`}
              >
                {getTrangThaiDangKyLabel(data.trang_thai, t)}
              </span>
              <span className="text-xs text-muted-foreground">
                {getLoaiDangKyLabel(data.loai_dang_ky, t)}
              </span>
            </div>
          </div>
        </div>

        <DetailSection
          title={t('dangKyDaoTao.detail.tienDo')}
          icon={<BookOpen size={14} />}
          variant="secondary"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DetailField
              label={t('dangKyDaoTao.detail.chuongDaPass')}
              value={
                data.so_chuong_da_pass != null && data.so_chuong_tong != null
                  ? `${data.so_chuong_da_pass}/${data.so_chuong_tong}`
                  : '—'
              }
            />
            <DetailField
              label={t('dangKyDaoTao.detail.baiDaXem')}
              value={
                data.so_bai_da_xem != null && data.so_bai_tong != null
                  ? `${data.so_bai_da_xem}/${data.so_bai_tong}`
                  : '—'
              }
            />
          </div>
        </DetailSection>
      </div>
    </GenericDrawer>
  );
};

export default DangKyDetail;
