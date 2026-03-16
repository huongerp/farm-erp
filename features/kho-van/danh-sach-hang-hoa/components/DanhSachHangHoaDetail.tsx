import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Edit, Trash2, Package, ArrowUpFromLine, Calendar, Power, Folder, DollarSign, Plus, Warehouse, FileText } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import type { HangHoa } from '../core/types';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';
import { formatDateShort, formatNumberVN } from '../../../../lib/utils';
import GenericDrawer, { DRAWER_WIDTH_DETAIL } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import { DRAWER_WIDTH_DETAIL_SMALL } from '../../../../lib/dialog-sizes';
import DetailSection from '../../../../components/shared/DetailSection';
import DetailField from '../../../../components/shared/DetailField';
import DetailFieldGrid from '../../../../components/shared/DetailFieldGrid';
import { BTN_CLOSE, BTN_EDIT, BTN_DELETE } from '../../../../lib/button-labels';
import { useDinhMucByHangHoa, useCreateDinhMucTonKho, useUpdateDinhMucTonKho, useDeleteDinhMucTonKho } from '../../ton-kho/hooks/use-ton-kho';
import { getKhoList } from '../../danh-sach-kho/services/kho-service';
import type { Kho } from '../../danh-sach-kho/core/types';
import type { DinhMucTonKhoRow } from '../../phieu-kho/services/ton-kho-service';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { CONFIRM_DELETE } from '../../../../lib/button-labels';

interface Props {
  data: HangHoa;
  onClose: () => void;
  onEdit?: (item: HangHoa) => void;
  onDelete?: (id: string) => void;
}

