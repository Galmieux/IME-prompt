# CLAUDE.md

このファイルは、Claude Code (claude.ai/code) がこのリポジトリで作業する際のガイダンスを提供します。

## プロジェクトの目的

このプロジェクトは、Windows環境で動作するVS Code拡張機能として、日本語IME（Input Method Editor）に完全対応したプロンプト入力支援ツールを提供します。

### 主な目標
- **日本語IME互換性の実現**: Windows環境での日本語入力を完全サポート
- **Claude Code風のUX**: `/コマンド` と `@メンション` による高度な入力支援機能
- **VS Code統合**: ネイティブなVS Code拡張機能としてシームレスに動作
- **Webview UI**: モダンでレスポンシブなUI/UX

## プロジェクト構造

```
IME-prompt/
├── .vscode/                      # VS Code設定
│   ├── launch.json              # デバッグ設定
│   └── tasks.json               # タスク設定
├── src/                          # ソースコード
│   ├── extension.ts             # 拡張機能のエントリポイント
│   └── webview/
│       └── PromptWebviewProvider.ts  # Webview UI実装
├── out/                          # コンパイル済みファイル（.gitignore）
├── forked-repo/                  # 参考用：Prompt Line オリジナルコード
│   └── (macOS Electronアプリの実装)
├── package.json                  # 拡張機能マニフェスト
├── tsconfig.json                 # TypeScript設定
├── README.md                     # プロジェクト概要
└── CLAUDE.md                     # このファイル
```

## 技術スタック

- **言語**: TypeScript
- **フレームワーク**: VS Code Extension API
- **UI**: Webview (HTML/CSS/JavaScript)
- **対象環境**: Windows 10/11、VS Code 1.85.0以降

## 開発ワークフロー

### 初期セットアップ

```bash
# 依存関係のインストール
npm install

# TypeScriptのコンパイル
npm run compile
```

### 開発モードで実行

```bash
# ウォッチモードでTypeScriptをコンパイル
npm run watch

# VS Code内でF5キーを押して拡張機能開発ホストを起動
```

### よく使うコマンド

```bash
# 開発
npm run watch              # ウォッチモードでコンパイル
npm run compile            # 一度だけコンパイル

# リント
npm run lint               # ESLintでコードをチェック

# テスト
npm test                   # テストを実行（今後実装予定）
```

## 実装機能

### ✅ 実装済み

1. **基本的なWebview UI**
   - テキスト入力フィールド
   - 送信・キャンセルボタン
   - VS Codeテーマとの統合

2. **日本語IME対応**
   - `compositionstart`/`compositionend` イベントの処理
   - 変換中の入力を適切に処理
   - 全角トリガー文字（`／` `＠`）のサポート

3. **基本的なトリガー検出**
   - `/` または `／` でスラッシュコマンド候補を表示
   - `@` または `＠` でメンション候補を表示

4. **キーボードショートカット**
   - `Ctrl+Shift+I`: プロンプト入力画面を開く
   - `Ctrl+Enter`: プロンプトを送信
   - `Esc`: キャンセル
   - `↑`/`↓`: 候補リストのナビゲーション

### 🚧 実装予定

1. **スラッシュコマンドの拡張** (Phase 2)
   - マークダウンファイルベースのカスタムコマンドシステム
   - コマンドのプレビュー表示
   - コマンドの履歴・頻度による優先順位付け

2. **メンション機能の実装** (Phase 3)
   - `@file`: ファイルパス参照（ファジーマッチング）
   - `@code`: コードスニペット参照
   - `@doc`: ドキュメント参照
   - `@history`: 履歴からの引用

3. **プレビュー機能** (Phase 4)
   - メンション内容のホバープレビュー
   - 参照ファイルの内容表示

4. **設定とカスタマイズ**
   - カスタムコマンドの追加
   - キーボードショートカットのカスタマイズ
   - UIテーマのカスタマイズ

## 日本語IME対応の実装詳細

### 重要なイベント

