import {address, Address, toNano} from '@ton/core';
import {NetworkProvider} from "@ton/blueprint";
import { Checkin } from '../wrappers/Checkin';
import {checkInContract} from "../contest/contractConifg";


// Contract : EQAYSJrkETA-4gHDKk0po_eZ18iuk-fi2E1OgOiWmfpDDat5

export async function run(provider: NetworkProvider, args: string[]) {
    const ui = provider.ui();
    const _address = Address.parse(checkInContract.testnet);
    const walletAddress = await ui.input('Target Wallet')
    if (!(await provider.isContractDeployed(_address))) {
        ui.write(`Error: Contract at address ${_address} is not deployed!`);
        return;
    }
    const checkin = provider.open(Checkin.fromAddress(_address));
    let count = await checkin.getCheckInCount(address(walletAddress));
    console.log({
        walletAddress,
        count: Number(count)
    })
    ui.clearActionPrompt();
}


// export async function run(provider: NetworkProvider, args: string[]) {
//     console.log("Suspended.")
// }
