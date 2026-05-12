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
- **ORM cố định:** mikroORM (PostgreSQL)
- **Validation:** zod

---

## 2. Cấu trúc thư mục & file <a name="cau-truc-thu-muc"></a>
- Chỉ sinh lớp DB layer dưới thư mục `lib/` của dự án Next.js (App Router).
- Không sinh bất kỳ route HTTP hay file dưới `app/api/**`.
- Tên file/folder **kebab-case**.
- Idempotent scaffolding: chèn markers `// @custom:start` … `// @custom:end` ở những vùng cho phép custom để lần chạy sau không ghi đè.

---

## 3. Hướng dẫn sử dụng framework/tech stack <a name="huong-dan-framework"></a>
### 1. TypeScript Decorators
- Bắt buộc `"experimentalDecorators": true` trong tsconfig.

### 2. MikroORM Types
- KHÔNG dùng generic constraints `<PostgreSqlDriver>`.
- Import entities tường minh, tránh auto-discovery.

### 3. Hot-reload Safety
- Sử dụng singleton pattern với global variable check:
  ```typescript
  declare global {
    var __orm: MikroORM | undefined;
  }
  let orm = global.__orm;
  ```

### 4. Circular Dependencies
- Dùng `() => EntityClass` cho lazy loading.

### 5. Check Constraint Names
- Mỗi check constraint phải có tên unique để tránh PostgreSQL conflicts.

### 6. Environment Loading
- Sử dụng `@next/env` để load environment variables trong standalone scripts (seed/test).
- Luôn gọi `loadEnvConfig(process.cwd())` ở đầu mỗi standalone script.

### 7. Entity Context
- Dùng `orm.em.fork()` thay vì global EntityManager trong scripts.

### 8. Migration Conflicts
- Luôn drop và recreate DB khi có constraint naming conflicts.

### 9. Partial Index (Index với WHERE clause)
- **QUAN TRỌNG**: Sử dụng property `expression` thay vì `options.where`
- Property `options.where` **KHÔNG hoạt động** - MikroORM sẽ bỏ qua hoàn toàn
- Phải dùng `expression` với **toàn bộ câu SQL CREATE INDEX** bao gồm cả WHERE clause
- Áp dụng cho mọi SQL database hỗ trợ Partial Index (PostgreSQL, MySQL 8.0+, SQLite, etc.)
- Expression có thể chứa bất kỳ SQL valid nào tùy theo database engine đang sử dụng

### 10. OptionalProps - Khai báo Optional Properties
- Bắt buộc khai báo `OptionalProps` cho properties có giá trị mặc định (defaultRaw, onCreate, onUpdate)
- Tránh lỗi TypeScript `any` khi khởi tạo entity trong seed/test
- Cú pháp: `[OptionalProps]?: "prop1" | "prop2" | ...`
- Áp dụng cho: timestamps (createdAt, updatedAt), auto-increment IDs, các field có default value

---

## 4. File mẫu & cấu trúc <a name="file-mau"></a>
- `lib/config/env.ts`: validate env bằng zod.
- `lib/db/client.ts`: singleton MikroORM, import entity tường minh.
- `lib/entities/*.ts`: entity mỗi bảng, mapping type, relationship, constraint, marker @custom.
  - **Ví dụ Composite Partial Index**:
    ```typescript
    @Index({
      name: "idx_messages_channel_created",
      expression: "CREATE INDEX idx_messages_channel_created ON messages(channel_id, created_at DESC) WHERE deleted_at IS NULL"
    })
    ```
  - **Ví dụ Partial Index cho các SQL khác**:
    ```typescript
    // PostgreSQL - Multiple conditions
    @Index({
      name: "idx_users_active_verified",
      expression: "CREATE INDEX idx_users_active_verified ON users(email) WHERE deleted_at IS NULL AND verified = true"
    })
    
    // MySQL - Partial Index (MySQL 8.0+)
    @Index({
      name: "idx_orders_pending",
      expression: "CREATE INDEX idx_orders_pending ON orders(customer_id) WHERE status = 'pending'"
    })
    
    // SQLite - Partial Index
    @Index({
      name: "idx_logs_error",
      expression: "CREATE INDEX idx_logs_error ON logs(created_at) WHERE level = 'ERROR'"
    })
    ```
  - **Ví dụ enum & check constraint**:
    ```typescript
    export enum UserRole { ADMIN = 'admin', USER = 'user' }
    @Entity()
    @Check({ expression: "role IN ('admin','user')", name: 'user_role_check' })
    export class User { ... }
    ```
  - **Ví dụ ON DELETE/ON UPDATE**:
    ```typescript
    @ManyToOne(() => User, { onDelete: 'cascade', onUpdate: 'cascade' })
    author!: User;
    ```
  - **Lưu ý marker @custom**: Chèn vào các vùng cho phép custom, ví dụ:
    ```typescript
    // @custom:start
    // Custom business logic, hooks, etc.
    // @custom:end
    ```
