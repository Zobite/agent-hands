<feature>
  <meta>
    <id>user_create</id>
    <title>Create new user</title>
    <group>Users</group>
    <status>done</status>
    <priority>p0</priority>
  </meta>

  <overview>
    Super admin or admin creates a new user account in the system.
    New user is assigned a role and receives login credentials.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>Admin</actor>
      <action>click "Add User" on User Management page</action>
      <benefit>add a new member to the system</benefit>
    </story>
  </user-stories>
</feature>

## Server
- [x] POST /api/users { username, email, password, name, role } → create new user
- [x] Username and email must be unique, return error if duplicate
- [x] Password hashed before storing in DB
- [x] Only admin/superadmin can call this endpoint

## Web
- [x] "Add User" button only visible to admin/superadmin
- [x] Click → dialog: Username (required), Email (required), Password (required, min 8 chars), Name (required), Role (dropdown: admin/member)
- [x] Save → new user appears in the list
- [x] Cancel → close dialog, no changes
- [x] Success toast after creation
