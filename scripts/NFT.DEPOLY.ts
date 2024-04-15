import {Address, beginCell, toNano} from '@ton/core';

import {NetworkProvider} from '@ton/blueprint';
import {NftCollection} from "../wrappers/NFTCollect";
import {inventoryContract} from "../contest/contractConifg";
import {nftCollectionConfig} from "../contest/nftCollectionConfig";
import {convertDateFromTs} from "./util/dateTimeTools";
import {convertMapToWhiteList} from "./util/genWhiteList";



export async function run(provider: NetworkProvider) {
    const inventoryContractAddress = Address.parse(inventoryContract.testnet)
    const ui = provider.ui();
    console.log(provider.network())
    if (!(await provider.isContractDeployed(inventoryContractAddress))) {
        ui.write(`Error: Contract at address ${inventoryContractAddress} is not deployed!`);
        return;
    }
    const owner = Address.parse("UQAXOn9cwizFtr3P6krVPiwqVFvmWH8WeJfIc2Y_C6VkwoMh");
    const OFFCHAIN_CONTENT_PREFIX = 0x01;
    const string_first = nftCollectionConfig.metadataUrl; // Change to the content URL you prepared

    const phase1Start = new Date()
    const phase1End = new Date()
    phase1End.setMinutes(phase1End.getMinutes()+10)
    const phase2End = new Date()
    phase2End.setMinutes(phase2End.getMinutes()+20)

    let newContent = beginCell().storeInt(OFFCHAIN_CONTENT_PREFIX, 8).storeStringRefTail(string_first).endCell();
    const nftCollection = provider.open(await NftCollection.fromInit(
        owner!,
        inventoryContractAddress,
        newContent,
        {
            $$type: "RoyaltyParams",
            numerator: 350n, // 350n = 35%
            denominator: 1000n,
            destination: owner!,
        },
        {
            $$type:"NftPhaseConfig",
            startDate:convertDateFromTs(phase1Start),
            endDate:convertDateFromTs(phase1End),
            price:toNano(0.5),
        },
        {
            $$type:"NftPhaseConfig",
            startDate:convertDateFromTs(phase1End),
            endDate:convertDateFromTs(phase2End),
            price:toNano(1),
        },
        convertMapToWhiteList(),
        BigInt(3)
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
