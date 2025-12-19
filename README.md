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
3. `Enter` で送信、`Shift+Enter` で改行
4. `Esc` でキャンセル

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

## 運用・アップデート方法

この拡張機能をローカルで運用・更新する方法です。

### インストール方法

1. VS Code の拡張機能サイドバーを開きます。
2. 右上の「...」メニューをクリックします。
3. 「VSIX からのインストール...」を選択し、作成された `.vsix` ファイル（例: `ime-prompt-0.1.0.vsix`）を選択します。

### アップデート方法

1. `package.json` の `"version"` を変更します（例: `"0.1.0"` → `"0.1.1"`）。
2. 以下のコマンドでパッケージを再作成します。
   ```bash
   npx vsce package --no-dependencies
   ```
   ※ エラーが出た場合は `npm run compile` を先に実行してください。
3. 作成された新しい `.vsix` ファイルを同様にインストールします（上書き更新されます）。

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
