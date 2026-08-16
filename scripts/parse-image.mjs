#!/usr/bin/env node
/**
 * 图片 / 文件解析辅助脚本
 * 用途：把一张错题图片转成可读的文本描述，供讲解前的信息收集使用。
 *
 * 用法：
 *   node scripts/parse-image.mjs <图片路径>
 *   node scripts/parse-image.mjs --url <远程图片URL>
 *
 * 说明：
 * - 本脚本依赖可选的本地 OCR 能力（如系统自带 OCR / tesseract）。
 * - 若未安装 OCR 工具，脚本会输出提示，并引导用户手动补充题目文字。
 * - 本项目为纯 Skill 包，本身不捆绑重型依赖；OCR 由用户运行时按需提供。
 */

const fs = require("fs");
const path = require("path");

const SUPPORTED_EXT = [".png", ".jpg", ".jpeg", ".webp", ".bmp", ".gif"];

function usage() {
  console.log(`用法:
  node scripts/parse-image.mjs <图片路径>
  node scripts/parse-image.mjs --url <远程图片URL>
`);
  process.exit(1);
}

function assertSupported(file) {
  const ext = path.extname(file).toLowerCase();
  if (!SUPPORTED_EXT.includes(ext)) {
    console.error(`不支持的图片格式：${ext || "(无扩展名)"}`);
    console.error(`支持的格式：${SUPPORTED_EXT.join(", ")}`);
    process.exit(1);
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) usage();

  if (args[0] === "--url") {
    const url = args[1];
    if (!url) usage();
    console.log(`远程图片：${url}`);
    console.log("已记录 URL，等待 AI 代理提取图片内容。");
    return;
  }

  const file = path.resolve(args[0]);
  if (!fs.existsSync(file)) {
    console.error(`文件不存在：${file}`);
    process.exit(1);
  }
  assertSupported(file);

  console.log(`图片文件：${file}`);
  console.log(`大小：${(fs.statSync(file).size / 1024).toFixed(1)} KB`);

  // 尝试调用系统 OCR（若可用）
  let ocrOutput = null;
  try {
    const { execFile } = require("child_process");
    // 示例：优先尝试 tesseract；用户可按需替换为系统 OCR
    const tesseractAvailable = await new Promise((resolve) => {
      execFile("tesseract", ["--version"], (err) => resolve(!err));
    });
    if (tesseractAvailable) {
      ocrOutput = await new Promise((resolve, reject) => {
        execFile("tesseract", [file, "stdout", "-l", "chi_sim+eng"], (err, stdout) => {
          if (err) return reject(err);
          resolve(stdout);
        });
      });
    }
  } catch (_) {
    ocrOutput = null;
  }

  if (ocrOutput && ocrOutput.trim()) {
    console.log("\n【OCR 识别结果】");
    console.log(ocrOutput.trim());
  } else {
    console.log("\n未检测到可用 OCR 工具（tesseract 等）。");
    console.log("请打开图片，把题目文字补充给我，并说明你的作答过程，我再帮你诊断。");
  }
}

main().catch((err) => {
  console.error("脚本执行出错：", err.message);
  process.exit(1);
});