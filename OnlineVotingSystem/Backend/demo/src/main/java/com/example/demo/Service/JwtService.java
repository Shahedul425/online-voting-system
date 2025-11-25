package com.example.demo.Service;

import com.auth0.jwt.JWT;
import com.auth0.jwt.interfaces.DecodedJWT;
import com.example.demo.ServiceInterface.JwtServiceInterface;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
@Service
public class JwtService implements JwtServiceInterface {
    @Override
    public DecodedJWT decodeJwt(String token) {
        return JWT.decode(token.replace("Bearer ", ""));
    }

    @Override
    public String extractEmail(String token) {
        return decodeJwt(token).getClaim("email").asString();

    }

    @Override
    public String extractKeyCloakId(String token) {
        return decodeJwt(token).getSubject();
    }

    @Override
    public List<String> extractRoles(String token) {
        DecodedJWT jwt =  decodeJwt(token);
        Map<String, Object> claims = jwt.getClaim("realm_access").asMap();
        if(claims ==null){
            return List.of();
        }
        Object roles = claims.get("roles");
        if(roles instanceof List<?> list){
            return list.stream().map(Object::toString).toList();
        }
        return List.of();
    }
}
