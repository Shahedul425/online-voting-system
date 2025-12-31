package com.example.demo.DTO;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class MerkleProofDTO {
    private String siblingHash;
    private boolean isLeftSibling;
}