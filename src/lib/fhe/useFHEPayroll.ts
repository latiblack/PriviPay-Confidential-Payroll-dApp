"use client";

import { useCallback, useMemo } from "react";
import { useAccount, useChainId, useReadContract, useWriteContract } from "wagmi";
import { useEncrypt, useUserDecrypt, useAllow } from "@zama-fhe/react-sdk";
import { bytesToHex } from "viem";
import { ethers } from "ethers";
import artifact from "../contracts/ConfidentialPayrollFHE.json";

const FHE_ABI = artifact.abi;

export interface PayrollContractConfig {
  address: string;
  abi: typeof FHE_ABI;
}

export const useFHEPayroll = (contractAddress: string) => {
  const { address: userAddress, isConnected } = useAccount();
  const chainId = useChainId();

  const contractConfig = useMemo(() => ({
    address: contractAddress as `0x${string}`,
    abi: FHE_ABI,
  }), [contractAddress]);

  const canUseContract = Boolean(contractAddress && isConnected);

  // Read contract data
  const encryptedSalaryResult = useReadContract({
    address: canUseContract ? contractConfig.address : undefined,
    abi: contractConfig.abi,
    functionName: "getEncryptedSalary",
    args: canUseContract && userAddress ? [userAddress] : undefined,
    query: {
      enabled: canUseContract && !!userAddress,
    },
  });

  const encryptedBalanceResult = useReadContract({
    address: canUseContract ? contractConfig.address : undefined,
    abi: contractConfig.abi,
    functionName: "getEncryptedBalance",
    args: canUseContract && userAddress ? [userAddress] : undefined,
    query: {
      enabled: canUseContract && !!userAddress,
    },
  });

  // Encrypt hook
  const encrypt = useEncrypt();
  const { writeContractAsync } = useWriteContract();

  // Allow hook for decryption
  const { mutate: allow } = useAllow();

  // Decrypt handles
  const decryptHandles = useMemo(() => {
    const handles: { handle: string; contractAddress: string }[] = [];
    
    if (encryptedSalaryResult.data && encryptedSalaryResult.data !== ethers.ZeroHash) {
      handles.push({
        handle: encryptedSalaryResult.data,
        contractAddress,
      });
    }
    
    if (encryptedBalanceResult.data && encryptedBalanceResult.data !== ethers.ZeroHash) {
      handles.push({
        handle: encryptedBalanceResult.data,
        contractAddress,
      });
    }
    
    return handles;
  }, [encryptedSalaryResult.data, encryptedBalanceResult.data, contractAddress]);

  const decrypt = useUserDecrypt({ handles: decryptHandles }, { enabled: decryptHandles.length > 0 });

  // Add employee with encrypted salary
  const addEmployee = useCallback(async (employeeAddress: string, salaryUSD: number) => {
    if (!canUseContract || !userAddress || !contractAddress) {
      throw new Error("Contract not ready");
    }

    const salaryInCents = Math.round(salaryUSD * 100);

    // First add employee
    await writeContractAsync({
      address: contractConfig.address,
      abi: contractConfig.abi,
      functionName: "addEmployee",
      args: [employeeAddress],
      gas: 3_000_000n,
    });

    // Then set encrypted salary
    const enc = await encrypt.mutateAsync({
      values: [{ value: BigInt(salaryInCents), type: "euint64" }],
      contractAddress,
      userAddress,
    });

    await writeContractAsync({
      address: contractConfig.address,
      abi: contractConfig.abi,
      functionName: "setEncryptedSalary",
      args: [
        employeeAddress,
        bytesToHex(enc.handles[0]!),
        bytesToHex(enc.inputProof),
      ],
      gas: 3_000_000n,
    });

    return true;
  }, [canUseContract, userAddress, contractAddress, contractConfig, encrypt, writeContractAsync]);

  // Set encrypted salary
  const setEncryptedSalary = useCallback(async (employeeAddress: string, salaryUSD: number) => {
    if (!canUseContract || !userAddress || !contractAddress) {
      throw new Error("Contract not ready");
    }

    const salaryInCents = Math.round(salaryUSD * 100);

    const enc = await encrypt.mutateAsync({
      values: [{ value: BigInt(salaryInCents), type: "euint64" }],
      contractAddress,
      userAddress,
    });

    await writeContractAsync({
      address: contractConfig.address,
      abi: contractConfig.abi,
      functionName: "setEncryptedSalary",
      args: [
        employeeAddress,
        bytesToHex(enc.handles[0]!),
        bytesToHex(enc.inputProof),
      ],
      gas: 3_000_000n,
    });

    return true;
  }, [canUseContract, userAddress, contractAddress, contractConfig, encrypt, writeContractAsync]);

  // Process payroll
  const processPayroll = useCallback(async () => {
    if (!canUseContract) {
      throw new Error("Contract not ready");
    }

    await writeContractAsync({
      address: contractConfig.address,
      abi: contractConfig.abi,
      functionName: "processPayrollEncrypted",
      gas: 5_000_000n,
    });

    return true;
  }, [canUseContract, contractConfig, writeContractAsync]);

  // Withdraw salary
  const withdrawSalary = useCallback(async (amountUSD: number) => {
    if (!canUseContract || !userAddress || !contractAddress) {
      throw new Error("Contract not ready");
    }

    const amountInCents = Math.round(amountUSD * 100);

    const enc = await encrypt.mutateAsync({
      values: [{ value: BigInt(amountInCents), type: "euint64" }],
      contractAddress,
      userAddress,
    });

    await writeContractAsync({
      address: contractConfig.address,
      abi: contractConfig.abi,
      functionName: "withdrawSalary",
      args: [
        bytesToHex(enc.handles[0]!),
        bytesToHex(enc.inputProof),
      ],
      gas: 3_000_000n,
    });

    return true;
  }, [canUseContract, userAddress, contractAddress, contractConfig, encrypt, writeContractAsync]);

  // Get decrypted values
  const getDecryptedSalary = useCallback(() => {
    if (!encryptedSalaryResult.data || encryptedSalaryResult.data === ethers.ZeroHash) {
      return undefined;
    }
    return decrypt.data?.[encryptedSalaryResult.data];
  }, [encryptedSalaryResult.data, decrypt.data]);

  const getDecryptedBalance = useCallback(() => {
    if (!encryptedBalanceResult.data || encryptedBalanceResult.data === ethers.ZeroHash) {
      return undefined;
    }
    return decrypt.data?.[encryptedBalanceResult.data];
  }, [encryptedBalanceResult.data, decrypt.data]);

  return {
    // Contract state
    contractAddress,
    isReady: canUseContract,
    
    // Employee operations
    addEmployee,
    setEncryptedSalary,
    processPayroll,
    withdrawSalary,
    
    // Read operations
    encryptedSalaryHandle: encryptedSalaryResult.data,
    encryptedBalanceHandle: encryptedBalanceResult.data,
    isLoading: encryptedSalaryResult.isLoading || encryptedBalanceResult.isLoading,
    
    // Decryption
    decryptSalary: getDecryptedSalary,
    decryptBalance: getDecryptedBalance,
    isDecrypting: decrypt.isFetching,
    
    // Re-fetch
    refetch: () => {
      encryptedSalaryResult.refetch();
      encryptedBalanceResult.refetch();
    },
  };
};