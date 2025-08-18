var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { NIEDrealTimePointLocation, soujitable, regiontable, regionmapData } from "./export.js";
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
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
const cache = [];
imageUrls.forEach(url => {
    const img = new Image(); // 新しい画像オブジェクトを作成
    img.src = url; // URLを設定して読み込む
    cache.push(img); // キャッシュに保存
});
let opacity05 = false;
//0: 地震情報タブ 1: リアルタイムタブ 2: 津波タブ 3: 設定
let DisplayType = 0;
let currentDisplayEQInfoID = "";
// 地図の初期設定
var map = L.map('map', {
    center: [38.0, 137.0], // 初期中心位置（例として日本の座標を設定）
    zoom: 5.8, // 初期ズームレベル
    zoomSnap: 0.00001, // ズームのスナップ間隔（小数点可）
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
map.setMaxBounds(L.latLngBounds([0, 92], // 南西の座標
[60, 180] // 北東の座標
));
// マップのスクロールを制限（範囲外への移動を防ぐ）
map.options.maxBoundsViscosity = 1.0; // 1.0は制限が厳密になる
// 画像パーツのレイヤーを追加
L.imageOverlay('maps/wld00.svg', [[34.9, 91], [60.05, 121.8]]).addTo(map); //中国大陸
L.imageOverlay('maps/wld01.svg', [[34.9, 108.9], [60.05, 163.1]]).addTo(map); //日本北部の海
L.imageOverlay('maps/wld02.svg', [[34.9, 150.85], [60.5, 181]]).addTo(map); //カムチャツカ付近の海
L.imageOverlay('maps/wld10.svg', [[-0.25, 89.3], [35.5, 123.5]]).addTo(map); //東南アジアの海
L.imageOverlay('maps/wld11.svg', [[-0.3, 108.9], [35.5, 163.1]]).addTo(map); //東シナ海
L.imageOverlay('maps/wld12.svg', [[-6, 150.85], [40, 181]]).addTo(map); //南東の島々の海
L.imageOverlay('maps/nb1.svg', [[36.2, 139.33], [50, 148.9]]).addTo(map);
L.imageOverlay('maps/nb2.svg', [[36.06, 135.06], [41.55, 143.25]]).addTo(map);
L.imageOverlay('maps/nb3.svg', [[30, 131.67], [39.3, 140.875]]).addTo(map);
L.imageOverlay('maps/nb4.svg', [[28.6, 128.35], [34.97, 132.47]]).addTo(map);
L.imageOverlay('maps/nb5.svg', [[23.02, 122.93], [29.51, 131.34]]).addTo(map);
L.imageOverlay('maps/nb6.svg', [[24.22, 138.1], [27.7, 145.4]]).addTo(map);
L.imageOverlay('maps/nf1.svg', [[36.2, 139.33], [50, 148.9]], { zIndex: 100 }).addTo(map);
L.imageOverlay('maps/nf2.svg', [[36.29, 135.06], [41.55, 143.25]], { zIndex: 100 }).addTo(map);
L.imageOverlay('maps/nf3.svg', [[30, 131.69], [39.3, 140.875]], { zIndex: 100 }).addTo(map);
L.imageOverlay('maps/nf4.svg', [[28.6, 128.35], [34.97, 132.47]], { zIndex: 100 }).addTo(map);
L.imageOverlay('maps/nf5.svg', [[23.02, 122.93], [29.51, 131.34]], { zIndex: 100 }).addTo(map);
L.imageOverlay('maps/nf6.svg', [[24.22, 138.1], [27.7, 145.4]], { zIndex: 100 }).addTo(map);
L.imageOverlay('maps/wlg00.svg', [[33.25, 91], [61.2, 137.05]]).addTo(map); //中国大陸北部
L.imageOverlay('maps/wlg10.svg', [[-1, 0], [36.1, 228.1]]).addTo(map); //中国大陸南部
L.imageOverlay('maps/wlg01.svg', [[33.25, 135.05], [61.2, 181.15]]).addTo(map); //樺太、カムチャツカなど
L.imageOverlay('maps/wlg11.svg', [[-1, 135.05], [36.1, 181.1]]).addTo(map); //マリアナ島嶼部
// AudioContextの初期化
const audioContext = new (window.AudioContext || window.AudioContext)();
let currentSource = null;
let stackSpeakContent = [];
let isSpeakOperating = false;
// テキストを合成音声で再生する関数
function Speak(text_1) {
    return __awaiter(this, arguments, void 0, function* (text, isforce = false, isStack = false) {
        if (isSpeakOperating) {
            setTimeout(() => {
                Speak(text, isforce, isStack);
            }, 1000);
            return;
        }
        if (currentSource !== null) {
            if (isforce) {
                // 既存の音源を停止
                currentSource.stop();
                currentSource.disconnect();
                stackSpeakContent = [];
            }
            else {
                if (isStack)
                    stackSpeakContent.push(text);
                return;
            }
        }
        isSpeakOperating = true;
        try {
            // 音声データを取得
            const response = yield fetch('https://synthesis-service.scratch.mit.edu/synth?locale=JA-JP&gender=female&text=' + text);
            const audioData = yield response.arrayBuffer();
            const audioBuffer = yield audioContext.decodeAudioData(audioData);
            // ソースを作成
            currentSource = audioContext.createBufferSource();
            currentSource.buffer = audioBuffer;
            // 再生速度（ピッチ）を調整
            currentSource.playbackRate.value = 1.2;
            // 出力先に接続
            currentSource.connect(audioContext.destination);
            // 再生
            currentSource.start();
            isSpeakOperating = false;
            // 再生終了後にフラグを解除
            currentSource.onended = () => {
                currentSource = null;
                const element = stackSpeakContent.shift();
                if (element)
                    setTimeout(() => {
                        Speak(element);
                    }, 200);
            };
        }
        catch (error) {
            console.error('エラー:', error);
            isSpeakOperating = false;
        }
    });
}
let currenttime = Date.now();
// 現在時刻を表示
function updateTime(reloaded = false) {
    const timeBox = document.getElementById('timeBox');
    if (timeBox == null)
        return;
    const now = new Date(currenttime);
    if (reloaded) {
        timeBox.innerHTML = `
      ${now.getFullYear()}/${`0${now.getMonth() + 1}`.slice(-2)}/${`0${now.getDate()}`.slice(-2)}
      ${`0${now.getHours()}`.slice(-2)}:${`0${now.getMinutes()}`.slice(-2)}:${`0${now.getSeconds()}`.slice(-2)}
      <span style="font-size: 19px;">更新</span>
    `;
        setTimeout(() => {
            if (Date.now() > currenttime + 7000 && Date.now() < currenttime + 60 * 60 * 1000) {
                timeBox.innerHTML = `<span style="color: red;">
        ${now.getFullYear()}/${`0${now.getMonth() + 1}`.slice(-2)}/${`0${now.getDate()}`.slice(-2)}
        ${`0${now.getHours()}`.slice(-2)}:${`0${now.getMinutes()}`.slice(-2)}:${`0${now.getSeconds()}`.slice(-2)}
        <span style="font-size: 19px;">更新</span></span>
      `;
            }
        }, 1000 * 5);
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
updateTime();
let socket;
const realtimepoints = new Map();
function returnIntIcon(int) {
    let intlevel = "";
    if (int < -2.5)
        intlevel = "s00";
    else if (int < -2.0)
        intlevel = "s01";
    else if (int < -1.5)
        intlevel = "s02";
    else if (int < -1.0)
        intlevel = "s03";
    else if (int < -0.5)
        intlevel = "s04";
    else if (int < 0.5)
        intlevel = "s0";
    else if (int < 1.5)
        intlevel = "s1";
    else if (int < 2.5)
        intlevel = "s2";
    else if (int < 3.5)
        intlevel = "s3";
    else if (int < 4.5)
        intlevel = "s4";
    else if (int < 5.0)
        intlevel = "s5-";
    else if (int < 5.5)
        intlevel = "s5+";
    else if (int < 6.0)
        intlevel = "s6-";
    else if (int < 6.5)
        intlevel = "s6+";
    else
        intlevel = "s7";
    const icon = L.icon({ iconUrl: `ui/icons/${intlevel}.svg`, className: "", iconAnchor: [50, 50], iconSize: [100, 100] });
    return icon;
}
let Zooming = false;
map.on('zoomstart', () => {
    Zooming = true;
});
map.on('zoomend', () => {
    Zooming = false;
});
function returnIntLevel2(int) {
    let intlevel;
    if (int < -0.5)
        intlevel = -1;
    else if (int < 0.5)
        intlevel = 0;
    else if (int < 1.5)
        intlevel = 1;
    else if (int < 2.5)
        intlevel = 2;
    else if (int < 3.5)
        intlevel = 3;
    else if (int < 4.5)
        intlevel = 4;
    else if (int < 5.0)
        intlevel = 5;
    else if (int < 5.5)
        intlevel = 6;
    else if (int < 6.0)
        intlevel = 7;
    else if (int < 6.5)
        intlevel = 8;
    else
        intlevel = 9;
    return intlevel;
}
function updateRealTimeQuake() {
    opacity05 = true;
    const backlist = [];
    for (const [index, point] of realtimepoints.entries()) {
        const location = NIEDrealTimePointLocation[index];
        if (point.int > -3) {
            if (!Zooming) {
                const icon = returnIntIcon(point.int);
                const offset = 1000 + point.int * 100;
                if (!point.marker) {
                    const marker = L.marker([location.y, location.x], { icon: icon, zIndexOffset: offset });
                    marker.addTo(map);
                    point.marker = marker;
                    realtimepoints.set(index, point);
                }
                else {
                    point.marker.setZIndexOffset(offset);
                    point.marker.setIcon(icon);
                }
            }
            if (point.detecting && !point.isineew) {
                const int2 = returnIntLevel2(point.int);
                const detectingmarker = L.marker([location.y, location.x], { icon: L.icon({ iconUrl: `ui/icons/detectback${int2 <= 0 ? 1 : int2 <= 4 ? 2 : int2 <= 6 ? 3 : 4}.svg`, className: "", iconAnchor: point.int >= -0.5 ? [35, 35] : [20, 20], iconSize: point.int >= -0.5 ? [70, 70] : [40, 40] }), zIndexOffset: 100 });
                detectingmarker.addTo(map);
                backlist.push(detectingmarker);
            }
            if (point.isfirstdetect) {
                const int2 = returnIntLevel2(point.int);
                const firstdetectmarker = L.marker([location.y, location.x], { icon: L.icon({ iconUrl: `ui/icons/detectcircle${int2 <= 2 ? 1 : int2 <= 4 ? 2 : int2 <= 6 ? 3 : 4}.svg`, className: "", iconAnchor: [100, 100], iconSize: [200, 200] }), zIndexOffset: 100 });
                firstdetectmarker.addTo(map);
                let count = 0;
                const intervalid = setInterval(() => {
                    if (count > 100) {
                        firstdetectmarker.remove();
                        //@ts-ignore
                        clearInterval(intervalid);
                    }
                    else {
                        firstdetectmarker.setOpacity(1 - count / 100);
                        count++;
                    }
                }, 2);
            }
        }
        else if (point.marker) {
            point.marker.remove();
            point.marker = undefined;
            realtimepoints.delete(index);
        }
    }
    setTimeout(() => {
        moveCamera();
    }, 5);
    setTimeout(() => {
        backlist.forEach(marker => {
            marker.remove();
        });
        opacity05 = false;
        halfSecond();
    }, 500);
}
function clicktypeicon(type) {
    DisplayType = type;
    changeDisplayType();
}
const quakeicon = document.getElementById('typepanelquake');
const realtimeicon = document.getElementById('typepanelrealtime');
const tsunamiicon = document.getElementById('typepaneltsunami');
const settingicon = document.getElementById('typepanelsetting');
if (quakeicon)
    quakeicon.onclick = () => { clicktypeicon(0); };
if (realtimeicon)
    realtimeicon.onclick = () => { clicktypeicon(1); };
if (tsunamiicon)
    tsunamiicon.onclick = () => { clicktypeicon(2); };
if (settingicon)
    settingicon.onclick = () => { clicktypeicon(3); };
window.addEventListener('resize', () => {
    movenowhover();
});
function movenowhover() {
    const typepanelnow = document.getElementById('typepanelnow');
    if (typepanelnow == null)
        return;
    const aspectRatio = window.innerWidth / window.innerHeight;
    const tops = [30, 80, 130, 180];
    const lefts = [17, 39, 61, 83];
    if (aspectRatio >= 4 / 3) {
        typepanelnow.style.top = `${tops[DisplayType]}px`;
        typepanelnow.style.left = `480px`;
    }
    else {
        typepanelnow.style.top = '';
        typepanelnow.style.bottom = `-33px`;
        typepanelnow.style.left = `${lefts[DisplayType]}%`;
    }
}
// RGBを補完する関数
function interpolateColor(value, breakpoints) {
    for (let i = 0; i < breakpoints.length - 1; i++) {
        const { value: v1, RGB: rgb1 } = breakpoints[i];
        const { value: v2, RGB: rgb2 } = breakpoints[i + 1];
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
    { value: -5, RGB: { r: 51, g: 43, b: 229 } },
    { value: 1, RGB: { r: 50, g: 224, b: 243 } },
    { value: 2, RGB: { r: 146, g: 237, b: 117 } },
    { value: 4, RGB: { r: 246, g: 60, b: 26 } },
    { value: 6, RGB: { r: 246, g: 60, b: 26 } },
    { value: 7, RGB: { r: 211, g: 69, b: 211 } },
    { value: 9, RGB: { r: 101, g: 40, b: 233 } },
    { value: 12, RGB: { r: 101, g: 40, b: 233 } },
];
const DepthGradientColor = [
    { value: 0, RGB: { r: 246, g: 60, b: 26 } },
    { value: 10, RGB: { r: 246, g: 60, b: 26 } },
    { value: 40, RGB: { r: 246, g: 60, b: 26 } },
    { value: 80, RGB: { r: 146, g: 237, b: 117 } },
    { value: 200, RGB: { r: 50, g: 224, b: 243 } },
    { value: 350, RGB: { r: 51, g: 43, b: 229 } },
    { value: 750, RGB: { r: 51, g: 43, b: 229 } },
];
const realtimequakeinfo = {
    maxInt: -100,
    regions: []
};
function reloadScrollPanel() {
    if (scrollpanel === null)
        return;
    const fragment = document.createDocumentFragment();
    let scrolllength = 0;
    const aspectRatio = window.innerWidth / window.innerHeight;
    //情報パネルの処理
    const isLandScapeScreen = aspectRatio >= 4 / 3; //横画面ならtrue
    if (DisplayType == 0) { //地震情報タブ
        for (const eqinfo of [...EQInfoMemory.values()].reverse()) {
            const eqpanel = document.createElement('img');
            eqpanel.src = `ui/scroll-panel/EQInfopanel${eqinfo.panelType}.svg`;
            eqpanel.style.width = '100%';
            eqpanel.style.top = `${scrolllength == 0 ? 0 : 5}px`;
            eqpanel.style.position = `relative`;
            const infotype = document.createElement('img');
            infotype.src = `ui/scroll-panel/pitype__${eqinfo.infoType}.svg`;
            infotype.style.width = '400px';
            infotype.style.top = `${scrolllength + 30}px`;
            infotype.style.left = `210px`;
            infotype.style.position = `absolute`;
            infotype.style.transform = 'translate(-50%, -50%)';
            const intp = document.createElement('img');
            intp.src = `ui/scroll-panel/paSc${eqinfo.maxInt == -1 ? 0 : eqinfo.maxInt}.svg`;
            intp.style.width = '460px';
            intp.style.top = `${scrolllength + 160}px`;
            intp.style.left = `210px`;
            intp.style.position = `absolute`;
            intp.style.transform = 'translate(-50%, -50%)';
            const intpaSs = document.createElement('img');
            intpaSs.src = `ui/scroll-panel/SndPanel__paSs.svg`;
            intpaSs.style.width = '350px';
            intpaSs.style.top = `${scrolllength + 155}px`;
            intpaSs.style.left = `180px`;
            intpaSs.style.position = `absolute`;
            intpaSs.style.transform = 'translate(-50%, -50%)';
            const intnint = document.createElement('img');
            intnint.src = `ui/icons/${eqinfo.maxInt}.svg`;
            intnint.style.width = '140px';
            intnint.style.top = `${scrolllength + 157}px`;
            intnint.style.left = `300px`;
            intnint.style.position = `absolute`;
            intnint.style.transform = 'translate(-50%, -50%)';
            const origintime = document.createElement('div');
            const BT = new Date(eqinfo.origintime);
            origintime.textContent = `${BT.getMonth() + 1}月 ${BT.getDate()}日 ${`0${BT.getHours()}`.slice(-2)}:${`0${BT.getMinutes()}`.slice(-2)}ごろ`;
            origintime.style.fontFamily = 'Akshar, sans-serif';
            origintime.style.top = `${scrolllength + 265}px`;
            origintime.style.left = `30px`;
            origintime.style.fontSize = `30px`;
            origintime.style.color = 'white';
            origintime.style.position = `absolute`;
            origintime.style.transform = 'translate(0%, -50%)';
            const tsunamip = document.createElement('img');
            tsunamip.src = `ui/scroll-panel/tsunamip__${eqinfo.tsunami}.svg`;
            tsunamip.style.width = '440px';
            tsunamip.style.top = `${scrolllength + (eqinfo.panelType == 0 ? 420 : 580)}px`;
            tsunamip.style.left = `210px`;
            tsunamip.style.position = `absolute`;
            tsunamip.style.transform = 'translate(-50%, -50%)';
            fragment.appendChild(eqpanel);
            fragment.appendChild(infotype);
            fragment.appendChild(intp);
            fragment.appendChild(intpaSs);
            fragment.appendChild(intnint);
            fragment.appendChild(origintime);
            fragment.appendChild(tsunamip);
            if (eqinfo.panelType > 0 && eqinfo.hypocenter) {
                const hypocentername = document.createElement('div');
                hypocentername.textContent = eqinfo.hypocenter.name;
                hypocentername.style.fontFamily = 'BIZ UDPGothic, sans-serif';
                hypocentername.style.top = `${scrolllength + 315}px`;
                hypocentername.style.left = `30px`;
                hypocentername.style.fontSize = `43px`;
                hypocentername.style.fontWeight = `bold`;
                hypocentername.style.color = 'white';
                hypocentername.style.position = `absolute`;
                hypocentername.style.transform = 'translate(0%, -50%)';
                const deji = document.createElement('div');
                deji.textContent = `で地震がありました`;
                deji.style.fontFamily = 'BIZ UDPGothic, sans-serif';
                deji.style.top = `${scrolllength + 355}px`;
                deji.style.left = `30px`;
                deji.style.fontSize = `20px`;
                deji.style.color = 'white';
                deji.style.position = `absolute`;
                deji.style.transform = 'translate(0%, -50%)';
                const magnitudep = document.createElement('div');
                magnitudep.style.top = `${scrolllength + 379}px`;
                magnitudep.style.left = `363px`;
                magnitudep.style.width = `31px`;
                magnitudep.style.height = `67px`;
                magnitudep.style.backgroundColor = interpolateColor(eqinfo.hypocenter.magnitude, MagnitudeGradientColor);
                magnitudep.style.position = `absolute`;
                const depthp = document.createElement('div');
                depthp.style.top = `${scrolllength + 463}px`;
                depthp.style.left = `363px`;
                depthp.style.width = `31px`;
                depthp.style.height = `56px`;
                depthp.style.backgroundColor = interpolateColor(eqinfo.hypocenter.depth, DepthGradientColor);
                depthp.style.position = `absolute`;
                const magnitudet = eqinfo.hypocenter.magnitude == 88 ? document.createElement('img') : document.createElement('div');
                if (eqinfo.hypocenter.magnitude == 88) {
                    //@ts-ignore
                    magnitudet.src = `ui/scroll-panel/M8+.svg`;
                    magnitudet.style.left = `28px`;
                    magnitudet.style.height = `150px`;
                }
                else {
                    magnitudet.textContent = `マグニチュード`;
                    magnitudet.style.fontFamily = 'BIZ UDPGothic, sans-serif';
                    magnitudet.style.fontSize = `30px`;
                    magnitudet.style.left = `30px`;
                }
                magnitudet.style.top = `${scrolllength + 410}px`;
                magnitudet.style.color = 'white';
                magnitudet.style.position = `absolute`;
                magnitudet.style.transform = 'translate(0%, -50%)';
                if (eqinfo.hypocenter.magnitude != 88) {
                    const magnitudet2 = document.createElement('div');
                    magnitudet2.textContent = `${eqinfo.hypocenter.magnitude}.0`.slice(0, 3);
                    magnitudet2.style.fontFamily = 'Akshar, sans-serif';
                    magnitudet2.style.top = `${scrolllength + 417}px`;
                    magnitudet2.style.left = `270px`;
                    magnitudet2.style.fontSize = `75px`;
                    magnitudet2.style.color = 'white';
                    magnitudet2.style.position = `absolute`;
                    magnitudet2.style.transform = 'translate(0%, -50%)';
                    fragment.appendChild(magnitudet2);
                }
                const deptht = document.createElement('div');
                deptht.textContent = eqinfo.hypocenter.depth == -1 ? '不明' : eqinfo.hypocenter.depth == 0 ? 'ごく浅い' : eqinfo.hypocenter.depth == 700 ? '700km以上' : `${eqinfo.hypocenter.depth}km`;
                const isBIZ = eqinfo.hypocenter.depth == -1 || eqinfo.hypocenter.depth == 0 || eqinfo.hypocenter.depth == 700;
                deptht.style.fontFamily = eqinfo.hypocenter.depth == -1 || eqinfo.hypocenter.depth == 0 ? 'BIZ UDPGothic' : 'Akshar, sans-serif';
                deptht.style.top = `${scrolllength + 495}px`;
                deptht.style.left = `340px`;
                deptht.style.width = `300px`;
                deptht.style.textAlign = 'right';
                deptht.style.fontSize = isBIZ ? '45px' : `60px`;
                deptht.style.color = 'white';
                deptht.style.position = `absolute`;
                deptht.style.transform = 'translate(-100%, -50%)';
                fragment.appendChild(hypocentername);
                fragment.appendChild(deji);
                fragment.appendChild(magnitudep);
                fragment.appendChild(magnitudet);
                fragment.appendChild(depthp);
                fragment.appendChild(deptht);
            }
        }
    }
    else if (DisplayType == 1) { //リアルタイムタブ
        for (const eew of [...EEWMem2.values()].reverse()) {
            const eewpanel = document.createElement('img');
            eewpanel.src = `ui/scroll-panel/paEEW${eew.isWarn ? 2 : 1}${eew.iskarihypo ? 3 : 1}.svg`;
            eewpanel.style.width = '100%';
            eewpanel.style.top = `${scrolllength == 0 ? 0 : 5}px`;
            eewpanel.style.position = `relative`;
            const serial = document.createElement('div');
            serial.textContent = `${eew.isfinal ? '最終' : '#' + `0${eew.serial}`.slice(-2)}`;
            serial.style.fontFamily = eew.isfinal ? 'BIZ UDPGothic, sans-serif' : 'Akshar, sans-serif';
            serial.style.top = `${scrolllength + (eew.isfinal ? 28 : 32)}px`;
            serial.style.left = `343px`;
            if (eew.isfinal)
                serial.style.fontWeight = 'bold';
            serial.style.fontSize = eew.isfinal ? `29px` : `36px`;
            serial.style.color = eew.isWarn ? '#fdffab' : '#191500';
            serial.style.position = `absolute`;
            serial.style.transform = 'translate(0%, -50%)';
            const hypocenter = document.createElement('div');
            hypocenter.textContent = eew.hypocenter;
            hypocenter.style.fontFamily = 'BIZ UDPGothic, sans-serif';
            hypocenter.style.top = `${scrolllength + 110}px`;
            hypocenter.style.left = `20px`;
            hypocenter.style.fontSize = `45px`;
            hypocenter.style.fontWeight = 'bold';
            hypocenter.style.color = 'white';
            hypocenter.style.position = `absolute`;
            hypocenter.style.transform = 'translate(0%, -50%)';
            const quaketext = document.createElement('div');
            quaketext.textContent = eew.iskarihypo ? 'で揺れ' : 'で地震';
            quaketext.style.fontFamily = 'BIZ UDPGothic, sans-serif';
            quaketext.style.top = eew.hypocenter.length <= 6 ? `${scrolllength + 120}px` : `${scrolllength + 160}px`;
            quaketext.style.left = eew.hypocenter.length <= 6 ? `${eew.hypocenter.length * 50 + 20}px` : `320px`;
            quaketext.style.fontSize = `25px`;
            quaketext.style.color = 'white';
            quaketext.style.position = `absolute`;
            quaketext.style.transform = 'translate(0%, -50%)';
            const begantime = document.createElement('div');
            const BT = new Date(eew.begantime);
            begantime.textContent = `${BT.getFullYear()}/${`0${BT.getMonth() + 1}`.slice(-2)}/${`0${BT.getDate()}`.slice(-2)} ${`0${BT.getHours()}`.slice(-2)}:${`0${BT.getMinutes()}`.slice(-2)}:${`0${BT.getSeconds()}`.slice(-2)}`;
            begantime.style.fontFamily = 'Akshar, sans-serif';
            begantime.style.top = `${scrolllength + 175}px`;
            begantime.style.left = `20px`;
            begantime.style.fontSize = `25px`;
            begantime.style.color = 'white';
            begantime.style.position = `absolute`;
            begantime.style.transform = 'translate(0%, -50%)';
            const begantimequaketext = document.createElement('div');
            begantimequaketext.textContent = eew.iskarihypo ? '検知' : '発生';
            begantimequaketext.style.fontFamily = 'BIZ UDPGothic, sans-serif';
            begantimequaketext.style.top = `${scrolllength + 175}px`;
            begantimequaketext.style.left = `220px`;
            begantimequaketext.style.fontSize = `20px`;
            begantimequaketext.style.color = 'white';
            begantimequaketext.style.position = `absolute`;
            begantimequaketext.style.transform = 'translate(0%, -50%)';
            const intp = document.createElement('img');
            intp.src = `ui/scroll-panel/paSc${eew.maxInt == -1 ? 0 : eew.maxInt}.svg`;
            intp.style.width = '460px';
            intp.style.top = `${scrolllength + 285}px`;
            intp.style.left = `210px`;
            intp.style.position = `absolute`;
            intp.style.transform = 'translate(-50%, -50%)';
            const intntext = document.createElement('img');
            intntext.src = eew.isDeep ? `ui/scroll-panel/sndhs.svg` : eew.isOnepoint ? `ui/scroll-panel/sndht.svg` : eew.maxInt == -1 ? `ui/scroll-panel/sndhn.svg` : `ui/scroll-panel/paSu.svg`;
            intntext.style.width = '410px';
            intntext.style.top = `${scrolllength + 285}px`;
            intntext.style.left = `210px`;
            intntext.style.position = `absolute`;
            if (!eew.isOnepoint && !eew.isDeep && eew.maxInt >= 2 && eew.maxInt <= 4)
                intntext.style.filter = 'brightness(0)';
            intntext.style.transform = 'translate(-50%, -50%)';
            const description = document.createElement('img');
            description.src = eew.isWarn && eew.maxInt >= 7 ? `ui/scroll-panel/eewdescription_specialwarn.svg` : eew.isWarn ? `ui/scroll-panel/eewdescription_warn.svg` : eew.isDeep ? `ui/scroll-panel/eewdescription_deep.svg` : eew.isLevel ? `ui/scroll-panel/eewdescription_level.svg` : eew.isPLUM ? `ui/scroll-panel/eewdescription_plum.svg` : eew.isOnepoint ? `ui/scroll-panel/eewdescription_onepoint.svg` : `ui/scroll-panel/eewdescription_forecast.svg`;
            description.style.width = '380px';
            description.style.top = `${scrolllength + (eew.iskarihypo ? 300 : 600)}px`;
            description.style.left = `210px`;
            description.style.position = `absolute`;
            description.style.transform = 'translate(-50%, -50%)';
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
                intnint.style.top = `${scrolllength + 285}px`;
                intnint.style.left = `300px`;
                intnint.style.position = `absolute`;
                intnint.style.transform = 'translate(-50%, -50%)';
                fragment.appendChild(intnint);
            }
            if (!eew.iskarihypo) {
                const magnitudetext = document.createElement('div');
                magnitudetext.textContent = `${eew.magnitude}.0`.slice(0, 3);
                magnitudetext.style.fontFamily = 'Akshar, sans-serif';
                magnitudetext.style.top = `${scrolllength + 425}px`;
                magnitudetext.style.left = `250px`;
                magnitudetext.style.fontSize = `80px`;
                magnitudetext.style.color = 'white';
                magnitudetext.style.position = `absolute`;
                magnitudetext.style.transform = 'translate(0%, -50%)';
                const magnitudep = document.createElement('div');
                magnitudep.style.top = `${scrolllength + 420}px`;
                magnitudep.style.left = `363px`;
                magnitudep.style.width = `31px`;
                magnitudep.style.height = `76px`;
                magnitudep.style.backgroundColor = interpolateColor(eew.magnitude, MagnitudeGradientColor);
                magnitudep.style.position = `absolute`;
                magnitudep.style.transform = 'translate(0%, -50%)';
                const depthtext = document.createElement('div');
                depthtext.textContent = `${eew.depth}km`;
                depthtext.style.fontFamily = 'Akshar, sans-serif';
                depthtext.style.top = `${scrolllength + 515}px`;
                depthtext.style.left = eew.depth >= 100 ? '200px' : `220px`;
                depthtext.style.fontSize = `60px`;
                depthtext.style.color = 'white';
                depthtext.style.position = `absolute`;
                depthtext.style.transform = 'translate(0%, -50%)';
                const depthp = document.createElement('div');
                depthp.style.top = `${scrolllength + 510}px`;
                depthp.style.left = `363px`;
                depthp.style.width = `31px`;
                depthp.style.height = `60px`;
                depthp.style.backgroundColor = interpolateColor(eew.depth, DepthGradientColor);
                depthp.style.position = `absolute`;
                depthp.style.transform = 'translate(0%, -50%)';
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
                cancelpanel.style.top = `${scrolllength}px`;
                cancelpanel.style.position = `absolute`;
                fragment.appendChild(cancelpanel);
            }
            scrolllength += 663; //eewpanel.offsetHeight+10
        }
        if (realtimequakeinfo.maxInt != -100) {
            const realtimequakepanel = document.createElement('img');
            realtimequakepanel.src = 'ui/scroll-panel/DetectPanel.svg';
            realtimequakepanel.style.width = '100%';
            realtimequakepanel.style.top = '10px';
            realtimequakepanel.style.position = `relative`;
            const realtimequakeintp = document.createElement('img');
            realtimequakeintp.src = `ui/scroll-panel/paSm${realtimequakeinfo.maxInt}.svg`;
            realtimequakeintp.style.width = '220px';
            //console.log(scrolllength)
            realtimequakeintp.style.top = `${scrolllength + 150}px`;
            realtimequakeintp.style.left = `325px`;
            realtimequakeintp.style.position = `absolute`;
            realtimequakeintp.style.transform = 'translate(-50%, -50%)';
            const realtimequakeintn = document.createElement('img');
            realtimequakeintn.src = `ui/icons/${realtimequakeinfo.maxInt}.svg`;
            realtimequakeintn.style.width = '140px';
            realtimequakeintn.style.top = `${scrolllength + 150}px`;
            realtimequakeintn.style.left = `325px`;
            realtimequakeintn.style.position = `absolute`;
            realtimequakeintn.style.transform = 'translate(-50%, -50%)';
            fragment.appendChild(realtimequakepanel);
            fragment.appendChild(realtimequakeintp);
            fragment.appendChild(realtimequakeintn);
            scrolllength += 250;
            for (let i = 0; i < Math.min(realtimequakeinfo.regions.length, 22); i++) {
                const region = realtimequakeinfo.regions[i];
                const realtimequakeregionicon = document.createElement('img');
                realtimequakeregionicon.src = `ui/icons/squareint${region.int}.svg`;
                realtimequakeregionicon.style.width = '60px';
                realtimequakeregionicon.style.top = `${scrolllength}px`;
                realtimequakeregionicon.style.left = `40px`;
                realtimequakeregionicon.style.position = `absolute`;
                realtimequakeregionicon.style.transform = 'translate(-50%, -50%)';
                const realtimequakeregionname = document.createElement('div');
                realtimequakeregionname.textContent = region.name;
                realtimequakeregionname.style.fontFamily = 'BIZ UDPGothic, sans-serif';
                realtimequakeregionname.style.top = `${scrolllength}px`;
                realtimequakeregionname.style.left = `80px`;
                realtimequakeregionname.style.fontSize = `30px`;
                realtimequakeregionname.style.color = `white`;
                realtimequakeregionname.style.position = `absolute`;
                realtimequakeregionname.style.transform = 'translate(0%, -50%)';
                fragment.appendChild(realtimequakeregionicon);
                fragment.appendChild(realtimequakeregionname);
                scrolllength += 60;
            }
        }
    }
    else if (DisplayType == 3) { //設定
        const settingbackpanel1 = document.createElement('div');
        settingbackpanel1.style.top = `${scrolllength + 3}px`;
        settingbackpanel1.style.left = `3px`;
        settingbackpanel1.style.height = `500px`;
        settingbackpanel1.style.borderRadius = `25px`;
        settingbackpanel1.style.backgroundColor = '#1d2a41';
        settingbackpanel1.style.position = `relative`;
        fragment.appendChild(settingbackpanel1);
    }
    requestAnimationFrame(() => {
        scrollpanel.innerHTML = ''; // 初期化
        scrollpanel.appendChild(fragment); // 一括追加
    });
}
const scrollpanel = document.getElementById('scroll-panel');
function changeDisplayType() {
    movenowhover();
    const iconnames = ['quake', 'realtime', 'tsunami', 'setting'];
    for (const iconname of iconnames) {
        const typepanelicon = document.getElementById(`typepanel${iconname}`);
        if (typepanelicon == null)
            return;
        if (iconname == iconnames[DisplayType])
            typepanelicon.style.filter = 'brightness(1)';
        else
            typepanelicon.style.filter = "";
    }
    updateRealTimeQuake();
    ExpressRegionMap();
    reloadScrollPanel();
}
function moveCamera() {
    const pointlist = [];
    const regionpointlist = [];
    const addbounds = [];
    if (DisplayType == 0) { //地震情報タブ
        const memory = EQInfoMemory.get(currentDisplayEQInfoID);
        if (memory) {
            if (memory.hypocenter)
                pointlist.push(new L.LatLng(memory.hypocenter.latitude, memory.hypocenter.longitude));
            const rmaxInt = memory.maxInt >= 7 ? 4 : memory.maxInt >= 5 ? 3 : memory.maxInt >= 4 ? 2 : 1;
            regionpointlist.push(...Object.keys(regionmapmarkers).filter(m => { var _a; return regionmapmarkers[m].visible && (((_a = memory.regions.find(r => r.name == m)) === null || _a === void 0 ? void 0 : _a.int) || 0) >= rmaxInt; }).flatMap(region => {
                const loc = regionmapData[regiontable[region]].location;
                return [
                    new L.LatLng(loc[0][0], (loc[0][1] + loc[1][1]) / 2),
                    new L.LatLng(loc[1][0], (loc[0][1] + loc[1][1]) / 2)
                ];
            }));
        }
    }
    else if (DisplayType == 1) { //リアルタイムタブ
        const eews = Array.from(EEWMem2.values());
        const hypocenters = eews.map(eew => eew.hypocentermarker.getLatLng());
        regionpointlist.push(...Object.keys(regionmapmarkers).filter(m => regionmapmarkers[m].visible).flatMap(region => {
            const loc = regionmapData[regiontable[region]].location;
            return [
                new L.LatLng(loc[0][0], (loc[0][1] + loc[1][1]) / 2),
                new L.LatLng(loc[1][0], (loc[0][1] + loc[1][1]) / 2)
            ];
        }));
        //console.log(addbounds)
        if (addbounds.length = 0) {
            addbounds.push(...eews.filter(eew => currenttime - eew.begantime < 90 * 1000).map(eew => eew.forecastcircle.Pwave.getBounds()));
            addbounds.push(...eews.filter(eew => currenttime - eew.begantime < 90 * 1000).map(eew => eew.forecastcircle.Swave.getBounds()));
        }
        pointlist.push(...hypocenters);
        const detectedpoints = Array.from(realtimepoints.values()).filter(point => point.detecting && point.marker != undefined).map(point => { var _a; return (_a = point.marker) === null || _a === void 0 ? void 0 : _a.getLatLng(); }).filter(latlng => latlng != undefined);
        pointlist.push(...detectedpoints);
        //console.log(detectedpoints.length)
    }
    pointlist.push(...regionpointlist);
    if (pointlist.length > 0 || addbounds.length > 0) {
        const bounds = L.latLngBounds(pointlist);
        addbounds.forEach(b => {
            bounds.extend(b);
        });
        map.fitBounds(bounds, {
            padding: [100, 100],
            maxZoom: 9,
            duration: 2, // アニメーションの時間(秒)
            easeLinearity: 0.01, // 動きの滑らかさ
        });
    }
}
const EEWMem2 = new Map();
let detectedquakemarkers = {};
const EEWregionmapmemory = {};
function halfSecond() {
    for (const mem2 of EEWMem2.values()) {
        if (!mem2.Cancel)
            mem2.hypocentermarker.setOpacity(opacity05 ? (DisplayType == 2 ? 0 : DisplayType == 0 ? 0.5 : 1) : 0);
    }
    for (const quake of Object.values(detectedquakemarkers)) {
        //quake.hypocenter.setStyle({opacity: (opacity05 ? 1 : 0.2)})
        quake.hypocenter.setStyle({ opacity: quake.opacity * (opacity05 ? 1 : 0.2), fillOpacity: quake.opacity * (opacity05 ? 1 : 0.2) });
        quake.pwave.setStyle({ opacity: quake.opacity * (opacity05 ? 1 : 0.2) });
        quake.swave.setStyle({ opacity: quake.opacity * (opacity05 ? 1 : 0.2) });
    }
}
function ConnectToServer() {
    socket = new WebSocket('ws://61.27.11.129:3547');
    socket.onopen = () => {
        console.log('接続完了');
    };
    socket.onclose = () => {
        ConnectToServer();
    };
    //サーバーからの指示
    socket.onmessage = (event) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        const data = JSON.parse(event.data);
        if (data.type == 'read')
            Speak(data.text, data.isforce, data.isStack);
        else if (data.type == 'sound')
            new Audio(data.path).play();
        else if (data.type == 'realtimequake') {
            currenttime = data.time;
            for (const point of data.data) {
                realtimepoints.set(point.ind, { int: point.int, marker: (_a = realtimepoints.get(point.ind)) === null || _a === void 0 ? void 0 : _a.marker, isfirstdetect: point.isfirstdetect, detecting: point.detecting, isineew: point.isineew });
            }
            realtimequakeinfo.maxInt = data.maxInt;
            realtimequakeinfo.regions = data.regions;
            updateTime(true);
            updateRealTimeQuake();
            halfSecond();
            reloadScrollPanel();
        }
        else if (data.type == 'realtimehypocenter') {
            for (const quake of data.data) {
                const marker = detectedquakemarkers[quake.index];
                const maxint = returnIntLevel2(quake.maxint);
                const color = maxint >= 7 ? '#a00066' : maxint >= 5 ? '#ff0000' : maxint >= 1 ? '#ffde00' : '#73ff00';
                const radius = wavedistance(currenttime - quake.begantime, quake.depth);
                if (!(marker === null || marker === void 0 ? void 0 : marker.hypocenter)) {
                    const newhypocenter = L.circleMarker([quake.latitude, quake.longitude], {
                        radius: 3,
                        color: color,
                        fillColor: color,
                        fillOpacity: 1
                    }).addTo(map);
                    const newpwave = L.circle([quake.latitude, quake.longitude], {
                        radius: Math.max(0, radius.p) * 1000,
                        color: color, // 円の外枠の色
                        fillOpacity: 0, // 塗りつぶしを無効化
                        weight: 3
                    }).addTo(map);
                    const newswave = L.circle([quake.latitude, quake.longitude], {
                        radius: Math.max(0, radius.s) * 1000,
                        color: color, // 円の外枠の色
                        fillOpacity: 0, // 塗りつぶしを無効化
                        weight: 3
                    }).addTo(map);
                    //console.log(wavedistance('p', data.begantime, data.depth)??0)
                    detectedquakemarkers[quake.index] = { hypocenter: newhypocenter, pwave: newpwave, swave: newswave, opacity: quake.opacity, begantime: quake.begantime, depth: quake.depth };
                    //console.log({hypocenter: newhypocenter, pwave: newpwave, swave: newswave, opacity: data.opacity, begantime: data.begantime, depth: data.depth})
                    newpwave.bringToFront();
                    newswave.bringToFront();
                }
                else {
                    marker.hypocenter.setLatLng([quake.latitude, quake.longitude]);
                    marker.pwave.setLatLng([quake.latitude, quake.longitude]);
                    marker.swave.setLatLng([quake.latitude, quake.longitude]);
                    marker.pwave.setRadius(Math.max(0, radius.p) * 1000);
                    marker.swave.setRadius(Math.max(0, radius.s) * 1000);
                    marker.hypocenter.setStyle({ color, opacity: quake.opacity });
                    marker.pwave.setStyle({ color });
                    marker.swave.setStyle({ color });
                    marker.pwave.bringToFront();
                    marker.swave.bringToFront();
                    detectedquakemarkers[quake.index].opacity = quake.opacity;
                    detectedquakemarkers[quake.index].begantime = quake.begantime;
                    detectedquakemarkers[quake.index].depth = quake.depth;
                }
            }
            for (const key in detectedquakemarkers) {
                if (!data.data.some(d => String(d.index) == key)) {
                    const value = detectedquakemarkers[key];
                    value.hypocenter.remove();
                    value.pwave.remove();
                    value.swave.remove();
                    delete detectedquakemarkers[key]; // キーを削除
                }
            }
        }
        else if (data.type == 'eewinfo')
            EEW(data);
        else if (data.type == 'eqinfo')
            EQInfo(data);
    });
}
function EEW(data) {
    if (data.Delete) {
        const mem2 = EEWMem2.get(data.EventID);
        mem2 === null || mem2 === void 0 ? void 0 : mem2.hypocentermarker.remove();
        mem2 === null || mem2 === void 0 ? void 0 : mem2.forecastcircle.Pwave.remove();
        mem2 === null || mem2 === void 0 ? void 0 : mem2.forecastcircle.Swave.remove();
        delete EEWregionmapmemory[data.EventID];
        EEWMem2.delete(data.EventID);
        setTimeout(() => {
            reloadScrollPanel();
            ExpressRegionMap();
        });
        return;
    }
    else if (data.Cancel) {
        const mem2 = EEWMem2.get(data.EventID);
        if (!mem2)
            return;
        mem2.forecastcircle.Pwave.remove();
        mem2.forecastcircle.Swave.remove();
        mem2.hypocentermarker.setOpacity(0.85);
        mem2.hypocentermarker.setIcon(L.icon({ iconUrl: `ui/icons/hypocenter_RT2${data.assumedepicenter ? '_assumed.svg' : ''}.svg`, className: "", iconAnchor: [50, 50], iconSize: [100, 100] }));
        mem2.Cancel = true;
        EEWMem2.set(data.EventID, mem2);
        delete EEWregionmapmemory[data.EventID];
        //console.log(mem2)
        setTimeout(() => {
            mem2 === null || mem2 === void 0 ? void 0 : mem2.hypocentermarker.remove();
            EEWMem2.delete(data.EventID);
            setTimeout(() => {
                reloadScrollPanel();
            });
        }, 10 * 1000);
        return;
    }
    const mem2 = EEWMem2.get(data.EventID);
    const color = interpolateColor(data.magnitude, MagnitudeGradientColor);
    const radius = wavedistance(currenttime - data.begantime, data.hypocenter.Depth);
    const hypocenterIcon = L.icon({ iconUrl: `ui/icons/hypocenter_RT1${data.assumedepicenter ? '_assumed.svg' : ''}.svg`, className: "", iconAnchor: [50, 50], iconSize: [100, 100] });
    const hypocentermarker = mem2 ? mem2.hypocentermarker : L.marker([data.hypocenter.y, data.hypocenter.x], { icon: hypocenterIcon });
    const hypocenterdeepmarker = mem2 ? mem2.hypocenterdeepmarker : L.svg();
    //const svg = d3.select(map.getPanes().overlayPane).select('svg');
    if (radius.s < 0) {
        hypocenterdeepmarker.addTo(map);
        // 進捗率を角度に変換 (時計回り)
        const startAngle = 0; // 開始角度
        const endAngle = radius.s * (-1) * 3.6 * (Math.PI / 180); // 終了角度 (度をラジアンに変換)
        // 円弧パスデータ生成
        //const x1 = data.hypocenter.x + 100 * Math.cos(startAngle);
        //const y1 = data.hypocenter.y - 100 * Math.sin(startAngle);
        //const x2 = data.hypocenter.x + 100 * Math.cos(endAngle);
        //const y2 = data.hypocenter.y - 100 * Math.sin(endAngle);
        //
        //const largeArcFlag = radius.s*(-1) > 50 ? 1 : 0;
        //const pathData = `
        //  M ${data.hypocenter.x} ${data.hypocenter.y} 
        //  L ${x1} ${y1} 
        //  A 100 100 0 ${largeArcFlag} 1 ${x2} ${y2} 
        //  Z
        //`;
        // パスを更新
        //svg.selectAll('path').remove();
        //svg.append('path')
        //  .attr('d', pathData)
        //  .style('fill', 'blue')
        //  .style('opacity', 0.7);
    }
    else
        hypocenterdeepmarker.remove();
    const P_forecastcircle = mem2 ? mem2.forecastcircle.Pwave : L.circle([data.hypocenter.y, data.hypocenter.x], {
        radius: Math.max(0, radius.p) * 1000, // 円の半径(m)
        color: 'gray', // 円の外枠の色
        fillOpacity: 0, // 塗りつぶしを無効化
        weight: 2 // 外枠の太さ
    });
    const S_forecastcircle = mem2 ? mem2.forecastcircle.Swave : L.circle([data.hypocenter.y, data.hypocenter.x], {
        radius: Math.max(0, radius.s) * 1000, // 円の半径(m)
        color: color, // 円の外枠の色
        fillOpacity: 0.05,
        fillColor: color,
        weight: 5 // 外枠の太さ,
    });
    if (!mem2) { //初めて処理
        //予報円の処理
        hypocentermarker.setOpacity(opacity05 ? (DisplayType == 2 ? 0 : DisplayType == 0 ? 0.5 : 1) : 0);
        hypocentermarker.addTo(map);
        P_forecastcircle.addTo(map);
        S_forecastcircle.addTo(map);
        P_forecastcircle.bringToFront();
        S_forecastcircle.bringToFront();
        hypocentermarker.setZIndexOffset(100000);
    }
    else {
        hypocentermarker.setLatLng([data.hypocenter.y, data.hypocenter.x]);
        P_forecastcircle.setLatLng([data.hypocenter.y, data.hypocenter.x]);
        S_forecastcircle.setLatLng([data.hypocenter.y, data.hypocenter.x]);
        P_forecastcircle.setRadius(Math.max(0, radius.p) * 1000);
        S_forecastcircle.setRadius(Math.max(0, radius.s) * 1000);
        S_forecastcircle.setStyle({ fillColor: color, color });
        P_forecastcircle.bringToFront();
        S_forecastcircle.bringToFront();
        hypocentermarker.setZIndexOffset(100000);
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
    });
    EEWregionmapmemory[data.EventID] = data.regionmap;
    setTimeout(() => {
        reloadScrollPanel();
        ExpressRegionMap();
    }, 5);
    setTimeout(() => {
        moveCamera();
    }, 100);
}
const EQInfoMemory = new Map();
function EQInfo(data) {
    EQInfoMemory.set(data.EventID, Object.assign({}, data));
    currentDisplayEQInfoID = data.EventID;
    setTimeout(() => {
        reloadScrollPanel();
        ExpressRegionMap();
    }, 5);
}
const regionmapmarkers = {};
const intcolor = [
    '#686870',
    '#3098bd',
    '#4cd0a7',
    '#f6cb51',
    '#ff9939',
    '#e52a18',
    '#c31b1b',
    '#a30a6b',
    '#86046e',
    '#54068e'
];
const regionMapSVGCache = new Map();
let EEWMaxInt = 0;
let EQInfoHypocenterMarker = L.marker([0, 0], { icon: L.icon({ iconUrl: `ui/icons/hypocenter_EQ1.svg`, className: "", iconAnchor: [50, 50], iconSize: [100, 100] }), zIndexOffset: 5000, opacity: 0 });
EQInfoHypocenterMarker.addTo(map);
function ExpressRegionMap() {
    return __awaiter(this, arguments, void 0, function* (firstload = false) {
        var _a, _b, _c;
        if (DisplayType != 0)
            EQInfoHypocenterMarker.setOpacity(0);
        if (DisplayType == 1 || firstload) {
            EEWMaxInt = 0;
            const mergedregionmap = Object.values(EEWregionmapmemory).reduce((result, currentObj) => {
                for (const key in currentObj) {
                    if (!result[key] || currentObj[key] > result[key]) {
                        result[key] = currentObj[key]; // 最大値を設定
                    }
                }
                return result;
            }, {});
            for (const regionname in firstload ? regiontable : mergedregionmap) {
                //console.log(regionname)
                const mem = (_a = regionmapmarkers[regionname]) === null || _a === void 0 ? void 0 : _a.OverLay;
                const editmap = (svgText) => {
                    const ind = Number(regiontable[regionname]);
                    const rd = regionmapData[ind];
                    const svgData = svgText.replace(/"#ff0000"/g, `"${intcolor[firstload ? 0 : mergedregionmap[regionname]]}"`);
                    const svgBlob = new Blob([svgData], { type: "image/svg+xml" });
                    const svgUrl = URL.createObjectURL(svgBlob);
                    const regionmarker = mem !== null && mem !== void 0 ? mem : L.imageOverlay(svgUrl, rd.location, { zIndex: 1 });
                    regionmarker.setOpacity(firstload ? 0 : 1);
                    if (mem)
                        mem.setUrl(svgUrl);
                    else
                        regionmarker.addTo(map);
                    regionmapmarkers[regionname] = { OverLay: regionmarker, visible: !firstload };
                    if (EEWMaxInt < mergedregionmap[regionname])
                        EEWMaxInt = mergedregionmap[regionname];
                };
                if (firstload)
                    fetch(`maps/regionmap/${regionname}.svg`)
                        .then(response => response.text())
                        .then(svgText => {
                        regionMapSVGCache.set(regionname, svgText);
                        editmap(svgText);
                    });
                else {
                    const svgText = regionMapSVGCache.get(regionname);
                    if (svgText)
                        editmap(svgText);
                }
            }
            const activeregions = Object.keys(mergedregionmap).filter(m => regionmapmarkers[m].visible);
            for (const regionname of Object.keys(regionmapmarkers).filter(r => regionmapmarkers[r].visible && !activeregions.includes(r))) {
                regionmapmarkers[regionname].visible = false;
                regionmapmarkers[regionname].OverLay.setOpacity(0);
                (_b = regionmapmarkers[regionname].icon) === null || _b === void 0 ? void 0 : _b.setOpacity(0);
            }
        }
        else if (DisplayType == 0) {
            const EM = EQInfoMemory.get(currentDisplayEQInfoID);
            const EQInforegionmap = EM === null || EM === void 0 ? void 0 : EM.regions.sort((a, b) => b.int - a.int);
            if (!EQInforegionmap)
                return;
            for (const { name: regionname, int } of EQInforegionmap) {
                const memory = regionmapmarkers[regionname];
                const editmap = (svgText) => {
                    var _a, _b;
                    const ind = Number(regiontable[regionname]);
                    const rd = regionmapData[ind];
                    const svgData = svgText.replace(/"#ff0000"/g, `"${intcolor[int]}"`);
                    const svgBlob = new Blob([svgData], { type: "image/svg+xml" });
                    const svgUrl = URL.createObjectURL(svgBlob);
                    const regionOverLay = (_a = memory.OverLay) !== null && _a !== void 0 ? _a : L.imageOverlay(svgUrl, rd.location, { zIndex: 1 });
                    const icon = L.icon({ iconUrl: `ui/icons/AreaIntIcon__${int}.svg`, className: "", iconAnchor: [50, 50], iconSize: [100, 100] });
                    const regionIcon = (_b = memory.icon) !== null && _b !== void 0 ? _b : L.marker([(rd.location[0][0] + rd.location[1][0]) / 2, (rd.location[0][1] + rd.location[1][1]) / 2], { icon: icon });
                    regionOverLay.setOpacity(1);
                    regionIcon.setOpacity(1);
                    if (memory)
                        regionOverLay.setUrl(svgUrl);
                    else
                        regionOverLay.addTo(map);
                    if (memory.icon)
                        regionIcon.setIcon(icon);
                    else
                        regionIcon.addTo(map);
                    regionmapmarkers[regionname] = { OverLay: regionOverLay, icon: regionIcon, visible: true };
                };
                const svgText = regionMapSVGCache.get(regionname);
                if (svgText)
                    editmap(svgText);
            }
            const activeregions = EQInforegionmap.filter(m => regionmapmarkers[m.name].visible);
            for (const regionname of Object.keys(regionmapmarkers).filter(r => regionmapmarkers[r].visible && !activeregions.some(a => a.name == r))) {
                regionmapmarkers[regionname].visible = false;
                regionmapmarkers[regionname].OverLay.setOpacity(0);
                (_c = regionmapmarkers[regionname].icon) === null || _c === void 0 ? void 0 : _c.setOpacity(0);
            }
            if (EM === null || EM === void 0 ? void 0 : EM.hypocenter) {
                EQInfoHypocenterMarker.setLatLng([EM.hypocenter.latitude, EM.hypocenter.longitude]);
                EQInfoHypocenterMarker.setOpacity(1);
            }
            else
                EQInfoHypocenterMarker.setOpacity(0);
        }
        const intLegend = document.getElementById('IntLegend');
        if (intLegend) {
            if (DisplayType == 1 && EEWMaxInt > 0) {
                intLegend.src = `ui/scp${EEWMaxInt}.svg`;
                intLegend.style.opacity = "1";
            }
            else
                intLegend.style.opacity = "0";
        }
    });
}
updateRealTimeQuake();
changeDisplayType();
ConnectToServer();
ExpressRegionMap(true);
function wavedistance(time, depth) {
    const returnvalue = { p: 0, s: 0 };
    const startind = (Math.round(Math.min(50, depth) / 2) + Math.round(Math.min(200, Math.max(0, depth - 50)) / 5) + Math.round(Math.max(0, depth - 200) / 10)) * 236;
    if (soujitable[startind].soujiP > time / 1000)
        returnvalue.p = -100 * (time / 1000) / soujitable[startind].soujiP;
    if (soujitable[startind].soujiS > time / 1000)
        returnvalue.s = -100 * (time / 1000) / soujitable[startind].soujiS;
    //console.log(returnvalue)
    if (returnvalue.p == 0 || returnvalue.s == 0) {
        for (let i = startind; i < startind + 236; i++) {
            const souji1 = soujitable[i];
            if (returnvalue.s == 0 && souji1.soujiS * 1000 >= time) {
                const souji2 = soujitable[i + 1];
                returnvalue.s = souji1.distance + (time / 1000 - souji1.soujiS) / (souji2.soujiS - souji1.soujiS) * (souji2.distance - souji1.distance);
                if (returnvalue.p != 0)
                    break;
            }
            if (returnvalue.p == 0 && souji1.soujiP * 1000 >= time) {
                const souji2 = soujitable[i + 1];
                returnvalue.p = souji1.distance + (time / 1000 - souji1.soujiP) / (souji2.soujiP - souji1.soujiP) * (souji2.distance - souji1.distance);
                break;
            }
        }
    }
    //console.log(returnvalue)
    return returnvalue;
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
        if (mem2.Cancel)
            continue;
        const P = mem2.forecastcircle.Pwave;
        const S = mem2.forecastcircle.Swave;
        const radius = wavedistance(currenttime - mem2.begantime, mem2.depth);
        P.setRadius(radius.p > 0 ? radius.p * 1000 : 0);
        S.setRadius(radius.s > 0 ? radius.s * 1000 : 0);
        if (radius.p > 0)
            P.setStyle({ opacity: 1 });
        else
            P.setStyle({ opacity: 0 });
        if (radius.s > 0)
            S.setStyle({ opacity: 1 });
        else
            S.setStyle({ opacity: 0 });
        S.bringToFront();
        const hypocenterdeepmarker = mem2.hypocenterdeepmarker;
        if (radius.s < 0) {
            //console.log(radius.s*(-1))
            hypocenterdeepmarker.addTo(map);
            const rad = 50;
            const center = map.latLngToLayerPoint([mem2.latitude, mem2.longitude]);
            const startAngle = 0; // 円弧の開始角度 (度)
            const percentage = -1 * radius.s; // 表示する円の割合 (%)
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
            //const svg = d3.select(map.getPanes().overlayPane).select('svg');
            //svg.selectAll('path').remove();
            //svg.append('path')
            //  .attr('d', pathData)
            //  .style('fill', 'blue')
            //  .style('opacity', 0.7);
        }
        else
            hypocenterdeepmarker.remove();
        //console.log(`${currenttime}, ${mem2.begantime}, ${currenttime - mem2.begantime}`)
    }
    for (const quake of Object.values(detectedquakemarkers)) {
        const P = quake.pwave;
        const S = quake.swave;
        //console.log(`${currenttime}, ${quake.begantime}, ${quake.depth}`)
        const radius = wavedistance(currenttime - quake.begantime, quake.depth);
        P.setRadius(Math.max(0, radius.p) * 1000);
        S.setRadius(Math.max(0, radius.s) * 1000);
        S.bringToFront();
    }
}
setInterval(() => {
    growForecastCircle();
    currenttime += 10;
}, 10);
setInterval(() => {
    if (isSpeakOperating)
        setTimeout(() => {
            isSpeakOperating = false;
        }, 1000);
}, 10000);
