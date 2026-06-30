---
title: エージェント設計パターン
description: ReAct、Plan-and-Execute、Reflection、Tool-use、Router、Orchestrator-Worker、Evaluator-Optimizer、Human-in-the-loopという代表的なエージェント設計パターンの構造・適用場面・トレードオフを、テーブルと擬似コードで体系的に整理します。
---

# エージェント設計パターン

エージェントは「LLM + ツール + ループ + 停止条件」という単純な骨格から始まりますが([AIエージェントとは](/agents/what-is-agent))、実用システムはそこに **再利用可能な制御構造** を積み重ねて作られます。それが本ページで扱う **設計パターン** です。

各パターンはGoFのデザインパターンと同じく、「こういう問題には、こういう構造が効く」という定石の集まりです。万能パターンは存在せず、タスクの性質に応じて選び、組み合わせます。

::: tip ひとことで言うと
エージェント設計パターンとは、**LLMの制御フローの定石集**です。一手ずつ反応するか(ReAct)、先に計画するか(Plan-and-Execute)、自己批判を挟むか(Reflection)、仕事を分けるか(Orchestrator-Worker)——タスクに合わせて選びます。
:::

## パターン一覧

| パターン | 中心アイデア | 主な適用場面 |
| --- | --- | --- |
| ReAct | 思考と行動を交互に | 探索的・検証ループのある作業 |
| Plan-and-Execute | 先に計画、後で実行 | 多段・依存のある大きなタスク |
| Reflection / Self-critique | 出力を自己批判して改善 | 品質を一段上げたい生成 |
| Tool-use | 外部能力をツールで拡張 | 計算・検索・実行が要る作業 |
| Router | 入力を適切な処理へ振り分け | 多種の入力を捌く窓口 |
| Orchestrator-Worker | 親が分解、子が並行実行 | 分割統治できる大規模作業 |
| Evaluator-Optimizer | 生成と評価を反復 | 明確な評価基準があるタスク |
| Human-in-the-loop | 要所で人間が承認 | 高リスク・不可逆な操作 |

## ReAct(Reasoning + Acting)

最も基本的なパターン。**思考(Thought)→行動(Action)→観測(Observation)** を交互に繰り返し、各行動の根拠を言語化させます([AIエージェントとは](/agents/what-is-agent)で詳述)。

```python
def react(goal, tools, max_steps=20):
    memory = [system(goal, tools)]
    for _ in range(max_steps):
        step = llm(memory, tools)            # Thought + Action を生成
        if step.is_final:
            return step.answer
        obs = execute(step.action)           # Observation
        memory += [step.action, obs]
    return "打ち切り"
```

- **強み** — 環境のフィードバックに反応して自己修正できる。実装が単純。
- **弱み** — 近視眼的。大きなタスクでは迷走しやすい。
- **適用** — テスト・型・リンタという検証ループが回る作業。可逆な探索。

## Plan-and-Execute

ReActの近視眼を補う。**まずタスク全体を計画(サブタスクへ分解)し、それから各サブタスクを実行**します。想定外の観測が出たら計画を更新(replan)します。

```python
def plan_and_execute(goal):
    plan = llm_plan(goal)                    # サブタスク列に分解
    results = []
    for subtask in plan:
        r = react(subtask, tools)            # 各サブタスクをReActで
        results.append(r)
        if unexpected(r):
            plan = llm_replan(goal, plan, results)  # 再計画
    return synthesize(results)
```

| | ReAct | Plan-and-Execute |
| --- | --- | --- |
| 視野 | 一手先 | タスク全体 |
| 大規模タスク | 迷走しやすい | 構造を保てる |
| 可観測性 | 低い | 高い(計画が見える) |
| オーバーヘッド | 小 | 計画の生成コスト |

経験則として、**3〜4ステップを超えるタスク**には明示的な計画を持たせると成功率が上がります。

## Reflection / Self-critique

生成物を **もう一度LLMに批判させ、その指摘を踏まえて改善**するパターン。「書く」と「直す」を分けることで品質が上がります。

```python
def reflection(task, max_rounds=3):
    output = generate(task)
    for _ in range(max_rounds):
        critique = critique_llm(task, output)   # 自己批判
        if critique.is_satisfactory:
            return output
        output = revise(task, output, critique) # 批判を反映
    return output
```

- **強み** — 一発生成より品質が上がる。誤りや抜けに気づける。
- **弱み** — ラウンドごとにコストとレイテンシが増える。**自己評価の信頼性に上限**(モデルが自分の誤りに気づけないこともある)。
- **適用** — 文章・設計案・複雑なコードなど、推敲が効く生成。

::: warning 自己批判は万能ではない
自分の出力を自分で評価させる構造には限界があります。可能なら **外部の機械的検証**(テスト・型・リンタ)を批判の根拠に使うと、自己満足的な"改善"を避けられます。次のEvaluator-Optimizerはこれを構造化したものです。
:::

## Tool-use

LLM単体ができないこと(正確な計算、最新情報の検索、コード実行、外部API操作)を **ツール**として外部化し、モデルに使わせるパターン。エージェントの「行動」の実体です。

```python
TOOLS = {
    "search": web_search,
    "run_code": sandbox_exec,
    "read_file": read_file,
}

def tool_use_step(memory):
    decision = llm(memory, tools=TOOLS.keys())
    if decision.wants_tool:
        result = TOOLS[decision.tool](**decision.args)
        return observation(result)
    return decision.answer
```

ツール設計の良し悪しがエージェントの能力を直接決めます。詳細とMCPによる標準化は[ツール使用とMCP](/agents/tools-and-mcp)と[MCP実装ディープダイブ](/advanced/mcp-deep-dive)を参照。ツールは強力なぶん **乱用・誤用がセキュリティリスク**になります([セキュリティ ディープダイブ](/advanced/security-deep-dive))。

