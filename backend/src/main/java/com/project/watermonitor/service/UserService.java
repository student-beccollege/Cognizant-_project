package com.project.watermonitor.service;

import com.project.watermonitor.dto.UserDataDTO;
import com.project.watermonitor.model.Role;
import com.project.watermonitor.model.UsersData;
import com.project.watermonitor.repository.UserRepository;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public UsersData register(UserDataDTO userDataDTO) {
        return createUser(userDataDTO, Role.USER);
    }

    @Transactional
    public UsersData createByAdmin(UserDataDTO userDataDTO, Role role) {
        return createUser(userDataDTO, role == null ? Role.USER : role);
    }

    @Transactional(readOnly = true)
    public UsersData findByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found with username: " + username));
    }

    @Transactional(readOnly = true)
    public Optional<UsersData> login(String username, String rawPassword) {
        Optional<UsersData> userOpt = userRepository.findByUsername(username);

        if (userOpt.isEmpty()) {
            return Optional.empty();
        }

        UsersData user = userOpt.get();

        if (!passwordEncoder.matches(rawPassword, user.getPassword())) {
            return Optional.empty();
        }

        return Optional.of(user);
    }

    private UsersData createUser(UserDataDTO userDataDTO, Role role) {
        if (userRepository.existsByUsername(userDataDTO.getUsername())) {
            throw new RuntimeException("Username already exists");
        }
        if (userRepository.existsByEmail(userDataDTO.getEmail())) {
            throw new RuntimeException("Email already in use");
        }

        UsersData user = new UsersData();
        user.setUsername(userDataDTO.getUsername());
        user.setEmail(userDataDTO.getEmail());
        user.setPassword(passwordEncoder.encode(userDataDTO.getPassword()));
        user.setRole(role);
        return userRepository.save(user);
    }
}
