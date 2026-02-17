// MODIFICATION CRUCIALE ICI : On remonte d'un dossier pour trouver l'API
const API_URL = '../back/api.php'; 

const urlParams = new URLSearchParams(window.location.search);
const mode = urlParams.get('mode');
const level = urlParams.get('level');
const onlineId = urlParams.get('id');
const role = urlParams.get('role'); 
let startPref = urlParams.get('start');

let board = Array(9).fill(null);
let currentPlayer = 'X'; 
let gameActive = true;
let lastLoser = null;

const mySymbol = 'X';
const aiSymbol = 'O';

window.onload = function() { init(); };

function init() {
    renderBoard();
    board.fill(null);
    gameActive = true;
    const restartBtn = document.getElementById('restart-btn');
    if(restartBtn) restartBtn.style.display = 'none';

    if (mode === 'online') setupOnline();
    else setupLocalOrAI();
}

function renderBoard() {
    const boardDiv = document.getElementById('board');
    if (!boardDiv) return;
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
    currentPlayer = 'X'; 
    if(lastLoser) currentPlayer = (lastLoser === 'draw' ? (Math.random()<0.5?'X':'O') : lastLoser);
    else if(startPref === 'ai') currentPlayer = 'O';
    else if(startPref === 'human') currentPlayer = 'X';
    else if(mode === 'local' && !startPref) currentPlayer = (Math.random()<0.5?'X':'O');
    
    updateStatus();
    if (mode === 'ai' && currentPlayer === aiSymbol) setTimeout(aiPlay, 800);
}

function setupOnline() {
    const infoBox = document.getElementById('online-info-box');
    if(infoBox) {
        infoBox.style.display = 'block';
        document.getElementById('display-id').innerText = onlineId || '...';
        
        // Test de connexion initial
        fetch(`${API_URL}?action=server_info&t=${Date.now()}`)
            .then(r => {
                if(!r.ok) throw new Error("API introuvable");
                return r.json();
            })
            .then(d => {
                document.getElementById('display-ip').innerText = d.ip || '?';
                document.getElementById('display-port').innerText = d.port || '?';
            })
            .catch(e => {
                document.getElementById('status').innerText = "ERREUR CONNEXION API !";
                document.getElementById('status').style.color = "red";
                console.error("Erreur path API:", e);
            });
    }
    if (!window.pollingInterval) window.pollingInterval = setInterval(checkOnlineState, 500);
    updateStatus();
}

function handleClick(i) {
    if (!gameActive || board[i]) return;

    if (mode === 'online') {
        let onlineMySymbol = (role === 'creator') ? 'X' : 'O';
        
        if (currentPlayer !== onlineMySymbol) return;

        // Jouer visuellement tout de suite
        updateBoardVisual(i, onlineMySymbol);
        
        // Bloquer le tour
        currentPlayer = (onlineMySymbol === 'X') ? 'O' : 'X';
        updateStatus();

        sendMoveOnline(i, onlineMySymbol);
    } 
    else if (mode === 'ai') {
        if (currentPlayer !== mySymbol) return;
        makeMove(i, mySymbol);
        if (gameActive) setTimeout(aiPlay, 600);
    } 
    else {
        makeMove(i, currentPlayer);
    }
}

function makeMove(i, player) {
    updateBoardVisual(i, player);
    if (checkWin(player)) endGame(player);
    else if (!board.includes(null)) endGame('draw');
    else {
        if(mode !== 'online') {
            currentPlayer = player === 'X' ? 'O' : 'X';
            updateStatus();
        }
    }
}

function updateBoardVisual(index, player) {
    if(board[index] === player) return;
    board[index] = player;
    let cell = document.querySelector(`.cell[data-index='${index}']`);
    if(cell) { 
        cell.innerText = player; 
        cell.classList.remove('X', 'O');
        cell.classList.add(player); 
    }
}

async function sendMoveOnline(i, playerSymbol) {
    try {
        await fetch(`${API_URL}?action=move&id=${onlineId}&t=${Date.now()}_${Math.random()}`, {
            method: 'POST',
            body: JSON.stringify({ index: i, player: playerSymbol })
        });
    } catch(e) {
        console.error("Erreur envoi:", e);
    }
}

async function checkOnlineState() {
    try {
        const res = await fetch(`${API_URL}?action=state&id=${onlineId}&t=${Date.now()}_${Math.random()}`);
        if(!res.ok) return; // Si 404, on ignore
        const data = await res.json();
        
        if (!data || !data.board) return;

        // Restart détecté
        const serverEmpty = data.board.every(c => c === null);
        const localNotEmpty = !board.every(c => c === null);

        if (serverEmpty && localNotEmpty) {
            board.fill(null); renderBoard(); gameActive = true;
            document.getElementById('restart-btn').style.display = 'none';
        }

        // Synchro forcée du plateau
        for(let i=0; i<9; i++) {
            // Si le serveur a une info et que c'est différent de chez nous
            if (data.board[i] !== null && board[i] !== data.board[i]) {
                updateBoardVisual(i, data.board[i]);
            }
        }
        
        // Vérification victoire
        const winner = checkWinOnData(data.board);
        if(winner) endGame(winner);
        else if (!data.board.includes(null)) endGame('draw');

        // Synchro du tour
        if(gameActive) {
            currentPlayer = data.turn;
            updateStatus();
        }

    } catch(e) {}
}

