import { describe, expect, it } from 'vitest';
import { useState } from 'react';
import { act, render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { usePresenceTransition } from './usePresenceTransition';

const cho = (ms: number) => act(() => new Promise((r) => setTimeout(r, ms)));

function Demo() {
  const [open, setOpen] = useState(false);
  const { mounted } = usePresenceTransition(open, 10);
  return (
    <>
      <button onClick={() => setOpen(true)}>mo</button>
      {mounted && <div role="dialog" />}
    </>
  );
}

describe('usePresenceTransition', () => {
  // Bug thật (05/10/2026): bấm mở sau khi đã mount quá durationMs thì update `mounted=false`
  // từ timer lúc mount (giá trị không đổi, React vẫn xếp hàng) đè lên lệnh mở → ConfirmDialog
  // không bao giờ hiện, mọi nút cần xác nhận "bấm không ăn".
  it('bấm mở sau khi đã mount lâu hơn durationMs vẫn hiện', async () => {
    render(<Demo />);
    await cho(40);
    await userEvent.click(screen.getByText('mo'));
    await cho(40);
    expect(screen.queryByRole('dialog')).not.toBeNull();
  });

  it('đóng thì ẩn ngay, gỡ DOM sau durationMs; mở lại vẫn hiện', async () => {
    const { result, rerender } = renderHook(({ open }) => usePresenceTransition(open, 10), {
      initialProps: { open: true },
    });
    await cho(20);
    rerender({ open: false });
    expect(result.current).toEqual({ mounted: true, visible: false });
    await cho(40);
    expect(result.current.mounted).toBe(false);
    rerender({ open: true });
    await cho(40);
    expect(result.current).toEqual({ mounted: true, visible: true });
  });
});
