/**
 * 自动生成 - 请勿手动编辑
 * 生成时间: 2025/11/22 15:16:00
 * 模板总数: 48
 */

import { TheatreTemplate } from '../theatreTemplates'

// 社交通讯
import { groupChatTemplate } from './social/group_chat'
import { privateChatTemplate } from './social/private_chat'
import { smsScreenshotTemplate } from './social/sms_screenshot'
import { callLogTemplate } from './social/call_log'
import { momentsPostTemplate } from './social/moments_post'
import { watchQqTemplate } from './social/watch_qq'
import { xiaohongshuPostTemplate } from './social/xiaohongshu_post'
import { datingProfileTemplate } from './social/dating_profile'

// 生活消费
import { receiptTemplate } from './life/receipt'
import { menuTemplate } from './life/menu'
import { newspaperTemplate } from './life/newspaper'
import { expressPackageTemplate } from './life/express_package'
import { couponTemplate } from './life/coupon'
import { parkingTicketTemplate } from './life/parking_ticket'
import { shoppingCartTemplate } from './life/shopping_cart'
import { hotelBookingTemplate } from './life/hotel_booking'
import { deliveryReviewTemplate } from './life/delivery_review'
import { packageTrackingTemplate } from './life/package_tracking'
import { groupBuyTemplate } from './life/group_buy'
import { bargainTemplate } from './life/bargain'
import { coupleHotelTemplate } from './life/couple_hotel'
import { adultShopTemplate } from './life/adult_shop'
import { barBillTemplate } from './life/bar_bill'

// 工作学习
import { diaryTemplate } from './work/diary'
import { memoTemplate } from './work/memo'
import { businessCardTemplate } from './work/business_card'
import { leaveRequestTemplate } from './work/leave_request'
import { certificateTemplate } from './work/certificate'
import { classScheduleTemplate } from './work/class_schedule'
import { checkInTemplate } from './work/check_in'
import { apologyLetterTemplate } from './work/apology_letter'
import { overtimeRecordTemplate } from './work/overtime_record'

// 情感关系
import { loveLetterTemplate } from './emotion/love_letter'
import { postcardTemplate } from './emotion/postcard'
import { birthdayCardTemplate } from './emotion/birthday_card'
import { sexTimerTemplate } from './emotion/sex_timer'
import { confessionBoardTemplate } from './emotion/confession_board'
import { polaroidPhotoTemplate } from './emotion/polaroid_photo'

// 娱乐休闲
import { scratchCardTemplate } from './entertainment/scratch_card'
import { movieTicketTemplate } from './entertainment/movie_ticket'
import { concertTicketTemplate } from './entertainment/concert_ticket'
import { musicPlayerTemplate } from './entertainment/music_player'

// 健康医疗
import { hospitalRegistrationTemplate } from './health/hospital_registration'
import { diagnosisTemplate } from './health/diagnosis'
import { stepRankingTemplate } from './health/step_ranking'
import { screenTimeTemplate } from './health/screen_time'

// 证件文书
import { marriageCertificateTemplate } from './document/marriage_certificate'
import { divorceCertificateTemplate } from './document/divorce_certificate'

// 交通出行
import { trainTicketTemplate } from './transport/train_ticket'
import { boardingPassTemplate } from './transport/boarding_pass'
import { navigationTemplate } from './transport/navigation'

// 隐私安全
import { incognitoModeTemplate } from './privacy/incognito_mode'
import { privateAlbumTemplate } from './privacy/private_album'
import { checkinRecordTemplate } from './privacy/checkin_record'

// 工具应用
import { countdownTemplate } from './tool/countdown'
import { timeCapsuleTemplate } from './tool/time_capsule'

// 所有模板
export const allTemplates: TheatreTemplate[] = [
  groupChatTemplate,
  privateChatTemplate,
  smsScreenshotTemplate,
  callLogTemplate,
  momentsPostTemplate,
  watchQqTemplate,
  xiaohongshuPostTemplate,
  datingProfileTemplate,
  receiptTemplate,
  menuTemplate,
  expressPackageTemplate,
  couponTemplate,
  parkingTicketTemplate,
  shoppingCartTemplate,
  hotelBookingTemplate,
  deliveryReviewTemplate,
  packageTrackingTemplate,
  groupBuyTemplate,
  bargainTemplate,
  coupleHotelTemplate,
  adultShopTemplate,
  barBillTemplate,
  diaryTemplate,
  memoTemplate,
  businessCardTemplate,
  leaveRequestTemplate,
  certificateTemplate,
  classScheduleTemplate,
  checkInTemplate,
  apologyLetterTemplate,
  overtimeRecordTemplate,
  loveLetterTemplate,
  postcardTemplate,
  birthdayCardTemplate,
  sexTimerTemplate,
  confessionBoardTemplate,
  polaroidPhotoTemplate,
  scratchCardTemplate,
  movieTicketTemplate,
  concertTicketTemplate,
  musicPlayerTemplate,
  hospitalRegistrationTemplate,
  diagnosisTemplate,
  stepRankingTemplate,
  screenTimeTemplate,
  marriageCertificateTemplate,
  divorceCertificateTemplate,
  trainTicketTemplate,
  boardingPassTemplate,
  navigationTemplate,
  incognitoModeTemplate,
  privateAlbumTemplate,
  checkinRecordTemplate,
  countdownTemplate,
  timeCapsuleTemplate
]

// 按分类索引
export const templatesByCategory = {
  '社交通讯': allTemplates.filter(t => t.category === '社交通讯'),
  '生活消费': allTemplates.filter(t => t.category === '生活消费'),
  '工作学习': allTemplates.filter(t => t.category === '工作学习'),
  '情感关系': allTemplates.filter(t => t.category === '情感关系'),
  '娱乐休闲': allTemplates.filter(t => t.category === '娱乐休闲'),
  '健康医疗': allTemplates.filter(t => t.category === '健康医疗'),
  '证件文书': allTemplates.filter(t => t.category === '证件文书'),
  '交通出行': allTemplates.filter(t => t.category === '交通出行'),
  '隐私安全': allTemplates.filter(t => t.category === '隐私安全'),
  '工具应用': allTemplates.filter(t => t.category === '工具应用')
}

// 按ID快速查找
export const templatesById = allTemplates.reduce((acc, t) => {
  acc[t.id] = t
  return acc
}, {} as Record<string, TheatreTemplate>)
