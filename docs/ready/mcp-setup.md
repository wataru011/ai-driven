---
title: MCPセットアップ
description: MCP(Model Context Protocol)をすぐ使うためのコピペ設定集。.mcp.json / mcpServers 形式のサンプル、filesystem・git・GitHub など代表的サーバーの構成例(command/args/env)、クライアント別の登録の考え方、自作MCPサーバーの最小スケッチ、権限・信頼境界・サンドボックスのセキュリティ注意までをまとめます。
---

# MCPセットアップ

このページは **MCP(Model Context Protocol)をすぐ動かすためのコピペ設定集** です。設定ファイルの形・代表的サーバーの構成例・自作サーバーの最小スケッチを、そのまま貼って始められる形で示します。

::: tip MCPとは何か(おさらい)
MCP は **Anthropicが提唱したオープン標準** で、AIアプリ(ホスト)と外部のツール・データ・機能(サーバー)を統一インターフェースでつなぎます。「一度サーバーを作れば、MCP対応の任意のホストから再利用できる」のが要点です。概念の全体像は [ツール使用とMCP](/agents/tools-and-mcp) と [MCP深掘り](/advanced/mcp-deep-dive) を参照。ここは **設定の実務** に特化します。
:::

::: warning 信頼できないサーバーを入れない
MCPサーバーは **あなたの環境で動くプロセス** であり、ツール説明文に悪意ある指示を仕込める攻撃面でもあります。導入前に **出所・コード・要求権限** を必ず確認してください。詳細は末尾の[セキュリティの注意](#セキュリティの注意)と [セキュリティ深掘り](/advanced/security-deep-dive) を参照。
:::

## 設定ファイルの基本形

多くのMCP対応ホストは、`mcpServers` というオブジェクトでサーバー群を宣言します。最小形は次のとおりです。

```json
{
  "mcpServers": {
    "サーバー名": {
      "command": "起動コマンド",
      "args": ["引数1", "引数2"],
      "env": {
        "ENV_VAR": "値"
      }
    }
  }
}
```

| キー | 意味 |
| --- | --- |
| `command` | サーバーを起動する実行ファイル(例: `npx`、`node`、`python`、`docker`) |
| `args` | コマンドへ渡す引数の配列(パッケージ名・許可パスなど) |
| `env` | サーバープロセスに渡す環境変数(トークン等。値は直書きせずシークレット/環境から) |

::: info `.mcp.json` とクライアント設定の違い
- **`.mcp.json`**(プロジェクト直下): そのリポジトリで使うサーバーを宣言し、**チームで共有** する用途。リポジトリにコミットして配布します。
- **クライアント個別設定**: 各ホストアプリが持つ自分用の設定(ユーザー単位)。場所と正確なファイル名は **クライアントごとに異なる** ため、お使いのクライアントの公式ドキュメントで確認してください。

どちらも `mcpServers` の形は共通していることが多いです。
:::

## 代表的サーバーの構成例

::: warning パッケージ名は公式一覧で確認
以下は広く知られた構成例ですが、パッケージ名・引数・推奨起動方法は更新されます。**導入時は公式のMCPサーバー一覧(modelcontextprotocol の公開リポジトリ/ドキュメント)で最新を確認** してください。ここに挙げないサーバーも多数あります。
:::

### filesystem(ローカルファイルへのアクセス)

`@modelcontextprotocol/server-filesystem` は、**引数で渡したディレクトリだけ** にアクセスを許可するファイルシステムサーバーです。許可パスを明示するのが安全の肝です。

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/home/user/projects/my-app"
      ]
    }
  }
}
```

::: tip 許可するパスは最小限に
filesystem サーバーに渡すパスは **本当に触らせたいディレクトリだけ** にします。ホームディレクトリ全体やルート(`/`)を渡すと、AIが想定外のファイルを読み書きできてしまいます。複数許可するなら `args` にパスを並べます。
:::

### git(ローカルリポジトリの操作)

`@modelcontextprotocol/server-git` は、ローカルGitリポジトリの履歴閲覧・diff・状態確認などを公開します(Python実装で配布されることがあり、`uvx` などで起動する例もあります)。**起動方法はお使いの配布形態に合わせて** ください。

```json
{
  "mcpServers": {
    "git": {
      "command": "uvx",
      "args": ["mcp-server-git", "--repository", "/home/user/projects/my-app"]
    }
  }
}
```

::: info `npx` / `uvx` とは
- `npx`(Node)と `uvx`(Python の uv)は、**パッケージを事前インストールせずにその場で実行** するランナーです。MCPサーバーの起動コマンドとしてよく使われます。
- どちらを使うかは **そのサーバーがどの言語/配布形態か** で決まります。手元に `npx` / `uvx` が無ければ Node / uv の導入が必要です。お使いの環境に合わせてください。
:::

### GitHub(リモートリポジトリの操作)

GitHub連携サーバーは、issue/PR/コードの読み書きを公開します。提供形態(npmパッケージ / Dockerイメージ / リモートHTTPサーバー)は変遷しているため、**現在の公式提供方法を必ず確認** してください。トークンは **シークレット/環境変数で渡し、設定に直書きしない** のが鉄則です。

```json
{
  "mcpServers": {
    "github": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-e", "GITHUB_PERSONAL_ACCESS_TOKEN",
        "ghcr.io/example/github-mcp-server"
      ],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_PERSONAL_ACCESS_TOKEN}"
      }
    }
  }
}
```

::: warning トークンは環境から注入する
上の `${GITHUB_PERSONAL_ACCESS_TOKEN}` は **環境変数を参照する書き方の例** です(参照構文に対応するかはクライアント依存)。対応しない場合でも、**実トークンをファイルに直書きしない**。シェルの環境変数やシークレットマネージャから注入し、設定ファイルはコミット対象から除外(`.gitignore`)します。イメージ名 `ghcr.io/example/...` はプレースホルダなので、実在の公式イメージ名に置き換えてください。
:::

### 複数サーバーをまとめて宣言

`mcpServers` には複数サーバーを並べられます。

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/home/user/projects/my-app"]
    },
    "git": {
      "command": "uvx",
      "args": ["mcp-server-git", "--repository", "/home/user/projects/my-app"]
    }
  }
}
```

