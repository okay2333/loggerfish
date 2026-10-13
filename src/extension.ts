/**
 * extension.ts —— 插件入口
 *
 * VSCode 插件的主入口文件。
 * - activate()：插件激活时调用（首次执行任意命令时触发）
 * - deactivate()：插件停用时调用
 */

import { ExtensionContext } from 'vscode';
import { loadLessons, getTotalLessons } from './data';
import { registerCommands } from './commands';
import { logSystem, dispose as disposeLogger } from './logger';

/**
 * 插件激活函数。
 * 当用户首次执行任意 loggerfish.* 命令时，VSCode 会调用此函数。
 */
export function activate(context: ExtensionContext): void {
  try {
    // 1. 加载课程数据（首次从磁盘读，之后缓存）
    const lessons = loadLessons(context.extensionPath);
    const total = getTotalLessons(context.extensionPath);

    // 2. 注册所有命令
    registerCommands(context);

    // 3. 输出启动日志（伪装成配置加载）
    logSystem(`service started, loaded ${total} lessons (${lessons.length} entries)`);
    logSystem('shortcuts: Ctrl+Alt+N next | Ctrl+Alt+T section | Ctrl+Alt+D dump | Ctrl+Alt+B boss');
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logSystem(`activation failed: ${msg}`);
    throw err;
  }
}

/**
 * 插件停用函数。
 * 释放 Output 面板等资源。
 */
export function deactivate(): void {
  disposeLogger();
}
