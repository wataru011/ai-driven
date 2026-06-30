---
title: テスト生成の実践
description: 既存関数を題材に、ユニットテスト・エッジケース・プロパティベーステストをAIに生成させる実プロンプトと結果、カバレッジの罠、生成テストのレビュー観点、ゴールデンテストの作り方を、追体験できる粒度で解説します。
---

# テスト生成の実践

テスト生成は、AI駆動開発でもっとも費用対効果が高い領域の1つです。理由は単純で、**生成物の正しさを既存コードという「答え」と照合できる**からです。実装の生成は「正しいか分からないコードが増える」リスクを伴いますが、テスト生成は「既存の挙動を固定する網」を素早く張れます。

ただし落とし穴も多い。**緩いテストは、ないテストより危険**です(緑なのにバグを通す)。このページでは、ただ量を生成するのではなく、**信頼できるテストを生成しレビューする**ところまでを実演します。

::: tip 前提
題材は1つの純粋関数に絞ります。小さな関数で「生成 → レビュー → 補強」のループを体に入れると、大きなコードにも応用できます。[機能開発のエンドツーエンド](/practice/feature-development)ではテスト先行を扱いましたが、ここでは**既存コードに後付けでテストを張る**ケースを扱います。
:::

## 題材の関数

割引価格を計算する純粋関数を題材にします。よくある「一見単純だが地味に分岐が多い」関数です。

```ts
// src/pricing.ts
export interface DiscountRule {
  kind: 'percent' | 'fixed'
  value: number      // percent: 0..100, fixed: 円
  minSubtotal?: number  // この金額以上で適用
}

/** 小計に割引を適用し、最終金額(円・整数)を返す */
export function applyDiscount(subtotal: number, rule: DiscountRule): number {
  if (rule.minSubtotal && subtotal < rule.minSubtotal) return subtotal
  if (rule.kind === 'percent') {
    return Math.round(subtotal * (1 - rule.value / 100))
  }
  return Math.max(0, subtotal - rule.value)
}
```

この関数には、後で見つかる**バグの種**がいくつか潜んでいます。テスト生成を通してそれをあぶり出すのが、このページの裏テーマです。

## 段階1: ユニットテストを生成させる

まず素直にユニットテストを生成させます。ポイントは「**仕様をこちらから与える**」ことです。コードだけ渡すと、AIは「現在の実装の挙動」をそのままテストに固定してしまい、**バグごと固定**してしまいます。

```text
あなたはテストに厳しいTypeScriptエンジニアです。
vitest で applyDiscount のユニットテストを書いてください。

## 関数の仕様(実装ではなく、こうあるべきという仕様)
- percent: 小計に (1 - value/100) を掛け、四捨五入した整数円
- fixed: 小計から value 円を引く。0未満にはしない(下限0)
- minSubtotal が指定され、小計がそれ未満なら割引せず小計をそのまま返す
- 戻り値は常に整数円

## 依頼
- 正常系(percent / fixed / minSubtotal境界)を網羅
- 各テストは「何を保証しているか」がわかる説明文に
- まだエッジケースは網羅しなくてよい(次のステップで扱う)
（src/pricing.ts を貼る）
```

応答イメージ:

```ts
import { describe, it, expect } from 'vitest'
import { applyDiscount } from '../src/pricing'

describe('applyDiscount', () => {
  it('percent: 10%引きを四捨五入して返す', () => {
    expect(applyDiscount(1000, { kind: 'percent', value: 10 })).toBe(900)
  })
  it('percent: 端数は四捨五入される', () => {
    expect(applyDiscount(999, { kind: 'percent', value: 10 })).toBe(899) // 899.1 -> 899
  })
  it('fixed: 固定額を引く', () => {
    expect(applyDiscount(1000, { kind: 'fixed', value: 300 })).toBe(700)
  })
  it('fixed: 引きすぎても0未満にならない', () => {
    expect(applyDiscount(200, { kind: 'fixed', value: 500 })).toBe(0)
  })
  it('minSubtotal未満なら割引しない', () => {
    expect(applyDiscount(900, { kind: 'percent', value: 10, minSubtotal: 1000 })).toBe(900)
  })
  it('minSubtotal以上なら割引する', () => {
    expect(applyDiscount(1000, { kind: 'percent', value: 10, minSubtotal: 1000 })).toBe(900)
  })
})
```

ここまでは妥当です。ただし**仕様の境界がまだ甘い**。次でエッジケースを攻めます。

## 段階2: エッジケースを攻めさせる

エッジケースの洗い出しはAIの得意分野です。**「意地悪な入力を考えて」**と明示的に役割を与えます。

```text
applyDiscount に対して、バグを引き起こしそうな「意地悪な入力」を
できるだけ多く列挙してください。まだテストコードは書かず、
「入力 / なぜ危ういか / 期待する挙動(仕様上)」の表で出してください。
仕様が曖昧で決められないものは「要仕様確認」と明記して。
```

応答イメージ:

