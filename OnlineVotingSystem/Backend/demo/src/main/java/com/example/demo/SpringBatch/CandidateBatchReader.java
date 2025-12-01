package com.example.demo.SpringBatch;

import com.example.demo.DTO.CandidateCsvRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.batch.core.configuration.annotation.StepScope;
import org.springframework.batch.item.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.FileNotFoundException;
import java.io.FileReader;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

@StepScope
@Component
@RequiredArgsConstructor
public class CandidateBatchReader implements ItemStreamReader<CandidateCsvRequest> {
    private BufferedReader reader;
    @Value("#{jobParameters['filePath']}")
    private String filePath;

    private AtomicInteger lineCounter = new AtomicInteger(0);
    private Map<String,Integer> headerIndex= new HashMap<>();
    @Override
    public CandidateCsvRequest read() throws Exception, UnexpectedInputException, ParseException, NonTransientResourceException {
        if(reader==null){
            throw new ItemStreamException("Candidate Csv is Empty");
        }
        String line;
        while ((line = reader.readLine())!=null){
            int ln = lineCounter.getAndIncrement();
            if(ln==1 && line.toLowerCase().contains("candidateid")){
                continue;
            }
            String[] parts = line.split(",",-1);
            CandidateCsvRequest candidateCsvRequest = new CandidateCsvRequest();
            candidateCsvRequest.setPosition(get(parts,"position"));
            candidateCsvRequest.setLineNumber(ln);
            candidateCsvRequest.setLastName(get(parts,"lastname"));
            candidateCsvRequest.setFirstName(get(parts,"firstname"));
            candidateCsvRequest.setBallotSerial(get(parts,"ballotserial"));
            candidateCsvRequest.setPhotoUrl(get(parts,"photourl"));
            return candidateCsvRequest;
        }
        return null;
    }

    @Override
    public void open(ExecutionContext executionContext) throws ItemStreamException {
        try {
            reader = new BufferedReader(new FileReader(filePath));
            String header = reader.readLine();
            if(header==null){
                throw new ItemStreamException("Candidate Csv is Empty");
            }
            String[] headers = header.split(",",-1);
            for (int i = 0; i < headers.length; i++) {
              headerIndex.put(headers[i].trim().toLowerCase(),i);
            }

            validateColumn("firstName");
            validateColumn("lastName");
            validateColumn("party");
            validateColumn("position");
            validateColumn("ballotserial");
            validateColumn("photoUrl");


        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    private void validateColumn(String col) {
        if(!headerIndex.containsKey(col.toLowerCase())){
            throw new ItemStreamException("Candidate Csv is Empty");
        }
    }

    private String get(String[] parts, String col){
        Integer idx = headerIndex.get(col.toLowerCase());
        if(idx==null||idx>parts.length){
            return null;
        }
        return parts[idx].trim();
    }

    @Override
    public void update(ExecutionContext executionContext) throws ItemStreamException {}

    @Override
    public void close() throws ItemStreamException {
        try { if (reader != null) reader.close(); } catch (IOException ignored) {}
    }
}
