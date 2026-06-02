package com.mmtorresoptical.OpticalClinicManagementSystem.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;

@RestController
@RequestMapping("/api/system")
public class SystemController {

    @GetMapping("/time")
    public ResponseEntity<Long> getServerTime() {
        return ResponseEntity.ok(Instant.now().toEpochMilli());
    }
}
