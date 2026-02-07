package com.mmtorresoptical.OpticalClinicManagementSystem.config;

import com.mmtorresoptical.OpticalClinicManagementSystem.enums.Gender;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.Role;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.User;
import com.mmtorresoptical.OpticalClinicManagementSystem.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import java.time.LocalDate;

@Component
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    // Use constructor injection to get the beans
    public DataSeeder(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        // Check if the admin user already exists
        if (userRepository.findByUsername("admin").isEmpty()) {

            System.out.println("Creating default admin user...");

            User adminUser = new User();

            // Set account details
            adminUser.setUsername("admin");
            // IMPORTANT: Store the HASHED password
            adminUser.setPasswordHash(passwordEncoder.encode("admin123"));
            adminUser.setRole(Role.ADMIN);

            // Set required personal information
            adminUser.setFirstName("Admin");
            adminUser.setLastName("Account");
            adminUser.setEmail("admin@mmtorres.com");
            adminUser.setContactNumber("0000000000"); // Placeholder
            adminUser.setGender(Gender.OTHERS); // Placeholder
            adminUser.setBirthDate(LocalDate.of(1990, 1, 1)); // Placeholder

            // Set other fields
            adminUser.setIsArchived(false);
            // 'createdAt' and 'userId' should be auto-generated

            // Save the user to the database
            userRepository.save(adminUser);

            System.out.println("Default admin user created successfully.");
        } else {
            System.out.println("Admin user already exists. Skipping creation.");
        }
    }
}