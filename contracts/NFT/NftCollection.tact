import "./NFTItem.tact";
import "./model/message.tact";
import "./model/struct.tact";
import "@stdlib/deploy";

const minTonsForStorage: Int = ton("0.02");
const gasConsumption: Int = ton("0.02");

message EventMintRecord {
    minter: Address;
    item_id: Int;
    generate_number: Int;
}

contract NftCollection with Deployable {
    next_item_index: Int as uint32 = 0;
    owner_address: Address;
    inventory_address: Address;
    royalty_params: RoyaltyParams?;
    collection_content: Cell;
    deployer: Address;
    phase1Config:NftPhaseConfig;
    whiteList: map<Address,Int>;

    phase2Config:NftPhaseConfig;
    total_supply:Int as uint32;



    init(owner_address: Address,inventory_address: Address, collection_content: Cell, royalty_params: RoyaltyParams,phase1Config:NftPhaseConfig,phase2Config:NftPhaseConfig,whiteList: map<Address,Int>,totalSupply:Int ){
        self.owner_address = owner_address;
        self.collection_content = collection_content;
        self.inventory_address = inventory_address;
        self.royalty_params = royalty_params;
        self.phase1Config = phase1Config;
        self.phase2Config = phase2Config;

        self.whiteList = whiteList;
        self.deployer = sender();
        self.total_supply = totalSupply;
    }
  // this will withdraw the entire balance but leave 0.01 for storage rent costs
    receive("withdraw safe") {
        require(sender() == self.owner_address, "Only fundWallet is allowed to withdraw");
        send(SendParameters{
            to: sender(),
            bounce: true,
            value: myBalance() - context().value - minTonsForStorage,
            mode: SendRemainingValue + SendIgnoreErrors
        });
    }

    receive("Mint"){
        // Check Mint Duration
        require(self.phase1Config.startDate <= now() &&  now()< self.phase2Config.endDate ,"Minting is Close (Time) ");
        // Check Total Supply
        require(self.next_item_index >= 0 && self.next_item_index < self.total_supply , "Minting is Close (Total_supply)");

        if(self.phase1Config.startDate <= now() &&  now() < self.phase1Config.endDate ){
        // Phase 1 : WhiteList Mint

            require(context().value>=self.phase1Config.price, "Minting Amount Not Enough.");
            //Check WhiteList
            let _eligible:Int? = self.whiteList.get(sender());
            require(_eligible != null, "Ineligible, not in WhiteList.");
            require((_eligible!!) > 0, "Quota = 0");

            //Mint
            let ctx: Context = context(); // get sender Info
            let msgValue: Int = ctx.value;
            let tonBalanceBeforeMsg: Int = myBalance() - msgValue;
            let storageFee: Int = minTonsForStorage - min(tonBalanceBeforeMsg, minTonsForStorage);
            msgValue = msgValue - (storageFee + gasConsumption);
            self.mint(ctx.sender, msgValue);
            // Update WhiteList
            self.whiteList.set(sender(),(_eligible!!)-1);
            emit(EventMintRecord{
                minter: sender(),
                item_id: self.next_item_index,
                generate_number: nativeRandom()
            }.toCell());
        }else if(self.phase2Config.startDate <= now() && now() < self.phase2Config.endDate){

              //Mint
                require(context().value>=self.phase2Config.price, "Minting Amount Not Enough.");
                let ctx: Context = context(); // get sender Info
                let msgValue: Int = ctx.value;
                let tonBalanceBeforeMsg: Int = myBalance() - msgValue;
                let storageFee: Int = minTonsForStorage - min(tonBalanceBeforeMsg, minTonsForStorage);
                msgValue = msgValue - (storageFee + gasConsumption);
                self.mint(ctx.sender, msgValue);
                emit(EventMintRecord{
                    minter: sender(),
                    item_id: self.next_item_index,
                    generate_number: nativeRandom()
                }.toCell());
        }
    }




    // ===== Private Methods ===== //
    fun mint(sender: Address, msgValue: Int) {
        require(self.next_item_index >= 0, "non-sequential NFTs");
        let nft_init: StateInit = self.getNftItemInit(self.next_item_index);
        send(SendParameters{
                to: contractAddress(nft_init),
                value: msgValue,
                bounce: false,
                mode: SendIgnoreErrors,
                body: Transfer {
                    query_id: 0,
                    new_owner: sender,
                    response_destination: self.owner_address,   // Fund Wallet
                    custom_payload: self.collection_content,
                    forward_amount: 0,
                    forward_payload: emptySlice()
                }.toCell(),
                code: nft_init.code,
                data: nft_init.data
            });

            self.next_item_index = self.next_item_index+1;

    }



    receive(msg: GetRoyaltyParams) {
        let ctx: Context = context(); // get sender Info
        send(SendParameters{
            to: ctx.sender,
            value: 0,
            mode: 64,
            bounce: false,
            body: ReportRoyaltyParams {
                query_id: msg.query_id,
                numerator:  (self.royalty_params!!).numerator,
                denominator: (self.royalty_params!!).denominator,
                destination: self.owner_address
            }.toCell()
        });
    }
    // ------------------ Admin Function  ------------------ //
    //Update WhiteList
    receive(msg: UpdateWhiteListParams) {
        require(self.deployer == sender(),"Only Deployer.");
        self.whiteList = msg.newList;
    }

    //Update Mint Config
    receive(msg: UpdatePhaseConfigParams) {
        require(self.deployer == sender(),"Only Deployer.");
        if(msg.targetPhase == 1){
            self.phase1Config = msg.newConfig;
        }
        if(msg.targetPhase == 2){
            self.phase2Config = msg.newConfig;
        }
    }

    // ------------------ Get Function  ------------------ //
    get fun get_collection_data(): CollectionData {
        let b: StringBuilder = beginString();
        let collectionDataString: String = self.collection_content.asSlice().asString();
        b.append(collectionDataString);
        b.append("meta.json"); // You can changed this your self.
        return CollectionData{
             next_item_index: self.next_item_index,
             collection_content: b.toCell(),
             owner_address: self.owner_address
         };

    }

    get fun get_nft_address_by_index(item_index: Int): Address?{
        let initCode: StateInit = self.getNftItemInit(item_index);
        return contractAddress(initCode);
    }

    get fun getNftItemInit(item_index: Int): StateInit {
        return initOf NftItem(myAddress(),self.inventory_address, item_index);
    }

    get fun get_nft_content(index: Int, individual_content: Cell): Cell {
        let b: StringBuilder = beginString();
        let ic: String = individual_content.asSlice().asString();
        b.append(ic);
        return b.toCell();
    }

    get fun royalty_params(): RoyaltyParams {
        return self.royalty_params!!;
    }

    get fun now(): Int {
        return now();
    }

    get fun isWhiteList(address:Address):Int{
        let _eligible:Int? = self.whiteList.get(address);

        if(_eligible==null){
            return 0;
        }else{
            return _eligible!!;
        }
    }

    get fun getMintingStatus():MintingStatus{
        if(self.phase1Config.startDate <= now() &&  now()< self.phase1Config.endDate){
         //Phase 1
            return MintingStatus{
                        currentPhase:"WhiteList Mint",
                        totalSupply: self.total_supply,
                        startDate: self.phase1Config.startDate,
                        endDate: self.phase1Config.endDate,
                        now:now(),
                        mintedCount:self.next_item_index,
                        price:self.phase1Config.price
            };
        }else if(self.phase2Config.startDate <= now() &&  now()< self.phase2Config.endDate){
        //Phsae 2
             return MintingStatus{
                        currentPhase:"Public Mint",
                        totalSupply: self.total_supply,
                        startDate: self.phase2Config.startDate,
                        endDate: self.phase2Config.endDate,
                        now:now(),
                        mintedCount:self.next_item_index,
                        price:self.phase2Config.price
                    };
        }else if(now()<self.phase1Config.startDate){
        //Not Start
            return MintingStatus{
                        currentPhase:"WhiteList Mint ( Not Start )",
                        totalSupply: self.total_supply,
                        startDate: self.phase1Config.startDate,
                        endDate: self.phase1Config.endDate,
                        now:now(),
                        mintedCount:self.next_item_index,
                        price:self.phase1Config.price
            };
        }else{
        //Ended
             return MintingStatus{
                        currentPhase:" Public Mint (End) ",
                        totalSupply: self.total_supply,
                        startDate: self.phase2Config.startDate,
                        endDate: self.phase2Config.endDate,
                        now:now(),
                        mintedCount:self.next_item_index,
                        price:self.phase2Config.price
            };
        }
    }


}
