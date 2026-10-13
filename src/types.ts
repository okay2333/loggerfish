/**
 * types.ts —— 数据类型定义
 *
 * 两部分：
 * 1. Lesson 系列：从 lessons.json 读取的每一课数据结构（与 JSON 文件完全一致）
 * 2. 插件运行时类型：板块、进度、摸鱼内容
 */

/* ============================================================
 * 第一部分：课程数据结构（与 lessons.json 一致）
 * ============================================================ */

/** 生词条目 */
export interface VocabularyItem {
  word: string;
  line: string;
  phonetic: string;
  pos: string;
  meaning_zh: string;
}

/** 课文注释条目 */
export interface NoteItem {
  no: number;
  en: string;
  zh?: string;
}

/** 摘要写作 */
export interface SummaryWriting {
  instruction_en?: string;
  instruction_zh?: string;
  word_limit?: number;
  questions: string[];
}

/** 语法讲解中的一段 */
export interface GrammarParagraph {
  lang: 'en' | 'zh' | 'mixed' | 'other';
  text: string;
}

/** 关键句型 */
export interface KeyStructure {
  title_en?: string;
  title_zh?: string;
  content: GrammarParagraph[];
}

/** 难点 */
export interface SpecialDifficulty {
  title_en?: string;
  title_zh?: string;
  content: GrammarParagraph[];
  instruction_en?: string;
  instruction_zh?: string;
  items?: string[];
}

/** 选择题选项 */
export interface McqOption {
  key: 'A' | 'B' | 'C' | 'D';
  text: string;
}

/** 一道选择题 */
export interface McqQuestion {
  question: string;
  options: McqOption[];
}

/** 多项选择 */
export interface MultipleChoice {
  comprehension: McqQuestion[];
  structure: McqQuestion[];
  vocabulary: McqQuestion[];
}

/** 练习的一个部分 */
export interface ExercisePart {
  part?: string;
  instruction_en?: string;
  instruction_zh?: string;
  items?: string[];
}

/** 书信写作 */
export interface LetterWriting {
  instruction_en?: string;
  instruction_zh?: string;
  example?: string;
  exercise_en?: string;
  exercise_zh?: string;
}

/** 作文 */
export interface Composition {
  instruction_en?: string;
  instruction_zh?: string;
  items?: string[];
}

/** 课文内容 */
export interface LessonText {
  content_en: string;
  content_zh?: string;
  illustration_captions?: string[];
}

/** 课程元信息 */
export interface LessonMeta {
  lesson: number;
  unit: number;
  title_en: string;
  title_zh?: string;
  book?: string;
  book_zh?: string;
  listening_question_en?: string;
  listening_question_zh?: string;
}

/** 一整课的数据结构 */
export interface Lesson {
  meta: LessonMeta;
  text: LessonText;
  vocabulary: VocabularyItem[];
  notes: NoteItem[];
  summary_writing?: SummaryWriting;
  key_structures: KeyStructure[];
  special_difficulties: SpecialDifficulty[];
  letter_writing?: LetterWriting;
  composition?: Composition;
  exercises: ExercisePart[];
  multiple_choice?: MultipleChoice;
}

/* ============================================================
 * 第二部分：插件运行时类型
 * ============================================================ */

/**
 * 学习板块类型（9 个，按学习顺序排列）。
 * 注意：不包含生词（用户要求去掉）。
 */
export type SectionType =
  | 'text'
  | 'notes'
  | 'summary'
  | 'key_structures'
  | 'special_difficulties'
  | 'exercises'
  | 'multiple_choice'
  | 'letter_writing'
  | 'composition';

/** 板块顺序（切换板块时按此顺序循环，跳过无内容的板块） */
export const SECTION_ORDER: SectionType[] = [
  'text',
  'notes',
  'summary',
  'key_structures',
  'special_difficulties',
  'exercises',
  'multiple_choice',
  'letter_writing',
  'composition',
];

/** 板块英文标题（输出到日志的第一条） */
export const SECTION_TITLES: Record<SectionType, string> = {
  text: 'Text',
  notes: 'Notes on the text',
  summary: 'Summary writing',
  key_structures: 'Key structures',
  special_difficulties: 'Special difficulties',
  exercises: 'Exercises',
  multiple_choice: 'Multiple choice questions',
  letter_writing: 'Letter writing',
  composition: 'Composition',
};

/** 学习模式：nce2=新概念课文，ielts=雅思词表 */
export type LearnMode = 'nce2' | 'ielts';

/** 雅思词表一条词条 */
export interface VocabWord {
  topic: string;       // 所属主题（如 "01_自然地理"）
  word: string;        // 单词
  phonetic: string;    // 音标（IPA，可为空）
  pos: string;         // 词性（n. / v. / adj.）
  meaning: string;     // 中文释义
  example: string;     // 英文例句
  extra: string;       // 补充（派生词等，可能为空）
}

/** 学习进度（存在 globalState 里） */
export interface Progress {
  currentLesson: number;   // 当前学到第几课（1-96）
  currentSection: number;  // 当前板块索引（0-8，对应 SECTION_ORDER）
  totalShown: number;      // 累计已展示条目数（统计用）
  mode: LearnMode;         // 当前学习模式
  ieltsIndex: number;      // 雅思词表当前词索引（0-3673）
}

/** 一条生成好的摸鱼内容（配置加载风格） */
export interface MoyuContent {
  section: SectionType;  // 所属板块
  lesson: number;         // 所属课号
  configKey: string;      // 伪装的配置键名，如 "summary.item_001"
  configValue: string;    // 伪装的配置值（实际是学习内容）
}
