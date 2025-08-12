//@ts-check
import { IntcolorList, NIEDRTPL_AdjustmentList, NIEDrealTimePointLocation, regions, hypocenterNames, hypocenterReadingNames, soujitable, prefareas } from './data.js';
import { ReplayIntData } from './ReplayIntData.js';
import { EEWTest } from './EEW.js';
import { NIEDRealTimeLocationRegionData } from './NIEDRealTimeLocationRegionData.js';
import { intToRGBA, Jimp } from 'jimp';
import { detectedquakeinfo, EEWInfo, EEWMemoryType, realtimequakeinfo, ServerData, Timestamp } from './index.js';
import { WebSocket, WebSocketServer } from 'ws';
const pwavespeed = 7

const isReplay = true;
//const replayTime: Timestamp = '2015-05-30T20:24:20+0900'
const replayTime  : Timestamp = '2024-01-01T16:10:00+0900'
//const replayTime: Timestamp = '2025-05-14T01:54:00+0900'
//const replayTime: Timestamp = '2025-01-13T21:19:34+0900'
let replayTimeRunning = new Date(replayTime);

const server = new WebSocketServer({ port: 3547 });

server.on('connection', () => {
    console.log('クライアントが接続しました');
});

function sendData(data: ServerData) {
    //console.log(JSON.stringify(data))
    server.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) client.send(JSON.stringify(data))
    })
}

let detectedquakes: detectedquakeinfo[] = []

const realtimepointshistory: {ind: number; int: number; isfirstdetect: boolean; detecting: boolean; detecttime: number|undefined;}[][] = []//10秒間記録する

const detectedpointskeeptimelist: {[key: number]: number} = {}

/**
 * ２点間の大円距離をハーバーサイン公式で算出する
 * @param lat1 第１の地点の緯度（度）
 * @param lon1 第１の地点の経度（度）
 * @param lat2 第２の地点の緯度（度）
 * @param lon2 第２の地点の経度（度）
 * @returns 距離（km）
 */
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (deg: number) => deg * Math.PI / 180;
  const R = 6371; // 地球の半径（km）

  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);

  const a = Math.sin(Δφ / 2) ** 2
          + Math.cos(φ1) * Math.cos(φ2)
          * Math.sin(Δλ / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}


