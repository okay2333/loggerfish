/**
 * content.ts —— 摸鱼内容生成器（按板块连续输出）
 *
 * 根据当前学习进度（第几课、哪个板块、板块内第几条），从课程数据中提取一条。
 *
 * 9 个板块（按学习顺序，不含生词）：
 *   1. text                 课文（逐句输出，无翻译）
 *   2. notes                课文注释（保留中英对照）
 *   3. summary              摘要写作（只英文）
 *   4. key_structures       关键句型（只英文）
 *   5. special_difficulties 难点（只英文）
 *   6. exercises            练习（只英文）
 *   7. multiple_choice      选择题（只英文，无答案）
 *   8. letter_writing       书信写作（只英文）
 *   9. composition          作文（只英文）
 *
 * 翻译规则：只有 notes 板块保留中文，其余板块只输出英文。
 */

import type { Lesson, MoyuContent, SectionType, VocabWord } from './types';

/* ============================================================
 * 工具函数
 * ============================================================ */

/** 清理句子开头的 OCR 噪声（重复小写字母 + 数字编号） */
function cleanLine(s: string): string {
  return s
    .replace(/^(ff|aa|zz|oo|ee|tt|ss|ll|mm|nn|pp|rr|bb|cc|dd|gg|hh|jj|kk|qq|uu|vv|ww|xx|yy)\s+/i, '')
    .replace(/^\d+\s+/, '')
    .trim();
}

/** 从一段文本中取第一个完整句子（到 . ! ? 为止），避免截断 */
function firstSentence(text: string): string {
  const match = text.match(/^[^.!?]*[.!?]/);
  return match ? match[0].trim() : text.slice(0, 120).trim();
}

/** 从语法段落数组中提取英文段落（跳过纯中文） */
function extractEnParagraphs(content: { lang: string; text: string }[]): string[] {
  return content
    .filter(p => p.lang === 'en' || p.lang === 'mixed')
    .map(p => firstSentence(p.text))
    .filter(s => s.length > 0);
}

/* ============================================================
 * 各板块条目提取函数
 * 每个函数返回该板块的所有条目（字符串数组）
 * ============================================================ */

/** 课文板块：按句子分割，逐句输出（只英文） */
function extractTextItems(lesson: Lesson): string[] {
  const text = lesson.text.content_en ?? '';
  const raw = text.split(/(?<=[.!?])\s+/);
  return raw
    .map(cleanLine)
    .filter(s => s.length > 0 && s.length < 250);
}

/** 课文注释板块：保留中英对照（en — zh） */
function extractNotesItems(lesson: Lesson): string[] {
  return (lesson.notes ?? [])
    .map(n => (n.zh ? `${n.en} — ${n.zh}` : n.en))
    .filter(s => s.length > 0);
}

/** 摘要写作板块：指令 + 问题（只英文） */
function extractSummaryItems(lesson: Lesson): string[] {
  const sw = lesson.summary_writing;
  if (!sw) return [];
  const items: string[] = [];
  if (sw.instruction_en) items.push(sw.instruction_en);
  (sw.questions ?? []).forEach(q => items.push(q));
  return items.filter(s => s.length > 0);
}

/** 关键句型板块：标题 + 英文讲解段落（只英文） */
function extractKeyStructuresItems(lesson: Lesson): string[] {
  const items: string[] = [];
  (lesson.key_structures ?? []).forEach(ks => {
    if (ks.title_en && ks.title_en.length <= 80 && !ks.title_en.includes('.')) {
      items.push(ks.title_en);
    }
    extractEnParagraphs(ks.content).forEach(p => items.push(p));
  });
  return items.filter(s => s.length > 0);
}

/** 难点板块：标题 + 英文讲解 + 指令 + 题目（只英文） */
function extractSpecialDifficultiesItems(lesson: Lesson): string[] {
  const items: string[] = [];
  (lesson.special_difficulties ?? []).forEach(sd => {
    if (sd.title_en && sd.title_en.length <= 80 && !sd.title_en.includes('.')) {
      items.push(sd.title_en);
    }
    extractEnParagraphs(sd.content).forEach(p => items.push(p));
    if (sd.instruction_en) items.push(sd.instruction_en);
    (sd.items ?? []).forEach(item => items.push(item));
  });
  return items.filter(s => s.length > 0);
}

/** 练习板块：每部分指令 + 题目（只英文） */
function extractExercisesItems(lesson: Lesson): string[] {
  const items: string[] = [];
  (lesson.exercises ?? []).forEach(ex => {
    const header = [ex.part, ex.instruction_en].filter(Boolean).join(' ');
    if (header) items.push(header);
    (ex.items ?? []).forEach(item => items.push(item));
  });
  return items.filter(s => s.length > 0);
}

