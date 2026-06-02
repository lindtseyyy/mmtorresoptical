package com.mmtorresoptical.OpticalClinicManagementSystem.config;

import com.mmtorresoptical.OpticalClinicManagementSystem.enums.Sex;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.Role;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.User;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.Category;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.Supplier;
import com.mmtorresoptical.OpticalClinicManagementSystem.repository.CategoryRepository;
import com.mmtorresoptical.OpticalClinicManagementSystem.repository.SupplierRepository;
import com.mmtorresoptical.OpticalClinicManagementSystem.repository.UserRepository;
import com.mmtorresoptical.OpticalClinicManagementSystem.utils.NameUtils;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import java.time.LocalDate;
import java.util.List;

@Component
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final CategoryRepository categoryRepository;
    private final SupplierRepository supplierRepository;

    // Use constructor injection to get the beans
    public DataSeeder(UserRepository userRepository, PasswordEncoder passwordEncoder, CategoryRepository categoryRepository, SupplierRepository supplierRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.categoryRepository = categoryRepository;
        this.supplierRepository = supplierRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        // Seed default categories if none exist
        if (categoryRepository.count() == 0) {
            System.out.println("Seeding default categories...");
            List<String> defaultCategories = List.of("Frames", "Lenses", "Contact Lenses", "Accessories", "Solutions");
            for (String name : defaultCategories) {
                Category category = new Category();
                category.setName(name);
                categoryRepository.save(category);
            }
            System.out.println("Default categories seeded.");
        }

        // Seed default suppliers if none exist
        if (supplierRepository.count() == 0) {
            System.out.println("Seeding default suppliers...");
            List<String> defaultSuppliers = List.of("Essilor", "Luxottica", "Safilo", "Hoya");
            for (String name : defaultSuppliers) {
                Supplier supplier = new Supplier();
                supplier.setName(name);
                supplierRepository.save(supplier);
            }
            System.out.println("Default suppliers seeded.");
        }

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
            adminUser.setContactNumber("09123456789"); // Placeholder
            adminUser.setSex(Sex.FEMALE); // Placeholder
            adminUser.setBirthDate(LocalDate.of(1990, 1, 1)); // Placeholder

            // Security Question
            adminUser.setSecurityQuestion("What is the name of your dog?");
            adminUser.setSecurityAnswerHash(passwordEncoder.encode("Primo"));

            // Set other fields
            adminUser.setIsArchived(false);
            // 'createdAt' and 'userId' should be auto-generated

            // Set the full name sortable
            adminUser.setFullNameSortable(NameUtils.generateFullNameSortable(adminUser.getFirstName(), adminUser.getMiddleName(), adminUser.getLastName()));

            // Save the user to the database
            userRepository.save(adminUser);

            System.out.println("Default admin user created successfully.");
        } else {
            System.out.println("Admin user already exists. Skipping creation.");
        }
    }
}