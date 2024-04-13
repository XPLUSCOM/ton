import * as dotenv from 'dotenv';
interface IWallet{
    mnemonics:string
    address:string
}

dotenv.config();
export const relayer :IWallet={
    mnemonics:process.env.RELAYER_MNEMONICS||'length mandate body time second act motion gallery cart hybrid second alien echo earth habit mutual like need distance dwarf wine six latin idle',
    address:process.env.RELAYER_ADDRESS||'UQAUvPR30ZDCEpFMCpzbqV-zCG7ICCnYfF9p0FUe8v5jZgHZ'
}

export const fake_relayer:IWallet={
    mnemonics:'indoor expose denial review occur live kitten family bright twin differ say modify pig expose ladder embark tray nature forget tank enter kiwi expose',
    address:'UQCFUHR1STYjLvNw4loBUVFOTP3nbyWLTWgEsPVYQQU3sbJ1'
}
