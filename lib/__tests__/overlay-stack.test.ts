import { describe, it, expect, beforeEach } from 'vitest';
import { pushOverlay, popOverlay, isTopOverlay } from '../overlay-stack';
import { isAppBusy } from '../app-busy';

// Module giữ state toàn cục (stack) — mỗi test cần dọn sạch bằng cách pop hết những gì đã push.
// Không có API reset công khai (đúng ý — chỉ push/pop/isTop), nên ta tự theo dõi id đã tạo trong test.
describe('overlay-stack', () => {
  let created: number[] = [];
  beforeEach(() => {
    created.forEach(popOverlay);
    created = [];
  });
  function push(): number {
    const id = pushOverlay();
    created.push(id);
    return id;
  }

  it('overlay đơn: là top ngay sau khi push', () => {
    const a = push();
    expect(isTopOverlay(a)).toBe(true);
  });

  it('overlay xếp lớp: chỉ overlay mới nhất là top — mô phỏng đúng bug Esc đóng hết', () => {
    const formDrawer = push();
    const lineItemDrawer = push();
    // Đang mở form phiếu, rồi mở drawer thêm dòng hàng — chỉ drawer dòng hàng được phép
    // phản hồi Escape; form bên dưới KHÔNG được đóng theo.
    expect(isTopOverlay(formDrawer)).toBe(false);
    expect(isTopOverlay(lineItemDrawer)).toBe(true);
  });

  it('đóng overlay trên cùng thì overlay bên dưới trở lại làm top', () => {
    const formDrawer = push();
    const lineItemDrawer = push();
    popOverlay(lineItemDrawer);
    created = created.filter((id) => id !== lineItemDrawer);
    expect(isTopOverlay(formDrawer)).toBe(true);
  });

  it('pop một id không tồn tại hoặc đã pop rồi thì không lỗi, không ảnh hưởng stack còn lại', () => {
    const a = push();
    popOverlay(99999);
    popOverlay(a);
    created = created.filter((id) => id !== a);
    expect(isTopOverlay(a)).toBe(false);
  });

  it('stack rỗng: isTopOverlay luôn false', () => {
    expect(isTopOverlay(1)).toBe(false);
  });

  // Cổng chặn auto-update: app không được tự reload khi còn overlay đang mở
  // (xem lib/app-busy.ts + components/shared/PwaRegister.tsx).
  describe('nối với app-busy', () => {
    it('còn overlay đang mở thì app được coi là bận', () => {
      expect(isAppBusy()).toBe(false);
      const drawer = push();
      expect(isAppBusy()).toBe(true);
      popOverlay(drawer);
      created = created.filter((id) => id !== drawer);
      expect(isAppBusy()).toBe(false);
    });

    it('overlay xếp lớp: chỉ hết bận khi cái cuối cùng đóng', () => {
      const form = push();
      const lineItem = push();
      popOverlay(lineItem);
      created = created.filter((id) => id !== lineItem);
      expect(isAppBusy()).toBe(true);
      popOverlay(form);
      created = created.filter((id) => id !== form);
      expect(isAppBusy()).toBe(false);
    });

    it('pop trùng lặp không làm app kẹt ở trạng thái rảnh giả', () => {
      const a = push();
      const b = push();
      popOverlay(a);
      popOverlay(a);
      created = created.filter((id) => id !== a);
      expect(isAppBusy()).toBe(true);
      popOverlay(b);
      created = created.filter((id) => id !== b);
      expect(isAppBusy()).toBe(false);
    });
  });
});
