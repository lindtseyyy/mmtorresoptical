package com.mmtorresoptical.OpticalClinicManagementSystem.config;

import com.mmtorresoptical.OpticalClinicManagementSystem.repository.UserRepository;
import com.mmtorresoptical.OpticalClinicManagementSystem.security.JwtAuthenticationFilter;
import com.mmtorresoptical.OpticalClinicManagementSystem.security.JwtTokenProvider;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.CustomUserDetailsService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // 👇 1. ADD THIS BEAN
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // 💡 Set this to your frontend's URL.
        // 5173 is the default for Vite, 3000 is common for Create React App.
        configuration.setAllowedOrigins(Arrays.asList("http://localhost:5174", "http://localhost:5173", "http://localhost:3000"));

        // Allow all standard methods
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));

        // Allow all standard headers
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "Origin", "Accept"));

        configuration.setExposedHeaders(List.of("Content-Disposition"));

        // Allow credentials (important for sending/receiving cookies or auth tokens)
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        // Apply this configuration to all routes starting with /api/
        source.registerCorsConfiguration("/api/**", configuration);
        return source;
    }

    @Bean
    public JwtAuthenticationFilter jwtAuthenticationFilter(
            JwtTokenProvider tokenProvider,
            UserDetailsService userDetailsService
    ) {
        return new JwtAuthenticationFilter(tokenProvider, userDetailsService);
    }


    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, JwtAuthenticationFilter jwtFilter) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(authz -> authz
                        // Allow all CORS preflight requests
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // Auth endpoints (login, forgot-password, change-password)
                        .requestMatchers("/api/auth/login", "/api/auth/forgot-password/**", "/api/auth/change-password").permitAll()
                        // Admin-only auth actions
                        .requestMatchers("/api/auth/admin/**").hasRole("ADMIN")

                        // Admin + Staff — patient search for POS
                        .requestMatchers("/api/admin/patients/search").hasAnyRole("ADMIN", "STAFF")

                        // Admin Only
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")

                        // Swagger UI
                        .requestMatchers(
                                "/swagger-ui/**",
                                "/v3/api-docs/**"
                        ).permitAll()

                        // Product images — public streaming
                        .requestMatchers("/api/products/images/**").permitAll()

                        // Staff + Admin
                        .requestMatchers("/api/**").hasAnyRole("ADMIN", "STAFF")
                        .anyRequest().authenticated()
                )
                // Add our JWT filter before the standard authentication filter
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public UserDetailsService userDetailsService(UserRepository userRepository) {
        return new CustomUserDetailsService(userRepository);
    }


}