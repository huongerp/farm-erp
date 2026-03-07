import React, { useEffect, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table';
import { TextStyle } from '@tiptap/extension-text-style/text-style';
import { FontSize } from '@tiptap/extension-text-style/font-size';
import { Bold, Italic, List, ListOrdered, ChevronDown, Variable, Table as TableIcon, Type } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { toTemplateVariable, TEMPLATE_VARIABLES } from '../core/template-variables';

const FONT_SIZES = ['12px', '14px', '16px', '18px', '20px'] as const;

const EMPTY_HTML = '<p></p>';

/** Chuẩn hóa nội dung: rỗng -> empty paragraph; plain text (không có thẻ) -> chuyển thành HTML. */
function normalizeContent(html: string | undefined | null): string {
  const v = html?.trim();
  if (!v || v === '') return EMPTY_HTML;
  if (v.startsWith('<') && (v.includes('</') || v.endsWith('>'))) return v;
  const escaped = v
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '</p><p>');
  return `<p>${escaped}</p>`;
}

export interface TemplateRichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  minHeight?: string;
  className?: string;
}

const TemplateRichTextEditor: React.FC<TemplateRichTextEditorProps> = ({
  value,
  onChange,
  placeholder,
  label,
  error,
  required,
  disabled,
  minHeight = '200px',
  className,
}) => {
  const { t } = useTranslation();
  const [varDropdownOpen, setVarDropdownOpen] = useState(false);
  const [fontSizeOpen, setFontSizeOpen] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      TextStyle,
      FontSize,
    ],
    content: normalizeContent(value),
    editable: !disabled,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html === EMPTY_HTML ? '' : html);
    },
    editorProps: {
      attributes: {
        class: 'template-editor-content min-h-[120px] px-3 py-2.5 focus:outline-none text-sm text-foreground',
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const normalized = normalizeContent(value);
    if (editor.getHTML() !== normalized) {
      editor.commands.setContent(normalized, false);
    }
  }, [editor, value]);

  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [editor, disabled]);

  const insertVariable = useCallback(
    (key: string) => {
      if (!editor) return;
      const token = toTemplateVariable(key);
      editor.chain().focus().insertContent(token).run();
      setVarDropdownOpen(false);
    },
    [editor]
  );

  const toggleBold = () => editor?.chain().focus().toggleBold().run();
  const toggleItalic = () => editor?.chain().focus().toggleItalic().run();
  const toggleBulletList = () => editor?.chain().focus().toggleBulletList().run();
  const toggleOrderedList = () => editor?.chain().focus().toggleOrderedList().run();
  const insertTable = () => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  const setFontSize = (size: string) => {
    editor?.chain().focus().setFontSize(size).run();
    setFontSizeOpen(false);
  };

  if (!editor) {
    return (
      <div className={cn('rounded-lg border border-border bg-muted/30', className)} style={{ minHeight }}>
        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
          {t('common.loading')}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <div className="flex items-center justify-between gap-2 mb-2">
          <label className="text-sm font-medium leading-none text-foreground">
            {label}
            {required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setVarDropdownOpen((o) => !o)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-border bg-background text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <Variable size={14} />
              {t('thietLapTuyenDung.mauPhanHoi.editor.insertVariable')}
              <ChevronDown size={12} className={varDropdownOpen ? 'rotate-180' : ''} />
            </button>
            {varDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  aria-hidden
                  onClick={() => setVarDropdownOpen(false)}
                />
                <ul
                  className="absolute right-0 top-full mt-1 py-1 w-56 max-h-64 overflow-y-auto rounded-lg border border-border bg-popover shadow-lg z-20"
                  role="listbox"
                >
                  {TEMPLATE_VARIABLES.map((v) => (
                    <li key={v.id} role="option">
                      <button
                        type="button"
                        className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-muted rounded-none"
                        onClick={() => insertVariable(v.id)}
                      >
                        <span className="font-medium text-muted-foreground">{v.id}</span>
                        <span className="block text-xs text-muted-foreground mt-0.5">
                          {t(v.labelKey)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      )}

      <div
        className={cn(
          'rounded-lg border bg-background transition-colors',
          error ? 'border-destructive' : 'border-border',
          disabled && 'opacity-60 pointer-events-none'
        )}
      >
        <div className="flex flex-wrap items-center gap-0.5 p-1 border-b border-border bg-muted/30 rounded-t-lg">
          <button
            type="button"
            onClick={toggleBold}
            className={cn(
              'p-2 rounded hover:bg-muted',
              editor.isActive('bold') && 'bg-muted text-primary'
            )}
            title={t('thietLapTuyenDung.mauPhanHoi.editor.bold')}
          >
            <Bold size={16} />
          </button>
          <button
            type="button"
            onClick={toggleItalic}
            className={cn(
              'p-2 rounded hover:bg-muted',
              editor.isActive('italic') && 'bg-muted text-primary'
            )}
            title={t('thietLapTuyenDung.mauPhanHoi.editor.italic')}
          >
            <Italic size={16} />
          </button>
          <button
            type="button"
            onClick={toggleBulletList}
            className={cn(
              'p-2 rounded hover:bg-muted',
              editor.isActive('bulletList') && 'bg-muted text-primary'
            )}
            title={t('thietLapTuyenDung.mauPhanHoi.editor.bulletList')}
          >
            <List size={16} />
          </button>
          <button
            type="button"
            onClick={toggleOrderedList}
            className={cn(
              'p-2 rounded hover:bg-muted',
              editor.isActive('orderedList') && 'bg-muted text-primary'
            )}
            title={t('thietLapTuyenDung.mauPhanHoi.editor.orderedList')}
          >
            <ListOrdered size={16} />
          </button>
          <span className="w-px h-5 bg-border mx-0.5" aria-hidden />
          <button
            type="button"
            onClick={insertTable}
            className="p-2 rounded hover:bg-muted"
            title={t('thietLapTuyenDung.mauPhanHoi.editor.insertTable')}
          >
            <TableIcon size={16} />
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setFontSizeOpen((o) => !o)}
              className={cn(
                'inline-flex items-center gap-1 px-2 py-1.5 rounded hover:bg-muted text-xs font-medium',
                fontSizeOpen && 'bg-muted text-primary'
              )}
              title={t('thietLapTuyenDung.mauPhanHoi.editor.fontSize')}
            >
              <Type size={14} />
              <span>{t('thietLapTuyenDung.mauPhanHoi.editor.fontSize')}</span>
              <ChevronDown size={12} className={fontSizeOpen ? 'rotate-180' : ''} />
            </button>
            {fontSizeOpen && (
              <>
                <div className="fixed inset-0 z-10" aria-hidden onClick={() => setFontSizeOpen(false)} />
                <ul className="absolute left-0 top-full mt-1 py-1 min-w-[80px] rounded-lg border border-border bg-popover shadow-lg z-20">
                  {FONT_SIZES.map((size) => (
                    <li key={size}>
                      <button
                        type="button"
                        className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted"
                        onClick={() => setFontSize(size)}
                        style={{ fontSize: size }}
                      >
                        {size}
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
        <div
          className="overflow-auto rounded-b-lg"
          style={{ minHeight: 'calc(' + minHeight + ' - 44px)' }}
        >
          <EditorContent editor={editor} />
        </div>
      </div>

      {placeholder && !value && (
        <p className="text-xs text-muted-foreground mt-1.5">{placeholder}</p>
      )}
      {error && (
        <p id={error ? 'editor-error' : undefined} className="text-sm text-destructive mt-1.5">
          {error}
        </p>
      )}
    </div>
  );
};

export default TemplateRichTextEditor;
