package com.example.demo.Service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Sends the one-time OTP that authorises a single ballot.
 *
 * Behaviour:
 *   • If JavaMailSender is auto-configured and SMTP creds are present,
 *     a multipart text+HTML email is sent.
 *   • If SMTP isn't configured (no {@code spring.mail.host}) we log a
 *     WARN and return — the verification flow still succeeds, and the
 *     dev `devOtp` echo path covers local demos.
 *   • Any send failure is caught and logged; verification never throws
 *     because of mail. Voters always get a token in the database.
 *
 * Wiring: see {@code application.properties} → {@code spring.mail.*} block.
 * Gmail SMTP requires an *App Password* (not your Gmail password) — see
 * {@code RUNBOOK.md → Email delivery} for setup.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OtpMailService {

    private final JavaMailSender mailSender;

    @Value("${ovs.mail.from:no-reply@ovs.local}")
    private String fromAddress;

    @Value("${ovs.mail.from-name:TrustVote}")
    private String fromName;

    @Value("${spring.mail.host:}")
    private String configuredHost;

    /**
     * Send the OTP to the voter. Soft-fails on any error.
     *
     * @return true if a send was attempted and accepted by the SMTP server,
     *         false if SMTP is not configured or the send was rejected.
     */
    public boolean sendOtp(String toEmail, String otp, String electionName, LocalDateTime expiresAt) {
        if (configuredHost == null || configuredHost.isBlank()) {
            log.warn("OTP mail skipped: spring.mail.host not configured. Set SMTP_* env vars to enable real delivery (otp not logged).");
            return false;
        }
        if (toEmail == null || toEmail.isBlank()) {
            log.warn("OTP mail skipped: no recipient address.");
            return false;
        }

        String subject = "Your TrustVote ballot code";
        String expires = expiresAt != null
                ? expiresAt.format(DateTimeFormatter.ofPattern("HH:mm"))
                : "10 minutes";

        try {
            MimeMessage mime = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mime, true, "UTF-8");
            helper.setFrom(fromAddress, fromName);
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(plainBody(otp, electionName, expires), htmlBody(otp, electionName, expires));
            mailSender.send(mime);
            log.info("OTP mail sent (recipient redacted, election={})", safeElection(electionName));
            return true;
        } catch (MessagingException | java.io.UnsupportedEncodingException e) {
            log.warn("OTP mail send failed (mime build): {}", e.getMessage());
            return tryFallbackPlain(toEmail, subject, plainBody(otp, electionName, expires));
        } catch (Exception e) {
            // org.springframework.mail.MailException (auth, connection, etc.)
            log.warn("OTP mail send failed: {}", e.getClass().getSimpleName() + " " + e.getMessage());
            return false;
        }
    }

    /**
     * Send the post-cast ballot receipt to the voter. Soft-fails the same way
     * as {@link #sendOtp}: if SMTP isn't wired we log and return false; the
     * caller should not let mail failure roll back the cast itself.
     *
     * @param toEmail       voter's email (from VoterListModel, not the JWT)
     * @param receiptToken  the opaque token the voter can use to verify the ballot
     * @param electionName  display name of the election
     * @param verifyUrl     deep link the voter can paste/click to verify
     */
    public boolean sendReceipt(String toEmail, String receiptToken, String electionName, String verifyUrl) {
        if (configuredHost == null || configuredHost.isBlank()) {
            log.warn("Receipt mail skipped: spring.mail.host not configured.");
            return false;
        }
        if (toEmail == null || toEmail.isBlank()) {
            log.warn("Receipt mail skipped: no recipient address.");
            return false;
        }

        String subject = "Your TrustVote ballot receipt";
        try {
            MimeMessage mime = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mime, true, "UTF-8");
            helper.setFrom(fromAddress, fromName);
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(receiptPlainBody(receiptToken, electionName, verifyUrl),
                           receiptHtmlBody(receiptToken, electionName, verifyUrl));
            mailSender.send(mime);
            log.info("Receipt mail sent (recipient redacted, election={})", safeElection(electionName));
            return true;
        } catch (MessagingException | java.io.UnsupportedEncodingException e) {
            log.warn("Receipt mail send failed (mime build): {}", e.getMessage());
            return tryFallbackPlain(toEmail, subject,
                    receiptPlainBody(receiptToken, electionName, verifyUrl));
        } catch (Exception e) {
            log.warn("Receipt mail send failed: {}", e.getClass().getSimpleName() + " " + e.getMessage());
            return false;
        }
    }

    private static String receiptPlainBody(String receiptToken, String electionName, String verifyUrl) {
        StringBuilder sb = new StringBuilder();
        sb.append("Hi,\n\n")
          .append("Your ballot for \"").append(safeElection(electionName)).append("\" has been recorded.\n\n")
          .append("Receipt token (keep this private):\n\n")
          .append("    ").append(receiptToken).append("\n\n")
          .append("How to verify:\n")
          .append("Paste the token into the verification page at any time. The Merkle proof will\n")
          .append("show that your ballot was included in the published result, without revealing\n")
          .append("which way you voted.\n");
        if (verifyUrl != null && !verifyUrl.isBlank()) {
            sb.append("\nDirect verify link:\n").append(verifyUrl).append("\n");
        }
        sb.append("\n— TrustVote\n");
        return sb.toString();
    }

    private static String receiptHtmlBody(String receiptToken, String electionName, String verifyUrl) {
        String safeName = safeElection(electionName);
        String linkBlock = (verifyUrl == null || verifyUrl.isBlank()) ? "" :
                "      <p style=\"margin:18px 0 0 0; font-size:13px;\">"
                        + "<a href=\"" + escape(verifyUrl) + "\" "
                        + "style=\"color:#fff; background:#2B3C5F; padding:10px 16px; border-radius:10px; text-decoration:none; display:inline-block; font-weight:600;\">"
                        + "Verify my ballot</a></p>";

        return "<!doctype html><html><body style=\"font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; "
                + "background:#F7F4EE; padding:24px; color:#2B3C5F;\">"
                + "  <div style=\"max-width:560px; margin:0 auto; background:#fff; border-radius:16px; overflow:hidden; "
                + "       box-shadow:0 4px 24px rgba(43,60,95,0.08);\">"
                + "    <div style=\"background:linear-gradient(135deg,#E85D75 0%,#FF8A65 100%); color:#fff; padding:24px;\">"
                + "      <div style=\"font-size:13px; letter-spacing:0.16em; text-transform:uppercase; opacity:0.85;\">TrustVote</div>"
                + "      <div style=\"font-size:22px; font-weight:600; margin-top:4px;\">Your ballot is in</div>"
                + "      <div style=\"font-size:13px; margin-top:6px; opacity:0.9;\">" + escape(safeName) + "</div>"
                + "    </div>"
                + "    <div style=\"padding:24px;\">"
                + "      <p style=\"margin:0 0 12px 0; font-size:14px;\">Keep this receipt — you can use it any time to verify your ballot was counted, without revealing how you voted.</p>"
                + "      <div style=\"background:#F7F4EE; border-radius:12px; padding:14px; margin-bottom:12px;\">"
                + "        <div style=\"font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:#8B97AB; margin-bottom:6px;\">Receipt token</div>"
                + "        <div style=\"font-family: ui-monospace, Menlo, Consolas, monospace; font-size:13px; color:#2B3C5F; word-break:break-all;\">"
                + escape(receiptToken)
                + "        </div>"
                + "      </div>"
                + "      <p style=\"margin:0; font-size:12px; color:#8B97AB;\">"
                + "        Identity and ballot live in different tables — even an admin can&rsquo;t link them. The receipt only proves inclusion in the Merkle tree."
                + "      </p>"
                + linkBlock
                + "    </div>"
                + "    <div style=\"background:#F7F4EE; padding:14px 24px; font-size:11px; color:#8B97AB;\">"
                + "      Sent by TrustVote &middot; replies are not monitored."
                + "    </div>"
                + "  </div>"
                + "</body></html>";
    }

    private boolean tryFallbackPlain(String toEmail, String subject, String body) {
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom(fromAddress);
            msg.setTo(toEmail);
            msg.setSubject(subject);
            msg.setText(body);
            mailSender.send(msg);
            log.info("OTP mail sent (plain fallback)");
            return true;
        } catch (Exception e) {
            log.warn("OTP plain fallback failed: {}", e.getMessage());
            return false;
        }
    }

    private static String plainBody(String otp, String electionName, String expires) {
        return "Hi,\n\n"
                + "Your one-time code for the election \"" + safeElection(electionName) + "\" is:\n\n"
                + "    " + otp + "\n\n"
                + "It expires at " + expires + " (server time) — about 10 minutes from now.\n"
                + "Enter the code on the ballot page to submit your vote.\n\n"
                + "If you didn't request this, you can ignore the email — the code is\n"
                + "useless without your TrustVote sign-in.\n\n"
                + "— TrustVote";
    }

    private static String htmlBody(String otp, String electionName, String expires) {
        String safeName = safeElection(electionName);
        return "<!doctype html><html><body style=\"font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; "
                + "background:#F7F4EE; padding:24px; color:#2B3C5F;\">"
                + "  <div style=\"max-width:520px; margin:0 auto; background:#fff; border-radius:16px; overflow:hidden; "
                + "       box-shadow:0 4px 24px rgba(43,60,95,0.08);\">"
                + "    <div style=\"background:linear-gradient(135deg,#E85D75 0%,#FF8A65 100%); color:#fff; padding:24px;\">"
                + "      <div style=\"font-size:13px; letter-spacing:0.16em; text-transform:uppercase; opacity:0.85;\">TrustVote</div>"
                + "      <div style=\"font-size:22px; font-weight:600; margin-top:4px;\">Your ballot code</div>"
                + "    </div>"
                + "    <div style=\"padding:24px;\">"
                + "      <p style=\"margin:0 0 12px 0; font-size:14px;\">Use this code to submit your vote in:</p>"
                + "      <p style=\"margin:0 0 16px 0; font-size:14px; font-weight:600;\">" + escape(safeName) + "</p>"
                + "      <div style=\"background:#F7F4EE; border-radius:12px; padding:18px; text-align:center; margin-bottom:16px;\">"
                + "        <div style=\"font-family: ui-monospace, Menlo, Consolas, monospace; font-size:32px; font-weight:600; letter-spacing:8px; color:#E85D75;\">"
                + escape(otp)
                + "        </div>"
                + "      </div>"
                + "      <p style=\"margin:0 0 8px 0; font-size:13px; color:#5C6A82;\">"
                + "        Expires at <strong>" + escape(expires) + "</strong> &mdash; roughly 10 minutes from now."
                + "      </p>"
                + "      <p style=\"margin:0; font-size:12px; color:#8B97AB;\">"
                + "        If you didn&rsquo;t request this code, you can ignore this email."
                + "      </p>"
                + "    </div>"
                + "    <div style=\"background:#F7F4EE; padding:14px 24px; font-size:11px; color:#8B97AB;\">"
                + "      Sent by TrustVote &middot; replies are not monitored."
                + "    </div>"
                + "  </div>"
                + "</body></html>";
    }

    private static String safeElection(String name) {
        return (name == null || name.isBlank()) ? "your election" : name;
    }

    private static String escape(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }
}
