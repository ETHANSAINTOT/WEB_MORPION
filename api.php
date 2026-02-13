<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");

$file = 'games_data.json';
$data = file_exists($file) ? json_decode(file_get_contents($file), true) : [];
$action = $_GET['action'] ?? '';
$gameId = $_GET['id'] ?? '';

if ($action === 'server_info') {
    $ip = trim(shell_exec("hostname -I | awk '{print $1}'"));
    $port = $_SERVER['SERVER_PORT'];
    echo json_encode(['ip' => $ip, 'port' => $port]);
    exit;
}

if ($action === 'stop') {
    shell_exec("fuser -k 7498/tcp");
    echo json_encode(['status' => 'server_stopped']);
    exit;
}

if ($action === 'create') {
    $newId = uniqid();
    $data[$newId] = [
        'board' => array_fill(0, 9, null),
        'turn' => $_GET['start'] ?? 'X',
        'status' => 'waiting',
        'winner' => null
    ];
    file_put_contents($file, json_encode($data));
    echo json_encode(['id' => $newId, 'game' => $data[$newId]]);
    exit;
}

if ($action === 'join' && isset($data[$gameId])) {
    $data[$gameId]['status'] = 'playing';
    file_put_contents($file, json_encode($data));
    echo json_encode(['status' => 'joined', 'game' => $data[$gameId]]);
    exit;
}

if ($action === 'state' && isset($data[$gameId])) {
    echo json_encode($data[$gameId]);
    exit;
}

if ($action === 'move' && isset($data[$gameId])) {
    $input = json_decode(file_get_contents('php://input'), true);
    $index = $input['index'];
    $player = $input['player'];
    
    if ($data[$gameId]['board'][$index] === null && $data[$gameId]['turn'] === $player) {
        $data[$gameId]['board'][$index] = $player;
        $data[$gameId]['turn'] = ($player === 'X') ? 'O' : 'X';
        file_put_contents($file, json_encode($data));
        echo json_encode(['status' => 'ok']);
    } else {
        echo json_encode(['status' => 'error']);
    }
    exit;
}

if ($action === 'restart' && isset($data[$gameId])) {
    $data[$gameId]['board'] = array_fill(0, 9, null);
    $data[$gameId]['winner'] = null;
    $data[$gameId]['status'] = 'playing';
    $data[$gameId]['turn'] = ($data[$gameId]['turn'] === 'X') ? 'O' : 'X';
    file_put_contents($file, json_encode($data));
    echo json_encode(['status' => 'restarted']);
    exit;
}
?>
