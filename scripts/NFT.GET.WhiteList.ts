import {NetworkProvider} from "@ton/blueprint";
import {Address} from "@ton/core";
import {nftCollectionContract} from "../contest/contractConifg";
import {NftCollection} from "../build/XplusAtTonNFT/tact_NftCollection";

export async function run(provider: NetworkProvider, args: string[]) {
    const ui = provider.ui();
    const _address = Address.parse(nftCollectionContract[provider.network()]);
    if (!(await provider.isContractDeployed(_address))) {
        ui.write(`Error: Contract at address ${_address} is not deployed!`);
        return;
    }

    const nftCollection = provider.open(NftCollection.fromAddress(_address));
    const remainCount = await nftCollection.getIsWhiteList(Address.parse("UQBH4FYWOdAhdYzkzzfHOVScH7tmnlKdcGBNAGg1ToT7nO_-"))
    console.log({remainCount})
    ui.clearActionPrompt();
}
