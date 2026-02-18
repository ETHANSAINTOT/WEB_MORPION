<?php
// En-têtes pour éviter le cache
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");

$file = 'games_data.json';

// --- FONCTIONS UTILITAIRES ---
function getGameData($file) {
    clearstatcache();
    if (!file_exists($file)) return [];
    $content = file_get_contents($file);
    if (empty($content)) return [];
    $data = json_decode($content, true);
    return is_array($data) ? $data : [];
}

function saveGameData($file, $data) {
    file_put_contents($file, json_encode($data), LOCK_EX);
    clearstatcache();
}

$action = $_GET['action'] ?? '';
$gameId = $_GET['id'] ?? '';

// --- ACTIONS ---

if ($action === 'server_info') {
    $ip = '';
    
    // Détection de l'OS pour récupérer la bonne IP
    if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
        // Méthode Windows : on lit ipconfig
        $out = [];
        exec("ipconfig", $out);
        foreach ($out as $line) {
            // On cherche une ligne avec IPv4
            if (preg_match('/IPv4.*:\s*([0-9\.]+)/', $line, $matches)) {
                $ip = $matches[1];
                break; // On prend la première trouvée
            }
        }
        if (empty($ip)) $ip = getHostByName(getHostName());
    } else {
        // Méthode Linux
        $ip = trim(shell_exec("hostname -I | awk '{print $1}'"));
    }

    $port = $_SERVER['SERVER_PORT'];
    echo json_encode(['ip' => $ip, 'port' => $port]);
    exit;
}

if ($action === 'stop') {
    if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') shell_exec("taskkill /F /IM php.exe");
    else shell_exec("fuser -k 7498/tcp");
    echo json_encode(['status' => 'server_stopped']);
    exit;
}

// ... (Le reste du fichier reste identique à ma réponse précédente) ...
// Pour éviter de copier-coller tout le bloc, garde tes fonctions create, join, poll_lobby, etc.
// Assure-toi juste que le bloc 'server_info' ci-dessus remplace l'ancien.
// Si tu as un doute, remets tout le fichier api.php de la réponse précédente 
// mais REMPLACE JUSTE le bloc "if ($action === 'server_info')" par celui-ci.

if ($action === 'create') {
    $data = getGameData($file);
    $customId = preg_replace("/[^a-zA-Z0-9]/", "", $_GET['custom_id'] ?? '');
    
    if (!empty($customId)) {
        if (isset($data[$customId])) { echo json_encode(['error' => 'ID pris']); exit; }
        $newId = $customId;
    } else {
        $newId = substr(uniqid(), -4);
    }

    $data[$newId] = [
        'board' => array_fill(0, 9, null),
        'turn' => 'X',
        'status' => 'waiting',
        'p1_connected' => true, 'p2_connected' => false,
        'winner' => null
    ];
    saveGameData($file, $data);
    echo json_encode(['id' => $newId]);
    exit;
}

if ($action === 'join') {
    $data = getGameData($file);
    if (isset($data[$gameId])) {
        $data[$gameId]['p2_connected'] = true;
        if($data[$gameId]['status'] === 'waiting') $data[$gameId]['status'] = 'ready';
        saveGameData($file, $data);
        echo json_encode(['status' => 'joined']);
    } else {
        echo json_encode(['status' => 'error']);
    }
    exit;
}

if ($action === 'poll_lobby') {
    $data = getGameData($file);
    if(isset($data[$gameId])) {
        echo json_encode([
            'status' => $data[$gameId]['status'],
            'p2_connected' => $data[$gameId]['p2_connected'],
            'turn' => $data[$gameId]['turn']
        ]);
    } else { echo json_encode(['status' => 'error']); }
    exit;
}

if ($action === 'update_settings') {
    $data = getGameData($file);
    if(isset($data[$gameId])) {
        $input = json_decode(file_get_contents('php://input'), true);
        if(isset($input['start'])) {
            $data[$gameId]['turn'] = $input['start'];
            saveGameData($file, $data);
        }
        echo json_encode(['status' => 'ok']);
    }
    exit;
}

if ($action === 'start_match') {
    $data = getGameData($file);
    if(isset($data[$gameId])) {
        $data[$gameId]['status'] = 'playing';
        saveGameData($file, $data);
        echo json_encode(['status' => 'started']);
    }
    exit;
}

if ($action === 'state') {
    $data = getGameData($file);
    if(isset($data[$gameId])) echo json_encode($data[$gameId]);
    else echo json_encode(['board' => [], 'turn' => '']);
    exit;
}

if ($action === 'move') {
    $input = json_decode(file_get_contents('php://input'), true);
    $index = $input['index'];
    $player = $input['player'];
    
    $data = getGameData($file);
    
    if (!isset($data[$gameId])) { echo json_encode(['status' => 'error']); exit; }

    if ($data[$gameId]['turn'] !== $player) {
        echo json_encode(['status' => 'error', 'message' => 'Not your turn']);
        exit;
    }

    if ($data[$gameId]['board'][$index] === null) {
        $data[$gameId]['board'][$index] = $player;
        $data[$gameId]['turn'] = ($player === 'X') ? 'O' : 'X';
        saveGameData($file, $data);
        echo json_encode(['status' => 'ok']);
    } else {
        echo json_encode(['status' => 'error']);
    }
    exit;
}

if ($action === 'restart') {
    $data = getGameData($file);
    if(isset($data[$gameId])) {
        $data[$gameId]['board'] = array_fill(0, 9, null);
        $data[$gameId]['winner'] = null;
        $data[$gameId]['status'] = 'playing';
        $data[$gameId]['turn'] = ($data[$gameId]['turn'] === 'X') ? 'O' : 'X';
        saveGameData($file, $data);
        echo json_encode(['status' => 'restarted']);
    }
    exit;
}
?>
