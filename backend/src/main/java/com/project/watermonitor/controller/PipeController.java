package com.project.watermonitor.controller;

import com.project.watermonitor.model.Pipes;
import com.project.watermonitor.model.UsersData;
import com.project.watermonitor.repository.PipeRepository;
import com.project.watermonitor.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pipes")
@CrossOrigin(origins = "http://localhost:4200", allowCredentials = "true") // Matches your Angular port
public class PipeController {

    @Autowired
    private PipeRepository pipeRepository;

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/add/{userId}")
    public Pipes addPipe(@PathVariable Long userId, @RequestBody Pipes pipe) {
        // 1. Find the User from the DB
        UsersData user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        // 2. Link the User to the Pipe
        pipe.setUser(user);

        // 3. Save the Pipe
        return pipeRepository.save(pipe);
    }

    @GetMapping("/user/{userId}")
    public List<Pipes> getPipes(@PathVariable Long userId) {
        // Ensure your PipeRepository has the method: findByUserId(Long userId)
        return pipeRepository.findByUserId(userId);
    }
}