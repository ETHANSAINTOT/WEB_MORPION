const API_URL = 'api.php';
const urlParams = new URLSearchParams(window.location.search);
const mode = urlParams.get('mode');
const level = urlParams.get('level');
const onlineId = urlParams.get('id');
const role = urlParams.get('role'); 
let startPref = urlParams.get('start');

let board = Array(9).fill(null);
let currentPlayer = 'X';
let gameActive = true;
let myOnlineSymbol = null;
let lastLoser = null;

const statusTxt = document.getElementById('status');
const boardDiv = document.getElementById('board');
const restartBtn = document.getElementById('restart-btn');

function init() {
    renderBoard();
    board.fill(null);
    gameActive = true;
    restartBtn.style.display = 'none';

    if (mode === 'online') {
        setupOnline();
    } else {
        setupLocalOrAI();
    }
}

function renderBoard() {
    boardDiv.innerHTML = '';
    for (let i = 0; i < 9; i++) {
        let cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.index = i;
        cell.onclick = () => handleClick(i);
        boardDiv.appendChild(cell);
    }
}

function setupLocalOrAI() {
    if (lastLoser) {
        currentPlayer = lastLoser === 'draw' ? (Math.random() < 0.5 ? 'X' : 'O') : lastLoser;
    } else {
        currentPlayer = startPref === 'random' ? (Math.random() < 0.5 ? 'X' : 'O') : startPref;
    }
    updateStatus();
    if (mode === 'ai' && currentPlayer === 'O') setTimeout(aiPlay, 800);
}

function setupOnline() {
    myOnlineSymbol = (role === 'creator') ? 'X' : 'O';
    document.getElementById('online-id-box').style.display = 'block';
    document.getElementById('display-id').innerText = onlineId;
    
    if (!window.pollingInterval) {
        window.pollingInterval = setInterval(checkOnlineState, 1000);
    }
    updateStatus();
}

function handleClick(i) {
    if (!gameActive || board[i]) return;

    if (mode === 'online') {
        if (currentPlayer !== myOnlineSymbol) return;
        makeMove(i, myOnlineSymbol);
        sendMoveOnline(i);
    } else {
        if (mode === 'ai' && currentPlayer === 'O') return;
        makeMove(i, currentPlayer);
        if (gameActive && mode === 'ai') setTimeout(aiPlay, 600);
    }
}

function makeMove(i, player) {
    board[i] = player;
    let cell = document.querySelector(`.cell[data-index='${i}']`);
    if(cell) {
        cell.innerText = player;
        cell.classList.add(player);
    }

    if (checkWin(player)) {
        endGame(player);
    } else if (!board.includes(null)) {
        endGame('draw');
    } else {
        currentPlayer = player === 'X' ? 'O' : 'X';
        updateStatus();
    }
}

function updateStatus() {
    if (!gameActive) return;
    if (mode === 'online') {
        statusTxt.innerText = (currentPlayer === myOnlineSymbol) ? "C'est à toi !" : "Adversaire réfléchit...";
    } else {
        statusTxt.innerText = `Au tour de ${currentPlayer}`;
    }
}

function checkWin(player) {
    const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    return wins.some(combo => combo.every(idx => board[idx] === player));
}

function endGame(winner) {
    gameActive = false;
    if (winner === 'draw') {
        statusTxt.innerText = "Match Nul !";
        lastLoser = 'draw';
    } else {
        statusTxt.innerText = `Le joueur ${winner} a gagné !`;
        lastLoser = (winner === 'X') ? 'O' : 'X';
    }
    restartBtn.style.display = 'block';
}

function aiPlay() {
    if (!gameActive) return;
    if (level === 'cheat' && Math.random() < 0.2) {
        let pCells = board.map((v, i) => v === 'X' ? i : null).filter(v => v !== null);
        if (pCells.length > 0) {
            let s = pCells[Math.floor(Math.random() * pCells.length)];
            board[s] = null; 
            document.querySelector(`.cell[data-index='${s}']`).innerText = '';
            document.querySelector(`.cell[data-index='${s}']`).classList.remove('X');
        }
    }
    let m = -1;
    if (level === 'random') m = randomMove();
    else if (level === 'medium') { m = findBestMove(false); if(m===-1) m=randomMove(); }
    else m = findBestMove(true);
    if (m !== -1) makeMove(m, 'O');
}

function randomMove() {
    let a = board.map((v, i) => v === null ? i : null).filter(v => v !== null);
    return a[Math.floor(Math.random() * a.length)];
}

function findBestMove(h) {
    let a = board.map((v, i) => v === null ? i : null).filter(v => v !== null);
    for (let i of a) { board[i]='O'; if(checkWin('O')){board[i]=null;return i;} board[i]=null; }
    for (let i of a) { board[i]='X'; if(checkWin('X')){board[i]=null;return i;} board[i]=null; }
    if (!h) return -1;
    let bs = -Infinity, bm = a[0];
    for (let i of a) {
        board[i]='O'; let s = minimax(board,0,false); board[i]=null;
        if(s>bs){bs=s;bm=i;}
    }
    return bm;
}

function minimax(b,d,m) {
    if(checkWin('O')) return 10-d; if(checkWin('X')) return d-10; if(!b.includes(null)) return 0;
    let bes = m ? -Infinity : Infinity;
    for(let i=0;i<9;i++) {
        if(b[i]===null) {
            b[i]=m?'O':'X';
            bes=m?Math.max(bes,minimax(b,d+1,!m)):Math.min(bes,minimax(b,d+1,!m));
            b[i]=null;
        }
    }
    return bes;
}

async function sendMoveOnline(i) {
    await fetch(`${API_URL}?action=move&id=${onlineId}`, {
        method: 'POST',
        body: JSON.stringify({ index: i, player: myOnlineSymbol })
    });
}

async function checkOnlineState() {
    try {
        const res = await fetch(`${API_URL}?action=state&id=${onlineId}`);
        const data = await res.json();
        
        const serverEmpty = data.board.every(c => c === null);
        const localNotEmpty = !board.every(c => c === null);

        if (serverEmpty && localNotEmpty) {
            board.fill(null);
            renderBoard();
            gameActive = true;
            restartBtn.style.display = 'none';
            statusTxt.innerText = "Nouvelle partie !";
        }

        currentPlayer = data.turn;
        updateStatus();

        if (gameActive && data.turn === myOnlineSymbol) {
             data.board.forEach((val, idx) => {
                if(val !== null && board[idx] === null) {
                    makeMove(idx, val);
                }
            });
        }
    } catch(e) {}
}

async function restart() {
    if (mode === 'online') {
        await fetch(`${API_URL}?action=restart&id=${onlineId}`);
    } else {
        init();
    }
}

function quit() {
    if(confirm("Retourner au menu ?")) window.location.href = 'index.html';
}

init();