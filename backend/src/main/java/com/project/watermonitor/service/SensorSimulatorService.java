package com.project.watermonitor.service;

import com.project.watermonitor.model.UsersData; // Corrected Import
import com.project.watermonitor.model.Waterpara;
import com.project.watermonitor.repository.WaterRepository;
import com.project.watermonitor.repository.UserRepository; // Corrected Repo
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class SensorSimulatorService {

    private final WaterRepository waterRepository;
    private final UserRepository userRepository; // Corrected type
    private final ConcurrentHashMap<Long, Boolean> userSimulations = new ConcurrentHashMap<>();

    public SensorSimulatorService(WaterRepository waterRepository, UserRepository userRepository) {
        this.waterRepository = waterRepository;
        this.userRepository = userRepository;
    }

    @Async
    public void start(Long userId) {
        if (userSimulations.getOrDefault(userId, false)) return;

        // Use UsersData (with an 's')
        Optional<UsersData> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) return;

        userSimulations.put(userId, true);
        UsersData user = userOpt.get();
        System.out.println(">>> Starting simulation for: " + user.getUsername());

        try {
            while (userSimulations.getOrDefault(userId, false)) {
                generateAndSave(user);
                Thread.sleep(10000);
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        } finally {
            userSimulations.put(userId, false);
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void generateAndSave(UsersData user) { // Corrected parameter
        Waterpara data = new Waterpara();
        double ph = Math.round((6.0 + Math.random() * 3.0) * 100.0) / 100.0;
        double turb = Math.round((Math.random() * 10.0) * 100.0) / 100.0;
        double tds = Math.round((150 + Math.random() * 500) * 100.0) / 100.0;

        data.setPh(ph);
        data.setTurbidity(turb);
        data.setTds(tds);
        data.setTimestamp(LocalDateTime.now());
        data.setUser(user);

        boolean isSafe = (ph >= 6.5 && ph <= 8.5) && (turb <= 5.0) && (tds <= 500);
        data.setStatus(isSafe ? "SAFE" : "DANGER");

        waterRepository.saveAndFlush(data);
        System.out.println("Reading Saved: pH " + ph + " | TDS " + tds);
    }

    public void stop(Long userId) {
        userSimulations.put(userId, false);
    }
}