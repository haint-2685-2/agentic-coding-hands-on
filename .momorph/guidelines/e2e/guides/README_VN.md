# Hướng Dẫn Setup Dự Án Playwright & Tạo Test - Đầy Đủ

## 🎯 **Tổng Quan**

Hướng dẫn này cung cấp 3 luồng làm việc cho Playwright test automation:

1. **🏗️ Luồng Setup Dự Án** - Chạy duy nhất một lần đầu tiên để setup dự án
2. **⚡ Luồng Tạo Test** - Hay dùng nhất --> để tạo test nhanh chóng và hiệu quả
3. **🔍 Luồng Review Code** - Chạy sau khi code test AI gen done.

---

## 🏗️ **Luồng 1: Setup Dự Án (Một Lần)**

### **Khi Nào Sử Dụng**

- Setup dự án Playwright mới từ đầu
- Cần cấu trúc dự án hoàn chỉnh với authentication, page objects, và configurations
- Lần đầu làm việc với website hoặc website mới

### **Yêu Cầu Tiên Quyết**

```bash
# Cài đặt bắt buộc
- Node.js (phiên bản 18+)
- VS Code với GitHub Copilot extension
- MCP Playwright

# Khởi tạo dự án
mkdir my-playwright-project 
cd my-playwright-project
yarn create playwright
```

### **Bước 1: Thu Thập Thông Tin Dự Án**

**Cho Dự Án Multi-Site** (nhiều website khác nhau):

```yaml
project_type: "multi-site"
sites:
  - name: "main-site"
    base_url: "https://main-app.example.com"
    login_url: "https://main-app.example.com/login"
    auth_fields:
      - name: "email"
        env_var: "MAIN_SITE_EMAIL"
        example: "user@example.com"
      - name: "password"
        env_var: "MAIN_SITE_PASSWORD"
        example: "password123"
  - name: "admin-portal"
    base_url: "https://admin.example.com"
    login_url: "https://admin.example.com/signin"
    auth_fields:
      - name: "username"
        env_var: "ADMIN_USERNAME"
        example: "admin"
      - name: "password"
        env_var: "ADMIN_PASSWORD"
        example: "adminpass"
```

**Cho Dự Án Single-Site Multi-Role** (một website với nhiều role người dùng khác nhau):

```yaml
project_type: "single-site-multi-role"
base_url: "https://myapp.example.com"
login_url: "https://myapp.example.com/login"
roles:
  - name: "admin"
    auth_fields:
      - name: "email"
        env_var: "ADMIN_EMAIL"
        example: "admin@example.com"
      - name: "password"
        env_var: "ADMIN_PASSWORD"
        example: "admin123"
  - name: "user"
    auth_fields:
      - name: "email"
        env_var: "USER_EMAIL"
        example: "user@example.com"
      - name: "password"
        env_var: "USER_PASSWORD"
        example: "user123"
```

### **Bước 2: Thực Hiện Luồng Thiết Lập**

Đặt các folder chứa prompts folder my-playwright-project (tên dự án cho bạn đặt) mà bạn tạo trước đó 

Mở GitHub Copilot Chat trong VS Code và paste:

```prompt
Setup Playwright Project theo 1_project_setup_workflow.md:

[Paste cấu hình dự án của bạn vào đây]

Thực hiện Phase 1: Setup nền tảng hoàn chỉnh với các yêu cầu:
- Tạo cấu trúc dự án hoàn chỉnh
- Tạo tất cả file cấu hình
- Setup hệ thống authentication
- Tạo base page objects
- Đảm bảo TypeScript compilation
- Validate các sample test chạy thành công
```

### **Bước 3: Cập Nhật Thông Tin Đăng Nhập Thật**

Sau khi setup hoàn tất, cập nhật file `.env` được tạo với thông tin đăng nhập thực:

```bash
# Ví dụ file .env (thay thế với giá trị thật)
MAIN_SITE_EMAIL=real-email@sun-asterisk.com
MAIN_SITE_PASSWORD=RealPassword123
ADMIN_USERNAME=realadmin
ADMIN_PASSWORD=RealAdminPass456
```

### **Bước 4: Xác Nhận**

Setup hoàn tất khi bạn thấy:

- ✅ Cấu trúc dự án hoàn chỉnh được tạo
- ✅ Tất cả cấu hình hoạt động và được validate
- ✅ Sample authentication test chạy thành công
- ✅ Sẵn sàng để tạo test

---

## ⚡ **Luồng 2: Tạo Test**

