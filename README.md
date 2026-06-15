# Vidora - Decentralized Video Streaming Dapp on Shelby Protocol

Vidora là một Decentralized Video Streaming Platform (Nền tảng phát video phi tập trung) MVP được xây dựng trên **Shelby Protocol** (mạng lưu trữ blob phi tập trung tốc độ cao) và sử dụng **Aptos blockchain** làm coordination/settlement layer. 

Dự án này sử dụng Next.js (App Router), TypeScript, Tailwind CSS, Aptos TS SDK và Shelby Node SDK.

---

## 🛠️ Hướng dẫn Chuẩn Bị & Cấu Hình

Để ứng dụng có thể hoạt động hoàn chỉnh, bạn cần chuẩn bị các API Key và Token Testnet theo các bước dưới đây:

### 1. Lấy API Key từ Geomi
1. Truy cập [geomi.dev](https://geomi.dev) và đăng ký tài khoản.
2. Tạo một **API Resource**, chọn Network = **Testnet**.
3. Copy khóa API được cấp (khóa sẽ có định dạng `aptoslabs_***`).
4. Dán khóa API này vào biến `SHELBY_API_KEY` trong file `.env.local`.

### 2. Cài đặt Petra Wallet & Lấy Địa Chỉ Wallet
1. Cài đặt extension Petra Wallet cho trình duyệt của bạn (Chrome/Brave/Firefox).
2. Tạo ví mới hoặc import ví có sẵn, chuyển mạng sang **Testnet**.
3. Bạn sẽ dùng ví này để kết nối với frontend Vidora khi upload và xác định quyền sở hữu video.

### 3. Claim Testnet Token (Cần 2 loại Token)
Để thực hiện upload video, tài khoản Aptos của bạn (cả tài khoản của Server lưu trong `.env.local` và ví cá nhân Petra) đều cần có các token sau trên mạng Testnet:

#### A. Token APT (để trả phí Gas trên Aptos)
* **Đối với Petra Wallet**: Bạn có thể click trực tiếp vào nút **"Faucet"** trong ví Petra để nhận APT testnet miễn phí.
* **Đối với Server Account**:
  1. Lấy địa chỉ ví của Server (Ví Server được sinh tự động từ private key trong file `.env.local`. Khi chạy ứng dụng, địa chỉ ví Server sẽ hiển thị trong trang Watch hoặc log backend).
  2. Truy cập [Aptos Faucet](https://aptos.dev/network/faucet) hoặc sử dụng tính năng Faucet của Aptos CLI / ví để gửi APT testnet vào địa chỉ Server này.

#### B. Token ShelbyUSD (để trả phí Lưu Trữ Blob trên Shelby Network)
* ShelbyUSD testnet hiện tại được cấp thông qua kênh Discord chính thức của Shelby (early access).
* Hãy tham gia Discord của Shelby Protocol, vào kênh faucet và yêu cầu ShelbyUSD testnet cho địa chỉ ví của Petra và địa chỉ ví của Server của bạn.

---

## ⚙️ Cấu hình Môi trường `.env.local`

Tạo file `.env.local` trong thư mục gốc của project (đã được cấu hình tự động ẩn trong `.gitignore`):

```env
# Private key tài khoản Aptos của Server (sử dụng để ký giao dịch upload & thanh toán phí lưu trữ blob)
# Bạn có thể giữ nguyên key tự động tạo dưới đây để test, hoặc thay thế bằng key cá nhân của bạn.
APTOS_PRIVATE_KEY=your_private_key_here

# API Key lấy từ Geomi (geomi.dev)
SHELBY_API_KEY=your_shelby_api_key_here

# Môi trường chạy mạng
SHELBY_NETWORK=testnet
```

---

## 🚀 Cách Chạy Dự Án Local

Thực hiện các lệnh sau để cài đặt và khởi chạy ứng dụng local:

```bash
# Di chuyển vào thư mục dự án (nếu chưa ở trong thư mục)
cd shelby-video-stream

# Cài đặt dependencies (sử dụng --legacy-peer-deps để giải quyết xung đột phiên bản ví Petra cũ)
npm install --legacy-peer-deps

# Chạy server development
npm run dev
```

Mở trình duyệt và truy cập: [http://localhost:3000](http://localhost:3000)

---

## 📝 Cách Test Upload Video Mẫu

1. **Chuẩn bị video**: Tìm một file video định dạng `.mp4` ngắn (dung lượng nhỏ hơn 100MB, khuyến nghị dưới 10MB để upload nhanh trong quá trình test).
2. **Kết nối ví**: Tại trang chủ Vidora, click nút **"Connect Petra"** ở góc phải thanh điều hướng và phê duyệt kết nối ví Petra của bạn.
3. **Vào trang Upload**: Click vào menu **"Upload"** trên thanh điều hướng.
4. **Điền thông tin và Upload**:
   * Kéo thả hoặc click chọn file video `.mp4` của bạn.
   * Đặt tên tiêu đề video (Title).
   * Click **"Publish Video"**.
5. **Đợi kết quả**:
   * Frontend sẽ gửi file lên server backend.
   * Backend dùng Shelby SDK để đẩy blob dữ liệu lên mạng lưới lưu trữ phi tập trung Shelby Testnet.
   * Sau khi hoàn tất, backend ghi lại metadata vào database file local (`src/data/videos.json`).
6. **Xem video trực tiếp**:
   * Sau khi upload thành công, click **"Watch Video"** để chuyển sang trình phát.
   * Trình phát video HTML5 sẽ stream trực tiếp video của bạn từ gateway Shelby (`https://api.testnet.shelby.xyz/shelby/v1/blobs/...`) hỗ trợ đầy đủ range requests (tua video nhanh/seek và buffer ổn định).

---

## 📂 Cấu trúc mã nguồn chính

* `src/components/AptosProvider.tsx`: Khởi tạo Provider kết nối ví Aptos (Petra).
* `src/components/Navbar.tsx`: Thanh điều hướng và xử lý logic Connect/Disconnect ví Petra.
* `src/app/api/upload/route.ts`: API Route nhận video từ frontend, khởi tạo `ShelbyNodeClient`, upload video lên Shelby Network và lưu metadata vào JSON.
* `src/app/api/videos/route.ts`: API Route lấy danh sách video đã được upload.
* `src/app/upload/page.tsx`: Giao diện form upload, drag & drop và validate kích thước file.
* `src/app/page.tsx`: Giao diện Gallery danh sách video.
* `src/app/watch/[id]/page.tsx`: Trình phát video cùng thông số lưu trữ Web3 chi tiết (Uploader, Storage Address, Expiration).
