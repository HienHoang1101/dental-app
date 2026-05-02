# Business Requirements Document (BRD)
## Ứng dụng Phòng Khám Nha — AI Chatbot & Machine Learning

> **Mã tài liệu:** BRD-NKA-2026-v1.0  
> **Phiên bản:** 1.0 &nbsp;|&nbsp; **Trạng thái:** Draft  
> **Người soạn:** BA Team &nbsp;|&nbsp; **Cập nhật:** 2026  
> **Đối tượng đọc:** Hội đồng chấm đồ án, Nhóm phát triển, Stakeholders

---

## Mục lục

1. [Tóm tắt điều hành](#1-tóm-tắt-điều-hành-executive-summary)
2. [Bối cảnh kinh doanh](#2-bối-cảnh-kinh-doanh)
3. [Mục tiêu kinh doanh](#3-mục-tiêu-kinh-doanh)
4. [Phân tích các bên liên quan](#4-phân-tích-các-bên-liên-quan)
5. [Phân tích hiện trạng & Vấn đề](#5-phân-tích-hiện-trạng--vấn-đề-as-is)
6. [Giải pháp đề xuất](#6-giải-pháp-đề-xuất-to-be)
7. [Yêu cầu nghiệp vụ](#7-yêu-cầu-nghiệp-vụ)
8. [Phân tích rủi ro nghiệp vụ](#8-phân-tích-rủi-ro-nghiệp-vụ)
9. [Phân tích lợi ích & Chi phí](#9-phân-tích-lợi-ích--chi-phí)
10. [Phạm vi & Giới hạn](#10-phạm-vi--giới-hạn)
11. [Tiêu chí nghiệm thu](#11-tiêu-chí-nghiệm-thu)
12. [Phụ lục](#12-phụ-lục)

---

## 1. Tóm tắt điều hành (Executive Summary)

### 1.1 Tổng quan dự án

Dự án xây dựng **hệ thống quản lý phòng khám nha khoa tích hợp trí tuệ nhân tạo**, bao gồm chatbot tư vấn 24/7, hệ thống đặt lịch khám trực tuyến và bảng điều hành dành cho nhân viên phòng khám.

Điểm khác biệt cốt lõi so với các giải pháp hiện có: chatbot **không chỉ dựa vào kiến thức chung của AI** mà còn được tăng cường bằng tài liệu chuyên môn riêng của phòng khám thông qua công nghệ RAG (Retrieval-Augmented Generation), kết hợp với mô hình Machine Learning phân loại triệu chứng tiếng Việt.

### 1.2 Tuyên bố vấn đề

> Phòng khám nha khoa hiện tại không có kênh tư vấn ngoài giờ làm việc, quy trình đặt lịch thủ công gây nhầm lẫn và bác sĩ thiếu thông tin về bệnh nhân trước khi khám, dẫn đến trải nghiệm kém và tổn thất cơ hội tiếp nhận bệnh nhân.

### 1.3 Giải pháp đề xuất

Xây dựng nền tảng web tích hợp ba thành phần:

| Thành phần | Giá trị mang lại |
|---|---|
| **AI Chatbot (RAG + ML)** | Tư vấn nha khoa 24/7 chính xác theo chuyên môn phòng khám |
| **Booking System** | Đặt lịch tự động, không trùng giờ, có email xác nhận |
| **Admin Dashboard** | Bác sĩ nắm thông tin bệnh nhân trước khi khám |

### 1.4 Kết quả kỳ vọng

- Bệnh nhân nhận được tư vấn ban đầu **bất kỳ lúc nào**, không phụ thuộc giờ làm việc.
- Giảm thiểu sai sót đặt lịch qua điện thoại.
- Bác sĩ có đầy đủ ngữ cảnh về tình trạng bệnh nhân trước buổi khám.

---

## 2. Bối cảnh kinh doanh

### 2.1 Giới thiệu tổ chức

**Phòng khám Nha khoa** là mô hình phòng khám tư nhân quy mô vừa, cung cấp các dịch vụ:

| Nhóm dịch vụ | Ví dụ dịch vụ cụ thể |
|---|---|
| Khám & Điều trị | Khám tổng quát, trám răng, nhổ răng, điều trị tủy |
| Phẫu thuật | Nhổ răng khôn, cấy ghép Implant |
| Chỉnh nha | Niềng răng mắc cài, niềng trong suốt Invisalign |
| Thẩm mỹ | Tẩy trắng răng, dán sứ Veneer, bọc răng sứ |
| Nha chu | Cạo vôi răng, điều trị viêm nướu |

### 2.2 Xu hướng thị trường

Thị trường nha khoa Việt Nam đang có những thay đổi đáng chú ý:

- Nhu cầu **tư vấn y tế online** tăng mạnh sau đại dịch, đặc biệt với thế hệ 25–40 tuổi.
- Bệnh nhân ngày càng tra cứu triệu chứng trên internet trước khi đến khám, dẫn đến nguy cơ nhận thông tin không chính xác từ các nguồn không chuyên.
- Các phòng khám cạnh tranh bắt đầu triển khai đặt lịch online, tạo áp lực chuyển đổi số.
- Mô hình **chatbot chuyên ngành y tế** đang được các bệnh viện lớn triển khai thí điểm.

### 2.3 Lý do khởi động dự án

```
Vấn đề nhận diện được                Hậu quả kinh doanh
─────────────────────                ─────────────────────
Không có tư vấn ngoài giờ    ──►    Mất bệnh nhân sang phòng khám khác
                                     có chatbot / fanpage phản hồi 24/7

Đặt lịch qua điện thoại      ──►    Nhầm giờ, trùng lịch, mất thời gian
hoặc nhắn tin thủ công               của cả bệnh nhân lẫn nhân viên

Bác sĩ không có thông tin    ──►    Thời gian khai thác bệnh sử tại chỗ
bệnh nhân trước khi khám             kéo dài, giảm chất lượng trải nghiệm
```

---

## 3. Mục tiêu kinh doanh

### 3.1 Mục tiêu chiến lược

| Mã | Mục tiêu | Loại | Đo lường |
|---|---|---|---|
| **BG-01** | Tăng khả năng tiếp cận bệnh nhân ngoài giờ làm việc | Tăng trưởng | Chatbot hoạt động 24/7, phản hồi < 5 giây |
| **BG-02** | Nâng cao trải nghiệm đặt lịch của bệnh nhân | Chất lượng | Tỷ lệ hoàn tất đặt lịch online ≥ 80% |
| **BG-03** | Cải thiện chất lượng thông tin trước khám | Chất lượng | Bác sĩ đọc được lịch sử AI trước 100% buổi khám |
| **BG-04** | Tư vấn đúng chuyên môn, không gây hiểu nhầm | Tuân thủ | Chatbot ưu tiên KB nội bộ, có disclaimer rõ ràng |
| **BG-05** | Giảm tải công việc thủ công cho nhân viên | Hiệu quả | Admin quản lý lịch trên dashboard, không dùng giấy/Excel |

### 3.2 OKR (Objectives & Key Results)

**Objective 1: Chatbot trở thành kênh tư vấn chính của phòng khám**

| Key Result | Mục tiêu |
|---|---|
| KR1.1 | Chatbot phân loại đúng nhóm bệnh với F1-score ≥ 80% |
| KR1.2 | Thời gian phản hồi chatbot ≤ 5 giây (P95) |
| KR1.3 | Mọi câu trả lời đều kèm disclaimer và ưu tiên KB nội bộ |

**Objective 2: Hệ thống đặt lịch vận hành không lỗi**

| Key Result | Mục tiêu |
|---|---|
| KR2.1 | Không xảy ra trường hợp 2 bệnh nhân đặt cùng 1 slot |
| KR2.2 | Email xác nhận gửi thành công trong 60 giây |
| KR2.3 | Bệnh nhân thấy slot trống chính xác theo thời gian thực |

**Objective 3: Admin vận hành phòng khám hoàn toàn trên hệ thống**

| Key Result | Mục tiêu |
|---|---|
| KR3.1 | Dashboard hiển thị đầy đủ lịch hẹn ngày/tuần |
| KR3.2 | Admin upload và cập nhật KB trong vòng 5 phút |
| KR3.3 | Lịch sử chat AI của bệnh nhân hiển thị trước giờ khám |

---

## 4. Phân tích các bên liên quan

### 4.1 Ma trận Stakeholder

| Stakeholder | Vai trò | Mức ảnh hưởng | Mức quan tâm | Chiến lược tiếp cận |
|---|---|---|---|---|
| **Bệnh nhân** | Người dùng cuối, đối tượng chính | Cao | Cao | Thiết kế UX đơn giản, tư vấn chính xác |
| **Admin / Lễ tân** | Vận hành hệ thống hằng ngày | Cao | Cao | Dashboard rõ ràng, thao tác nhanh |
| **Bác sĩ** | Người nhận thông tin từ hệ thống | Trung bình | Trung bình | Thông tin bệnh nhân đầy đủ trước khám |
| **Nhóm phát triển** | Xây dựng và bảo trì | Cao | Cao | Tài liệu kỹ thuật đầy đủ |
| **Hội đồng chấm** | Đánh giá đồ án | Cao | Cao | Demo rõ ràng, báo cáo chuyên nghiệp |

### 4.2 Nhu cầu & Kỳ vọng từng stakeholder

#### 🧑‍🦷 Bệnh nhân
```
Nhu cầu:
  ✦ Được tư vấn nhanh khi có triệu chứng, không cần chờ đến giờ khám
  ✦ Đặt lịch dễ dàng, biết rõ giờ và bác sĩ nào sẽ khám
  ✦ Nhận xác nhận ngay sau khi đặt lịch

Kỳ vọng:
  ✦ Giao diện thân thiện, dùng được trên điện thoại
  ✦ Chatbot hiểu tiếng Việt tự nhiên (không cần gõ từ khóa chuẩn)
  ✦ Thông tin y tế cá nhân được bảo mật
```

#### 👩‍💼 Admin / Lễ tân
```
Nhu cầu:
  ✦ Xem tổng quan lịch hẹn nhanh mà không cần lật sổ / xem Excel
  ✦ Xác nhận, hủy, dời lịch ngay trên màn hình
  ✦ Tra cứu thông tin bệnh nhân và lịch sử chat AI của họ

Kỳ vọng:
  ✦ Dashboard không cần hướng dẫn nhiều — dùng được ngay
  ✦ Upload tài liệu vào KB đơn giản như upload file bình thường
```

#### 👨‍⚕️ Bác sĩ
```
Nhu cầu:
  ✦ Biết bệnh nhân tiếp theo đã hỏi AI về vấn đề gì
  ✦ Xem tiền sử dị ứng thuốc trước khi điều trị

Kỳ vọng:
  ✦ Thông tin hiển thị gọn gàng, không mất thời gian đọc
```

---

## 5. Phân tích hiện trạng & Vấn đề (As-Is)

### 5.1 Quy trình hiện tại

#### Quy trình tư vấn hiện tại
```
Bệnh nhân có triệu chứng
        │
        ▼
Gọi điện / nhắn tin fanpage ──► Ngoài giờ: KHÔNG CÓ NGƯỜI PHẢN HỒI
        │
        ▼ (trong giờ hành chính)
Nhân viên tư vấn qua điện thoại
        │
  ┌─────┴──────┐
  │            │
  ▼            ▼
Đặt lịch    Chỉ tư vấn miệng
qua phone   (không lưu lại được)
```

#### Quy trình đặt lịch hiện tại
```
Bệnh nhân gọi điện / nhắn tin
        │
        ▼
Nhân viên xem sổ / Excel thủ công
        │
        ├──► Có slot: ghi tên + giờ → dễ sai sót, không thông báo tự động
        │
        └──► Không có slot: báo miệng, bệnh nhân phải tự nhớ gọi lại
```

### 5.2 Vấn đề định lượng

| # | Vấn đề | Tác động nghiệp vụ |
|---|---|---|
| P-01 | Không có kênh tư vấn ngoài giờ làm việc (17:00 – 08:00) | Mất cơ hội tiếp cận bệnh nhân 15/24 giờ mỗi ngày |
| P-02 | Đặt lịch thủ công qua điện thoại / nhắn tin | Nguy cơ trùng lịch, mất thông tin, tốn thời gian nhân viên |
| P-03 | Không lưu nội dung tư vấn | Bác sĩ phải khai thác lại bệnh sử từ đầu mỗi lần khám |
| P-04 | Bệnh nhân tìm thông tin từ Google / mạng xã hội | Tiếp nhận thông tin sai về triệu chứng và cách xử lý |
| P-05 | Không có hệ thống nhắc lịch tự động | Bệnh nhân quên lịch hẹn, phòng khám mất ca khám |

### 5.3 Phân tích nguyên nhân gốc rễ (Root Cause Analysis)

```
                    ┌─────────────────────────┐
                    │  Trải nghiệm bệnh nhân   │
                    │        kém                │
                    └────────────┬────────────┘
                                 │
          ┌──────────────────────┼──────────────────────┐
          │                      │                      │
          ▼                      ▼                      ▼
  Không có tư vấn         Đặt lịch bất           Thiếu thông tin
  ngoài giờ hành chính    tiện, dễ sai sót       chuẩn bị trước khám
          │                      │                      │
          ▼                      ▼                      ▼
  Thiếu kênh tự động       Quản lý lịch           Không lưu lịch sử
  phản hồi bệnh nhân       thủ công               tư vấn của bệnh nhân
```

---

## 6. Giải pháp đề xuất (To-Be)

### 6.1 Tầm nhìn giải pháp

Xây dựng **nền tảng số tích hợp** thay thế toàn bộ quy trình thủ công hiện tại, đặt trọng tâm vào trải nghiệm bệnh nhân và hiệu quả vận hành cho nhân viên phòng khám.

### 6.2 Quy trình tư vấn tương lai (To-Be)

```
Bệnh nhân có triệu chứng — BẤT KỲ GIỜ NÀO
        │
        ▼
Mở ứng dụng web → Chat với AI Chatbot
        │
        ├──► ML Model phân loại triệu chứng tiếng Việt
        │
        ├──► RAG tìm kiếm trong Knowledge Base của phòng khám
        │
        └──► Gemini API sinh câu trả lời chính xác + disclaimer
                    │
                    ▼
        Gợi ý đặt lịch nếu cần khám trực tiếp
```

### 6.3 Quy trình đặt lịch tương lai (To-Be)

```
Bệnh nhân chọn bác sĩ + dịch vụ + ngày
        │
        ▼
Xem slot trống theo thời gian thực
        │
        ▼
Xác nhận đặt lịch (1 click)
        │
        ├──► DB Transaction: đánh dấu slot đã đặt (chống race condition)
        │
        └──► Email xác nhận tự động gửi trong 60 giây
                    │
                    ▼
        Admin thấy lịch hẹn mới trên Dashboard
        Admin xác nhận → Bệnh nhân nhận thông báo
```

### 6.4 So sánh As-Is vs To-Be

| Quy trình | As-Is (Hiện tại) | To-Be (Đề xuất) |
|---|---|---|
| Tư vấn ban đầu | Chỉ trong giờ hành chính, qua điện thoại | 24/7 qua AI Chatbot, phản hồi < 5 giây |
| Đặt lịch | Gọi điện / nhắn tin, ghi sổ thủ công | Tự đặt online, real-time, email tự động |
| Chống trùng lịch | Kiểm tra thủ công, dễ nhầm | Database transaction tự động |
| Thông tin trước khám | Bác sĩ hỏi lại từ đầu | Admin/Bác sĩ xem lịch sử chat AI |
| Tri thức tư vấn | Nhân viên tư vấn theo kinh nghiệm | KB chuyên môn chuẩn của phòng khám |
| Lưu trữ | Sổ tay, Excel không có cấu trúc | Database quan hệ, tìm kiếm được |

---

## 7. Yêu cầu nghiệp vụ

> Yêu cầu nghiệp vụ (Business Requirements) mô tả **phòng khám cần gì** để đạt mục tiêu kinh doanh, không mô tả cách hệ thống thực hiện (đó là SRS).

### 7.1 Nhóm BR — Tư vấn khách hàng

| Mã | Yêu cầu nghiệp vụ | Mục tiêu liên quan |
|---|---|---|
| **BR-01** | Phòng khám cần có kênh tư vấn tự động hoạt động 24/7 để tiếp nhận bệnh nhân ngoài giờ làm việc | BG-01 |
| **BR-02** | Nội dung tư vấn phải dựa trên kiến thức chuyên môn của phòng khám, không được tự ý tư vấn sai phác đồ | BG-04 |
| **BR-03** | Mọi tư vấn AI phải có cảnh báo rõ ràng về giới hạn của chatbot, tránh bệnh nhân hiểu nhầm là chẩn đoán chính thức | BG-04 |
| **BR-04** | Hệ thống phải phân loại được nhóm bệnh từ mô tả triệu chứng tiếng Việt của bệnh nhân để định hướng tư vấn | BG-01 |
| **BR-05** | Toàn bộ nội dung hội thoại phải được lưu trữ để bác sĩ tham khảo trước buổi khám | BG-03 |

---

### 7.2 Nhóm BR — Đặt lịch khám

| Mã | Yêu cầu nghiệp vụ | Mục tiêu liên quan |
|---|---|---|
| **BR-06** | Bệnh nhân phải có thể tự đặt lịch khám online mà không cần gọi điện hay nhắn tin cho nhân viên | BG-02, BG-05 |
| **BR-07** | Hệ thống phải đảm bảo tuyệt đối không có hai bệnh nhân đặt cùng một khung giờ của cùng một bác sĩ | BG-02 |
| **BR-08** | Bệnh nhân phải nhận được xác nhận lịch hẹn ngay sau khi đặt thành công, không cần chờ nhân viên phản hồi | BG-02 |
| **BR-09** | Bệnh nhân phải có thể xem toàn bộ lịch sử lịch hẹn của mình | BG-02 |

---

### 7.3 Nhóm BR — Vận hành nội bộ

| Mã | Yêu cầu nghiệp vụ | Mục tiêu liên quan |
|---|---|---|
| **BR-10** | Admin phải có giao diện tổng hợp để quản lý lịch hẹn toàn bộ phòng khám theo ngày và tuần | BG-05 |
| **BR-11** | Admin phải có thể xác nhận, hủy hoặc dời lịch hẹn của bệnh nhân từ cùng một màn hình | BG-05 |
| **BR-12** | Trước mỗi buổi khám, bác sĩ hoặc admin phải truy cập được lịch sử chat AI và hồ sơ y tế của bệnh nhân | BG-03 |
| **BR-13** | Admin phải có thể tự cập nhật danh sách bác sĩ, lịch làm việc và bảng giá dịch vụ mà không cần hỗ trợ kỹ thuật | BG-05 |
| **BR-14** | Admin phải có thể upload tài liệu chuyên môn mới để cập nhật kiến thức cho chatbot bất kỳ lúc nào | BG-04 |

---

### 7.4 Nhóm BR — Bảo mật & Tuân thủ

| Mã | Yêu cầu nghiệp vụ | Mục tiêu liên quan |
|---|---|---|
| **BR-15** | Dữ liệu y tế cá nhân của bệnh nhân (tiền sử dị ứng, lịch sử bệnh, nội dung chat) phải được bảo mật, chỉ bản thân bệnh nhân và nhân viên có thẩm quyền mới được xem | BG-04 |
| **BR-16** | Hệ thống phải phân quyền rõ ràng: bệnh nhân chỉ xem được dữ liệu của mình, admin mới có quyền quản trị | BG-04 |

---

### 7.5 Bản đồ Business Requirements → Mục tiêu

```
BG-01 (Tư vấn 24/7)     ◄── BR-01, BR-04
BG-02 (Trải nghiệm đặt lịch) ◄── BR-06, BR-07, BR-08, BR-09
BG-03 (Ngữ cảnh trước khám)  ◄── BR-05, BR-12
BG-04 (Chính xác & Tuân thủ) ◄── BR-02, BR-03, BR-14, BR-15, BR-16
BG-05 (Hiệu quả vận hành)    ◄── BR-10, BR-11, BR-13
```

---

## 8. Phân tích rủi ro nghiệp vụ

### 8.1 Ma trận rủi ro

| Mã | Rủi ro | Khả năng | Tác động | Mức độ | Biện pháp giảm thiểu |
|---|---|---|---|---|---|
| **R-01** | Chatbot tư vấn sai → bệnh nhân tự xử lý thay vì đi khám | Trung bình | Rất cao | 🔴 Cao | Disclaimer bắt buộc, ưu tiên KB nội bộ, gợi ý đặt lịch khi không chắc |
| **R-02** | Dataset tiếng Việt không đủ chất lượng → ML kém chính xác | Cao | Cao | 🔴 Cao | Thu thập tối thiểu 500 câu/nhãn, augment data, fallback về nhãn "khac" |
| **R-03** | Bệnh nhân lộ thông tin y tế cá nhân | Thấp | Rất cao | 🟡 Trung bình | Mã hóa bcrypt, JWT httpOnly, phân quyền chặt chẽ theo role |
| **R-04** | Gemini API gián đoạn → chatbot không hoạt động | Thấp | Cao | 🟡 Trung bình | Hiển thị thông báo lỗi thân thiện, gợi ý gọi điện trực tiếp |
| **R-05** | 2 bệnh nhân đặt trùng slot | Thấp | Cao | 🟡 Trung bình | Database transaction + UNIQUE constraint trên schedule_id |
| **R-06** | Admin upload tài liệu sai nội dung vào KB | Trung bình | Cao | 🟡 Trung bình | Admin xem danh sách + có thể xóa tài liệu, review trước khi dùng |
| **R-07** | Phạm vi dự án quá lớn → không hoàn thành đúng hạn | Cao | Cao | 🔴 Cao | Phân phase rõ ràng, cắt tính năng nice-to-have nếu trễ |

### 8.2 Risk Heatmap

```
          TÁC ĐỘNG
          Rất cao │ R-01          R-03
             Cao  │              R-04  R-05  R-06         R-02
          Trung bình │
            Thấp │ R-07
                 └──────────────────────────────────────────
                   Thấp   Trung bình   Cao     Rất cao
                                              KHẢ NĂNG
```

---

## 9. Phân tích lợi ích & Chi phí

### 9.1 Lợi ích (Benefits)

#### Lợi ích định tính

| Lợi ích | Đối tượng hưởng lợi |
|---|---|
| Tư vấn nha khoa chính xác và tin cậy bất kỳ lúc nào | Bệnh nhân |
| Giảm lo lắng khi có triệu chứng — biết mình nên làm gì | Bệnh nhân |
| Quy trình đặt lịch nhanh, minh bạch, có xác nhận tức thì | Bệnh nhân |
| Admin vận hành hiệu quả hơn, ít sai sót thủ công | Phòng khám |
| Bác sĩ khám bệnh hiệu quả hơn nhờ có ngữ cảnh trước | Phòng khám |
| Hình ảnh phòng khám chuyên nghiệp, ứng dụng công nghệ | Phòng khám |

#### Lợi ích định lượng (ước tính cho môi trường sản xuất)

| Chỉ số | Trước khi triển khai | Sau khi triển khai | Cải thiện |
|---|---|---|---|
| Giờ có thể tiếp nhận tư vấn | 8 giờ/ngày | 24 giờ/ngày | +200% |
| Thời gian xử lý 1 lịch hẹn | ~5 phút (gọi điện) | ~1 phút (tự đặt) | -80% |
| Tỷ lệ nhầm lịch / trùng slot | Cao (thủ công) | 0% (transaction DB) | -100% |
| Thời gian bác sĩ khai thác bệnh sử | ~5 phút/ca | ~2 phút/ca | -60% |

### 9.2 Chi phí (Costs)

#### Chi phí phát triển (đồ án — ước tính)

| Hạng mục | Chi phí | Ghi chú |
|---|---|---|
| Supabase (PostgreSQL + Auth) | $0 | Free tier đủ cho đồ án |
| Pinecone Vector DB | $0 | Free tier: 1 index, 100k vectors |
| Gemini API | $0 | Free tier: 15 RPM |
| Resend (Email service) | $0 | Free tier: 3,000 email/tháng |
| Vercel (Deploy Next.js) | $0 | Free tier |
| **Tổng chi phí hạ tầng** | **$0** | Phù hợp cho mục đích đồ án |

#### Chi phí nguồn lực

| Hạng mục | Ước tính |
|---|---|
| Thời gian phát triển | 12 tuần × ~20 giờ/tuần = 240 giờ |
| Thu thập & gán nhãn dataset | ~20 giờ |
| Viết tài liệu | ~15 giờ |

---

## 10. Phạm vi & Giới hạn

### 10.1 Trong phạm vi (In Scope)

| # | Tính năng | Ưu tiên |
|---|---|---|
| 1 | Đăng ký / Đăng nhập (Email + Google OAuth) | Must Have |
| 2 | Quản lý hồ sơ bệnh nhân và tiền sử dị ứng | Must Have |
| 3 | AI Chatbot tư vấn (text) với RAG + ML | Must Have |
| 4 | Phân loại triệu chứng tiếng Việt (ML Model) | Must Have |
| 5 | Quản lý Knowledge Base (upload PDF) | Must Have |
| 6 | Xem danh sách bác sĩ và dịch vụ | Must Have |
| 7 | Đặt lịch khám online (chọn bác sĩ, dịch vụ, slot) | Must Have |
| 8 | Email xác nhận sau khi đặt lịch | Must Have |
| 9 | Admin Dashboard: quản lý lịch hẹn ngày/tuần | Must Have |
| 10 | Admin: xác nhận / hủy / dời lịch | Must Have |
| 11 | Admin: xem lịch sử chat AI của bệnh nhân | Must Have |
| 12 | Admin: quản lý bác sĩ, lịch làm việc, dịch vụ | Must Have |
| 13 | Bệnh nhân hủy lịch hẹn đang chờ | Should Have |
| 14 | Hiển thị nhãn ML và confidence trên chat | Should Have |

### 10.2 Ngoài phạm vi (Out of Scope — v1)

| # | Tính năng | Lý do loại trừ |
|---|---|---|
| OOS-01 | Thanh toán online | Phức tạp về pháp lý, cần tích hợp cổng thanh toán |
| OOS-02 | Ứng dụng mobile native (iOS/Android) | Ngoài thời gian và phạm vi đồ án |
| OOS-03 | Đơn thuốc điện tử | Cần tuân thủ quy định y tế, để lại Phase 2 |
| OOS-04 | Tích hợp bảo hiểm y tế | Phụ thuộc hệ thống bên thứ ba |
| OOS-05 | Phân tích ảnh X-quang (Computer Vision) | Dữ liệu khó thu thập, để lại Phase 2 |
| OOS-06 | Đặt lịch tái khám tự động | Nice-to-have, để lại Phase 2 |
| OOS-07 | Nhắc lịch hẹn qua SMS | Chi phí phát sinh, thay bằng email |
| OOS-08 | Báo cáo doanh thu, thống kê nâng cao | Ngoài scope đồ án |

### 10.3 Các giả định (Assumptions)

- Hệ thống được thiết kế cho quy mô phòng khám vừa (5–10 bác sĩ, ≤ 50 lịch hẹn/ngày).
- Bệnh nhân sử dụng tiếng Việt trong toàn bộ tương tác với chatbot.
- Admin có khả năng sử dụng máy tính cơ bản và hiểu tiếng Anh đủ để đọc tên trạng thái.
- Phòng khám cung cấp tài liệu PDF chuyên môn để nạp vào Knowledge Base.
- Gemini API free tier đủ cho lượng truy cập của đồ án/demo.

### 10.4 Các ràng buộc (Constraints)

| Ràng buộc | Mô tả |
|---|---|
| Thời gian | 12 tuần phát triển |
| Ngân sách | $0 — chỉ dùng free tier các dịch vụ |
| Công nghệ | Kotlin (Ktor) cho Backend theo yêu cầu đồ án |
| Ngôn ngữ UI | Tiếng Việt |
| Pháp lý | Chatbot không được đưa ra chẩn đoán chính thức — bắt buộc có disclaimer |

---

## 11. Tiêu chí nghiệm thu

### 11.1 Tiêu chí nghiệm thu nghiệp vụ (Business Acceptance Criteria)

Hệ thống được coi là đáp ứng yêu cầu khi **tất cả** các tiêu chí sau đều đạt:

#### Nhóm Chatbot AI

| # | Tiêu chí | Cách kiểm tra |
|---|---|---|
| BAC-01 | Chatbot phản hồi câu hỏi tiếng Việt về triệu chứng răng miệng | Nhập 10 câu hỏi mẫu, đánh giá câu trả lời |
| BAC-02 | ML Model phân loại đúng nhóm bệnh với accuracy ≥ 80% | Chạy trên tập test 20% dataset |
| BAC-03 | Câu trả lời ưu tiên nội dung từ Knowledge Base đã upload | So sánh phản hồi trước/sau khi upload tài liệu |
| BAC-04 | Disclaimer xuất hiện trong 100% phản hồi AI | Kiểm tra thủ công 20 tin nhắn AI |
| BAC-05 | Lịch sử hội thoại được lưu và truy xuất được | Đăng xuất rồi đăng nhập lại, kiểm tra lịch sử |

#### Nhóm Đặt lịch

| # | Tiêu chí | Cách kiểm tra |
|---|---|---|
| BAC-06 | Luồng đặt lịch end-to-end hoàn tất không lỗi | Thực hiện đặt lịch từ đầu đến cuối |
| BAC-07 | Không thể đặt 2 lịch vào cùng 1 slot | Mở 2 tab, đặt cùng lúc vào 1 slot |
| BAC-08 | Email xác nhận nhận được trong 60 giây | Đo thời gian từ khi đặt đến khi nhận email |
| BAC-09 | Slot đã đặt không hiện trong danh sách trống | Kiểm tra sau khi đặt thành công |

#### Nhóm Admin

| # | Tiêu chí | Cách kiểm tra |
|---|---|---|
| BAC-10 | Dashboard hiển thị đầy đủ lịch hẹn theo ngày/tuần | Thêm 5 lịch hẹn mẫu, xem Dashboard |
| BAC-11 | Admin xác nhận lịch hẹn thành công | Xác nhận 1 lịch pending, kiểm tra trạng thái |
| BAC-12 | Admin xem được lịch sử chat AI của bệnh nhân | Vào trang chi tiết bệnh nhân |
| BAC-13 | Upload PDF vào KB thành công và chatbot dùng được | Upload tài liệu, hỏi chatbot nội dung trong tài liệu |

### 11.2 Tiêu chí nghiệm thu kỹ thuật

| # | Tiêu chí | Ngưỡng |
|---|---|---|
| TAC-01 | Thời gian phản hồi chatbot | ≤ 5 giây (P95) |
| TAC-02 | Không có lỗi 500 trong luồng booking | 0 lỗi trong 10 lần thực hiện |
| TAC-03 | Giao diện hiển thị đúng trên mobile | Test trên màn hình 375px |
| TAC-04 | Đăng nhập / đăng xuất không lỗi | 10/10 lần thành công |

---

## 12. Phụ lục

### 12.1 Glossary — Bảng thuật ngữ đầy đủ

| Thuật ngữ | Viết tắt | Định nghĩa |
|---|---|---|
| Business Requirements Document | BRD | Tài liệu mô tả yêu cầu nghiệp vụ từ góc độ tổ chức |
| Software Requirements Specification | SRS | Tài liệu mô tả yêu cầu phần mềm chi tiết |
| Retrieval-Augmented Generation | RAG | Kỹ thuật tăng cường LLM bằng cách tìm kiếm tài liệu liên quan trước khi sinh câu trả lời |
| Large Language Model | LLM | Mô hình ngôn ngữ lớn (GPT, Gemini, ...) |
| Machine Learning | ML | Học máy — mô hình học từ dữ liệu để dự đoán |
| PhoBERT | — | Mô hình BERT được pre-train trên tiếng Việt bởi VinAI |
| Knowledge Base | KB | Tập tài liệu chuyên môn được embedding và lưu vào Vector DB |
| Vector Database | Vector DB | Cơ sở dữ liệu lưu trữ và tìm kiếm vector embedding (Pinecone) |
| JSON Web Token | JWT | Chuẩn xác thực stateless, mã hóa thông tin người dùng |
| Race Condition | — | Tình huống 2 thao tác đồng thời cùng xử lý 1 tài nguyên, gây sai dữ liệu |
| Out of Scope | OOS | Tính năng/yêu cầu không nằm trong phạm vi dự án hiện tại |

### 12.2 Tài liệu tham chiếu

| Tài liệu | Mô tả |
|---|---|
| `SYSTEM_DESIGN.md` | Thiết kế kiến trúc hệ thống, ERD, API spec, Sequence diagram |
| `DATABASE_DESIGN.md` | Thiết kế database chi tiết, SQL script khởi tạo |
| `REQUIREMENTS_SPECIFICATION.md` | SRS — Yêu cầu chức năng, phi chức năng, User Stories |
| `ke_hoach_do_an_nha_khoa.docx` | Kế hoạch xây dựng 12 tuần theo phase |

### 12.3 Lịch sử thay đổi tài liệu

| Phiên bản | Ngày | Người thực hiện | Nội dung thay đổi |
|---|---|---|---|
| 1.0 | 2026-03-26 | BA Team | Khởi tạo tài liệu BRD |

---

*Tài liệu BRD này là tài liệu cấp cao nhất trong bộ tài liệu đồ án, phản ánh góc nhìn nghiệp vụ của dự án. Mọi quyết định thiết kế kỹ thuật đều phải truy nguyên được về ít nhất một Business Requirement trong tài liệu này.*
