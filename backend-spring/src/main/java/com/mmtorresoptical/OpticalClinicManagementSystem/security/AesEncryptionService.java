package com.mmtorresoptical.OpticalClinicManagementSystem.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;

@Service
public class AesEncryptionService {

    private static final String ALGORITHM = "AES";
    private static final String TRANSFORMATION = "AES/GCM/NoPadding";
    private static final int IV_LENGTH = 12;      // Recommended for GCM
    private static final int TAG_LENGTH = 128;    // Authentication tag

    @Value("${encryption.secret-key}")
    private String secretKey;

    public void printKey() {
        System.out.println("Secret key: " + secretKey);
    }

    // ---------------- ENCRYPT ----------------
    public String encrypt(String plainText) {

        try {
            // Initialization Vector
            // Random data added to encryption.
            byte[] iv = new byte[IV_LENGTH];
            new SecureRandom().nextBytes(iv);

            Cipher cipher = Cipher.getInstance(TRANSFORMATION);

            // Convert HEX → byte array
            // Wrap it as AES key object
            SecretKeySpec keySpec =
                    new SecretKeySpec(hexStringToByteArray(secretKey), ALGORITHM);

            // Use this IV
            // Use 128-bit security tag
            GCMParameterSpec gcmSpec =
                    new GCMParameterSpec(TAG_LENGTH, iv);

            // Turn encryption machine ON
            // Load key
            // Load IV
            // Set to encrypt mode
            cipher.init(Cipher.ENCRYPT_MODE, keySpec, gcmSpec);

            // Convert text → bytes
            // Encrypt bytes
            // Output encrypted bytes
            byte[] encryptedData =
                    cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));

            // Combine IV + CipherText
            byte[] encryptedWithIv =
                    new byte[IV_LENGTH + encryptedData.length];

            System.arraycopy(iv, 0, encryptedWithIv, 0, IV_LENGTH);
            System.arraycopy(encryptedData, 0, encryptedWithIv, IV_LENGTH, encryptedData.length);

            return Base64.getEncoder().encodeToString(encryptedWithIv);

        } catch (Exception e) {
            throw new RuntimeException("Encryption failed", e);
        }
    }

    // ---------------- DECRYPT ----------------
    public String decrypt(String encryptedText) {

        try {
            byte[] decodedData =
                    Base64.getDecoder().decode(encryptedText);

            byte[] iv = new byte[IV_LENGTH];
            byte[] cipherText =
                    new byte[decodedData.length - IV_LENGTH];

            System.arraycopy(decodedData, 0, iv, 0, IV_LENGTH);
            System.arraycopy(decodedData, IV_LENGTH, cipherText, 0, cipherText.length);

            Cipher cipher = Cipher.getInstance(TRANSFORMATION);

            SecretKeySpec keySpec =
                    new SecretKeySpec(hexStringToByteArray(secretKey), ALGORITHM);

            GCMParameterSpec gcmSpec =
                    new GCMParameterSpec(TAG_LENGTH, iv);

            cipher.init(Cipher.DECRYPT_MODE, keySpec, gcmSpec);

            byte[] decrypted =
                    cipher.doFinal(cipherText);

            return new String(decrypted, StandardCharsets.UTF_8);

        } catch (Exception e) {
            throw new RuntimeException("Decryption failed", e);
        }
    }

    // ---------------- HEX KEY CONVERTER ----------------
    private byte[] hexStringToByteArray(String hex) {

        int length = hex.length();
        byte[] result = new byte[length / 2];

        for (int i = 0; i < length; i += 2) {
            result[i / 2] = (byte)
                    ((Character.digit(hex.charAt(i), 16) << 4)
                            + Character.digit(hex.charAt(i + 1), 16));
        }
        return result;
    }
}
