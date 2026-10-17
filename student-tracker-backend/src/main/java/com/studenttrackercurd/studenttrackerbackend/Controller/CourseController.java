package com.studenttrackercurd.studenttrackerbackend.Controller;

import java.util.*;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.studenttrackercurd.studenttrackerbackend.Exception.UserNotFoundException;
import com.studenttrackercurd.studenttrackerbackend.Model.Course;
import com.studenttrackercurd.studenttrackerbackend.Model.Enrollment;
import com.studenttrackercurd.studenttrackerbackend.Model.User;
import com.studenttrackercurd.studenttrackerbackend.Repository.CourseRepository;
import com.studenttrackercurd.studenttrackerbackend.Repository.EnrollmentRepository;
import com.studenttrackercurd.studenttrackerbackend.Repository.UserRepository;

@RestController
@CrossOrigin
public class CourseController {

    @Autowired
    private CourseRepository courseRepo;

    @Autowired
    private EnrollmentRepository enrollmentRepo;

    @Autowired
    private UserRepository userRepo;

    // Seed initial course catalogue if empty
    @PostConstruct
    public void seedInitialCourses() {
        if (courseRepo.count() == 0) {
            courseRepo.save(new Course("CS101", "Data Structures & Algorithms", 4, "Computer Science", "Prof. Donald Knuth", "Fundamental data structures including lists, trees, graphs, and sorting algorithms."));
            courseRepo.save(new Course("CS201", "Database Management Systems", 4, "Computer Science", "Dr. Edgar Codd", "Relational database concepts, SQL, normalization, transactions, and indexing."));
            courseRepo.save(new Course("MATH102", "Linear Algebra & Calculus", 3, "Mathematics", "Dr. Gilbert Strang", "Vector spaces, linear transformations, eigenvalues, and multivariable differentiation."));
            courseRepo.save(new Course("PHY101", "Applied Physics & Mechanics", 3, "Physical Sciences", "Dr. Richard Feynman", "Classical mechanics, thermodynamics, oscillations, and wave phenomena."));
            courseRepo.save(new Course("ENG205", "Technical Communication", 2, "Humanities", "Prof. Margaret Atwood", "Professional writing, technical documentation, presentation skills, and ethics."));
        }
    }

    // Grade to Grade Point mapping
    private Float convertGradeToPoint(String grade) {
        if (grade == null) return null;
        switch (grade.trim().toUpperCase()) {
            case "A+": return 4.30f;
            case "A":  return 4.00f;
            case "A-": return 3.70f;
            case "B+": return 3.30f;
            case "B":  return 3.00f;
            case "B-": return 2.70f;
            case "C+": return 2.30f;
            case "C":  return 2.00f;
            case "C-": return 1.70f;
            case "D":  return 1.00f;
            case "F":  return 0.00f;
            default:   return null; // In Progress / Withdrawn
        }
    }

    // Recalculate and persist student GPA
    private void recalculateStudentGpa(User student) {
        List<Enrollment> enrollments = enrollmentRepo.findByStudentId(student.getId());
        double totalWeightedPoints = 0.0;
        int totalCredits = 0;

        for (Enrollment en : enrollments) {
            if (en.getGradePoint() != null && en.getCourse() != null && en.getCourse().getCredits() != null) {
                int credits = en.getCourse().getCredits();
                totalWeightedPoints += en.getGradePoint() * credits;
                totalCredits += credits;
            }
        }

        if (totalCredits > 0) {
            float newGpa = (float) (Math.round((totalWeightedPoints / totalCredits) * 100.0) / 100.0);
            student.setGpa(newGpa);
            userRepo.save(student);
        }
    }

    // 1. Get all courses
    @GetMapping("/courses")
    public List<Course> getAllCourses() {
        return courseRepo.findAll();
    }

    // 2. Add a new course (Admin only)
    @PostMapping("/course")
    public ResponseEntity<?> addCourse(
            @RequestBody Course course,
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        if (role == null || !role.equalsIgnoreCase("ADMIN")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Access denied. Only administrators can add courses."));
        }

        if (course.getCourseCode() == null || course.getTitle() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Course code and title are required."));
        }

        if (courseRepo.existsByCourseCodeIgnoreCase(course.getCourseCode().trim())) {
            return ResponseEntity.badRequest().body(Map.of("message", "A course with this code already exists."));
        }

        Course saved = courseRepo.save(course);
        return ResponseEntity.ok(saved);
    }

