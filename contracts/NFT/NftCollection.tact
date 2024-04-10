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
    whiteList: map<Address,Bool>;

    phase2Config:NftPhaseConfig;
    publicKey : Int as uint256; // Relayer Wallet, for signature verify

    phase3Config:NftPhaseConfig;



    init(owner_address: Address,inventory_address: Address, collection_content: Cell, royalty_params: RoyaltyParams,publicKey: Int,phase1Config:NftPhaseConfig,phase2Config:NftPhaseConfig,phase3Config:NftPhaseConfig,whiteList: map<Address,Bool> ){
        self.owner_address = owner_address;
        self.collection_content = collection_content;
        self.inventory_address = inventory_address;
        self.royalty_params = royalty_params;
        self.publicKey = publicKey;
        self.phase1Config = phase1Config;
        self.phase2Config = phase2Config;
        self.phase3Config = phase3Config;
        self.whiteList = whiteList;
        self.deployer = sender();
    }

    receive("WhiteListMint"){
        //Check Mint Duration
        require(self.phase1Config.startDate < now() ,"Phase 1 : White List Mint Not Start Yet.");
        require(self.phase1Config.endDate > now() ,"Phase 1 : White List Mint is Ended.");

        //Check TotalSupply
        require(
            self.next_item_index >= 0
            &&
            self.next_item_index < self.phase1Config.totalSupply,
            "Item Index invalid.");

        //Check WhiteList
        let _eligible:Bool? = self.whiteList.get(sender());
        require(_eligible != null, "Ineligible, not in WhiteList.");
        require(_eligible != false,"Already Minted.");

        //Mint
        let ctx: Context = context(); // get sender Info
        let msgValue: Int = ctx.value;
        let tonBalanceBeforeMsg: Int = myBalance() - msgValue;
        let storageFee: Int = minTonsForStorage - min(tonBalanceBeforeMsg, minTonsForStorage);
        msgValue = msgValue - (storageFee + gasConsumption);
        self.mint(ctx.sender, msgValue,self.next_item_index);
        // Update WhiteList
        self.whiteList.set(sender(),false);

        emit(EventMintRecord{
            minter: sender(),
            item_id: self.next_item_index,
            generate_number: nativeRandom()
        }.toCell());
    }

    receive(msg:XPlusMintParams){
        //Check Mint Duration
        require(self.phase2Config.startDate < now() ,"Phase 1 : White List Mint Not Start Yet.");
        require(self.phase2Config.endDate > now() ,"Phase 1 : White List Mint is Ended.");

        //Check TotalSupply
        require(msg.item_index < (self.phase1Config.totalSupply+self.phase2Config.totalSupply),"Item Index invalid.");

        //Check Signature
        let hash: Int = beginCell()
            .storeAddress(msg.ownerAddress)
            .storeUint(msg.item_index,32)
        .endCell()
        .hash();
        require(checkSignature(hash, msg.signature, self.publicKey), "Invalid Signature.");



        //Mint
        let ctx: Context = context(); // get sender Info
        let msgValue: Int = ctx.value;
        let tonBalanceBeforeMsg: Int = myBalance() - msgValue;
        let storageFee: Int = minTonsForStorage - min(tonBalanceBeforeMsg, minTonsForStorage);
        msgValue = msgValue - (storageFee + gasConsumption);
        self.mint(ctx.sender, msgValue,msg.item_index);

        emit(EventMintRecord{
            minter: sender(),
            item_id: self.next_item_index,
            generate_number: nativeRandom()
        }.toCell());
    }

    receive("PublicMint"){
        //Check Mint Duration
        require(self.phase3Config.startDate < now() ,"Phase 3 : Public List Mint Not Start Yet.");
        require(self.phase3Config.endDate > now() ,"Phase 3 : Public Mint is Ended.");

        //Check TotalSupply
        require(self.next_item_index < (self.phase1Config.totalSupply+self.phase2Config.totalSupply+self.phase3Config.totalSupply),"Item Index invalid.");

        let ctx: Context = context(); // get sender Info
        let msgValue: Int = ctx.value;
        let tonBalanceBeforeMsg: Int = myBalance() - msgValue;
        let storageFee: Int = minTonsForStorage - min(tonBalanceBeforeMsg, minTonsForStorage);
        msgValue = msgValue - (storageFee + gasConsumption);
        self.mint(ctx.sender, msgValue,self.next_item_index);
        emit(EventMintRecord{
            minter: sender(),
            item_id: self.next_item_index,
            generate_number: nativeRandom()
        }.toCell());
    }

    // ===== Private Methods ===== //
    fun mint(sender: Address, msgValue: Int,item_index:Int) {
        require(item_index >= 0, "non-sequential NFTs");
        let nft_init: StateInit = self.getNftItemInit(item_index);
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

        if(item_index+1> self.next_item_index){
            //Prevent Phase2 Wrong Item_index
            self.next_item_index = item_index+1;
        }
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

        if(msg.targetPhase == 3){
            self.phase3Config = msg.newConfig;
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

    get fun isWhiteList(address:Address):Bool{
        let _eligible:Bool? = self.whiteList.get(address);

        if(_eligible==null){
            return false;
        }else{
            return _eligible!!;
        }
    }

    get fun mintingStatus():MintingStatus?{
        if(now()<self.phase2Config.startDate){
        //Phase 1
            return MintingStatus{
                    currentPhase:"Phase1-WhiteListMint",
                    totalSupply:self.phase1Config.totalSupply,
                    startDate:self.phase1Config.startDate,
                    endDate: self.phase1Config.endDate,
                    startIndex:self.phase1Config.startIndex,
                    now:now(),
                    itemsRemain: self.phase1Config.totalSupply - self.next_item_index - 1,
                    next_item_index:self.next_item_index
            };
        }else if(now()<self.phase3Config.startDate && now()>self.phase1Config.endDate){
          let _startIndex:Int = self.next_item_index;
           if(self.phase2Config.startIndex != null){
            _startIndex = (self.phase2Config.startIndex!!);
           }

        //Phase 2
          return MintingStatus{
                            currentPhase:"Phase2-XPlusMint",
                            totalSupply:self.phase2Config.totalSupply,
                            startDate:self.phase2Config.startDate,
                            endDate:self.phase2Config.endDate,
                            startIndex:_startIndex,
                             now:now(),
                            itemsRemain: self.phase2Config.totalSupply - (self.next_item_index-_startIndex) - 1,
                            next_item_index:self.next_item_index
            };
        }else if(now()>self.phase2Config.endDate){
            //Phase 3
           let _startIndex:Int = self.next_item_index;
           if(self.phase3Config.startIndex != null){
                _startIndex = (self.phase3Config.startIndex!!);
           }
            return MintingStatus{
                            currentPhase:"Phase3-PublicMint",
                            totalSupply:self.phase3Config.totalSupply,
                            startDate:self.phase3Config.startDate,
                            endDate:self.phase3Config.endDate,
                            startIndex:_startIndex,
                            now:now(),
                            itemsRemain: self.phase3Config.totalSupply - (self.next_item_index-_startIndex) - 1,
                            next_item_index:self.next_item_index
                    };
        }
        return null;
    }
}
