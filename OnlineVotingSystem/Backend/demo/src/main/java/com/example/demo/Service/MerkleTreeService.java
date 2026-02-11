package com.example.demo.Service;

import com.example.demo.DTO.MerkleProofDTO;
import com.example.demo.DTO.VerifyReceiptResponse;
import com.example.demo.Enums.ElectionStatus;
import com.example.demo.Exception.ConflictException;
import com.example.demo.Exception.NotFoundException;
import com.example.demo.Models.ElectionModel;
import com.example.demo.Models.MerkelLevelModel;
import com.example.demo.Models.ReceiptLeafIndexModel;
import com.example.demo.Repositories.ElectionModelRepository;
import com.example.demo.Repositories.MerkleLevelModelRepository;
import com.example.demo.Repositories.ReceiptLeafIndexRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.*;

import static net.logstash.logback.argument.StructuredArguments.kv;

@Service
@Slf4j
@RequiredArgsConstructor
public class MerkleTreeService {

    private final ReceiptService receiptService;
    private final ElectionModelRepository electionModelRepository;
    private final ReceiptLeafIndexRepository receiptLeafIndexRepository;
    private final MerkleLevelModelRepository merkleLevelModelRepository;
    private final HashLevelCodec hashLevelCodec;

    public record BuiltTree(byte[] root, List<Level> levels) {}
    public record Level(int level, List<byte[]> nodes) {}

