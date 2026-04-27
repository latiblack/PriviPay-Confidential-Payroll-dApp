// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import {euint32, ebool, euint256, FHE} from "@fhevm/solidity/lib/FHE.sol";

/// @title ConfidentialPayroll
/// @notice Payroll contract with optional FHE encryption via Zama relayer
/// @dev This version uses plaintext storage with encryption handled by relayer
contract ConfidentialPayroll {
    // Contract owner (organization owner)
    address public owner;

    // Organization ID
    bytes32 public orgId;

    // Employee salary (in cents to avoid decimals)
    mapping(address => uint256) public salaries;

    // Employee bonus
    mapping(address => uint256) public bonuses;

    // Vote counts per employee
    mapping(address => uint256) public voteCounts;

    // Employee address list for iteration
    address[] private employeeList;

    // Whether an address is an employee
    mapping(address => bool) public isEmployee;

    // Pending join requests
    mapping(address => bool) public pendingRequests;

    // Relayer address for decryption
    address public relayer;

    // Events
    event SalarySet(address indexed employee, uint256 amount);
    event BonusDistributed(address indexed employee, uint256 amount);
    event VoteCasted(address indexed voter, address indexed candidate);
    event JoinRequested(address indexed user);
    event JoinApproved(address indexed user);
    event PayrollProcessed(uint256 totalAmount);
    event RelayerUpdated(address oldRelayer, address newRelayer);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier onlyRelayer() {
        require(msg.sender == relayer, "Only relayer can call this");
        _;
    }

    constructor(bytes32 _orgId) {
        owner = msg.sender;
        orgId = _orgId;
    }

    /// @notice Set relayer address
    function setRelayer(address _relayer) external onlyOwner {
        emit RelayerUpdated(relayer, _relayer);
        relayer = _relayer;
    }

    /// @notice Request to join the organization
    function requestJoin() external {
        require(!isEmployee[msg.sender], "Already an employee");
        require(!pendingRequests[msg.sender], "Request already pending");
        pendingRequests[msg.sender] = true;
        emit JoinRequested(msg.sender);
    }

    /// @notice Owner approves a join request
    function approveJoin(address user) external onlyOwner {
        require(pendingRequests[user], "No pending request");
        pendingRequests[user] = false;
        isEmployee[user] = true;
        employeeList.push(user);
        emit JoinApproved(user);
    }

    /// @notice Set salary for an employee (in cents)
    function setSalary(address employee, uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be > 0");
        salaries[employee] = amount;
        emit SalarySet(employee, amount);
    }

    /// @notice Set bonus for an employee
    function setBonus(address employee, uint256 amount) external onlyOwner {
        bonuses[employee] = amount;
        emit BonusDistributed(employee, amount);
    }

    /// @notice Get employee's salary
    function getSalary(address employee) external view returns (uint256) {
        require(msg.sender == employee || msg.sender == owner, "Not authorized");
        return salaries[employee];
    }

    /// @notice Get employee's bonus
    function getBonus(address employee) external view returns (uint256) {
        require(msg.sender == employee || msg.sender == owner, "Not authorized");
        return bonuses[employee];
    }

    /// @notice Cast vote for an employee
    function castVoteFor(address voter, address candidate) external onlyOwner {
        require(isEmployee[voter], "Voter is not an employee");
        voteCounts[candidate] += 1;
        emit VoteCasted(voter, candidate);
    }

    /// @notice Get vote count for employee
    function getVoteCount(address employee) external view returns (uint256) {
        return voteCounts[employee];
    }

    /// @notice Distribute bonuses based on votes
    function distributeBonuses(uint256 threshold) external onlyOwner {
        for (uint i = 0; i < employeeList.length; i++) {
            address emp = employeeList[i];
            if (voteCounts[emp] >= threshold) {
                bonuses[emp] = 100000; // 1000 USD default bonus in cents
                emit BonusDistributed(emp, 100000);
            }
        }
    }

    /// @notice Get total payroll
    function getTotalPayroll() external view onlyOwner returns (uint256) {
        uint256 total = 0;
        for (uint i = 0; i < employeeList.length; i++) {
            total += salaries[employeeList[i]];
        }
        return total;
    }

    /// @notice Withdraw salary - called by employee
    function withdrawSalary() external {
        require(isEmployee[msg.sender], "Not an employee");
        uint256 amount = salaries[msg.sender];
        require(amount > 0, "No salary to withdraw");
        
        // In production, this would transfer tokens
        // For now, just emit event
        salaries[msg.sender] = 0;
        emit SalarySet(msg.sender, 0);
    }

    /// @notice Get employee count
    function getEmployeeCount() external view returns (uint256) {
        return employeeList.length;
    }

    /// @notice Get employee by index
    function getEmployee(uint256 index) external view returns (address) {
        require(index < employeeList.length, "Invalid index");
        return employeeList[index];
    }

    /// @notice Remove employee
    function removeEmployee(address employee) external onlyOwner {
        require(isEmployee[employee], "Not an employee");
        isEmployee[employee] = false;
        salaries[employee] = 0;
        bonuses[employee] = 0;
    }
}