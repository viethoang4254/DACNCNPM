import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const DEFAULT_HASH_ALGORITHM = "sha256";

const isSupportedHashAlgorithm = (algorithm) => {
  return crypto.getHashes().includes(algorithm);
};

const resolveHashAlgorithm = (algorithm) => {
  if (algorithm && isSupportedHashAlgorithm(algorithm)) {
    return algorithm;
  }

  return DEFAULT_HASH_ALGORITHM;
};

export const createFileHash = async (filePath, algorithm = DEFAULT_HASH_ALGORITHM) => {
  const hashAlgorithm = resolveHashAlgorithm(algorithm);

  return new Promise((resolve, reject) => {
    const hash = crypto.createHash(hashAlgorithm);
    const stream = fs.createReadStream(filePath);

    stream.on("data", (chunk) => {
      hash.update(chunk);
    });

    stream.on("error", reject);

    stream.on("end", () => {
      resolve(hash.digest("hex"));
    });
  });
};

export const findDuplicateFileByHash = async ({
  targetFilePath,
  directoryPath,
  excludeFileNames = [],
  algorithm = DEFAULT_HASH_ALGORITHM,
}) => {
  const resolvedAlgorithm = resolveHashAlgorithm(algorithm);
  const targetHash = await createFileHash(targetFilePath, resolvedAlgorithm);
  const excluded = new Set(excludeFileNames.filter(Boolean));
  const entries = await fs.promises.readdir(directoryPath, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isFile()) {
      continue;
    }

    if (excluded.has(entry.name)) {
      continue;
    }

    const candidatePath = path.resolve(directoryPath, entry.name);
    const candidateHash = await createFileHash(candidatePath, resolvedAlgorithm);

    if (candidateHash === targetHash) {
      return {
        filename: entry.name,
        path: candidatePath,
        hash: targetHash,
      };
    }
  }

  return null;
};
