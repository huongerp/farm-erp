import { useCallback, useRef } from 'react';

/**
 * Bọc handler submit để một thao tác chỉ chạy đúng một lần.
 *
 * Vì sao cần: quan sát trên production khi sửa nhân viên, một lần bấm "Lưu" tạo ra
 * HAI lượt gọi đầy đủ (kiểm tra email -> PATCH -> kiểm tra email -> PATCH), cả hai
 * đều trả 200. Đã loại trừ: retry 401 ở lib/db.ts (nếu vậy request đầu phải là 401),
 * Button đã tự disabled khi isLoading, form không lồng form, GenericDrawer chỉ render
 * một nhánh, React Query không retry mutation, và chỉ có duy nhất một nơi render form.
 * Chưa tìm ra nguyên nhân gốc, nhưng với PATCH thì vô hại còn với nút Tạo mới sẽ sinh
 * bản ghi trùng — nên chặn ở đây trước.
 *
 * Dùng ref chứ không dùng cờ isPending: cờ đó chỉ đổi ở lần render sau, hai lượt gọi
 * trong cùng một nhịp sẽ lọt qua.
 *
 * @param handler   Hàm xử lý submit thật.
 * @param dangChay  Cờ pending của mutation — hết pending thì mở khoá cho lần sau.
 */
export function useSubmitOnce<TArgs extends unknown[]>(
  handler: (...args: TArgs) => void | Promise<unknown>,
  dangChay: boolean,
): (...args: TArgs) => void {
  const dangGuiRef = useRef(false);

  // Mutation chạy xong (dù thành công hay lỗi) thì mở khoá để người dùng sửa và gửi lại.
  if (!dangChay && dangGuiRef.current) {
    dangGuiRef.current = false;
  }

  return useCallback(
    (...args: TArgs) => {
      if (dangGuiRef.current) return;
      dangGuiRef.current = true;
      void handler(...args);
    },
    [handler],
  );
}
