self.onmessage = function(e) {
  const { board } = e.data;
  const ROWS = 6;
  const COLS = 7;
  const MAX_DEPTH = 11;  // Increased depth for better lookahead
  

  // Remove positionCache and just keep transposition table
  const transpositionTable = new Map();

  // Modify the SCORE_TABLE with stronger defensive values
  const SCORE_TABLE = {
    '4,0': 100000,    // 4 player pieces - winning
    '0,4': -100000,   // 4 opponent pieces - losing
    '3,0': 10000,     // 3 player pieces - strong threat
    '0,3': -20000,    // 3 opponent pieces - critical block needed (higher to prioritize defense)
    '2,0': 1000,      // 2 player pieces - developing
    '0,2': -3000      // 2 opponent pieces - need to block (higher to prioritize defense)
  };

  function evaluateWindow(window, player, opponent) {
    const playerCount = window.filter(cell => cell === player).length;
    const opponentCount = window.filter(cell => cell === opponent).length;
    
    // If mixed pieces, return basic score
    if (playerCount > 0 && opponentCount > 0) {
      return playerCount * 100 - opponentCount * 100;
    }
    
    // Lookup score for pure sequences
    const key = `${playerCount},${opponentCount}`;
    return SCORE_TABLE[key] || (playerCount * 100 - opponentCount * 100);
  }

  function evaluatePosition(board, row, col, player, opponent) {
    let score = 0;
    
    // Horizontal
    for (let c = Math.max(0, col - 3); c <= Math.min(col, COLS - 4); c++) {
      const window = board[row].slice(c, c + 4);
      score += evaluateWindow(window, player, opponent);
    }

    // Vertical
    if (row <= 2) {
      const window = [
        board[row][col],
        board[row + 1][col],
        board[row + 2][col],
        board[row + 3][col]
      ];
      score += evaluateWindow(window, player, opponent);
    }

    // Diagonal (/)
    for (let r = row - 3, c = col - 3; r <= row, c <= col; r++, c++) {
      if (r >= 0 && r <= 2 && c >= 0 && c <= 3) {
        const window = [
          board[r][c],
          board[r + 1][c + 1],
          board[r + 2][c + 2],
          board[r + 3][c + 3]
        ];
        score += evaluateWindow(window, player, opponent);
      }
    }

    // Diagonal (\)
    for (let r = row - 3, c = col + 3; r <= row, c >= col; r++, c--) {
      if (r >= 0 && r <= 2 && c >= 3 && c <= 6) {
        const window = [
          board[r][c],
          board[r + 1][c - 1],
          board[r + 2][c - 2],
          board[r + 3][c - 3]
        ];
        score += evaluateWindow(window, player, opponent);
      }
    }

    return score;
  }

  // Modify evaluateBoard for better defensive play
  function evaluateBoard(board) {
    const player = 2;
    const opponent = 1;
    let score = 0;

    // Center control weight
    const centerColumn = 3;
    const centerWeight = 300;

    // Check for immediate threats first
    for (let col = 0; col < COLS; col++) {
      if (isWinningMove(board, col, opponent)) {
        score -= 50000; // Heavy penalty for allowing winning moves
      }
      if (isWinningMove(board, col, player)) {
        score += 50000; // High reward for creating winning positions
      }
    }

    // Center column control
    for (let row = 0; row < ROWS; row++) {
      if (board[row][centerColumn] === player) {
        score += centerWeight * (row + 1); // More value for lower positions
      }
      if (board[row][centerColumn] === opponent) {
        score -= centerWeight * (row + 1);
      }
    }

    // Evaluate all positions
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        if (board[row][col] !== 0) {
          // Evaluate horizontal windows
          if (col <= 3) {
            const window = board[row].slice(col, col + 4);
            score += evaluateWindow(window, player, opponent);
          }

          // Evaluate vertical windows
          if (row <= 2) {
            const window = [
              board[row][col],
              board[row + 1][col],
              board[row + 2][col],
              board[row + 3][col]
            ];
            score += evaluateWindow(window, player, opponent);
          }

          // Evaluate diagonal windows
          if (row <= 2 && col <= 3) {
            const window1 = [
              board[row][col],
              board[row + 1][col + 1],
              board[row + 2][col + 2],
              board[row + 3][col + 3]
            ];
            score += evaluateWindow(window1, player, opponent);
          }

          if (row <= 2 && col >= 3) {
            const window2 = [
              board[row][col],
              board[row + 1][col - 1],
              board[row + 2][col - 2],
              board[row + 3][col - 3]
            ];
            score += evaluateWindow(window2, player, opponent);
          }
        }
      }
    }

    return score;
  }

  function isWinningMove(board, col, player) {
    const row = nextAvailableRow(board, col);
    if (row === -1) return false;

    const newBoard = makeMove(board, col, player);
    return checkWin(newBoard, row, col, player);
  }

  function checkWin(board, row, col, player) {
    // Horizontal
    for (let c = Math.max(0, col - 3); c <= Math.min(col, COLS - 4); c++) {
      if (board[row].slice(c, c + 4).every(cell => cell === player)) return true;
    }

    // Vertical
    if (row <= 2) {
      if ([0,1,2,3].every(i => board[row + i][col] === player)) return true;
    }

    // Diagonal (/)
    for (let r = row - 3, c = col - 3; r <= row, c <= col; r++, c++) {
      if (r >= 0 && r <= 2 && c >= 0 && c <= 3) {
        if ([0,1,2,3].every(i => board[r + i][c + i] === player)) return true;
      }
    }

    // Diagonal (\)
    for (let r = row - 3, c = col + 3; r <= row, c >= col; r++, c--) {
      if (r >= 0 && r <= 2 && c >= 3 && c <= 6) {
        if ([0,1,2,3].every(i => board[r + i][c - i] === player)) return true;
      }
    }

    return false;
  }

  function nextAvailableRow(board, col) {
    for (let row = ROWS - 1; row >= 0; row--) {
      if (board[row][col] === 0) return row;
    }
    return -1;
  }

  function makeMove(board, col, player) {
    const newBoard = board.map(row => [...row]);
    const row = nextAvailableRow(board, col);
    if (row !== -1) newBoard[row][col] = player;
    return newBoard;
  }

  // Modify getAllPossibleMoves to be more defensive
  function getAllPossibleMoves(board) {
    const moves = [];
    const colOrder = [3, 2, 4, 1, 5, 0, 6];
    
    // First check for winning moves
    for (const col of colOrder) {
      if (board[0][col] === 0 && isWinningMove(board, col, 2)) {
        return [col];
      }
    }

    // Then check for opponent winning moves to block
    for (const col of colOrder) {
      if (board[0][col] === 0 && isWinningMove(board, col, 1)) {
        return [col]; // Must block immediately
      }
    }

    // Then check for moves that create winning opportunities
    for (const col of colOrder) {
      if (board[0][col] === 0) {
        const row = nextAvailableRow(board, col);
        if (row !== -1) {
          const newBoard = makeMove(board, col, 2);
          let threatCount = 0;
          // Check if this move creates multiple winning threats
          for (let c = 0; c < COLS; c++) {
            if (isWinningMove(newBoard, c, 2)) {
              threatCount++;
            }
          }
          if (threatCount >= 2) {
            moves.unshift(col); // Prioritize moves that create multiple threats
            continue;
          }
        }
        moves.push(col);
      }
    }

    return moves;
  }

  // Optimize getBoardKey for faster hashing
  function getBoardKey(board) {
    let key = '';
    for (let i = 0; i < ROWS; i++) {
      for (let j = 0; j < COLS; j++) {
        key += board[i][j];
      }
    }
    return key;
  }

  function getPositionHash(board, depth, isMaximizing) {
    // More efficient hashing
    return getBoardKey(board) + depth + (isMaximizing ? '1' : '0');
  }

  function hasAdjacentPieces(board, row, col) {
    const directions = [[-1,0], [1,0], [0,-1], [0,1], [-1,-1], [-1,1], [1,-1], [1,1]];
    
    for (const [dx, dy] of directions) {
      const newRow = row + dx;
      const newCol = col + dy;
      if (newRow >= 0 && newRow < ROWS && newCol >= 0 && newCol < COLS) {
        if (board[newRow][newCol] !== 0) return true;
      }
    }
    return false;
  }

  function getTacticalMoves(board) {
    const moves = [];
    const colOrder = [3, 2, 4, 1, 5, 0, 6];
    
    for (const col of colOrder) {
      if (board[0][col] === 0) {
        const row = nextAvailableRow(board, col);
        if (row === -1) continue;

        if (isWinningMove(board, col, 2) || 
            isWinningMove(board, col, 1) ||
            hasAdjacentPieces(board, row, col)) {
          moves.push(col);
        }
      }
    }
    return moves;
  }


  // Add a simple cache for move sorting results
  const sortedMovesCache = new Map();

  // Modify sortMoves to consider position value
  function sortMoves(board, moves, isMaximizing) {
    const player = isMaximizing ? 2 : 1;
    const centerColumn = 3;
    
    return moves.sort((a, b) => {
      const boardA = makeMove(board, a, player);
      const boardB = makeMove(board, b, player);
      
      // Get base scores
      const scoreA = evaluateBoard(boardA);
      const scoreB = evaluateBoard(boardB);
      
      // Add center proximity bonus
      const centerDistanceA = Math.abs(a - centerColumn);
      const centerDistanceB = Math.abs(b - centerColumn);
      
      const centerBonusA = (4 - centerDistanceA) * 100;
      const centerBonusB = (4 - centerDistanceB) * 100;
      
      const totalScoreA = scoreA + centerBonusA;
      const totalScoreB = scoreB + centerBonusB;
      
      return isMaximizing ? totalScoreB - totalScoreA : totalScoreA - totalScoreB;
    });
  }

  // Optimize miniMax with better pruning and caching
  function miniMax(board, depth, isMaximizing, alpha, beta) {
    const posHash = getPositionHash(board, depth, isMaximizing);
    
    // Check transposition table
    if (transpositionTable.has(posHash)) {
      return transpositionTable.get(posHash);
    }

    let moves = getAllPossibleMoves(board);
    
    // Quick win detection
    if (moves.length === 1 && isWinningMove(board, moves[0], isMaximizing ? 2 : 1)) {
      return isMaximizing ? 99999 : -99999;
    }

    // Leaf node evaluation
    if (depth === 0 || moves.length === 0) {
      const score = evaluateBoard(board);
      transpositionTable.set(posHash, score);
      return score;
    }

    moves = sortMoves(board, moves, isMaximizing);
    const player = isMaximizing ? 2 : 1;
    let bestScore = isMaximizing ? -Infinity : Infinity;

    // Principal Variation Search
    if (depth >= 3) {
      const firstMove = moves[0];
      const newBoard = makeMove(board, firstMove, player);
      bestScore = -miniMax(newBoard, depth - 1, !isMaximizing, -beta, -alpha);
      
      if (bestScore >= beta) {
        transpositionTable.set(posHash, bestScore);
        return bestScore;
      }
      alpha = Math.max(alpha, bestScore);
      moves = moves.slice(1);
    }

    // Regular alpha-beta search for remaining moves
    for (const move of moves) {
      const newBoard = makeMove(board, move, player);
      const score = -miniMax(newBoard, depth - 1, !isMaximizing, -beta, -alpha);
      
      if (isMaximizing) {
        bestScore = Math.max(bestScore, score);
        alpha = Math.max(alpha, score);
      } else {
        bestScore = Math.min(bestScore, score);
        beta = Math.min(beta, score);
      }
      
      if (beta <= alpha) break;
    }

    transpositionTable.set(posHash, bestScore);
    return bestScore;
  }

  // Replace the existing OPENING_BOOK with this perfect play version
  const OPENING_BOOK = {
    // When AI goes second (player 1 starts)
    "000000000000000000000000000000000000100000": 3, // If P1 center -> AI center
    "000000000000000000000000000000000100000000": 3, // If P1 col 0 -> AI center
    "000000000000000000000000000000000010000000": 3, // If P1 col 1 -> AI center
    "000000000000000000000000000000000001000000": 3, // If P1 col 2 -> AI center
    "000000000000000000000000000000000000010000": 3, // If P1 col 4 -> AI center
    "000000000000000000000000000000000000001000": 3, // If P1 col 5 -> AI center
    "000000000000000000000000000000000000000100": 3, // If P1 col 6 -> AI center
    
    // When AI goes first
    "000000000000000000000000000000000000000000": 3, // AI starts -> center
  };

  // Modify getOpeningMove to include more detailed logging
  function getOpeningMove(board) {
    const boardKey = getBoardKey(board);
    const bookMove = OPENING_BOOK[boardKey];
    
    if (bookMove !== undefined) {
      console.log('Perfect play position found!');
      console.log('Board position:', boardKey);
      
      // Count pieces to determine if AI is player 1 or 2
      let pieces = 0;
      for (let i = 0; i < ROWS; i++) {
        for (let j = 0; j < COLS; j++) {
          if (board[i][j] !== 0) pieces++;
        }
      }
      const isAIFirst = pieces % 2 === 0;
      
      // Visual representation of the board
      let visual = '\nCurrent position:\n';
      for (let i = 0; i < ROWS; i++) {
        let row = '';
        for (let j = 0; j < COLS; j++) {
          if (board[i][j] === 0) row += '· ';
          else if (board[i][j] === 1) row += '○ ';
          else row += '● ';
        }
        visual += row + '\n';
      }
      console.log(visual);
      console.log(`AI playing as ${isAIFirst ? 'first' : 'second'} player`);
      console.log('Playing perfect move in column:', bookMove + 1);
    }
    
    return bookMove;
  }

  // Modify getBestMove to include more logging
  function getBestMove(board) {
    // Check opening book first
    const bookMove = getOpeningMove(board);
    if (bookMove !== undefined) {
      console.log('Using opening book move!');
      return bookMove;
    } else {
      console.log('No opening book move found, calculating best move...');
    }

    // Existing getBestMove logic...
    const moves = getAllPossibleMoves(board);
    let bestScore = -Infinity;
    let bestMove = moves[0];

    // Quick win/block checks
    for (const move of moves) {
      if (isWinningMove(board, move, 2)) return move;
    }
    for (const move of moves) {
      if (isWinningMove(board, move, 1)) return move;
    }

    // Use aspiration windows for more efficient search
    let alpha = -Infinity;
    let beta = Infinity;
    const window = 1000;

    for (const move of sortMoves(board, moves, true)) {
      const newBoard = makeMove(board, move, 2);
      let score;
      
      // Use aspiration windows
      if (bestScore === -Infinity) {
        score = -miniMax(newBoard, MAX_DEPTH, false, -beta, -alpha);
      } else {
        alpha = bestScore - window;
        beta = bestScore + window;
        score = -miniMax(newBoard, MAX_DEPTH, false, -beta, -alpha);
        
        // If score falls outside window, do a full re-search
        if (score <= alpha || score >= beta) {
          score = -miniMax(newBoard, MAX_DEPTH, false, -Infinity, Infinity);
        }
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    return bestMove;
  }

  const bestMove = getBestMove(board);
  self.postMessage(bestMove);

  // Add periodic cleanup of caches
  setInterval(() => {
    if (transpositionTable.size > 1000000) {
      transpositionTable.clear();
    }
    if (sortedMovesCache.size > 10000) {
      sortedMovesCache.clear();
    }
  }, 30000);
}; 