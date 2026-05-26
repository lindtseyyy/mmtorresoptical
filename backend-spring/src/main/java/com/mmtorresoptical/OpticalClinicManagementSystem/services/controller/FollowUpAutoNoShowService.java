package com.mmtorresoptical.OpticalClinicManagementSystem.services.controller;

import com.mmtorresoptical.OpticalClinicManagementSystem.enums.FollowUpStatus;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.PatientFollowUp;
import com.mmtorresoptical.OpticalClinicManagementSystem.repository.PatientFollowUpRepository;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.CustomUserDetailsService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FollowUpAutoNoShowService {

    private static final Logger log = LoggerFactory.getLogger(FollowUpAutoNoShowService.class);
    private final PatientFollowUpRepository followUpRepository;

    @Scheduled(cron = "0 0 1 * * ?")
    @Transactional
    public void autoMarkNoShow() {
        List<PatientFollowUp> staleFollowUps = followUpRepository.findStalePendingFollowUps(LocalDate.now());

        if (staleFollowUps.isEmpty()) {
            return;
        }

        log.info("Found {} stale PENDING follow-ups to mark as NO_SHOW", staleFollowUps.size());

        for (PatientFollowUp fu : staleFollowUps) {
            fu.setStatus(FollowUpStatus.NO_SHOW);
            followUpRepository.save(fu);
        }

        log.info("Successfully marked {} follow-ups as NO_SHOW", staleFollowUps.size());
    }
}