| 入力 | なぜ危ういか | 期待挙動 |
| --- | --- | --- |
| `value: 0`(percent) | 0%引き=変化なしのはず | 小計そのまま |
| `value: 100`(percent) | 全額引き | 0 |
| `value: 150`(percent) | 100超。仕様外 | **要仕様確認**(クランプ?エラー?) |
| `value: -10`(percent) | 負の割引=値上げ | **要仕様確認** |
| `subtotal: 0` | 空カート | 0 |
| `subtotal: -100` | 負の小計 | **要仕様確認** |
| `minSubtotal: 0` | falsy! `if (rule.minSubtotal)` を通らない | minSubtotal=0は「常に適用」のはずが…? |
| 端数 `subtotal: 1` `value: 50` | 0.5 の四捨五入方向 | Math.round は 0.5→1(偶数丸めでない) |
| `value: 33.3`(percent) | 小数割引率 | 四捨五入後の整数 |

::: warning ここで重大バグが見つかる
`minSubtotal: 0` の行に注目してください。実装は `if (rule.minSubtotal && ...)` と書かれており、**`0` は falsy なので条件全体がスキップ**されます。仕様上 `minSubtotal: 0` は「0円以上、つまり常に適用」を意味するはずですが、たまたま挙動が一致しているだけで、`if (rule.minSubtotal !== undefined && ...)` と書くべき意図のズレです。さらに `value: 150` や負値のガードが**実装に存在しない**ことも露呈しました。
:::

この表を見て、人間が仕様を確定させます。

- `percent` の `value` は `0..100` に**バリデーション**(範囲外はエラー)
- `subtotal` は非負を前提(呼び出し側の責任とし、ここでは検証しない/別途assert)
- `minSubtotal: 0` は「常に適用」として扱う

仕様が決まったら、エッジケースをテストに落とします。ただし**今の実装はこの仕様を満たさない**ので、テストは赤になります。それでよいのです。テストが先に仕様を表明し、実装を後で直します。

```text
確定した仕様:
- percent の value が 0..100 の範囲外なら RangeError を投げる
- minSubtotal は 0 を含めて「指定値未満なら割引しない」(undefined は無制限)
これを保証する vitest テストを追加してください。実装の修正は別途行います。
```

```ts
it('percent: value>100 は RangeError', () => {
  expect(() => applyDiscount(1000, { kind: 'percent', value: 150 })).toThrow(RangeError)
})
it('percent: value<0 は RangeError', () => {
  expect(() => applyDiscount(1000, { kind: 'percent', value: -1 })).toThrow(RangeError)
})
it('minSubtotal:0 は常に割引適用される', () => {
  expect(applyDiscount(500, { kind: 'fixed', value: 100, minSubtotal: 0 })).toBe(400)
})
```

赤を確認したら実装を直し、緑に戻します。**テストが仕様の番人になっている**状態です。

## 段階3: プロパティベーステスト

例示テストは「自分が思いつく入力」しかカバーできません。**プロパティ(性質)ベーステスト**は、ライブラリ(TypeScriptなら `fast-check`)が大量のランダム入力を生成し、**常に成り立つべき不変条件**を検証します。AIはこの「不変条件の言語化」を手伝うのが得意です。

```text
applyDiscount について、入力によらず常に成り立つべき性質
(プロパティ)を挙げ、fast-check + vitest で検証するテストを書いてください。
前提: subtotal は 0 以上の整数、percent value は 0..100、fixed value は 0 以上。
ジェネレータはこの前提に沿って制約してください。
```

応答イメージ:

```ts
import { describe, it } from 'vitest'
import fc from 'fast-check'
import { applyDiscount } from '../src/pricing'

describe('applyDiscount properties', () => {
  it('結果は常に 0 以上', () => {
    fc.assert(fc.property(
      fc.nat({ max: 1_000_000 }),
      fc.nat({ max: 100 }),
      (subtotal, pct) => applyDiscount(subtotal, { kind: 'percent', value: pct }) >= 0
    ))
  })

  it('結果は常に小計以下(値上げしない)', () => {
    fc.assert(fc.property(
      fc.nat({ max: 1_000_000 }),
      fc.nat({ max: 100 }),
      (subtotal, pct) => applyDiscount(subtotal, { kind: 'percent', value: pct }) <= subtotal
    ))
  })

  it('結果は常に整数', () => {
    fc.assert(fc.property(
      fc.nat({ max: 1_000_000 }),
      fc.nat({ max: 100 }),
      (subtotal, pct) => Number.isInteger(applyDiscount(subtotal, { kind: 'percent', value: pct }))
    ))
  })

  it('割引0%なら小計と一致', () => {
    fc.assert(fc.property(
      fc.nat({ max: 1_000_000 }),
      (subtotal) => applyDiscount(subtotal, { kind: 'percent', value: 0 }) === subtotal
    ))
  })
})
```

::: tip プロパティの見つけ方
「具体的な期待値」ではなく「**入力と出力の関係**」で考えるとプロパティが見えます。代表的な型:
- **不変量**: 出力は常に0以上 / 小計以下
- **冪等性**: 同じ割引を2回適用した結果の関係
- **境界**: 0%なら不変、100%なら0
- **逆関数/往復**: シリアライズ→デシリアライズで元に戻る(別の題材で有効)

