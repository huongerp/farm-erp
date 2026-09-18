/**
 * Locale vi — CHỈ phần core shell (common, pages, nhân sự, phòng ban, bảng lương…).
 *
 * Locale của 30 module trong features/ được nạp lazy theo từng feature, xem
 * lib/feature-i18n.ts — trước đây gộp hết vào đây làm chunk chính phình thêm 256 KB
 * và cứ thêm module là phình tiếp.
 *
 * Race condition mà cách gộp eager này từng né: store và core/schema.ts gọi i18n.t()
 * ngay ở module scope. Nay do wrapModuleImportWithFeatureI18n / lazyWithFeatureI18n
 * await locale xong mới import module nên thứ tự vẫn đúng.
 */
import common from './common.json';
import pages from './pages.json';
import employee from './employee.json';
import department from './department.json';
import branch from './branch.json';
import position from './position.json';
import jobLevel from './jobLevel.json';
import permission from './permission.json';
import company from './company.json';
import tenure from './tenure.json';
import payrollIp from './payroll-ip.json';
import adminForm from './admin-form.json';
import diemCongTru from './diem-cong-tru.json';
import bangLuong from './bang-luong.json';
import congViec from './cong-viec.json';
import guide from './guide.json';
import kho from './kho.json';


const viCore = {
  ...(common as Record<string, string>),
  ...(pages as Record<string, string>),
  ...(employee as Record<string, string>),
  ...(department as Record<string, string>),
  ...(branch as Record<string, string>),
  ...(position as Record<string, string>),
  ...(jobLevel as Record<string, string>),
  ...(permission as Record<string, string>),
  ...(company as Record<string, string>),
  ...(tenure as Record<string, string>),
  ...(payrollIp as Record<string, string>),
  ...(adminForm as Record<string, string>),
  ...(diemCongTru as Record<string, string>),
  ...(bangLuong as Record<string, string>),
  ...(congViec as Record<string, string>),
  ...(guide as Record<string, string>),
  ...(kho as Record<string, string>),
};

export default viCore;
