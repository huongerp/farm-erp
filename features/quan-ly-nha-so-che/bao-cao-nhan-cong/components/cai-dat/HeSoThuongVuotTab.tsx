import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Save } from 'lucide-react';
import Button from '../../../../../components/ui/Button';
import Input from '../../../../../components/ui/Input';
import Select from '../../../../../components/ui/Select';
import { CHUYEN_PRODUCTION_CODES, type LoaiChuyen } from '../../core/types';
import { SO_NHOM_TOI_DA } from '../../core/tong-hop-nhom';
import { docHeSo, type CaiDatThuongVuot } from '../../core/thuong-vuot-thung';
import { useCaiDatThuongVuot, useLuuCaiDatThuongVuot, useNhaSoCheTrongPhamVi } from '../../hooks/use-thuong-vuot';
import { useBaoCaoNhanCongPermissions } from '../../hooks/use-bao-cao-nhan-cong-permissions';

const NHOM = Array.from({ length: SO_NHOM_TOI_DA }, (_, i) => i + 1);
const hienSo = (v: number | null | undefined) => (v == null ? '' : String(v).replace('.', ','));

/** Ô đang gõ của cả bảng: khoá "donGia" | "nguong" | "<chuyền>|0" (hệ số chuyền) | "<chuyền>|<nhóm>". */
type Nhap = Record<string, string>;

function caiDatSangNhap(cd: CaiDatThuongVuot): Nhap {
  const out: Nhap = { donGia: hienSo(cd.donGia), nguong: hienSo(cd.nguongPct) };
  for (const loai of CHUYEN_PRODUCTION_CODES) {
    out[`${loai}|0`] = hienSo(cd.heSoChuyen[loai]);
    for (const n of NHOM) out[`${loai}|${n}`] = hienSo(cd.heSoNhom[loai]?.[String(n)]);
  }
  return out;
}

function nhapSangCaiDat(nhap: Nhap): CaiDatThuongVuot | null {
  const donGia = Number((nhap.donGia ?? '').trim().replace(/\./g, '').replace(',', '.'));
  const nguong = Number((nhap.nguong ?? '').trim().replace(',', '.'));
  if (!Number.isFinite(donGia) || donGia < 0 || (nhap.donGia ?? '').trim() === '') return null;
  if (!Number.isFinite(nguong) || nguong <= 0 || nguong > 200) return null;
  const kq: CaiDatThuongVuot = { donGia, nguongPct: nguong, heSoChuyen: {}, heSoNhom: {} };
  for (const loai of CHUYEN_PRODUCTION_CODES) {
    const raw = (nhap[`${loai}|0`] ?? '').trim();
    if (raw !== '') {
      const hs = docHeSo(raw);
      if (hs == null) return null;
      kq.heSoChuyen[loai] = hs;
    }
    for (const n of NHOM) {
      const r = (nhap[`${loai}|${n}`] ?? '').trim();
      if (r === '') continue;
      const hs = docHeSo(r);
      if (hs == null) return null;
      kq.heSoNhom[loai] = { ...kq.heSoNhom[loai], [String(n)]: hs };
    }
  }
  return kq;
}

