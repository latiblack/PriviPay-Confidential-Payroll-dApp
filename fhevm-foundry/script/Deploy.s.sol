// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import {ConfidentialPayrollFHE} from "../src/ConfidentialPayrollFHE.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);
        
        // Organization ID - in production this would come from the frontend
        bytes32 orgId = keccak256(abi.encodePacked("seedback-org-"));
        
        ConfidentialPayrollFHE payroll = new ConfidentialPayrollFHE(orgId);
        
        console.log("ConfidentialPayrollFHE deployed to:", address(payroll));
        console.log("Organization ID:", vm.toString(bytes32(orgId)));
        
        vm.stopBroadcast();
    }
}