import {address, Address, Cell, toNano, TupleItem, TupleReader} from '@ton/core';
import {NetworkProvider} from "@ton/blueprint";
import {Checkin} from "../build/Checkin/tact_Checkin";
import {checkInContract} from "../contest/contractConifg";
import axios from "axios";



// Wallet : EQDT0o8INIZYa3lOogMWjvMjqKmL2f7_wy3aC78rGRCewSQq
// 用Bizz ID 去追踪是否已經簽到

async function useTonApi(address:string, bizId:number){
    const hexId = `0x${bizId.toString(16)}`

    const res = await axios.post("https://toncenter.com/api/v3/runGetMethod",{
        address:address,
        method:"getBizzSigner",
        stack: [
            {
                "type": "num",
                "value": hexId
            }
        ]
    })

    if(res.data.stack[0].value.length > 0){
        let _item:TupleItem = {
            type: 'cell',
            cell: Cell.fromBase64(res.data.stack[0].value)
        }
        const source: TupleReader = new TupleReader([_item])


        console.log({address:source.readAddressOpt()})
    }else{
        console.log("Biz Not Used")
    }
}
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
    // await useTonApi(checkInContract[provider.network()],+bizzNumber)
    ui.clearActionPrompt();
}
