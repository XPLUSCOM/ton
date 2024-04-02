import "@stdlib/deploy";

message TransferEvent {
    singer: Address;
    bizz:Int;
    callTime: Int as uint32;
}

message CheckInParams {
    bizz: Int;
}

contract Checkin with Deployable {
    checkinCount: map<Address,Int>;
    bizz: map<Int,Address>;

    deployer: Address;

    init() {
        self.deployer = sender();
    }

    fun onlyDeployer() {
        require(sender() == self.deployer, "Only the deployer is permitted here");
    }

    receive(msg:CheckInParams){
        require(self.bizz.get(msg.bizz) == null,"Bizz already used.");
        let signer:Address = sender();
        self.bizz.set(msg.bizz,signer);
        let _checkinCount:Int? = self.checkinCount.get(signer);
        if(_checkinCount==null){
           self.checkinCount.set(signer,1);
        }else{
           self.checkinCount.set(signer,_checkinCount!!+1);
        }
        self.reply("Checked-In".asComment());

        emit(TransferEvent{singer:signer, bizz:msg.bizz, callTime:now()}.toCell());
    }

    get fun checkInCount(_address:Address): Int? {
       return self.checkinCount.get(_address);
    }
    get fun allCheckInRecord(): map<Address,Int> {
       return self.checkinCount;
    }

    get fun getBizzSigner(_bizz:Int):Address?{
        return self.bizz.get(_bizz);
    }
}
