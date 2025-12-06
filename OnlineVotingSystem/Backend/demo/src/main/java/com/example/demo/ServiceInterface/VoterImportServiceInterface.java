package com.example.demo.ServiceInterface;

import com.example.demo.DAO.VoterCsvRequest;

public interface VoterImportServiceInterface {

    String bulkVoterImport(VoterCsvRequest voterCsvRequest);

}
