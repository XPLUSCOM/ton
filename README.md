# XPLUS Ton Contracts

## Project structure

-   `contracts` - source code of all the smart contracts of the project and their dependencies.
-   `wrappers` - wrapper classes (implementing `Contract` from ton-core) for the contracts, including any [de]serialization primitives and compilation functions.
-   `tests` - tests for the contracts.
-   `scripts` - scripts used by the project, mainly the deployment scripts.

## How to use

### Build

`npx blueprint build` or `yarn blueprint build`

### Test

`npx blueprint test` or `yarn blueprint test`

### Deploy or run another script

`npx blueprint run` or `yarn blueprint run`


## Check In Contract
### Depoly
``` 
npx blueprint run -> CheckIn.DEPOLY
```
### Send Function
``` 
# User Check In
npx blueprint run -> CheckIn.SEND.CheckIn
```

### Get Function
``` 
# Get CheckIn Record By BizId
npx blueprint run -> CheckIn.GET.Signer 

# Get CheckIn Count By Address
npx blueprint run -> CheckIn.GET.CheckInCount 
```

## Inventroy
### Depoly
``` 
npx blueprint run -> Inventroy.DEPOLY
```
### Send Function
``` 
# Withdraw Nft
npx blueprint run -> Inventroy.Withdraw
```

### Get Function
``` 

```

## Nft Collection
### Depoly
- For update Inventroy, plx update the InventoryContract at contest/contractConfig.ts
- For update the metadata, plx update the metadataUrl at contest/nftCollectionConfig.ts
``` 
npx blueprint run -> NFT.DEPOLY
```
### Send Function
``` 
# Mint
npx blueprint run -> NFT.MINT
```

### Get Function
``` 
Get Nft Item Address By Index
npx blueprint run -> NFT.GET.NftAddressByIndex
```

## Nft Collection
### Send Function
``` 
# Staking
npx blueprint run -> NFT.Staking
```
