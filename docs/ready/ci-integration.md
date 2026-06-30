---
title: CI/CD連携(実YAML)
description: CIにAIを組み込むコピペ可能なGitHub Actions構成例。PR差分にAIレビューコメントを付けるワークフロー、PR要約の自動生成、コミット/PRテンプレ検証を、全文YAMLと汎用スクリプト(curl/Node)で示します。コスト・レート制限・機密差分の扱い・誤検知をブロッキングにしない運用、シークレット設定手順まで。
---

# CI/CD連携(実YAML)

このページは **コピペしてそのまま動かし始められる** CI/CD連携の構成集です。AIをCIに組み込む定番パターン——PR差分へのAIレビューコメント、PR要約の自動生成、コミット/PRテンプレの検証——を、全文YAMLと汎用スクリプトで示します。

例はすべて **GitHub Actions** をベースにしますが、トリガと「APIキーをシークレットで渡す」という勘所は GitLab CI / CircleCI / Jenkins でも同じです。お使いの環境に合わせて読み替えてください。

::: tip このページの位置づけ
レビューbotの **設計思想**(プロンプト・誤検知抑制・人間レビューとの併用)は [AIコードレビューbotの構築](/practice/code-review-bot) に詳しくあります。ここはその **配管(CIへの組み込み方)** に特化した実装ページです。あわせて読むと理解が深まります。
:::

