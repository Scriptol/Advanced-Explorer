
// PHP Server for Advanced Explorer
// Scriptol.fr/ scriptol.com

<?php
console.log("enter PHP");
$json = file_get_contents("php://input");
$params = json_decode($json);
$fname     = $params->fname ?? null;
$temporary = $params->temp ?? null;

$content = [];
$reterr  = 0;

if (!file_exists($fname)) {
    echo "err: file not found";
    exit;
}

exec("php " . escapeshellarg($fname), $content, $reterr);
if ($reterr !== 0) {
    echo "err: exec returns $reterr";
    exit;
}

$handle = fopen($temporary, 'w');
if ($handle === false) {
    echo "err: enable to open $temporary";
    exit;
}
fwrite($handle, implode("\n", $content));
fclose($handle);

echo "ok";
?>