    private byte[] sha256(byte[] in) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return digest.digest(in);
        } catch (NoSuchAlgorithmException e) {
            // This is a JVM misconfig; keep as RuntimeException as you had.
            throw new RuntimeException(e.getMessage());
        }
    }

    private byte[] hashConcat(byte[] left, byte[] right) {
        byte[] c = new byte[left.length + right.length];
        System.arraycopy(left, 0, c, 0, left.length);
        System.arraycopy(right, 0, c, left.length, right.length);
        return sha256(c);
    }

    public byte[] leafHashFromReceiptToken(String receiptToken) {
        // ✅ IMPORTANT: do not log token
        return sha256(receiptToken.getBytes(StandardCharsets.UTF_8));
    }

    public BuiltTree buildMerkleTree(List<String> tokens) {
        if (tokens == null || tokens.isEmpty()) {
            throw new RuntimeException("No tokens");
        }
        List<byte[]> current = new ArrayList<>(tokens.size());
        for (String token : tokens) {
            current.add(leafHashFromReceiptToken(token));
        }
        List<Level> levels = new ArrayList<>();
        int lvl = 0;
        levels.add(new Level(lvl++, new ArrayList<>(current)));

        while (current.size() > 1) {
            if (current.size() % 2 == 1) {
                current.add(current.get(current.size() - 1));
            }
            List<byte[]> next = new ArrayList<>(current.size() / 2);
            for (int i = 0; i < current.size(); i += 2) {
                next.add(hashConcat(current.get(i), current.get(i + 1)));
            }
            current = next;
            levels.add(new Level(lvl++, new ArrayList<>(current)));
        }
        return new BuiltTree(current.get(0), levels);
    }

    @Transactional(readOnly = true)
    public VerifyReceiptResponse verifyReceipt(String receiptToken) {
        // Business logic unchanged: verify receipt -> get electionId -> check election -> build proof -> verify
        var claim = receiptService.verifyAndDecode(receiptToken);
        UUID electionId = claim.electionId();

        ElectionModel electionModel = electionModelRepository.findById(electionId)
                .orElseThrow(() -> {
                    // ✅ Spec: failure path only -> WARN
                    log.warn("Receipt verify failed: election not found {} {} {}",
                            kv("action", "PUBLIC_VERIFY_RECEIPT"),
                            kv("status", "FAILED"),
                            kv("electionId", electionId.toString())
                    );
                    return new NotFoundException("ELECTION_NOT_FOUND", "Election not found");
                });

        if (electionModel.getStatus() != ElectionStatus.published || electionModel.getMerkleRoot() == null) {
            // ✅ Spec: rejection path -> WARN
            log.warn("Receipt verify rejected: election not published {} {} {} {}",
                    kv("action", "PUBLIC_VERIFY_RECEIPT"),
                    kv("status", "REJECTED"),
                    kv("electionId", electionId.toString()),
                    kv("currentStatus", electionModel.getStatus() != null ? electionModel.getStatus().name() : "null")
            );
            throw new ConflictException("ELECTION_NOT_PUBLISHED", "Election not published");
        }

        byte[] root = Base64.getUrlDecoder().decode(electionModel.getMerkleRoot());
        byte[] receiptKeyHash = leafHashFromReceiptToken(receiptToken);

        ReceiptLeafIndexModel idx = receiptLeafIndexRepository.findByReceiptKeyHash(receiptKeyHash)
                .orElseThrow(() -> {
                    // ✅ Normal user case sometimes -> WARN (not ERROR)
                    log.warn("Receipt verify failed: receipt not found {} {} {}",
                            kv("action", "PUBLIC_VERIFY_RECEIPT"),
                            kv("status", "FAILED"),
                            kv("electionId", electionId.toString())
                    );
                    return new NotFoundException("RECEIPT_NOT_FOUND", "ReceiptNotFound");
                });

        int leafIndex = idx.getLeafIndex();

        List<MerkleProofDTO> proofDTOS = new ArrayList<>();
        int currentIndex = leafIndex;
        int level = 0;

        while (true) {
            int finalLevel = level;
            MerkelLevelModel lvl = merkleLevelModelRepository.findByElection_IdAndLevel(electionId, level)
                    .orElseThrow(() -> {
                        // ✅ This indicates data corruption / publish bug -> ERROR
                        log.error("Receipt verify failed: merkle level missing {} {} {} {}",
                                kv("action", "PUBLIC_VERIFY_RECEIPT"),
                                kv("status", "FAILED"),
                                kv("electionId", electionId.toString()),
                                kv("level", finalLevel)
                        );
                        return new NotFoundException("MERKLE_LEVEL_MISSING", "Merkle level missing");
                    });

            int nodeCount = lvl.getNodeCount();
            if (nodeCount <= 1) break;

            int siblingIndex = currentIndex ^ 1;
            if (siblingIndex >= nodeCount) siblingIndex = currentIndex;

            boolean leftSibling = siblingIndex < currentIndex;

            byte[] siblingHash = hashLevelCodec.getAt(lvl.getHashBlob(), siblingIndex);
            String sibling64 = Base64.getUrlEncoder().withoutPadding().encodeToString(siblingHash);

            proofDTOS.add(new MerkleProofDTO(sibling64, leftSibling));
            currentIndex = currentIndex / 2;
            level++;
        }

        boolean included = verifyUsingProof(root, receiptToken, proofDTOS);

        // ✅ Spec: do NOT log success results for public verify (noise)
        // If you want a security-only signal: you can add WARN on "included=false",
        // but I’m NOT adding it unless you ask, because it could be noisy.

        VerifyReceiptResponse response = new VerifyReceiptResponse();
        response.setIncluded(included);
        response.setElectionId(electionModel.getId());
        response.setElectionName(electionModel.getName());
        response.setOrganizationId(electionModel.getOrganization().getId());
        response.setVotedAt(idx.getVotedAt());
        response.setMerkleRootB64(electionModel.getMerkleRoot());
        response.setLeafIndex(leafIndex);
        response.setTreeDepth(proofDTOS.size());
        response.setProof(proofDTOS);
        return response;
    }

    private boolean verifyUsingProof(byte[] root, String receiptToken, List<MerkleProofDTO> proofDTOS) {
        byte[] current = leafHashFromReceiptToken(receiptToken);
        for (MerkleProofDTO step : proofDTOS) {
            byte[] sib = Base64.getUrlDecoder().decode(step.getSiblingHash());
            current = step.isLeftSibling() ? hashConcat(sib, current) : hashConcat(current, sib);
        }
        return Arrays.equals(current, root);
    }
}
