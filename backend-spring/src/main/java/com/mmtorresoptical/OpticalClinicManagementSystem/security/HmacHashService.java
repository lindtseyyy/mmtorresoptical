package com.mmtorresoptical.OpticalClinicManagementSystem.security;

import org.apache.commons.codec.binary.Hex;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;

@Service
public class HmacHashService {

    private static final String HMAC_ALGORITHM = "HmacSHA256";

    // Pepper stored in application.properties / env
    @Value("${hash.pepper}")
    private String pepper;

    public String hash(String data) {
        try {
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);

            SecretKeySpec secretKey =
                    new SecretKeySpec(
                            pepper.getBytes(StandardCharsets.UTF_8),
                            HMAC_ALGORITHM
                    );

            mac.init(secretKey);

            byte[] rawHmac =
                    mac.doFinal(data.getBytes(StandardCharsets.UTF_8));

            return Hex.encodeHexString(rawHmac);

        } catch (Exception e) {
            throw new RuntimeException("Error while hashing data", e);
        }
    }
}
