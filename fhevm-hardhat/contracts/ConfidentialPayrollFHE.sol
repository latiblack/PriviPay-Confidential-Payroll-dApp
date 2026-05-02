// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import {euint256, TFHE} from "fhevm/lib/TFHE.sol";

/// @title ConfidentialPayrollFHE
/// @notice Fully confidential payroll contract using Zama FHE
contract ConfidentialPayrollFHE {
    address public owner;
    bytes32 public orgId;
    
    mapping(address => euint256) internal encryptedSalaries;
    mapping(address => euint256) internal encryptedBonuses;
    address[] internal employeeList;
    mapping(address => bool) public isEmployee;

    event SalarySetEncrypted(address indexed employee);
    event BonusDistributedEncrypted(address indexed employee);
    event PayrollProcessedEncrypted(uint256 employeeCount);
    event EmployeeAdded(address indexed employee);

    error NotOwner();
    error NotEmployee();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor(bytes32 _orgId) {
        owner = msg.sender;
        orgId = _orgId;
    }

    function addEmployee(address employee) external onlyOwner {
        if (isEmployee[employee]) revert NotEmployee();
        
        isEmployee[employee] = true;
        employeeList.push(employee);
        
        euint256 zero = TFHE.asEuint256(0);
        encryptedSalaries[employee] = zero;
        encryptedBonuses[employee] = zero;
        
        emit EmployeeAdded(employee);
    }

    function setEncryptedSalary(address employee, euint256 encryptedSalary) external onlyOwner {
        if (!isEmployee[employee]) revert NotEmployee();
        encryptedSalaries[employee] = encryptedSalary;
        emit SalarySetEncrypted(employee);
    }

    function setEncryptedBonus(address employee, euint256 encryptedBonus) external onlyOwner {
        if (!isEmployee[employee]) revert NotEmployee();
        encryptedBonuses[employee] = encryptedBonus;
        emit BonusDistributedEncrypted(employee);
    }

    function getEncryptedSalary(address employee) external view returns (euint256) {
        if (!isEmployee[employee]) revert NotEmployee();
        return encryptedSalaries[employee];
    }

    function getEncryptedBonus(address employee) external view returns (euint256) {
        if (!isEmployee[employee]) revert NotEmployee();
        return encryptedBonuses[employee];
    }

    function processPayrollEncrypted() external onlyOwner returns (euint256) {
        euint256 total = TFHE.asEuint256(0);
        
        for (uint i = 0; i < employeeList.length; i++) {
            address emp = employeeList[i];
            total = TFHE.add(total, TFHE.add(encryptedSalaries[emp], encryptedBonuses[emp]));
        }
        
        emit PayrollProcessedEncrypted(employeeList.length);
        return total;
    }

    function getEmployeeCount() external view returns (uint256) {
        return employeeList.length;
    }

    function getEmployee(uint256 index) external view returns (address) {
        require(index < employeeList.length, "Invalid index");
        return employeeList[index];
    }
}