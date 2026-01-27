package com.example.demo.Service;

import com.example.demo.DTO.MerkleProofDTO;
import com.example.demo.Repositories.VoteModelRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;

@Service
public class MerkleTreeService {
//    private final VoteModelRepository voteModelRepository;

//    static class MerkleTreeNode {
//        String hash;
//        MerkleTreeNode left;
//        MerkleTreeNode right;
//        MerkleTreeNode(String hash){
//            this.hash = hash;
//        }
//    }


    private String hash(String input)  {
       try {
           MessageDigest digest= MessageDigest.getInstance("SHA-256");
           byte[] hash = digest.digest(input.getBytes());
           return Base64.getUrlEncoder().withoutPadding().encodeToString(hash);
       }catch (NoSuchAlgorithmException e){
           throw new RuntimeException(e.getMessage());
       }
    }

    public String buildMerkleTree(List<String> tokens){
        List<String> tokensList = tokens.stream()
                .map(this::hash)
                .toList();
        while(tokensList.size() > 1){
            List<String> nextLevel = new ArrayList<>();
            for(int i =0; i<tokensList.size();i+=2){
                String left = tokensList.get(i);
                String right = (i+1<tokensList.size()?tokensList.get(i+1):left);
                nextLevel.add(hash(left+right));
            }
            tokensList = nextLevel;
        }
        return tokensList.get(0);
    }

    public List<MerkleProofDTO> generateMerkleProof(List<String> tokens,String token){
        List<String> tokensList = tokens.stream()
                .map(this::hash)
                .toList();
        String currentHash = hash(token);
        List<MerkleProofDTO> proofs = new ArrayList<>();
        while(tokensList.size() > 1){
            if(tokensList.size()%2!=0){
                tokensList.add(tokensList.get(tokensList.size()-1));
            }
            List<String> nextLevel = new ArrayList<>();
            for(int i =0; i<tokensList.size();i+=2){
                String left = tokensList.get(i);
                String right = (i+1<tokensList.size()?tokensList.get(i+1):left);
                String parent = hash(left+right);
                nextLevel.add(parent);
                if(left.equals(currentHash)){
                    proofs.add(new MerkleProofDTO(right,false));
                    currentHash = parent;
                }else if(right.equals(currentHash)){
                    proofs.add(new MerkleProofDTO(left,true));
                    currentHash = parent;
                }
            }
            tokensList = nextLevel;
        }
        return proofs;
    }
    public boolean verifyVote(String  root,String token,List<MerkleProofDTO> proof){
        String current = hash(token);
        for(MerkleProofDTO p:proof){
            current = p.isLeftSibling()?
                    hash(p.getSiblingHash()+current):
                    hash(current+p.getSiblingHash());
        }
        return current.equals(root);
    }
}
