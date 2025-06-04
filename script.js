// 地図の初期設定
var map = L.map('map', {
  center: [35.0, 135.0], // 初期中心位置（例として日本の座標を設定）
  zoom: 5,              // 初期ズームレベル
});

// ベースマップを追加
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {attribution: '&copy; OpenStreetMap contributors'}).addTo(map);

// 画像パーツのレイヤーを追加
L.imageOverlay('maps/wld11.svg', [[34.8, 134.8], [35.2, 135.2]]).addTo(map);

L.imageOverlay('maps/nb1.svg', [[36.2, 139.33], [50, 148.9]]).addTo(map);
L.imageOverlay('maps/nb2.svg', [[36.06, 135.06], [41.55, 143.25]]).addTo(map);
L.imageOverlay('maps/nb3.svg', [[30, 131.67], [39.3, 140.875]]).addTo(map);
L.imageOverlay('maps/nb4.svg', [[28.6, 128.35], [34.97, 132.47]]).addTo(map);
L.imageOverlay('maps/nb5.svg', [[23.02, 122.93], [29.51, 131.34]]).addTo(map);
L.imageOverlay('maps/nb6.svg', [[24.2, 138.1], [27.9, 145.2]]).addTo(map);


L.imageOverlay('maps/wlg00.svg', [[33.25, 93], [60.52, 137.35]]).addTo(map);

L.imageOverlay('maps/wlg01.svg', [[33.25, 135.05], [61.2, 181.15]]).addTo(map);//樺太、カムチャツカなど

// AudioContextの初期化
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
let sourceBuffer;

// テキストを合成音声で再生する関数
async function Speak(text) {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  
  try {
    // 音声データを取得
    const response = await fetch('https://synthesis-service.scratch.mit.edu/synth?locale=JA-JP&gender=female&text=' + text);
    const audioData = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(audioData);

    // ソースを作成
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;

    // 再生速度（ピッチ）を調整
    source.playbackRate.value = 1.2;

    // 出力先に接続
    source.connect(audioContext.destination);

    // 再生
    source.start();
  } catch (error) {
    console.error('エラー:', error);
  }
}

// 現在時刻を表示
function updateTime(reloaded = false) {
  const timeBox = document.getElementById('timeBox');
  const now = new Date();
  if (reloaded) {
    timeBox.innerHTML = `
      ${now.getFullYear()}/${`0${now.getMonth()+1}`.slice(-2)}/${`0${now.getDate()}`.slice(-2)}
      ${`0${now.getHours()}`.slice(-2)}:${`0${now.getMinutes()}`.slice(-2)}:${`0${now.getSeconds()}`.slice(-2)}
      <span style="font-size: 19px;">更新</span>
    `;
  }
  else {
    timeBox.innerHTML = `
      <span style="letter-spacing: 4px;"><span style="color: red;">----/--/--
      --:--:--
      <span style="font-size: 19px;">更新</span></span></span>
    `;
  }
}
//初期表示
updateTime()

let socket = new WebSocket('ws://localhost:8080');

socket.onopen = () => {
  console.log('接続完了');
  socket.send('クライアントからのメッセージ');
};

socket.onclose = () => {
  socket = new WebSocket('ws://localhost:8080');
}

//サーバーからの指示
socket.onmessage = async (event) => {
  updateTime(true)
  /**@type {import(".").ServerData} */
  const datas = event.data
  for (const data of datas) {
    if (data.type == 'read') Speak(receivedText)
  }
};