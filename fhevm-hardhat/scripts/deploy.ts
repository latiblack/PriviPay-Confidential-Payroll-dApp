import { ethers } from "hardhat";

async function main() {
  console.log("Deploying ConfidentialPayrollFHE to Ethereum Sepolia...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  
  const orgId = ethers.keccak256(ethers.toUtf8Bytes("seedback-org-001"));
  
  const ConfidentialPayrollFHE = await ethers.getContractFactory("ConfidentialPayrollFHE");
  const contract = await ConfidentialPayrollFHE.deploy(orgId);
  
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  
  console.log("\n=== DEPLOYMENT SUCCESSFUL ===");
  console.log("Contract Address:", address);
  console.log("Organization ID:", orgId);
  console.log("\nAdd to your .env:");
  console.log(`CONFIDENTIAL_PAYROLL_ADDRESS=${address}`);
  console.log(`ORG_ID=${ethers.zeroPadValue(orgId, 32)}`);
  
  console.log("\nVerify at: https://sepolia.etherscan.io/address/" + address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });