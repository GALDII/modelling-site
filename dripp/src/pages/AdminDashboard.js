import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../Context/AuthContext';
import { Users, Shield, Mail, Calendar, Loader, AlertTriangle, UserCheck, UserX, Search } from 'lucide-react';

const AdminDashboard = () => {
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const { token } = useAuth();

    useEffect(() => {
        const fetchUsers = async () => {
            if (!token) {
                setError('Authentication token not found.');
                setIsLoading(false);
                return;
            }
            try {
                // This endpoint needs to exist on your server and be protected for admins
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
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUsers();
    }, [token]);

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
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined On</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredUsers.map(user => (
                                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                                    <div className="text-sm text-gray-500">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={getRoleChip(user.role)}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button className="text-indigo-600 hover:text-indigo-900 mr-4">Edit</button>
                                            <button className="text-red-600 hover:text-red-900">Delete</button>
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
