import React, { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import { Edit, Trash2, Users, FileText, ArrowUpFromLine, Calendar, Power, MapPin, Phone, Mail, Folder, Tag, X } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Select from '../../../../components/ui/Select';
import MultiSelect from '../../../../components/ui/MultiSelect';
import type { NhaCungCap } from '../core/types';
import { formatDateShort } from '../../../../lib/utils';
import GenericDrawer, { DRAWER_WIDTH_DETAIL } from '../../../../components/shared/GenericDrawer';
import DetailSection from '../../../../components/shared/DetailSection';
import DetailField from '../../../../components/shared/DetailField';
import DetailFieldGrid from '../../../../components/shared/DetailFieldGrid';
import DetailToolbar, { DetailToolbarAction } from '../../../../components/shared/DetailToolbar';
import { useTagList, useCreateTag } from '../hooks/use-nha-cung-cap';
import { BTN_CLOSE, BTN_EDIT, BTN_DELETE } from '../../../../lib/button-labels';

interface Props {
  data: NhaCungCap;
  onClose: () => void;
  onEdit: (item: NhaCungCap) => void;
  onDelete: (id: string) => void;
  onStatusChange?: (item: NhaCungCap, newStatus: 0 | 1) => void;
  onSaveTags?: (item: NhaCungCap, tagIds: string[]) => void;
}

const NhaCungCapDetail: React.FC<Props> = ({ data, onClose, onEdit, onDelete, onStatusChange, onSaveTags }) => {
  const { t } = useTranslation();
  const isActive = data.trang_thai === 1;
  const [showStatusPopup, setShowStatusPopup] = useState(false);
  const [showTagsPopup, setShowTagsPopup] = useState(false);
  const [statusValue, setStatusValue] = useState(String(data.trang_thai));
  const [tagIdsToEdit, setTagIdsToEdit] = useState<string[]>(data.tag_ids ?? []);

  const { data: tagList = [] } = useTagList();
  const createTagMutation = useCreateTag();

  useEffect(() => {
    setStatusValue(String(data.trang_thai));
    setTagIdsToEdit(data.tag_ids ?? []);
  }, [data.id, data.trang_thai, data.tag_ids]);

  const tagOptions = useMemo(
    () => tagList.map((tag) => ({ label: tag.ten_tag, value: tag.id })),
    [tagList]
  );

  const toolbarActions: DetailToolbarAction[] = useMemo(() => {
    const actions: DetailToolbarAction[] = [];
    if (onStatusChange) {
      actions.push({
        label: isActive ? t('nhaCungCapMuaHang.detail.changeStatusToInactive') : t('nhaCungCapMuaHang.detail.changeStatusToActive'),
        icon: <Power size={16} />,
        onClick: () => {
          setStatusValue(String(data.trang_thai));
          setShowStatusPopup(true);
        },
        variant: isActive ? 'warning' : 'success',
      });
    }
    if (onSaveTags) {
      actions.push({
        label: t('nhaCungCapMuaHang.detail.editTags'),
        icon: <Tag size={16} />,
        onClick: () => {
          setTagIdsToEdit(data.tag_ids ?? []);
          setShowTagsPopup(true);
        },
        variant: 'info',
      });
    }
    return actions;
  }, [data, isActive, onStatusChange, onSaveTags, t]);

  const handleStatusConfirm = () => {
    const newStatus = Number(statusValue) === 1 ? 1 : 0;
    onStatusChange?.(data, newStatus as 0 | 1);
    setShowStatusPopup(false);
  };

  const handleTagsSave = () => {
    onSaveTags?.(data, tagIdsToEdit);
    setShowTagsPopup(false);
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
    <>
      <GenericDrawer
        title={t('nhaCungCapMuaHang.detail.title')}
        subtitle={data.ma_ncc}
        icon={<Users size={18} />}
        onClose={onClose}
        footer={renderFooter}
        maxWidthClass={DRAWER_WIDTH_DETAIL}
      >
        <div className="space-y-5">
          <div className="bg-card p-4 rounded-xl border border-border/50 shadow-sm flex items-center gap-4">
            <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white shadow-primary/20 shadow-lg shrink-0">
              <Users size={24} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold text-foreground leading-tight truncate">{data.ten_ncc}</h2>
              <p className="text-body-sm text-muted-foreground font-mono mt-0.5">{data.ma_ncc}</p>
              <div className="mt-1.5">
                {isActive ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" /> {t('common.activeStatus')}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-medium border border-border">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" /> {t('common.inactiveStatus')}
                  </span>
                )}
              </div>
            </div>
          </div>

          {toolbarActions.length > 0 && (
            <div className="flex justify-center">
              <DetailToolbar actions={toolbarActions} columns={2} className="bg-card rounded-xl border border-border w-fit" />
            </div>
          )}

          <DetailSection title={t('nhaCungCapMuaHang.detail.basicInfo')} icon={<Users size={14} />} variant="primary">
            <DetailFieldGrid>
              <DetailField label={t('nhaCungCapMuaHang.form.name')} value={data.ten_ncc} icon={<Users size={12} />} />
              <DetailField label={t('nhaCungCapMuaHang.form.code')} value={data.ma_ncc} icon={<Users size={12} />} />
              <DetailField
                label={t('nhaCungCapMuaHang.detail.group')}
                value={data.ten_nhom ?? ''}
                icon={<Folder size={12} />}
                emptyText={t('nhaCungCapMuaHang.detail.noGroup')}
              />
              <DetailField
                label={t('nhaCungCapMuaHang.form.address')}
                value={data.dia_chi ?? ''}
                icon={<MapPin size={12} />}
                emptyText="—"
              />
              <DetailField
                label={t('nhaCungCapMuaHang.form.phone')}
                value={data.dien_thoai ?? ''}
                icon={<Phone size={12} />}
                emptyText="—"
              />
              <DetailField
                label={t('nhaCungCapMuaHang.form.email')}
                value={data.email ?? ''}
                icon={<Mail size={12} />}
                emptyText="—"
              />
              <DetailField
                label={t('nhaCungCapMuaHang.detail.tags')}
                value={
                  (data.ten_tags ?? []).length === 0 ? undefined : (
                    <div className="flex flex-wrap gap-1">
                      {(data.ten_tags ?? []).map((name) => (
                        <span
                          key={name}
                          className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  )
                }
                emptyText="—"
              />
              <DetailField label={t('nhaCungCapMuaHang.detail.order')} value={String(data.thu_tu)} icon={<ArrowUpFromLine size={12} />} />
              <DetailField
                label={t('nhaCungCapMuaHang.detail.description')}
                value={data.mo_ta ?? ''}
                icon={<FileText size={12} />}
                emptyText="—"
              />
              <DetailField
                label={t('common.status')}
                value={isActive ? t('common.activeStatus') : t('common.inactiveStatus')}
                icon={<Power size={12} />}
              />
            </DetailFieldGrid>
          </DetailSection>

          <DetailSection title={t('nhaCungCapMuaHang.detail.systemInfo')} icon={<Calendar size={14} />} variant="primary">
            <DetailFieldGrid>
              <DetailField label={t('nhaCungCapMuaHang.detail.createdAt')} value={formatDateShort(data.tg_tao)} icon={<Calendar size={12} />} />
              <DetailField label={t('nhaCungCapMuaHang.detail.updatedAt')} value={formatDateShort(data.tg_cap_nhat)} icon={<Calendar size={12} />} />
            </DetailFieldGrid>
          </DetailSection>
        </div>
      </GenericDrawer>

      {/* Popup: Chuyển trạng thái */}
      <AnimatePresence>
        {showStatusPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50"
            onClick={() => setShowStatusPopup(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card rounded-xl border border-border shadow-xl max-w-md w-full p-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">
                  {t('nhaCungCapMuaHang.detail.changeStatusTitle')}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowStatusPopup(false)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="space-y-4">
                <Select
                  label={t('common.status')}
                  value={statusValue}
                  onChange={(e) => setStatusValue(e.target.value)}
                  options={[
                    { value: '1', label: t('common.activeStatus') },
                    { value: '0', label: t('common.inactiveStatus') },
                  ]}
                />
              </div>
              <div className="flex justify-end gap-2 mt-5">
                <Button
                  variant="ghost"
                  onClick={() => setShowStatusPopup(false)}
                  className="border border-border"
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  onClick={handleStatusConfirm}
                  className="bg-primary text-white"
                >
                  {t('common.confirm')}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Popup: Gắn lại tag */}
      <AnimatePresence>
        {showTagsPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50"
            onClick={() => setShowTagsPopup(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card rounded-xl border border-border shadow-xl max-w-md w-full p-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">
                  {t('nhaCungCapMuaHang.detail.editTagsTitle')}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowTagsPopup(false)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="space-y-4">
                <MultiSelect
                  label={t('nhaCungCapMuaHang.form.tags')}
                  options={tagOptions}
                  value={tagIdsToEdit}
                  onChange={setTagIdsToEdit}
                  placeholder={t('nhaCungCapMuaHang.form.tagsPlaceholder')}
                  createOptionLabel={t('nhaCungCapMuaHang.form.createTagLabel')}
                  onCreateOption={async (label) => {
                    const tag = await createTagMutation.mutateAsync(label);
                    return tag.id;
                  }}
                />
              </div>
              <div className="flex justify-end gap-2 mt-5">
                <Button
                  variant="ghost"
                  onClick={() => setShowTagsPopup(false)}
                  className="border border-border"
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  onClick={handleTagsSave}
                  className="bg-primary text-white"
                >
                  {t('common.confirm')}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default NhaCungCapDetail;
