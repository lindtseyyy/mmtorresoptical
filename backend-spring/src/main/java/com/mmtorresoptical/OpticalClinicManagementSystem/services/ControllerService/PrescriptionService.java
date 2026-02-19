package com.mmtorresoptical.OpticalClinicManagementSystem.services.ControllerService;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.prescriptionitems.CreatePrescriptionItemRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.prescriptionitems.PrescriptionItemDetailsDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.exception.ResourceNotFoundException;
import com.mmtorresoptical.OpticalClinicManagementSystem.mapper.PrescriptionItemMapper;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.Prescription;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.PrescriptionItem;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.User;
import com.mmtorresoptical.OpticalClinicManagementSystem.repository.PrescriptionItemsRepository;
import com.mmtorresoptical.OpticalClinicManagementSystem.repository.PrescriptionRepository;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.AuthenticatedUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PrescriptionService {

    private final PrescriptionItemsRepository prescriptionItemsRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final AuthenticatedUserService authenticatedUserService;
    private final PrescriptionItemMapper prescriptionItemMapper;

    @Transactional
    public List<PrescriptionItemDetailsDTO> addItems(UUID prescriptionId,
                                                     List<CreatePrescriptionItemRequestDTO> createPrescriptionItemRequestDTOList) {

        // Retrieve patient or throw exception if not found
        Prescription retrievedPrescription = prescriptionRepository.findById(prescriptionId)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription not found with id: " + prescriptionId));

        User authenticatedUser = authenticatedUserService.getCurrentUser();

        List<PrescriptionItem> newItems = createPrescriptionItemRequestDTOList
                .stream()
                .map(dto -> {
                            PrescriptionItem item = prescriptionItemMapper.createRequestDTOtoEntity(dto);

                            item.setPrescription(retrievedPrescription);
                            item.setUser(authenticatedUser);

                            return item;
                        }
                        ).toList();

        prescriptionItemsRepository.saveAll(newItems);

        return newItems.stream().map(prescriptionItemMapper::entityToDetailsDTO).toList();
    }
}