プロパティベースは「自分が思いつかなかった反例」を見つけるのが真価です。実際このテストを回すと、`fc` が `subtotal=1, pct=50` のような端数で `Math.round` の丸め方向を突いてくることがあります。
:::

## カバレッジの罠

「カバレッジ100%だから安心」は最も危険な思い込みです。AIに「カバレッジを上げて」とだけ頼むと、**行を通すだけで何も検証しないテスト**を生成しがちです。

```ts
// ❌ カバレッジは上がるが無意味なテスト
it('動く', () => {
  const r = applyDiscount(1000, { kind: 'fixed', value: 100 })
  expect(r).toBeDefined()   // 何も保証していない
})
```

::: warning カバレッジが測れないもの
カバレッジは「コードが**実行された**こと」を測るだけで、「**正しく検証された**こと」は測りません。
- アサーションが弱い(`toBeDefined`、`not.toThrow` だけ)
- 分岐の**両方の結果**を確認していない(if を通すが else 側の値を見ない)
- 副作用(DB書き込み、ログ)を検証していない

カバレッジは「テストされていない箇所」を見つける道具としては有用ですが、**品質の証明にはならない**と心得てください。
:::

カバレッジを使うなら、こう頼みます。

```text
カバレッジレポートで未到達の分岐を教えます(下記)。
その分岐に「到達するだけ」でなく「その分岐固有の正しい挙動」を
検証するテストを追加してください。toBeDefined のような
無意味なアサーションは禁止。各テストに保証内容をコメントで。
```

## 生成テストのレビュー観点

生成されたテストは、実装と同じ厳しさでレビューします。チェックリスト:

| 観点 | 確認すること |
| --- | --- |
| アサーションの強さ | `toBeDefined`/`not.toThrow` だけで終わっていないか |
| 仕様か実装か | 「現在の挙動」ではなく「あるべき仕様」を検証しているか |
| 分岐の両側 | true/false、成功/失敗の**両方**を確認しているか |
| 境界値 | 0、最大、空、null/undefined、オフバイワン |
| 独立性 | テスト間で状態を共有していないか(順序依存) |
| 偽の安心 | 実装を壊してもテストが緑のままにならないか(後述) |
| 名前 | テスト名が保証内容を説明しているか |

::: tip ミューテーションで「テストが本当に効くか」を試す
最強のレビュー手法は、**実装をわざと壊してテストが赤くなるか**を確認することです。例えば `Math.round` を `Math.floor` に変える、`Math.max(0, ...)` の `0` を消す。これでテストが緑のままなら、そのテストは**そのバグを検出できない**=価値が低い。手動でも有効ですが、ミューテーションテスト(Stryker等)で自動化もできます。AIに「この関数に入れられそうな一文字バグを3つ挙げて、各々を検出するテストがあるか確認して」と頼むのも有効です。
:::

## ゴールデンテスト(スナップショット)

入出力が複雑で「期待値を手で書くのが大変」な対象(整形済み出力、HTML、複雑なJSON)には、**ゴールデンテスト**が有効です。一度「正しい」と確認した出力をファイルに固定し、以降の変更で差分が出たらレビューします。

```ts
it('レシート整形のゴールデン', () => {
  const out = renderReceipt(sampleOrder)
  expect(out).toMatchSnapshot()  // 初回は __snapshots__ に保存
})
```

::: warning ゴールデンテストの落とし穴
- **初回の承認が雑だと、間違った出力を「正解」として固定**してしまう。スナップショット作成時こそ目視レビューが必須。
- 差分が出たとき**機械的に `--update` で上書き**する習慣がつくと、テストが形骸化する。差分は必ず読む。
- AIに「このスナップショットの差分は意図した変更か、退行か」をレビューさせると、目視を補助できる(ただし最終判断は人間)。
:::

AIにゴールデン入力を作らせるプロンプト例:

```text
renderReceipt のゴールデンテスト用に、代表的かつ網羅的な入力サンプルを
5パターン作ってください(通常/割引あり/送料無料/複数明細/空に近い)。
各サンプルが「何を代表しているか」をコメントで。出力は固定せず、
入力データ(fixtures)だけ生成してください。
```

## このページのまとめ

- テスト生成は照合先(既存挙動)があるため費用対効果が高いが、**緩いテストは害**。
- **仕様を渡す**こと。コードだけ渡すと「バグごと固定」する。
- エッジケースの列挙、プロパティの言語化はAIが得意。実際にバグ(`minSubtotal:0` の falsy 問題)を発見できる。
- **カバレッジは品質の証明ではない**。アサーションの強さを別途レビュー。
- **ミューテーション**(わざと壊す)で、テストが本当に効くか確かめる。
- ゴールデンテストは**初回承認の質**がすべて。

<div style="margin-top: 32px; padding: 16px 20px; border-radius: 12px; background: var(--vp-c-bg-soft);">

**次に読む** → [デバッグ支援の実践](/practice/debugging) — テストが見つけたバグを、AIと一緒に原因まで掘り下げます。テストの位置づけは[テストとレビュー](/workflow/testing-review)、生成物の正しさ全般は[コード品質](/quality/code-quality)も参照。

</div>
