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
  data: Array<{ind: number; int: number; detecting: boolean; isfirstdetect: boolean; detecttime: number | undefined}>;
  time: number;
} | {
  type: 'eewinfo',
  isfirst: boolean;
  EventID: string;
  hypocenter: {
    x: number;
    y: number;
    Depth: number;
  };
  time: number;
  assumedepicenter: boolean;
} | {
  type: 'realtimehypocenter',
  latitude: number;
  longitude: number;
  depth: number;
  begantime: number;
  epasedtime: number;
  maxint: number;
  index: number;
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
  isWarn: boolean;
  warnAreas: string[];
  hypocenter: {
    index: number;
    latitude: number;
    longitude: number;
    depth: number;
  }
}

export interface EEWInfoType {
  hypocentermarker: L.Marker
  forecastcircle: {
    Pwave: L.Circle;
    Swave: L.Circle;
  }
}

export interface detectedquakeinfo {
  lat: number;
  lon: number;
  depth: number;
  time: number;
  firstdetectpoint: number|undefined;
  maxInt: number;
  index: number;
}