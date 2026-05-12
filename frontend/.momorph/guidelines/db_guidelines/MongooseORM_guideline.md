````markdown
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
- **ODM cố định:** Mongoose (MongoDB)
- **Validation:** zod

### ⚠️ Mongoose-Specific Pitfalls Prevention

- **Schema Validation**: Sử dụng Mongoose schema validation kết hợp với Zod cho type safety.
- **Type Safety**: ⚠️ **CRITICAL FIX** - Sử dụng TypeScript interfaces/types riêng biệt, sau đó map với Mongoose schema. Không dựa hoàn toàn vào auto-generated types.
- **Connection Management**: Phải quản lý connection pooling đúng cách, tránh connection leaks.
- **Index Strategy**: MongoDB indexes cần được định nghĩa rõ ràng trong schema, kiểm tra performance.
- **Environment**: Mongoose cần `MONGODB_URI`, standalone scripts cần `dotenv.config()`.
- **Hot-reload**: Dùng cached connection pattern cho Next.js development.
- **Workflow**: `validate schema` → `connect DB` → `create indexes` → `seed data`.

---

## 2. Cấu trúc thư mục & file <a name="cau-truc-thu-muc"></a>
- Chỉ sinh lớp DB layer dưới thư mục `lib/` của dự án Next.js (App Router).
- Không sinh bất kỳ route HTTP hay file dưới `app/api/**`.
- Tên file/folder **kebab-case**.
- Idempotent scaffolding: chèn markers `// @custom:start` … `// @custom:end` ở những vùng cho phép custom để lần chạy sau không ghi đè.

---

## 3. Hướng dẫn sử dụng framework/tech stack <a name="huong-dan-framework"></a>
### 1. Mongoose Schema & Types
- **Type Definitions**: Định nghĩa TypeScript interfaces trước, sau đó tạo Mongoose schema tương ứng.
- **Schema Methods & Statics**: Sử dụng methods cho instance, statics cho model-level operations.
- **Virtuals**: Tận dụng virtuals cho computed properties.

### 2. Environment
- Biến bắt buộc: `MONGODB_URI` cho Mongoose connection.
- Scripts standalone phải tự `dotenv.config()`.

### 3. Hot-reload Safety
- Dùng cached connection pattern cho Mongoose trong dev (Next.js).
- Kiểm tra model đã registered trước khi định nghĩa lại.

### 4. Workflow
- Thứ tự khuyến nghị:
  - Validate connection string
  - Connect to MongoDB
  - Define schemas with indexes
  - Run index creation
  - Verify connection

### 5. Index Strategy
- Định nghĩa indexes trong schema với `{ index: true }` hoặc `schema.index()`.
- Sử dụng compound indexes cho queries phức tạp.
- Monitor index usage trong production.

### 6. Environment Loading
- Đảm bảo dotenv load trong standalone scripts (seed/test).

### 7. Schema Definition Best Practices (CRITICAL FOR SUCCESS)
- **TypeScript First**: Define interfaces trước, sau đó map sang Mongoose schema.
- **Validation Layers**: Schema validation (Mongoose) + Runtime validation (Zod).
- **Schema-Agnostic Approach**: Template generic có thể apply cho bất kỳ database schema nào.
- **Pattern to Follow**:
  ```typescript
  // lib/models/{model-name}.ts - Replace theo tên model thực tế
  import mongoose, { Schema, Document, Model } from 'mongoose';
  
  // TypeScript interface cho document
  export interface I{ModelName} extends Document {
    // Fields từ schema
    _id: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
    // ... các fields khác
  }
  
  // Schema definition
  const {modelName}Schema = new Schema<I{ModelName}>({
    // Field definitions với validation
  }, {
    timestamps: true, // Auto createdAt, updatedAt
    collection: '{collection_name}'
  });
  
  // Indexes
  {modelName}Schema.index({ field: 1 });
  
  // Methods & Statics
  {modelName}Schema.methods.customMethod = function() {};
  {modelName}Schema.statics.customStatic = function() {};
  
  // @custom:start
  // Custom schema modifications
  // @custom:end
  
  // Model export với check registered
  export const {ModelName} = 
    (mongoose.models.{ModelName} as Model<I{ModelName}>) || 
    mongoose.model<I{ModelName}>('{ModelName}', {modelName}Schema);
  ```

