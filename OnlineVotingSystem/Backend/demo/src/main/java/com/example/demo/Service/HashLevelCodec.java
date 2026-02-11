package com.example.demo.Service;

import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class HashLevelCodec {
    public byte[] pack(List<byte[]> hashes) {
        byte[] out = new byte[hashes.size() * 32];
        for (int i = 0; i < hashes.size(); i++) {
            System.arraycopy(hashes.get(i), 0, out, i * 32, 32);
        }
        return out;
    }

    public byte[] getAt(byte[] blob, int index) {
        int off = index * 32;
        byte[] h = new byte[32];
        System.arraycopy(blob, off, h, 0, 32);
        return h;
    }

    public int count(byte[] blob) {
        return blob.length / 32;
    }
}
