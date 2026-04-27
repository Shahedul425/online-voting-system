package com.example.demo.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Drop-in replacement.
 * CHANGE: adds nullable `devOtp` so the VoterBallot OTP modal can pre-fill
 * the 6-digit code during local/dev demos.
 *
 * IMPORTANT: the value must only be set when `ovs.dev.return-otp=true` (or
 * when `spring.profiles.active=dev`). In prod, leave it null. See
 * VerificationServicePatch.md for how to wire the flag.
 *
 * Added NoArgsConstructor / AllArgsConstructor so Jackson can deserialise
 * in both directions (the Builder alone is not enough for Spring Data).
 */
@Getter
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TokenDTO {
    private String tokenId;
    private LocalDateTime expiryTime;

    /** NEW — only populated in dev/local demos. Nullable in prod. */
    private String devOtp;
}
