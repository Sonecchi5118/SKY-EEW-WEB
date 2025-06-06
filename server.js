//@ts-check
const WebSocket = require('ws');
const { IntcolorList, NIEDRTPL_AdjustmentList, NIEDrealTimePointLocation } = require('./data.js');
const Jimp = require('jimp');
const { ReplayIntData } = require('./ReplayIntData.js');

const isReplay = false;
/**@type {import("./index.d.js").Timestamp} */
const replayTime = '2025-01-13T21:19:30+0900'
let replayTimeRunning = new Date(replayTime);

const server = new WebSocket.Server({ port: 8080 });

server.on('connection', (socket) => {
    console.log('クライアントが接続しました');
});

/**
 * 
 * @param {{}} data 
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

/**
 * 
 * @param {import('./index.d.js').EEWInfo} data 
 */
function EEW(data) {
    
}

if (isReplay) {
    setInterval(() => {
        RealTimeQuake()
        replayTimeRunning.setSeconds(replayTimeRunning.getSeconds()+1)
    }, 1000);
}
else {
    setInterval(() => {
        RealTimeQuake()
    }, 500);
}
