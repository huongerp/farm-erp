import React from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2, Target, User, Building2, Briefcase, Scale, Calendar, Clock } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import GenericDrawer, { DRAWER_WIDTH_DETAIL } from '../../../../components/shared/GenericDrawer';
import DetailSection from '../../../../components/shared/DetailSection';
import DetailField from '../../../../components/shared/DetailField';
import DetailFieldGrid from '../../../../components/shared/DetailFieldGrid';
import { BTN_CLOSE, BTN_EDIT, BTN_DELETE } from '../../../../lib/button-labels';
import { getDanhGiaKpiLabel, getKpiLoaiLabel, NGUONG_DAT_KPI } from '../core/constants';
import { formatDateTimeShort } from '../../../../lib/utils';
import type { ChamDiemKpiRecord } from '../core/types';

interface Props {
  data: ChamDiemKpiRecord;
  onClose: () => void;
  onEdit: (item: ChamDiemKpiRecord) => void;
  onDelete: (id: string) => void;
}

const ChamDiemKpiDetail: React.FC<Props> = ({ data, onClose, onEdit, onDelete }) => {
  const { t } = useTranslation();
  const periodStr = `${data.nam}-${String(data.thang).padStart(2, '0')}`;

  const renderFooter = (
    <div className="flex items-center justify-between w-full">
      <Button
        variant="ghost"
        onClick={onClose}
        className="text-muted-foreground hover:text-foreground border border-border"
      >
        {BTN_CLOSE()}
      </Button>
      <div className="flex items-center gap-3">
        <Button
          onClick={() => {
            onEdit(data);
            onClose();
          }}
          className="bg-primary text-white shadow-lg hover:bg-primary/90"
        >
          <Edit size={16} className="mr-2" /> {BTN_EDIT()}
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            onDelete(data.id);
            onClose();
          }}
          className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/50 dark:text-rose-400 border border-rose-200 hover:border-rose-300 dark:border-rose-800 dark:hover:border-rose-700"
        >
          <Trash2 size={16} className="mr-2" /> {BTN_DELETE()}
        </Button>
      </div>
    </div>
  );

  return (
    <GenericDrawer
      title={t('chamDiemKpi.detail.title')}
      subtitle={`${data.ten_nhan_vien || data.ma_nhan_vien || ''} · ${periodStr}`}
      icon={<Target size={18} />}
      onClose={onClose}
      footer={renderFooter}
      maxWidthClass={DRAWER_WIDTH_DETAIL}
    >
      <div className="space-y-5">
        <DetailSection
          title={t('chamDiemKpi.detail.basicInfo')}
          icon={<User size={14} />}
          variant="primary"
        >
          <DetailFieldGrid>
            <DetailField
              label={t('chamDiemKpi.store.employeeCol')}
              value={data.ten_nhan_vien ? `${data.ten_nhan_vien}${data.ma_nhan_vien ? ` (${data.ma_nhan_vien})` : ''}` : data.ma_nhan_vien}
              icon={<User size={12} />}
              emptyText="—"
            />
            <DetailField
              label={t('chamDiemKpi.store.periodCol')}
              value={periodStr}
              icon={<Calendar size={12} />}
            />
            <DetailField
              label={t('chamDiemKpi.store.departmentCol')}
              value={data.ten_phong_ban}
              icon={<Building2 size={12} />}
              emptyText="—"
            />
            <DetailField
              label={t('chamDiemKpi.store.positionCol')}
              value={data.ten_chuc_vu}
              icon={<Briefcase size={12} />}
              emptyText="—"
            />
            <DetailField
              label={t('chamDiemKpi.diemKpi')}
              value={data.diem_kpi.toFixed(1)}
              icon={<Target size={12} />}
            />
            <DetailField
              label={t('chamDiemKpi.diemCongTru')}
              value={`${data.diem_cong_tru_net >= 0 ? '+' : ''}${data.diem_cong_tru_net}`}
              icon={<Scale size={12} />}
            />
            <DetailField
              label={t('chamDiemKpi.tongKpi')}
              value={data.tong_kpi.toFixed(1)}
              icon={<Target size={12} />}
            />
            <DetailField
              label={t('chamDiemKpi.store.danhGiaCol')}
              value={getDanhGiaKpiLabel(data.danh_gia, t)}
              icon={<Target size={12} />}
            />
            <DetailField
              label={t('chamDiemKpi.nguongDat', { point: NGUONG_DAT_KPI })}
              value={`≥ ${NGUONG_DAT_KPI}`}
              icon={<Target size={12} />}
            />
          </DetailFieldGrid>
        </DetailSection>

        {data.chi_tiet && data.chi_tiet.length > 0 && (
          <DetailSection
            title={t('chamDiemKpi.kpiSection')}
            icon={<Target size={14} />}
            variant="primary"
          >
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="text-left p-2 font-medium">{t('chamDiemKpi.chiSo')}</th>
                    <th className="text-right p-2 font-medium w-20">{t('chamDiemKpi.tyTrong')}</th>
                    <th className="text-left p-2 font-medium w-20">{t('chamDiemKpi.loai')}</th>
                    <th className="text-right p-2 font-medium w-20">{t('chamDiemKpi.mucTieu')}</th>
                    <th className="text-right p-2 font-medium w-20">{t('chamDiemKpi.thucDat')}</th>
                    <th className="text-right p-2 font-medium w-20">{t('chamDiemKpi.tyLe')}</th>
                    <th className="text-right p-2 font-medium w-20">{t('chamDiemKpi.diem')}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.chi_tiet.map((ct) => (
                    <tr key={ct.id} className="border-b border-border/50">
                      <td className="p-2">{ct.ten_chi_so || ct.id_chi_so}</td>
                      <td className="p-2 text-right tabular-nums">{ct.ty_trong}%</td>
                      <td className="p-2">{ct.loai ? getKpiLoaiLabel(ct.loai, t) : '—'}</td>
                      <td className="p-2 text-right tabular-nums">{ct.muc_tieu ?? '—'}</td>
                      <td className="p-2 text-right tabular-nums">{ct.thuc_dat ?? '—'}</td>
                      <td className="p-2 text-right tabular-nums">{ct.ty_le != null ? `${ct.ty_le}%` : '—'}</td>
                      <td className="p-2 text-right font-medium tabular-nums">{ct.diem}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DetailSection>
        )}

        {data.diem_cong_tru_list && data.diem_cong_tru_list.length > 0 && (
          <DetailSection
            title={t('chamDiemKpi.diemCongTruSection')}
            icon={<Scale size={14} />}
            variant="primary"
          >
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="text-left p-2 font-medium">{t('chamDiemKpi.hangMuc')}</th>
                    <th className="text-left p-2 font-medium w-24">{t('chamDiemKpi.loai')}</th>
                    <th className="text-right p-2 font-medium w-20">{t('chamDiemKpi.diem')}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.diem_cong_tru_list.map((d) => (
                    <tr key={d.id} className="border-b border-border/50">
                      <td className="p-2">{d.ten_hang_muc || d.ma_hang_muc || '—'}</td>
                      <td className="p-2">
                        <span
                          className={
                            d.loai === 'cong'
                              ? 'text-emerald-600 font-medium'
                              : 'text-rose-600 font-medium'
                          }
                        >
                          {d.loai === 'cong' ? t('chamDiemKpi.cong') : t('chamDiemKpi.tru')}
                        </span>
                      </td>
                      <td className="p-2 text-right tabular-nums">
                        {d.loai === 'cong' ? '+' : '-'}{d.diem}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DetailSection>
        )}

        <DetailSection
          title={t('chamDiemKpi.detail.systemInfo')}
          icon={<Clock size={14} />}
          variant="primary"
        >
          <DetailFieldGrid>
            <DetailField
              label={t('chamDiemKpi.detail.createdAt')}
              value={formatDateTimeShort(data.tg_tao)}
              icon={<Calendar size={12} />}
            />
            <DetailField
              label={t('chamDiemKpi.detail.updatedAt')}
              value={formatDateTimeShort(data.tg_cap_nhat)}
              icon={<Calendar size={12} />}
            />
          </DetailFieldGrid>
        </DetailSection>
      </div>
    </GenericDrawer>
  );
};

export default ChamDiemKpiDetail;
