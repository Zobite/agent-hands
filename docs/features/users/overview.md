<feature>
  <meta>
    <id>users_overview</id>
    <title>User Management — Overview</title>
    <group>Users</group>
    <status>planned</status>
    <priority>p0</priority>
    <updated>2026-04-28</updated>
  </meta>

  <overview>
    User management system for authentication, authorization, and account
    administration. On first app installation, a super admin is automatically
    created via migration. Super admin has full user management rights: add,
    edit, delete, reset password. All users must log in to access the system.
  </overview>
</feature>

## Features (atomic — in priority order)

| #  | Feature                           | File                                                            | Status     | Priority |
|----|-----------------------------------|-----------------------------------------------------------------|------------|----------|
| 01 | Super admin init (migration)      | [01-super-admin-init.md](01-super-admin-init.md)                | ⬜ Planned | p0       |
| 02 | Login                             | [02-login.md](02-login.md)                                      | ⬜ Planned | p0       |
| 03 | Logout                            | [03-logout.md](03-logout.md)                                    | ⬜ Planned | p0       |
| 04 | Create new user                   | [04-create-user.md](04-create-user.md)                          | ⬜ Planned | p0       |
| 05 | Edit user                         | [05-edit-user.md](05-edit-user.md)                              | ⬜ Planned | p1       |
| 06 | Delete user                       | [06-delete-user.md](06-delete-user.md)                          | ⬜ Planned | p1       |
| 07 | Reset password                    | [07-reset-password.md](07-reset-password.md)                    | ⬜ Planned | p1       |
| 08 | Roles (authorization)             | [08-roles.md](08-roles.md)                                      | ⬜ Planned | p2       |
| 09 | Session management                | [09-session-management.md](09-session-management.md)            | ⬜ Planned | p2       |
