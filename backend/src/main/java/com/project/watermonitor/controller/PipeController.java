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
@CrossOrigin(origins = "http://localhost:4200", allowCredentials = "true")
public class PipeController {

    @Autowired
    private PipeRepository pipeRepository;

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/add/{userId}")
    public Pipes addPipe(@PathVariable Long userId, @RequestBody Pipes pipe) {
        UsersData user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        pipe.setUser(user);
        return pipeRepository.save(pipe);
    }

    @GetMapping("/user/{userId}")
    public List<Pipes> getPipes(@PathVariable Long userId) {
        return pipeRepository.findByUserId(userId);
    }
}
