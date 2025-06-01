// 地図の初期設定
var map = L.map('map', {
  center: [35.0, 135.0], // 初期中心位置（例として日本の座標を設定）
  zoom: 5,              // 初期ズームレベル
});

// ベースマップを追加
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// 画像パーツのレイヤーを追加
var imageBounds1 = [[34.5, 134.5], [35.5, 135.5]]; // 画像1の範囲
var image1 = L.imageOverlay('maps/wlg00.png', imageBounds1).addTo(map);

var imageBounds2 = [[34.8, 134.8], [35.2, 135.2]]; // 画像2の範囲
var image2 = L.imageOverlay('maps/wld11.png', imageBounds2).addTo(map);

// ドラッグ＆ズームはLeaflet.jsでデフォルト有効
