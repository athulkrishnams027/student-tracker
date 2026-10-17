package com.studenttrackercurd.studenttrackerbackend.Model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import jakarta.persistence.PrePersist;
import java.time.LocalDateTime;

@Entity
@Table(name = "Enrollments")
public class Enrollment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @ManyToOne
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    private String semester;

    private String grade; // e.g. "A+", "A", "B", "C", "F", "IN_PROGRESS"

    private Float gradePoint; // e.g. 4.0, 3.7, 3.0, etc.

    private Integer attendance; // Percentage 0 - 100

    private LocalDateTime enrollmentDate;

    @PrePersist
    public void prePersist() {
        if (this.enrollmentDate == null) {
            this.enrollmentDate = LocalDateTime.now();
        }
        if (this.grade == null || this.grade.trim().isEmpty()) {
            this.grade = "IN_PROGRESS";
        }
        if (this.attendance == null) {
            this.attendance = 100;
        }
    }

    public Enrollment() {
    }

    public Enrollment(User student, Course course, String semester) {
        this.student = student;
        this.course = course;
        this.semester = semester;
        this.grade = "IN_PROGRESS";
        this.attendance = 100;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getStudent() {
        return student;
    }

    public void setStudent(User student) {
        this.student = student;
    }

    public Course getCourse() {
        return course;
    }

    public void setCourse(Course course) {
        this.course = course;
    }

    public String getSemester() {
        return semester;
    }

    public void setSemester(String semester) {
        this.semester = semester;
    }

    public String getGrade() {
        return grade;
    }

    public void setGrade(String grade) {
        this.grade = grade;
    }

    public Float getGradePoint() {
        return gradePoint;
    }

    public void setGradePoint(Float gradePoint) {
        this.gradePoint = gradePoint;
    }

    public Integer getAttendance() {
        return attendance;
    }

    public void setAttendance(Integer attendance) {
        this.attendance = attendance;
    }

    public LocalDateTime getEnrollmentDate() {
        return enrollmentDate;
    }

    public void setEnrollmentDate(LocalDateTime enrollmentDate) {
        this.enrollmentDate = enrollmentDate;
    }
}
