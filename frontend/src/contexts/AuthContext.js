import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user từ localStorage khi app khởi động
  useEffect(() => {
    const loadUser = async () => {
      const storedUser = localStorage.getItem('user');
      const accessToken = localStorage.getItem('accessToken');

      if (storedUser && accessToken) {
        try {
          // Parse stored user first
          let parsedUser = JSON.parse(storedUser);
          
          // Nếu user chưa có is_staff/is_superuser, parse từ JWT
          if (parsedUser.is_staff === undefined || parsedUser.is_superuser === undefined) {
            try {
              const tokenPayload = JSON.parse(atob(accessToken.split('.')[1]));
              parsedUser = {
                ...parsedUser,
                is_staff: tokenPayload.is_staff || parsedUser.is_staff || false,
                is_superuser: tokenPayload.is_superuser || parsedUser.is_superuser || false,
              };
              localStorage.setItem('user', JSON.stringify(parsedUser));
            } catch (jwtError) {
              console.log('Cannot parse JWT:', jwtError);
            }
          }
          
          setUser(parsedUser);
          
          // Verify token và refresh user data
          try {
            const response = await authAPI.getProfile();
            let freshUserData = response.data;
            
            // Merge with existing admin flags
            freshUserData = {
              ...freshUserData,
              is_staff: parsedUser.is_staff,
              is_superuser: parsedUser.is_superuser,
            };
            
            localStorage.setItem('user', JSON.stringify(freshUserData));
            setUser(freshUserData);
          } catch (verifyError) {
            console.log('Token verification failed:', verifyError);
            if (verifyError.response?.status === 401) {
              localStorage.removeItem('user');
              localStorage.removeItem('accessToken');
              localStorage.removeItem('refreshToken');
              setUser(null);
            }
          }
        } catch (error) {
          console.error('Error loading user:', error);
          localStorage.removeItem('user');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          setUser(null);
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      const { access, refresh } = response.data;

      // Lưu tokens
      localStorage.setItem('accessToken', access);
      localStorage.setItem('refreshToken', refresh);

      // Lấy thông tin user từ API profile
      try {
        const profileResponse = await authAPI.getProfile();
        let userData = profileResponse.data;
        
        // Parse JWT token để lấy thêm thông tin (is_staff, is_superuser)
        try {
          const tokenPayload = JSON.parse(atob(access.split('.')[1]));
          userData = {
            ...userData,
            is_staff: tokenPayload.is_staff || false,
            is_superuser: tokenPayload.is_superuser || false,
          };
        } catch (jwtError) {
          console.log('Cannot parse JWT:', jwtError);
          // Fallback: Check username đặc biệt cho superuser
          if (credentials.username === 'admin' || userData.username === 'admin') {
            userData.is_staff = true;
            userData.is_superuser = true;
          }
        }
        
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        
        return { success: true, user: userData };
      } catch (profileError) {
        console.error('Error fetching profile:', profileError);
        return { success: true, user: null };
      }
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Đăng nhập thất bại',
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      const { tokens, user: newUser } = response.data;

      // Tự động đăng nhập sau khi đăng ký
      localStorage.setItem('accessToken', tokens.access);
      localStorage.setItem('refreshToken', tokens.refresh);
      localStorage.setItem('user', JSON.stringify(newUser));

      setUser(newUser);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Đăng ký thất bại',
      };
    }
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await authAPI.logout(refreshToken);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear storage và state
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setUser(null);
    }
  };

  const updateUser = (updatedUser) => {
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  // Kiểm tra admin: role='admin' HOẶC is_staff=true HOẶC is_superuser=true
  // HOẶC username đặc biệt
  const isAdmin = user?.role === 'admin' || 
                  user?.is_staff === true || 
                  user?.is_superuser === true ||
                  user?.username === 'admin'; // Fallback cho superuser Django

  const value = {
    user,
    isAdmin,
    login,
    register,
    logout,
    updateUser,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export default AuthContext;
