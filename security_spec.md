# Security Specification for Nabough (نبوغ)

## 1. Data Invariants
1. **Zero-Trust Identity**: Users can only write to their own profile unless they have verified `admin` or `super_admin` status.
2. **Role Elevation Guard**: Regular users or students cannot elevate their role to `admin`, `doctor`, `coordinator`, or `super_admin`.
3. **National ID & Phone PII Protection**: Egyptian National IDs and sensitive student records must never be readable by unauthorized third parties.
4. **Append-Only Activity Logs**: Administrative audit logs (`activityLogs`) are immutable once written; regular users cannot delete or modify them.
5. **Course & Lecture Integrity**: Lectures and curriculum can only be authored or modified by authorized faculty (`doctor`, `coordinator`, `admin`, `super_admin`) or students with explicit scoped permissions.
6. **Community Integrity**: Community posts and comments can only be created by authenticated users; users can only edit or delete their own posts, or community moderators can remove violations.

## 2. The "Dirty Dozen" Test Payloads
1. **Payload 1 (Privilege Escalation via Self-Update)**: Student attempts to update `role: 'super_admin'` on `/users/{studentId}`. -> REJECTED.
2. **Payload 2 (Orphan Activity Log Injection)**: Unauthenticated user attempts to forge an activity log with arbitrary admin identity. -> REJECTED.
3. **Payload 3 (Activity Log Mutation)**: User attempts to edit or delete existing `/activityLogs/{logId}`. -> REJECTED.
4. **Payload 4 (College Registry Tampering)**: Student attempts to modify official student grades or national IDs in `/collegeRegistry/{registryId}`. -> REJECTED.
5. **Payload 5 (PII Scraping Attack)**: Regular student attempts blanket query or reading another student's private sensitive data. -> REJECTED.
6. **Payload 6 (Course Overwrite Attack)**: Regular student attempts to delete or overwrite `/courses/{courseId}` without `manage_all_subjects` permission. -> REJECTED.
7. **Payload 7 (Ghost Field Injection)**: User updates `/users/{userId}` with ghost field `{ isSuperAdmin: true, bypassSecurity: true }`. -> REJECTED.
8. **Payload 8 (Large Payload DOS / Denial of Wallet)**: Submitting a 5MB junk string in `content` or `id` longer than 128 characters. -> REJECTED.
9. **Payload 9 (Forged Post Author)**: User A attempts to create a `/communityPosts/{postId}` with `authorId: 'UserB'`. -> REJECTED.
10. **Payload 10 (Unauthorized Announcement)**: Normal student without position/permission attempts to publish college-wide announcement. -> REJECTED.
11. **Payload 11 (Task Impersonation)**: User A attempts to read or toggle `/tasks/{taskId}` belonging to User B. -> REJECTED.
12. **Payload 12 (Settings Tampering)**: Non-superadmin attempts to write to `/settings/platform_config`. -> REJECTED.
