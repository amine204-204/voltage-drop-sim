package com.etap.voltagedrop.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;

@Configuration
@EnableJpaRepositories(basePackages = "com.etap.voltagedrop.repository.jpa")
@EnableMongoRepositories(basePackages = "com.etap.voltagedrop.catalog.mongo")
public class DatabaseConfig {}