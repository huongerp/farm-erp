import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Banknote, User, Calendar } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import CurrencyInput from '../../../../components/ui/CurrencyInput';
import Combobox from '../../../../components/ui/Combobox';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import { useSaveBangLuong, useCreateBangLuongFromRecord } from '../hooks/use-bang-luong';
import { getEmployeesRef } from '@/features/he-thong/nhan-vien/services/nhan-vien-service';
import { useQuery } from '@tanstack/react-query';
import type { BangLuongRecord } from '../core/types';

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

const defaultNumbers = {
  ngay_cong: 0,
  ngay_cong_chuan: 22,
  luong_co_ban: 0,
  luong_co_ban_tinh: 0,
  luong_kpi: 0,
  diem_kpi: 0,
  kpi_dat: false,
  ty_le_kpi_khong_dat: 0.7,
  luong_kpi_tinh: 0,
  luong_trach_nhiem: 0,
  luong_trach_nhiem_tinh: 0,
  phu_cap: 0,
  phu_cap_tinh: 0,
  cong_tru_net: 0,
  tong_luong: 0,
};

interface Props {
  initialRecord?: BangLuongRecord | null;
  defaultEmployeeId?: string;
  onClose: () => void;
}

const BangLuongForm: React.FC<Props> = ({ initialRecord, defaultEmployeeId, onClose }) => {
  const { t } = useTranslation();
  const isEdit = !!initialRecord;
  const saveMutation = useSaveBangLuong(onClose);
  const createFromFormMutation = useCreateBangLuongFromRecord(onClose);

  const [id_nhan_vien, setIdNhanVien] = useState(defaultEmployeeId ?? '');
  const [nam, setNam] = useState(currentYear);
  const [thang, setThang] = useState(currentMonth);
  const [ngay_cong, setNgayCong] = useState(defaultNumbers.ngay_cong);
  const [ngay_cong_chuan, setNgayCongChuan] = useState(defaultNumbers.ngay_cong_chuan);
  const [luong_co_ban, setLuongCoBan] = useState(defaultNumbers.luong_co_ban);
  const [luong_co_ban_tinh, setLuongCoBanTinh] = useState(defaultNumbers.luong_co_ban_tinh);
  const [luong_kpi, setLuongKpi] = useState(defaultNumbers.luong_kpi);
  const [diem_kpi, setDiemKpi] = useState(defaultNumbers.diem_kpi);
  const [kpi_dat, setKpiDat] = useState(defaultNumbers.kpi_dat);
  const [ty_le_kpi_khong_dat, setTyLeKpiKhongDat] = useState(defaultNumbers.ty_le_kpi_khong_dat);
  const [luong_kpi_tinh, setLuongKpiTinh] = useState(defaultNumbers.luong_kpi_tinh);
  const [luong_trach_nhiem, setLuongTrachNhiem] = useState(defaultNumbers.luong_trach_nhiem);
  const [luong_trach_nhiem_tinh, setLuongTrachNhiemTinh] = useState(defaultNumbers.luong_trach_nhiem_tinh);
  const [phu_cap, setPhuCap] = useState(defaultNumbers.phu_cap);
  const [phu_cap_tinh, setPhuCapTinh] = useState(defaultNumbers.phu_cap_tinh);
  /** Cộng trừ khác: một số (dương = cộng, âm = trừ) */
  const [cong_tru_khac, setCongTruKhac] = useState(defaultNumbers.cong_tru_net);
  const [ghi_chu, setGhiChu] = useState('');

  // Dropdown chọn nhân viên: dùng ref-query (id, ho_ten, ma_nhan_vien, email, trang_thai)
  // thay cho `getEmployees` (60+ cột + base64). Key `['employees','ref']` để tránh đụng
  // `EMPLOYEES_QUERY_KEY = ['employees']` của trang quản trị nhân viên.
  const { data: employees = [] } = useQuery({
    queryKey: ['employees', 'ref'] as const,
    queryFn: getEmployeesRef,
    staleTime: 1000 * 60 * 15,
  });

  const employeeOptions = useMemo(
    () =>
      employees.map((e) => ({
        value: e.id,
        label: `${e.ma_nhan_vien || e.id} - ${e.ho_ten || ''}`.trim() || String(e.id),
      })),
    [employees]
  );

  useEffect(() => {
    if (initialRecord) {
      setIdNhanVien(initialRecord.id_nhan_vien);
      setNam(initialRecord.nam);
      setThang(initialRecord.thang);
      setNgayCong(initialRecord.ngay_cong);
      setNgayCongChuan(initialRecord.ngay_cong_chuan);
      setLuongCoBan(initialRecord.luong_co_ban);
      setLuongCoBanTinh(initialRecord.luong_co_ban_tinh);
      setLuongKpi(initialRecord.luong_kpi);
      setDiemKpi(initialRecord.diem_kpi);
      setKpiDat(initialRecord.kpi_dat);
      setTyLeKpiKhongDat(initialRecord.ty_le_kpi_khong_dat);
      setLuongKpiTinh(initialRecord.luong_kpi_tinh);
      setLuongTrachNhiem(initialRecord.luong_trach_nhiem);
      setLuongTrachNhiemTinh(initialRecord.luong_trach_nhiem_tinh);
      setPhuCap(initialRecord.phu_cap);
      setPhuCapTinh(initialRecord.phu_cap_tinh);
      const net = initialRecord.cong_tru_khac.reduce(
        (s, i) => s + (i.loai === 'cong' ? i.so_tien : -i.so_tien),
        0
      );
      setCongTruKhac(net);
      setGhiChu(initialRecord.ghi_chu ?? '');
    }
  }, [initialRecord]);

  const cong_tru_net = cong_tru_khac;
  const tong_luong =
    luong_co_ban_tinh + luong_kpi_tinh + luong_trach_nhiem_tinh + phu_cap_tinh + cong_tru_net;

  const cong_tru_khac_for_submit = useMemo(
    () => [
      {
        id: '',
        loai: (cong_tru_khac >= 0 ? 'cong' : 'tru') as 'cong' | 'tru',
        so_tien: Math.abs(cong_tru_khac),
      },
    ],
    [cong_tru_khac]
  );

  const handleSubmitCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id_nhan_vien) return;
    createFromFormMutation.mutate({
      id_nhan_vien,
      nam,
      thang,
      ngay_cong,
      ngay_cong_chuan,
      luong_co_ban,
      luong_co_ban_tinh,
      luong_kpi,
      diem_kpi,
      kpi_dat,
      ty_le_kpi_khong_dat,
      luong_kpi_tinh,
      luong_trach_nhiem,
      luong_trach_nhiem_tinh,
      phu_cap,
      phu_cap_tinh,
      cong_tru_khac: cong_tru_khac_for_submit,
      cong_tru_net,
      tong_luong,
      ghi_chu: ghi_chu || undefined,
    });
  };

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!initialRecord) return;
    const updated: BangLuongRecord = {
      ...initialRecord,
      ngay_cong,
      ngay_cong_chuan,
      luong_co_ban,
      luong_co_ban_tinh,
      luong_kpi,
      diem_kpi,
      kpi_dat,
      ty_le_kpi_khong_dat,
      luong_kpi_tinh,
      luong_trach_nhiem,
      luong_trach_nhiem_tinh,
      phu_cap,
      phu_cap_tinh,
      cong_tru_khac: cong_tru_khac_for_submit,
      cong_tru_net,
      tong_luong,
      ghi_chu: ghi_chu || undefined,
    };
    saveMutation.mutate(updated);
  };

  const isLoading = saveMutation.isPending || createFromFormMutation.isPending;
  const formId = 'bang-luong-form';

  const renderPeriodSection = () => (
    <FormSection title={t('bangLuong.form.period')} icon={<Calendar size={14} />}>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground">{t('bangLuong.form.period')} - Năm</label>
          <Input
            type="number"
            min={2000}
            max={2100}
            value={nam}
            onChange={(e) => setNam(parseInt(e.target.value, 10) || currentYear)}
            className="mt-1"
            disabled={isEdit}
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Tháng</label>
          <Input
            type="number"
            min={1}
            max={12}
            value={thang}
            onChange={(e) => setThang(parseInt(e.target.value, 10) || 1)}
            className="mt-1"
            disabled={isEdit}
          />
        </div>
      </div>
    </FormSection>
  );

  const renderNgayCongSection = () => (
    <FormSection title={t('bangLuong.detail.ngayCong')} icon={<Calendar size={14} />}>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground">{t('bangLuong.detail.ngayCong')}</label>
          <Input
            type="number"
            min={0}
            step={0.5}
            value={ngay_cong}
            onChange={(e) => setNgayCong(Number(e.target.value) || 0)}
            className="mt-1"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">{t('bangLuong.detail.ngayCongChuan')}</label>
          <Input
            type="number"
            min={1}
            value={ngay_cong_chuan}
            onChange={(e) => setNgayCongChuan(Number(e.target.value) || 22)}
            className="mt-1"
          />
        </div>
      </div>
    </FormSection>
  );

  const renderLuongSection = () => (
    <FormSection title={t('bangLuong.detail.luongCoBan')} icon={<Banknote size={14} />}>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground">{t('bangLuong.detail.luongCoBan')} (mức)</label>
            <CurrencyInput value={luong_co_ban} onChange={setLuongCoBan} className="mt-1" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">{t('bangLuong.store.luongCoBanTinhCol')}</label>
            <CurrencyInput value={luong_co_ban_tinh} onChange={setLuongCoBanTinh} className="mt-1" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground">{t('bangLuong.detail.luongKpi')} (mức)</label>
            <CurrencyInput value={luong_kpi} onChange={setLuongKpi} className="mt-1" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">{t('bangLuong.detail.diemKpi')}</label>
            <Input
              type="number"
              step={0.01}
              value={diem_kpi}
              onChange={(e) => setDiemKpi(Number(e.target.value) || 0)}
              className="mt-1"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground">{t('bangLuong.form.tyLeKpiKhongDat')}</label>
            <Input
              type="number"
              step={0.01}
              min={0}
              max={1}
              value={ty_le_kpi_khong_dat}
              onChange={(e) => {
                const n = Number(e.target.value);
                setTyLeKpiKhongDat(Number.isFinite(n) ? n : 0.7);
              }}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground flex items-center gap-2">
              <input
                type="checkbox"
                checked={kpi_dat}
                onChange={(e) => setKpiDat(e.target.checked)}
                className="rounded border-border"
              />
              {t('bangLuong.detail.kpiDat')}
            </label>
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">{t('bangLuong.store.luongKpiTinhCol')}</label>
          <CurrencyInput value={luong_kpi_tinh} onChange={setLuongKpiTinh} className="mt-1" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground">{t('bangLuong.detail.luongTrachNhiem')} (mức)</label>
            <CurrencyInput value={luong_trach_nhiem} onChange={setLuongTrachNhiem} className="mt-1" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">{t('bangLuong.store.luongTrachNhiemTinhCol')}</label>
            <CurrencyInput value={luong_trach_nhiem_tinh} onChange={setLuongTrachNhiemTinh} className="mt-1" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground">{t('bangLuong.detail.phuCap')} (mức)</label>
            <CurrencyInput value={phu_cap} onChange={setPhuCap} className="mt-1" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">{t('bangLuong.store.phuCapTinhCol')}</label>
            <CurrencyInput value={phu_cap_tinh} onChange={setPhuCapTinh} className="mt-1" />
          </div>
        </div>
      </div>
    </FormSection>
  );

  const renderCongTruSection = () => (
    <FormSection title={t('bangLuong.form.congTruKhac')} icon={<Banknote size={14} />}>
      <div>
        <label className="text-xs text-muted-foreground">
          {t('bangLuong.store.congTruNetCol')} (dương = cộng, âm = trừ)
        </label>
        <Input
          type="number"
          value={cong_tru_khac === 0 ? '' : cong_tru_khac}
          onChange={(e) => setCongTruKhac(Number(e.target.value) || 0)}
          className="mt-1"
          placeholder="0"
        />
      </div>
    </FormSection>
  );

  const renderTongLuongAndGhiChu = () => (
    <>
      <FormSection title={t('bangLuong.detail.tongLuong')} icon={<Banknote size={14} />}>
        <CurrencyInput value={tong_luong} onChange={() => {}} className="opacity-90" disabled />
      </FormSection>
      <FormSection title={t('bangLuong.form.ghiChu')} icon={<Banknote size={14} />}>
        <textarea
          value={ghi_chu}
          onChange={(e) => setGhiChu(e.target.value)}
          className="w-full min-h-[80px] px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          placeholder={t('bangLuong.form.ghiChu')}
        />
      </FormSection>
    </>
  );

  return (
    <GenericDrawer
      title={isEdit ? t('bangLuong.form.editTitle') : t('bangLuong.form.addTitle')}
      icon={<Banknote size={20} />}
      onClose={onClose}
      footer={
        <FormDrawerFooter
          formId={formId}
          onCancel={onClose}
          isLoading={isLoading}
          isEdit={isEdit}
          saveLabel={t('bangLuong.form.save')}
          createLabel={t('bangLuong.form.addTitle')}
        />
      }
      maxWidthClass={DRAWER_WIDTH_FORM}
    >
      <form
        id={formId}
        onSubmit={isEdit ? handleSubmitEdit : handleSubmitCreate}
        className="flex flex-col h-full"
      >
        <div className="flex-1 overflow-y-auto space-y-4 px-1">
          <FormSection title={t('bangLuong.form.employee')} icon={<User size={14} />}>
            {isEdit ? (
              <p className="text-sm text-foreground">
                {initialRecord?.ten_nhan_vien} ({initialRecord?.ma_nhan_vien}) · {initialRecord?.nam}-
                {String(initialRecord?.thang).padStart(2, '0')}
              </p>
            ) : (
              <Combobox
                label={t('bangLuong.form.employee')}
                options={employeeOptions}
                value={id_nhan_vien || null}
                onChange={(v) => setIdNhanVien(v ? String(v) : '')}
                placeholder={t('common.select')}
                searchPlaceholder={t('common.search')}
                required
                icon={<User size={14} />}
                searchable
                dropdownInPortal
              />
            )}
          </FormSection>

          {renderPeriodSection()}
          {renderNgayCongSection()}
          {renderLuongSection()}
          {renderCongTruSection()}
          {renderTongLuongAndGhiChu()}
        </div>
      </form>
    </GenericDrawer>
  );
};

export default BangLuongForm;
