import * as vscode from 'vscode';
import { registerAllCommands } from './libs/commands';

/// 插件入口
export function activate(context: vscode.ExtensionContext) {
	/// 注册所有命令
	registerAllCommands(context);
}

export function deactivate() {}
