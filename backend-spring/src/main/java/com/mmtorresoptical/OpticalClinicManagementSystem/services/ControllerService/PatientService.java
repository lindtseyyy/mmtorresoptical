package com.mmtorresoptical.OpticalClinicManagementSystem.services.ControllerService;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.patient.PatientDetailsDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.patient.PatientRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.patient.PatientResponseDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.Gender;
import com.mmtorresoptical.OpticalClinicManagementSystem.exception.custom.ConflictException;
import com.mmtorresoptical.OpticalClinicManagementSystem.exception.custom.ResourceNotFoundException;
import com.mmtorresoptical.OpticalClinicManagementSystem.mapper.PatientMapper;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.Patient;
import com.mmtorresoptical.OpticalClinicManagementSystem.repository.PatientRepository;
import com.mmtorresoptical.OpticalClinicManagementSystem.security.HmacHashService;
import com.mmtorresoptical.OpticalClinicManagementSystem.utils.NameUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PatientService {
    private final PatientRepository patientRepository;
    private final PatientMapper patientMapper;
    private final HmacHashService hmacHashService;


    public PatientResponseDTO createPatient(PatientRequestDTO patientRequest) {
        if(patientExistsByFirstMiddleLastName(patientRequest.getFirstName(), patientRequest.getMiddleName(), patientRequest.getLastName())) {
            throw new ConflictException(
                    "Patient's name is already existing in the records."
            );
        }

        if(patientExistsByEmail(patientRequest.getEmail())) {
            throw new ConflictException(
                    "Patient's email is already existing in the records."
            );
        }

        Patient patient = new Patient();

        // Set patient names
        patient.setFirstName(patientRequest.getFirstName());
        patient.setMiddleName(patientRequest.getMiddleName());
        patient.setLastName(patientRequest.getLastName());

        // Generate HMAC hashes for sensitive name fields
        String firstNameHash = hmacHashService.hash(patientRequest.getFirstName());
        String middleNameHash = Optional.ofNullable(patientRequest.getMiddleName())
                .filter(name -> !name.isBlank())
                .map(hmacHashService::hash)
                .orElse(null);

        String lastNameHash = hmacHashService.hash(patientRequest.getLastName());

        patient.setFirstNameHash(firstNameHash);
        patient.setMiddleNameHash(middleNameHash);
        patient.setLastNameHash(lastNameHash);

        // Set patient gender
        patient.setGender(Gender.valueOf(patientRequest.getGender()));

        // Set contact information
        patient.setContactNumber(patientRequest.getContactNumber());

        // Set email and generate its hash
        patient.setEmail(patientRequest.getEmail());
        String emailHash = hmacHashService.hash(patientRequest.getEmail());
        patient.setEmailHash(emailHash);

        // Set birth date
        patient.setBirthDate(patientRequest.getBirthDate());

        // Set patient address
        patient.setAddress(patientRequest.getAddress());

        // Set archive status
        patient.setIsArchived(patientRequest.getIsArchived());

        // Generate sortable full name for indexing/search
        patient.setFullNameSortable(NameUtils.generateFullNameSortable(patient.getFirstName(),patient.getMiddleName(), patient.getLastName()));

        // Persist patient record
        Patient savedPatient = patientRepository.save(patient);

        // Map entity to response DTO and return
        return patientMapper.entityToResponse(savedPatient);
    }

    public Page<PatientDetailsDTO> getAllPatients(int page, int size, String sortBy) {
        // Create pageable configuration with sorting
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortBy).ascending());

        // Retrieve non-archived patients
        Page<Patient> retrievedPatients = patientRepository.findAllByIsArchivedFalse(pageable);

        // Map entities to detailed DTO responses and return
        return retrievedPatients.map(patientMapper::entityToDetailedResponse);
    }

    public PatientDetailsDTO getPatientById(UUID id) {
        // Retrieve patient or throw exception if not found
        Patient retrievedPatient = patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + id));

        // Map patient entity to detailed DTO and return
        return patientMapper.entityToDetailedResponse(retrievedPatient);
    }

    public PatientResponseDTO updatePatient(UUID id, PatientRequestDTO patientRequest) {
        // Retrieve patient or throw exception if not found
        Patient retrievedPatient = patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + id));


        /* -----------------------------
           Normalize input values
        ----------------------------- */
        String first = patientRequest.getFirstName();
        String middle = Optional.ofNullable(patientRequest.getMiddleName()).orElse("");
        String last = patientRequest.getLastName();

        /* -----------------------------
           Validate name uniqueness
        ----------------------------- */
        boolean nameChanged =
                !retrievedPatient.getFirstName().equals(first) ||
                        !Objects.equals(retrievedPatient.getMiddleName(), middle)
                        ||
                        !retrievedPatient.getLastName().equals(last);

        if (nameChanged) {

            boolean isNameExisting = patientExistsByFirstMiddleLastName(first, middle, last);

            if(isNameExisting) {
                throw new ConflictException("Name is already taken");
            }

            // Update sortable full name
            retrievedPatient.setFullNameSortable(NameUtils.generateFullNameSortable(first, middle, last));

            // Update hashed names
            retrievedPatient.setFirstNameHash(hmacHashService.hash(first));
            String middleNameHash = Optional.ofNullable(patientRequest.getMiddleName())
                    .filter(name -> !name.isBlank())
                    .map(hmacHashService::hash)
                    .orElse(null);
            retrievedPatient.setMiddleNameHash(middleNameHash);
            retrievedPatient.setLastNameHash(hmacHashService.hash(last));
        }

        /* -----------------------------
           Validate email uniqueness
        ----------------------------- */
        if(!retrievedPatient.getEmail().equals(patientRequest.getEmail())) {

            boolean isEmailExisting = patientExistsByEmail(patientRequest.getEmail());

            if (isEmailExisting) {
                throw new ConflictException("Email is already in use");
            }

        }

        /* -----------------------------
           Apply updates to entity
        ----------------------------- */
        patientMapper.updatePatientFromDto(patientRequest, retrievedPatient);

        Patient updatedPatient = patientRepository.save(retrievedPatient);

        return patientMapper.entityToResponse(updatedPatient);
    }

    public void archivePatient(UUID id) {
        // Retrieve patient or throw exception if not found
        Patient retrievedPatient = patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + id));

        // Mark patient as archived (soft delete)
        retrievedPatient.setIsArchived(true);

        // Persist archive update
        patientRepository.save(retrievedPatient);
    }

    public void restorePatient(UUID id) {
        // Retrieve patient or throw exception if not found
        Patient retrievedPatient = patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + id));

        // Mark patient as unarchived
        retrievedPatient.setIsArchived(false);

        // Persist unarchive update
        patientRepository.save(retrievedPatient);
    }

    public Page<PatientDetailsDTO> searchPatients(String keyword, int page, int size) {
        // Configure pagination
        Pageable pageable = PageRequest.of(page, size);

        // Perform keyword search (case-insensitive)
        Page<Patient> patientPage = patientRepository.findAllByFullNameSortableContainingIgnoreCase(keyword, pageable);

        // Map entities to detailed DTO responses and return
        return patientPage.map(patientMapper::entityToDetailedResponse);
    }

    /**
     * Determines whether a patient record already exists
     * based on first, middle, and last name.
     *
     * This method:
     * - Hashes the provided name fields using HMAC
     * - Handles nullable or blank middle names
     * - Queries the database using hashed values
     *
     * @param firstName the patient's first name
     * @param middleName the patient's middle name (nullable)
     * @param lastName the patient's last name
     * @return true if a matching patient exists; false otherwise
     */
    private boolean patientExistsByFirstMiddleLastName(
            String firstName,
            String middleName,
            String lastName
    ) {

        String firstHash = hmacHashService.hash(firstName);
        String middleHash = Optional.ofNullable(middleName)
                .filter(name -> !middleName.isBlank())
                .map(hmacHashService::hash)
                .orElse(null);
        String lastHash = hmacHashService.hash(lastName);

        return patientRepository.existsByFirstNameHashAndMiddleNameHashAndLastNameHash(
                firstHash,
                middleHash,
                lastHash
        );
    }

    /**
     * Determines whether a patient record already exists
     * based on the provided email address.
     *
     * This method:
     * - Hashes the email using HMAC
     * - Queries the database using the hashed value
     * - Prevents exposure of raw email data
     *
     * @param email the patient's email address
     * @return true if a matching patient exists; false otherwise
     */
    private boolean patientExistsByEmail(
            String email
    ) {

        String emailHash = hmacHashService.hash(email);

        return patientRepository.existsByEmailHash(
                emailHash
        );
    }
}
