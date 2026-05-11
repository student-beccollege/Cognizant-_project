package com.project.watermonitor.service;

import com.project.watermonitor.dto.UserDataDTO;
import com.project.watermonitor.model.Role;
import com.project.watermonitor.model.User;
import com.project.watermonitor.repository.UserRepository;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public User register(UserDataDTO userDataDTO) {
        return createUser(userDataDTO, Role.USER);
    }

    public User createByAdmin(UserDataDTO userDataDTO, Role role) {
        return createUser(userDataDTO, role == null ? Role.USER : role);
    }

    public User findByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with username: " + username));
    }

    public User login(String username, String rawPassword) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BadCredentialsException("Invalid username or password"));

        if (!passwordEncoder.matches(rawPassword, user.getPassword())) {
            throw new BadCredentialsException("Invalid username or password");
        }

        return user;
    }

    private User createUser(UserDataDTO userDataDTO, Role role) {
        if (userRepository.existsByUsername(userDataDTO.getUsername())) {
            throw new DataIntegrityViolationException("Username already exists");
        }
        if (userRepository.existsByEmail(userDataDTO.getEmail())) {
            throw new DataIntegrityViolationException("Email already in use");
        }

        User user = new User();
        user.setUsername(userDataDTO.getUsername());
        user.setEmail(userDataDTO.getEmail());
        user.setPassword(passwordEncoder.encode(userDataDTO.getPassword()));
        user.setRole(role);
        return userRepository.save(user);
    }
}
