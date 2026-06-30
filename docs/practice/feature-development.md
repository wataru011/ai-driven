---
title: 機能開発のエンドツーエンド
description: 既存REST APIに「商品レビュー投稿」機能を追加する作業を、要件整理から設計の壁打ち、タスク分解、テスト先行、実装、レビュー、修正、完了まで、実際のプロンプト文面と擬似的な生成結果で通しで再現します。
---

# 機能開発のエンドツーエンド

このページは「読んで終わり」のガイドではありません。**1つの機能を最初から最後までAIと一緒に作り切る**様子を、実際のプロンプトと擬似的な応答で追体験できるように構成しています。抽象的な原則([プロンプトの基礎](/prompting/fundamentals)や[実装フェーズ](/workflow/implementation))を、現場の手触りに落とし込むのが狙いです。

題材は **「既存のREST APIに『商品レビュー投稿』機能を追加する」** です。実在しそうな小さなEC系バックエンドを想定し、ありがちな落とし穴も込みで進めます。

::: tip このページの読み方
プロンプトはすべて全文を掲載します。応答イメージは「こういう粒度・形で返ってくる」という見本であり、実際のモデル出力はそのつど変わります。**プロンプトの設計意図**と**返ってきたものをどう判断したか**に注目してください。
:::

## 題材の前提

作業対象は、TypeScript + Express + Prisma(PostgreSQL)で書かれた既存APIです。すでに以下が存在します。

| 既存リソース | 説明 |
| --- | --- |
| `Product` | 商品。`id`, `name`, `price` を持つ |
| `User` | 認証済みユーザー。JWTミドルウェアで `req.user` に載る |
| `prisma/schema.prisma` | Prismaスキーマ |
| `src/routes/products.ts` | 商品のCRUDルート(スタイルの見本になる) |

ゴールは「ログイン済みユーザーが、購入済み商品に1〜5の星評価とコメントを投稿でき、商品ごとにレビュー一覧と平均評価を取得できる」ことです。

## 全体の流れ

AIと進める機能開発は、おおむね次の7段階に分けると破綻しにくくなります。各段階で「AIに任せる部分」と「人間が判断する部分」が違います。

1. 要件整理(人間が主、AIは抜け漏れの指摘)
2. 設計の壁打ち(AIと対話、人間が決定)
3. タスク分解(AIが叩き台、人間が承認)
4. テスト先行(AIが生成、人間がレビュー)
5. 実装(AIが差分、人間がレビュー)
6. レビューと修正(反復)
7. 完了(統合・記録)

::: warning 最初に大きく投げない
「商品レビュー機能を全部作って」と一発で投げるのは最も失敗しやすいパターンです。モデルは何かを生成しますが、スキーマ・認可・バリデーションの判断を**勝手に**埋めてしまい、後から手戻りが膨らみます。段階を踏むほうが結局速い、というのが実務の感覚です。
:::

## 段階1: 要件整理

最初のプロンプトの目的は「実装」ではなく、**仕様の曖昧さを洗い出す**ことです。AIを"優秀だが意地悪なレビュアー"として使います。

```text
あなたはAPI設計のレビューに厳しいバックエンドエンジニアです。
これから機能の要件メモを渡します。実装はまだしないでください。

## 機能
EC APIに「商品レビュー投稿」を追加したい。
- ログイン済みユーザーが商品に星評価(1〜5)とコメントを投稿できる
- 商品ごとにレビュー一覧と平均評価を取得できる

## あなたへの依頼
この要件で実装に入ると詰まりそうな「決まっていない点」を、
重要度順に箇条書きで列挙してください。各項目に「なぜ問題か」を一言添えて。
質問は最大10個まで。提案ではなく、論点の抽出に徹してください。
```

返ってくる応答イメージはこうです。

