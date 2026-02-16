package com.mmtorresoptical.OpticalClinicManagementSystem.security;

import com.mmtorresoptical.OpticalClinicManagementSystem.model.User;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;
import java.util.UUID;

public class CustomUserDetails
        implements UserDetails {

    private UUID userId;
    private String username;
    private String password;
    private String role;

    public CustomUserDetails(User user) {
        this.userId = user.getUserId();
        this.username = user.getUsername();
        this.password = user.getPasswordHash();
        this.role = String.valueOf(user.getRole());
    }

    public UUID getUserId() {
        return userId;
    }

    @Override
    public String getUsername() {
        return username;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public Collection<? extends GrantedAuthority>
    getAuthorities() {
        return Collections.singletonList(
                new SimpleGrantedAuthority("ROLE_" + role)
        );
    }

    @Override public boolean isAccountNonExpired() { return true; }
    @Override public boolean isAccountNonLocked() { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override public boolean isEnabled() { return true; }
}