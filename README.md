# IME Prompt

Windows向け日本語IME対応のプロンプト入力支援 VS Code 拡張機能

## 概要

IME Promptは、Claude Code風の `/コマンド` と `@メンション` 機能を提供する、日本語入力に最適化されたVS Code拡張機能です。

## 主な機能

- ✅ **日本語IME完全対応**: Windows環境での日本語入力を完全サポート
- 🚀 **スラッシュコマンド**: `/` で始まるコマンドで素早くアクセス
- 📎 **メンション機能**: `@` でファイル、コード、ドキュメントを参照
- 🎨 **モダンなUI**: VS Codeのテーマに完全統合されたWebview UI
- ⌨️ **キーボードショートカット**: `Ctrl+Shift+I` で即座に起動

## 使い方

### 基本的な使い方

1. `Ctrl+Shift+I` (または `Cmd+Shift+I` on macOS) でプロンプト入力画面を開く
2. プロンプトを入力
3. `Ctrl+Enter` で送信、または `Esc` でキャンセル

### スラッシュコマンド

- `/help` - ヘルプを表示
- `/clear` - 入力内容をクリア
- `/history` - 履歴を表示

### メンション機能

- `@file` - ファイルを参照
- `@code` - コードスニペットを参照
- `@doc` - ドキュメントを参照

## 開発

### セットアップ

```bash
npm install
npm run compile
```

### 開発モードで実行

```bash
npm run watch
```

F5キーを押すと、拡張機能開発ホストが起動します。

### ビルド

```bash
npm run compile
```

## プロジェクト構造

```
IME-prompt/
├── src/
│   ├── extension.ts                      # 拡張機能のエントリポイント
│   └── webview/
│       └── PromptWebviewProvider.ts      # Webview UI の実装
├── forked-repo/                           # 参考用 (Prompt Line オリジナル)
├── package.json                           # 拡張機能マニフェスト
├── tsconfig.json                          # TypeScript設定
└── README.md                              # このファイル
```

## ライセンス

MIT

## 謝辞

このプロジェクトは [Prompt Line](https://github.com/nkmr-jp/prompt-line) にインスパイアされています。
