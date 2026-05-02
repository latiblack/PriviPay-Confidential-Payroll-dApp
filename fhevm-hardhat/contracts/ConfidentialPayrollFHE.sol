// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import {euint256, FHE} from "fhevm/solidity/lib/FHE.sol";

/// @title ConfidentialPayrollFHE
/// @notice Fully confidential payroll contract using Zama FHE
/// @dev All salary and bonus data is encrypted on-chain using FHE
contract ConfidentialPayrollFHE {
    // Contract owner (organization owner)
    address public owner;

    // Organization ID
    bytes32 public orgId;

    // Encrypted employee salary (euint256 - fully encrypted)
    mapping(address => euint256) internal encryptedSalaries;

    // Encrypted employee bonus
    mapping(address => euint256) internal encryptedBonuses;

    // Employee address list for iteration
    address[] internal employeeList;

    // Whether an address is an employee
    mapping(address => bool) public isEmployee;

    // Events
    event SalarySetEncrypted(address indexed employee);
    event BonusDistributedEncrypted(address indexed employee);
    event PayrollProcessedEncrypted(uint256 employeeCount);
    event EmployeeAdded(address indexed employee);
    event EmployeeRemoved(address indexed employee);

    error NotOwner();
    error NotEmployee();
    error NotAuthorized();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor(bytes32 _orgId) {
        owner = msg.sender;
        orgId = _orgId;
    }

    /// @notice Add employee to organization
    function addEmployee(address employee) external onlyOwner {
        if (isEmployee[employee]) revert NotEmployee();
        
        isEmployee[employee] = true;
        employeeList.push(employee);
        
        // Initialize encrypted salary to 0 and grant access
        euint256 zeroSalary = FHE.asEuint256(0);
        encryptedSalaries[employee] = zeroSalary;
        FHE.allow(employee, zeroSalary);
        
        // Initialize bonus to 0 and grant access
        euint256 zeroBonus = FHE.asEuint256(0);
        encryptedBonuses[employee] = zeroBonus;
        FHE.allow(employee, zeroBonus);
        
        emit EmployeeAdded(employee);
    }

    /// @notice Remove employee from organization
    function removeEmployee(address employee) external onlyOwner {
        if (!isEmployee[employee]) revert NotEmployee();
        
        isEmployee[employee] = false;
        
        emit EmployeeRemoved(employee);
    }

    /// @notice Set encrypted salary for an employee
    function setEncryptedSalary(address employee, euint256 encryptedSalary) external onlyOwner {
        if (!isEmployee[employee]) revert NotEmployee();
        
        encryptedSalaries[employee] = encryptedSalary;
        FHE.allow(employee, encryptedSalary);
        
        emit SalarySetEncrypted(employee);
    }

    /// @notice Set encrypted bonus for an employee
    function setEncryptedBonus(address employee, euint256 encryptedBonus) external onlyOwner {
        if (!isEmployee[employee]) revert NotEmployee();
        
        encryptedBonuses[employee] = encryptedBonus;
        FHE.allow(employee, encryptedBonus);
        
        emit BonusDistributedEncrypted(employee);
    }

    /// @notice Get encrypted salary ciphertext handle
    function getEncryptedSalary(address employee) external view returns (euint256) {
        if (!isEmployee[employee]) revert NotEmployee();
        if (msg.sender != employee && msg.sender != owner) revert NotAuthorized();
        
        return encryptedSalaries[employee];
    }

    /// @notice Get encrypted bonus ciphertext handle
    function getEncryptedBonus(address employee) external view returns (euint256) {
        if (!isEmployee[employee]) revert NotEmployee();
        if (msg.sender != employee && msg.sender != owner) revert NotAuthorized();
        
        return encryptedBonuses[employee];
    }

    /// @notice Process payroll for all employees (encrypted calculation)
    function processPayrollEncrypted() external onlyOwner returns (euint256) {
        euint256 total = FHE.asEuint256(0);
        
        for (uint i = 0; i < employeeList.length; i++) {
            address emp = employeeList[i];
            total = FHE.add(total, FHE.add(encryptedSalaries[emp], encryptedBonuses[emp]));
        }
        
        emit PayrollProcessedEncrypted(employeeList.length);
        
        return total;
    }

    /// @notice Get employee count
    function getEmployeeCount() external view returns (uint256) {
        return employeeList.length;
    }

    /// @notice Get employee by index
    function getEmployee(uint256 index) external view returns (address) {
        if (index >= employeeList.length) revert NotAuthorized();
        return employeeList[index];
    }

    /// @notice Check if caller can view employee data
    function canViewEmployeeData(address employee) external view returns (bool) {
        return msg.sender == employee || msg.sender == owner;
    }
}