```text
決めておくべき論点(重要度順):

1. [認可] 誰でも投稿できるのか、購入済みユーザーのみか
   → 「購入済みのみ」ならOrder履歴との突き合わせが必要で設計が変わる
2. [重複] 同一ユーザーが同一商品に複数レビューを投稿できるか
   → 不可なら (userId, productId) にユニーク制約が要る
3. [編集/削除] 投稿後の編集・削除を許すか
   → 許すなら updatedAt や論理削除の検討が必要
4. [コメント] コメントは必須か任意か、最大文字数は
   → バリデーションとDBカラム長に影響
5. [平均評価] 都度集計か、非正規化してProductに保持するか
   → 読み取り頻度が高いなら非正規化を検討、整合性管理が増える
6. [ページネーション] レビュー一覧の件数上限・並び順
   → 人気商品で数万件になるとレスポンスが肥大化
7. [モデレーション] 不適切コメントの扱い、公開/非公開フラグは
   → 後付けは高コスト。最低限のフラグだけ用意するか判断を
8. [集計の同時実行] 平均更新時の競合をどう防ぐか
```

ここで人間が判断します。今回はスコープを絞り、こう決めました。

- 認可: **購入済みユーザーのみ**(`Order`履歴を確認)
- 重複: **不可**(`(userId, productId)` にユニーク制約)
- 編集/削除: **今回は対象外**(YAGNI、後続タスク)
- コメント: **任意、最大1000文字**
- 平均評価: **都度集計**(まずは単純に。非正規化は計測してから)
- ページネーション: カーソルベース、デフォルト20件

::: tip 判断ポイント
AIが出した論点をすべて実装する必要はありません。**何を今やらないか(スコープアウト)を明示的に決める**のが、この段階の最大の価値です。決めた内容は次以降のプロンプトに必ず持ち込みます。
:::

## 段階2: 設計の壁打ち

要件が固まったら、設計案を出させて比較します。ここでも「1案を断定」させず、**トレードオフ付きで複数案**を出させるのがコツです。

```text
あなたはPrisma + PostgreSQLに詳しい設計者です。決めた要件は以下です。

- 購入済みユーザーのみ投稿可(Order履歴で判定)
- (userId, productId) でユニーク(1人1商品1レビュー)
- rating: 1〜5の整数、comment: 任意・最大1000文字
- 平均評価は都度集計(非正規化しない)
- 一覧はカーソルベースのページネーション

## 依頼
1. Reviewモデルのスキーマ案を Prisma schema で示す
2. 平均評価の取得方法を2案(都度 aggregate / 集計ビュー)で比較し、
   今回の方針(都度集計)で問題ないか、想定件数の目安込みで意見を
3. 「購入済み判定」をどこで行うべきか(ミドルウェア/サービス層)を提案

コードは最小限。設計の意図を重視してください。
```

応答イメージ(抜粋):

```prisma
model Review {
  id        String   @id @default(cuid())
  rating    Int      // 1..5（アプリ層で検証）
  comment   String?  @db.VarChar(1000)
  userId    String
  productId String
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id])
  product   Product  @relation(fields: [productId], references: [id])

  @@unique([userId, productId])   // 1人1商品1レビュー
  @@index([productId, createdAt]) // 一覧のカーソル用
}
```

```text
平均評価の取得:
- 案A 都度 aggregate(_avg): 実装が単純。商品あたり数百〜数千件なら
  インデックスが効き十分高速。今回の方針として妥当。
- 案B 集計ビュー/非正規化カラム: 数万件超や高頻度参照で有利だが、
  書き込み時の整合性管理が増える。現時点では過剰。
→ 案Aで開始し、p95レイテンシを計測してから案Bを検討するのが堅実。

購入済み判定:
- ミドルウェアではなくサービス層を推奨。
  理由: 「この商品を買ったか」は productId に依存する業務ルールで、
  汎用ミドルウェアに置くとルートごとに引数の受け渡しが煩雑になる。
```

人間はこれを承認しつつ、1点だけ補強します。`rating` をDBのCHECK制約でも守りたいので、Prismaのraw migrationでCHECKを足す方針をメモしておきます(アプリ層だけの検証は信用しない)。

::: warning 設計を鵜呑みにしない観点
- `comment` の `VarChar(1000)` はDBで効くが、**アプリ層のバリデーション**も別途必要(マルチバイトや前後空白)。
- 「都度集計で十分」という主張の**前提(件数規模)**が自分のサービスに当てはまるかを確認する。AIは一般論を述べているだけ。
:::

## 段階3: タスク分解

