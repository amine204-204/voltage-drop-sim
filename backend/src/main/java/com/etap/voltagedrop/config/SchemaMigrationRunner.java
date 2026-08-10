package com.etap.voltagedrop.config;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class SchemaMigrationRunner implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        // ddl-auto: update never drops columns. PowerQualityEventEntity no longer maps
        // branch_result_id, but it remains NOT NULL in pre-existing pq_events schemas and
        // breaks every insert. DROP COLUMN IF EXISTS is idempotent for fresh databases.
        jdbcTemplate.execute("ALTER TABLE pq_events DROP COLUMN IF EXISTS branch_result_id");
    }
}
