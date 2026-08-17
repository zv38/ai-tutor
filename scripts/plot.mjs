#!/usr/bin/env node
/**
 * plot.mjs —— AI 学习助教的数学可视化（数形结合）小工具
 * ------------------------------------------------------------------
 * 解决"讲函数/几何只靠文字"的问题：在终端里直接画出可读的坐标系图，
 * 数学（函数、二次函数、圆、椭圆、双曲线、直线、三角形等）都能直观展示。
 * 可选导出同名 SVG 供网页/演示页使用（浏览器可渲染）。
 *
 * 三种绘制模式：
 *   fn   显式函数      y=f(x)：  --fn "0.5*x^2"
 *   impl 隐式曲线      F(x,y)=0：--impl "x^2+y^2-9"    （半径 3 的圆）
 *   pts  点/线段(多边形)        --pts "0,0 4,0 4,3"   （3-4-5 直角三角形）
 *
 * 通用参数：
 *   --xmin/--xmax/--ymin/--ymax   固定坐标范围（默认自动适配）
 *   --w 60 --h 22                 画布宽(列)/高(行)
 *   --svg ./plot.svg              同时导出一份 SVG
 *   --quiet                        仅渲染图、不打印额外信息
 *
 * 用法示例：
 *   node scripts/plot.mjs fn --fn "-(x^2)+4x"              # 二次函数 y=-x²+4x
 *   node scripts/plot.mjs fn --fn "sin(x)" --xmin -6 --xmax 6 --svg ./sin.svg
 *   node scripts/plot.mjs impl --impl "x^2/9+y^2/4-1"      # 椭圆
 *   node scripts/plot.mjs impl --impl "x^2+y^2-9"          # 半径 3 的圆
 *   node scripts/plot.mjs pts --pts "0,0 4,0 4,3" --svg ./triangle.svg  # 勾股 3-4-5
 */

import fs from "fs";

/* ---------- 参数 ---------- */
const args = process.argv.slice(2);
const sub = args[0];
const flag = (name) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : undefined;
};
const num = (name, def) => (flag(name) === undefined ? def : Number(flag(name)));
const nfn = flag("--fn");
const nimpl = flag("--impl");
const npts = flag("--pts");
const svgPath = flag("--svg");
const quiet = args.includes("--quiet");
let W = Math.round(num("--w", 60));
let H = Math.round(num("--h", 22));
W = Math.max(30, Math.min(140, W));
H = Math.max(12, Math.min(50, H));

/* ---------- 安全求值：只允许数学符号与白名单函数 ---------- */
function compile(expr, vars) {
  let s = String(expr).trim().replace(/\^/g, "**");
  // 隐式乘法：4x → 4*x；0.5x → 0.5*x；2(x+1) → 2*(x+1)；(x+1)(x-1) → (x+1)*(x-1)
  s = s.replace(/(\d)(?=[a-zA-Z(])/g, "$1*").replace(/(\))(?=[\da-zA-Z(])/g, "*");
  s = s
    .replace(/\bpi\b/gi, "(Math.PI)")
    .replace(/\bsin\b/gi, "Math.sin")
    .replace(/\bcos\b/gi, "Math.cos")
    .replace(/\btan\b/gi, "Math.tan")
    .replace(/\basin\b/gi, "Math.asin")
    .replace(/\bacos\b/gi, "Math.acos")
    .replace(/\bat\b/gi, "Math.atan")
    .replace(/\bsqrt\b/gi, "Math.sqrt")
    .replace(/\babs\b/gi, "Math.abs")
    .replace(/\bexp\b/gi, "Math.exp")
    .replace(/\blog\b/gi, "Math.log")
    .replace(/\bfloor\b/gi, "Math.floor")
    .replace(/\bceil\b/gi, "Math.ceil");
  if (/[^0-9a-zA-Z+\-*/().,\s]/.test(s)) throw new Error(`表达式含非法字符或函数：${expr}`);
  try { return new Function(...vars, `"use strict"; return (${s});`); }
  catch (_) { throw new Error(`表达式解析失败：${expr}`); }
}

let autoRange = null; // 数据自适应范围
function computeAutoRange(pts) {
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const { min, max } = Math;
  const x0 = min(...xs), x1 = max(...xs), y0 = min(...ys), y1 = max(...ys);
  const px = Math.max((x1 - x0) * 0.15, 0.5), py = Math.max((y1 - y0) * 0.15, 0.5);
  autoRange = { xmin: x0 - px, xmax: x1 + px, ymin: y0 - py, ymax: y1 + py };
}

/* ---------- 数据点收集 ---------- */
function collectFn(expr) {
  const f = compile(expr, ["x"]);
  const xmin = num("--xmin", -5), xmax = num("--xmax", 5);
  const n = W * 2;
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const x = xmin + ((xmax - xmin) * i) / n;
    let y; try { y = f(x); } catch (_) { continue; }
    if (Number.isFinite(y)) pts.push([x, y]);
  }
  return pts;
}