設計が決まったら、レビュー可能な粒度のタスクに割ります。**1タスク=1つのまとまったPRやコミット**になるくらいが目安です。

```text
決まった設計をもとに、実装タスクを分解してください。
各タスクは独立してレビュー・テスト可能な粒度にし、依存順に並べる。
各タスクに「完了条件(Doneの定義)」を1行で付けてください。
```

応答イメージ:

```text
T1. Reviewモデル追加 + マイグレーション
    Done: schema反映、rating CHECK制約付き、migrate成功
T2. レビュー投稿サービス(購入済み判定・重複拒否・バリデーション)
    Done: 正常系/購入なし/重複/不正ratingのテストが通る
T3. POST /products/:id/reviews ルート(認証必須)
    Done: 201で作成、401/403/409/422を適切に返す
T4. GET /products/:id/reviews(カーソルページネーション + 平均)
    Done: items/nextCursor/average を返す、空商品で average=null
T5. 統合テストとエッジケースの仕上げ
    Done: 主要シナリオがe2eで緑
```

この分解を承認し、**T2(サービス層)から着手**します。ルートよりサービスを先に作るのは、業務ロジックの正しさをルートの都合と切り離してテストできるからです。

## 段階4: テスト先行

実装より先にテストを書かせます。これは[テストとレビュー](/workflow/testing-review)で述べる「検証可能性を先に固める」原則の実践です。仕様をテストの形で明文化すると、後続の実装プロンプトの**受け入れ条件**になります。

```text
あなたはTypeScriptのテストに精通したエンジニアです。
テストフレームワークは vitest、DBはテスト用に prisma のトランザクション
ロールバックを使う既存ヘルパー withTestDb() があります(下記参照)。

## 対象: createReview サービス(まだ実装していない)
シグネチャ(これから実装する想定):
  createReview(input: {
    userId: string; productId: string; rating: number; comment?: string
  }): Promise<Review>

## 仕様
- 購入履歴(Order)がない場合: NotPurchasedError を投げる
- 同一 (userId, productId) が既存: DuplicateReviewError を投げる
- rating が 1..5 の整数でない: ValidationError を投げる
- comment が1000文字超: ValidationError を投げる
- 正常時: Review を作成して返す

## 依頼
上記5ケースを網羅する vitest のテストを書いてください。
テストデータの準備は下記 withTestDb のスタイルに合わせること。
実装は書かないでください。

（ここに withTestDb の使用例を1つ貼る）
```

応答イメージ(抜粋):

```ts
import { describe, it, expect } from 'vitest'
import { withTestDb } from '../test/withTestDb'
import { createReview } from '../src/services/reviews'
import { NotPurchasedError, DuplicateReviewError, ValidationError } from '../src/errors'

describe('createReview', () => {
  it('購入済みユーザーはレビューを作成できる', withTestDb(async (db) => {
    const { user, product } = await seedPurchased(db)
    const review = await createReview({ userId: user.id, productId: product.id, rating: 5, comment: '良い' })
    expect(review.rating).toBe(5)
  }))

  it('未購入なら NotPurchasedError', withTestDb(async (db) => {
    const { user, product } = await seedUnpurchased(db)
    await expect(createReview({ userId: user.id, productId: product.id, rating: 4 }))
      .rejects.toBeInstanceOf(NotPurchasedError)
  }))

  it('重複投稿は DuplicateReviewError', withTestDb(async (db) => {
    const { user, product } = await seedPurchased(db)
    await createReview({ userId: user.id, productId: product.id, rating: 4 })
    await expect(createReview({ userId: user.id, productId: product.id, rating: 3 }))
      .rejects.toBeInstanceOf(DuplicateReviewError)
  }))

  it.each([0, 6, 3.5, NaN])('rating=%s は ValidationError', (rating) =>
    withTestDb(async (db) => {
      const { user, product } = await seedPurchased(db)
      await expect(createReview({ userId: user.id, productId: product.id, rating }))
        .rejects.toBeInstanceOf(ValidationError)
    })())

  it('comment 1001文字は ValidationError', withTestDb(async (db) => {
    const { user, product } = await seedPurchased(db)
    await expect(createReview({ userId: user.id, productId: product.id, rating: 4, comment: 'あ'.repeat(1001) }))
      .rejects.toBeInstanceOf(ValidationError)
  }))
})
```

