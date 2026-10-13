/**
 * data.ts —— 课程数据加载
 *
 * 负责从插件目录的 data/lessons.json 读取全部 96 课数据。
 * 插件激活时加载一次，之后缓存在内存中。
 */

import * as fs from 'fs';
import * as path from 'path';
import type { Lesson } from './types';

/** 全部课程数据（加载后缓存） */
let lessonsCache: Lesson[] | null = null;

/**
 * 加载全部课程数据。
 * 第一次调用时从磁盘读取，之后直接返回缓存。
 *
 * @param extensionPath 插件安装目录路径（由 VSCode 传入 context.extensionPath）
 * @returns 全部 96 课数据，按课号排序
 */
export function loadLessons(extensionPath: string): Lesson[] {
  if (lessonsCache) {
    return lessonsCache;
  }

  // data/lessons.json 与 src/ 同级，在插件根目录下
  const dataPath = path.join(extensionPath, 'data', 'lessons.json');

  if (!fs.existsSync(dataPath)) {
    throw new Error(`课程数据文件不存在: ${dataPath}`);
  }

  const raw = fs.readFileSync(dataPath, 'utf-8');
  const lessons = JSON.parse(raw) as Lesson[];

  // 按课号排序，确保顺序正确
  lessons.sort((a, b) => a.meta.lesson - b.meta.lesson);

  lessonsCache = lessons;
  return lessons;
}

/**
 * 获取指定课号的课程数据。
 *
 * @param lessonNo 课号 1-96
 * @param extensionPath 插件目录（首次加载时需要）
 * @returns 对应课程，找不到返回 null
 */
export function getLesson(lessonNo: number, extensionPath: string): Lesson | null {
  const lessons = loadLessons(extensionPath);
  return lessons.find(l => l.meta.lesson === lessonNo) ?? null;
}

/** 获取总课数 */
export function getTotalLessons(extensionPath: string): number {
  return loadLessons(extensionPath).length;
}

/* ============================================================
 * 雅思词表数据
 * ============================================================ */

/** 全部雅思词表（加载后缓存） */
let vocabCache: import('./types').VocabWord[] | null = null;

/**
 * 加载雅思词表（3674 条）。
 * 第一次调用时从磁盘读取，之后直接返回缓存。
 */
export function loadVocab(extensionPath: string): import('./types').VocabWord[] {
  if (vocabCache) {
    return vocabCache;
  }

  const dataPath = path.join(extensionPath, 'data', 'ielts.json');
  if (!fs.existsSync(dataPath)) {
    throw new Error(`雅思词表文件不存在: ${dataPath}`);
  }

  const raw = fs.readFileSync(dataPath, 'utf-8');
  vocabCache = JSON.parse(raw) as import('./types').VocabWord[];
  return vocabCache;
}

/** 获取雅思词表总词条数 */
export function getVocabCount(extensionPath: string): number {
  return loadVocab(extensionPath).length;
}