### 8. Error Prevention Strategies
- **Pre-validation**: Validate MongoDB URI format trước khi connect.
- **Dependency Check**: Verify mongoose installed trước khi scaffold.
- **Incremental Building**: Build từng model, validate từng bước.
- **Connection Pooling**: Configure connection pool size phù hợp.

### 9. Schema-Agnostic Guidelines (UNIVERSAL APPROACH)
- **Flexible Templates**: Tất cả templates sử dụng placeholders có thể thay thế cho bất kỳ schema nào.
- **Model Mapping Strategy**:
  ```
  Collection → Model File
  users       → lib/models/user.ts → interface IUser, model User
  products    → lib/models/product.ts → interface IProduct, model Product
  orders      → lib/models/order.ts → interface IOrder, model Order
  ```
- **Field Type Mapping**:
  ```
  MongoDB/Mongoose Type → TypeScript Type
  String                → string
  Number                → number
  Boolean               → boolean
  Date                  → Date
  ObjectId              → mongoose.Types.ObjectId
  Mixed                 → any (hoặc specific type)
  Array                 → T[]
  ```
- **Relationship Handling**: Sử dụng `ref` cho references, `populate()` để load relations.
- **Common Patterns**: Timestamps (createdAt, updatedAt), soft delete (deletedAt, isDeleted), status enums.

---

## 4. File mẫu & cấu trúc <a name="file-mau"></a>
- `lib/config/env.ts`: validate env bằng Zod (bao gồm MONGODB_URI).
- `lib/db/connection.ts`: cached Mongoose connection (hot-reload safe).
- `lib/models/*.ts`: model mỗi collection với TypeScript interfaces, schema definition, indexes, methods/statics, marker @custom.
- `lib/db/seed/seed.ts`: seed idempotent, sử dụng Mongoose models.
- `lib/db/SETUP.md`: hướng dẫn cài deps, env, connect, create indexes, seed, healthcheck.

---

## 5. Scripts & Troubleshooting <a name="scripts-troubleshooting"></a>
- Scripts DB: connect, create indexes, seed, reset, validate connection, debug.
- Troubleshooting: `MONGODB_URI`, hot-reload cached connection, model registration, env loading cho scripts.

---

## 6. Next.js Integration Notes <a name="nextjs-integration"></a>
- Tích hợp Mongoose trong code Next.js bằng cached connection (không tạo nhiều connections khi hot-reload).
- Sử dụng `dbConnect()` utility trong API routes và Server Components.

---

## 7. Phụ lục: Mã mẫu, cấu hình, checklist & troubleshooting chi tiết cho Mongoose <a name="phu-luc"></a>

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
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export const env = envSchema.parse(process.env);
```

#### 2. `lib/db/connection.ts` (cached Mongoose connection - FIXED VERSION)
```typescript
import mongoose from 'mongoose';
import { env } from '../config/env';
import { logger } from '../logging/logger';

/**
 * Global mongoose cache for Next.js hot-reload safety
 * ⚠️ CRITICAL: Initialize immediately to avoid 'possibly undefined' errors
 */
declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
}

// ✅ Initialize cache immediately (prevents 'possibly undefined' error)
if (!global.mongooseCache) {
  global.mongooseCache = { conn: null, promise: null };
}

const cached = global.mongooseCache;

/**
 * Connect to MongoDB using Mongoose
 * Uses cached connection pattern to prevent duplicate connections on hot-reload
 */
export async function dbConnect(): Promise<typeof mongoose> {
  // Return existing connection if available
  if (cached.conn) {
    logger.debug('Using cached MongoDB connection');
    return cached.conn;
  }

  // Create new connection if not in progress
  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    logger.info('Connecting to MongoDB...');
    cached.promise = mongoose.connect(env.MONGODB_URI, opts);
  }

  try {
    cached.conn = await cached.promise;
    logger.info('✅ MongoDB connected successfully');
  } catch (e) {
    cached.promise = null;
    logger.error('❌ MongoDB connection failed:', e);
    throw e;
  }

  return cached.conn;
}

/**
 * Disconnect from MongoDB
 * Use this only in standalone scripts or when shutting down
 */
export async function dbDisconnect(): Promise<void> {
  if (cached.conn) {
    await cached.conn.disconnect();
    cached.conn = null;
    cached.promise = null;
    logger.info('MongoDB disconnected');
  }
}

