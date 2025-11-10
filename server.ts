//@ts-check
import { NIEDRTPL_AdjustmentList, NIEDrealTimePointLocation, regions, hypocenterNames, hypocenterReadingNames, soujitable, prefareas } from './data.js';
import { ReplayIntData } from './ReplayIntData.js';
import { EEWTest } from './EEW.js';
import { NIEDRealTimeLocationRegionData } from './NIEDRealTimeLocationRegionData.js';
import { intToRGBA, Jimp } from 'jimp';
import { detectedquakeinfo, EEWInfo, EEWMemoryType, EQInfoForsend, EQINFOBase, realtimequakeinfo, ServerData, Timestamp } from './index.js';
import { WebSocket, WebSocketServer } from 'ws';
import { EarthquakeInformation }  from '@dmdata/telegram-json-types';
import { DMDSS_data } from './DMDSS_data.js';
import { Earthquake } from '@dmdata/telegram-json-types/types/component/earthquake.js';
const pwavespeed = 7

const isReplay = false;
//const replayTime: Timestamp = '2015-05-30T20:24:20+0900'
//const replayTime  : Timestamp = '2024-01-01T16:10:00+0900' //能登半島地震
//const replayTime: Timestamp = '2025-05-14T01:54:00+0900'
const replayTime: Timestamp = '2025-01-13T21:19:30+0900' //日向灘(5-)
//const replayTime: Timestamp = '2021-02-13T23:09:30+0900' //震度速報（福島）
let replayTimeRunning = new Date(replayTime);

const server = new WebSocketServer({ port: 3547 });