- `lib/db/migrations/`: migrations, hướng dẫn tạo migration.
- `lib/db/seed/seed.ts`: seed idempotent, dùng forked EntityManager.
- `lib/db/SETUP.md`: hướng dẫn cài deps, env, migrate, seed, healthcheck.
- `tsconfig.json`: phải có experimentalDecorators, emitDecoratorMetadata.
- `mikro-orm.config.ts`: config MikroORM cho Postgres, import env, entities.

---

## 5. Scripts & Troubleshooting <a name="scripts-troubleshooting"></a>
- Scripts quản lý DB: migrate, seed, reset, validate schema, debug.
- Hướng dẫn fix lỗi decorators, generic types, hot-reload, circular dependencies, constraint conflicts, environment loading.

---

## 6. Next.js Integration Notes <a name="nextjs-integration"></a>
- Hướng dẫn sử dụng ORM trong API routes Next.js (App Router).

---

## 7. Phụ lục: Mã mẫu, cấu hình, checklist & troubleshooting chi tiết cho MikroORM <a name="phu-luc"></a>

### A. Đoạn mã mẫu cho các file chính <a name="ma-mau"></a>

#### 1. `lib/config/env.ts` (validate env bằng zod)
```typescript
import { loadEnvConfig } from '@next/env';
import { z } from 'zod';

// Load .env.local cho standalone scripts
const projectDir = process.cwd();
loadEnvConfig(projectDir);

const envSchema = z.object({
  DB_HOST: z.string().min(1),
  DB_PORT: z.coerce.number().min(1).max(65535),
  DB_NAME: z.string().min(1),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development')
});

export const env = envSchema.parse(process.env);
```

#### 2. `lib/db/client.ts` (singleton MikroORM, import entity tường minh)
```typescript
import { MikroORM, EntityManager } from '@mikro-orm/core';
import { User } from '../entities/user';
// import các entity khác...

declare global {
  var __orm: MikroORM | undefined;
}
let orm = global.__orm;

export async function initializeORM(): Promise<MikroORM> {
  if (!orm) {
    orm = await MikroORM.init();
    global.__orm = orm;
  }
  return orm;
}

export function getEM(): EntityManager {
  if (!orm) throw new Error('ORM not initialized');
  return orm.em;
}
// @custom:start
// Custom code here
// @custom:end
```

#### 3. `lib/entities/*.ts` (entity mẫu với Partial Index)
```typescript
import { Entity, PrimaryKey, Property, Index, Check, OptionalProps } from '@mikro-orm/core';

@Entity({ tableName: '' })
@Check({ expression: 'age > 0', name: 'user_age_check' })
@Index({
  name: "idx_users_email",
  expression: "CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL"
})
export class User {
  [OptionalProps]?: "createdAt" | "updatedAt";

  @PrimaryKey({ type: '', length:  })
  id!: number;

  @Property({ length: 255 })
  email!: string;
  
  @Property({ type: 'timestamptz', nullable: true })
  deleted_at?: Date;

  @Property({ type: 'timestamptz', defaultRaw: 'CURRENT_TIMESTAMP', fieldName: 'created_at' })
  createdAt: Date = new Date();

  @Property({ type: 'timestamptz', defaultRaw: 'CURRENT_TIMESTAMP', onUpdate: () => new Date(), fieldName: 'updated_at' })
  updatedAt: Date = new Date();

  // @custom:start
  // Custom fields
  // @custom:end
}
```

#### 4. `lib/db/seed/seed.ts` (seed idempotent, forked EntityManager)
```typescript
import { loadEnvConfig } from '@next/env';
import { getORM } from '../db/client';
import { User } from '../entities/user';

// Load environment variables
const projectDir = process.cwd();
loadEnvConfig(projectDir);

async function seed() {
  const orm = await getORM();
  const em = orm.em.fork();

  const existingUser = await em.findOne(User, { email: 'user@example.com' });
  if (!existingUser) {
    const user = em.create(User, { email: 'user@example.com' });
    em.persist(user);
    await em.flush();
  }
  process.exit(0);
}

seed().catch(e => {
  console.error(e);
  process.exit(1);
});
```

#### 5. Healthcheck snippet (Next.js API)
```typescript
export async function GET() {
  const orm = await getORM();
  return await RequestContext.createAsync(orm.em, async () => {
    const em = getEM();
    // Database operations here
  });
}
```

---

### B. Cấu hình mẫu <a name="cau-hinh-mau"></a>

