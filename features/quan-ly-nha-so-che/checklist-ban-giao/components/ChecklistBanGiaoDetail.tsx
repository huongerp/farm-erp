import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Ban,
  Calendar,
  ClipboardCheck,
  ClipboardList,
  FileText,
  Hash,
  Printer,
  RotateCcw,
  Send,
  Undo2,
  User,
} from 'lucide-react';
import { toast } from 'sonner';
import GenericDrawer, { DRAWER_WIDTH_PHIEU_KHO } from '../../../../components/shared/GenericDrawer';
import DetailToolbar, { type DetailToolbarAction } from '../../../../components/shared/DetailToolbar';
import DetailSection from '../../../../components/shared/DetailSection';
import DetailField from '../../../../components/shared/DetailField';
import DetailFieldGrid from '../../../../components/shared/DetailFieldGrid';
import DetailDrawerFooter from '../../../../components/shared/DetailDrawerFooter';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import Button from '../../../../components/ui/Button';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import Select from '../../../../components/ui/Select';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { useModulePermissionFromContext } from '../../../../components/shared/ModulePermissionGuard';
import { formatDateTimeShort, formatYmdToDisplay } from '../../../../lib/utils';
import { cn } from '../../../../lib/utils';
import type { DongPhieuChecklist, KetLuanVanHanh } from '../core/types';
import { KET_LUAN_VAN_HANH } from '../core/types';
import type { PhieuChecklistListItem } from '../core/list-types';
import {
  coKhauSau,
  coTheChuyen,
  coTheHuy,
  coTheMoLai,
  coTheNhan,
  coTheSuaCotKiemTra,
  coTheSuaCotThucHien,
  coTheSuaKetLuan,
  coTheSuaThongTin,
  coTheTraLai,
  coTheXoa,
  laBenKiemTra,
  laBenThucHien,
  type VaiTroCl,
} from '../core/trang-thai';
import { demKetQua, laDongLech, loiTruocKhiChuyen, nhomTheoMuc, soDongChuaKiemTra } from '../core/tong-hop';
import {
  useDongByPhieu,
  useHanhDongPhieu,
  useLichSuByPhieu,
  useNguoiDungCl,
  useUpdateKetLuan,
  useUpdateThongTin,
} from '../hooks/use-checklist-ban-giao';
import { useChecklistBanGiaoCapCao } from '../hooks/use-checklist-ban-giao-view-scope';
import { useBranches } from '../../../he-thong/chi-nhanh/hooks/use-chi-nhanh';
import OChonKetQua from './OChonKetQua';
import LuoiNgayVeSinh from './LuoiNgayVeSinh';
import { congNgay, moTaTanSuat, soOChuaTich } from '../../checklist-mau/core/ve-sinh-tuan';
import LyDoDialog from './LyDoDialog';
import { KetLuanVanHanhBadge, TrangThaiBadge } from './Badges';

/** Mảng rỗng cố định — tránh tham chiếu mới mỗi render khi chưa có dòng. */
const KHONG_CO_DONG: DongPhieuChecklist[] = [];

interface Props {
  data: PhieuChecklistListItem;
  onClose: () => void;
  onEdit?: (item: PhieuChecklistListItem) => void;
  onDelete?: (id: string) => void;
  canUpdate?: boolean;
  canDelete?: boolean;
}

