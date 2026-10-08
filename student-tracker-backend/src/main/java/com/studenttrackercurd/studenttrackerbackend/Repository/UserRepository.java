package com.studenttrackercurd.studenttrackerbackend.Repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

import com.studenttrackercurd.studenttrackerbackend.Model.User;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmailIgnoreCase(String email);
}
