import {address, Address, toNano} from '@ton/core';
import {NetworkProvider} from "@ton/blueprint";
import { Checkin } from '../wrappers/Checkin';
import {checkInContract} from "../contest/contractConifg";


export interface IRecordTable{
    [key:string]:string
}

// Contract : EQAYSJrkETA-4gHDKk0po_eZ18iuk-fi2E1OgOiWmfpDDat5

export async function run(provider: NetworkProvider, args: string[]) {
    const ui = provider.ui();

    const _address = Address.parse(checkInContract[provider.network()]);
    if (!(await provider.isContractDeployed(_address))) {
        ui.write(`Error: Contract at address ${_address} is not deployed!`);
        return;
    }
    const checkin = provider.open(Checkin.fromAddress(_address));
    let countList = await checkin.getAllCheckInRecord();


    let keys = countList.keys()
    let count = 0
    keys.map((x)=>{
        const _count = countList.get(x)
        count = count + Number(_count)
    })
    // console.table(table)
    console.log({
        addressCount: keys.length,
        TranstionCount : count
    })

    ui.clearActionPrompt();
}


// export async function run(provider: NetworkProvider, args: string[]) {
//     console.log("Suspended.")
// }