function updateStatus() {
    const statusTxt = document.getElementById('status');
    if (!gameActive || !statusTxt) return;

    if (mode === 'ai') {
        if (currentPlayer === mySymbol) {
            statusTxt.innerText = "C'est au JOUEUR de jouer";
            statusTxt.style.color = "var(--primary)";
        } else {
            statusTxt.innerText = "L'IA réfléchit...";
            statusTxt.style.color = "var(--secondary)";
        }
    } 
    else if (mode === 'online') {
        let onlineMySymbol = (role === 'creator') ? 'X' : 'O';
        if (currentPlayer === onlineMySymbol) {
            statusTxt.innerText = "C'EST À TOI DE JOUER !";
            statusTxt.style.color = "var(--accent)";
        } else {
            statusTxt.innerText = "L'adversaire joue...";
            statusTxt.style.color = "white";
        }
    } 
    else {
        statusTxt.innerText = `Au tour de ${currentPlayer}`;
        statusTxt.style.color = "white";
    }
}

// Fonction utilitaire pour vérifier la victoire sur les données brutes
function checkWinOnData(b) {
    const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    for(let combo of wins) {
        if(b[combo[0]] && b[combo[0]] === b[combo[1]] && b[combo[0]] === b[combo[2]]) {
            return b[combo[0]];
        }
    }
    return null;
}

function checkWin(player) { return checkWinOnData(board) === player; }

function endGame(winner) {
    gameActive = false;
    const statusTxt = document.getElementById('status');
    if (winner === 'draw') { statusTxt.innerText = "Match Nul !"; lastLoser = 'draw'; }
    else if (mode === 'ai' && winner === mySymbol) { statusTxt.innerText = "Le JOUEUR a gagné !"; statusTxt.style.color = "var(--accent)"; lastLoser = aiSymbol; }
    else if (mode === 'ai') { statusTxt.innerText = "L'IA a gagné..."; statusTxt.style.color = "var(--secondary)"; lastLoser = mySymbol; }
    else { statusTxt.innerText = `Le joueur ${winner} a gagné !`; lastLoser = (winner === 'X') ? 'O' : 'X'; }
    if(document.getElementById('restart-btn')) document.getElementById('restart-btn').style.display = 'block';
}

function aiPlay() {
    if (!gameActive) return;
    if (level === 'cheat' && Math.random() < 0.2) { /* Triche */ }
    let m = -1;
    if (level === 'random') m = randomMove();
    else if (level === 'medium') { m = findBestMove(false); if(m===-1) m=randomMove(); }
    else m = findBestMove(true);
    if (m !== -1) makeMove(m, aiSymbol);
}
function randomMove() {
    let a = board.map((v, i) => v === null ? i : null).filter(v => v !== null);
    return a[Math.floor(Math.random() * a.length)];
}
function findBestMove(isHard) {
    let avail = board.map((v, i) => v === null ? i : null).filter(v => v !== null);
    for (let i of avail) { board[i]=aiSymbol; if(checkWin(aiSymbol)){board[i]=null;return i;} board[i]=null; }
    for (let i of avail) { board[i]=mySymbol; if(checkWin(mySymbol)){board[i]=null;return i;} board[i]=null; }
    if (!isHard) return -1;
    let bestScore = -Infinity, bestMove = avail[0];
    for (let i of avail) {
        board[i] = aiSymbol; let score = minimax(board, 0, false); board[i] = null;
        if (score > bestScore) { bestScore = score; bestMove = i; }
    }
    return bestMove;
}
function minimax(bd, depth, isMaximizing) {
    if(checkWin(aiSymbol)) return 10 - depth; if(checkWin(mySymbol)) return depth - 10; if(!bd.includes(null)) return 0;
    if(isMaximizing) {
        let best = -Infinity; for(let i=0; i<9; i++) { if(bd[i]===null) { bd[i]=aiSymbol; best=Math.max(best, minimax(bd, depth+1, false)); bd[i]=null; } } return best;
    } else {
        let best = Infinity; for(let i=0; i<9; i++) { if(bd[i]===null) { bd[i]=mySymbol; best=Math.min(best, minimax(bd, depth+1, true)); bd[i]=null; } } return best;
    }
}
async function restart() {
    if (mode === 'online') await fetch(`${API_URL}?action=restart&id=${onlineId}&t=${Date.now()}`);
    else init();
}
function quit() { window.location.href = 'index.html'; }
