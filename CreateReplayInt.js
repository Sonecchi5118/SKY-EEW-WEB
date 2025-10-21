import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";
import { NIEDrealTimePointLocation } from "./data.js";

const IntPopupInterval = 1

const IntensityCalculationInterval = 60//震度の計算頻度(内部計算用)

/**@type {({type: 'k'; name: string} | {type: 'kik'; name: string})[]} */
const FilePaths = []
for (const name of fs.readdirSync('./ReplayData/k-net').filter(file => path.extname(file) === '.EW')) {
    FilePaths.push({type: 'k', name: name.slice(0, -3)})
}
for (const name of fs.readdirSync('./ReplayData/kik-net').filter(file => path.extname(file) === '.EW2')) {
    FilePaths.push({type: 'kik', name: name.slice(0, -4)})
}

const vectors = [
    'EW',
    'NS',
    'UD'
]

/**
 * 
 * @param {string} filePath 
 * @returns 
 */
const extractMemoNumbers = async (filePath) => {
    const fileStream = fs.createReadStream(filePath);

    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    const memoNumbers = [];
    let isMemoSection = false;

    for await (const line of rl) {
        if (line.trim() === 'Memo.') {
            isMemoSection = true;
            continue;
        }

        if (isMemoSection) {
            const numbers = line.trim().split(/\s+/).map(Number);
            memoNumbers.push(...numbers);
        }
    }

    return memoNumbers;
};

const f0 = 0.45;
const f1 = 7.0;
const f2 = 0.5;
const f3 = 12.0;
const f4 = 20.0;
const f5 = 30.0;
const h2a = 1.0;
const h2b = 0.75;
const h3 = 0.9;
const h4 = 0.6;
const h5 = 0.6;
const g = 1.262

let F1HistoryX = {NS: [0, 0, 0], EW: [0, 0, 0], UD: [0, 0, 0]}
let F1HistoryY = {NS: [0, 0, 0], EW: [0, 0, 0], UD: [0, 0, 0]}

let F2HistoryX = {NS: [0, 0, 0], EW: [0, 0, 0], UD: [0, 0, 0]}
let F2HistoryY = {NS: [0, 0, 0], EW: [0, 0, 0], UD: [0, 0, 0]}

let F3HistoryX = {NS: [0, 0, 0], EW: [0, 0, 0], UD: [0, 0, 0]}
let F3HistoryY = {NS: [0, 0, 0], EW: [0, 0, 0], UD: [0, 0, 0]}

let F4HistoryX = {NS: [0, 0, 0], EW: [0, 0, 0], UD: [0, 0, 0]}
let F4HistoryY = {NS: [0, 0, 0], EW: [0, 0, 0], UD: [0, 0, 0]}

let F5HistoryX = {NS: [0, 0, 0], EW: [0, 0, 0], UD: [0, 0, 0]}
let F5HistoryY = {NS: [0, 0, 0], EW: [0, 0, 0], UD: [0, 0, 0]}

let F6HistoryX = {NS: [0, 0, 0], EW: [0, 0, 0], UD: [0, 0, 0]}
let F6HistoryY = {NS: [0, 0, 0], EW: [0, 0, 0], UD: [0, 0, 0]}

let galsList = Array(6000).fill(0)
let data3index = 0

let calculationnumber = 0

/**
 * 
 * @param {{x: number, y: number, z: number}} accelerationData 
 * @param {number} ΔT 
 * @returns {number}
 */
