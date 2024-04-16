import {Address, Dictionary} from "@ton/core";

export const convertMapToWhiteList=():Dictionary<Address, bigint>=>{
    const whiteList : Dictionary<Address,bigint>=  Dictionary.empty<Address, bigint>();


    whiteList.set(Address.parse("0QAmUgmVk4ZE0iu63EJEuhIUK1nF3aDv_tTfNg3awjJrIqu8"),BigInt(1))
    whiteList.set(Address.parse("0QBPYExEoHykk7Y01Vh_J5kYPJPE43wG_vRsq2AFlFoA1fSg"),BigInt(1))
    whiteList.set(Address.parse("0QC15gasVMklrDwsnBFjaEh5njLNG80OJHIwDIRWt4bmuw9m"),BigInt(1))
    whiteList.set(Address.parse("0QAy78bJA9Tk9Ngz32DUfjZZsSQyfbPCN5iHslc9_oeqTF1a"),BigInt(1))
    return whiteList
}









