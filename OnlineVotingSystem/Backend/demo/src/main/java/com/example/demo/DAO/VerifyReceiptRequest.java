package com.example.demo.DAO;

import jakarta.validation.constraints.NotBlank;

public record VerifyReceiptRequest ( @NotBlank String receiptToken ){};

