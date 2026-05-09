package com.project.watermonitor.controller;

import com.project.watermonitor.dto.UserDataDTO;
import com.project.watermonitor.model.Pipes;
import com.project.watermonitor.model.Role;
import com.project.watermonitor.model.UsersData;
import com.project.watermonitor.model.Waterpara;
import com.project.watermonitor.repository.PipeRepository;
import com.project.watermonitor.repository.UserRepository;
import com.project.watermonitor.repository.WaterRepository;
import com.project.watermonitor.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
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

    @Autowired
    private UserService userService;

    @GetMapping("/users")
    public List<UsersData> getAllUsers() {
        return userRepository.findAll();
    }

    @PostMapping("/users")
    public ResponseEntity<?> createUser(@RequestBody Map<String, String> body) {
        try {
            UserDataDTO dto = new UserDataDTO();
            dto.setUsername(body.get("username"));
            dto.setEmail(body.get("email"));
            dto.setPassword(body.get("password"));
            Role role = "ADMIN".equalsIgnoreCase(body.get("role")) ? Role.ADMIN : Role.USER;
            UsersData created = userService.createByAdmin(dto, role);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/users/{id}/role")
    public ResponseEntity<?> updateUserRole(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return userRepository.findById(id).map(user -> {
            String requested = body.get("role");
            if (requested == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "role is required"));
            }
            try {
                user.setRole(Role.valueOf(requested.toUpperCase()));
                userRepository.save(user);
                return ResponseEntity.ok((Object) user);
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body((Object) Map.of("message", "Invalid role"));
            }
        }).orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("message", "User not found")));
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
