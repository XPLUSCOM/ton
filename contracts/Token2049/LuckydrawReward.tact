import "@stdlib/deploy";
struct ClaimRecord{
    amount:Int;
    receiver:Address;
    signature: Slice as bytes64;
}

message ClaimParams{
    signature:Slice as bytes64;
    bizId: Int as uint32;
    amount:Int as uint32;
    receiver:Address;
}

message TopupEvent {
    amount: Int as coins;
}

contract LuckyDrawReward with Deployable {
    const MinTonForStorage: Int = ton("0.01"); // enough for 1 KB of storage for 2.5 years
    bizId:Int as uint32 = 0;
    claimRecord: map<Int,ClaimRecord>; // bizId -> ClaimRecord
    publicKey : Int as uint256; // Relayer Wallet, for signature verify
    fundWallet: Address;

    init(publicKey: Int,fundWallet: Address){
        self.publicKey = publicKey;
        self.fundWallet = fundWallet;
    }

    receive() {
        let ctx: Context = context(); // get sender Info
        let msgValue: Int = ctx.value;
        emit(TopupEvent{amount: msgValue}.toCell());
    }

    receive(msg: ClaimParams){
        require((myBalance()-self.MinTonForStorage) > msg.amount , "Contract Balance Not Enough.");

         // Approval Control ( Signature Base)
        let hash: Int = beginCell()
            .storeUint(msg.bizId,32)
            .storeUint(msg.amount,32)
            .storeAddress(msg.receiver)
        .endCell().hash();

        require(checkSignature(hash, msg.signature, self.publicKey), "Invalid Signature.");

        let claimRecord:ClaimRecord? = self.claimRecord.get(msg.bizId);
        require(claimRecord==null,"BizId Already Used."); //Prevent Replay Attack.
        require(sender()==msg.receiver,"Sender Not Receiver.");
        let amount: Int = min(msg.amount, myBalance() - context().value - self.MinTonForStorage);
        self.claimRecord.set(msg.bizId,ClaimRecord{
            amount:amount,
            receiver:msg.receiver,
            signature: msg.signature
        });

        send(SendParameters{
            to: sender(),
            bounce: true,
            value: amount,
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

    get fun publicKey():Int{
        return self.publicKey;
    }

    get fun queryBizId(bizId:Int): ClaimRecord? {
        return self.claimRecord.get(bizId);
    }

}
