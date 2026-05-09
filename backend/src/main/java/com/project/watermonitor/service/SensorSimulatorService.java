package com.project.watermonitor.service;

import com.project.watermonitor.model.Pipes;
import com.project.watermonitor.model.UsersData;
import com.project.watermonitor.model.Waterpara;
import com.project.watermonitor.repository.WaterRepository;
import com.project.watermonitor.repository.UserRepository;
import com.project.watermonitor.repository.PipeRepository;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class SensorSimulatorService {

    private final WaterRepository waterRepository;
    private final UserRepository userRepository;
    private final PipeRepository pipeRepository;

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
                List<Pipes> userPipes = pipeRepository.findByUserId(userId);

                if (userPipes != null && !userPipes.isEmpty()) {
                    for (Pipes pipe : userPipes) {
                        generateAndSave(pipe);
                    }
                } else {
                    System.out.println("No pipes found for User ID: " + userId);
                }

                Thread.sleep(5000);
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

            // ── Simulated sensor readings ───────────────────────────────────────
            double ph    = round2(6.0 + Math.random() * 3.0);         // 6.0 – 9.0
            double turb  = round2(Math.random() * 7.0);               // 0   – 7.0 NTU
            double tds   = round2(150 + Math.random() * 500);         // 150 – 650 mg/L


            data.setPh(ph);
            data.setTurbidity(turb);
            data.setTds(tds);
            data.setPipe(pipe);
            data.setTimestamp(LocalDateTime.now());
            

            // ── Status evaluation against WHO/IS:10500 thresholds ───────────────
            List<String> reasons = new ArrayList<>();
            if (ph < 6.5 || ph > 8.5)       reasons.add("pH out of range");
            if (turb > 5.0)                 reasons.add("High turbidity");
            if (tds > 500)                  reasons.add("TDS exceeds limit");
            

            if (reasons.isEmpty()) {
                data.setStatus("SAFE");
                data.setAlertReason(null);
            } else if (reasons.size() == 1) {
                data.setStatus("WARNING");
                data.setAlertReason(String.join(", ", reasons));
            } else {
                data.setStatus("DANGER");
                data.setAlertReason(String.join(", ", reasons));
            }

            if (!"SAFE".equals(data.getStatus())) {
                System.err.println("!!! ALERT !!! " + pipe.getPipeName() +
                        " | " + data.getStatus() + " | " + data.getAlertReason());
            }

            waterRepository.saveAndFlush(data);

        } catch (Exception e) {
            System.err.println("Error saving data for pipe " + pipe.getId() + ": " + e.getMessage());
        }
    }

    private double round2(double v) {
        return Math.round(v * 100.0) / 100.0;
    }

    public void stop(Long userId) {
        userSimulations.put(userId, false);
        System.out.println(">>> Stopping Monitoring Request for User ID: " + userId);
    }
}
