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

    const phase1Start = new Date("2024-04-16T10:00:00Z")
    const phase1End = new Date("2024-04-16T11:00:00Z")
    const phase2Start = new Date("2024-04-16T11:00:00Z")
    const phase2End = new Date("2024-04-16T12:00:00Z")

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
            price:toNano(4.5),
        },
        {
            $$type:"NftPhaseConfig",
            startDate:convertDateFromTs(phase2Start),
            endDate:convertDateFromTs(phase2End),
            price:toNano(6),
        },
        convertMapToWhiteList(),
        BigInt(2000)
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