#### 1. `tsconfig.json` (bắt buộc)
```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    // ...các option khác
  }
}
```

#### 2. `mikro-orm.config.ts`
```typescript
import 'reflect-metadata';
import { Options } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { env } from './lib/config/env';

const config: Options = {
  driver: PostgreSqlDriver,
  host: env.DB_HOST,
  port: env.DB_PORT,
  dbName: env.DB_NAME,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  entities: ['./lib/entities/**/*.ts'],
  entitiesTs: ['./lib/entities/**/*.ts'],
  migrations: {
    path: './lib/db/migrations',
    tableName: 'mikro_orm_migrations',
    transactional: true,
  },
  debug: env.NODE_ENV === 'development',
};

export default config;
```

---

### C. Checklist validation sau khi sinh code <a name="checklist"></a>

- [ ] TypeScript compilation không có lỗi decorators
- [ ] MikroORM entities import được đúng
- [ ] Database connection thành công
- [ ] Migration tạo được và chạy được
- [ ] Seed script idempotent và chạy thành công
- [ ] Hot-reload không tạo duplicate connections
- [ ] Check constraint names unique giữa các entity
- [ ] Environment loading working trong standalone scripts

---

### D. Troubleshooting chi tiết <a name="troubleshooting"></a>

#### 1. Lỗi Decorators
```bash
# Fix: Thêm vào tsconfig.json
"experimentalDecorators": true,
"emitDecoratorMetadata": true
```

#### 2. Lỗi MikroORM Generic Types
```typescript
// SAI
MikroORM<PostgreSqlDriver>
EntityManager<PostgreSqlDriver>
// ĐÚNG
MikroORM
EntityManager
```

#### 3. Lỗi Hot-reload Multiple Connections
```typescript
declare global {
  var __orm: MikroORM | undefined;
}
let orm = global.__orm;
```

#### 4. Lỗi Circular Dependencies
```typescript
@ManyToOne(() => User, user => user.messages)
user: User;
```

#### 5. Lỗi Check Constraint Conflicts
```typescript
// SAI: constraint name trùng
@Check({ expression: 'field > 0' })  // Tạo constraint "table_check"
@Check({ expression: 'other_field > 0' })  // Tạo constraint "table_check" - CONFLICT!
// ĐÚNG: mỗi constraint một tên
@Check({ expression: 'field > 0', name: 'table_field_check' })
@Check({ expression: 'other_field > 0', name: 'table_other_field_check' })
```

#### 6. Lỗi Global EntityManager Context
```typescript
// SAI: dùng global em trong scripts
const em = getEM(); // Throws "cannot use global context"
// ĐÚNG: fork EntityManager
const orm = await getORM();
const em = orm.em.fork();
```

#### 7. Lỗi Environment Loading trong Scripts
```typescript
import { loadEnvConfig } from '@next/env';

const projectDir = process.cwd();
loadEnvConfig(projectDir);
```

#### 8. Lỗi Migration Constraint Conflicts
```bash
sudo -u postgres psql -c "DROP DATABASE IF EXISTS mydb;"
sudo -u postgres psql -c "CREATE DATABASE mydb;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE mydb TO appuser;"
rm lib/db/migrations/*.ts
npx mikro-orm migration:create --initial
npx mikro-orm migration:up
```

#### 9. Lỗi Partial Index - WHERE clause không được tạo
```typescript
// VẤN ĐỀ: Index bị thiếu WHERE clause
// Kỳ vọng: CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL
// Thực tế:  CREATE INDEX idx_users_email ON users(email)

// ❌ SAI - MikroORM bỏ qua options.where
@Index({ 
  properties: ['email'], 
  name: 'idx_users_email', 
  options: { where: 'deleted_at IS NULL' }  // BỊ BỎ QUA!
})

// ✅ ĐÚNG - Dùng expression với toàn bộ SQL
@Index({
  name: "idx_users_email",
  expression: "CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL"
})

// ✅ Composite Partial Index
@Index({
  name: "idx_messages_channel_created",
  expression: "CREATE INDEX idx_messages_channel_created ON messages(channel_id, created_at DESC) WHERE deleted_at IS NULL"
})

// ✅ Multiple WHERE conditions
@Index({
  name: "idx_users_active_verified",
  expression: "CREATE INDEX idx_users_active_verified ON users(email) WHERE deleted_at IS NULL AND verified = true"
})

// KIỂM TRA trong PostgreSQL:
// psql -d mydb -c "\d+ users"
// Hoặc: SELECT indexname, indexdef FROM pg_indexes WHERE indexname = 'idx_users_email';

// QUAN TRỌNG:
// - Phải viết TOÀN BỘ câu SQL CREATE INDEX
// - Table name trong expression phải khớp với entity table name
// - Column names phải khớp với property names (hoặc fieldName nếu có custom)
// - Expression này áp dụng cho tất cả SQL databases hỗ trợ Partial Index
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
  npm install @mikro-orm/core @mikro-orm/postgresql @mikro-orm/cli @mikro-orm/migrations
  npm install reflect-metadata pg zod
  npm install -D @types/pg tsx ts-node
  ```
  **Lưu ý**: Không cần cài `dotenv` vì sử dụng `@next/env` có sẵn trong Next.js
