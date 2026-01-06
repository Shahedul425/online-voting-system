package com.example.demo.Service;

import com.example.demo.DAO.AuditSearchRequest;
import com.example.demo.Models.AuditLogsModel;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDateTime;

public class AuditSpecification {
    public static Specification<AuditLogsModel>buid(AuditSearchRequest auditLogsRequest) {
        return (root, query, criteriaBuilder) ->{
            var predicate = criteriaBuilder.conjunction();
            predicate = criteriaBuilder.and(
                    predicate,
                    criteriaBuilder.equal(root.get("election").get("id"), auditLogsRequest.getElectionId())
            );
            if(auditLogsRequest.getActor()!=null){
                predicate = criteriaBuilder.and(
                        predicate,
                        criteriaBuilder.equal(root.get("actor").get("id"), auditLogsRequest.getActor())
                );
            }
            if(auditLogsRequest.getAction()!=null){
                predicate = criteriaBuilder.and(
                        predicate,
                        criteriaBuilder.equal(root.get("action"), auditLogsRequest.getAction())
                );
            }
            if(auditLogsRequest.getStatus()!=null){
                predicate = criteriaBuilder.and(
                        predicate,
                        criteriaBuilder.equal(root.get("status"), auditLogsRequest.getStatus())
                );
            }
            LocalDateTime from = auditLogsRequest.getFrom();
            LocalDateTime to = auditLogsRequest.getTo();
            if(from!=null && to!=null){
                predicate = criteriaBuilder.and(
                        predicate,
                        criteriaBuilder.between(root.get("createdAt"), from, to)
                );
            }else if(from!=null){
                predicate = criteriaBuilder.and(
                        predicate,
                        criteriaBuilder.greaterThanOrEqualTo(root.get("createdAt"), from)
                );
            }else if(to!=null){
                predicate = criteriaBuilder.and(
                        predicate,
                        criteriaBuilder.lessThanOrEqualTo(root.get("createdAt"), to)
                );
            }
            return predicate;
        };
    }
}
