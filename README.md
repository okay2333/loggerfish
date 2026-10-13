# LoggerFish v0.5.0

新概念英语2 + 雅思词汇 碎片化学习插件 —— 在 VSCode Output 面板伪装成程序日志，上班摸鱼学英语。

## 功能特性

- **双学习模式**：
  - *新概念模式*：9 个板块（课文、注释、摘要写作、关键句型、难点、练习、选择题、书信写作、作文），左右键切板块/跨课
  - *雅思模式*：22 个雅思常考主题共 **3674 个单词**（单词+词性+中文释义+英文例句+派生词），左右键翻词
- **一键切换模式**：命令面板执行 `LoggerFish：切换学习模式`，两个模式的进度分别记忆
- **配置加载风格伪装**：学习内容伪装成 `[config] text.item_001 = "..."` 的配置加载日志
- **字典查询风格伪装**：雅思词条伪装成 `[dict] dict.lookup = "atmosphere" n. 大气层；氛围` 的调试日志
- **老板键**：一键切换到 TSC + Git 真实开发日志，老板走过来也不怕
- **进度持久化**：学习进度存在 VSCode globalState，重启插件后从上次继续
- **注释保留中英对照**：只有新概念的注释板块保留中文翻译，其余只输出英文

## 快捷键（共 3 个）

| 功能 | Windows | Mac |
|---|---|---|
| 上一个（板块/单词） | `Alt+Shift+[` | `Cmd+Shift+[` |
| 下一个（板块/单词） | `Alt+Shift+]` | `Cmd+Shift+]` |
| 老板键（伪装/恢复） | `Alt+Shift+\` | `Cmd+Shift+\` |

> 三个键都在 P 键右边那一排（`[` `]` `\`），右手不用离开主键区，盲按就能翻。模式切换不占快捷键：在命令面板（`Ctrl+Shift+P`）执行 `LoggerFish：切换学习模式` 即可在新概念 ↔ 雅思之间切换。

## 命令列表

| 命令 | 说明 |
|---|---|
| `LoggerFish：上一个` | 新概念=上一个板块；雅思=上一个单词 |
| `LoggerFish：下一个` | 新概念=下一个板块；雅思=下一个单词 |
| `LoggerFish：老板键` | 切换伪装模式（TSC+Git 日志 ↔ 学习内容） |
| `LoggerFish：切换学习模式` | 在新概念课程 ↔ 雅思词表之间切换 |
| `LoggerFish：显示日志面板` | 显示 Output 面板 |
| `LoggerFish：清空日志` | 清空 Output 面板 |
| `LoggerFish：重置学习进度` | 重置到第 1 课 |
| `LoggerFish：跳转到指定课` | 输入课号跳转（仅新概念模式） |

## 雅思模式日志示例

换主题时第一条输出主题标题，之后每个单词 2-3 行：

```
[14:32:05] INFO  [dict] loading topic: 01_自然地理
[14:32:05] DEBUG [dict] dict.lookup = "atmosphere" n. 大气层；氛围
[14:32:05] DEBUG [dict] dict.example = "The approaching examination created a tense atmosphere on the campus"
[14:32:08] DEBUG [dict] dict.lookup = "parallel" n./adj./v. 平行线；相似之处
[14:32:08] DEBUG [dict] dict.example = "There are few parallels between American football and European football"
[14:32:08] DEBUG [dict] dict.extra = "unparalleled adj. 无比的；无双的"
```

## 雅思词表来源

22 个雅思常考主题（自然地理/植物研究/动物保护/太空探索/学校教育/科技发明/文化历史/语言演化/娱乐运动/物品材料/时尚潮流/饮食健康/建筑场所/交通旅行/国家政府/社会经济/法律法规/沙场争锋/社会角色/行为动作/身心健康/时间日期），共 3674 词。

## 使用方法

### 1. 安装

```bash
# 从源码安装
npm install
npm run compile

