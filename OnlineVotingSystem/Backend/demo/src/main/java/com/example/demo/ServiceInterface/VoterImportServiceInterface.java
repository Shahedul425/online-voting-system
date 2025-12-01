package com.example.demo.ServiceInterface;

import com.example.demo.DTO.VoterCsvRequest;
import com.example.demo.Models.VoterListModel;

import java.util.UUID;

public interface VoterImportServiceInterface {

    String bulkVoterImport(VoterCsvRequest voterCsvRequest);

}