/**
 * Get connection status
 */
export function getConnectionStatus(): string {
  const state = mongoose.connection.readyState;
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  return states[state as keyof typeof states] || 'unknown';
}

// @custom:start
// Custom connection utilities
// @custom:end
```

#### 3. `lib/models/{model-name}.ts` (Generic Model Template)
```typescript
import mongoose, { Schema, Document, Model } from 'mongoose';

// TypeScript interface cho document
export interface I{ModelName} extends Document {
  _id: mongoose.Types.ObjectId;
  // Thêm các fields theo schema
  // Example fields:
  // name: string;
  // email: string;
  // status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

export interface {ModelName}CreateInput {
  // Các fields bắt buộc khi tạo mới
  // Loại bỏ _id, createdAt, updatedAt (auto-generated)
}

export interface {ModelName}UpdateInput {
  // Các fields có thể update (tất cả optional)
}

// Schema definition
const {modelName}Schema = new Schema<I{ModelName}>({
  // Field definitions
  // Example:
  // name: { type: String, required: true, trim: true },
  // email: { type: String, required: true, unique: true, lowercase: true },
  // status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  // deletedAt: { type: Date, default: null }, // soft delete
}, {
  timestamps: true, // Auto add createdAt, updatedAt
  collection: '{collection_name}', // Explicit collection name
});

// Indexes
// {modelName}Schema.index({ email: 1 }, { unique: true });
// {modelName}Schema.index({ status: 1, createdAt: -1 }); // Compound index

// Instance methods
{modelName}Schema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

// Static methods
{modelName}Schema.statics.findActive = function() {
  return this.find({ status: 'active', deletedAt: null });
};

// Virtuals (if needed)
// {modelName}Schema.virtual('fullName').get(function() {
//   return `${this.firstName} ${this.lastName}`;
// });

// Pre-save hooks (if needed)
// {modelName}Schema.pre('save', async function(next) {
//   // Logic before save
//   next();
// });

// @custom:start
// Custom schema modifications, hooks, methods, statics
// @custom:end

// Model export với check registered để tránh OverwriteModelError
export const {ModelName} = 
  (mongoose.models.{ModelName} as Model<I{ModelName}>) || 
  mongoose.model<I{ModelName}>('{ModelName}', {modelName}Schema);
```

**🔧 HƯỚNG DẪN SỬ DỤNG TEMPLATE:**

1. **Thay thế placeholders**:
   - `{model-name}` → tên file kebab-case (vd: `product-category`)
   - `{ModelName}` → tên interface/model PascalCase (vd: `ProductCategory`)
   - `{modelName}` → tên schema camelCase (vd: `productCategory`)
   - `{collection_name}` → tên collection trong MongoDB (vd: `product_categories`)

2. **Định nghĩa fields**:
   - Map từ database schema design
   - Sử dụng Mongoose schema types: String, Number, Boolean, Date, ObjectId, Mixed, Array
   - Thêm validation: required, unique, enum, min, max, match, etc.

3. **Ví dụ cụ thể với collection `products`**:
```typescript
// lib/models/product.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProduct extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  price: number;
  description?: string;
  categoryId: mongoose.Types.ObjectId;
  isActive: boolean;
  stock: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductCreateInput {
  name: string;
  price: number;
  description?: string;
  categoryId: string | mongoose.Types.ObjectId;
  stock?: number;
}

const productSchema = new Schema<IProduct>({
  name: { type: String, required: true, trim: true, maxlength: 255 },
  price: { type: Number, required: true, min: 0 },
  description: { type: String, default: null },
  categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
  isActive: { type: Boolean, default: true },
  stock: { type: Number, default: 0, min: 0 },
}, {
  timestamps: true,
  collection: 'products'
});

// Indexes
productSchema.index({ name: 'text' }); // Text search
productSchema.index({ categoryId: 1, isActive: 1 });
productSchema.index({ price: 1 });

// Instance methods
productSchema.methods.isInStock = function(): boolean {
  return this.stock > 0;
};

// Static methods
productSchema.statics.findByCategory = function(categoryId: string) {
  return this.find({ categoryId, isActive: true });
};

// @custom:start
// Custom logic
// @custom:end

export const Product = 
  (mongoose.models.Product as Model<IProduct>) || 
  mongoose.model<IProduct>('Product', productSchema);
```

#### 4. `lib/db/seed/seed.ts` (seed idempotent với Mongoose - GENERIC TEMPLATE)
```typescript
import dotenv from 'dotenv';
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: '.env.local' });
}