## クライアント別の登録の考え方

正確なファイルパス・コマンド名はクライアントごとに違いますが、**登録の考え方は共通** です。

| クライアント種別 | 登録の考え方 |
| --- | --- |
| プロジェクト共有 | リポジトリ直下に `.mcp.json` を置き、チームで共有(コミット) |
| ユーザー個別 | クライアントのユーザー設定に `mcpServers` を追記 |
| CLI 型ツール | 専用コマンドで追加できることが多い(下記) |

### Claude Code での登録(考え方)

Claude Code のようなCLI型ホストでは、設定ファイルを直接編集するほか、**専用のサブコマンドでサーバーを追加** できる場合があります。スコープ(プロジェクト共有か、ユーザー個別か)を選べることが多いです。

```bash
# 例: CLIでサーバーを追加する一般的なイメージ
# 実際のサブコマンド名・オプションはお使いのバージョンのヘルプで確認してください
claude mcp add filesystem -- npx -y @modelcontextprotocol/server-filesystem /home/user/projects/my-app

# 登録済みサーバーの確認
claude mcp list
```

::: tip 正確なコマンドはヘルプで確認
CLIのサブコマンド名やフラグはバージョンで変わります。`claude mcp --help` のような **ヘルプ出力で最新の使い方を確認** してください。設定ファイルを直接書く方法でも等価に登録できます。
:::

::: info 接続トランスポート
MCPの通信は標準化されており、ローカルプロセスは **stdio**(標準入出力)、リモートは **HTTP系** のトランスポートが使われます。`command`/`args` で起動する設定は stdio 型、URLを指定する設定はリモート型です。リモートサーバーを登録するときは **接続先URLと認証** の扱いに注意してください。詳細は [MCP深掘り](/advanced/mcp-deep-dive) を参照。
:::

## 自作MCPサーバーの最小スケッチ

自前のツールやデータ源をMCPで公開したいときの **最小構成スケッチ(擬似コード)** です。SDKのAPI名・初期化方法はバージョンで変わるため、**公式SDKのドキュメントで最新を確認** してください。

```js
// my-mcp-server.mjs(擬似コード・要約)
// 公式の MCP SDK を使ってサーバーを定義するイメージ
import { McpServer } from "@modelcontextprotocol/sdk/server";   // 名前は公式で確認
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio";

const server = new McpServer({ name: "my-tools", version: "0.1.0" });

// ツール(モデルが呼べる関数)を1つ登録する
server.tool(
  "get_order_status",                       // ツール名
  { orderId: { type: "string" } },          // 入力スキーマ(JSON Schema)
  async ({ orderId }) => {
    // 実処理: DBや社内APIを叩く(秘密情報はここで安全に保持)
    const status = await lookupOrder(orderId);
    return { content: [{ type: "text", text: `status: ${status}` }] };
  }
);

// stdio トランスポートで起動(ホストが command/args でこのプロセスを立ち上げる)
await server.connect(new StdioServerTransport());
```

