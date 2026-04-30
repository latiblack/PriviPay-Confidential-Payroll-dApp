// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint32, euint8, euint256, ebool } from "fhevm/lib/FHE.sol";
import { TFHE } from "fhevm/lib/TFHE.sol";
import { Reencrypt } from "fhevm/lib/Reencrypt.sol";

/// @title ConfidentialPayroll
/// @notice FHE-based confidential payroll contract using Zama's fhEVM
/// @dev All salary, bonus, and voting data is encrypted using TFHE (Fully Homomorphic Encryption)
contract ConfidentialPayroll {
    // Contract owner (organization owner)
    address public owner;

    // Organization ID
    bytes32 public orgId;

    // Encrypted employee salary (euint32 - encrypted salary in cents to avoid decimals)
    mapping(address => euint32) private encryptedSalaries;

    // Encrypted employee bonus (euint32)
    mapping(address => euint32) private encryptedBonuses;

    // Vote counts per employee (encrypted, only owner can decrypt final count)
    mapping(address => euint32) private encryptedVoteCounts;

    // Employee address list for iteration
    address[] private employeeList;

    // Whether an address is an employee
    mapping(address => bool) public isEmployee;

    // Pending join requests
    mapping(address => bool) public pendingRequests;

    // Events
    event SalarySet(address indexed employee, bytes32 encryptedAmount);
    event BonusDistributed(address indexed employee, bytes32 encryptedAmount);
    event VoteCasted(address indexed voter, address indexed candidate);
    event JoinRequested(address indexed user);
    event JoinApproved(address indexed user);
    event PayrollProcessed(uint256 totalAmount);
    event EmployeeAdded(address indexed employee, string position);

    constructor(bytes32 _orgId) {
        owner = msg.sender;
        orgId = _orgId;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    /// @notice Request to join the organization
    function requestJoin() external {
        require(!isEmployee[msg.sender], "Already an employee");
        require(!pendingRequests[msg.sender], "Request already pending");
        pendingRequests[msg.sender] = true;
        emit JoinRequested(msg.sender);
    }

    /// @notice Owner approves a join request
    /// @param user The user address to approve
    function approveJoin(address user) external onlyOwner {
        require(pendingRequests[user], "No pending request");
        pendingRequests[user] = false;
        isEmployee[user] = true;
        employeeList.push(user);
        emit JoinApproved(user);
    }

    /// @notice Set encrypted salary for an employee
    /// @param employee Address of the employee
    /// @param encryptedSalary Encrypted salary amount (as bytes32 from frontend)
    function setSalary(address employee, bytes32 encryptedSalary) external onlyOwner {
        euint32 salary = TFHE.asEuint32(encryptedSalary);
        encryptedSalaries[employee] = salary;
        emit SalarySet(employee, encryptedSalary);
    }

    /// @notice Add employee with initial salary
    /// @param employee Address of the new employee
    /// @param position Job position
    /// @param encryptedSalary Encrypted salary
    function addEmployee(address employee, string calldata position, bytes32 encryptedSalary) external onlyOwner {
        euint32 salary = TFHE.asEuint32(encryptedSalary);
        encryptedSalaries[employee] = salary;
        isEmployee[employee] = true;
        employeeList.push(employee);
        
        emit EmployeeAdded(employee, position);
        emit SalarySet(employee, encryptedSalary);
    }

    /// @notice Get employee's encrypted salary for re-encryption to their key
    /// @param employee Address of the employee
    /// @param publicKey Public key to encrypt the result
    function getMySalary(address employee, bytes32 publicKey) external view returns (bytes32) {
        require(msg.sender == employee || msg.sender == owner, "Not authorized");
        return Reencrypt.reencrypt(encryptedSalaries[employee], publicKey, 0);
    }

    /// @notice Get employee's decrypted salary (only employee or owner)
    /// @param employee Address of the employee
    /// @return Decrypted salary in cents
    function getDecryptedSalary(address employee) external view returns (uint256) {
        require(msg.sender == employee || msg.sender == owner, "Not authorized");
        return TFHE.decrypt(encryptedSalaries[employee]);
    }

    /// @notice Cast vote for an employee bonus
    /// @param candidate Address of the candidate
    /// @param voteValue Encrypted vote value
    function castVote(address candidate, bytes32 voteValue) external onlyOwner {
        euint8 vote = TFHE.asEuint8(voteValue);
        euint32 candidateEnc = FHE.asEuint32(candidate);

        euint32 currentCount = encryptedVoteCounts[msg.sender];
        encryptedVoteCounts[msg.sender] = FHE.add(currentCount, candidateEnc);

        emit VoteCasted(msg.sender, candidate);
    }

    /// @notice Owner casts vote on behalf of voter
    /// @param voter Address of the voter
    /// @param candidate Address of the candidate
    function castVoteFor(address voter, address candidate) external onlyOwner {
        euint32 currentCount = encryptedVoteCounts[candidate];
        encryptedVoteCounts[candidate] = FHE.add(currentCount, FHE.asEuint32(1));
        emit VoteCasted(voter, candidate);
    }

    /// @notice Calculate and distribute encrypted bonuses based on votes
    /// @param voteThreshold Encrypted vote threshold
    function distributeBonuses(bytes32 voteThreshold) external onlyOwner {
        euint32 threshold = TFHE.asEuint32(voteThreshold);

        for (uint i = 0; i < employeeList.length; i++) {
            address emp = employeeList[i];
            euint32 votes = encryptedVoteCounts[emp];

            // If votes >= threshold, set bonus
            ebool shouldBonus = FHE.ge(votes, threshold);
            euint32 bonus = FHE.select(shouldBonus, FHE.asEuint32(100000), FHE.asEuint32(0));

            encryptedBonuses[emp] = bonus;
            emit BonusDistributed(emp, TFHE.reencrypt(bonus, 0));
        }
    }

    /// @notice Get total encrypted payroll (owner only)
    /// @return Total payroll as uint256
    function getTotalPayroll() external view onlyOwner returns (uint256) {
        euint256 total = FHE.asEuint256(0);

        for (uint i = 0; i < employeeList.length; i++) {
            euint256 salary = FHE.asEuint256(encryptedSalaries[employeeList[i]]);
            total = FHE.add(total, salary);
        }

        return TFHE.decrypt(total);
    }

    /// @notice Get total encrypted payroll as handle (for re-encryption)
    function getTotalPayrollEncrypted() external view onlyOwner returns (bytes32) {
        euint256 total = FHE.asEuint256(0);

        for (uint i = 0; i < employeeList.length; i++) {
            euint256 salary = FHE.asEuint256(encryptedSalaries[employeeList[i]]);
            total = FHE.add(total, salary);
        }

        return TFHE.reencrypt(total, 0);
    }

    /// @notice Withdraw salary
    /// @param amount Amount to withdraw in cents
    function withdrawSalary(uint256 amount) external {
        require(isEmployee[msg.sender], "Not an employee");
        // In production, this would trigger relayer for USDC transfer
        emit SalarySet(msg.sender, bytes32(amount));
    }

    /// @notice Get employee count
    function getEmployeeCount() external view returns (uint256) {
        return employeeList.length;
    }

    /// @notice Check if employee is active
    function getEmployeeStatus(address employee) external view returns (bool) {
        return isEmployee[employee];
    }

    /// @notice Get employee list (for off-chain iteration)
    function getEmployeeList() external view onlyOwner returns (address[] memory) {
        return employeeList;
    }
}