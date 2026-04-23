package com.securetaskflow.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "application.jwt")
public class JwtProperties {
    private String secret;
    private long accessTokenExpiryMs;
    private long refreshTokenExpiryMs;
}
