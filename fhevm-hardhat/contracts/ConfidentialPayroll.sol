// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint64, ebool, externalEuint64 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

contract ConfidentialPayroll is ZamaEthereumConfig {
    address public owner;

    mapping(address => euint64) internal salaries;
    mapping(address => euint64) internal bonuses;
    mapping(address => euint64) internal balances;

    address[] internal employeeList;
    mapping(address => bool) public isEmployee;
    mapping(address => uint256) internal employeeIndex;

    uint256 public fundPool;

    event EmployeeAdded(address indexed employee);
    event EmployeeRemoved(address indexed employee);
    event SalarySet(address indexed employee);
    event BonusSet(address indexed employee);
    event PayrollProcessed(uint256 employeeCount);
    event Withdrawn(address indexed employee, uint256 amount);
    event FundsDeposited(address indexed sender, uint256 amount);

    error NotOwner();
    error NotEmployee();
    error AlreadyEmployee();
    error InsufficientFunds();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier onlyEmployee() {
        if (!isEmployee[msg.sender]) revert NotEmployee();
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function depositFunds() external payable onlyOwner {
        fundPool += msg.value;
        emit FundsDeposited(msg.sender, msg.value);
    }

    function addEmployee(address employee) external onlyOwner {
        if (isEmployee[employee]) revert AlreadyEmployee();

        isEmployee[employee] = true;
        employeeIndex[employee] = employeeList.length + 1;
        employeeList.push(employee);

        euint64 zero = FHE.asEuint64(0);
        salaries[employee] = zero;
        bonuses[employee] = zero;
        balances[employee] = zero;

        FHE.allowThis(zero);
        FHE.allow(zero, owner);
        FHE.allow(zero, employee);

        emit EmployeeAdded(employee);
    }

    function removeEmployee(address employee) external onlyOwner {
        if (!isEmployee[employee]) revert NotEmployee();

        isEmployee[employee] = false;

        uint256 idx = employeeIndex[employee] - 1;
        uint256 lastIdx = employeeList.length - 1;
        if (idx != lastIdx) {
            address last = employeeList[lastIdx];
            employeeList[idx] = last;
            employeeIndex[last] = idx + 1;
        }
        employeeList.pop();
        delete employeeIndex[employee];

        emit EmployeeRemoved(employee);
    }

    function setSalary(
        address employee,
        externalEuint64 encSalary,
        bytes calldata inputProof
    ) external onlyOwner {
        if (!isEmployee[employee]) revert NotEmployee();

        euint64 salary = FHE.fromExternal(encSalary, inputProof);
        FHE.allowThis(salary);
        FHE.allow(salary, owner);
        FHE.allow(salary, employee);

        salaries[employee] = salary;
        emit SalarySet(employee);
    }

    function setBonus(
        address employee,
        externalEuint64 encBonus,
        bytes calldata inputProof
    ) external onlyOwner {
        if (!isEmployee[employee]) revert NotEmployee();

        euint64 bonus = FHE.fromExternal(encBonus, inputProof);
        FHE.allowThis(bonus);
        FHE.allow(bonus, owner);
        FHE.allow(bonus, employee);

        bonuses[employee] = bonus;
        emit BonusSet(employee);
    }

    function processPayroll() external onlyOwner {
        uint256 count = employeeList.length;

        for (uint256 i = 0; i < count; i++) {
            address emp = employeeList[i];

            euint64 compensation = FHE.add(salaries[emp], bonuses[emp]);
            euint64 newBalance = FHE.add(balances[emp], compensation);

            FHE.allowThis(newBalance);
            FHE.allow(newBalance, owner);
            FHE.allow(newBalance, emp);

            balances[emp] = newBalance;

            euint64 zero = FHE.asEuint64(0);
            FHE.allowThis(zero);
            bonuses[emp] = zero;
        }

        emit PayrollProcessed(count);
    }

    function withdraw(uint64 amountCents, uint64 ethAmount) external onlyEmployee {
        euint64 requested = FHE.asEuint64(amountCents);
        euint64 balance = balances[msg.sender];

        ebool canWithdraw = FHE.le(requested, balance);
        euint64 toSubtract = FHE.select(canWithdraw, requested, FHE.asEuint64(0));
        euint64 newBalance = FHE.sub(balance, toSubtract);

        FHE.allowThis(newBalance);
        FHE.allow(newBalance, owner);
        FHE.allow(newBalance, msg.sender);

        balances[msg.sender] = newBalance;

        if (fundPool < ethAmount) revert InsufficientFunds();
        fundPool -= ethAmount;
        (bool ok, ) = msg.sender.call{value: ethAmount}("");
        require(ok, "ETH transfer failed");

        emit Withdrawn(msg.sender, ethAmount);
    }

    function getBalance(address employee) external view returns (euint64) {
        if (!isEmployee[employee]) revert NotEmployee();
        return balances[employee];
    }

    function getSalary(address employee) external view returns (euint64) {
        if (!isEmployee[employee]) revert NotEmployee();
        return salaries[employee];
    }

    function getBonus(address employee) external view returns (euint64) {
        if (!isEmployee[employee]) revert NotEmployee();
        return bonuses[employee];
    }

    euint64 public totalCompensation;

    function updateTotalCompensation() external onlyOwner {
        euint64 total = FHE.asEuint64(0);
        FHE.allow(total, owner);
        for (uint256 i = 0; i < employeeList.length; i++) {
            address emp = employeeList[i];
            total = FHE.add(total, salaries[emp]);
            FHE.allow(total, owner);
            total = FHE.add(total, bonuses[emp]);
            FHE.allow(total, owner);
        }
        FHE.allowThis(total);
        totalCompensation = total;
    }

    function getEmployeeCount() external view returns (uint256) {
        return employeeList.length;
    }

    function getEmployeeAt(uint256 index) external view returns (address) {
        return employeeList[index];
    }

    function getAllEmployees() external view returns (address[] memory) {
        return employeeList;
    }
}
