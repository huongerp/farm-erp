import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit2, Trash2, Building2, Swords, History, ExternalLink, FileText } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import GenericDrawer, { DRAWER_WIDTH_DETAIL } from '../../../../components/shared/GenericDrawer';
import TabGroup from '../../../../components/ui/TabGroup';
import TabHoSo from './TabHoSo';
import TabTaiLieu from './TabTaiLieu';
import TabBattlecard from './TabBattlecard';
import TabNhatKy from './TabNhatKy';
import { LOAI_DOI_THU_LABELS } from '../core/constants';
import type { DoiThu } from '../core/types';
import type { LoaiDoiThu } from '../core/constants';
import { cn } from '../../../../lib/utils';

const PHAN_LOAI_BADGE_CLASS: Record<LoaiDoiThu, string> = {
  dau_nganh: 'bg-primary/10 text-primary border-primary/20',
  truc_tiep: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  tiem_nang: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
};
import { BTN_CLOSE, BTN_EDIT, BTN_DELETE } from '../../../../lib/button-labels';

const TAB_HO_SO = 'ho-so';
const TAB_TAI_LIEU = 'tai-lieu';
const TAB_SWOT = 'swot';
const TAB_NHAT_KY = 'nhat-ky';

interface Props {
  data: DoiThu;
  onClose: () => void;
  onEdit: (item: DoiThu) => void;
  onDelete: (id: string) => void;
}

const PhanTichDoiThuDetailDrawer: React.FC<Props> = ({
  data,
  onClose,
  onEdit,
  onDelete,
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(TAB_HO_SO);

  const tabs = [
    { id: TAB_HO_SO, label: t('phanTichDoiThu.tab.hoSo'), icon: Building2 },
    { id: TAB_TAI_LIEU, label: t('phanTichDoiThu.tab.taiLieu'), icon: FileText },
    { id: TAB_SWOT, label: t('phanTichDoiThu.tab.swot'), icon: Swords },
    { id: TAB_NHAT_KY, label: t('phanTichDoiThu.tab.nhatKy'), icon: History },
  ];

  const handleEdit = () => {
    onEdit(data);
    onClose();
  };

  const handleDelete = () => {
    onDelete(data.id);
    onClose();
  };

  const footer = (
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
          onClick={handleEdit}
          className="bg-primary text-white shadow-lg hover:bg-primary/90"
        >
          <Edit2 size={16} className="mr-2" /> {BTN_EDIT()}
        </Button>
        <Button
          variant="ghost"
          onClick={handleDelete}
          className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/50 dark:text-rose-400 border border-rose-200 hover:border-rose-300 dark:border-rose-800 dark:hover:border-rose-700"
        >
          <Trash2 size={16} className="mr-2" /> {BTN_DELETE()}
        </Button>
      </div>
    </div>
  );

  return (
    <GenericDrawer
      title={t('phanTichDoiThu.detail.title')}
      subtitle={data.ten_doi_thu}
      icon={<Building2 size={18} />}
      onClose={onClose}
      footer={footer}
      maxWidthClass={DRAWER_WIDTH_DETAIL}
    >
      <div className="flex flex-col gap-4">
        {/* Summary card */}
        <div className="rounded-xl border border-border bg-gradient-to-br from-muted/40 to-muted/20 p-4 shadow-sm">
          <div className="flex items-start gap-4">
            {data.logo ? (
              <img
                src={data.logo}
                alt=""
                className="w-14 h-14 rounded-xl border-2 border-card shadow-md object-cover shrink-0"
              />
            ) : (
              <div className="w-14 h-14 rounded-xl border-2 border-dashed border-border bg-muted/50 flex items-center justify-center shrink-0">
                <Building2 className="w-7 h-7 text-muted-foreground" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span
                  className={cn(
                    'text-xs font-medium px-2 py-0.5 rounded-md border',
                    PHAN_LOAI_BADGE_CLASS[data.phan_loai as LoaiDoiThu] ?? 'bg-muted/50 text-muted-foreground border-border'
                  )}
                >
                  {LOAI_DOI_THU_LABELS[data.phan_loai as LoaiDoiThu] ?? data.phan_loai}
                </span>
              </div>
              <p className="text-sm text-foreground/90 line-clamp-2">
                {data.diem_manh_nhat ?? '—'}
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {data.website && (
                  <a
                    href={data.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink size={12} /> Web
                  </a>
                )}
                {data.fanpage && (
                  <a
                    href={data.fanpage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink size={12} /> Fanpage
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <TabGroup tabs={tabs} activeTab={activeTab} onChange={setActiveTab} className="w-full flex flex-wrap" />

        <div className="min-h-[320px] overflow-auto custom-scrollbar -mx-1 px-1">
          {activeTab === TAB_HO_SO && <TabHoSo data={data} />}
          {activeTab === TAB_TAI_LIEU && <TabTaiLieu doiThuId={data.id} />}
          {activeTab === TAB_SWOT && <TabBattlecard doiThuId={data.id} data={data} />}
          {activeTab === TAB_NHAT_KY && <TabNhatKy doiThuId={data.id} />}
        </div>
      </div>
    </GenericDrawer>
  );
};

export default PhanTichDoiThuDetailDrawer;
