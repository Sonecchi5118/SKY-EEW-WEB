import { NIEDrealTimePointLocation, soujitable, regiontable } from "./export.js";

//@ts-check
function preloadImages(imageUrls) {
  const cache = [];
  imageUrls.forEach(url => {
    const img = new Image(); // 新しい画像オブジェクトを作成
    img.src = url; // URLを設定して読み込む
    cache.push(img); // キャッシュに保存
  });
}

// プリロードする画像のURL
const imageUrls = [
  'ui/scroll-panel/paEEW11.svg',
  'ui/scroll-panel/paEEW12.svg',
  'ui/scroll-panel/paEEW13.svg',
  'ui/scroll-panel/paEEW14.svg',
  'ui/scroll-panel/paEEW21.svg',
  'ui/scroll-panel/paEEW22.svg',
  'ui/scroll-panel/paEEW23.svg',
  'ui/scroll-panel/paEEW24.svg',
  'ui/scroll-panel/paEEWC1.svg',
  'ui/scroll-panel/paEEWC2.svg',
  'ui/scroll-panel/paEEWC3.svg',
  'ui/scroll-panel/paEEWC4.svg',
  'ui/scroll-panel/paSc-1.svg',
  'ui/scroll-panel/paSc1.svg',
  'ui/scroll-panel/paSc2.svg',
  'ui/scroll-panel/paSc3.svg',
  'ui/scroll-panel/paSc4.svg',
  'ui/scroll-panel/paSc5.svg',
  'ui/scroll-panel/paSc6.svg',
  'ui/scroll-panel/paSc7.svg',
  'ui/scroll-panel/paSc8.svg',
  'ui/scroll-panel/paSc9.svg',
];

// 画像をプリロード
preloadImages(imageUrls);


const pwavespeed = 7
const swavespeed = 4

let opacity05 = false;

//0: 地震情報タブ 1: リアルタイムタブ 2: 津波タブ 3: 設定
let DisplayType = 0

// 地図の初期設定
var map = L.map('map', {
  center: [38.0, 137.0], // 初期中心位置（例として日本の座標を設定）
  zoom: 5.8,              // 初期ズームレベル
  zoomSnap: 0.00001,   // ズームのスナップ間隔（小数点可）
  zoomDelta: 0.00001,
  maxZoom: 10,
  minZoom: 5,
  zoomControl: false,
  preferCanvas: true
});

// ベースマップを追加
//L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {attribution: '&copy; OpenStreetMap contributors'}).addTo(map);

// ズームコントロールを追加し位置を変更
L.control.zoom({
  position: 'bottomleft' // コントロールの位置を指定
}).addTo(map);

map.setMaxBounds(L.latLngBounds(
  [0, 92], // 南西の座標
  [60, 180]  // 北東の座標
));

// マップのスクロールを制限（範囲外への移動を防ぐ）
map.options.maxBoundsViscosity = 1.0; // 1.0は制限が厳密になる

// 画像パーツのレイヤーを追加
L.imageOverlay('maps/wld00.svg', [[34.9, 91], [60.05, 121.8]]).addTo(map);//中国大陸
L.imageOverlay('maps/wld01.svg', [[34.9, 108.9], [60.05, 163.1]]).addTo(map);//日本北部の海
L.imageOverlay('maps/wld02.svg', [[34.9, 150.85], [60.5, 181]]).addTo(map);//カムチャツカ付近の海
L.imageOverlay('maps/wld10.svg', [[-0.25, 89.3], [35.5, 123.5]]).addTo(map);//東南アジアの海
L.imageOverlay('maps/wld11.svg', [[-0.3, 108.9], [35.5, 163.1]]).addTo(map);//東シナ海
L.imageOverlay('maps/wld12.svg', [[-6, 150.85], [40, 181]]).addTo(map);//南東の島々の海

L.imageOverlay('maps/nb1.svg', [[36.2, 139.33], [50, 148.9]]).addTo(map);
L.imageOverlay('maps/nb2.svg', [[36.06, 135.06], [41.55, 143.25]]).addTo(map);
L.imageOverlay('maps/nb3.svg', [[30, 131.67], [39.3, 140.875]]).addTo(map);
L.imageOverlay('maps/nb4.svg', [[28.6, 128.35], [34.97, 132.47]]).addTo(map);
L.imageOverlay('maps/nb5.svg', [[23.02, 122.93], [29.51, 131.34]]).addTo(map);
L.imageOverlay('maps/nb6.svg', [[24.22, 138.1], [27.7, 145.4]]).addTo(map);

L.imageOverlay('maps/nf1.svg', [[36.2, 139.33], [50, 148.9]]).addTo(map);
L.imageOverlay('maps/nf2.svg', [[36.29, 135.06], [41.55, 143.25]]).addTo(map);
L.imageOverlay('maps/nf3.svg', [[30, 131.69], [39.3, 140.875]]).addTo(map);
L.imageOverlay('maps/nf4.svg', [[28.6, 128.35], [34.97, 132.47]]).addTo(map);
L.imageOverlay('maps/nf5.svg', [[23.02, 122.93], [29.51, 131.34]]).addTo(map);
L.imageOverlay('maps/nf6.svg', [[24.22, 138.1], [27.7, 145.4]]).addTo(map);


L.imageOverlay('maps/wlg00.svg', [[33.25, 91], [61.2, 137.05]]).addTo(map);//中国大陸北部
L.imageOverlay('maps/wlg10.svg', [[-1, 0], [36.1, 228.1]]).addTo(map);//中国大陸南部
L.imageOverlay('maps/wlg01.svg', [[33.25, 135.05], [61.2, 181.15]]).addTo(map);//樺太、カムチャツカなど
L.imageOverlay('maps/wlg11.svg', [[-1, 135.05], [36.1, 181.1]]).addTo(map);//マリアナ島嶼部


// AudioContextの初期化
const audioContext = new (window.AudioContext || window.AudioContext)();
/**@type {AudioBufferSourceNode?} */
let currentSource = null;
let sourceBuffer;

