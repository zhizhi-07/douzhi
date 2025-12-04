# Requirements Document

## Introduction

本需求文档旨在解决 iOS 全面屏设备上的底部 dock 栏间距问题。当前应用在 iOS 设备上全屏显示时，底部 dock 栏（包含系统设置、美化、相机、文档、电话等图标）与屏幕底部边缘之间存在过大的空白间隙，导致 dock 栏悬浮在屏幕中间位置。这是因为应用对底部安全区域（Safe Area）的内边距设置不正确，添加了过多的 padding-bottom 值。需要修正底部内边距的计算逻辑，确保 dock 栏紧贴屏幕底部，同时为 Home Indicator 保留合理的安全间距。

## Glossary

- **Safe Area（安全区域）**: iOS 设备上不被系统 UI（状态栏、刘海、灵动岛、Home Indicator）遮挡的可用显示区域
- **Safe Area Insets（安全区域边距）**: 系统提供的环境变量，表示顶部、底部、左侧、右侧的安全边距值
- **Viewport-fit**: HTML meta 标签属性，控制页面如何填充设备屏幕
- **PWA (Progressive Web App)**: 添加到主屏幕的 Web 应用
- **Status Bar（状态栏）**: iOS 顶部显示时间、电量等信息的区域
- **Home Indicator**: iOS 全面屏设备底部的横条手势区域

## Requirements

### Requirement 1

**User Story:** 作为 iOS 用户，我希望底部 dock 栏紧贴屏幕底部，以便界面看起来正常且我能方便地访问导航功能。

#### Acceptance Criteria

1. WHEN 用户在 iOS 全面屏设备上打开应用 THEN 应用应当移除 dock 栏下方的过大空白间隙
2. WHEN 应用渲染 dock 栏 THEN 应用应当仅为 Home Indicator 添加必要的安全区域内边距（通常为 env(safe-area-inset-bottom)）
3. WHEN dock 栏定位在底部 THEN 应用应当确保 dock 栏的底边与屏幕底部安全区域对齐
4. WHEN 应用计算底部间距 THEN 应用应当检查并移除任何额外的固定 padding 或 margin 值

### Requirement 2

**User Story:** 作为开发者，我希望找到并修复导致底部过大间隙的样式代码，以便彻底解决布局问题。

#### Acceptance Criteria

1. WHEN 检查 dock 栏相关组件 THEN 应用应当识别所有应用了底部 padding 或 margin 的元素
2. WHEN 发现过大的底部间距值 THEN 应用应当将其调整为仅使用 env(safe-area-inset-bottom) 或移除
3. WHEN dock 栏使用固定定位（fixed 或 absolute） THEN 应用应当确保 bottom: 0 配合 padding-bottom: env(safe-area-inset-bottom) 使用
4. WHEN 存在多层嵌套容器 THEN 应用应当检查每一层是否都添加了不必要的底部间距

### Requirement 3

**User Story:** 作为用户，我希望 dock 栏图标保持可点击且不被 Home Indicator 遮挡，以便正常使用所有功能。

#### Acceptance Criteria

1. WHEN dock 栏紧贴底部 THEN 应用应当确保图标与 Home Indicator 之间有足够的间距（通过 padding-bottom）
2. WHEN 用户点击 dock 栏图标 THEN 应用应当确保所有图标都在可点击区域内且响应正常
3. WHEN 应用在有 Home Indicator 的设备上运行 THEN 应用应当为 dock 栏内容区域添加 env(safe-area-inset-bottom) 的内边距
4. WHEN 应用在无 Home Indicator 的设备上运行 THEN 应用应当回退到 0 或最小间距值

### Requirement 4

**User Story:** 作为用户，我希望主屏幕内容区域能够正确填充，以便充分利用屏幕空间。

#### Acceptance Criteria

1. WHEN 主屏幕显示时钟、日期和功能图标 THEN 应用应当确保内容垂直居中分布在可用空间内
2. WHEN dock 栏间距修正后 THEN 应用应当重新计算主内容区域的可用高度
3. WHEN 内容布局调整 THEN 应用应当保持视觉平衡，避免元素过于靠上或靠下
4. WHEN 应用使用 flexbox 布局 THEN 应用应当确保 flex 容器正确计算子元素的分布

### Requirement 5

**User Story:** 作为用户，我希望在非 iOS 设备上应用显示正常，以便跨平台使用时不会出现异常的空白边距。

#### Acceptance Criteria

1. WHEN 应用在 Android 设备上运行 THEN 系统应当不添加额外的安全区域边距
2. WHEN 应用在桌面浏览器中运行 THEN 系统应当使用标准的页面布局
3. WHEN 安全区域环境变量不存在 THEN 系统应当回退到 0 边距值
