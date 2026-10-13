/**
 * progress.ts —— 学习进度管理
 *
 * 使用 VSCode 插件的 globalState 持久化存储学习进度。
 *
 * 进度字段：
 * - currentLesson：当前学到第几课（1-96，新概念模式用）
 * - currentSection：当前板块索引（0-8，新概念模式用）
 * - totalShown：累计展示条目数（统计用）
 * - mode：当前学习模式（'nce2' 新概念 / 'ielts' 雅思词表）
 * - ieltsIndex：雅思词表当前词索引（0-3673）
 *
 * 学习流程：
 * - 新概念模式：左右键切换板块/跨课，一次输出整个板块
 * - 雅思模式：左右键翻上一个/下一个单词
 */

import type { ExtensionContext } from 'vscode';
import type { Progress, SectionType, LearnMode } from './types';
import { SECTION_ORDER as ORDER } from './types';
import type { Lesson } from './types';
import { hasSectionContent } from './content';

/** globalState 中存储进度的 key */
const STORAGE_KEY = 'loggerfish-progress';

/** 默认进度：第 1 课，第 0 个板块（课文），新概念模式 */
const DEFAULT_PROGRESS: Progress = {
  currentLesson: 1,
  currentSection: 0,
  totalShown: 0,
  mode: 'nce2',
  ieltsIndex: 0,
};

/**
 * 读取当前学习进度。
 * 如果没有存储过，返回默认进度（第 1 课课文板块）。
 */
export function getProgress(context: ExtensionContext): Progress {
  const stored = context.globalState.get<Progress>(STORAGE_KEY);
  if (stored) {
    return { ...DEFAULT_PROGRESS, ...stored };
  }
  return { ...DEFAULT_PROGRESS };
}

/** 保存学习进度到 globalState */
export function saveProgress(context: ExtensionContext, progress: Progress): void {
  context.globalState.update(STORAGE_KEY, progress);
}

/** 获取当前板块类型 */
export function getCurrentSectionType(progress: Progress): SectionType {
  return ORDER[progress.currentSection % ORDER.length];
}

/** 记录本次输出了多少条目（累计展示数 +n） */
export function recordShown(context: ExtensionContext, count: number): void {
  const progress = getProgress(context);
  saveProgress(context, { ...progress, totalShown: progress.totalShown + count });
}

/**
 * 切换到下一个板块（并处理跨课）。
 *
 * 规则：
 * 1. 在当前课内，找当前板块之后第一个有内容的板块 → 切过去
 * 2. 如果当前板块已是本课最后一个有内容的板块 → 进入下一课，从课文板块开始
 * 3. 已是最后一课时，停在课文板块（循环回本课课文）
 *
 * @param context 插件上下文
 * @param lesson 当前课数据（用于判断各板块是否有内容）
 * @param totalLessons 总课数（用于判断是否到最后一课）
 * @returns 更新后的进度
 */
export function nextSection(context: ExtensionContext, lesson: Lesson, totalLessons: number): Progress {
  const progress = getProgress(context);
  const total = ORDER.length;

  // 1. 在当前课内找下一个有内容的板块
  for (let i = progress.currentSection + 1; i < total; i++) {
    const candidateType = ORDER[i];
    if (hasSectionContent(lesson, candidateType)) {
      const updated: Progress = {
        ...progress,
        currentSection: i,
      };
      saveProgress(context, updated);
      return updated;
    }
  }

  // 2. 本课板块已学完 → 进入下一课（最后一课则回到本课课文）
  const nextLesson = Math.min(progress.currentLesson + 1, totalLessons);
  const updated: Progress = {
    ...progress,
    currentLesson: nextLesson,
    currentSection: 0,
  };
  saveProgress(context, updated);
  return updated;
}