const DanhSachHangHoaDetail: React.FC<Props> = ({
  data,
  onClose,
  onEdit,
  onDelete,
}) => {
  const { t } = useTranslation();
  const confirm = useConfirmStore((s) => s.confirm);
  const isActive = data.trang_thai === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG;

  const { data: dinhMucList = [], isLoading: loadingDinhMuc } = useDinhMucByHangHoa(data.id);
  const { data: khoList = [] } = useQuery<Kho[]>({ queryKey: ['kho'], queryFn: getKhoList });
  const [showDinhMucForm, setShowDinhMucForm] = useState(false);
  const [editingDinhMuc, setEditingDinhMuc] = useState<DinhMucTonKhoRow | null>(null);

  const khoMap = React.useMemo(() => {
    const m: Record<string, Kho> = {};
    khoList.forEach((k) => { m[k.id] = k; });
    return m;
  }, [khoList]);

  const createDinhMuc = useCreateDinhMucTonKho();
  const updateDinhMuc = useUpdateDinhMucTonKho();
  const deleteDinhMuc = useDeleteDinhMucTonKho();

  const handleDeleteDinhMuc = (row: DinhMucTonKhoRow) => {
    confirm({
      title: t('hangHoa.dinhMuc.delete'),
      message: `${khoMap[row.kho_id]?.ten_kho ?? row.kho_id} · ${row.ton_toi_thieu}`,
      variant: 'danger',
      confirmText: CONFIRM_DELETE(),
      onConfirm: () => {
        deleteDinhMuc.mutate(row.id, {
          onSuccess: () => toast.success(t('hangHoa.dinhMuc.toastDeleteSuccess')),
          onError: (err: Error) => toast.error(err.message),
        });
      },
    });
  };

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
        {onEdit && (
          <Button
            onClick={() => {
              onEdit(data);
              onClose();
            }}
            className="bg-primary text-white shadow-lg hover:bg-primary/90"
          >
            <Edit size={16} className="mr-2" /> {BTN_EDIT()}
          </Button>
        )}
        {onDelete && (
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
        )}
      </div>
    </div>
  );

  return (
    <GenericDrawer
      title={t('hangHoa.detail.title')}
      subtitle={data.ma_hang_hoa}
      icon={<Package size={18} />}
      onClose={onClose}
      footer={renderFooter}
      maxWidthClass={DRAWER_WIDTH_DETAIL}
    >
      <div className="space-y-5">
        <div className="bg-card p-4 rounded-xl border border-border/50 shadow-sm flex items-center gap-4">
          {data.hinh_anh ? (
            <img
              src={data.hinh_anh}
              alt=""
              className="h-14 w-14 rounded-xl object-cover border border-border shrink-0"
            />
          ) : (
            <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white shadow-primary/20 shadow-lg shrink-0">
              <Package size={24} className="text-white" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-foreground leading-tight truncate">{data.ten_hang_hoa}</h2>
            <p className="text-body-sm text-muted-foreground font-mono mt-0.5">{data.ma_hang_hoa}</p>
            <div className="mt-1.5">
              {isActive ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" /> {t('hangHoa.active')}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-medium border border-border">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" /> {t('hangHoa.inactive')}
                </span>
              )}
            </div>
          </div>
        </div>

        <DetailSection title={t('hangHoa.detail.basicInfo')} icon={<Package size={14} />} variant="primary">
          <DetailFieldGrid cols={2}>
            <DetailField label={t('hangHoa.form.code')} value={data.ma_hang_hoa} icon={<Package size={12} />} />
            <DetailField label={t('hangHoa.form.name')} value={data.ten_hang_hoa} icon={<Package size={12} />} />
            <DetailField
              label={t('hangHoa.detail.category')}
              value={data.ten_danh_muc ?? ''}
              icon={<Folder size={12} />}
              emptyText={t('hangHoa.detail.noCategory')}
            />
            <DetailField
              label={t('hangHoa.detail.unit')}
              value={data.dvt ?? ''}
              icon={<Package size={12} />}
              emptyText="—"
            />
            <DetailField
              label={t('hangHoa.form.price')}
              value={data.don_gia != null ? data.don_gia.toLocaleString('vi-VN') : ''}
              icon={<DollarSign size={12} />}
              emptyText="—"
            />
            <DetailField label={t('hangHoa.detail.order')} value={String(data.thu_tu)} icon={<ArrowUpFromLine size={12} />} />
            <DetailField
              label={t('common.status')}
              value={isActive ? t('hangHoa.active') : t('hangHoa.inactive')}
              icon={<Power size={12} />}
            />
            {data.mo_ta != null && data.mo_ta !== '' && (
              <DetailField
                label={t('hangHoa.detail.description')}
                value={data.mo_ta}
                icon={<FileText size={12} />}
                className="col-span-1 sm:col-span-2"
              />
            )}
          </DetailFieldGrid>
        </DetailSection>

        <DetailSection title={t('hangHoa.detail.systemInfo')} icon={<Calendar size={14} />} variant="primary">
          <DetailFieldGrid>
            <DetailField label={t('hangHoa.detail.createdAt')} value={formatDateShort(data.tg_tao)} icon={<Calendar size={12} />} />
            <DetailField label={t('hangHoa.detail.updated')} value={formatDateShort(data.tg_cap_nhat)} icon={<Calendar size={12} />} />
          </DetailFieldGrid>
        </DetailSection>

        <DetailSection
          title={t('hangHoa.detail.dinhMucSection')}
          icon={<Warehouse size={14} />}
          variant="primary"
          action={
            <Button size="sm" onClick={() => { setEditingDinhMuc(null); setShowDinhMucForm(true); }} className="bg-primary text-white">
              <Plus className="w-4 h-4 mr-1" /> {t('hangHoa.dinhMuc.add')}
            </Button>
          }
        >
          {loadingDinhMuc ? (
            <p className="text-sm text-muted-foreground">{t('hangHoa.loading')}</p>
          ) : dinhMucList.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">{t('hangHoa.detail.dinhMucEmpty')}</p>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-muted-foreground">{t('hangHoa.dinhMuc.kho')}</th>
                    <th className="px-3 py-2 text-right font-semibold text-muted-foreground">{t('hangHoa.dinhMuc.tonToiThieu')}</th>
                    <th className="px-3 py-2 text-right w-20">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {dinhMucList.map((row) => (
                    <tr key={row.id} className="hover:bg-muted/30">
                      <td className="px-3 py-2">{khoMap[row.kho_id]?.ten_kho ?? row.kho_id}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{formatNumberVN(row.ton_toi_thieu)}</td>
                      <td className="px-3 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => { setEditingDinhMuc(row); setShowDinhMucForm(true); }}
                          className="p-1 text-primary hover:bg-primary/10 rounded"
                          title={t('hangHoa.dinhMuc.edit')}
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteDinhMuc(row)}
                          className="p-1 text-rose-500 hover:bg-rose-50 rounded ml-0.5"
                          title={t('hangHoa.dinhMuc.delete')}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DetailSection>
      </div>

      {showDinhMucForm && (
        <DinhMucDetailFormDrawer
          hangHoaId={data.id}
          khoList={khoList}
          existingKhoIds={dinhMucList.map((r) => r.kho_id)}
          editingRow={editingDinhMuc}
          onClose={() => { setShowDinhMucForm(false); setEditingDinhMuc(null); }}
          onCreate={(payload) => {
            createDinhMuc.mutate(payload, {
              onSuccess: () => { toast.success(t('hangHoa.dinhMuc.toastCreateSuccess')); setShowDinhMucForm(false); },
              onError: (err: Error) => toast.error(err.message),
            });
          }}
          onUpdate={(id, ton_toi_thieu) => {
            updateDinhMuc.mutate({ id, ton_toi_thieu }, {
              onSuccess: () => { toast.success(t('hangHoa.dinhMuc.toastUpdateSuccess')); setShowDinhMucForm(false); setEditingDinhMuc(null); },
              onError: (err: Error) => toast.error(err.message),
            });
          }}
        />
      )}
    </GenericDrawer>
  );
};

interface DinhMucDetailFormDrawerProps {
  hangHoaId: string;
  khoList: Kho[];
  existingKhoIds: string[];
  editingRow: DinhMucTonKhoRow | null;
  onClose: () => void;
  onCreate: (payload: { kho_id: string; hang_hoa_id: string; ton_toi_thieu: number }) => void;
  onUpdate: (id: string, ton_toi_thieu: number) => void;
}

const DinhMucDetailFormDrawer: React.FC<DinhMucDetailFormDrawerProps> = ({
  hangHoaId,
  khoList,
  existingKhoIds,
  editingRow,
  onClose,
  onCreate,
  onUpdate,
}) => {
  const { t } = useTranslation();
  const [khoId, setKhoId] = useState(editingRow?.kho_id ?? '');
  const [tonToiThieu, setTonToiThieu] = useState(editingRow?.ton_toi_thieu ?? 0);
  const isEdit = !!editingRow;
  const khoOptions = khoList.filter((k) => isEdit || !existingKhoIds.includes(k.id));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(tonToiThieu);
    if (Number.isNaN(num) || num < 0) return;
    if (isEdit) {
      onUpdate(editingRow.id, num);
    } else {
      if (!khoId) return;
      onCreate({ kho_id: khoId, hang_hoa_id: hangHoaId, ton_toi_thieu: num });
    }
  };

  return (
    <GenericDrawer
      title={isEdit ? t('hangHoa.dinhMuc.formEditTitle') : t('hangHoa.dinhMuc.formTitle')}
      icon={<Warehouse size={20} />}
      onClose={onClose}
      maxWidthClass={DRAWER_WIDTH_DETAIL_SMALL}
      stackLevel={1}
      footer={
        <FormDrawerFooter
          formId="dinh-muc-detail-form"
          onCancel={onClose}
          isEdit={isEdit}
          saveLabel={t('common.save')}
          createLabel={t('hangHoa.dinhMuc.add')}
        />
      }
    >
      <form id="dinh-muc-detail-form" onSubmit={handleSubmit}>
        <FormSection title={t('hangHoa.detail.dinhMucSection')} icon={<Warehouse size={14} />} variant="primary">
          <div className="space-y-4">
            {!isEdit && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">{t('hangHoa.dinhMuc.kho')}</label>
                <select
                  value={khoId}
                  onChange={(e) => setKhoId(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  required
                >
                  <option value="">{t('hangHoa.dinhMuc.selectKho')}</option>
                  {khoOptions.map((k) => (
                    <option key={k.id} value={k.id}>{k.ten_kho} ({k.ma_kho})</option>
                  ))}
                </select>
                {khoOptions.length === 0 && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">{t('hangHoa.dinhMuc.allKhoSet')}</p>
                )}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">{t('hangHoa.dinhMuc.tonToiThieu')}</label>
              <input
                type="number"
                min={0}
                step="any"
                value={tonToiThieu}
                onChange={(e) => setTonToiThieu(Number(e.target.value) || 0)}
                className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>
        </FormSection>
      </form>
    </GenericDrawer>
  );
};

export default DanhSachHangHoaDetail;
