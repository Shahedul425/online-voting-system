package com.example.demo.RestController;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * ContactController — lightweight public "contact us / request your org" endpoint.
 *
 * Used by the frontend when a signup attempt matches no existing organisation.
 * We simply log the request at INFO so an operator / superadmin can follow up
 * manually; there is deliberately no DB table or email delivery wired up yet.
 *
 * To productionise this, pick one of:
 *   - Persist to a `contact_leads` table (userName / email / orgName / message
 *     / createdAt) and expose a superadmin page to review + approve.
 *   - Send via JavaMailSender to a staffed support inbox (once SMTP is
 *     configured in application.properties under `spring.mail.*`).
 *
 * The response is intentionally a soft 200 so the frontend's RequestOrg page
 * can show its "we'll be in touch" state either way. This matches the soft-fail
 * behaviour already baked into endpoints.js.
 */
@RestController
public class ContactController {

    private static final Logger log = LoggerFactory.getLogger(ContactController.class);

    @PostMapping("/public/contact/request-org")
    public ResponseEntity<?> requestOrg(@RequestBody(required = false) Map<String, Object> body) {
        if (body == null) body = Map.of();

        Object orgName     = body.getOrDefault("organisationName", body.get("orgName"));
        Object contactName = body.getOrDefault("contactName", body.get("name"));
        Object email       = body.get("email");
        Object size        = body.get("size");
        Object message     = body.get("message");

        log.info("ORG_REQUEST_SUBMITTED org={} contact={} email={} size={} messageLen={}",
                orgName,
                contactName,
                email,
                size,
                message == null ? 0 : message.toString().length()
        );

        // Soft-success — UI shows "we'll be in touch" regardless.
        return ResponseEntity.ok(Map.of(
                "message", "Thanks — we've received your request and will be in touch shortly."
        ));
    }
}
