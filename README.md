# AI駆動開発ハンドブック

> AI駆動開発(AI-Driven Development)のすべてを学べる、経験豊富なプログラマーのための実践的な知識サイト。

[**📖 サイトを開く → https://wataru011.github.io/ai-driven/**](https://wataru011.github.io/ai-driven/)

概念・コア技術・ツールエコシステム・プロンプトエンジニアリング・開発ワークフロー・AIエージェント・品質/セキュリティ・組織導入までを体系的にまとめた、[VitePress](https://vitepress.dev/) 製のドキュメントサイトです。

## 特徴

- 🧭 **体系的** — バズワードではなく工学として、AI駆動開発を構造的に整理
- 🎯 **経験者向け** — システム開発経験が豊富なプログラマーを読者に想定
- ☀️ **明るいデザイン** — アンバー/オレンジ基調の見やすいテーマ + 全文検索
- 🚀 **自動公開** — `main` へのマージで GitHub Pages に自動デプロイ

## ローカルでの開発

前提: Node.js 20 以上

```bash
# 依存関係のインストール
npm install

# 開発サーバーを起動(http://localhost:5173/ai-driven/)
npm run docs:dev

# 本番ビルド
npm run docs:build

# ビルド結果をプレビュー
npm run docs:preview
```

## ディレクトリ構成

```
.
├── .github/workflows/deploy.yml   # GitHub Pages への自動デプロイ
├── docs/
│   ├── .vitepress/
│   │   ├── config.mts             # サイト設定(ナビ/サイドバー/検索など)
│   │   └── theme/                 # 明るいデザインのカスタムテーマ
│   ├── public/                    # ロゴ等の静的アセット
│   ├── index.md                   # トップページ
│   ├── guide/                     # はじめに
│   ├── concepts/                  # コア技術
│   ├── tools/                     # ツールエコシステム
│   ├── prompting/                 # プロンプトエンジニアリング
│   ├── workflow/                  # 開発ワークフロー
│   ├── agents/                    # AIエージェント開発
│   ├── quality/                   # 品質・セキュリティ
│   ├── adoption/                  # 組織への導入
│   └── reference/                 # 用語集・リソース・チェックリスト
└── package.json
```

## デプロイの仕組み

`main` ブランチへ push(プルリクエストのマージを含む)されると、GitHub Actions が VitePress をビルドし、GitHub Pages へ公開します。

初回のみ、リポジトリの **Settings → Pages → Build and deployment → Source** を **GitHub Actions** に設定してください。

## ライセンス

MIT License
