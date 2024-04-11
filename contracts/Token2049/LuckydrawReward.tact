struct ClaimRecord{
    amount:Int;
    receiver:Address;
    signature: Slice as bytes64;
}

message ClaimParams{
    seqno: Int as uint32;
    amount:Int as uint32;;
    receiver:Address;
    signature: Address;
}

contract LuckyDrawReward with Deployable {
    const MinTonForStorage: Int = ton("0.01"); // enough for 1 KB of storage for 2.5 years
    seqno:Int as uint32 = 0;
    claimRecord: map<Int,ClaimRecord>; // seqno -> ClaimRecord
    publicKey : Int as uint256; // Relayer Wallet, for signature verify
    fundWallet: Address;

    init(publicKey: Int,fundWallet: Address){
        self.publicKey = publicKey;
        self.fundWallet = fundWallet;
    }

    receive() {
        dump("Funds received");
    }

    receive(msg: ClaimParams){
        require((myBalance()-self.MinTonForStorage) > msg.amount , "Contract Balance Not Enough.");
        let hash: Int = beginCell()
            .storeUint(msg.seqno,32)
            .storeUint(msg.amount,32)
            .storeAddress(msg.receiver)
        .endCell()
        .hash();
        require(checkSignature(hash, msg.signature, self.publicKey), "Invalid Signature.");
        send(SendParameters{
            to: msg.receiver,
            bounce: true,
            value: msg.amount,
            mode: SendRemainingValue + SendIgnoreErrors
        });
    }

    // this will withdraw the entire balance of the contract and leave 0
    receive("withdraw all") {
        require(sender() == self.fundWallet, "Only deployer is allowed to withdraw");
        send(SendParameters{
            to: sender(),
            bounce: true,
            value: 0,
            mode: SendRemainingBalance + SendIgnoreErrors
        });
    }

    // this will withdraw the entire balance but leave 0.01 for storage rent costs
    receive("withdraw safe") {
        require(sender() == self.fundWallet, "Only deployer is allowed to withdraw");
        send(SendParameters{
            to: sender(),
            bounce: true,
            value: myBalance() - context().value - self.MinTonForStorage,
            mode: SendRemainingValue + SendIgnoreErrors
        });
    }

    get fun balance(): String {
        return myBalance().toCoinsString();
    }
}
