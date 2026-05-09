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

    public SimulatorController(SensorSimulatorService simulatorService,
                               WaterRepository waterRepository) {
        this.simulatorService = simulatorService;
        this.waterRepository = waterRepository;
    }

    @PostMapping("/start/{userId}")
    public Map<String, Object> startSimulation(@PathVariable Long userId) {
        simulatorService.start(userId);
        return Map.of("message", "Simulation started", "userId", userId, "running", true);
    }

    @PostMapping("/stop/{userId}")
    public Map<String, Object> stopSimulation(@PathVariable Long userId) {
        simulatorService.stop(userId);
        return Map.of("message", "Simulation stopped", "userId", userId, "running", false);
    }

    @GetMapping("/latest/pipe/{pipeId}")
    public Waterpara getLatestByPipe(@PathVariable Long pipeId) {
        return waterRepository.findFirstByPipeIdOrderByTimestampDesc(pipeId).orElse(null);
    }

    @GetMapping("/history/pipe/{pipeId}")
    public List<Waterpara> getHistoryByPipe(@PathVariable Long pipeId) {
        return waterRepository.findByPipeIdOrderByTimestampAsc(pipeId);
    }

    @GetMapping("/alerts/{userId}")
    public List<Waterpara> getRecentAlerts(@PathVariable Long userId) {
        return waterRepository.findTop20ByPipeUserIdAndStatusNotOrderByTimestampDesc(userId, "SAFE");
    }
}
