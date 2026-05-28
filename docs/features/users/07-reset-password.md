<feature>
  <meta>
    <id>user_reset_password</id>
    <title>Reset password</title>
    <group>Users</group>
    <status>done</status>
    <priority>p1</priority>
  </meta>

  <overview>
    Admin resets password for any user. Users can also change their own password.
    New password is hashed and updated, old sessions are invalidated.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>Admin</actor>
      <action>reset password for a user who forgot their password</action>
      <benefit>user can log in again without email recovery</benefit>
    </story>
    <story id="US-02">
      <actor>User</actor>
      <action>change own password from profile/settings page</action>
      <benefit>secure personal account</benefit>
    </story>
  </user-stories>
</feature>

## Server
- [x] Admin: POST /api/users/:id/reset-password { newPassword } → hash + update DB
- [x] Self-change: POST /api/auth/change-password { oldPassword, newPassword }
- [x] Validate: new password minimum 8 characters, old password correct
- [x] All old sessions invalidated after reset

## Web
- [x] Admin: "Reset Password" button on each user row/detail
- [x] Click → dialog to enter new password (or generate random)
- [x] Self-change: form old password + new password + confirm
- [x] Success toast after change
