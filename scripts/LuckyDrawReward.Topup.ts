import {NetworkProvider} from "@ton/blueprint";
import {LuckyDrawReward} from "../build/LuckyDrawReward/tact_LuckyDrawReward";
import {Address, toNano} from "@ton/core";
import {luckyDrawRewardContract} from "../contest/contractConifg";
import {getSignature_LuckyDrawReward} from "./LuckyDrawReward.Claim";

export async function run(provider: NetworkProvider) {
    const owner = provider.sender().address;
    const luckyDrawReward = provider.open(LuckyDrawReward.fromAddress(Address.parse(luckyDrawRewardContract[provider.network()])));

    // const contractBalance = await luckyDrawReward.getBalance()
    // console.log({contractBalance})
    const amount = await provider.ui().input('Topup Amount')
   await provider.sender().send({
       value: toNano(amount),
       to:Address.parse(luckyDrawRewardContract[provider.network()]),
       bounce:false
   })
}
