# 🎨 Form Theme Examples - พร้อมใช้งานจริง

## ตัวอย่าง Theme พร้อม Dropdown Basic

เลือก Theme แล้ว copy โค้ดไปใช้ได้เลย

---

## 🟦 Theme 1: Minimal Clean (แนะนำ)

### ตัวอย่างหน้าตา
```
┌─────────────────────────────────────────┐
│                                         │
│         [YOUR LOGO]                     │
│                                         │
│     แบบสอบถามความพึงพอใจ              │
│                                         │
│     กรุณาตอบคำถามต่อไปนี้             │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  1. ชื่อ-นามสกุล *                     │
│  ┌─────────────────────────────────┐   │
│  │                                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  2. จังหวัด *                          │
│  ┌─────────────────────────────────┐   │
│  │ เลือกจังหวัด...            ▼   │   │
│  └─────────────────────────────────┘   │
│                                         │
│  3. คุณพอใจกับบริการแค่ไหน? *         │
│                                         │
│     ○ มากที่สุด                        │
│     ○ มาก                               │
│     ○ ปานกลาง                           │
│     ○ น้อย                               │
│                                         │
│        [    ส่งคำตอบ    ]              │
│                                         │
└─────────────────────────────────────────┘
```

### 💻 โค้ดตัวอย่าง (ใช้ได้จริง)