/** 选择题板块：合并三块，题干 + 选项（只英文，无答案） */
function extractMultipleChoiceItems(lesson: Lesson): string[] {
  const mcq = lesson.multiple_choice;
  if (!mcq) return [];
  const all = [
    ...mcq.comprehension,
    ...mcq.structure,
    ...mcq.vocabulary,
  ];
  return all.map(q => {
    const question = cleanLine(q.question);
    const options = (q.options ?? [])
      .map(o => `${o.key}) ${o.text}`)
      .join(' ');
    return options ? `${question} ${options}` : question;
  }).filter(s => s.length > 0);
}

/** 书信写作板块：指令 + 范文 + 练习（只英文） */
function extractLetterWritingItems(lesson: Lesson): string[] {
  const lw = lesson.letter_writing;
  if (!lw) return [];
  const items: string[] = [];
  if (lw.instruction_en) items.push(lw.instruction_en);
  if (lw.example) items.push(lw.example);
  if (lw.exercise_en) items.push(lw.exercise_en);
  return items.filter(s => s.length > 0);
}

/** 作文板块：指令 + 题目（只英文） */
function extractCompositionItems(lesson: Lesson): string[] {
  const cp = lesson.composition;
  if (!cp) return [];
  const items: string[] = [];
  if (cp.instruction_en) items.push(cp.instruction_en);
  (cp.items ?? []).forEach(item => items.push(item));
  return items.filter(s => s.length > 0);
}

/* ============================================================
 * 统一入口
 * ============================================================ */

/** 根据板块类型获取所有条目 */
function getSectionItems(lesson: Lesson, section: SectionType): string[] {
  switch (section) {
    case 'text':              return extractTextItems(lesson);
    case 'notes':             return extractNotesItems(lesson);
    case 'summary':           return extractSummaryItems(lesson);
    case 'key_structures':    return extractKeyStructuresItems(lesson);
    case 'special_difficulties': return extractSpecialDifficultiesItems(lesson);
    case 'exercises':         return extractExercisesItems(lesson);
    case 'multiple_choice':   return extractMultipleChoiceItems(lesson);
    case 'letter_writing':    return extractLetterWritingItems(lesson);
    case 'composition':       return extractCompositionItems(lesson);
    default:                  return [];
  }
}

/** 判断指定板块是否有内容（用于切换板块时跳过空板块） */
export function hasSectionContent(lesson: Lesson, section: SectionType): boolean {
  return getSectionItems(lesson, section).length > 0;
}

/** 获取指定板块的条目总数 */
export function getSectionItemCount(lesson: Lesson, section: SectionType): number {
  return getSectionItems(lesson, section).length;
}

/**
 * 生成一条摸鱼内容。
 *
 * @param lesson 当前课程数据
 * @param section 当前板块
 * @param index 板块内条目索引
 * @returns 一条摸鱼内容；如果该板块无内容，返回 null
 */
export function generateContent(lesson: Lesson, section: SectionType, index: number): MoyuContent | null {
  const items = getSectionItems(lesson, section);
  if (items.length === 0) return null;

  const item = items[index % items.length];
  const itemNo = String((index % items.length) + 1).padStart(3, '0');

  return {
    section,
    lesson: lesson.meta.lesson,
    configKey: `${section}.item_${itemNo}`,
    configValue: item,
  };
}

/**
 * 获取指定板块的全部条目（一次性输出整个模块用）。
 * 与 generateContent 共用同一提取逻辑，只是返回数组。
 */
export function getSectionAllItems(lesson: Lesson, section: SectionType): string[] {
  return getSectionItems(lesson, section);
}

/* ============================================================
 * 雅思词表：伪装日志格式化
 * ============================================================ */

/**
 * 把一个雅思词条格式化成 2-3 行伪装日志。
 * 伪装成字典查询服务的调试日志，和课文的 config 风格区分开但同样不起眼。
 *
 * 输出示例：
 *   DEBUG [dict] lookup  = "atmosphere" /ˈætməsfɪr/ n. 大气层；氛围
 *   DEBUG [dict] example = "The approaching examination created a tense atmosphere on the campus"
 *   DEBUG [dict] extra   = "unparalleled adj. 无比的；无双的"   (仅 extra 非空时)
 *
 * @param word 词条数据
 * @returns 伪装日志行数组（不含时间戳和 level 前缀，由 logger 统一加）
 */
export function formatVocabWord(word: VocabWord): string[] {
  const lines: string[] = [];
  // 单词行：lookup = "word" /音标/ pos meaning（有音标时插入）
  const phonetic = word.phonetic ? ` /${word.phonetic}/` : '';
  lines.push(`dict.lookup = "${word.word}"${phonetic} ${word.pos} ${word.meaning}`.trim());
  // 例句行
  if (word.example) {
    lines.push(`dict.example = "${word.example}"`);
  }
  // 派生词行（可选）
  if (word.extra) {
    lines.push(`dict.extra = "${word.extra}"`);
  }
  return lines;
}
