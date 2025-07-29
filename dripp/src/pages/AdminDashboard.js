import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../Context/AuthContext';
import { Users, Shield, Mail, Calendar, Loader, AlertTriangle, UserCheck, UserX, Search, Edit, Trash2, X, Save } from 'lucide-react';

const AdminDashboard = () => {
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const { token } = useAuth();
    
    // State for user editing
    const [editingUserId, setEditingUserId] = useState(null);
    const [editedUser, setEditedUser] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchUsers = useCallback(async () => {
        if (!token) {
            setError('Authentication token not found.');
            setIsLoading(false);
            return;
        }
        try {
            setIsLoading(true);
            const response = await fetch('https://modelconnect-api.onrender.com/api/users', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Failed to fetch users.');
            }
            
            const data = await response.json();
            setUsers(data);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const getRoleChip = (role) => {
        const roleStyles = {
            admin: 'bg-red-200 text-red-800 border border-red-300',
            recruiter: 'bg-blue-200 text-blue-800 border border-blue-300',
            model: 'bg-pink-200 text-pink-800 border border-pink-300',
            photographer: 'bg-purple-200 text-purple-800 border border-purple-300',
            editor: 'bg-green-200 text-green-800 border border-green-300',
            default: 'bg-gray-200 text-gray-800 border border-gray-300'
        };
        return (roleStyles[role] || roleStyles.default) + ' text-xs font-semibold mr-2 px-2.5 py-1 rounded-full';
    };
    
    const filteredUsers = users.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const startEditing = (user) => {
        setEditingUserId(user.id);
        setEditedUser({
            name: user.name,
            email: user.email,
            role: user.role
        });
    };

    const cancelEditing = () => {
        setEditingUserId(null);
        setEditedUser({});
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditedUser(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const saveUser = async (userId) => {
        if (!token) return;
        
        setIsSaving(true);
        try {
            const response = await fetch(`https://modelconnect-api.onrender.com/api/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(editedUser)
            });
            
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Failed to update user.');
            }
            
            // Update the user in local state
            setUsers(prevUsers => prevUsers.map(user => 
                user.id === userId ? { ...user, ...editedUser } : user
            ));
            
            setEditingUserId(null);
            setEditedUser({});
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const deleteUser = async (userId) => {
        if (!token) return;
        
        if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            return;
        }
        
        setIsDeleting(true);
        try {
            const response = await fetch(`https://modelconnect-api.onrender.com/api/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Failed to delete user.');
            }
            
            // Remove the user from local state
            setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
        } catch (err) {
            setError(err.message);
        } finally {
            setIsDeleting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-100 flex justify-center items-center">
                <Loader className="animate-spin text-pink-600" size={48} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center text-center p-6">
                <AlertTriangle className="mx-auto text-red-500 mb-4" size={64} />
                <h2 className="mt-4 text-3xl font-bold text-gray-800">Access Denied or Error</h2>
                <p className="text-gray-600 my-4 max-w-md">{error}</p>
                <button 
                    onClick={fetchUsers}
                    className="mt-4 px-6 py-3 bg-pink-600 text-white rounded-lg font-semibold hover:bg-pink-700 transition"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-7xl mx-auto"
            >
                <header className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900">Admin Dashboard</h1>
                    <p className="mt-2 text-lg text-gray-600">Manage all users on the platform.</p>
                </header>

                <div className="bg-white rounded-xl shadow-md p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                        <h2 className="text-2xl font-semibold text-gray-800">User List ({users.length})</h2>
                        <div className="relative w-full sm:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                              type="text"
                              placeholder="Search users..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-pink-500 focus:border-pink-500 transition"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined On</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredUsers.map(user => (
                                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {editingUserId === user.id ? (
                                                <input
                                                    type="text"
                                                    name="name"
                                                    value={editedUser.name}
                                                    onChange={handleEditChange}
                                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-pink-500 focus:border-pink-500"
                                                />
                                            ) : (
                                                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {editingUserId === user.id ? (
                                                <input
                                                    type="email"
                                                    name="email"
                                                    value={editedUser.email}
                                                    onChange={handleEditChange}
                                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-pink-500 focus:border-pink-500"
                                                />
                                            ) : (
                                                <div className="text-sm text-gray-500">{user.email}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {editingUserId === user.id ? (
                                                <select
                                                    name="role"
                                                    value={editedUser.role}
                                                    onChange={handleEditChange}
                                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-pink-500 focus:border-pink-500"
                                                >
                                                    <option value="admin">Admin</option>
                                                    <option value="recruiter">Recruiter</option>
                                                    <option value="model">Model</option>
                                                    <option value="photographer">Photographer</option>
                                                    <option value="editor">Editor</option>
                                                </select>
                                            ) : (
                                                <span className={getRoleChip(user.role)}>
                                                    {user.role}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            {editingUserId === user.id ? (
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => saveUser(user.id)}
                                                        disabled={isSaving}
                                                        className="flex items-center bg-green-500 text-white px-3 py-1.5 rounded hover:bg-green-600 disabled:opacity-50"
                                                    >
                                                        {isSaving ? (
                                                            <Loader className="animate-spin mr-1" size={16} />
                                                        ) : (
                                                            <Save className="mr-1" size={16} />
                                                        )}
                                                        Save
                                                    </button>
                                                    <button
                                                        onClick={cancelEditing}
                                                        className="flex items-center bg-gray-500 text-white px-3 py-1.5 rounded hover:bg-gray-600"
                                                    >
                                                        <X className="mr-1" size={16} />
                                                        Cancel
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => startEditing(user)}
                                                        className="flex items-center bg-indigo-500 text-white px-3 py-1.5 rounded hover:bg-indigo-600"
                                                    >
                                                        <Edit className="mr-1" size={16} />
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => deleteUser(user.id)}
                                                        disabled={isDeleting}
                                                        className="flex items-center bg-red-500 text-white px-3 py-1.5 rounded hover:bg-red-600 disabled:opacity-50"
                                                    >
                                                        {isDeleting ? (
                                                            <Loader className="animate-spin mr-1" size={16} />
                                                        ) : (
                                                            <Trash2 className="mr-1" size={16} />
                                                        )}
                                                        Delete
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                     {filteredUsers.length === 0 && (
                        <div className="text-center py-10">
                            <p className="text-gray-500">No users match your search.</p>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default AdminDashboard;