function RealTimeQuake(day?: Date) {
    let newMaxInt = -3
    const quakeregions: {name: string; int: number;}[] = []
    const RealTimeIntObj: {ind: number; int: number; isfirstdetect: boolean; detecting: boolean; detecttime: number|undefined; nearestquake?: detectedquakeinfo; isineew: boolean}[] = []
    const operatedata = (time: number) => {
        const sendquakelist: realtimequakeinfo[] = []
        for (let i = 0; i < RealTimeIntObj.length; i++) {
            const nowpoint = RealTimeIntObj[i];
            const np = NIEDrealTimePointLocation[nowpoint.ind]
            const lastsecpoint = realtimepointshistory[0]?.find(p => p.ind == nowpoint.ind)
            if (lastsecpoint) {
                const nearestquake = detectedquakes.sort((a, b) => {
                    return Math.sqrt((a.lat - np.y)**2 + (a.lon - np.x)**2 + a.depth**2) - Math.sqrt((b.lat - np.y)**2 + (b.lon - np.x)**2 + b.depth**2)
                })[0] //最も近い震源を選択
                nowpoint.nearestquake = nearestquake
                let isinquake = false;
                if (nearestquake) {
                    const distance = haversineDistance(nearestquake.lat, nearestquake.lon, np.y, np.x) //震央距離：km
                    const soujiindex = (Math.round(Math.min(50, nearestquake.depth)/2) + Math.round(Math.min(200, Math.max(0, nearestquake.depth-50))/5) + Math.round(Math.max(0, nearestquake.depth-200)/10))*236 + Math.min(235, (Math.floor(Math.min(50, distance)/2) + Math.floor(Math.min(200, Math.max(0, distance-50)/5)) + Math.floor(Math.max(0, distance-200)/10)))
                    if (soujiindex < soujitable.length) {
                        const souji = soujitable[soujiindex].soujiP + (distance - soujitable[soujiindex].distance)/(soujitable[soujiindex+1].distance - soujitable[soujiindex].distance)*(soujitable[soujiindex+1].soujiP - soujitable[soujiindex].soujiP)
                        if (souji) if ((time - nearestquake.time) > souji) isinquake = true;
                    }
                }
                if (!nowpoint.detecting) {
                    //検知中地震の範囲内なら自動で追加
                    if (isinquake && nowpoint.int > -1) {
                        nowpoint.detecting = true;
                        nowpoint.detecttime = time
                        detectedpointskeeptimelist[nowpoint.ind] = 10
                    }
                    else {
                        if (nowpoint.int - lastsecpoint.int > 1) {//上昇した
                            const aroundpoints = RealTimeIntObj.filter(p => {
                                const lp = NIEDrealTimePointLocation[p.ind]
                                return (Math.abs(np.x - lp.x) < 0.5) && (Math.abs(np.y - lp.y) < 0.5)
                            })
                            if (aroundpoints.some(p => p.detecting)) {
                                nowpoint.detecting = true; //周辺観測点が既に検知中なら検知中にする
                                nowpoint.detecttime = time
                                detectedpointskeeptimelist[nowpoint.ind] = 10
                            }
                            else {
                                for (const aroundpoint of aroundpoints) {
                                    if (aroundpoint.int - (realtimepointshistory[0].find(pt => pt.ind == aroundpoint.ind)?.int ?? 10) > 0.5) {
                                        aroundpoint.detecting = true;
                                        nowpoint.detecting = true;
                                        nowpoint.isfirstdetect = true;
                                        nowpoint.detecttime = time
                                        aroundpoint.detecttime = time
                                        detectedpointskeeptimelist[aroundpoint.ind] = 10
                                        detectedpointskeeptimelist[nowpoint.ind] = 10
                                    }
                                }
                                if (nowpoint.isfirstdetect) {
                                    sendData({type: 'sound', path: `./audio/NewInt${returnIntLevel2(nowpoint.int)}.mp3`})
                                    detectedquakes.push({lat: Math.round(np.y*10)/10, lon: Math.round(np.x*10)/10, depth: 30, time: time-2000, firstdetectpoint: i, index: Math.round(Math.random()*1000), maxInt: nowpoint.int, matcheew: false})
                                }
                            }
                        }
                    }
                }
                else { //すでに検知中
                    if (nowpoint.int - lastsecpoint.int > 0.2 || nowpoint.int >= 1.5) detectedpointskeeptimelist[nowpoint.ind] = 10 //上昇したか、震度2以上なら検知延長
                    else detectedpointskeeptimelist[nowpoint.ind]--; //そうでなければ検知期限を減らす

                    if (returnIntLevel2(nearestquake.maxInt) < returnIntLevel2(nowpoint.int)) {
                        nowpoint.isfirstdetect = true;
                        nearestquake.maxInt = nowpoint.int
                        sendData({type: 'sound', path: `./audio/NewInt${returnIntLevel2(nowpoint.int)}.mp3`})
                    }

                    if (detectedpointskeeptimelist[nowpoint.ind] <= 0 && !isinquake) {
                        nowpoint.detecting = false; //期限が切れたら検知から外す
                        nowpoint.detecttime = undefined;
                    }
                }
                const region = NIEDRealTimeLocationRegionData[String(i)]
                const findregion = quakeregions.find(r => r.name == region)
                const int = returnIntLevel2(nowpoint.int)
                if (nowpoint.detecting && !findregion) quakeregions.push({name: region, int: int})
                else if (findregion && findregion.int < int) findregion.int = int

                if (nearestquake) nowpoint.isineew = nearestquake.matcheew
            }
        }

        /**
         * @description 仮定震源の座標
         */
        const calculatehypocenter = (quake: detectedquakeinfo, lat: number, lon: number, depth: number) => {
            //震源を求める計算
            const pointinfo: {[key: number]: {distance: number; quake: import('./index.d.js').detectedquakeinfo; begantime: number;}} = {}
            for (let i = 0; i < RealTimeIntObj.length; i++) {
                const nowpoint = RealTimeIntObj[i];
                const np = NIEDrealTimePointLocation[nowpoint.ind]
                if (!nowpoint.detecting || !nowpoint.detecttime) continue;
                const nearestquake = nowpoint.nearestquake
                if (nearestquake && nearestquake.index != quake.index) continue;
                //console.log(JSON.stringify({lat, lon, npx: np.x, npy: np.y}))
                const distance = haversineDistance(lat, lon, np.y, np.x) //km
                const soujiindex = (Math.round(Math.min(50, depth)/2) + Math.round(Math.min(200, Math.max(0, depth-50)/5)) + Math.round(Math.max(0, depth-200)/10))*236 + Math.min(235, (Math.floor(Math.min(50, distance)/2) + Math.floor(Math.min(200, Math.max(0, distance-50)/5)) + Math.floor(Math.max(0, distance-200)/10)))
                if (soujiindex > soujitable.length) continue;
                const souji = soujitable[soujiindex].soujiP + (distance - soujitable[soujiindex].distance)/(soujitable[soujiindex+1].distance - soujitable[soujiindex].distance)*(soujitable[soujiindex+1].soujiP - soujitable[soujiindex].soujiP)
                //console.log(Math.round(distance/10)*10)
                //console.log(depth)
                if (!souji) continue;
                const begantime = nowpoint.detecttime - souji*1000//distance/pwavespeed//
                //console.log(`${Math.round(distance/10)*10}, ${time - begantime}`)
                pointinfo[i] = {distance, quake: quake, begantime}
            }

            let sumbegantime = 0
            const values = Object.values(pointinfo).filter(p => quake.index == p.quake.index)
            values.forEach(p => {
                sumbegantime += p.begantime
            });
            quake.time = sumbegantime/values.length
            //console.log(quake.time)
            if (Number.isNaN(quake.time)) {
                detectedquakes = detectedquakes.filter(d => d.index != quake.index)
                return;
            }
            
            let errorlevel = 0;
            for (let i = 0; i < RealTimeIntObj.length; i++) {
                const nowpoint = RealTimeIntObj[i];
                const pinfo = pointinfo[i]
                if (!nowpoint.detecting || !nowpoint.detecttime) continue;
                if (!pinfo || !pinfo.quake.firstdetectpoint) continue;
                const firstdetectpoint = NIEDrealTimePointLocation[pinfo.quake.firstdetectpoint]
                const firstdetectpointdistance = Math.sqrt(haversineDistance(lat, firstdetectpoint.y, lon, firstdetectpoint.x)**2 + depth**2) //km
                const weigh = pinfo.distance <= 50 ? 1 : (firstdetectpointdistance/pinfo.distance)
                const quake = detectedquakes.find(q => q.index == pinfo.quake.index)
                if (!quake) continue;
                const squaremargin = ((pinfo.begantime - (quake.time||0))/1000)**2
                //console.log(`${Math.round(firstdetectpointdistance/10)*10}, ${pinfo.begantime - (quake.time||0)}`)
                //console.log(squaremargin)
                const errorlevelpart = squaremargin*weigh
                errorlevel += errorlevelpart
            }
            //着未着法
            const distancelist: {[key: number]: number} = {}
            if (quake.time - time < 3000 || (quake.time - time < 10000 && values.length < 30)) {
                const yetdetectpoints = RealTimeIntObj.filter(p => {
                    const point = NIEDrealTimePointLocation[p.ind]
                    const distance = haversineDistance(quake.lat, quake.lon, point.y, point.x)
                    const condition = !p.detecting && distance <= 30
                    if (condition) distancelist[p.ind] = distance
                    return condition
                })
                for (const point of yetdetectpoints) {
                    if (quake.time + distancelist[point.ind]/pwavespeed < time) errorlevel++;
                }
            }

            return errorlevel
        }
        const sortquake = detectedquakes.sort((a, b) => b.time - a.time)
        for (let i = 0; i < sortquake.length; i++) {
            const quake = sortquake[i];
            if (!quake) continue;
            detectedquakes = detectedquakes.filter(q => {
                const distance = haversineDistance(q.lat, q.lon, quake.lat, quake.lon);
                const soujiindex = (Math.round(Math.min(50, quake.depth)/2) + Math.round(Math.min(200, Math.max(0, quake.depth-50)/5)) + Math.round(Math.max(0, quake.depth-200)/10))*236 + Math.min(235, (Math.floor(Math.min(50, distance)/2) + Math.floor(Math.min(200, Math.max(0, distance-50)/5)) + Math.floor(Math.max(0, distance-200)/10)))
                const souji = soujitable[soujiindex].soujiP + (distance - soujitable[soujiindex].distance)/(soujitable[soujiindex+1].distance - soujitable[soujiindex].distance)*(soujitable[soujiindex+1].soujiP - soujitable[soujiindex].soujiP)

                return souji > (quake.time - time)
            })
        }
        for (const quake of detectedquakes) {
            // 最小値の初期化
            let minH = Infinity;
            let bestCombination = {lat: quake.lat, lon: quake.lon, depth: quake.depth};

            for (const eew of EEWMemory.values()) {
                if (haversineDistance(eew.hypocenter.latitude, eew.hypocenter.longitude, quake.lat, quake.lon) < 50) {
                    bestCombination = {lat: eew.hypocenter.latitude, lon: eew.hypocenter.longitude, depth: eew.hypocenter.depth};
                    quake.matcheew = true;
                }
            }

            if (!quake.matcheew) {
                for (let lat = bestCombination.lat - 0.1; lat <= bestCombination.lat + 0.1; lat += 0.1) {
                    for (let lon = bestCombination.lon - 0.1; lon <= bestCombination.lon + 0.1; lon += 0.1) {
                        let lastvalue = Infinity
                        for (let depth = 10; depth <= 270; depth += 20) {
                            const value = calculatehypocenter(quake, lat, lon, depth);
                            if (!value) break;
                            if (value > lastvalue) break;
                            if (value < minH) {
                                minH = value;
                                bestCombination = { lat, lon, depth };
                            }
                            lastvalue = value
                        }
                    }
                }

                for (let depth = Math.max(bestCombination.depth - 10, 10); depth <= Math.min(700, bestCombination.depth + 10); depth += 10) {
                    const value = calculatehypocenter(quake, bestCombination.lat, bestCombination.lon, depth);
                    if (!value) break;
                    if (value < minH) {
                        minH = value;
                        bestCombination = { lat: bestCombination.lat, lon: bestCombination.lon, depth };
                    }
                }
            }

            //震央決定！
            sendquakelist.push({
                latitude: bestCombination.lat,
                longitude: bestCombination.lon,
                depth: bestCombination.depth,
                begantime: quake.time,
                epasedtime: time-quake.time,
                maxint: quake.maxInt,
                opacity: quake.matcheew ? 0 : 1,
                index: quake.index
            })
            //console.log(JSON.stringify({
            //    type: 'realtimehypocenter',
            //    latitude: bestCombination.lat,
            //    longitude: bestCombination.lon,
            //    depth: bestCombination.depth,
            //    begantime: quake.time,
            //    epasedtime: time-quake.time,
            //    maxint: quake.maxInt,
            //    opacity: quake.matcheew ? 0 : 1,
            //    index: quake.index
            //}))
            quake.lat = bestCombination.lat
            quake.lon = bestCombination.lon
            quake.depth = bestCombination.depth
        }

        //const LMI = returnIntLevel2(newMaxInt)
        //if (returnIntLevel2(nowMaxInt) < LMI) {
        //    for (let i = 0; i < RealTimeIntObj.length; i++) {
        //        const {int} = RealTimeIntObj[i];
        //        if (returnIntLevel2(int) == LMI) RealTimeIntObj[i].isfirstdetect = true
        //    }
        //    sendData({type: 'sound', path: `./audio/NewInt${LMI}.mp3`})
        //}
        //nowMaxInt = newMaxInt
        if (detectedquakes.length > 0) sendData({type: 'realtimequake', data: RealTimeIntObj, time: time+1000, maxInt: returnIntLevel2(newMaxInt), regions: quakeregions.sort((a, b) => b.int - a.int)})
        else sendData({type: 'realtimequake', data: RealTimeIntObj, time: time+1000, maxInt: -100, regions: []})
        //console.log(JSON.stringify({type: 'realtimequakeinfo', maxInt: returnIntLevel2(newMaxInt), regions: quakeregions, length: detectedquakes.length}))
        if (realtimepointshistory.length >= 10) realtimepointshistory.pop() //10秒前のやつは消す
        realtimepointshistory.unshift(RealTimeIntObj)

        sendData({
            type: 'realtimehypocenter',
            data: sendquakelist
        })
    }


    if (isReplay) {
        const runningtime = replayTimeRunning.getTime()
        for (let index = 0; index < NIEDrealTimePointLocation.length; index++) {
            //console.log(index)
            const lastsecpoint = realtimepointshistory[0]?.find(p => p.ind == index)
            const IntData = ReplayIntData[index]
            if (IntData == undefined) RealTimeIntObj.push({ind: index, int: -3, isfirstdetect: false, detecting: lastsecpoint?.detecting || false, detecttime: lastsecpoint?.detecttime, isineew: false});
            else {
                let success = false;
                for (const data of IntData) {
                    if (data.Time == runningtime) {
                        //console.log(IntData)
                        RealTimeIntObj.push({ind: index, int: data.Intensity, isfirstdetect: false, detecting: lastsecpoint?.detecting || false, detecttime: lastsecpoint?.detecttime, isineew: false})
                        if (newMaxInt < data.Intensity) newMaxInt = data.Intensity
                        success = true;
                        //console.log(IntData.Intensity)
                        break;
                    }
                }
                if (!success) RealTimeIntObj.push({ind: index, int: -3, isfirstdetect: false, detecting: false, detecttime: lastsecpoint?.detecttime, isineew: false});
            }
        }
        operatedata(runningtime)
    }
    else {// 画像を読み込む
        const now = day || (new Date(Date.now()-2500))
        Jimp.read(`http://www.kmoni.bosai.go.jp/data/map_img/RealTimeImg/jma_s/${now.getFullYear()}${`00${now.getMonth()+1}`.slice(-2)}${`00${now.getDate()}`.slice(-2)}/${now.getFullYear()}${`00${now.getMonth()+1}`.slice(-2)}${`00${now.getDate()}`.slice(-2)}${`00${now.getHours()}`.slice(-2)}${`00${now.getMinutes()}`.slice(-2)}${`00${now.getSeconds()}`.slice(-2)}.jma_s.gif`)
        //Jimp.read(`20250120195208.jma_s.gif`)
        .then(image => {
            // ここで画像の処理を行う

            for (let index = 0; index < NIEDrealTimePointLocation.length; index++) {
              const lastsecpoint = realtimepointshistory[0]?.find(p => p.ind == index)
              // 座標(x, y)の色を取得
              const AdjustmentValue = NIEDRTPL_AdjustmentList.find(d => d.location.x == NIEDrealTimePointLocation[index].x && d.location.y == NIEDrealTimePointLocation[index].y)
              //if (AdjustmentValue) console.log(AdjustmentValue)
              const x = AdjustmentValue != undefined ? AdjustmentValue.pixel.x : Math.round(NIEDrealTimePointLocation[index].x * 20.351320752096 - 2618.1292899264); // x座標
              const y = AdjustmentValue != undefined ? AdjustmentValue.pixel.y : Math.round(NIEDrealTimePointLocation[index].y * (-24.496568132548) + 1132.9172047303); // y座標

              const color = image.getPixelColor(x, y); // ARGB形式の色を取得

              // 色をRGBA形式に変換
              const rgba = intToRGBA(color);
            
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
              if (newMaxInt < intensity.Intensity) newMaxInt = intensity.Intensity
              RealTimeIntObj.push({ind: index, int: intensity?.Intensity ?? 0, isfirstdetect: false, detecting: lastsecpoint?.detecting || false, detecttime: lastsecpoint?.detecttime, isineew: false})
            }
            operatedata(now.getTime())
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

const EEWMemory: Map<string, EEWMemoryType> = new Map()

function returnIntLevel(intname: string) {
    switch (intname) {
        case '5弱': return 5
        case '5強': return 6
        case '6弱': return 7
        case '6強': return 8
        case '7': return 9
        case '不明': return -1
        default: return Number(intname)
    }
}

function returnIntLevel2(int: number) {
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

const regionmap: {[key: string]: number} = {}

function EEW(data: EEWInfo) {
    const memory = EEWMemory.get(data.EventID)
    let hypocalled = memory ? memory.hypocenter.called : false;
    let maxintcalled = memory ? memory.maxintcalled : false;

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
    let tansyuku: string[] = []
    for (const area of warnareanames) {
        if (warnareanames.length > 10) {
            const regionname = Object.keys(prefareas).find(pref => prefareas[pref].includes(area))
            if (regionname && !tansyuku.includes(regionname)) {
                warnareanamestoread += `${regionname}、`
                tansyuku.push(regionname)
            }
        }
        else warnareanamestoread += `${area}、`
    }
    warnareanamestoread = warnareanamestoread.slice(0, -1)
    const hypocenterInd = hypocenterNames.findIndex(h => h == (data.Hypocenter.endsWith('地方') ? data.Hypocenter.slice(0, -2) : data.Hypocenter))
    const isLevel = data.Depth == 10 && data.Magunitude == 0 && data.MaxIntensity == '5弱' && data.Hypocenter.includes('地方')
    const isPLUM = data.Depth == 10 && data.Magunitude == 10 && data.MaxIntensity != '不明'
    const isOnepoint = data.MaxIntensity == '不明' && data.Accuracy.Epicenter.includes('1 点')
    const isDeep = data.MaxIntensity == '不明' && data.Depth >= 150
    const maxInt = returnIntLevel(data.MaxIntensity)

    const callhyponame = (delay = false) => {
        const memory = EEWMemory.get(data.EventID)
        if (delay ? memory?.hypocenter.called : hypocalled) return;
        const hypotihou = (delay ? memory?.hypocenter.name : data.Hypocenter)?.endsWith('地方')
        const hypocenterInd2 = delay ? hypocenterNames.findIndex(h => h == (hypotihou ? memory?.hypocenter.name.slice(0, -2) : memory?.hypocenter.name)) : hypocenterInd
        const isLevel2 = delay ? memory?.hypocenter.depth == 10 && memory?.hypocenter.magnitude == 0 && memory.maxInt == 5 && data.Hypocenter.includes('地方') : isLevel
        const isPLUM2 = delay ? memory?.hypocenter.depth == 10 && memory?.hypocenter.magnitude == 10 && memory.maxInt != -1 : isPLUM
        sendData({type: 'read', text: `${hypocenterReadingNames[hypocenterInd2]}で地震${isLevel2 || isPLUM2 ? 'を検知' : ''}。`})
        if (delay && memory) {
            memory.hypocenter.called = true;
            EEWMemory.set(data.EventID, memory)
        }
        else hypocalled = true;
    }
    const callmaxint = (delay = false) => {
        const memory = EEWMemory.get(data.EventID)
        if (delay ? memory?.maxintcalled : maxintcalled) return;
        const isOnepoint2 = delay ? memory?.isOnepoint : isOnepoint
        const isDeep2 = delay ? memory?.maxInt == -1 && memory.hypocenter.depth >= 150 : isDeep
        const maxint = delay ? (memory?.maxInt||0) : maxInt
        const readintname = (int: number) => {
            switch (int) {
                case -1: return '不明'
                case 1: return '1'
                case 2: return '2'
                case 3: return '3'
                case 4: return '4'
                case 5: return '御弱'
                case 6: return '誤凶'
                case 7: return '6弱'
                case 8: return '6凶'
                case 9: return '7'
            }
        }
        sendData({type: 'read', text: isDeep2 || isOnepoint2 ? `'震度推定'なし'` : `推定最大震度${readintname(maxint)}。`})
        if (delay && memory) {
            memory.maxintcalled = true;
            EEWMemory.set(data.EventID, memory)
        }
        else maxintcalled = true;
    }

    if (!memory) { //初発表
        sendData({type: 'sound', path: './audio/eew_0.mp3'})
        if (data.isWarn) {
            sendData({type: 'sound', path: './audio/eew_5.mp3'})
            sendData({type: 'read', text: `緊急地震速報。${warnareanamestoread}では、強い揺れに警戒してください。`, isforce: true})
            setTimeout(() => {
                callhyponame(true)
                setTimeout(() => {
                    callmaxint(true)
                }, 5*1000);
            }, (7+(tansyuku.length == 0 ? warnareanames.length : tansyuku.length)*1)*1000);
        }
        else {
            if (returnIntLevel(data.MaxIntensity) >= 3) sendData({type: 'sound', path: './audio/eew_3.mp3'})
            callhyponame()
            setTimeout(() => {
                callmaxint(true)
            }, 5*1000);
        }
    }
    else {
        if (data.Serial < memory.latestSerial) return;
        if ((!memory.isWarn && data.isWarn) || warnareanames.length > memory.warnAreas.length) { //新規警報or続報
            sendData({type: 'sound', path: './audio/eew_5.mp3'})
            sendData({type: 'read', text: `緊急地震速報。${warnareanamestoread}では、強い揺れに警戒してください。`, isforce: true})
        }
        if (data.isCancel) {
            sendData({type: 'sound', path: './audio/eew_C.mp3'})
            sendData({type: 'read', text: `さきほどの緊急地震速報は、キャンセルされました。`})
        }
        else if (data.isFinal) sendData({type: 'sound', path: './audio/eew_KE.mp3'})
        else sendData({type: 'sound', path: './audio/eew_K.mp3'})

        if (data.Hypocenter != memory.hypocenter.name) {
            hypocalled = false;
            callhyponame()
            setTimeout(() => {
                callmaxint(true)
            }, 5*1000);
        }
        else if (maxInt != memory.maxInt) {
            maxintcalled = false;
            callmaxint()
        }
    }

    for (const region of data.WarnArea) {
        regionmap[region.Chiiki] = Math.max(returnIntLevel(region.Shindo1), (regionmap[region.Chiiki]??0))
    }

    sendData({
        type: 'eewinfo',
        Delete: false,
        Cancel: data.isCancel,
        isfirst: memory == undefined,
        EventID: data.EventID,
        hypocenter: {
            x: data.Longitude,
            y: data.Latitude,
            Depth: data.Depth,
            name: data.Hypocenter
        },
        assumedepicenter: isLevel || isPLUM,
        serial: data.Serial,
        isfinal: data.isFinal,
        isWarn: data.isWarn,
        maxInt,
        iskarihypo: isLevel || isPLUM,
        isLevel,
        isDeep,
        isOnepoint,
        isPLUM,
        magnitude: data.Magunitude,
        begantime: Begantime.getTime(),
        regionmap
    })

    EEWMemory.set(data.EventID, {
        latestSerial: data.Serial,
        maxInt,
        isWarn: data.isWarn,
        warnAreas: warnareanames,
        maxintcalled,
        isOnepoint,
        hypocenter: {
            index: hypocenterInd,
            latitude: data.Latitude,
            longitude: data.Longitude,
            depth: data.Depth,
            called: hypocalled,
            name: data.Hypocenter,
            magnitude: data.Magunitude
        },
    })

    if (data.isFinal) {
        setTimeout(() => {
            sendData({
                type: 'eewinfo',
                Delete: true,
                EventID: data.EventID
            })
            EEWMemory.delete(data.EventID)
        }, 30*1000);
    }
}

if (isReplay) {
    const ReplayEEWList: EEWInfo[] = []
    let lastrunningsec = -1
    setInterval(() => {
        const now = new Date()
        if (now.getSeconds() != lastrunningsec) {
           RealTimeQuake()
           ReplayEEWList.push(...EEWTest.filter(eew => new Date(eew.AnnouncedTime).getTime() == replayTimeRunning.getTime()))
           
           const eewdata = ReplayEEWList.shift()
           if (eewdata) EEW(eewdata)
           

            replayTimeRunning.setSeconds(replayTimeRunning.getSeconds()+1)

            lastrunningsec = now.getSeconds()
        }
    }, 10);
}
else {
    setInterval(() => {
        RealTimeQuake()
    }, 500);
}
