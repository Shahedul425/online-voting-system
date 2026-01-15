package com.example.demo.Service;

import com.example.demo.DAO.AuditLogsRequest;
import com.example.demo.Enums.ActionStatus;
import com.example.demo.Enums.AuditActions;
import com.example.demo.Exception.BadRequestException;
import com.example.demo.Models.AuditLogsModel;
import com.example.demo.Models.ElectionModel;
import com.example.demo.Models.OrganizationModel;
import com.example.demo.Models.UserModel;
import com.example.demo.Repositories.AuditLogsRepository;
import com.example.demo.Repositories.ElectionModelRepository;
import com.example.demo.Repositories.OrganizationRepository;
import com.example.demo.Repositories.UserModelRepository;
import com.example.demo.ServiceInterface.AuditFactoryInterface;
import com.example.demo.Util.Ids;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;
@Service
@RequiredArgsConstructor
public class AuditFactoryService implements AuditFactoryInterface {

    private final AuditLogsRepository logsRepository;
    private final ElectionModelRepository electionModelRepository;
    private final OrganizationRepository organizationRepository;
    private final UserModelRepository userModelRepository;

    @Override
    public void build(AuditLogsRequest req) {
        AuditLogsModel model = new AuditLogsModel();

        UserModel actor = null;
        if (req.getActor() != null && !req.getActor().isBlank()) {
            UUID actorId = Ids.uuid(req.getActor(), "actor");
            actor = userModelRepository.findById(actorId).orElse(null);
        }

        OrganizationModel org = null;
        if (req.getOrganizationId() != null && !req.getOrganizationId().isBlank()) {
            UUID orgId = Ids.uuid(req.getOrganizationId(), "organizationId");
            org = organizationRepository.findById(orgId).orElse(null);
        }

        ElectionModel election = null;
        if (req.getElectionId() != null && !req.getElectionId().isBlank()) {
            UUID electionId = Ids.uuid(req.getElectionId(), "electionId");
            election = electionModelRepository.findById(electionId).orElse(null);
        }

        AuditActions action = safeEnum(AuditActions.class, req.getAction(), "action");
        ActionStatus status = safeEnum(ActionStatus.class, req.getStatus(), "status");

        // integrity: if both election and org exist, ensure they match
        if (election != null && org != null && !election.getOrganization().getId().equals(org.getId())) {
            // don’t crash; prefer election's org (or set org=null)
            org = election.getOrganization();
        }

        model.setActor(actor);
        model.setOrganization(org);
        model.setElection(election);
        model.setAction(action);
        model.setStatus(status);
        model.setEntityId(req.getEntityId());
        model.setDetails(req.getDetails());
        model.setCreatedAt(LocalDateTime.now());

        logsRepository.save(model);
    }

    private <E extends Enum<E>> E safeEnum(Class<E> type, String raw, String field) {
        if (raw == null || raw.isBlank()) {
            throw new BadRequestException("MISSING_FIELD", field + " is required");
        }
        try {
            return Enum.valueOf(type, raw);
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("INVALID_ENUM", field + " is invalid");
        }
    }
}
