# 📐 Border Style Guide - เข้มขึ้นทั้ง Project

## ปัญหา: Border บางเกินไป

ปัจจุบันใช้ `border-slate-200` (#e2e8f0) ซึ่งอ่อนมาก มองยากบนบางจอ

## 🎯 Target: Border เข้มขึ้น 2 ระดับ

### Before (บาง)
```
border-slate-200  →  #e2e8f0  (อ่อน)
```

### After (เข้ม)
```
border-slate-300  →  #cbd5e1  (ปานกลาง)  ← ใช้เป็นหลัก
border-slate-400  →  #94a3b8  (เข้ม)    ← สำหรับส่วนสำคัญ
```

---

## วิธีที่ 1: Find & Replace ทั้งโปรเจค (เร็วสุด)

### 1. สร้าง Script แก้ไข
```bash
#!/bin/bash
# update-borders.sh

echo "Updating borders in all files..."

# แก้ไขทุกไฟล์ .tsx และ .ts
find my-app/src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' \
  -e 's/border-slate-200/border-slate-300/g' \
  -e 's/border-slate-100/border-slate-200/g' \
  {} \;

echo "Done! Review changes before committing."
```

### 2. รันคำสั่ง
```bash
chmod +x update-borders.sh
./update-borders.sh
```

---

## วิธีที่ 2: ใช้ Tailwind Config (แนะนำ)

### แก้ไข `tailwind.config.ts`

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  // ... existing config
  theme: {
    extend: {
      // เพิ่ม colors ใหม่สำหรับ border
      borderColor: {
        DEFAULT: '#cbd5e1',  // เปลี่ยน default จาก slate-200 เป็น 300
        'light': '#e2e8f0',   // เก่า: slate-200
        'medium': '#cbd5e1',  // ใหม่: slate-300 (default)
        'heavy': '#94a3b8',   // ใหม่: slate-400
        'strong': '#64748b',  // ใหม่: slate-500
      },
      // หรือ override slate
      colors: {
        slate: {
          150: '#d8e0e8',  // ระหว่าง 100-200
          250: '#c0cad6',  // ระหว่าง 200-300
        }
      }
    },
  },
};

export default config;
```

### ใช้แบบนี้
```html
<!-- แทน -->
<div class="border border-slate-200">

<!-- ใช้ -->
<div class="border border-medium">
```

---

## วิธีที่ 3: CSS Variables (Global Override)

### สร้างไฟล์ `globals.css` (ถ้ายังไม่มี)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  /* Override default border color */
  --border-color: #cbd5e1;  /* slate-300 */
}

@layer base {
  /* ทุก element ที่มี border จะใช้สีนี้ */
  * {
    @apply border-slate-300;
  }
}

@layer components {
  /* Card component with stronger border */
  .card {
    @apply bg-white rounded-xl border-2 border-slate-300 shadow-sm;
  }
  
  /* Input component */
  .input-field {
    @apply px-4 py-3 border-2 border-slate-300 rounded-xl 
           focus:border-blue-500 focus:ring-2 focus:ring-blue-200;
  }
  
  /* Button outline */
  .btn-outline {
    @apply px-4 py-2 border-2 border-slate-400 rounded-lg
           hover:border-slate-500 hover:bg-slate-50;
  }
}
```

---

## 📍 จุดที่ต้องแก้ไขในโปรเจค

### 1. Form Builder (`FormBuilder.tsx`)
```tsx
// แก้ไขทุกจุดที่มี border-slate-200

// ก่อน
<div className="border border-slate-200 rounded-xl">

// หลัง  
<div className="border-2 border-slate-300 rounded-xl">
```

### 2. Admin Layout (`AdminLayout.tsx`)
```tsx
// Sidebar border
<aside className="border-r-2 border-slate-300">

// Header border
<header className="border-b-2 border-slate-300">
```

### 3. Cards (ทุกที่)
```tsx
// Card component
<div className="bg-white rounded-xl border-2 border-slate-300 shadow-sm">
  {/* content */}
</div>
```

### 4. Inputs & Forms
```tsx
// Input fields
<input className="border-2 border-slate-300 rounded-lg px-4 py-2
       focus:border-blue-500 focus:ring-2 focus:ring-blue-200">

// Select
<select className="border-2 border-slate-300 rounded-lg">
```

### 5. Tables
```tsx
// Table borders
<table className="border-collapse border-2 border-slate-300">
  <th className="border-2 border-slate-300">Header</th>
  <td className="border-2 border-slate-300">Data</td>
</table>
```

---

## 🎨 Border Scale แนะนำ

| Context | ก่อน | หลัง | Tailwind |
|---------|-----|------|----------|
| Divider บาง | `border-slate-200` | `border-slate-200` | ไม่เปลี่ยน |
| Card border | `border-slate-200` | `border-slate-300` | เปลี่ยน |
| Input border | `border-slate-200` | `border-slate-300` | เปลี่ยน |
| Table border | `border-slate-200` | `border-slate-300` | เปลี่ยน |
| Button outline | `border-slate-300` | `border-slate-400` | เปลี่ยน |
| Active/Focus | `border-blue-500` | `border-blue-600` | เข้มขึ้น |

---

## 🛠️ Quick Fix Script

### ไฟล์: `update-borders.js`
```javascript
const fs = require('fs');
const path = require('path');

const TARGET_DIR = './my-app/src';

const replacements = [
  { from: /border-slate-200/g, to: 'border-slate-300' },
  { from: /border-slate-100/g, to: 'border-slate-200' },
  { from: /border border-/g, to: 'border-2 border-' }, // เพิ่ม thickness
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  replacements.forEach(({ from, to }) => {
    if (from.test(content)) {
      content = content.replace(from, to);
      modified = true;
    }
  });
  
  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`✓ Updated: ${filePath}`);
  }
}

function walkDir(dir) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (/\.(tsx?|jsx?|css)$/.test(file)) {
      processFile(fullPath);
    }
  });
}

console.log('Updating borders...');
walkDir(TARGET_DIR);
console.log('Done!');
```

### รัน
```bash
node update-borders.js
```

---

## ✅ Checklist หลังแก้ไข

- [ ] Form Builder cards เห็นชัด
- [ ] Input fields มี border เด่น
- [ ] Sidebar divider ชัดเจน
- [ ] Table borders ไม่กลืนกัน
- [ ] ดูดีบน monitor ทุกความสว่าง
- [ ] Mobile ยังใช้งานได้ดี

---

## 🎯 ตัวอย่าง Before/After

### Card Component
```html
<!-- Before -->
<div class="bg-white rounded-xl border border-slate-200 p-4">
  <!-- มองยากบนจอสว่าง -->
</div>

<!-- After -->
<div class="bg-white rounded-xl border-2 border-slate-300 p-4">
  <!-- เห็นชัดเจน -->
</div>
```

### Input Field
```html
<!-- Before -->
<input class="border border-slate-200 rounded-lg">

<!-- After -->
<input class="border-2 border-slate-300 rounded-lg focus:border-blue-600">
```

---

**เลือกวิธีที่ต้องการแล้วบอกผม จะช่วย implement ให้ครับ!** 🎨