- Tạo file `.env.local` (KHÔNG commit):
  ```
  DB_HOST=localhost
  DB_PORT=5432
  DB_NAME=mydb
  DB_USER=appuser
  DB_PASSWORD=pass
  NODE_ENV=development
  ```
- Kiểm tra `tsconfig.json`:
  ```bash
  # Đảm bảo tsconfig.json có:
  # "experimentalDecorators": true,
  # "emitDecoratorMetadata": true
  ```
- Migration:
  ```bash
  # Tạo mikro-orm.config.ts ở project root
  npx mikro-orm migration:create --initial
  npx mikro-orm migration:up
  ```
- Troubleshooting migration conflicts:
  ```bash
  # Nếu gặp constraint name conflicts:
  sudo -u postgres psql -c "DROP DATABASE IF EXISTS mydb;"
  sudo -u postgres psql -c "CREATE DATABASE mydb;"
  sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE mydb TO appuser;"
  npx mikro-orm migration:create --initial
  npx mikro-orm migration:up
  ```
- Seed:
  ```bash
  npx tsx lib/db/seed/seed.ts
  ```
- Healthcheck snippet (kết nối và ping DB).
- Next.js integration:
  ```typescript
  // Trong API routes
  export async function GET() {
    const orm = await getORM();
    return await RequestContext.createAsync(orm.em, async () => {
      const em = getEM();
      // Database operations here
    });
  }
  ```

---

### G. REQUIRED FILES CHECK <a name="required-files"></a>
- `tsconfig.json` phải có đầy đủ các option như mẫu.
- `mikro-orm.config.ts` phải đúng format, import env, entities, migrations.
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
    "db:migrate": "mikro-orm migration:create",
    "db:migrate:up": "mikro-orm migration:up",
    "db:migrate:down": "mikro-orm migration:down", 
    "db:seed": "tsx lib/db/seed/seed.ts",
    "db:reset": "tsx lib/db/scripts/dev-db-reset.ts",
    "db:schema:validate": "mikro-orm schema:validate",
    "db:schema:dump": "mikro-orm schema:create --dump",
    "db:debug": "mikro-orm debug"
  }
}
```

---

### I. Lưu ý marker @custom, idempotency, composite index, ON DELETE/ON UPDATE, transaction boundaries <a name="luu-y-marker"></a>
- Mỗi entity cần chèn marker `// @custom:start` … `// @custom:end` để đảm bảo idempotency.
- Ghi chú rõ các enum/check constraint, composite index, ON DELETE/ON UPDATE cho từng quan hệ (xem ví dụ ở phần trên).
- **Giải thích ranh giới transaction giữa repository/service**:
  - Repository chỉ nên thực hiện các thao tác CRUD đơn lẻ, không mở transaction lớn.
  - Nếu cần thực hiện nhiều thao tác liên quan, hãy dùng transaction tại service:
    ```typescript
    await orm.em.transactional(async em => {
      // nhiều thao tác DB liên quan, rollback toàn bộ nếu lỗi
    });
    ```
  - Không mở transaction trong repository nếu service đã mở.

---

### J. Execution protocol & Validation Checklist <a name="execution-protocol"></a>
- Quy trình thực thi:
  1. Phân tích schema đầu vào (DBML/SQL) → dựng mô hình chuẩn.
  2. Kiểm tra TypeScript config requirements.
  3. Sinh cấu trúc DB-only dưới `lib/` theo quy tắc trên (MikroORM).
  4. In ra `backend-architecture.json` đúng format.
  5. In ra `TODO_LIST.md` chi tiết, acceptance criteria đo được.
  6. Triển khai theo TODO_LIST.md với validation sau mỗi bước.
- Checklist validation:
  - [ ] TypeScript compilation không có lỗi decorators
  - [ ] MikroORM entities import được đúng
  - [ ] Database connection thành công
  - [ ] Migration tạo được và chạy được
  - [ ] Seed script idempotent và chạy thành công
  - [ ] Hot-reload không tạo duplicate connections
  - [ ] Check constraint names unique giữa các entity
  - [ ] Environment loading working trong standalone scripts
