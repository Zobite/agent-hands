<feature>
  <meta>
    <id>user_edit</id>
    <title>Edit user</title>
    <group>Users</group>
    <status>done</status>
    <priority>p1</priority>
  </meta>

  <overview>
    Admin edits user information: username, email, role.
    Super admin cannot be downgraded by regular admin.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>Admin</actor>
      <action>click on a user in the list → edit information</action>
      <benefit>update user information or change permissions</benefit>
    </story>
  </user-stories>
</feature>

## Server
- [x] PATCH /api/users/:id { username?, email?, role? } → update user
- [x] Username/email validate unique (except for the user itself)
- [x] Cannot change superadmin's role

## Web
- [x] Click user row → edit dialog with pre-filled data
- [x] Fields: Username, Email, Role
- [x] Superadmin's role → field disabled
- [x] Save → list updates immediately
- [x] Cancel → close dialog, no changes
