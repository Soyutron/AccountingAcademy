# 0001. 流用元リポジトリ(Ludogenesis)の構成を全面的に捨てる

日付: 2026-11-07
状態: 採用

## 背景
このリポジトリはDeep Agents / LangGraph製の自律型ゲームスタジオ「Ludogenesis」から流用した。
流用時点で含まれていたのは設定ファイルのみ(`CLAUDE.md`、`README.md`、`Makefile`、`.mcp.json`、`skills-lock.json`、
LangChain系のClaude Codeスキル、`.claude/settings*.json`、`.gitignore`)で、ソースコードや`pyproject.toml`は含まれていなかった。

## 決定
- 上記のうちLudogenesis固有のもの(README、Makefile、MCP設定、LangChain / ludo系スキル、skills-lock)をすべて削除した。
- 残したのは`.claude/settings.json`(Bash許可と`.env`読み取り拒否)と`.gitignore`の汎用部分だけ。
- `CLAUDE.md`のコーディング規約・実装方針の節は本プロジェクトにも有効なので引き継いだ。
- LangChain系スキルはAI解説機能を採用すると決めた時点で再導入する(`npx skills add langchain-ai/langchain-skills`相当)。
  「後で使うかもしれない」だけの理由で残さない。

## 影響
- 再利用できるコードは無いため、技術スタックは要件定義後に白紙から選定する。
- 削除前の状態はセッションのスクラッチパッドに退避した(一時的。流用元のLudogenesisリポジトリが正本)。
