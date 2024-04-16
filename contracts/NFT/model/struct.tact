struct CollectionData {
    next_item_index: Int;
    collection_content: Cell;
    owner_address: Address;
}

struct GetNftData {
    is_initialized: Bool;
    index: Int;
    collection_address: Address;
    owner_address: Address;
    individual_content: Cell;
}

struct RoyaltyParams {
    numerator: Int;
    denominator: Int;
    destination: Address;
}

struct StakingRecord {
    nftList: map<Int,Address>;
    curIndexs: Int as uint32;
}


struct NftPhaseConfig{
    startDate:Int as uint32;
    endDate:Int as uint32;
    price:Int;
}

struct MintingStatus{
    currentPhase:String;
    totalSupply:Int;
    startDate:Int as uint32;
    endDate:Int as uint32;
    now:Int as uint32;
    mintedCount:Int as uint32;
    price:Int;
}

struct AllPhaseConfig{
    phase1:NftPhaseConfig;
    phase2:NftPhaseConfig;
    totalSupply:Int;
    now:Int as uint32;
    mintedCount:Int as uint32;
}