    // 3. Delete a course (Admin only)
    @DeleteMapping("/course/{id}")
    public ResponseEntity<?> deleteCourse(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        if (role == null || !role.equalsIgnoreCase("ADMIN")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Access denied."));
        }

        if (!courseRepo.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        courseRepo.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Course deleted successfully."));
    }

    // 4. Enroll student in course (Student themselves or Admin)
    @PostMapping("/student/{studentId}/enroll/{courseId}")
    public ResponseEntity<?> enrollInCourse(
            @PathVariable Long studentId,
            @PathVariable Long courseId,
            @RequestParam(value = "semester", defaultValue = "Fall 2026") String semester,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @RequestHeader(value = "X-User-Id", required = false) String userIdStr) {

        boolean isAdmin = "ADMIN".equalsIgnoreCase(role);
        boolean isOwner = false;
        if (userIdStr != null) {
            try {
                isOwner = Long.parseLong(userIdStr) == studentId;
            } catch (NumberFormatException ignored) {}
        }

        if (!isAdmin && !isOwner) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Access denied. You can only enroll in courses for yourself."));
        }

        User student = userRepo.findById(studentId).orElseThrow(() -> new UserNotFoundException(studentId));
        Course course = courseRepo.findById(courseId).orElseThrow(() -> new RuntimeException("Course not found: " + courseId));

        if (enrollmentRepo.existsByStudentIdAndCourseId(studentId, courseId)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Student is already enrolled in this course."));
        }

        Enrollment enrollment = new Enrollment(student, course, semester);
        Enrollment saved = enrollmentRepo.save(enrollment);

        return ResponseEntity.ok(saved);
    }

    // 5. Unenroll / Drop course
    @DeleteMapping("/student/{studentId}/enroll/{courseId}")
    public ResponseEntity<?> dropCourse(
            @PathVariable Long studentId,
            @PathVariable Long courseId,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @RequestHeader(value = "X-User-Id", required = false) String userIdStr) {

        boolean isAdmin = "ADMIN".equalsIgnoreCase(role);
        boolean isOwner = false;
        if (userIdStr != null) {
            try {
                isOwner = Long.parseLong(userIdStr) == studentId;
            } catch (NumberFormatException ignored) {}
        }

        if (!isAdmin && !isOwner) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access denied."));
        }

        Optional<Enrollment> enOpt = enrollmentRepo.findByStudentIdAndCourseId(studentId, courseId);
        if (enOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        enrollmentRepo.delete(enOpt.get());

        // Recalculate GPA after dropping course
        User student = userRepo.findById(studentId).orElse(null);
        if (student != null) {
            recalculateStudentGpa(student);
        }

        return ResponseEntity.ok(Map.of("message", "Course dropped successfully."));
    }

    // 6. Get enrolled courses & grades for a student
    @GetMapping("/student/{studentId}/courses")
    public ResponseEntity<?> getStudentCourses(
            @PathVariable Long studentId,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @RequestHeader(value = "X-User-Id", required = false) String userIdStr) {

        boolean isAdmin = "ADMIN".equalsIgnoreCase(role);
        boolean isOwner = false;
        if (userIdStr != null) {
            try {
                isOwner = Long.parseLong(userIdStr) == studentId;
            } catch (NumberFormatException ignored) {}
        }

        if (!isAdmin && !isOwner) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Access denied. You can only view your own academic records."));
        }

        List<Enrollment> enrollments = enrollmentRepo.findByStudentId(studentId);
        return ResponseEntity.ok(enrollments);
    }

    // 7. Update Grade and Attendance (Admin only)
    @PutMapping("/enrollment/{enrollmentId}/grade")
    public ResponseEntity<?> updateGradeAndAttendance(
            @PathVariable Long enrollmentId,
            @RequestBody Map<String, Object> updateRequest,
            @RequestHeader(value = "X-User-Role", required = false) String role) {

        if (role == null || !role.equalsIgnoreCase("ADMIN")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Access denied. Only administrators can assign grades and attendance."));
        }

        Enrollment enrollment = enrollmentRepo.findById(enrollmentId)
                .orElseThrow(() -> new RuntimeException("Enrollment record not found: " + enrollmentId));

        if (updateRequest.containsKey("grade")) {
            String grade = (String) updateRequest.get("grade");
            enrollment.setGrade(grade);
            enrollment.setGradePoint(convertGradeToPoint(grade));
        }

        if (updateRequest.containsKey("attendance")) {
            Object attObj = updateRequest.get("attendance");
            if (attObj instanceof Number) {
                enrollment.setAttendance(((Number) attObj).intValue());
            }
        }

        if (updateRequest.containsKey("semester")) {
            enrollment.setSemester((String) updateRequest.get("semester"));
        }

        Enrollment saved = enrollmentRepo.save(enrollment);

        // Recalculate student overall GPA
        recalculateStudentGpa(enrollment.getStudent());

        return ResponseEntity.ok(Map.of(
                "message", "Grade and attendance updated successfully",
                "enrollment", saved,
                "updatedGpa", enrollment.getStudent().getGpa()
        ));
    }
}
