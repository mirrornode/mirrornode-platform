export type OsirisRuntimeFamily =
  | "evm"
  | "solana_svm"
  | "move"
  | "cosmos_ibc"
  | "ai_agent_stack"
  | "workflow_ops";

export type OsirisSeverity =
  | "critical"
  | "high"
  | "medium"
  | "low"
  | "informational";

export type OsirisRuntimeAdapter = {
  id: string;
  name: string;
  runtimeFamily: OsirisRuntimeFamily;
  description: string;
  primitives: string[];
  trustBoundaries: string[];
  evidenceSources: string[];
  commonBugClasses: string[];
  findingSublabels: string[];
  proofFormat: string[];
  requiredArtifacts: string[];
};

export const osirisRuntimeAdapters: OsirisRuntimeAdapter[] = [
  {
    id: "evm-v0-1",
    name: "EVM Runtime Adapter",
    runtimeFamily: "evm",
    description:
      "Adapter for Solidity/EVM systems, including contracts, proxies, storage, events, roles, and upgrade controls.",
    primitives: [
      "contracts",
      "proxies",
      "storage",
      "events",
      "roles",
      "signatures",
      "oracles",
      "upgrade controls",
    ],
    trustBoundaries: [
      "contract owner",
      "proxy admin",
      "multisig",
      "oracle source",
      "external protocol dependency",
      "off-chain signer",
    ],
    evidenceSources: [
      "repository",
      "deployment config",
      "verified contract source",
      "block explorer",
      "RPC trace",
      "event logs",
      "fork tests",
    ],
    commonBugClasses: [
      "reentrancy",
      "access control failure",
      "upgrade risk",
      "oracle manipulation",
      "signature replay",
      "storage collision",
      "unchecked external call",
    ],
    findingSublabels: [
      "access-control",
      "upgradeability",
      "oracle-integrity",
      "signature-safety",
      "storage-layout",
      "external-call-risk",
    ],
    proofFormat: [
      "source reference",
      "transaction hash",
      "event log",
      "trace excerpt",
      "fork test output",
      "admin ownership proof",
    ],
    requiredArtifacts: [
      "scope freeze",
      "contract inventory",
      "admin/role map",
      "finding register",
      "remediation tracker",
      "final report",
    ],
  },
  {
    id: "solana-svm-v0-1",
    name: "Solana/SVM Runtime Adapter",
    runtimeFamily: "solana_svm",
    description:
      "Adapter for Solana/SVM systems, including accounts, PDAs, signers, CPIs, program IDs, and account state transitions.",
    primitives: [
      "accounts",
      "programs",
      "PDAs",
      "signers",
      "CPIs",
      "instructions",
      "account ownership",
      "rent/state lifecycle",
    ],
    trustBoundaries: [
      "program authority",
      "account owner",
      "PDA derivation",
      "signer validation",
      "CPI target",
      "upgrade authority",
    ],
    evidenceSources: [
      "repository",
      "program ID",
      "IDL",
      "RPC account snapshot",
      "transaction trace",
      "CPI path",
      "deployment authority record",
    ],
    commonBugClasses: [
      "missing signer check",
      "incorrect account owner validation",
      "unsafe CPI target",
      "PDA seed misuse",
      "stale account state",
      "upgrade authority risk",
    ],
    findingSublabels: [
      "account-consistency",
      "signer-authority",
      "cpi-safety",
      "pda-integrity",
      "state-freshness",
      "upgrade-authority",
    ],
    proofFormat: [
      "program source reference",
      "account snapshot",
      "transaction signature",
      "CPI trace",
      "IDL reference",
      "authority proof",
    ],
    requiredArtifacts: [
      "scope freeze",
      "program/account inventory",
      "authority map",
      "finding register",
      "remediation tracker",
      "final report",
    ],
  },
];
