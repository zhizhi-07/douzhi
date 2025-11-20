/**
 * 玻璃拟态风格 - 统一样式配置
 * 白灰精致风格
 */

export const glassmorphism = {
  // 面板/卡片
  panel: 'bg-white/95 backdrop-blur-sm rounded-2xl shadow-[0_8px_32px_rgba(148,163,184,0.15)] border border-slate-100',
  card: 'bg-white rounded-xl shadow-[0_2px_12px_rgba(148,163,184,0.1)] hover:shadow-[0_4px_16px_rgba(148,163,184,0.15)] transition-all',
  
  // 按钮
  button: {
    primary: 'px-4 py-2.5 bg-slate-700 text-white rounded-xl font-medium hover:bg-slate-800 transition-all shadow-[0_2px_8px_rgba(71,85,105,0.25)]',
    secondary: 'px-4 py-2.5 bg-white text-slate-600 rounded-xl font-medium transition-all shadow-[0_2px_8px_rgba(148,163,184,0.12)] hover:shadow-[0_4px_12px_rgba(148,163,184,0.2)]',
    ghost: 'px-3 py-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors',
  },
  
  // 输入框
  input: 'w-full px-4 py-2.5 bg-white rounded-xl text-sm text-slate-700 outline-none border border-slate-200 focus:border-slate-400 transition-colors shadow-sm',
  textarea: 'w-full px-4 py-2.5 bg-white rounded-xl text-sm text-slate-700 outline-none border border-slate-200 focus:border-slate-400 transition-colors resize-none shadow-sm',
  
  // 开关
  switch: {
    on: 'bg-slate-700 shadow-[0_2px_8px_rgba(71,85,105,0.25)]',
    off: 'bg-slate-100 shadow-[inset_0_1px_3px_rgba(148,163,184,0.15)]',
    thumb: 'w-5 h-5 bg-white rounded-full transition-all duration-300 shadow-[0_2px_6px_rgba(148,163,184,0.25)]',
  },
  
  // 文字颜色
  text: {
    title: 'text-slate-700 font-semibold',
    label: 'text-slate-600 font-medium',
    body: 'text-slate-600',
    hint: 'text-slate-400',
  },
  
  // 分隔线
  divider: 'h-px bg-slate-100',
  
  // 搜索框
  search: 'bg-white rounded-2xl px-4 py-2.5 flex items-center gap-2 shadow-[0_2px_8px_rgba(148,163,184,0.08)]',
}

export default glassmorphism
