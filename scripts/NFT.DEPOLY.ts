import {Address, beginCell, toNano} from '@ton/core';

import {NetworkProvider} from '@ton/blueprint';
import {NftCollection} from "../wrappers/NFTCollect";
import {inventoryContract} from "../contest/contractConifg";



export async function run(provider: NetworkProvider) {
    const inventoryContractAddress = Address.parse(inventoryContract.testnet)
    const ui = provider.ui();
    console.log(provider.network())
    if (!(await provider.isContractDeployed(inventoryContractAddress))) {
        ui.write(`Error: Contract at address ${inventoryContractAddress} is not deployed!`);
        return;
    }
    const owner = provider.sender().address;
    const OFFCHAIN_CONTENT_PREFIX = 0x01;
    const string_first = "https://s.getgems.io/nft-staging/c/628f6ab8077060a7a8d52d63/"; // Change to the content URL you prepared

    let newContent = beginCell().storeInt(OFFCHAIN_CONTENT_PREFIX, 8).storeStringRefTail(string_first).endCell();
    const nftCollection = provider.open(await NftCollection.fromInit(
        owner!,
        inventoryContractAddress
        ,
        newContent,
        {
            $$type: "RoyaltyParams",
            numerator: 350n, // 350n = 35%
            denominator: 1000n,
            destination: owner!,
        }
    ));

    await nftCollection.send(
        provider.sender(),
        {
            value: toNano('0.15'),
        },
        {
            $$type: 'Deploy',
            queryId: 0n,
        }
    );

    await provider.waitForDeploy(nftCollection.address);
}
