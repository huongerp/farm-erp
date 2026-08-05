# Rủi ro nền tảng dữ liệu — báo cáo rà soát

> Rà soát ngày 05/08/2026. **Chỉ ghi nhận, chưa sửa gì ở tầng database** theo quyết định
> làm giao diện trước. Mọi kết luận dưới đây đều đã kiểm chứng trực tiếp trên mã nguồn và
> `backup/schema-only.sql`, kèm đường dẫn để soát lại.

## Tóm tắt

| # | Rủi ro | Mức độ |
|---|---|---|
| 1 | RLS bật nhưng toàn bộ 234 policy đều `USING (true)` — không chặn gì | Nghiêm trọng |
| 2 | Xoá cứng, không có nhật ký thay đổi | Nghiêm trọng |
| 3 | Không có sao lưu tự động | Nghiêm trọng |
| 4 | Ghi nhiều bảng không nằm trong một giao dịch | Cao |
| 5 | Danh tính người tạo và việc duyệt phiếu đều giả mạo được | Cao |
| 6 | Không chặn xuất kho quá tồn | Trung bình |

Ba nền tảng **đã làm đúng, cần giữ**: sinh số phiếu bằng sequence trong DB (không bị
trùng khi hai người tạo cùng lúc), dùng kiểu `numeric` cho tiền (119 cột, chỉ 2 cột
dùng số thực), và bí mật không lọt vào repo (`.env` nằm trong `.gitignore`, lịch sử git
sạch, chỉ có `.env.example`).

---

## 1. Phân quyền hiện chỉ là ẩn nút trên giao diện

Kiểm chứng:

```bash
grep -c "CREATE POLICY" backup/schema-only.sql          # 234
grep "CREATE POLICY" -A2 backup/schema-only.sql \
  | grep -E "USING|WITH CHECK" | grep -v "true"          # (không có kết quả)
```

Cả 234 policy đều là `USING (true)` / `WITH CHECK (true)` — **không có ngoại lệ nào**.
Ví dụ `"Allow delete for authenticated" ON fp_mh_phieu_kho FOR DELETE TO authenticated
USING (true)`.

Nghĩa là mọi tài khoản đăng nhập được đều có thể đọc, sửa, xoá **toàn bộ** bảng lương,
phiếu kho, tài sản của **mọi chi nhánh** bằng cách gọi thẳng API — không cần qua giao
diện. `ModulePermissionGuard` chỉ quyết định hiện hay ẩn nút, không phải hàng rào bảo mật.
Thêm nữa, `useModulePermissionFromContext` mặc định trả về **toàn quyền** khi component
nằm ngoài guard, tức là quên bọc guard sẽ mở quyền chứ không phải khoá lại.

Hướng xử lý khi làm: viết policy theo vai trò và theo chi nhánh dựa trên claim trong JWT,
làm từng bảng một, bật ở môi trường thử trước và kiểm tra kỹ các màn hình tổng hợp
liên chi nhánh.

## 2. Xoá cứng và không có nhật ký thay đổi

- Không có bảng `*_log` / `*_history` / `*_audit` nào trong 65 bảng.
- Có 49 trigger `tg_cap_nhat` nhưng chỉ ghi **thời điểm**, không ghi ai sửa và giá trị cũ.
- 39 file có lệnh `.delete()`; phiếu kho và bảng lương đều xoá vĩnh viễn.

Hệ quả: một thao tác xoá nhầm dữ liệu tài chính là mất hẳn, không biết ai làm, không khôi
phục được nếu không có bản sao lưu.

Hướng xử lý: thêm cột xoá mềm (`da_xoa`, `nguoi_xoa`, `tg_xoa`) cho các bảng nghiệp vụ,
đổi `.delete()` thành cập nhật cờ, và thêm một bảng nhật ký ghi bằng trigger.

## 3. Không có sao lưu tự động

Chỉ có script chạy tay `scripts/vps-dump-restore.sh`, không có cron/lịch trong
`docker-compose.yml` hay `deploy/`, cũng chưa có quy trình kiểm tra phục hồi định kỳ.

Rủi ro này cộng hưởng với mục 1 và 2: một thao tác sai là không có đường lùi.
**Nên làm trước tiên, vì nó rẻ và là điều kiện an toàn để làm các mục còn lại.**

## 4. Ghi nhiều bảng không nằm trong một giao dịch

`features/kho-van/phieu-kho/services/phieu-kho-supabase.service.ts` — khi sửa phiếu, code
**chèn dòng chi tiết mới trước, rồi mới xoá dòng chi tiết cũ**. Nếu lệnh xoá lỗi giữa
chừng, phiếu có cả hai bộ chi tiết.

Tồn kho được tính từ chi tiết phiếu (view `fp_mh_ton_kho`), nên hỏng kiểu này làm **số
liệu tồn kho sai âm thầm** — không có thông báo lỗi nào, sổ sách vẫn trông bình thường.
Tạo phiếu cũng tương tự: chèn phần đầu rồi chèn chi tiết ở một lượt gọi riêng, lỗi giữa
chừng để lại phiếu rỗng.

Hướng xử lý: gói mỗi thao tác vào một hàm RPC trong Postgres để chạy trọn trong một
giao dịch.

## 5. Danh tính và việc duyệt phiếu giả mạo được

`nguoi_tao_id`, `ten_nguoi_tao`, `id_nguoi_duyet` đều do phía trình duyệt gửi lên, không
trigger nào đối chiếu với người đang đăng nhập. Không có ràng buộc nào chặn sửa hoặc xoá
phiếu **đã duyệt** — `CHECK` chỉ giới hạn *giá trị* trạng thái, không giới hạn *ai* được
chuyển và *chuyển từ trạng thái nào sang trạng thái nào*.

Nghĩa là có thể tự duyệt phiếu của chính mình, hoặc tạo phiếu mang tên người khác.

Hướng xử lý: đặt các cột này bằng trigger lấy từ JWT thay vì tin dữ liệu client gửi lên;
thêm ràng buộc cho phép chuyển trạng thái.

## 6. Không chặn xuất quá tồn

Cảnh báo "Vượt tồn" chỉ là nhãn đỏ hiển thị trong `PhieuKhoForm.tsx`, không chặn lưu, và
database cũng không kiểm tra. Kho có thể âm.

---

## Thứ tự đề xuất

1. **Sao lưu tự động + thử phục hồi** — rẻ, và là lưới an toàn cho mọi việc sau đó.
2. **Xoá mềm + nhật ký thay đổi** — dựng được đường lùi cho thao tác sai.
3. **RLS theo vai trò và chi nhánh** — bịt lỗ hổng lớn nhất, nhưng cần thử kỹ vì dễ chặn
   nhầm các màn hình tổng hợp.
4. **Bọc giao dịch cho phiếu kho** — chặn nguồn sai lệch tồn kho.
5. **Trigger gán người tạo/người duyệt + ràng buộc chuyển trạng thái.**

Mỗi mục nên chạy trên bản sao dữ liệu trước, và có sẵn câu lệnh hoàn tác.
