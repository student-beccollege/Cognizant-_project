package com.project.watermonitor; // Make sure this matches your package folder

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class MainApp {
    public static void main(String[] args) {
        // This line launches the built-in Tomcat server
        SpringApplication.run(MainApp.class, args);

    }
}