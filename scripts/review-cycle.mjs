#!/usr/bin/env node
/**
 * review-cycle.mjs —— AI 学习助教的核心可调用数据链
 * ------------------------------------------------------------------
 * 它把「错题讲解 → 记录 → 遗忘曲线调度 → 到期复习 → 自评降频 → 掌握」做成
 * agent 真实可运行的命令闭环，让记忆管理不再是口头建议。
 *
 * 用法：
 *   node scripts/review-cycle.mjs schedule            # 打印遗忘间隔表（1/3/7/15/30 天）
 *   node scripts/review-cycle.mjs dimensions            # 查看内置学科维度（难度/题型/知识点）
 *   node scripts/review-cycle.mjs dimensions --subject 数学
 *   node scripts/review-cycle.mjs add \
 *       --subject 数学 --knowledge 二次函数 --difficulty 中 --qtype 计算 --title "..." \
 *       --mistake "..." --answer "..." --type 思路型 \
 *       --tags "判别式,数形结合" --importance high
 *   node scripts/review-cycle.mjs due                 # 今天到期待复习（可 --date 指定，--subject 过滤）
 *   node scripts/review-cycle.mjs card <id>           # 出一张复习卡（遮答案，先让学生独立重做）
 *   node scripts/review-cycle.mjs done <id> --result correct|wrong [--exam]
 *                                                   # 自评推进：做对→升间隔/掌握；做错→重置间隔
 *                                                   # --exam 表示"盖答案重做后判分"的闭卷模式
 *   node scripts/review-cycle.mjs list [--subject 数学] [--knowledge 函数] [--difficulty 难] [--qtype 计算] [--mastery 复习中|将掌握|已掌握]
 *   node scripts/review-cycle.mjs stats
 *   node scripts/review-cycle.mjs rm <id>
 *
 * 数据文件：data/mistake-book.json（默认，可用 MISTAKE_BOOK_FILE 覆盖）
 * 与 mistake-book.mjs 共用同一数据文件，字段向后兼容。
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = process.env.MISTAKE_BOOK_FILE
  ? path.resolve(process.env.MISTAKE_BOOK_FILE)
  : path.resolve(__dirname, "..", "data", "mistake-book.json");

/* ---------- 遗忘曲线配置：间隔（天）+ 掌握阈值 ---------- */
const SCHEDULE = [1, 3, 7, 15, 30]; // 连续做对的复习间隔（天）
const MASTER_IDX = SCHEDULE.length; // 达到该索引即视为已掌握
const MASTERY = { LEARING: "复习中", FINAL: "将掌握", MASTERED: "已掌握" };

/* ---------- 内置学科维度（知识点 / 难度 / 题型） ----------
 * 用于给错题挂结构化的归类骨架，替代「只能打一堆扁平 tag」的旧模式。
 * AI 登记错题时优先从下表选择，保证「错题地图」有统一的轴可聚合。
 * 难度：易 / 中 / 难
 * 题型：选择 / 填空 / 计算 / 证明 / 简答 / 应用 / 实验 / 阅读 / 听力 / 口语 / 写作
 */
const DIFFICULTY = ["易", "中", "难"];
const QUESTION_TYPES = ["选择", "填空", "计算", "证明", "简答", "应用", "实验", "阅读", "听力", "口语", "写作"];
// 常见学科的知识点骨架（可扩展，AI 也可自由补充 --knowledge）
const KNOWLEDGE_MAP = {
  "数学": ["代数", "函数", "几何", "三角", "数列", "概率统计", "向量", "解析几何", "立体几何"],
  "物理": ["力学", "热学", "电磁学", "光学", "原子物理", "振动与波"],
  "化学": ["化学计量", "物质结构", "化学反应", "有机化学", "实验探究"],
  "生物": ["细胞", "遗传", "代谢", "生态", "稳态调节"],
  "英语": ["词汇", "语法", "听力", "阅读", "写作", "口语"],
  "语文": ["文言文", "现代文阅读", "古诗词", "作文", "基础运用"],
  "历史": ["中国古代史", "中国近现代史", "世界史", "史学方法"],
  "地理": ["自然地理", "人文地理", "区域地理", "地图与读图"],
};
function suggestKnowledge(subject) {
  return KNOWLEDGE_MAP[subject] || [];
}

