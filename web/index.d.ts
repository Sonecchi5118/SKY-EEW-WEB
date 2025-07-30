export type ServerData = 
{
  type: 'read',
  text: string;
  isforce?: boolean;
} | {
  type: 'sound',
  path: string;
} | {
  type: 'realtimequake',
  data: Array<{ind: number; int: number; detecting: boolean; isfirstdetect: boolean; detecttime: number | undefined; isineew: boolean}>;
  time: number;
  maxInt: number;
  regions: {
    name: string;
    int: number;
  }[]
} | {
  type: 'realtimehypocenter',
  data: realtimequakeinfo[]
} | eewinfo

interface realtimequakeinfo {
  latitude: number;
  longitude: number;
  depth: number;
  begantime: number;
  epasedtime: number;
  maxint: number;
  opacity: number;
  index: number;
}

interface eewinfo {
  type: 'eewinfo',
  Delete: boolean;
  Cancel: boolean;
  isfirst: boolean;
  EventID: string;
  hypocenter: {
    x: number;
    y: number;
    Depth: number;
    name: string
  };
  time: number;
  assumedepicenter: boolean;
  serial: number;
  isfinal: boolean;
  isWarn: boolean;
  maxInt: number;
  iskarihypo: boolean;
  isLevel: boolean;
  isDeep: boolean;
  isOnepoint: boolean;
  isPLUM: boolean;
  magnitude: number;
  begantime: number;
}

/** ex: 2024-10-13T02:08:30+0900 */
export type Timestamp = `${number}${number}${number}${number}-${number}${number}-${number}${number}T${number}${number}:${number}${number}:${number}${number}+0900`;


export interface EEWInfo {
  readonly type?: 'jma_eew';
  readonly Title: string; 
  readonly CodeType: string;
  readonly Issue: {
    readonly Source: string;
    readonly Status: string;
  };
  readonly EventID: string;
  readonly Serial: number;
  readonly AnnouncedTime: string;
  readonly OriginTime: string;
  readonly Hypocenter: string;
  readonly Latitude: number;
  readonly Longitude: number;
  readonly Magunitude: number;
  readonly Depth: number;
  readonly MaxIntensity: string;
  readonly Accuracy: {
    readonly Epicenter: string;
    readonly Depth: string;
    readonly Magnitude: string;
  }
  readonly MaxIntChange: {
    readonly string: string;
    readonly Reason: string;
  }
  readonly WarnArea: areaInfo[]
  readonly isSea: boolean;
  readonly isTraining: boolean;
  readonly isAssumption: boolean;
  readonly isWarn: boolean;
  readonly isFinal: boolean;
  readonly isCancel: boolean;
  readonly OriginalText: string;
  readonly Pond: string;
}
  
interface areaInfo {
  readonly Chiiki: string;
  readonly Shindo1: string;
  readonly Shindo2: string;
  readonly Time: string;
  readonly Type: '警報' | '予報';
  readonly Arrive: string;
}

export interface EEWMemoryType {
  latestSerial: number;
  maxInt: number;
  maxintcalled: boolean;
  isOnepoint: boolean;
  isWarn: boolean;
  warnAreas: string[];
  hypocenter: {
    index: number;
    latitude: number;
    longitude: number;
    depth: number;
    called: boolean;
    name: string;
    magnitude: number;
  };
}

export interface EEWInfoType {
  Cancel: boolean;
  hypocentermarker: L.Marker;
  hypocenterdeepmarker: L.SVG;
  forecastcircle: {
    Pwave: L.Circle;
    Swave: L.Circle;
  };
  serial: number;
  isfinal: boolean;
  isWarn: boolean;
  maxInt: number;
  hypocenter: string;
  iskarihypo: boolean;
  isLevel: boolean;
  isDeep: boolean;
  isOnepoint: boolean;
  isPLUM: boolean;
  magnitude: number;
  depth: number;
  begantime: number;
  latitude: number;
  longitude: number;
}

export interface detectedquakeinfo {
  lat: number;
  lon: number;
  depth: number;
  time: number;
  firstdetectpoint: number|undefined;
  maxInt: number;
  matcheew: boolean;
  index: number;
}