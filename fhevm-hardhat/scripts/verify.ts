import { ethers } from "hardhat";

async function main() {
  const address = process.env.CONTRACT_ADDRESS;
  if (!address) {
    console.error("Set CONTRACT_ADDRESS env var or pass it: npm run verify 0x...");
    process.exit(1);
  }

  console.log(`Verifying ConfidentialPayroll at ${address} on Sepolia...`);
  
  await hre.run("verify:verify", {
    address,
    constructorArguments: [],
  });

  console.log("Verification submitted successfully");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
