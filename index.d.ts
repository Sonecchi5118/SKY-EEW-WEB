export type ServerData = 
{
    type: 'read',
    text: string;
} | {
    type: 'realtimequake',
    data: Array<{ind: number; int: number;}>;
    time: number;
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