/** Keys that contain presentation settings, never auth or conversations. */
export const isStyleStorageKey = (key: string): boolean =>
  /^(?:global_(?:button|background|font|text|theme|decoration)|chat_(?:top_bar|bottom_bar|plus_button|emoji_button|send_button)|(?:user_|ai_)?avatar_(?:frame|shape|size)|hide_avatar|timestamp_in_bubble|hide_message_timestamp|musicPlayerBackground|screen_(?:top|bottom)_offset|switch_active_color|(?:user|ai)_(?:bubble_color|text_color|bubble_css)|chat_background|wallpaper_|font_size|font_color)/.test(key)
