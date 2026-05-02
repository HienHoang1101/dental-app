# Tài liệu Đặc tả Yêu cầu Phần mềm (SRS)
## Ứng dụng Phòng Khám Nha — AI Chatbot & Machine Learning

> **Phiên bản:** 1.0 &nbsp;|&nbsp; **Trạng thái:** Draft &nbsp;|&nbsp; **Cập nhật:** 2026  
> **Người viết:** BA Team &nbsp;|&nbsp; **Đối tượng:** Developer, Hội đồng chấm đồ án

---

## Mục lục

1. [Giới thiệu](#1-giới-thiệu)
2. [Mô tả tổng quan hệ thống](#2-mô-tả-tổng-quan-hệ-thống)
3. [Các bên liên quan (Stakeholders)](#3-các-bên-liên-quan-stakeholders)
4. [Yêu cầu chức năng](#4-yêu-cầu-chức-năng)
5. [Yêu cầu phi chức năng](#5-yêu-cầu-phi-chức-năng)
6. [User Stories](#6-user-stories)
7. [Use Case tổng quan](#7-use-case-tổng-quan)
8. [Acceptance Criteria tổng hợp](#8-acceptance-criteria-tổng-hợp)

---

## 1. Giới thiệu

### 1.1 Mục đích tài liệu

Tài liệu này mô tả đầy đủ các yêu cầu chức năng, yêu cầu phi chức năng và user stories của hệ thống quản lý phòng khám nha khoa tích hợp AI. Đây là tài liệu nền tảng để nhóm phát triển thiết kế, lập trình và kiểm thử hệ thống.

### 1.2 Phạm vi hệ thống

Hệ thống bao gồm:
- **Ứng dụng web** dành cho bệnh nhân: tư vấn AI, đặt lịch khám, quản lý hồ sơ.
- **Ứng dụng web** dành cho Admin/Bác sĩ: quản lý lịch hẹn, hồ sơ bệnh nhân, Knowledge Base.
- **AI Chatbot** tích hợp RAG (Retrieval-Augmented Generation) với Gemini API.
- **Module Machine Learning** phân loại triệu chứng tiếng Việt bằng PhoBERT.

### 1.3 Định nghĩa & Thuật ngữ

| Thuật ngữ | Định nghĩa |
|---|---|
| **Bệnh nhân (Patient)** | Người dùng đăng ký sử dụng ứng dụng để tư vấn và đặt lịch |
| **Admin** | Nhân viên phòng khám quản lý hệ thống, lịch hẹn, bác sĩ |
| **Bác sĩ (Doctor)** | Bác sĩ nha khoa được admin thêm vào hệ thống |
| **Chatbot AI** | Hệ thống tư vấn tự động kết hợp ML + RAG + LLM |
| **RAG** | Retrieval-Augmented Generation — tìm kiếm tài liệu nội bộ trước khi sinh câu trả lời |
| **Knowledge Base (KB)** | Tập tài liệu chuyên môn nha khoa do Admin upload |
| **ML Model** | Mô hình học máy phân loại nhóm bệnh từ triệu chứng tiếng Việt |
| **Slot** | Khung giờ khám cụ thể của bác sĩ (VD: 09:00–09:30) |
| **JWT** | JSON Web Token — cơ chế xác thực stateless |

---

## 2. Mô tả tổng quan hệ thống

### 2.1 Bối cảnh

Phòng khám nha khoa hiện tại gặp các vấn đề:
- Bệnh nhân không có kênh tư vấn ngoài giờ làm việc.
- Đặt lịch qua điện thoại dễ nhầm lẫn, bị trùng giờ.
- Bác sĩ không có thông tin tình trạng bệnh nhân trước khi khám.

### 2.2 Mục tiêu hệ thống

| # | Mục tiêu | Đo lường thành công |
|---|---|---|
| G1 | Cung cấp tư vấn nha khoa 24/7 qua AI | Chatbot phản hồi < 5 giây |
| G2 | Giảm tải đặt lịch qua điện thoại | Bệnh nhân tự đặt lịch online hoàn toàn |
| G3 | Cung cấp ngữ cảnh bệnh nhân cho bác sĩ | Admin xem được lịch sử chat AI trước giờ khám |
| G4 | Tư vấn chính xác theo chuyên môn phòng khám | Chatbot ưu tiên KB nội bộ, không tự suy diễn |

### 2.3 Giới hạn hệ thống (Out of Scope — v1)

- Thanh toán online
- Đơn thuốc điện tử gửi về bệnh nhân
- Ứng dụng mobile native (iOS/Android)
- Tích hợp bảo hiểm y tế

---

## 3. Các bên liên quan (Stakeholders)

| Vai trò | Mô tả | Quyền hạn trong hệ thống |
|---|---|---|
| **Bệnh nhân** | Người dùng cuối sử dụng tư vấn và đặt lịch | Đăng ký, chat AI, đặt/hủy lịch, xem lịch sử |
| **Admin** | Nhân viên phòng khám | Quản lý toàn bộ: lịch hẹn, bác sĩ, dịch vụ, KB |
| **Bác sĩ** | Người nhận lịch hẹn | Xem lịch cá nhân, xem hồ sơ bệnh nhân (qua Admin) |
| **Hội đồng chấm** | Người đánh giá đồ án | Không có quyền hệ thống |

---

## 4. Yêu cầu chức năng

### 4.1 Nhóm Auth — Quản lý tài khoản

| Mã | Yêu cầu | Ưu tiên |
|---|---|---|
| F-AUTH-01 | Hệ thống cho phép bệnh nhân đăng ký bằng Email + mật khẩu | Must Have |
| F-AUTH-02 | Hệ thống cho phép đăng nhập bằng Google OAuth 2.0 | Must Have |
| F-AUTH-03 | Hệ thống cấp JWT sau khi đăng nhập thành công | Must Have |
| F-AUTH-04 | Bệnh nhân có thể cập nhật họ tên, số điện thoại, ngày sinh | Must Have |
| F-AUTH-05 | Bệnh nhân có thể ghi chú tiền sử dị ứng thuốc | Must Have |
| F-AUTH-06 | Hệ thống tự động tạo `patient_profile` sau khi đăng ký | Must Have |

---

### 4.2 Nhóm Chat — Chatbot AI Tư vấn

| Mã | Yêu cầu | Ưu tiên |
|---|---|---|
| F-CHAT-01 | Bệnh nhân gửi câu hỏi văn bản về triệu chứng răng miệng | Must Have |
| F-CHAT-02 | ML Model phân loại nhóm bệnh từ câu hỏi tiếng Việt | Must Have |
| F-CHAT-03 | Hệ thống tìm kiếm context liên quan trong Knowledge Base theo nhãn ML | Must Have |
| F-CHAT-04 | Gemini API sinh câu trả lời dựa trên context từ KB | Must Have |
| F-CHAT-05 | Mọi phản hồi AI kèm disclaimer "Kết quả chỉ mang tính tham khảo" | Must Have |
| F-CHAT-06 | Hiển thị nhãn phân loại và % độ tin cậy của ML Model bên cạnh tin nhắn | Should Have |
| F-CHAT-07 | Hệ thống lưu toàn bộ lịch sử hội thoại theo phiên | Must Have |
| F-CHAT-08 | Bệnh nhân xem lại danh sách các phiên chat cũ | Should Have |
| F-CHAT-09 | Mỗi phiên chat được lưu kèm nhãn ML để Admin tra cứu | Must Have |

---

### 4.3 Nhóm Booking — Đặt lịch khám

| Mã | Yêu cầu | Ưu tiên |
|---|---|---|
| F-BOOK-01 | Bệnh nhân xem danh sách bác sĩ và thông tin chuyên khoa | Must Have |
| F-BOOK-02 | Bệnh nhân xem danh sách dịch vụ kèm giá và thời lượng | Must Have |
| F-BOOK-03 | Bệnh nhân chọn bác sĩ, dịch vụ, ngày rồi xem các slot trống | Must Have |
| F-BOOK-04 | Hệ thống ngăn 2 bệnh nhân đặt cùng 1 slot (race condition) | Must Have |
| F-BOOK-05 | Sau khi đặt, hệ thống gửi email xác nhận cho bệnh nhân | Must Have |
| F-BOOK-06 | Bệnh nhân xem danh sách lịch hẹn của mình với trạng thái rõ ràng | Must Have |
| F-BOOK-07 | Bệnh nhân hủy lịch hẹn (chỉ khi trạng thái là `pending`) | Should Have |
| F-BOOK-08 | Bệnh nhân thêm ghi chú khi đặt lịch | Should Have |

---

### 4.4 Nhóm Admin — Quản lý lịch hẹn

| Mã | Yêu cầu | Ưu tiên |
|---|---|---|
| F-ADMIN-01 | Admin xem Dashboard lịch hẹn theo ngày và theo tuần | Must Have |
| F-ADMIN-02 | Admin xác nhận lịch hẹn (chuyển từ `pending` → `confirmed`) | Must Have |
| F-ADMIN-03 | Admin hủy lịch hẹn kèm lý do | Must Have |
| F-ADMIN-04 | Admin dời lịch hẹn sang slot khác | Should Have |
| F-ADMIN-05 | Khi Admin xác nhận/hủy, hệ thống gửi thông báo cho bệnh nhân | Should Have |

---

### 4.5 Nhóm Admin — Quản lý bệnh nhân & bác sĩ

| Mã | Yêu cầu | Ưu tiên |
|---|---|---|
| F-ADMIN-06 | Admin tra cứu thông tin bệnh nhân theo tên hoặc email | Must Have |
| F-ADMIN-07 | Admin xem lịch sử chat AI của bệnh nhân trước giờ khám | Must Have |
| F-ADMIN-08 | Admin thêm / sửa / vô hiệu hóa tài khoản bác sĩ | Must Have |
| F-ADMIN-09 | Admin tạo lịch làm việc (slots) cho bác sĩ theo ngày | Must Have |
| F-ADMIN-10 | Admin thêm / sửa / ẩn dịch vụ và cập nhật giá | Must Have |

---

### 4.6 Nhóm Admin — Quản lý Knowledge Base

| Mã | Yêu cầu | Ưu tiên |
|---|---|---|
| F-KB-01 | Admin upload file PDF lên Knowledge Base | Must Have |
| F-KB-02 | Hệ thống tự động chunk → embed → lưu Pinecone sau khi upload | Must Have |
| F-KB-03 | Admin xem danh sách tài liệu đã upload kèm trạng thái xử lý | Must Have |
| F-KB-04 | Admin xóa tài liệu khỏi KB (xóa cả vector trên Pinecone) | Should Have |

---

## 5. Yêu cầu phi chức năng

### 5.1 Hiệu năng (Performance)

| Mã | Yêu cầu | Ngưỡng đo lường |
|---|---|---|
| NF-PERF-01 | Thời gian phản hồi của Chatbot AI | ≤ 5 giây (P95) |
| NF-PERF-02 | Thời gian tải trang danh sách bác sĩ / dịch vụ | ≤ 2 giây |
| NF-PERF-03 | Xử lý đặt lịch (bao gồm transaction DB + gửi email) | ≤ 3 giây |
| NF-PERF-04 | ML Service phân loại 1 câu hỏi | ≤ 500ms |
| NF-PERF-05 | Pipeline RAG (query Pinecone) | ≤ 1 giây |

### 5.2 Bảo mật (Security)

| Mã | Yêu cầu |
|---|---|
| NF-SEC-01 | Mật khẩu mã hóa bằng bcrypt với cost factor ≥ 12 |
| NF-SEC-02 | JWT lưu trong `httpOnly cookie`, không accessible từ JavaScript |
| NF-SEC-03 | Mọi endpoint cần xác thực đều kiểm tra JWT trước khi xử lý |
| NF-SEC-04 | Endpoint Admin kiểm tra `role = 'admin'` — không chỉ kiểm tra đăng nhập |
| NF-SEC-05 | Dữ liệu y tế (allergy, medical history) chỉ bệnh nhân và Admin được đọc |
| NF-SEC-06 | ML Service không expose ra internet — chỉ nhận request nội bộ từ Backend |
| NF-SEC-07 | API key của Gemini, Pinecone lưu trong biến môi trường, không hardcode |

### 5.3 Khả năng sử dụng (Usability)

| Mã | Yêu cầu |
|---|---|
| NF-UX-01 | Giao diện responsive, chạy tốt trên mobile (≥ 375px) và desktop |
| NF-UX-02 | Cửa sổ chat dễ dùng với người lớn tuổi: font ≥ 16px, nút bấm ≥ 44px |
| NF-UX-03 | Hiển thị loading indicator khi chờ phản hồi AI |
| NF-UX-04 | Hiển thị thông báo lỗi rõ ràng khi mạng yếu hoặc API timeout |
| NF-UX-05 | Disclaimer AI hiển thị nổi bật, không bị ẩn hoặc bỏ qua |

### 5.4 Độ chính xác AI (Accuracy)

| Mã | Yêu cầu |
|---|---|
| NF-ACC-01 | ML Model đạt F1-score ≥ 80% trên tập test |
| NF-ACC-02 | Chatbot phải ưu tiên nội dung từ KB nội bộ trước kiến thức tự do của LLM |
| NF-ACC-03 | Khi KB không có thông tin liên quan, chatbot thông báo và gợi ý bệnh nhân đặt lịch khám trực tiếp |

### 5.5 Khả năng bảo trì (Maintainability)

| Mã | Yêu cầu |
|---|---|
| NF-MAIN-01 | ML Service tách biệt hoàn toàn khỏi Backend — thay model không ảnh hưởng Kotlin |
| NF-MAIN-02 | Code Backend có unit test cho các business logic quan trọng (booking transaction, auth) |
| NF-MAIN-03 | API versioning: prefix `/v1/` để dễ nâng cấp sau này |

---

## 6. User Stories

> **Định dạng:** `As a <role>, I want to <action>, so that <benefit>.`  
> **Ưu tiên:** 🔴 Must Have &nbsp; 🟡 Should Have &nbsp; 🟢 Nice to Have

---

### 👤 Epic 1: Quản lý tài khoản

---

**US-01** 🔴  
*As a* bệnh nhân mới,  
*I want to* đăng ký tài khoản bằng email và mật khẩu,  
*so that* tôi có thể đăng nhập và sử dụng các tính năng của ứng dụng.

**Acceptance Criteria:**
- [ ] Form đăng ký có các trường: Họ tên, Email, Mật khẩu, Số điện thoại
- [ ] Email phải đúng định dạng, mật khẩu tối thiểu 8 ký tự
- [ ] Nếu email đã tồn tại → hiển thị lỗi "Email đã được đăng ký"
- [ ] Sau khi đăng ký thành công → tự động tạo `patient_profile` và chuyển đến trang chính
- [ ] Mật khẩu được mã hóa bcrypt trước khi lưu vào DB

---

**US-02** 🔴  
*As a* bệnh nhân,  
*I want to* đăng nhập bằng tài khoản Google,  
*so that* tôi không cần nhớ thêm mật khẩu.

**Acceptance Criteria:**
- [ ] Nút "Đăng nhập với Google" hiển thị trên trang login
- [ ] Sau khi xác thực Google thành công → hệ thống tạo tài khoản nếu chưa có, hoặc đăng nhập nếu đã có
- [ ] `password_hash` để `NULL` với tài khoản Google
- [ ] JWT được cấp và lưu vào `httpOnly cookie`

---

**US-03** 🔴  
*As a* bệnh nhân,  
*I want to* cập nhật hồ sơ cá nhân bao gồm tiền sử dị ứng thuốc,  
*so that* bác sĩ có thể nắm thông tin quan trọng trước khi điều trị.

**Acceptance Criteria:**
- [ ] Trang hồ sơ có các trường: Họ tên, Ngày sinh, Giới tính, SĐT, Dị ứng thuốc, Lịch sử bệnh
- [ ] Thay đổi được lưu ngay sau khi nhấn "Cập nhật"
- [ ] Hiển thị thông báo thành công sau khi lưu
- [ ] Admin có thể xem thông tin này khi tra cứu bệnh nhân

---

### 🤖 Epic 2: Chatbot AI Tư vấn

---

**US-04** 🔴  
*As a* bệnh nhân,  
*I want to* gõ mô tả triệu chứng của mình vào chatbot,  
*so that* tôi nhận được tư vấn ban đầu mà không cần đợi đến giờ làm việc của phòng khám.

**Acceptance Criteria:**
- [ ] Giao diện chat có ô nhập text và nút gửi
- [ ] Sau khi gửi, hiển thị typing indicator trong lúc chờ AI phản hồi
- [ ] AI phản hồi trong vòng 5 giây
- [ ] Câu trả lời hiển thị trong bubble chat với định dạng dễ đọc

---

**US-05** 🔴  
*As a* bệnh nhân,  
*I want to* thấy AI phân loại triệu chứng của tôi vào nhóm bệnh cụ thể,  
*so that* tôi hiểu AI đang tư vấn dựa trên cơ sở gì.

**Acceptance Criteria:**
- [ ] Bên cạnh câu trả lời hiển thị badge nhãn ML (VD: "Ê buốt • 87%")
- [ ] Màu badge thay đổi theo độ tin cậy: xanh ≥ 80%, vàng 60–79%, đỏ < 60%
- [ ] Khi hover/tap vào badge hiển thị tooltip giải thích ngắn

---

**US-06** 🔴  
*As a* bệnh nhân,  
*I want to* thấy cảnh báo rõ ràng rằng câu trả lời AI chỉ mang tính tham khảo,  
*so that* tôi không nhầm tưởng đây là chẩn đoán y tế chính thức.

**Acceptance Criteria:**
- [ ] Mỗi tin nhắn AI đều có dòng disclaimer phía dưới
- [ ] Disclaimer không thể bị ẩn hoặc xóa bởi người dùng
- [ ] Ngôn ngữ disclaimer rõ ràng: "Kết quả chỉ mang tính tham khảo. Vui lòng gặp bác sĩ để được chẩn đoán chính xác."

---

**US-07** 🟡  
*As a* bệnh nhân,  
*I want to* xem lại lịch sử các cuộc hội thoại cũ với AI,  
*so that* tôi có thể ôn lại lời tư vấn trước đó mà không phải hỏi lại.

**Acceptance Criteria:**
- [ ] Trang "Lịch sử chat" liệt kê các phiên theo thời gian (mới nhất trước)
- [ ] Mỗi phiên hiển thị: ngày giờ, câu hỏi đầu tiên làm preview
- [ ] Click vào phiên → xem toàn bộ hội thoại
- [ ] Không thể gửi thêm tin nhắn vào phiên cũ (read-only)

---

### 📅 Epic 3: Đặt lịch khám

---

**US-08** 🔴  
*As a* bệnh nhân,  
*I want to* xem danh sách bác sĩ và dịch vụ của phòng khám,  
*so that* tôi có thể chọn phù hợp với nhu cầu của mình.

**Acceptance Criteria:**
- [ ] Trang bác sĩ hiển thị: ảnh đại diện, tên, chuyên khoa, mô tả ngắn
- [ ] Trang dịch vụ hiển thị: tên, mô tả, giá, thời lượng
- [ ] Chỉ hiển thị bác sĩ và dịch vụ đang hoạt động (`is_active = true`)
- [ ] Hiển thị đúng trên cả mobile và desktop

---

**US-09** 🔴  
*As a* bệnh nhân,  
*I want to* chọn ngày và thấy các khung giờ trống của bác sĩ,  
*so that* tôi có thể đặt lịch vào thời điểm thuận tiện cho mình.

**Acceptance Criteria:**
- [ ] Chọn bác sĩ → chọn dịch vụ → chọn ngày → hiển thị slot trống
- [ ] Slot đã có người đặt không hiển thị hoặc bị disabled
- [ ] Chỉ cho phép chọn ngày từ hôm nay trở đi
- [ ] Nếu không có slot nào trong ngày → hiển thị "Không có lịch trống ngày này"

---

**US-10** 🔴  
*As a* bệnh nhân,  
*I want to* xác nhận đặt lịch và nhận email thông báo ngay sau đó,  
*so that* tôi có bằng chứng xác nhận lịch hẹn và không lo bị quên.

**Acceptance Criteria:**
- [ ] Trang xác nhận hiển thị: tên bác sĩ, dịch vụ, ngày giờ, tổng tiền
- [ ] Nhấn "Xác nhận đặt lịch" → hệ thống xử lý và chuyển sang trang thành công
- [ ] Email xác nhận gửi đến trong vòng 60 giây
- [ ] Email chứa: thông tin lịch hẹn, địa chỉ phòng khám, hướng dẫn hủy lịch
- [ ] Nếu slot vừa bị người khác đặt trước → hiển thị lỗi "Slot này vừa được đặt, vui lòng chọn giờ khác"

---

**US-11** 🟡  
*As a* bệnh nhân,  
*I want to* hủy lịch hẹn đang chờ xác nhận,  
*so that* tôi không bị tính phí và slot đó được giải phóng cho người khác.

**Acceptance Criteria:**
- [ ] Chỉ hủy được lịch có trạng thái `pending`
- [ ] Lịch đã `confirmed` hoặc `completed` không thể tự hủy — phải liên hệ phòng khám
- [ ] Sau khi hủy, `is_booked` của slot tương ứng trở về `false`
- [ ] Hiển thị thông báo hủy thành công

---

### 🏥 Epic 4: Quản trị — Lịch hẹn

---

**US-12** 🔴  
*As a* admin,  
*I want to* xem tổng hợp lịch hẹn trong ngày và tuần trên Dashboard,  
*so that* tôi quản lý được công việc của phòng khám một cách tổng thể.

**Acceptance Criteria:**
- [ ] Dashboard có 2 chế độ xem: Ngày (dạng list) và Tuần (dạng calendar grid)
- [ ] Mỗi lịch hẹn hiển thị: tên bệnh nhân, bác sĩ, dịch vụ, giờ, trạng thái (badge màu)
- [ ] Có thể lọc theo bác sĩ hoặc trạng thái
- [ ] Số lượng lịch hẹn theo trạng thái hiển thị dạng summary card phía trên

---

**US-13** 🔴  
*As a* admin,  
*I want to* xác nhận hoặc hủy lịch hẹn của bệnh nhân,  
*so that* bệnh nhân biết lịch của mình đã được phòng khám tiếp nhận.

**Acceptance Criteria:**
- [ ] Nút "Xác nhận" và "Hủy" hiển thị với mỗi lịch ở trạng thái `pending`
- [ ] Khi hủy → bắt buộc nhập lý do (ít nhất 10 ký tự)
- [ ] Sau khi thực hiện → trạng thái cập nhật ngay trên Dashboard
- [ ] `is_booked` của slot được reset về `false` khi hủy

---

**US-14** 🔴  
*As a* admin,  
*I want to* xem lịch sử hội thoại AI của bệnh nhân trước giờ khám,  
*so that* bác sĩ có thể nắm bắt tình trạng và chuẩn bị trước khi khám.

**Acceptance Criteria:**
- [ ] Từ trang chi tiết lịch hẹn, có nút "Xem lịch sử chat AI"
- [ ] Hiển thị toàn bộ phiên chat gần nhất của bệnh nhân
- [ ] Mỗi tin nhắn của bệnh nhân hiển thị kèm nhãn ML và % confidence
- [ ] Thông tin tiền sử dị ứng của bệnh nhân hiển thị nổi bật ở đầu trang

---

### ⚙️ Epic 5: Quản trị — Nhân sự & Dịch vụ

---

**US-15** 🔴  
*As a* admin,  
*I want to* thêm bác sĩ mới vào hệ thống,  
*so that* bệnh nhân có thể đặt lịch với bác sĩ đó.

**Acceptance Criteria:**
- [ ] Form thêm bác sĩ: tên, chuyên khoa, bằng cấp, mô tả, ảnh đại diện
- [ ] Hệ thống tạo tài khoản `users` với `role = 'doctor'` và bản ghi `doctors` tương ứng
- [ ] Bác sĩ mới chưa có slot nào — Admin phải thêm lịch làm việc riêng
- [ ] Bác sĩ có thể được vô hiệu hóa (`is_active = false`) thay vì xóa

---

**US-16** 🔴  
*As a* admin,  
*I want to* tạo các slot lịch làm việc cho bác sĩ theo ngày,  
*so that* bệnh nhân có thể thấy và đặt vào các khung giờ đó.

**Acceptance Criteria:**
- [ ] Admin chọn bác sĩ, ngày, giờ bắt đầu và kết thúc
- [ ] Hệ thống tự tạo các slot theo bước nhảy bằng `duration_minutes` của dịch vụ (hoặc 30 phút mặc định)
- [ ] Không cho tạo slot trùng giờ cùng bác sĩ cùng ngày
- [ ] Slot có thể tạo theo lô: chọn range giờ sáng/chiều thay vì từng slot

---

**US-17** 🟡  
*As a* admin,  
*I want to* thêm, sửa và ẩn dịch vụ cùng bảng giá,  
*so that* danh sách dịch vụ luôn phản ánh đúng tình trạng thực tế của phòng khám.

**Acceptance Criteria:**
- [ ] Form dịch vụ có: tên, mô tả, giá (VNĐ), thời lượng (phút), nhóm dịch vụ
- [ ] Ẩn dịch vụ (`is_active = false`) — không xóa để giữ lịch sử lịch hẹn cũ
- [ ] Giá phải là số nguyên dương
- [ ] Thay đổi giá không ảnh hưởng đến lịch hẹn đã đặt trước đó

---

### 📚 Epic 6: Knowledge Base

---

**US-18** 🔴  
*As a* admin,  
*I want to* upload tài liệu PDF chuyên môn nha khoa vào Knowledge Base,  
*so that* chatbot AI tư vấn dựa trên kiến thức chuẩn của phòng khám thay vì thông tin tự do.

**Acceptance Criteria:**
- [ ] Chỉ chấp nhận file `.pdf`, tối đa 20MB
- [ ] Sau khi upload → hiển thị trạng thái "Đang xử lý..."
- [ ] Hệ thống tự động: đọc PDF → chunk → embed → lưu Pinecone
- [ ] Sau khi hoàn tất → trạng thái chuyển thành "Sẵn sàng" kèm số đoạn văn đã lập chỉ mục
- [ ] Nếu thất bại → trạng thái "Lỗi" kèm thông báo nguyên nhân

---

**US-19** 🟡  
*As a* admin,  
*I want to* xem danh sách tài liệu đã upload và có thể xóa tài liệu cũ,  
*so that* Knowledge Base luôn chứa thông tin cập nhật và chính xác.

**Acceptance Criteria:**
- [ ] Danh sách hiển thị: tên file gốc, ngày upload, số chunks, trạng thái
- [ ] Có thể xóa tài liệu → hệ thống xóa cả vector tương ứng trên Pinecone
- [ ] Xóa là hành động không thể hoàn tác, cần xác nhận trước khi thực hiện
- [ ] Tài liệu đang ở trạng thái "Đang xử lý" không cho xóa

---

## 7. Use Case tổng quan

```
┌─────────────────────────────────────────────────────────────────┐
│                        HỆ THỐNG NHA KHOA AI                     │
│                                                                  │
│  ┌──────────────────────────────────────────────────────┐       │
│  │                PATIENT SIDE                          │       │
│  │                                                      │       │
│  │  [Đăng ký / Đăng nhập]    ◄── Bệnh nhân             │       │
│  │  [Cập nhật hồ sơ]         ◄── Bệnh nhân             │       │
│  │  [Chat AI tư vấn]         ◄── Bệnh nhân             │       │
│  │  [Xem lịch sử chat]       ◄── Bệnh nhân             │       │
│  │  [Xem bác sĩ / dịch vụ]  ◄── Bệnh nhân             │       │
│  │  [Đặt lịch khám]          ◄── Bệnh nhân             │       │
│  │  [Hủy lịch hẹn]           ◄── Bệnh nhân             │       │
│  └──────────────────────────────────────────────────────┘       │
│                                                                  │
│  ┌──────────────────────────────────────────────────────┐       │
│  │                ADMIN SIDE                            │       │
│  │                                                      │       │
│  │  [Dashboard lịch hẹn]     ◄── Admin                 │       │
│  │  [Xác nhận / Hủy lịch]    ◄── Admin                 │       │
│  │  [Xem hồ sơ bệnh nhân]    ◄── Admin                 │       │
│  │  [Xem chat AI bệnh nhân]  ◄── Admin                 │       │
│  │  [Quản lý bác sĩ]         ◄── Admin                 │       │
│  │  [Tạo lịch làm việc]      ◄── Admin                 │       │
│  │  [Quản lý dịch vụ]        ◄── Admin                 │       │
│  │  [Upload Knowledge Base]  ◄── Admin                 │       │
│  └──────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. Acceptance Criteria tổng hợp

Bảng tổng hợp dùng để kiểm tra trước khi demo hội đồng:

| Mã US | User Story tóm tắt | Tiêu chí kiểm tra chính | Trạng thái |
|---|---|---|---|
| US-01 | Đăng ký bằng email | Tạo tài khoản + profile thành công | ⬜ |
| US-02 | Đăng nhập Google | OAuth flow hoạt động, JWT được cấp | ⬜ |
| US-03 | Cập nhật hồ sơ + dị ứng | Dữ liệu lưu và hiển thị lại đúng | ⬜ |
| US-04 | Chat AI cơ bản | Phản hồi trong 5 giây, đúng ngữ cảnh KB | ⬜ |
| US-05 | Hiển thị nhãn ML | Badge nhãn + % confidence hiển thị | ⬜ |
| US-06 | Disclaimer AI | Disclaimer xuất hiện ở mọi tin nhắn AI | ⬜ |
| US-07 | Xem lịch sử chat | Danh sách phiên, đọc lại được | ⬜ |
| US-08 | Xem bác sĩ / dịch vụ | Hiển thị đúng, chỉ active | ⬜ |
| US-09 | Xem slot trống | Slot đã đặt bị ẩn / disabled | ⬜ |
| US-10 | Đặt lịch + nhận email | Email gửi trong 60s, không trùng slot | ⬜ |
| US-11 | Hủy lịch pending | Slot được giải phóng sau khi hủy | ⬜ |
| US-12 | Dashboard admin | Xem theo ngày/tuần, lọc được | ⬜ |
| US-13 | Xác nhận / hủy lịch | Trạng thái cập nhật, lý do bắt buộc khi hủy | ⬜ |
| US-14 | Admin xem chat AI | Thấy lịch sử + nhãn ML + dị ứng bệnh nhân | ⬜ |
| US-15 | Thêm bác sĩ | Tài khoản + hồ sơ bác sĩ được tạo | ⬜ |
| US-16 | Tạo lịch làm việc | Slots xuất hiện khi bệnh nhân đặt lịch | ⬜ |
| US-17 | Quản lý dịch vụ | Thêm/sửa/ẩn không ảnh hưởng lịch cũ | ⬜ |
| US-18 | Upload Knowledge Base | PDF → chunks → Pinecone, chatbot dùng được | ⬜ |
| US-19 | Xóa tài liệu KB | Vector trên Pinecone bị xóa theo | ⬜ |

---

*Tài liệu này là cơ sở để phát triển, kiểm thử và thuyết trình đồ án. Mọi thay đổi yêu cầu cần cập nhật phiên bản và ghi rõ lý do thay đổi.*
