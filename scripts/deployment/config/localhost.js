const OUTPUT_FILE = "./scripts/deployment/output/localhost.json"
const GAS_PRICE = 20_000_000_000 // 20 Gwei
const TX_CONFIRMATIONS = 1
const ETHERSCAN_BASE_URL = undefined

const COLLATERAL_ADDRESSES = {
	// --- Collateral ---
	RETH_ERC20: undefined,
	WETH_ERC20: undefined,
	WSTETH_ERC20: undefined,
	// --- Price Feed Aggregators ---
	RETH_USD_ORACLE: undefined,
	WETH_USD_ORACLE: undefined,
	WSTETH_USD_ORACLE: undefined,
}

const GRAVITA_ADDRESSES = {
	UPGRADES_PROXY_ADMIN: "0xf99C0eDf98Ed17178B19a6B5a0f3B58753300596",
	SYSTEM_PARAMS_ADMIN: "0xf99C0eDf98Ed17178B19a6B5a0f3B58753300596",
	TREASURY_WALLET: "0xf99C0eDf98Ed17178B19a6B5a0f3B58753300596",
}

const DEPLOY_GRVT_CONTRACTS = false
const GRVT_BENEFICIARIES = {
	"0x19596e1D6cd97916514B5DBaA4730781eFE49975": 1_000_000,
}

module.exports = {
	COLLATERAL_ADDRESSES,
	DEPLOY_GRVT_CONTRACTS,
	ETHERSCAN_BASE_URL,
	GAS_PRICE,
	GRAVITA_ADDRESSES,
	GRVT_BENEFICIARIES,
	OUTPUT_FILE,
	TX_CONFIRMATIONS,
}

