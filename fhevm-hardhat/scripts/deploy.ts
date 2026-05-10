import { ethers } from "hardhat";

async function main() {
  const ConfidentialPayroll = await ethers.getContractFactory("ConfidentialPayroll");
  const contract = await ConfidentialPayroll.deploy();
  
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  
  console.log("ConfidentialPayroll deployed to:", address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });