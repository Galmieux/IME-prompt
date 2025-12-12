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

    private handleSubmit(text: string) {
        // アクティブなターミナルを取得
        const terminal = vscode.window.activeTerminal;

        if (terminal) {
            // ターミナルにテキストを送信
            terminal.sendText(text);

            // パネルを閉じる
            this.panel?.dispose();
        } else {
            // ターミナルがない場合はエラーメッセージを表示
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
            padding: 20px;
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
        }

        .container {
            max-width: 800px;
            margin: 0 auto;
        }

        h1 {
            font-size: 24px;
            margin-bottom: 20px;
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
            justify-content: flex-end;
        }

        button {
            padding: 8px 16px;
            font-size: 14px;
            border: none;
            border-radius: 4px;
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

        .info-text {
            margin-top: 10px;
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
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
        <h1>📝 IME Prompt</h1>

        <div class="input-container">
            <textarea
                id="prompt-input"
                placeholder="プロンプトを入力してください...

/ でコマンドを表示
@ でファイルやコンテキストを参照"
                autofocus
            ></textarea>

            <div id="suggestion-list" class="suggestion-list"></div>
        </div>

        <div class="button-container">
            <button class="secondary-button" id="cancel-button">キャンセル</button>
            <button class="primary-button" id="submit-button">送信 (Ctrl+Enter)</button>
        </div>

        <div class="info-text">
            ヒント: Ctrl+Enter で送信、Esc でキャンセル
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

                // カーソル位置の前の文字を取得
                const textBeforeCursor = text.substring(0, cursorPos);

                // / または @ のトリガーをチェック（全角も対応）
                const lastChar = textBeforeCursor[textBeforeCursor.length - 1];

                if (lastChar === '/' || lastChar === '／') {
                    showSlashCommands();
                } else if (lastChar === '@' || lastChar === '＠') {
                    showMentions();
                } else {
                    hideSuggestions();
                }
            }

            function showSlashCommands() {
                // TODO: 実際のコマンドリストを取得
                currentSuggestions = [
                    { label: '/help', description: 'ヘルプを表示' },
                    { label: '/clear', description: '入力内容をクリア' },
                    { label: '/history', description: '履歴を表示' }
                ];
                renderSuggestions();
            }

            function showMentions() {
                // TODO: 実際のメンション候補を取得
                currentSuggestions = [
                    { label: '@file', description: 'ファイルを参照' },
                    { label: '@code', description: 'コードスニペットを参照' },
                    { label: '@doc', description: 'ドキュメントを参照' }
                ];
                renderSuggestions();
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