/**
 * 切换到上一个板块（并处理跨课）。
 *
 * 规则（与 nextSection 对称）：
 * 1. 在当前课内，找当前板块之前第一个有内容的板块 → 切过去
 * 2. 如果当前板块已是本课第一个有内容的板块 → 回到上一课，从该课最后一个有内容的板块开始
 * 3. 已是第一课时，停在课文板块（循环回本课课文）
 *
 * @param context 插件上下文
 * @param lesson 当前课数据（用于判断各板块是否有内容）
 * @param loadLesson 按课号加载课数据的回调（用于跨课查找）
 * @returns 更新后的进度
 */
export function prevSection(
  context: ExtensionContext,
  lesson: Lesson,
  loadLesson: (lessonNo: number) => Lesson | null | undefined
): Progress {
  const progress = getProgress(context);
  const total = ORDER.length;

  // 1. 在当前课内找上一个有内容的板块
  for (let i = progress.currentSection - 1; i >= 0; i--) {
    const candidateType = ORDER[i];
    if (hasSectionContent(lesson, candidateType)) {
      const updated: Progress = {
        ...progress,
        currentSection: i,
      };
      saveProgress(context, updated);
      return updated;
    }
  }

  // 2. 已是本课第一个有内容板块 → 回上一课，取该课最后一个有内容的板块
  const prevLessonNo = Math.max(progress.currentLesson - 1, 1);
  const prevLesson = loadLesson(prevLessonNo);
  let sectionIdx = 0;
  if (prevLesson) {
    for (let i = total - 1; i >= 0; i--) {
      if (hasSectionContent(prevLesson, ORDER[i])) {
        sectionIdx = i;
        break;
      }
    }
  }

  const updated: Progress = {
    ...progress,
    currentLesson: prevLessonNo,
    currentSection: sectionIdx,
  };
  saveProgress(context, updated);
  return updated;
}

/**
 * 跳转到指定课。
 * 跳课后板块重置为第 0 个（课文）。
 * 如果目标课的课文板块无内容（理论上不会），自动找下一个有内容的板块。
 */
export function jumpToLesson(context: ExtensionContext, lessonNo: number, lesson: Lesson): Progress {
  let sectionIdx = 0;
  if (!hasSectionContent(lesson, ORDER[0])) {
    for (let i = 1; i < ORDER.length; i++) {
      if (hasSectionContent(lesson, ORDER[i])) {
        sectionIdx = i;
        break;
      }
    }
  }

  const progress = getProgress(context);
  const updated: Progress = {
    ...progress,
    currentLesson: lessonNo,
    currentSection: sectionIdx,
  };
  saveProgress(context, updated);
  return updated;
}

/** 重置进度到第 1 课 */
export function resetProgress(context: ExtensionContext): Progress {
  const fresh = { ...DEFAULT_PROGRESS };
  saveProgress(context, fresh);
  return fresh;
}

/* ============================================================
 * 雅思模式
 * ============================================================ */

/** 切换学习模式（新概念 ↔ 雅思词表） */
export function toggleMode(context: ExtensionContext): Progress {
  const progress = getProgress(context);
  const updated: Progress = {
    ...progress,
    mode: progress.mode === 'nce2' ? 'ielts' : 'nce2' as LearnMode,
  };
  saveProgress(context, updated);
  return updated;
}

/**
 * 雅思模式下翻到下一个词（循环：到末尾回到第 0 个）。
 * @param totalWords 词表总条数
 */
export function nextWord(context: ExtensionContext, totalWords: number): Progress {
  const progress = getProgress(context);
  const next = (progress.ieltsIndex + 1) % totalWords;
  const updated: Progress = { ...progress, ieltsIndex: next, totalShown: progress.totalShown + 1 };
  saveProgress(context, updated);
  return updated;
}

/**
 * 雅思模式下翻到上一个词（循环：到开头回到最后一个）。
 * @param totalWords 词表总条数
 */
export function prevWord(context: ExtensionContext, totalWords: number): Progress {
  const progress = getProgress(context);
  const prev = (progress.ieltsIndex - 1 + totalWords) % totalWords;
  const updated: Progress = { ...progress, ieltsIndex: prev, totalShown: progress.totalShown + 1 };
  saveProgress(context, updated);
  return updated;
}
