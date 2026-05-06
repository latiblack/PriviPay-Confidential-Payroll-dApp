// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint64, euint128, ebool, externalEuint64 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title ConfidentialPayrollFHE
/// @notice Fully confidential payroll contract using Zama FHEVM
/// @dev Deploy on Ethereum Sepolia testnet or Ethereum Mainnet.
///      Inherits ZamaEthereumConfig to configure the FHEVM coprocessor endpoints.
contract ConfidentialPayrollFHE is ZamaEthereumConfig {

    // ─── State ───────────────────────────────────────────────────────────────

    address public owner;
    bytes32 public orgId;

    /// @dev All monetary encrypted values use euint64 consistently.
    ///      euint128 was removed: mixing 64/128 caused silent truncation in comparisons.
    mapping(address => euint64) internal encryptedSalaries;
    mapping(address => euint64) internal encryptedBonuses;
    mapping(address => euint64) internal encryptedBalances;

    /// @dev Active employee list — only contains current employees.
    ///      Removed employees are swapped out so processPayroll never touches them.
    address[] internal employeeList;
    mapping(address => bool) public isEmployee;
    /// @dev index+1 of each employee in employeeList (0 = not in list)
    mapping(address => uint256) internal employeeIndex;

    /// @dev ACL: who can call getEncrypted* for a given employee
    mapping(address => mapping(address => bool)) internal authorizedViewers;

    // ─── Funding (for actual withdrawals) ────────────────────────────────────

    /// @dev Plaintext ETH/token pool deposited by the org owner.
    ///      In a real system this would be an ERC-20; we use ETH for simplicity.
    uint256 public fundPool;

    // ─── Events ──────────────────────────────────────────────────────────────

    event SalarySet(address indexed employee);
    event BonusSet(address indexed employee);
    event PayrollProcessed(uint256 employeeCount);
    event EmployeeAdded(address indexed employee);
    event EmployeeRemoved(address indexed employee);
    event AccessGranted(address indexed employee, address indexed viewer);
    event AccessRevoked(address indexed employee, address indexed viewer);
    event Withdrawn(address indexed employee, uint256 amount);
    event FundsDeposited(address indexed sender, uint256 amount);

    // ─── Errors ──────────────────────────────────────────────────────────────

    error NotOwner();
    error NotEmployee();
    error AlreadyEmployee();
    error NotAuthorized();
    error InsufficientFunds();

    // ─── Modifiers ───────────────────────────────────────────────────────────

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier onlyEmployee() {
        if (!isEmployee[msg.sender]) revert NotEmployee();
        _;
    }

    // ─── Constructor ─────────────────────────────────────────────────────────

    constructor(bytes32 _orgId) {
        owner = msg.sender;
        orgId = _orgId;
    }

    // ─── Funding ─────────────────────────────────────────────────────────────

    /// @notice Org owner deposits ETH to fund payroll withdrawals.
    function depositFunds() external payable onlyOwner {
        fundPool += msg.value;
        emit FundsDeposited(msg.sender, msg.value);
    }

    // ─── Employee Management ─────────────────────────────────────────────────

    /// @notice Add a new employee to the organisation.
    function addEmployee(address employee) external onlyOwner {
        if (isEmployee[employee]) revert AlreadyEmployee();

        isEmployee[employee] = true;
        employeeIndex[employee] = employeeList.length + 1; // 1-indexed
        employeeList.push(employee);

        euint64 zero = FHE.asEuint64(0);
        encryptedSalaries[employee] = zero;
        encryptedBonuses[employee] = zero;
        encryptedBalances[employee] = zero;

        authorizedViewers[employee][owner] = true;
        FHE.allow(zero, owner);
        FHE.allowThis(zero);

        emit EmployeeAdded(employee);
    }

    /// @notice Remove an employee. Cleans up the employeeList array correctly.
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

        euint64 zero = FHE.asEuint64(0);
        encryptedSalaries[employee] = zero;
        encryptedBonuses[employee] = zero;
        encryptedBalances[employee] = zero;

        emit EmployeeRemoved(employee);
    }

    // ─── Salary / Bonus Management ───────────────────────────────────────────

    function setEncryptedSalary(
        address employee,
        externalEuint64 encSalary,
        bytes calldata inputProof
    ) external onlyOwner {
        if (!isEmployee[employee]) revert NotEmployee();

        euint64 salary = FHE.fromExternal(encSalary, inputProof);

        FHE.allow(salary, employee);
        FHE.allow(salary, owner);
        FHE.allowThis(salary);

        encryptedSalaries[employee] = salary;

        authorizedViewers[employee][employee] = true;

        emit SalarySet(employee);
    }

    function setEncryptedBonus(
        address employee,
        externalEuint64 encBonus,
        bytes calldata inputProof
    ) external onlyOwner {
        if (!isEmployee[employee]) revert NotEmployee();

        euint64 bonus = FHE.fromExternal(encBonus, inputProof);

        FHE.allow(bonus, employee);
        FHE.allow(bonus, owner);
        FHE.allowThis(bonus);

        encryptedBonuses[employee] = bonus;

        authorizedViewers[employee][employee] = true;

        emit BonusSet(employee);
    }

    // ─── Read Encrypted Values ───────────────────────────────────────────────

    function getEncryptedSalary(address employee) external view returns (euint64) {
        if (!isEmployee[employee]) revert NotEmployee();
        if (!authorizedViewers[employee][msg.sender]) revert NotAuthorized();
        return encryptedSalaries[employee];
    }

    function getEncryptedBonus(address employee) external view returns (euint64) {
        if (!isEmployee[employee]) revert NotEmployee();
        if (!authorizedViewers[employee][msg.sender]) revert NotAuthorized();
        return encryptedBonuses[employee];
    }

    function getEncryptedBalance(address employee) external view returns (euint64) {
        if (!isEmployee[employee]) revert NotEmployee();
        if (!authorizedViewers[employee][msg.sender]) revert NotAuthorized();
        return encryptedBalances[employee];
    }

    // ─── ACL Management ─────────────────────────────────────────────────────

    function grantAccess(address viewer) external onlyEmployee {
        authorizedViewers[msg.sender][viewer] = true;

        FHE.allow(encryptedSalaries[msg.sender], viewer);
        FHE.allow(encryptedBonuses[msg.sender], viewer);
        FHE.allow(encryptedBalances[msg.sender], viewer);

        emit AccessGranted(msg.sender, viewer);
    }

    function revokeAccess(address viewer) external onlyEmployee {
        if (viewer == owner) revert NotAuthorized();
        authorizedViewers[msg.sender][viewer] = false;
        emit AccessRevoked(msg.sender, viewer);
    }

    function canViewEmployeeData(address employee, address viewer) external view returns (bool) {
        return authorizedViewers[employee][viewer];
    }

    // ─── Payroll Processing ──────────────────────────────────────────────────

    function processPayrollEncrypted() external onlyOwner {
        uint256 count = employeeList.length;

        for (uint256 i = 0; i < count; i++) {
            address emp = employeeList[i];

            euint64 compensation = FHE.add(encryptedSalaries[emp], encryptedBonuses[emp]);

            euint64 newBalance = FHE.add(encryptedBalances[emp], compensation);
            encryptedBalances[emp] = newBalance;

            FHE.allow(newBalance, emp);
            FHE.allow(newBalance, owner);
            FHE.allowThis(newBalance);

            euint64 zero = FHE.asEuint64(0);
            encryptedBonuses[emp] = zero;
            FHE.allowThis(zero);
        }

        emit PayrollProcessed(count);
    }

    // ─── Withdrawal ──────────────────────────────────────────────────────────

    function withdrawSalary(uint64 amount) external onlyEmployee {
        euint64 requestedAmount = FHE.asEuint64(amount);
        euint64 balance = encryptedBalances[msg.sender];

        ebool canWithdraw = FHE.le(requestedAmount, balance);

        euint64 toSubtract = FHE.select(canWithdraw, requestedAmount, FHE.asEuint64(0));
        euint64 newBalance = FHE.sub(balance, toSubtract);
        encryptedBalances[msg.sender] = newBalance;

        FHE.allow(newBalance, msg.sender);
        FHE.allow(newBalance, owner);
        FHE.allowThis(newBalance);

        if (fundPool < amount) revert InsufficientFunds();
        fundPool -= amount;
        (bool ok, ) = msg.sender.call{ value: amount }("");
        require(ok, "ETH transfer failed");

        emit Withdrawn(msg.sender, amount);
    }

    // ─── View Helpers ────────────────────────────────────────────────────────

    function getEmployeeCount() external view returns (uint256) {
        return employeeList.length;
    }

    function getEmployee(uint256 index) external view returns (address) {
        if (index >= employeeList.length) revert NotAuthorized();
        return employeeList[index];
    }

    function getAllEmployees() external view returns (address[] memory) {
        return employeeList;
    }

    function getFundPool() external view returns (uint256) {
        return fundPool;
    }
}