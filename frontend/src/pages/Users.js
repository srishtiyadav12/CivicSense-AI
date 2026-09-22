import React, { useState, useEffect } from 'react';
import { userApi, departmentApi } from '../api/client';
import Loading from '../components/shared/Loading';
import Alert from '../components/shared/Alert';
import { roleLabel, formatDate } from '../utils/helpers';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ role: '', search: '' });

  useEffect(() => {
    const load = async () => {
      try {
        const [usersRes, deptRes] = await Promise.all([
          userApi.getAll(),
          departmentApi.getCatalogue()
        ]);
        setUsers(usersRes.data.users);
        setDepartments(deptRes.data.departments || []);
      } catch (err) {
        setError('Failed to load users');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const updateUserRole = async (id, role) => {
    try {
      await userApi.update(id, { role });
      const res = await userApi.getAll();
      setUsers(res.data.users);
    } catch (err) {
      setError('Failed to update user');
    }
  };

  if (loading) return <Loading message="Loading users..." />;

  const filtered = users.filter(u => {
    if (filters.role && u.role !== filters.role) return false;
    if (filters.search && !u.name?.toLowerCase().includes(filters.search.toLowerCase()) &&
        !u.email?.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <div className="flex-between mb-3" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: '1.5rem' }}>User Management</h2>
          <p style={{ color: '#64748b' }}>Manage user accounts and roles</p>
        </div>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      <div className="filters-bar">
        <input
          type="text"
          name="search"
          className="form-input"
          placeholder="Search users..."
          value={filters.search}
          onChange={handleFilterChange}
        />
        <select name="role" className="form-select" value={filters.role} onChange={handleFilterChange}>
          <option value="">All Roles</option>
          <option value="citizen">Citizen</option>
          <option value="official">Official</option>
          <option value="admin">Admin</option>
          <option value="super_admin">Super Admin</option>
        </select>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Department</th>
              <th>Ward</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u._id}>
                <td style={{ fontWeight: 600 }}>{u.name}</td>
                <td>{u.email}</td>
                <td>
                  <span className={`badge role-badge-${u.role}`} style={{ textTransform: 'uppercase' }}>
                    {roleLabel(u.role)}
                  </span>
                </td>
                <td>{u.department || '—'}</td>
                <td>{u.ward || '—'}</td>
                <td>
                  <span className={`badge ${u.isActive ? 'badge-resolved' : 'badge-rejected'}`}>
                    {u.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>{formatDate(u.createdAt)}</td>
                <td>
                  <select
                    className="form-select"
                    style={{ width: 'auto', padding: '4px 8px', fontSize: '0.8rem' }}
                    value={u.role}
                    onChange={(e) => updateUserRole(u._id, e.target.value)}
                  >
                    <option value="citizen">Citizen</option>
                    <option value="official">Official</option>
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Users;