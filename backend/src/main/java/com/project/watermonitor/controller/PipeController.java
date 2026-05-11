package com.project.watermonitor.controller;

import com.project.watermonitor.model.Pipe;
import com.project.watermonitor.model.User;
import com.project.watermonitor.repository.PipeRepository;
import com.project.watermonitor.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

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
    public Pipe addPipe(@PathVariable Long userId, @RequestBody Pipe pipe) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "User not found with id: " + userId));

        pipe.setUser(user);
        return pipeRepository.save(pipe);
    }

    @GetMapping("/user/{userId}")
    public List<Pipe> getPipes(@PathVariable Long userId) {
        return pipeRepository.findByUserId(userId);
    }
}
