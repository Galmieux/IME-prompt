import * as vscode from 'vscode';
import * as path from 'path';

export class PromptWebviewProvider {
    private panel: vscode.WebviewPanel | undefined;

    constructor(private readonly extensionUri: vscode.Uri) {}

    public showWebview() {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // Webviewパネルが既に存在する場合は表示
        if (this.panel) {
            this.panel.reveal(column);
            // 入力フィールドにフォーカスを当てる
            this.panel.webview.postMessage({ command: 'focus' });
            return;
        }

        // 新しいWebviewパネルを作成
        this.panel = vscode.window.createWebviewPanel(
            'imePrompt',
            'IME Prompt',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(this.extensionUri, 'media')
                ]
            }
        );

        // WebviewのHTMLコンテンツを設定
        this.panel.webview.html = this.getHtmlForWebview(this.panel.webview);

        // Webviewからのメッセージを処理
        this.panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'submit':
                        this.handleSubmit(message.text);
                        break;
                    case 'cancel':
                        this.panel?.dispose();
                        break;
                    case 'sendToTerminal':
                        this.sendToTerminalAndFocus(message.text);
                        break;
                }
            },
            undefined,
            []
        );

        // パネルが閉じられたときの処理
        this.panel.onDidDispose(
            () => {
                this.panel = undefined;
            },
            null,
            []
        );
    }

    private async handleSubmit(text: string) {
        // アクティブなターミナルを取得
        const terminal = vscode.window.activeTerminal;

        if (terminal) {
            // ターミナルをアクティブにする
            terminal.show();

            // テキストを送信（改行なし）
            terminal.sendText(text, false);

            // 少し待ってからEnterキーを送信
            await new Promise(resolve => setTimeout(resolve, 50));

            // Enterキーを送信（複数の方法を試す）
            await vscode.commands.executeCommand('workbench.action.terminal.sendSequence', {
                text: '\x0d'  // Carriage Return (Enter)
            });

            // 入力フィールドをクリアするメッセージをWebviewに送信
            this.panel?.webview.postMessage({ command: 'clear' });
        } else {
            // ターミナルがない場合はエラーメッセージを表示
            vscode.window.showWarningMessage('アクティブなターミナルがありません。Claude Codeを起動してください。');
        }
    }

    private async sendToTerminalAndFocus(text: string) {
        // アクティブなターミナルを取得
        const terminal = vscode.window.activeTerminal;

        if (terminal) {
            // ターミナルにフォーカスを移動
            terminal.show();

            // テキストを送信（改行なし）
            terminal.sendText(text, false);

            // ターミナルにフォーカスを確実に移動
            await vscode.commands.executeCommand('workbench.action.terminal.focus');
        } else {
            vscode.window.showWarningMessage('アクティブなターミナルがありません。Claude Codeを起動してください。');
        }
    }

    private getHtmlForWebview(webview: vscode.Webview): string {
        // CSS用のnonce値を生成（セキュリティのため）
        const nonce = this.getNonce();

        return `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
    <title>IME Prompt</title>
    <style>
        body {
            padding: 8px 20px 20px 20px;
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
        }

        .container {
            max-width: 800px;
            margin: 0 auto;
        }

        .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 16px;
        }

        h1 {
            font-size: 24px;
            margin: 0;
            color: var(--vscode-foreground);
        }

        .input-container {
            position: relative;
            margin-bottom: 20px;
        }

        #prompt-input {
            width: 100%;
            min-height: 200px;
            padding: 12px;
            font-family: var(--vscode-editor-font-family);
            font-size: var(--vscode-editor-font-size);
            color: var(--vscode-input-foreground);
            background-color: var(--vscode-input-background);
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
            resize: vertical;
            box-sizing: border-box;
        }

        #prompt-input:focus {
            outline: 1px solid var(--vscode-focusBorder);
        }

        .button-container {
            display: flex;
            gap: 10px;
        }

        button {
            padding: 6px 12px;
            font-size: 12px;
            border: none;
            border-radius: 3px;
            cursor: pointer;
            transition: background-color 0.2s;
        }

        .primary-button {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
        }

        .primary-button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }

        .secondary-button {
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }

        .secondary-button:hover {
            background-color: var(--vscode-button-secondaryHoverBackground);
        }

        .suggestion-list {
            display: none;
            position: absolute;
            background-color: var(--vscode-editorSuggestWidget-background);
            border: 1px solid var(--vscode-editorSuggestWidget-border);
            border-radius: 4px;
            max-height: 300px;
            overflow-y: auto;
            z-index: 1000;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }

        .suggestion-item {
            padding: 8px 12px;
            cursor: pointer;
            border-bottom: 1px solid var(--vscode-editorSuggestWidget-border);
        }

        .suggestion-item:last-child {
            border-bottom: none;
        }

        .suggestion-item:hover,
        .suggestion-item.selected {
            background-color: var(--vscode-editorSuggestWidget-selectedBackground);
        }

        .suggestion-label {
            font-weight: bold;
            color: var(--vscode-editorSuggestWidget-foreground);
        }

        .suggestion-description {
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
            margin-top: 2px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📝 IME Prompt</h1>
            <div class="button-container">
                <button class="secondary-button" id="cancel-button">キャンセル</button>
                <button class="primary-button" id="submit-button">送信 (Ctrl+Enter)</button>
            </div>
        </div>

        <div class="input-container">
            <textarea
                id="prompt-input"
                placeholder="プロンプトを入力してください...

「Ctrl+Enter」：送信
「/」「@」「#」：ターミナルへ
「Ctrl+Shift+I」：IME Promptに戻る"
                autofocus
            ></textarea>

            <div id="suggestion-list" class="suggestion-list"></div>
        </div>
    </div>

    <script nonce="${nonce}">
        (function() {
            const vscode = acquireVsCodeApi();
            const input = document.getElementById('prompt-input');
            const submitButton = document.getElementById('submit-button');
            const cancelButton = document.getElementById('cancel-button');
            const suggestionList = document.getElementById('suggestion-list');

            let currentSuggestions = [];
            let selectedSuggestionIndex = -1;

            // IME入力状態を追跡
            let isComposing = false;

            // IME入力開始
            input.addEventListener('compositionstart', () => {
                isComposing = true;
            });

            // IME入力終了
            input.addEventListener('compositionend', () => {
                isComposing = false;
                // 確定後に処理を実行
                setTimeout(() => {
                    handleInput();
                }, 0);
            });

            // 入力処理
            input.addEventListener('input', (e) => {
                if (!isComposing) {
                    handleInput();
                }
            });

            function handleInput() {
                const text = input.value;
                const cursorPos = input.selectionStart;

                // 先頭文字がトリガー文字かチェック
                const firstChar = text[0];

                // 先頭に / @ # を入力した場合、ターミナルに送信してフォーカス移動
                if (text.length === 1 && (
                    firstChar === '/' || firstChar === '／' ||
                    firstChar === '@' || firstChar === '＠' ||
                    firstChar === '#' || firstChar === '＃'
                )) {
                    // 半角に正規化
                    const normalizedChar = normalizeToHalfWidth(firstChar);

                    // ターミナルに送信
                    vscode.postMessage({
                        command: 'sendToTerminal',
                        text: normalizedChar
                    });

                    // 入力フィールドをクリア
                    input.value = '';
                    return;
                }
            }

            // 全角を半角に変換
            function normalizeToHalfWidth(char) {
                const map = {
                    '／': '/',
                    '＠': '@',
                    '＃': '#'
                };
                return map[char] || char;
            }

            function renderSuggestions() {
                if (currentSuggestions.length === 0) {
                    hideSuggestions();
                    return;
                }

                suggestionList.innerHTML = currentSuggestions.map((suggestion, index) =>
                    '<div class="suggestion-item" data-index="' + index + '">' +
                        '<div class="suggestion-label">' + suggestion.label + '</div>' +
                        '<div class="suggestion-description">' + suggestion.description + '</div>' +
                    '</div>'
                ).join('');

                suggestionList.style.display = 'block';
                selectedSuggestionIndex = -1;

                // 候補アイテムのクリックイベント
                suggestionList.querySelectorAll('.suggestion-item').forEach(item => {
                    item.addEventListener('click', () => {
                        selectSuggestion(parseInt(item.dataset.index));
                    });
                });
            }

            function hideSuggestions() {
                suggestionList.style.display = 'none';
                currentSuggestions = [];
                selectedSuggestionIndex = -1;
            }

            function selectSuggestion(index) {
                if (index < 0 || index >= currentSuggestions.length) return;

                const suggestion = currentSuggestions[index];
                const cursorPos = input.selectionStart;
                const text = input.value;

                // トリガー文字を見つけて置換
                const textBeforeCursor = text.substring(0, cursorPos);
                const lastTriggerIndex = Math.max(
                    textBeforeCursor.lastIndexOf('/'),
                    textBeforeCursor.lastIndexOf('／'),
                    textBeforeCursor.lastIndexOf('@'),
                    textBeforeCursor.lastIndexOf('＠')
                );

                if (lastTriggerIndex >= 0) {
                    const newText = text.substring(0, lastTriggerIndex) +
                                  suggestion.label + ' ' +
                                  text.substring(cursorPos);
                    input.value = newText;
                    input.selectionStart = input.selectionEnd = lastTriggerIndex + suggestion.label.length + 1;
                }

                hideSuggestions();
                input.focus();
            }

            // キーボード操作
            input.addEventListener('keydown', (e) => {
                // 候補リストが表示されている場合
                if (suggestionList.style.display === 'block') {
                    if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        selectedSuggestionIndex = Math.min(
                            selectedSuggestionIndex + 1,
                            currentSuggestions.length - 1
                        );
                        updateSelectedSuggestion();
                    } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        selectedSuggestionIndex = Math.max(selectedSuggestionIndex - 1, 0);
                        updateSelectedSuggestion();
                    } else if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (selectedSuggestionIndex >= 0) {
                            selectSuggestion(selectedSuggestionIndex);
                        }
                        return;
                    } else if (e.key === 'Escape') {
                        e.preventDefault();
                        hideSuggestions();
                        return;
                    }
                }

                // Ctrl+Enter で送信
                if (e.key === 'Enter' && e.ctrlKey) {
                    e.preventDefault();
                    submitPrompt();
                }

                // Escape でキャンセル（候補リストが表示されていない場合）
                if (e.key === 'Escape' && suggestionList.style.display === 'none') {
                    e.preventDefault();
                    cancel();
                }
            });

            function updateSelectedSuggestion() {
                const items = suggestionList.querySelectorAll('.suggestion-item');
                items.forEach((item, index) => {
                    item.classList.toggle('selected', index === selectedSuggestionIndex);
                });
            }

            function submitPrompt() {
                const text = input.value.trim();
                if (text) {
                    vscode.postMessage({
                        command: 'submit',
                        text: text
                    });
                }
            }

            function cancel() {
                vscode.postMessage({
                    command: 'cancel'
                });
            }

            // ボタンのイベントリスナー
            submitButton.addEventListener('click', submitPrompt);
            cancelButton.addEventListener('click', cancel);

            // 拡張機能からのメッセージを受信
            window.addEventListener('message', event => {
                const message = event.data;
                switch (message.command) {
                    case 'clear':
                        // 入力フィールドをクリア
                        input.value = '';
                        input.focus();
                        break;
                    case 'focus':
                        // 入力フィールドにフォーカスを当てる
                        input.focus();
                        break;
                }
            });
        })();
    </script>
</body>
</html>`;
    }

    private getNonce(): string {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }
}
