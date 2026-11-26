import { CARO_SIZE, CARO_WIN_LENGTH } from '../data/constants.js';

const DIRS = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1]
];

export function evaluateCaro6x6(board) {
  for (let r = 0; r < CARO_SIZE; r++) {
    for (let c = 0; c < CARO_SIZE; c++) {
      const sym = board[r * CARO_SIZE + c];
      if (!sym) continue;
      for (const [dr, dc] of DIRS) {
        const line = [r * CARO_SIZE + c];
        for (let step = 1; step < CARO_WIN_LENGTH; step++) {
          const nr = r + dr * step;
          const nc = c + dc * step;
          if (
            nr >= 0 &&
            nr < CARO_SIZE &&
            nc >= 0 &&
            nc < CARO_SIZE &&
            board[nr * CARO_SIZE + nc] === sym
          ) {
            line.push(nr * CARO_SIZE + nc);
          } else {
            break;
          }
        }
        if (line.length >= CARO_WIN_LENGTH) {
          return { winner: sym, winLine: line };
        }
      }
    }
  }

  if (!board.includes('')) {
    return { winner: 'DRAW', winLine: [] };
  }
  return { winner: '', winLine: [] };
}

export function scoreCellForSymbol(board, idx, sym) {
  const r0 = Math.floor(idx / CARO_SIZE);
  const c0 = idx % CARO_SIZE;
  let maxRun = 1;
  let openEndsTotal = 0;

  for (const [dr, dc] of DIRS) {
    let count = 1;
    let openEnds = 0;

    let r = r0 + dr;
    let c = c0 + dc;
    while (r >= 0 && r < CARO_SIZE && c >= 0 && c < CARO_SIZE && board[r * CARO_SIZE + c] === sym) {
      count++;
      r += dr;
      c += dc;
    }
    if (r >= 0 && r < CARO_SIZE && c >= 0 && c < CARO_SIZE && board[r * CARO_SIZE + c] === '') {
      openEnds++;
    }

    r = r0 - dr;
    c = c0 - dc;
    while (r >= 0 && r < CARO_SIZE && c >= 0 && c < CARO_SIZE && board[r * CARO_SIZE + c] === sym) {
      count++;
      r -= dr;
      c -= dc;
    }
    if (r >= 0 && r < CARO_SIZE && c >= 0 && c < CARO_SIZE && board[r * CARO_SIZE + c] === '') {
      openEnds++;
    }

    if (count > maxRun) maxRun = count;
    if (count >= 2) openEndsTotal += count * 10 + openEnds * 4;
  }

  return { maxRun, score: openEndsTotal };
}

export function pickSmartBotMove6x6(board, botSym, humanSym) {
  const empty = [];
  for (let i = 0; i < board.length; i++) {
    if (board[i] === '') empty.push(i);
  }
  if (empty.length === 0) return -1;

  for (const idx of empty) {
    const copy = board.slice();
    copy[idx] = botSym;
    if (evaluateCaro6x6(copy).winner === botSym) return idx;
  }

  for (const idx of empty) {
    const copy = board.slice();
    copy[idx] = humanSym;
    if (evaluateCaro6x6(copy).winner === humanSym) return idx;
  }

  let bestIdx = empty[0];
  let bestWeight = -1;
  for (const idx of empty) {
    const attack = scoreCellForSymbol(board, idx, botSym);
    const defend = scoreCellForSymbol(board, idx, humanSym);
    const r = Math.floor(idx / CARO_SIZE);
    const c = idx % CARO_SIZE;
    const centerBias = 6 - (Math.abs(r - 2.5) + Math.abs(c - 2.5));

    let weight = centerBias + Math.random() * 2;
    if (defend.maxRun >= 3) weight += 120;
    if (attack.maxRun >= 3) weight += 105;
    weight += attack.score * 1.1 + defend.score * 1.15;

    if (weight > bestWeight) {
      bestWeight = weight;
      bestIdx = idx;
    }
  }
  return bestIdx;
}
