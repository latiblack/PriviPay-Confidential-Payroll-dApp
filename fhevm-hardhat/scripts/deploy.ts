import { ethers } from "hardhat";

async function main() {
  const orgId = ethers.id("test-org");
  
  const ConfidentialPayrollFHE = await ethers.getContractFactory("ConfidentialPayrollFHE");
  const contract = await ConfidentialPayrollFHE.deploy(orgId);
  
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  
  console.log("ConfidentialPayrollFHE deployed to:", address);
  console.log("Org ID:", orgId);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });