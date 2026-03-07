import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, Save, GitCompare, MessageSquare, ThumbsUp, ThumbsDown } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import { BTN_ADD } from '../../../../lib/button-labels';
import type { DoiThu, BattlecardDong, KichBanXuLyItem } from '../core/types';
import type { DoiThuFormValues } from '../core/schema';
import { useBattlecard, useUpdateBattlecard, useUpdateDoiThu } from '../hooks/use-phan-tich-doi-thu';

/** Chuẩn hóa diem_manh/diem_yeu từ DoiThu (string[] | string cũ) → string[] */
function toStrList(v: string[] | string | null | undefined): string[] {
  if (v == null) return [];
  if (Array.isArray(v)) return v;
  const s = String(v).trim();
  return s ? [s] : [];
}

/** Chuyển DoiThu sang DoiThuFormValues để gửi update (chỉ cần khi cập nhật diem_manh/diem_yeu từ tab SWOT). */
function buildFormValuesFromDoiThu(d: DoiThu, overrides: { diem_manh: string[]; diem_yeu: string[] }): DoiThuFormValues {
  return {
    ten_doi_thu: d.ten_doi_thu,
    logo: d.logo ?? null,
    phan_loai: d.phan_loai,
    diem_manh_nhat: d.diem_manh_nhat ?? '',
    website: d.website ?? '',
    fanpage: d.fanpage ?? '',
    ghi_chu_nhan_dang: d.ghi_chu_nhan_dang ?? '',
    ten_cong_ty: d.ten_cong_ty ?? '',
    mst: d.mst ?? '',
    dia_chi: d.dia_chi ?? '',
    hotline: d.hotline ?? '',
    youtube: d.youtube ?? '',
    facebook: d.facebook ?? '',
    quy_mo: d.quy_mo ?? '',
    nam_thanh_lap: d.nam_thanh_lap ?? null,
    diem_manh: overrides.diem_manh.length ? overrides.diem_manh : null,
    diem_yeu: overrides.diem_yeu.length ? overrides.diem_yeu : null,
    phan_khuc: d.phan_khuc ?? '',
    san_pham: d.san_pham ?? '',
    linh_vuc_kinh_doanh: d.linh_vuc_kinh_doanh ?? '',
    thi_truong_muc_tieu: d.thi_truong_muc_tieu ?? '',
    so_nhan_vien: d.so_nhan_vien ?? '',
    von_dieu_le: d.von_dieu_le ?? '',
    thi_phan: d.thi_phan ?? '',
    nguon_goc: d.nguon_goc ?? '',
    nam_hoat_dong: d.nam_hoat_dong ?? '',
    dinh_vi: d.dinh_vi ?? '',
    cach_thuc_hoat_dong: d.cach_thuc_hoat_dong ?? '',
    kenh_phan_phoi: d.kenh_phan_phoi ?? '',
    chien_luoc_gia: d.chien_luoc_gia ?? '',
    marketing_truyen_thong: d.marketing_truyen_thong ?? '',
    the_manh: d.the_manh ?? '',
    tiktok: d.tiktok ?? '',
    link_khac: d.link_khac ?? '',
    ghi_chu_khac: d.ghi_chu_khac ?? '',
  };
}

interface Props {
  doiThuId: string;
  /** Dữ liệu đối thủ (để hiển thị/sửa điểm mạnh, điểm yếu). */
  data: DoiThu;
}

