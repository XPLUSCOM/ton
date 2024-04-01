import {Address, beginCell, toNano} from '@ton/core';
import {Checkin, storeCheckInParams} from '../wrappers/Checkin';
import {NetworkProvider, sleep} from '@ton/blueprint';
import {TonClient, TonClient4} from "@ton/ton";
import _ from "lodash";
import {getSeqNo, waitSeqNoChange} from "./util/getHashBySeqno";
import {checkInContract} from "../contest/contractConifg";



export async function awaitConfirmation(fn: () => Promise<boolean>) {
    console.log(` - Waiting up to 45 seconds to confirm operation`);
    let successFlag = 0;
    for (let attempt = 0; attempt < 45; attempt++) {
        await sleep(1000);
        let res = false
        try {
            res = await fn()
        } catch {
        }

        if (res) {
            successFlag = 1
            break
        }
    }
    if (!successFlag) {
        console.log(` - Error confirming operation`);
        return false;
    }
    return true;
}


export async function run(provider: NetworkProvider, args: string[]) {

    console.log(provider.network())
    const ui = provider.ui();
    const address = Address.parse(checkInContract.testnet);
    if (!(await provider.isContractDeployed(address))) {
        ui.write(`Error: Contract at address ${address} is not deployed!`);
        return;
    }
    const checkin = provider.open(Checkin.fromAddress(address));
    // 獲得交互前的錢包紀錄 和 簽到次數
    let counterBefore = await checkin.getCheckInCount(provider.sender().address!);
    const seqno = await getSeqNo(provider, provider.sender().address!);
    // Find a unused Bizz
    let bizz: bigint
    do {
        bizz = BigInt(_.random(1, 9999999999))
    } while (await checkin.getGetBizzSigner(bizz) !== null);

    console.log({
        bizz: Number(bizz)
    })
    // 發送交互,
    // bounce : true -> 失敗回滾機制 ,
    // value : 轉帳數目, 需要大於gas fee, 否則交易失敗
    const tx = await checkin.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: 'CheckInParams',
            bizz: bizz
        }
    );


    //檢查 Transition已送出
    if (await waitSeqNoChange(provider, provider.sender().address!, seqno)) {
        //檢查 合約中簽到已完成
        if (await awaitConfirmation(async () => {

            // Check Bizz
            const bizzSigner = await checkin.getGetBizzSigner(bizz);
            console.log({
                bizzSigner,
                signer: provider.sender().address!,
                checking: bizzSigner !== null && bizzSigner.equals(provider.sender().address!)
            })

            // Check Count Update
            if (bizzSigner !== null && bizzSigner.equals(provider.sender().address!)) {
                let counterAfter = await checkin.getCheckInCount(provider.sender().address!);

                console.log({
                    counterAfter,
                    counterBefore
                })
                if (counterBefore === null) {
                    return Number(counterAfter) === 1
                } else {
                    return Number(counterBefore) < Number(counterAfter)
                }
            } else {
                return false
            }
        })) {
            console.log(` - Successfully confirmed tx`)
        } else {
            console.log(` - Error confirming tx`)
        }
    }
}
