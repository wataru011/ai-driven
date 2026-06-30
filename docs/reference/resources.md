---
title: リソース集
description: AI駆動開発をさらに学ぶための、実在する良質な一次情報を分類して紹介します。公式ドキュメント、ツール、フレームワーク、研究を、信頼できるURLのみで整理します。
---

# リソース集

AI駆動開発をさらに深めるための、信頼できる一次情報を分類して紹介します。本ページは **実在が確実なURLのみ** を掲載し、推測や記憶頼りのリンクは避けています。

::: tip 読み方
ツールやモデルの仕様は変化が速いため、**最終的な真実は常に公式ドキュメント** にあります。本ハンドブックの解説と公式情報が食い違う場合は、公式を優先してください。
:::

## モデル・プラットフォーム公式ドキュメント

| リソース | URL | 概要 |
| --- | --- | --- |
| Anthropic ドキュメント | https://docs.anthropic.com | Claudeモデル(Opus / Sonnet / Haiku)とAPIの公式ドキュメント。プロンプト設計やツール使用の一次情報。 |
| Claude Code | https://docs.claude.com/en/docs/claude-code | ターミナルで動作するAnthropic公式のコーディングエージェントの公式ドキュメント。 |
| OpenAI Platform Docs | https://platform.openai.com/docs | OpenAIのモデルとAPIの公式ドキュメント。 |

## エージェント・ツール連携の標準

| リソース | URL | 概要 |
| --- | --- | --- |
| Model Context Protocol | https://modelcontextprotocol.io | AIアプリと外部ツール・データを接続するオープン標準(MCP)の公式サイト。仕様とSDK。 |

## コーディングツール

| リソース | URL | 概要 |
| --- | --- | --- |
| GitHub Copilot Docs | https://docs.github.com/copilot | GitHub Copilotの公式ドキュメント。エディタ統合とエンタープライズ運用。 |
| Cursor | https://docs.cursor.com | AI統合エディタ Cursor の公式ドキュメント。 |
| Aider | https://aider.chat | ターミナルで動くAIペアプログラミングツール Aider の公式サイト。 |
| Continue | https://continue.dev | VS Code / JetBrains向けのオープンソースAIコーディング拡張 Continue の公式サイト。 |
| Cline | https://github.com/cline/cline | VS Code向けの自律型AIコーディングエージェント Cline のGitHubリポジトリ。 |

## デリバリー・生産性のフレームワーク

| リソース | URL | 概要 |
| --- | --- | --- |
| DORA | https://dora.dev | DevOps Research and Assessment の公式サイト。4つの主要指標と研究レポート(State of DevOps)。→ [生産性の測定](/adoption/metrics) |
| SPACEフレームワーク(論文) | https://queue.acm.org/detail.cfm?id=3454124 | "The SPACE of Developer Productivity"(ACM Queue掲載)。生産性を多次元で捉える枠組みの原典。 |

::: info SPACEについて
SPACEフレームワークは、開発者生産性を単一指標で測ることの誤りを指摘し、Satisfaction / Performance / Activity / Communication / Efficiency の5次元で捉えることを提案した論文に由来します。上記はACM Queueに掲載された一次情報です。
:::

## このサイト内の関連ページ

外部リソースに進む前に、本ハンドブックの該当ページで全体像を押さえると理解が早まります。

- [AI駆動開発とは](/guide/what-is-aidd) — 全体像と成熟度モデル。
- [LLMの仕組み](/concepts/how-llms-work) — なぜそう振る舞うかのメンタルモデル。
- [ツールの選び方](/tools/choosing) — 上記ツール群をどう選ぶか。
- [用語集](/reference/glossary) — 本ページで出てくる用語の定義。
- [ベストプラクティス チェックリスト](/reference/checklist) — 実務で使える点検リスト。

::: warning URLの鮮度について
本ページのリンクは実在する公式情報源を厳選していますが、各サイトのURL構成や提供内容は提供者の都合で変わることがあります。リンク切れに気づいた場合は、各提供者のトップページから目的のドキュメントをたどってください。
:::

<div style="margin-top: 32px; padding: 16px 20px; border-radius: 12px; background: var(--vp-c-bg-soft);">

**次に読む** → [用語集](/reference/glossary) / [ベストプラクティス チェックリスト](/reference/checklist)

</div>
