//@ts-check
const WebSocket = require('ws');
const { IntcolorList, NIEDRTPL_AdjustmentList, NIEDrealTimePointLocation, regions, hypocenterNames, hypocenterReadingNames } = require('./data.js');
const Jimp = require('jimp');
const { ReplayIntData } = require('./ReplayIntData.js');
const { EEWTest } = require('./EEW.js');

const isReplay = true;
/**@type {import("./index.d.js").Timestamp} */
const replayTime = '2025-01-13T21:19:30+0900'
let replayTimeRunning = new Date(replayTime);

const server = new WebSocket.Server({ port: 8080 });

server.on('connection', (socket) => {
    console.log('クライアントが接続しました');
});

/**
 * 
 * @param {import('./index.d.js').ServerData} data 
 */
function sendData(data) {
    //console.log(JSON.stringify(data))
    server.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) client.send(JSON.stringify(data))
    })
}

/**
 * 
 * @param {Date} [day]
 */
function RealTimeQuake(day) {
    if (isReplay) {
        const RealTimeIntObj = []
        for (let index = 0; index < NIEDrealTimePointLocation.length; index++) {
            //console.log(index)
            const IntData = ReplayIntData[index]
            if (IntData == undefined) RealTimeIntObj.push({ind: index, int: -3});
            else {
                let success = false;
                for (const data of IntData) {
                    if (data.Time == replayTimeRunning.getTime()) {
                        //console.log(IntData)
                        RealTimeIntObj.push({ind: index, int: data.Intensity})
                        success = true;
                        //console.log(IntData.Intensity)
                        break;
                    }
                }
                if (!success) RealTimeIntObj.push({ind: index, int: -3});
            }
        }
        sendData({type: 'realtimequake', data: RealTimeIntObj, time: replayTimeRunning.getTime()})
    }
    else {// 画像を読み込む
        const now = day || (new Date(Date.now()-2500))
        Jimp.Jimp.read(`http://www.kmoni.bosai.go.jp/data/map_img/RealTimeImg/jma_s/${now.getFullYear()}${`00${now.getMonth()+1}`.slice(-2)}${`00${now.getDate()}`.slice(-2)}/${now.getFullYear()}${`00${now.getMonth()+1}`.slice(-2)}${`00${now.getDate()}`.slice(-2)}${`00${now.getHours()}`.slice(-2)}${`00${now.getMinutes()}`.slice(-2)}${`00${now.getSeconds()}`.slice(-2)}.jma_s.gif`)
        //Jimp.read(`20250120195208.jma_s.gif`)
        .then(image => {
            // ここで画像の処理を行う
            const RealTimeIntObj = []

            for (let index = 0; index < NIEDrealTimePointLocation.length; index++) {
              // 座標(x, y)の色を取得
              const AdjustmentValue = NIEDRTPL_AdjustmentList.find(d => d.location.x == NIEDrealTimePointLocation[index].x && d.location.y == NIEDrealTimePointLocation[index].y)
              //if (AdjustmentValue) console.log(AdjustmentValue)
              const x = AdjustmentValue != undefined ? AdjustmentValue.pixel.x : Math.round(NIEDrealTimePointLocation[index].x * 20.351320752096 - 2618.1292899264); // x座標
              const y = AdjustmentValue != undefined ? AdjustmentValue.pixel.y : Math.round(NIEDrealTimePointLocation[index].y * (-24.496568132548) + 1132.9172047303); // y座標

              const color = image.getPixelColor(x, y); // ARGB形式の色を取得

              // 色をRGBA形式に変換
              const rgba = Jimp.intToRGBA(color);
            
              if (rgba.r == 0 && rgba.b == 0 && rgba.g == 0) continue;

              // 最も近い色を選択
              const intensity = IntcolorList.sort((a, b) => {
                const distancea = Math.sqrt(
                  Math.pow(rgba.r - a.R, 2) +
                  Math.pow(rgba.g - a.G, 2) +
                  Math.pow(rgba.b - a.B, 2)
                )
                const distanceb = Math.sqrt(
                  Math.pow(rgba.r - b.R, 2) +
                  Math.pow(rgba.g - b.G, 2) +
                  Math.pow(rgba.b - b.B, 2)
                )
                return distancea - distanceb
              })[0]
              RealTimeIntObj.push({ind: index, int: intensity?.Intensity ?? 0})
            }
            sendData({type: 'realtimequake', data: RealTimeIntObj, time: now.getTime()})
        })
        .catch(err => {
            //console.error(err);
            setTimeout(() => {
                if (day != undefined) {
                    day.setSeconds(day.getSeconds()-1)
                }
                RealTimeQuake(day)
            }, 100);
        });
    }
}

