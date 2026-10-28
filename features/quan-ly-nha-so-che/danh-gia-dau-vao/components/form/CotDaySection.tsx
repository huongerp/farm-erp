/**
 * Section «Cột dây» của form phiếu: bảng con CHỈ ĐỌC (chip màu dây · tuần thu hoạch · chích bắp · xé đôi)
 * + Lên / Xuống / Xoá. Thêm hoặc bấm dòng → `CotDayDrawer` (do form cha mở). Thứ tự dòng = thứ tự cột lưới.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Columns3 } from 'lucide-react';
import GenericSubTableSection from '../../../../../components/shared/GenericSubTableSection';
import SubTable, { type SubTableColumn } from '../../../../../components/shared/sub-table/SubTable';
import type { DgdvCotFormValues } from '../../core/schema';
import type { VarMauDay } from '../../core/types';
import { nhanTuanFarm, tuanChichBapTuThuHoach } from '../../core/tuan';
import { ChipDay } from '../ChipDay';
import NutDoiCho from './NutDoiCho';

interface Props {
  /** `fields` của useFieldArray (khoá React ổn định). */
  fields: { id: string }[];
  /** Giá trị hiện tại cùng thứ tự `fields`. */
  values: Partial<DgdvCotFormValues>[];
  mauTheoId: ReadonlyMap<string, VarMauDay>;
  /** Dòng i có lỗi validate (sau khi bấm Lưu phiếu). */
  coLoi: (i: number) => boolean;
  isEdit: boolean;
  onThem: () => void;
  onMo: (i: number) => void;
  onDoiCho: (tu: number, den: number) => void;
  onXoa: (i: number) => void;
}

const CotDaySection: React.FC<Props> = ({ fields, values, mauTheoId, coLoi, isEdit, onThem, onMo, onDoiCho, onXoa }) => {
  const { t } = useTranslation();

  const columns: SubTableColumn[] = [
    { id: 'day', label: t('danhGiaDauVao.chiTiet.colDay'), width: 200, minWidth: 140, sticky: true, mobile: 'title' },
    { id: 'tuan_th', label: t('danhGiaDauVao.form.tuanThuHoach'), width: 150, minWidth: 110 },
    { id: 'chich_bap', label: t('danhGiaDauVao.form.tuanChichBap'), width: 130, minWidth: 100 },
    { id: 'xe_doi', label: t('danhGiaDauVao.form.xeDoi'), width: 72, minWidth: 64, align: 'center', mobile: 'badge' },
  ];

  const renderCell = (colId: string, _f: { id: string }, i: number) => {
    const c = values[i] ?? {};
    const th = c.th_nam && c.th_tuan ? { nam: Number(c.th_nam), tuan: Number(c.th_tuan) } : null;
    switch (colId) {
      case 'day':
        return (
          <span className="inline-flex items-center gap-1.5">
            <ChipDay cot={{ id_mau_1: c.id_mau_1 ?? '', id_mau_2: c.id_mau_2 ?? null, xe_doi: !!c.xe_doi }} mauTheoId={mauTheoId} />
            {coLoi(i) && <span className="text-caption text-destructive">{t('danhGiaDauVao.form.dongCoLoi')}</span>}
          </span>
        );
      case 'tuan_th':
        return <span className="text-sm tabular-nums">{th ? nhanTuanFarm(th) : '—'}</span>;
      case 'chich_bap':
        return <span className="text-sm tabular-nums text-muted-foreground">{th ? nhanTuanFarm(tuanChichBapTuThuHoach(th)) : '—'}</span>;
      case 'xe_doi':
        return c.xe_doi ? <Check size={14} className="inline text-primary" aria-label={t('danhGiaDauVao.form.xeDoi')} /> : null;
      default:
        return null;
    }
  };

  return (
    <GenericSubTableSection
      title={t('danhGiaDauVao.form.sectionCot')}
      icon={<Columns3 size={14} className="text-primary" />}
      count={fields.length}
      addLabel={t('danhGiaDauVao.form.themCot')}
      onAdd={onThem}
      contentMode="raw"
      emptyTitle={t('danhGiaDauVao.form.chuaCoCot')}
      emptyDescription={t('danhGiaDauVao.form.cotHint')}
    >
      {fields.length > 0 && (
        <div className="space-y-2">
          <SubTable
            tableKey="danh-gia-dau-vao.form-cot-gon"
            columns={columns}
            rows={fields}
            keyExtractor={(f) => f.id}
            renderCell={renderCell}
            renderActions={(_f, i) => <NutDoiCho i={i} tong={fields.length} onDoiCho={onDoiCho} onXoa={onXoa} />}
            actionsWidth={112}
            onRowClick={(f) => onMo(fields.indexOf(f))}
            onMobileCardClick={(f) => onMo(fields.indexOf(f))}
          />
          <p className="text-caption text-muted-foreground m-0">{t('danhGiaDauVao.form.cotHintGon')}</p>
          {isEdit && <p className="text-caption text-amber-700 dark:text-amber-400 m-0">{t('danhGiaDauVao.form.xoaCotCanhBao')}</p>}
        </div>
      )}
    </GenericSubTableSection>
  );
};

export default CotDaySection;