/* ---------- 存储 ---------- */
function ensureFile() {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ records: [] }, null, 2));
  }
}
function load() {
  ensureFile();
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
}
function save(db) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
}

/* ---------- 工具 ---------- */
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function addDays(dateStr, days) {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function normalize(r) {
  // 兼容旧记录：补充遗忘曲线字段
  if (r.intervalIdx == null) r.intervalIdx = 0;
  if (r.reviewCount == null) r.reviewCount = 0;
  if (r.mastery == null) r.mastery = MASTERY.LEARING;
  if (r.lastReviewed == null) r.lastReviewed = null;
  if (r.nextDue == null) {
    const created = r.createdAt ? String(r.createdAt).slice(0, 10) : todayStr();
    r.nextDue = addDays(created, SCHEDULE[0]);
  }
  return r;
}
function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      args[key] = next && !next.startsWith("--") ? argv[++i] : "";
    } else if (a.startsWith("-")) {
      args._.push(a);
    } else {
      args._.push(a);
    }
  }
  return args;
}
const importantLevel = (i) => (i === "高" ? 3 : i === "中" ? 2 : 1);

/* ---------- 命令：调度表 ---------- */
function schedule() {
  console.log(`遗忘曲线复习间隔（天）：${SCHEDULE.join(" → ")}`);
  console.log(`连续做对达到第 ${MASTER_IDX} 次后转为「${MASTERY.MASTERED}」，自动降频停止安排复习。`);
}

/* ---------- 命令：登记错题 ---------- */
function add(args) {
  const db = load();
  const created = todayStr();
  const subject = args.subject || "未分类";
  // 难度归一化（易/中/难），非法值回落"中"
  const difficulty = DIFFICULTY.includes(args.difficulty) ? args.difficulty : "中";
  // 知识点：优先显式 --knowledge；未提供但学科有骨架时，从 --chapter 兜底
  const knowledge = args.knowledge
    ? args.knowledge.trim()
    : (args.chapter ? args.chapter.trim() : "");
  const knowledgeCandidates = {
    knows: knowledge.split(/[,，/]/).map((s) => s.trim()).filter(Boolean),
    suggest: suggestKnowledge(subject).slice(0, 5),
  };
  const record = normalize({
    id: db.records.length ? Math.max(...db.records.map((r) => r.id)) + 1 : 1,
    subject,
    chapter: args.chapter || "",
    knowledge,            // 结构化知识点（第二级维度，替代/吸附于 --chapter）
    difficulty,           // 第二级维度：易 / 中 / 难
    qtype: args.qtype || "未知", // 第二级维度：题型
    title: args.title || "",
    mistake: args.mistake || "",
    answer: args.answer || "",
    type: args.type || "未知",
    tags: (args.tags || "").split(",").map((s) => s.trim()).filter(Boolean),
    importance: args.importance || "中",
    count: 1,
    createdAt: `${created}T00:00:00.000Z`,
    intervalIdx: 0,
    reviewCount: 0,
    lastReviewed: null,
    nextDue: addDays(created, SCHEDULE[0]),
    mastery: MASTERY.LEARING,
  });
  db.records.push(record);
  save(db);
  console.log(`已收录第 ${record.id} 条错题（${record.subject}/${record.knowledge || record.chapter || "?"} · ${record.difficulty} · ${record.qtype}）。`);
  console.log(`下次复习：${record.nextDue}（${SCHEDULE[0]} 天后）。`);
  // 提示可用知识点候选，帮助 AI/用户挂更统一的维度
  if (knowledgeCandidates.knows.length && knowledgeCandidates.suggest.length) {
    console.log(`本学科常见知识点：${knowledgeCandidates.suggest.join(" / ")}`);
  }
}