import { dbConnect } from '../connection';
// Import models
// import { YourModel } from '../../models/your-model';

async function seed() {
  console.log('🌱 Starting database seeding...');

  try {
    // Connect to database
    await dbConnect();
    console.log('✅ Database connected');

    // Pattern 1: Check if data exists, create if not (idempotent)
    // const existingRecord = await YourModel.findOne({ uniqueField: 'value' });
    // if (!existingRecord) {
    //   await YourModel.create({
    //     // your data
    //   });
    //   console.log('✅ Created record');
    // }

    // Pattern 2: UpdateOne with upsert
    // await YourModel.updateOne(
    //   { uniqueField: 'value' },
    //   { $set: { /* your data */ } },
    //   { upsert: true }
    // );

    // @custom:start
    // Your actual seeding logic based on schema
    // @custom:end

    console.log('✅ Database seeding completed successfully');
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    throw error;
  } finally {
    // Mongoose connection sẽ được cache, không cần disconnect trong Next.js
    // Chỉ disconnect nếu đây là standalone script
    if (process.env.STANDALONE_SCRIPT === 'true') {
      await mongoose.disconnect();
    }
    process.exit(0);
  }
}

seed().catch(e => {
  console.error(e);
  process.exit(1);
});
```

#### 5. Healthcheck snippet (Next.js API)
```typescript
import { dbConnect } from './connection';

export async function healthcheck() {
  const conn = await dbConnect();
  
  // ⚠️ CRITICAL: Check if db is initialized before using
  if (!conn.connection.db) {
    throw new Error('Database not initialized');
  }
  
  // Ping database
  await conn.connection.db.admin().ping();
  
  return { 
    status: 'ok',
    db: conn.connection.readyState === 1 ? 'connected' : 'disconnected',
    dbName: conn.connection.db.databaseName,
  };
}
```

#### 6. Index Creation Script
```typescript
// lib/db/scripts/create-indexes.ts
import dotenv from 'dotenv';
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: '.env.local' });
}

import { dbConnect } from '../connection';
import { logger } from '../../logging/logger';

// Import all models to register schemas
// import '../../models/user';
// import '../../models/product';

