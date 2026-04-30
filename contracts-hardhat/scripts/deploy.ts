import { ethers } from "hardhat";
import { BytesLike } from "ethers";

async function main() {
  console.log("Deploying ConfidentialPayroll to Zama fhEVM...\n");

  // Generate a random org ID (in production, this would come from the database)
  const orgId = ethers.keccak256(ethers.toUtf8Bytes("privipay-org-" + Date.now()));

  // Deploy the contract
  const ConfidentialPayroll = await ethers.getContractFactory("ConfidentialPayroll");
  const contract = await ConfidentialPayroll.deploy(orgId);

  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();

  console.log("=".repeat(60));
  console.log("ConfidentialPayroll deployed successfully!");
  console.log("=".repeat(60));
  console.log(`Contract Address: ${contractAddress}`);
  console.log(`Organization ID:  ${orgId}`);
  console.log(`Network:          ${network.name}`);
  console.log("=".repeat(60));

  // Verify contract deployment
  const owner = await contract.owner();
  const employeeCount = await contract.getEmployeeCount();
  console.log(`\nVerification:`);
  console.log(`  Owner: ${owner}`);
  console.log(`  Initial Employee Count: ${employeeCount}`);

  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    contractAddress,
    orgId,
    owner,
    deployedAt: new Date().toISOString(),
  };

  console.log("\nDeployment complete!");
  console.log("Add this to your frontend .env:");
  console.log(`VITE_PAYROLL_CONTRACT_ADDRESS=${contractAddress}`);

  return deploymentInfo;
}

main()
  .then((info) => {
    console.log("\nDeployment info:", JSON.stringify(info, null, 2));
    process.exit(0);
  })
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });