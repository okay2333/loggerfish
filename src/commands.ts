/**
 * commands.ts —— 命令注册
 *
 * 3 个核心命令（带快捷键）：
 * - loggerfish.prev  上一个           Ctrl+Alt+← / Cmd+Alt+←
 * - loggerfish.next  下一个           Ctrl+Alt+→ / Cmd+Alt+→
 * - loggerfish.boss  老板键（伪装/恢复） Ctrl+Alt+B / Cmd+Alt+B
 *
 * 左右键的行为取决于当前学习模式：
 * - nce2  模式：切换板块/跨课，一次输出整个板块
 * - ielts 模式：翻上一个/下一个雅思单词
 *
 * 5 个辅助命令（无快捷键，命令面板触发）：
 * - loggerfish.toggleMode 切换学习模式（新概念 ↔ 雅思词表）
 * - loggerfish.show        显示日志面板
 * - loggerfish.clear       清空日志
 * - loggerfish.reset       重置学习进度
 * - loggerfish.jump        跳转到指定课（仅 nce2 模式）
 *
 * 老板键状态：
 * - isBossMode = true 时，prev/next 无响应（必须先退出伪装模式）
 * - isBossMode 是内存状态，插件重启后默认 false
 */

import { commands, window, ExtensionContext } from 'vscode';
import { getLesson, getTotalLessons, loadVocab, getVocabCount } from './data';
import {
  getProgress, recordShown, nextSection, prevSection,
  jumpToLesson, resetProgress, getCurrentSectionType,
  toggleMode, nextWord, prevWord,
} from './progress';
import { generateContent, getSectionAllItems, formatVocabWord } from './content';
import {
  logSectionHeader, logContent, logBossMode,
  logVocabHeader, logVocabLine,
  showPanel, clearPanel, logSystem,
} from './logger';
import { SECTION_TITLES } from './types';

/** 老板键模式状态（内存，不持久化） */
let isBossMode = false;

/**
 * 输出"新概念当前板块"的全部内容到 Output 面板。
 * 流程：清空面板 → 输出板块标题 → 逐条输出所有条目 → 更新累计统计。
 */
function outputNce2Section(context: ExtensionContext, extensionPath: string): void {
  const progress = getProgress(context);
  const lesson = getLesson(progress.currentLesson, extensionPath);
  if (!lesson) return;

  const section = getCurrentSectionType(progress);
  const items = getSectionAllItems(lesson, section);
  if (items.length === 0) {
    logSystem(`lesson ${progress.currentLesson} section ${section} has no content`);
    return;
  }

  clearPanel();
  logSectionHeader(section);
  items.forEach((_, i) => {
    const content = generateContent(lesson, section, i);
    if (content) {
      logContent(content);
    }
  });

  recordShown(context, items.length);
  logSystem(`output ${items.length} items from: ${SECTION_TITLES[section]}`);
}

/**
 * 输出"雅思当前单词"到 Output 面板。
 * 换主题时先输出主题标题。
 */
function outputIeltsWord(context: ExtensionContext, extensionPath: string, prevTopic: string): void {
  const progress = getProgress(context);
  const vocab = loadVocab(extensionPath);
  const word = vocab[progress.ieltsIndex % vocab.length];

  clearPanel();
  if (prevTopic !== word.topic) {
    logVocabHeader(word.topic);
  }
  formatVocabWord(word).forEach(line => logVocabLine(line));
}

/**
 * 输出当前学习模式对应的内容（按 mode 分流）。
 */
function outputCurrent(context: ExtensionContext, extensionPath: string): void {
  const progress = getProgress(context);
  if (progress.mode === 'ielts') {
    // ielts 模式：prevTopic 传空字符串，强制输出主题标题（老板键恢复时需要）
    outputIeltsWord(context, extensionPath, '');
  } else {
    outputNce2Section(context, extensionPath);
  }
}

/**
 * 切换（上一个/下一个）并输出内容。按当前模式分流。
 * @param direction 1 = 下一个，-1 = 上一个
 */
function switchAndOutput(context: ExtensionContext, extensionPath: string, direction: 1 | -1): void {
  const progress = getProgress(context);

  if (progress.mode === 'ielts') {
    // 雅思模式：翻词
    const total = getVocabCount(extensionPath);
    const prevTopic = loadVocab(extensionPath)[progress.ieltsIndex % total].topic;
    const newProgress = direction === 1
      ? nextWord(context, total)
      : prevWord(context, total);
    outputIeltsWord(context, extensionPath, prevTopic);
    void newProgress;
    return;
  }

  // 新概念模式：切板块
  const lesson = getLesson(progress.currentLesson, extensionPath);
  if (!lesson) return;

  const totalLessons = getTotalLessons(extensionPath);
  const newProgress = direction === 1
    ? nextSection(context, lesson, totalLessons)
    : prevSection(context, lesson, (n) => getLesson(n, extensionPath));

  // 跨课时提示一课标题
  if (newProgress.currentLesson !== progress.currentLesson) {
    const newLesson = getLesson(newProgress.currentLesson, extensionPath);
    const title = newLesson ? newLesson.meta.title_en : '';
    logSystem(`--- lesson ${newProgress.currentLesson}: ${title} ---`);
  }

  outputNce2Section(context, extensionPath);
}

