// Quick test harness (plain JS) to reproduce computePacklista behavior
const TOP_WIDTHS = [3.0, 2.5, 2.0, 1.5, 1.1, 1.0, 0.5];
const ALLOWED_HEIGHTS = [2.5, 3.0, 2.0, 1.5, 1.0, 0.5];

function solveColumnStack(targetHeight) {
  const scale = 10;
  const target = Math.round(targetHeight * scale);
  const sizes = ALLOWED_HEIGHTS.map(h => Math.round(h * scale));
  const INF = 1e9;
  const dpPieces = new Array(target + 1).fill(INF);
  const dpPrefer25 = new Array(target + 1).fill(-INF);
  const choice = new Array(target + 1).fill(-1);
  dpPieces[0] = 0; dpPrefer25[0] = 0;
  for (let s = 0; s <= target; s++) {
    if (dpPieces[s] === INF) continue;
    for (let i = 0; i < sizes.length; i++) {
      const ns = s + sizes[i]; if (ns > target) continue;
      const piecesCandidate = dpPieces[s] + 1;
      const preferCandidate = dpPrefer25[s] + (ALLOWED_HEIGHTS[i] === 2.5 ? 1 : 0);
      if (piecesCandidate < dpPieces[ns] || (piecesCandidate === dpPieces[ns] && preferCandidate > dpPrefer25[ns])) {
        dpPieces[ns] = piecesCandidate;
        dpPrefer25[ns] = preferCandidate;
        choice[ns] = i;
      }
    }
  }
  if (dpPieces[target] === INF) return null;
  const counts = {};
  let cur = target;
  while (cur > 0) {
    const i = choice[cur]; if (i === -1) break;
    const key = `${ALLOWED_HEIGHTS[i]}`;
    counts[key] = (counts[key] || 0) + 1;
    cur -= Math.round(ALLOWED_HEIGHTS[i] * scale);
  }
  return counts;
}

function computeColumnsForLength(length, height) {
  const cols = [];
  const fullOnes = Math.floor(length / 1.0 + 1e-6);
  const rem = Math.round((length - fullOnes * 1.0) * 100) / 100;
  if (Math.abs(height - 3.5) < 1e-6) {
    for (let i = 0; i < fullOnes; i++) cols.push({ width: 1.0, stack: { '2.5': 1 } });
    if (rem >= 0.499) cols.push({ width: 0.5, stack: { '2.5': 1 } });
  } else {
    for (let i = 0; i < fullOnes; i++) {
      const stack = solveColumnStack(height);
      cols.push({ width: 1.0, stack });
    }
    if (rem >= 0.499) { const stack = solveColumnStack(height); cols.push({ width: 0.5, stack }); }
  }
  return cols;
}

function computeTopRowPieces(length) {
  const scale = 10;
  const target = Math.round(length * scale);
  const sizes = TOP_WIDTHS.map(s => Math.round(s * scale));
  const maxExtra = Math.max(...sizes);
  const maxSum = target + maxExtra;
  const INF = 1e9;
  const dp = new Array(maxSum + 1).fill(INF);
  const choice = new Array(maxSum + 1).fill(-1);
  dp[0] = 0;
  for (let s = 0; s <= maxSum; s++) {
    if (dp[s] === INF) continue;
    for (let i = 0; i < sizes.length; i++) {
      const ns = s + sizes[i]; if (ns > maxSum) continue;
      if (dp[ns] > dp[s] + 1) { dp[ns] = dp[s] + 1; choice[ns] = i; }
    }
  }
  let bestSum = -1; let bestWaste = Infinity; let bestPieces = INF;
  for (let s = target; s <= maxSum; s++) {
    if (dp[s] === INF) continue;
    const waste = s - target;
    if (waste < bestWaste || (waste === bestWaste && dp[s] < bestPieces)) { bestWaste = waste; bestSum = s; bestPieces = dp[s]; }
  }
  const topCounts = {};
  if (bestSum !== -1) {
    let cur = bestSum;
    while (cur > 0) {
      const i = choice[cur]; if (i === -1) break;
      const key = `${1.0}x${TOP_WIDTHS[i]}`;
      topCounts[key] = (topCounts[key] || 0) + 1;
      cur -= sizes[i];
    }
  }
  return { pieces: topCounts, waste: bestSum === -1 ? null : bestWaste / scale };
}

