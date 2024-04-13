import {Address, beginCell, toNano} from "@ton/core";
import {mnemonicToWalletKey, sign} from "@ton/crypto";
import {fake_relayer, relayer} from "../contest/demoWallet";
import {NetworkProvider} from "@ton/blueprint";
import {Inventory} from "../build/Inventory/tact_Inventory";
import {inventoryContract, luckyDrawRewardContract} from "../contest/contractConifg";
import {IStakingTable} from "./Inventroy.Withdraw";
import {LuckyDrawReward} from "../build/LuckyDrawReward/tact_LuckyDrawReward";

export async function getSignature_LuckyDrawReward(bizId:bigint,amount:bigint,receiver:Address):Promise<Buffer>{
    // bizId: Int as uint32;
    // amount:Int as uint32;
    // receiver:Address;

    let par = await mnemonicToWalletKey(relayer.mnemonics.split(' '))
    console.log({
        signature_signer_public_key: BigInt(`0x${par.publicKey.toString("hex")}`)
    })
    let secretKey = par.secretKey
    let hash = beginCell()
        .storeUint(bizId,32)
        .storeUint(amount,32)
        .storeAddress(receiver)
        .endCell().hash()
    const signature = sign(hash,secretKey)
    return signature
}


export async function run(provider: NetworkProvider) {
    const owner = provider.sender().address;
    const luckyDrawReward = provider.open(LuckyDrawReward.fromAddress(Address.parse(luckyDrawRewardContract[provider.network()])));

    const contractBalance = await luckyDrawReward.getBalance()
    console.log({contractBalance})
    const amount = await provider.ui().input('Claim Amount')
    const bizId = await provider.ui().input('bizId')
    const receiver = await provider.ui().input('Receiver Address')

    const contract_public_key = await luckyDrawReward.getPublicKey()
    console.log({contract_public_key})
    const _signature = await getSignature_LuckyDrawReward(BigInt(bizId),toNano(amount),Address.parse(receiver))


    await luckyDrawReward.send(
        provider.sender(),
        {
            value: toNano('0.1'),
        },
        {
            $$type: "ClaimParams",
            signature: _signature,
            bizId:BigInt(bizId),
            amount:toNano(amount),
            receiver:Address.parse(receiver)
        }
    );
}
