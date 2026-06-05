import crypto from "crypto"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()
const SALT_ROUNDS = 12

const REVIEW_COMMENTS = {
  positive: [
    "تجربة ممتازة، خدمة سريعة وجودة عالية",
    "تعامل راقي وسعر منافس، أنصح بالتعامل معهم",
    "منتجات أصلية وخدمة ما بعد البيع ممتازة",
    "سرعة في التنفيذ ودقة في المواعيد",
    "فريق محترف وخبرة واضحة في المجال",
  ],
  neutral: [
    "تجربة متوسطة، المنتج جيد لكن الخدمة تحتاج تحسين",
    "المنتج مقبول لكن السعر مرتفع قليلاً",
    "خدمة جيدة لكن التأخير كان مزعجاً",
    "منتج مناسب لكن التغليف لم يكن مثالياً",
  ],
  negative: [
    "المنتج لم يصل كما هو موصوف",
    "خدمة سيئة وتأخير طويل في الاستجابة",
    "التعامل غير مهني، لا أنصح بالتعامل معهم",
    "المنتج به عيب ولم يتم استبداله",
  ],
}

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

async function main() {
  console.log("Seeding database...")

  await prisma.$transaction([
    prisma.orderItem.deleteMany(),
    prisma.order.deleteMany(),
    prisma.review.deleteMany(),
    prisma.favorite.deleteMany(),
    prisma.message.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.cartItem.deleteMany(),
    prisma.coupon.deleteMany(),
    prisma.ticket.deleteMany(),
    prisma.product.deleteMany(),
    prisma.merchant.deleteMany(),
    prisma.sector.deleteMany(),
    prisma.city.deleteMany(),
  ])

  // --- Users ---
  let seedPassword = process.env.SEED_PASSWORD
  if (!seedPassword) {
    seedPassword = crypto.randomBytes(12).toString("hex")
    console.warn("SEED_PASSWORD غير معرف، استخدم كلمة مرور عشوائية: " + seedPassword)
  }
  const adminPassword = await bcrypt.hash(seedPassword, SALT_ROUNDS)
  const merchantPassword = await bcrypt.hash(seedPassword, SALT_ROUNDS)
  const consumerPassword = await bcrypt.hash(seedPassword, SALT_ROUNDS)

  await prisma.user.upsert({
    where: { email: "admin@suqai.com" },
    update: { role: "ADMIN" },
    create: { name: "مدير النظام", email: "admin@suqai.com", phone: "0500000001", password: adminPassword, role: "ADMIN" },
  })
  console.log("Admin created")

  const consumers = [
    { name: "أحمد محمد", email: "consumer@test.com", phone: "0555000099" },
    { name: "سارة عبدالله", email: "sara@test.com", phone: "0555000088" },
    { name: "خالد علي", email: "khalid@test.com", phone: "0555000077" },
    { name: "نورة فهد", email: "noura@test.com", phone: "0555000066" },
  ]
  const consumerRecords = []
  for (const c of consumers) {
    const user = await prisma.user.upsert({
      where: { email: c.email },
      update: {},
      create: { ...c, password: consumerPassword, role: "CONSUMER" },
    })
    consumerRecords.push(user)
  }
  console.log(`${consumerRecords.length} consumers created`)

  // --- Cities ---
  const cityDefs = [
    { nameAr: "سيئون", slug: "seyun", lat: 15.9667, lng: 48.8333, image: "https://upload.wikimedia.org/wikipedia/commons/b/bd/Seiyun1.JPG" },
    { nameAr: "صنعاء", slug: "sanaa", lat: 15.3694, lng: 44.1910, image: "https://upload.wikimedia.org/wikipedia/commons/8/87/Sana%27a.jpg" },
    { nameAr: "عدن", slug: "aden", lat: 12.7855, lng: 45.0187, image: "https://upload.wikimedia.org/wikipedia/commons/1/19/Old_Town_Aden_Yemen.jpg" },
    { nameAr: "المكلا", slug: "mukalla", lat: 14.5389, lng: 49.1313, image: "https://upload.wikimedia.org/wikipedia/commons/c/c7/Sultan_al-Quaiti_Palace.jpg" },
    { nameAr: "تريم", slug: "tarim", lat: 16.0517, lng: 48.9992, image: "https://upload.wikimedia.org/wikipedia/commons/5/52/Yemen_%282285851285%29.jpg" },
    { nameAr: "مارب", slug: "marib", lat: 15.4622, lng: 45.3269, image: "https://upload.wikimedia.org/wikipedia/commons/9/95/Ancient_Ma%27rib_01.jpg" },
    { nameAr: "إب", slug: "ibb", lat: 13.9667, lng: 44.1667, image: "https://upload.wikimedia.org/wikipedia/commons/b/bf/Ibb_%2814931213550%29.jpg" },
    { nameAr: "تعز", slug: "taiz", lat: 13.5789, lng: 44.0219, image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Ta%27izz.jpg" },
  ]
  for (const c of cityDefs) {
    await prisma.city.upsert({ where: { slug: c.slug }, update: { image: c.image }, create: c })
  }
  const allCities = await prisma.city.findMany()
  console.log(`${allCities.length} cities created`)

  // --- Sectors ---
  const sectorImages: Record<string, string> = {
    "renewable-energy": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Solar_panel_system_on_a_house.jpg/400px-Solar_panel_system_on_a_house.jpg",
    "electrical": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/High-voltage_lines.jpg/400px-High-voltage_lines.jpg",
    "electronics": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Electronic_components.jpg/400px-Electronic_components.jpg",
    "construction": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Construction_site.jpg/400px-Construction_site.jpg",
    "cars": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Toyota_cars_in_line.jpg/400px-Toyota_cars_in_line.jpg",
    "real-estate": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Modern_building.jpg/400px-Modern_building.jpg",
    "solar-panels": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Solar_panels_on_roof.jpg/400px-Solar_panels_on_roof.jpg",
    "batteries": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Lithium-ion_battery.jpg/400px-Lithium-ion_battery.jpg",
  }

  async function ensureSector(cityId: string, nameAr: string, slug: string, description: string, parentSlug?: string) {
    const parent = parentSlug ? await prisma.sector.findUnique({ where: { slug_cityId: { slug: parentSlug, cityId } } }) : undefined
    return prisma.sector.upsert({
      where: { slug_cityId: { slug, cityId } },
      update: { image: sectorImages[slug] },
      create: { nameAr, slug, description, image: sectorImages[slug], cityId, parentId: parent?.id, sortOrder: 0 },
    })
  }

  for (const city of allCities) {
    await ensureSector(city.id, "الطاقة المتجددة", "renewable-energy", "حلول الطاقة الشمسية وطاقة الرياح والطاقات المتجددة")
    await ensureSector(city.id, "الكهربائيات", "electrical", "تمديدات كهربائية، لوحات توزيع، مواد كهربائية")
    await ensureSector(city.id, "الأجهزة الإلكترونية", "electronics", "أجهزة إلكترونية، كمبيوترات، جوالات")
    await ensureSector(city.id, "مواد البناء", "construction", "مواد بناء، سباكة، دهانات، أدوات صحية")
    await ensureSector(city.id, "السيارات", "cars", "سيارات جديدة ومستعملة، صيانة، قطع غيار")
    await ensureSector(city.id, "العقارات", "real-estate", "عقارات سكنية وتجارية، إيجار وبيع")
    await ensureSector(city.id, "الألواح الشمسية", "solar-panels", "ألواح شمسية ومنظمات شحن", "renewable-energy")
    await ensureSector(city.id, "البطاريات والتخزين", "batteries", "بطاريات وأنظمة تخزين الطاقة", "renewable-energy")
  }
  console.log("Sectors created for all cities")

  // --- Merchants ---
  const merchantDefs = [
    { nameAr: "شركة الطاقة الشمسية الأولى", slug: "first-solar-company", description: "متخصصون في تركيب أنظمة الطاقة الشمسية للمنازل والشركات", contactPhone: "0777000001", contactEmail: "info@first-solar.com", address: "سيئون، حي الغرفة", locationLat: 15.9700, locationLng: 48.8350, isVerified: true, status: "active", sectorSlug: "renewable-energy", citySlug: "seyun" },
    { nameAr: "مؤسسة كهرباء المستقبل", slug: "future-electric", description: "تمديدات كهربائية ولوحات توزيع وكابلات وأسلاك", contactPhone: "0777000002", contactEmail: "info@future-electric.com", address: "سيئون، حي الشهداء", locationLat: 15.9650, locationLng: 48.8300, isVerified: true, status: "active", sectorSlug: "electrical", citySlug: "seyun" },
    { nameAr: "متجر الإلكترونيات الحديثة", slug: "modern-electronics", description: "أحدث الأجهزة الإلكترونية والجوالات والكمبيوترات", contactPhone: "0777000003", contactEmail: "info@modern-electronics.com", address: "سيئون، شارع المكلا", locationLat: 15.9680, locationLng: 48.8400, isVerified: true, status: "active", sectorSlug: "electronics", citySlug: "seyun" },
    { nameAr: "مؤسسة البناء المتين", slug: "solid-construction", description: "مواد بناء وسباكة ودهانات عالية الجودة", contactPhone: "0777000004", contactEmail: "info@solid-construction.com", address: "سيئون، حي السوق", locationLat: 15.9640, locationLng: 48.8280, isVerified: false, status: "active", sectorSlug: "construction", citySlug: "seyun" },
    { nameAr: "معرض السيارات الفاخرة", slug: "luxury-cars", description: "سيارات جديدة ومستعملة فاخرة مع خدمة ما بعد البيع", contactPhone: "0777000005", contactEmail: "info@luxury-cars.com", address: "سيئون، طريق المطار", locationLat: 15.9720, locationLng: 48.8450, isVerified: true, status: "active", sectorSlug: "cars", citySlug: "seyun" },
    { nameAr: "الشركة العقارية الأولى", slug: "prime-real-estate", description: "عقارات سكنية وتجارية في أفضل المواقع", contactPhone: "0777000006", contactEmail: "info@prime-real-estate.com", address: "سيئون، حي اللسك", locationLat: 15.9620, locationLng: 48.8380, isVerified: true, status: "active", sectorSlug: "real-estate", citySlug: "seyun" },
    { nameAr: "تقنية الطاقة الخضراء", slug: "green-energy-tech", description: "حلول متكاملة للطاقة المتجددة والاستدامة", contactPhone: "0777000007", contactEmail: "info@green-energy.com", address: "سيئون، حي الخزان", locationLat: 15.9690, locationLng: 48.8320, isVerified: false, status: "pending", sectorSlug: "renewable-energy", citySlug: "seyun" },
    { nameAr: "مؤسسة الإضاءة المتكاملة", slug: "complete-lighting", description: "إضاءة LED وثريات ولوازم كهربائية", contactPhone: "0777000010", contactEmail: "info@complete-lighting.com", address: "سيئون، حي المكلا", locationLat: 15.9660, locationLng: 48.8420, isVerified: true, status: "active", sectorSlug: "electrical", citySlug: "seyun" },
    { nameAr: "سوق السيارات المستعملة", slug: "used-cars-market", description: "سيارات مستعملة بأسعار تنافسية مع فحص شامل", contactPhone: "0777000011", contactEmail: "info@used-cars.com", address: "سيئون، حي الجراد", locationLat: 15.9630, locationLng: 48.8270, isVerified: true, status: "active", sectorSlug: "cars", citySlug: "seyun" },
    { nameAr: "مؤسسة ألواح الطاقة", slug: "energy-panels", description: "ألواح شمسية ومنظمات شحن وكشافات طاقة شمسية", contactPhone: "0777000012", contactEmail: "info@energy-panels.com", address: "سيئون، شارع الخزان", locationLat: 15.9670, locationLng: 48.8370, isVerified: true, status: "active", sectorSlug: "solar-panels", citySlug: "seyun" },
  ]

  const productDefs: Record<string, { nameAr: string; description: string; price: number; tags: string[]; isService?: boolean; isActive?: boolean }[]> = {
    "renewable-energy": [
      { nameAr: "لوح شمسي 500 واط", description: "لوح شمسي أحادي البلورة بقدرة 500 واط، كفاءة عالية 22%", price: 890, tags: ["ألواح شمسية", "طاقة شمسية"] },
      { nameAr: "بطارية ليثيوم 5kWh", description: "بطارية ليثيوم أيون ذكية لتخزين الطاقة الشمسية 5 كيلوواط/ساعة", price: 4500, tags: ["بطاريات", "تخزين"] },
      { nameAr: "منظم شحن MPPT 60A", description: "منظم شحن بتقنية MPPT 60 أمبير مع شاشة عرض LCD", price: 1200, tags: ["منظم شحن"] },
      { nameAr: "انفرتر 3000 واط", description: "انفرتر موجة جيبية نقية 3000 واط مع حماية ذكية", price: 2200, tags: ["انفرتر", "طاقة شمسية"] },
      { nameAr: "تركيب نظام شمسي كامل", description: "خدمة تركيب نظام شمسي كامل للمنازل", price: 15000, tags: ["تركيب", "خدمات"], isService: true },
      { nameAr: "كشاف طاقة شمسية 100W", description: "كشاف LED يعمل بالطاقة الشمسية 100 واط مع ريموت", price: 299, tags: ["كشافات", "طاقة شمسية"] },
    ],
    "electrical": [
      { nameAr: "كابل كهربائي 10mm", description: "كابل نحاسي معزول 10mm بجودة عالية (100 متر)", price: 350, tags: ["كابلات", "أسلاك"] },
      { nameAr: "قاطع دائرة 63A", description: "قاطع دائرة كهربائية 63 أمبير أحادي الفاز من شنايدر", price: 85, tags: ["قواطع", "كهرباء"] },
      { nameAr: "لوحة توزيع كهربائية 18 قناة", description: "لوحة توزيع رئيسية 18 قناة مع قواطع أتوماتيكية", price: 450, tags: ["لوحات توزيع"] },
      { nameAr: "خدمة تمديدات كهربائية", description: "خدمة تمديدات كهربائية للمنازل والمكاتب", price: 2000, tags: ["خدمات", "تمديدات"], isService: true },
      { nameAr: "مفتاح كهربائي ذكي", description: "مفتاح ذكي مع تحكم عن بعد عبر واي فاي، متوافق مع أليكسا", price: 129, tags: ["مفاتيح", "ذكية"] },
    ],
    "electronics": [
      { nameAr: "ايفون 16 برو 256GB", description: "هاتف ايفون 16 برو 256GB - اللون الأسود - ضمان الوكيل", price: 4999, tags: ["ايفون", "جوال"] },
      { nameAr: "لابتوب ألعاب 15.6 بوصة", description: "لابتوب ألعاب معالج i7، ذاكرة 16GB، كارت RTX 4060", price: 5999, tags: ["لابتوب", "ألعاب"] },
      { nameAr: "سماعات لاسلكية", description: "سماعات بلوتوث لاسلكية مع عزل ضوضاء، بطارية 30 ساعة", price: 299, tags: ["سماعات", "لاسلكي"] },
      { nameAr: "شاشة 65 بوصة 4K", description: "شاشة LED 65 بوصة بدقة 4K HDR سمارت مع ريموت", price: 2799, tags: ["شاشة", "تلفزيون"] },
      { nameAr: "كاميرا مراقبة لاسلكية", description: "كاميرا مراقبة داخلية 1080p مع رؤية ليلية", price: 199, tags: ["كاميرا", "مراقبة"] },
      { nameAr: "بلاي ستيشن 5", description: "جهاز بلاي ستيشن 5 ديجيتال إديشن", price: 1999, tags: ["بلاي ستيشن", "ألعاب"] },
      { nameAr: "صيانة أجهزة إلكترونية", description: "خدمة صيانة لجميع الأجهزة الإلكترونية", price: 150, tags: ["صيانة", "خدمات"], isService: true },
    ],
    "construction": [
      { nameAr: "سمنت بورتلاند 50 كجم", description: "كيس سمنت بورتلاند عادي 50 كجم", price: 22, tags: ["سمنت", "بناء"] },
      { nameAr: "دهان جدران أكريليك", description: "دهان أكريليك داخلي 20 لتر، أبيض، قابل للغسل", price: 189, tags: ["دهانات", "بناء"] },
      { nameAr: "بلاط سيراميك 60x60", description: "بلاط سيراميك أرضيات 60x60 سم درجة أولى", price: 48, tags: ["بلاط", "سيراميك"] },
    ],
    "cars": [
      { nameAr: "تغيير زيت المحرك", description: "خدمة تغيير زيت المحرك مع فلتر الزيت (زيت 4 لتر)", price: 199, tags: ["صيانة", "زيت"], isService: true },
      { nameAr: "إطار سيارة مقاس 18", description: "إطار سيارة جديد مقاس 18 بوصة ماركة ميشلان", price: 450, tags: ["إطارات", "سيارات"] },
      { nameAr: "بطارية سيارة 70 أمبير", description: "بطارية سيارة جافة 70 أمبير مع ضمان سنتين", price: 320, tags: ["بطاريات", "سيارات"] },
    ],
    "real-estate": [
      { nameAr: "استشارة عقارية", description: "استشارة عقارية شاملة لتقييم العقارات والفرص الاستثمارية", price: 500, tags: ["استشارات", "عقارات"], isService: true },
      { nameAr: "تسويق عقاري", description: "خدمة تسويق عقاري احترافية تشمل تصوير وجولات افتراضية", price: 3000, tags: ["تسويق", "عقارات"], isService: true },
    ],
    "solar-panels": [
      { nameAr: "لوح شمسي 200 واط", description: "لوح شمسي متعدد البلورة بقدرة 200 واط", price: 450, tags: ["ألواح شمسية"] },
      { nameAr: "منظم شحن PWM 30A", description: "منظم شحن PWM 30 أمبير بسيط وفعال", price: 180, tags: ["منظم شحن"] },
    ],
    "batteries": [
      { nameAr: "بطارية ديب سايكل 100Ah", description: "بطارية ديب سايكل جل 100 أمبير/ساعة 12 فولت", price: 850, tags: ["بطاريات", "تخزين"] },
      { nameAr: "بطارية ليثيوم 10kWh", description: "بطارية ليثيوم أيون 10 كيلوواط/ساعة قابلة للتوسعة", price: 8500, tags: ["بطاريات", "ليثيوم"] },
    ],
  }

  const merchantProductsMap: Record<string, string> = {
    "first-solar-company": "renewable-energy",
    "future-electric": "electrical",
    "modern-electronics": "electronics",
    "solid-construction": "construction",
    "luxury-cars": "cars",
    "prime-real-estate": "real-estate",
    "green-energy-tech": "renewable-energy",
    "complete-lighting": "electrical",
    "used-cars-market": "cars",
    "energy-panels": "solar-panels",
  }

  const allMerchants: { id: string; userId: string | null }[] = []
  const allProducts: { id: string; merchantId: string; price: number }[] = []

  for (const md of merchantDefs) {
    const city = allCities.find(c => c.slug === md.citySlug)!
    const sector = await prisma.sector.findUnique({ where: { slug_cityId: { slug: md.sectorSlug, cityId: city.id } } })
    if (!sector) { console.warn("Sector not found: " + md.sectorSlug + " in " + md.citySlug); continue }

    const user = await prisma.user.upsert({
      where: { email: md.contactEmail },
      update: {},
      create: { name: md.nameAr, email: md.contactEmail, password: merchantPassword, role: "MERCHANT", cityId: city.id, phone: md.contactPhone },
    })

    const merchant = await prisma.merchant.upsert({
      where: { slug_cityId: { slug: md.slug, cityId: city.id } },
      update: {},
      create: {
        nameAr: md.nameAr, slug: md.slug, description: md.description,
        contactPhone: md.contactPhone, contactEmail: md.contactEmail,
        address: md.address, locationLat: md.locationLat, locationLng: md.locationLng,
        isVerified: md.isVerified, status: md.status,
        workingHours: [
          { day: "السبت", open: "09:00", close: "21:00" },
          { day: "الأحد", open: "09:00", close: "21:00" },
          { day: "الاثنين", open: "09:00", close: "21:00" },
          { day: "الثلاثاء", open: "09:00", close: "21:00" },
          { day: "الأربعاء", open: "09:00", close: "21:00" },
          { day: "الخميس", open: "09:00", close: "18:00" },
        ],
        sectorId: sector.id, cityId: city.id, userId: user.id,
      },
    })
    allMerchants.push(merchant)

    const productKey = merchantProductsMap[md.slug] || "renewable-energy"
    const products = productDefs[productKey] || productDefs["renewable-energy"]
    for (const p of products) {
      const prod = await prisma.product.create({
        data: { ...p, merchantId: merchant.id, isActive: p.isActive ?? true },
      })
      allProducts.push(prod)
    }
  }
  console.log(`${allMerchants.length} merchants with ${allProducts.length} products created`)

  // --- Reviews ---
  let reviewCount = 0
  for (const merchant of allMerchants) {
    const numReviews = Math.floor(Math.random() * 3) + 1
    const reviewers = consumerRecords.slice(0, numReviews)
    for (const consumer of reviewers) {
      const rating = Math.random() < 0.6 ? Math.floor(Math.random() * 2) + 4 : Math.floor(Math.random() * 3) + 1
      const comment = rating >= 4
        ? pickRandom(REVIEW_COMMENTS.positive)
        : rating >= 3
        ? pickRandom(REVIEW_COMMENTS.neutral)
        : pickRandom(REVIEW_COMMENTS.negative)
      await prisma.review.upsert({
        where: { consumerId_merchantId: { consumerId: consumer.id, merchantId: merchant.id } },
        update: {},
        create: { rating, comment, consumerId: consumer.id, merchantId: merchant.id },
      })
      reviewCount++
    }
  }
  console.log(`${reviewCount} reviews created`)

  // --- Favorites ---
  let favoriteCount = 0
  for (const consumer of consumerRecords) {
    const favProducts = allProducts.sort(() => Math.random() - 0.5).slice(0, Math.floor(Math.random() * 4) + 1)
    for (const p of favProducts) {
      await prisma.favorite.upsert({
        where: { userId_productId: { userId: consumer.id, productId: p.id } },
        update: {},
        create: { userId: consumer.id, productId: p.id },
      })
      favoriteCount++
    }
  }
  console.log(`${favoriteCount} favorites created`)

  // --- Orders ---
  const orderStatuses = ["PENDING", "ACCEPTED", "COMPLETED", "CANCELLED"] as const
  let orderCount = 0
  for (const consumer of consumerRecords) {
    const merchant = allMerchants[Math.floor(Math.random() * allMerchants.length)]
    const merchantProducts = allProducts.filter(p => p.merchantId === merchant.id)
    if (merchantProducts.length === 0) continue
    const product = merchantProducts[0]

    const status = pickRandom(orderStatuses)
    await prisma.order.create({
      data: {
        consumerId: consumer.id,
        merchantId: merchant.id,
        status,
        message: status === "PENDING" ? "أرجو التواصل معي بخصوص السعر" : undefined,
        items: { create: { productId: product.id, unitPrice: product.price, quantity: 1 } },
      },
    })
    orderCount++

    await prisma.notification.create({
      data: {
        userId: merchant.userId!,
        title: "طلب جديد",
        body: "لديك طلب جديد من " + consumer.name,
        type: "order",
      },
    }).catch(() => {})
  }
  console.log(`${orderCount} orders created`)

  // --- Notifications ---
  for (const consumer of consumerRecords) {
    await prisma.notification.create({
      data: { userId: consumer.id, title: "مرحباً بك في سوقي", body: "نرحب بك في منصتنا، يمكنك تصفح المنتجات والتواصل مع التجار", type: "welcome" },
    }).catch(() => {})
  }
  console.log("Notifications created")

  // --- Messages ---
  for (const consumer of consumerRecords.slice(0, 2)) {
    const merchant = allMerchants.find(m => m.userId)!
    if (merchant.userId) {
      await prisma.message.create({
        data: { content: "مرحباً، لدي استفسار عن المنتجات", senderId: consumer.id, orderId: undefined },
      }).catch(() => {})
    }
  }
  console.log("Messages created")

  // --- Tickets ---
  await prisma.ticket.create({
    data: { subject: "طلب دعم فني", description: "أواجه مشكلة في تسجيل الدخول إلى حسابي", status: "open", priority: "medium", senderId: consumerRecords[0].id },
  }).catch(() => {})
  console.log("Tickets created")

  // --- Coupons ---
  await prisma.coupon.create({
    data: { code: "WELCOME10", discountPercent: 10, minOrder: 500, maxUses: 50, isActive: true },
  }).catch(() => {})
  await prisma.coupon.create({
    data: { code: "SAVE100", discountAmount: 100, minOrder: 1000, maxUses: 20, isActive: true },
  }).catch(() => {})
  console.log("Coupons created")

  console.log("Seeding complete!")
  console.log("---")
  console.log("تم إنشاء الحسابات بكلمة مرور من متغير SEED_PASSWORD")
  console.log("Admin: admin@suqai.com")
  console.log("Consumer: consumer@test.com")
  console.log("Merchant: info@first-solar.com")
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
