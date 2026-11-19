export type Category = { id: string; bn: string; en: string; icon: string; iconImg: string; enabled: boolean; order: number };

const c = (id: string, bn: string, en: string, icon: string, order: number): Category => ({ id, bn, en, icon, iconImg: '', enabled: true, order });

export const defaultCategories: Category[] = [
  c('electrical', 'ইলেকট্রিশিয়ান', 'Electrical', 'bolt', 1),
  c('plumbing', 'প্লাম্বার', 'Plumbing', 'plumbing', 2),
  c('masonry', 'রাজমিস্ত্রি', 'Masonry', 'construction', 3),
  c('painting', 'রংমিস্ত্রি', 'Painting', 'format_paint', 4),
  c('carpentry', 'কাঠমিস্ত্রি', 'Carpentry', 'carpenter', 5),
  c('ac_repair', 'ফ্রিজ ও এসি মেকানিক', 'AC & Fridge Repair', 'ac_unit', 6),
  c('vehicle_repair', 'গাড়ি ও মোটরসাইকেল মেকানিক', 'Vehicle Repair', 'directions_car', 7),
  c('cleaning', 'পরিষ্কার-পরিচ্ছন্নতা', 'Cleaning', 'cleaning_services', 8),
  c('construction', 'নির্মাণ শ্রমিক', 'Construction', 'hardware', 9),
  c('home_maintenance', 'বাড়ির রক্ষণাবেক্ষণ', 'Home Maintenance', 'home_repair_service', 10),
  c('mobile_repair', 'মোবাইল মেরামত', 'Mobile Repair', 'smartphone', 11),
  c('tailor', 'দর্জি', 'Tailor', 'checkroom', 12),
  c('welding', 'ওয়েল্ডিং ও গ্রিল', 'Welding & Grill', 'build', 13),
  c('tv_electronics', 'টিভি ও ইলেকট্রনিক্স', 'TV & Electronics', 'tv', 14),
  c('solar_battery', 'সোলার ও ব্যাটারি', 'Solar & Battery', 'solar_power', 15),
];

/** Emoji stand-ins for the app's Material icons (the website has no icon font to download). */
export const iconEmoji: Record<string, string> = {
  bolt: '⚡', plumbing: '🚰', construction: '🧱', format_paint: '🎨', carpenter: '🪚', ac_unit: '❄️',
  directions_car: '🚗', cleaning_services: '🧹', home_repair_service: '🏠', build: '🔧', smartphone: '📱',
  checkroom: '🧵', hardware: '🛠️', tv: '📺', solar_power: '☀️', two_wheeler: '🏍️', handyman: '🔨', more_horiz: '⋯',
};

export const iconColors: Record<string, string> = {
  bolt: '#1E6FE0', plumbing: '#6A4CE0', construction: '#E0622B', format_paint: '#E0A41B', carpenter: '#8A5A2B',
  ac_unit: '#0FA3B8', directions_car: '#D64545', cleaning_services: '#D9468F', home_repair_service: '#F26B1D',
  build: '#3E8E2F', smartphone: '#3A5BD9', checkroom: '#B0459C', hardware: '#CB6B1E', tv: '#2B7FD9',
  solar_power: '#E0A41B', two_wheeler: '#D64545', handyman: '#E8590C', more_horiz: '#6B7A72',
};

export const reportReasons: [string, string][] = [
  ['ভুয়া তথ্য', 'Fake information'],
  ['প্রতারণা বা টাকা চেয়েছে', 'Fraud or asked for money'],
  ['খারাপ ব্যবহার', 'Abusive behavior'],
  ['অন্য কারণ', 'Other'],
];

export const bookingStatuses = ['pending', 'accepted', 'rejected', 'in_progress', 'completed', 'cancelled'] as const;
export type BookingStatus = (typeof bookingStatuses)[number];
