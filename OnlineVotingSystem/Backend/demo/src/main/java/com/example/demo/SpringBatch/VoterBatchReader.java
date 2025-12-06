package com.example.demo.SpringBatch;

import com.example.demo.DAO.VoterCsvRequest;
import org.springframework.batch.core.configuration.annotation.StepScope;
import org.springframework.batch.item.ExecutionContext;
import org.springframework.batch.item.ItemStreamException;
import org.springframework.batch.item.ItemStreamReader;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

@Component
@StepScope
public class VoterBatchReader implements ItemStreamReader<VoterCsvRequest> {

    @Value("#{jobParameters['filePath']}")
    private String filePath;

    @Value("#{jobParameters['voterIdColumn']}")
    private String voterIdColumn;

    @Value("#{jobParameters['emailColumn']}")
    private String emailColumn;

    private BufferedReader reader;
    private AtomicInteger lineNumber = new AtomicInteger(0);
    private Map<String, Integer> headerIndex;

    @Override
    public void open(ExecutionContext executionContext) throws ItemStreamException {
        try {
            reader = new BufferedReader(new FileReader(filePath));
            initHeaderMap();
        } catch (IOException e) {
            throw new ItemStreamException("Cannot open file: " + filePath, e);
        }
    }

    private void initHeaderMap() throws IOException {
        String headerLine = reader.readLine();
        if (headerLine == null) throw new IOException("CSV file is empty");

        String[] headers = headerLine.split(",", -1);
        headerIndex = new HashMap<>();
        for (int i = 0; i < headers.length; i++) {
            headerIndex.put(headers[i].trim().toLowerCase(), i);
        }

        // Optional: validate admin-mapped columns exist
        if (!headerIndex.containsKey(voterIdColumn.toLowerCase()))
            throw new IllegalArgumentException("VoterId column not found in CSV: " + voterIdColumn);
        if (!headerIndex.containsKey(emailColumn.toLowerCase()))
            throw new IllegalArgumentException("Email column not found in CSV: " + emailColumn);
    }

    @Override
    public VoterCsvRequest read() throws Exception {
        if (reader == null) return null;

        String line;
        while ((line = reader.readLine()) != null) {
            int ln = lineNumber.incrementAndGet();
            // Skip any remaining headers or blank lines
            if (line.isBlank()) continue;

            String[] parts = line.split(",", -1);
            VoterCsvRequest row = new VoterCsvRequest();
            row.setLineNumber(ln);

            row.setVoterId(parts[headerIndex.get(voterIdColumn.toLowerCase())].trim());
            row.setEmail(parts[headerIndex.get(emailColumn.toLowerCase())].trim());


            return row;
        }
        return null;
    }

    @Override
    public void update(ExecutionContext executionContext) { }

    @Override
    public void close() throws ItemStreamException {
        try { if (reader != null) reader.close(); } catch (IOException ignored) {}
    }
}