const ChecklistBanGiaoDetail: React.FC<Props> = ({ data, onClose, onEdit, onDelete, canUpdate = true, canDelete = true }) => {
  const { t } = useTranslation();
  const confirm = useConfirmStore((s) => s.confirm);
  const capCao = useChecklistBanGiaoCapCao();
  const nguoi = useNguoiDungCl();
  const { canCreate: permCreate, canUpdate: permUpdate, canAdmin: permAdmin } = useModulePermissionFromContext();
  const hanhDong = useHanhDongPhieu();
  const luuKetLuan = useUpdateKetLuan();
  const luuThongTin = useUpdateThongTin();
  const { data: dongData, isPending: dongPending } = useDongByPhieu(data.id);
  // Chỉ hiện "Đang tải" khi chưa có dòng nào — refetch nền giữ nguyên nội dung đang xem.
  const dong = dongData ?? KHONG_CO_DONG;
  const dongLoading = dongData === undefined && dongPending;
  const { data: lichSu = [] } = useLichSuByPhieu(data.id);
  const { data: branches = [] } = useBranches();

  const [lyDo, setLyDo] = useState<null | { hanhDong: 'traLai' | 'huy' | 'moLai'; batBuoc: boolean }>(null);
  const [suaThongTin, setSuaThongTin] = useState(false);
  const [ketLuan, setKetLuan] = useState<KetLuanVanHanh | null>(data.ket_luan);
  const [yKien, setYKien] = useState(data.y_kien ?? '');

  const tenChiNhanh = useMemo(() => {
    if (!data.id_chi_nhanh) return '';
    return branches.find((b) => b.id === data.id_chi_nhanh)?.ten_chi_nhanh ?? '';
  }, [branches, data.id_chi_nhanh]);

  // Khớp fn_cl_la_ben_thuc_hien: quyền create/update/admin/all. Khâu sau (vd Kho) chỉ cần quyền xem.
  const coQuyenGhi = permCreate || permUpdate || permAdmin;
  const vai: VaiTroCl = {
    benThucHien: laBenThucHien(data.chuc_vu_thuc_hien_ids, data.id_nguoi_tao, nguoi, coQuyenGhi),
    benKiemTra: laBenKiemTra(data.chuc_vu_kiem_tra_ids, nguoi),
    capCao,
  };

  const tt = data.trang_thai;
  const laVeSinh = data.loai === 've_sinh_tuan';
  const nhanNgayPhieu = laVeSinh
    ? t('checklistBanGiao.vs.tuan', { tu: formatYmdToDisplay(data.ngay), den: formatYmdToDisplay(congNgay(data.ngay, 6)) })
    : formatYmdToDisplay(data.ngay);
  const coKhauSauPhieu = coKhauSau(data.chuc_vu_kiem_tra_ids);
  const canSuaThucHien = coTheSuaCotThucHien(tt, vai);
  const canSuaKiemTra = coTheSuaCotKiemTra(tt, vai);
  const canSuaThongTin = coTheSuaThongTin(tt, vai);
  const canSuaKetLuan = coTheSuaKetLuan(tt, vai);
  const canChuyen = coTheChuyen(tt, vai);
  const canNhan = coTheNhan(tt, vai);
  const canTraLai = coTheTraLai(tt, vai);
  const canHuy = coTheHuy(tt, vai);
  const canMoLai = coTheMoLai(tt, vai);
  const canXoa = canDelete && coTheXoa(tt, vai);

  const nhom = useMemo(() => nhomTheoMuc(dong), [dong]);

  const loiChuyen = useMemo(() => loiTruocKhiChuyen(dong, data), [dong, data]);
  const chuaKiem = useMemo(() => soDongChuaKiemTra(dong), [dong]);

  const moTaChuyen = () => {
    if (loiChuyen.length > 0) {
      const parts = loiChuyen.map((l) => {
        if (l.loai === 'thieu_tich') {
          if (laVeSinh) {
            const so = dong.reduce((n, d) => n + soOChuaTich(d.ngay_lich ?? [], d.kq_ngay), 0);
            return t('checklistBanGiao.loi.thieuTichNgay', { so, dong: l.so });
          }
          return t('checklistBanGiao.loi.thieuTich', { so: l.so });
        }
        if (l.loai === 'thieu_khac_phuc') {
          return l.stt.length > 0
            ? t('checklistBanGiao.loi.thieuKhacPhucStt', { stt: l.stt.join(', ') })
            : t('checklistBanGiao.loi.thieuKhacPhuc', { so: l.so });
        }
        return t('checklistBanGiao.loi.thieuKetLuan');
      });
      toast.info(parts.join(' · '));
      return;
    }
    confirm({
      title: t('checklistBanGiao.confirm.chuyenTitle'),
      message: t('checklistBanGiao.confirm.chuyenMessage'),
      variant: 'warning',
      confirmText: t('checklistBanGiao.hanhDong.chuyen'),
      onConfirm: async () => {
        await hanhDong.mutateAsync({ action: 'chuyen', id: data.id });
      },
    });
  };

  const moTaNhan = () => {
    if (chuaKiem > 0) {
      toast.info(t('checklistBanGiao.loi.chuaKiemTra', { so: chuaKiem }));
      return;
    }
    confirm({
      title: t('checklistBanGiao.confirm.nhanTitle'),
      message: t('checklistBanGiao.confirm.nhanMessage'),
      variant: 'warning',
      confirmText: t('checklistBanGiao.hanhDong.nhan'),
      onConfirm: async () => {
        await hanhDong.mutateAsync({ action: 'nhan', id: data.id });
      },
    });
  };

  const moTraLai = () => setLyDo({ hanhDong: 'traLai', batBuoc: true });
  const moHuy = () => setLyDo({ hanhDong: 'huy', batBuoc: false });
  const moMoLai = () => setLyDo({ hanhDong: 'moLai', batBuoc: true });

  const urlIn = `/quan-ly-nha-so-che/checklist-ban-giao/preview/${data.id}`;

  // Không memo: các handler đọc loiChuyen / chuaKiem mới nhất sau mỗi lần tích.
  const toolbarActions: DetailToolbarAction[] = (() => {
    const a: DetailToolbarAction[] = [
      {
        label: t('checklistBanGiao.hanhDong.inPhieu'),
        icon: <Printer />,
        onClick: () => window.open(urlIn, '_blank', 'noopener,noreferrer'),
        variant: 'outline',
      },
    ];
    if (canChuyen) a.push({ label: t('checklistBanGiao.hanhDong.chuyen'), icon: <Send />, onClick: moTaChuyen, variant: 'primary' });
    if (canNhan) a.push({ label: t('checklistBanGiao.hanhDong.nhan'), icon: <ClipboardCheck />, onClick: moTaNhan, variant: 'success' });
    if (canTraLai) a.push({ label: t('checklistBanGiao.hanhDong.traLai'), icon: <Undo2 />, onClick: moTraLai, variant: 'danger' });
    if (canHuy) a.push({ label: t('checklistBanGiao.hanhDong.huy'), icon: <Ban />, onClick: moHuy, variant: 'danger' });
    if (canMoLai) a.push({ label: t('checklistBanGiao.hanhDong.moLai'), icon: <RotateCcw />, onClick: moMoLai, variant: 'warning' });
    return a;
  })();

  const submitKetLuan = () => {
    luuKetLuan.mutate({ id: data.id, data: { ket_luan: ketLuan, y_kien: yKien || null } });
  };

  const ketLuanOptions = KET_LUAN_VAN_HANH.map((v) => ({ value: v, label: t(`checklistBanGiao.ketLuan.${v}`) }));


  return (
    <>
      <GenericDrawer
        title={t('checklistBanGiao.detail.title')}
        subtitle={data.so_phieu}
        icon={<ClipboardList className="text-primary" size={22} />}
        onClose={onClose}
        maxWidthClass={DRAWER_WIDTH_PHIEU_KHO}
        footer={
          <DetailDrawerFooter
            onClose={onClose}
            canUpdate={coQuyenGhi && canSuaThongTin}
            canDelete={canXoa}
            onEdit={onEdit && coQuyenGhi && canSuaThongTin ? () => onEdit(data) : undefined}
            onDelete={onDelete && canXoa ? () => onDelete(data.id) : undefined}
          />
        }
      >
        <div className="space-y-5">
          {/* Đầu phiếu */}
          <div className="bg-card p-4 rounded-xl border border-border/50 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-base font-bold text-foreground leading-tight truncate">{data.ten_mau}</h2>
                <p className="text-body-sm text-muted-foreground mt-0.5 font-mono">
                  {[data.ma_mau, data.so_phieu].filter(Boolean).join(' · ')}
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <TrangThaiBadge value={tt} />
                  {data.co_ket_luan_van_hanh && <KetLuanVanHanhBadge value={data.ket_luan} />}
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border tabular-nums">
                    {nhanNgayPhieu}
                    {data.ca ? ` · ${data.ca}` : ''}
                  </span>
                  {data.so_lan_tra_lai > 0 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20 tabular-nums">
                      {t('checklistBanGiao.detail.soLanTraLai', { so: data.so_lan_tra_lai })}
                    </span>
                  )}
                </div>
              </div>
            </div>
            {data.ly_do_tra_lai && (
              <p className="mt-2 text-sm text-rose-700 dark:text-rose-300 m-0">
                {t('checklistBanGiao.detail.lyDoTraLai')}: {data.ly_do_tra_lai}
              </p>
            )}
          </div>

          {toolbarActions.length > 0 && (
            <DetailToolbar actions={toolbarActions} className="bg-card rounded-xl border border-border" />
          )}

          {/* Kết luận vận hành */}
          {data.co_ket_luan_van_hanh && (
            <FormSection title={t('checklistBanGiao.detail.ketLuanVanHanh')}>
              {canSuaKetLuan ? (
                <FormGrid cols={1}>
                  <Select
                    label={t('checklistBanGiao.detail.ketLuan')}
                    value={ketLuan ?? ''}
                    onChange={(e) => setKetLuan((e.target.value || null) as KetLuanVanHanh | null)}
                    options={[{ value: '', label: t('checklistBanGiao.detail.chuaChonKetLuan') }, ...ketLuanOptions]}
                  />
                  <Textarea
                    rows={2}
                    label={t('checklistBanGiao.detail.yKien')}
                    value={yKien}
                    onChange={(e) => setYKien(e.target.value)}
                  />
                  <div className="flex justify-end">
                    <Button type="button" size="sm" onClick={submitKetLuan} disabled={luuKetLuan.isPending}>
                      {t('common.save')}
                    </Button>
                  </div>
                </FormGrid>
              ) : (
                <div className="flex items-center gap-2 flex-wrap">
                  <KetLuanVanHanhBadge value={data.ket_luan} />
                  {data.y_kien && <span className="text-sm text-muted-foreground">{data.y_kien}</span>}
                  {!data.ket_luan && !data.y_kien && <span className="text-sm text-muted-foreground">—</span>}
                </div>
              )}
            </FormSection>
          )}

          {/* Bảng tích 2 cột */}
          <DetailSection
            title={t('checklistBanGiao.detail.ketQua')}
            icon={<ClipboardCheck size={14} />}
            variant="primary"
          >
            {dongLoading ? (
              <p className="text-sm text-muted-foreground m-0">{t('checklistBanGiao.loading')}</p>
            ) : dong.length === 0 ? (
              <p className="text-sm text-muted-foreground m-0">{t('checklistBanGiao.detail.chuaCoDong')}</p>
            ) : (
              // Danh sách thẻ thay cho bảng: trên điện thoại nút Đạt/K.Đạt luôn nằm trong màn hình,
              // không phải vuốt ngang. Từ sm trở lên hai cột tích đứng cạnh nhau.
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2 text-xs">
                  {[
                    { ten: data.ten_ben_thuc_hien, d: demKetQua(dong, 'kq_thuc_hien') },
                    ...(coKhauSauPhieu ? [{ ten: data.ten_ben_kiem_tra, d: demKetQua(dong, 'kq_kiem_tra') }] : []),
                  ].map(({ ten, d }) => (
                    <span key={ten} className="rounded-full border border-border bg-muted/30 px-2.5 py-1">
                      <span className="font-semibold">{ten}:</span>{' '}
                      {t('checklistBanGiao.detail.demNhanh', { dat: d.dat, khongDat: d.khongDat, chuaTich: d.chuaTich, tong: d.tong })}
                      {d.tungKhongDat > 0 && t('checklistBanGiao.detail.demDaSua', { so: d.tungKhongDat })}
                    </span>
                  ))}
                </div>
                {laVeSinh && canSuaThucHien && (
                  <p className="m-0 text-xs text-muted-foreground">{t('checklistBanGiao.vs.goiYTich')}</p>
                )}
                {nhom.map((n) => (
                  <div key={`${n.thuTuMuc}-${n.tenMuc ?? 'none'}`} className="overflow-hidden rounded-lg border border-border">
                    {n.tenMuc && (
                      <div className="border-b border-border bg-muted/60 px-3 py-2 text-sm font-semibold text-foreground">{n.tenMuc}</div>
                    )}
                    <div className="divide-y divide-border">
                      {n.dong.map((d: DongPhieuChecklist) => (
                        <div
                          key={d.id}
                          className={cn('p-3 space-y-2', laDongLech(d) && 'bg-orange-50 dark:bg-orange-950/30 shadow-[inset_3px_0_0_0_rgb(249,115,22)]')}
                        >
                          <div className="flex gap-2">
                            <span className="w-6 shrink-0 text-right text-sm tabular-nums text-muted-foreground">{d.stt}.</span>
                            <div className="min-w-0">
                              <div className="text-sm font-medium">
                                {d.quan_trong && <span className="text-amber-500 mr-1">★</span>}
                                {d.doi_tuong}
                              </div>
                              {d.tieu_chuan && <div className="text-xs text-muted-foreground mt-0.5">{d.tieu_chuan}</div>}
                              {d.phuong_phap && (
                                <div className="text-xs text-muted-foreground italic">
                                  {t('checklistBanGiao.detail.phuongPhap')}: {d.phuong_phap}
                                </div>
                              )}
                              {d.ma_ts && (
                                <div className="text-xs text-primary/70 mt-0.5">
                                  {t('checklistBanGiao.detail.maTs')}: {d.ma_ts}
                                  {[d.so_luong, d.tan_suat_bao_duong].filter(Boolean).length > 0 &&
                                    ` · ${[d.so_luong, d.tan_suat_bao_duong].filter(Boolean).join(' · ')}`}
                                </div>
                              )}
                              {laVeSinh && (
                                <div className="text-xs text-primary/70 mt-0.5">
                                  {t('checklistBanGiao.vs.tanSuat')}: {moTaTanSuat(d.tan_suat, t)}
                                </div>
                              )}
                              {laDongLech(d) && (
                                <div className="text-xs font-medium text-orange-600 dark:text-orange-400 mt-0.5">
                                  {t('checklistBanGiao.detail.dongLech')}
                                </div>
                              )}
                            </div>
                          </div>
                          {laVeSinh && (
                            <div className="sm:pl-8">
                              <LuoiNgayVeSinh dong={d} idPhieu={data.id} tuan={data.ngay} coTheSua={canSuaThucHien} />
                            </div>
                          )}
                          <div className={cn('grid gap-2 sm:pl-8', coKhauSauPhieu && 'sm:grid-cols-2')}>
                            <div className="rounded-md border border-border/60 bg-muted/30 p-2">
                              <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                {data.ten_ben_thuc_hien || t('checklistBanGiao.detail.benThucHien')}
                              </div>
                              <OChonKetQua dong={d} idPhieu={data.id} cot="kq_thuc_hien" coTheSua={canSuaThucHien} ketQuaTuDong={laVeSinh} />
                            </div>
                            {coKhauSauPhieu && (
                              <div className="rounded-md border border-border/60 bg-muted/30 p-2">
                                <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                  {data.ten_ben_kiem_tra || t('checklistBanGiao.detail.benKiemTra')}
                                </div>
                                <OChonKetQua dong={d} idPhieu={data.id} cot="kq_kiem_tra" coTheSua={canSuaKiemTra} />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DetailSection>

          {/* Thông tin chung */}
          <DetailSection title={t('checklistBanGiao.detail.thongTin')} icon={<FileText size={14} />} variant="secondary">
            {canSuaThongTin && suaThongTin ? (
              <ThongTinForm
                data={data}
                tenChiNhanh={tenChiNhanh}
                branches={branches}
                isSaving={luuThongTin.isPending}
                onSave={(v) => {
                  luuThongTin.mutate(
                    { id: data.id, data: v },
                    { onSuccess: () => setSuaThongTin(false) }
                  );
                }}
                onCancel={() => setSuaThongTin(false)}
              />
            ) : (
              <>
                <DetailFieldGrid>
                  <DetailField label={t('checklistBanGiao.col.soPhieu')} value={data.so_phieu} icon={<Hash size={12} />} />
                  <DetailField label={laVeSinh ? t('checklistBanGiao.form.tuan') : t('checklistBanGiao.col.ngay')} value={nhanNgayPhieu} icon={<Calendar size={12} />} />
                  <DetailField label={t('checklistBanGiao.form.ca')} value={data.ca ?? ''} emptyText="—" icon={<Hash size={12} />} />
                  <DetailField label={t('checklistBanGiao.form.khuVuc')} value={data.khu_vuc ?? ''} emptyText="—" icon={<FileText size={12} />} />
                  <DetailField label={t('checklistBanGiao.form.dayChuyen')} value={data.day_chuyen ?? ''} emptyText="—" icon={<FileText size={12} />} />
                  <DetailField label={t('checklistBanGiao.form.idChiNhanh')} value={tenChiNhanh} emptyText="—" icon={<User size={12} />} />
                  <DetailField
                    label={t('checklistBanGiao.form.ghiChu')}
                    value={data.ghi_chu ?? ''}
                    emptyText="—"
                    icon={<FileText size={12} />}
                    className="col-span-1 sm:col-span-2 lg:col-span-3 whitespace-pre-line"
                  />
                </DetailFieldGrid>
                {canSuaThongTin && (
                  <div className="mt-2 flex justify-end">
                    <Button type="button" size="sm" variant="outline" onClick={() => setSuaThongTin(true)}>
                      {t('common.edit')}
                    </Button>
                  </div>
                )}
              </>
            )}
          </DetailSection>

          {/* Lịch sử */}
          {lichSu.length > 0 && (
            <DetailSection title={t('checklistBanGiao.detail.lichSu')} icon={<ClipboardCheck size={14} />} variant="muted">
              <ul className="m-0 p-0 list-none space-y-1.5 text-sm">
                {lichSu.map((l) => (
                  <li key={l.id} className="flex flex-wrap items-baseline gap-x-2">
                    <span className="font-medium">{t(`checklistBanGiao.lichSu.${l.hanh_dong}`)}</span>
                    {l.ten_nguoi && <span className="text-muted-foreground">{l.ten_nguoi}</span>}
                    <span className="text-muted-foreground tabular-nums text-xs">{formatDateTimeShort(l.tg)}</span>
                    {l.ly_do && <span className="text-muted-foreground italic">— {l.ly_do}</span>}
                  </li>
                ))}
              </ul>
            </DetailSection>
          )}

          {/* Hệ thống */}
          <DetailSection title={t('checklistBanGiao.detail.systemInfo')} icon={<Calendar size={14} />} variant="muted">
            <DetailFieldGrid>
              <DetailField label={t('checklistBanGiao.col.nguoiTao')} value={data.ten_nguoi_tao ?? ''} emptyText="—" icon={<User size={12} />} />
              <DetailField label={t('checklistBanGiao.detail.tgTao')} value={formatDateTimeShort(data.tg_tao)} icon={<Calendar size={12} />} />
              {data.id_nguoi_chuyen && (
                <>
                  <DetailField label={t('checklistBanGiao.detail.nguoiChuyen')} value={data.id_nguoi_chuyen} emptyText="—" icon={<Send size={12} />} />
                  <DetailField label={t('checklistBanGiao.detail.tgChuyen')} value={data.tg_chuyen ? formatDateTimeShort(data.tg_chuyen) : ''} emptyText="—" icon={<Calendar size={12} />} />
                </>
              )}
              {data.id_nguoi_nhan && (
                <>
                  <DetailField label={t('checklistBanGiao.col.nguoiNhan')} value={data.ten_nguoi_nhan ?? ''} emptyText="—" icon={<User size={12} />} />
                  <DetailField label={t('checklistBanGiao.detail.tgNhan')} value={data.tg_nhan ? formatDateTimeShort(data.tg_nhan) : ''} emptyText="—" icon={<Calendar size={12} />} />
                </>
              )}
              <DetailField label={t('checklistBanGiao.detail.tgCapNhat')} value={formatDateTimeShort(data.tg_cap_nhat)} icon={<Calendar size={12} />} />
            </DetailFieldGrid>
          </DetailSection>
        </div>
      </GenericDrawer>

      <LyDoDialog
        open={lyDo !== null}
        title={t(`checklistBanGiao.lyDo.${lyDo?.hanhDong ?? 'traLai'}Title`)}
        placeholder={t(`checklistBanGiao.lyDo.${lyDo?.hanhDong ?? 'traLai'}Placeholder`)}
        batBuoc={lyDo?.batBuoc ?? false}
        isSaving={hanhDong.isPending}
        onClose={() => setLyDo(null)}
        onSave={(ly) => {
          if (lyDo) hanhDong.mutate({ action: lyDo.hanhDong, id: data.id, lyDo: ly }, { onSuccess: () => setLyDo(null) });
        }}
      />
    </>
  );
};

// ── Form sửa thông tin chung ───────────────────────────────────────────────────

interface ThongTinFormProps {
  data: PhieuChecklistListItem;
  tenChiNhanh: string;
  branches: { id: string; ten_chi_nhanh: string }[];
  isSaving: boolean;
  onSave: (v: { ngay: string; ca: string | null; khu_vuc: string | null; day_chuyen: string | null; id_chi_nhanh: string | null; ghi_chu: string | null }) => void;
  onCancel: () => void;
}

const ThongTinForm: React.FC<ThongTinFormProps> = ({ data, branches, isSaving, onSave, onCancel }) => {
  const { t } = useTranslation();
  const [ngay, setNgay] = useState(data.ngay);
  const [ca, setCa] = useState(data.ca ?? '');
  const [khuVuc, setKhuVuc] = useState(data.khu_vuc ?? '');
  const [dayChuyen, setDayChuyen] = useState(data.day_chuyen ?? '');
  const [idChiNhanh, setIdChiNhanh] = useState(data.id_chi_nhanh ?? '');
  const [ghiChu, setGhiChu] = useState(data.ghi_chu ?? '');

  const options = branches.map((b) => ({ value: b.id, label: b.ten_chi_nhanh }));

  return (
    <FormGrid cols={2}>
      <div className="space-y-1">
        <Input
          type="date"
          label={data.loai === 've_sinh_tuan' ? t('checklistBanGiao.form.tuan') : t('checklistBanGiao.form.ngay')}
          value={ngay}
          onChange={(e) => setNgay(e.target.value)}
          required
        />
        {data.loai === 've_sinh_tuan' && <p className="m-0 text-xs text-muted-foreground">{t('checklistBanGiao.vs.khongDoiTuan')}</p>}
      </div>
      <Input label={t('checklistBanGiao.form.ca')} value={ca} onChange={(e) => setCa(e.target.value)} />
      <Input label={t('checklistBanGiao.form.khuVuc')} value={khuVuc} onChange={(e) => setKhuVuc(e.target.value)} />
      <Input label={t('checklistBanGiao.form.dayChuyen')} value={dayChuyen} onChange={(e) => setDayChuyen(e.target.value)} />
      <Select label={t('checklistBanGiao.form.idChiNhanh')} value={idChiNhanh} onChange={(e) => setIdChiNhanh(e.target.value)} options={options} />
      <div className="sm:col-span-2">
        <Textarea rows={2} label={t('checklistBanGiao.form.ghiChu')} value={ghiChu} onChange={(e) => setGhiChu(e.target.value)} />
      </div>
      <div className="sm:col-span-2 flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={!ngay || isSaving}
          onClick={() =>
            onSave({
              ngay,
              ca: ca.trim() || null,
              khu_vuc: khuVuc.trim() || null,
              day_chuyen: dayChuyen.trim() || null,
              id_chi_nhanh: idChiNhanh || null,
              ghi_chu: ghiChu.trim() || null,
            })
          }
        >
          {t('common.save')}
        </Button>
      </div>
    </FormGrid>
  );
};

export default ChecklistBanGiaoDetail;
