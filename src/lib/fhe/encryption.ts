export interface EncryptedData {
  bytes: string;
  type: "euint32" | "euint64" | "euint256" | "euint8";
}

export interface KeyPair {
  publicKey: string;
  privateKey: string;
}

function generateRandomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    bytes[i] = Math.floor(Math.random() * 256);
  }
  return bytes;
}

function uint8ArrayToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
}

function hexToUint8Array(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

export function generateKeyPair(): KeyPair {
  const privateKeyBytes = generateRandomBytes(32);
  const publicKeyBytes = generateRandomBytes(32);

  return {
    privateKey: uint8ArrayToHex(privateKeyBytes),
    publicKey: uint8ArrayToHex(publicKeyBytes),
  };
}

export function encryptSalary(amount: number): EncryptedData {
  const salt = generateRandomBytes(16);
  const amountBytes = new Uint8Array(4);
  amountBytes[0] = amount & 0xff;
  amountBytes[1] = (amount >> 8) & 0xff;
  amountBytes[2] = (amount >> 16) & 0xff;
  amountBytes[3] = (amount >> 24) & 0xff;

  const encrypted = new Uint8Array(48);
  encrypted.set(salt, 0);
  encrypted.set(amountBytes, 16);
  encrypted.set(generateRandomBytes(16), 32);

  return {
    bytes: uint8ArrayToHex(encrypted),
    type: "euint32",
  };
}

export function decryptSalary(encryptedData: EncryptedData): number {
  try {
    const encryptedBytes = hexToUint8Array(encryptedData.bytes);
    const value = encryptedBytes[16] |
                  (encryptedBytes[17] << 8) |
                  (encryptedBytes[18] << 16) |
                  (encryptedBytes[19] << 24);
    return value >>> 0;
  } catch {
    return 0;
  }
}

export function reencryptForUser(encryptedData: EncryptedData, userPublicKey: string): string {
  const encryptedBytes = hexToUint8Array(encryptedData.bytes);
  const publicKeyBytes = hexToUint8Array(userPublicKey);

  const reencrypted = new Uint8Array(48);
  for (let i = 0; i < 16; i++) {
    reencrypted[i] = encryptedBytes[i] ^ publicKeyBytes[i % 32];
  }
  reencrypted.set(encryptedBytes.slice(16, 32), 16);
  for (let i = 0; i < 16; i++) {
    reencrypted[32 + i] = encryptedBytes[32 + i] ^ publicKeyBytes[(i + 16) % 32];
  }

  return uint8ArrayToHex(reencrypted);
}

export function decryptWithPrivateKey(reencryptedData: string, privateKey: string): number {
  try {
    const reencryptedBytes = hexToUint8Array(reencryptedData);
    const privateKeyBytes = hexToUint8Array(privateKey);

    const decrypted = new Uint8Array(16);
    for (let i = 0; i < 16; i++) {
      decrypted[i] = reencryptedBytes[i] ^ privateKeyBytes[i % 32];
    }

    const value = decrypted[0] |
                  (decrypted[1] << 8) |
                  (decrypted[2] << 16) |
                  (decrypted[3] << 24);
    return value >>> 0;
  } catch {
    return 0;
  }
}

export function encryptVote(employeeAddress: string): EncryptedData {
  const salt = generateRandomBytes(16);
  const addressBytes = hexToUint8Array(employeeAddress.slice(2, 10));

  const encrypted = new Uint8Array(48);
  encrypted.set(salt, 0);
  encrypted.set(addressBytes, 16);
  encrypted.set(generateRandomBytes(16), 32);

  return {
    bytes: uint8ArrayToHex(encrypted),
    type: "euint8",
  };
}

export function simulateTFHEOperation(
  a: EncryptedData,
  b: EncryptedData,
  operation: "add" | "sub" | "mul" | "ge" | "select"
): EncryptedData {
  const aBytes = hexToUint8Array(a.bytes);
  const bBytes = hexToUint8Array(b.bytes);

  const result = new Uint8Array(48);

  for (let i = 0; i < 16; i++) {
    result[i] = aBytes[i] ^ bBytes[i];
  }

  const aValue = aBytes[16] | (aBytes[17] << 8) | (aBytes[18] << 16) | (aBytes[19] << 24);
  const bValue = bBytes[16] | (bBytes[17] << 8) | (bBytes[18] << 16) | (bBytes[19] << 24);

  let computed: number;
  switch (operation) {
    case "add":
      computed = (aValue + bValue) & 0xffffffff;
      break;
    case "sub":
      computed = (aValue - bValue) & 0xffffffff;
      break;
    case "mul":
      computed = (aValue * bValue) & 0xffffffff;
      break;
    case "ge":
      computed = aValue >= bValue ? 1 : 0;
      break;
    case "select":
      computed = aValue !== 0 ? bValue : 0;
      break;
    default:
      computed = aValue;
  }

  result[16] = computed & 0xff;
  result[17] = (computed >> 8) & 0xff;
  result[18] = (computed >> 16) & 0xff;
  result[19] = (computed >> 24) & 0xff;

  for (let i = 0; i < 16; i++) {
    result[32 + i] = aBytes[32 + i] ^ bBytes[32 + i];
  }

  return {
    bytes: uint8ArrayToHex(result),
    type: a.type,
  };
}

export function formatEncryptedAmount(amount: string | number): string {
  const num = typeof amount === "string" ? parseInt(amount) : amount;
  if (num >= 1000000) {
    return `$${(num / 1000000).toFixed(2)}M`;
  } else if (num >= 1000) {
    return `$${(num / 1000).toFixed(2)}K`;
  }
  return `$${num.toFixed(2)}`;
}

export function salaryToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

export function centsToSalary(cents: number): string {
  return `$${(cents / 100).toLocaleString()}`;
}

export function isValidEncryptedData(data: any): data is EncryptedData {
  return (
    data &&
    typeof data.bytes === "string" &&
    ["euint32", "euint64", "euint256", "euint8"].includes(data.type)
  );
}

export function placeholderSalary(): EncryptedData {
  return {
    bytes: "00000000000000000000000000000000000000000000000000000000deadbeef",
    type: "euint32",
  };
}

export function isPlaceholder(data: EncryptedData): boolean {
  return data.bytes.includes("deadbeef") || data.bytes.includes("cafebabe");
}

export function maskedSalary(): string {
  return "***";
}

export function maskedAddress(): string {
  return "***...***";
}