package com.example.demo.ServiceInterface;

import com.example.demo.DAO.VoteRequest;
import com.example.demo.DTO.VoteReceiptResponse;
import com.example.demo.Models.VoteModel;

import java.util.UUID;

public interface CommitServiceInterface {
    VoteReceiptResponse commitVote(VoteRequest request);

}
