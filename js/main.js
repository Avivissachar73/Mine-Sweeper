'use strict';

//constants
const BOMB = 'B';
const FLAG = '|>';
const GAME_ON = '😶';
const GAME_OVER = 'Game Over..\n😭';
const VICTORY = 'You Win!\n🤠';
const HIGH_SCORE = 'You Win!\n🤯\n You Broke The High Score!';

const LEVELS = [{idx: 0,level: 'Easy',boardSize: 4, amountOfBombs: 2, health: 1}, 
                 {idx: 1,level: 'Medium',boardSize: 8, amountOfBombs: 12, health: 3}, 
                 {idx: 2,level: 'Hard',boardSize: 12, amountOfBombs: 30, health: 5}];

//global variable
var gGame = {
    board: null,

    isGameOn: false,
    isGameOver: false,

    levelIdx: LEVELS[1].idx,
    boardSize: LEVELS[1].boardSize,
    level: LEVELS[1].level,
    health: LEVELS[1].health,

    amountOfBombs: 0,
    flagedBombsCount: 0,
    markedCellsCount: 0,
    bombedCellsCount: 0,
// 
    bestTime: +localStorage.getItem('MediumBestTime'),
    bestTimeStr: localStorage.getItem('MediumBestTimeStr'),

    safeClickCount: 3,
    areaHintCount: 3,

    isFirstClick: true,
    isAreaHint: false,
    isManualMinePosMod: false,
    isManualPosOn: false,

    timerInterval: null,
    startTime: null,
    endTime: null,
    totalGameTime: null
}

//restart and set the game
//rest the globlal variables and render the game board and information to the document
function init() {
    document.oncontextmenu = function() {return false;} //disable the right click context menu.
    
    gGame.isGameOver = false;
    gGame.isGameOn = false;

    gGame.flagedBombsCount = 0;
    gGame.markedCellsCount = 0;
    gGame.bombedCellsCount = 0;
    gGame.amountOfBombs = 0;
    gGame.safeClickCount = 3;
    gGame.areaHintCount = 3;

    gGame.health = LEVELS[gGame.levelIdx].health;
    gGame.isFirstClick = true;
    gGame.isAreaHint = false;
    gGame.isManualMinePosMod = false;
    gGame.isManualPosOn = false;

    gTimeParts.miliSec = 0;
    gTimeParts.sec = 0;
    gTimeParts.min = 0;
    gTimeParts.milSecStr = '00';
    gTimeParts.secondsStr= '00';
    gTimeParts.minutesStr = '00';
    
    clearInterval(gGame.timerInterval);
    gGame.timerInterval = null;

    gGame.bestTime = (localStorage.getItem(gGame.level+'BestTime'))? gGame.bestTime : Infinity;

    gGame.board = creatBoard(gGame.boardSize);
    renderBoard(gGame.board);
    renderHealth();

    document.querySelector('.game-container .game-statuse').innerText = GAME_ON;
    document.querySelector('.game-container .hint-buttons .safe-button span').innerText = gGame.safeClickCount;
    document.querySelector('.game-container .hint-buttons .hint-area-button span').innerText = gGame.areaHintCount;
    document.querySelector('.game-container .high-score h3 span').innerText = (gGame.bestTimeStr)? gGame.bestTimeStr : 'There is no best time..';
    document.querySelector('.game-container .stopwatch span').innerText = '00:00:00';
}

//update health to html
function renderHealth() {
    document.querySelector('.health span').innerText = gGame.health;
}

//set the level and restart the game
//update the global variables acording to the current level of the game
function setLevel(levelIdx) {
    gGame.boardSize = LEVELS[levelIdx].boardSize;
    gGame.level = LEVELS[levelIdx].level;
    gGame.health = LEVELS[levelIdx].health;
    gGame.levelIdx = LEVELS[levelIdx].idx;
    gGame.bestTime = +localStorage.getItem(gGame.level+'BestTime');
    gGame.bestTimeStr = localStorage.getItem(gGame.level+'BestTimeStr');
    init();
}

//check if game is over, if it is - finish the game and let the player know.
function checkIfGameOver() {
    if (gGame.isGameOver) return;
    if (gGame.health === 0) {
        revealBombs();
        document.querySelector('.game-container .game-statuse').innerText = GAME_OVER;
        gameFinish(); 
        return true;
    }
    return false;
}

