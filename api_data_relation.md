```mermaid
erDiagram
    USER {
        ObjectId _id
        string name
        string email
        string passwordHash
        string role
        List~ObjectId~ coursesEnrolled
        List~ObjectId~ coursesTeaching
    }

    COURSE {
        ObjectId _id
        string subject
        string number
        string title
        string term
        ObjectId instructorId
        List~ObjectId~ studentIds
        List~ObjectId~ assignmentIds
    }

    ASSIGNMENT {
        ObjectId _id
        ObjectId courseId
        string title
        int points
        string due
        List~ObjectId~ submissionIds
    }

    SUBMISSION {
        ObjectId _id
        ObjectId assignmentId
        ObjectId studentId
        string timestamp
        float grade
    }

    USER ||--o{ COURSE : "teaches"
    USER }o--o{ COURSE : "enrolled in"
    COURSE ||--o{ ASSIGNMENT : "contains"
    ASSIGNMENT ||--o{ SUBMISSION : "has"
    SUBMISSION }o--|| USER : "submitted by"
