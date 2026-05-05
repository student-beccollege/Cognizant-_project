package com.project.watermonitor.service;

import com.project.watermonitor.model.Pipes;
import com.project.watermonitor.model.UsersData;
import com.project.watermonitor.model.Waterpara;
import com.project.watermonitor.repository.WaterRepository;
import com.project.watermonitor.repository.UserRepository;
import com.project.watermonitor.repository.PipeRepository; // Ensure this is imported
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class SensorSimulatorService {

    private final WaterRepository waterRepository;
    private final UserRepository userRepository;
    private final PipeRepository pipeRepository; // Added for direct DB access

    // Tracks which users have active simulations
    private final ConcurrentHashMap<Long, Boolean> userSimulations = new ConcurrentHashMap<>();

    public SensorSimulatorService(WaterRepository waterRepository,
                                  UserRepository userRepository,
                                  PipeRepository pipeRepository) {
        this.waterRepository = waterRepository;
        this.userRepository = userRepository;
        this.pipeRepository = pipeRepository;
    }

    @Async
    public void start(Long userId) {
        // Prevent starting multiple simulators for the same user
        if (userSimulations.getOrDefault(userId, false)) {
            System.out.println("Simulator already running for User ID: " + userId);
            return;
        }

        Optional<UsersData> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            System.err.println("Cannot start simulator: User " + userId + " not found.");
            return;
        }

        userSimulations.put(userId, true);
        System.out.println(">>> Monitoring Started for User: " + userOpt.get().getUsername());

        try {
            while (userSimulations.getOrDefault(userId, false)) {
                // FETCH DIRECTLY FROM DB: This solves the "0 rows" / LazyLoading issue
                List<Pipes> userPipes = pipeRepository.findByUserId(userId);

                if (userPipes != null && !userPipes.isEmpty()) {
                    for (Pipes pipe : userPipes) {
                        generateAndSave(pipe);
                    }
                } else {
                    System.out.println("No pipes found in MySQL for User ID: " + userId);
                }

                // Wait 10 seconds before generating the next set of readings
                Thread.sleep(10000);
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            System.err.println("Simulator thread interrupted for User: " + userId);
        } finally {
            userSimulations.put(userId, false);
            System.out.println(">>> Monitoring Loop Terminated for User: " + userId);
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void generateAndSave(Pipes pipe) {
        try {
            Waterpara data = new Waterpara();

            // 1. Generate Realistic Simulated Data
            double ph = Math.round((6.0 + Math.random() * 3.0) * 100.0) / 100.0; // 6.0 to 9.0
            double turb = Math.round((Math.random() * 7.0) * 100.0) / 100.0;    // 0 to 7.0
            double tds = Math.round((150 + Math.random() * 500) * 100.0) / 100.0;

            data.setPh(ph);
            data.setTurbidity(turb);
            data.setTds(tds);
            data.setTimestamp(LocalDateTime.now());
            data.setPipe(pipe); // Link to the specific pipe

            // 2. Validate against thresholds (WHO Standards)
            boolean isSafe = (ph >= 6.5 && ph <= 8.5) && (turb <= 5.0) && (tds <= 500);
            data.setStatus(isSafe ? "SAFE" : "DANGER");

            // 3. Log incidents to console for debugging
            if (!isSafe) {
                System.err.println("!!! INCIDENT !!! Pipe: " + pipe.getPipeName() +
                        " | pH: " + ph + " | Status: DANGER");
            } else {
                System.out.println("Data Saved: Pipe: " + pipe.getPipeName() + " | pH: " + ph);
            }

            // 4. Save to MySQL
            waterRepository.saveAndFlush(data);

        } catch (Exception e) {
            System.err.println("Error saving data for pipe " + pipe.getId() + ": " + e.getMessage());
        }
    }

    public void stop(Long userId) {
        userSimulations.put(userId, false);
        System.out.println(">>> Stopping Monitoring Request for User ID: " + userId);
    }
}