// テキストを合成音声で再生する関数
async function Speak(text, isforce = false) {
  if (currentSource) {
    if (isforce) {
      // 既存の音源を停止
      currentSource.stop();
      currentSource.disconnect();
    }
    else if (currentSource !== null) return;;
  }
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
    // 現在の音源を保持
    currentSource = source;

    // 再生終了後にフラグを解除
    currentSource.onended = () => {
      currentSource = null;
    };
  } catch (error) {
    console.error('エラー:', error);
  }
}

let currenttime = Date.now();

// 現在時刻を表示
function updateTime(reloaded = false) {
  const timeBox = document.getElementById('timeBox');
  if (timeBox == null) return;
  const now = new Date(currenttime);
  if (reloaded) {
    timeBox.innerHTML = `
      ${now.getFullYear()}/${`0${now.getMonth()+1}`.slice(-2)}/${`0${now.getDate()}`.slice(-2)}
      ${`0${now.getHours()}`.slice(-2)}:${`0${now.getMinutes()}`.slice(-2)}:${`0${now.getSeconds()}`.slice(-2)}
      <span style="font-size: 19px;">更新</span>
    `;
    setTimeout(() => {
      if (Date.now() > currenttime + 7000 && Date.now() < currenttime + 60*60*1000) {
        timeBox.innerHTML = `<span style="color: red;">
        ${now.getFullYear()}/${`0${now.getMonth()+1}`.slice(-2)}/${`0${now.getDate()}`.slice(-2)}
        ${`0${now.getHours()}`.slice(-2)}:${`0${now.getMinutes()}`.slice(-2)}:${`0${now.getSeconds()}`.slice(-2)}
        <span style="font-size: 19px;">更新</span></span>
      `;
      }
    }, 1000*5);
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

/**@type {WebSocket} */
let socket

/**@type {Map<number, {int: number; marker: L.Marker | undefined; detecting: boolean; isfirstdetect: boolean; isineew: boolean;}>} */
const realtimepoints = new Map()

/**
 * 
 * @param {number} int 
 * @returns 
 */
function returnIntIcon(int) {
  let intlevel = ""
  if (int < -2.5) intlevel = "s00"
  else if (int < -2.0) intlevel = "s01"
  else if (int < -1.5) intlevel = "s02"
  else if (int < -1.0) intlevel = "s03"
  else if (int < -0.5) intlevel = "s04"
  else if (int < 0.5) intlevel = "s0"
  else if (int < 1.5) intlevel = "s1"
  else if (int < 2.5) intlevel = "s2"
  else if (int < 3.5) intlevel = "s3"
  else if (int < 4.5) intlevel = "s4"
  else if (int < 5.0) intlevel = "s5-"
  else if (int < 5.5) intlevel = "s5+"
  else if (int < 6.0) intlevel = "s6-"
  else if (int < 6.5) intlevel = "s6+"
  else intlevel = "s7"
  const icon = L.icon({ iconUrl: `ui/icons/${intlevel}.svg`, className: "", iconAnchor: [50, 50], iconSize: [100, 100]})
  return icon;
}

let Zooming = false;

map.on('zoomstart', () => {
  Zooming = true;
})
map.on('zoomend', () => {
  Zooming = false;
})

/**
 * 
 * @param {number} int 
 * @returns 
 */
function returnIntLevel2(int) {
  let intlevel
  if (int < -0.5) intlevel = -1
  else if (int < 0.5) intlevel = 0
  else if (int < 1.5) intlevel = 1
  else if (int < 2.5) intlevel = 2
  else if (int < 3.5) intlevel = 3
  else if (int < 4.5) intlevel = 4
  else if (int < 5.0) intlevel = 5
  else if (int < 5.5) intlevel = 6
  else if (int < 6.0) intlevel = 7
  else if (int < 6.5) intlevel = 8
  else intlevel = 9
  return intlevel;
}

function updateRealTimeQuake() {
  opacity05 = true;
  const backlist = []
  for (const [index, point] of realtimepoints.entries()) {
    const location = NIEDrealTimePointLocation[index];
    if (point.int > -3) {
      if (!Zooming) {
        const icon = returnIntIcon(point.int)
        const offset = 1000+point.int*100
        if (!point.marker) {
          const marker = L.marker([location.y, location.x], { icon: icon, zIndexOffset: offset })
          marker.addTo(map);
          point.marker = marker
          realtimepoints.set(index, point)
        }
        else {
          point.marker.setZIndexOffset(offset)
          point.marker.setIcon(icon)
        }
      }
      if (point.detecting && !point.isineew) {
        const int2 = returnIntLevel2(point.int);
        const detectingmarker = L.marker([location.y, location.x], { icon: L.icon({ iconUrl: `ui/icons/detectback${int2 <= 0 ? 1 : int2 <= 4 ? 2 : int2 <= 6 ? 3 : 4}.svg`, className: "", iconAnchor: point.int >= -0.5 ? [35, 35] : [20, 20], iconSize: point.int >= -0.5 ? [70, 70] : [40, 40]}), zIndexOffset: 100 })
        detectingmarker.addTo(map);
        backlist.push(detectingmarker)
      }
      if (point.isfirstdetect) {
        const int2 = returnIntLevel2(point.int);
        const firstdetectmarker = L.marker([location.y, location.x], { icon: L.icon({ iconUrl: `ui/icons/detectcircle${int2 <= 2 ? 1 : int2 <= 4 ? 2 : int2 <= 6 ? 3 : 4}.svg`, className: "", iconAnchor: [100, 100], iconSize: [200, 200]}), zIndexOffset: 100 })
        firstdetectmarker.addTo(map);
        let count = 0
        const intervalid = setInterval(() => {
          if (count > 100) {
            firstdetectmarker.remove()
            //@ts-ignore
            clearInterval(intervalid)
          }
          else {
            firstdetectmarker.setOpacity(1-count/100)
            count++;
          }
        }, 2);
      }
    }
    else if (point.marker) {
      point.marker.remove()
      point.marker = undefined
      realtimepoints.delete(index)
    }
  }
  setTimeout(() => {
    moveCamera()
  },5);

  setTimeout(() => {
    backlist.forEach(marker => {
      marker.remove()
    });
    opacity05 = false;
    halfSecond()
  }, 500);
}

function clicktypeicon(type) {
  DisplayType = type
  changeDisplayType()
}

document.getElementById('typepanelquake').onclick = () => {clicktypeicon(0)};
document.getElementById('typepanelrealtime').onclick = () => {clicktypeicon(1)};
document.getElementById('typepaneltsunami').onclick = () => {clicktypeicon(2)};
document.getElementById('typepanelsetting').onclick = () => {clicktypeicon(3)};

window.addEventListener('resize', () => {
  movenowhover()
});

function movenowhover() {
  const typepanelnow = document.getElementById('typepanelnow');
  if (typepanelnow == null) return;
  const aspectRatio = window.innerWidth / window.innerHeight;
  const tops = [30, 80, 130, 180]
  const lefts = [17, 39, 61, 83]
  if (aspectRatio >= 4/3) {
    typepanelnow.style.top = `${tops[DisplayType]}px`
    typepanelnow.style.left = `480px`
  }
  else {
    typepanelnow.style.top = ''
    typepanelnow.style.bottom = `-33px`
    typepanelnow.style.left = `${lefts[DisplayType]}%`
  }
}

// RGBを補完する関数
/**
 * 
 * @param {number} value 
 * @param {{value: number, RGB: {r: number, g: number, b: number}}[]} breakpoints 
 * @returns 
 */
function interpolateColor(value, breakpoints) {
  for (let i = 0; i < breakpoints.length - 1; i++) {
    const {value: v1, RGB: rgb1} = breakpoints[i];
    const {value: v2, RGB: rgb2} = breakpoints[i + 1];

    if (value >= v1 && value <= v2) {
      const ratio = (value - v1) / (v2 - v1);
      const red = Math.round(rgb1.r + (rgb2.r - rgb1.r) * ratio);
      const green = Math.round(rgb1.g + (rgb2.g - rgb1.g) * ratio);
      const blue = Math.round(rgb1.b + (rgb2.b - rgb1.b) * ratio);

      return `rgb(${red}, ${green}, ${blue})`;
    }
  }
  return "rgb(0, 0, 0)"; // 範囲外の場合は黒を返す例
}

// 基準点の設定（値と対応するRGB色）
const MagnitudeGradientColor = [
  {value: -5,RGB: {r: 51, g: 43, b: 229}},  
  {value: 1, RGB: {r: 50, g: 224, b: 243}},  
  {value: 2, RGB: {r: 146, g: 237,b: 117}},  
  {value: 4, RGB: {r: 246, g: 60, b: 26}}, 
  {value: 6, RGB: {r: 246, g: 60, b: 26}}  ,
  {value: 7, RGB: {r: 211, g: 69, b: 211}},  
  {value: 9, RGB: {r: 101, g: 40, b: 233}},  
  {value: 12, RGB: {r: 101, g: 40, b: 233}},  
];

const DepthGradientColor = [
  {value: 0, RGB: {r: 246, g: 60, b: 26}},
  {value: 10, RGB: {r: 246, g: 60, b: 26}},
  {value: 40, RGB: {r: 246, g: 60, b: 26}}, 
  {value: 80, RGB: {r: 146, g: 237,b: 117}}, 
  {value: 200, RGB: {r: 50, g: 224, b: 243}},   
  {value: 350,RGB: {r: 51, g: 43, b: 229}},  
  {value: 750,RGB: {r: 51, g: 43, b: 229}},  
];

/**@type {{maxInt: number; regions: {name: string; int: number;}[]}} */
const realtimequakeinfo = {
  maxInt: -100,
  regions: []
}

function reloadScrollPanel() {
    if (scrollpanel === null) return;
    const fragment = document.createDocumentFragment();
    let scrolllength = 0
    const aspectRatio = window.innerWidth / window.innerHeight;
    //情報パネルの処理
    const isLandScapeScreen = aspectRatio >= 4/3 //横画面ならtrue
    if (DisplayType == 0) { //地震情報タブ

    }
    else if (DisplayType == 1) { //リアルタイムタブ
      for (const eew of [...EEWMem2.values()].reverse()) {
        const eewpanel = document.createElement('img');
        eewpanel.src = `ui/scroll-panel/paEEW${eew.isWarn ? 2 : 1}${eew.iskarihypo ? 3 : 1}.svg`;
        eewpanel.style.width = '100%';
        eewpanel.style.top = `${scrolllength == 0 ? 0 : 5}px`
        eewpanel.style.position = `relative`


        const serial = document.createElement('div');
        serial.textContent = `${eew.isfinal ? '最終' : '#' + `0${eew.serial}`.slice(-2)}`;
        serial.style.fontFamily = eew.isfinal ? 'BIZ UDPGothic, sans-serif' : 'Akshar, sans-serif'
        serial.style.top = `${scrolllength+(eew.isfinal ? 28 : 32)}px`
        serial.style.left = `343px`
        if (eew.isfinal) serial.style.fontWeight = 'bold'
        serial.style.fontSize = eew.isfinal ? `29px` : `36px`
        serial.style.color = eew.isWarn ? '#fdffab' : '#191500'
        serial.style.position = `absolute`
        serial.style.transform = 'translate(0%, -50%)'

        const hypocenter = document.createElement('div');
        hypocenter.textContent = eew.hypocenter;
        hypocenter.style.fontFamily = 'BIZ UDPGothic, sans-serif'
        hypocenter.style.top = `${scrolllength+110}px`
        hypocenter.style.left = `20px`
        hypocenter.style.fontSize = `45px`
        hypocenter.style.fontWeight = 'bold'
        hypocenter.style.color = 'white'
        hypocenter.style.position = `absolute`
        hypocenter.style.transform = 'translate(0%, -50%)'

        const quaketext = document.createElement('div');
        quaketext.textContent = eew.iskarihypo ? 'で揺れ' : 'で地震';
        quaketext.style.fontFamily = 'BIZ UDPGothic, sans-serif'
        quaketext.style.top = eew.hypocenter.length <= 6 ? `${scrolllength+120}px` : `${scrolllength+160}px`
        quaketext.style.left = eew.hypocenter.length <= 6 ? `${eew.hypocenter.length*50 + 20}px` : `320px`
        quaketext.style.fontSize = `25px`
        quaketext.style.color = 'white'
        quaketext.style.position = `absolute`
        quaketext.style.transform = 'translate(0%, -50%)'

        const begantime = document.createElement('div');
        const BT = new Date(eew.begantime)
        begantime.textContent = `${BT.getFullYear()}/${`0${BT.getMonth()+1}`.slice(-2)}/${`0${BT.getDate()}`.slice(-2)} ${`0${BT.getHours()}`.slice(-2)}:${`0${BT.getMinutes()}`.slice(-2)}:${`0${BT.getSeconds()}`.slice(-2)}`;
        begantime.style.fontFamily = 'Akshar, sans-serif'
        begantime.style.top = `${scrolllength+175}px`
        begantime.style.left = `20px`
        begantime.style.fontSize = `25px`
        begantime.style.color = 'white'
        begantime.style.position = `absolute`
        begantime.style.transform = 'translate(0%, -50%)'

        const begantimequaketext = document.createElement('div');
        begantimequaketext.textContent = eew.iskarihypo ? '検知' : '発生';
        begantimequaketext.style.fontFamily = 'BIZ UDPGothic, sans-serif'
        begantimequaketext.style.top = `${scrolllength+175}px`
        begantimequaketext.style.left = `220px`
        begantimequaketext.style.fontSize = `20px`
        begantimequaketext.style.color = 'white'
        begantimequaketext.style.position = `absolute`
        begantimequaketext.style.transform = 'translate(0%, -50%)'

        const intp = document.createElement('img');
        intp.src = `ui/scroll-panel/paSc${eew.maxInt == -1 ? 0 : eew.maxInt}.svg`;
        intp.style.width = '460px';
        intp.style.top = `${scrolllength+285}px`
        intp.style.left = `210px`
        intp.style.position = `absolute`
        intp.style.transform = 'translate(-50%, -50%)'

        const intntext = document.createElement('img');
        intntext.src = eew.isDeep ? `ui/scroll-panel/sndhs.svg` : eew.isOnepoint ? `ui/scroll-panel/sndht.svg` : eew.maxInt == -1 ? `ui/scroll-panel/sndhn.svg`: `ui/scroll-panel/paSu.svg`;
        intntext.style.width = '410px';
        intntext.style.top = `${scrolllength+285}px`
        intntext.style.left = `210px`
        intntext.style.position = `absolute`
        if (!eew.isOnepoint && !eew.isDeep && eew.maxInt >= 2 && eew.maxInt <= 4) intntext.style.filter = 'brightness(0)'
        intntext.style.transform = 'translate(-50%, -50%)'

        const description = document.createElement('img');
        description.src = eew.isWarn && eew.maxInt >= 7 ? `ui/scroll-panel/eewdescription_specialwarn.svg` : eew.isWarn ? `ui/scroll-panel/eewdescription_warn.svg` : eew.isDeep ? `ui/scroll-panel/eewdescription_deep.svg` : eew.isLevel ? `ui/scroll-panel/eewdescription_level.svg` : eew.isPLUM ? `ui/scroll-panel/eewdescription_plum.svg` : eew.isOnepoint ? `ui/scroll-panel/eewdescription_onepoint.svg` : `ui/scroll-panel/eewdescription_forecast.svg`;
        description.style.width = '380px';
        description.style.top = `${scrolllength+(eew.iskarihypo ? 300 : 600)}px`
        description.style.left = `210px`
        description.style.position = `absolute`
        description.style.transform = 'translate(-50%, -50%)'

        fragment.appendChild(eewpanel);
        fragment.appendChild(serial);
        fragment.appendChild(hypocenter);
        fragment.appendChild(quaketext);
        fragment.appendChild(begantime);
        fragment.appendChild(begantimequaketext);
        fragment.appendChild(intp);
        fragment.appendChild(intntext);
        fragment.appendChild(description);

        if (!eew.isOnepoint && !eew.isDeep && eew.maxInt >= 0) {
          const intnint = document.createElement('img');
          intnint.src = `ui/icons/${eew.maxInt}.svg`;
          intnint.style.width = '150px';
          intnint.style.top = `${scrolllength+285}px`
          intnint.style.left = `300px`
          intnint.style.position = `absolute`
          intnint.style.transform = 'translate(-50%, -50%)'
          fragment.appendChild(intnint);
        }

        if (!eew.iskarihypo) {
          const magnitudetext = document.createElement('div');
          magnitudetext.textContent = `${eew.magnitude}.0`.slice(0, 3);
          magnitudetext.style.fontFamily = 'Akshar, sans-serif'
          magnitudetext.style.top = `${scrolllength+425}px`
          magnitudetext.style.left = `250px`
          magnitudetext.style.fontSize = `80px`
          magnitudetext.style.color = 'white'
          magnitudetext.style.position = `absolute`
          magnitudetext.style.transform = 'translate(0%, -50%)'

          const magnitudep = document.createElement('div');
          magnitudep.style.top = `${scrolllength+420}px`
          magnitudep.style.left = `363px`
          magnitudep.style.width = `31px`
          magnitudep.style.height = `76px`
          magnitudep.style.backgroundColor = interpolateColor(eew.magnitude, MagnitudeGradientColor)
          magnitudep.style.position = `absolute`
          magnitudep.style.transform = 'translate(0%, -50%)'

          const depthtext = document.createElement('div');
          depthtext.textContent = `${eew.depth}km`;
          depthtext.style.fontFamily = 'Akshar, sans-serif'
          depthtext.style.top = `${scrolllength+515}px`
          depthtext.style.left = eew.depth >= 100 ? '200px' : `220px`
          depthtext.style.fontSize = `60px`
          depthtext.style.color = 'white'
          depthtext.style.position = `absolute`
          depthtext.style.transform = 'translate(0%, -50%)'

          const depthp = document.createElement('div');
          depthp.style.top = `${scrolllength+510}px`
          depthp.style.left = `363px`
          depthp.style.width = `31px`
          depthp.style.height = `60px`
          depthp.style.backgroundColor = interpolateColor(eew.depth, DepthGradientColor)
          depthp.style.position = `absolute`
          depthp.style.transform = 'translate(0%, -50%)'

          fragment.appendChild(magnitudetext);
          fragment.appendChild(magnitudep);
          fragment.appendChild(depthtext);
          fragment.appendChild(depthp);
        }

        if (eew.Cancel) {
          const cancelpanel = document.createElement('img');
          cancelpanel.src = `ui/scroll-panel/paEEWC${eew.iskarihypo ? 3 : 1}.svg`;
          cancelpanel.style.width = '420px';
          cancelpanel.style.left = '0px';
          cancelpanel.style.top = `${scrolllength}px`
          cancelpanel.style.position = `absolute`
          fragment.appendChild(cancelpanel);
        }

        scrolllength += 663//eewpanel.offsetHeight+10
      }
      if (realtimequakeinfo.maxInt != -100) {
        const realtimequakepanel = document.createElement('img');
        realtimequakepanel.src = 'ui/scroll-panel/DetectPanel.svg';
        realtimequakepanel.style.width = '100%';
        realtimequakepanel.style.top = '10px';
        realtimequakepanel.style.position = `relative`

        const realtimequakeintp = document.createElement('img');
        realtimequakeintp.src = `ui/scroll-panel/paSm${realtimequakeinfo.maxInt}.svg`;
        realtimequakeintp.style.width = '220px';
        //console.log(scrolllength)
        realtimequakeintp.style.top = `${scrolllength+150}px`
        realtimequakeintp.style.left = `325px`
        realtimequakeintp.style.position = `absolute`
        realtimequakeintp.style.transform = 'translate(-50%, -50%)'

        const realtimequakeintn = document.createElement('img');
        realtimequakeintn.src = `ui/icons/${realtimequakeinfo.maxInt}.svg`;
        realtimequakeintn.style.width = '140px';
        realtimequakeintn.style.top = `${scrolllength+150}px`
        realtimequakeintn.style.left = `325px`
        realtimequakeintn.style.position = `absolute`
        realtimequakeintn.style.transform = 'translate(-50%, -50%)'

        fragment.appendChild(realtimequakepanel);
        fragment.appendChild(realtimequakeintp);
        fragment.appendChild(realtimequakeintn);
        scrolllength += 250;

        for (let i = 0; i < Math.min(realtimequakeinfo.regions.length, 22); i++) {
          const region = realtimequakeinfo.regions[i];
          const realtimequakeregionicon = document.createElement('img');
          realtimequakeregionicon.src = `ui/icons/squareint${region.int}.svg`;
          realtimequakeregionicon.style.width = '60px';
          realtimequakeregionicon.style.top = `${scrolllength}px`
          realtimequakeregionicon.style.left = `40px`
          realtimequakeregionicon.style.position = `absolute`
          realtimequakeregionicon.style.transform = 'translate(-50%, -50%)'

          const realtimequakeregionname = document.createElement('div');
          realtimequakeregionname.textContent = region.name;
          realtimequakeregionname.style.fontFamily = 'BIZ UDPGothic, sans-serif'
          realtimequakeregionname.style.top = `${scrolllength}px`
          realtimequakeregionname.style.left = `80px`
          realtimequakeregionname.style.fontSize = `30px`
          realtimequakeregionname.style.color = `white`
          realtimequakeregionname.style.position = `absolute`
          realtimequakeregionname.style.transform = 'translate(0%, -50%)'

          fragment.appendChild(realtimequakeregionicon);
          fragment.appendChild(realtimequakeregionname);
          scrolllength += 60;
        }
      }
    }
  requestAnimationFrame(() => {
    scrollpanel.innerHTML = ''; // 初期化
    scrollpanel.appendChild(fragment); // 一括追加
  });
}

const scrollpanel = document.getElementById('scroll-panel');

function changeDisplayType() {
  movenowhover()
  const iconnames = ['quake', 'realtime', 'tsunami', 'setting']
  for (const iconname of iconnames) {
    const typepanelicon = document.getElementById(`typepanel${iconname}`);
    if (typepanelicon == null) return;
    if (iconname == iconnames[DisplayType]) typepanelicon.style.filter = 'brightness(1)';
    else typepanelicon.style.filter = ""
  }
  updateRealTimeQuake()
  reloadScrollPanel()
}

function moveCamera() {
  const pointlist = []
  const addbounds = []
  if (DisplayType == 1) { //リアルタイムタブ
    const eews = Array.from(EEWMem2.values())
    const hypocenters = eews.map(eew => eew.hypocentermarker.getLatLng())
    addbounds.push(...eews.filter(eew => currenttime - eew.begantime < 90*1000).map(eew => eew.forecastcircle.Pwave.getBounds()))
    addbounds.push(...eews.filter(eew => currenttime - eew.begantime < 90*1000).map(eew => eew.forecastcircle.Swave.getBounds()))
    pointlist.push(...hypocenters)

    const detectedpoints = Array.from(realtimepoints.values()).filter(point => point.detecting && point.marker != undefined).map(point => point.marker?.getLatLng()).filter(latlng =>latlng != undefined)
    pointlist.push(...detectedpoints)
    //console.log(detectedpoints.length)
  }
  if (pointlist.length > 0 || addbounds.length > 0) {
    const bounds = L.latLngBounds(pointlist);
    //addbounds.forEach(b => {
    //  bounds.extend(b)
    //})
    map.fitBounds(bounds, {
      padding: [100, 100],
      maxZoom: 9
    });
  }
}

/**@type {Map<string, import(".").EEWInfoType>} */
const EEWMem2 = new Map()

/**@type {{[key: number]: {hypocenter: L.CircleMarker; pwave: L.Circle; swave: L.Circle; opacity: number; begantime: number; depth: number;}}} */
let detectedquakemarkers = {}

function halfSecond() {
  for (const mem2 of EEWMem2.values()) {
    if (!mem2.Cancel) mem2.hypocentermarker.setOpacity(opacity05 ? (DisplayType == 2 ? 0 : DisplayType == 0 ? 0.5 : 1) : 0)
  }
  for (const quake of Object.values(detectedquakemarkers)) {
    //quake.hypocenter.setStyle({opacity: (opacity05 ? 1 : 0.2)})
    quake.hypocenter.setStyle({opacity: quake.opacity*(opacity05 ? 1 : 0.2), fillOpacity: quake.opacity*(opacity05 ? 1 : 0.2)})
    quake.pwave.setStyle({opacity: quake.opacity*(opacity05 ? 1 : 0.2)})
    quake.swave.setStyle({opacity: quake.opacity*(opacity05 ? 1 : 0.2)})
  }
}

function ConnectToServer() {
socket = new WebSocket('ws://61.27.11.129:3547');

socket.onopen = () => {
  console.log('接続完了');
};

setInterval(() => {
  if (socket.readyState == WebSocket.CLOSED) ConnectToServer()
}, 500);
socket.onclose = () => {
  ConnectToServer()
}

//サーバーからの指示
socket.onmessage = async (event) => {
  /**@type {import(".").ServerData} */
  const data = JSON.parse(event.data)
  if (data.type == 'read') Speak(data.text, data.isforce)
  else if (data.type == 'sound') new Audio(data.path).play()
  else if (data.type == 'realtimequake') {
    currenttime = data.time
    for (const point of data.data) {
      realtimepoints.set(point.ind, {int: point.int, marker: realtimepoints.get(point.ind)?.marker, isfirstdetect: point.isfirstdetect, detecting: point.detecting, isineew: point.isineew})
    }
    realtimequakeinfo.maxInt = data.maxInt
    realtimequakeinfo.regions = data.regions
    updateTime(true)
    updateRealTimeQuake()
    halfSecond()
    reloadScrollPanel()
  }
  else if (data.type == 'realtimehypocenter') {
    for (const quake of data.data) {
      const marker = detectedquakemarkers[quake.index];
      const maxint = returnIntLevel2(quake.maxint);
      const color = maxint >= 7 ? '#a00066' : maxint >= 5 ? '#ff0000' : maxint >= 1 ? '#ffde00' : '#73ff00'
      const radius = wavedistance(currenttime - quake.begantime, quake.depth)
      if (!marker?.hypocenter) {
        const newhypocenter = L.circleMarker([quake.latitude, quake.longitude], {
          radius: 3,
          color: color,
          fillColor: color,
          fillOpacity: 1
        }).addTo(map);
        const newpwave = L.circle([quake.latitude, quake.longitude], {
          radius: Math.max(0, radius.p)*1000,
          color: color,        // 円の外枠の色
          fillOpacity: 0,    // 塗りつぶしを無効化
          weight: 3
        }).addTo(map);
        const newswave = L.circle([quake.latitude, quake.longitude], {
          radius: Math.max(0, radius.s)*1000,
          color: color,        // 円の外枠の色
          fillOpacity: 0,    // 塗りつぶしを無効化
          weight: 3
        }).addTo(map);
        //console.log(wavedistance('p', data.begantime, data.depth)??0)
        detectedquakemarkers[String(quake.index)] = {hypocenter: newhypocenter, pwave: newpwave, swave: newswave, opacity: quake.opacity, begantime: quake.begantime, depth: quake.depth}
        //console.log({hypocenter: newhypocenter, pwave: newpwave, swave: newswave, opacity: data.opacity, begantime: data.begantime, depth: data.depth})
        newpwave.bringToFront()
        newswave.bringToFront()
      }
      else {
        marker.hypocenter.setLatLng([quake.latitude, quake.longitude])
        marker.pwave.setLatLng([quake.latitude, quake.longitude])
        marker.swave.setLatLng([quake.latitude, quake.longitude])
        marker.pwave.setRadius(Math.max(0, radius.p)*1000)
        marker.swave.setRadius(Math.max(0, radius.s)*1000)
        marker.hypocenter.setStyle({color, opacity: quake.opacity})
        marker.pwave.setStyle({color})
        marker.swave.setStyle({color})
        marker.pwave.bringToFront()
        marker.swave.bringToFront()
        detectedquakemarkers[String(quake.index)].opacity = quake.opacity
        detectedquakemarkers[String(quake.index)].begantime = quake.begantime
        detectedquakemarkers[String(quake.index)].depth = quake.depth
      }      
    }
    for (const key in detectedquakemarkers) {
      if (!data.data.some(d => String(d.index) == key)) {
        const value = detectedquakemarkers[key]
        value.hypocenter.remove()
        value.pwave.remove()
        value.swave.remove()
        delete detectedquakemarkers[key]; // キーを削除
      }
    }
  }
  else if (data.type == 'eewinfo') {
    EEW(data)
  }
};
}

/**
 * 
 * @param {import(".").eewinfo} data 
 */
function EEW(data) {
  if (data.Delete) {
    const mem2 = EEWMem2.get(data.EventID)
    mem2?.hypocentermarker.remove()
    mem2?.forecastcircle.Pwave.remove()
    mem2?.forecastcircle.Swave.remove()
    EEWMem2.delete(data.EventID);
    setTimeout(() => {
      reloadScrollPanel()
    });
    return;
  }
  else if (data.Cancel) {
    const mem2 = EEWMem2.get(data.EventID)
    if (!mem2) return;
    mem2.forecastcircle.Pwave.remove()
    mem2.forecastcircle.Swave.remove()
    mem2.hypocentermarker.setOpacity(0.85)
    mem2.hypocentermarker.setIcon(L.icon({ iconUrl: `ui/icons/hypocenter_RT2${data.assumedepicenter ? '_assumed.svg' : ''}.svg`, className: "", iconAnchor: [50, 50], iconSize: [100, 100]}))
    mem2.Cancel = true;
    EEWMem2.set(data.EventID, mem2)
    console.log(mem2)
    setTimeout(() => {
      reloadScrollPanel()
    });
    setTimeout(() => {
      mem2?.hypocentermarker.remove()
      EEWMem2.delete(data.EventID);
      setTimeout(() => {
        reloadScrollPanel()
      });
    }, 10*1000);
    return;
  }
  const mem2 = EEWMem2.get(data.EventID)
  const color = interpolateColor(data.magnitude, MagnitudeGradientColor)
  const radius = wavedistance(data.time, data.hypocenter.Depth)
  const hypocenterIcon =  L.icon({ iconUrl: `ui/icons/hypocenter_RT1${data.assumedepicenter ? '_assumed.svg' : ''}.svg`, className: "", iconAnchor: [50, 50], iconSize: [100, 100]})
  const hypocentermarker = mem2 ? mem2.hypocentermarker : L.marker([data.hypocenter.y, data.hypocenter.x], { icon: hypocenterIcon })
  const hypocenterdeepmarker = mem2 ? mem2.hypocenterdeepmarker : L.svg()
  const svg = d3.select(map.getPanes().overlayPane).select('svg');
  if (radius.s < 0) {
    hypocenterdeepmarker.addTo(map);
    // 進捗率を角度に変換 (時計回り)
    const startAngle = 0; // 開始角度
    const endAngle = radius.s*(-1) * 3.6 * (Math.PI / 180); // 終了角度 (度をラジアンに変換)

    // 円弧パスデータ生成
    const x1 = data.hypocenter.x + 100 * Math.cos(startAngle);
    const y1 = data.hypocenter.y - 100 * Math.sin(startAngle);
    const x2 = data.hypocenter.x + 100 * Math.cos(endAngle);
    const y2 = data.hypocenter.y - 100 * Math.sin(endAngle);

    const largeArcFlag = radius.s*(-1) > 50 ? 1 : 0;

    const pathData = `
      M ${data.hypocenter.x} ${data.hypocenter.y} 
      L ${x1} ${y1} 
      A 100 100 0 ${largeArcFlag} 1 ${x2} ${y2} 
      Z
    `;

    // パスを更新
    svg.selectAll('path').remove();
    svg.append('path')
      .attr('d', pathData)
      .style('fill', 'blue')
      .style('opacity', 0.7);
  }
  else hypocenterdeepmarker.remove()
  const P_forecastcircle = mem2 ? mem2.forecastcircle.Pwave : L.circle([data.hypocenter.y, data.hypocenter.x], {
    radius: Math.max(0, radius.p)*1000,           // 円の半径(m)
    color: 'gray',        // 円の外枠の色
    fillOpacity: 0,    // 塗りつぶしを無効化
    weight: 2             // 外枠の太さ
  })
  const S_forecastcircle = mem2 ? mem2.forecastcircle.Swave : L.circle([data.hypocenter.y, data.hypocenter.x], {
    radius: Math.max(0, radius.s)*1000,           // 円の半径(m)
    color: color,        // 円の外枠の色
    fillOpacity: 0.05,
    fillColor: color,
    weight: 5             // 外枠の太さ,
  })
  if (!mem2) { //初めて処理
    //予報円の処理
    hypocentermarker.setOpacity(opacity05 ? (DisplayType == 2 ? 0 : DisplayType == 0 ? 0.5 : 1) : 0)
    hypocentermarker.addTo(map);
    P_forecastcircle.addTo(map);
    S_forecastcircle.addTo(map);
    P_forecastcircle.bringToFront()
    S_forecastcircle.bringToFront()
    hypocentermarker.setZIndexOffset(100000)
  }
  else {
    hypocentermarker.setLatLng([data.hypocenter.y, data.hypocenter.x])
    P_forecastcircle.setLatLng([data.hypocenter.y, data.hypocenter.x])
    S_forecastcircle.setLatLng([data.hypocenter.y, data.hypocenter.x])

    P_forecastcircle.setRadius(Math.max(0, radius.p)*1000)
    S_forecastcircle.setRadius(Math.max(0, radius.s)*1000)
    S_forecastcircle.setStyle({fillColor: color, color})
    P_forecastcircle.bringToFront()
    S_forecastcircle.bringToFront()
    hypocentermarker.setZIndexOffset(100000)
  }

  EEWMem2.set(data.EventID, {
    hypocentermarker: hypocentermarker,
    hypocenterdeepmarker: hypocenterdeepmarker,
    forecastcircle: {
      Pwave: P_forecastcircle,
      Swave: S_forecastcircle
    },
    latitude: data.hypocenter.y,
    longitude: data.hypocenter.x,
    serial: data.serial,
    isfinal: data.isfinal,
    isWarn: data.isWarn,
    maxInt: data.maxInt,
    hypocenter: data.hypocenter.name,
    iskarihypo: data.iskarihypo,
    isDeep: data.isDeep,
    isLevel: data.isLevel,
    isOnepoint: data.isOnepoint,
    isPLUM: data.isPLUM,
    magnitude: data.magnitude,
    depth: data.hypocenter.Depth,
    begantime: data.begantime,
    Cancel: data.Cancel
  })
  reloadScrollPanel()
  ExpressRegionMap(data.regionmap)
}

/**@type {{[key: string]: L.ImageOverlay}} */
const regionmapmarkers = {}

const regionmapLocations = {
  1: [[36.2, 139.33], [50, 148.9]],
  2: [[36.29, 135.06], [41.55, 143.25]],
  3: [[30, 131.69], [39.3, 140.875]],
  4: [[28.6, 128.35], [34.97, 132.47]],
  5: [[23.02, 122.93], [29.51, 131.34]],
  6: [[24.22, 138.1], [27.7, 145.4]]
}

/**
 * @param {import(".").RegionMap} [data] 
 */
function ExpressRegionMap(data) {
  for (const regionname in data) {
    const mem = regionmapmarkers[regionname]
    if (mem) {}
    else {
      const ind = regiontable[regionname]
      const regionmarker =  L.imageOverlay(`maps/regionmap/${regionname}.svg`, regionmapLocations[Number(ind)])
      regionmarker.addTo(map);
      regionmapmarkers[regionname] = regionmarker
    }
  }
}

updateRealTimeQuake()
changeDisplayType()
ConnectToServer()

/**
 * 
 * @param {number} time 
 * @param {number} depth 
 * @returns 
 */
function wavedistance(time, depth) {
  const returnvalue = {p: 0, s: 0}
  const startind = (Math.round(Math.min(50, depth)/2) + Math.round(Math.min(200, Math.max(0, depth-50))/5) + Math.round(Math.max(0, depth-200)/10))*236
  if (soujitable[startind].soujiP > time/1000) returnvalue.p = -100 * (time/1000) / soujitable[startind].soujiP
  if (soujitable[startind].soujiS > time/1000) returnvalue.s = -100 * (time/1000) / soujitable[startind].soujiS
  //console.log(returnvalue)
  if (returnvalue.p == 0 || returnvalue.s == 0) {
    for (let i = startind; i < startind+236; i++) {
      const souji1 = soujitable[i];
      if (returnvalue.s == 0 && souji1.soujiS*1000 >= time) {
        const souji2 = soujitable[i+1]
        returnvalue.s = souji1.distance + (time/1000-souji1.soujiS)/(souji2.soujiS-souji1.soujiS)*(souji2.distance-souji1.distance)
        if (returnvalue.p != 0) break;
      }
      if (returnvalue.p == 0 && souji1.soujiP*1000 >= time) {
        const souji2 = soujitable[i+1]
        returnvalue.p = souji1.distance + (time/1000-souji1.soujiP)/(souji2.soujiP-souji1.soujiP)*(souji2.distance-souji1.distance)
        break;
      }
    }
  }
  //console.log(returnvalue)
  return returnvalue
  //if (type == 'p') {
  //  if (pwavespeed*time/1000 - depth > 0) return Math.sqrt((pwavespeed*time/1000)**2 - depth**2)
  //  else return -1*(pwavespeed*time/1000)/depth
  //}
  //else {
  //  if (swavespeed*time/1000 - depth > 0) return Math.sqrt((swavespeed*time/1000)**2 - depth**2)
  //  else return -1*(swavespeed*time/1000)/depth
  //}    
}

function growForecastCircle() {
  for (const mem2 of EEWMem2.values()) {
    if (mem2.Cancel) continue;
    const P = mem2.forecastcircle.Pwave
    const S = mem2.forecastcircle.Swave
    const radius = wavedistance(currenttime - mem2.begantime, mem2.depth)
    P.setRadius(radius.p > 0 ? radius.p*1000 : 0)
    S.setRadius(radius.s > 0 ? radius.s*1000 : 0)
    if (radius.p > 0) P.setStyle({opacity: 1})
    else P.setStyle({opacity: 0})
    if (radius.s > 0) S.setStyle({opacity: 1})
    else S.setStyle({opacity: 0})
    S.bringToFront()
    const hypocenterdeepmarker = mem2.hypocenterdeepmarker

    if (radius.s < 0) {
      //console.log(radius.s*(-1))
      hypocenterdeepmarker.addTo(map);
      const rad = 50
      const center = map.latLngToLayerPoint([mem2.latitude, mem2.longitude]);
      const startAngle = 0; // 円弧の開始角度 (度)
      const percentage = -1*radius.s; // 表示する円の割合 (%)

      // 円弧の終了角度を計算
      const endAngle = (percentage / 100) * 360;

      // 度をラジアンに変換するヘルパー関数
      function toRadians(degrees) {
        return degrees * (Math.PI / 180);
      }

      // 円弧パスデータ生成
      const startX = center.x + rad * Math.cos(toRadians(startAngle));
      const startY = center.y - rad * Math.sin(toRadians(startAngle));
      const endX = center.x + rad * Math.cos(toRadians(endAngle));
      const endY = center.y - rad * Math.sin(toRadians(endAngle));

      const largeArcFlag = (endAngle - startAngle > 180) ? 1 : 0;

      const pathData = `
        M ${center.x}, ${center.y} 
        L ${startX}, ${startY} 
        A ${rad}, ${rad} 0 ${largeArcFlag}, 1 ${endX}, ${endY} 
        Z
      `;

      // パスを更新
      const svg = d3.select(map.getPanes().overlayPane).select('svg');
      svg.selectAll('path').remove();
      svg.append('path')
        .attr('d', pathData)
        .style('fill', 'blue')
        .style('opacity', 0.7);
    } 
    else hypocenterdeepmarker.remove()
    //console.log(`${currenttime}, ${mem2.begantime}, ${currenttime - mem2.begantime}`)
  }
  for (const quake of Object.values(detectedquakemarkers)) {
    const P = quake.pwave
    const S = quake.swave
    //console.log(`${currenttime}, ${quake.begantime}, ${quake.depth}`)
    const radius = wavedistance(currenttime - quake.begantime, quake.depth)
    P.setRadius(Math.max(0, radius.p)*1000)
    S.setRadius(Math.max(0, radius.s)*1000)
    S.bringToFront()
  }
}

setInterval(() => {
  growForecastCircle()
  currenttime += 10
}, 10);


