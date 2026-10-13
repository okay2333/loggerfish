/**
 * logger.ts —— Output 面板伪装日志
 *
 * 两种日志模式：
 *
 * 1. 学习模式（配置加载风格）
 *    把英语学习内容伪装成程序加载配置文件的日志：
 *      [14:32:05] INFO  [config] loading section: Text
 *      [14:32:05] DEBUG [config] text.item_001 = "Last week I went to the theatre."
 *
 * 2. 老板键模式（TSC + Git 风格）
 *    老板走过来时，一键把面板刷成真实的开发环境日志：
 *      [tsc] Starting compilation in watch mode...
 *      [tsc] Found 0 errors. Watching for file changes.
 *      [git] On branch feature/login
 *      [git] Changes not staged for commit:
 *      [git]   modified:   src/auth/login.tsx
 */

import { window, OutputChannel } from 'vscode';
import type { MoyuContent, SectionType } from './types';
import { SECTION_TITLES } from './types';

/* ============================================================
 * Output 面板单例
 * ============================================================ */

let outputChannel: OutputChannel | null = null;

function getChannel(): OutputChannel {
  if (!outputChannel) {
    // 面板名伪装成开发工具日志
    outputChannel = window.createOutputChannel('Dev Logger');
  }
  return outputChannel;
}

/* ============================================================
 * 时间戳
 * ============================================================ */

function getTimestamp(): string {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

/* ============================================================
 * 学习模式：配置加载风格
 * ============================================================ */

/**
 * 输出板块标题（切换板块时的第一条）。
 * 示例：[14:32:05] INFO  [config] loading section: Text
 */
export function logSectionHeader(section: SectionType): void {
  const channel = getChannel();
  const ts = getTimestamp();
  const title = SECTION_TITLES[section];
  channel.appendLine(`[${ts}] INFO  [config] loading section: ${title}`);
  channel.show(true);
}

/**
 * 输出一条学习内容（配置加载风格）。
 * 示例：[14:32:05] DEBUG [config] text.item_001 = "Last week I went to the theatre."
 */
export function logContent(content: MoyuContent): void {
  const channel = getChannel();
  const ts = getTimestamp();
  // 转义内容中的双引号，避免破坏配置值格式
  const value = content.configValue.replace(/"/g, '\\"');
  channel.appendLine(`[${ts}] DEBUG [config] ${content.configKey} = "${value}"`);
  channel.show(true);
}

/* ============================================================
 * 雅思模式：字典查询风格
 * ============================================================ */

/**
 * 输出雅思词表的主题标题（换主题时第一条）。
 * 示例：[14:32:05] INFO  [dict] loading topic: 01_自然地理
 */
export function logVocabHeader(topic: string): void {
  const channel = getChannel();
  const ts = getTimestamp();
  channel.appendLine(`[${ts}] INFO  [dict] loading topic: ${topic}`);
  channel.show(true);
}

/**
 * 输出一条雅思词条伪装日志行。
 * 示例：[14:32:05] DEBUG [dict] dict.lookup = "atmosphere" n. 大气层；氛围
 *
 * @param line 由 formatVocabWord 生成的行（如 dict.lookup = "..."）
 */
export function logVocabLine(line: string): void {
  const channel = getChannel();
  const ts = getTimestamp();
  channel.appendLine(`[${ts}] DEBUG [dict] ${line}`);
  channel.show(true);
}

/* ============================================================
 * 老板键模式：TSC + Git 伪装日志生成器
 * ============================================================ */

/** TSC 编译日志模板 */
const TSC_LINES = [
  '[tsc] Starting compilation in watch mode...',
  '[tsc] Found 0 errors. Watching for file changes.',
  '[tsc] File change detected. Starting incremental compilation...',
  '[tsc] src/app.tsx(15,3): error TS2322: Type \'string\' is not assignable to type \'number\'.',
  '[tsc] Found 1 error. Watching for file changes.',
  '[tsc] src/components/Button.tsx(22,7): warning TS6133: \'onClick\' is declared but its value is never read.',
  '[tsc] Found 0 errors. Watching for file changes.',
  '[tsc] Starting compilation in watch mode...',
  '[tsc] Found 0 errors. Watching for file changes.',
];

/** Git 状态日志模板 */
const GIT_LINES = [
  '[git] On branch main',
  '[git] Your branch is up to date with \'origin/main\'.',
  '[git] Changes not staged for commit:',
  '[git]   modified:   src/app.tsx',
  '[git]   modified:   src/components/Button.tsx',
  '[git]   modified:   src/utils/helpers.ts',
  '[git] Untracked files:',
  '[git]   src/hooks/useAuth.ts',
  '[git]   src/types/api.ts',
  '[git] no changes added to commit (use "git add" to track)',
  '[git] On branch feature/login',
  '[git] Your branch is ahead of \'origin/feature/login\' by 2 commits.',
  '[git] Changes not staged for commit:',
  '[git]   modified:   src/auth/login.tsx',
  '[git]   modified:   src/auth/types.ts',
  '[git] nothing to commit, working tree clean',
  '[git] On branch develop',
  '[git] Your branch and \'origin/develop\' have diverged.',
];

/** 从数组中随机取 n 个不重复的元素 */
function sample<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

/**
 * 生成老板键伪装日志（TSC + Git 混合，15-20 行）。
 * 每次调用生成不同内容。
 */
function generateBossLog(): string[] {
  const lines: string[] = [];

  // 开头：TSC 启动
  lines.push('[tsc] Starting compilation in watch mode...');
  lines.push('[tsc] Found 0 errors. Watching for file changes.');

  // 中间：随机插入 3-5 条 Git 日志
  const gitSample = sample(GIT_LINES, 3 + Math.floor(Math.random() * 3));
  gitSample.forEach(line => lines.push(line));

  // 中间：随机插入 2-4 条 TSC 日志（可能包含错误/警告，增加真实感）
  const tscSample = sample(TSC_LINES.slice(2), 2 + Math.floor(Math.random() * 3));
  tscSample.forEach(line => lines.push(line));

  // 结尾：Git 状态或 TSC 编译完成
  if (Math.random() > 0.5) {
    lines.push('[git] nothing to commit, working tree clean');
  } else {
    lines.push('[tsc] Found 0 errors. Watching for file changes.');
  }

  return lines;
}

/**
 * 输出老板键伪装日志。
 * 先清空面板，再输出 15-20 行 TSC + Git 混合日志。
 */
export function logBossMode(): void {
  const channel = getChannel();
  channel.clear();
  const lines = generateBossLog();
  lines.forEach(line => channel.appendLine(line));
  channel.show(true);
}

/* ============================================================
 * 通用工具
 * ============================================================ */

/** 显示 Output 面板 */
export function showPanel(): void {
  getChannel().show(true);
}

/** 清空 Output 面板 */
export function clearPanel(): void {
  getChannel().clear();
}

/** 输出一条普通系统日志（用于插件启动提示等） */
export function logSystem(message: string): void {
  const channel = getChannel();
  const ts = getTimestamp();
  channel.appendLine(`[${ts}] INFO  [config] ${message}`);
}

/** dispose 时释放资源 */
export function dispose(): void {
  if (outputChannel) {
    outputChannel.dispose();
    outputChannel = null;
  }
}