### **Khi Nào Sử Dụng**

- Dự án đã được setup hoàn chỉnh
- Cần tạo test case mới nhanh chóng
- Thêm test cho tính năng mới hoặc bug fix
- Các tác vụ test automation hàng ngày

### **Bước 1: Chọn Phương Thức Input**

**Phương Thức BEST: Specs + Code Analysis + MCP Web Access (Cách Tiếp Cận Toàn Diện) 🏆**

```prompt
Tạo test từ specification, frontend code và sử dụng MCP web để truy cập web với [account/password - cung cấp account/password của site dự án] và thực hiện theo các bước ở 2_test_generation_workflow.md:

Target: [tên feature/component cần test]
Input method: Combined specification, frontend code analysis, and MCP web access
URL: [URL target cho phân tích trực tiếp]
Test scenarios: [mô tả các scenarios từ specs]
Additional context: [thông tin bổ sung nếu có]

[Đính kèm cả hai:
1. File specification (.md) - định nghĩa yêu cầu và scenarios
2. File code frontend (.tsx, .vue, .js, .ts) - để phân tích cấu trúc code]

Thực hiện khám phá web trực tiếp để:
- Trích xuất cấu trúc DOM thực và locators từ trang live
- Phân tích thuộc tính và mối quan hệ của các elements
- Tạo ra selectors chính xác và ổn định nhất
```

**Phương Thức A: MCP Playwright Live Web Analysis**

```prompt
Tạo test sử dụng MCP Playwright truy cập web và thực hiện theo các bước ở 2_test_generation_workflow.md:

Target: [tên feature/component cần test]
Input method: MCP Playwright live web analysis
URL: [URL target để phân tích]
Test scenarios: [mô tả các scenarios cần test]
Additional context: [thông tin bổ sung nếu có]

Thực hiện khám phá web trực tiếp để:
- Trích xuất cấu trúc DOM thực và locators từ trang live
- Phân tích thuộc tính và mối quan hệ của các elements
- Tạo ra selectors chính xác và ổn định nhất
```

**Phương Thức B: Truyền Specs (Khuyến Nghị)**

```prompt
Tạo test từ specification sử dụng 2_test_generation_workflow.md:

Target: validation đăng nhập cho main-site
Input method: Specification file
Test scenarios:
- Đăng nhập thành công với thông tin hợp lệ
- Xử lý lỗi với thông tin không hợp lệ
- Validation cho các field trống
- Chức năng hiện/ẩn mật khẩu

[Đính kèm file specification .md nếu có]
```

**Phương Thức C: URL Exploration**

```prompt
Tạo test sử dụng 2_test_generation_workflow.md:

Target: chức năng login của main-site
Input method: URL exploration
URL: https://main-app.example.com/login
Scenarios: Khám phá và test tất cả chức năng login
```

**Phương Thức D: Frontend Code Analysis (Khuyến Nghị Kết Hợp)**

```prompt
Tạo test sử dụng 2_test_generation_workflow.md:

Target: [tên feature/component cần test]
Input method: Frontend code analysis
Test scenarios: [mô tả các scenarios cần test]
Additional context: [thông tin bổ sung nếu có]

[Đính kèm file code frontend (React/Vue/Angular component) để phân tích locator chính xác]
```

**Phương Thức E: Mô Tả Đơn Giản**

```prompt
Tạo test sử dụng 2_test_generation_workflow.md:

Yêu cầu test: "Tạo test validation đăng nhập cho admin-portal"
Bao gồm: đăng nhập thành công, xử lý lỗi, validation form
```

### **Bước 2: Tạo Test**

Test generator sẽ tự động:

- 🔍 Phát hiện cấu trúc và quy ước của dự án
- 📝 Tạo file test phù hợp theo pattern của dự án
- 🎯 Sử dụng page objects hiện có (hoặc tạo mới nếu cần)
- 📊 Extract và tổ chức selectors đúng cách
- ✅ Đảm bảo tests pass validation

### **Bước 3: Review và Chạy**

Các test được tạo sẽ:

- ✅ Sẵn sàng để review code
- ✅ Tuân theo nguyên tắc Page Object Model
- ✅ Sử dụng authentication fixtures đúng cách
- ✅ Tích hợp properly với cấu trúc hiện có

### **Bước 4: Review Chất Lượng Code (QUAN TRỌNG)**

Sau khi tạo test, luôn thực hiện code review:

```prompt
Review code được tạo sử dụng 3_code_review_standards.md:

Files được tạo:
- tests/main-site/login/validation.spec.ts
- locales/ja/main-site/selectors/login.json

Focus review:
- Tuân thủ Page Object Model
- Chất lượng selector extraction
- Tuân thủ kiến trúc
- Tiêu chuẩn chất lượng test
```

**Chỉ sau khi review được approve thì tests mới hoàn thành!**

---

## 🔍 **Luồng 3: Review Chất Lượng Code (Sau Khi Tạo)**

### **Khi Nào Sử Dụng**

- Sau khi hoàn thành setup dự án (Luồng 1)
- Sau khi tạo test mới (Luồng 2)
- Trong quá trình audit chất lượng code thường xuyên

### **Bước 1: Thực Hiện Code Review**

```prompt
Review code được tạo sử dụng 3_code_review_standards.md:

Loại review: [initial setup review OR test code review]
Files cần review:
- [danh sách files được tạo/sửa đổi]

Các vùng focus:
- Tuân thủ Page Object Model
- Selector extraction và tổ chức
- Tuân thủ pattern kiến trúc
- Chất lượng và maintainability của test
- Tương thích cross-browser
```

### **Bước 2: Xử Lý Kết Quả Review**

Review sẽ xác định:

- ✅ **Code tuân thủ** - Sẵn sàng cho production
- ⚠️ **Phát hiện vấn đề** - Khuyến nghị cụ thể để fix
- 🔧 **Đề xuất cải thiện** - Tăng cường tùy chọn

### **Bước 3: Approval và Deployment**

Chỉ sau khi review approval:

- ✅ Tests sẵn sàng production
- ✅ Code đáp ứng tiêu chuẩn chất lượng
- ✅ Kiến trúc có thể maintain
- ✅ Sẵn sàng cho team sử dụng

---

## 📞 **Tham Khảo Nhanh**

### **Template Lệnh Thiết Lập**

```prompt
Setup dự án Playwright mới theo 1_project_setup_workflow.md:

project_type: "[multi-site hoặc single-site-multi-role]"
project_name: "[tên-dự-án-của-bạn]"
[paste cấu hình ở đây]

Thực hiện Phase 1: Setup nền tảng hoàn chỉnh
```

### **Template Lệnh Tạo Test**

**Template ULTIMATE Practice (Khuyến Nghị Cao Nhất):**

```prompt
Tạo tests sử dụng MCP Playwright live web analysis với 2_test_generation_workflow.md:

Target: [mô tả feature/page]
Input method: MCP Playwright live web analysis
URL: [URL target cho phân tích trực tiếp]
Test scenarios: [yêu cầu cụ thể]

Thực hiện khám phá web trực tiếp để phân tích DOM thời gian thực và trích xuất locator chính xác.
```

**Template BEST Practice (Cách Tiếp Cận Toàn Diện):**

```prompt
Tạo tests sử dụng 2_test_generation_workflow.md:

Target: [mô tả feature/page]
Input method: Combined specification, frontend code analysis, and MCP web access
URL: [URL target cho phân tích trực tiếp]
Test scenarios: [yêu cầu cụ thể từ specs]

[Đính kèm cả hai:
1. File specification (.md) - định nghĩa yêu cầu và scenarios
2. File code frontend (.tsx, .vue, .js, .ts) - để phân tích cấu trúc code]

Cộng với việc thực hiện MCP Playwright web access để phân tích DOM trực tiếp.
```

**Template Các Phương Thức Khác:**

```prompt
Tạo tests sử dụng 2_test_generation_workflow.md:

Target: [mô tả feature/page]
Input method: [specification/URL exploration/frontend code analysis/MCP web analysis/simple description]
Test scenarios: [yêu cầu cụ thể]

[Nếu sử dụng frontend code analysis, đính kèm file code FE (.tsx, .vue, .js, .ts)]
[Nếu sử dụng MCP analysis, cung cấp target URL]
```

### **Template Lệnh Code Review**

```prompt
Review code được tạo sử dụng 3_code_review_standards.md:

Loại review: [initial setup review OR test code review]
Files cần review: [danh sách files được tạo/sửa đổi]
Các vùng focus: [POM compliance/selector extraction/architecture]
```

### **Vị Trí File**

- **Main prompts**: `.github/prompts/1_project_setup_workflow.md`, `2_test_generation_workflow.md`
- **Code review**: `.github/prompts/3_code_review_standards.md`
- **Component prompts**: `.github/prompts/components/` folder
- **Configurations**: `playwright.config.ts`, `.env`
