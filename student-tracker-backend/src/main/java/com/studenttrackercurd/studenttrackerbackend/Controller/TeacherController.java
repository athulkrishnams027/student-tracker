package com.studenttrackercurd.studenttrackerbackend.Controller;

import java.util.*;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.studenttrackercurd.studenttrackerbackend.Model.Course;
import com.studenttrackercurd.studenttrackerbackend.Model.Enrollment;
import com.studenttrackercurd.studenttrackerbackend.Model.Teacher;
import com.studenttrackercurd.studenttrackerbackend.Model.User;
import com.studenttrackercurd.studenttrackerbackend.Repository.CourseRepository;
import com.studenttrackercurd.studenttrackerbackend.Repository.EnrollmentRepository;
import com.studenttrackercurd.studenttrackerbackend.Repository.TeacherRepository;
import com.studenttrackercurd.studenttrackerbackend.Repository.UserRepository;

@RestController
@CrossOrigin
public class TeacherController {

    @Autowired
    private TeacherRepository teacherRepo;

    @Autowired
    private CourseRepository courseRepo;

    @Autowired
    private EnrollmentRepository enrollmentRepo;

    @Autowired
    private UserRepository userRepo;

    // Seed default faculty members and link them to initial courses
    @PostConstruct
    public void seedInitialTeachers() {
        if (teacherRepo.count() == 0) {
            Teacher t1 = teacherRepo.save(new Teacher("Prof. Donald Knuth", "knuth@university.edu", "teacher123", "Computer Science", "Professor", "+1 (555) 019-2831"));
            Teacher t2 = teacherRepo.save(new Teacher("Dr. Edgar Codd", "codd@university.edu", "teacher123", "Computer Science", "Associate Professor", "+1 (555) 019-2832"));
            Teacher t3 = teacherRepo.save(new Teacher("Dr. Gilbert Strang", "strang@university.edu", "teacher123", "Mathematics", "Professor", "+1 (555) 019-2833"));
            Teacher t4 = teacherRepo.save(new Teacher("Dr. Richard Feynman", "feynman@university.edu", "teacher123", "Physical Sciences", "Professor", "+1 (555) 019-2834"));
            Teacher t5 = teacherRepo.save(new Teacher("Prof. Margaret Atwood", "atwood@university.edu", "teacher123", "Humanities", "Assistant Professor", "+1 (555) 019-2835"));

            // Associate with courses
            courseRepo.findByCourseCodeIgnoreCase("CS101").ifPresent(c -> { c.setTeacher(t1); c.setInstructor(t1.getName()); courseRepo.save(c); });
            courseRepo.findByCourseCodeIgnoreCase("CS201").ifPresent(c -> { c.setTeacher(t2); c.setInstructor(t2.getName()); courseRepo.save(c); });
            courseRepo.findByCourseCodeIgnoreCase("MATH102").ifPresent(c -> { c.setTeacher(t3); c.setInstructor(t3.getName()); courseRepo.save(c); });
            courseRepo.findByCourseCodeIgnoreCase("PHY101").ifPresent(c -> { c.setTeacher(t4); c.setInstructor(t4.getName()); courseRepo.save(c); });
            courseRepo.findByCourseCodeIgnoreCase("ENG205").ifPresent(c -> { c.setTeacher(t5); c.setInstructor(t5.getName()); courseRepo.save(c); });
        }
    }

