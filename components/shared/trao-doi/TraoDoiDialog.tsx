import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MessagesSquare } from 'lucide-react';
import GenericDrawer from '../GenericDrawer';
import FormDrawerFooter from '../FormDrawerFooter';
import Button from '../../ui/Button';
import Textarea from '../../ui/Textarea';
import { DIALOG_SIZE } from '../../../lib/dialog-sizes';
import { chotTraoDoi, dongMoiTraoDoi, soanSanTraoDoi, tachTraoDoi } from '../../../lib/trao-doi-log';
import { nowTz } from '../../../lib/utils';
import { useAuthStore } from '../../../store/useStore';
import { useConfirmStore } from '../../../store/useConfirmStore';
import { hienThiThoiDiemTraoDoi } from './hien-thi';

interface Props {
  /** Tên hàng của dòng — phụ đề popup. */
  tenDong: string;
  traoDoi: string | null | undefined;
  /** Không phải cấp cao: chỉ xem lịch sử. */
  readOnly?: boolean;
  dangLuu?: boolean;
  /** Ghi đè cả log; `cu` là giá trị lúc mở popup (DB đối chiếu để không đè bản người khác vừa ghi). */
  onSave?: (giaTri: string | null, cu: string | null) => void;
  onClose: () => void;
}

/**
 * Trao đổi của một dòng hàng. Sửa: ô chứa sẵn log cũ + dòng `[dd/mm/yyyy HH:mm] Tên: ` ở cuối,
 * xuống dòng / sửa / xoá tự do, Lưu là ghi đè. Chỉ đọc: liệt kê từng tin.
 */
const TraoDoiDialog: React.FC<Props> = ({ tenDong, traoDoi, readOnly, dangLuu, onSave, onClose }) => {
  const { t } = useTranslation();
  const formId = useId();
  const ten = useAuthStore((s) => s.user?.full_name);
  const confirm = useConfirmStore((s) => s.confirm);
  const cu = traoDoi?.trim() ? traoDoi : null;
  // Giữ cố định dòng mới từ lúc mở popup (thời điểm không nhảy theo lần render).
  const [dongMoi] = useState(() => dongMoiTraoDoi(nowTz().format('DD/MM/YYYY HH:mm'), ten));
  const [banDau] = useState(() => soanSanTraoDoi(cu, dongMoi));
  const [text, setText] = useState(banDau);
  const ref = useRef<HTMLTextAreaElement>(null);
  const muc = useMemo(() => (readOnly ? tachTraoDoi(cu) : []), [readOnly, cu]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
    el.scrollTop = el.scrollHeight;
  }, []);

  const daGo = !readOnly && text !== banDau;

  /** Nút Huỷ hỏi lại như nút X / bấm ra ngoài — tin gõ dài, bấm nhầm là mất. */
  const huy = () => {
    if (!daGo) {
      onClose();
      return;
    }
    confirm({
      title: t('common.unsavedChangesTitle'),
      message: t('common.unsavedChangesMessage'),
      variant: 'warning',
      confirmText: t('common.discard'),
      cancelText: t('common.keepEditing'),
      onConfirm: onClose,
    });
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const giaTri = chotTraoDoi(text, dongMoi);
    if (giaTri === (cu?.trim() || null)) {
      onClose();
      return;
    }
    onSave?.(giaTri, cu);
  };

  return (
    <GenericDrawer
      title={t('common.traoDoi.title')}
      subtitle={tenDong}
      icon={<MessagesSquare className="text-primary" size={20} />}
      onClose={onClose}
      isDirty={daGo}
      variant="modal"
      maxWidthClass={DIALOG_SIZE.LARGE}
      footer={
        readOnly ? (
          <div className="flex justify-end w-full">
            <Button variant="outline" size="sm" onClick={onClose}>
              {t('common.close')}
            </Button>
          </div>
        ) : (
          <FormDrawerFooter
            formId={formId}
            onCancel={huy}
            isEdit
            isLoading={dangLuu}
            saveLabel={t('common.save')}
            cancelLabel={t('common.cancel')}
          />
        )
      }
    >
      {readOnly ? (
        muc.length > 0 ? (
          <ul className="space-y-2.5 pb-2 m-0 p-0 list-none">
            {muc.map((m, i) => (
              <li key={i} className="rounded-lg border border-border bg-muted/30 px-3 py-2">
                {m.thoiDiem && (
                  <span className="block text-caption tabular-nums text-muted-foreground">
                    {hienThiThoiDiemTraoDoi(m.thoiDiem, true)}
                  </span>
                )}
                <span className="block text-body-sm text-foreground whitespace-pre-line break-words">{m.noiDung || '—'}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground italic m-0 pb-2">{t('common.traoDoi.empty')}</p>
        )
      ) : (
        <form id={formId} className="space-y-1.5 pb-2" onSubmit={onSubmit}>
          <Textarea
            ref={ref}
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={12}
            className="text-body-sm leading-relaxed"
          />
          <p className="text-caption text-muted-foreground m-0">{t('common.traoDoi.hint')}</p>
        </form>
      )}
    </GenericDrawer>
  );
};

export default TraoDoiDialog;