const TabBattlecard: React.FC<Props> = ({ doiThuId, data: doiThu }) => {
  const { t } = useTranslation();
  const { data: battlecard, isLoading } = useBattlecard(doiThuId);
  const updateBattlecardMutation = useUpdateBattlecard(doiThuId);
  const updateDoiThuMutation = useUpdateDoiThu();

  const [diemManhList, setDiemManhList] = useState<string[]>([]);
  const [diemYeuList, setDiemYeuList] = useState<string[]>([]);
  const [soSanh, setSoSanh] = useState<BattlecardDong[]>([]);
  const [kichBanXuLy, setKichBanXuLy] = useState<KichBanXuLyItem[]>([]);

  useEffect(() => {
    setDiemManhList(toStrList(doiThu.diem_manh));
    setDiemYeuList(toStrList(doiThu.diem_yeu));
  }, [doiThu.id, doiThu.diem_manh, doiThu.diem_yeu]);

  useEffect(() => {
    if (battlecard) {
      setSoSanh(
        battlecard.so_sanh.length
          ? battlecard.so_sanh
          : [{ id: '1', tinh_nang_dich_vu: '', giai_phap_minh: '', giai_phap_doi_thu: '' }]
      );
      setKichBanXuLy(Array.isArray(battlecard.kich_ban_xu_ly) && battlecard.kich_ban_xu_ly.length
        ? battlecard.kich_ban_xu_ly
        : []);
    }
  }, [battlecard]);

  const handleAddDong = () => {
    setSoSanh((prev) => [
      ...prev,
      {
        id: `row-${Date.now()}`,
        tinh_nang_dich_vu: '',
        giai_phap_minh: '',
        giai_phap_doi_thu: '',
      },
    ]);
  };

  const handleUpdateDong = (index: number, field: keyof BattlecardDong, value: string) => {
    setSoSanh((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleRemoveDong = (index: number) => {
    setSoSanh((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddKichBan = () => {
    setKichBanXuLy((prev) => [
      ...prev,
      { id: `kb-${Date.now()}`, noi_dung: '' },
    ]);
  };

  const handleUpdateKichBan = (index: number, noi_dung: string) => {
    setKichBanXuLy((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], noi_dung };
      return next;
    });
  };

  const handleRemoveKichBan = (index: number) => {
    setKichBanXuLy((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddDiemManh = () => setDiemManhList((prev) => [...prev, '']);
  const handleUpdateDiemManh = (index: number, value: string) => {
    setDiemManhList((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };
  const handleRemoveDiemManh = (index: number) => {
    setDiemManhList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddDiemYeu = () => setDiemYeuList((prev) => [...prev, '']);
  const handleUpdateDiemYeu = (index: number, value: string) => {
    setDiemYeuList((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };
  const handleRemoveDiemYeu = (index: number) => {
    setDiemYeuList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const battlecardPayload = {
      so_sanh: soSanh.filter(
        (r) => r.tinh_nang_dich_vu || r.giai_phap_minh || r.giai_phap_doi_thu
      ),
      diem_yeu_chi_mang: [] as string[],
      kich_ban_xu_ly: kichBanXuLy,
    };
    updateBattlecardMutation.mutate(battlecardPayload);
    const diemManhArr = diemManhList.map((s) => s.trim()).filter(Boolean);
    const diemYeuArr = diemYeuList.map((s) => s.trim()).filter(Boolean);
    const formValues = buildFormValuesFromDoiThu(doiThu, {
      diem_manh: diemManhArr,
      diem_yeu: diemYeuArr,
    });
    updateDoiThuMutation.mutate({ id: doiThuId, data: formValues });
  };

  if (isLoading || !battlecard) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-2">
      {/* Điểm mạnh / Điểm yếu đối thủ (SWOT) - nhiều mục */}
      <section className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-muted/40 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <ThumbsUp size={16} />
            </div>
            <h3 className="text-sm font-semibold text-foreground">
              {t('phanTichDoiThu.swot.diemManhDoiThu')}
            </h3>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={handleAddDiemManh}>
            <Plus size={14} className="mr-1.5" /> {BTN_ADD()}
          </Button>
        </div>
        <div className="p-4 space-y-2">
          {diemManhList.length === 0 ? (
            <p className="text-sm text-muted-foreground py-1">{t('phanTichDoiThu.swot.diemManhEmpty')}</p>
          ) : (
            diemManhList.map((item, index) => (
              <div key={`dm-${index}`} className="flex gap-2 items-center group">
                <span className="flex-shrink-0 w-6 h-8 flex items-center justify-center text-xs font-medium text-muted-foreground">
                  {index + 1}.
                </span>
                <Input
                  value={item}
                  onChange={(e) => handleUpdateDiemManh(index, e.target.value)}
                  placeholder={t('phanTichDoiThu.form.diemManhPlaceholder')}
                  className="flex-1 h-9 border border-border/60 rounded-lg bg-background text-sm"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveDiemManh(index)}
                  className="p-2 text-muted-foreground hover:text-rose-500 shrink-0 rounded-md"
                  title={t('common.delete')}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
        <div className="flex items-center justify-between px-4 py-3 bg-muted/40 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <ThumbsDown size={16} />
            </div>
            <h3 className="text-sm font-semibold text-foreground">
              {t('phanTichDoiThu.swot.diemYeuDoiThu')}
            </h3>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={handleAddDiemYeu}>
            <Plus size={14} className="mr-1.5" /> {BTN_ADD()}
          </Button>
        </div>
        <div className="p-4 space-y-2">
          {diemYeuList.length === 0 ? (
            <p className="text-sm text-muted-foreground py-1">{t('phanTichDoiThu.swot.diemYeuEmpty')}</p>
          ) : (
            diemYeuList.map((item, index) => (
              <div key={`dy-${index}`} className="flex gap-2 items-center group">
                <span className="flex-shrink-0 w-6 h-8 flex items-center justify-center text-xs font-medium text-muted-foreground">
                  {index + 1}.
                </span>
                <Input
                  value={item}
                  onChange={(e) => handleUpdateDiemYeu(index, e.target.value)}
                  placeholder={t('phanTichDoiThu.form.diemYeuPlaceholder')}
                  className="flex-1 h-9 border border-border/60 rounded-lg bg-background text-sm"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveDiemYeu(index)}
                  className="p-2 text-muted-foreground hover:text-rose-500 shrink-0 rounded-md"
                  title={t('common.delete')}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      {/* So sánh trực diện */}
      <section className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-muted/40 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <GitCompare size={16} />
            </div>
            <h3 className="text-sm font-semibold text-foreground">
              {t('phanTichDoiThu.detail.soSanh')}
            </h3>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={handleAddDong}>
            <Plus size={14} className="mr-1.5" /> {BTN_ADD()}
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[480px]">
            <thead>
              <tr className="bg-muted/50">
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground w-[28%] text-xs uppercase tracking-wide border-b border-border">
                  {t('phanTichDoiThu.detail.tinhNang')}
                </th>
                <th className="px-4 py-3 text-left font-semibold text-primary w-[36%] text-xs uppercase tracking-wide border-b border-l border-border bg-primary/5">
                  {t('phanTichDoiThu.detail.giaiPhapMinh')}
                </th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground w-[36%] text-xs uppercase tracking-wide border-b border-l border-border">
                  {t('phanTichDoiThu.detail.giaiPhapDoiThu')}
                </th>
                <th className="w-12 border-b border-l border-border" />
              </tr>
            </thead>
            <tbody>
              {soSanh.map((row, index) => (
                <tr key={row.id} className="border-b border-border last:border-b-0 hover:bg-muted/15 transition-colors">
                  <td className="px-4 py-3 align-middle">
                    <Input
                      value={row.tinh_nang_dich_vu}
                      onChange={(e) =>
                        handleUpdateDong(index, 'tinh_nang_dich_vu', e.target.value)
                      }
                      placeholder="Tính năng / dịch vụ"
                      className="h-9 border border-border/60 rounded-md bg-background text-sm focus-visible:ring-2"
                    />
                  </td>
                  <td className="px-4 py-3 align-middle border-l border-border bg-primary/5">
                    <Input
                      value={row.giai_phap_minh}
                      onChange={(e) =>
                        handleUpdateDong(index, 'giai_phap_minh', e.target.value)
                      }
                      placeholder="Giải pháp của chúng ta"
                      className="h-9 border border-primary/20 rounded-md bg-background text-sm focus-visible:ring-2"
                    />
                  </td>
                  <td className="px-4 py-3 align-middle border-l border-border">
                    <Input
                      value={row.giai_phap_doi_thu}
                      onChange={(e) =>
                        handleUpdateDong(index, 'giai_phap_doi_thu', e.target.value)
                      }
                      placeholder="Giải pháp đối thủ"
                      className="h-9 border border-border/60 rounded-md bg-background text-sm focus-visible:ring-2"
                    />
                  </td>
                  <td className="px-2 py-3 align-middle border-l border-border">
                    <button
                      type="button"
                      onClick={() => handleRemoveDong(index)}
                      className="p-2 text-muted-foreground hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md transition-colors"
                      title={t('common.delete')}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Kịch bản xử lý (Sales Script) - nhiều kịch bản */}
      <section className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-muted/40 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <MessageSquare size={16} />
            </div>
            <h3 className="text-sm font-semibold text-foreground">
              {t('phanTichDoiThu.detail.kichBanXuLy')}
            </h3>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={handleAddKichBan}>
            <Plus size={14} className="mr-1.5" /> {BTN_ADD()}
          </Button>
        </div>
        <div className="p-4 space-y-3">
          {kichBanXuLy.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">
              {t('phanTichDoiThu.detail.kichBanEmpty')}
            </p>
          ) : (
            kichBanXuLy.map((kb, index) => (
              <div
                key={kb.id}
                className="flex gap-2 rounded-lg border border-border/60 bg-muted/10 overflow-hidden group"
              >
                <span className="flex-shrink-0 w-7 h-7 rounded-l-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-center justify-center mt-0.5 ml-0.5">
                  {index + 1}
                </span>
                <Textarea
                  value={kb.noi_dung}
                  onChange={(e) => handleUpdateKichBan(index, e.target.value)}
                  rows={3}
                  className="flex-1 border-0 rounded-none bg-transparent py-2 text-sm focus-visible:ring-0 resize-y min-h-[72px]"
                  placeholder="Câu phản đòn mẫu khi khách so sánh với đối thủ..."
                />
                <button
                  type="button"
                  onClick={() => handleRemoveKichBan(index)}
                  className="p-2 text-muted-foreground hover:text-rose-500 shrink-0 self-start"
                  title={t('common.delete')}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      <div className="sticky bottom-0 left-0 right-0 py-3 flex justify-end bg-background/95 border-t border-border -mx-1 px-1 mt-2">
        <Button
          onClick={handleSave}
          disabled={updateBattlecardMutation.isPending || updateDoiThuMutation.isPending}
          className="min-w-[140px]"
        >
          <Save size={16} className="mr-2" /> {t('phanTichDoiThu.swot.luuSwot')}
        </Button>
      </div>
    </div>
  );
};

export default TabBattlecard;
