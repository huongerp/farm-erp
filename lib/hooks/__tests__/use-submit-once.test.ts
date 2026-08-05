import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSubmitOnce } from '../use-submit-once';

describe('useSubmitOnce', () => {
  it('hai lượt gọi trong cùng một nhịp chỉ chạy một lần', () => {
    // Đây là ca gốc: một lần bấm Lưu nhưng luồng cập nhật chạy hai lượt.
    const handler = vi.fn();
    const { result } = renderHook(() => useSubmitOnce(handler, false));

    act(() => {
      result.current({ ten: 'A' });
      result.current({ ten: 'A' });
    });

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('vẫn khoá trong lúc mutation đang chạy', () => {
    const handler = vi.fn();
    const { result, rerender } = renderHook(
      ({ dangChay }) => useSubmitOnce(handler, dangChay),
      { initialProps: { dangChay: false } },
    );

    act(() => result.current({}));
    expect(handler).toHaveBeenCalledTimes(1);

    rerender({ dangChay: true });
    act(() => result.current({}));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('mở khoá khi mutation kết thúc để người dùng gửi lại được', () => {
    const handler = vi.fn();
    const { result, rerender } = renderHook(
      ({ dangChay }) => useSubmitOnce(handler, dangChay),
      { initialProps: { dangChay: false } },
    );

    act(() => result.current({}));
    rerender({ dangChay: true });   // đang gửi
    rerender({ dangChay: false });  // xong (thành công hoặc lỗi)

    act(() => result.current({}));
    expect(handler).toHaveBeenCalledTimes(2);
  });

  it('truyền nguyên vẹn tham số cho handler', () => {
    const handler = vi.fn();
    const { result } = renderHook(() => useSubmitOnce(handler, false));
    const duLieu = { ho_ten: 'Như Nguyệt', dan_toc: 'Tày' };

    act(() => result.current(duLieu));

    expect(handler).toHaveBeenCalledWith(duLieu);
  });
});
