import React, { useEffect, useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import { adminAPI } from '../services/api';
import { getAvatarUrl, getAvatarFallback, getAvatarGradient } from '../utils/avatar';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [total, setTotal] = useState(0);
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'

  // Modals state
  const [selectedUser, setSelectedUser] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const editFileInputRef = useRef(null);
  const [editAvatarFile, setEditAvatarFile] = useState(null);
  const [editAvatarPreview, setEditAvatarPreview] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'user',
    avatar: '',
    isActive: true,
    isVerified: false,
    isTwoFactorEnabled: false,
    street: '',
    city: '',
    state: '',
    pincode: '',
    password: '',
  });

  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [dossierModalOpen, setDossierModalOpen] = useState(false);
  const [dossierData, setDossierData] = useState(null);
  const [dossierLoading, setDossierLoading] = useState(false);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'user',
    password: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
    isVerified: true,
    isActive: true,
  });

  const [deleteConfirmUser, setDeleteConfirmUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch Stats
  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const { data } = await adminAPI.getUserStats();
      if (data?.data) {
        setStats(data.data);
      }
    } catch {
      // Quiet fail if offline
    } finally {
      setStatsLoading(false);
    }
  };

  // Fetch Users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {
        search: search.trim() || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
        limit: 100,
      };
      const { data } = await adminAPI.getUsers(params);
      setUsers(data?.data?.users || []);
      setTotal(data?.data?.total || 0);
    } catch (err) {
      toast.error('Failed to load user directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, roleFilter, statusFilter]);

  // Quick Role Change
  const handleRoleChange = async (userId, newRole) => {
    try {
      await adminAPI.updateRole(userId, newRole);
      toast.success(`Clearance updated to ${newRole.toUpperCase()}`);
      fetchUsers();
      fetchStats();
    } catch {
      toast.error('Failed to update role');
    }
  };

  // Quick Status Toggle
  const handleToggle = async (userId) => {
    try {
      await adminAPI.toggleStatus(userId);
      toast.success('Account authorization status updated');
      fetchUsers();
      fetchStats();
    } catch {
      toast.error('Failed to toggle status');
    }
  };

  // Open Edit Modal
  const openEditModal = (u) => {
    setSelectedUser(u);
    setEditAvatarFile(null);
    setEditAvatarPreview(getAvatarUrl(u.avatar));
    setEditFormData({
      name: u.name || '',
      email: u.email || '',
      phone: u.phone || '',
      role: u.role || 'user',
      avatar: u.avatar || '',
      isActive: u.isActive !== undefined ? u.isActive : true,
      isVerified: u.isVerified !== undefined ? u.isVerified : false,
      isTwoFactorEnabled: u.isTwoFactorEnabled !== undefined ? u.isTwoFactorEnabled : false,
      street: u.address?.street || '',
      city: u.address?.city || '',
      state: u.address?.state || '',
      pincode: u.address?.pincode || '',
      password: '',
    });
    setEditModalOpen(true);
  };

  // Save Edit Form
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    if (!editFormData.name.trim() || !editFormData.email.trim()) {
      toast.error('Name and Email are required');
      return;
    }

    try {
      setActionLoading(true);

      if (editAvatarFile) {
        const formData = new FormData();
        formData.append('avatar', editAvatarFile);
        formData.append('name', editFormData.name.trim());
        formData.append('email', editFormData.email.trim());
        if (editFormData.phone?.trim()) formData.append('phone', editFormData.phone.trim());
        formData.append('role', editFormData.role);
        formData.append('isActive', editFormData.isActive);
        formData.append('isVerified', editFormData.isVerified);
        formData.append('isTwoFactorEnabled', editFormData.isTwoFactorEnabled);
        formData.append('address[street]', editFormData.street || '');
        formData.append('address[city]', editFormData.city || '');
        formData.append('address[state]', editFormData.state || '');
        formData.append('address[pincode]', editFormData.pincode || '');
        if (editFormData.password && editFormData.password.trim().length >= 6) {
          formData.append('password', editFormData.password.trim());
        }

        await adminAPI.updateUser(selectedUser._id, formData);
      } else {
        const payload = {
          name: editFormData.name.trim(),
          email: editFormData.email.trim(),
          phone: editFormData.phone.trim() || undefined,
          role: editFormData.role,
          avatar: editFormData.avatar !== undefined ? editFormData.avatar : undefined,
          isActive: editFormData.isActive,
          isVerified: editFormData.isVerified,
          isTwoFactorEnabled: editFormData.isTwoFactorEnabled,
          address: {
            street: editFormData.street,
            city: editFormData.city,
            state: editFormData.state,
            pincode: editFormData.pincode,
          },
        };

        if (editFormData.password && editFormData.password.trim().length >= 6) {
          payload.password = editFormData.password.trim();
        }

        await adminAPI.updateUser(selectedUser._id, payload);
      }

      toast.success(`Profile for ${editFormData.name} updated successfully!`);
      setEditModalOpen(false);
      setSelectedUser(null);
      setEditAvatarFile(null);
      setEditAvatarPreview(null);
      fetchUsers();
      fetchStats();
    } catch (err) {
      console.error('Update user error:', err);
      const errMsg = err.response?.data?.message || err.response?.data?.error?.message || err.message || 'Failed to update user profile';
      toast.error(errMsg);
    } finally {
      setActionLoading(false);
    }
  };

  // Open Password Modal
  const openPasswordModal = (u) => {
    setSelectedUser(u);
    setNewPassword('');
    setShowPassword(false);
    setPasswordModalOpen(true);
  };

  // Generate High-Entropy Random Password
  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
    let pass = '';
    for (let i = 0; i < 14; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pass);
    setShowPassword(true);
    toast.success('Generated strong high-entropy password');
  };

  // Save Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    if (!newPassword || newPassword.trim().length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      setActionLoading(true);
      await adminAPI.resetUserPassword(selectedUser._id, { password: newPassword.trim() });
      toast.success(`Password override applied for ${selectedUser.name}!`);
      setPasswordModalOpen(false);
      setSelectedUser(null);
      setNewPassword('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Dossier Modal
  const openDossierModal = async (u) => {
    setSelectedUser(u);
    setDossierData(null);
    setDossierModalOpen(true);
    setDossierLoading(true);
    try {
      const { data } = await adminAPI.getUserDetails(u._id);
      setDossierData(data?.data);
    } catch {
      toast.error('Failed to load full user dossier');
    } finally {
      setDossierLoading(false);
    }
  };

  // Handle Create User
  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!createFormData.name.trim() || !createFormData.email.trim() || !createFormData.password.trim()) {
      toast.error('Name, Email, and Password are required');
      return;
    }

    try {
      setActionLoading(true);
      const payload = {
        name: createFormData.name.trim(),
        email: createFormData.email.trim(),
        password: createFormData.password.trim(),
        phone: createFormData.phone.trim() || undefined,
        role: createFormData.role,
        isVerified: createFormData.isVerified,
        isActive: createFormData.isActive,
        address: {
          street: createFormData.street,
          city: createFormData.city,
          state: createFormData.state,
          pincode: createFormData.pincode,
        },
      };

      await adminAPI.createUser(payload);
      toast.success(`Enrolled new ${createFormData.role.toUpperCase()}: ${createFormData.name}`);
      setCreateModalOpen(false);
      setCreateFormData({
        name: '',
        email: '',
        phone: '',
        role: 'user',
        password: '',
        street: '',
        city: '',
        state: '',
        pincode: '',
        isVerified: true,
        isActive: true,
      });
      fetchUsers();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to enroll user');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Safe Account Deletion
  const handleDeleteUser = async () => {
    if (!deleteConfirmUser) return;
    try {
      setActionLoading(true);
      await adminAPI.deleteUser(deleteConfirmUser._id);
      toast.success(`Account for ${deleteConfirmUser.name} purged from registry`);
      setDeleteConfirmUser(null);
      fetchUsers();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setActionLoading(false);
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    if (!users.length) {
      toast.error('No user data to export');
      return;
    }

    const headers = ['User ID', 'Name', 'Email', 'Phone', 'Role', 'Status', 'Verified', '2FA Enabled', 'City', 'State', 'Registered On'];
    const rows = users.map(u => [
      u._id,
      `"${(u.name || '').replace(/"/g, '""')}"`,
      `"${(u.email || '').replace(/"/g, '""')}"`,
      `"${(u.phone || 'N/A').replace(/"/g, '""')}"`,
      u.role || 'user',
      u.isActive ? 'Active' : 'Suspended',
      u.isVerified ? 'Yes' : 'No',
      u.isTwoFactorEnabled ? 'Yes' : 'No',
      `"${(u.address?.city || 'N/A').replace(/"/g, '""')}"`,
      `"${(u.address?.state || 'N/A').replace(/"/g, '""')}"`,
      format(new Date(u.createdAt), 'yyyy-MM-dd HH:mm:ss'),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CyberGuard_Personnel_Registry_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Exported registry to CSV');
  };

  // Export to JSON
  const exportToJSON = () => {
    if (!users.length) {
      toast.error('No user data to export');
      return;
    }
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(users, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `CyberGuard_Personnel_Registry_${format(new Date(), 'yyyyMMdd_HHmm')}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Exported registry to JSON');
  };

  // Copy text helper
  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  // Sorted list: Owner first
  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => {
      if (a.email === 'pruthvishetty04@gmail.com') return -1;
      if (b.email === 'pruthvishetty04@gmail.com') return 1;
      return 0;
    });
  }, [users]);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#02060A',
      color: '#fff',
      position: 'relative',
      overflowX: 'hidden',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Background Liquid Gradients */}
      <div style={{ position: 'fixed', top: '-15%', right: '-15%', width: '65%', height: '65%', background: 'radial-gradient(circle, rgba(0, 180, 255, 0.08) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '-15%', left: '-15%', width: '65%', height: '65%', background: 'radial-gradient(circle, rgba(0, 255, 170, 0.06) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)', backgroundSize: '36px 36px', pointerEvents: 'none', zIndex: 0 }} />

      <Navbar />

      <div style={{
        maxWidth: 1380,
        margin: '0 auto',
        padding: '50px 24px 100px',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Top Clearance Banner */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '32px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{
              background: 'rgba(0, 180, 255, 0.12)',
              border: '1px solid rgba(0, 180, 255, 0.3)',
              color: '#00B4FF',
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00B4FF', boxShadow: '0 0 10px #00B4FF', display: 'inline-block' }} />
              LEVEL 4 ADMIN DIRECTORY
            </span>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', fontWeight: 600 }}>
              • CENTRAL SURVEILLANCE & CREDENTIAL MANAGEMENT
            </span>
          </div>

          {/* Top Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => { fetchUsers(); fetchStats(); toast.success('Directory refreshed'); }}
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#fff',
                padding: '10px 16px',
                borderRadius: '14px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: '0.2s'
              }}
            >
              ↻ REFRESH
            </button>

            <button
              onClick={exportToCSV}
              style={{
                background: 'rgba(0, 255, 170, 0.08)',
                border: '1px solid rgba(0, 255, 170, 0.25)',
                color: '#00FF88',
                padding: '10px 16px',
                borderRadius: '14px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              ⇩ CSV EXPORT
            </button>

            <button
              onClick={exportToJSON}
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'rgba(255,255,255,0.7)',
                padding: '10px 16px',
                borderRadius: '14px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              ▤ JSON
            </button>

            <button
              onClick={() => setCreateModalOpen(true)}
              style={{
                background: 'linear-gradient(135deg, #007AFF 0%, #00B4FF 100%)',
                border: 'none',
                color: '#fff',
                padding: '10px 20px',
                borderRadius: '14px',
                fontSize: '12px',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 8px 20px rgba(0, 180, 255, 0.35)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                letterSpacing: '0.5px'
              }}
            >
              <span>+</span> ENROLL NEW PERSONNEL
            </button>
          </div>
        </div>

        {/* Page Header */}
        <div style={{ marginBottom: 36 }}>
          <h1 style={{
            fontSize: 'clamp(2rem, 4vw, 3.2rem)',
            fontWeight: 900,
            letterSpacing: '-1.5px',
            margin: '0 0 10px 0',
            lineHeight: 1.15
          }}>
            USER & PERSONNEL <span style={{
              background: 'linear-gradient(90deg, #00B4FF, #00FF88)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 30px rgba(0,180,255,0.4)'
            }}>INTELLIGENCE INFO</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '15px', maxWidth: 800, lineHeight: 1.6, margin: 0 }}>
            Comprehensive directory of registered citizens, field officers, and system administrators. Full authorization override to inspect dossiers, update personal profiles, modify mobile numbers, reset security passwords, and toggle clearance levels.
          </p>
        </div>

        {/* HUD Statistics Strip */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '32px'
        }}>
          {[
            {
              title: 'TOTAL REGISTERED',
              value: stats ? stats.total : total,
              sub: 'Across all clearance levels',
              icon: <img src="/icons/cyberguard/admin/admin-personnel-directory.svg" alt="" style={{ width: 22, height: 22, objectFit: "contain", verticalAlign: "middle" }} />,
              color: '#00B4FF',
              bg: 'rgba(0, 180, 255, 0.05)',
              border: 'rgba(0, 180, 255, 0.2)'
            },
            {
              title: 'ACTIVE CITIZENS',
              value: stats ? stats.citizens : users.filter(u => u.role === 'user').length,
              sub: `${stats ? stats.active : '—'} active in network`,
              icon: '◈',
              color: '#00FF88',
              bg: 'rgba(0, 255, 136, 0.05)',
              border: 'rgba(0, 255, 136, 0.2)'
            },
            {
              title: 'FIELD OFFICERS',
              value: stats ? stats.officers : users.filter(u => u.role === 'officer').length,
              sub: 'Law enforcement agents',
              icon: '◆',
              color: '#FFB800',
              bg: 'rgba(255, 184, 0, 0.05)',
              border: 'rgba(255, 184, 0, 0.2)'
            },
            {
              title: 'ADMINISTRATORS',
              value: stats ? stats.admins : users.filter(u => u.role === 'admin').length,
              sub: 'Command level access',
              icon: '»',
              color: '#AF52DE',
              bg: 'rgba(175, 82, 222, 0.05)',
              border: 'rgba(175, 82, 222, 0.2)'
            },
            {
              title: '2FA SHIELDED',
              value: stats ? stats.twoFactor : users.filter(u => u.isTwoFactorEnabled).length,
              sub: 'Multi-factor protected',
              icon: '◇',
              color: '#FF2D55',
              bg: 'rgba(255, 45, 85, 0.05)',
              border: 'rgba(255, 45, 85, 0.2)'
            }
          ].map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              style={{
                background: card.bg,
                backdropFilter: 'blur(30px)',
                border: `1px solid ${card.border}`,
                borderRadius: '24px',
                padding: '22px 24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: 'rgba(255,255,255,0.4)', letterSpacing: '1px' }}>
                  {card.title}
                </span>
                <span style={{ fontSize: '18px' }}>{card.icon}</span>
              </div>
              <div>
                <div style={{ fontSize: '2.2rem', fontWeight: 900, color: card.color, letterSpacing: '-1px' }}>
                  {statsLoading && !stats ? '...' : card.value}
                </div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>
                  {card.sub}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Filter & Tactical Control Bar */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(30px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '24px',
          padding: '16px 20px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '14px',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '28px'
        }}>
          {/* Search bar */}
          <div style={{ flex: '1 1 320px', position: 'relative' }}>
            <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }}>
              ⌕
            </span>
            <input
              placeholder="Search by name, email, mobile phone, city, state..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                padding: '14px 16px 14px 44px',
                color: '#fff',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Filter Dropdowns */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                padding: '14px 18px',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="" style={{ background: '#090D14' }}>All Clearances (Roles)</option>
              <option value="user" style={{ background: '#090D14' }}>Citizens (User)</option>
              <option value="officer" style={{ background: '#090D14' }}>Field Officers</option>
              <option value="admin" style={{ background: '#090D14' }}>Administrators</option>
              <option value="education" style={{ background: '#090D14' }}>Educational Personnel</option>
            </select>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                padding: '14px 18px',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="" style={{ background: '#090D14' }}>All Security States</option>
              <option value="active" style={{ background: '#090D14' }}>Active Accounts</option>
              <option value="suspended" style={{ background: '#090D14' }}>Suspended / Terminated</option>
              <option value="verified" style={{ background: '#090D14' }}>Verified Identity Only</option>
              <option value="2fa" style={{ background: '#090D14' }}>2FA Shielded Only</option>
            </select>

            {/* View Mode Toggle */}
            <div style={{
              display: 'flex',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              padding: '4px'
            }}>
              <button
                onClick={() => setViewMode('table')}
                style={{
                  background: viewMode === 'table' ? 'rgba(0, 180, 255, 0.2)' : 'transparent',
                  border: viewMode === 'table' ? '1px solid rgba(0, 180, 255, 0.4)' : 'none',
                  color: viewMode === 'table' ? '#00B4FF' : 'rgba(255,255,255,0.4)',
                  padding: '8px 14px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                ▤ TABLE
              </button>
              <button
                onClick={() => setViewMode('cards')}
                style={{
                  background: viewMode === 'cards' ? 'rgba(0, 180, 255, 0.2)' : 'transparent',
                  border: viewMode === 'cards' ? '1px solid rgba(0, 180, 255, 0.4)' : 'none',
                  color: viewMode === 'cards' ? '#00B4FF' : 'rgba(255,255,255,0.4)',
                  padding: '8px 14px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                ▤ CARDS
              </button>
            </div>
          </div>
        </div>

        {/* User List Content */}
        {loading ? (
          <div style={{
            padding: '100px 20px',
            textAlign: 'center',
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '32px',
            border: '1px solid rgba(255, 255, 255, 0.06)'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '16px' }}>…</div>
            <div style={{ color: '#00B4FF', fontSize: '15px', fontWeight: 800, letterSpacing: '2px' }}>
              QUERYING PERSONNEL SURVEILLANCE DATABASE...
            </div>
          </div>
        ) : sortedUsers.length === 0 ? (
          <div style={{
            padding: '80px 20px',
            textAlign: 'center',
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '32px',
            border: '1px solid rgba(255, 255, 255, 0.06)'
          }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>⌕</div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 8px 0' }}>No Personnel Records Found</h3>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', margin: 0 }}>
              No matches found for "{search}". Try adjusting your search query or clearance filter.
            </p>
          </div>
        ) : viewMode === 'table' ? (
          /* TABLE VIEW */
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '32px',
            overflow: 'hidden',
            boxShadow: '0 30px 60px rgba(0,0,0,0.5)'
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    {['Persona & Terminal', 'Contact & Mobile', 'Clearance Role', 'Account Security', 'Location / Pincode', 'Actions & Override'].map((h, i) => (
                      <th key={i} style={{
                        padding: '20px 24px',
                        fontSize: '11px',
                        color: 'rgba(255,255,255,0.35)',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '1px'
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedUsers.map((u, idx) => {
                    const isOwner = u.email === 'pruthvishetty04@gmail.com';
                    return (
                      <motion.tr
                        key={u._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.02 }}
                        whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
                        style={{
                          borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                          transition: 'background 0.2s'
                        }}
                      >
                        {/* Persona & Terminal */}
                        <td style={{ padding: '20px 24px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                            <div style={{
                              width: 44,
                              height: 44,
                              borderRadius: '14px',
                              background: isOwner
                                ? 'linear-gradient(135deg, #00B4FF, #00FF88)'
                                : u.role === 'admin'
                                ? 'linear-gradient(135deg, #007AFF, #AF52DE)'
                                : u.role === 'officer'
                                ? 'linear-gradient(135deg, #FF9500, #FFCC00)'
                                : 'linear-gradient(135deg, #00B4FF, #00FF88)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              overflow: 'hidden',
                              fontSize: '16px',
                              fontWeight: 800,
                              color: '#fff',
                              flexShrink: 0,
                              boxShadow: isOwner ? '0 0 16px rgba(0, 180, 255, 0.4)' : 'none'
                            }}>
                              {getAvatarUrl(u.avatar) ? (
                                <img 
                                  src={getAvatarUrl(u.avatar)} 
                                  alt={u.name} 
                                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                />
                              ) : (
                                getAvatarFallback(u.name, isOwner)
                              )}
                            </div>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{
                                  fontSize: '15px',
                                  fontWeight: 700,
                                  color: '#fff',
                                  textShadow: isOwner ? '0 0 12px rgba(0, 180, 255, 0.8)' : 'none'
                                }}>
                                  {u.name}
                                </span>
                                {isOwner && (
                                  <span style={{
                                    fontSize: '10px',
                                    background: 'linear-gradient(90deg, #00B4FF, #00FF88)',
                                    color: '#000',
                                    fontWeight: 900,
                                    padding: '2px 6px',
                                    borderRadius: '6px',
                                    letterSpacing: '0.5px'
                                  }}>
                                    OWNER
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '3px' }}>
                                ID: {u._id?.substring(0, 10)}... • Joined {format(new Date(u.createdAt), 'dd MMM yyyy')}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Contact & Mobile */}
                        <td style={{ padding: '20px 24px' }}>
                          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>
                            {u.email}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                            <span style={{ fontSize: '12px', color: u.phone ? '#00B4FF' : 'rgba(255,255,255,0.3)', fontWeight: 600 }}>
                              ⌕ {u.phone || 'No Mobile Registered'}
                            </span>
                            {u.phone && (
                              <button
                                onClick={() => copyToClipboard(u.phone, 'Phone number')}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  cursor: 'pointer',
                                  padding: 0,
                                  fontSize: '11px',
                                  opacity: 0.6
                                }}
                                title="Copy Phone"
                              >
                                ⧉
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Clearance Role */}
                        <td style={{ padding: '20px 24px' }}>
                          {isOwner ? (
                            <span style={{
                              background: 'rgba(0,180,255,0.15)',
                              border: '1px solid #00B4FF',
                              color: '#00B4FF',
                              borderRadius: '10px',
                              padding: '6px 12px',
                              fontSize: '11px',
                              fontWeight: 800,
                              display: 'inline-block',
                              letterSpacing: '1px'
                            }}>
                              MASTER ADMIN
                            </span>
                          ) : (
                            <select
                              value={u.role}
                              onChange={e => handleRoleChange(u._id, e.target.value)}
                              style={{
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.15)',
                                color: u.role === 'admin' ? '#00B4FF' : u.role === 'officer' ? '#FFB800' : '#fff',
                                borderRadius: '12px',
                                padding: '8px 12px',
                                fontSize: '12px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                outline: 'none'
                              }}
                            >
                              <option value="user" style={{ background: '#090D14', color: '#fff' }}>CITIZEN (USER)</option>
                              <option value="officer" style={{ background: '#090D14', color: '#FFB800' }}>FIELD OFFICER</option>
                              <option value="admin" style={{ background: '#090D14', color: '#00B4FF' }}>ADMINISTRATOR</option>
                              <option value="education" style={{ background: '#090D14', color: '#AF52DE' }}>EDUCATION</option>
                            </select>
                          )}
                        </td>

                        {/* Account Security */}
                        <td style={{ padding: '20px 24px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{
                                padding: '4px 10px',
                                borderRadius: '8px',
                                fontSize: '10px',
                                fontWeight: 800,
                                background: u.isActive ? 'rgba(0, 255, 170, 0.12)' : 'rgba(255, 59, 48, 0.12)',
                                color: u.isActive ? '#00FF88' : '#FF3B30',
                                border: `1px solid ${u.isActive ? 'rgba(0, 255, 170, 0.3)' : 'rgba(255, 59, 48, 0.3)'}`,
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                              }}>
                                {u.isActive ? 'ACTIVE' : 'SUSPENDED'}
                              </span>

                              {u.isVerified && (
                                <span style={{
                                  padding: '4px 8px',
                                  borderRadius: '8px',
                                  fontSize: '10px',
                                  fontWeight: 800,
                                  background: 'rgba(0, 180, 255, 0.12)',
                                  color: '#00B4FF',
                                  border: '1px solid rgba(0, 180, 255, 0.3)',
                                }}>
                                  v VERIFIED
                                </span>
                              )}
                            </div>

                            {u.isTwoFactorEnabled && (
                              <span style={{ fontSize: '10px', color: '#FF2D55', fontWeight: 700 }}>
                                ◇ 2FA Protected
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Location */}
                        <td style={{ padding: '20px 24px' }}>
                          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>
                            {u.address?.city ? `${u.address.city}, ${u.address.state || ''}` : 'Location Unset'}
                          </div>
                          {u.address?.pincode && (
                            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>
                              PIN: {u.address.pincode}
                            </div>
                          )}
                        </td>

                        {/* Actions & Override */}
                        <td style={{ padding: '20px 24px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            {/* Inspect Dossier */}
                            <button
                              onClick={() => openDossierModal(u)}
                              title="Inspect User Dossier & Complaints"
                              style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                color: '#fff',
                                borderRadius: '10px',
                                padding: '7px 11px',
                                fontSize: '12px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: '0.2s'
                              }}
                            >
                              ◉
                            </button>

                            {/* Edit Profile */}
                            <button
                              onClick={() => openEditModal(u)}
                              title="Modify Profile, Mobile & Contact Details"
                              style={{
                                background: 'rgba(0, 180, 255, 0.1)',
                                border: '1px solid rgba(0, 180, 255, 0.3)',
                                color: '#00B4FF',
                                borderRadius: '10px',
                                padding: '7px 11px',
                                fontSize: '12px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: '0.2s'
                              }}
                            >
                              EDIT
                            </button>

                            {/* Reset Password */}
                            <button
                              onClick={() => openPasswordModal(u)}
                              title="Reset or Override Password"
                              style={{
                                background: 'rgba(255, 184, 0, 0.1)',
                                border: '1px solid rgba(255, 184, 0, 0.3)',
                                color: '#FFB800',
                                borderRadius: '10px',
                                padding: '7px 11px',
                                fontSize: '12px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: '0.2s'
                              }}
                            >
                              ◇
                            </button>

                            {/* Terminate / Restore Status */}
                            {!isOwner && (
                              <button
                                onClick={() => handleToggle(u._id)}
                                title={u.isActive ? 'Suspend User Access' : 'Restore User Access'}
                                style={{
                                  background: u.isActive ? 'rgba(255, 59, 48, 0.1)' : 'rgba(0, 255, 170, 0.1)',
                                  border: `1px solid ${u.isActive ? 'rgba(255, 59, 48, 0.3)' : 'rgba(0, 255, 170, 0.3)'}`,
                                  color: u.isActive ? '#FF3B30' : '#00FF88',
                                  borderRadius: '10px',
                                  padding: '7px 11px',
                                  fontSize: '11px',
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                  transition: '0.2s'
                                }}
                              >
                                {u.isActive ? 'LOCK' : 'UNLOCK'}
                              </button>
                            )}

                            {/* Delete User */}
                            {!isOwner && (
                              <button
                                onClick={() => setDeleteConfirmUser(u)}
                                title="Permanently Purge User Account"
                                style={{
                                  background: 'rgba(255, 45, 85, 0.08)',
                                  border: '1px solid rgba(255, 45, 85, 0.25)',
                                  color: '#FF2D55',
                                  borderRadius: '10px',
                                  padding: '7px 11px',
                                  fontSize: '12px',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  transition: '0.2s'
                                }}
                              >
                                ⌫
                              </button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* CARD GRID VIEW */
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '20px'
          }}>
            {sortedUsers.map((u, idx) => {
              const isOwner = u.email === 'pruthvishetty04@gmail.com';
              return (
                <motion.div
                  key={u._id}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.03 }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    backdropFilter: 'blur(40px)',
                    border: isOwner
                      ? '1px solid rgba(0, 180, 255, 0.4)'
                      : '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '28px',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: isOwner
                      ? '0 15px 35px rgba(0, 180, 255, 0.15)'
                      : '0 15px 35px rgba(0,0,0,0.3)',
                    position: 'relative'
                  }}
                >
                  {/* Card Top */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{
                          width: 48,
                          height: 48,
                          borderRadius: '16px',
                          background: isOwner
                            ? 'linear-gradient(135deg, #00B4FF, #00FF88)'
                            : u.role === 'admin'
                            ? 'linear-gradient(135deg, #007AFF, #AF52DE)'
                            : u.role === 'officer'
                            ? 'linear-gradient(135deg, #FF9500, #FFCC00)'
                            : 'linear-gradient(135deg, #00B4FF, #00FF88)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '18px',
                          fontWeight: 800,
                          color: '#fff',
                          boxShadow: isOwner ? '0 0 16px rgba(0,180,255,0.4)' : 'none'
                        }}>
                          {getAvatarUrl(u.avatar) ? (
                            <img 
                              src={getAvatarUrl(u.avatar)} 
                              alt={u.name} 
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                            />
                          ) : (
                            getAvatarFallback(u.name, isOwner)
                          )}
                        </div>

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#fff' }}>
                              {u.name}
                            </h3>
                            {isOwner && (
                              <span style={{ fontSize: '9px', background: '#00B4FF', color: '#000', fontWeight: 900, padding: '1px 5px', borderRadius: '4px' }}>
                                OWNER
                              </span>
                            )}
                          </div>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            color: u.role === 'admin' ? '#00B4FF' : u.role === 'officer' ? '#FFB800' : '#00FF88',
                            letterSpacing: '0.5px'
                          }}>
                            {u.role.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '8px',
                        fontSize: '10px',
                        fontWeight: 800,
                        background: u.isActive ? 'rgba(0, 255, 170, 0.12)' : 'rgba(255, 59, 48, 0.12)',
                        color: u.isActive ? '#00FF88' : '#FF3B30',
                        border: `1px solid ${u.isActive ? 'rgba(0, 255, 170, 0.3)' : 'rgba(255, 59, 48, 0.3)'}`,
                      }}>
                        {u.isActive ? 'ACTIVE' : 'SUSPENDED'}
                      </span>
                    </div>

                    {/* Details Box */}
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      borderRadius: '16px',
                      padding: '14px',
                      marginBottom: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      fontSize: '12px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.7)' }}>
                        <span style={{ color: 'rgba(255,255,255,0.4)' }}>Email:</span>
                        <span style={{ fontWeight: 600, color: '#fff' }}>{u.email}</span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: 'rgba(255,255,255,0.4)' }}>Mobile:</span>
                        <span style={{ color: u.phone ? '#00B4FF' : 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
                          {u.phone || 'Not Configured'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'rgba(255,255,255,0.4)' }}>Location:</span>
                        <span style={{ color: 'rgba(255,255,255,0.8)' }}>
                          {u.address?.city ? `${u.address.city}, ${u.address.state || ''}` : 'Unset'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'rgba(255,255,255,0.4)' }}>Security:</span>
                        <span style={{ color: u.isTwoFactorEnabled ? '#FF2D55' : '#00FF88', fontWeight: 600 }}>
                          {u.isTwoFactorEnabled ? '2FA Enabled' : 'Standard Auth'} {u.isVerified && '• Verified'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom Actions */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <button
                      onClick={() => openEditModal(u)}
                      style={{
                        background: 'rgba(0, 180, 255, 0.1)',
                        border: '1px solid rgba(0, 180, 255, 0.3)',
                        color: '#00B4FF',
                        borderRadius: '12px',
                        padding: '10px',
                        fontSize: '12px',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      EDIT INFO
                    </button>

                    <button
                      onClick={() => openPasswordModal(u)}
                      style={{
                        background: 'rgba(255, 184, 0, 0.1)',
                        border: '1px solid rgba(255, 184, 0, 0.3)',
                        color: '#FFB800',
                        borderRadius: '12px',
                        padding: '10px',
                        fontSize: '12px',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      ◇ PASSWORD
                    </button>

                    <button
                      onClick={() => openDossierModal(u)}
                      style={{
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#fff',
                        borderRadius: '12px',
                        padding: '10px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      ◉ DOSSIER
                    </button>

                    {!isOwner ? (
                      <button
                        onClick={() => handleToggle(u._id)}
                        style={{
                          background: u.isActive ? 'rgba(255, 59, 48, 0.1)' : 'rgba(0, 255, 170, 0.1)',
                          border: `1px solid ${u.isActive ? 'rgba(255, 59, 48, 0.3)' : 'rgba(0, 255, 170, 0.3)'}`,
                          color: u.isActive ? '#FF3B30' : '#00FF88',
                          borderRadius: '12px',
                          padding: '10px',
                          fontSize: '12px',
                          fontWeight: 800,
                          cursor: 'pointer'
                        }}
                      >
                        {u.isActive ? 'LOCK' : 'UNLOCK'}
                      </button>
                    ) : (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(0, 255, 170, 0.05)',
                        borderRadius: '12px',
                        color: '#00FF88',
                        fontSize: '11px',
                        fontWeight: 800
                      }}>
                        ROOT PROTECTED
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* ──────────────── MODAL 1: EDIT USER INFO ──────────────── */}
      <AnimatePresence>
        {editModalOpen && selectedUser && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(20px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{
                width: '100%',
                maxWidth: 680,
                maxHeight: '90vh',
                overflowY: 'auto',
                background: '#070C14',
                border: '1px solid rgba(0, 180, 255, 0.3)',
                borderRadius: '32px',
                padding: '36px',
                boxShadow: '0 30px 80px rgba(0, 180, 255, 0.25)',
                color: '#fff'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#fff' }}>
                    MODIFY USER <span style={{ color: '#00B4FF' }}>DOSSIER</span>
                  </h2>
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
                    Target Account: {selectedUser.name} ({selectedUser.email})
                  </p>
                </div>
                <button
                  onClick={() => setEditModalOpen(false)}
                  style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#fff', width: 36, height: 36, borderRadius: '50%', cursor: 'pointer', fontSize: '16px' }}
                >
                  x
                </button>
              </div>

              <form onSubmit={handleSaveEdit}>
                {/* Avatar Preview & Upload */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '20px',
                  marginBottom: '24px',
                  padding: '16px 20px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '20px'
                }}>
                  <div style={{
                    width: 64,
                    height: 64,
                    borderRadius: '20px',
                    background: getAvatarGradient(editFormData.role, selectedUser.email === 'pruthvishetty04@gmail.com'),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    fontWeight: 800,
                    color: '#fff',
                    overflow: 'hidden',
                    flexShrink: 0,
                    boxShadow: '0 4px 20px rgba(0, 180, 255, 0.2)'
                  }}>
                    {editAvatarPreview ? (
                      <img 
                        src={editAvatarPreview} 
                        alt={editFormData.name} 
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                    ) : (
                      getAvatarFallback(editFormData.name, selectedUser.email === 'pruthvishetty04@gmail.com')
                    )}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <input 
                        type="file" 
                        ref={editFileInputRef} 
                        style={{ display: 'none' }} 
                        accept="image/*" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setEditAvatarFile(file);
                            const previewUrl = URL.createObjectURL(file);
                            setEditAvatarPreview(previewUrl);
                          }
                        }}
                      />
                      <button 
                        type="button" 
                        onClick={() => editFileInputRef.current?.click()}
                        style={{
                          background: 'rgba(0, 180, 255, 0.12)',
                          border: '1px solid rgba(0, 180, 255, 0.4)',
                          color: '#00B4FF',
                          padding: '8px 16px',
                          borderRadius: '12px',
                          fontSize: '13px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Upload Photo
                      </button>
                      {(editAvatarPreview || editFormData.avatar) && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditAvatarFile(null);
                            setEditAvatarPreview(null);
                            setEditFormData({ ...editFormData, avatar: '' });
                          }}
                          style={{
                            background: 'rgba(255, 59, 48, 0.1)',
                            border: '1px solid rgba(255, 59, 48, 0.3)',
                            color: '#FF3B30',
                            padding: '8px 16px',
                            borderRadius: '12px',
                            fontSize: '13px',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          Remove Photo
                        </button>
                      )}
                    </div>
                    <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', marginTop: '6px' }}>
                      Profile picture (PNG, JPG, WEBP up to 5MB)
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>
                      FULL NAME *
                    </label>
                    <input
                      value={editFormData.name}
                      onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                      required
                      style={{
                        width: '100%',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '14px',
                        padding: '12px 16px',
                        color: '#fff',
                        fontSize: '14px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>
                      EMAIL ADDRESS *
                    </label>
                    <input
                      type="email"
                      value={editFormData.email}
                      onChange={e => setEditFormData({ ...editFormData, email: e.target.value })}
                      required
                      disabled={selectedUser.email === 'pruthvishetty04@gmail.com'}
                      style={{
                        width: '100%',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '14px',
                        padding: '12px 16px',
                        color: '#fff',
                        fontSize: '14px',
                        outline: 'none',
                        boxSizing: 'border-box',
                        opacity: selectedUser.email === 'pruthvishetty04@gmail.com' ? 0.5 : 1
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#00B4FF', marginBottom: '8px' }}>
                      MOBILE / PHONE NUMBER
                    </label>
                    <input
                      placeholder="+91 9876543210"
                      value={editFormData.phone}
                      onChange={e => setEditFormData({ ...editFormData, phone: e.target.value })}
                      style={{
                        width: '100%',
                        background: 'rgba(0, 180, 255, 0.05)',
                        border: '1px solid rgba(0, 180, 255, 0.3)',
                        borderRadius: '14px',
                        padding: '12px 16px',
                        color: '#fff',
                        fontSize: '14px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>
                      CLEARANCE ROLE
                    </label>
                    <select
                      value={editFormData.role}
                      onChange={e => setEditFormData({ ...editFormData, role: e.target.value })}
                      disabled={selectedUser.email === 'pruthvishetty04@gmail.com'}
                      style={{
                        width: '100%',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '14px',
                        padding: '12px 16px',
                        color: '#fff',
                        fontSize: '14px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    >
                      <option value="user" style={{ background: '#070C14' }}>Citizen (User)</option>
                      <option value="officer" style={{ background: '#070C14' }}>Field Officer</option>
                      <option value="admin" style={{ background: '#070C14' }}>Administrator</option>
                      <option value="education" style={{ background: '#070C14' }}>Educational Personnel</option>
                    </select>
                  </div>
                </div>

                {/* Address Section */}
                <div style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '18px',
                  padding: '16px',
                  marginBottom: '16px'
                }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: 'rgba(255,255,255,0.4)', letterSpacing: '1px', marginBottom: '12px' }}>
                    PHYSICAL LOCATION & JURISDICTION
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <input
                      placeholder="Street Address"
                      value={editFormData.street}
                      onChange={e => setEditFormData({ ...editFormData, street: e.target.value })}
                      style={{
                        width: '100%',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        padding: '10px 14px',
                        color: '#fff',
                        fontSize: '13px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                    <input
                      placeholder="City"
                      value={editFormData.city}
                      onChange={e => setEditFormData({ ...editFormData, city: e.target.value })}
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        padding: '10px 14px',
                        color: '#fff',
                        fontSize: '13px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                    <input
                      placeholder="State"
                      value={editFormData.state}
                      onChange={e => setEditFormData({ ...editFormData, state: e.target.value })}
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        padding: '10px 14px',
                        color: '#fff',
                        fontSize: '13px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                    <input
                      placeholder="PIN Code"
                      value={editFormData.pincode}
                      onChange={e => setEditFormData({ ...editFormData, pincode: e.target.value })}
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        padding: '10px 14px',
                        color: '#fff',
                        fontSize: '13px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                {/* Password Override */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#FFB800', marginBottom: '8px' }}>
                    OVERRIDE PASSWORD (OPTIONAL - LEAVE BLANK TO KEEP UNCHANGED)
                  </label>
                  <input
                    type="password"
                    placeholder="Enter new password (min 6 characters)"
                    value={editFormData.password}
                    onChange={e => setEditFormData({ ...editFormData, password: e.target.value })}
                    style={{
                      width: '100%',
                      background: 'rgba(255, 184, 0, 0.05)',
                      border: '1px solid rgba(255, 184, 0, 0.3)',
                      borderRadius: '14px',
                      padding: '12px 16px',
                      color: '#fff',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Flags Checkboxes */}
                <div style={{
                  display: 'flex',
                  gap: '20px',
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: '16px',
                  padding: '14px 18px',
                  marginBottom: '24px'
                }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={editFormData.isActive}
                      onChange={e => setEditFormData({ ...editFormData, isActive: e.target.checked })}
                      disabled={selectedUser.email === 'pruthvishetty04@gmail.com'}
                    />
                    <span style={{ color: editFormData.isActive ? '#00FF88' : '#FF3B30' }}>Active Account</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={editFormData.isVerified}
                      onChange={e => setEditFormData({ ...editFormData, isVerified: e.target.checked })}
                    />
                    <span style={{ color: '#00B4FF' }}>Identity Verified</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={editFormData.isTwoFactorEnabled}
                      onChange={e => setEditFormData({ ...editFormData, isTwoFactorEnabled: e.target.checked })}
                    />
                    <span style={{ color: '#FF2D55' }}>2FA Enforced</span>
                  </label>
                </div>

                {/* Form Buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setEditModalOpen(false)}
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: 'none',
                      color: '#fff',
                      padding: '12px 24px',
                      borderRadius: '14px',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    CANCEL
                  </button>

                  <button
                    type="submit"
                    disabled={actionLoading}
                    style={{
                      background: 'linear-gradient(135deg, #007AFF 0%, #00B4FF 100%)',
                      border: 'none',
                      color: '#fff',
                      padding: '12px 28px',
                      borderRadius: '14px',
                      fontSize: '13px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      boxShadow: '0 8px 20px rgba(0, 180, 255, 0.4)'
                    }}
                  >
                    {actionLoading ? 'UPDATING...' : 'SAVE & APPLY MODIFICATIONS'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ──────────────── MODAL 2: PASSWORD OVERRIDE ──────────────── */}
      <AnimatePresence>
        {passwordModalOpen && selectedUser && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(20px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{
                width: '100%',
                maxWidth: 520,
                background: '#070C14',
                border: '1px solid rgba(255, 184, 0, 0.4)',
                borderRadius: '32px',
                padding: '36px',
                boxShadow: '0 30px 80px rgba(255, 184, 0, 0.25)',
                color: '#fff'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#FFB800' }}>
                    ◇ PASSWORD OVERRIDE
                  </h2>
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
                    Target: {selectedUser.name} ({selectedUser.email})
                  </p>
                </div>
                <button
                  onClick={() => setPasswordModalOpen(false)}
                  style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#fff', width: 36, height: 36, borderRadius: '50%', cursor: 'pointer' }}
                >
                  x
                </button>
              </div>

              <form onSubmit={handleResetPassword}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>
                    ENTER NEW SECURE PASSWORD *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      required
                      style={{
                        width: '100%',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 184, 0, 0.3)',
                        borderRadius: '14px',
                        padding: '14px 48px 14px 16px',
                        color: '#fff',
                        fontSize: '15px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '14px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'rgba(255,255,255,0.6)',
                        fontSize: '14px'
                      }}
                    >
                      {showPassword ? '◉' : '◉'}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    style={{
                      flex: 1,
                      background: 'rgba(255, 184, 0, 0.1)',
                      border: '1px solid rgba(255, 184, 0, 0.3)',
                      color: '#FFB800',
                      padding: '10px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    » GENERATE SECURE
                  </button>

                  {newPassword && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(newPassword, 'Password')}
                      style={{
                        background: 'rgba(0, 180, 255, 0.1)',
                        border: '1px solid rgba(0, 180, 255, 0.3)',
                        color: '#00B4FF',
                        padding: '10px 16px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      ⧉ COPY
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setPasswordModalOpen(false)}
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: 'none',
                      color: '#fff',
                      padding: '12px 20px',
                      borderRadius: '14px',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    CANCEL
                  </button>

                  <button
                    type="submit"
                    disabled={actionLoading}
                    style={{
                      background: 'linear-gradient(135deg, #FFB800 0%, #FF8F00 100%)',
                      border: 'none',
                      color: '#000',
                      padding: '12px 28px',
                      borderRadius: '14px',
                      fontSize: '13px',
                      fontWeight: 900,
                      cursor: 'pointer',
                      boxShadow: '0 8px 20px rgba(255, 184, 0, 0.4)'
                    }}
                  >
                    {actionLoading ? 'APPLYING...' : 'OVERRIDE PASSWORD NOW'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ──────────────── MODAL 3: USER DOSSIER & COMPLAINTS ──────────────── */}
      <AnimatePresence>
        {dossierModalOpen && selectedUser && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(20px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{
                width: '100%',
                maxWidth: 720,
                maxHeight: '90vh',
                overflowY: 'auto',
                background: '#070C14',
                border: '1px solid rgba(0, 255, 170, 0.3)',
                borderRadius: '32px',
                padding: '36px',
                boxShadow: '0 30px 80px rgba(0, 255, 170, 0.2)',
                color: '#fff'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: 52,
                    height: 52,
                    borderRadius: '16px',
                    background: getAvatarGradient(selectedUser.role, selectedUser.email === 'pruthvishetty04@gmail.com'),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    fontWeight: 800,
                    color: '#fff',
                    overflow: 'hidden',
                    flexShrink: 0
                  }}>
                    {getAvatarUrl(selectedUser.avatar) ? (
                      <img 
                        src={getAvatarUrl(selectedUser.avatar)} 
                        alt={selectedUser.name} 
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                    ) : (
                      getAvatarFallback(selectedUser.name, selectedUser.email === 'pruthvishetty04@gmail.com')
                    )}
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>
                      {selectedUser.name}
                    </h2>
                    <span style={{ fontSize: '12px', color: '#00FF88', fontWeight: 700 }}>
                      CLEARANCE: {selectedUser.role?.toUpperCase()} • {selectedUser.isActive ? 'ACTIVE' : 'SUSPENDED'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setDossierModalOpen(false)}
                  style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#fff', width: 36, height: 36, borderRadius: '50%', cursor: 'pointer' }}
                >
                  x
                </button>
              </div>

              {dossierLoading ? (
                <div style={{ padding: '60px', textAlign: 'center', color: '#00FF88' }}>
                  RETRIEVING ENCRYPTED CITIZEN DOSSIER...
                </div>
              ) : (
                <div>
                  {/* Metadata Grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '14px',
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: '20px',
                    padding: '20px',
                    marginBottom: '24px',
                    fontSize: '13px'
                  }}>
                    <div>
                      <span style={{ color: 'rgba(255,255,255,0.4)', display: 'block', fontSize: '11px', fontWeight: 700 }}>EMAIL ADDRESS</span>
                      <span style={{ fontWeight: 600 }}>{selectedUser.email}</span>
                    </div>

                    <div>
                      <span style={{ color: 'rgba(255,255,255,0.4)', display: 'block', fontSize: '11px', fontWeight: 700 }}>MOBILE PHONE NUMBER</span>
                      <span style={{ fontWeight: 600, color: selectedUser.phone ? '#00B4FF' : 'rgba(255,255,255,0.4)' }}>
                        {selectedUser.phone || 'Not Configured'}
                      </span>
                    </div>

                    <div>
                      <span style={{ color: 'rgba(255,255,255,0.4)', display: 'block', fontSize: '11px', fontWeight: 700 }}>RESIDENTIAL LOCATION</span>
                      <span style={{ fontWeight: 600 }}>
                        {selectedUser.address?.street ? `${selectedUser.address.street}, ` : ''}
                        {selectedUser.address?.city || 'City Unset'}, {selectedUser.address?.state || ''} {selectedUser.address?.pincode ? `(${selectedUser.address.pincode})` : ''}
                      </span>
                    </div>

                    <div>
                      <span style={{ color: 'rgba(255,255,255,0.4)', display: 'block', fontSize: '11px', fontWeight: 700 }}>REGISTRATION DATE</span>
                      <span style={{ fontWeight: 600 }}>{format(new Date(selectedUser.createdAt), 'dd MMMM yyyy, HH:mm')}</span>
                    </div>
                  </div>

                  {/* Incident Complaints History */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#00B4FF', letterSpacing: '0.5px' }}>
                        FILED INCIDENT REPORTS ({dossierData?.complaintsCount || 0})
                      </h3>
                    </div>

                    {dossierData?.complaints?.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {dossierData.complaints.map(c => (
                          <div
                            key={c._id}
                            style={{
                              background: 'rgba(255,255,255,0.03)',
                              border: '1px solid rgba(255,255,255,0.08)',
                              borderRadius: '16px',
                              padding: '14px 18px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '14px', color: '#fff' }}>
                                {c.title || c.category}
                              </div>
                              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '3px' }}>
                                ID: {c.complaintId || c._id} • {format(new Date(c.createdAt), 'dd MMM yyyy')} • Loss: ₹{c.estimatedLoss || 0}
                              </div>
                            </div>

                            <span style={{
                              padding: '4px 10px',
                              borderRadius: '8px',
                              fontSize: '11px',
                              fontWeight: 800,
                              background: 'rgba(0, 180, 255, 0.1)',
                              color: '#00B4FF',
                              border: '1px solid rgba(0, 180, 255, 0.25)',
                              textTransform: 'uppercase'
                            }}>
                              {c.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{
                        padding: '30px',
                        textAlign: 'center',
                        background: 'rgba(255,255,255,0.02)',
                        borderRadius: '16px',
                        color: 'rgba(255,255,255,0.4)',
                        fontSize: '13px'
                      }}>
                        No incident complaints filed by this user.
                      </div>
                    )}
                  </div>

                  <div style={{ marginTop: '28px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <button
                      onClick={() => { setDossierModalOpen(false); openEditModal(selectedUser); }}
                      style={{
                        background: 'rgba(0, 180, 255, 0.1)',
                        border: '1px solid rgba(0, 180, 255, 0.3)',
                        color: '#00B4FF',
                        padding: '10px 20px',
                        borderRadius: '12px',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      EDIT PROFILE
                    </button>
                    <button
                      onClick={() => setDossierModalOpen(false)}
                      style={{
                        background: 'rgba(255,255,255,0.08)',
                        border: 'none',
                        color: '#fff',
                        padding: '10px 24px',
                        borderRadius: '12px',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      CLOSE
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ──────────────── MODAL 4: ENROLL NEW PERSONNEL ──────────────── */}
      <AnimatePresence>
        {createModalOpen && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(20px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{
                width: '100%',
                maxWidth: 680,
                maxHeight: '90vh',
                overflowY: 'auto',
                background: '#070C14',
                border: '1px solid rgba(0, 180, 255, 0.4)',
                borderRadius: '32px',
                padding: '36px',
                boxShadow: '0 30px 80px rgba(0, 180, 255, 0.25)',
                color: '#fff'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#fff' }}>
                    ENROLL NEW <span style={{ color: '#00B4FF' }}>PERSONNEL</span>
                  </h2>
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
                    Direct onboarding into the CyberGuard security registry
                  </p>
                </div>
                <button
                  onClick={() => setCreateModalOpen(false)}
                  style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#fff', width: 36, height: 36, borderRadius: '50%', cursor: 'pointer' }}
                >
                  x
                </button>
              </div>

              <form onSubmit={handleCreateUser}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>
                      FULL NAME *
                    </label>
                    <input
                      placeholder="e.g. Officer John Doe"
                      value={createFormData.name}
                      onChange={e => setCreateFormData({ ...createFormData, name: e.target.value })}
                      required
                      style={{
                        width: '100%',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '14px',
                        padding: '12px 16px',
                        color: '#fff',
                        fontSize: '14px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>
                      EMAIL ADDRESS *
                    </label>
                    <input
                      type="email"
                      placeholder="personnel@cyberguard.gov"
                      value={createFormData.email}
                      onChange={e => setCreateFormData({ ...createFormData, email: e.target.value })}
                      required
                      style={{
                        width: '100%',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '14px',
                        padding: '12px 16px',
                        color: '#fff',
                        fontSize: '14px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#00B4FF', marginBottom: '8px' }}>
                      MOBILE / PHONE NUMBER
                    </label>
                    <input
                      placeholder="+91 9876543210"
                      value={createFormData.phone}
                      onChange={e => setCreateFormData({ ...createFormData, phone: e.target.value })}
                      style={{
                        width: '100%',
                        background: 'rgba(0, 180, 255, 0.05)',
                        border: '1px solid rgba(0, 180, 255, 0.3)',
                        borderRadius: '14px',
                        padding: '12px 16px',
                        color: '#fff',
                        fontSize: '14px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>
                      CLEARANCE ROLE
                    </label>
                    <select
                      value={createFormData.role}
                      onChange={e => setCreateFormData({ ...createFormData, role: e.target.value })}
                      style={{
                        width: '100%',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '14px',
                        padding: '12px 16px',
                        color: '#fff',
                        fontSize: '14px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    >
                      <option value="user" style={{ background: '#070C14' }}>Citizen (User)</option>
                      <option value="officer" style={{ background: '#070C14' }}>Field Officer</option>
                      <option value="admin" style={{ background: '#070C14' }}>Administrator</option>
                      <option value="education" style={{ background: '#070C14' }}>Educational Personnel</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#FFB800' }}>
                      PASSWORD *
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
                        let p = '';
                        for (let i = 0; i < 12; i++) p += chars.charAt(Math.floor(Math.random() * chars.length));
                        setCreateFormData({ ...createFormData, password: p });
                        toast.success('Generated random password');
                      }}
                      style={{ background: 'transparent', border: 'none', color: '#00B4FF', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      » AUTO GENERATE
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Enter security password"
                    value={createFormData.password}
                    onChange={e => setCreateFormData({ ...createFormData, password: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      background: 'rgba(255, 184, 0, 0.05)',
                      border: '1px solid rgba(255, 184, 0, 0.3)',
                      borderRadius: '14px',
                      padding: '12px 16px',
                      color: '#fff',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Address Section */}
                <div style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '18px',
                  padding: '16px',
                  marginBottom: '24px'
                }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: 'rgba(255,255,255,0.4)', letterSpacing: '1px', marginBottom: '12px' }}>
                    LOCATION DETAILS (OPTIONAL)
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                    <input
                      placeholder="City"
                      value={createFormData.city}
                      onChange={e => setCreateFormData({ ...createFormData, city: e.target.value })}
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        padding: '10px 14px',
                        color: '#fff',
                        fontSize: '13px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                    <input
                      placeholder="State"
                      value={createFormData.state}
                      onChange={e => setCreateFormData({ ...createFormData, state: e.target.value })}
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        padding: '10px 14px',
                        color: '#fff',
                        fontSize: '13px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                    <input
                      placeholder="PIN Code"
                      value={createFormData.pincode}
                      onChange={e => setCreateFormData({ ...createFormData, pincode: e.target.value })}
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        padding: '10px 14px',
                        color: '#fff',
                        fontSize: '13px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(false)}
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: 'none',
                      color: '#fff',
                      padding: '12px 24px',
                      borderRadius: '14px',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    CANCEL
                  </button>

                  <button
                    type="submit"
                    disabled={actionLoading}
                    style={{
                      background: 'linear-gradient(135deg, #007AFF 0%, #00B4FF 100%)',
                      border: 'none',
                      color: '#fff',
                      padding: '12px 28px',
                      borderRadius: '14px',
                      fontSize: '13px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      boxShadow: '0 8px 20px rgba(0, 180, 255, 0.4)'
                    }}
                  >
                    {actionLoading ? 'CREATING...' : 'ENROLL PERSONNEL NOW'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ──────────────── MODAL 5: DELETE CONFIRMATION ──────────────── */}
      <AnimatePresence>
        {deleteConfirmUser && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(20px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{
                width: '100%',
                maxWidth: 480,
                background: '#070C14',
                border: '1px solid rgba(255, 45, 85, 0.4)',
                borderRadius: '32px',
                padding: '36px',
                boxShadow: '0 30px 80px rgba(255, 45, 85, 0.25)',
                color: '#fff',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>!</div>
              <h2 style={{ margin: '0 0 10px', fontSize: '20px', fontWeight: 800, color: '#FF2D55' }}>
                PURGE PERSONNEL ACCOUNT?
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', lineHeight: 1.5, margin: '0 0 24px' }}>
                Are you sure you want to permanently delete <strong style={{ color: '#fff' }}>{deleteConfirmUser.name}</strong> ({deleteConfirmUser.email})? This action cannot be undone.
              </p>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setDeleteConfirmUser(null)}
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: 'none',
                    color: '#fff',
                    padding: '12px 24px',
                    borderRadius: '14px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  CANCEL
                </button>

                <button
                  type="button"
                  onClick={handleDeleteUser}
                  disabled={actionLoading}
                  style={{
                    background: '#FF2D55',
                    border: 'none',
                    color: '#fff',
                    padding: '12px 28px',
                    borderRadius: '14px',
                    fontSize: '13px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 8px 20px rgba(255, 45, 85, 0.4)'
                  }}
                >
                  {actionLoading ? 'PURGING...' : 'CONFIRM PURGE'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
