'use strict';

// enable or disable the manual mine position mode, and reveal or unreveal the mines that have already been
// positioned if the game had not start yet 
function manuallyMinePosEnable() {
    if (gGame.isGameOver || gGame.isGameOn) return;

    gGame.isManualPosOn = !gGame.isManualPosOn;

    if (gGame.isManualPosOn) {
        for (var i = 0; i < gGame.board.length; i++) {
            for (var j = 0; j < gGame.board[0].length; j++) {
                if (gGame.board[i][j].isBomb) getCellElement({i: i, j: j}).innerText = BOMB;
            }
        }
    } else {
        for (var i = 0; i < gGame.board.length; i++) {
            for (var j = 0; j < gGame.board[0].length; j++) {
                if (gGame.board[i][j].isBomb) getCellElement({i: i, j: j}).innerText = null;
            }
        }
    }

    document.querySelector('.game-container .level-buttons-container .manual-mod').classList.toggle('light-button');
}

//check if the score is a new high score, if it is - save it to the local storage and let the player know he made
//a new high score
function checkIfHighScore() {    
    if (gGame.totalGameTime < gGame.bestTime) {
        gGame.bestTime = gGame.totalGameTime;
        gGame.bestTimeStr = gTimeParts.timerStr;

        localStorage.setItem(gGame.level+'BestTime', gGame.bestTime);
        localStorage.setItem(gGame.level+'BestTimeStr', gGame.bestTimeStr);
        
        document.querySelector('.game-container .game-statuse').innerText = HIGH_SCORE;
        document.querySelector('.game-container .high-score h3 span').innerText = gGame.bestTimeStr;
    }
}

//get the total time of the game
function getScore() {
    gGame.totalGameTime = (gGame.endTime - gGame.startTime)/1000;
}

//enable or disable the area hint button
function areaHintEnable() {
    if (gGame.isGameOver || gGame.areaHintCount === 0) return;
    if (gGame.isAreaHint) gGame.isAreaHint = false;
    else gGame.isAreaHint = true;
    
    document.querySelector('.game-container .hint-buttons .hint-area-button').classList.toggle('light-button');
}

//hint an area - reveal the cell's and its neighbors's contant for few moments
function areaHint(currPos) {
    document.querySelector('.game-container .hint-buttons .hint-area-button').classList.toggle('light-button');

    if (gGame.board[currPos.i][currPos.j].isMarked) return;

    gGame.areaHintCount--;
    document.querySelector('.game-container .hint-buttons .hint-area-button span').innerText = gGame.areaHintCount;

    for (var i = currPos.i-1; i <= currPos.i+1; i++) {
        for (var j = currPos.j-1; j <= currPos.j+1; j++) {
            if (gGame.board[i] && gGame.board[i][j] && !gGame.board[i][j].isMarked) {
                gGame.board[i][j].isHint = true;
                var elCell = getCellElement({i: i, j: j});
                
                if (gGame.board[i][j].isBomb) elCell.innerText = BOMB;
                
                else if (gGame.board[i][j].bombsAroundCell === 0) elCell.innerText = null;
                
                else elCell.innerText = gGame.board[i][j].bombsAroundCell;
                
                elCell.classList.add('hinted');
            }
        }
    }

    setTimeout(function() {
        for (var i = currPos.i-1; i <= currPos.i+1; i++) {
            for (var j = currPos.j-1; j <= currPos.j+1; j++) {
                if (gGame.board[i] && gGame.board[i][j] && !gGame.board[i][j].isMarked) {

                    gGame.board[i][j].isHint = false;
                    var elCell = getCellElement({i: i, j: j});
                    elCell.innerText = null;
                    if (gGame.board[i][j].isFlaged) elCell.innerText = FLAG;
                    elCell.classList.remove('hinted');
                }
            }
        }
    }, 1000);
}

//safe button - get a random cell from the board that is not a bomb and can be safly be clicked
function safeClick() {
    if (!gGame.isGameOn || gGame.safeClickCount === 0) return;

    var emptyCells = getEmptyCells();
    if (emptyCells.length === 0) return;

    var randIdx = getRandomInt(0, emptyCells.length-1);
    var randCellPos = emptyCells[randIdx];
    var currCell = gGame.board[randCellPos.i][randCellPos.j];
    var elCell = getCellElement(randCellPos);
    
    currCell.isHint = true;
    elCell.classList.add('hinted');
    
    setTimeout(function(){
        currCell.isHint = false;
        elCell.classList.remove('hinted');
    }, 2000);

    gGame.safeClickCount--
    document.querySelector('.game-container .hint-buttons .safe-button span').innerText = gGame.safeClickCount;
}

//find all empty cells on the board, returns an aray of all the empty cells;
function getEmptyCells() {
    var emptyCells = [];
    for (var i = 0; i < gGame.board.length; i++) {
        for (var j = 0; j < gGame.board[i].length; j++) {
            if (!gGame.board[i][j].isBomb && !gGame.board[i][j].isMarked) {
                var currPos = {i: i, j: j};
                emptyCells.push(currPos)
            }
        }
    }
    return emptyCells;
}


//stopwatch:

//stop watch global variables
var gTimeParts = {
    miliSec: 0,
    sec: 0,
    min: 0,
    miliMax: 100,
    secMax: 60,
    minMax: 100,
    milSecStr: '00',
    secondsStr: '00',
    minutesStr: '00',
    timerStr: null
}

//update the stopwatch str and show it on document 
function stopWatch() {
    gTimeParts.timerStr = '';
    
    gTimeParts.milSecStr = createStopWatchStrPart('miliSec', 'miliMax');
    if (gTimeParts.miliSec === 0) {
        gTimeParts.secondsStr = createStopWatchStrPart('sec', 'secMax');
        if (gTimeParts.sec === 0) {
            gTimeParts.minutesStr = createStopWatchStrPart('min', 'minMax');
        }
    }

    gTimeParts.timerStr = gTimeParts.minutesStr + ':' + gTimeParts.secondsStr + ':' + gTimeParts.milSecStr;
    var elStopWatch = document.querySelector('.game-container .stopwatch span');
    elStopWatch.innerText = gTimeParts.timerStr;
}

//create a string of two nums for a speciphic part of the timer. ex: '46'
//update the stopwatch vars
function createStopWatchStrPart(stopWatchPart, limit) {
    var timePartStr = '';

    gTimeParts[stopWatchPart]++

    if (gTimeParts[stopWatchPart] === gTimeParts[limit]) {
        gTimeParts[stopWatchPart] = 0;
    }

    if (gTimeParts[stopWatchPart] < 10) {
        timePartStr = '0' + gTimeParts[stopWatchPart];
    }
    else {
        timePartStr = ''+gTimeParts[stopWatchPart] ;
    }

    return timePartStr;
}