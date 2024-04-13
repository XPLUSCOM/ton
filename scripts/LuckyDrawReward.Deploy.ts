import {NetworkProvider} from "@ton/blueprint";
import {fund_wallet, relayer} from "../contest/demoWallet";
import {Inventory} from "../build/Inventory/tact_Inventory";
import {Address, toNano} from "@ton/core";
import {getRelayerPublicKey} from "./Inventroy.DEPOLY";
import {LuckyDrawReward} from "../build/LuckyDrawReward/tact_LuckyDrawReward";

export async function run(provider: NetworkProvider) {

    const owner = provider.sender().address;
    const publicKey = await getRelayerPublicKey(relayer.mnemonics.split(' '))
    console.log(publicKey)
    const fundWalletAddress =  Address.parse(fund_wallet.address)
    const luckyDrawClaimContract = provider.open(await LuckyDrawReward.fromInit(
        publicKey,
        fundWalletAddress
    ));
    console.log(provider.network())
    await luckyDrawClaimContract.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: 'Deploy',
            queryId: 0n,
        }
    );

    await provider.waitForDeploy(luckyDrawClaimContract.address);
}
