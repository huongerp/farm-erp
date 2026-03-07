import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Shield } from 'lucide-react';
import GenericDrawer from '../../../../components/shared/GenericDrawer';
import Button from '../../../../components/ui/Button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPositions } from '../../../he-thong/chuc-vu/services/chuc-vu-service';
import { getQuyenByHangMuc, setQuyenHangMuc } from '../services/hang-muc-quyen-service';
import { toast } from 'sonner';
import i18n from '../../../../lib/i18n';
import { cn } from '../../../../lib/utils';

interface Props {
  idHangMuc: string;
  tenHangMuc: string;
  loaiQuyen: 'quan_ly' | 'de_xuat';
  onClose: () => void;
}

const HangMucQuyenDrawer: React.FC<Props> = ({
  idHangMuc,
  tenHangMuc,
  loaiQuyen,
  onClose,
}) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: positions = [], isLoading: loadingPositions } = useQuery({
    queryKey: ['positions'],
    queryFn: getPositions,
    staleTime: 1000 * 60 * 5,
  });

  const { data: quyenData, isLoading: loadingQuyen } = useQuery({
    queryKey: ['hang-muc-quyen', idHangMuc],
    queryFn: () => getQuyenByHangMuc(idHangMuc),
  });

  const selectedIds = useMemo(() => {
    if (!quyenData) return new Set<string>();
    const list = loaiQuyen === 'quan_ly' ? quyenData.quan_ly : quyenData.de_xuat;
    return new Set(list);
  }, [quyenData, loaiQuyen]);

  const [localSelected, setLocalSelected] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    setLocalSelected(selectedIds);
  }, [selectedIds]);

  const mutation = useMutation({
    mutationFn: (idChucVuList: string[]) =>
      setQuyenHangMuc(idHangMuc, loaiQuyen, idChucVuList),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hang-muc-quyen', idHangMuc] });
      toast.success(i18n.t('danhMucTaiChinh.quyen.saveSuccess'));
      onClose();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const toggle = (id: string) => {
    setLocalSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setLocalSelected(new Set(positions.filter((p) => p.trang_thai === 1).map((p) => p.id)));
  };

  const clearAll = () => setLocalSelected(new Set());

  const handleSave = () => {
    mutation.mutate(Array.from(localSelected));
  };

  const title =
    loaiQuyen === 'quan_ly'
      ? t('danhMucTaiChinh.quyen.drawerTitleQuanLy', { name: tenHangMuc })
      : t('danhMucTaiChinh.quyen.drawerTitleDeXuat', { name: tenHangMuc });

  const activePositions = useMemo(
    () => positions.filter((p) => p.trang_thai === 1),
    [positions]
  );

  return (
    <GenericDrawer
      title={title}
      icon={<Shield size={20} />}
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSave} disabled={mutation.isPending}>
            {mutation.isPending ? t('common.saving') : t('common.save')}
          </Button>
        </div>
      }
      maxWidthClass="max-w-md"
    >
      <div className="space-y-4">
        {(loadingPositions || loadingQuyen) ? (
          <div className="text-sm text-muted-foreground py-4">
            {t('common.loading')}
          </div>
        ) : (
          <>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={selectAll}>
                {t('danhMucTaiChinh.quyen.selectAll')}
              </Button>
              <Button variant="ghost" size="sm" onClick={clearAll}>
                {t('danhMucTaiChinh.quyen.clearAll')}
              </Button>
            </div>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto custom-scrollbar pr-1">
              {activePositions.map((pos) => (
                <label
                  key={pos.id}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                    localSelected.has(pos.id)
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted/50'
                  )}
                >
                  <input
                    type="checkbox"
                    checked={localSelected.has(pos.id)}
                    onChange={() => toggle(pos.id)}
                    className="w-4 h-4 rounded border-border text-primary accent-primary"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-foreground truncate">
                      {pos.ten_chuc_vu}
                    </div>
                    {pos.ten_phong_ban && (
                      <div className="text-xs text-muted-foreground truncate">
                        {pos.ten_phong_ban}
                      </div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </>
        )}
      </div>
    </GenericDrawer>
  );
};

export default HangMucQuyenDrawer;