ここで人間が**テストをレビュー**します。これは実装と同じくらい重要です。

::: tip 生成テストのレビュー観点
- `rating: 3.5` や `NaN` を入れているか(整数チェックの抜けは頻出バグ)。
- 「正常時に**ちゃんと作成される**」ことだけでなく「**作成されない**ことの確認」(重複・未購入)が両方あるか。
- アサーションが緩すぎないか(`expect(review).toBeDefined()` だけ、のような無意味な検証になっていないか)。詳しくは[テスト生成の実践](/practice/test-generation)。
:::

今回は1点足します。「`comment` を省略(undefined)した正常系」が抜けていたので、追加を指示します。テストが先にあるので、この指摘は具体的にできます。

## 段階5: 実装

テストという受け入れ条件が揃ったので、実装させます。**テストを満たすこと**を明示的な成功条件にします。

```text
先ほどのテスト(reviews.test.ts)をすべてパスする createReview を実装してください。

## 制約
- ファイルは src/services/reviews.ts
- DBアクセスは既存の prisma クライアント(src/db.ts の `prisma`)を使う
- エラーは src/errors.ts の NotPurchasedError / DuplicateReviewError /
  ValidationError を使う(新規エラークラスは作らない)
- 購入判定: Order に (userId, productId) の行があれば購入済みとみなす
- 既存の products.ts のコードスタイル(下記)に合わせる

## 出力
unified diff 形式で。新規ファイルも diff で。

（ここに products.ts を貼る）
```

応答イメージ(差分):

```diff
--- /dev/null
+++ b/src/services/reviews.ts
@@
+import { prisma } from '../db'
+import { NotPurchasedError, DuplicateReviewError, ValidationError } from '../errors'
+
+export interface CreateReviewInput {
+  userId: string
+  productId: string
+  rating: number
+  comment?: string
+}
+
+export async function createReview(input: CreateReviewInput) {
+  const { userId, productId, rating, comment } = input
+
+  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
+    throw new ValidationError('rating must be an integer between 1 and 5')
+  }
+  if (comment !== undefined && comment.length > 1000) {
+    throw new ValidationError('comment must be 1000 characters or fewer')
+  }
+
+  const purchased = await prisma.order.findFirst({ where: { userId, productId } })
+  if (!purchased) throw new NotPurchasedError(productId)
+
+  try {
+    return await prisma.review.create({
+      data: { userId, productId, rating, comment: comment ?? null },
+    })
+  } catch (e: any) {
+    if (e?.code === 'P2002') throw new DuplicateReviewError(userId, productId)
+    throw e
+  }
+}
```

テストを実行します。

```bash
npx vitest run reviews.test.ts
```

このコードには**意図的に1つ問題**を残してあります。「重複チェックをユニーク制約(P2002)に任せている」のは正しい(競合に強い)のですが、`comment` の前後空白トリムやマルチバイト長の扱いがテスト仕様と微妙にズレる余地があります。さらに、より本質的な並行性の穴があります。

## 段階6: レビューと修正(反復)

差分を人間がレビューします。AIに自己レビューさせるのも有効ですが、**最終判断は人間**です。今回見つかった指摘:

::: warning レビューでの指摘
1. **TOCTOU(競合)**: `findFirst`(購入確認)→ `create` の間に状態が変わる可能性。今回は購入が消えるシナリオは現実的に薄いので許容するが、コメントで明記すべき。
2. **エラー握りつぶし**: `e?.code === 'P2002'` 以外の例外をそのまま再throwしているのは正しい。ただし `e: any` は型を緩めている。`Prisma.PrismaClientKnownRequestError` で絞るべき。
3. **rating の DB CHECK 制約が未適用**: 段階2でメモした「DB側でもrating を守る」が漏れている。マイグレーションに追加が必要。
:::

指摘2と3を直すよう、**具体的な差分**で依頼します。