server.on('connection', (client) => {
    console.log('クライアントが接続しました');
    setTimeout(() => {
        for (const [EventId, data] of EQInfoMemory.entries()) {
            client.send(JSON.stringify({
                type: 'eqinfo',
                EventID: EventId,
                ...data
            })) 
        }
    }, 5);
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

/**
 *  rgb2hsv (r, g, b)
 *  rgb2hsv (colorcode)
 */
function rgbTohsv(r: number, g: number, b: number) {
  // 引数処理
  let tmp = [r, g, b];
  if (r !== void 0 && g === void 0) {
    const cc = parseInt(r.toString().replace(/[^\da-f]/ig, '').replace(/^(.)(.)(.)$/, "$1$1$2$2$3$3"), 16);
    tmp = [cc >> 16 & 0xff, cc >> 8 & 0xff, cc & 0xff];
  }
  else {
    for (let i in tmp) tmp[i] = Math.max(0, Math.min(255, Math.floor(tmp[i])));
  }
  [r, g, b] = tmp;

  // RGB to HSV 変換
  const
    v = Math.max(r, g, b), d = v - Math.min(r, g, b),
    s = v ? d / v : 0, a = [r, g, b, r, g], i = a.indexOf(v),
    h = s ? (((a[i + 1] - a[i + 2]) / d + i * 2 + 6) % 6) * 60 : 0;

  // 戻り値
  return {h: h/360, s, v: v / 255};
}

function RealTimeQuake(day: Date = new Date(Date.now() - 2500)) {
    let newMaxInt = -3
    const quakeregions: {name: string; int: number;}[] = []
    const now = (isReplay?replayTimeRunning:(day)).getTime()
    let RealTimeIntObj: {ind: number; int: number; PGA: number; isfirstdetect: boolean; detecting: boolean; detecttime: number|undefined; nearestquake?: detectedquakeinfo; isineew: boolean}[] = []
    const operatedata = (time: number) => {
        const sendquakelist: realtimequakeinfo[] = []
        for (let i = 0; i < RealTimeIntObj.length; i++) {
            const nowpoint = RealTimeIntObj[i];
            const np = NIEDrealTimePointLocation[nowpoint.ind]
            //const lastsecpoint = realtimepointshistory[0]?.find(p => p.ind == nowpoint.ind)
            const inQuake = detectedquakes.find(q => (now-q.time)*pwavespeed > Math.sqrt(haversineDistance(q.lat, q.lon, np.y, np.x)**2 + q.depth**2))
                    
            if (!nowpoint.detecting) {
                if (nowpoint.PGA > 1 && false) {// || returnIntLevel2(nowpoint.int) >= 1) {
                    if (inQuake) {
                        nowpoint.detecting = true
                        nowpoint.detecttime = now
                        detectedpointskeeptimelist[nowpoint.ind] = 10
                    }
                    else {
                        const aroundpoints = RealTimeIntObj.filter(p => {
                            const lp = NIEDrealTimePointLocation[p.ind]
                            return haversineDistance(np.y, np.x, lp.y, lp.x) < 20 && p.ind != nowpoint.ind
                        })
                        //if (aroundpoints.some(p => p.detecting)) {
                        //    nowpoint.detecting = true; //周辺観測点が既に検知中なら検知中にする
                        //    nowpoint.detecttime = time
                        //    detectedpointskeeptimelist[nowpoint.ind] = 10
                        //}
                        if (aroundpoints.filter(p => p.PGA > 1).length >= 3) {
                            nowpoint.detecting = true
                            nowpoint.detecttime = now
                            nowpoint.isfirstdetect = true
                            detectedpointskeeptimelist[nowpoint.ind] = 10
                            sendData({type: 'sound', path: `./audio/NewInt${returnIntLevel2(nowpoint.int)}.mp3`})
                            detectedquakes.push({lat: Math.round(np.y*10)/10, lon: Math.round(np.x*10)/10, depth: 30, time: time-2000, firstdetectpoint: i, index: Math.round(Math.random()*1000), maxInt: returnIntLevel2(nowpoint.int), matcheew: false, match_end_eew: false})
                        }
                        else if (inQuake) {
                            nowpoint.detecting = true
                            nowpoint.detecttime = now
                            detectedpointskeeptimelist[nowpoint.ind] = 10
                        }
                    }
                }
                //if (nowpoint.PGA > 1) {
                //    nowpoint.detecting = true
                //    nowpoint.detecttime = now
                //    detectedpointskeeptimelist[nowpoint.ind] = 10
                //}
            }
            else { //検知中
                if (inQuake) {
                    if (inQuake.maxInt < returnIntLevel2(nowpoint.int)) {
                        sendData({type: 'sound', path: `./audio/NewInt${returnIntLevel2(nowpoint.int)}.mp3`})
                        inQuake.maxInt = returnIntLevel2(nowpoint.int)
                    }
                }

                if (nowpoint.PGA > 0.7 || returnIntLevel2(nowpoint.int) >= 2) detectedpointskeeptimelist[nowpoint.ind] = 10
                else detectedpointskeeptimelist[nowpoint.ind] -= 1
                if (detectedpointskeeptimelist[nowpoint.ind] <= 0) { //検知解除
                    nowpoint.detecting = false
                    nowpoint.detecttime = undefined
                    nowpoint.isineew = false
                }
            }
            const region = NIEDRealTimeLocationRegionData[String(i)]
            const findregion = quakeregions.find(r => r.name == region)
            const int = returnIntLevel2(nowpoint.int)
            if (nowpoint.detecting && !findregion) quakeregions.push({name: region, int: int})
            else if (findregion && findregion.int < int) findregion.int = int

            if (inQuake) nowpoint.isineew = inQuake.matcheew

            //if (lastsecpoint && realtimepointshistory[5] != undefined) {
            //if (lastsecpoint) {
            //    const nearestquake: detectedquakeinfo | undefined = detectedquakes.sort((a, b) => {
            //        return Math.sqrt((a.lat - np.y)**2 + (a.lon - np.x)**2 + a.depth**2) - Math.sqrt((b.lat - np.y)**2 + (b.lon - np.x)**2 + b.depth**2)
            //    })[0] //最も近い震源を選択
            //    nowpoint.nearestquake = nearestquake
            //    let isinquake = false;
            //    if (nearestquake) {
            //        const distance = haversineDistance(nearestquake.lat, nearestquake.lon, np.y, np.x) //震央距離：km
            //        const soujiindex = (Math.round(Math.min(50, nearestquake.depth)/2) + Math.round(Math.min(200, Math.max(0, nearestquake.depth-50))/5) + Math.round(Math.max(0, nearestquake.depth-200)/10))*236 + Math.min(235, (Math.floor(Math.min(50, distance)/2) + Math.floor(Math.min(200, Math.max(0, distance-50)/5)) + Math.floor(Math.max(0, distance-200)/10)))
            //        if (soujiindex < soujitable.length) {
            //            const souji = soujitable[soujiindex].soujiP + (distance - soujitable[soujiindex].distance)/(soujitable[soujiindex+1].distance - soujitable[soujiindex].distance)*(soujitable[soujiindex+1].soujiP - soujitable[soujiindex].soujiP)
            //            if (souji) if ((time - nearestquake.time) > souji) isinquake = true;
            //        }
            //    }
            //    if (!nowpoint.detecting) {
            //        //検知中地震の範囲内なら自動で追加
            //        if (isinquake && nowpoint.int > -1) {
            //            nowpoint.detecting = true;
            //            nowpoint.detecttime = time
            //            detectedpointskeeptimelist[nowpoint.ind] = 10
            //        }
            //        else {
            //            if (nowpoint.PGA > 1) {//上昇した
            //                const aroundpoints = RealTimeIntObj.filter(p => {
            //                    const lp = NIEDrealTimePointLocation[p.ind]
            //                    return (Math.abs(np.x - lp.x) < 0.01) && (Math.abs(np.y - lp.y) < 0.01)
            //                })
            //                if (aroundpoints.some(p => p.detecting)) {
            //                    nowpoint.detecting = true; //周辺観測点が既に検知中なら検知中にする
            //                    nowpoint.detecttime = time
            //                    detectedpointskeeptimelist[nowpoint.ind] = 10
            //                }
            //                else {
            //                    for (const aroundpoint of aroundpoints) {
            //                        //if (aroundpoint.int - (realtimepointshistory[0].find(pt => pt.ind == aroundpoint.ind)?.int ?? 10) > 0.5) {
            //                        if (aroundpoint.PGA > 0.5) {
            //                            aroundpoint.detecting = true;
            //                            nowpoint.detecting = true;
            //                            nowpoint.isfirstdetect = true;
            //                            nowpoint.detecttime = time
            //                            aroundpoint.detecttime = time
            //                            detectedpointskeeptimelist[aroundpoint.ind] = 10
            //                            detectedpointskeeptimelist[nowpoint.ind] = 10
            //                        }
            //                    }
            //                    if (nowpoint.isfirstdetect) {
            //                        sendData({type: 'sound', path: `./audio/NewInt${returnIntLevel2(nowpoint.int)}.mp3`})
            //                        detectedquakes.push({lat: Math.round(np.y*10)/10, lon: Math.round(np.x*10)/10, depth: 30, time: time-2000, firstdetectpoint: i, index: Math.round(Math.random()*1000), maxInt: nowpoint.int, matcheew: false, match_end_eew: false})
            //                    }
            //                }
            //            }
            //        }
            //    }
            //    else { //すでに検知中
            //        if (nowpoint.int - lastsecpoint.int > 0.2 || nowpoint.int >= 1.5) detectedpointskeeptimelist[nowpoint.ind] = 10 //上昇したか、震度2以上なら検知延長
            //        else detectedpointskeeptimelist[nowpoint.ind]--; //そうでなければ検知期限を減らす
//
            //        if (nearestquake && returnIntLevel2(nearestquake.maxInt) < returnIntLevel2(nowpoint.int)) {
            //            nowpoint.isfirstdetect = true;
            //            nearestquake.maxInt = nowpoint.int
            //            sendData({type: 'sound', path: `./audio/NewInt${returnIntLevel2(nowpoint.int)}.mp3`})
            //        }
//
            //        if (detectedpointskeeptimelist[nowpoint.ind] <= 0 && !isinquake) {
            //            nowpoint.detecting = false; //期限が切れたら検知から外す
            //            nowpoint.detecttime = undefined;
            //        }
            //    }
            //    const region = NIEDRealTimeLocationRegionData[String(i)]
            //    const findregion = quakeregions.find(r => r.name == region)
            //    const int = returnIntLevel2(nowpoint.int)
            //    if (nowpoint.detecting && !findregion) quakeregions.push({name: region, int: int})
            //    else if (findregion && findregion.int < int) findregion.int = int
//
            //    if (nearestquake) nowpoint.isineew = nearestquake.matcheew
            //}
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

            const nowmatch = quake.matcheew
            quake.matcheew = false;
            for (const eew of EEWMemory.values()) {
                if (haversineDistance(eew.hypocenter.latitude, eew.hypocenter.longitude, quake.lat, quake.lon) < 50) {
                    bestCombination = {lat: eew.hypocenter.latitude, lon: eew.hypocenter.longitude, depth: eew.hypocenter.depth};
                    quake.matcheew = true;
                }
            }
            if (!quake.matcheew && nowmatch) quake.match_end_eew = true; 
            //console.log(quake.match_end_eew)

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
                opacity: (quake.matcheew || quake.match_end_eew || now - quake.time > 1000*60) ? 0 : (now - quake.time > 1000*45) ? 0.5 : 1,
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
        //RealTimeIntObj = RealTimeIntObj.sort((a, b) => a.int - b.int)
        //console.log(RealTimeIntObj)
        if (detectedquakes.length > 0) sendData({type: 'realtimequake', data: RealTimeIntObj, time: time+1000, maxInt: returnIntLevel2(newMaxInt), regions: quakeregions.sort((a, b) => b.int - a.int)})
        else sendData({type: 'realtimequake', data: RealTimeIntObj, time: time+1000, maxInt: -100, regions: []})
        //console.log(detectedquakes.length)
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
            if (IntData == undefined) RealTimeIntObj.push({ind: index, PGA: 0, int: -3, isfirstdetect: false, detecting: lastsecpoint?.detecting || false, detecttime: lastsecpoint?.detecttime, isineew: false});
            else {
                let success = false;
                for (const data of IntData) {
                    if (data.Time == runningtime) {
                        //console.log(IntData)
                        RealTimeIntObj.push({ind: index, PGA: data.PGA, int: data.Intensity, isfirstdetect: false, detecting: lastsecpoint?.detecting || false, detecttime: lastsecpoint?.detecttime, isineew: false})
                        if (newMaxInt < data.Intensity) newMaxInt = data.Intensity
                        success = true;
                        //console.log(IntData.Intensity)
                        break;
                    }
                }
                if (!success) RealTimeIntObj.push({ind: index, int: -3, PGA: 0, isfirstdetect: false, detecting: false, detecttime: lastsecpoint?.detecttime, isineew: false});
            }
        }
        operatedata(runningtime)
    }
    else {// 画像を読み込む
        const now = day || (new Date(Date.now()-2500))
        Jimp.read(`http://www.kmoni.bosai.go.jp/data/map_img/RealTimeImg/jma_s/${now.getFullYear()}${`00${now.getMonth()+1}`.slice(-2)}${`00${now.getDate()}`.slice(-2)}/${now.getFullYear()}${`00${now.getMonth()+1}`.slice(-2)}${`00${now.getDate()}`.slice(-2)}${`00${now.getHours()}`.slice(-2)}${`00${now.getMinutes()}`.slice(-2)}${`00${now.getSeconds()}`.slice(-2)}.jma_s.gif`)
        //Jimp.read(`20250120195208.jma_s.gif`)
        .then(intImage => {
            //加速度の読み取り
            Jimp.read(`http://www.kmoni.bosai.go.jp/data/map_img/RealTimeImg/acmap_s/${now.getFullYear()}${`00${now.getMonth()+1}`.slice(-2)}${`00${now.getDate()}`.slice(-2)}/${now.getFullYear()}${`00${now.getMonth()+1}`.slice(-2)}${`00${now.getDate()}`.slice(-2)}${`00${now.getHours()}`.slice(-2)}${`00${now.getMinutes()}`.slice(-2)}${`00${now.getSeconds()}`.slice(-2)}.acmap_s.gif`)
            .then(PGAImage => {

                for (let index = 0; index < NIEDrealTimePointLocation.length; index++) {
                  const lastsecpoint = realtimepointshistory[0]?.find(p => p.ind == index)
                  // 座標(x, y)の色を取得
                  const AdjustmentValue = NIEDRTPL_AdjustmentList.find(d => d.location.x == NIEDrealTimePointLocation[index].x && d.location.y == NIEDrealTimePointLocation[index].y)
                  //if (AdjustmentValue) console.log(AdjustmentValue)
                  const x = AdjustmentValue != undefined ? AdjustmentValue.pixel.x : Math.round(NIEDrealTimePointLocation[index].x * 20.351320752096 - 2618.1292899264); // x座標
                  const y = AdjustmentValue != undefined ? AdjustmentValue.pixel.y : Math.round(NIEDrealTimePointLocation[index].y * (-24.496568132548) + 1132.9172047303); // y座標

                  const intColor = intImage.getPixelColor(x, y); // ARGB形式の色を取得
                  const PGAColor = PGAImage.getPixelColor(x, y); // ARGB形式の色を取得

                  // 色をRGBA形式に変換
                  const intrgba = intToRGBA(intColor);
                  const PGArgba = intToRGBA(PGAColor);
                  
                
                  if ((intrgba.r == 0 && intrgba.b == 0 && intrgba.g == 0) || (PGArgba.r == 0 && PGArgba.b == 0 && PGArgba.g == 0)) continue;


                  let Intposition = 0;
                  let PGAposition = 0;
                  const Inthsv = rgbTohsv(intrgba.r, intrgba.g, intrgba.b)
                  //const Inthsv = rgbTohsv(189,255,12)
                  //console.log(JSON.stringify(Inthsv))
	              const Inth = Inthsv.h;
	              const Ints = Inthsv.s;
	              const Intv = Inthsv.v;
                  const PGAhsv = rgbTohsv(PGArgba.r, PGArgba.g, PGArgba.b)
	              const PGAh = PGAhsv.h;
	              const PGAs = PGAhsv.s;
	              const PGAv = PGAhsv.v;
                              
	              // Check if the color belongs to the scale
                              
	              if (Intv > 0.1 && Ints > 0.75){
                  
	              	if (Inth > 0.1476){
	              		Intposition = 280.31*Math.pow(Inth,6) - 916.05*Math.pow(Inth,5) + 1142.6*Math.pow(Inth,4) - 709.95*Math.pow(Inth,3) + 234.65*Math.pow(Inth,2) - 40.27*Inth + 3.2217;
	              	}
                  
	              	if (Inth <= 0.1476 && Inth > 0.001){
	              		Intposition = 151.4*Math.pow(Inth,4) -49.32*Math.pow(Inth,3) + 6.753*Math.pow(Inth,2) -2.481*Inth + 0.9033;
	              	}
                  
	              	if (Inth <= 0.001){
	              		Intposition =   -0.005171*Math.pow(Intv,2) - 0.3282*Intv + 1.2236;
	              	}
	              }
              
	              if (Intposition < 0){
	              	Intposition = 0;
	              }
                  
                  //PGA
                  if (PGAv > 0.1 && PGAs > 0.75){
                  
	              	if (PGAh > 0.1476){
	              		PGAposition = 280.31*Math.pow(PGAh,6) - 916.05*Math.pow(PGAh,5) + 1142.6*Math.pow(PGAh,4) - 709.95*Math.pow(PGAh,3) + 234.65*Math.pow(PGAh,2) - 40.27*PGAh + 3.2217;
	              	}
                  
	              	if (PGAh <= 0.1476 && PGAh > 0.001){
	              		PGAposition = 151.4*Math.pow(PGAh,4) -49.32*Math.pow(PGAh,3) + 6.753*Math.pow(PGAh,2) -2.481*PGAh + 0.9033;
	              	}
                  
	              	if (PGAh <= 0.001){
	              		Intposition =   -0.005171*Math.pow(PGAv,2) - 0.3282*PGAv + 1.2236;
	              	}
	              }
              
	              if (PGAposition < 0){
	              	PGAposition = 0;
	              }

                  //console.log(`I:${Intposition}, P:${PGAposition}`)
                  // 最も近い色を選択
                  const intensity = 10*Intposition-3
                  const PGA = 10**(5*PGAposition-2)
                  if (newMaxInt < intensity) newMaxInt = intensity
                  RealTimeIntObj.push({ind: index, int: intensity, PGA, isfirstdetect: false, detecting: lastsecpoint?.detecting || false, detecttime: lastsecpoint?.detecttime, isineew: false})
                }
                operatedata(now.getTime())
            })
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

function returnIntDMDSS(int: EarthquakeInformation.Latest.IntensityClass | "!5-") {
    switch (int) {
        case '!5-': return 5.5
        case '5-': return 5
        case '5+': return 6
        case '6-': return 7
        case '6+': return 8
        case '7': return 9
        default: return Number(int)
    }
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
            sendData({type: 'read', text: `緊急地震速報。`, isforce: true})
            sendData({type: 'read', text: `${warnareanamestoread}では、強い揺れに警戒してください。`, isStack: true})
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

const EQInfoMemory: Map<string, EQINFOBase> = new Map();

const readingIntensity = [
    "0",
    "1",
    "2",
    "3",
    "4",
    "御弱",
    "誤凶",
    "6弱",
    "6凶",
    "7"
]

function EQInfo(data: EarthquakeInformation.Latest.Main) {
    const memory = EQInfoMemory.get(data.eventId)
    if (data.infoType === '取消') {

    }
    else if (data.type != '地震・津波に関するお知らせ') {
        const magnitudeText = (magnitude: Earthquake["magnitude"]) => {
            if (magnitude.value == null) {
                if (magnitude.condition == 'Ｍ不明') return `地震の規模は不明。`
                else return `地震の規模は、マグニチュード８を超える、巨大地震と推定されています。`
            }
            else return `地震の規模を示すマグニチュードは、${magnitude.value}と、推定されています。`
        }
        const tsunamiText = (tsunamitext?: string[]) => {
            if (!tsunamitext) return 'この地震による、津波の影響は不明です。'
            else if (tsunamitext.includes("0211")) return '現在、津波予報等を発表中です。'
            else if (tsunamitext.includes("0212")) return 'この地震により、若干の海面変動があるかもしれませんが、被害の心配はありません。'
            else if (tsunamitext.includes("0215")) return 'この地震による、津波の心配はありません。'
            else if (tsunamitext.includes("0217")) return '今後の情報に注意してください。'
            else return 'この地震による、津波の影響は不明です。'
        }
        const maxInt = (data.type === '震度速報' || data.type === '震源・震度に関する情報' || data.type === '長周期地震動に関する観測情報') ? (data.body.intensity?.maxInt ? returnIntDMDSS(data.body.intensity?.maxInt) : 0) : (memory?.maxInt || 0)
        let maxIntRegionLenght = memory?.maxIntRegionLenght || 0
        const originDate = new Date(data.type === '震源に関する情報' ? new Date(data.body.earthquake.originTime) : (data.targetDateTime || memory?.origintime || 0));
        const origintime = originDate.getTime()
        if (data.type === '震度速報') {
            let rname = ''
            const maxintRegions = data.body.intensity.regions.filter(r => returnIntDMDSS(r.maxInt) == maxInt)
            maxIntRegionLenght = maxintRegions.length
            maxintRegions.forEach(r => {
                rname += `${hypocenterReadingNames[hypocenterNames.findIndex(h => h == r.name)]}。`
            })
            rname = rname.slice(0, -1)
            sendData({type: 'sound', path: './audio/VXSE51.mp3'})
            if (!memory || memory.maxInt < returnIntDMDSS(data.body.intensity.maxInt) || memory.maxIntRegionLenght < maxIntRegionLenght) {
                sendData({type: 'read', text: `震度速報。`, isforce: true})
                sendData({type: 'read', text: `最大震度${readingIntensity[maxInt]}を。${rname}。で観測しました。`, isStack: true})
            }
        }
        else if (data.type === '震源に関する情報') {
            sendData({type: 'sound', path: './audio/VXSE52.mp3'})
            sendData({type: 'read', text: `震源に関する情報。`, isforce: true})
            sendData({type: 'read', text: `震源地は、${hypocenterReadingNames[hypocenterNames.findIndex(h => h == data.body.earthquake.hypocenter.name)]}。震源の深さは${data.body.earthquake.hypocenter.depth.value}キロ。${magnitudeText(data.body.earthquake.magnitude)}${tsunamiText(data.body.comments.forecast?.codes)}`, isStack: true})
        }
        else if (data.type === '震源・震度に関する情報') {
            sendData({type: 'sound', path: './audio/VXSE53.mp3'})
            sendData({type: 'read', text: `地震情報。`, isforce: true})
            sendData({type: 'read', text: `${originDate.getHours() >= 12 ? '午後' : '午前'}${originDate.getHours() - (originDate.getHours() >= 12 ? 12 : 0)}時${originDate.getMinutes()}分ごろ、最大震度${readingIntensity[maxInt]}を観測する地震がありました。`, isStack: true});
            sendData({type: 'read', text: `${tsunamiText(data.body.comments.forecast?.codes)}震源地は、${hypocenterReadingNames[hypocenterNames.findIndex(h => h == data.body.earthquake.hypocenter.name)]}。震源の深さは${data.body.earthquake.hypocenter.depth.value}キロ。${magnitudeText(data.body.earthquake.magnitude)}`, isStack: true})
        }
        const baseObject: EQINFOBase = {
            panelType: data.type == '震源に関する情報' || data.type == '震源・震度に関する情報' || memory?.hypocenter ? 1 : 0,
            infoType: (data.type == '震度速報' ? 0 : data.type == '震源に関する情報' ? 1 : 2),
            tsunami: data.body.comments.forecast?.codes.includes('0211') ? 5 : data.body.comments.forecast?.codes.includes('0212') ? 3 : data.body.comments.forecast?.codes.includes('0215') ? 0 : data.body.comments.forecast?.codes.includes('0217') ? 2 : 1,
            origintime: origintime || 0,
            maxInt,
            maxIntRegionLenght,
            hypocenter: data.type == '震源に関する情報' || data.type == '震源・震度に関する情報' ? {
                latitude: Number(data.body.earthquake.hypocenter.coordinate.latitude?.value || 0),
                longitude: Number(data.body.earthquake.hypocenter.coordinate.longitude?.value || 0),
                name: data.body.earthquake.hypocenter.name,
                depth: data.body.earthquake.hypocenter.depth.value == null ? -1 : Number(data.body.earthquake.hypocenter.depth.value),
                magnitude: data.body.earthquake.magnitude.value == null ? (data.body.earthquake.magnitude.condition == 'Ｍ不明' ? -1 : 88) : Number(data.body.earthquake.magnitude.value)
            } : memory?.hypocenter,
            regions: data.type == '震度速報' || data.type == '震源・震度に関する情報' ? data.body.intensity?.regions.map(r => {return {name: r.name, int: returnIntDMDSS(r.maxInt || '1')}}) || [] : (memory?.regions || []),
            points: data.type == '震源・震度に関する情報' ? data.body.intensity?.stations.map(r => {return {name: r.name, int: returnIntDMDSS(r.int || '1')}}) || [] : (memory?.points || []),
        }
        sendData({
            type: 'eqinfo',
            EventID: data.eventId,
            ...baseObject
        })
        EQInfoMemory.set(data.eventId, baseObject)
    } 
}

if (isReplay) {
    const ReplayEEWList: EEWInfo[] = []
    const ReplayEQInfoList: EarthquakeInformation.Latest.Main[] = []
    let lastrunningsec = -1
    setInterval(() => {
        const now = new Date()
        if (now.getSeconds() != lastrunningsec) {
           RealTimeQuake()
           ReplayEEWList.push(...EEWTest.filter(eew => new Date(eew.AnnouncedTime).getTime() == replayTimeRunning.getTime()))
           
           const eewdata = ReplayEEWList.shift()
           if (eewdata) EEW(eewdata)



            ReplayEQInfoList.push(...DMDSS_data.filter(eqinfo => new Date(eqinfo.pressDateTime).getTime() == replayTimeRunning.getTime()))
           
            const eqinfodata = ReplayEQInfoList.shift()
            if (eqinfodata) EQInfo(eqinfodata)
           

            replayTimeRunning.setSeconds(replayTimeRunning.getSeconds()+1)

            lastrunningsec = now.getSeconds()
        }
    }, 10);
}
else {
    function CreateEEWConnection() {
      const ws = new WebSocket('wss://ws-api.wolfx.jp/jma_eew');
      
      // 接続が開かれたときのイベントハンドラ
      ws.addEventListener('open', (event) => {
        console.log('[EEW Manager] WebSocket connected!');
      });
      
      // 接続が閉じられたときのイベントハンドラ
      ws.addEventListener('close', (event) => {
        console.log('[EEW Manager] Connection lost, trying to reconnect...');
        CreateEEWConnection()
      });
      
      // なんか来たとき
      ws.addEventListener('message', (event) => {
        const info: EEWInfo = JSON.parse(event.data.toString());
        if (info.type == 'jma_eew') EEW(info)
      });
    }

    setInterval(() => {
        RealTimeQuake()
    }, 1000);

    CreateEEWConnection()
}
