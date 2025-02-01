import React from "react";
import Cell from "./cell.js";
import useSound from "use-sound";
import LRUCache from "lru-cache";
class Grid extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      playerOneTurn: 0,
      board: [],
      boardDisplay: [],
      message: "PLAYER 1 GO!",
      isAIThinking: false,
    };
    this.cache = new LRUCache({ max: 800 });
    this.worker = null;
  }
  componentDidMount() {
    this.worker = new Worker('/aiWorker.js');
    this.initBoard();
  }

  componentWillUnmount() {
    if (this.worker) {
      this.worker.terminate();
    }
  }

  dropPiece(col, player) {
    const row = this.nextAvalibleRowInCol(col);
    if (row === -1) return false; // Invalid move
    
    const updatedBoard = [...this.state.board];
    updatedBoard[row][col] = player;
    this.setState({ board: updatedBoard });
    return true;
  }
  evaluateBoard() {
    const player = 2; // AI player
    const opponent = 1; // Human player
  
    let score = 0;
    for (let row = 0; row < 6; row++) {
      if (this.state.board[row][3] === player) {
        score += 1; // Assign a small score for each piece in the center column
      }
    }

    // Evaluate horizontally
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 4; col++) {
        const window = this.state.board[row].slice(col, col + 4);
        score += this.evaluateWindow(window, player, opponent);
      }
    }
  
    // Evaluate vertically
    for (let col = 0; col < 7; col++) {
      for (let row = 0; row < 3; row++) {
        const window = [this.state.board[row][col], this.state.board[row + 1][col], this.state.board[row + 2][col], this.state.board[row + 3][col]];
        score += this.evaluateWindow(window, player, opponent);
      }
    }
  
    // Evaluate left-leaning (/) diagonals
    for (let row = 3; row < 6; row++) {
      for (let col = 0; col < 4; col++) {
        const window = [
          this.state.board[row][col],
          this.state.board[row - 1][col + 1],
          this.state.board[row - 2][col + 2],
          this.state.board[row - 3][col + 3]
        ];
        score += this.evaluateWindow(window, player, opponent);
      }
    }
    // Evaluate right-leaning (\) diagonals
    for (let row = 3; row < 6; row++) {
      for (let col = 3; col < 7; col++) {
        const window = [
          this.state.board[row][col],
          this.state.board[row - 1][col - 1],
          this.state.board[row - 2][col - 2],
          this.state.board[row - 3][col - 3]
        ];
        score += this.evaluateWindow(window, player, opponent);
      }
    }
    return score;
  }
  
  evaluateWindow(window, player, opponent) {
    let playerCount = window.filter(cell => cell === player).length;
    let opponentCount = window.filter(cell => cell === opponent).length;
  
    // Give higher scores to windows with more AI player's pieces
    if (playerCount === 4) return 10000;
    if (playerCount === 3 && opponentCount === 0) return 100;
    if (playerCount === 2 && opponentCount === 0) return 10;
  
    // Penalize opponent windows
    if (opponentCount === 3 && playerCount === 0) return -100;
    if (opponentCount === 2 && playerCount === 0) return -10;
    
    return 0;
  }
  
  miniMax(depth, isMaximizing, alpha, beta) {
    const boardKey =
      JSON.stringify(this.state.board) + (isMaximizing ? "_P2" : "_P1");
    if (this.cache.has(boardKey)) {
      const cached = this.cache.get(boardKey);
      if (cached.depth >= depth) {
        return cached.score;
      }
    }
    const moves = this.getAllPossibleMoves();
    let score = 0;
    if (this.gameOver() || moves.length === 0 || depth === 0) {
      if (this.checkWinner() === "P1") {
        return -Infinity;
      } else if (this.checkWinner() === "P2") {
        return Infinity;
      } else if (moves.length === 0) {
        return 0;
      } else {
        const x = this.evaluateBoard();
        this.cache.set(boardKey, { score: x, depth: depth });
        return x;
      }
    } else {
      if (isMaximizing) {
        let bestScore = -Infinity;
        for (let i = 0; i < moves.length; i++) {
          this.dropPiece(moves[i], 2);
          score = this.miniMax(depth - 1, false, alpha, beta);
          this.undoMove(moves[i], 2);
          bestScore = Math.max(score, bestScore);
          alpha = Math.max(alpha, bestScore);
          if (beta <= alpha) {
            break;
          }
        }
        this.cache.set(boardKey, { score: bestScore, depth: depth });
        return bestScore;
      } else {
        let bestScore = Infinity;
        for (let i = 0; i < moves.length; i++) {
          this.dropPiece(moves[i], 1);
          score = this.miniMax(depth - 1, true, alpha, beta);
          this.undoMove(moves[i], 1);
          bestScore = Math.min(score, bestScore);
          beta = Math.min(beta, bestScore);
          if (beta <= alpha) {
            break;
          }
        }
        this.cache.set(boardKey, { score: bestScore, depth: depth });
        return bestScore;
      }
    }
  }

  undoMove(col, player) {
    const row = this.nextAvalibleRowInCol(col) + 1;
    const updatedBoard = [...this.state.board];
    updatedBoard[row][col] = 0;

    this.setState({ board: updatedBoard });
  }
  nextAvalibleRowInCol(col) {
    for (let row = 5; row >= 0; row--) {
      if (this.state.board[row][col] === 0) {
        return row;
      }
    }
    return -1;  // Column is full
  }

  updateboard() {
    var NewBoard = [];
    for (var i = 0; i < 6; i++) {
      for (var j = 0; j < 7; j++) {
        NewBoard.push(
          <Cell
            clicked={this.clicked}
            key={`${i}-${j}`}
            colIndex={j}
            id={this.toAString(j)}
            spot={this.state.board[i][j]}
          />
        );
      }
    }
    this.setState({
      boardDisplay: NewBoard
    });
  }

  validMove(col) {
    return this.nextAvalibleRowInCol(col) !== -1;
  }
  gameOver() {
    var rows = 6;
    var cols = 7;
    var gameOver = false;
    var horizontalCounterP1 = 0;
    var horizontalCounterP2 = 0;
    for (var i = 0; i < rows; i++) {
      horizontalCounterP1 = 0;
      horizontalCounterP2 = 0;
      for (var j = 0; j < cols; j++) {
        if (this.state.board[i][j] === 1) {
          horizontalCounterP1++;
        } else {
          horizontalCounterP1 = 0;
        }
        if (this.state.board[i][j] === 2) {
          horizontalCounterP2++;
        } else {
          horizontalCounterP2 = 0;
        }

        if (horizontalCounterP2 >= 4) {
          gameOver = true;
          break;
        }
        if (horizontalCounterP1 >= 4) {
          gameOver = true;
          break;
        }
      }
    }
    var verticalCounterP1 = 0;
    var verticalCounterP2 = 0;
    for (i = 0; i < cols; i++) {
      verticalCounterP1 = 0;
      verticalCounterP2 = 0;
      for (j = 0; j < rows; j++) {
        if (this.state.board[j][i] === 1) {
          verticalCounterP1++;
        } else {
          verticalCounterP1 = 0;
        }
        if (this.state.board[j][i] === 2) {
          verticalCounterP2++;
        } else {
          verticalCounterP2 = 0;
        }

        if (verticalCounterP1 >= 4) {
          gameOver = true;
          break;
        }
        if (verticalCounterP2 >= 4) {
          gameOver = true;
          break;
        }
      }
    }

    var diagonalCounterP1 = 0;
    var diagonalCounterP2 = 0;
    for (var k = 0; k < rows; k++) {
      diagonalCounterP1 = 0;
      diagonalCounterP2 = 0;
      for (j = 0; j <= k; j++) {
        i = k - j;
        if (this.state.board[i][j] === 1) {
          diagonalCounterP1++;
        } else {
          diagonalCounterP1 = 0;
        }
        if (this.state.board[i][j] === 2) {
          diagonalCounterP2++;
        } else {
          diagonalCounterP2 = 0;
        }

        if (diagonalCounterP1 >= 4) {
          gameOver = true;
        }
        if (diagonalCounterP2 >= 4) {
          gameOver = true;
        }
      }
    }
    for (k = cols - 2; k >= 0; k--) {
      diagonalCounterP1 = 0;
      diagonalCounterP2 = 0;
      for (j = 0; j <= k; j++) {
        i = k - j - 1;

        if (this.state.board[cols - j - 2][cols - i - 2] === 1) {
          diagonalCounterP1++;
        } else {
          diagonalCounterP1 = 0;
        }
        if (this.state.board[cols - j - 2][cols - i - 2] === 2) {
          diagonalCounterP2++;
        } else {
          diagonalCounterP2 = 0;
        }

        if (diagonalCounterP1 >= 4) {
          gameOver = true;
        }
        if (diagonalCounterP2 >= 4) {
          gameOver = true;
        }
      }
    }

    // reverse diagonal (Bottom right to top left)

    for (i = rows - 1; i >= 0; i--) {
      diagonalCounterP1 = 0;
      diagonalCounterP2 = 0;

      for (var j = 0, x = i; x <= rows - 1; j++, x++) {
        if (this.state.board[x][j] === 1) {
          diagonalCounterP1++;
        } else {
          diagonalCounterP1 = 0;
        }
        if (this.state.board[x][j] === 2) {
          diagonalCounterP2++;
        } else {
          diagonalCounterP2 = 0;
        }

        if (diagonalCounterP1 >= 4) {
          gameOver = true;
        }
        if (diagonalCounterP2 >= 4) {
          gameOver = true;
        }
      }
    }

    for (i = 0; i <= rows - 1; i++) {
      diagonalCounterP1 = 0;
      diagonalCounterP2 = 0;

      for (var j = 0, z = i; z <= rows - 1; j++, z++) {
        if (this.state.board[j][z + 1] === 1) {
          diagonalCounterP1++;
        } else {
          diagonalCounterP1 = 0;
        }
        if (this.state.board[j][z + 1] === 2) {
          diagonalCounterP2++;
        } else {
          diagonalCounterP2 = 0;
        }

        if (diagonalCounterP1 >= 4) {
          gameOver = true;
        }
        if (diagonalCounterP2 >= 4) {
          gameOver = true;
        }
      }
    }
    // to check to see if any player got a vertical 4 in a row

    //both of these only check the diagonals from the left side to the right side (Bottom left to top right /)

    return gameOver;
  }

  toAString(x) {
    if (x === 1) {
      return "one";
    }
    if (x === 2) {
      return "two";
    }
    if (x === 3) {
      return "three";
    }
    if (x === 4) {
      return "four";
    }
    if (x === 5) {
      return "five";
    }
    if (x === 6) {
      return "six";
    } else {
      return "seven";
    }
  }

  checkWinner() {
    var rows = 6;
    var cols = 7;
    // checks to see if player got 4 horizontally in a row
    var horizontalCounterP1 = 0;
    var horizontalCounterP2 = 0;
    for (var i = 0; i < rows; i++) {
      horizontalCounterP1 = 0;
      horizontalCounterP2 = 0;
      for (var j = 0; j < cols; j++) {
        if (this.state.board[i][j] === 1) {
          horizontalCounterP1++;
        } else {
          horizontalCounterP1 = 0;
        }
        if (this.state.board[i][j] === 2) {
          horizontalCounterP2++;
        } else {
          horizontalCounterP2 = 0;
        }

        if (horizontalCounterP2 >= 4) {
          return "P2";
        }
        if (horizontalCounterP1 >= 4) {
          return "P1";
        }
      }
    }
    var verticalCounterP1 = 0;
    var verticalCounterP2 = 0;
    for (i = 0; i < cols; i++) {
      verticalCounterP1 = 0;
      verticalCounterP2 = 0;
      for (j = 0; j < rows; j++) {
        if (this.state.board[j][i] === 1) {
          verticalCounterP1++;
        } else {
          verticalCounterP1 = 0;
        }
        if (this.state.board[j][i] === 2) {
          verticalCounterP2++;
        } else {
          verticalCounterP2 = 0;
        }

        if (verticalCounterP1 >= 4) {
          return "P1";
        }
        if (verticalCounterP2 >= 4) {
          return "P2";
        }
      }
    }

    var diagonalCounterP1 = 0;
    var diagonalCounterP2 = 0;
    for (var k = 0; k < rows; k++) {
      diagonalCounterP1 = 0;
      diagonalCounterP2 = 0;
      for (j = 0; j <= k; j++) {
        i = k - j;
        if (this.state.board[i][j] === 1) {
          diagonalCounterP1++;
        } else {
          diagonalCounterP1 = 0;
        }
        if (this.state.board[i][j] === 2) {
          diagonalCounterP2++;
        } else {
          diagonalCounterP2 = 0;
        }

        if (diagonalCounterP1 >= 4) {
          return "P1";
        }
        if (diagonalCounterP2 >= 4) {
          return "P2";
        }
      }
    }
    for (k = cols - 2; k >= 0; k--) {
      diagonalCounterP1 = 0;
      diagonalCounterP2 = 0;
      for (j = 0; j <= k; j++) {
        i = k - j - 1;

        if (this.state.board[cols - j - 2][cols - i - 2] === 1) {
          diagonalCounterP1++;
        } else {
          diagonalCounterP1 = 0;
        }
        if (this.state.board[cols - j - 2][cols - i - 2] === 2) {
          diagonalCounterP2++;
        } else {
          diagonalCounterP2 = 0;
        }

        if (diagonalCounterP1 >= 4) {
          return "P1";
        }
        if (diagonalCounterP2 >= 4) {
          return "P2";
        }
      }
    }

    // reverse diagonal (Bottom right to top left)

    for (i = rows - 1; i >= 0; i--) {
      diagonalCounterP1 = 0;
      diagonalCounterP2 = 0;

      for (var j = 0, x = i; x <= rows - 1; j++, x++) {
        if (this.state.board[x][j] === 1) {
          diagonalCounterP1++;
        } else {
          diagonalCounterP1 = 0;
        }
        if (this.state.board[x][j] === 2) {
          diagonalCounterP2++;
        } else {
          diagonalCounterP2 = 0;
        }

        if (diagonalCounterP1 >= 4) {
          return "P1";
        }
        if (diagonalCounterP2 >= 4) {
          return "P2";
        }
      }
    }

    for (i = 0; i <= rows - 1; i++) {
      diagonalCounterP1 = 0;
      diagonalCounterP2 = 0;

      for (var j = 0, z = i; z <= rows - 1; j++, z++) {
        if (this.state.board[j][z + 1] === 1) {
          diagonalCounterP1++;
        } else {
          diagonalCounterP1 = 0;
        }
        if (this.state.board[j][z + 1] === 2) {
          diagonalCounterP2++;
        } else {
          diagonalCounterP2 = 0;
        }

        if (diagonalCounterP1 >= 4) {
          return "P1";
          // System.out.println("GAME OVER Player 1 WINS!");
        }
        if (diagonalCounterP2 >= 4) {
          return "P2";
          // System.out.println("GAME OVER Player 2 WINS!");
        }
      }
    }
    // to check to see if any player got a vertical 4 in a row

    //both of these only check the diagonals from the left side to the right side (Bottom left to top right /)

    return "NONE";
  }

  initBoard(p) {
    var stateBoard = [
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0]
    ];
    
    var NewBoard = [];
    for (var i = 0; i < 6; i++) {
      for (var j = 0; j < 7; j++) {
        NewBoard.push(
          <Cell
            clicked={this.clicked}
            key={`${i}-${j}`}
            colIndex={j}
            id={this.toAString(j)}
            spot={stateBoard[i][j]}
          />
        );
      }
    }

    if (p) {
      this.setState({
        playerOneTurn: 1,
        board: stateBoard,
        boardDisplay: NewBoard,
        message: "AI is thinking...",
      }, async () => {
        await this.playAI();
      });
    } else {
      this.setState({
        board: stateBoard,
        boardDisplay: NewBoard,
        message: "NEW GAME! YOU GO FIRST",
      });
    }
  }

  getAllPossibleMoves() {
    var cols = 7;
    var possibles = [];
    for (var i = 0; i < cols; i++) {
      if (this.state.board[0][i] === 0) {
        possibles.push(i);
      }
    }
    return possibles;
  }
  aiBestMove() {
    var scores = [];
    var allPossibleMoves = this.getAllPossibleMoves();
    var score = 0;
    var bestScore = -Infinity;
    var bestMoveDistanceFromCenter = Infinity;
    var move = 0;
    var alpha = -Infinity;
    var beta = Infinity;
    var centerColumnIndex = 3; // Middle column for a 7-column board
  
    for (var i = 0; i < allPossibleMoves.length; i++) {
      this.dropPiece(allPossibleMoves[i], 2);
      score = this.miniMax(8, false, alpha, beta);
      scores.push(score);
      this.undoMove(allPossibleMoves[i], 2);
  
      var distanceFromCenter = Math.abs(allPossibleMoves[i] - centerColumnIndex);
      if (score > bestScore || (score === bestScore && distanceFromCenter < bestMoveDistanceFromCenter)) {
        bestScore = score;
        move = allPossibleMoves[i];
        bestMoveDistanceFromCenter = distanceFromCenter;
      }
    }
    console.log(scores);
    return move;
  }
  isBoardFull() {
    // Check if any column in top row has an empty space
    return this.state.board[0].every(cell => cell !== 0);
  }
  checkGameOver() {
    if (this.gameOver()) {
      if (this.checkWinner() === "P1") {
        this.setState({
          message: "YOU WIN. ENTER YOUR NAME TO SAVE IT TO THE WEBSITE!",
        });
      } else if (this.checkWinner() === "P2") {
        this.setState({ message: "YOU LOST!" });
      }
    } else if (this.isBoardFull()) {
      // Add explicit tie check
      this.setState({ 
        message: "IT'S A TIE!",
      });
    }
  }
  clicked = async (colIndex) => {
    if (this.validMove(colIndex)) {
      if (!this.gameOver() && !this.isBoardFull()) {  // Add tie check
        if (this.state.playerOneTurn % 2 === 0) {
          // Player's move
          if (this.dropPiece(colIndex, 1)) {
            this.setState({ playerOneTurn: 1 });
            this.updateboard();
            
            const audio = new Audio("/plop.mp3");
            await audio.play();
            
            // Check for tie after player move
            if (this.isBoardFull()) {
              this.checkGameOver();
              return;
            }
            
            // Start AI turn
            await this.playAI();
            this.checkGameOver();
          }
        }
      } else {
        this.checkGameOver();
      }
    } else {
      if (!this.gameOver()) {
        this.setState({ message: "INVALID MOVE. Column is full!" });
      }
    }
  };
  
  runAIMove = () => {
    return new Promise(resolve => {
      this.worker.onmessage = (e) => {
        resolve(e.data);
      };
      this.worker.postMessage({ board: this.state.board });
    });
  };

  completeAIMove = async (move) => {
    this.dropPiece(move, 2);
    this.updateboard();
    
    const audio = new Audio("/plop.mp3");
    await audio.play();
    
    // Check for tie after AI move
    if (this.isBoardFull()) {
      this.setState({ message: "IT'S A TIE!" });
      return;
    }
    
    this.setState({ 
      message: "YOUR TURN!", 
      playerOneTurn: 2 
    });
    
    this.checkGameOver();
  };

  playAI = async () => {
    this.setState({ message: "AI is thinking..." });
    const move = await this.runAIMove();
    await this.completeAIMove(move);
  };

  render() {
    return (
      <div className="all">
        <div className="container-top">
          <input
            className="buttononly1"
            type="submit"
            value="RESET GAME and GO FIRST"
            onClick={() => this.initBoard(0)}
          />
          <input
            className="buttononly1"
            type="submit"
            value="RESET GAME and GO SECOND"
            onClick={() => this.initBoard(1)}
          />
        </div>

        <div className="board">
          {this.state.boardDisplay}
        </div>
        <div className="container-top">
          <div className="message">{this.state.message}</div>
        </div>
      </div>
    );
  }
  
}

export default Grid;
