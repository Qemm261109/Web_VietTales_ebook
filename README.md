# Website Di sản truyện dân gian địa phương

## Có gì trong bản dựng này?
- Các trang: Giới Thiệu, Trang chủ, Truyền Thuyết, Truyện Cười, Truyện Cổ Tích, Truyện Giải Thích Địa Phương.
- Đăng nhập/đăng ký, phân quyền quản trị viên.
- Thêm, sửa, xóa truyện; lưu nháp/xuất bản; chọn truyện nổi bật.
- Tải `.docx` để trích xuất văn bản và tải ảnh minh họa.
- Supabase lưu dữ liệu để dùng được trên nhiều thiết bị.

## 1. Tạo cơ sở dữ liệu
1. Tạo dự án ở https://supabase.com.
2. Vào SQL Editor, dán toàn bộ `supabase_setup.sql`, bấm Run.
3. Vào phần API của dự án, sao chép Project URL và publishable/anon key.
4. Điền hai giá trị đó vào `config.js`. Không dùng `service_role` key.

## 2. Cấp quyền quản trị
1. Vào Authentication → Users → Add user và tạo tài khoản với email do em kiểm soát. Dùng mật khẩu mới; không đưa mật khẩu vào mã nguồn.
2. Sao chép UID của user.
3. Chạy trong SQL Editor, thay UID thật:

```sql
insert into public.admin_users(user_id)
values ('DAN-UID-THUC-TE-VAO-DAY')
on conflict (user_id) do nothing;
```

Tài khoản tự đăng ký không có quyền quản trị cho đến khi UID được cấp quyền.

## 3. Chạy thử và đưa lên GitHub Pages
1. Mở thư mục bằng VS Code và chạy bằng Live Server.
2. Kiểm tra đăng nhập admin, thêm truyện, tải `.docx`, lưu nháp và xuất bản.
3. Tạo repository GitHub, tải các file trong thư mục này lên thư mục gốc.
4. Vào Settings → Pages → Deploy from a branch → chọn `main` và `/ (root)` → Save.

## Lưu ý
- Bộ mã nguồn chưa được kết nối vào dự án Supabase thật hay triển khai lên GitHub của em.
- Cần Internet để tải thư viện Supabase và Mammoth.
- Chỉ tải lên truyện/ảnh em có quyền sử dụng. Luôn kiểm tra văn bản trích xuất từ Word trước khi xuất bản.
