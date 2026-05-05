package com.project.watermonitor.controller;

import com.project.watermonitor.model.Waterpara;
import com.project.watermonitor.repository.WaterRepository;
import com.project.watermonitor.service.SensorSimulatorService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/simulator")
@CrossOrigin(origins = "http://localhost:4200", allowCredentials = "true")
public class SimulatorController {

    private final SensorSimulatorService simulatorService;
    private final WaterRepository waterRepository;

    public SimulatorController(SensorSimulatorService simulatorService, WaterRepository waterRepository) {
        this.simulatorService = simulatorService;
        this.waterRepository = waterRepository;
    }

    // Start simulation for a specific user (will simulate all pipes owned by this user)
    @PostMapping("/start/{userId}")
    public Map<String, String> startSimulation(@PathVariable Long userId) {
        simulatorService.start(userId);
        return Map.of("message", "Simulation started for user ID: " + userId);
    }

    // Stop simulation for a specific user
    @PostMapping("/stop/{userId}")
    public Map<String, String> stopSimulation(@PathVariable Long userId) {
        simulatorService.stop(userId);
        return Map.of("message", "Simulation stopped for user ID: " + userId);
    }

    // Get the latest single reading across all pipes for this user
    @GetMapping("/latest/{userId}")
    public Waterpara getLatestData(@PathVariable Long userId) {
        // Updated method name to match the new Pipe->User relationship
        return waterRepository.findFirstByPipeUserIdOrderByTimestampDesc(userId)
                .orElse(null);
    }

    // Get all readings across all pipes for this user (For the Line Chart)
    @GetMapping("/history/{userId}")
    public List<Waterpara> getUserHistory(@PathVariable Long userId) {
        return waterRepository.findByPipeUserIdOrderByTimestampAsc(userId);
    }

    // Get the latest reading for ONE specific pipe (used by dropdown selection)
    @GetMapping("/latest/pipe/{pipeId}")
    public Waterpara getLatestByPipe(@PathVariable Long pipeId) {
        return waterRepository.findFirstByPipeIdOrderByTimestampDesc(pipeId)
                .orElse(null);
    }

    // Get all readings for ONE specific pipe (used to fill the chart when user picks a pipe)
    @GetMapping("/history/pipe/{pipeId}")
    public List<Waterpara> getHistoryByPipe(@PathVariable Long pipeId) {
        return waterRepository.findByPipeIdOrderByTimestampAsc(pipeId);
    }
}