function computePacklista(wallShape, floorWidth, floorDepth, wallHeight, storages) {
  const walls = [];
  if (wallShape === 'straight') walls.push({ name: 'back', length: floorWidth, height: wallHeight });
  else if (wallShape === 'l') { walls.push({ name: 'back', length: floorWidth, height: wallHeight }); walls.push({ name: 'left', length: floorDepth, height: wallHeight }); }
  else if (wallShape === 'u') { walls.push({ name: 'back', length: floorWidth, height: wallHeight }); walls.push({ name: 'left', length: floorDepth, height: wallHeight }); walls.push({ name: 'right', length: floorDepth, height: wallHeight }); }

  const perWall = {};
  const totals = {};

  for (const w of walls) {
    const info = { length: w.length, height: w.height, columns: [], topRow: null };
    const cols = computeColumnsForLength(w.length, w.height);
    info.columns = cols;
    for (const c of cols) {
      const widthKey = c.width;
      if (!c.stack) continue;
      for (const hKey of Object.keys(c.stack)) {
        const count = c.stack[hKey];
        const key = `${hKey}x${widthKey}`;
        totals[key] = (totals[key] || 0) + count;
      }
    }
    if (Math.abs(w.height - 3.5) < 1e-6) {
      const top = computeTopRowPieces(w.length);
      info.topRow = top;
      for (const k of Object.keys(top.pieces)) totals[k] = (totals[k] || 0) + top.pieces[k];
    }
    perWall[w.name] = info;
  }

  // storages
  const storageDetails = [];
  for (const s of storages) {
    const sw = s.width || 1; const sd = s.depth || 1; const sx = s.x; const sz = s.z;
    const halfW = sw/2; const halfD = sd/2;
    const sides = [ {name:'front', length: sw, cx: sx, cz: sz + halfD}, {name:'back', length: sw, cx: sx, cz: sz - halfD}, {name:'left', length: sd, cx: sx - halfW, cz: sz}, {name:'right', length: sd, cx: sx + halfW, cz: sz} ];
    const used = {};
    for (const side of sides) {
      const backed = Math.abs(side.cx) >= (floorWidth/2 - 1e-6) || Math.abs(side.cz) >= (floorDepth/2 - 1e-6);
      if (backed) continue;
      const cols = computeColumnsForLength(side.length, wallHeight);
      for (const c of cols) {
        if (!c.stack) continue;
        for (const hKey of Object.keys(c.stack)) {
          const key = `${hKey}x${c.width}`; used[key] = (used[key] || 0) + c.stack[hKey];
        }
      }
      if (Math.abs(wallHeight - 3.5) < 1e-6) {
        const top = computeTopRowPieces(side.length);
        for (const k of Object.keys(top.pieces || {})) used[k] = (used[k] || 0) + top.pieces[k];
      }
    }
    for (const k of Object.keys(used)) totals[k] = (totals[k] || 0) + used[k];
    storageDetails.push({id: s.id, pieces: used});
  }
  perWall.storages = storageDetails;
  return { perWall, totals };
}

// Test case: 3m back wall, storage 1x1 flush to back wall. Coordinates: floor centered at 0.
const floorW = 3; const floorD = 2; const wallH = 3;
// Place storage centered along back wall at center: back wall is at z = -floorD/2
const storage = { id: 1, width: 1, depth: 1, x: 0, z: -floorD/2 + 0.5 };
const res = computePacklista('straight', floorW, floorD, wallH, [storage]);
console.log(JSON.stringify(res, null, 2));

// Also print a human summary
console.log('Summary totals:');
for (const k of Object.keys(res.totals)) console.log(k, 'x', res.totals[k]);