このサーバーを `mcpServers` に登録します。

```json
{
  "mcpServers": {
    "my-tools": {
      "command": "node",
      "args": ["/home/user/projects/my-app/my-mcp-server.mjs"]
    }
  }
}
```

::: tip ツール定義は「モデルへのドキュメント」
ツールの名前・説明・入力スキーマは、人間ではなく **モデルが読むAPIドキュメント** です。「何をするか」だけでなく「いつ使うか」を書き、引数は型・必須/任意・enum で厳密に縛ると誤呼び出しが減ります。設計原則は [ツール使用とMCP](/agents/tools-and-mcp) のチェックリストを参照。
:::

## 動作確認のコツ

- まず **1サーバーだけ** 登録して、ホストがそのツールを認識するか確認する。一気に全部入れない。
- サーバー起動コマンドを **手元のシェルで直接実行** してみて、エラーなく立ち上がるか先に切り分ける。
- ホスト側に **MCPサーバーのログ/状態表示** があれば、接続失敗の原因(コマンド未検出・権限不足・トークン不正)はそこに出ます。
- `npx -y` / `uvx` は初回にダウンロードが走るため、**最初の起動が遅い** ことがあります。

## セキュリティの注意

MCPサーバーはエージェントに「現実世界へ作用する力」を与えます。[ツール使用とMCP](/agents/tools-and-mcp) と [セキュリティ深掘り](/advanced/security-deep-dive) とあわせて必ず確認してください。

::: warning 導入前・運用時のチェックリスト
- **出所の確認**: 信頼できないサードパーティのサーバーは入れない。ツール説明文に悪意ある指示を仕込める。コードと要求権限を精査する。
- **最小権限**: filesystem は許可パスを最小に、トークンは必要なスコープだけ。読み取りで足りるなら書き込みを与えない。
- **信頼境界**: サーバーが触る外部システム(GitHub・DB・社内API)ごとに、何を許すかを明示的に決める。
- **サンドボックス**: コマンド実行やファイル操作を行うサーバーは、コンテナ等で隔離し、本番やホスト全体への到達を遮断する(`docker run --rm` 等)。
- **秘密情報の分離**: APIキー・トークンは設定ファイルに直書きせず、環境変数/シークレットから注入。設定ファイルは `.gitignore` で管理。
- **破壊的操作の承認**: 削除・送信・課金など不可逆操作は、自動実行せず人間の承認を挟む(human-in-the-loop)。
- **監査ログ**: どのツールがどの引数で呼ばれたかを記録し、事後追跡できるようにする。
:::

::: warning プロンプトインジェクションに注意
MCPサーバーが返すデータ(ファイル内容・検索結果・外部API応答)に **悪意ある指示** が混入していると、間接的プロンプトインジェクションで意図しないツール呼び出しが誘発されえます。サーバーの戻り値は「データ」として扱い、システム指示と混ぜない設計にします。脅威の全体像は [セキュリティ深掘り](/advanced/security-deep-dive) を参照。
:::

## まとめ

- MCP設定の基本は `mcpServers` の `command` / `args` / `env`。`.mcp.json` で **チーム共有**、クライアント設定で **個人利用**。
- 代表的サーバー(filesystem・git・GitHub)は構成例から始め、**パッケージ名・起動方法は公式一覧で最新を確認** する。
- 自作サーバーは **ツールを登録して stdio で起動** するだけの最小スケッチから始められる。
- セキュリティは **出所確認・最小権限・サンドボックス・秘密情報の分離・承認ゲート** が前提。トークンは直書きしない。

<div style="margin-top: 32px; padding: 16px 20px; border-radius: 12px; background: var(--vp-c-bg-soft);">

**次に読む** → 概念の土台は [ツール使用とMCP](/agents/tools-and-mcp)、内部の仕組みは [MCP深掘り](/advanced/mcp-deep-dive)。セキュリティは [セキュリティ深掘り](/advanced/security-deep-dive)。CIへのAI連携は [CI/CD連携](/ready/ci-integration) へ。

</div>
