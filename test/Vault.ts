import { expect } from "chai";
import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { parseEther, parseUnits } from "viem";

describe("Vault", function () {
  async function deployFixture() {
    const [owner, user] = await hre.viem.getWalletClients();
    const weth = await hre.viem.deployContract("WETH", []);
    const usdc = await hre.viem.deployContract("USDC", []);
    const vault = await hre.viem.deployContract("Vault", [weth.address]);
    const publicClient = await hre.viem.getPublicClient();
    return { vault, weth, usdc, owner, user, publicClient };
  }

  describe("ETH Operations", function () {
    it("Should deposit ETH", async function () {
      const { vault, user, publicClient } = await loadFixture(deployFixture);
      const userBalanceBefore = await publicClient.getBalance({
        address: user.account.address,
      });
      await vault.write.depositETH({
        account: user.account,
        value: parseEther("1.0"),
      });
      expect(await vault.read.getETHBalance([user.account.address])).to.equal(
        parseEther("1.0")
      );
      expect(
        Number(await publicClient.getBalance({ address: user.account.address }))
      ).to.closeTo(
        Number(userBalanceBefore - parseEther("1.0")),
        Number(parseEther("0.0001"))
      );
    });

    it("Should withdraw ETH", async function () {
      const { vault, owner } = await loadFixture(deployFixture);
      await vault.write.depositETH({
        account: owner.account,
        value: parseEther("1.0"),
      });
      await vault.write.withdrawETH([parseEther("0.5")], {
        account: owner.account,
      });
      expect(await vault.read.getETHBalance([owner.account.address])).to.equal(
        parseEther("0.5")
      );
    });

    it("Should fail to withdraw more ETH than deposited", async function () {
      const { vault, owner } = await loadFixture(deployFixture);
      await vault.write.depositETH({
        account: owner.account,
        value: parseEther("1.0"),
      });
      await expect(
        vault.write.withdrawETH([parseEther("2.0")], {
          account: owner.account,
        })
      ).to.be.rejectedWith("Insufficient balance");
    });
  });

  describe("ERC20 Token Operations", function () {
    it("Should deposit ERC20 tokens", async function () {
      const { vault, usdc, owner } = await loadFixture(deployFixture);
      await usdc.write.mint([owner.account.address, parseUnits("1000", 6)], {
        account: owner.account,
      });
      await usdc.write.approve([vault.address, parseUnits("100", 6)], {
        account: owner.account,
      });
      await vault.write.depositToken([usdc.address, parseUnits("100", 6)], {
        account: owner.account,
      });
      expect(
        await vault.read.getTokenBalance([owner.account.address, usdc.address])
      ).to.equal(parseUnits("100", 6));
    });

    it("Should withdraw ERC20 tokens", async function () {
      const { vault, usdc, owner } = await loadFixture(deployFixture);
      await usdc.write.mint([owner.account.address, parseUnits("1000", 6)], {
        account: owner.account,
      });
      await usdc.write.approve([vault.address, parseUnits("100", 6)], {
        account: owner.account,
      });
      await vault.write.depositToken([usdc.address, parseUnits("100", 6)], {
        account: owner.account,
      });
      await vault.write.withdrawToken([usdc.address, parseUnits("50", 6)], {
        account: owner.account,
      });
      expect(
        await vault.read.getTokenBalance([owner.account.address, usdc.address])
      ).to.equal(parseUnits("50", 6));
    });

    it("Should fail to withdraw more ERC20 tokens than deposited", async function () {
      const { vault, usdc, owner } = await loadFixture(deployFixture);
      await usdc.write.mint([owner.account.address, parseUnits("1000", 6)], {
        account: owner.account,
      });
      await usdc.write.approve([vault.address, parseUnits("100", 6)], {
        account: owner.account,
      });
      await vault.write.depositToken([usdc.address, parseUnits("100", 6)], {
        account: owner.account,
      });
      await expect(
        vault.write.withdrawToken([usdc.address, parseUnits("200", 6)], {
          account: owner.account,
        })
      ).to.be.rejectedWith("Insufficient balance");
    });
  });

  describe("Wrap and Unwrap ETH", function () {
    it("Should wrap ETH to WETH", async function () {
      const { vault, weth, owner } = await loadFixture(deployFixture);
      await vault.write.depositETH({
        account: owner.account,
        value: parseEther("1.0"),
      });
      await vault.write.wrapETH([parseEther("1.0")], {
        account: owner.account,
      });
      expect(
        await vault.read.getTokenBalance([owner.account.address, weth.address])
      ).to.equal(parseEther("1.0"));
      expect(await vault.read.getETHBalance([owner.account.address])).to.equal(
        parseEther("0")
      );
    });

    it("Should unwrap WETH to ETH", async function () {
      const { vault, weth, owner } = await loadFixture(deployFixture);
      await vault.write.depositETH({
        account: owner.account,
        value: parseEther("1.0"),
      });
      await vault.write.wrapETH([parseEther("1.0")], {
        account: owner.account,
      });
      await vault.write.unwrapWETH([parseEther("0.5")], {
        account: owner.account,
      });
      expect(
        await vault.read.getTokenBalance([owner.account.address, weth.address])
      ).to.equal(parseEther("0.5"));
      expect(await vault.read.getETHBalance([owner.account.address])).to.equal(
        parseEther("0.5")
      );
    });

    it("Should fail to unwrap more WETH than wrapped", async function () {
      const { vault, weth, owner } = await loadFixture(deployFixture);
      await vault.write.depositETH({
        account: owner.account,
        value: parseEther("1.0"),
      });
      await vault.write.wrapETH([parseEther("1.0")], {
        account: owner.account,
      });
      await expect(
        vault.write.unwrapWETH([parseEther("2.0")], {
          account: owner.account,
        })
      ).to.be.rejectedWith("Insufficient balance");
    });
  });
});
