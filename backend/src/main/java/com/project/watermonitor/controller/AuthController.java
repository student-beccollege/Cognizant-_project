package com.project.watermonitor.controller;

import com.project.watermonitor.dto.LogindataDTO;
import com.project.watermonitor.dto.UserDataDTO;
import com.project.watermonitor.model.UsersData;
import com.project.watermonitor.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;


@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;
    private final SecurityContextRepository securityContextRepository;

    public AuthController(UserService userService,
                          SecurityContextRepository securityContextRepository) {
        this.userService = userService;
        this.securityContextRepository = securityContextRepository;
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, String>> registerUser(@RequestBody UserDataDTO userDataDTO) {
        try {
            userService.register(userDataDTO);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Map.of("message", "User registered successfully!"));

        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody LogindataDTO logindata,
                                                     HttpServletRequest request,
                                                     HttpServletResponse response) {
                                                        
        Optional<UsersData> match = userService.login(logindata.getUsername(), logindata.getPassword());
        if (match.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid username or password"));
        }
        UsersData user = match.get();

        Authentication authentication = new UsernamePasswordAuthenticationToken(
                user.getUsername(),
                null,
                List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
        );

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
        securityContextRepository.saveContext(context, request, response);

        return ResponseEntity.ok(Map.of(
                "message", "Login successful",
                "id", user.getId(),
                "username", user.getUsername(),
                "role", user.getRole().name()
        ));
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) session.invalidate();
        SecurityContextHolder.clearContext();
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }

    @GetMapping("/me")
    public ResponseEntity<?> me() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            UsersData user = userService.findByUsername(auth.getName());
            return ResponseEntity.ok(Map.of(
                    "username", user.getUsername(),
                    "id", user.getId(),
                    "role", user.getRole().name(),
                    "email", user.getEmail()
            ));
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Not authenticated"));
    }
}
