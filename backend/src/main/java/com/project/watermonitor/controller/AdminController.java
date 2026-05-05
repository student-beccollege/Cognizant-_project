package com.project.watermonitor.controller;

import com.project.watermonitor.model.Pipes;
import com.project.watermonitor.model.UsersData;
import com.project.watermonitor.model.Waterpara;
import com.project.watermonitor.repository.PipeRepository;
import com.project.watermonitor.repository.UserRepository;
import com.project.watermonitor.repository.WaterRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "http://localhost:4200", allowCredentials = "true")
public class AdminController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PipeRepository pipeRepository;

    @Autowired
    private WaterRepository waterRepository;

    @GetMapping("/users")
    public List<UsersData> getAllUsers() {
        return userRepository.findAll();
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Map<String, String>> deleteUser(@PathVariable Long id) {
        userRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "User deleted successfully"));
    }

    @GetMapping("/pipes")
    public List<Pipes> getAllPipes() {
        return pipeRepository.findAll();
    }

    @PutMapping("/pipes/{id}")
    public Pipes updatePipe(@PathVariable Long id, @RequestBody Pipes updatedPipe) {
        Pipes pipe = pipeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pipe not found with id: " + id));
        pipe.setPipeName(updatedPipe.getPipeName());
        pipe.setLocation(updatedPipe.getLocation());
        return pipeRepository.save(pipe);
    }

    @DeleteMapping("/pipes/{id}")
    public ResponseEntity<Map<String, String>> deletePipe(@PathVariable Long id) {
        pipeRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Pipe deleted successfully"));
    }

    @GetMapping("/readings")
    public List<Waterpara> getAllReadings() {
        return waterRepository.findAll();
    }
}
