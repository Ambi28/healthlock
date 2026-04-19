// Simulated Cryptography and Blockchain for Demo Purposes
// This file serves as a mock for AES-256 encryption, IPFS uploads, and Blockchain Smart Contracts (Ethereum/Fabric).

export interface BlockchainLog {
  txHash: string;
  timestamp: string;
  action: string;
  actor: string;
  target?: string;
  ipfsCID?: string;
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  title: string;
  date: string;
  ipfsCID: string;
  encryptedSymmetricKey: string;
  status: 'VERIFIED' | 'PENDING';
}

// In-memory mock database
export const mockDB = {
  logs: [] as BlockchainLog[],
  records: [
    {
      id: "REC-1001",
      patientId: "PAT-001",
      title: "Blood Test Results (Jan 2026)",
      date: "2026-01-15",
      ipfsCID: "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
      encryptedSymmetricKey: "0xEncryptedKey123",
      status: "VERIFIED"
    }
  ] as MedicalRecord[],
  permissions: {
    "PAT-001": ["DOC-101"] // Patient PAT-001 gave access to Doctor DOC-101
  } as Record<string, string[]>
};

// 1. Simulate AES-256-GCM Encryption
export const encryptFileAES = async (fileData: string): Promise<{ ciphertext: string; key: string }> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        ciphertext: `U2FsdGVkX1+${btoa(fileData).substring(0, 20)}...[ENCRYPTED_AES256_GCM]`,
        key: `aes-key-${Math.random().toString(36).substring(7)}`
      });
    }, 600);
  });
};

// 2. Simulate Uploading to IPFS
export const uploadToIPFS = async (ciphertext: string): Promise<string> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const hashContent = Array.from(ciphertext).reduce((s, c) => Math.imul(31, s) + c.charCodeAt(0) | 0, 0);
      resolve(`Qm${Math.abs(hashContent).toString(16)}xWknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco`);
    }, 800);
  });
};

// 3. Simulate Smart Contract: Audit Logging (Hyperledger Fabric / Ethereum)
export const logTransactionOnChain = (action: string, actor: string, target?: string, ipfsCID?: string) => {
  const txHash = `0x${Array.from({length: 40}, () => Math.floor(Math.random()*16).toString(16)).join('')}`;
  const log: BlockchainLog = {
    txHash,
    timestamp: new Date().toISOString(),
    action,
    actor,
    target,
    ipfsCID
  };
  mockDB.logs.unshift(log); // Add to beginning
  return txHash;
};

// 4. Simulate Smart Contract Call: Grant Consent
export const grantAccess = (patientId: string, doctorId: string) => {
  if (!mockDB.permissions[patientId]) {
    mockDB.permissions[patientId] = [];
  }
  if (!mockDB.permissions[patientId].includes(doctorId)) {
    mockDB.permissions[patientId].push(doctorId);
    logTransactionOnChain("GRANT_CONSENT", patientId, doctorId);
  }
};

// 5. Simulate Smart Contract Call: Revoke Consent
export const revokeAccess = (patientId: string, doctorId: string) => {
  if (mockDB.permissions[patientId]) {
    mockDB.permissions[patientId] = mockDB.permissions[patientId].filter(id => id !== doctorId);
    logTransactionOnChain("REVOKE_CONSENT", patientId, doctorId);
  }
};
