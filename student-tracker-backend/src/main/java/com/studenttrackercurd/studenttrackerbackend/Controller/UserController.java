package com.studenttrackercurd.studenttrackerbackend.Controller;

import java.util.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.data.domain.Sort;
import com.studenttrackercurd.studenttrackerbackend.Exception.UserNotFoundException;
import com.studenttrackercurd.studenttrackerbackend.Model.User;
import com.studenttrackercurd.studenttrackerbackend.Repository.UserRepository;

@RestController
@CrossOrigin
public class UserController {
    
    @Autowired
    private UserRepository userRepo;

    @PostMapping("/admin/login")
    public ResponseEntity<?> loginAdmin(@RequestBody Map<String, String> credentials) {
        String username = credentials.get("username");
        String password = credentials.get("password");

        if (username == null || username.trim().isEmpty() || password == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Username and password are required"));
        }

        String userClean = username.trim().toLowerCase();
        boolean validAdminUser = "admin".equals(userClean) || "admin@tracker.com".equals(userClean);
        boolean validAdminPass = "admin123".equals(password) || "admin".equals(password);

        if (validAdminUser && validAdminPass) {
            Map<String, Object> adminData = new HashMap<>();
            adminData.put("role", "ADMIN");
            adminData.put("username", "admin");
            adminData.put("name", "Administrator");
            return ResponseEntity.ok(adminData);
        }

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", "Invalid admin credentials"));
    }

    @PostMapping("/student/login")
    public ResponseEntity<?> loginStudent(@RequestBody Map<String, String> credentials) {
        String email = credentials.get("email");
        String password = credentials.get("password");

        if (email == null || email.trim().isEmpty() || password == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Email and password are required"));
        }

        Optional<User> userOpt = userRepo.findByEmailIgnoreCase(email.trim());
        if (userOpt.isPresent() && userOpt.get().getPassword().equals(password)) {
            User student = userOpt.get();
            Map<String, Object> studentData = new HashMap<>();
            studentData.put("id", student.getId());
            studentData.put("name", student.getName());
            studentData.put("email", student.getEmail());
            studentData.put("password", student.getPassword());
            studentData.put("hairColor", student.getHairColor());
            studentData.put("weight", student.getWeight());
            studentData.put("height", student.getHeight());
            studentData.put("gpa", student.getGpa());
            studentData.put("creationTimestamp", student.getCreationTimestamp());
            studentData.put("role", "STUDENT");
            return ResponseEntity.ok(studentData);
        }

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", "Invalid email or password"));
    }

    @PostMapping("/student")
    public ResponseEntity<?> newUser(
            @RequestBody User newUser,
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        // Only admin can add student via backend endpoint
        if (role != null && !role.equalsIgnoreCase("ADMIN")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Access denied. Only administrators can add new students."));
        }
        User saved = userRepo.save(newUser);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/students")
    public ResponseEntity<?> getAllUsers(
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        if (role == null || !role.equalsIgnoreCase("ADMIN")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Access denied. Only administrators can view the full student directory."));
        }
        return ResponseEntity.ok(userRepo.findAll(Sort.by(Sort.Direction.ASC, "creationTimestamp")));
    }

    @GetMapping("/student/{id}")
    public ResponseEntity<?> getUserById(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @RequestHeader(value = "X-User-Id", required = false) String userIdStr) {
        boolean isAdmin = "ADMIN".equalsIgnoreCase(role);
        boolean isOwner = false;
        if (userIdStr != null) {
            try {
                isOwner = Long.parseLong(userIdStr) == id;
            } catch (NumberFormatException ignored) {}
        }

        if (!isAdmin && !isOwner) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Access denied. You can only view your own student details."));
        }

        return ResponseEntity.ok(userRepo.findById(id).orElseThrow(() -> new UserNotFoundException(id)));
    }

    @PutMapping("/student/{id}")
    public ResponseEntity<?> updateUser(
            @RequestBody User newUser,
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @RequestHeader(value = "X-User-Id", required = false) String userIdStr) {
        boolean isAdmin = "ADMIN".equalsIgnoreCase(role);
        boolean isOwner = false;
        if (userIdStr != null) {
            try {
                isOwner = Long.parseLong(userIdStr) == id;
            } catch (NumberFormatException ignored) {}
        }

        if (!isAdmin && !isOwner) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Access denied. You cannot modify other students' records."));
        }

        User updated = userRepo.findById(id).map(user -> {
            user.setName(newUser.getName());
            user.setHairColor(newUser.getHairColor());
            user.setWeight(newUser.getWeight());
            user.setHeight(newUser.getHeight());
            user.setGpa(newUser.getGpa());
            user.setEmail(newUser.getEmail());
            user.setPassword(newUser.getPassword());
            return userRepo.save(user);
        }).orElseThrow(() -> new UserNotFoundException(id));

        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/student/{id}")
    public ResponseEntity<?> deleteUser(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        if (role == null || !role.equalsIgnoreCase("ADMIN")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Access denied. Only administrators can delete student records."));
        }

        if (!userRepo.existsById(id)) {
            throw new UserNotFoundException(id);
        }
        userRepo.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "User with id: " + id + " was deleted."));
    }


}
