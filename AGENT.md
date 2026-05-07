# AI_AGENT_SPEC v2.2 - FLEXIBLE PROJECT (LARAVEL DEFAULT)

root_file: AGENTS.md

---

## 1. ROOT FILE (SOURCE OF TRUTH)

- File chính: `AGENTS.md`
- Đây là **ROOT FILE DUY NHẤT của project**
- BẮT BUỘC đọc trước mọi hành động
- ❌ KHÔNG được chỉnh sửa trực tiếp file này

---

## 2. KIẾN TRÚC DỰ ÁN (DYNAMIC ARCHITECTURE)

### ⚠️ QUY TẮC QUAN TRỌNG

<!-- * Mặc định:

  * Laravel MVC

--- -->

### Nhưng có thể thay đổi theo cấu hình trong `AGENTS.md`

Ví dụ:

```yaml
# project_type: laravel | mvvm | microservices | serverless | jamstack
```

---

### BẮT BUỘC:

- AI phải đọc `AGENTS.md` để xác định:

```yaml
project_type:
architecture:
folder_structure:
```

---

### Sau đó:

- Tuân theo kiến trúc tương ứng

---

### Ví dụ:

#### Nếu:

```yaml
# project_type: laravel
```

→ dùng MVC

#### Nếu:

```yaml
# project_type: mvvm
```

→ dùng Model - View - ViewModel

#### Nếu:

```yaml
project_type: microservices
```

→ tách service riêng

#### Nếu:

```yaml
project_type: serverless
```

→ function-based

#### Nếu:

```yaml
project_type: jamstack
```

→ frontend + API tách riêng

---

### ❌ CẤM:

- Không được tự đoán kiến trúc
- Không được dùng sai pattern
- Không được mix nhiều kiến trúc nếu không có trong `AGENTS.md`

---

## 3. NGUYÊN TẮC TỐI ƯU TOKEN

- KHÔNG đọc toàn bộ code
- LUÔN đọc `.md` trước
- Dựa vào `.md` để xác định:
  - file cần xử lý
  - function liên quan
  - dependency

---

## 4. HỆ THỐNG FILE .md (PROJECT MAP)

Mỗi `.md` là **bản đồ module**

---

### 4.1 Cấu trúc thư mục

```yaml
folder_structure: (được định nghĩa theo project_type)
```

---

### 4.2 Cấu trúc file

```yaml
files:
  file_name:
    type: (model | controller | service | component | function | api)
    path: full/path
    contains:
      - function: name
      - class: name
```

---

### 4.3 Dependency mapping

```yaml
dependencies:
  file_or_class:
    uses:
      - file.function
    affected_by:
      - other_file.function
```

---

### 4.4 Flow

```yaml
flow:
  - trigger:
  - handler:
  - next:
```

---

## 5. CÁCH AI HOẠT ĐỘNG

1. Đọc `AGENTS.md`
2. Xác định `project_type`
3. Xác định module
4. Mở `.md` module
5. Tìm file + function
6. Chỉ đọc đúng phần cần thiết

---

## 6. XỬ LÝ SỬA / XÓA

### Khi sửa:

- Tìm trong `.md`
- Kiểm tra dependencies
- Chỉ sửa phần liên quan

---

### Khi xóa:

1. Tìm file trong `.md`
2. Lấy function
3. Tìm dependencies
4. Sửa các file liên quan

---

### ⚠️ BẮT BUỘC

- Không phá hệ thống
- Không lỗi runtime
- Không xung đột

---

## 7. QUẢN LÝ FILE .md

- 1 module = 1 file `.md`
- Không duplicate
- Update khi code thay đổi

---

## 8. DỌN DẸP

- File test fail → XÓA
- File không dùng → chỉ xóa khi chắc chắn

---

## 9. KIỂM TRA SAU THAY ĐỔI

- import / use
- function call
- dependency
- flow

---

## 10. KIỂM SOÁT THÊM DỮ LIỆU

### ❌ KHÔNG tự ý thêm:

- feature
- logic
- file
- database
- API

---

### Nếu cần thêm:

Phải:

1. Giải thích:
   - lý do
   - ảnh hưởng
   - rủi ro

2. Hỏi:

```text
Bạn có muốn thực hiện thay đổi này không?
Gõ "YEP" để xác nhận
```

---

### Chỉ tiếp tục khi có "YEP"

---

## 11. QUY TẮC CODE

- Theo đúng `project_type`
- Biến:
  - English
  - snake_case hoặc theo convention project

---

## 12. CẤM

- ❌ đoán kiến trúc
- ❌ scan toàn bộ project
- ❌ sửa file không liên quan
- ❌ bỏ qua `.md`
- ❌ tự ý thêm logic
- ❌ code khi chưa có YEP

---

## 13. MỤC TIÊU

- AI hiểu project qua `.md`
- Không tốn token dư
- Không sai kiến trúc
- Không phá hệ thống
- Dễ scale mọi loại project
