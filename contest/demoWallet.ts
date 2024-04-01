interface IWallet{
    mnemonics:string[]
    address:string
}

export const relayer :IWallet={
    mnemonics:'length mandate body time second act motion gallery cart hybrid second alien echo earth habit mutual like need distance dwarf wine six latin idle'.split(' '),
    address:'UQAUvPR30ZDCEpFMCpzbqV-zCG7ICCnYfF9p0FUe8v5jZgHZ'
}
