<feature>
  <meta>
    <id>user_delete</id>
    <title>Delete user</title>
    <group>Users</group>
    <status>done</status>
    <priority>p1</priority>
  </meta>

  <overview>
    Admin deletes a user account from the system. Super admin cannot be deleted.
    Deleting a user invalidates all sessions/tokens of that user.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>Admin</actor>
      <action>delete an unnecessary user account</action>
      <benefit>keep user list clean, revoke access</benefit>
    </story>
  </user-stories>
</feature>

## Server
- [x] DELETE /api/users/:id → delete user, invalidate sessions
- [x] Cannot delete superadmin
- [x] Cannot delete self

## Web
- [x] Delete button on each user row (except superadmin)
- [x] Click Delete → confirmation dialog "Delete user [username]?"
- [x] Confirm → user disappears from list
- [x] Cancel → no changes
- [x] Toast "User [username] deleted" after success