```tsx
// ============================================
// 1. Theme Configuration
// ============================================
const minimalTheme = {
  // Container
  container: "max-w-2xl mx-auto bg-white min-h-screen",
  
  // Header
  header: "bg-white p-8 text-center border-b border-slate-100",
  logo: "w-16 h-16 mx-auto mb-4 object-contain",
  title: "text-2xl font-bold text-slate-900",
  description: "text-slate-500 mt-2",
  
  // Content
  content: "p-6 space-y-6",
  
  // Question
  question: "space-y-3",
  questionNumber: "text-sm font-medium text-blue-600",
  questionLabel: "text-lg font-medium text-slate-900",
  required: "text-red-500 ml-1",
  helpText: "text-sm text-slate-500",
  
  // Input Types
  input: "w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all",
  textarea: "w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none min-h-[120px]",
  
  // 🔽 Dropdown Basic
  dropdown: {
    wrapper: "relative",
    select: "w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all appearance-none bg-white cursor-pointer",
    arrow: "absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400",
    option: "py-2 px-4",
    placeholder: "text-slate-400",
  },
  
  // Radio
  radioGroup: "space-y-2",
  radio: "flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors",
  radioInput: "w-5 h-5 text-blue-600 border-slate-300 focus:ring-blue-500",
  radioLabel: "text-slate-700",
  
  // Checkbox
  checkboxGroup: "space-y-2",
  checkbox: "flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors",
  checkboxInput: "w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500",
  checkboxLabel: "text-slate-700",
  
  // Button
  button: "w-full py-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
  
  // Footer
  footer: "text-center text-sm text-slate-400 mt-8 pb-8",
};

// ============================================
// 2. Form Renderer Component
// ============================================
function FormRenderer({ form, onSubmit, submitting }: FormRendererProps) {
  const [responses, setResponses] = useState<Record<string, any>>({});
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(responses);
  };
  
  const updateResponse = (fieldId: string, value: any) => {
    setResponses(prev => ({ ...prev, [fieldId]: value }));
  };
  
  return (
    <form onSubmit={handleSubmit} className={minimalTheme.container}>
      {/* Header */}
      <div className={minimalTheme.header}>
        {form.logo_url && (
          <img src={form.logo_url} alt="Logo" className={minimalTheme.logo} />
        )}
        <h1 className={minimalTheme.title}>{form.title}</h1>
        {form.description && (
          <p className={minimalTheme.description}>{form.description}</p>
        )}
      </div>
      
      {/* Questions */}
      <div className={minimalTheme.content}>
        {form.fields.map((field, index) => (
          <div key={field.id} className={minimalTheme.question}>
            {/* Label */}
            <label className={minimalTheme.questionLabel}>
              <span className={minimalTheme.questionNumber}>{index + 1}.</span>
              {' '}
              {field.label}
              {field.required && <span className={minimalTheme.required}>*</span>}
            </label>
            
            {field.helpText && (
              <p className={minimalTheme.helpText}>{field.helpText}</p>
            )}
            
            {/* Field Types */}
            {field.type === 'text' && (
              <input
                type="text"
                className={minimalTheme.input}
                placeholder={field.placeholder}
                value={responses[field.id] || ''}
                onChange={(e) => updateResponse(field.id, e.target.value)}
                required={field.required}
              />
            )}
            
            {field.type === 'textarea' && (
              <textarea
                className={minimalTheme.textarea}
                placeholder={field.placeholder}
                value={responses[field.id] || ''}
                onChange={(e) => updateResponse(field.id, e.target.value)}
                required={field.required}
                rows={4}
              />
            )}
            
            {/* 🔽 Dropdown Basic */}
            {field.type === 'dropdown' && (
              <div className={minimalTheme.dropdown.wrapper}>
                <select
                  className={minimalTheme.dropdown.select}
                  value={responses[field.id] || ''}
                  onChange={(e) => updateResponse(field.id, e.target.value)}
                  required={field.required}
                >
                  <option value="" className={minimalTheme.dropdown.placeholder}>
                    {field.placeholder || 'เลือก...'}
                  </option>
                  {field.options?.map((option) => (
                    <option key={option} value={option} className={minimalTheme.dropdown.option}>
                      {option}
                    </option>
                  ))}
                </select>
                <svg 
                  className={minimalTheme.dropdown.arrow} 
                  width="20" 
                  height="20" 
                  viewBox="0 0 20 20" 
                  fill="currentColor"
                >
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            )}
            
            {field.type === 'choice' && (
              <div className={minimalTheme.radioGroup}>
                {field.options?.map((option) => (
                  <label key={option} className={minimalTheme.radio}>
                    <input
                      type="radio"
                      name={field.id}
                      value={option}
                      className={minimalTheme.radioInput}
                      checked={responses[field.id] === option}
                      onChange={(e) => updateResponse(field.id, e.target.value)}
                      required={field.required}
                    />
                    <span className={minimalTheme.radioLabel}>{option}</span>
                  </label>
                ))}
                {field.allow_other && (
                  <label className={minimalTheme.radio}>
                    <input
                      type="radio"
                      name={field.id}
                      value="__other__"
                      className={minimalTheme.radioInput}
                      checked={responses[field.id] === '__other__'}
                      onChange={(e) => updateResponse(field.id, e.target.value)}
                    />
                    <span className={minimalTheme.radioLabel}>อื่นๆ...</span>
                  </label>
                )}
              </div>
            )}
            
            {field.type === 'multiple_choice' && (
              <div className={minimalTheme.checkboxGroup}>
                {field.options?.map((option) => (
                  <label key={option} className={minimalTheme.checkbox}>
                    <input
                      type="checkbox"
                      value={option}
                      className={minimalTheme.checkboxInput}
                      checked={(responses[field.id] || []).includes(option)}
                      onChange={(e) => {
                        const current = responses[field.id] || [];
                        const updated = e.target.checked
                          ? [...current, option]
                          : current.filter((v: string) => v !== option);
                        updateResponse(field.id, updated);
                      }}
                    />
                    <span className={minimalTheme.checkboxLabel}>{option}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}
        
        {/* Submit Button */}
        <button
          type="submit"
          className={minimalTheme.button}
          disabled={submitting}
        >
          {submitting ? 'กำลังส่ง...' : 'ส่งคำตอบ'}
        </button>
        
        {/* Footer */}
        <p className={minimalTheme.footer}>
          Powered by Questionnaire QR System
        </p>
      </div>
    </form>
  );
}

// ============================================
// 3. Example Form Data with Dropdown
// ============================================
const exampleForm = {
  id: 'form-1',
  title: 'แบบสอบถามความพึงพอใจ',
  description: 'กรุณาตอบคำถามต่อไปนี้',
  logo_url: '/logo.png',
  fields: [
    {
      id: 'name',
      type: 'text' as FieldType,
      label: 'ชื่อ-นามสกุล',
      placeholder: 'กรุณากรอกชื่อ',
      required: true,
    },
    {
      id: 'province',
      type: 'dropdown' as FieldType,
      label: 'จังหวัด',
      placeholder: 'เลือกจังหวัด',
      required: true,
      options: [
        'กรุงเทพมหานคร',
        'เชียงใหม่',
        'เชียงราย',
        'ภูเก็ต',
        'ชลบุรี',
        'นครราชสีมา',
        'ขอนแก่น',
        'เพชรบุรี',
      ],
    },
    {
      id: 'service',
      type: 'dropdown' as FieldType,
      label: 'ประเภทบริการที่ใช้',
      placeholder: 'เลือกบริการ',
      required: true,
      options: [
        'บริการออนไลน์',
        'บริการที่สาขา',
        'บริการโทรศัพท์',
        'บริการจัดส่ง',
      ],
    },
    {
      id: 'satisfaction',
      type: 'choice' as FieldType,
      label: 'คุณพอใจกับบริการแค่ไหน',
      required: true,
      options: ['มากที่สุด', 'มาก', 'ปานกลาง', 'น้อย'],
    },
    {
      id: 'feedback',
      type: 'textarea' as FieldType,
      label: 'ข้อเสนอแนะ',
      placeholder: 'แนะนำเพิ่มเติม...',
      required: false,
    },
  ],
};

// ============================================
// 4. Usage
// ============================================
export default function MyFormPage() {
  const handleSubmit = async (responses: Record<string, any>) => {
    console.log('Form responses:', responses);
    // Send to API
  };
  
  return (
    <FormRenderer
      form={exampleForm}
      onSubmit={handleSubmit}
      submitting={false}
    />
  );
}
```

