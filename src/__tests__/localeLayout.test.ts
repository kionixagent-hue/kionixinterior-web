import { generateStaticParams } from '@/app/[locale]/layout'

test('generateStaticParams returns all 3 locales', async () => {
  const params = await generateStaticParams()
  expect(params.map((p: { locale: string }) => p.locale).sort()).toEqual(['en', 'id', 'zh'])
})
