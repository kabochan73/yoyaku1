// サーバーコンポーネント（SSR/ISR）。'use client' なし = サーバーで実行される
import { serverFetch } from '@/lib/serverFetch'
import type { PricingRule, BusinessSettings } from '@/types'
import Calendar from '@/components/calendar/Calendar'

// day_type の値を日本語ラベルに変換するマップ
const DAY_TYPE_LABEL: Record<PricingRule['day_type'], string> = {
  weekday: '平日',
  weekend: '土日',
  holiday: '祝日',
}

// ISRでキャッシュ。revalidateTag('pricing-rules') が呼ばれた時だけ再取得される
async function fetchPricingRules(): Promise<PricingRule[]> {
  try {
    return await serverFetch<PricingRule[]>('/pricing-rules', {
      next: { tags: ['pricing-rules'] },
    })
  } catch {
    return [] // 失敗しても空配列を返してページを壊さない
  }
}

// ISRでキャッシュ。revalidateTag('business-settings') が呼ばれた時だけ再取得される
async function fetchBusinessSettings(): Promise<BusinessSettings | null> {
  try {
    return await serverFetch<BusinessSettings>('/business-settings', {
      next: { tags: ['business-settings'] },
    })
  } catch {
    return null // 失敗したらnullを返す
  }
}

export default async function TopPage() {
  // Promise.all で2つのAPIを並行して叩く（並行データフェッチ）
  // コンポーネントの中で呼ぶことで、リクエストのたびにキャッシュを確認する
  const [pricingRules, settings] = await Promise.all([
    fetchPricingRules(),
    fetchBusinessSettings(),
  ])

  // is_active: true のルールだけ表示する
  const activeRules = pricingRules.filter((r) => r.is_active)

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">

      {/* 施設情報（ベタ書き・SSG相当） */}
      <section className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-green-700 mb-4">フットサルコート ○○</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
          <div>
            <p className="font-medium text-gray-900 mb-0.5">所在地</p>
            <p>〒000-0000 東京都○○区○○1-2-3</p>
          </div>
          <div>
            <p className="font-medium text-gray-900 mb-0.5">営業時間</p>
            <p>
              {/* settings が null の場合はフォールバック表示 */}
              {settings
                ? `${settings.opening_time.slice(0, 5)} 〜 ${settings.closing_time.slice(0, 5)}`
                : '09:00 〜 22:00'}
            </p>
          </div>
          <div>
            <p className="font-medium text-gray-900 mb-0.5">アクセス</p>
            <p>○○駅より徒歩5分</p>
          </div>
          <div>
            <p className="font-medium text-gray-900 mb-0.5">収容人数</p>
            <p>最大10名（1コート）</p>
          </div>
        </div>
      </section>

      {/* 料金表（ISR）: 有効なルールが1件以上ある時だけ表示 */}
      {activeRules.length > 0 && (
        <section className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold mb-4">料金表</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4 font-medium text-gray-500">プラン</th>
                  <th className="text-left py-2 pr-4 font-medium text-gray-500">区分</th>
                  <th className="text-left py-2 pr-4 font-medium text-gray-500">時間帯</th>
                  <th className="text-right py-2 font-medium text-gray-500">料金（/時間）</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {activeRules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-gray-50">
                    <td className="py-2.5 pr-4">{rule.name}</td>
                    <td className="py-2.5 pr-4">{DAY_TYPE_LABEL[rule.day_type]}</td>
                    <td className="py-2.5 pr-4">
                      {/* HH:MM:SS → HH:MM に切り詰める */}
                      {rule.start_time.slice(0, 5)} 〜 {rule.end_time.slice(0, 5)}
                    </td>
                    <td className="py-2.5 text-right font-semibold">
                      ¥{rule.price_per_hour.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 予約カレンダー（CSR）: 'use client' のクライアントコンポーネント */}
      {/* 予約データはブラウザ側でAPIを叩いて取得する */}
      <section className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-bold mb-4">空き状況・予約</h2>
        {settings ? (
          <Calendar settings={settings} />
        ) : (
          <p className="text-gray-400 text-sm">
            カレンダーを読み込めませんでした。時間をおいて再度お試しください。
          </p>
        )}
      </section>
    </main>
  )
}
