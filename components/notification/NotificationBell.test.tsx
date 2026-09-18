/**
 * Test render — ngoại lệ có chủ đích so với quy ước "không test component".
 *
 * Chuông từng có lỗi thật: `buttonRef` được khai báo và dùng ở bốn chỗ nhưng
 * không bao giờ gắn vào <button>. Hệ quả là `buttonRef.current` luôn null, đoạn
 * đo toạ độ luôn thoát sớm, và bấm chuông không mở ra gì cả — lỗi lọt tới tận
 * tay người dùng vì component này trước đó là code chết, chưa ai bấm bao giờ.
 *
 * Test giữ đúng một hành vi: bấm vào chuông thì panel phải hiện ra.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

const khongLam = { mutate: vi.fn(), mutateAsync: vi.fn() };

// Chỉ chặn ở tầng hook dữ liệu; panel vẫn render thật để test bao được cả việc
// nó mở ra được.
vi.mock('../../features/thong-bao/hooks/use-thong-bao', () => ({
  useDemChuaDoc: () => ({ data: 3 }),
  useDemTheoModule: () => ({ data: {} }),
  useDanhSachThongBao: () => ({ data: { items: [], tong: 0 }, isPending: false }),
  useDanhDauDaDoc: () => khongLam,
  useXoaMotThongBao: () => khongLam,
  useDocTatCa: () => khongLam,
  useXoaTatCa: () => khongLam,
  napSanNoiDungChuong: vi.fn(),
}));

import NotificationBell from './NotificationBell';

/** Chuông cần QueryClient (nạp sẵn nội dung) và Router (panel có Link). */
function dungChuong() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <NotificationBell />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

const timNut = () => screen.getByRole('button', { name: 'Thông báo' });
const timPanel = () => document.querySelector('[data-notification-dropdown]');

describe('NotificationBell', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
  });

  it('hiện số chưa đọc trên badge', () => {
    dungChuong();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('bấm chuông thì panel hiện ra', async () => {
    const nguoiDung = userEvent.setup();
    dungChuong();

    const nut = timNut();
    expect(nut).toHaveAttribute('aria-expanded', 'false');
    expect(timPanel()).toBeNull();

    await nguoiDung.click(nut);

    expect(nut).toHaveAttribute('aria-expanded', 'true');
    await waitFor(() => expect(timPanel()).not.toBeNull());
  });

  it('bấm lần nữa thì panel đóng lại', async () => {
    const nguoiDung = userEvent.setup();
    dungChuong();
    const nut = timNut();

    await nguoiDung.click(nut);
    await waitFor(() => expect(timPanel()).not.toBeNull());

    await nguoiDung.click(nut);
    await waitFor(() => expect(timPanel()).toBeNull());
  });

  it('nhấn Esc cũng đóng panel', async () => {
    const nguoiDung = userEvent.setup();
    dungChuong();

    await nguoiDung.click(timNut());
    await waitFor(() => expect(timPanel()).not.toBeNull());

    await nguoiDung.keyboard('{Escape}');
    await waitFor(() => expect(timPanel()).toBeNull());
  });
});
