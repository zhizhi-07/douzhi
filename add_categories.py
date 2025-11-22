#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import re

# 分类映射
categories = {
    'receipt': '生活消费',
    'diary': '工作学习',
    'menu': '生活消费',
    'group_chat': '社交通讯',
    'private_chat': '社交通讯',
    'memo': '工作学习',
    'scratch_card': '娱乐休闲',
    'love_letter': '情感关系',
    'movie_ticket': '娱乐休闲',
    'train_ticket': '交通出行',
    'express_package': '生活消费',
    'postcard': '情感关系',
    'birthday_card': '情感关系',
    'boarding_pass': '交通出行',
    'concert_ticket': '娱乐休闲',
    'coupon': '生活消费',
    'business_card': '工作学习',
    'parking_ticket': '生活消费',
    'hospital_registration': '健康医疗',
    'leave_request': '工作学习',
    'certificate': '工作学习',
    'sms_screenshot': '社交通讯',
    'countdown': '工具应用',
    'class_schedule': '工作学习',
    'check_in': '工作学习',
    'music_player': '娱乐休闲',
    'call_log': '社交通讯',
    'shopping_cart': '生活消费',
    'diagnosis': '健康医疗',
    'moments_post': '社交通讯',
    'marriage_certificate': '证件文书',
    'divorce_certificate': '证件文书',
    'apology_letter': '工作学习',
    'watch_qq': '社交通讯',
    'incognito_mode': '隐私安全',
    'xiaohongshu_post': '社交通讯',
    'sex_timer': '情感关系',
    'private_album': '隐私安全',
    'hotel_booking': '生活消费',
    'confession_board': '情感关系',
    'overtime_record': '工作学习',
    'step_ranking': '健康医疗',
    'screen_time': '健康医疗'
}

# 读取文件
with open('G:/douzhi/src/data/theatreTemplates.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 为每个模板添加 category
for template_id, category in categories.items():
    # 匹配模式: id: 'xxx', 后面紧跟 name: 'xxx',
    # 在 id 和 name 之间插入 category
    pattern = rf"(id:\s*'{template_id}',\s*\n\s*)(name:)"
    replacement = rf"\1category: '{category}',\n    \2"
    content = re.sub(pattern, replacement, content)

# 写回文件
with open('G:/douzhi/src/data/theatreTemplates.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print(f'✅ 已为 {len(categories)} 个模板添加分类')
