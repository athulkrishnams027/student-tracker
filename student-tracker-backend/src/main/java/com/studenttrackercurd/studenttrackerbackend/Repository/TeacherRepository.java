package com.studenttrackercurd.studenttrackerbackend.Repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import com.studenttrackercurd.studenttrackerbackend.Model.Teacher;

public interface TeacherRepository extends JpaRepository<Teacher, Long> {
    Optional<Teacher> findByEmailIgnoreCase(String email);
    boolean existsByEmailIgnoreCase(String email);
    List<Teacher> findByDepartmentIgnoreCase(String department);
}