async function createIndexes() {
  logger.info('📊 Creating database indexes...');
  
  try {
    const mongoose = await dbConnect();
    
    // Get all registered models
    const models = Object.values(mongoose.models);
    
    logger.info(`Found ${models.length} models to process`);
    
    // ✅ Sync indexes for all models (no @ts-expect-error needed)
    for (const model of models) {
      logger.info(`Creating indexes for ${model.modelName}...`);
      await model.syncIndexes();
      logger.info(`✅ Indexes synced for ${model.modelName}`);
    }
    
    logger.info('✅ All indexes created successfully');
  } catch (error) {
    logger.error('❌ Index creation failed:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

createIndexes().catch(e => {
  logger.error(e);
  process.exit(1);
});
```

---

### B. Cấu hình mẫu <a name="cau-hinh-mau"></a>

#### 1. MongoDB Connection Options
```typescript
const mongooseOptions = {
  bufferCommands: false,
  maxPoolSize: 10,
  minPoolSize: 2,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};
```

#### 2. Environment Variables
```env
MONGODB_URI=mongodb://localhost:27017/mydb
# Or MongoDB Atlas
# MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/mydb?retryWrites=true&w=majority
NODE_ENV=development
```

---

### C. Checklist validation sau khi sinh code <a name="checklist"></a>

- [ ] TypeScript compilation không có lỗi (`npx tsc --noEmit`)
- [ ] Mongoose connection thành công (MONGODB_URI valid)
- [ ] Models định nghĩa đúng với TypeScript interfaces
- [ ] Indexes được tạo thành công
- [ ] Seed script idempotent và chạy thành công
- [ ] Hot-reload không tạo duplicate connections (cached connection)
- [ ] Model registration check để tránh OverwriteModelError
- [ ] Environment loading working trong standalone scripts
- [ ] Validation layers (Mongoose + Zod) hoạt động đúng
- [ ] **NEW**: Global cache initialized immediately (no 'possibly undefined')
- [ ] **NEW**: Database null checks before using `connection.db`
- [ ] **NEW**: Explicit type annotations trong array callbacks
- [ ] **NEW**: No unused @ts-expect-error directives

---

### D. Troubleshooting chi tiết <a name="troubleshooting"></a>

#### 1. 🚨 Lỗi OverwriteModelError
```
Error: Cannot overwrite 'ModelName' model once compiled
```
**Root Cause**: Hot-reload trong Next.js dev mode cố gắng register model đã tồn tại.

**Fix**: Sử dụng pattern check model đã registered:
```typescript
// ❌ SAI - Trực tiếp định nghĩa model
export const User = mongoose.model<IUser>('User', userSchema);

// ✅ ĐÚNG - Check model đã registered
export const User = 
  (mongoose.models.User as Model<IUser>) || 
  mongoose.model<IUser>('User', userSchema);
```

**Prevention**: LUÔN LUÔN sử dụng pattern này cho tất cả models trong Next.js.

#### 2. 🚨 Lỗi Connection Pool
```
Error: MongoServerSelectionError: connection pool timeout
```
**Root Cause**: Quá nhiều connections hoặc connection không được reuse.

**Fix**: Sử dụng cached connection pattern với initialization ngay lập tức:
```typescript
// ✅ Global cache cho connection
declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
}

// ⚠️ CRITICAL: Initialize ngay để tránh 'possibly undefined'
if (!global.mongooseCache) {
  global.mongooseCache = { conn: null, promise: null };
}

const cached = global.mongooseCache;
```

**Prevention**: Đừng khai báo `| undefined` trong global type.

#### 3. Lỗi thiếu Dependencies
```
Error: Cannot find module 'mongoose', 'zod', 'dotenv'
```
**Fix**: Cài đặt đầy đủ dependencies:
```bash
npm install mongoose zod dotenv
npm install -D @types/node tsx
```

#### 4. Lỗi Index Creation Failed
```
Error: Index with name already exists with different options
```
**Fix**: Drop existing indexes và recreate:
```typescript
// Drop all indexes (except _id)
await Model.collection.dropIndexes();
// Recreate indexes
await Model.syncIndexes();
```

#### 5. Lỗi scripts không load env
**Fix**: Thêm dotenv config vào đầu scripts:
```typescript
import dotenv from 'dotenv';
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: '.env.local' });
}
```

#### 6. Lỗi TypeScript Type Safety
```
Error: Type 'Document' is not assignable to type 'IUser'
```
**Fix**: Sử dụng generic types đúng cách:
```typescript
// ✅ ĐÚNG
const user = await User.findById(id) as IUser | null;
// Hoặc
const user = await User.findById(id).lean() as IUser | null;
```

#### 7. Lỗi Populate Reference
```
Error: Cannot populate path 'fieldName' because it is not in schema
```
**Fix**: Đảm bảo field có `ref` trong schema:
```typescript
categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true }
```

#### 8. 🚨 Lỗi TypeScript: 'possibly undefined'
```
Error: 'mongoose.connection.db' is possibly 'undefined'
```
**Root Cause**: `connection.db` có thể undefined nếu chưa kết nối.

**Fix**: Thêm null check trước khi sử dụng:
```typescript
// ❌ SAI
await mongoose.connection.db.admin().ping();

// ✅ ĐÚNG
if (!mongoose.connection.db) {
  throw new Error('Database not initialized');
}
await mongoose.connection.db.admin().ping();
```

**Prevention**: Luôn check `connection.db` trước khi sử dụng trong scripts.

#### 9. 🚨 Lỗi TypeScript: Implicit 'any' type
```
Error: Parameter 'item' implicitly has an 'any' type
```
**Root Cause**: TypeScript strict mode không cho phép implicit any trong callbacks.

**Fix**: Thêm explicit type annotations:
```typescript
// ❌ SAI
this.reactions.find((r) => r.emoji === emoji)
this.memberIds.some((id) => id.equals(userId))

// ✅ ĐÚNG
this.reactions.find((r: IReaction) => r.emoji === emoji)
this.memberIds.some((id: mongoose.Types.ObjectId) => id.equals(userId))
```

**Prevention**: Luôn type annotate parameters trong callbacks khi làm việc với arrays.

#### 10. 🚨 Lỗi: Unused '@ts-expect-error'
```
Error: Unused '@ts-expect-error' directive
```
**Root Cause**: Mongoose types đã đầy đủ trong version mới (8.x+).

**Fix**: Remove @ts-expect-error directives:
```typescript
// ❌ SAI (Mongoose 8.x không cần)
// @ts-expect-error - syncIndexes exists on Model
await model.syncIndexes();

