/**
 * Section «Lô thu hoạch» của form phiếu: bảng con CHỈ ĐỌC (lô · tổ trưởng · ghi chú; lô chưa có trong danh mục
 * gắn nhãn «Lô mới») + Lên / Xuống / Xoá + «Lấy hết lô của chi nhánh». Thêm hoặc bấm dòng → `LoDrawer`.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ListPlus, MapPinned } from 'lucide-react';
import GenericSubTableSection from '../../../../../components/shared/GenericSubTableSection';
import SubTable, { type SubTableColumn } from '../../../../../components/shared/sub-table/SubTable';
import Button from '../../../../../components/ui/Button';
import type { DgdvLoFormValues } from '../../core/schema';
import type { VarLoThuHoach } from '../../core/types';
import { khoaTen } from '../../core/chuan-hoa-ten';
import NutDoiCho from './NutDoiCho';

interface Props {
  fields: { id: string }[];
  values: Partial<DgdvLoFormValues>[];
  loTheoTen: ReadonlyMap<string, VarLoThuHoach>;
  coLoi: (i: number) => boolean;
  isEdit: boolean;
  /** Có lô đang dùng của chi nhánh → hiện nút «Lấy hết lô của chi nhánh». */
  onLayHetLo?: () => void;
  onThem: () => void;
  onMo: (i: number) => void;
  onDoiCho: (tu: number, den: number) => void;
  onXoa: (i: number) => void;
}

const LoSection: React.FC<Props> = ({ fields, values, loTheoTen, coLoi, isEdit, onLayHetLo, onThem, onMo, onDoiCho, onXoa }) => {
  const { t } = useTranslation();

  const columns: SubTableColumn[] = [
    { id: 'ten_lo', label: t('danhGiaDauVao.form.lo'), width: 180, minWidth: 120, sticky: true, mobile: 'title' },
    { id: 'to_truong', label: t('danhGiaDauVao.form.toTruong'), width: 180, minWidth: 120 },
    { id: 'ghi_chu', label: t('danhGiaDauVao.form.ghiChuLo'), width: 240, minWidth: 120, mobile: 'full' },
  ];

  const renderCell = (colId: string, _f: { id: string }, i: number) => {
    const l = values[i] ?? {};
    switch (colId) {
      case 'ten_lo': {
        const ten = l.ten_lo?.trim() ?? '';
        const moi = !!ten && !loTheoTen.has(khoaTen(ten));
        return (
          <span className="inline-flex flex-wrap items-center gap-1.5">
            <span className="text-sm font-medium">{ten || '—'}</span>
            {moi && <span className="rounded-md bg-primary/10 px-1.5 text-caption text-primary">{t('danhGiaDauVao.form.taoLo')}</span>}
            {coLoi(i) && <span className="text-caption text-destructive">{t('danhGiaDauVao.form.dongCoLoi')}</span>}
          </span>
        );
      }
      case 'to_truong':
        return <span className="text-sm">{l.to_truong || '—'}</span>;
      case 'ghi_chu':
        return <span className="text-sm text-muted-foreground line-clamp-2">{l.ghi_chu || ''}</span>;
      default:
        return null;
    }
  };

  return (
    <GenericSubTableSection
      title={t('danhGiaDauVao.form.sectionLo')}
      icon={<MapPinned size={14} className="text-primary" />}
      count={fields.length}
      addLabel={t('danhGiaDauVao.form.themLo')}
      onAdd={onThem}
      headerActions={
        onLayHetLo ? (
          <Button type="button" size="sm" variant="outline" onClick={onLayHetLo} className="min-h-[44px] h-8 sm:h-8 px-3 shrink-0">
            <ListPlus size={14} className="mr-1.5" />
            {t('danhGiaDauVao.form.themMoiLo')}
          </Button>
        ) : undefined
      }
      contentMode="raw"
      emptyTitle={t('danhGiaDauVao.form.chuaCoLo')}
      emptyDescription={t('danhGiaDauVao.form.loHint')}
    >
      {fields.length > 0 && (
        <div className="space-y-2">
          <SubTable
            tableKey="danh-gia-dau-vao.form-lo-gon"
            columns={columns}
            rows={fields}
            keyExtractor={(f) => f.id}
            renderCell={renderCell}
            renderActions={(_f, i) => <NutDoiCho i={i} tong={fields.length} onDoiCho={onDoiCho} onXoa={onXoa} />}
            actionsWidth={112}
            onRowClick={(f) => onMo(fields.indexOf(f))}
            onMobileCardClick={(f) => onMo(fields.indexOf(f))}
          />
          {isEdit && <p className="text-caption text-amber-700 dark:text-amber-400 m-0">{t('danhGiaDauVao.form.xoaLoCanhBao')}</p>}
        </div>
      )}
    </GenericSubTableSection>
  );
};

export default LoSection;
