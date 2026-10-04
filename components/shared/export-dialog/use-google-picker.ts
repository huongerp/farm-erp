import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import i18n from '../../../lib/i18n';
import { GOOGLE_APP_ID, GOOGLE_PICKER_API_KEY } from '../../../lib/api-config';
import { sheetsClient, SheetsLoi } from '../../../lib/sheets-client';

/* Kiểu tối thiểu của Google Picker — thư viện tải từ apis.google.com lúc cần, không có gói npm. */
interface PickerDoc {
  id: string;
  name: string;
}
interface PickerData {
  action: string;
  docs?: PickerDoc[];
}
interface PickerBuilder {
  addView(v: unknown): PickerBuilder;
  setOAuthToken(t: string): PickerBuilder;
  setDeveloperKey(k: string): PickerBuilder;
  setAppId(id: string): PickerBuilder;
  setLocale(l: string): PickerBuilder;
  setTitle(t: string): PickerBuilder;
  setCallback(cb: (d: PickerData) => void): PickerBuilder;
  build(): { setVisible(v: boolean): void };
}
interface GooglePickerNs {
  PickerBuilder: new () => PickerBuilder;
  DocsView: new (viewId: unknown) => { setMode(m: unknown): unknown };
  ViewId: { SPREADSHEETS: unknown };
  DocsViewMode: { LIST: unknown };
  Action: { PICKED: string; CANCEL: string };
}
type WinGoogle = Window & {
  gapi?: { load(name: string, cb: () => void): void };
  google?: { picker?: GooglePickerNs };
};

let napPicker: Promise<GooglePickerNs> | null = null;

function taiThuVienPicker(): Promise<GooglePickerNs> {
  napPicker ??= new Promise<GooglePickerNs>((resolve, reject) => {
    const w = window as WinGoogle;
    const xong = () => w.gapi!.load('picker', () => (w.google?.picker ? resolve(w.google.picker) : reject(new Error('picker'))));
    if (w.gapi) return xong();
    const s = document.createElement('script');
    s.src = 'https://apis.google.com/js/api.js';
    s.async = true;
    s.onload = xong;
    s.onerror = () => reject(new Error('picker-script'));
    document.head.appendChild(s);
  }).catch((e) => {
    napPicker = null; // cho phép thử lại lần sau
    throw e;
  });
  return napPicker;
}

/**
 * Chọn file Google Sheet có sẵn trên Drive. Bắt buộc với scope `drive.file`: app chỉ
 * mở được file người dùng đã chọn qua Picker (hoặc file app tự tạo), không dán link được.
 */
export function useGooglePicker() {
  const [dangMo, setDangMo] = useState(false);
  const khaDung = GOOGLE_PICKER_API_KEY !== '' && GOOGLE_APP_ID !== '';

  const chonFile = useCallback(async (): Promise<PickerDoc | null> => {
    if (!khaDung) return null;
    setDangMo(true);
    try {
      const [picker, { accessToken }] = await Promise.all([taiThuVienPicker(), sheetsClient.tokenPicker()]);
      return await new Promise<PickerDoc | null>((resolve) => {
        const view = new picker.DocsView(picker.ViewId.SPREADSHEETS);
        view.setMode(picker.DocsViewMode.LIST);
        new picker.PickerBuilder()
          .addView(view)
          .setOAuthToken(accessToken)
          .setDeveloperKey(GOOGLE_PICKER_API_KEY)
          // App ID = project number: Google cấp quyền drive.file cho file được chọn.
          .setAppId(GOOGLE_APP_ID)
          .setLocale('vi')
          .setTitle(i18n.t('shared.export.gs.pickFile'))
          .setCallback((d) => {
            if (d.action === picker.Action.PICKED) resolve(d.docs?.[0] ?? null);
            else if (d.action === picker.Action.CANCEL) resolve(null);
          })
          .build()
          .setVisible(true);
      });
    } catch (e) {
      toast.error(e instanceof SheetsLoi ? e.message : i18n.t('shared.export.gs.pickerError'));
      return null;
    } finally {
      setDangMo(false);
    }
  }, [khaDung]);

  return { khaDung, dangMo, chonFile };
}
