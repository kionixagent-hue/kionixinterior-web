/* eslint-disable @typescript-eslint/no-require-imports -- plain CommonJS CLI script,
   not part of the Next.js app bundle; runs directly via `node` on Node 20 in prod. */
const { existsSync } = require('fs')
if (existsSync('.env.local')) {
  process.loadEnvFile('.env.local')
}

const postgres = require('postgres')

// ponytail: duplicates src/lib/blog/slug.ts's generateSlug logic (plain JS script,
// can't import the TS module directly) — keep in sync if slug rules change.
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

const translations = [
  {
    locale: 'id',
    title: '5 Tips Memilih Warna Cat Interior Rumah di Batam',
    quickAnswer:
      'Untuk iklim tropis Batam, pilih warna cat interior netral hangat (krem, putih gading) di ruang utama agar terasa sejuk dan luas, lalu tambahkan aksen warna berani di satu dinding untuk karakter.',
    metaDescription:
      'Panduan memilih warna cat interior rumah yang cocok untuk iklim tropis Batam, dari ruang tamu hingga kamar tidur, oleh tim Kionix Interior.',
    body: `Memilih warna cat interior bukan cuma soal selera, tapi juga soal kenyamanan sehari-hari — apalagi dengan cuaca tropis Batam yang lembap dan panas.

## 1. Utamakan warna netral hangat di ruang utama

Krem, putih gading, dan abu-abu muda memantulkan cahaya lebih baik sehingga ruangan terasa lebih sejuk dan lapang, cocok untuk ruang tamu dan ruang keluarga.

## 2. Batasi warna gelap untuk aksen saja

Warna gelap menyerap panas dan membuat ruangan sempit terasa lebih sempit. Gunakan hanya sebagai aksen satu dinding (accent wall), bukan warna dominan.

## 3. Sesuaikan dengan arah cahaya matahari

Ruangan yang menghadap barat mendapat sinar matahari sore yang kuat — imbangi dengan warna dingin (biru muda, hijau sage) agar tidak terasa makin panas.

## 4. Gunakan cat dengan lapisan anti-lembap

Iklim Batam yang lembap membuat cat biasa mudah berjamur. Pilih cat interior dengan lapisan anti-jamur, terutama untuk kamar mandi dan dapur.

## 5. Uji warna sebelum mengecat penuh

Selalu coba sample kecil di dinding dan lihat hasilnya pada pagi dan malam hari sebelum memutuskan warna final untuk seluruh ruangan.

Butuh bantuan menentukan skema warna dan desain interior rumah Anda di Batam? Tim Kionix Interior siap membantu dari konsultasi hingga eksekusi.`,
    faq: [
      {
        q: 'Warna cat apa yang paling cocok untuk rumah kecil di Batam?',
        a: 'Warna netral terang seperti putih gading atau krem, karena memantulkan cahaya dan membuat ruangan terasa lebih luas.',
      },
      {
        q: 'Apakah warna gelap selalu membuat ruangan sempit terasa sempit?',
        a: 'Iya jika dominan, tapi aman digunakan sebagai aksen satu dinding untuk menambah karakter tanpa mengorbankan kesan luas.',
      },
    ],
  },
  {
    locale: 'en',
    title: '5 Tips for Choosing Interior Paint Colors for Your Batam Home',
    quickAnswer:
      "For Batam's tropical climate, choose warm neutral interior colors (cream, ivory white) in main rooms to feel cool and spacious, then add one bold accent wall for character.",
    metaDescription:
      "A guide to choosing interior paint colors suited for Batam's tropical climate, from living rooms to bedrooms, by the Kionix Interior team.",
    body: `Choosing an interior paint color isn't just about taste — it's about everyday comfort, especially in Batam's humid tropical climate.

## 1. Favor warm neutrals in main rooms

Cream, ivory white, and light gray reflect light better, making rooms feel cooler and more spacious — ideal for living and family rooms.

## 2. Keep dark colors as accents only

Dark colors absorb heat and make small rooms feel smaller. Use them only as a single accent wall, not the dominant color.

## 3. Match colors to sunlight direction

Rooms facing west get strong afternoon sun — balance this with cool colors (light blue, sage green) so the space doesn't feel even hotter.

## 4. Use paint with anti-humidity coating

Batam's humid climate makes regular paint prone to mold. Choose interior paint with an anti-fungal coating, especially for bathrooms and kitchens.

## 5. Test before committing

Always try a small sample on the wall and check it in morning and evening light before deciding on the final color for the whole room.

Need help choosing a color scheme and interior design for your Batam home? The Kionix Interior team is ready to help from consultation to execution.`,
    faq: [
      {
        q: 'What paint color works best for small homes in Batam?',
        a: 'Light neutrals like ivory white or cream, since they reflect light and make rooms feel more spacious.',
      },
      {
        q: 'Do dark colors always make small rooms feel smaller?',
        a: 'Only if used dominantly — they work well as a single accent wall to add character without losing the spacious feel.',
      },
    ],
  },
]

async function main() {
  const sql = postgres(process.env.DATABASE_URL)
  const now = new Date()

  const [article] = await sql`
    insert into articles (status, tags, published_at)
    values ('published', ARRAY['tips', 'cat-interior', 'batam'], ${now})
    returning id
  `

  for (const t of translations) {
    await sql`
      insert into article_translations
        (article_id, locale, slug, title, quick_answer, body, meta_description, faq)
      values (
        ${article.id}, ${t.locale}, ${generateSlug(t.title)}, ${t.title},
        ${t.quickAnswer}, ${t.body}, ${t.metaDescription}, ${sql.json(t.faq)}
      )
    `
  }

  console.log(`Seeded article ${article.id}`)
  await sql.end()
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
