import { createPublicClient, http } from 'viem';
import { sepolia } from 'viem/chains';
import fs from 'node:fs';

const artifact = JSON.parse(fs.readFileSync('/dev-server/src/lib/contracts/ConfidentialPayrollFHE.json', 'utf8'));
const client = createPublicClient({ chain: sepolia, transport: http('https://rpc.sepolia.org') });
const address = '0x98c9975deb5d544682028c8bdf1b407ec283eaa6';
const owner = await client.readContract({ address, abi: artifact.abi, functionName: 'owner' });
const count = await client.readContract({ address, abi: artifact.abi, functionName: 'getEmployeeCount' });
console.log(JSON.stringify({ address, owner, count: count.toString() }, null, 2));
