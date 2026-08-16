#!/usr/bin/env node
/**
 * 错题本存储 / 管理辅助脚本
 * 用途：把结构化错题记录持久化到本地 data/mistake-book.json，支持增、查、删。
 *
 * 用法：
 *   node scripts/mistake-book.mjs add  --subject 数学 --chapter 二次函数 --title "..." --mistake "..." --answer "..." --type 思路型 --tags "a,b" --importance high
 *   node scripts/mistake-book.mjs list [--subject 数学] [--type 思路型] [--importance high]
 *   node scripts/mistake-book.mjs get <id>
 *   node scripts/mistake-book.mjs rm  <id>
 *   node scripts/mistake-book.mjs stats
 *
 * 数据文件：data/mistake-book.json（默认，可通过 MISTAKE_BOOK_FILE 环境变量覆盖）
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = process.env.MISTAKE_BOOK_FILE
  ? path.resolve(process.env.MISTAKE_BOOK_FILE)
  : path.resolve(__dirname, "..", "data", "mistake-book.json");

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

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      args[key] = argv[++i];
    } else {
      args._.push(a);
    }
  }
  return args;
}

function add(args) {
  const subject = args.subject || "未分类";
  const type = args.type || "未知";
  const importance = args.importance || "中";
  const tags = (args.tags || "").split(",").map((s) => s.trim()).filter(Boolean);

  const db = load();
  const record = {
    id: db.records.length ? Math.max(...db.records.map((r) => r.id)) + 1 : 1,
    subject,
    chapter: args.chapter || "",
    title: args.title || "",
    mistake: args.mistake || "",
    answer: args.answer || "",
    type,
    tags,
    importance,
    count: 1,
    createdAt: new Date().toISOString(),
  };
  db.records.push(record);
  save(db);
  console.log(`已收录第 ${record.id} 条错题（${subject}/${args.chapter || "?"}）。`);
}

function list(args) {
  const db = load();
  let records = db.records;
  if (args.subject) records = records.filter((r) => r.subject === args.subject);
  if (args.type) records = records.filter((r) => r.type === args.type);
  if (args.importance) records = records.filter((r) => r.importance === args.importance);

  records.sort((a, b) => {
    const level = { 高: 3, 中: 2, 低: 1 };
    return (level[b.importance] || 0) - (level[a.importance] || 0);
  });

  if (!records.length) {
    console.log("（暂无匹配的错题）");
    return;
  }
  console.log(`共 ${records.length} 条：`);
  for (const r of records) {
    console.log(`  [#${r.id}] ${r.subject}/${r.chapter || "-"} | ${r.title} | 错因:${r.type} | 重要度:${r.importance} | 次数:${r.count}`);
  }
}

function get(id) {
  const db = load();
  const r = db.records.find((x) => x.id === Number(id));
  if (!r) {
    console.log(`未找到第 ${id} 条错题。`);
    return;
  }
  console.log(JSON.stringify(r, null, 2));
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

function stats() {
  const db = load();
  const bySubject = {};
  const byType = {};
  for (const r of db.records) {
    bySubject[r.subject] = (bySubject[r.subject] || 0) + 1;
    byType[r.type] = (byType[r.type] || 0) + 1;
  }
  console.log(`错题总数：${db.records.length}`);
  console.log("按学科：", bySubject);
  console.log("按错因：", byType);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const cmd = args._[0];

  switch (cmd) {
    case "add": add(args); break;
    case "list": list(args); break;
    case "get": get(args._[1]); break;
    case "rm": rm(args._[1]); break;
    case "stats": stats(); break;
    default:
      console.log(`未知命令：${cmd || "(空)"}`);
      console.log("支持：add / list / get <id> / rm <id> / stats");
      process.exit(1);
  }
}

main();