# 打包成 .vsix
npm run package
# 然后在 VSCode 中：扩展面板 → ... → Install from VSIX...
```

### 2. 调试

按 `F5` 启动扩展开发宿主，在新窗口中使用快捷键。

### 3. 学习流程

1. 按 `Ctrl+Alt+→` 输出第 1 课课文板块全部内容（默认从课文开始）
2. 看完课文，再按 `Ctrl+Alt+→` 切到注释板块并输出全部
3. 继续按 `Ctrl+Alt+→` 依次过：摘要 → 关键句型 → 难点 → 练习 → 选择题 → 书信 → 作文
4. 一课所有板块学完，再按 `Ctrl+Alt+→` 自动进入第 2 课课文
5. 想复习前面内容，按 `Ctrl+Alt+←` 回上一个板块 / 上一课
6. 老板来了按 `Ctrl+Alt+B` 伪装成开发日志，走了再按一次恢复当前板块

> 边界行为：第 1 课课文按"上一个"会循环回本课最后一个板块；最后一课按"下一个"循环回本课课文。

## 日志格式示例

### 学习模式（一次输出整个板块）

```
[14:32:05] INFO  [config] loading section: Text
[14:32:05] DEBUG [config] text.item_001 = "Last week I went to the theatre."
[14:32:05] DEBUG [config] text.item_002 = "I had a very good seat."
[14:32:05] DEBUG [config] text.item_003 = "The play was very interesting."
[14:32:05] DEBUG [config] text.item_004 = "I did not enjoy it."
```

### 老板键模式（TSC + Git 风格）

```
[tsc] Starting compilation in watch mode...
[tsc] Found 0 errors. Watching for file changes.
[git] On branch feature/login
[git] Your branch is ahead of 'origin/feature/login' by 2 commits.
[git] Changes not staged for commit:
[git]   modified:   src/auth/login.tsx
[git]   modified:   src/auth/types.ts
[git] nothing to commit, working tree clean
```

## 板块说明

| 板块 | 翻译 | 说明 |
|---|---|---|
| Text | 无 | 课文逐句输出 |
| Notes on the text | 保留中英 | 课文注释，`英文 — 中文` 格式 |
| Summary writing | 无 | 摘要写作指令 + 问题 |
| Key structures | 无 | 语法讲解标题 + 英文段落 |
| Special difficulties | 无 | 难点辨析 + 练习 |
| Exercises | 无 | 各部分练习题目 |
| Multiple choice | 无 | 选择题（题干 + 选项，无答案） |
| Letter writing | 无 | 书信写作指令 + 范文 |
| Composition | 无 | 作文指令 + 题目 |

## 项目结构

```
nce2-moyu-extension/
├── src/
│   ├── extension.ts    # 插件入口
│   ├── commands.ts     # 命令注册（7个命令）
│   ├── content.ts      # 内容生成器（9个板块提取）
│   ├── logger.ts       # Output 伪装日志（学习模式 + 老板键模式）
│   ├── progress.ts     # 学习进度管理（globalState）
│   ├── data.ts         # 课程数据加载
│   └── types.ts        # 类型定义
├── data/
│   └── lessons.json    # 96课合并数据（1.67MB）
├── out/                # 编译输出（自动生成）
├── package.json
├── tsconfig.json
└── README.md
```

## 数据说明

- 共 96 课，覆盖新概念英语2 全书
- 数据来源：OCR 识别 + 结构化转换
- 选择题无答案（原书答案页不在 OCR 数据中）
- 部分课缺少某些板块（如 Unit 1 没有书信写作和作文），切换板块时自动跳过空板块

## 版本历史

### v0.4.0
- 快捷键精简为 3 个：`Ctrl+Alt+←` 上一个板块 / `Ctrl+Alt+→` 下一个板块 / `Ctrl+Alt+B` 老板键
- 切换板块时一次输出该板块全部内容
- 新增"上一个板块"命令，支持反向学习和跨课返回
- 删除"输出当前板块全部"命令（切换时已自动输出全部）

### v0.3.0
- 改为一次输出整个板块（不再逐句输出）
- 删除"下一条"和"输出全部"两个命令，合并为"输出当前板块全部"
- 切换板块时自动输出该板块全部内容
- 一课板块全部学完自动进入下一课
- 快捷键精简为 3 个：N / T / B

### v0.2.0
- 重构为 9 个板块连续学习模式
- 新增切换板块命令（Ctrl+Alt+T）
- 新增输出当前板块全部命令（Ctrl+Alt+D）
- 新增老板键伪装模式（Ctrl+Alt+B，TSC+Git 风格）
- 日志格式改为配置加载风格
- 去掉生词板块，注释保留中英对照，其余只输出英文

### v0.1.0
- 初始版本：生词/句子/语法/选择题轮换输出
