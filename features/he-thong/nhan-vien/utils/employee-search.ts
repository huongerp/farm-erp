import { createListSearchMatcher } from '../../../../lib/list-search-matcher';
import { DEFAULT_COLUMNS } from '../store/useEmployeeStore';
import type { Employee } from '../core/types';

/** Ô tìm kiếm quét MỌI cột của bảng, bỏ dấu tiếng Việt — xem lib/list-search-matcher.ts. */
const khopTimKiem = createListSearchMatcher<Employee>({ columns: DEFAULT_COLUMNS });

/**
 * Khớp ô tìm kiếm danh sách nhân viên (dùng chung list + filter counts).
 *
 * Quét mọi cột của bảng, kể cả cột đang ẩn, và bỏ dấu tiếng Việt — trước đây chỉ
 * so 7 trường liệt kê tay nên gõ nội dung của cột khác thì không ra kết quả.
 */
export function employeeMatchesSearch(emp: Employee, term: string): boolean {
  return khopTimKiem(emp, term);
}
