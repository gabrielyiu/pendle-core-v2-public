import { BigNumber } from "ethers"
import { artifacts, assert, contract, ethers, network, upgrades } from "hardhat"

const {
	setBalance,
	time,
	impersonateAccount,
	stopImpersonatingAccount,
} = require("@nomicfoundation/hardhat-network-helpers")

/**
 *  Configure hardhat.config.ts for an Arbitrum fork before running:
  
		hardhat: {
			accounts: accountsList,
			chainId: 42161,
			forking: {
				url: `https://arb-mainnet.g.alchemy.com/v2/[API-KEY]`,
				blockNumber: 169116600,
			},
		},
 */

const AdminContract = artifacts.require("AdminContract")
const PriceFeed = artifacts.require("PriceFeed")
const SortedVessels = artifacts.require("SortedVessels")
const VesselManagerOperations = artifacts.require("VesselManagerOperations")
const GRAI = artifacts.require("DebtToken")
const WETH = artifacts.require("IWETH")
const IRamsesSwapHelper = artifacts.require("IRamsesSwapHelper")

const f = (v: any) => ethers.utils.formatEther(v.toString())
const p = (s: string) => ethers.utils.parseEther(s)

let sortedVessels: any, vesselManagerOperations: any

contract("SwapRedemptionTest", async accounts => {
	const [redeemer] = accounts
	const provider = ethers.provider

  let adminContract: any, swapHelper: any, grai: any

  before(async () => {
    adminContract = await AdminContract.at("0x4928c8F8c20A1E3C295DddBe05095A9aBBdB3d14")
    swapHelper = await IRamsesSwapHelper.at("0xfd26c0df49a6e64247a5d12d67b7c3fe4ac319aa")
    grai = await GRAI.at("0x894134a25a5faC1c2C26F1d8fBf05111a3CB9487")
    sortedVessels = await SortedVessels.at(await adminContract.sortedVessels())
    vesselManagerOperations = await VesselManagerOperations.at(await adminContract.vesselManagerOperations())
  })

  it("SwapRedemptionTest :: ETH", async () => {

    const weth = await WETH.at("0x82aF49447D8a07e3bd95BD0d56f35241523fBab1")
    const poolGraiWeth = "0x8f0e6d286cee76f8866dfb2595d1c103fd7b13d8"
    const priceFeed = await PriceFeed.at(await adminContract.priceFeed())

    const ethBalanceBefore = BigNumber.from(await provider.getBalance(redeemer))
		const price = await priceFeed.fetchPrice(weth.address)

    const assetAmount = p("1")
    const assetValue = _calcValue(assetAmount, price)
		console.log(`Depositing ETH for wETH...`)
		await weth.deposit({ value: assetAmount.toString() })
		console.log(`[wETH] balance: ${f(await weth.balanceOf(redeemer))}`)
		console.log(`[wETH] price: $${f(price)}`)
		console.log(`[wETH] value: $${f(assetValue)}`)

    console.log(`Swapping wETH for GRAI...`)
		await weth.approve(swapHelper.address, ethers.constants.MaxUint256)
		await swapHelper.swap(poolGraiWeth, weth.address, grai.address, true, assetAmount)

		const graiBalance = await grai.balanceOf(redeemer)
		console.log(`[GRAI] balance: $${f(graiBalance)}`)
    const graiCost = ethers.FixedNumber.from(assetValue.toString()).divUnsafe(ethers.FixedNumber.from(graiBalance.toString()))
		console.log(`[GRAI] price: $${graiCost}`)

    await _redeem(weth.address, price, graiBalance)

		console.log(`[GRAI] balance: ${f(await grai.balanceOf(redeemer))}`)
		console.log(`[wETH] balance: ${f(await weth.balanceOf(redeemer))}`)

		console.log(`Withdrawing wETH for ETH...`)
		await weth.withdraw(await weth.balanceOf(redeemer))

		const ethBalanceAfter = BigNumber.from(await provider.getBalance(redeemer))
		const ethBalanceDiff = ethBalanceAfter.sub(ethBalanceBefore)
		const dollarDiff = BigNumber.from(price.toString()).mul(ethBalanceDiff).div(BigNumber.from((1e18).toString()))
		console.log(`ETH balance diff: ${f(ethBalanceDiff)} ($${f(dollarDiff)})`)
	})

  it.skip("SwapRedemptionTest :: wstETH", async () => {

    const wstEthAddress = ""
    const weth = await WETH.at("0x82aF49447D8a07e3bd95BD0d56f35241523fBab1")
    const poolGraiWeth = "0x8f0e6d286cee76f8866dfb2595d1c103fd7b13d8"
    const priceFeed = await PriceFeed.at(await adminContract.priceFeed())

    const ethBalanceBefore = BigNumber.from(await provider.getBalance(redeemer))

    const assetAmount = p("5")
		console.log(`Depositing ETH for wETH...`)
		await weth.deposit({ value: assetAmount.toString() })
		console.log(`[wETH] balance: ${f(await weth.balanceOf(redeemer))}`)
		const price = await priceFeed.fetchPrice(weth.address)
		console.log(`[wETH] price: $${f(price)}`)
    const assetValue = _calcValue(assetAmount, price)
		console.log(`[wETH] value: $${f(assetValue)}`)

		console.log(`Swapping wETH for GRAI...`)
		await weth.approve(swapHelper.address, ethers.constants.MaxUint256)
		await swapHelper.swap(poolGraiWeth, weth.address, grai.address, true, assetAmount)

		const graiBalance = await grai.balanceOf(redeemer)
		console.log(`[GRAI] balance: ${f(graiBalance)}`)
    const graiCost = BigNumber.from(graiBalance.toString()).div(BigNumber.from(assetValue.toString()))
		console.log(`[GRAI] cost: ${f(graiCost)}`)

    await _redeem(weth.address, price, graiBalance)

		console.log(`[GRAI] balance: ${f(await grai.balanceOf(redeemer))}`)
		console.log(`[wETH] balance: ${f(await weth.balanceOf(redeemer))}`)

		console.log(`Withdrawing wETH for ETH...`)
		await weth.withdraw(await weth.balanceOf(redeemer))

		const ethBalanceAfter = BigNumber.from(await provider.getBalance(redeemer))
		const ethBalanceDiff = ethBalanceAfter.sub(ethBalanceBefore)
		const dollarDiff = _calcValue(ethBalanceDiff, price)
		console.log(`ETH balance diff: ${f(ethBalanceDiff)} ($${f(dollarDiff)})`)
	})
})

