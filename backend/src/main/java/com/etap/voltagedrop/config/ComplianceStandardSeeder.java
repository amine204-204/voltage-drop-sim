package com.etap.voltagedrop.config;

import com.etap.voltagedrop.repository.jpa.ComplianceStandardRepository;
import com.etap.voltagedrop.persistence.entity.ComplianceStandardEntity;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class ComplianceStandardSeeder implements CommandLineRunner {

    private final ComplianceStandardRepository repository;

    @Override
    public void run(String... args) {
        if (repository.count() > 0) {
            return;
        }

        log.info("No compliance standards found — seeding default EN 50160.");

        ComplianceStandardEntity en50160 = new ComplianceStandardEntity();
        en50160.setName("EN 50160");
        en50160.setDescription("Voltage characteristics of electricity supplied by public electricity networks");
        en50160.setMinVoltagePu(0.90);
        en50160.setMaxVoltagePu(1.10);
        en50160.setActive(true);
        en50160.setDefaultStandard(true);
        repository.save(en50160);
    }
}
