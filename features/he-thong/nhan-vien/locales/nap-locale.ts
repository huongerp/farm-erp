// Module nhân viên không nằm trong cơ chế lazy `lib/feature-i18n.ts` → tự nạp chuỗi riêng (side-effect).
import i18n from '../../../../lib/i18n';
import vi from './vi.json';

i18n.addResourceBundle('vi', 'translation', vi, true, false);
