package com.project.watermonitor.service;

import com.project.watermonitor.dto.UserDataDTO;
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

    public void register(UserDataDTO userDataDTO) {
        if (userRepository.existsByUsername(userDataDTO.getUsername())) {
            throw new RuntimeException("Error: Username already exists");
        }

        if (userRepository.existsByEmail(userDataDTO.getEmail())) {
            throw new RuntimeException("Error: Email is already in use!");
        }

        String encodedPassword = passwordEncoder.encode(userDataDTO.getPassword());
        userDataDTO.setPassword(encodedPassword);

        UsersData user = new UsersData();
        user.setUsername(userDataDTO.getUsername());
        user.setEmail(userDataDTO.getEmail());
        user.setPassword(userDataDTO.getPassword());

        userRepository.save(user);
    }

    // Fixed: This is now a separate method, NOT inside register()
    public UsersData findByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found with username: " + username));
    }
}