function collectImpl(expr) {
  const f = compile(expr, ["x", "y"]);
  const xmin = num("--xmin", -5), xmax = num("--xmax", 5);
  const ymin = num("--ymin", -4), ymax = num("--ymax", 4);
  const pts = [];
  const sx = (xmax - xmin) / W, sy = (ymax - ymin) / H;
  const tol = Math.max(0.18, sx);
  for (let i = 0; i <= W; i++) {
    for (let j = 0; j <= H; j++) {
      const x = xmin + sx * i, y = ymax - sy * j;
      let v; try { v = f(x, y); } catch (_) { continue; }
      if (Number.isFinite(v) && Math.abs(v) < tol) pts.push([x, y]);
    }
  }
  return pts;
}

function collectPts(text) {
  const nums = String(text).match(/-?\d+(\.\d+)?/g);
  if (!nums || nums.length < 4) throw new Error(`--pts 需至少两个坐标，如 "0,0 4,0 4,3"`);
  const raw = [];
  for (let i = 0; i + 1 < nums.length; i += 2) raw.push([Number(nums[i]), Number(nums[i + 1])]);
  computeAutoRange(raw);
  const pts = [];
  const seg = 60;
  for (let k = 0; k < raw.length; k++) {
    const a = raw[k], b = raw[(k + 1) % raw.length];
    for (let t = 0; t <= seg; t++) {
      const q = t / seg;
      pts.push([a[0] + (b[0] - a[0]) * q, a[1] + (b[1] - a[1]) * q]);
    }
  }
  return pts;
}

/* ---------- 渲染到 ASCII 网格 ---------- */
function render(pts, fixedByUser) {
  let xmin, xmax, ymin, ymax;
  if (fixedByUser) {
    xmin = num("--xmin", -5); xmax = num("--xmax", 5);
    ymin = num("--ymin", -4); ymax = num("--ymax", 4);
  } else {
    if (!autoRange) computeAutoRange(pts);
    xmin = num("--xmin", autoRange.xmin); xmax = num("--xmax", autoRange.xmax);
    ymin = num("--ymin", autoRange.ymin); ymax = num("--ymax", autoRange.ymax);
  }
  const rng = { xmin, xmax, ymin, ymax };

  const g = Array.from({ length: H }, () => Array(W).fill(" "));
  const cx = (x) => Math.round(((x - xmin) / (xmax - xmin)) * (W - 1));
  const cy = (y) => Math.round(((ymax - y) / (ymax - ymin)) * (H - 1));
  const put = (x, y, ch) => { const c = cx(x), r = cy(y); if (c >= 0 && c < W && r >= 0 && r < H) g[r][c] = ch; };

  // 坐标轴 + 原点
  const oc = cx(0), or_ = cy(0);
  if (xmin < 0 && xmax > 0) for (let r = 0; r < H; r++) if (g[r][oc] === " ") g[r][oc] = "│";
  if (ymin < 0 && ymax > 0) for (let c = 0; c < W; c++) if (g[or_][c] === " ") g[or_][c] = "─";
  if (oc >= 0 && oc < W && or_ >= 0 && or_ < H) g[or_][oc] = "┼";

  for (const [x, y] of pts) put(x, y, "*");

  let out = false;
  for (const [x, y] of pts) {
    const c = cx(x), r = cy(y);
    if (c < 0 || c >= W || r < 0 || r >= H) { out = true; break; }
  }

  // —— 对齐的刻度标签 + 干净边框 ——
  const fmt = (v) => (Math.abs(v) < 0.005 ? "0" : String(Number(v.toFixed(2))));
  const labW = Math.max(...[ymin, ymax, xmin, xmax].map((v) => fmt(v).length)) + 1;
  const padL = (v) => fmt(v).padStart(labW);
  const blank = " ".repeat(labW);

  const flatHint = (ymax - ymin) > 3 * (xmax - xmin) && ymax - ymin > 0;

  if (!quiet) {
    console.log(blank + "  y");
    for (let r = 0; r < H; r++) {
      const edge = r === 0 ? ymax : r === H - 1 ? ymin : null;
      console.log(`${edge === null ? blank : padL(edge)}┤${g[r].join("")}│`);
    }
    console.log(blank + "  └" + "─".repeat(W) + "▶x");
    const pad2 = Math.max(0, W - fmt(xmin).length - fmt(xmax).length);
    console.log(blank + "  " + fmt(xmin) + " ".repeat(pad2) + fmt(xmax));
    if (out) console.log("· 部分数据点在画布外，可加 --xmin/--xmax/--ymin/--ymax 放大");
    if (flatHint) console.log("· y 方向跨度远大于 x，曲线会显得平——缩小 --xmin/--xmax 可聚焦顶点/细节区");
  } else {
    if (out) console.log("· 部分数据点在画布外，可加 --xmin/--xmax/--ymin/--ymax 放大");
    if (flatHint) console.log("· y 方向跨度远大于 x，曲线显得平——缩小 --xmin/--xmax 可聚焦细节");
  }
  return rng;
}