/* ---------- 命令：查看可用的维度字典 ---------- */
function dimensions(args) {
  console.log(`难度：${DIFFICULTY.join(" / ")}`);
  console.log(`题型：${QUESTION_TYPES.join(" / ")}`);
  const subject = args.subject || null;
  if (subject) {
    const k = suggestKnowledge(subject);
    console.log(`知识点（${subject}）：${k.length ? k.join(" / ") : "（暂无内置，可自定义 --knowledge）"}`);
  } else {
    console.log("知识点：按学科内置（如 数学→函数/几何/概率统计…），也可用 --knowledge 自定义。");
    console.log("提示：运行  dimensions --subject 数学  可看该学科的知识点骨架。");
  }
}

/* ---------- 命令：到期查询 ---------- */
function due(args) {
  const db = load();
  const base = args.date || todayStr();
  const subject = args.subject || null;
  let rows = db.records
    .map(normalize)
    .filter((r) => r.mastery !== MASTERY.MASTERED) // 已掌握不再安排
    .filter((r) => r.nextDue && r.nextDue <= base)
    .filter((r) => !subject || r.subject === subject);

  if (!rows.length) {
    console.log(`（${base} 暂无到期的错题，全部掌握或尚未到期。）`);
    return;
  }
  // 排序：重要度优先，其次到期更早
  rows.sort((a, b) => {
    const d = importantLevel(b.importance) - importantLevel(a.importance);
    return d !== 0 ? d : String(a.nextDue).localeCompare(String(b.nextDue));
  });
  console.log(`[${base}] 有 ${rows.length} 条到期需复习：`);
  for (const r of rows) {
    console.log(`  [#${r.id}] ${r.subject}/${r.chapter || "-"} | ${r.title} | ${r.mastery} | 连续做对:${r.intervalIdx}`);
  }
}

/* ---------- 命令：复习卡 ---------- */
function card(id) {
  const db = load();
  const r = db.records.find((x) => x.id === Number(id));
  if (!r) {
    console.log(`未找到第 ${id} 条错题。`);
    return;
  }
  console.log("────────────────────────");
  console.log(`复习卡 #${r.id} · ${r.subject}/${r.knowledge || r.chapter || "-"} [${r.importance}]`);
  console.log(`错因:${r.type}  难度:${r.difficulty || "-"}  题型:${r.qtype || "-"}  标签:${(r.tags || []).join(",") || "-"}`);
  console.log("────────────────────────");
  console.log(`题干：${r.title}`);
  console.log();
  console.log("先独立重做，掩住下方答案。");
  console.log("推荐闭卷判分（盖住答案重做后，对照判分，客观性更高）：");
  console.log(`  node scripts/review-cycle.mjs done ${r.id} --result correct|wrong --exam`);
  console.log("若只想快速凭感觉自评，可省略 --exam：");
  console.log(`  node scripts/review-cycle.mjs done ${r.id} --result correct|wrong`);
  console.log();
  console.log(`答案：${r.answer}`);
  console.log(`当时错误：${r.mistake}`);
}

/* ---------- 命令：自评推进（遗忘曲线状态机） ---------- */
function done(id, result, exam) {
  const db = load();
  const r = db.records.find((x) => x.id === Number(id));
  if (!r) {
    console.log(`未找到第 ${id} 条错题。`);
    return;
  }
  if (!["correct", "wrong"].includes(result)) {
    console.log(`--result 需为 correct 或 wrong。`);
    return;
  }
  const today = todayStr();
  // exam-mode：闭卷重做判分；记录 lastExamAt 供溯源，客观性比"凭感觉自评"更高
  if (exam) {
    r.lastExamAt = today;
    r.examCount = (r.examCount || 0) + 1;
    console.log("· 闭卷（exam-mode）重做判分已记录。");
  }
  r.lastReviewed = today;
  r.reviewCount = (r.reviewCount || 0) + 1;

  if (result === "correct") {
    r.intervalIdx = Math.min((r.intervalIdx || 0) + 1, MASTER_IDX);
    if (r.intervalIdx >= MASTER_IDX) {
      r.mastery = MASTERY.MASTERED;
      r.nextDue = null;
      console.log(`#${r.id} 连续做对 ${r.intervalIdx} 次，判定为「${MASTERY.MASTERED}」，停止安排复习。`);
    } else {
      r.mastery = r.intervalIdx >= 2 ? MASTERY.FINAL : MASTERY.LEARING;
      r.nextDue = addDays(today, SCHEDULE[r.intervalIdx]);
      console.log(`#${r.id} 做对，间隔升至 ${SCHEDULE[r.intervalIdx]} 天，下次复习：${r.nextDue}。`);
    }
  } else {
    r.intervalIdx = 0;
    r.mastery = MASTERY.LEARING;
    r.count = (r.count || 0) + 1; // 重复出错计数
    r.nextDue = addDays(today, SCHEDULE[0]);
    console.log(`#${r.id} 做错，间隔重置为 ${SCHEDULE[0]} 天（累计错 ${r.count} 次），明天再复习。`);
    console.log("建议：回到 explain-mistake 重新诊断错因，找出反复出错的深层卡点。");
  }
  save(db);
  normalize(r);
}