::: warning 最初に: 秘密情報は必ずシークレット経由
APIキーやトークンを **ワークフローやスクリプトに直書きしない**。GitHub の暗号化シークレットに保存し、環境変数として渡します。直書きはリポジトリ公開・ログ流出で即漏洩します。設定手順はこのページ末尾の[シークレット設定手順](#シークレット設定手順)を参照。
:::

## 全体像

| パターン | トリガ | 出力 | ブロッキング |
| --- | --- | --- | --- |
| AIレビューコメント | `pull_request` | PRへのコメント | しない(参考情報) |
| PR要約の自動生成 | `pull_request`(opened) | PR本文 / コメント | しない |
| コミット/PRテンプレ検証 | `pull_request` | チェック結果 | する場合あり(規約は機械的判定) |

::: info 公式アクション vs 自前スクリプト
AIレビューやPR要約には、各社・コミュニティ製の **公開アクション** が存在します(Marketplace で「AI review」「PR summary」等で検索すると見つかります)。手早く始めたいなら既製アクションが便利です。ただし **第三者アクションはあなたのシークレットとコードに触れる** ため、出所・権限・ピン留め(コミットSHA固定)を必ず確認してください。本ページでは、依存とコストを自分で完全にコントロールできる **自前スクリプト版** を主役にします。実在を断定できないアクション名は挙げません——導入時は公式ドキュメントで最新を確認してください。
:::

## パターン1: PR差分にAIレビューコメントを付ける

最小構成のワークフロー全文です。トリガは `pull_request`、差分を取得して自前スクリプトでAPIへ送り、結果をPRにコメントします。

```yaml
# .github/workflows/ai-review.yml
name: AI Code Review

on:
  pull_request:
    types: [opened, synchronize, reopened]

# 最小権限: コード読み取りとPRコメント投稿のみ
permissions:
  contents: read
  pull-requests: write

# 同一PRへの新規pushで古い実行をキャンセル(コスト削減)
concurrency:
  group: ai-review-${{ github.event.pull_request.number }}
  cancel-in-progress: true

jobs:
  review:
    runs-on: ubuntu-latest
    # 外部fork由来のPRにはsecretsを渡さない(セキュリティの章を参照)
    if: github.event.pull_request.head.repo.full_name == github.repository
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0   # base...head の差分を取るため全履歴

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Get PR diff
        env:
          BASE_SHA: ${{ github.event.pull_request.base.sha }}
          HEAD_SHA: ${{ github.event.pull_request.head.sha }}
        run: |
          git diff "$BASE_SHA" "$HEAD_SHA" > pr.diff
          echo "diff size: $(wc -c < pr.diff) bytes"

      - name: Run AI review
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          PR_NUMBER: ${{ github.event.pull_request.number }}
          REPO: ${{ github.repository }}
        run: node scripts/ai-review.mjs
```

::: warning GitHub Actions の式は必ずフェンス内に
GitHub Actions のシークレット参照や式(波括弧2つで囲むテンプレート式)は **必ずコードブロック(フェンス)の内側だけ** に書きます。本文やインラインコードにその記法を書くと、ドキュメントのビルドが壊れることがあります(Vueのテンプレート式と誤解釈されるため)。このページのYAML例はすべてフェンス内に収めています。
:::

### 汎用版A: curl だけでAPIを叩く

Nodeを使わず、シェルと `curl` + `jq` だけで完結させたい場合の骨子です。差分をプロンプトに埋めてAPIへ送り、応答テキストをPRコメントにします。

```yaml
# .github/workflows/ai-review-curl.yml の steps 抜粋
      - name: Call API with curl
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          # 差分をJSON文字列として安全にエンコード(jq -Rs)
          DIFF_JSON=$(jq -Rs . < pr.diff)

          # リクエストボディを組み立て
          cat > body.json <<EOF
          {
            "model": "claude-haiku-4-5",
            "max_tokens": 2000,
            "messages": [
              {
                "role": "user",
                "content": "次のPR差分をレビューし、明確な問題だけ箇条書きで指摘してください。好みの問題は出さない。差分:\n${DIFF_JSON}"
              }
            ]
          }
          EOF

          # Anthropic Messages API を呼ぶ
          # ヘッダ名やエンドポイント、anthropic-version は公式ドキュメントで最新を確認してください
          curl -sS https://api.anthropic.com/v1/messages \
            -H "x-api-key: ${ANTHROPIC_API_KEY}" \
            -H "anthropic-version: 2023-06-01" \
            -H "content-type: application/json" \
            -d @body.json > resp.json

          # 応答からテキストを抽出してファイルへ
          jq -r '.content[0].text' resp.json > review.md
```

```yaml
# 続き: 抽出したレビューをPRコメントに投稿する step
      - name: Post comment
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          gh pr comment "${{ github.event.pull_request.number }}" \
            --repo "${{ github.repository }}" \
            --body-file review.md
```

::: tip `gh` CLI は最初から入っている
GitHub ホストランナーには `gh`(GitHub CLI)がプリインストールされています。`GH_TOKEN` を渡せば `gh pr comment` でそのままコメント投稿できます。追加インストール不要です。お使いのセルフホストランナーでは別途導入が必要な場合があります。
:::

### 汎用版B: Node スクリプト(構造化レビュー)

自由文ではなく **構造化(JSON)** で受け取り、重大度でフィルタしてからインラインコメントする版の擬似コードです。設計の詳細は [コードレビューbot](/practice/code-review-bot) を参照してください。

```js
// scripts/ai-review.mjs(擬似コード・要約)
import { readFileSync } from "node:fs";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic(); // ANTHROPIC_API_KEY を環境変数から自動読み込み
const diff = readFileSync("pr.diff", "utf8");

// 差分が大きすぎるときはスキップ(コストと精度のため)
const MAX_DIFF_BYTES = 60_000;
if (Buffer.byteLength(diff) > MAX_DIFF_BYTES) {
  console.log("diff too large; skipping AI review");
  process.exit(0); // ビルドは落とさない
}

const schema =
  '[{"file":string,"line":number,"severity":"blocker"|"warning"|"nit","confidence":number,"body":string}]';

const res = await client.messages.create({
  model: "claude-haiku-4-5", // 一次フィルタはコスト効率を優先
  max_tokens: 4000,
  messages: [
    {
      role: "user",
      content:
        `次のPR差分をレビューし、指摘をJSON配列で返す。前置きは出力しない。\n` +
        `明確な問題のみ。各指摘に severity と confidence(0-1)を付ける。\n` +
        `スキーマ厳守: ${schema}\n\n差分:\n${diff}`,
    },
  ],
});

// 応答テキストを安全にパース(失敗したら投稿せず終了)
let findings = [];
try {
  findings = JSON.parse(res.content[0].text);
} catch {
  console.log("could not parse model output; skipping");
  process.exit(0);
}

// 重大度×信頼度でフィルタ、件数上限
const toPost = findings
  .filter((f) => f.severity !== "nit" && f.confidence >= 0.7)
  .slice(0, 8);

// GITHUB_TOKEN / PR_NUMBER を使って GitHub REST API へ投稿
// (octokit や fetch で /repos/{owner}/{repo}/pulls/{n}/comments を呼ぶ)
await postInlineComments(toPost);
```

::: warning パッケージ名は環境に合わせて確認
上記の `@anthropic-ai/sdk` は Anthropic 公式 SDK の例です。バージョンや初期化方法は時期で変わるため、**インストール時に公式ドキュメントで最新を確認** してください。`npm ci` で依存を固定し、`package-lock.json` をコミットしておくのが安全です。
:::

## パターン2: PR要約の自動生成

PRが開かれたときに差分を要約し、PR本文の先頭に追記する例です。レビュアーが「何のPRか」を一目で掴めるようにします。

```yaml
# .github/workflows/pr-summary.yml
name: PR Summary

on:
  pull_request:
    types: [opened]   # 開いた時だけ。毎push実行はコストがかさむ

permissions:
  contents: read
  pull-requests: write

jobs:
  summarize:
    runs-on: ubuntu-latest
    if: github.event.pull_request.head.repo.full_name == github.repository
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Build diff
        env:
          BASE_SHA: ${{ github.event.pull_request.base.sha }}
          HEAD_SHA: ${{ github.event.pull_request.head.sha }}
        run: git diff "$BASE_SHA" "$HEAD_SHA" > pr.diff

      - name: Generate summary
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          DIFF_JSON=$(jq -Rs . < pr.diff)
          cat > body.json <<EOF
          {
            "model": "claude-haiku-4-5",
            "max_tokens": 800,
            "messages": [{
              "role": "user",
              "content": "次の差分を日本語で要約。1)目的 2)主な変更点 3)レビュー注目点 の3見出しで簡潔に。差分:\n${DIFF_JSON}"
            }]
          }
          EOF
          curl -sS https://api.anthropic.com/v1/messages \
            -H "x-api-key: ${ANTHROPIC_API_KEY}" \
            -H "anthropic-version: 2023-06-01" \
            -H "content-type: application/json" \
            -d @body.json | jq -r '.content[0].text' > summary.md

      - name: Append summary to PR body
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          # コメントとして投稿する方が安全(既存本文を破壊しない)
          {
            echo "## AIによる要約(自動生成)"
            echo ""
            cat summary.md
          } > comment.md
          gh pr comment "${{ github.event.pull_request.number }}" \
            --repo "${{ github.repository }}" \
            --body-file comment.md
```

::: tip 本文の上書きより「コメント追記」が安全
PR本文(description)を直接書き換えると、作者が書いた説明を上書きする事故が起きがちです。**別コメントとして投稿** すれば、人間の記述を壊しません。本文に入れたい場合も「自動生成ブロック」をマーカーで囲み、その範囲だけを更新する設計にします。
:::

## パターン3: コミット/PRテンプレの検証

これは **AIを使わなくても成立する** 機械的な検証ですが、CIゲートの基本としてセットで紹介します。Conventional Commits 形式やPR本文の必須項目をチェックします。

```yaml
# .github/workflows/pr-lint.yml
name: PR Lint

on:
  pull_request:
    types: [opened, edited, synchronize]

permissions:
  contents: read
  pull-requests: read

jobs:
  title-check:
    runs-on: ubuntu-latest
    steps:
      - name: Check PR title (Conventional Commits)
        env:
          TITLE: ${{ github.event.pull_request.title }}
        run: |
          # feat: / fix: / docs: などの接頭辞を要求する素朴な検証
          PATTERN='^(feat|fix|docs|refactor|test|chore|perf|build|ci)(\(.+\))?: .+'
          if echo "$TITLE" | grep -qE "$PATTERN"; then
            echo "OK: $TITLE"
          else
            echo "::error::PRタイトルは Conventional Commits 形式にしてください(例: feat: ...)"
            exit 1   # ここは機械的ルールなのでブロッキングにしてよい
          fi
```

::: info AIを足すなら「補助」に
テンプレ検証にAIを足すなら、「形式が崩れたPRタイトルを **規約形式に修正案として提案** する」「PR本文の空セクションに **下書きを提案** する」など、**ブロックではなく支援** の方向が相性が良いです。機械的に判定できるルール(正規表現で書けるもの)は静的検証に任せ、文脈判断が要るところだけAIに回します。
:::

## 運用上の注意

AIをCIに常設すると、コスト・セキュリティ・信頼の3点が効いてきます。

### コストとレート制限

::: warning 毎pushでフルレビューしない
`synchronize`(push のたび)に最上位モデルでフルレビューを回すと、活発なPRで課金が跳ねます。次で抑えます。

- **`concurrency` + `cancel-in-progress`**: 連続pushでは古い実行を打ち切る(上のYAML参照)。
- **差分サイズの上限**: 巨大差分はスキップ or 分割(スクリプト内で判定)。
- **モデルの段階構成**: 一次は Haiku 4.5 など軽量モデル、重要リポジトリだけ Sonnet 4.6 / Opus 4.8 に上げる。
- **対象の限定**: `paths` フィルタでドキュメントのみのPRは除外するなど。
- **API側のレート制限/上限**: 429 が返る前提でリトライ(指数バックオフ)を入れ、月次のコスト上限アラートを設定する。
:::

### 機密差分の扱い

::: warning 差分を外部APIに送る前にスキャン
PR差分にAPIキー・認証情報・個人情報が混ざると、それを **外部LLMへ送信** することになります。

- 送信前に **秘密情報スキャン**(gitleaks 等)をかけ、検出時はその箇所をマスクするかジョブを止める。
- 機密を含むリポジトリでは、外部API送信が組織ポリシー上許されるかを先に確認する。
- 必要なら **自社/プライベートなモデルエンドポイント**(VPC内・オンプレ)に向ける。送信先はお使いの環境に合わせて選択してください。
:::

### 誤検知をブロッキングにしない

::: warning AIの指摘でマージを止めない
AIレビューやAI要約の **失敗・誤検知でCIを落とさない** のが鉄則です。

- レビュースクリプトは失敗時に `exit 0`(黙ってスキップ)。`continue-on-error: true` も併用できる。
- AIの指摘は **コメント(参考情報)** にとどめ、マージのブロッカーにしない。
- ブロッキングにしてよいのは、テンプレ検証のような **機械的に判定できる規約** だけ。

詳しい根拠は [コードレビューbot](/practice/code-review-bot) の「誤検知の抑制」を参照。
:::

### fork PR とセキュリティ

::: warning fork PR に secrets を渡さない
`pull_request` イベントで外部fork由来のコードを `ANTHROPIC_API_KEY` 付きで実行すると、悪意あるPRがキーを窃取できます。上のYAMLの `if: ...head.repo.full_name == github.repository` は外部forkを除外するためのものです。`pull_request_target` を使う場合は、信頼境界を越えてforkのコードを実行しないよう細心の注意を払ってください。脅威と対策の全体像は [セキュリティリスク](/quality/security) と [セキュリティ深掘り](/advanced/security-deep-dive) を参照。
:::

| アンチパターン | 起きること | 対処 |
| --- | --- | --- |
| 毎pushで最上位モデル | コスト爆発 | concurrency / 軽量モデル / 差分上限 |
| 機密差分をそのまま送信 | 秘密情報の外部流出 | gitleaks でスキャン・マスク |
| AI失敗でCIを落とす | botが嫌われ外される | 失敗時スキップ・continue-on-error |
| fork PRにsecrets | APIキー漏洩 | fork除外・信頼境界の管理 |
| APIキー直書き | 即漏洩 | シークレット経由 |

## シークレット設定手順

GitHub リポジトリにAPIキーを安全に渡す手順です。

1. リポジトリの **Settings** タブを開く。
2. 左メニューの **Secrets and variables** → **Actions** を開く。
3. **New repository secret** をクリック。
4. **Name** に `ANTHROPIC_API_KEY`(ワークフローで参照する名前と一致させる)、**Secret** にキー本体を貼り付け、**Add secret**。
5. 組織全体で使うなら **Organization secrets**、特定環境(本番など)だけなら **Environment secrets** を使う。
6. ワークフローからは環境変数経由で参照する(YAML内のみ。下記)。

```yaml
# 参照のしかた(YAMLフェンス内でのみ二重波括弧を書く)
    env:
      ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

::: tip GITHUB_TOKEN は自動で用意される
PRへのコメント投稿に使う `GITHUB_TOKEN` は、GitHub Actions が **自動で発行** します(自分でシークレット登録する必要はありません)。ただし権限はワークフローの `permissions:` で絞られるので、コメント投稿には `pull-requests: write` を明示してください。組織のデフォルト権限設定によっては既定が read-only のことがあるため、お使いの設定を確認してください。
:::

::: warning キーのローテーションと最小スコープ
- APIキーは定期的にローテーションし、漏洩が疑われたら即座に失効させる。
- キーには可能な範囲で **最小スコープ/利用上限** を設定する。
- ログにキーが出力されないようにする(GitHub Actions はシークレットを自動マスクしますが、エンコードして出力すると回避されるため、デバッグ出力に注意)。
:::

## まとめ

- CIへのAI連携は **トリガ → 差分取得 → API送信 → 結果を投稿** の配管。GitHub Actions で全文をコピペ起点にできる。
- 自前スクリプト(curl / Node)なら **依存とコストを完全に制御** できる。既製アクションは出所と権限を確認して使う。
- **コスト**(concurrency・軽量モデル・差分上限)、**機密**(送信前スキャン)、**信頼**(失敗時スキップ・非ブロッキング)の3点を運用で締める。
- 秘密情報は必ず **シークレット経由**。**fork PR に secrets を渡さない**。

<div style="margin-top: 32px; padding: 16px 20px; border-radius: 12px; background: var(--vp-c-bg-soft);">

**次に読む** → 設計思想は [AIコードレビューbotの構築](/practice/code-review-bot)、脅威の全体像は [セキュリティリスク](/quality/security) と [セキュリティ深掘り](/advanced/security-deep-dive)。MCPをCIや手元に組み込むなら [MCPセットアップ](/ready/mcp-setup) へ。

</div>
