# Trạm Mưa Đêm

Không gian thư giãn ban đêm viết bằng React 18 (ES Modules + `htm`, không cần bước build), chạy hoàn toàn trên trình duyệt.

Demo (sau khi bật GitHub Pages): <https://theanhzxcv.github.io/tram-mua-dem/>

## Tính năng chính

- **Không gian mưa & âm thanh (Web Audio API)**: Hiệu ứng hạt mưa canvas, bật/tắt tiếng mưa, điều chỉnh mật độ mưa, chọn 4 bản nhạc nền tổng hợp và hẹn giờ ngủ.
- **Trò chuyện & lắng nghe**: Trò chuyện với các nhân vật bot (*Người Gác Trạm Đêm*, *Cú Đêm Nghe Mưa*, *Trà Nóng Khuya*) hoặc ghép đôi 2 tab cùng trình duyệt qua `BroadcastChannel`.
- **Thư giãn & giảm overthinking**: Bài tập thở (4-7-8, 4-4-4-4) có nhịp dẫn và tính năng viết rồi thả trôi suy nghĩ.
- **Mini-game**: Vẽ lên cửa kính mờ và đánh Cờ Caro 6x6 cùng bạn chat hoặc bot.

> **Lưu ý:** Ứng dụng hiện là frontend tĩnh (không có backend). Tính năng ghép đôi 1-1 dùng `BroadcastChannel` nên chỉ kết nối giữa các tab trên cùng một trình duyệt/máy.

## Chạy ở máy cá nhân (Local)

Do dự án dùng ES Modules (`type="module"`) và `<script type="importmap">`, cần mở qua HTTP server (không mở trực tiếp `file://`):

```bash
npx serve front
# hoặc
python -m http.server 8080 --directory front
```

## Publish lên GitHub Pages

Repo đã cấu hình workflow tại `.github/workflows/deploy-pages.yml` để deploy thư mục `front/`:

1. Merge nhánh `dev` vào `main` và push lên GitHub.
2. Trong repo trên GitHub, vào **Settings → Pages → Source**, chọn **GitHub Actions**.
3. Workflow sẽ tự chạy khi có push vào `main` (hoặc bấm **Run workflow** trong tab **Actions**).
