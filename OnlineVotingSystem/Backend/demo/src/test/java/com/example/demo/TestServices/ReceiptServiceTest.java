package com.example.demo.TestServices;

import com.example.demo.Exception.BadRequestException;
import com.example.demo.Exception.NotFoundException;
import com.example.demo.Records.ReceiptTokenClaim;
import com.example.demo.Service.ReceiptService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Arrays;
import java.util.Base64;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class ReceiptServiceTest {

    private static final String SECRET = "my-super-secret";

    private ReceiptService serviceWithRealMapper() {
        return new ReceiptService(SECRET, new ObjectMapper());
    }

    // -------------------- constructor --------------------

    @Test
    void constructor_throwsBadRequest_whenSecretIsNull() {
        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> new ReceiptService(null, new ObjectMapper()));
        // adjust if your exception exposes code fields; message check is safe
        assertTrue(ex.getMessage().contains("receipt.token.secret"));
    }

    @Test
    void constructor_trimsSecret_andWorks() {
        ReceiptService svc = new ReceiptService("  " + SECRET + "  ", new ObjectMapper());
        // smoke test generate works
        String token = svc.generateReceiptHash(UUID.randomUUID(), "r1");
        assertNotNull(token);
        assertTrue(token.contains("."));
    }

    // -------------------- generateReceiptHash --------------------

    @Test
    void generateReceiptHash_throwsNotFound_whenElectionIdNull() {
        ReceiptService svc = serviceWithRealMapper();
        assertThrows(NotFoundException.class, () -> svc.generateReceiptHash(null, "abc"));
    }

    @Test
    void generateReceiptHash_throwsNotFound_whenReceiptTokenNullOrBlank() {
        ReceiptService svc = serviceWithRealMapper();
        UUID eid = UUID.randomUUID();

        assertThrows(NotFoundException.class, () -> svc.generateReceiptHash(eid, null));
        assertThrows(NotFoundException.class, () -> svc.generateReceiptHash(eid, ""));
        assertThrows(NotFoundException.class, () -> svc.generateReceiptHash(eid, "   "));
    }

    @Test
    void generateReceiptHash_returnsTwoPartToken_payloadAndSignature_areUrlSafe() {
        ReceiptService svc = serviceWithRealMapper();
        UUID eid = UUID.randomUUID();

        String token = svc.generateReceiptHash(eid, "receipt-123");

        assertNotNull(token);
        String[] parts = token.split("\\.");
        assertEquals(2, parts.length);

        // URL-safe base64 (no +, /, =)
        assertFalse(parts[0].contains("+") || parts[0].contains("/") || parts[0].contains("="));
        assertFalse(parts[1].contains("+") || parts[1].contains("/") || parts[1].contains("="));

        // payload should decode to JSON containing eid/rht/iat
        String json = new String(Base64.getUrlDecoder().decode(parts[0]), StandardCharsets.UTF_8);
        assertTrue(json.contains("\"eid\""));
        assertTrue(json.contains("\"rht\""));
        assertTrue(json.contains("\"iat\""));
        assertTrue(json.contains(eid.toString()));
        assertTrue(json.contains("receipt-123"));
    }

    // -------------------- verifyAndDecode --------------------

    @Test
    void verifyAndDecode_throwsNotFound_whenTokenNullOrBlank() {
        ReceiptService svc = serviceWithRealMapper();
        assertThrows(NotFoundException.class, () -> svc.verifyAndDecode(null));
        assertThrows(NotFoundException.class, () -> svc.verifyAndDecode(""));
        assertThrows(NotFoundException.class, () -> svc.verifyAndDecode("   "));
    }

    @Test
    void verifyAndDecode_throwsNotFound_whenFormatInvalid_partsNot2() {
        ReceiptService svc = serviceWithRealMapper();

        // Only these truly have parts.length != 2
        assertThrows(NotFoundException.class, () -> svc.verifyAndDecode("abc"));
        assertThrows(NotFoundException.class, () -> svc.verifyAndDecode("a.b.c"));
    }


    @Test
    void verifyAndDecode_roundTrip_success_forGeneratedToken() {
        ReceiptService svc = serviceWithRealMapper();
        UUID eid = UUID.randomUUID();
        String rht = "receipt-token-value";

        long before = Instant.now().getEpochSecond();
        String token = svc.generateReceiptHash(eid, rht);
        long after = Instant.now().getEpochSecond();

        ReceiptTokenClaim claim = svc.verifyAndDecode(token);

        assertNotNull(claim);
        assertEquals(eid, claim.electionId());
        assertEquals(rht, claim.receiptToken());

        // iat should be within [before, after] (allow 1s jitter)
        assertTrue(claim.issuedAtEppochSeconds() >= (before - 1));
        assertTrue(claim.issuedAtEppochSeconds() <= (after + 1));
    }

    @Test
    void verifyAndDecode_throwsNotFound_whenSignatureTampered() {
        ReceiptService svc = serviceWithRealMapper();
        UUID eid = UUID.randomUUID();

        String token = svc.generateReceiptHash(eid, "r1");
        String[] parts = token.split("\\.");
        assertEquals(2, parts.length);

        // tamper signature by flipping last char (keeping base64url-ish)
        String sig = parts[1];
        char last = sig.charAt(sig.length() - 1);
        char flipped = (last == 'A') ? 'B' : 'A';
        String tampered = parts[0] + "." + sig.substring(0, sig.length() - 1) + flipped;

        assertThrows(NotFoundException.class, () -> svc.verifyAndDecode(tampered));
    }

    @Test
    void verifyAndDecode_throwsBadRequest_whenSignaturePartNotBase64() {
        ReceiptService svc = serviceWithRealMapper();
        // payload can be anything base64url-ish; signature is invalid
        String fakePayload = Base64.getUrlEncoder().withoutPadding()
                .encodeToString(("{\"eid\":\"" + UUID.randomUUID() + Arrays.toString("\",\"rht\":\"x\",\"iat\":1}".getBytes(StandardCharsets.UTF_8))).getBytes());
        String token = fakePayload + ".***NOT_BASE64***";

        assertThrows(BadRequestException.class, () -> svc.verifyAndDecode(token));
    }

    @Test
    void verifyAndDecode_throwsBadRequest_whenPayloadJsonInvalid() throws JsonProcessingException {
        ReceiptService svc = serviceWithRealMapper();

        // create token with valid signature BUT invalid JSON payload
        // We'll sign a payloadBase64 that decodes to "not json"
        String payloadBase64 = Base64.getUrlEncoder().withoutPadding()
                .encodeToString("not json".getBytes(StandardCharsets.UTF_8));

        // Use a second service instance to compute signature via round-trip:
        // easiest: call generateReceiptHash to get signature logic, but we can't directly access hmac.
        // So we craft a token by calling generateReceiptHash and replace its payload with our own while keeping sig wrong -> NotFound.
        // Instead, for true "invalid JSON" path, we need a valid signature for that payload.
        // We'll compute it by using a spy + reflection? Not necessary.
        // Practical unit test: mock ObjectMapper to throw on readValue (covers JSON invalid branch).

        ObjectMapper mapper = mock(ObjectMapper.class);
        ReceiptService svc2 = new ReceiptService(SECRET, mapper);

        // Build a syntactically valid token from svc2 itself:
        // Mock writeValueAsString so generateReceiptHash succeeds with deterministic JSON.
        try {
            when(mapper.writeValueAsString(any(Map.class))).thenReturn("{\"eid\":\"" + UUID.randomUUID() + "\",\"rht\":\"x\",\"iat\":1}");
        } catch (JsonProcessingException e) {
            fail(e);
        }
        // Now make verifyAndDecode fail in fromJson:
        when(mapper.readValue(anyString(), eq(Map.class))).thenThrow(new RuntimeException("boom"));

        String token = svc2.generateReceiptHash(UUID.randomUUID(), "x");
        assertThrows(BadRequestException.class, () -> svc2.verifyAndDecode(token));
    }

    @Test
    void verifyAndDecode_throwsNotFound_whenMissingRequiredFields() throws JsonProcessingException {
        // We want a valid signature for payload missing fields.
        // We can accomplish this by mocking ObjectMapper to serialize a payload missing "eid" or "rht",
        // then verifyAndDecode will parse it (readValue returns the same map) and fail required checks.

        ObjectMapper mapper = mock(ObjectMapper.class);
        ReceiptService svc = new ReceiptService(SECRET, mapper);

        UUID eid = UUID.randomUUID();

        // generateReceiptHash calls writeValueAsString(payloadMap) - we return JSON missing rht
        try {
            when(mapper.writeValueAsString(any(Map.class))).thenReturn("{\"eid\":\"" + eid + "\",\"iat\":1}");
        } catch (JsonProcessingException e) {
            fail(e);
        }

        // verifyAndDecode calls readValue(json, Map.class) - return map missing rht
        when(mapper.readValue(anyString(), eq(Map.class))).thenReturn(Map.of("eid", eid.toString(), "iat", 1));

        String token = svc.generateReceiptHash(eid, "ignored");

        assertThrows(NotFoundException.class, () -> svc.verifyAndDecode(token));
    }

    @Test
    void verifyAndDecode_throwsBadRequest_whenElectionIdInsideTokenInvalidUuid() throws JsonProcessingException {
        ObjectMapper mapper = mock(ObjectMapper.class);
        ReceiptService svc = new ReceiptService(SECRET, mapper);

        // Make generateReceiptHash produce a payload with non-uuid eid
        try {
            when(mapper.writeValueAsString(any(Map.class))).thenReturn("{\"eid\":\"not-a-uuid\",\"rht\":\"x\",\"iat\":1}");
        } catch (JsonProcessingException e) {
            fail(e);
        }
        when(mapper.readValue(anyString(), eq(Map.class))).thenReturn(Map.of(
                "eid", "not-a-uuid",
                "rht", "x",
                "iat", 1
        ));

        String token = svc.generateReceiptHash(UUID.randomUUID(), "x");

        assertThrows(BadRequestException.class, () -> svc.verifyAndDecode(token));
    }

    @Test
    void verifyAndDecode_whenIatMissing_currentlyThrowsNullPointerException() throws Exception {
        // This reflects your current behavior if iat missing (Long iat null -> unboxing to long).
        ObjectMapper mapper = mock(ObjectMapper.class);
        ReceiptService svc = new ReceiptService(SECRET, mapper);

        UUID eid = UUID.randomUUID();

        // generateReceiptHash signs over a payload that has iat (service always includes iat)
        when(mapper.writeValueAsString(any(Map.class)))
                .thenReturn("{\"eid\":\"" + eid + "\",\"rht\":\"x\",\"iat\":1}");

        // but during verify, parsed payload is missing iat => longVal returns null => NPE
        when(mapper.readValue(anyString(), eq(Map.class)))
                .thenReturn(Map.of("eid", eid.toString(), "rht", "x"));

        String token = svc.generateReceiptHash(eid, "x");

        assertThrows(NullPointerException.class, () -> svc.verifyAndDecode(token));
    }
}