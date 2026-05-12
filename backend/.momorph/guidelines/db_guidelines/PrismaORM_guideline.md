# Database Layer Guideline

## Mục lục
1. [Tổng quan & Công nghệ sử dụng](#tong-quan)
2. [Cấu trúc thư mục & file](#cau-truc-thu-muc)
3. [Hướng dẫn sử dụng framework/tech stack](#huong-dan-framework)
4. [File mẫu & cấu trúc](#file-mau)
5. [Scripts & Troubleshooting](#scripts-troubleshooting)
6. [Next.js Integration Notes](#nextjs-integration)
7. [Phụ lục: Mã mẫu, cấu hình, checklist & troubleshooting chi tiết](#phu-luc)
    - [A. Đoạn mã mẫu cho các file chính](#ma-mau)
    - [B. Cấu hình mẫu](#cau-hinh-mau)
    - [C. Checklist validation](#checklist)
    - [D. Troubleshooting chi tiết](#troubleshooting)
    - [E. Format output backend-architecture.json, TODO_LIST.md](#format-output)
    - [F. Hướng dẫn bootstrap, migration, seed, healthcheck](#huong-dan-bootstrap)
    - [G. REQUIRED FILES CHECK](#required-files)
    - [H. Scripts cho package.json](#scripts-package)
    - [I. Lưu ý marker @custom, idempotency, transaction boundaries](#luu-y-marker)
    - [J. Execution protocol & Validation Checklist](#execution-protocol)

---

## 1. Tổng quan & Công nghệ sử dụng <a name="tong-quan"></a>
- **ORM cố định:** Prisma (PostgreSQL)
- **Validation:** zod

### ⚠️ Prisma-Specific Pitfalls Prevention

- **Schema Syntax**: CHỈ dùng `map` trong `@@index`, KHÔNG dùng cả `name` và `map` (Prisma 6+).
- **Type Imports**: ⚠️ **CRITICAL FIX** - Trong entity definitions, KHÔNG import từ `@prisma/client` vì client chưa được generate. Thay vào đó, define manual TypeScript interfaces trước, sau đó match với generated types.
- **Client Generation Order**: Phải generate client TRƯỚC khi compile TypeScript. Thứ tự: schema → generate → compile.
- **Unique Constraints**: Prisma auto-generate tên theo `field1_field2`, kiểm tra generated client.
- **Environment**: Prisma CLI cần `DATABASE_URL`, standalone scripts cần `dotenv.config()`.
- **Hot-reload**: Dùng global singleton pattern cho Next.js development với `globalThis` pattern.
- **Workflow**: `npx prisma validate` → `npx prisma generate` → `npx tsc --noEmit` → `npx prisma migrate dev`.  

---

## 2. Cấu trúc thư mục & file <a name="cau-truc-thu-muc"></a>
- Chỉ sinh lớp DB layer dưới thư mục `lib/` của dự án Next.js (App Router).
- Không sinh bất kỳ route HTTP hay file dưới `app/api/**`.
- Tên file/folder **kebab-case**.
- Idempotent scaffolding: chèn markers `// @custom:start` … `// @custom:end` ở những vùng cho phép custom để lần chạy sau không ghi đè.

---

## 3. Hướng dẫn sử dụng framework/tech stack <a name="huong-dan-framework"></a>
### 1. Prisma Client & Types
- **Entity Definitions**: Sử dụng manual TypeScript interfaces thay vì import từ `@prisma/client` để tránh lỗi compilation khi client chưa generate.
- **Runtime Usage**: Import từ `@prisma/client` chỉ trong runtime code (API routes, services) sau khi client đã generate.

### 2. Environment
- Biến bắt buộc: `DATABASE_URL (Postgres)` cho Prisma CLI và runtime.
- Scripts standalone phải tự `dotenv.config()`.

### 3. Hot-reload Safety
- Dùng singleton pattern cho PrismaClient trong dev (Next.js).

### 4. Workflow CLI
- Thứ tự khuyến nghị:
  - `npx prisma validate`
  - `npx prisma generate`
  - `npx prisma migrate dev`

### 5. Index/Constraints Naming
- Trong Prisma 6+, dùng map cho @@index. Không dùng đồng thời name và map.

### 6. Environment Loading
- Đảm bảo dotenv load trong standalone scripts (seed/test).

### 7. Entity Definition Best Practices (CRITICAL FOR SUCCESS)
- **Manual TypeScript Interfaces**: Entity files phải define manual interfaces thay vì import từ `@prisma/client`.
- **Compilation Order**: Entity files phải compile được TRƯỚC khi Prisma client generate.
- **Schema-Agnostic Approach**: Template generic có thể apply cho bất kỳ database schema nào.
- **Pattern to Follow**:
  ```typescript
  // lib/entities/{model-name}.ts - Replace theo tên model thực tế
  export interface {ModelName} {
    // Map từ Prisma schema model definition
    // Ví dụ: nếu có model Product trong schema
    id: string;
    name: string;
    // ... các fields khác theo schema
  }
  
  // Helper functions dựa trên business logic cụ thể
  export function validate{ModelName}(data: any): boolean {
    // Business validation logic
    return true;
  }
  
  // Soft delete helper (chỉ nếu có deletedAt)
  export function is{ModelName}Deleted(record: {ModelName}): boolean {
    return 'deletedAt' in record && record.deletedAt !== null;
  }
  
  // @custom:start
  // Custom helpers specific to this model
  // @custom:end
  ```

### 8. Error Prevention Strategies
- **Pre-validation**: Luôn validate schema trước khi generate client.
- **Dependency Check**: Verify tất cả dependencies installed trước khi scaffold.
- **Incremental Building**: Build từng component, validate từng bước.
- **Fallback Patterns**: Sử dụng simple interfaces khi complex imports fail.

### 9. Schema-Agnostic Guidelines (UNIVERSAL APPROACH)
- **Flexible Templates**: Tất cả templates sử dụng placeholders có thể thay thế cho bất kỳ schema nào.
- **Model Mapping Strategy**:
  ```
  Prisma Schema Model → Entity File
  model User {}      → lib/entities/user.ts → interface User
  model Product {}   → lib/entities/product.ts → interface Product  
  model Order {}     → lib/entities/order.ts → interface Order
  ```
- **Field Type Mapping**:
  ```
  Prisma Type → TypeScript Type
  String      → string
  String?     → string | null
  Int         → number
  Boolean     → boolean
  DateTime    → Date
  Json        → any (hoặc specific type)
  ```
- **Relationship Handling**: Không include relations trong base interface, tạo separate types cho includes.
- **Common Patterns**: Timestamps (createdAt, updatedAt), soft delete (deletedAt), status enums.

---

## 4. File mẫu & cấu trúc <a name="file-mau"></a>
- `lib/config/env.ts`: validate env bằng Zod (bao gồm DATABASE_URL nếu dùng Prisma).
- `lib/db/client.ts`: singleton PrismaClient (hot-reload safe).
- `lib/db/migrations/`: (Prisma quản lý migrations trong prisma/migrations; thư mục này vẫn hiện diện nếu guideline tổng yêu cầu stub).
- `lib/db/seed/seed.ts`: seed idempotent, sử dụng Prisma Client.
- `lib/entities/*.ts`: entity mỗi bảng với manual TypeScript interfaces (KHÔNG import từ @prisma/client), helper functions, marker @custom.
- `lib/db/SETUP.md`: hướng dẫn cài deps, env, validate/generate/migrate, seed, healthcheck.
- `prisma/schema.prisma`: schema Prisma (đồng bộ từ .momorph/database-schema.sql theo flow scaffold).
---

## 5. Scripts & Troubleshooting <a name="scripts-troubleshooting"></a>
- Scripts DB: validate, generate, migrate dev, seed, reset, schema dump/validate, debug.
- Troubleshooting: `DATABASE_URL`, hot-reload singleton, thứ tự lệnh Prisma, env loading cho scripts.

---

## 6. Next.js Integration Notes <a name="nextjs-integration"></a>
- Tích hợp Prisma Client trong code Next.js bằng client singleton (không tạo nhiều kết nối khi hot-reload).

---

## 7. Phụ lục: Mã mẫu, cấu hình, checklist & troubleshooting chi tiết cho Prisma <a name="phu-luc"></a>

### A. Đoạn mã mẫu cho các file chính <a name="ma-mau"></a>

#### 1. `lib/config/env.ts` (validate env bằng zod)
```typescript
import dotenv from 'dotenv';
import { z } from 'zod';

// Load .env.local cho standalone scripts
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: '.env.local' });
}

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export const env = envSchema.parse(process.env);
```

#### 2. `lib/db/client.ts` (singleton Prisma - FIXED VERSION)
```typescript
import { PrismaClient } from '@prisma/client';

// Global type declaration cho hot-reload safety
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Singleton pattern với proper globalThis usage
export const prisma = globalForPrisma.prisma ?? new PrismaClient();

// Cache client in development để tránh connection leaks
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// @custom:start
// Custom code here
// @custom:end
```

#### 3. `lib/db/seed/seed.ts` (seed idempotent với Prisma Client - GENERIC TEMPLATE)
```typescript
import dotenv from 'dotenv';
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: '.env.local' });
}

import { prisma } from '../client';

async function seed() {
  console.log('🌱 Starting database seeding...');

  try {
    // Example: Seeding based on your actual schema
    // Replace with your actual table/model names from schema
    
    // Pattern 1: Check if data exists, create if not (idempotent)
    // const existingRecord = await prisma.yourModel.findFirst();
    // if (!existingRecord) {
    //   await prisma.yourModel.create({
    //     data: { /* your data */ }
    //   });
    // }

    // Pattern 2: Upsert for unique records
    // await prisma.yourModel.upsert({
    //   where: { uniqueField: 'value' },
    //   update: {},
    //   create: { /* your data */ }
    // });

    // @custom:start
    // Your actual seeding logic based on schema
    // @custom:end

    console.log('✅ Database seeding completed successfully');
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

seed().catch(e => {
  console.error(e);
  process.exit(1);
});
```

#### 4. Healthcheck snippet (Next.js API)
```typescript
import { prisma } from './client';

export async function healthcheck() {
  await prisma.$queryRaw`SELECT 1`;
  return { status: 'ok' };
}
```

#### 5. Entity Definition Template (GENERIC - NO PRISMA IMPORTS)
```typescript
// lib/entities/{table-name}.ts
// ✅ CORRECT APPROACH - Manual TypeScript interfaces
// Replace {table-name} và {TableName} với tên bảng thực tế từ schema

export interface {TableName} {
  id: string; // hoặc number tùy theo schema
  // Thêm các fields theo đúng schema definition
  // createdAt: Date;    // nếu có timestamps
  // updatedAt: Date;    // nếu có timestamps  
  // deletedAt: Date | null; // nếu có soft delete
}

export interface {TableName}CreateInput {
  // Các fields bắt buộc khi tạo mới
  // Loại bỏ id, createdAt, updatedAt (auto-generated)
}

export interface {TableName}UpdateInput {
  // Các fields có thể update (tất cả optional)
  // Không bao gồm id, createdAt
}

// Generic validation helpers - customize theo business logic
export function validate{TableName}Input(input: {TableName}CreateInput): { 
  isValid: boolean; 
  message?: string 
} {
  // Implement validation logic dựa trên business rules
  // Ví dụ: required fields, format validation, business rules
  
  return { isValid: true };
}

// Soft delete helper (nếu có deletedAt field)
export function is{TableName}Deleted(record: {TableName}): boolean {
  return 'deletedAt' in record && record.deletedAt !== null;
}

// @custom:start  
// Custom helpers specific to this entity
// @custom:end
```

**🔧 HƯỚNG DẪN SỬ DỤNG TEMPLATE:**

1. **Thay thế placeholders**: 
   - `{table-name}` → tên file kebab-case (vd: `product-category`)
   - `{TableName}` → tên interface PascalCase (vd: `ProductCategory`)

2. **Map từ Prisma schema**:
   - Copy fields từ model trong `prisma/schema.prisma`
   - Chuyển đổi Prisma types sang TypeScript:
     - `String` → `string`
     - `Int` → `number`
     - `DateTime` → `Date`
     - `Boolean` → `boolean`
     - `String?` → `string | null`

3. **Ví dụ cụ thể với bảng `products`**:
```typescript
// lib/entities/product.ts
export interface Product {
  id: string;
  name: string;
  price: number;
  description: string | null;
  categoryId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductCreateInput {
  name: string;
  price: number;
  description?: string | null;
  categoryId: string;
  isActive?: boolean;
}

export function validateProductInput(input: ProductCreateInput): { 
  isValid: boolean; 
  message?: string 
} {
  if (input.name.trim().length < 1) {
    return { isValid: false, message: 'Product name is required' };
  }
  
  if (input.price <= 0) {
    return { isValid: false, message: 'Price must be greater than 0' };
  }
  
  return { isValid: true };
}
```
---

### B. Cấu hình mẫu <a name="cau-hinh-mau"></a>

#### 1. prisma/schema.prisma
- Sinh ra từ .momorph/database-schema.sql theo flow scaffold.
- Lưu ý: với @@index, chỉ dùng map, không đồng thời name và map.
---

### C. Checklist validation sau khi sinh code <a name="checklist"></a>

- [ ] TypeScript compilation không có lỗi decorators
- [ ] Prisma Client generate OK, types import qua Prisma.*
- [ ] Database connection thành công (DATABASE_URL)
- [ ] Migration tạo được và chạy được (prisma migrate dev)
- [ ] Seed script idempotent và chạy thành công
- [ ] Hot-reload không tạo duplicate connections (singleton client)
- [ ] Index/constraint naming tuân thủ quy tắc map
- [ ] Environment loading working trong standalone scripts

---

### D. Troubleshooting chi tiết <a name="troubleshooting"></a>

#### 1. 🚨 Lỗi TypeScript Compilation - Prisma Type Imports (CRITICAL)
```
Error: Cannot find module '@prisma/client' or its corresponding type declarations
```
**Root Cause**: Entity files import từ `@prisma/client` trước khi client được generate.

**Fix**: Thay thế Prisma type imports bằng manual TypeScript interfaces:
```typescript
// ❌ SAI - Không làm thế này trong entity files
import type { AnyModel as PrismaModel } from '@prisma/client';

// ✅ ĐÚNG - Sử dụng manual interface cho bất kỳ model nào
export interface YourModel {
  id: string; // hoặc number
  // Map fields từ Prisma schema model definition
  // ... other fields matching your schema
}
```

#### 2. 🚨 Lỗi Prisma Schema Syntax (Prisma 6+)
```
Error: Schema parsing failed - index definition invalid
```
**Root Cause**: Syntax `name:` không được support trong Prisma 6+.

**Fix**: 
```prisma
// ❌ SAI - Cú pháp cũ
@@index([email], name: "idx_user_email")

// ✅ ĐÚNG - Cú pháp Prisma 6+
@@index([email], map: "idx_user_email")
```

#### 3. Lỗi thiếu Dependencies
```
Error: Cannot find module 'zod', 'tsx', 'dotenv'
```
**Fix**: Cài đặt đầy đủ dependencies:
```bash
npm install @prisma/client zod dotenv
npm install -D prisma tsx @types/node
```

#### 4. Lỗi hot-reload tạo nhiều connections
**Fix**: Sử dụng globalThis pattern:
```typescript
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};
export const prisma = globalForPrisma.prisma ?? new PrismaClient();
```

#### 5. Lỗi scripts không load env
**Fix**: Thêm dotenv config vào đầu scripts:
```typescript
import dotenv from 'dotenv';
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: '.env.local' });
}
```

#### 6. Lỗi Client Generation Order
**Fix**: Tuân thủ đúng workflow:
```bash
# 1. Validate schema
npm run db:validate
# 2. Generate client 
npm run db:generate
# 3. Compile TypeScript
npx tsc --noEmit
# 4. Run migrations
npm run db:migrate
```
---

### E. Format output backend-architecture.json, TODO_LIST.md <a name="format-output"></a>

#### 1. backend-architecture.json (ví dụ)
```json
{
  "file_paths": [
    "lib/db/README.md",
    "lib/db/SETUP.md",
    "lib/config/env.ts",
    "lib/logging/logger.ts",
    "lib/db/client.ts",
    "lib/db/migrations/.gitkeep",
    "lib/db/seed/seed.ts",
    "lib/db/types/index.ts",
    "lib/entities/<moi-bang-mot-file>.ts",
    "lib/repositories/.gitkeep",
    "lib/utils/index.ts"
  ],
  "module_map": {
    "<ten_bang_snake_case>": "<ten_file_entity_kebab>"
  },
  "routes": {},
  "notes": [
    "Liệt kê enum/check constraint và các composite index suy luận từ schema",
    "Mô tả ON DELETE/ON UPDATE (cascade/set null/restrict) theo từng quan hệ",
    "Giải thích ranh giới transaction giữa repository/service (nếu áp dụng)",
    "Nơi đặt markers @custom để đảm bảo idempotency"
  ],
  "optional_files": [
    { "path": "lib/db/scripts/dev-db-reset.ts", "purpose": "Reset schema local (drop/create/migrate/seed) phục vụ dev" }
  ]
}
```

---

### F. Hướng dẫn bootstrap, migration, seed, healthcheck <a name="huong-dan-bootstrap"></a>
**lib/db/SETUP.md** cần có hướng dẫn chi tiết:
- Cài dependencies:
  ```bash
  npm install @prisma/client
  npm install -D prisma tsx zod dotenv
  ```
- Tạo file `.env.local` (KHÔNG commit):
  ```
  DATABASE_URL="postgresql://appuser:pass@localhost:5432/mydb"
  NODE_ENV=development
  ```
- Workflow:
  ```bash
  npx prisma validate
  npx prisma generate
  npx prisma migrate dev
  npx tsx lib/db/seed/seed.ts
  ```
- Healthcheck:
  ```bash
  await prisma.$queryRaw`SELECT 1`;
  ```
---

### G. REQUIRED FILES CHECK <a name="required-files"></a>
- prisma/schema.prisma hiện diện và hợp lệ.
- lib/config/env.ts validate DATABASE_URL.
- lib/db/client.ts implement singleton PrismaClient.
- **Stub cho các file phụ**:
  - `lib/logging/logger.ts`:
    ```typescript
    export const logger = {
      info: console.log,
      warn: console.warn,
      error: console.error,
    };
    ```
  - `lib/utils/index.ts`:
    ```typescript
    export function toSnakeCase(str: string): string {
      return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    }
    ```
  - `lib/db/types/index.ts`:
    ```typescript
    export type UUID = string;
    ```

---

### H. Scripts cho package.json <a name="scripts-package"></a>
Thêm các scripts quản lý DB:
```json
{
  "scripts": {
    "db:validate": "prisma validate",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:seed": "tsx lib/db/seed/seed.ts",
    "db:reset": "tsx lib/db/scripts/dev-db-reset.ts"
  }
}
```

---

### I. Lưu ý marker @custom, idempotency, composite index, ON DELETE/ON UPDATE, transaction boundaries <a name="luu-y-marker"></a>
- Mỗi entity cần chèn marker `// @custom:start` … `// @custom:end` để đảm bảo idempotency.
- Transaction boundaries: sử dụng prisma.$transaction([...]) khi cần gộp nhiều thao tác.

---

### J. Execution protocol & Validation Checklist <a name="execution-protocol"></a>
- Quy trình thực thi:
  1. Phân tích schema đầu vào (DBML/SQL) → dựng mô hình chuẩn.
  2. Kiểm tra TypeScript config requirements.
  3. Sinh cấu trúc DB-only dưới `lib/` theo quy tắc trên (MikroORM).
  4. In ra `backend-architecture.json` đúng format.
  5. In ra `TODO_LIST.md` chi tiết, acceptance criteria đo được.
  6. Triển khai theo TODO_LIST.md với validation sau mỗi bước.
- Checklist validation (UPDATED với lessons learned):
  - [ ] Dependencies installed đầy đủ (@prisma/client, zod, dotenv, tsx)
  - [ ] Prisma schema syntax đúng Prisma 6+ (map thay vì name trong @@index)
  - [ ] Prisma client generate thành công (`npm run db:generate`)
  - [ ] Entity files sử dụng manual interfaces (KHÔNG import từ @prisma/client)
  - [ ] TypeScript compilation pass hoàn toàn (`npx tsc --noEmit`)
  - [ ] Database client singleton implemented với globalThis pattern
  - [ ] Environment config flexible và load trong scripts
  - [ ] Database connection thành công (DATABASE_URL valid)
  - [ ] Migration tạo được và chạy được (`npm run db:migrate`)
  - [ ] Seed script idempotent và chạy thành công
  - [ ] Hot-reload không tạo duplicate connections
  - [ ] NPM scripts configured và executable