/**
 * 注册所有命令。
 * 在插件激活时调用一次。
 */
export function registerCommands(context: ExtensionContext): void {
  const extensionPath = context.extensionPath;

  /* ============================================================
   * 核心命令 1：上一个
   * ============================================================ */
  const prevCmd = commands.registerCommand('loggerfish.prev', () => {
    if (isBossMode) return;
    try {
      switchAndOutput(context, extensionPath, -1);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logSystem(`prev failed: ${msg}`);
      window.showErrorMessage(`LoggerFish 出错: ${msg}`);
    }
  });

  /* ============================================================
   * 核心命令 2：下一个
   * ============================================================ */
  const nextCmd = commands.registerCommand('loggerfish.next', () => {
    if (isBossMode) return;
    try {
      switchAndOutput(context, extensionPath, 1);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logSystem(`next failed: ${msg}`);
      window.showErrorMessage(`LoggerFish 出错: ${msg}`);
    }
  });

  /* ============================================================
   * 核心命令 3：老板键（伪装/恢复切换）
   * ============================================================ */
  const bossCmd = commands.registerCommand('loggerfish.boss', () => {
    try {
      if (!isBossMode) {
        isBossMode = true;
        logBossMode();
      } else {
        isBossMode = false;
        outputCurrent(context, extensionPath);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logSystem(`boss key failed: ${msg}`);
    }
  });

  /* ============================================================
   * 辅助命令：切换学习模式（新概念 ↔ 雅思）
   * ============================================================ */
  const toggleCmd = commands.registerCommand('loggerfish.toggleMode', () => {
    if (isBossMode) return;
    const newProgress = toggleMode(context);
    clearPanel();
    outputCurrent(context, extensionPath);
    window.showInformationMessage(
      newProgress.mode === 'ielts'
        ? 'LoggerFish: 已切换到雅思词表模式（左右键翻词）'
        : 'LoggerFish: 已切换到新概念课程模式（左右键切板块）'
    );
  });

  /* ============================================================
   * 辅助命令：显示面板
   * ============================================================ */
  const showCmd = commands.registerCommand('loggerfish.show', () => {
    showPanel();
    if (isBossMode) {
      logSystem('boss mode active. press Ctrl+Alt+B to exit.');
    } else {
      const progress = getProgress(context);
      const mode = progress.mode === 'ielts' ? 'ielts vocab' : 'nce2 lessons';
      logSystem(`ready [${mode}]. Alt+Shift+[/] = prev/next, Alt+Shift+backslash = boss, LoggerFish: toggle mode = switch mode`);
    }
  });

  /* ============================================================
   * 辅助命令：清空日志
   * ============================================================ */
  const clearCmd = commands.registerCommand('loggerfish.clear', () => {
    clearPanel();
    logSystem('log cleared');
    window.showInformationMessage('LoggerFish: 日志已清空');
  });

  /* ============================================================
   * 辅助命令：重置进度
   * ============================================================ */
  const resetCmd = commands.registerCommand('loggerfish.reset', async () => {
    const confirm = await window.showWarningMessage(
      '确定要重置学习进度吗？将回到第 1 课。',
      '确定重置',
      '取消'
    );
    if (confirm === '确定重置') {
      isBossMode = false;
      const fresh = resetProgress(context);
      clearPanel();
      if (fresh.mode === 'ielts') {
        outputIeltsWord(context, extensionPath, '');
      } else {
        logSectionHeader('text');
      }
      logSystem(`progress reset to lesson ${fresh.currentLesson}`);
      window.showInformationMessage('LoggerFish: 进度已重置');
    }
  });

  /* ============================================================
   * 辅助命令：跳转到指定课（仅 nce2 模式有效）
   * ============================================================ */
  const jumpCmd = commands.registerCommand('loggerfish.jump', async () => {
    if (isBossMode) {
      window.showWarningMessage('LoggerFish: 请先退出老板键模式（Ctrl+Alt+B）');
      return;
    }
    const progress = getProgress(context);
    if (progress.mode !== 'nce2') {
      window.showWarningMessage('LoggerFish: 请先切换回新概念课程模式（LoggerFish: toggle mode）');
      return;
    }

    const total = getTotalLessons(extensionPath);
    const input = await window.showInputBox({
      prompt: `输入要跳转到的课号（1-${total}）`,
      placeHolder: '例如：25',
      validateInput: (value) => {
        const n = parseInt(value, 10);
        if (isNaN(n) || n < 1 || n > total) {
          return `请输入 1-${total} 之间的数字`;
        }
        return null;
      },
    });

    if (input) {
      const lessonNo = parseInt(input, 10);
      const lesson = getLesson(lessonNo, extensionPath);
      if (lesson) {
        jumpToLesson(context, lessonNo, lesson);
        clearPanel();
        outputNce2Section(context, extensionPath);
        window.showInformationMessage(`LoggerFish: 已跳转到第 ${lessonNo} 课《${lesson.meta.title_en}》`);
      }
    }
  });

  // 把所有命令加入订阅，插件停用时自动释放
  context.subscriptions.push(
    prevCmd, nextCmd, bossCmd, toggleCmd,
    showCmd, clearCmd, resetCmd, jumpCmd,
  );
}