const calculateSeismicIntensity = (accelerationData, ΔT = 0.01) => {
    calculationnumber++;
    //A11演算
    let wa1 = 2*Math.PI *f0
    let wa2 = 2*Math.PI *f1
    let a0 = 8/(ΔT**2) + (4*wa1 + 2*wa2)/ΔT + wa1*wa2
    let a1 = 2*wa1*wa2 -16/(ΔT**2)
    let a2 = 8/(ΔT**2) - (4*wa1 + 2*wa2)/ΔT + wa1*wa2
    let b0 = 4/(ΔT**2) + 2*wa2/ΔT
    let b1 = -8/(ΔT**2)
    let b2 = 4/(ΔT**2) - 2*wa2/ΔT
    //console.log(wa1)
    //console.log(wa2)
    //console.log(a0)
    //console.log(a1)
    //console.log(a2)
    //console.log(b0)
    //console.log(b1)
    //console.log(b2)

    //A11-A15
    for (const vector of vectors) {
        F1HistoryX[vector][0] = F1HistoryX[vector][1]
        F1HistoryX[vector][1] = F1HistoryX[vector][2]
        F1HistoryX[vector][2] = accelerationData[vector]

        F1HistoryY[vector][0] = F1HistoryY[vector][1]
        F1HistoryY[vector][1] = F1HistoryY[vector][2]

        F1HistoryY[vector][2] = (-a1*F1HistoryY[vector][1] -a2*F1HistoryY[vector][0] + b0*F1HistoryX[vector][2] + b1*F1HistoryX[vector][1] + b2*F1HistoryX[vector][0])/a0
    }
    //console.log(F1HistoryX)
    //console.log(F1HistoryY)

    //A12演算
    let wa3 = 2*Math.PI *f1
    a0 = 16/(ΔT**2) + 17*wa3/ΔT + wa3**2
    a1 = 2*(wa3**2) -32/(ΔT**2)
    a2 = 16/(ΔT**2) - 17*wa3/ΔT + wa3**2
    b0 = 4/(ΔT**2) + 8.5*wa2/ΔT + wa3**2
    b1 = 2*(wa3**2) -8/(ΔT**2)
    b2 = 4/(ΔT**2) - 8.5*wa2/ΔT + wa3**2

    //console.log(wa3)
    //console.log(a0)
    //console.log(a1)
    //console.log(a2)
    //console.log(b0)
    //console.log(b1)
    //console.log(b2)
    //A12-A15
    for (const vector of vectors) {
        F2HistoryX[vector][0] = F2HistoryX[vector][1]
        F2HistoryX[vector][1] = F2HistoryX[vector][2]
        F2HistoryX[vector][2] = F1HistoryY[vector][2]//A11フィルタの結果を使用

        F2HistoryY[vector][0] = F2HistoryY[vector][1]
        F2HistoryY[vector][1] = F2HistoryY[vector][2]

        F2HistoryY[vector][2] = (-a1*F2HistoryY[vector][1] -a2*F2HistoryY[vector][0] + b0*F2HistoryX[vector][2] + b1*F2HistoryX[vector][1] + b2*F2HistoryX[vector][0])/a0
    }
    //console.log(F2HistoryX)
    //console.log(F2HistoryY)

    //A13演算
    let wb = 2*Math.PI *f2
    a0 = 12/(ΔT**2) +12*h2b*wb/ΔT +wb**2
    a1 = 10*(wb**2) -24/(ΔT**2)
    a2 = 12/(ΔT**2) -12*h2b*wb/ΔT +wb**2
    b0 = 12/(ΔT**2) +12*h2a*wb/ΔT +wb**2
    b1 = 10*(wb**2) -24/(ΔT**2)
    b2 = 12/(ΔT**2) -12*h2a*wb/ΔT +wb**2
    
    //console.log(wb)
    //console.log(a0)
    //console.log(a1)
    //console.log(a2)
    //console.log(b0)
    //console.log(b1)
    //console.log(b2)
    //A13-A15
    for (const vector of vectors) {
        F3HistoryX[vector][0] = F3HistoryX[vector][1]
        F3HistoryX[vector][1] = F3HistoryX[vector][2]
        F3HistoryX[vector][2] = F2HistoryY[vector][2]//A12フィルタの結果を使用

        F3HistoryY[vector][0] = F3HistoryY[vector][1]
        F3HistoryY[vector][1] = F3HistoryY[vector][2]

        F3HistoryY[vector][2] = (-a1*F3HistoryY[vector][1] -a2*F3HistoryY[vector][0] + b0*F3HistoryX[vector][2] + b1*F3HistoryX[vector][1] + b2*F3HistoryX[vector][0])/a0
    }
    //console.log(F2HistoryY.UD[2])
    //console.log(F3HistoryX)
    //console.log(F3HistoryY)

    //A14演算(4)
    let wc = 2*Math.PI*f3
    a0 = 12/(ΔT**2) +12*h3*wc/ΔT +(wc**2)
    a1 = 10*(wc**2) -24/(ΔT**2)
    a2 = 12/(ΔT**2) -12*h3*wc/ΔT +(wc**2)
    b0 = wc**2
    b1 = 10*(wc**2)
    b2 = wc**2
    //A14(4)-A15
    for (const vector of vectors) {
        F4HistoryX[vector][0] = F4HistoryX[vector][1]
        F4HistoryX[vector][1] = F4HistoryX[vector][2]
        F4HistoryX[vector][2] = F3HistoryY[vector][2]//A13フィルタの結果を使用

        F4HistoryY[vector][0] = F4HistoryY[vector][1]
        F4HistoryY[vector][1] = F4HistoryY[vector][2]

        F4HistoryY[vector][2] = (-a1*F4HistoryY[vector][1] -a2*F4HistoryY[vector][0] + b0*F4HistoryX[vector][2] + b1*F4HistoryX[vector][1] + b2*F4HistoryX[vector][0])/a0
    }
    //console.log(F4HistoryX)
    //console.log(F4HistoryY)

    //A14演算(5)
    wc = 2*Math.PI*f4
    a0 = 12/(ΔT**2) +12*h4*wc/ΔT +(wc**2)
    a1 = 10*(wc**2) -24/(ΔT**2)
    a2 = 12/(ΔT**2) -12*h4*wc/ΔT +(wc**2)
    b0 = wc**2
    b1 = 10*(wc**2)
    b2 = wc**2
    //A14(5)-A15
    for (const vector of vectors) {
        F5HistoryX[vector][0] = F5HistoryX[vector][1]
        F5HistoryX[vector][1] = F5HistoryX[vector][2]
        F5HistoryX[vector][2] = F4HistoryY[vector][2]//A13フィルタの結果を使用

        F5HistoryY[vector][0] = F5HistoryY[vector][1]
        F5HistoryY[vector][1] = F5HistoryY[vector][2]

        F5HistoryY[vector][2] = (-a1*F5HistoryY[vector][1] -a2*F5HistoryY[vector][0] + b0*F5HistoryX[vector][2] + b1*F5HistoryX[vector][1] + b2*F5HistoryX[vector][0])/a0
    }
    //console.log(wc)
    //console.log(a0)
    //console.log(a1)
    //console.log(a2)
    //console.log(b0)
    //console.log(b1)
    //console.log(b2)
    //console.log(F5HistoryX)
    //console.log(F5HistoryY)

    //A14演算(6)
    wc = 2*Math.PI*f5
    a0 = 12/(ΔT**2) +12*h5*wc/ΔT +(wc**2)
    a1 = 10*(wc**2) -24/(ΔT**2)
    a2 = 12/(ΔT**2) -12*h5*wc/ΔT +(wc**2)
    b0 = wc**2
    b1 = 10*(wc**2)
    b2 = wc**2
    //A14(6)-A15
    for (const vector of vectors) {
        F6HistoryX[vector][0] = F6HistoryX[vector][1]
        F6HistoryX[vector][1] = F6HistoryX[vector][2]
        F6HistoryX[vector][2] = F5HistoryY[vector][2]//A13フィルタの結果を使用

        F6HistoryY[vector][0] = F6HistoryY[vector][1]
        F6HistoryY[vector][1] = F6HistoryY[vector][2]

        F6HistoryY[vector][2] = (-a1*F6HistoryY[vector][1] -a2*F6HistoryY[vector][0] + b0*F6HistoryX[vector][2] + b1*F6HistoryX[vector][1] + b2*F6HistoryX[vector][0])/a0
    }
    //console.log(F6HistoryX)
    //console.log(F6HistoryY)

    //A16演算
    const AdjustmentValue = {
        EW: F6HistoryY.EW[2]*g,
        NS: F6HistoryY.NS[2]*g,
        UD: F6HistoryY.UD[2]*g
    } 
    //console.log(AdjustmentValue)

    const mixdata = Math.sqrt(AdjustmentValue.EW**2 + AdjustmentValue.NS**2 + AdjustmentValue.UD**2)
    //console.log(mixdata)
    data3index = data3index%(IntensityCalculationInterval/ΔT) +1
    //console.log(data3index)
    galsList[data3index] = mixdata
    //console.log(galsList.slice(0, 100))

    let a = 1000
    let halfValue = 1000
    function giveT(a) {
        return galsList.filter(gal => gal >= a).length*ΔT
    }
    let t = giveT(a)
    //console.log(t)
    let MaxGal = 0
    for (const gal of galsList) {
        if (gal > MaxGal) MaxGal= gal
    }
    //console.log(giveT(0.5))
    if (giveT(0.006) > 0.3) {
        while (Math.abs(0.3 - t) > 0.001) {
            if (t < 0.3) a = a-halfValue
            else a = a+halfValue
            halfValue = halfValue/2
            t = giveT(a)
            //console.log(a)
            //console.log(t)
        }
    }
    else a = 0.006

    //console.log(`求めるaの値は: ${a}`);
    
    // 震度計算
    const intensity = a < 0 ? -3 : Math.max(2 * Math.log10(a) + 0.94, -3)
    //console.log(intensity)

    return intensity
};