    // Helper: Grade to Grade Point mapping
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
            default:   return null; // IN_PROGRESS
        }
    }

    // Recalculate student GPA after marks/grade change
    private void recalculateStudentGpa(User student) {
        if (student == null) return;
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

    // 1. Teacher Login
    @PostMapping("/teacher/login")
    public ResponseEntity<?> loginTeacher(@RequestBody Map<String, String> credentials) {
        String email = credentials.get("email");
        String password = credentials.get("password");

        if (email == null || email.trim().isEmpty() || password == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Faculty email and password are required."));
        }

        Optional<Teacher> teacherOpt = teacherRepo.findByEmailIgnoreCase(email.trim());
        if (teacherOpt.isPresent() && teacherOpt.get().getPassword().equals(password)) {
            Teacher teacher = teacherOpt.get();
            Map<String, Object> teacherData = new HashMap<>();
            teacherData.put("id", teacher.getId());
            teacherData.put("name", teacher.getName());
            teacherData.put("email", teacher.getEmail());
            teacherData.put("department", teacher.getDepartment());
            teacherData.put("designation", teacher.getDesignation());
            teacherData.put("phone", teacher.getPhone());
            teacherData.put("role", "TEACHER");
            return ResponseEntity.ok(teacherData);
        }

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", "Invalid faculty credentials. Please verify your email and password."));
    }

    // 2. Get all teachers (Admin only)
    @GetMapping("/teachers")
    public ResponseEntity<?> getAllTeachers(
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        if (role == null || (!role.equalsIgnoreCase("ADMIN") && !role.equalsIgnoreCase("TEACHER"))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Access denied."));
        }
        return ResponseEntity.ok(teacherRepo.findAll());
    }

    // 3. Add a new teacher (Admin only)
    @PostMapping("/teacher")
    public ResponseEntity<?> addTeacher(
            @RequestBody Teacher teacher,
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        if (role == null || !role.equalsIgnoreCase("ADMIN")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Access denied. Only administrators can add new faculty members."));
        }

        if (teacher.getEmail() == null || teacher.getName() == null || teacher.getPassword() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Name, email, and password are required."));
        }

        if (teacherRepo.existsByEmailIgnoreCase(teacher.getEmail().trim())) {
            return ResponseEntity.badRequest().body(Map.of("message", "A faculty member with this email already exists."));
        }

        Teacher saved = teacherRepo.save(teacher);
        return ResponseEntity.ok(saved);
    }

    // 4. Update teacher details (Admin only)
    @PutMapping("/teacher/{id}")
    public ResponseEntity<?> updateTeacher(
            @PathVariable Long id,
            @RequestBody Teacher updatedTeacher,
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        if (role == null || !role.equalsIgnoreCase("ADMIN")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Access denied. Only administrators can update faculty details."));
        }

        Teacher teacher = teacherRepo.findById(id).orElse(null);
        if (teacher == null) {
            return ResponseEntity.notFound().build();
        }

        if (updatedTeacher.getName() != null) teacher.setName(updatedTeacher.getName());
        if (updatedTeacher.getEmail() != null) teacher.setEmail(updatedTeacher.getEmail());
        if (updatedTeacher.getPassword() != null && !updatedTeacher.getPassword().trim().isEmpty()) {
            teacher.setPassword(updatedTeacher.getPassword());
        }
        if (updatedTeacher.getDepartment() != null) teacher.setDepartment(updatedTeacher.getDepartment());
        if (updatedTeacher.getDesignation() != null) teacher.setDesignation(updatedTeacher.getDesignation());
        if (updatedTeacher.getPhone() != null) teacher.setPhone(updatedTeacher.getPhone());

        Teacher saved = teacherRepo.save(teacher);
        return ResponseEntity.ok(saved);
    }

    // 5. Delete teacher (Admin only)
    @DeleteMapping("/teacher/{id}")
    public ResponseEntity<?> deleteTeacher(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        if (role == null || !role.equalsIgnoreCase("ADMIN")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Access denied. Only administrators can remove faculty members."));
        }

        if (!teacherRepo.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        // Unlink courses taught by this teacher first
        List<Course> courses = courseRepo.findByTeacherId(id);
        for (Course c : courses) {
            c.setTeacher(null);
            courseRepo.save(c);
        }

        teacherRepo.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Faculty member removed successfully."));
    }

    // 6. Assign teacher to a course (Admin only)
    @PutMapping("/course/{courseId}/assign-teacher/{teacherId}")
    public ResponseEntity<?> assignTeacherToCourse(
            @PathVariable Long courseId,
            @PathVariable Long teacherId,
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        if (role == null || !role.equalsIgnoreCase("ADMIN")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Access denied. Only administrators can assign teachers to courses."));
        }

        Course course = courseRepo.findById(courseId).orElse(null);
        if (course == null) return ResponseEntity.notFound().build();

        Teacher teacher = teacherRepo.findById(teacherId).orElse(null);
        if (teacher == null) return ResponseEntity.notFound().build();

        course.setTeacher(teacher);
        course.setInstructor(teacher.getName());
        Course saved = courseRepo.save(course);

        return ResponseEntity.ok(Map.of(
                "message", "Teacher assigned successfully",
                "course", saved
        ));
    }

    // 7. Get courses taught by a specific teacher
    // Strict Scope: Only Admin or the Teacher themselves can view their assigned courses
    @GetMapping("/teacher/{teacherId}/courses")
    public ResponseEntity<?> getTeacherCourses(
            @PathVariable Long teacherId,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @RequestHeader(value = "X-User-Id", required = false) String userIdStr) {

        boolean isAdmin = "ADMIN".equalsIgnoreCase(role);
        boolean isTeacherOwner = false;
        if (userIdStr != null && "TEACHER".equalsIgnoreCase(role)) {
            try {
                isTeacherOwner = Long.parseLong(userIdStr) == teacherId;
            } catch (NumberFormatException ignored) {}
        }

        if (!isAdmin && !isTeacherOwner) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Access denied. You can only view courses assigned to yourself."));
        }

        List<Course> courses = courseRepo.findByTeacherId(teacherId);
        return ResponseEntity.ok(courses);
    }

    // 8. Get enrolled students for a specific course
    // Strict Scope: Only Admin or the assigned Teacher of THIS course can view enrolled students
    @GetMapping("/teacher/course/{courseId}/students")
    public ResponseEntity<?> getCourseStudentsForTeacher(
            @PathVariable Long courseId,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @RequestHeader(value = "X-User-Id", required = false) String userIdStr) {

        Course course = courseRepo.findById(courseId).orElse(null);
        if (course == null) {
            return ResponseEntity.notFound().build();
        }

        boolean isAdmin = "ADMIN".equalsIgnoreCase(role);
        boolean isAssignedTeacher = false;

        if (userIdStr != null && "TEACHER".equalsIgnoreCase(role)) {
            try {
                long teacherId = Long.parseLong(userIdStr);
                isAssignedTeacher = (course.getTeacher() != null && course.getTeacher().getId() == teacherId);
            } catch (NumberFormatException ignored) {}
        }

        if (!isAdmin && !isAssignedTeacher) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Access denied. You are not assigned to teach this subject (" + course.getCourseCode() + ")."));
        }

        List<Enrollment> enrollments = enrollmentRepo.findByCourseId(courseId);
        return ResponseEntity.ok(enrollments);
    }

    // 9. Update Internal Marks, Exam Marks, Grade, and Attendance for an enrollment
    // Strict Scope: Only Admin or the teacher assigned to THIS subject can update marks!
    @PutMapping("/teacher/enrollment/{enrollmentId}/marks")
    public ResponseEntity<?> updateEnrollmentMarks(
            @PathVariable Long enrollmentId,
            @RequestBody Map<String, Object> marksPayload,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @RequestHeader(value = "X-User-Id", required = false) String userIdStr) {

        Enrollment enrollment = enrollmentRepo.findById(enrollmentId).orElse(null);
        if (enrollment == null) {
            return ResponseEntity.notFound().build();
        }

        Course course = enrollment.getCourse();
        boolean isAdmin = "ADMIN".equalsIgnoreCase(role);
        boolean isAssignedTeacher = false;

        if (userIdStr != null && "TEACHER".equalsIgnoreCase(role)) {
            try {
                long teacherId = Long.parseLong(userIdStr);
                isAssignedTeacher = (course != null && course.getTeacher() != null && course.getTeacher().getId() == teacherId);
            } catch (NumberFormatException ignored) {}
        }

        if (!isAdmin && !isAssignedTeacher) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Access denied. You can only enter marks and grades for your own assigned subject (" + (course != null ? course.getCourseCode() : "") + ")."));
        }

        // Apply internal marks
        if (marksPayload.containsKey("internalMarks")) {
            Object im = marksPayload.get("internalMarks");
            if (im instanceof Number) {
                enrollment.setInternalMarks(((Number) im).floatValue());
            } else if (im == null) {
                enrollment.setInternalMarks(null);
            }
        }

        // Apply exam marks
        if (marksPayload.containsKey("examMarks")) {
            Object em = marksPayload.get("examMarks");
            if (em instanceof Number) {
                enrollment.setExamMarks(((Number) em).floatValue());
            } else if (em == null) {
                enrollment.setExamMarks(null);
            }
        }

        // Calculate or set total marks
        if (marksPayload.containsKey("totalMarks")) {
            Object tm = marksPayload.get("totalMarks");
            if (tm instanceof Number) {
                enrollment.setTotalMarks(((Number) tm).floatValue());
            }
        } else if (enrollment.getInternalMarks() != null || enrollment.getExamMarks() != null) {
            float im = enrollment.getInternalMarks() != null ? enrollment.getInternalMarks() : 0f;
            float em = enrollment.getExamMarks() != null ? enrollment.getExamMarks() : 0f;
            enrollment.setTotalMarks(im + em);
        }

        // Apply letter grade
        if (marksPayload.containsKey("grade")) {
            String grade = (String) marksPayload.get("grade");
            enrollment.setGrade(grade);
            enrollment.setGradePoint(convertGradeToPoint(grade));
        }

        // Apply attendance
        if (marksPayload.containsKey("attendance")) {
            Object att = marksPayload.get("attendance");
            if (att instanceof Number) {
                enrollment.setAttendance(((Number) att).intValue());
            }
        }

        // Apply remarks
        if (marksPayload.containsKey("remarks")) {
            enrollment.setRemarks((String) marksPayload.get("remarks"));
        }

        Enrollment saved = enrollmentRepo.save(enrollment);

        // Recalculate student GPA
        recalculateStudentGpa(saved.getStudent());

        return ResponseEntity.ok(Map.of(
                "message", "Marks and grade updated successfully.",
                "enrollment", saved,
                "updatedGpa", saved.getStudent().getGpa()
        ));
    }
}