// ✅ ĐÚNG
await model.syncIndexes();
```

**Prevention**: Không sử dụng @ts-expect-error cho Mongoose built-in methods.

---

## 8. TypeScript Best Practices & Common Pitfalls <a name="typescript-best-practices"></a>

### ⚠️ CRITICAL: Những lỗi thường gặp và cách tránh

#### 1. **Global Variable Initialization**
```typescript
// ❌ SAI - Gây lỗi 'possibly undefined'
declare global {
  var mongooseCache: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  } | undefined;  // ← ĐỪNG dùng | undefined
}
let cached = global.mongooseCache;  // ← cached is possibly undefined

// ✅ ĐÚNG - Initialize ngay lập tức
declare global {
  var mongooseCache: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };  // ← Không có | undefined
}
if (!global.mongooseCache) {
  global.mongooseCache = { conn: null, promise: null };
}
const cached = global.mongooseCache;  // ← cached is always defined
```

#### 2. **Database Null Checks**
```typescript
// ❌ SAI - Không check db
async function healthcheck() {
  const conn = await dbConnect();
  await conn.connection.db.admin().ping();  // ← Error: possibly undefined
}

// ✅ ĐÚNG - Check trước khi dùng
async function healthcheck() {
  const conn = await dbConnect();
  if (!conn.connection.db) {
    throw new Error('Database not initialized');
  }
  await conn.connection.db.admin().ping();  // ← Safe
}
```

#### 3. **Array Callback Type Annotations**
```typescript
// ❌ SAI - Implicit any type
schema.methods.addReaction = function(emoji: string, userId: ObjectId) {
  const reaction = this.reactions.find((r) => r.emoji === emoji);
  //                                      ^ Parameter 'r' implicitly has 'any' type
}

// ✅ ĐÚNG - Explicit type annotation
schema.methods.addReaction = function(emoji: string, userId: ObjectId) {
  const reaction = this.reactions.find((r: IReaction) => r.emoji === emoji);
  //                                      ^ Type specified
}
```

#### 4. **Mongoose Method Types (v8+)**
```typescript
// ❌ SAI - Không cần @ts-expect-error trong Mongoose 8.x
const models = Object.values(mongoose.models);
for (const model of models) {
  // @ts-expect-error - syncIndexes exists on Model
  await model.syncIndexes();  // ← Unused @ts-expect-error
}

// ✅ ĐÚNG - Mongoose 8.x có đầy đủ types
const models = Object.values(mongoose.models);
for (const model of models) {
  await model.syncIndexes();  // ← No error, no @ts-expect-error needed
}
```

#### 5. **Connection Pool Configuration**
```typescript
// ✅ Recommended settings
const opts = {
  bufferCommands: false,        // Disable buffering
  maxPoolSize: 10,              // Max connections
  minPoolSize: 2,               // Min connections
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};
```

#### 6. **Logger Usage in Scripts**
```typescript
// ✅ ĐÚNG - Import logger thay vì console
import { logger } from '../../logging/logger';

async function seed() {
  logger.info('🌱 Starting seeding...');  // ← Consistent logging
  try {
    // ...
    logger.info('✅ Success');
  } catch (error) {
    logger.error('❌ Failed:', error);
  }
}
```

### 📋 Pre-Generation Checklist

Trước khi generate code, đảm bảo:

- [ ] Mongoose version >= 8.0 (có đầy đủ TypeScript types)
- [ ] TypeScript strict mode enabled trong tsconfig.json
- [ ] @types/node installed
- [ ] Global variable pattern sử dụng immediate initialization
- [ ] Tất cả async functions có proper error handling
- [ ] Logger utility đã được setup
- [ ] Environment validation với Zod

### 🔧 TypeScript Configuration Requirements

```jsonc
// tsconfig.json - Required settings
{
  "compilerOptions": {
    "strict": true,                    // Enable all strict checks
    "esModuleInterop": true,
    "skipLibCheck": true,              // Skip lib checking for speed
    "target": "ES2017",
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true
  }
}
```
