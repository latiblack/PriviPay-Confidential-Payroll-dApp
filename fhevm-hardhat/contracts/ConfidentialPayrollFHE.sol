// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import {FHE, euint64, euint128, ebool, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";

/// @title ConfidentialPayrollFHE
/// @notice Fully confidential payroll contract using Zama FHE
contract ConfidentialPayrollFHE {
    address public owner;
    bytes32 public orgId;
    
    mapping(address => euint128) internal encryptedSalaries;
    mapping(address => euint128) internal encryptedBonuses;
    mapping(address => euint128) internal encryptedBalances;
    
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
        euint128 zero = FHE.asEuint128(0);
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
        euint128 zero = FHE.asEuint128(0);
        encryptedSalaries[employee] = zero;
        encryptedBonuses[employee] = zero;
        encryptedBalances[employee] = zero;
        
        emit EmployeeRemoved(employee);
    }

    /// @notice Set encrypted salary for an employee (accepts external encrypted input)
    function setEncryptedSalary(address employee, externalEuint64 encryptedSalary, bytes calldata inputProof) external onlyOwner {
        if (!isEmployee[employee]) revert NotEmployee();

        euint64 salary = FHE.fromExternal(encryptedSalary, inputProof);
        FHE.allow(salary, employee);
        FHE.allowThis(salary);

        encryptedSalaries[employee] = FHE.asEuint128(salary);

        // Grant employee access to their own salary
        authorizedViewers[employee][employee] = true;

        emit SalarySetEncrypted(employee);
    }

    /// @notice Set encrypted bonus for an employee (accepts external encrypted input)
    function setEncryptedBonus(address employee, externalEuint64 encryptedBonus, bytes calldata inputProof) external onlyOwner {
        if (!isEmployee[employee]) revert NotEmployee();

        euint64 bonus = FHE.fromExternal(encryptedBonus, inputProof);
        FHE.allow(bonus, employee);
        FHE.allowThis(bonus);

        encryptedBonuses[employee] = FHE.asEuint128(bonus);

        // Grant employee access to their own bonus
        authorizedViewers[employee][employee] = true;

        emit BonusDistributedEncrypted(employee);
    }

    /// @notice Get encrypted salary (only employee or authorized viewers)
    function getEncryptedSalary(address employee) external view returns (euint128) {
        if (!isEmployee[employee]) revert NotEmployee();
        if (!authorizedViewers[employee][msg.sender]) revert NotAuthorized();
        
        return encryptedSalaries[employee];
    }

    /// @notice Get encrypted bonus
    function getEncryptedBonus(address employee) external view returns (euint128) {
        if (!isEmployee[employee]) revert NotEmployee();
        if (!authorizedViewers[employee][msg.sender]) revert NotAuthorized();
        
        return encryptedBonuses[employee];
    }

    /// @notice Get encrypted balance (total received - withdrawn)
    function getEncryptedBalance(address employee) external view returns (euint128) {
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
    function processPayrollEncrypted() external onlyOwner returns (euint128) {
        euint128 total = FHE.asEuint128(0);
        
        for (uint i = 0; i < employeeList.length; i++) {
            address emp = employeeList[i];
            
            // Calculate total compensation (salary + bonus)
            euint128 compensation = FHE.add(encryptedSalaries[emp], encryptedBonuses[emp]);
            
            // Add to employee balance
            encryptedBalances[emp] = FHE.add(encryptedBalances[emp], compensation);
            
            // Accumulate total
            total = FHE.add(total, compensation);
            
            // Reset bonus after processing
            encryptedBonuses[emp] = FHE.asEuint128(0);
        }
        
        emit PayrollProcessedEncrypted(employeeList.length);
        return total;
    }

    /// @notice Withdraw salary from encrypted balance (accepts external encrypted input)
    function withdrawSalary(externalEuint64 encryptedAmount, bytes calldata inputProof) external onlyEmployee {
        euint64 amount = FHE.fromExternal(encryptedAmount, inputProof);
        euint128 balance = encryptedBalances[msg.sender];

        // Check if employee has enough balance using encrypted comparison
        ebool canWithdraw = FHE.le(amount, FHE.asEuint64(balance));

        // Only withdraw if enough balance (using select to avoid revert)
        encryptedBalances[msg.sender] = FHE.sub(
            balance,
            FHE.select(canWithdraw, FHE.asEuint128(amount), FHE.asEuint128(0))
        );

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