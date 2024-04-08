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


struct NftConfig{
    phase1TotalSupply:Int;
    phase1StartDate:Date
    phase1EndDate:Date

    phase2TotalSupply:Int;
    phase2StartDate:Date;
    phase2EndDate:Date;

    phase3TotalSupply:Int;
    phase3StartDat:Date;
    phase3EndDate:Date;
}