/**@type {Map<string, import('./index.d.js').EEWMemoryType>} */
const EEWMemory = new Map()

function returnIntLevel(intname) {
    switch (intname) {
        case '5弱': return 5
        case '5強': return 6
        case '6弱': return 7
        case '6強': return 8
        case '7': return 9
        default: return Number(intname)
    }
}

/**
 * 
 * @param {import('./index.d.js').EEWInfo} data 
 */
function EEW(data) {
    const memory = EEWMemory.get(data.EventID)

    const Begantime = new Date(data.OriginTime)
    const AnnouncedTime = new Date(data.AnnouncedTime)
    
    //警報地域配列化
    const warnareanameskari = []
    for (const area of data.WarnArea) {
        if (area.Type != '警報') continue;
        const rawname = Object.keys(regions).find(r => regions[r].includes(area.Chiiki))
        const regionname = rawname?.endsWith('県') || rawname?.endsWith('府') ? rawname.slice(0, -1): rawname
        if (regionname) warnareanameskari.push(regionname)
    }
    const warnareanames = memory ? Array.from(new Set([...warnareanameskari, ...memory.warnAreas])) : warnareanameskari;
    let warnareanamestoread = ''
    for (const area of warnareanames) {
        warnareanamestoread += `${area}、`
    }
    warnareanamestoread = warnareanamestoread.slice(0, -1)
    const hypocenterInd = hypocenterNames.findIndex(h => h == data.Hypocenter)
    const isLevel = data.Depth == 10 && data.Magunitude == 0 && data.MaxIntensity == '5弱' && data.Hypocenter.includes('地方')
    const isPLUM = data.Depth == 10 && data.Magunitude == 10 && data.MaxIntensity != '不明'
    const isOnepoint = data.MaxIntensity == '不明' && data.Accuracy.Epicenter.includes('1 点')
    const isDeep = data.MaxIntensity == '不明' && data.Depth >= 150

    if (!memory) { //初発表
        sendData({type: 'sound', path: './audio/eew_0.mp3'})
        if (data.isWarn) {
            sendData({type: 'sound', path: './audio/eew_5.mp3'})
            sendData({type: 'read', text: `緊急地震速報。${warnareanamestoread}では、強い揺れに警戒してください。`, isforce: true})
        }
        else if (returnIntLevel(data.MaxIntensity) >= 3) sendData({type: 'sound', path: './audio/eew_3.mp3'})
        sendData({type: 'read', text: `${hypocenterReadingNames[hypocenterInd]}で地震${isLevel || isPLUM ? 'を検知' : ''}。`, isforce: true})
    }
    else {
        if (data.Serial < memory.latestSerial) return;
        if ((!memory.isWarn && data.isWarn) || warnareanames.length > memory.warnAreas.length) { //新規警報or続報
            sendData({type: 'sound', path: './audio/eew_5.mp3'})
            sendData({type: 'read', text: `緊急地震速報。${warnareanamestoread}では、強い揺れに警戒してください。`, isforce: true})
        }
        if (data.isFinal) sendData({type: 'sound', path: './audio/eew_KE.mp3'})
        else sendData({type: 'sound', path: './audio/eew_K.mp3'})
    }

    sendData({
        type: 'eewinfo',
        isfirst: memory == undefined,
        EventID: data.EventID,
        hypocenter: {
            x: data.Longitude,
            y: data.Latitude,
            Depth: data.Depth
        },
        assumedepicenter: isLevel || isPLUM,
        time: AnnouncedTime.getTime()-Begantime.getTime()
    })

    EEWMemory.set(data.EventID, {
        latestSerial: data.Serial,
        maxInt: returnIntLevel(data.MaxIntensity),
        isWarn: data.isWarn,
        warnAreas: warnareanames,
        hypocenter: {
            index: hypocenterInd
        },
    })
}

if (isReplay) {
    /**@type {import('./index.d.js').EEWInfo[]} */
    const ReplayEEWList = []
    let reversecount = 0
    setInterval(() => {
        if (reversecount % 5 == 0) {
            RealTimeQuake()
            ReplayEEWList.push(...EEWTest.filter(eew => new Date(eew.AnnouncedTime).getTime() == replayTimeRunning.getTime()))
        }
        if (reversecount % 2 == 0 && ReplayEEWList.length > 0) {
            const eewdata = ReplayEEWList.shift()
            if (eewdata) EEW(eewdata)
        }

        if (reversecount == 0) replayTimeRunning.setSeconds(replayTimeRunning.getSeconds()+1)
        if (reversecount >= 9) reversecount = 0
        else reversecount++;
    }, 100);
}
else {
    setInterval(() => {
        RealTimeQuake()
    }, 500);
}
