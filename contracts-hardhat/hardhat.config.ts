import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@fhevm/hardhat-plugin";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    // Local development
    hardhat: {
      chainId: 31337,
      forking: process.env.SEPOLIA_RPC_URL
        ? {
            url: process.env.SEPOLIA_RPC_URL,
            blockNumber: 5000000,
          }
        : undefined,
    },
    // Zama Sepolia Testnet
    zamaSepolia: {
      url: process.env.ZAMA_SEPOLIA_RPC_URL || "https://rpc.sepolia.zama.xyz",
      chainId: 534351,
      accounts: process.env.PRIVATE_KEY
        ? [process.env.PRIVATE_KEY]
        : [],
    },
    // Ethereum Sepolia
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "",
      chainId: 11155111,
      accounts: process.env.PRIVATE_KEY
        ? [process.env.PRIVATE_KEY]
        : [],
    },
  },
  fhevm: {
    version: "0.3.0",
    // Zama Sepolia Testnet addresses
    aclContractAddress: "0xf0Ffdc93b7E186bC2f8CB3dAA75D86d1930A433D",
    kmsVerifierContractAddress: "0xbE0E383937d564D7FF0BC3b46c51f0bF8d5C311A",
    inputVerifierContractAddress: "0xBBC1fFCdc7C316aAAd72E807D9b0272BE8F84DA0",
    decryptionAddress: "0x5D8BD78e2ea6bbE41f26dFe9fdaEAa349e077478",
    relayerUrl: "https://relayer.testnet.zama.org",
    executorAddress: "0x92C920834Ec8941d2C77D188936E1f7A6f49c127",
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY || "",
  },
};

export default config;