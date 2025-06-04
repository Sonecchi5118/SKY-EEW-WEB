export type ServerData = 
{
    type: 'read',
    text: string;
}[]

/** ex: 2024-10-13T02:08:30+0900 */
export type Timestamp = `${number}${number}${number}${number}-${number}${number}-${number}${number}T${number}${number}:${number}${number}:${number}${number}+0900`;