//check if the game was, if true, finish the game and let the player know
function checkIfVictory() {
    if (gGame.isGameOver) return;
    // if (gGame.markedCellsCount + gGame.flagedBombsCount + gGame.bombedCellsCount === gGame.boardSize**2) {
    if (gGame.markedCellsCount === gGame.boardSize**2 - gGame.amountOfBombs) {
        document.querySelector('.game-container .game-statuse').innerText = VICTORY;
        gameFinish(); 
        checkIfHighScore();
        return true;
    }
    return false;
}

//finish the game - clear the timer interval and get the score
function gameFinish() {
    gGame.isGameOn = false;
    gGame.isGameOver = true;
    gGame.endTime = Date.now();
    getScore();
    clearInterval(gGame.timerInterval);
}

//reveal all the bombs on board when game is over
function revealBombs() {
    for (var i = 0; i < gGame.board.length; i++) {
        for (var j = 0; j < gGame.board[i].length; j++) {
            if (gGame.board[i][j].isBomb) {
                gGame.board[i][j].isMarked = true;
                getCellElement({i: i, j: j}).innerText = BOMB;
            }
        }
    }
}

//draw or undraw a flag on a cell on a right click
function cellFlag(elCell) {
    if (gGame.isGameOver) return;

    var currPos = getCellPos(elCell);
    var currCell = gGame.board[currPos.i][currPos.j];

    if (currCell.isMarked) return;
    
    if (currCell.isFlaged) {
        if (currCell.isBomb) {
            gGame.flagedBombsCount--
        }
        elCell.innerText = null;
        currCell.isFlaged = false;
    }
    else {
        if (currCell.isBomb) {
            gGame.flagedBombsCount++
        }
        elCell.innerText = FLAG;
        currCell.isFlaged = true;
        checkIfVictory();
    }
}

//when a cell is clicked:
    //put mines on board (if manual mine pos mod is on) /
    //hint an area (if area hint is on) / 
    //put a flag if right click was clicked / 
    //check the cells contant if left click
function cellClicked(elCell, event) {
    if (gGame.isGameOver) return;

    console.log(gGame.amountOfBombs);

    var currPos = getCellPos(elCell);
    var currCell = gGame.board[currPos.i][currPos.j];

    if (gGame.isManualPosOn) {
        gGame.isManualMinePosMod = true;
        elCell.innerText = BOMB;
        currCell.isBomb = true;
        gGame.amountOfBombs++;
        return;
    }

    if (gGame.isAreaHint) {
        if (gGame.isFirstClick) {
            firstClick(currPos);
        }
        gGame.isAreaHint = false;
        areaHint(currPos);
        return;
    }

    if (gGame.isFirstClick) firstClick(currPos);

    if (event.button === 2) {
        cellFlag(elCell);
        return
    }

    else if (event.button === 0) {
        checkCellsContents(elCell, currCell, currPos);
    }
}

//if first click, start the game and the timer interval, if it is not a manual mine pos mod, spred mines on the board,
//and count bombs around each cell
function firstClick(currPos) {
    gGame.isFirstClick = false;
    gGame.isGameOn = true;
    gGame.startTime = Date.now();
    gGame.timerInterval = setInterval(stopWatch, 10);
    
    if (!gGame.isManualMinePosMod) {
        gGame.amountOfBombs = LEVELS[gGame.levelIdx].amountOfBombs;
        spreadBombs(gGame.board, gGame.amountOfBombs, currPos);
    }

    countBombs(gGame.board);
}

//check what the cell contant is and reveal it, if it is abomb, update health, if number of bombs around the cell is
//bigger than 0 - reveal the number, and if the number of bombs around the cell is 0, reveal the cell and its neighbors.
function checkCellsContents(elCell, currCell, currPos) {
    if (currCell.isFlaged) return;

    if (currCell.isMarked) return;

    if (currCell.isBomb) {
        gGame.health--;
        renderHealth();
        // gGame.markedCellsCount++;
        gGame.bombedCellsCount++;
        // currCell.isMarked = true;
        elCell.innerText = BOMB;
        elCell.classList.add('bombed');
        currCell.isMarked = true;
        checkIfGameOver();
        checkIfVictory();
        return;
    }
    
    if (currCell.bombsAroundCell > 0) {
        elCell.innerText = currCell.bombsAroundCell;
        currCell.isMarked = true;
        elCell.classList.add('clicked');
        gGame.markedCellsCount++;
    }
    else markCells(currPos);
    
    checkIfVictory();
}

