import {address, Address, toNano} from '@ton/core';
import {NetworkProvider} from "@ton/blueprint";
import {Checkin} from "../build/Checkin/tact_Checkin";
import {checkInContract} from "../contest/contractConifg";


// Wallet : EQDT0o8INIZYa3lOogMWjvMjqKmL2f7_wy3aC78rGRCewSQq
// 用Bizz ID 去追踪是否已經簽到
export async function run(provider: NetworkProvider, args: string[]) {
    const ui = provider.ui();
    const _address = Address.parse(checkInContract[provider.network()]);
    const bizzNumber = await ui.input('Bizz Number')
    if (!(await provider.isContractDeployed(_address))) {
        ui.write(`Error: Contract at address ${_address} is not deployed!`);
        return;
    }
    const checkin = provider.open(Checkin.fromAddress(_address));
    let signer = await checkin.getGetBizzSigner(BigInt(+bizzNumber));
    console.log({
        bizzNumber,
        signer
    })
    ui.clearActionPrompt();
}
