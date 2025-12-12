import * as vscode from 'vscode';
import { PromptWebviewProvider } from './webview/PromptWebviewProvider';

export function activate(context: vscode.ExtensionContext) {
    console.log('IME Prompt extension is now active');

    // Webview Providerを登録
    const provider = new PromptWebviewProvider(context.extensionUri);

    // コマンドを登録
    const disposable = vscode.commands.registerCommand('ime-prompt.open', () => {
        provider.showWebview();
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}
