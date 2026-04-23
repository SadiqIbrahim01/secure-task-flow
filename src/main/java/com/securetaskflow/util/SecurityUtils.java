package com.securetaskflow.util;

import com.securetaskflow.security.CustomUserDetails;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.UUID;

public final class SecurityUtils {

    private SecurityUtils() {}

    public static CustomUserDetails getCurrentUserDetails() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new IllegalStateException(
                    "No authenticated user in SecurityContext — filter chain misconfigured"
            );
        }
        return (CustomUserDetails) auth.getPrincipal();
    }

    public static UUID getCurrentUserId() {
        return getCurrentUserDetails().getUserId();
    }

    public static String getCurrentUserEmail() {
        return getCurrentUserDetails().getEmail();
    }
}