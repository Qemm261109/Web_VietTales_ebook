# Di Sản Việt — Website truyện dân gian số

Website tĩnh dùng **HTML/CSS/JavaScript**, triển khai trên **GitHub Pages**; Supabase cung cấp đăng nhập, cơ sở dữ liệu và lưu ảnh. Công cụ Mammoth đọc văn bản từ file Word `.docx`.

## Chức năng

- Trang chủ, thư viện truyện, tìm kiếm và lọc theo thể loại.
- Trang đọc truyện có thông tin nguồn tư liệu, người sưu tầm, địa danh.
- Quản trị viên đăng nhập, thêm/sửa/xóa truyện, ẩn/đăng truyện.
- Nhập nội dung từ `.docx` vào biểu mẫu nháp để kiểm tra trước khi lưu.
- Tải ảnh bìa JPG/PNG/WebP (tối đa 5 MB).
- Thêm/xóa thể loại (không xóa được thể loại đang có truyện sử dụng).
- Dữ liệu được lưu trên Supabase và đồng bộ cho khách truy cập.

> **Lưu ý về Word:** bản này trích xuất văn bản từ `.docx`; không tự chuyển toàn bộ định dạng Word, bảng phức tạp hoặc ảnh nhúng thành dữ liệu truyện. Ảnh bìa được tải riêng trong biểu mẫu. Chỉ đăng nội dung mà nhóm có quyền sử dụng và ghi nguồn đầy đủ.

---

## PHẦN A — Tạo Supabase

1. Vào https://supabase.com/ và đăng ký/đăng nhập.
2. Tạo project mới, đặt tên ví dụ `di-san-viet`; lưu mật khẩu database ở nơi an toàn.
3. Mở **SQL Editor** → **New query**.
4. Mở file `supabase_setup.sql` trong thư mục dự án, sao chép toàn bộ nội dung, dán vào SQL Editor và bấm **Run**.
5. Vào **Project Settings → API** (hoặc **Connect**, tùy giao diện).
6. Sao chép:
   - Project URL.
   - Publishable key (hoặc anon/public key ở dự án cũ).

   **Không dùng `service_role`/secret key trong website.** Khóa công khai vẫn cần RLS đúng như SQL ở trên.

## PHẦN B — Tạo tài khoản quản trị

1. Trong Supabase mở **Authentication → Users → Add user** (giao diện có thể ghi **Create new user**).
2. Nhập email và mật khẩu mạnh mà bé tự quản lý. Nếu có lựa chọn xác nhận email, có thể xác nhận người dùng theo hướng dẫn của Supabase.
3. Tạo user xong, sao chép **User UID** của tài khoản đó.
4. Mở **SQL Editor → New query**, thay `DAN_UID_QUAN_TRI_VIEN` bên dưới bằng UID vừa sao chép, rồi chạy:

```sql
insert into public.admin_users(user_id)
values ('DAN_UID_QUAN_TRI_VIEN')
on conflict (user_id) do nothing;
```

Chỉ những UID được thêm vào `admin_users` mới có quyền quản trị. Không tạo nút đăng ký quản trị công khai trên website.

## PHẦN C — Nối website với Supabase

1. Mở `config.js`.
2. Thay hai dòng mẫu bằng URL và publishable/anon key của project:

```js
window.SUPABASE_URL = "https://YOUR_PROJECT_ID.supabase.co";
window.SUPABASE_ANON_KEY = "YOUR_PUBLISHABLE_OR_ANON_KEY";
```

3. Lưu file. Đừng bao giờ đưa mật khẩu database hoặc `service_role` key vào `config.js`.

## PHẦN D — Đưa code lên GitHub Pages

1. Đăng nhập https://github.com/.
2. Bấm **New repository**, đặt tên ví dụ `di-san-viet`, chọn **Public** (GitHub Pages miễn phí cho repo public).
3. Tải lên các file trong thư mục này ở thư mục gốc repo:
   - `index.html`
   - `style.css`
   - `app.js`
   - `config.js`
   - `supabase_setup.sql` (chỉ là tài liệu SQL; không chạy trên GitHub)
   - `README.md`
4. Vào **Settings → Pages**.
5. Trong **Build and deployment**, chọn **Deploy from a branch**.
6. Chọn branch `main`, folder `/(root)`, bấm **Save**.
7. Chờ GitHub Actions hoàn tất. Website sẽ ở dạng `https://TEN-TAI-KHOAN.github.io/TEN-REPOSITORY/`.

## PHẦN E — Kiểm tra

1. Mở đường dẫn GitHub Pages; trang chủ phải hiện giao diện.
2. Bấm **Quản trị viên** → đăng nhập bằng email/mật khẩu đã tạo.
3. Bấm **Thêm truyện**, nhập tên, thể loại, nội dung, nguồn; có thể chọn xuất bản.
4. Bấm **Lưu truyện**. Truyện đã xuất bản sẽ hiện trong thư viện.
5. Thử **Nhập file Word (.docx)**; kiểm tra tiêu đề và văn bản trích xuất, chọn thể loại, thêm nguồn và lưu.
6. Thử tải ảnh bìa, sửa truyện, ẩn truyện, rồi mở website bằng cửa sổ riêng tư để kiểm tra dữ liệu công khai.

## Nếu gặp lỗi

- **Chưa tải được thư viện:** kiểm tra URL/key trong `config.js`, SQL đã chạy hết chưa và Console của trình duyệt.
- **Invalid API key / Failed to fetch:** kiểm tra URL và publishable/anon key, kết nối mạng.
- **Đăng nhập được nhưng không vào quản trị:** UID tài khoản phải có trong `public.admin_users`.
- **Không lưu được truyện/ảnh:** kiểm tra SQL policies; ảnh chỉ chấp nhận JPG/PNG/WebP và tối đa 5 MB.
- **Trang vẫn hiện phiên bản cũ:** chờ GitHub Pages build xong, tải lại mạnh hoặc mở cửa sổ riêng tư.
- **Tên cột/bảng không tồn tại:** chạy đúng `supabase_setup.sql` trong đúng project Supabase.
- **Không nên dùng file HTML mở trực tiếp bằng `file://`:** hãy chạy qua GitHub Pages hoặc server local vì một số tính năng trình duyệt có thể bị giới hạn.

## Bảo mật và trách nhiệm nguồn tư liệu

- Không bao giờ đưa `service_role` key vào website frontend.
- Không lưu mật khẩu quản trị trong code.
- Chỉ cấp UID quản trị cho người thực sự cần quản lý nội dung.
- RLS là lớp bảo vệ chính cho database; không bỏ các policy trong SQL.
- Trước khi công bố, xác minh nguồn gốc truyện, tác giả, ấn bản, quyền sao chép và quyền dùng hình ảnh. Không phải mọi bản kể lại hoặc minh họa trên Internet đều được tự do sử dụng.
- Bản mẫu hiện lưu nội dung truyện dưới dạng văn bản thuần, không giữ định dạng Word nâng cao. Hãy xem lại văn bản trích xuất trước khi xuất bản.
