.PHONY: install build test deploy-testnet deploy-mainnet clean

# Install dependencies and Zama fhEVM
install:
	forge install foundry-rs/forge-std --no-commit
	forge install zama-fhe/fhevm --no-commit
	forge install zama-fhe/fhevm-core --no-commit

# Build contracts
build:
	forge build

# Run tests
test:
	forge test

# Deploy to Zama devnet
deploy-devnet:
	@echo "Deploying to Zama Devnet..."
	forge script script/Deploy.s.sol \
		--rpc-url $(ZAMA_FHEVM_RPC_URL) \
		--broadcast \
		--verify \
		--etherscan-api-key $(ZAMA_FHEVM_API_KEY)

# Deploy to Zama testnet (Sepolia)
deploy-testnet:
	@echo "Deploying to Zama Testnet..."
	forge script script/Deploy.s.sol \
		--rpc-url zama_fhevm_sepolia \
		--broadcast \
		--verify \
		--etherscan-api-key $(ZAMA_FHEVM_API_KEY)

# Deploy to Zama mainnet
deploy-mainnet:
	@echo "Deploying to Zama Mainnet..."
	forge script script/Deploy.s.sol \
		--rpc-url zama_fhevm \
		--broadcast \
		--verify \
		--private-key $(DEPLOYER_PRIVATE_KEY) \
		--etherscan-api-key $(ZAMA_FHEVM_API_KEY)

# Clean build artifacts
clean:
	forge clean

# Generate documentation
doc:
	solc --userdoc --devdoc contracts/src/ConfidentialPayroll.sol

# Format code
format:
	forge fmt

# Check code formatting
check:
	forge fmt --check

# Gas snapshot
gas:
	forge snapshot

# Interactive console
console:
	forge console