## Router

入力を見て **適切な処理経路(プロンプト・モデル・サブエージェント)へ振り分ける**パターン。多様な入力を捌く窓口に置きます。

```python
def router(request):
    category = classify(request)             # 軽量モデルで分類
    handler = {
        "code":    code_agent,
        "search":  search_agent,
        "chat":    chat_handler,
    }[category]
    return handler(request)
```

- **強み** — 専門化した経路で精度が上がる。[コスト最適化](/models/cost-optimization)のモデルルーティングと直結。
- **弱み** — 分類の誤りが全体に波及。分類器自体の保守が必要。
- **適用** — 入力の種類が多い窓口、難易度でモデルを使い分けたい場合。

## Orchestrator-Worker

**親(オーケストレータ)がタスクを分解し、複数の子(ワーカー)が並行して処理**、親が結果を統合するパターン。[マルチエージェント](/agents/multi-agent)の中心構造です。

```python
def orchestrator(goal):
    subtasks = orchestrator_llm.decompose(goal)   # 動的に分解
    results = parallel_map(lambda t: worker(t), subtasks)  # 並行実行
    return orchestrator_llm.synthesize(goal, results)      # 統合
```

| | Router | Orchestrator-Worker |
| --- | --- | --- |
| 入力 | 1件を1経路へ | 1件を複数サブタスクへ |
| 実行 | 単一ハンドラ | 並行ワーカー |
| 用途 | 振り分け | 分割統治 |

- **強み** — 並列化でスループット向上。各ワーカーに独立した文脈を与え、コンテキスト溢れを防ぐ。
- **弱み** — 統合の難しさ、並行ぶんのコスト増、デバッグの複雑化。
- **適用** — 独立に分解・検証できる大規模作業(複数ファイルの並行調査など)。

## Evaluator-Optimizer

**生成器(optimizer)と評価器(evaluator)を分け、評価のフィードバックで生成を反復改善**するパターン。Reflectionを「外部評価」で構造化したものと言えます。

```python
def evaluator_optimizer(task, max_iter=5):
    output = generate(task)
    for _ in range(max_iter):
        score, feedback = evaluate(task, output)   # 明確な基準で採点
        if score >= threshold:
            return output
        output = generate(task, feedback=feedback) # 改善
    return best_so_far
```

- **強み** — **明確な評価基準があるとき**に強力。評価がテスト等で機械化できれば信頼性が高い。
- **弱み** — 評価基準が曖昧だと空回り。反復ぶんのコスト。
- **適用** — コード生成(テスト通過率)、翻訳、最適化問題など、良し悪しが測れるタスク。評価設計は[Evals](/models/evaluation)と直結。

## Human-in-the-loop

**要所で人間の承認・修正を挟む**パターン。自律度を意図的に下げ、リスクを制御します。

```python
def human_in_the_loop(action):
    if is_high_risk(action):                 # 削除・課金・公開・本番変更
        if not request_approval(action):     # 人間に承認を求める
            return abort("却下")
    return execute(action)
```

- **強み** — 不可逆・高リスク操作を止められる。説明責任の所在が明確。
- **弱み** — スループットが落ちる。承認疲れ(雑に承認するようになる)。
- **適用** — 本番DB変更、外部送信、課金、公開など可逆性の低い操作。

自律度と制御のトレードオフは[AIエージェントとは](/agents/what-is-agent)の通り。**リスクと可逆性に応じて承認ゲートを置く**のが定石です。

## パターンの選び方と組み合わせ

実システムは単一パターンでなく、**入れ子・連結**で構成されます。

```text
Router(入口で振り分け)
  └─ Orchestrator(分解)
       └─ Worker × N(並行)
            └─ Plan-and-Execute(各ワーカー内)
                 └─ ReAct(各サブタスク)
                      └─ Tool-use(各行動)
       └─ Evaluator-Optimizer(統合前に品質ゲート)
  └─ Human-in-the-loop(高リスク行動の前)
```

選定の指針:

| タスクの性質 | 効くパターン |
| --- | --- |
| 検証ループがある・可逆 | ReAct |
| 多段・依存が深い | Plan-and-Execute |
| 推敲で品質が上がる | Reflection |
| 明確な評価基準がある | Evaluator-Optimizer |
| 入力が多種多様 | Router |
| 分割統治できる大規模 | Orchestrator-Worker |
| 不可逆・高リスク | Human-in-the-loop |

::: tip まず単純に始める
最初から多層構造を組むと、デバッグ不能になりがちです。**ReAct + Tool-use の最小構成から始め**、迷走するなら計画を、品質が足りないなら評価を、リスクが高いなら承認を、と **必要になった分だけパターンを足す**のが安全です。
:::

## まとめ

- エージェント設計パターンは **LLM制御フローの定石集**。万能はなく、タスクで選び組み合わせる。
- 反応型は **ReAct**、計画型は **Plan-and-Execute**、品質向上は **Reflection / Evaluator-Optimizer**。
- 構造化は **Router**(振り分け)と **Orchestrator-Worker**(分割統治)。
- 高リスク操作には **Human-in-the-loop** で承認ゲートを。
- **最小構成から始め、必要な分だけパターンを足す**。

<div style="margin-top: 32px; padding: 16px 20px; border-radius: 12px; background: var(--vp-c-bg-soft);">

**次に読む** → [マルチエージェント](/agents/multi-agent) で分割統治を、[MCP実装ディープダイブ](/advanced/mcp-deep-dive) でTool-useの標準化を。リスク制御は[セキュリティ ディープダイブ](/advanced/security-deep-dive)へ。

</div>
