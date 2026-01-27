package com.example.demo.Service;
import com.example.demo.Exception.ApiException;
import com.example.demo.Exception.BadRequestException;
import com.example.demo.Exception.NotFoundException;
import com.example.demo.ServiceInterface.ReceiptServiceInterface;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;
import java.util.UUID;

@Service
public class ReceiptService implements ReceiptServiceInterface {

    private final String receiptTokenSecret;
    private final ObjectMapper objectMapper;
    public ReceiptService(
            @Value("${receipt.token.secret}") String receiptTokenSecret,
            ObjectMapper objectMapper
    ) {
        if (receiptTokenSecret == null ) {
            throw new BadRequestException("400", "receipt.token.secret must not be null)");
        }
        this.receiptTokenSecret = receiptTokenSecret.trim();
        this.objectMapper = objectMapper;
    }
    public record ReceiptTokenClaim(UUID electionId, String receiptToken, long issuedAtEppochSeconds) {}

    @Override
    public String generateReceiptHash(UUID electionId, String receiptToken) {
        if(electionId==null) throw new NotFoundException("404","ElectionId must not be null");
        if(receiptToken==null||receiptToken.isBlank()) throw new NotFoundException("404","ReceiptToken must not be null");
        long issuedAt = Instant.now().getEpochSecond();
        Map<String,Object> payload = Map.of(
                "eid",electionId.toString(),
                "rht",receiptToken,
                "iat",issuedAt);
        String json = toJson(payload);
        String payloadBase64 = b64Url(json.getBytes(StandardCharsets.UTF_8));
        String sigB64 = b64Url(hmacSha256(payloadBase64));
        return payloadBase64+"."+sigB64;
    }

    @Override
    public ReceiptTokenClaim verifyAndDecode(String receiptToken) {
        if (receiptToken == null || receiptToken.isBlank())
            throw new NotFoundException("404", "ReceiptToken must not be null");
        String[] parts = receiptToken.split("\\.");
        if (parts.length != 2) throw new NotFoundException("404", "Invalid receipt token");

        String payloadBase64 = parts[0];
        String sigB64 = parts[1];

        byte[] expectedSig = hmacSha256(payloadBase64);
        byte[] providedSig = b64UrlDecode(sigB64);
        if (!MessageDigest.isEqual(expectedSig, providedSig)) {
            throw new NotFoundException("404", "Invalid receipt token");
        }

        String json = new String(b64UrlDecode(payloadBase64), StandardCharsets.UTF_8);
        Map<String, Object> payload = fromJson(json);

        String eid = stringVal( payload.get("eid"));
        String rht = stringVal(payload.get("rht"));
        Long iat =  longVal(payload.get("iat"));
        if (eid == null || rht == null) throw new NotFoundException("404", "Invalid receipt token");


        UUID electionId;
        try {
            electionId = UUID.fromString(eid);
        } catch (Exception e) {
            throw new BadRequestException("400", "Invalid electionId inside receipt token");
        }

        return new ReceiptTokenClaim(electionId, rht, iat);

    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> fromJson(String json) {
        try {
            return objectMapper.readValue(json, Map.class);
        } catch (Exception e) {
            throw new BadRequestException("400","Invalid token payload JSON");
        }
    }
    private String b64Url(byte[] bytes) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
    private byte[] hmacSha256(String payload) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec key = new SecretKeySpec(receiptTokenSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(key);
            return mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
        }catch (Exception e){
            throw new BadRequestException("400","Invalid receipt token");
        }
    }
    private byte[] b64UrlDecode(String b64) {
        try {
            return Base64.getUrlDecoder().decode(b64);
        }catch (Exception e){
            throw new BadRequestException("400","Invalid receipt token");
        }

    }
    private String toJson(Map<String,Object> payload) {
        try{
            return objectMapper.writeValueAsString(payload);
        }catch (JsonProcessingException e){
            throw new RuntimeException();
        }
    };
    private static String stringVal(Object o) {
        if (o == null) return null;
        return String.valueOf(o);
    }

    private static Long longVal(Object o) {
        if (o == null) return null;
        try {
            if (o instanceof Number n) return n.longValue();
            return Long.parseLong(String.valueOf(o));
        } catch (Exception e) {
            return null;
        }
    }

}