```text
レビューで2点指摘がありました。修正を unified diff で。

1. catch の `e: any` をやめ、Prisma.PrismaClientKnownRequestError で
   型ガードしてから code を見る形に。
2. rating の 1..5 を DB の CHECK 制約でも保証したい。
   Prisma の migration に raw SQL で
   `ALTER TABLE "Review" ADD CONSTRAINT review_rating_check
    CHECK (rating BETWEEN 1 AND 5)` を足す手順を示す。

他の挙動は変えないこと。テストは引き続き全てパスすること。
```

応答イメージ:

```diff
--- a/src/services/reviews.ts
+++ b/src/services/reviews.ts
@@
-import { prisma } from '../db'
+import { prisma } from '../db'
+import { Prisma } from '@prisma/client'
@@
-  } catch (e: any) {
-    if (e?.code === 'P2002') throw new DuplicateReviewError(userId, productId)
-    throw e
+  } catch (e) {
+    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
+      throw new DuplicateReviewError(userId, productId)
+    }
+    throw e
   }
```

CHECK制約はマイグレーションファイルに手を入れて反映し、再度テストを実行して緑を確認します。この「指摘 → 限定的な差分 → 再テスト」のループを、納得いくまで回すのが反復の本体です。

::: tip 反復を速くするコツ
1回のプロンプトで**1〜2件の指摘に絞る**と、差分が小さくレビューしやすく、回帰も追いやすくなります。「全部直して」は差分が膨れて結局時間がかかります。
:::

## 段階7: ルート・一覧・完了

サービスが固まったら、T3(POSTルート)とT4(GET一覧+平均)を同じリズムで進めます。一覧の平均評価はこんな形になります。

```ts
const [items, agg] = await Promise.all([
  prisma.review.findMany({
    where: { productId },
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  }),
  prisma.review.aggregate({ where: { productId }, _avg: { rating: true } }),
])
const average = agg._avg.rating ?? null   // レビュー0件なら null
```

最後に統合テストで主要シナリオ(投稿→一覧に出る→平均が更新される→重複は409)を通し、**設計判断の記録**を残します。「なぜ都度集計にしたか」「購入判定をサービス層に置いた理由」は、後から[ADR](/practice/documentation)として書き起こすと将来の自分を助けます。

## アンチパターン集

機能開発でAIを使うときに繰り返し見かける失敗をまとめます。

| アンチパターン | 何が起きるか | 対処 |
| --- | --- | --- |
| 一発で全部生成 | スキーマ・認可を勝手に決められ手戻り | 段階分割、まず論点抽出 |
| テストを後回し | 受け入れ条件が曖昧で実装が漂流 | テスト先行で仕様を固定 |
| 巨大な差分を一括レビュー | 見落とし・回帰の温床 | 1タスク=1まとまりに割る |
| 「いい感じに直して」 | 関係ない箇所まで書き換わる | 指摘を1〜2件に絞り差分指定 |
| 設計の前提を確認しない | 「都度集計で十分」を鵜呑み | 前提が自分のデータに合うか検証 |
| 生成テストを無検証で信頼 | 緩いアサーションで安心してしまう | テスト自体をレビュー |

::: warning 責任の所在は移らない
AIがコードを書いても、マージボタンを押すのは人間です。生成物の正しさ・セキュリティ・保守性の責任は[コード品質](/quality/code-quality)で述べる通り開発者側に残ります。「AIが書いたから」は説明になりません。
:::

## まとめ

- 機能開発は**段階分割**が要。最初に全部投げない。
- 各段階でAIの役割が違う: 論点抽出 → 設計の壁打ち → 分解 → テスト生成 → 実装 → 修正。
- **テストを先に固める**と、実装プロンプトに明確な受け入れ条件を与えられる。
- レビューは**1〜2件に絞り、限定的な差分**で反復する。
- スコープアウト(今やらないこと)を明示するのが、要件整理の最大の価値。

<div style="margin-top: 32px; padding: 16px 20px; border-radius: 12px; background: var(--vp-c-bg-soft);">

**次に読む** → [テスト生成の実践](/practice/test-generation) — このページで「先に書いた」テストを、エッジケースやプロパティベースまで深掘りします。あわせて[実装フェーズ](/workflow/implementation)と[テストとレビュー](/workflow/testing-review)も。

</div>
