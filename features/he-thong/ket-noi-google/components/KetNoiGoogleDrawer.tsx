import React from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarClock, ExternalLink, Link2, Link2Off, Loader2, Mail, Pause, Play, Trash2, UserRound } from 'lucide-react';
import GenericDrawer, { DRAWER_WIDTH_DETAIL } from '../../../../components/shared/GenericDrawer';
import DetailSection from '../../../../components/shared/DetailSection';
import DetailField from '../../../../components/shared/DetailField';
import DetailFieldGrid from '../../../../components/shared/DetailFieldGrid';
import Button from '../../../../components/ui/Button';
import { formatDateTimeShort } from '../../../../lib/utils';
import { getAllPermissionModules } from '../../phan-quyen/core/permission-modules-config';
import { moTaTanSuat } from '../../../../components/shared/export-dialog/tan-suat';
import { tinhTrangKetNoi, tinhTrangLich } from '../core/trang-thai';
import type { KetNoiGoogle, LichDongBoQt } from '../core/types';
import { useLichDongBoCuaNhanVien } from '../hooks/use-ket-noi-google';
import TinhTrangBadge from './TinhTrangBadge';

interface Props {
  data: KetNoiGoogle;
  onClose: () => void;
  canUpdate: boolean;
  canDelete: boolean;
  onToggleLich: (lich: LichDongBoQt) => void;
  onXoaLich: (lich: LichDongBoQt) => void;
  onNgatKetNoi: (item: KetNoiGoogle) => void;
}

const TEN_MODULE = new Map(getAllPermissionModules().map((m) => [m.id, m.nameKey]));

const KetNoiGoogleDrawer: React.FC<Props> = ({ data, onClose, canUpdate, canDelete, onToggleLich, onXoaLich, onNgatKetNoi }) => {
  const { t } = useTranslation();
  const { data: dsLich = [], isLoading } = useLichDongBoCuaNhanVien(data.nhan_vien_id);

  const footer = (
    <div className="flex items-center justify-between gap-2 w-full">
      <Button variant="outline" onClick={onClose} className="text-xs h-9">
        {t('common.close')}
      </Button>
      {canDelete && (
        <Button variant="destructive" onClick={() => onNgatKetNoi(data)} className="text-xs h-9">
          <Link2Off size={14} className="mr-1.5" />
          {t('ketNoiGoogle.disconnect')}
        </Button>
      )}
    </div>
  );

  return (
    <GenericDrawer
      title={t('ketNoiGoogle.detailTitle')}
      subtitle={data.google_email}
      icon={<Link2 size={18} />}
      onClose={onClose}
      footer={footer}
      maxWidthClass={DRAWER_WIDTH_DETAIL}
    >
      <div className="space-y-5">
        <DetailSection title={t('ketNoiGoogle.connectionInfo')} icon={<UserRound size={16} />}>
          <DetailFieldGrid>
            <DetailField label={t('ketNoiGoogle.col.employee')} value={data.ho_va_ten ?? `#${data.nhan_vien_id}`} />
            <DetailField label={t('ketNoiGoogle.col.department')} value={data.ten_phong_ban} />
            <DetailField label={t('ketNoiGoogle.col.googleEmail')} value={data.google_email} icon={<Mail size={14} />} />
            <DetailField label={t('ketNoiGoogle.col.status')} value={<TinhTrangBadge value={tinhTrangKetNoi(data)} />} />
            <DetailField label={t('ketNoiGoogle.col.connectedAt')} value={formatDateTimeShort(data.tg_tao)} />
            <DetailField label={t('ketNoiGoogle.employeeStatus')} value={data.trang_thai_nhan_vien} />
          </DetailFieldGrid>
          <p className="mt-3 text-2xs text-muted-foreground">{t('ketNoiGoogle.disconnectHint')}</p>
        </DetailSection>

        <DetailSection title={t('ketNoiGoogle.schedulesTitle', { n: dsLich.length })} icon={<CalendarClock size={16} />}>
          {isLoading ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
              <Loader2 size={14} className="animate-spin" /> {t('ketNoiGoogle.loading')}
            </div>
          ) : dsLich.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">{t('ketNoiGoogle.noSchedules')}</p>
          ) : (
            <div className="space-y-2">
              {dsLich.map((l) => {
                const tenModule = TEN_MODULE.get(l.module_id);
                return (
                  <div key={l.id} className="rounded-lg border border-border px-3 py-2.5 text-xs">
                    <div className="flex items-start gap-2">
                      <a
                        href={l.spreadsheet_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex min-w-0 items-center gap-1 font-medium text-foreground hover:text-primary"
                      >
                        <span className="truncate">
                          {l.ten_file ?? 'Google Sheet'} › {l.sheet_title}
                        </span>
                        <ExternalLink size={11} className="shrink-0" />
                      </a>
                      <div className="ml-auto shrink-0">
                        <TinhTrangBadge value={tinhTrangLich(l)} />
                      </div>
                    </div>
                    <div className="mt-1 space-y-0.5 text-2xs text-muted-foreground">
                      <p>
                        {tenModule ? t(tenModule) : l.module_id} · {moTaTanSuat({ tanSuat: l.tan_suat, gio: l.gio, thu: l.thu, ngayThang: l.ngay_thang }, t)} ·{' '}
                        {t('ketNoiGoogle.columns', { n: l.so_cot })}
                      </p>
                      <p>
                        {l.lan_chay_cuoi
                          ? t('ketNoiGoogle.lastRun', { at: formatDateTimeShort(l.lan_chay_cuoi), rows: l.so_dong_cuoi ?? 0 })
                          : t('ketNoiGoogle.neverRun')}
                        {l.bat && l.lan_chay_ke_tiep && <> · {t('ketNoiGoogle.nextRun', { at: formatDateTimeShort(l.lan_chay_ke_tiep) })}</>}
                      </p>
                      {l.ket_qua_cuoi === 'loi' && l.thong_diep_cuoi && (
                        <p className="text-amber-600 dark:text-amber-400">
                          {t('ketNoiGoogle.lastError', { n: l.so_loi_lien_tiep, msg: l.thong_diep_cuoi })}
                        </p>
                      )}
                    </div>
                    {(canUpdate || canDelete) && (
                      <div className="mt-2 flex justify-end gap-1.5">
                        {canUpdate && (
                          <Button variant="outline" onClick={() => onToggleLich(l)} className="h-7 px-2 text-2xs">
                            {l.bat ? <Pause size={12} className="mr-1" /> : <Play size={12} className="mr-1" />}
                            {l.bat ? t('ketNoiGoogle.pause') : t('ketNoiGoogle.resume')}
                          </Button>
                        )}
                        {canDelete && (
                          <Button variant="outline" onClick={() => onXoaLich(l)} className="h-7 px-2 text-2xs text-rose-600 hover:text-rose-700">
                            <Trash2 size={12} className="mr-1" />
                            {t('common.delete')}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </DetailSection>
      </div>
    </GenericDrawer>
  );
};

export default KetNoiGoogleDrawer;