//mark cells - reveal the clicked cell and its neighbors. if one or more of the neighbors's bomb count is 0, run the function
//on their pos too.
function markCells(cellPos) {
    for (var i = cellPos.i - 1; i <= cellPos.i+1; i++) {
        for (var j = cellPos.j - 1; j <= cellPos.j+1; j++) {
            if (gGame.board[i] && gGame.board[i][j]) {
                var currCell = gGame.board[i][j];
                var currCellPos = {i: i, j: j};
                var elCell = getCellElement(currCellPos);

                if (currCell.isBomb || currCell.isFlaged || currCell.isMarked) continue;
                
                currCell.isMarked = true;
                elCell.classList.add('clicked');
                gGame.markedCellsCount++

                if (currCell.bombsAroundCell > 0) {
                    elCell.innerText = currCell.bombsAroundCell
                } else {
                    elCell.innerText = null;
                    markCells(currCellPos);
                }
            }
        }
    }
}

//get html cell element by id, takes a pos such as {i: 3, j: 6}, and returns a cell element from the document game board
function getCellElement(pos) {
    var elCell = document.querySelector(`.cell-${pos.i}-${pos.j}`);
    return elCell;
}

//get cell position. gets a board cell element from the document and returns a pos such as {i: 3, j: 6}
function getCellPos(elCell) {
    var elPos = elCell.classList[1].split('-');
    var pos = {i: +elPos[elPos.length-2], j: +elPos[elPos.length-1]};
    return pos;
}

//render board to html
function renderBoard(board) {
    var boardStr = '';

    boardStr += '<table>';
    for (var i = 0; i < board.length; i++) {
        boardStr += '<tr>';
        for (var j = 0; j < board[0].length; j++) {
            boardStr += `<td onmousedown="cellClicked(this, event)" class="board-cell cell-${i}-${j}"></td>`
        }
        boardStr += '</tr>';
    }
    boardStr += '</table>';

    var elBoard = document.querySelector('.game-container .game-board');
    elBoard.innerHTML = boardStr;
}

//count Bombs around each cell
function countBombs(board) {
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[i].length; j++) {
            var cellPos = {i: i, j: j};
            board[i][j].bombsAroundCell = nbrBombsCount(board, cellPos);
        }
    }
}

//neighbors bombs count, returns the number of bombs around the given cell
function nbrBombsCount(board, cellPos) {
    var count = 0;
    
    for (var i = cellPos.i - 1; i <= cellPos.i+1; i++) {
        for (var j = cellPos.j - 1; j <= cellPos.j+1; j++) {
            if (cellPos.i === i && cellPos.j === j) continue;
            if (board[i] && board[i][j]) {
                if (board[i][j].isBomb) count++
            }
        }
    }

    return count;
}

//spred random bombs on the board;
function spreadBombs(board, amountOfBombs, startPos) {
    for (var i = 0; i < amountOfBombs; i++) {
        var randIPos = getRandomInt(0, board.length-1);
        var randJPos = getRandomInt(0, board[0].length-1);
    
        while (board[randIPos][randJPos].isBomb || randIPos === startPos.i && randJPos === startPos.j) { 
            randIPos = getRandomInt(0, board.length-1);
            randJPos = getRandomInt(0, board[0].length-1);
        }
    
        board[randIPos][randJPos].isBomb = true;
    }
}

//creat the game mat
function creatBoard(boardSize) {
    var board = [];
    
    for (var i = 0; i < boardSize; i++) {
        board[i] = [];
        for (var j = 0; j < boardSize; j++) {
            board[i][j] = createCell();
        }
    }
    
    return board;
}

//create a cell object
function createCell() {
    var cell = {
        isBomb: false,
        bombsAroundCell: 0,
        isMarked: false,
        isFlaged: false,
        isHinted: false
    };
    return cell;
}

//get random init
function getRandomInt(num1, num2) {
    var maxNum = (num1 > num2)? num1+1 : num2+1;
    var minNum = (num1 < num2)? num1 : num2;
    var randomNumber = (Math.floor(Math.random()*(maxNum - minNum)) + minNum);
    return randomNumber;
}