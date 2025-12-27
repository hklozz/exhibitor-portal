// Packlista logic - ported from scripts/test_packlista.js and extended
export const TOP_WIDTHS = [3.0, 2.5, 2.0, 1.5, 1.1, 1.0, 0.5];
export const ALLOWED_HEIGHTS = [2.5, 3.0, 2.0, 1.5, 1.0, 0.5];

function solveColumnStack(targetHeight: number) {
  const scale = 10;
  const target = Math.round(targetHeight * scale);
  const sizes = ALLOWED_HEIGHTS.map(h => Math.round(h * scale));
  const INF = 1e9;
  const dpPieces = new Array(target + 1).fill(INF);
  const dpPrefer25 = new Array(target + 1).fill(-INF);
  const choice = new Array<number>(target + 1).fill(-1);
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
  const counts: Record<string, number> = {};
  let cur = target;
  while (cur > 0) {
    const i = choice[cur]; if (i === -1) break;
    const key = `${ALLOWED_HEIGHTS[i]}`;
    counts[key] = (counts[key] || 0) + 1;
    cur -= Math.round(ALLOWED_HEIGHTS[i] * scale);
  }
  return counts;
}

export function computeColumnsForLength(length: number, height: number) {
  const cols: Array<any> = [];
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

export function computeTopRowPieces(length: number) {
  const scale = 10;
  const target = Math.round(length * scale);
  const sizes = TOP_WIDTHS.map(s => Math.round(s * scale));
  const maxExtra = Math.max(...sizes);
  const maxSum = target + maxExtra;
  const INF = 1e9;
  const dp = new Array(maxSum + 1).fill(INF);
  const choice = new Array<number>(maxSum + 1).fill(-1);
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
  const topCounts: Record<string, number> = {};
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

type StorageInput = any;

export function computePacklista(wallShape: string, floorWidth: number, floorDepth: number, wallHeight: number, storages: StorageInput[] = []) {
  const walls: Array<any> = [];
  if (wallShape === 'straight') walls.push({ name: 'back', length: floorWidth, height: wallHeight });
  else if (wallShape === 'l') { walls.push({ name: 'back', length: floorWidth, height: wallHeight }); walls.push({ name: 'left', length: floorDepth, height: wallHeight }); }
  else if (wallShape === 'u') { walls.push({ name: 'back', length: floorWidth, height: wallHeight }); walls.push({ name: 'left', length: floorDepth, height: wallHeight }); walls.push({ name: 'right', length: floorDepth, height: wallHeight }); }

  const perWall: Record<string, any> = {};
  const totals: Record<string, number> = {};
    // Use explicit tables for storage hardware counts (ignore frame logic here)
    const straightTable: Record<number, any> = {
      1: { connectors: 0, corner_90_4pin: 4, m8_pin: 14, t_5pin: 2 },
      2: { connectors: 2, corner_90_4pin: 4, m8_pin: 14, t_5pin: 2 },
      3: { connectors: 4, corner_90_4pin: 4, m8_pin: 14, t_5pin: 2 },
      4: { connectors: 6, corner_90_4pin: 4, m8_pin: 14, t_5pin: 2 }
    };
    const cornerTable: Record<number, any> = {
      1: { connectors: 0, corner_90_4pin: 4, m8_pin: 20, t_5pin: 4 },
      2: { connectors: 2, corner_90_4pin: 4, m8_pin: 20, t_5pin: 4 },
      3: { connectors: 4, corner_90_4pin: 4, m8_pin: 20, t_5pin: 4 },
      4: { connectors: 6, corner_90_4pin: 4, m8_pin: 20, t_5pin: 4 }
    };

  // Compute columns, stacks and connectors for each main wall
  for (const w of walls) {
    const info: any = { length: w.length, height: w.height, storages: [] };
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
    // Count join connectors for this wall.
    const numCols = cols.length;
    const joins = Math.max(0, numCols - 1);
    let perJoin = 2;
    if (Math.abs(w.height - 2.5) < 1e-6) perJoin = 2;
    else if (Math.abs(w.height - 3.0) < 1e-6 || Math.abs(w.height - 3.5) < 1e-6) perJoin = 3;
    if (Math.abs(w.height - 3.5) < 1e-6) {
      totals['connectors'] = (totals['connectors'] || 0) + numCols * perJoin;
    } else {
      totals['connectors'] = (totals['connectors'] || 0) + joins * perJoin;
    }
    if (Math.abs(w.height - 3.5) < 1e-6) {
      const top = computeTopRowPieces(w.length);
      info.topRow = top;
      for (const k of Object.keys(top.pieces)) totals[k] = (totals[k] || 0) + top.pieces[k];
    }
    perWall[w.name] = info;
  }

  // Add fixed M8 pins for L/U shaped main walls; corners for straight walls are
  // only added when a back-attached storage exists (handled below).
  if (wallShape === 'l') {
    totals['m8_pin'] = (totals['m8_pin'] || 0) + 4;
  } else if (wallShape === 'u') {
    totals['corner_90_4pin'] = (totals['corner_90_4pin'] || 0) + 4;
    totals['m8_pin'] = (totals['m8_pin'] || 0) + 8;
  }

  // Storage mapping - fixed tables (assumptions: widths 1..4)
  const STORAGE_MAP: any = {
    straight: {
      1: { connectors: 0, corner_90_4pin: 2, m8_pin: 6, t_5pin: 2, frame_sections: 3 },
      2: { connectors: 2, corner_90_4pin: 4, m8_pin: 10, t_5pin: 2, frame_sections: 4 },
      3: { connectors: 4, corner_90_4pin: 6, m8_pin: 14, t_5pin: 3, frame_sections: 5 },
      4: { connectors: 6, corner_90_4pin: 8, m8_pin: 18, t_5pin: 4, frame_sections: 6 }
    },
    corner: {
  1: { connectors: 0, corner_90_4pin: 4, m8_pin: 8, t_5pin: 4, frame_sections: 3 },
      2: { connectors: 2, corner_90_4pin: 4, m8_pin: 12, t_5pin: 4, frame_sections: 3 },
      3: { connectors: 4, corner_90_4pin: 4, m8_pin: 16, t_5pin: 6, frame_sections: 4 },
      4: { connectors: 6, corner_90_4pin: 4, m8_pin: 20, t_5pin: 8, frame_sections: 5 }
    }
  };

  const storageDetails: any[] = [];
  const backWallZ = -floorDepth / 2;
  const leftWallX = -floorWidth / 2;
  const rightWallX = floorWidth / 2;
  const eps = 1e-6;

  for (const sRaw of storages || []) {
    const s = sRaw || {};
    // support multiple shapes of storage object
    const sx = s.x ?? (s.position && s.position.x) ?? 0;
    const sz = s.z ?? (s.position && s.position.z) ?? 0;
    const sw = Math.max(1, Math.round((s.width ?? s.type ?? 1)));
    const sd = Math.max(1, Math.round(s.depth ?? 1));
    const halfW = sw / 2; const halfD = sd / 2;

    // check corner placement: one corner touches back AND left/right wall
    let isCornerPlacement = false;
    // check back-left
    if (Math.abs((sx - halfW) - leftWallX) < eps && Math.abs((sz - halfD) - backWallZ) < eps) isCornerPlacement = true;
    // check back-right
    if (Math.abs((sx + halfW) - rightWallX) < eps && Math.abs((sz - halfD) - backWallZ) < eps) isCornerPlacement = true;

    const kind = isCornerPlacement ? 'corner' : 'straight';
  const mapping = (STORAGE_MAP[kind] && STORAGE_MAP[kind][sw]) ? STORAGE_MAP[kind][sw] : STORAGE_MAP.straight[1];

    const storageRecord = { id: s.id ?? null, width: sw, depth: sd, cornerPlacement: isCornerPlacement, mapping };
    // determine which wall it's attached to
    let attached = false;
    let attachedWall: string | null = null;
    if (Math.abs((sx - halfW) - leftWallX) < eps || Math.abs((sx + halfW) - leftWallX) < eps) {
      if (perWall.left) { perWall.left.storages.push(storageRecord); attached = true; attachedWall = 'left'; }
    }
    if (!attached && (Math.abs((sx - halfW) - rightWallX) < eps || Math.abs((sx + halfW) - rightWallX) < eps)) {
      if (perWall.right) { perWall.right.storages.push(storageRecord); attached = true; attachedWall = 'right'; }
    }
    if (!attached && (Math.abs((sz - halfD) - backWallZ) < eps || Math.abs((sz + halfD) - backWallZ) < eps)) {
      if (perWall.back) { perWall.back.storages.push(storageRecord); attached = true; attachedWall = 'back'; }
    }
    if (!attached) {
      storageDetails.push(storageRecord);
    }

    // Allocate frame sections to concrete frame keys depending on the wall height where the storage sits
    const fs = mapping.frame_sections || 0;
    let wallHForStorage = wallHeight;
    if (attachedWall && perWall[attachedWall]) wallHForStorage = perWall[attachedWall].height;

  // add connector/corner/m8/t5 totals based on straight/corner tables provided by user
  const spec = isCornerPlacement ? (cornerTable[sw] || cornerTable[1]) : (straightTable[sw] || straightTable[1]);
  totals['connectors'] = (totals['connectors'] || 0) + (spec.connectors || 0);
  totals['corner_90_4pin'] = (totals['corner_90_4pin'] || 0) + (spec.corner_90_4pin || 0);
  totals['m8_pin'] = (totals['m8_pin'] || 0) + (spec.m8_pin || 0);
  totals['t_5pin'] = (totals['t_5pin'] || 0) + (spec.t_5pin || 0);

  // additional connectors per storage width: 2x1 -> +2, 3x1 -> +4, 4x1 -> +6 (kept for backward compatibility)
  const extraConnectors = Math.max(0, (sw - 1)) * 2;
  if (extraConnectors > 0) totals['connectors'] = (totals['connectors'] || 0) + extraConnectors;

    // Special case: if storage is only attached to the back wall (not corner),
    // add explicit frame sections per requested mapping and do not use mapping.frame_sections
    if (attachedWall === 'back' && !isCornerPlacement) {
      if (Math.abs(wallHForStorage - 2.5) < 1e-6) {
        // one 2.5x1
        totals['2.5x1'] = (totals['2.5x1'] || 0) + 1;
      } else if (Math.abs(wallHForStorage - 3.0) < 1e-6) {
        // one 3x1
        totals['3x1'] = (totals['3x1'] || 0) + 1;
      } else if (Math.abs(wallHForStorage - 3.5) < 1e-6) {
        // one 2.5x1 + one 1x1
        totals['2.5x1'] = (totals['2.5x1'] || 0) + 1;
        totals['1x1'] = (totals['1x1'] || 0) + 1;
      } else {
        // fallback: use default mapping if other heights
        const fs2 = mapping.frame_sections || fs || 0;
        totals['2.5x1'] = (totals['2.5x1'] || 0) + fs2;
      }
    } else {
      // allocate frames based on mapping.frame_sections
      const fs2 = mapping.frame_sections || fs || 0;
      if (Math.abs(wallHForStorage - 2.5) < 1e-6) {
        totals['2.5x1'] = (totals['2.5x1'] || 0) + fs2;
      } else if (Math.abs(wallHForStorage - 3.0) < 1e-6) {
        totals['3x1'] = (totals['3x1'] || 0) + fs2;
      } else if (Math.abs(wallHForStorage - 3.5) < 1e-6) {
        totals['2.5x1'] = (totals['2.5x1'] || 0) + fs2;
        totals['1x1'] = (totals['1x1'] || 0) + fs2;
      } else {
        totals['2.5x1'] = (totals['2.5x1'] || 0) + fs2;
      }
    }
  }

  perWall.storages = storageDetails;
  // If wall is straight and there is at least one storage attached to the back wall,
  // add the +2 corner_90_4pin that should only be present when a storage is selected.
  if (wallShape === 'straight' && perWall.back && (perWall.back.storages || []).length > 0) {
    totals['corner_90_4pin'] = (totals['corner_90_4pin'] || 0) + 2;
  }

  // Add baseplates based on wall configuration
  let baseplateCount = 0;
  if (wallShape === 'straight') {
    const width = floorWidth;
    if (width === 3) {
      baseplateCount = 1;
    } else if (width === 4) {
      baseplateCount = 2;
    } else if (width >= 5) {
      baseplateCount = 3;
    }
  } else if (wallShape === 'l' || wallShape === 'u') {
    const totalWallLength = 2 * (floorWidth + floorDepth);
    if (totalWallLength >= 6) {
      baseplateCount = 1;
    }
  }
  
  if (baseplateCount > 0) {
    totals['baseplate'] = baseplateCount;
  }

  return { perWall, totals };
}

export default computePacklista;
