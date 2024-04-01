import {toNano} from '@ton/core';

import {NetworkProvider} from '@ton/blueprint';
import { Checkin } from '../wrappers/Checkin';


export async function run(provider: NetworkProvider) {
    const checkin = provider.open(await Checkin.fromInit());

    await checkin.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: 'Deploy',
            queryId: 0n,
        }
    );

    await provider.waitForDeploy(checkin.address);
}
