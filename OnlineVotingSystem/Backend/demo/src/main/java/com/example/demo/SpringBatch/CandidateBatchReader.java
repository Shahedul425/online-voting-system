package com.example.demo.SpringBatch;

import com.example.demo.DAO.CandidateCsvRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.batch.core.configuration.annotation.StepScope;
import org.springframework.batch.item.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
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

    private final AtomicInteger lineCounter = new AtomicInteger(0);
    private final Map<String, Integer> headerIndex = new HashMap<>();

    @Override
    public CandidateCsvRequest read() throws Exception {

        if (reader == null) {
            throw new ItemStreamException("Reader not initialized");
        }

        String line = reader.readLine();
        if (line == null) {
            return null;
        }

        int ln = lineCounter.incrementAndGet();

        // Skip header row (line #1)
        if (ln == 1) {
            return read();
        }

        String[] parts = line.split(",", -1);

        CandidateCsvRequest dto = new CandidateCsvRequest();
        dto.setLineNumber(ln);
        dto.setFirstName(get(parts, "firstname"));
        dto.setLastName(get(parts, "lastname"));
        dto.setParty(get(parts, "party"));
        dto.setPosition(get(parts, "position"));
        dto.setBallotSerial(get(parts, "ballotserial"));
        dto.setPhotoUrl(get(parts, "photourl"));

        return dto;
    }

    @Override
    public void open(ExecutionContext executionContext) throws ItemStreamException {
        try {
            reader = new BufferedReader(new FileReader(filePath));

            String header = reader.readLine();
            if (header == null) {
                throw new ItemStreamException("CSV file is empty");
            }

            String[] headers = header.split(",", -1);
            for (int i = 0; i < headers.length; i++) {
                headerIndex.put(headers[i].trim().toLowerCase(), i);
            }

            validateColumn("firstname");
            validateColumn("lastname");
            validateColumn("party");
            validateColumn("position");
            validateColumn("ballotserial");
            validateColumn("photourl");

        } catch (IOException e) {
            throw new ItemStreamException("Failed to open CSV file", e);
        }
    }

    private void validateColumn(String col) {
        if (!headerIndex.containsKey(col.toLowerCase())) {
            throw new ItemStreamException("CSV missing required column: " + col);
        }
    }

    private String get(String[] parts, String col) {
        Integer idx = headerIndex.get(col.toLowerCase());
        if (idx == null || idx >= parts.length) {
            return null;
        }
        return parts[idx].trim();
    }

    @Override
    public void update(ExecutionContext executionContext) {}

    @Override
    public void close() throws ItemStreamException {
        try { if (reader != null) reader.close(); }
        catch (IOException ignored) {}
    }
}
