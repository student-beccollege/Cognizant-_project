package com.project.watermonitor.service;

import com.project.watermonitor.model.Role;
import com.project.watermonitor.model.User;
import com.project.watermonitor.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserService userService;

    @Test
    void login_returnsUser_whenCredentialsAreCorrect() {
        User fakeUser = new User();
        fakeUser.setUsername("avinash");
        fakeUser.setPassword("ENCODED_PASSWORD");
        fakeUser.setRole(Role.USER);

        when(userRepository.findByUsername("avinash"))
                .thenReturn(Optional.of(fakeUser));
        when(passwordEncoder.matches("plain123", "ENCODED_PASSWORD"))
                .thenReturn(true);

        User result = userService.login("avinash", "plain123");

        assertEquals("avinash", result.getUsername());
        assertEquals(Role.USER, result.getRole());
    }
}
