import {Address, Dictionary} from "@ton/core";

export const convertMapToWhiteList=():Dictionary<Address, bigint>=>{
    const whiteList : Dictionary<Address,bigint>=  Dictionary.empty<Address, bigint>();
    whiteList.set(Address.parse("UQBH4FYWOdAhdYzkzzfHOVScH7tmnlKdcGBNAGg1ToT7nO_-"),BigInt(2))
    return whiteList
}
