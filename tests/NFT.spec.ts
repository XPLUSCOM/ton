import {Blockchain, SandboxContract, TreasuryContract} from '@ton/sandbox';
import {Address, address, beginCell, toNano} from '@ton/core';

import '@ton/test-utils';
import _ from "lodash";
import {Inventory} from "../wrappers/Inventroy";
import {getRelayerPublicKey} from "../scripts/Inventroy.DEPOLY";
import {NftCollection} from "../wrappers/NFTCollect";
import {NftItem} from "../wrappers/NFTItem";
import {getSignature, IStakingTable} from "../scripts/Inventroy.Withdraw";

describe('Checkin', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let userA: SandboxContract<TreasuryContract>;
    let userB: SandboxContract<TreasuryContract>;
    let inventory: SandboxContract<Inventory>;
    let nftCollection : SandboxContract<NftCollection>
    let nftItem : SandboxContract<NftItem>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        const pbKey = await getRelayerPublicKey()

        deployer = await blockchain.treasury('deployer');
        userA = await blockchain.treasury('userA');
        userB = await blockchain.treasury('userB');
        inventory = blockchain.openContract(await Inventory.fromInit(pbKey));

        let deployResult = await inventory.send(
            deployer.getSender(),
            {
                value: toNano('0.5'),
            },
            {
                $$type: 'Deploy',
                queryId: 0n,
            }
        );

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: inventory.address,
            deploy: true,
            success: true,
        });
        const OFFCHAIN_CONTENT_PREFIX = 0x01;
        const string_first = "https://s.getgems.io/nft-staging/c/628f6ab8077060a7a8d52d63/"; // Change to the content URL you prepared

        let newContent = beginCell().storeInt(OFFCHAIN_CONTENT_PREFIX, 8).storeStringRefTail(string_first).endCell();

        nftCollection = blockchain.openContract(await NftCollection.fromInit( deployer.address,
            inventory.address
            ,
            newContent,
            {
                $$type: "RoyaltyParams",
                numerator: 350n, // 350n = 35%
                denominator: 1000n,
                destination: deployer.address,
            })
        )

        deployResult = await nftCollection.send(
            deployer.getSender(),
            {
                value: toNano('0.5'),
            },
            {
                $$type: 'Deploy',
                queryId: 0n,
            }
        );
        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: nftCollection.address,
            deploy: true,
            success: true,
        });

        let userResult = await nftCollection.send(
            userA.getSender(),
            {
                value: toNano('0.15'),
            },
            "Mint"
        )

        const lastIndex = await nftCollection.getGetCollectionData()
        const lastNftAddress = await nftCollection.getGetNftAddressByIndex(lastIndex.next_item_index-BigInt(1))
        expect(lastNftAddress).not.toBeNull()
        nftItem = blockchain.openContract(NftItem.fromAddress(lastNftAddress!))
        const nftData = await nftItem.getGetNftData()
        expect(nftData.owner_address).toEqualAddress(userA.address)
    });

    it('Staking', async () => {
        // const nftContract  =
        await nftItem.send(
            userA.getSender(),
            {
                value: toNano('0.1'),
            },
            "Staking"
        )
        const nftData = await nftItem.getGetNftData()
        expect(nftData.owner_address).toEqualAddress(inventory.address)

        const stakingRecord = await inventory.getGetStakingRecord(userA.address)
        expect(stakingRecord).not.toBeNull()
        const stakingNftItems:Address[] = []
        let table:IStakingTable = {};
        let keys = stakingRecord!.nftList.keys()
        keys.map((x)=>{
            const address = stakingRecord!.nftList.get(x)
            stakingNftItems.push(address!)
            table[Number(x)] = address!.toString()
        })
        console.table(table)

        expect(stakingNftItems.length).toBe(1)
        expect(stakingNftItems[0]).toEqualAddress(nftItem.address)
    });

    it('Withdraw Correct', async () => {
        // Staking
        await nftItem.send(
            userA.getSender(),
            {
                value: toNano('0.1'),
            },
            "Staking"
        )
        let nftData = await nftItem.getGetNftData()
        expect(nftData.owner_address).toEqualAddress(inventory.address)
        // Withdraw

        const seqno = await inventory.getGetSeqno()
        const nftIndex = BigInt(0)
        const _signature = await getSignature(seqno,userA.address!,nftIndex)
        await inventory.send(
            userA.getSender(),
            {
                value: toNano('0.2'),
            },
            {
                $$type: "WithdrawParams",
                signature: _signature,
                ownerAddress:userA.address!,
                seqno:seqno,
                nftIndex:nftIndex,
            }
        );

        nftData = await nftItem.getGetNftData()
        expect(nftData.owner_address).toEqualAddress(userA.address)
    });

    it('Withdraw Wrong Signature', async () => {
        // Staking
        await nftItem.send(
            userA.getSender(),
            {
                value: toNano('0.1'),
            },
            "Staking"
        )
        let nftData = await nftItem.getGetNftData()
        expect(nftData.owner_address).toEqualAddress(inventory.address)
        // Withdraw

        const seqno = BigInt(2)
        const nftIndex = BigInt(0)
        const _signature = await getSignature(seqno,userA.address!,nftIndex)
        await inventory.send(
            userA.getSender(),
            {
                value: toNano('0.2'),
            },
            {
                $$type: "WithdrawParams",
                signature: _signature,
                ownerAddress:userA.address!,
                seqno:seqno,
                nftIndex:nftIndex,
            }
        );

        nftData = await nftItem.getGetNftData()
        expect(nftData.owner_address).toEqualAddress(inventory.address)
    });
});
