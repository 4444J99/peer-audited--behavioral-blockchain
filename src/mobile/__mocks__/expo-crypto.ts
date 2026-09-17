export const randomUUID = jest.fn(() => "00000000-0000-4000-8000-000000000001");

export const CryptoDigestAlgorithm = {
  SHA256: "SHA-256",
};

export const digestStringAsync = jest.fn(async () => "mock-digest");
