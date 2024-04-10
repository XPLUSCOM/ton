export function convertDateFromTs(date:Date):bigint{
    return BigInt(parseInt((date.getTime() / 1000).toFixed(0)))
}


export function convertDateFromContract(timestamp:BigInt):Date{
    const _date = new Date(Number(timestamp) * 1000);
    return _date
}
