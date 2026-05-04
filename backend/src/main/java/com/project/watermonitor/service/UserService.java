package com.project.watermonitor.service;

import com.project.watermonitor.model.UsersData;
import com.project.watermonitor.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {
    private final UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public void register(UsersData userdata) {
        if (userRepository.existsByUsername(userdata.getUsername())) {
            throw new RuntimeException("Error: Username already exists");
        }

        if (userRepository.existsByEmail(userdata.getEmail())) {
            throw new RuntimeException("Error: Email is already in use!");
        }

        String encodedPassword = passwordEncoder.encode(userdata.getPassword());
        userdata.setPassword(encodedPassword);

        userRepository.save(userdata);
    }

    // Fixed: This is now a separate method, NOT inside register()
    public UsersData findByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found with username: " + username));
    }
}