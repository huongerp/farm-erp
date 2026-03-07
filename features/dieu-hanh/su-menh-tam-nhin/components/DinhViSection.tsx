import React from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Edit } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import type { DinhVi } from '../core/types';

interface Props {
  data: DinhVi | null | undefined;
  onEdit?: () => void;
}

function CellContent({ text }: { text: string | undefined }) {
  const { t } = useTranslation();
  const has = text?.trim();
  return (
    <div className="min-h-[3rem] sm:min-h-[3.5rem] px-2.5 py-2 sm:px-3 sm:py-2.5 text-sm text-foreground whitespace-pre-wrap align-top">
      {has ? text : <span className="text-muted-foreground">{t('suMenhTamNhin.empty')}</span>}
    </div>
  );
}

const DinhViSection: React.FC<Props> = ({ data, onEdit }) => {
  const { t } = useTranslation();
  const d = data ?? {};
  const hasAny =
    d.phan_khuc_hien_tai?.trim() ||
    d.phan_khuc_tuong_lai?.trim() ||
    d.khach_hang_hien_tai?.trim() ||
    d.khach_hang_tuong_lai?.trim() ||
    d.san_pham_hien_tai?.trim() ||
    d.san_pham_tuong_lai?.trim();

  const rows: { rowKey: string; hienTai: string | undefined; tuongLai: string | undefined }[] = [
    { rowKey: 'dinhViPhanKhuc', hienTai: d.phan_khuc_hien_tai, tuongLai: d.phan_khuc_tuong_lai },
    { rowKey: 'khachHang', hienTai: d.khach_hang_hien_tai, tuongLai: d.khach_hang_tuong_lai },
    { rowKey: 'sanPham', hienTai: d.san_pham_hien_tai, tuongLai: d.san_pham_tuong_lai },
  ];

  return (
    <div className="w-full max-h-[36vh] sm:max-h-[40vh] md:max-h-none md:flex-[2] md:min-h-0 min-h-0 bg-card rounded-xl border border-border shadow-sm overflow-hidden flex flex-col">
      <div className="shrink-0 px-3 sm:px-4 pt-2.5 sm:pt-3 pb-1.5 sm:pb-2 border-b border-primary/20 flex items-center justify-between gap-2 bg-card">
        <h4 className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1.5 text-primary font-bold min-w-0 truncate">
          <MapPin size={12} className="shrink-0" />
          <span className="truncate">{t('suMenhTamNhin.dinhVi')}</span>
        </h4>
        {onEdit && (
          <Button size="icon" variant="ghost" onClick={onEdit} className="h-7 w-7 shrink-0 text-primary hover:bg-primary/10" aria-label={t('suMenhTamNhin.edit')} title={t('suMenhTamNhin.edit')}>
            <Edit size={12} />
          </Button>
        )}
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto custom-scrollbar p-3 sm:p-4 md:p-5">
        {!hasAny ? (
          <p className="text-sm text-muted-foreground p-3 rounded-lg border border-dashed border-border">
            {t('suMenhTamNhin.emptyDinhVi')}
          </p>
        ) : (
          <table className="w-full min-w-[260px] border border-border rounded-lg overflow-hidden border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b-2 border-border">
                <th className="w-[14%] min-w-[4rem] sm:min-w-[4rem] py-2.5 px-2 sm:px-2.5 text-[11px] sm:text-xs font-bold text-foreground uppercase tracking-wider text-center border-r border-border">
                  {t('suMenhTamNhin.hangMuc')}
                </th>
                <th className="w-[43%] min-w-[7rem] py-2.5 px-2 sm:px-3 text-[11px] sm:text-xs font-bold text-foreground uppercase tracking-wider text-center border-r border-border last:border-r-0">
                  {t('suMenhTamNhin.hienTai')}
                </th>
                <th className="w-[43%] min-w-[7rem] py-2.5 px-2 sm:px-3 text-[11px] sm:text-xs font-bold text-foreground uppercase tracking-wider text-center">
                  {t('suMenhTamNhin.tuongLai')}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ rowKey, hienTai, tuongLai }, idx) => (
                <tr key={rowKey} className="border-b border-border last:border-b-2">
                  <td className="w-[14%] min-w-[4rem] py-0 align-top border-r border-border bg-muted/30 px-2 py-2 sm:px-2.5 sm:py-2 text-[11px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap text-center">
                    {t(`suMenhTamNhin.${rowKey}`)}
                  </td>
                  <td className="w-[43%] p-0 align-top border-r border-border last:border-r-0">
                    <CellContent text={hienTai} />
                  </td>
                  <td className="w-[43%] p-0 align-top">
                    <CellContent text={tuongLai} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default DinhViSection;
