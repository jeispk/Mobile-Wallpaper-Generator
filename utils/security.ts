
// Utilities for client-side encryption using Web Crypto API

const getPasswordKey = (password: string) =>
  window.crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

const deriveKey = (passwordKey: CryptoKey, salt: Uint8Array, keyUsage: ["encrypt"] | ["decrypt"]) =>
  window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    passwordKey,
    { name: "AES-GCM", length: 256 },
    false,
    keyUsage
  );

export async function encryptData(text: string, password: string): Promise<string> {
  try {
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const passwordKey = await getPasswordKey(password);
    const aesKey = await deriveKey(passwordKey, salt, ["encrypt"]);

    const encryptedContent = await window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      aesKey,
      new TextEncoder().encode(text)
    );

    const encryptedContentArr = new Uint8Array(encryptedContent);
    const buff = new Uint8Array(
      salt.byteLength + iv.byteLength + encryptedContentArr.byteLength
    );
    buff.set(salt, 0);
    buff.set(iv, salt.byteLength);
    buff.set(encryptedContentArr, salt.byteLength + iv.byteLength);

    // Convert to base64 for storage
    return btoa(String.fromCharCode.apply(null, Array.from(buff)));
  } catch (e) {
    console.error("Encryption failed", e);
    throw new Error("Encryption failed");
  }
}

export async function decryptData(encryptedBase64: string, password: string): Promise<string> {
  try {
    const binaryString = atob(encryptedBase64);
    const buff = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      buff[i] = binaryString.charCodeAt(i);
    }

    const salt = buff.slice(0, 16);
    const iv = buff.slice(16, 28);
    const data = buff.slice(28);

    const passwordKey = await getPasswordKey(password);
    const aesKey = await deriveKey(passwordKey, salt, ["decrypt"]);

    const decryptedContent = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      aesKey,
      data
    );

    return new TextDecoder().decode(decryptedContent);
  } catch (e) {
    console.error("Decryption failed", e);
    throw new Error("Decryption failed. Wrong password or corrupted file.");
  }
}
