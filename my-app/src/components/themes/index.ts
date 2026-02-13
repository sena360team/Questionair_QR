export { DefaultTheme } from './DefaultTheme';
export { CardGroupsTheme } from './CardGroupsTheme';
export { StepWizardTheme } from './StepWizardTheme';
export { MinimalTheme } from './MinimalTheme';

export type ThemeType = 'default' | 'card-groups' | 'step-wizard' | 'minimal';

export const themeLabels: Record<ThemeType, string> = {
  'default': 'ดั้งเดิม',
  'card-groups': 'การ์ดแยกกลุ่ม',
  'step-wizard': 'ขั้นตอน Step',
  'minimal': 'มินิมอล',
};

export const themeDescriptions: Record<ThemeType, string> = {
  'default': 'ดีไซน์คลาสสิก แสดงคำถามทั้งหมดในหน้าเดียว',
  'card-groups': 'แบ่งคำถามเป็นกลุ่มการ์ด ดูเป็นระเบียบ',
  'step-wizard': 'แบ่งเป็นขั้นตอน กรอกทีละส่วน',
  'minimal': 'เรียบง่าย เน้นเนื้อหา ไม่มีสีฉูดฉาด',
};
