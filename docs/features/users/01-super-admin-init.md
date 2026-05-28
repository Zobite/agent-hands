<feature>
  <meta>
    <id>user_super_admin_init</id>
    <title>Super admin init (migration)</title>
    <group>Users</group>
    <status>done</status>
    <priority>p0</priority>
  </meta>

  <overview>
    On first app installation, the system automatically creates a super admin
    account via database migration. Default login credentials are printed to console.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>System</actor>
      <action>run migration on first app installation</action>
      <benefit>super admin account is ready for administration</benefit>
    </story>
  </user-stories>
</feature>

## Server
- [x] Migration creates `users` table: id, username, email, password_hash, role, created_at, updated_at
- [x] Seed super admin record: username `admin`, random password (or from env `ADMIN_PASSWORD`)
- [x] Password hashed with bcrypt/argon2 before storing in DB
- [x] Console prints username + default password after successful migration
- [x] If super admin already exists → do not create duplicate
- [x] Role `superadmin` cannot be deleted or downgraded
