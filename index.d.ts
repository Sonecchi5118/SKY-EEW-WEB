export type ServerData = 
{
    type: 'read',
    text: string;
} | {
    type: 'realtimequake',
    data: Array<{ind: number; int: number;}>;
}

/** ex: 2024-10-13T02:08:30+0900 */
export type Timestamp = `${number}${number}${number}${number}-${number}${number}-${number}${number}T${number}${number}:${number}${number}:${number}${number}+0900`;