function _calcValue(assetAmount: any, assetPrice: any) {
  const assetAmountBn = BigNumber.from(assetAmount.toString())
  const assetPriceBn = BigNumber.from(assetPrice.toString())
  const oneEthBn = BigNumber.from((1e18).toString())
  return assetAmountBn.mul(assetPriceBn).div(oneEthBn)
}

async function _redeem(assetAddress: string, assetPrice: bigint, graiAmount: bigint) {
	console.log(`Getting redemption hints 1/3...`)
	const { 0: firstRedemptionHint, 1: partialRedemptionHintNewICR } = await vesselManagerOperations.getRedemptionHints(
		assetAddress,
		graiAmount,
		assetPrice,
		0
	)

	console.log(`Getting redemption hints 2/3...`)
	const { hintAddress } = await vesselManagerOperations.getApproxHint(assetAddress, partialRedemptionHintNewICR, 50, 0)

	console.log(`Getting redemption hints 3/3...`)
	const { 0: upperPartialRedemptionHint, 1: lowerPartialRedemptionHint } = await sortedVessels.findInsertPosition(
		assetAddress,
		partialRedemptionHintNewICR,
		hintAddress,
		hintAddress
	)

	console.log(`Redeeming...`)
	await vesselManagerOperations.redeemCollateral(
		assetAddress,
		graiAmount,
		upperPartialRedemptionHint,
		lowerPartialRedemptionHint,
		firstRedemptionHint,
		partialRedemptionHintNewICR,
		0,
		"50000000000000000"
	)
}

