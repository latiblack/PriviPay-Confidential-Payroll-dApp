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
    mapping(address => euint256) internal encryptedBalances;
    
    address[] internal employeeList;
    mapping(address => bool) public isEmployee;
    
    mapping(address => mapping(address => bool)) internal authorizedViewers;

    event SalarySetEncrypted(address indexed employee);
    event BonusDistributedEncrypted(address indexed employee);
    event PayrollProcessedEncrypted(uint256 employeeCount);
    event EmployeeAdded(address indexed employee);
    event EmployeeRemoved(address indexed employee);
    event AccessGranted(address indexed employee, address indexed viewer);
    event AccessRevoked(address indexed employee, address indexed viewer);
    event SalaryWithdrawn(address indexed employee);

    error NotOwner();
    error NotEmployee();
    error NotAuthorized();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier onlyEmployee() {
        if (!isEmployee[msg.sender]) revert NotEmployee();
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
        
        // Initialize encrypted values to 0
        euint256 zero = TFHE.asEuint256(0);
        encryptedSalaries[employee] = zero;
        encryptedBonuses[employee] = zero;
        encryptedBalances[employee] = zero;
        
        // Grant owner access to employee's data
        authorizedViewers[employee][owner] = true;
        
        emit EmployeeAdded(employee);
    }

    /// @notice Remove employee from organization
    function removeEmployee(address employee) external onlyOwner {
        if (!isEmployee[employee]) revert NotEmployee();
        
        isEmployee[employee] = false;
        
        // Clear salary and bonus
        euint256 zero = TFHE.asEuint256(0);
        encryptedSalaries[employee] = zero;
        encryptedBonuses[employee] = zero;
        encryptedBalances[employee] = zero;
        
        emit EmployeeRemoved(employee);
    }

    /// @notice Set encrypted salary for an employee
    function setEncryptedSalary(address employee, euint256 encryptedSalary) external onlyOwner {
        if (!isEmployee[employee]) revert NotEmployee();
        
        encryptedSalaries[employee] = encryptedSalary;
        
        // Grant employee access to their own salary
        authorizedViewers[employee][employee] = true;
        
        emit SalarySetEncrypted(employee);
    }

    /// @notice Set encrypted bonus for an employee
    function setEncryptedBonus(address employee, euint256 encryptedBonus) external onlyOwner {
        if (!isEmployee[employee]) revert NotEmployee();
        
        encryptedBonuses[employee] = encryptedBonus;
        
        // Grant employee access to their own bonus
        authorizedViewers[employee][employee] = true;
        
        emit BonusDistributedEncrypted(employee);
    }

    /// @notice Get encrypted salary (only employee or authorized viewers)
    function getEncryptedSalary(address employee) external view returns (euint256) {
        if (!isEmployee[employee]) revert NotEmployee();
        if (!authorizedViewers[employee][msg.sender]) revert NotAuthorized();
        
        return encryptedSalaries[employee];
    }

    /// @notice Get encrypted bonus
    function getEncryptedBonus(address employee) external view returns (euint256) {
        if (!isEmployee[employee]) revert NotEmployee();
        if (!authorizedViewers[employee][msg.sender]) revert NotAuthorized();
        
        return encryptedBonuses[employee];
    }

    /// @notice Get encrypted balance (total received - withdrawn)
    function getEncryptedBalance(address employee) external view returns (euint256) {
        if (!isEmployee[employee]) revert NotEmployee();
        if (!authorizedViewers[employee][msg.sender]) revert NotAuthorized();
        
        return encryptedBalances[employee];
    }

    /// @notice Grant access to view encrypted data
    function grantAccess(address viewer) external onlyEmployee {
        authorizedViewers[msg.sender][viewer] = true;
        emit AccessGranted(msg.sender, viewer);
    }

    /// @notice Revoke access to view encrypted data
    function revokeAccess(address viewer) external onlyEmployee {
        if (viewer == owner) revert NotAuthorized(); // Cannot revoke owner access
        authorizedViewers[msg.sender][viewer] = false;
        emit AccessRevoked(msg.sender, viewer);
    }

    /// @notice Check if address can view employee data
    function canViewEmployeeData(address employee, address viewer) external view returns (bool) {
        return authorizedViewers[employee][viewer];
    }

    /// @notice Process payroll - add salary + bonus to employee balances
    function processPayrollEncrypted() external onlyOwner returns (euint256) {
        euint256 total = TFHE.asEuint256(0);
        
        for (uint i = 0; i < employeeList.length; i++) {
            address emp = employeeList[i];
            
            // Calculate total compensation (salary + bonus)
            euint256 compensation = TFHE.add(encryptedSalaries[emp], encryptedBonuses[emp]);
            
            // Add to employee balance
            encryptedBalances[emp] = TFHE.add(encryptedBalances[emp], compensation);
            
            // Accumulate total
            total = TFHE.add(total, compensation);
            
            // Reset bonus after processing
            encryptedBonuses[emp] = TFHE.asEuint256(0);
        }
        
        emit PayrollProcessedEncrypted(employeeList.length);
        return total;
    }

    /// @notice Withdraw salary from encrypted balance
    function withdrawSalary(euint256 encryptedAmount) external onlyEmployee {
        // Subtract from balance (trusting caller for now - in production use encrypted comparison)
        encryptedBalances[msg.sender] = TFHE.sub(encryptedBalances[msg.sender], encryptedAmount);
        
        emit SalaryWithdrawn(msg.sender);
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

    /// @notice Get list of all employees
    function getAllEmployees() external view returns (address[] memory) {
        return employeeList;
    }
}