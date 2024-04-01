import {NetworkProvider, sleep} from "@ton/blueprint";
import {TonClient4} from "@ton/ton";
import {Address} from "@ton/core";

export async function waitSeqNoChange(provider: NetworkProvider, target: Address, previousSeqno: number) {
console.log(` - Waiting up to 45 seconds to confirm transaction`);
let successFlag:string|null = null;
for (let attempt = 0; attempt < 45; attempt++) {
await sleep(5000);
const seqnoAfter = await getSeqNo(provider, target);

        console.log({
            previousSeqno,
            seqnoAfter
        })
        if (seqnoAfter > previousSeqno) {
            // Try to get hash
            // const accountDetails = await (provider.api() as TonClient4).getAccount(seqnoAfter, target)
            // successFlag = accountDetails.account.last?.hash||null
            successFlag = 'ok'
            break;
        }
        ;
    }
    if (successFlag!==null) {
        console.log(` - Sent transaction done successfully`);
        return successFlag;
    } else {
        console.log(` - Sent transaction didn't go through`);
        return successFlag;
    }
}

export async function getSeqNo(provider: NetworkProvider, address: Address) {
    if (await provider.isContractDeployed(address)) {

        const lastBlock = (await (provider.api() as TonClient4).getLastBlock())
        let res = await (provider.api() as TonClient4).runMethod((lastBlock.last.seqno), address, 'seqno');
        return res.reader.readNumber();
    } else {
        return 0;
    }
}