/* ---------- SVG 导出（可选） ---------- */
function exportSvg(pts, rng) {
  const pad = 20, sw = 560, sh = 320;
  const x = (v) => pad + ((v - rng.xmin) / (rng.xmax - rng.xmin)) * (sw - pad * 2);
  const y = (v) => (sh - pad) - ((v - rng.ymin) / (rng.ymax - rng.ymin)) * (sh - pad * 2);
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${x(p[0]).toFixed(1)},${y(p[1]).toFixed(1)}`).join(" ");
  const x0 = Math.round(x(0)), y0 = Math.round(y(0));
  const axis =
    ((rng.xmin < 0 && rng.xmax > 0) ? `<line x1="${x0}" y1="${pad}" x2="${x0}" y2="${sh - pad}" stroke="#d8d3cc" stroke-width="1"/>` : "") +
    ((rng.ymin < 0 && rng.ymax > 0) ? `<line x1="${pad}" y1="${y0}" x2="${sw - pad}" y2="${y0}" stroke="#d8d3cc" stroke-width="1"/>` : "");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${sw} ${sh}" width="${sw}" height="${sh}"
  font-family="Segoe UI, PingFang SC, Microsoft YaHei, sans-serif">
  <rect width="100%" height="100%" rx="16" fill="#fafaf8"/>
  <g stroke-linecap="round">
    ${axis}
    <path d="${path}" fill="none" stroke="#6c5ce7" stroke-width="2.5" />
  </g>
  <g fill="#6f6a63" font-size="12">
    <text x="${pad + 2}" y="${sh - pad + 16}">${rng.xmin.toFixed(1)}</text>
    <text text-anchor="end" x="${sw - pad - 2}" y="${sh - pad + 16}">${rng.xmax.toFixed(1)}</text>
    <text text-anchor="start" x="${pad - 4}" y="${pad + 12}">${rng.ymax.toFixed(1)}</text>
    <text text-anchor="start" x="${pad - 4}" y="${sh - pad - 4}">${rng.ymin.toFixed(1)}</text>
  </g>
</svg>`;
  fs.writeFileSync(svgPath, svg);
  console.log(`✓ 已导出 SVG：${svgPath}`);
}

/* ---------- 主流程 ---------- */
try {
  if (sub === "fn" && nfn) {
    const pts = collectFn(nfn);
    const rng = render(pts, false);
    if (svgPath) exportSvg(pts, rng);
  } else if (sub === "impl" && nimpl) {
    const pts = collectImpl(nimpl);
    const rng = render(pts, true);
    if (svgPath) exportSvg(pts, rng);
  } else if (sub === "pts" && npts) {
    const pts = collectPts(npts);
    const rng = render(pts, false);
    if (svgPath) exportSvg(pts, rng);
  } else {
    console.log(`用法：
  node scripts/plot.mjs fn   --fn "-(x^2)+4x"        显式函数 y=f(x)
  node scripts/plot.mjs impl --impl "x^2+y^2-9"      隐式曲线 F(x,y)=0（圆/椭圆/双曲线/直线）
  node scripts/plot.mjs pts  --pts "0,0 4,0 4,3"     点/线段多边形（如直角三角形）
可选：--xmin/--xmax/--ymin/--ymax 固定范围 | --w/--h 画布 | --svg 导出 | --quiet 仅作图`);
    process.exit(1);
  }
} catch (e) {
  console.error(`✗ ${e.message}`);
  process.exit(1);
}