/**
 * 
 * @param {Array<any>} array 
 * @param {number} chunkSize 
 * @returns 
 */
const chunkArray = (array, chunkSize) => {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
        chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
};




const newObject = {};
console.log(`ファイルの変換を開始します`)
for (let i = 0; i < FilePaths.length; i++) {
    const filepaths = FilePaths[i];
    F1HistoryX = {NS: [0, 0, 0], EW: [0, 0, 0], UD: [0, 0, 0]}
    F1HistoryY = {NS: [0, 0, 0], EW: [0, 0, 0], UD: [0, 0, 0]}
    
    F2HistoryX = {NS: [0, 0, 0], EW: [0, 0, 0], UD: [0, 0, 0]}
    F2HistoryY = {NS: [0, 0, 0], EW: [0, 0, 0], UD: [0, 0, 0]}
    
    F3HistoryX = {NS: [0, 0, 0], EW: [0, 0, 0], UD: [0, 0, 0]}
    F3HistoryY = {NS: [0, 0, 0], EW: [0, 0, 0], UD: [0, 0, 0]}
    
    F4HistoryX = {NS: [0, 0, 0], EW: [0, 0, 0], UD: [0, 0, 0]}
    F4HistoryY = {NS: [0, 0, 0], EW: [0, 0, 0], UD: [0, 0, 0]}
    
    F5HistoryX = {NS: [0, 0, 0], EW: [0, 0, 0], UD: [0, 0, 0]}
    F5HistoryY = {NS: [0, 0, 0], EW: [0, 0, 0], UD: [0, 0, 0]}
    
    F6HistoryX = {NS: [0, 0, 0], EW: [0, 0, 0], UD: [0, 0, 0]}
    F6HistoryY = {NS: [0, 0, 0], EW: [0, 0, 0], UD: [0, 0, 0]}
    
    galsList = Array(6000).fill(0)
    data3index = 0
    
    calculationnumber = 0

    /**@type {{EW: number[], NS: number[], UD: number[]}} */
    const gals = {
        EW: [],
        NS: [],
        UD: []
    }
    const EW1path =  `./ReplayData/${filepaths.type == 'kik' ? 'kik-net' : 'k-net'}/${filepaths.name}.EW${filepaths.type == 'kik' ? '2' : ''}`
    const EW1 = fs.readFileSync(EW1path, 'utf-8')
    const line = EW1.split('\n')
    const latitude = Number(line[6].slice(18))
    const longitude = Number(line[7].slice(18))
    //console.log(line[9])
    const RecordStartTime = new Date(line[9].slice(18, 28).replace(/\//g, '-') + "T" + line[9].slice(29) + "+0900")
    const Hz = Number(line[10].slice(18, -2))
    for (const vector of vectors) {
        const filepath = `./ReplayData/${filepaths.type == 'kik' ? 'kik-net' : 'k-net'}/${filepaths.name}.${vector}${filepaths.type == 'kik' ? '2' : ''}`
        const file = fs.readFileSync(filepath, 'utf-8')
        const line = file.split('\n')
        const ScaleFactor = line[13].slice(18).split('(gal)/')
        //console.log(line[13])
        const data = await extractMemoNumbers(filepath)
        for (const gal of data) {
            if (!Number.isNaN(gal) && !Number.isNaN(ScaleFactor[0]) && !Number.isNaN(ScaleFactor[1])) gals[vector].push(gal*Number(ScaleFactor[0])/Number(ScaleFactor[1]))
            //console.log(gal*Number(averagegal[0])/Number(averagegal[1])-averagegal)
        }
        //平均加速度を求める
        const averagegal = (gals[vector][0] + gals[vector][1] + gals[vector][2])/3
        for (let index = 0; index < gals[vector].length; index++) {
            gals[vector][index]-=averagegal
        }
    }
    
    //console.log(gals)
    const newgals = []
    for (let index = 0; index < gals.EW.length; index++) {
        const EW = gals.EW[index];
        const NS = gals.NS[index];
        const UD = gals.UD[index];
        newgals.push({EW, NS, UD})
    }

    /**@type {{Time: number; Intensity: number; PGA: number}[]} */
    const IntList = []
    const IL = []
    const PGAL = []
    for (let index = 0; index < newgals.length; index++) {
        const newgal = newgals[index];
        IL.push(calculateSeismicIntensity(newgal, 1/Hz))
        PGAL.push(Math.sqrt(newgal.EW**2+newgal.NS**2+newgal.UD**2))
    }
    //console.log(IL.length)
    const chunk = chunkArray(IL, Hz*IntPopupInterval)
    const chunk2 = chunkArray(PGAL, Hz*IntPopupInterval)
    for (let index = 0; index < chunk.length; index++) {
        const gals = chunk[index];
        let sum = 0
        for (const gal of gals) {
            sum += gal
        }

        const PGAs = chunk2[index];
        let sum2 = 0
        for (const PGA of PGAs) {
            sum2 += PGA
        }
        const RecTime = new Date(RecordStartTime);
        RecTime.setSeconds(RecTime.getSeconds() + index*IntPopupInterval -15)
        IntList.push({Time: RecTime.getTime(), Intensity: Math.round(sum/gals.length*10)/10, PGA: Math.round(sum2/PGAs.length*100)/100})
    }

    const index = NIEDrealTimePointLocation.findIndex(loc => loc.y == latitude && loc.x == longitude)
    //console.log(latitude)
    //console.log(longitude)
    newObject[index] =IntList

    console.log(`${i+1}ファイル目変換終了（${Math.round((i+1)/FilePaths.length*1000)/10}%）  残り${FilePaths.length-i-1}ファイル`)
}
const newContent = `export const ReplayIntData: {[key: string]: {Time: number, Intensity: number, PGA: number}[]} = ${JSON.stringify(newObject)};`;
fs.writeFileSync('ReplayIntData.ts', newContent, 'utf-8');
