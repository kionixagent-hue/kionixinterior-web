export function buildArticlePrompt(topic: string): string {
  return `Kamu adalah content writer untuk Kionix Interior, studio interior design & renovasi di Batam, Indonesia. Target pembaca: pemilik rumah/apartemen di Batam yang mempertimbangkan renovasi interior, dengan konteks iklim tropis (lembap, panas).

Tulis satu artikel blog SEO tentang topik: "${topic}".

Tulis dalam gaya artikel Kionix Interior yang sudah ada: praktis, actionable, tips bernomor dengan heading markdown "## ", tiap section 2-4 kalimat, diakhiri paragraf CTA yang mengarahkan pembaca menghubungi Kionix Interior lewat WhatsApp untuk konsultasi.

Balas HANYA dengan satu JSON object mentah (tanpa markdown code fence, tanpa teks pembungkus apa pun), persis struktur berikut:

{
  "tags": ["1-3 tag kebab-case relevan, contoh kitchen-set"],
  "id": {
    "title": "judul artikel dalam Bahasa Indonesia",
    "quickAnswer": "1-2 kalimat ringkasan jawaban cepat",
    "body": "body artikel markdown, 4-6 section '## ', tiap section >= 40 karakter, CTA WhatsApp di akhir",
    "metaDescription": "meta description <= 160 karakter",
    "faq": [{ "q": "pertanyaan", "a": "jawaban" }]
  },
  "en": {
    "title": "article title in English",
    "quickAnswer": "1-2 sentence quick answer summary",
    "body": "markdown body, 4-6 '## ' sections, each >= 40 chars, WhatsApp CTA at the end",
    "metaDescription": "meta description <= 160 chars",
    "faq": [{ "q": "question", "a": "answer" }]
  }
}

Section heading (judul '## ...') di "id" dan "en" tidak perlu sama persis kata-katanya — masing-masing ditulis natural dalam bahasanya sendiri.`
}