/* ---------- 命令：列表 / 统计 / 删除 ---------- */
function list(args) {
  const db = load();
  let rows = db.records.map(normalize);
  if (args.subject) rows = rows.filter((r) => r.subject === args.subject);
  if (args.mastery) rows = rows.filter((r) => r.mastery === args.mastery);
  // 新增的维度过滤
  if (args.knowledge) rows = rows.filter((r) => (r.knowledge || r.chapter || "").includes(args.knowledge));
  if (args.difficulty) rows = rows.filter((r) => r.difficulty === args.difficulty);
  if (args.qtype) rows = rows.filter((r) => r.qtype === args.qtype);
  rows.sort((a, b) => importantLevel(b.importance) - importantLevel(a.importance) || a.id - b.id);
  if (!rows.length) {
    console.log("（暂无匹配的错题）");
    return;
  }
  console.log(`共 ${rows.length} 条：`);
  for (const r of rows) {
    const due = r.nextDue ? r.nextDue : "—";
    console.log(`  [#${r.id}] ${r.subject}/${r.knowledge || r.chapter || "-"} | ${r.title} | ${r.difficulty || "-"}/${r.qtype || "-"} | ${r.mastery} | 下次:${due}`);
  }
}
function stats() {
  const db = load();
  const rows = db.records.map(normalize);
  const bySubject = {};
  const byMastery = { [MASTERY.LEARING]: 0, [MASTERY.FINAL]: 0, [MASTERY.MASTERED]: 0 };
  const dueSoon = rows.filter((r) => r.nextDue && r.nextDue <= todayStr() && r.mastery !== MASTERY.MASTERED);
  for (const r of rows) {
    bySubject[r.subject] = (bySubject[r.subject] || 0) + 1;
    byMastery[r.mastery] = (byMastery[r.mastery] || 0) + 1;
  }
  console.log(`错题总数：${rows.length}`);
  console.log("按掌握状态：", byMastery);
  console.log(`今日到期待复习：${dueSoon.length} 条`);
  console.log("按学科：", bySubject);
}
function rm(id) {
  const db = load();
  const before = db.records.length;
  db.records = db.records.filter((x) => x.id !== Number(id));
  if (db.records.length === before) {
    console.log(`未找到第 ${id} 条错题。`);
    return;
  }
  save(db);
  console.log(`已删除第 ${id} 条错题。`);
}

/* ---------- 入口 ---------- */
function main() {
  const args = parseArgs(process.argv.slice(2));
  const cmd = args._[0];
  try {
    switch (cmd) {
      case "schedule": schedule(); break;
      case "dimensions": dimensions(args); break;
      case "add": add(args); break;
      case "due": due(args); break;
      case "card": card(args._[1]); break;
      case "done": done(args._[1], args.result, Object.prototype.hasOwnProperty.call(args, "exam")); break;
      case "list": list(args); break;
      case "stats": stats(); break;
      case "rm": rm(args._[1]); break;
      default:
        console.log(`未知命令：${cmd || "(空)"}`);
        console.log("支持：schedule / dimensions / add / due / card <id> / done <id> --result correct|wrong [--exam] / list / stats / rm <id>");
        process.exit(1);
    }
  } catch (e) {
    console.error("执行出错：" + e.message);
    process.exit(1);
  }
}

main();