package com.studenttrackercurd.studenttrackerbackend.Repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import com.studenttrackercurd.studenttrackerbackend.Model.Course;

public interface CourseRepository extends JpaRepository<Course, Long> {
    Optional<Course> findByCourseCodeIgnoreCase(String courseCode);
    boolean existsByCourseCodeIgnoreCase(String courseCode);
    List<Course> findByTeacherId(Long teacherId);
}