/** Bảng nhập của một nhà sơ chế — remount khi đổi nhà / tải xong để lấy giá trị ban đầu. */
const BangHeSo: React.FC<{ idChiNhanh: string; caiDat: CaiDatThuongVuot; coQuyen: boolean }> = ({ idChiNhanh, caiDat, coQuyen }) => {
  const { t } = useTranslation();
  const [nhap, setNhap] = useState<Nhap>(() => caiDatSangNhap(caiDat));
  const [nhom, setNhom] = useState(1);
  const luu = useLuuCaiDatThuongVuot();
  const ketQua = nhapSangCaiDat(nhap);
  const doi = (k: string, v: string) => setNhap((d) => ({ ...d, [k]: v }));
  const o = (k: string, label: string) => (
    <Input
      type="text"
      inputMode="decimal"
      value={nhap[k] ?? ''}
      placeholder="1"
      onChange={(e) => doi(k, e.target.value)}
      disabled={!coQuyen}
      aria-label={label}
      className={`h-8 w-16 px-1.5 text-right ${(nhap[k] ?? '').trim() !== '' && docHeSo(nhap[k]) == null ? 'border-rose-500' : ''}`}
    />
  );
  const tenChuyen = (loai: LoaiChuyen) => t(`baoCaoNhanCong.chuyen.${loai}`);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-40">
          <Input label={t('baoCaoNhanCong.vuot.donGia')} inputMode="decimal" value={nhap.donGia ?? ''} onChange={(e) => doi('donGia', e.target.value)} disabled={!coQuyen} />
        </div>
        <div className="w-40">
          <Input label={t('baoCaoNhanCong.vuot.nguongPct')} inputMode="decimal" value={nhap.nguong ?? ''} onChange={(e) => doi('nguong', e.target.value)} disabled={!coQuyen} />
        </div>
      </div>

      {/* Chọn một nhóm rồi nhập hệ số của nhóm đó cho từng chuyền — thay bảng 9 cột phải kéo ngang trên điện thoại. */}
      <div className="space-y-1.5">
        <p className="text-xs text-muted-foreground m-0">{t('baoCaoNhanCong.vuot.chonNhomNhap')}</p>
        <div className="flex flex-wrap gap-1.5" role="tablist">
          {NHOM.map((n) => {
            const dangChon = n === nhom;
            const daNhap = CHUYEN_PRODUCTION_CODES.some((loai) => (nhap[`${loai}|${n}`] ?? '').trim() !== '');
            return (
              <button
                key={n}
                type="button"
                role="tab"
                aria-selected={dangChon}
                onClick={() => setNhom(n)}
                className={`relative h-8 min-w-[4.5rem] rounded-full border px-3 text-xs font-medium ${
                  dangChon ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-foreground hover:border-primary/50'
                }`}
              >
                {t('baoCaoNhanCong.nsNhom.nhomN', { n })}
                {daNhap && !dangChon && <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary" aria-hidden />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-caption text-muted-foreground">
            <tr>
              <th className="px-2 py-1.5 text-left font-medium">{t('baoCaoNhanCong.nsNhom.colChuyen')}</th>
              <th className="px-1 py-1.5 font-medium w-[4.5rem]">{t('baoCaoNhanCong.vuot.heSoChuyen')}</th>
              <th className="px-1 py-1.5 font-medium w-[4.5rem] text-primary">{t('baoCaoNhanCong.vuot.heSoNhomN', { n: nhom })}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {CHUYEN_PRODUCTION_CODES.map((loai) => (
              <tr key={loai}>
                <td className="px-2 py-1 text-xs">{tenChuyen(loai)}</td>
                <td className="px-1 py-1">{o(`${loai}|0`, `${tenChuyen(loai)} — ${t('baoCaoNhanCong.vuot.heSoChuyen')}`)}</td>
                <td className="px-1 py-1">{o(`${loai}|${nhom}`, `${tenChuyen(loai)} — ${t('baoCaoNhanCong.vuot.heSoNhomN', { n: nhom })}`)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {coQuyen && (
        <div className="flex items-center justify-end gap-2">
          {!ketQua && <span className="text-xs text-rose-600">{t('baoCaoNhanCong.vuot.loiNhap')}</span>}
          <Button type="button" size="sm" disabled={!ketQua || luu.isPending} onClick={() => ketQua && luu.mutate({ idChiNhanh, caiDat: ketQua })}>
            <Save size={14} className="mr-1.5" />
            {t('common.save')}
          </Button>
        </div>
      )}
    </div>
  );
};

/** Tab «Hệ số thưởng vượt»: đơn giá, ngưỡng và hệ số chuyền / nhóm mặc định, riêng từng nhà sơ chế. */
const HeSoThuongVuotTab: React.FC = () => {
  const { t } = useTranslation();
  const { options, isLoading } = useNhaSoCheTrongPhamVi();
  const { canUpdate, canAdmin } = useBaoCaoNhanCongPermissions();
  const [chon, setChon] = useState('');
  const idChiNhanh = chon || options[0]?.value || '';
  const { caiDat, isPending, dataUpdatedAt } = useCaiDatThuongVuot(idChiNhanh);

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground m-0">{t('baoCaoNhanCong.vuot.caiDatGioiThieu')}</p>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">{t('baoCaoNhanCong.loading')}</p>
      ) : options.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('baoCaoNhanCong.vuot.chuaCoNhaSoChe')}</p>
      ) : (
        <>
          <div className="max-w-sm">
            <Select label={t('baoCaoNhanCong.vuot.nhaSoChe')} options={options} value={idChiNhanh} onChange={(e) => setChon(e.target.value)} />
          </div>
          {isPending ? (
            <p className="text-sm text-muted-foreground">{t('baoCaoNhanCong.loading')}</p>
          ) : (
            <BangHeSo key={`${idChiNhanh}-${dataUpdatedAt}`} idChiNhanh={idChiNhanh} caiDat={caiDat} coQuyen={canUpdate || canAdmin} />
          )}
        </>
      )}
    </div>
  );
};

export default HeSoThuongVuotTab;
