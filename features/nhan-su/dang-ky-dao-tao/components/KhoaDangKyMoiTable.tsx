import React from 'react';
import { useTranslation } from 'react-i18next';
import { BookOpen, UserPlus } from 'lucide-react';
import { getLoaiKhoaHocBadgeClass } from '@/features/nhan-su/khoa-dao-tao/core/constants';
import type { KhoaDaoTao } from '@/features/nhan-su/khoa-dao-tao/core/types';

interface Props {
  data: KhoaDaoTao[];
  isLoading: boolean;
  onDangKy: (khoa: KhoaDaoTao) => void;
}

const KhoaDangKyMoiTable: React.FC<Props> = ({ data, isLoading, onDangKy }) => {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <div className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <p className="text-sm font-medium text-foreground">{t('dangKyDaoTao.emptyKhoaMoDangKy')}</p>
        <p className="text-xs text-muted-foreground mt-1">{t('dangKyDaoTao.emptyKhoaMoDangKyDesc')}</p>
      </div>
    );
  }

  return (
    <div className="overflow-auto flex-1 min-h-0">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-border bg-muted/30 sticky top-0 z-10">
            <th className="px-3 py-2.5 text-xs font-semibold text-muted-foreground whitespace-nowrap">
              {t('dangKyDaoTao.table.maKhoa')}
            </th>
            <th className="px-3 py-2.5 text-xs font-semibold text-muted-foreground whitespace-nowrap">
              {t('dangKyDaoTao.table.tenKhoa')}
            </th>
            <th className="px-3 py-2.5 text-xs font-semibold text-muted-foreground whitespace-nowrap">
              {t('khoaDaoTao.table.loaiKhoaHoc')}
            </th>
            <th className="px-3 py-2.5 text-xs font-semibold text-muted-foreground whitespace-nowrap">
              {t('khoaDaoTao.table.thoiLuong')}
            </th>
            <th className="px-3 py-2.5 text-xs font-semibold text-muted-foreground w-24">
              {t('common.actions')}
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((khoa) => (
            <tr
              key={khoa.id}
              className="border-b border-border hover:bg-muted/20 transition-colors"
            >
              <td className="px-3 py-2.5 text-sm font-mono text-foreground">{khoa.ma}</td>
              <td className="px-3 py-2.5 text-sm font-medium text-foreground">{khoa.ten}</td>
              <td className="px-3 py-2.5">
                <span
                  className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getLoaiKhoaHocBadgeClass(khoa.id_loai_khoa_hoc)}`}
                >
                  {khoa.ten_loai_khoa_hoc ?? '—'}
                </span>
              </td>
              <td className="px-3 py-2.5 text-sm text-muted-foreground">
                {khoa.thoi_luong} {t('khoaDaoTao.gio')}
              </td>
              <td className="px-3 py-2.5">
                <button
                  type="button"
                  onClick={() => onDangKy(khoa)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-primary text-white hover:bg-primary/90 transition-colors"
                >
                  <UserPlus size={14} />
                  {t('dangKyDaoTao.dangKy')}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default KhoaDangKyMoiTable;
