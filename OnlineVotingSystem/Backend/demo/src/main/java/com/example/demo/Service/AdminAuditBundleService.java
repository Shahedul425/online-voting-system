package com.example.demo.Service;

import com.example.demo.DTO.ElectionResultsResponse;
import com.example.demo.Exception.NotFoundException;
import com.example.demo.Models.AuditLogsModel;
import com.example.demo.Models.ElectionModel;
import com.example.demo.Models.VoteModel;
import com.example.demo.Models.VoteSelectionModel;
import com.example.demo.Repositories.AuditLogsRepository;
import com.example.demo.Repositories.ElectionModelRepository;
import com.example.demo.Repositories.VoteModelRepository;
import com.example.demo.Repositories.VoteSelectionRepository;
import com.example.demo.Util.Ids;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

/**
 * NEW service — builds the audit-bundle ZIP served by AdminAuditBundleController.
 *
 * No external ZIP library required: plain `java.util.zip.ZipOutputStream` is
 * already in the JDK. If you have `commons-compress` on the classpath you
 * can swap it in for tarballs etc., but the ZIP entries here are trivial.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AdminAuditBundleService {

    private final ElectionModelRepository electionRepo;
    private final VoteModelRepository voteRepo;
    private final VoteSelectionRepository voteSelectionRepo;
    private final AuditLogsRepository auditRepo;
    private final AdminElectionResultService resultService;

    private static final DateTimeFormatter ISO = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    @Transactional(readOnly = true)
    public byte[] buildBundle(String electionId) {
        UUID eId = Ids.uuid(electionId, "electionId");
        ElectionModel election = electionRepo.findById(eId)
                .orElseThrow(() -> new NotFoundException("ELECTION_NOT_FOUND", "Election not found"));

        try (ByteArrayOutputStream out = new ByteArrayOutputStream();
             ZipOutputStream zip = new ZipOutputStream(out)) {

            // 1) election.json — full ElectionResultsResponse, pretty-printed
            ElectionResultsResponse results = resultService.getAdminResults(electionId);
            ObjectMapper om = new ObjectMapper()
                    .registerModule(new JavaTimeModule())
                    .configure(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS, false)
                    .enable(SerializationFeature.INDENT_OUTPUT);
            byte[] json = om.writeValueAsBytes(results);
            zip.putNextEntry(new ZipEntry("election.json"));
            zip.write(json);
            zip.closeEntry();

            // 2) merkle-root.txt — one line, the root
            String root = election.getMerkleRoot() == null ? "" : election.getMerkleRoot();
            zip.putNextEntry(new ZipEntry("merkle-root.txt"));
            zip.write(root.getBytes(StandardCharsets.UTF_8));
            zip.closeEntry();

            // 3) ballots.csv — anonymised per-selection: position, candidate_id, cast_at, leaf_hash
            zip.putNextEntry(new ZipEntry("ballots.csv"));
            zip.write("position,candidate_id,cast_at,leaf_hash\n".getBytes(StandardCharsets.UTF_8));
            List<VoteModel> votes = voteRepo.findByElectionOrdered(election.getId());
            for (VoteModel v : votes) {
                String leafHex = sha256Hex(v.getReceiptHashToken());
                List<VoteSelectionModel> selections = voteSelectionRepo.findByVote_Id(v.getId());
                for (VoteSelectionModel sel : selections) {
                    String line = safe(sel.getPosition()) + ","
                                + (sel.getCandidateId() != null ? sel.getCandidateId().getId() : "") + ","
                                + (v.getCreatedAt() != null ? v.getCreatedAt().format(ISO) : "") + ","
                                + leafHex + "\n";
                    zip.write(line.getBytes(StandardCharsets.UTF_8));
                }
            }
            zip.closeEntry();

            // 4) audit-log.csv — every audit row scoped to this election, newest first
            zip.putNextEntry(new ZipEntry("audit-log.csv"));
            zip.write("created_at,action,status,entity_id,actor_email,request_id,trace_id,details\n"
                    .getBytes(StandardCharsets.UTF_8));
            List<AuditLogsModel> audits = auditRepo.findAllByElectionDesc(election.getId());
            for (AuditLogsModel a : audits) {
                String line = (a.getCreatedAt() != null ? a.getCreatedAt().format(ISO) : "") + ","
                            + (a.getAction() != null ? a.getAction().name() : "") + ","
                            + (a.getStatus() != null ? a.getStatus().name() : "") + ","
                            + safe(a.getEntityId()) + ","
                            + safe(a.getActor() != null ? a.getActor().getEmail() : "") + ","
                            + safe(a.getRequestId()) + ","
                            + safe(a.getTraceId()) + ","
                            + safe(a.getDetails()) + "\n";
                zip.write(line.getBytes(StandardCharsets.UTF_8));
            }
            zip.closeEntry();

            zip.finish();
            return out.toByteArray();

        } catch (Exception ex) {
            log.error("Failed to build audit bundle for election {}", electionId, ex);
            throw new RuntimeException("Audit bundle build failed: " + ex.getMessage(), ex);
        }
    }

    private static String safe(String s) {
        if (s == null) return "";
        // minimal CSV escaping — quote and double-up quotes if the field has commas/quotes/newlines
        boolean needsQuote = s.contains(",") || s.contains("\"") || s.contains("\n") || s.contains("\r");
        if (!needsQuote) return s;
        return "\"" + s.replace("\"", "\"\"") + "\"";
    }

    private static String sha256Hex(String token) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(token.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(digest.length * 2);
            for (byte b : digest) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (Exception e) {
            return "";
        }
    }
}
