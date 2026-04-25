// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.27;

import "@zama/fhe-sdk/contracts/TFHE.sol";
import "@zama/fhe-sdk/contracts/Reencrypt.sol";

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

    // Pending join requests (encrypted wallet -> encrypted status)
    mapping(address => bool) public pendingRequests;

    // Events
    event SalarySet(address indexed employee, bytes32 encryptedAmount);
    event BonusDistributed(address indexed employee, bytes32 encryptedAmount);
    event VoteCasted(address indexed voter, address indexed candidate);
    event JoinRequested(address indexed user);
    event JoinApproved(address indexed user);
    event PayrollProcessed(uint256 totalAmount);

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
    /// @param encryptedSalary Encrypted salary amount (as bytes from frontend)
    function setSalary(address employee, bytes32 encryptedSalary) external onlyOwner {
        euint32 salary = TFHE.asEuint32(encryptedSalary);
        encryptedSalaries[employee] = salary;
        emit SalarySet(employee, encryptedSalary);
    }

    /// @notice Get employee's encrypted salary for re-encryption to their key
    /// @param employee Address of the employee
    /// @param publicKey Public key to encrypt the result (EIP-5630)
    function getMySalary(address employee, bytes32 publicKey) external view returns (bytes32) {
        require(msg.sender == employee || msg.sender == owner, "Not authorized");
        return Reencrypt.reencrypt(encryptedSalaries[employee], publicKey, 0);
    }

    /// @notice Cast an encrypted vote for an employee bonus
    /// @param encryptedCandidate Encrypted address of the candidate (as bytes)
    /// @param encryptedVote Encrypted vote value (euint8 = 1)
    function castVote(bytes32 encryptedCandidate, bytes32 encryptedVote) external onlyOwner {
        euint8 vote = TFHE.asEuint8(encryptedVote);
        euint32 candidate = TFHE.asEuint32(encryptedCandidate);

        // Add vote to candidate's count (encrypted addition)
        euint32 currentCount = encryptedVoteCounts[msg.sender];
        encryptedVoteCounts[msg.sender] = TFHE.add(currentCount, candidate);

        emit VoteCasted(msg.sender, address(0)); // Can't decrypt candidate address
    }

    /// @notice Owner casts vote on behalf of voter (for demo - in production, use Zama's threshold FHE)
    function castVoteFor(address voter, address candidate) external onlyOwner {
        euint32 currentCount = encryptedVoteCounts[candidate];
        encryptedVoteCounts[candidate] = TFHE.add(currentCount, TFHE.asEuint32(1));
        emit VoteCasted(voter, candidate);
    }

    /// @notice Calculate and distribute encrypted bonuses based on votes (owner only)
    /// @param voteThreshold Minimum encrypted votes needed to receive bonus
    function distributeBonuses(bytes32 voteThreshold) external onlyOwner {
        euint32 threshold = TFHE.asEuint32(voteThreshold);

        for (uint i = 0; i < employeeList.length; i++) {
            address emp = employeeList[i];
            euint32 votes = encryptedVoteCounts[emp];

            // If votes >= threshold, set bonus (encrypted conditional)
            euint8 shouldBonus = TFHE.ge(votes, threshold);
            euint32 bonus = TFHE.select(shouldBonus, TFHE.asEuint32(100000), TFHE.asEuint32(0)); // 1000 USD default bonus

            encryptedBonuses[emp] = bonus;
            emit BonusDistributed(emp, TFHE.reencrypt(bonus, 0));
        }
    }

    /// @notice Get total encrypted payroll (owner only can compute)
    /// @return Total payroll as encrypted euint256
    function getTotalPayroll() external view onlyOwner returns (bytes32) {
        euint256 total = TFHE.asEuint256(0);

        for (uint i = 0; i < employeeList.length; i++) {
            euint256 salary = TFHE.asEuint256(encryptedSalaries[employeeList[i]]);
            total = TFHE.add(total, salary);
        }

        return TFHE.reencrypt(total, 0);
    }

    /// @notice Withdraw salary (employee re-encrypts to own key and withdraws)
    /// @param amount Amount to withdraw (will be verified on-chain against encrypted balance)
    /// @param publicKey Employee's public key for re-encryption
    function withdrawSalary(uint256 amount, bytes32 publicKey) external {
        require(isEmployee[msg.sender], "Not an employee");

        // Re-encrypt salary to employee's key so they can decrypt and verify
        bytes32 encryptedAmount = Reencrypt.reencrypt(encryptedSalaries[msg.sender], publicKey, 0);

        // In a real implementation, Zama's fhEVM would handle the withdrawal
        // by decrypting to a relayer who then sends the actual transaction
        // This is a placeholder for the FHE-to-cleartext bridge

        emit SalarySet(msg.sender, encryptedAmount);
    }

    /// @notice Get employee count
    function getEmployeeCount() external view returns (uint256) {
        return employeeList.length;
    }

    /// @notice Check if employee is active
    function getEmployeeStatus(address employee) external view returns (bool) {
        return isEmployee[employee];
    }
}