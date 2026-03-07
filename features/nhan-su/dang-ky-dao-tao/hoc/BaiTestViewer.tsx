import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileQuestion } from 'lucide-react';
import Button from '@/components/ui/Button';
import type { CauHoi } from '@/features/nhan-su/khoa-dao-tao/thiet-lap/core/types';
import type { DapAnNop } from '../../services/dang-ky-dao-tao-service';

interface Props {
  cauHoiList: CauHoi[];
  onSubmit: (dapAn: DapAnNop) => void;
  isSubmitting?: boolean;
  ketQua?: { diem: number; dat: boolean } | null;
}

const BaiTestViewer: React.FC<Props> = ({
  cauHoiList,
  onSubmit,
  isSubmitting,
  ketQua,
}) => {
  const { t } = useTranslation();
  const [dapAn, setDapAn] = useState<DapAnNop>({});

  const handleTracNghiemChange = (idCauHoi: string, optionIndex: number) => {
    setDapAn((prev) => ({ ...prev, [idCauHoi]: optionIndex }));
  };
  const handleTuLuanChange = (idCauHoi: string, value: string) => {
    setDapAn((prev) => ({ ...prev, [idCauHoi]: value }));
  };

  const handleSubmit = () => {
    onSubmit(dapAn);
  };

  return (
    <div className="space-y-5 p-4">
      <div className="bg-card p-4 rounded-xl border border-border/50 shadow-sm">
        <h2 className="text-base font-bold text-foreground flex items-center gap-2">
          <FileQuestion size={20} className="text-amber-500" />
          {t('dangKyDaoTao.baiTest')}
        </h2>
        {ketQua != null && (
          <p className="text-sm text-muted-foreground mt-2">
            {t('dangKyDaoTao.diem')}: {ketQua.diem}% —{' '}
            {ketQua.dat ? t('dangKyDaoTao.dat') : t('dangKyDaoTao.chuaDat')}
          </p>
        )}
      </div>

      <div className="space-y-6">
        {cauHoiList.map((cq, index) => (
          <div
            key={cq.id}
            className="bg-card p-4 rounded-xl border border-border shadow-sm"
          >
            <p className="text-sm font-medium text-foreground mb-3">
              {index + 1}. {cq.noi_dung}
            </p>
            {cq.loai === 'trac_nghiem' && (cq.dap_an_options?.length ?? 0) > 0 && (
              <ul className="space-y-2">
                {cq.dap_an_options!.map((opt, optIndex) => (
                  <li key={optIndex}>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name={`cq-${cq.id}`}
                        checked={dapAn[cq.id] === optIndex}
                        onChange={() => handleTracNghiemChange(cq.id, optIndex)}
                        className="rounded-full border-border text-primary focus:ring-primary/20"
                      />
                      <span className="text-sm text-foreground">{opt.label}</span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
            {cq.loai === 'tu_luan' && (
              <textarea
                value={typeof dapAn[cq.id] === 'string' ? dapAn[cq.id] : ''}
                onChange={(e) => handleTuLuanChange(cq.id, e.target.value)}
                placeholder={t('dangKyDaoTao.nhapCauTraLoi')}
                className="w-full min-h-[100px] rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                rows={4}
              />
            )}
          </div>
        ))}
      </div>

      {ketQua == null && (
        <div className="flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-primary text-white hover:bg-primary/90"
          >
            {isSubmitting ? t('common.saving') : t('dangKyDaoTao.nopBai')}
          </Button>
        </div>
      )}
    </div>
  );
};

export default BaiTestViewer;
