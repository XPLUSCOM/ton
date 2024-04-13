import {NetworkProvider} from "@ton/blueprint";
import {Inventory} from "../build/Inventory/tact_Inventory";
import {Address, beginCell, toNano} from "@ton/core";
import {mnemonicToWalletKey, sign} from "@ton/crypto";
import {relayer} from "../contest/demoWallet";
import {inventoryContract} from "../contest/contractConifg";


export interface IStakingTable{
    [key:number]:string
}

export async function getSignature_Inventroy(seqno:bigint,ownerAddress:Address,nftIndex:bigint):Promise<Buffer>{
    let par = await mnemonicToWalletKey(relayer.mnemonics.split(' '))
    let secretKey = par.secretKey
    let hash = beginCell()
        .storeUint(seqno,32)
        .storeAddress(ownerAddress)
        .storeUint(nftIndex,32).endCell().hash()
    const signature = sign(hash,secretKey)
    return signature
}

export async function run(provider: NetworkProvider) {
    const owner = provider.sender().address;
    const inventory = provider.open(Inventory.fromAddress(Address.parse(inventoryContract[provider.network()])));
    const stakingList = await inventory.getGetStakingRecord(owner!)
    if(stakingList === null){
        console.log("No Staking Record for this Address.")
        return
    }
    let table:IStakingTable = {};
    let keys = stakingList.nftList.keys()
    keys.map((x)=>{
        const address = stakingList.nftList.get(x)
        table[Number(x)] = address!.toString()
    })

    console.table(table)
    const input_nftIndex = await provider.ui().input('nftIndex')
    const seqno = BigInt(0)
    const nftIndex = BigInt(+input_nftIndex)
    const _signature = await getSignature_Inventroy(seqno,owner!,nftIndex)
    await inventory.send(
        provider.sender(),
        {
            value: toNano('0.2'),
        },
        {
            $$type: "WithdrawParams",
            signature: _signature,
            ownerAddress:owner!,
            seqno:seqno,
            nftIndex:nftIndex,
        }
    );

}
