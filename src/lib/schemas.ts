import { z } from "zod"

export const registerSchema = z.object({
  name: z.string().min(2, "الاسم يجب أن يكون حرفين على الأقل"),
  email: z.string().email("البريد الإلكتروني غير صالح").optional().or(z.literal("")),
  password: z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل"),
  phone: z.string().regex(/^((05|07)\d{8}|77\d{7,8})$/, "رقم الجوال غير صالح"),
  cityId: z.string().optional(),
  accountType: z.enum(["customer", "merchant"]).optional(),
  storeName: z.string().optional(),
  sectorId: z.string().optional(),
})

export const loginSchema = z.object({
  email: z.string().min(1, "رقم الجوال أو البريد الإلكتروني مطلوب"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
})

export const productSchema = z.object({
  nameAr: z.string().min(2, "اسم المنتج مطلوب"),
  description: z.string().optional(),
  price: z.number().positive("السعر يجب أن يكون أكبر من صفر"),
  currency: z.string().default("SAR"),
  images: z.array(z.string()).optional(),
  isService: z.boolean().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
})

export const orderSchema = z.object({
  merchantId: z.string().min(1, "التاجر مطلوب"),
  message: z.string().optional(),
  productIds: z.array(z.string()).optional(),
  phone: z.string().regex(/^((05|07)\d{8}|77\d{7,8})$/, "رقم الجوال غير صالح").optional().or(z.literal("")),
})

export const reviewSchema = z.object({
  rating: z.number().int().min(1, "التقييم من 1 إلى 5").max(5, "التقييم من 1 إلى 5"),
  comment: z.string().max(500, "التعليق طويل جداً").optional(),
  merchantId: z.string().min(1, "التاجر مطلوب"),
})

export const contactSchema = z.object({
  name: z.string().min(2, "الاسم مطلوب"),
  email: z.string().email("البريد الإلكتروني غير صالح"),
  subject: z.string().min(3, "الموضوع مطلوب"),
  message: z.string().min(10, "الرسالة يجب أن تكون 10 أحرف على الأقل"),
})

export const merchantSchema = z.object({
  nameAr: z.string().min(2, "الاسم مطلوب"),
  description: z.string().optional(),
  contactEmail: z.string().email("البريد الإلكتروني غير صالح").optional().or(z.literal("")),
  contactPhone: z.string().regex(/^((05|07)\d{8}|77\d{7,8})$/, "رقم الجوال غير صالح").optional().or(z.literal("")),
  website: z.string().url("رابط غير صالح").optional().or(z.literal("")),
  address: z.string().optional(),
})

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, "البريد الإلكتروني مطلوب"),
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "الرمز مطلوب"),
  password: z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل"),
})

export const createCitySchema = z.object({
  nameAr: z.string().min(1, "اسم المدينة مطلوب"),
  slug: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  image: z.string().optional(),
})

export const updateCitySchema = z.object({
  nameAr: z.string().optional(),
  slug: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  image: z.string().optional(),
  isActive: z.boolean().optional(),
})

export const createSectorSchema = z.object({
  nameAr: z.string().min(1, "الاسم مطلوب"),
  description: z.string().optional(),
  icon: z.string().optional(),
  image: z.string().optional(),
  cityId: z.string().min(1, "المدينة مطلوبة"),
  parentId: z.string().optional(),
})

export const createMerchantSchema = z.object({
  nameAr: z.string().min(1),
  cityId: z.string().min(1),
  sectorId: z.string().min(1),
  description: z.string().optional(),
  contactEmail: z.string().optional(),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
  locationLat: z.number().optional(),
  locationLng: z.number().optional(),
  workingHours: z.any().optional(),
})

export const updateMerchantSchema = z.object({
  nameAr: z.string().min(1, "الاسم مطلوب"),
  description: z.string().optional(),
  contactEmail: z.string().optional(),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
  cityId: z.string().optional(),
  sectorId: z.string().optional(),
  logo: z.string().optional().nullable(),
  workingHours: z.any().optional(),
})

export const verifyMerchantSchema = z.object({
  merchantId: z.string().min(1, "معرف التاجر مطلوب"),
  action: z.enum(["approve", "reject"], { errorMap: () => ({ message: "بيانات غير صالحة" }) }),
})

export const adminCreateMerchantSchema = z.object({
  name: z.string().min(1),
  email: z.string().min(1),
  password: z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل"),
  phone: z.string().min(1),
  cityId: z.string().min(1),
  sectorId: z.string().min(1),
})

export const updateOrderStatusSchema = z.object({
  orderId: z.string().min(1),
  status: z.enum(["PENDING", "ACCEPTED", "REJECTED", "COMPLETED", "CANCELLED"]),
})

export const checkoutSchema = z.object({
  shippingAddress: z.string().optional(),
  phone: z.string().optional(),
  couponCode: z.string().optional(),
})

export const addCartItemSchema = z.object({
  productId: z.string().min(1, "المنتج مطلوب"),
  quantity: z.number().optional(),
})

export const updateCartItemSchema = z.object({
  itemId: z.string().min(1, "معرف العنصر مطلوب"),
  quantity: z.number(),
})

export const toggleFavoriteSchema = z.object({
  productId: z.string().min(1, "المنتج مطلوب"),
})

export const sendMessageSchema = z.object({
  content: z.string().min(1, "محتوى الرسالة مطلوب"),
  orderId: z.string().optional(),
})

export const validateCouponSchema = z.object({
  code: z.string().min(1, "كود الخصم مطلوب"),
  merchantId: z.string().optional(),
  orderTotal: z.number(),
})

export const aiChatSchema = z.object({
  message: z.string().min(1, "الرسالة مطلوبة"),
  cityId: z.string().optional(),
})

export const markNotificationSchema = z.object({
  id: z.string().optional(),
})
