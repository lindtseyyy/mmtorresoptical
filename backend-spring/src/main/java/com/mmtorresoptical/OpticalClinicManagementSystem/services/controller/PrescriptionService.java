package com.mmtorresoptical.OpticalClinicManagementSystem.services.controller;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.prescription.*;
import com.mmtorresoptical.OpticalClinicManagementSystem.exception.custom.BadRequestException;
import com.mmtorresoptical.OpticalClinicManagementSystem.exception.custom.ResourceNotFoundException;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.FollowUpStatus;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.PrescriptionStatus;
import com.mmtorresoptical.OpticalClinicManagementSystem.exception.custom.MethodNotAllowedException;
import com.mmtorresoptical.OpticalClinicManagementSystem.mapper.PrescriptionLensDetailMapper;
import com.mmtorresoptical.OpticalClinicManagementSystem.mapper.PrescriptionMapper;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.*;
import com.mmtorresoptical.OpticalClinicManagementSystem.repository.PatientRepository;
import com.mmtorresoptical.OpticalClinicManagementSystem.repository.PrescriptionLensDetailRepository;
import com.mmtorresoptical.OpticalClinicManagementSystem.repository.PrescriptionRecommendationRepository;
import com.mmtorresoptical.OpticalClinicManagementSystem.repository.PrescriptionRepository;
import com.mmtorresoptical.OpticalClinicManagementSystem.repository.ProductRepository;
import com.mmtorresoptical.OpticalClinicManagementSystem.repository.EyeExamRepository;
import com.mmtorresoptical.OpticalClinicManagementSystem.repository.PatientFollowUpRepository;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.AuthenticatedUserService;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.auditlog.resources.PatientFollowUpAuditHelper;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.auditlog.resources.PrescriptionAuditHelper;
import com.mmtorresoptical.OpticalClinicManagementSystem.specification.PrescriptionSpecification;
import com.mmtorresoptical.OpticalClinicManagementSystem.utils.UUIDUtils;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PrescriptionService {

    private final PrescriptionRepository prescriptionRepository;
    private final PatientRepository patientRepository;
    private final PrescriptionMapper prescriptionMapper;
    private final PrescriptionLensDetailMapper prescriptionLensDetailMapper;
    private final AuthenticatedUserService authenticatedUserService;
    private final PrescriptionLensDetailRepository lensDetailRepository;
    private final PrescriptionRecommendationRepository recommendationRepository;
    private final ProductRepository productRepository;
    private final PrescriptionAuditHelper prescriptionAuditHelper;
    private final PatientFollowUpRepository patientFollowUpRepository;
    private final PatientFollowUpAuditHelper patientFollowUpAuditHelper;
    private final EyeExamRepository eyeExamRepository;
    private final EntityManager entityManager;

    @Transactional
    public PrescriptionResponseDTO createPrescription(UUID id, CreatePrescriptionRequestDTO prescriptionRequest) {
        Patient retrievedPatient = patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + id));

        User authenticatedUser = authenticatedUserService.getCurrentUser();

        boolean hasLens = prescriptionRequest.getLensSpecifications() != null
                && !prescriptionRequest.getLensSpecifications().isEmpty();
        boolean hasProducts = prescriptionRequest.getProducts() != null
                && !prescriptionRequest.getProducts().isEmpty();

        if (!hasLens && !hasProducts) {
            throw new BadRequestException(
                    "A prescription must contain either an eyeglass specification or a product recommendation.");
        }

        Prescription prescription = new Prescription();
        prescription.setIssueDate(prescriptionRequest.getIssueDate());
        prescription.setNotes(prescriptionRequest.getNotes());
        prescription.setIsArchived(prescriptionRequest.getIsArchived());
        prescription.setPatient(retrievedPatient);
        prescription.setUser(authenticatedUser);

        if (prescriptionRequest.getEyeExamId() != null) {
            EyeExam eyeExam = eyeExamRepository.findById(prescriptionRequest.getEyeExamId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Eye exam not found with id: " + prescriptionRequest.getEyeExamId()));
            prescription.setEyeExam(eyeExam);
        }

        // Generate rx number — create sequence if first run
        entityManager.createNativeQuery(
                "CREATE SEQUENCE IF NOT EXISTS prescription_rx_seq START WITH 10001 INCREMENT BY 1 NO MAXVALUE NO CYCLE"
        ).executeUpdate();
        Long nextSeq = (Long) entityManager
                .createNativeQuery("SELECT nextval('prescription_rx_seq')")
                .getSingleResult();
        prescription.setRxNumber("RX-" + nextSeq);

        Prescription savedPrescription = prescriptionRepository.save(prescription);

        if (hasLens) {
            List<PrescriptionLensDetail> lensDetails = prescriptionRequest.getLensSpecifications().stream()
                    .map(lensDTO -> {
                        PrescriptionLensDetail ld = new PrescriptionLensDetail();
                        ld.setPrescription(savedPrescription);
                        ld.setUser(authenticatedUser);
                        ld.setLensTypePurpose(lensDTO.getLensTypePurpose());
                        ld.setRightSph(lensDTO.getRightSph());
                        ld.setRightCyl(lensDTO.getRightCyl());
                        ld.setRightAxis(lensDTO.getRightAxis());
                        ld.setRightAdd(lensDTO.getRightAdd());
                        ld.setRightPd(lensDTO.getRightPd());
                        ld.setLeftSph(lensDTO.getLeftSph());
                        ld.setLeftCyl(lensDTO.getLeftCyl());
                        ld.setLeftAxis(lensDTO.getLeftAxis());
                        ld.setLeftAdd(lensDTO.getLeftAdd());
                        ld.setLeftPd(lensDTO.getLeftPd());
                        ld.setCorrectionType(lensDTO.getCorrectionType());
                        ld.setLensType(lensDTO.getLensType());
                        ld.setFrameTypePreference(lensDTO.getFrameTypePreference());
                        ld.setLensCoatings(lensDTO.getLensCoatings());
                        ld.setLensMaterial(lensDTO.getLensMaterial());
                        ld.setLensWearType(lensDTO.getLensWearType());
                        ld.setLensMaterialCl(lensDTO.getLensMaterialCl());
                        ld.setBaseCurve(lensDTO.getBaseCurve());
                        ld.setDiameter(lensDTO.getDiameter());
                        ld.setNotes(lensDTO.getNotes());
                        return ld;
                    }).collect(Collectors.toList());

            savedPrescription.getPrescriptionLensDetails().addAll(lensDetails);
            prescriptionRepository.save(savedPrescription);
        }

        final Prescription finalSavedPrescription = savedPrescription;

        if (hasProducts) {
            List<PrescriptionRecommendation> recs = prescriptionRequest.getProducts().stream()
                    .map(item -> {
                        Product product = productRepository.findById(item.productId())
                                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + item.productId()));

                        PrescriptionRecommendation rec = new PrescriptionRecommendation();
                        rec.setPrescription(finalSavedPrescription);
                        rec.setProduct(product);
                        rec.setQuantity(item.quantity());
                        rec.setStaffNotes(item.staffNotes());
                        return rec;
                    }).collect(Collectors.toList());

            recommendationRepository.saveAll(recs);
        }

        if (prescriptionRequest.getFollowUpScheduledDate() != null) {
            PatientFollowUp followUp = new PatientFollowUp();
            followUp.setPrescription(finalSavedPrescription);
            followUp.setPatient(retrievedPatient);
            followUp.setScheduledDate(prescriptionRequest.getFollowUpScheduledDate());
            followUp.setFollowUpReason(prescriptionRequest.getFollowUpReason());
            followUp.setStatus(FollowUpStatus.PENDING);
            followUp.setCreatedBy(authenticatedUser);
            patientFollowUpRepository.save(followUp);
            patientFollowUpAuditHelper.logCreate(followUp);
        }

        prescriptionAuditHelper.logCreate(finalSavedPrescription);

        PrescriptionResponseDTO response = prescriptionMapper.entityToResponseDTO(finalSavedPrescription);
        response.setRecommendations(buildRecommendationResponses(finalSavedPrescription.getPrescriptionId()));
        return response;
    }

    public Page<PrescriptionListDTO> getAllPatientPrescriptions(UUID patientId,
                                                                String keyword,
                                                                LocalDate minDate,
                                                                LocalDate maxDate,
                                                                int page,
                                                                int size,
                                                                String sortBy,
                                                                String sortOrder,
                                                                String status) {


        Specification<Prescription> spec = Specification.allOf();

        if (keyword != null && UUIDUtils.isUUID(keyword)) {

            Optional<Prescription> prescription =
                    prescriptionRepository.findById(UUID.fromString(keyword));

            if (prescription.isEmpty()) {
                return Page.empty();
            }

            return new PageImpl<>(
                    List.of(prescriptionMapper.entityToListDTO(prescription.get())),
                    PageRequest.of(page, size),
                    1
            );
        }

        if (minDate != null || maxDate != null) {
            spec = spec.and(
                    PrescriptionSpecification.dateBetween(minDate, maxDate)
            );
        }

        spec = spec.and(
                PrescriptionSpecification.hasStatus(status)
        );

        spec = spec.and(
                PrescriptionSpecification.hasPatientId(patientId)
        );

        Sort.Direction direction;

        try {
            direction = Sort.Direction.fromString(sortOrder);
        } catch (IllegalArgumentException ex) {
            direction = Sort.Direction.DESC;
        }

        Sort sort = Sort.by(Sort.Direction.ASC, "status")
                .and(Sort.by(direction, sortBy));
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Prescription> prescriptions = prescriptionRepository.findAll(spec, pageable);

        return prescriptions.map(prescriptionMapper::entityToListDTO);
    }

    public PrescriptionDetailsDTO getPrescription(UUID id) {
        Prescription retrievedPrescription = prescriptionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription not found with id: " + id));

        PrescriptionDetailsDTO dto = prescriptionMapper.entityToDetailsDTO(retrievedPrescription);
        dto.setRecommendations(buildRecommendationResponses(id));
        return dto;
    }

    public PrescriptionDetailsDTO updatePrescription(UUID id, UpdatePrescriptionRequestDTO updatePrescriptionRequestDTO) {
        throw new MethodNotAllowedException("PUT is disabled on prescriptions. Medical records are immutable. Use POST /api/admin/prescriptions/{id}/void to void, or POST /api/admin/prescriptions/{id}/clone to create a new version.");
    }

    public void archivePrescription(UUID id) {
        throw new MethodNotAllowedException("DELETE is disabled on prescriptions. Medical records are immutable. Use POST /api/admin/prescriptions/{id}/void to void this record.");
    }

    public void restorePrescription(UUID id) {
        Prescription retrievedPrescription = prescriptionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription not found with id: " + id));

        retrievedPrescription.setIsArchived(false);

        prescriptionRepository.save(retrievedPrescription);

        prescriptionAuditHelper.logRestore(retrievedPrescription);
    }

    @Transactional
    public void voidPrescription(UUID id, VoidPrescriptionRequestDTO request) {
        Prescription prescription = prescriptionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription not found with id: " + id));

        if (prescription.getStatus() == PrescriptionStatus.VOIDED) {
            throw new IllegalStateException("Prescription is already voided");
        }

        User authenticatedUser = authenticatedUserService.getCurrentUser();

        prescription.setStatus(PrescriptionStatus.VOIDED);
        prescription.setVoidReason(request.getVoidReason());
        prescription.setVoidedAt(LocalDateTime.now());
        prescription.setVoidedBy(authenticatedUser);

        prescriptionRepository.save(prescription);

        prescriptionAuditHelper.logVoid(prescription);
    }

    @Transactional
    public PrescriptionResponseDTO clonePrescription(UUID id) {
        Prescription source = prescriptionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription not found with id: " + id));

        User authenticatedUser = authenticatedUserService.getCurrentUser();

        Prescription clone = new Prescription();
        clone.setIssueDate(LocalDate.now());
        clone.setNotes(source.getNotes());
        clone.setIsArchived(false);
        clone.setStatus(PrescriptionStatus.ACTIVE);
        clone.setPatient(source.getPatient());
        clone.setUser(authenticatedUser);
        clone.setEyeExam(source.getEyeExam());

        final Prescription saved = prescriptionRepository.save(clone);

        if (source.getPrescriptionLensDetails() != null && !source.getPrescriptionLensDetails().isEmpty()) {
            List<PrescriptionLensDetail> clonedLenses = source.getPrescriptionLensDetails().stream()
                    .map(sourceLens -> {
                        PrescriptionLensDetail clonedLens = new PrescriptionLensDetail();
                        BeanUtils.copyProperties(sourceLens, clonedLens, "id", "prescription", "user", "createdAt");
                        clonedLens.setPrescription(saved);
                        clonedLens.setUser(authenticatedUser);
                        return clonedLens;
                    }).collect(Collectors.toList());
            saved.getPrescriptionLensDetails().addAll(clonedLenses);
            prescriptionRepository.save(saved);
        }

        List<PrescriptionRecommendation> originalRecs = recommendationRepository
                .findAllByPrescriptionId(source.getPrescriptionId());
        if (!originalRecs.isEmpty()) {
            final Prescription s = saved;
            List<PrescriptionRecommendation> clonedRecs = originalRecs.stream().map(r -> {
                PrescriptionRecommendation cloneRec = new PrescriptionRecommendation();
                cloneRec.setPrescription(s);
                cloneRec.setProduct(r.getProduct());
                cloneRec.setQuantity(r.getQuantity());
                cloneRec.setStaffNotes(r.getStaffNotes());
                return cloneRec;
            }).collect(Collectors.toList());

            recommendationRepository.saveAll(clonedRecs);
        }

        prescriptionAuditHelper.logCreate(saved);
        PrescriptionResponseDTO response = prescriptionMapper.entityToResponseDTO(saved);
        response.setRecommendations(buildRecommendationResponses(saved.getPrescriptionId()));
        return response;
    }

    @Transactional
    public void syncPrescriptionBlocks(UUID prescriptionId, PrescriptionRecommendationsDTO dto) {
        Prescription prescription = prescriptionRepository.findById(prescriptionId)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription not found with id: " + prescriptionId));

        User authenticatedUser = authenticatedUserService.getCurrentUser();

        // Clear existing child data
        lensDetailRepository.deleteAllByPrescriptionId(prescriptionId);
        recommendationRepository.deleteAllByPrescriptionId(prescriptionId);
        lensDetailRepository.flush();
        recommendationRepository.flush();

        // Rebuild lens details
        if (dto.lensSpecifications() != null && !dto.lensSpecifications().isEmpty()) {
            List<PrescriptionLensDetail> lensDetails = dto.lensSpecifications().stream()
                    .map(ls -> {
                        PrescriptionLensDetail ld = new PrescriptionLensDetail();
                        ld.setPrescription(prescription);
                        ld.setUser(authenticatedUser);
                        ld.setLensTypePurpose(ls.getLensTypePurpose());
                        ld.setRightSph(ls.getRightSph());
                        ld.setRightCyl(ls.getRightCyl());
                        ld.setRightAxis(ls.getRightAxis());
                        ld.setRightAdd(ls.getRightAdd());
                        ld.setRightPd(ls.getRightPd());
                        ld.setLeftSph(ls.getLeftSph());
                        ld.setLeftCyl(ls.getLeftCyl());
                        ld.setLeftAxis(ls.getLeftAxis());
                        ld.setLeftAdd(ls.getLeftAdd());
                        ld.setLeftPd(ls.getLeftPd());
                        ld.setCorrectionType(ls.getCorrectionType());
                        ld.setLensType(ls.getLensType());
                        ld.setFrameTypePreference(ls.getFrameTypePreference());
                        ld.setLensCoatings(ls.getLensCoatings());
                        ld.setLensMaterial(ls.getLensMaterial());
                        ld.setLensWearType(ls.getLensWearType());
                        ld.setLensMaterialCl(ls.getLensMaterialCl());
                        ld.setBaseCurve(ls.getBaseCurve());
                        ld.setDiameter(ls.getDiameter());
                        ld.setNotes(ls.getNotes());
                        return ld;
                    }).collect(Collectors.toList());

            lensDetailRepository.saveAll(lensDetails);
        }

        // Rebuild recommendations
        if (dto.items() != null && !dto.items().isEmpty()) {
            List<PrescriptionRecommendation> entities = dto.items().stream().map(item -> {
                Product product = productRepository.findById(item.productId())
                        .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + item.productId()));

                PrescriptionRecommendation rec = new PrescriptionRecommendation();
                rec.setPrescription(prescription);
                rec.setProduct(product);
                rec.setQuantity(item.quantity());
                rec.setStaffNotes(item.staffNotes());
                return rec;
            }).collect(Collectors.toList());

            recommendationRepository.saveAll(entities);
        }
    }

    private List<RecommendationResponseDTO> buildRecommendationResponses(UUID prescriptionId) {
        return recommendationRepository.findAllByPrescriptionId(prescriptionId).stream()
                .map(r -> {
                    Product p = r.getProduct();
                    return new RecommendationResponseDTO(
                            r.getId(),
                            p.getProductId(),
                            p.getProductName(),
                            p.getCategory().getName(),
                            p.getSupplier().getName(),
                            p.getImageDir(),
                            p.getProductType().name(),
                            p.getUnitPrice(),
                            p.getQuantity(),
                            r.getQuantity(),
                            r.getStaffNotes()
                    );
                }).collect(Collectors.toList());
    }
}
