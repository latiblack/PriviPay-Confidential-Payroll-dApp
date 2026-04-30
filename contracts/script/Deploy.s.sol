// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/ConfidentialPayroll.sol";

contract DeployConfidentialPayroll is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        bytes32 orgId = bytes32(vm.envBytes32("ORG_ID"));

        vm.startBroadcast(deployerPrivateKey);

        ConfidentialPayroll payroll = new ConfidentialPayroll(orgId);

        console.log("ConfidentialPayroll deployed at:", address(payroll));
        console.logBytes32(orgId);

        vm.stopBroadcast();
    }
}