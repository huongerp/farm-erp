import { describe, it, expect, beforeEach } from 'vitest';
import { pushOverlay, popOverlay, isTopOverlay } from '../overlay-stack';

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
});
