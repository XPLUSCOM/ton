import "./model/message.tact";
import "./model/struct.tact";
import "@stdlib/deploy";

const minTonsForStorage: Int = ton("0.02");
const gasConsumption: Int = ton("0.02");

message EventStaking {
    nftAddress: Address;
    owner:Address;
    index:Int as uint64;
    callTime: Int as uint32;
}

contract Inventory with Deployable{
    seqno:Int as uint32 = 0;
    stakingRecord: map<Address,StakingRecord>;
    publicKey : Int as uint256; // Relayer Wallet, for signature verify
    deployer: Address;

    init( publicKey: Int){
        self.publicKey = publicKey;
        self.deployer = sender();
    }

    receive(msg: StakingParams){
        let ctx: Context = context();
        let _stakingRecord:StakingRecord? =  self.stakingRecord.get(msg.owner);
        let _index:Int = 0;
        let _nftList:map<Int,Address> = emptyMap();
        if(_stakingRecord==null){
            _nftList.set(_index,msg.nftAddress);
            _index = _index + 1;
            self.stakingRecord.set(msg.owner,StakingRecord{nftList:_nftList,curIndexs:_index } );
        }else{
            _nftList = (_stakingRecord!!).nftList;
            _index =  (_stakingRecord!!).curIndexs;
            _nftList.set(_index,msg.nftAddress);
            _index = _index+1;
            self.stakingRecord.set(msg.owner,StakingRecord{nftList:_nftList,curIndexs:_index } );
        }

        let msgValue: Int = ctx.value; // Check the gasCost for storage
        let tonBalanceBeforeMsg: Int = myBalance() - msgValue;
        let storageFee: Int = minTonsForStorage - min(tonBalanceBeforeMsg, minTonsForStorage);
        msgValue = msgValue - (storageFee + gasConsumption);
        send(SendParameters{
            to: msg.owner,
            value: msgValue,
            mode: SendPayGasSeparately,
            bounce: true,
            body: EventStaking{nftAddress:msg.nftAddress, owner:msg.owner, index:_index ,callTime:now()}.toCell()
        });
        emit (EventStaking{nftAddress:msg.nftAddress, owner:msg.owner, index:_index ,callTime:now()}.toCell());
    }

    receive(msg: WithdrawParams){
        let ctx: Context = context();
        // Check if action approved by us and payload is correct.
        let hash: Int = beginCell()
            .storeUint(msg.seqno,32)
            .storeAddress(msg.ownerAddress)
            .storeUint(msg.nftIndex,32)
        .endCell()
        .hash();
        require(checkSignature(hash, msg.signature, self.publicKey), "Invalid Signature.");
        // Check sender is the owner
        require(msg.ownerAddress == sender(),"Wrong Sender.");
        // Check Seqno is Correct
        require(msg.seqno == self.seqno, "Invalid Seqno.");

        let _stakingRecord:StakingRecord? = self.stakingRecord.get(msg.ownerAddress);
        require(_stakingRecord != null, "Staking Record Not Found." );
        require((_stakingRecord!!).curIndexs > msg.nftIndex, "Invalid NFT Index.");
        let _nftAddress: Address = (_stakingRecord!!).nftList.get(msg.nftIndex)!!;

        let msgValue: Int = ctx.value; // Check the gasCost for storage
        let tonBalanceBeforeMsg: Int = myBalance() - msgValue;
        let storageFee: Int = minTonsForStorage - min(tonBalanceBeforeMsg, minTonsForStorage);
        msgValue = msgValue - (storageFee + gasConsumption);

        // Transfer NFT
        send(SendParameters{
            to: _nftAddress,
            value: msgValue,
            bounce: true,
            mode: SendIgnoreErrors,
            body: Transfer {
                query_id: 0,
                new_owner: msg.ownerAddress,
                custom_payload:null,
                response_destination: sender(),
                forward_amount: 0,
                forward_payload: emptySlice()
            }.toCell()
        });
    }
    get fun get_Seqno(): Int {
        return self.seqno;
    }

    get fun get_stakingRecord(address:Address): StakingRecord? {
        return self.stakingRecord.get(address);
    }
}

