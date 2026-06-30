import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  lang: 'ja-JP',
  title: 'AI駆動開発ハンドブック',
  description:
    'AI駆動開発(AI-Driven Development)のすべてを学べる、経験豊富なプログラマーのための実践的な知識サイト。概念・ツール・ワークフロー・エージェント・品質・セキュリティ・組織導入までを網羅。',

  // GitHub Pages: https://wataru011.github.io/ai-driven/ で公開
  base: '/ai-driven/',
  lastUpdated: true,
  cleanUrls: true,

  head: [
    ['meta', { name: 'theme-color', content: '#f97316' }],
    ['meta', { name: 'author', content: 'AI駆動開発ハンドブック' }],
    [
      'meta',
      {
        property: 'og:title',
        content: 'AI駆動開発ハンドブック'
      }
    ],
    [
      'meta',
      {
        property: 'og:description',
        content: 'AI駆動開発のすべてを学べる、プログラマー向けの実践的な知識サイト'
      }
    ],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }]
  ],

  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: '/logo.svg',
    siteTitle: 'AI駆動開発ハンドブック',

    nav: [
      { text: 'ホーム', link: '/' },
      { text: 'はじめに', link: '/guide/what-is-aidd' },
      {
        text: '主要トピック',
        items: [
          { text: 'ツールエコシステム', link: '/tools/landscape' },
          { text: 'プロンプトエンジニアリング', link: '/prompting/fundamentals' },
          { text: '開発ワークフロー', link: '/workflow/overview' },
          { text: 'AIエージェント', link: '/agents/what-is-agent' },
          { text: '品質とセキュリティ', link: '/quality/code-quality' },
          { text: '組織への導入', link: '/adoption/strategy' }
        ]
      },
      { text: '用語集', link: '/reference/glossary' },
      { text: 'リソース', link: '/reference/resources' }
    ],

    sidebar: {
      '/': [
        {
          text: 'はじめに',
          collapsed: false,
          items: [
            { text: 'AI駆動開発とは', link: '/guide/what-is-aidd' },
            { text: '歴史と進化', link: '/guide/history' },
            { text: '従来開発との違い', link: '/guide/vs-traditional' },
            { text: 'はじめての一歩', link: '/guide/getting-started' }
          ]
        },
        {
          text: 'コア技術を理解する',
          collapsed: false,
          items: [
            { text: 'LLMの仕組み', link: '/concepts/how-llms-work' },
            { text: 'コンテキストウィンドウ', link: '/concepts/context-window' },
            { text: '埋め込みとRAG', link: '/concepts/rag' },
            { text: 'ファインチューニングと拡張', link: '/concepts/fine-tuning' }
          ]
        },
        {
          text: 'ツールエコシステム',
          collapsed: false,
          items: [
            { text: '全体像', link: '/tools/landscape' },
            { text: 'コーディングアシスタント', link: '/tools/coding-assistants' },
            { text: 'エージェント型ツール', link: '/tools/agentic-tools' },
            { text: 'ツールの選び方', link: '/tools/choosing' }
          ]
        },
        {
          text: 'プロンプトエンジニアリング',
          collapsed: false,
          items: [
            { text: '基礎', link: '/prompting/fundamentals' },
            { text: '実践テクニック', link: '/prompting/techniques' },
            { text: 'コンテキスト設計', link: '/prompting/context-design' }
          ]
        },
        {
          text: '開発ワークフロー',
          collapsed: false,
          items: [
            { text: '全体像', link: '/workflow/overview' },
            { text: '設計フェーズ', link: '/workflow/design' },
            { text: '実装フェーズ', link: '/workflow/implementation' },
            { text: 'テストとレビュー', link: '/workflow/testing-review' },
            { text: 'リファクタリングと保守', link: '/workflow/refactoring' }
          ]
        },
        {
          text: 'AIエージェント開発',
          collapsed: false,
          items: [
            { text: 'エージェントとは', link: '/agents/what-is-agent' },
            { text: 'ツール使用とMCP', link: '/agents/tools-and-mcp' },
            { text: 'マルチエージェント', link: '/agents/multi-agent' }
          ]
        },
        {
          text: '品質・セキュリティ',
          collapsed: false,
          items: [
            { text: 'コード品質の担保', link: '/quality/code-quality' },
            { text: 'セキュリティリスク', link: '/quality/security' },
            { text: 'ハルシネーション対策', link: '/quality/hallucination' }
          ]
        },
        {
          text: '組織への導入',
          collapsed: false,
          items: [
            { text: '導入戦略', link: '/adoption/strategy' },
            { text: 'ガバナンスと倫理', link: '/adoption/governance' },
            { text: 'チームの生産性測定', link: '/adoption/metrics' }
          ]
        },
        {
          text: 'リファレンス',
          collapsed: false,
          items: [
            { text: '用語集', link: '/reference/glossary' },
            { text: 'リソース集', link: '/reference/resources' },
            { text: 'ベストプラクティス チェックリスト', link: '/reference/checklist' }
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/wataru011/ai-driven' }
    ],

    search: {
      provider: 'local',
      options: {
        translations: {
          button: {
            buttonText: '検索',
            buttonAriaLabel: '検索'
          },
          modal: {
            noResultsText: '見つかりませんでした',
            resetButtonTitle: 'クリア',
            footer: {
              selectText: '選択',
              navigateText: '移動',
              closeText: '閉じる'
            }
          }
        }
      }
    },

    outline: {
      label: 'このページの内容',
      level: [2, 3]
    },

    docFooter: {
      prev: '前のページ',
      next: '次のページ'
    },

    lastUpdated: {
      text: '最終更新',
      formatOptions: {
        dateStyle: 'long'
      }
    },

    darkModeSwitchLabel: 'テーマ',
    lightModeSwitchTitle: 'ライトモードに切り替え',
    darkModeSwitchTitle: 'ダークモードに切り替え',
    sidebarMenuLabel: 'メニュー',
    returnToTopLabel: 'トップへ戻る',

    editLink: {
      pattern: 'https://github.com/wataru011/ai-driven/edit/main/docs/:path',
      text: 'このページを編集する'
    },

    footer: {
      message: 'MIT License で公開されています。',
      copyright: 'AI駆動開発ハンドブック'
    }
  }
})
