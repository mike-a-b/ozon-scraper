<?php
$start = microtime(true);
exec('node selenium.js', $output, $code);

if ($code === 0 && file_exists('result.json')) {
    $json = file_get_contents('result.json');
    header('Content-Type: application/json');
    echo $json;
} else {
    echo json_encode(['error' => 'Парсинг не удался']);
}