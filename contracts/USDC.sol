// write a USDC contract that inherits from openzeppelin's ERC20 contract

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract USDC is ERC20 {
    constructor() ERC20("USD Coin", "USDC") {}
    
    function mint(address account, uint256 amount) external {
        _mint(account, amount);
    }
}