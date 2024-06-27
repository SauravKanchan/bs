// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IWETH is IERC20 {
    function deposit() external payable;
    function withdraw(uint256) external;
}

contract Vault is ReentrancyGuard {
    using SafeERC20 for IERC20;

    mapping(address => uint256) private ethBalances;
    mapping(address => mapping(IERC20 => uint256)) private tokenBalances;

    IWETH public immutable WETH;

    constructor(IWETH _weth) {
        WETH = _weth;
    }

    /**
    * @dev Deposit ETH into the vault
    */
    function depositETH() public payable nonReentrant {
        require(msg.value > 0, "Deposit value must be greater than 0");
        ethBalances[msg.sender] += msg.value;
    }

    /**
    * @dev Withdraw ETH from the vault
    * @param amount The amount of ETH to withdraw
    */
    function withdrawETH(uint256 amount) external nonReentrant {
        require(amount > 0, "Withdraw amount must be greater than 0");
        require(ethBalances[msg.sender] >= amount, "Insufficient balance");
        ethBalances[msg.sender] -= amount;
        (bool sent, ) = msg.sender.call{value: amount}("");
        require(sent, "Failed to send Ether");
    }

    /**
    * @dev Deposit ERC20 tokens into the vault
    * @param token The address of the ERC20 token to deposit
    * @param amount The amount of ERC20 tokens to deposit
    */
    function depositToken(IERC20 token, uint256 amount) external nonReentrant {
        require(amount > 0, "Deposit amount must be greater than 0");
        token.safeTransferFrom(msg.sender, address(this), amount);
        tokenBalances[msg.sender][token] += amount;
    }

    /**
    * @dev Withdraw ERC20 tokens from the vault
    * @param token The address of the ERC20 token to withdraw
    * @param amount The amount of ERC20 tokens to withdraw
    */
    function withdrawToken(IERC20 token, uint256 amount) external nonReentrant {
        require(amount > 0, "Withdraw amount must be greater than 0");
        require(tokenBalances[msg.sender][token] >= amount, "Insufficient balance");
        tokenBalances[msg.sender][token] -= amount;
        token.safeTransfer(msg.sender, amount);
    }

    /**
    * @dev Wrap ETH to WETH within the vault
    * @param amount The amount of ETH to wrap into WETH
    */
    function wrapETH(uint256 amount) external nonReentrant {
        require(amount > 0, "Wrap amount must be greater than 0");
        require(ethBalances[msg.sender] >= amount, "Insufficient balance");
        ethBalances[msg.sender] -= amount;
        WETH.deposit{value: amount}();
        tokenBalances[msg.sender][WETH] += amount;
    }

    /**
    * @dev Unwrap WETH to ETH within the vault
    * @param amount The amount of WETH to unwrap into ETH
    */
    function unwrapWETH(uint256 amount) external nonReentrant {
        require(amount > 0, "Unwrap amount must be greater than 0");
        require(tokenBalances[msg.sender][WETH] >= amount, "Insufficient balance");
        tokenBalances[msg.sender][WETH] -= amount;
        WETH.withdraw(amount);
        ethBalances[msg.sender] += amount;
    }

    /**
    * @dev Get the ETH balance of an account
    * @param account The address of the account
    * @return The ETH balance of the account
    */
    function getETHBalance(address account) external view returns (uint256) {
        return ethBalances[account];
    }

    /**
    * @dev Get the token balance of an account
    * @param account The address of the account
    * @param token The address of the token
    * @return The token balance of the account
    */
    function getTokenBalance(address account, IERC20 token) external view returns (uint256) {
        return tokenBalances[account][token];
    }

    receive() external payable {}
}