---

## 🎨 การปรับแต่งสี (Color Variants)

### สีฟ้า (ค่าเริ่มต้น)
```tsx
const blueTheme = {
  ...minimalTheme,
  questionNumber: "text-sm font-medium text-blue-600",
  input: "focus:ring-blue-500 focus:border-blue-500",
  button: "bg-blue-600 hover:bg-blue-700",
};
```

### สีเขียว
```tsx
const greenTheme = {
  ...minimalTheme,
  questionNumber: "text-sm font-medium text-emerald-600",
  input: "focus:ring-emerald-500 focus:border-emerald-500",
  button: "bg-emerald-600 hover:bg-emerald-700",
};
```

### สีม่วง
```tsx
const purpleTheme = {
  ...minimalTheme,
  questionNumber: "text-sm font-medium text-violet-600",
  input: "focus:ring-violet-500 focus:border-violet-500",
  button: "bg-violet-600 hover:bg-violet-700",
};
```

---

## 🔽 Dropdown Variants

### Basic (แบบพื้นฐาน)
```tsx
dropdown: {
  wrapper: "relative",
  select: "w-full px-4 py-3 border border-slate-200 rounded-xl ...",
  arrow: "absolute right-4 top-1/2 -translate-y-1/2 ...",
}
```

### Bordered (มีขอบเด่น)
```tsx
dropdown: {
  wrapper: "relative",
  select: "w-full px-4 py-3 border-2 border-slate-300 rounded-lg ...",
  arrow: "absolute right-4 top-1/2 ...",
}
```

### Filled (พื้นหลังสี)
```tsx
dropdown: {
  wrapper: "relative",
  select: "w-full px-4 py-3 bg-slate-50 border-none rounded-xl ...",
  arrow: "absolute right-4 top-1/2 ...",
}
```

---

## 📱 Responsive

Theme นี้รองรับ Mobile โดยอัตโนมัติ:
- หน้าจอเล็ก: padding ลดลง
- หน้าจอกลาง: max-width 2xl (768px)
- หน้าจอใหญ่: จัดกึ่งกลาง

```tsx
// ใช้ Tailwind classes นี้
container: "max-w-2xl mx-auto ..."  // กว้างสุด 768px
content: "p-6 ..."                   // padding 24px
// บน mobile จะลดขนาดอัตโนมัติ
```

---

## ✅ Checklist ก่อนใช้งาน

- [ ] Copy theme configuration
- [ ] Copy FormRenderer component
- [ ] ปรับสีตามต้องการ (blue/green/purple)
- [ ] เพิ่ม field types อื่นถ้าต้องการ
- [ ] ทดสอบการแสดงผลบน mobile
- [ ] ทดสอบการ submit form

---

**ไฟล์นี้:** `docs/FORM_THEME_EXAMPLES.md`

**พร้อมใช้งาน:** Copy โค้ดไปวางในไฟล์ .tsx ได้เลย!