```javascript
// IME入力開始
input.addEventListener('compositionstart', () => {
    isComposing = true;
});

// IME入力終了（確定）
input.addEventListener('compositionend', () => {
    isComposing = false;
    // 確定後に処理を実行
    setTimeout(() => {
        handleInput();
    }, 0);
});

// 通常の入力
input.addEventListener('input', (e) => {
    if (!isComposing) {
        handleInput();
    }
});
```

### 全角・半角文字の扱い

トリガー文字は全角・半角の両方に対応：
- `/` と `／` → スラッシュコマンド
- `@` と `＠` → メンション

```javascript
const lastChar = textBeforeCursor[textBeforeCursor.length - 1];

if (lastChar === '/' || lastChar === '／') {
    showSlashCommands();
} else if (lastChar === '@' || lastChar === '＠') {
    showMentions();
}
```

## VS Code拡張機能API

### Webview通信

拡張機能本体とWebview間の通信：

```typescript
// Webview → 拡張機能
vscode.postMessage({
    command: 'submit',
    text: text
});

// 拡張機能 → Webview
this.panel.webview.onDidReceiveMessage(message => {
    switch (message.command) {
        case 'submit':
            this.handleSubmit(message.text);
            break;
    }
});
```

### コマンドの登録

```typescript
const disposable = vscode.commands.registerCommand('ime-prompt.open', () => {
    provider.showWebview();
});

context.subscriptions.push(disposable);
```

## forked-repoとの関係

`forked-repo/` ディレクトリには、オリジナルの [Prompt Line](https://github.com/nkmr-jp/prompt-line) (macOS Electronアプリ) のコードが含まれています。これは参考資料として保持されていますが、**このプロジェクトでは直接使用しません**。

### 参考にする部分

- コマンドシステムの設計思想
- メンション機能のUI/UX
- 日本語IME対応のアプローチ

### 使用しない部分

- Electron関連のコード
- macOS Accessibility API
- ネイティブSwiftツール

## コミットメッセージ規約

Angularコミットメッセージ規約に従ってください：

```
<type>(<scope>): <subject>

type:
  - feat: 新機能
  - fix: バグ修正
  - docs: ドキュメントのみの変更
  - style: コードの意味に影響を与えない変更（空白、フォーマットなど）
  - refactor: バグ修正も機能追加もしないコード変更
  - test: テストの追加や修正
  - chore: ビルドプロセスやツールの変更

例：
feat(webview): 日本語IME対応の入力フィールドを実装
fix(ime): IME確定時の二重入力を修正
docs(readme): セットアップ手順を追加
```

## トラブルシューティング

### TypeScriptコンパイルエラー

```bash
# node_modulesを削除して再インストール
rm -rf node_modules
npm install
npm run compile
```

### 拡張機能が起動しない

1. `out/` ディレクトリが生成されているか確認
2. `npm run compile` を実行
3. VS Codeを再起動

### デバッグ情報の確認

1. 拡張機能開発ホストで `Ctrl+Shift+I` を押してDevToolsを開く
2. Consoleタブでログを確認

## 今後の展開

### Phase 1: 基本機能の完成 ✅
- [x] VS Code拡張機能の基本構造
- [x] Webview UIの実装
- [x] 日本語IME対応
- [x] 基本的なトリガー検出

### Phase 2: コマンドシステム
- [ ] カスタムコマンドの読み込み
- [ ] コマンドパレットUIの改善
- [ ] コマンド履歴機能

### Phase 3: メンション機能
- [ ] ファイル検索とファジーマッチング
- [ ] コードスニペット参照
- [ ] ドキュメント参照
- [ ] 履歴からの引用

### Phase 4: 高度な機能
- [ ] プレビュー機能
- [ ] 設定画面
- [ ] テーマのカスタマイズ
- [ ] テストの追加

## 参考リンク

- [VS Code Extension API](https://code.visualstudio.com/api)
- [Webview API](https://code.visualstudio.com/api/extension-guides/webview)
- [Prompt Line (Original)](https://github.com/nkmr-jp/prompt-line)

## ライセンス

MIT
