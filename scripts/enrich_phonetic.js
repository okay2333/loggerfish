/**
 * enrich_phonetic.js —— 给雅思词表批量补音标（有道词典 JSON 接口）
 *
 * 用法: node enrich_phonetic.js <ielts.json路径> [并发数]
 * 会直接修改 ielts.json，为每条词添加 phonetic 字段（查不到的留空）。
 */

const fs = require('fs');
const https = require('https');

const filePath = process.argv[2];
const concurrency = parseInt(process.argv[3] || '8', 10);

const words = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
console.log(`共 ${words.length} 条词，并发 ${concurrency}，开始补音标...`);

/** 查有道接口，返回音标字符串，查不到返回 null */
function fetchPhonetic(word) {
  return new Promise((resolve) => {
    const url = 'https://dict.youdao.com/jsonapi?q=' + encodeURIComponent(word);
    const req = https.get(url, {
      timeout: 10000,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Referer': 'https://dict.youdao.com/' },
    }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          const entry = data && data.ec && data.ec.word && data.ec.word[0];
          if (entry) {
            const ph = entry.phonetic || entry.usphone || (entry.phones && entry.phones[0] && entry.phones[0].phonetic) || null;
            resolve(ph && ph !== '' ? ph : null);
          } else {
            resolve(null);
          }
        } catch { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
  });
}

/** 词组兜底：拆成单个词，查第一个词的首词/主词 */
function fallbackWords(word) {
  if (!word.includes(' ')) return [];
  const parts = word.split(' ');
  // 优先查最后一个实词（通常音标与整体接近），其次第一个
  const candidates = [];
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i].replace(/[^a-zA-Z]/g, '');
    if (p) candidates.push(p);
  }
  return candidates;
}

async function main() {
  let done = 0, hit = 0, miss = 0;
  let qi = 0; // 队列索引

  async function worker() {
    while (qi < words.length) {
      const idx = qi++;
      const w = words[idx];
      let ph = await fetchPhonetic(w.word);
      if (!ph) {
        // 词组兜底
        for (const fw of fallbackWords(w.word)) {
          ph = await fetchPhonetic(fw);
          if (ph) break;
        }
      }
      w.phonetic = ph || '';
      if (ph) hit++; else miss++;
      done++;
      if (done % 200 === 0) {
        console.log(`进度 ${done}/${words.length}  命中 ${hit}  未命中 ${miss}`);
      }
      // 轻量限速
      await new Promise(r => setTimeout(r, 30));
    }
  }

  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);

  fs.writeFileSync(filePath, JSON.stringify(words));
  console.log(`完成！总 ${words.length}，命中 ${hit}，未命中 ${miss}，覆盖率 ${(hit / words.length * 100).toFixed(1)}%`);
  console.log('已写回:', filePath);
}

main().catch(e => { console.error(e); process.exit(1); });
