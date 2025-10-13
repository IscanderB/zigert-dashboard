import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tkbblfqrfphooernmwbj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrYmJsZnFyZnBob29lcm5td2JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5OTkwNzIsImV4cCI6MjA3NTU3NTA3Mn0.IEOGqHgW2oKsiSoOfQI05G979qslqcGmjglMKpiIJkQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const ProjectStatusDashboard = () => {
  function uid(prefix = 'id') { return prefix + Math.random().toString(36).slice(2, 9); }

  function getMonthDays(year, month) {
    const date = new Date(year, month, 1);
    const days = [];
    while (date.getMonth() === month) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  }

  function formatDateToYYYYMMDD(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function formatDateForDisplay(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/ ${day}/ ${year}`;
  }

  const projectColors = [
    '#8D6E63', '#5D4037', '#795548', '#6D4C41', '#4E342E',
    '#3E2723', '#A1887F', '#8A6552', '#7B5E47', '#6B4E3D',
    '#5A4037', '#4A2C2A', '#78909C', '#607D8B', '#546E7A',
    '#455A64', '#37474F', '#263238', '#B0BEC5', '#90A4AE',
    '#FF5722', '#FF7043', '#FF8A65', '#FFAB91', '#FFCCBC',
    '#FFC107', '#FFD54F', '#FFE082', '#FFF176', '#F9FBE7',
    '#4CAF50', '#66BB6A', '#81C784', '#A5D6A7', '#C8E6C9',
    '#2196F3', '#42A5F5', '#64B5F6', '#90CAF9', '#BBDEFB',
    '#9C27B0', '#AB47BC', '#BA68C8', '#CE93D8', '#E1BEE7'
  ];

  function getProjectColor(project) {
    if (project && project.color) {
      return project.color;
    }
    
    if (project && project.id) {
      let hash = 0;
      for (let i = 0; i < project.id.length; i++) {
        hash = project.id.charCodeAt(i) + ((hash << 5) - hash);
      }
      const index = Math.abs(hash) % projectColors.length;
      return projectColors[index];
    }
    
    return '#8D6E63';
  }

  function getStageColor(stage) {
    if (stage === 'WIP' || stage.startsWith('WIP')) return '#8E8E93';
    if (stage === 'ICD' || stage.startsWith('ICD')) return '#5A9BD4';
    if (stage.startsWith('R')) {
      const num = parseInt(stage.substring(1)) || 1;
      if (num === 1) return '#FFD700';
      if (num === 2) return '#FFC700';
      if (num === 3) return '#FFB700';
      if (num === 4) return '#FFA500';
      if (num >= 5) return '#FF8C00';
      return '#FFD700';
    }
    if (stage === 'Approved') return '#34C759';
    return '#8E8E93';
  }

  // AUTH STATE
  const [currentUser, setCurrentUser] = useState(null);
  const [authMode, setAuthMode] = useState('login'); // 'login', 'register', 'forgot', 'reset', 'email-confirmed'
  const [authForm, setAuthForm] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [emailConfirmedCountdown, setEmailConfirmedCountdown] = useState(7);

  const [state, setState] = useState({
    totalArtists: 6,
    projects: []
  });
  const [isAdmin, setIsAdmin] = useState(false);
  const [connected, setConnected] = useState(true);
  const [lastSync, setLastSync] = useState(new Date());
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [holidayDays, setHolidayDays] = useState(new Set());
  const [workingWeekends, setWorkingWeekends] = useState(new Set());
  const [isArchiveExpanded, setIsArchiveExpanded] = useState(false);

  const [commentsForId, setCommentsForId] = useState(null);
  const [draft, setDraft] = useState('');
  const [confirmAddOpen, setConfirmAddOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [confirmIgnore, setConfirmIgnore] = useState(null);
  const [historyForId, setHistoryForId] = useState(null);
  
  const [currentDate, setCurrentDate] = useState({
    month: new Date().getMonth(),
    year: new Date().getFullYear()
  });
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    status: 'Waiting',
    startDate: new Date().toISOString().slice(0, 10),
    dueDate: new Date().toISOString().slice(0, 10),
    busy: 0,
    priority: 'Low',
    color: '#8D6E63'
  });
  const [alertMessage, setAlertMessage] = useState('');
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [projectNameModal, setProjectNameModal] = useState({ open: false, projectId: null, name: '' });
  const [passwordModal, setPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [clearCommentsModal, setClearCommentsModal] = useState(null);
  const [clearHistoryModal, setClearHistoryModal] = useState(null);
  const [colorPickerModal, setColorPickerModal] = useState({ open: false, projectId: null, currentColor: '#8D6E63' });

  const [confirmDeleteModal, setConfirmDeleteModal] = useState({ open: false, projectId: null });
  const [confirmCompleteModal, setConfirmCompleteModal] = useState({ open: false, projectId: null });
  const [dateValidationModal, setDateValidationModal] = useState({ open: false, message: '', callback: null });

  const [expandedImages, setExpandedImages] = useState({});
  const [imageTimers, setImageTimers] = useState({});
  const [addCameraModal, setAddCameraModal] = useState({ open: false, projectId: null, cameraName: '' });
  const [deleteCameraModal, setDeleteCameraModal] = useState({ open: false, projectId: null, cameraId: null, cameraName: '' });
  const [stageModal, setStageModal] = useState({ open: false, projectId: null, cameraId: null, currentStage: 'WIP' });
  const [editCameraModal, setEditCameraModal] = useState({ open: false, projectId: null, cameraId: null, cameraName: '' });

  // AUTH FUNCTIONS - SUPABASE AUTH
  async function handleRegister() {
    try {
      if (!authForm.username.trim()) {
        showAlert('Please enter username!');
        return;
      }
      if (!authForm.email.trim()) {
        showAlert('Please enter email!');
        return;
      }
      if (!authForm.password) {
        showAlert('Please enter password!');
        return;
      }
      if (authForm.password.length < 6) {
        showAlert('Password must be at least 6 characters long!');
        return;
      }
      if (authForm.password !== authForm.confirmPassword) {
        showAlert('Passwords do not match!');
        return;
      }

      // Проверяем, занят ли username
      const { data: existingUser } = await supabase
        .from('users')
        .select('username')
        .eq('username', authForm.username)
        .single();

      if (existingUser) {
        showAlert('Username already exists!');
        return;
      }

      // Регистрация через Supabase Auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: authForm.email,
        password: authForm.password,
        options: {
          data: {
            username: authForm.username
          },
          emailRedirectTo: `${window.location.origin}`
        }
      });

      if (signUpError) throw signUpError;

      // Создаем запись в таблице users
      if (authData.user) {
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            username: authForm.username,
            email: authForm.email
          });

        if (insertError) {
          console.error('Error creating user record:', insertError);
        }
      }

      showAlert('Registration successful! Please check your email to confirm your account.');
      setAuthMode('login');
      setAuthForm({ username: '', password: '', confirmPassword: '', email: '', newPassword: '', confirmNewPassword: '' });
    } catch (err) {
      showAlert(`Registration failed: ${err.message}`);
    }
  }

  async function handleLogin() {
    try {
      if (!authForm.username.trim()) {
        showAlert('Please enter username!');
        return;
      }
      if (!authForm.password) {
        showAlert('Please enter password!');
        return;
      }

      // Получаем email по username
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('email, username, id')
        .eq('username', authForm.username)
        .single();

      if (userError || !userData) {
        showAlert('Invalid username or password!');
        return;
      }

      // Входим через Supabase Auth используя email
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: userData.email,
        password: authForm.password
      });

      if (signInError) {
        showAlert('Invalid username or password!');
        return;
      }

      // Проверяем подтверждение email
      if (!authData.user.email_confirmed_at) {
        await supabase.auth.signOut();
        showAlert('Please confirm your email before logging in. Check your inbox!');
        return;
      }

      setCurrentUser({
        id: userData.id,
        username: userData.username,
        email: userData.email
      });
      setAuthForm({ username: '', password: '', confirmPassword: '', email: '', newPassword: '', confirmNewPassword: '' });
      showAlert(`Welcome, ${userData.username}!`);
    } catch (err) {
      showAlert(`Login failed: ${err.message}`);
    }
  }

  async function handleForgotPassword() {
    try {
      if (!authForm.email.trim()) {
        showAlert('Please enter your email!');
        return;
      }

      // Используем встроенную функцию Supabase для сброса пароля
      const { error } = await supabase.auth.resetPasswordForEmail(authForm.email, {
        redirectTo: `${window.location.origin}`
      });

      if (error) throw error;

      showAlert('Password reset link has been sent to your email! Please check your inbox and SPAM folder.');
      setAuthMode('login');
      setAuthForm({ username: '', password: '', confirmPassword: '', email: '', newPassword: '', confirmNewPassword: '' });
    } catch (err) {
      showAlert(`Password reset failed: ${err.message}`);
    }
  }

  async function handleResetPassword() {
    try {
      if (!authForm.newPassword) {
        showAlert('Please enter new password!');
        return;
      }
      if (authForm.newPassword.length < 6) {
        showAlert('Password must be at least 6 characters long!');
        return;
      }
      if (authForm.newPassword !== authForm.confirmNewPassword) {
        showAlert('Passwords do not match!');
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: authForm.newPassword
      });

      if (error) throw error;

      showAlert('Password successfully changed! Please login with your new password.');
      setIsResettingPassword(false);
      
      // Очищаем URL ПОСЛЕ успешного сброса
      window.history.replaceState({}, document.title, window.location.pathname);
      
      setAuthMode('login');
      setAuthForm({ username: '', password: '', confirmPassword: '', email: '', newPassword: '', confirmNewPassword: '' });
    } catch (err) {
      showAlert(`Password reset failed: ${err.message}`);
    }
  }

  function handleLogout() {
    supabase.auth.signOut();
    setCurrentUser(null);
    setIsAdmin(false);
    setAuthForm({ username: '', password: '', confirmPassword: '', email: '', newPassword: '', confirmNewPassword: '' });
    showAlert('Logged out successfully!');
  }

  // Проверяем текущую сессию при загрузке
  useEffect(() => {
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user && !isResettingPassword) {
        // Получаем данные пользователя из таблицы users
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (userData) {
          setCurrentUser(userData);
        }
      }
      setLoading(false);
    }

    checkSession();

    // Подписываемся на изменения состояния авторизации
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event);
      
      if (event === 'SIGNED_IN' && session?.user) {
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (userData) {
          setCurrentUser(userData);
        }
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setIsAdmin(false);
      } else if (event === 'PASSWORD_RECOVERY') {
        // Когда пользователь кликает на ссылку сброса пароля
        setIsResettingPassword(true);
        setAuthMode('reset');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isResettingPassword]);

  // Обработка URL параметров для подтверждения email и сброса пароля
  useEffect(() => {
    const handleAuthRedirect = async () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const type = hashParams.get('type');
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      
      console.log('Auth redirect params:', { type, accessToken, refreshToken });

      if (type === 'recovery' && accessToken) {
        // Устанавливаем сессию с токеном восстановления
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });

        if (error) {
          console.error('Error setting recovery session:', error);
          showAlert('Reset link is invalid or expired. Please request a new password reset link.');
          setAuthMode('forgot');
        } else {
          setIsResettingPassword(true);
          setAuthMode('reset');
        }
        
        // Очищаем URL
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (type === 'signup') {
        // Email подтвержден
        setAuthMode('email-confirmed');
        setEmailConfirmedCountdown(7);
        
        // Очищаем URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    };

    handleAuthRedirect();
  }, []);

  // Таймер обратного отсчета для подтверждения email
  useEffect(() => {
    if (authMode === 'email-confirmed' && emailConfirmedCountdown > 0) {
      const timer = setTimeout(() => {
        setEmailConfirmedCountdown(emailConfirmedCountdown - 1);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else if (authMode === 'email-confirmed' && emailConfirmedCountdown === 0) {
      setAuthMode('login');
    }
  }, [authMode, emailConfirmedCountdown]);

  async function loadInitialData() {
    try {
      setLoading(true);
      setError(null);

      const { data: settings, error: settingsError } = await supabase
        .from('settings')
        .select('*');
      
      if (settingsError) throw settingsError;

      const { data: holidays, error: holidaysError } = await supabase
        .from('holiday_days')
        .select('*');
      
      if (holidaysError && holidaysError.code !== 'PGRST116') {
        console.warn('Holiday days table not found, continuing without it');
      }

      const { data: workingWeekendsData, error: workingWeekendsError } = await supabase
        .from('working_weekends')
        .select('*');
      
      if (workingWeekendsError && workingWeekendsError.code !== 'PGRST116') {
        console.warn('Working weekends table not found, continuing without it');
      }

      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select(`
          *,
          project_comments(*),
          project_history(*),
          project_cameras(*)
        `)
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;

      const transformedProjects = (projects || []).map(project => ({
        id: project.id,
        name: project.name,
        status: project.status,
        startDate: project.start_date,
        dueDate: project.due_date,
        busy: project.busy,
        priority: project.priority,
        color: project.color || null,
        comments: (project.project_comments || []).map(comment => ({
          id: comment.id,
          text: comment.text,
          ignored: comment.ignored,
          deleted: comment.deleted,
          ts: comment.created_at,
          creator: comment.creator || 'Unknown',
          editor: comment.editor || null
        })),
        history: (project.project_history || [])
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .map(h => h.entry),
        cameras: (project.project_cameras || [])
          .map(cam => ({
            id: cam.id,
            name: cam.name,
            stage: cam.stage || 'WIP'
          }))
          .sort((a, b) => a.name.localeCompare(b.name))
      }));

      const totalArtists = settings?.find(s => s.key === 'totalArtists')?.value || 6;
      
      const holidaySet = new Set();
      if (holidays && holidays.length > 0) {
        holidays.forEach(holiday => {
          holidaySet.add(holiday.date);
        });
      }
      setHolidayDays(holidaySet);

      const workingWeekendsSet = new Set();
      if (workingWeekendsData && workingWeekendsData.length > 0) {
        workingWeekendsData.forEach(weekend => {
          workingWeekendsSet.add(weekend.date);
        });
      }
      setWorkingWeekends(workingWeekendsSet);

      setState({
        totalArtists: parseInt(totalArtists),
        projects: transformedProjects
      });

      setLastSync(new Date());
    } catch (err) {
      setError(`Failed to load data: ${err.message}`);
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function saveProject(projectData) {
    try {
      const { data, error } = await supabase
        .from('projects')
        .upsert({
          id: projectData.id,
          name: projectData.name,
          status: projectData.status,
          start_date: projectData.startDate,
          due_date: projectData.dueDate,
          busy: projectData.busy,
          priority: projectData.priority,
          ...(projectData.color && { color: projectData.color })
        })
        .select();

      if (error) throw error;
      return data[0];
    } catch (err) {
      if (err.message?.includes("color")) {
        const { data, error } = await supabase
          .from('projects')
          .upsert({
            id: projectData.id,
            name: projectData.name,
            status: projectData.status,
            start_date: projectData.startDate,
            due_date: projectData.dueDate,
            busy: projectData.busy,
            priority: projectData.priority
          })
          .select();
        
        if (error) throw error;
        return data[0];
      }
      throw err;
    }
  }

  async function saveTotalArtists(newTotal) {
    try {
      const { error } = await supabase
        .from('settings')
        .upsert({
          key: 'totalArtists',
          value: newTotal.toString()
        });

      if (error) throw error;
    } catch (err) {
      throw new Error(`Failed to save total artists: ${err.message}`);
    }
  }

  async function saveHolidayDay(date, isHoliday) {
    try {
      if (isHoliday) {
        const { error } = await supabase
          .from('holiday_days')
          .upsert({ date });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('holiday_days')
          .delete()
          .eq('date', date);
        if (error) throw error;
      }
    } catch (err) {
      console.warn('Holiday days table not found. Please create it in Supabase first.');
      throw new Error('Holiday days table not found. Please create the table first in Supabase.');
    }
  }

  async function saveWorkingWeekend(date, isWorkingWeekend) {
    try {
      if (isWorkingWeekend) {
        const { error } = await supabase
          .from('working_weekends')
          .upsert({ date });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('working_weekends')
          .delete()
          .eq('date', date);
        if (error) throw error;
      }
    } catch (err) {
      console.warn('Working weekends table not found. Please create it in Supabase first.');
      throw new Error('Working weekends table not found. Please create the table first in Supabase.');
    }
  }

  async function addHistoryEntry(projectId, entry) {
    const username = currentUser?.username || 'Unknown';
    const entryWithUser = isAdmin ? entry : `${entry} - ${username}`;
    
    const { error } = await supabase
      .from('project_history')
      .insert({
        project_id: projectId,
        entry: entryWithUser
      });

    if (error) throw error;
  }

  async function saveComment(projectId, comment) {
    const { data, error } = await supabase
      .from('project_comments')
      .upsert({
        id: comment.id,
        project_id: projectId,
        text: comment.text,
        ignored: comment.ignored,
        deleted: comment.deleted,
        creator: comment.creator,
        editor: comment.editor
      })
      .select();

    if (error) throw error;
    return data[0];
  }

  async function deleteProjectFromDB(projectId) {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (error) throw error;
  }

  async function saveCamera(projectId, camera) {
    try {
      const { data, error } = await supabase
        .from('project_cameras')
        .upsert({
          id: camera.id,
          project_id: projectId,
          name: camera.name,
          stage: camera.stage
        })
        .select();

      if (error) throw error;
      return data[0];
    } catch (err) {
      console.error('Save camera error:', err);
      throw err;
    }
  }

  async function deleteCameraFromDB(cameraId) {
    try {
      const { error } = await supabase
        .from('project_cameras')
        .delete()
        .eq('id', cameraId);

      if (error) throw error;
    } catch (err) {
      console.error('Delete camera error:', err);
      throw err;
    }
  }

  useEffect(() => {
    if (currentUser) {
      loadInitialData();
    }
  }, [currentUser]);

  useEffect(() => {
    const interval = setInterval(() => {
      setConnected(prev => {
        if (Math.random() > 0.98) {
          setTimeout(() => setConnected(true), 1000 + Math.random() * 2000);
          return false;
        }
        return true;
      });

      if (connected) {
        setLastSync(new Date());
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [connected]);

  const total = state.totalArtists;
  const busy = state.projects.reduce((s, p) => s + (p.status === 'Completed' ? 0 : p.busy), 0);
  const free = total - busy;
  const freePct = Math.round((free / total) * 100);

  const activeProjects = state.projects.filter(p => p.status !== 'Completed');
  const archivedProjects = state.projects.filter(p => p.status === 'Completed');

  const sortedActiveProjects = [...activeProjects].sort((a, b) => {
    const priorityOrder = { 'High': 1, 'Medium': 2, 'Low': 3 };
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return a.name.localeCompare(b.name);
  });

  function showAlert(message) {
    setAlertMessage(message);
    setIsAlertOpen(true);
    setTimeout(() => setIsAlertOpen(false), 5000);
  }

  function showDateValidationModal(message, callback) {
    setDateValidationModal({ open: true, message, callback });
  }

  function closeDateValidationModal() {
    setDateValidationModal({ open: false, message: '', callback: null });
  }

  function showConfirmDeleteModal(projectId) {
    setConfirmDeleteModal({ open: true, projectId });
  }

  function closeConfirmDeleteModal() {
    setConfirmDeleteModal({ open: false, projectId: null });
  }

  function showConfirmCompleteModal(projectId) {
    setConfirmCompleteModal({ open: true, projectId });
  }

  function closeConfirmCompleteModal() {
    setConfirmCompleteModal({ open: false, projectId: null });
  }

  async function updateTotalArtists(delta) {
    try {
      const newTotal = Math.max(1, state.totalArtists + delta);
      
      if (newTotal < busy) {
        showAlert("These artists are busy!");
        return;
      }
      
      await saveTotalArtists(newTotal);
      setState(prev => ({ ...prev, totalArtists: newTotal }));
      setLastSync(new Date());
      showAlert(`Total artists updated to ${newTotal}!`);
    } catch (err) {
      setError(`Failed to update total artists: ${err.message}`);
    }
  }

  async function toggleHolidayDay(dayKey) {
    if (!isAdmin) return;

    try {
      const isCurrentlyHoliday = holidayDays.has(dayKey);
      const newIsHoliday = !isCurrentlyHoliday;

      await saveHolidayDay(dayKey, newIsHoliday);

      setHolidayDays(prev => {
        const newSet = new Set(prev);
        if (newIsHoliday) {
          newSet.add(dayKey);
        } else {
          newSet.delete(dayKey);
        }
        return newSet;
      });

      setLastSync(new Date());
    } catch (err) {
      setError(`Failed to toggle holiday: ${err.message}`);
    }
  }

  async function toggleWorkingWeekend(dayKey) {
    if (!isAdmin) return;

    try {
      const isCurrentlyWorkingWeekend = workingWeekends.has(dayKey);
      const newIsWorkingWeekend = !isCurrentlyWorkingWeekend;

      await saveWorkingWeekend(dayKey, newIsWorkingWeekend);

      setWorkingWeekends(prev => {
        const newSet = new Set(prev);
        if (newIsWorkingWeekend) {
          newSet.add(dayKey);
        } else {
          newSet.delete(dayKey);
        }
        return newSet;
      });

      setLastSync(new Date());
    } catch (err) {
      setError(`Failed to toggle working weekend: ${err.message}`);
    }
  }

  function handleAdminToggle() {
    if (!isAdmin) {
      setPasswordModal(true);
    } else {
      setIsAdmin(false);
    }
  }

  function checkPassword() {
    if (passwordInput === 'Zigert22@') {
      setIsAdmin(true);
      setPasswordModal(false);
      setPasswordInput('');
    } else {
      showAlert('Incorrect password!');
      setPasswordInput('');
    }
  }

  async function updateProject(id, changes, historyEntry) {
    try {
      const project = state.projects.find(p => p.id === id);
      if (!project) return;

      if (changes.busy !== undefined) {
        const newBusy = parseInt(changes.busy);
        if ((project.status === 'Queued' || project.status === 'Waiting') && newBusy > 0) {
          changes.status = 'In Progress';
        } else if (project.status === 'In Progress' && newBusy === 0) {
          changes.status = 'Queued';
        }
        if ((project.status === 'Hold' || project.status === 'Completed') && newBusy > 0) {
          showAlert("Check project status!");
          return;
        }
      }

      if (changes.status !== undefined) {
        if (changes.status === 'Hold' || changes.status === 'Completed' || changes.status === 'Waiting') {
          changes.busy = 0;
        }
        if (changes.status === 'Queued' && project.status !== 'Queued') {
          changes.busy = 0;
        }
        if (changes.status === 'In Progress' && project.status !== 'In Progress' && project.busy === 0) {
          changes.busy = 1;
        }
      }

      if (changes.busy !== undefined) {
        const currentBusy = project.busy;
        const newBusyTotal = busy - currentBusy + parseInt(changes.busy);
        if (newBusyTotal > total) {
          showAlert("Not enough artists!");
          return;
        }
      }

      const updatedProject = { ...project, ...changes };
      await saveProject(updatedProject);

      if (historyEntry) {
        const username = currentUser?.username || 'Unknown';
        const entry = isAdmin ? `${historyEntry} [Admin]` : `${historyEntry} - ${username}`;
        await addHistoryEntry(id, entry);
      }

      setState(prev => ({
        ...prev,
        projects: prev.projects.map(p => p.id === id ? ({
          ...p,
          ...changes,
          history: historyEntry ? [isAdmin ? `${historyEntry} [Admin]` : `${historyEntry} - ${currentUser?.username || 'Unknown'}`, ...(p.history || [])] : p.history
        }) : p)
      }));

      setLastSync(new Date());
      
    } catch (err) {
      setError(`Failed to update project: ${err.message}`);
      console.error('Update error:', err);
    }
  }

  async function addProject() {
    try {
      if (!newProject.name.trim()) {
        showAlert("Specify project name!");
        return;
      }

      const newBusy = parseInt(newProject.busy) || 0;
      if (busy + newBusy > total) {
        showAlert("Not enough artists!");
        return;
      }

      const newP = {
        id: uid('p'),
        name: newProject.name || 'New Project',
        status: newProject.status,
        startDate: newProject.startDate,
        dueDate: newProject.dueDate,
        busy: newBusy,
        priority: newProject.priority,
        color: newProject.color,
        comments: [],
        history: [],
        cameras: []
      };

      await saveProject(newP);
      const username = currentUser?.username || 'Unknown';
      const historyEntry = `${new Date().toLocaleString()}: Project created${isAdmin ? ' [Admin]' : ` - ${username}`}`;
      await addHistoryEntry(newP.id, historyEntry);

      setState(prev => ({ 
        ...prev, 
        projects: [{ ...newP, history: [historyEntry] }, ...prev.projects] 
      }));

      setIsAddModalOpen(false);
      setNewProject({
        name: '',
        status: 'Waiting',
        startDate: new Date().toISOString().slice(0, 10),
        dueDate: new Date().toISOString().slice(0, 10),
        busy: 0,
        priority: 'Low',
        color: '#8D6E63'
      });

      setLastSync(new Date());

    } catch (err) {
      setError(`Failed to add project: ${err.message}`);
      console.error('Add project error:', err);
    }
  }

  async function deleteProject(id) {
    try {
      await deleteProjectFromDB(id);
      setState(prev => ({ ...prev, projects: prev.projects.filter(p => p.id !== id) }));
      setLastSync(new Date());
      closeConfirmDeleteModal();
    } catch (err) {
      setError(`Failed to delete project: ${err.message}`);
      console.error('Delete error:', err);
    }
  }

  async function completeProject(id) {
    updateProject(id, { status: 'Completed' }, `${new Date().toLocaleString()}: Marked Completed`);
    closeConfirmCompleteModal();
  }

  function toggleImagesExpanded(projectId) {
    setExpandedImages(prev => {
      const newExpanded = { ...prev, [projectId]: !prev[projectId] };
      return newExpanded;
    });
  }

  function startImageTimer(projectId) {
    clearImageTimer(projectId);
    const timer = setTimeout(() => {
      setExpandedImages(prev => ({ ...prev, [projectId]: false }));
    }, 10000);
    setImageTimers(prev => ({ ...prev, [projectId]: timer }));
  }

  function clearImageTimer(projectId) {
    if (imageTimers[projectId]) {
      clearTimeout(imageTimers[projectId]);
      setImageTimers(prev => {
        const newTimers = { ...prev };
        delete newTimers[projectId];
        return newTimers;
      });
    }
  }

  async function addCamera(projectId, cameraName) {
    try {
      if (!cameraName.trim()) {
        showAlert("Please enter camera name!");
        return;
      }

      const newCamera = {
        id: uid('cam'),
        name: cameraName.trim(),
        stage: 'WIP'
      };

      const savedCamera = await saveCamera(projectId, newCamera);
      
      setState(prev => ({
        ...prev,
        projects: prev.projects.map(p => 
          p.id === projectId 
            ? { ...p, cameras: [...p.cameras, { ...savedCamera }] }
            : p
        )
      }));

      setLastSync(new Date());
      showAlert(`Camera ${cameraName} added!`);
    } catch (err) {
      setError(`Failed to add camera: ${err.message}`);
    }
  }

  async function updateCameraStage(projectId, cameraId, newStage) {
    try {
      const project = state.projects.find(p => p.id === projectId);
      if (!project) return;

      const camera = project.cameras.find(c => c.id === cameraId);
      if (!camera) return;

      const updatedCamera = { ...camera, stage: newStage };
      await saveCamera(projectId, updatedCamera);

      setState(prev => ({
        ...prev,
        projects: prev.projects.map(p => 
          p.id === projectId 
            ? { 
                ...p, 
                cameras: p.cameras.map(c => 
                  c.id === cameraId ? { ...c, stage: newStage } : c
                ) 
              }
            : p
        )
      }));

      setLastSync(new Date());
    } catch (err) {
      setError(`Failed to update camera stage: ${err.message}`);
    }
  }

  async function editCamera(projectId, cameraId, newName) {
    try {
      if (!newName.trim()) {
        showAlert("Please enter camera name!");
        return;
      }

      const project = state.projects.find(p => p.id === projectId);
      if (!project) return;

      const camera = project.cameras.find(c => c.id === cameraId);
      if (!camera) return;

      const updatedCamera = { ...camera, name: newName.trim() };
      await saveCamera(projectId, updatedCamera);

      setState(prev => ({
        ...prev,
        projects: prev.projects.map(p => 
          p.id === projectId 
            ? { 
                ...p, 
                cameras: p.cameras.map(c => 
                  c.id === cameraId ? { ...c, name: newName.trim() } : c
                ) 
              }
            : p
        )
      }));

      setLastSync(new Date());
      showAlert(`Camera renamed to ${newName.trim()}!`);
    } catch (err) {
      setError(`Failed to edit camera: ${err.message}`);
    }
  }

  async function deleteCamera(projectId, cameraId) {
    try {
      await deleteCameraFromDB(cameraId);
      
      setState(prev => ({
        ...prev,
        projects: prev.projects.map(p => 
          p.id === projectId 
            ? { ...p, cameras: p.cameras.filter(c => c.id !== cameraId) }
            : p
        )
      }));

      setLastSync(new Date());
      showAlert('Camera deleted!');
    } catch (err) {
      setError(`Failed to delete camera: ${err.message}`);
    }
  }

  async function addComment() {
    if (!draft.trim()) return;

    try {
      const newComment = {
        id: uid('c'),
        text: draft,
        ignored: false,
        deleted: false,
        ts: new Date().toISOString(),
        creator: currentUser?.username || 'Unknown',
        editor: null
      };

      const savedComment = await saveComment(commentsForId, newComment);

      setState(prev => ({
        ...prev,
        projects: prev.projects.map(p => 
          p.id === commentsForId 
            ? { ...p, comments: [...p.comments, { ...savedComment }] }
            : p
        )
      }));

      setDraft('');
      setCommentsForId(null);
      setLastSync(new Date());
    } catch (err) {
      setError(`Failed to add comment: ${err.message}`);
    }
  }

  async function updateComment(id, changes) {
    try {
      const updatedComment = await saveComment(commentsForId, changes);

      setState(prev => ({
        ...prev,
        projects: prev.projects.map(p => 
          p.id === commentsForId 
            ? { 
                ...p, 
                comments: p.comments.map(c => 
                  c.id === id ? { ...c, ...changes } : c
                ) 
              }
            : p
        )
      }));

      setLastSync(new Date());
    } catch (err) {
      setError(`Failed to update comment: ${err.message}`);
    }
  }

  async function deleteComment(id) {
    try {
      const comment = state.projects
        .find(p => p.id === commentsForId)
        ?.comments.find(c => c.id === id);
      
      if (comment) {
        if (isAdmin) {
          await updateComment(id, { deleted: true });
        } else {
          await updateComment(id, { ignored: true });
        }
      }
    } catch (err) {
      setError(`Failed to delete comment: ${err.message}`);
    }
  }

  async function clearAllComments() {
    try {
      const comments = state.projects.find(p => p.id === clearCommentsModal)?.comments || [];
      
      for (const comment of comments) {
        if (isAdmin) {
          await updateComment(comment.id, { deleted: true });
        } else {
          await updateComment(comment.id, { ignored: true });
        }
      }

      setClearCommentsModal(null);
    } catch (err) {
      setError(`Failed to clear comments: ${err.message}`);
    }
  }

  async function clearAllHistory() {
    try {
      const { error } = await supabase
        .from('project_history')
        .delete()
        .eq('project_id', clearHistoryModal);

      if (error) throw error;

      setState(prev => ({
        ...prev,
        projects: prev.projects.map(p => 
          p.id === clearHistoryModal ? { ...p, history: [] } : p
        )
      }));

      setClearHistoryModal(null);
      setLastSync(new Date());
    } catch (err) {
      setError(`Failed to clear history: ${err.message}`);
    }
  }

  async function updateProjectColor(projectId, color) {
    try {
      await updateProject(projectId, { color }, `${new Date().toLocaleString()}: Color changed to ${color}`);
      setColorPickerModal({ open: false, projectId: null, currentColor: '#8D6E63' });
    } catch (err) {
      setError(`Failed to update project color: ${err.message}`);
    }
  }

  function handleMonthChange(delta) {
    setCurrentDate(prev => {
      let newMonth = prev.month + delta;
      let newYear = prev.year;
      
      if (newMonth < 0) {
        newMonth = 11;
        newYear--;
      } else if (newMonth > 11) {
        newMonth = 0;
        newYear++;
      }
      
      return { month: newMonth, year: newYear };
    });
  }

  function isWeekend(date) {
    const day = date.getDay();
    return day === 0 || day === 6;
  }

  function isHoliday(date) {
    const key = formatDateToYYYYMMDD(date);
    return holidayDays.has(key);
  }

  function isWorkingWeekend(date) {
    const key = formatDateToYYYYMMDD(date);
    return workingWeekends.has(key);
  }

  function getDayType(date) {
    if (isHoliday(date)) return 'holiday';
    if (isWeekend(date) && !isWorkingWeekend(date)) return 'weekend';
    return 'workday';
  }

  function getDayClass(date) {
    const type = getDayType(date);
    return `day ${type}`;
  }

  function getDayTitle(date) {
    const type = getDayType(date);
    const dateStr = date.toLocaleDateString();
    
    if (type === 'holiday') return `${dateStr} - Holiday`;
    if (type === 'weekend') return `${dateStr} - Weekend`;
    return dateStr;
  }

  const days = getMonthDays(currentDate.year, currentDate.month);
  const monthName = new Date(currentDate.year, currentDate.month).toLocaleString('default', { month: 'long' });

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px',
        color: '#666'
      }}>
        Loading...
      </div>
    );
  }

  // AUTH UI
  if (!currentUser) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px'
      }}>
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '12px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
          width: '100%',
          maxWidth: '400px'
        }}>
          <h2 style={{ 
            textAlign: 'center', 
            marginBottom: '30px',
            color: '#333',
            fontSize: '28px',
            fontWeight: '600'
          }}>
            {authMode === 'login' && 'Login'}
            {authMode === 'register' && 'Create Account'}
            {authMode === 'forgot' && 'Reset Password'}
            {authMode === 'reset' && 'Set New Password'}
            {authMode === 'email-confirmed' && 'Email Confirmed!'}
          </h2>

          {authMode === 'email-confirmed' ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>✅</div>
              <p style={{ marginBottom: '20px', color: '#666', fontSize: '16px' }}>
                Your email has been successfully confirmed!
              </p>
              <p style={{ color: '#999', fontSize: '14px' }}>
                Redirecting to login in {emailConfirmedCountdown} seconds...
              </p>
            </div>
          ) : (
            <>
              {authMode === 'reset' && (
                <p style={{ 
                  marginBottom: '20px', 
                  color: '#666',
                  fontSize: '14px',
                  textAlign: 'center'
                }}>
                  Please enter your new password below.
                </p>
              )}

              <div style={{ marginBottom: '20px' }}>
                {authMode !== 'reset' && authMode !== 'forgot' && (
                  <input
                    type="text"
                    placeholder="Username"
                    value={authForm.username}
                    onChange={(e) => setAuthForm(prev => ({ ...prev, username: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      fontSize: '16px',
                      marginBottom: '16px',
                      boxSizing: 'border-box'
                    }}
                  />
                )}
                
                {(authMode === 'register' || authMode === 'forgot') && (
                  <input
                    type="email"
                    placeholder="Email"
                    value={authForm.email}
                    onChange={(e) => setAuthForm(prev => ({ ...prev, email: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      fontSize: '16px',
                      marginBottom: '16px',
                      boxSizing: 'border-box'
                    }}
                  />
                )}

                {(authMode === 'login' || authMode === 'register') && (
                  <div style={{ position: 'relative', marginBottom: '16px' }}>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      value={authForm.password}
                      onChange={(e) => setAuthForm(prev => ({ ...prev, password: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        paddingRight: '40px',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '16px',
                        boxSizing: 'border-box'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#666'
                      }}
                    >
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                )}

                {authMode === 'register' && (
                  <div style={{ position: 'relative', marginBottom: '16px' }}>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm Password"
                      value={authForm.confirmPassword}
                      onChange={(e) => setAuthForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        paddingRight: '40px',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '16px',
                        boxSizing: 'border-box'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#666'
                      }}
                    >
                      {showConfirmPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                )}

                {authMode === 'reset' && (
                  <>
                    <div style={{ position: 'relative', marginBottom: '16px' }}>
                      <input
                        type={showNewPassword ? "text" : "password"}
                        placeholder="New Password"
                        value={authForm.newPassword}
                        onChange={(e) => setAuthForm(prev => ({ ...prev, newPassword: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          paddingRight: '40px',
                          border: '1px solid #ddd',
                          borderRadius: '8px',
                          fontSize: '16px',
                          boxSizing: 'border-box'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        style={{
                          position: 'absolute',
                          right: '10px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#666'
                        }}
                      >
                        {showNewPassword ? '🙈' : '👁️'}
                      </button>
                    </div>
                    <div style={{ position: 'relative', marginBottom: '16px' }}>
                      <input
                        type={showConfirmNewPassword ? "text" : "password"}
                        placeholder="Confirm New Password"
                        value={authForm.confirmNewPassword}
                        onChange={(e) => setAuthForm(prev => ({ ...prev, confirmNewPassword: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          paddingRight: '40px',
                          border: '1px solid #ddd',
                          borderRadius: '8px',
                          fontSize: '16px',
                          boxSizing: 'border-box'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                        style={{
                          position: 'absolute',
                          right: '10px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#666'
                        }}
                      >
                        {showConfirmNewPassword ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={() => {
                  if (authMode === 'login') handleLogin();
                  if (authMode === 'register') handleRegister();
                  if (authMode === 'forgot') handleForgotPassword();
                  if (authMode === 'reset') handleResetPassword();
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  marginBottom: '16px'
                }}
              >
                {authMode === 'login' && 'Login'}
                {authMode === 'register' && 'Create Account'}
                {authMode === 'forgot' && 'Send Reset Link'}
                {authMode === 'reset' && 'Reset Password'}
              </button>

              <div style={{ textAlign: 'center' }}>
                {authMode === 'login' && (
                  <>
                    <p style={{ marginBottom: '10px', color: '#666' }}>
                      Don't have an account?{' '}
                      <button
                        onClick={() => setAuthMode('register')}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#667eea',
                          cursor: 'pointer',
                          textDecoration: 'underline'
                        }}
                      >
                        Sign up
                      </button>
                    </p>
                    <p style={{ color: '#666' }}>
                      Forgot your password?{' '}
                      <button
                        onClick={() => setAuthMode('forgot')}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#667eea',
                          cursor: 'pointer',
                          textDecoration: 'underline'
                        }}
                      >
                        Reset it here
                      </button>
                    </p>
                  </>
                )}
                {(authMode === 'register' || authMode === 'forgot' || authMode === 'reset') && (
                  <p style={{ color: '#666' }}>
                    Back to{' '}
                    <button
                      onClick={() => setAuthMode('login')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#667eea',
                        cursor: 'pointer',
                        textDecoration: 'underline'
                      }}
                    >
                      Login
                    </button>
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        {isAlertOpen && (
          <div style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: '#ff4444',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            zIndex: 10000
          }}>
            {alertMessage}
          </div>
        )}
      </div>
    );
  }

  // MAIN DASHBOARD UI
  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '28px', color: '#333' }}>Project Status Dashboard</h1>
          <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
            Connected: {connected ? '✅' : '❌'} | Last sync: {lastSync.toLocaleTimeString()}
            {currentUser && (
              <span style={{ marginLeft: '10px' }}>
                Welcome, {currentUser.username}! 
                <button 
                  onClick={handleLogout}
                  style={{
                    marginLeft: '10px',
                    background: 'none',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    padding: '2px 8px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Logout
                </button>
              </span>
            )}
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button 
            onClick={handleAdminToggle}
            style={{
              padding: '8px 16px',
              background: isAdmin ? '#ff4444' : '#666',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            {isAdmin ? 'Admin Mode ON' : 'Admin Mode OFF'}
          </button>
          
          <button 
            onClick={() => setIsAddModalOpen(true)}
            style={{
              padding: '8px 16px',
              background: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            + Add Project
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          background: '#ff4444',
          color: 'white',
          padding: '12px',
          borderRadius: '6px',
          marginBottom: '20px'
        }}>
          {error}
          <button 
            onClick={() => setError(null)}
            style={{
              marginLeft: '10px',
              background: 'none',
              border: '1px solid white',
              color: 'white',
              borderRadius: '4px',
              padding: '2px 8px',
              cursor: 'pointer'
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '15px',
        marginBottom: '20px'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '20px',
          borderRadius: '10px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>Total Artists</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', margin: '8px 0' }}>
            {state.totalArtists}
            {isAdmin && (
              <>
                <button 
                  onClick={() => updateTotalArtists(-1)}
                  style={{
                    marginLeft: '10px',
                    background: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    width: '24px',
                    height: '24px',
                    cursor: 'pointer'
                  }}
                >-</button>
                <button 
                  onClick={() => updateTotalArtists(1)}
                  style={{
                    marginLeft: '5px',
                    background: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    width: '24px',
                    height: '24px',
                    cursor: 'pointer'
                  }}
                >+</button>
              </>
            )}
          </div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          color: 'white',
          padding: '20px',
          borderRadius: '10px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>Busy Artists</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', margin: '8px 0' }}>{busy}</div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
          color: 'white',
          padding: '20px',
          borderRadius: '10px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>Free Artists</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', margin: '8px 0' }}>{free}</div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
          color: 'white',
          padding: '20px',
          borderRadius: '10px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>Free %</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', margin: '8px 0' }}>{freePct}%</div>
        </div>
      </div>

      {/* Calendar */}
      <div style={{
        background: 'white',
        border: '1px solid #e0e0e0',
        borderRadius: '10px',
        padding: '20px',
        marginBottom: '20px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '15px'
        }}>
          <h3 style={{ margin: 0, color: '#333' }}>
            {monthName} {currentDate.year}
          </h3>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={() => handleMonthChange(-1)}
              style={{
                padding: '5px 10px',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              ← Prev
            </button>
            <button 
              onClick={() => setCurrentDate({
                month: new Date().getMonth(),
                year: new Date().getFullYear()
              })}
              style={{
                padding: '5px 10px',
                background: '#666',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Today
            </button>
            <button 
              onClick={() => handleMonthChange(1)}
              style={{
                padding: '5px 10px',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Next →
            </button>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '8px',
          textAlign: 'center'
        }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} style={{ 
              fontWeight: 'bold', 
              color: '#666',
              padding: '8px',
              fontSize: '14px'
            }}>
              {day}
            </div>
          ))}
          
          {days.map(day => {
            const dayKey = formatDateToYYYYMMDD(day);
            const dayClass = getDayClass(day);
            const dayTitle = getDayTitle(day);
            const isToday = day.toDateString() === new Date().toDateString();
            
            return (
              <div
                key={dayKey}
                className={dayClass}
                title={dayTitle}
                onClick={() => isAdmin && toggleHolidayDay(dayKey)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  if (isAdmin && isWeekend(day)) {
                    toggleWorkingWeekend(dayKey);
                  }
                }}
                style={{
                  padding: '10px',
                  borderRadius: '6px',
                  cursor: isAdmin ? 'pointer' : 'default',
                  position: 'relative',
                  border: isToday ? '2px solid #667eea' : '1px solid #e0e0e0',
                  background: 
                    getDayType(day) === 'holiday' ? '#ffebee' :
                    getDayType(day) === 'weekend' ? '#f5f5f5' : 'white',
                  color: 
                    getDayType(day) === 'holiday' ? '#d32f2f' :
                    getDayType(day) === 'weekend' ? '#666' : '#333',
                  fontWeight: isToday ? 'bold' : 'normal'
                }}
              >
                {day.getDate()}
                {isAdmin && isWeekend(day) && isWorkingWeekend(day) && (
                  <div style={{
                    position: 'absolute',
                    top: '2px',
                    right: '2px',
                    width: '6px',
                    height: '6px',
                    background: '#4CAF50',
                    borderRadius: '50%'
                  }} />
                )}
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: '15px', fontSize: '12px', color: '#666', textAlign: 'center' }}>
          {isAdmin && (
            <>
              • Click on a day to mark/unmark as holiday<br/>
              • Right-click on weekends to mark/unmark as working weekend
            </>
          )}
        </div>
      </div>

      {/* Active Projects */}
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ 
          color: '#333', 
          marginBottom: '15px',
          paddingBottom: '8px',
          borderBottom: '2px solid #667eea'
        }}>
          Active Projects ({activeProjects.length})
        </h2>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: '20px'
        }}>
          {sortedActiveProjects.map(project => (
            <div 
              key={project.id}
              style={{
                background: 'white',
                border: `2px solid ${getProjectColor(project)}`,
                borderRadius: '10px',
                padding: '15px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
            >
              {/* Project Header */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'flex-start',
                marginBottom: '10px'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    marginBottom: '5px'
                  }}>
                    <h3 style={{ 
                      margin: 0, 
                      fontSize: '18px',
                      color: '#333',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      if (isAdmin) {
                        setProjectNameModal({
                          open: true,
                          projectId: project.id,
                          name: project.name
                        });
                      }
                    }}
                    title={isAdmin ? "Click to edit project name" : ""}
                    >
                      {project.name}
                    </h3>
                    {isAdmin && (
                      <button
                        onClick={() => setColorPickerModal({
                          open: true,
                          projectId: project.id,
                          currentColor: getProjectColor(project)
                        })}
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          border: '2px solid white',
                          background: getProjectColor(project),
                          cursor: 'pointer',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                        }}
                        title="Change project color"
                      />
                    )}
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    gap: '8px', 
                    flexWrap: 'wrap',
                    fontSize: '12px'
                  }}>
                    <span style={{
                      padding: '2px 8px',
                      background: project.priority === 'High' ? '#ff4444' : 
                                 project.priority === 'Medium' ? '#ffa700' : '#4CAF50',
                      color: 'white',
                      borderRadius: '12px',
                      fontWeight: 'bold'
                    }}>
                      {project.priority}
                    </span>
                    
                    <span style={{
                      padding: '2px 8px',
                      background: project.status === 'In Progress' ? '#4CAF50' :
                                 project.status === 'Queued' ? '#2196F3' :
                                 project.status === 'Hold' ? '#ff9800' : '#666',
                      color: 'white',
                      borderRadius: '12px',
                      fontWeight: 'bold'
                    }}>
                      {project.status}
                    </span>
                  </div>
                </div>

                {isAdmin && (
                  <div style={{ display: 'flex', gap: '5px', flexDirection: 'column' }}>
                    <button
                      onClick={() => showConfirmCompleteModal(project.id)}
                      style={{
                        padding: '4px 8px',
                        background: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '11px',
                        cursor: 'pointer'
                      }}
                    >
                      Complete
                    </button>
                    <button
                      onClick={() => showConfirmDeleteModal(project.id)}
                      style={{
                        padding: '4px 8px',
                        background: '#ff4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '11px',
                        cursor: 'pointer'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>

              {/* Project Dates */}
              <div style={{ 
                fontSize: '12px', 
                color: '#666',
                marginBottom: '10px'
              }}>
                <div>Start: {formatDateForDisplay(project.startDate)}</div>
                <div>Due: {formatDateForDisplay(project.dueDate)}</div>
              </div>

              {/* Busy Artists */}
              <div style={{ marginBottom: '10px' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px',
                  fontSize: '14px'
                }}>
                  <span>Busy Artists:</span>
                  <select
                    value={project.busy}
                    onChange={(e) => {
                      const newBusy = parseInt(e.target.value);
                      if (newBusy === project.busy) return;
                      
                      if (busy - project.busy + newBusy > total) {
                        showAlert("Not enough artists!");
                        return;
                      }
                      
                      updateProject(
                        project.id, 
                        { busy: newBusy }, 
                        `${new Date().toLocaleString()}: Busy artists changed from ${project.busy} to ${newBusy}`
                      );
                    }}
                    disabled={!isAdmin && project.status === 'Hold'}
                    style={{
                      padding: '4px 8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      background: 'white'
                    }}
                  >
                    {[...Array(total + 1).keys()].map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Cameras */}
              <div style={{ marginBottom: '10px' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <span style={{ fontSize: '14px', fontWeight: 'bold' }}>Cameras:</span>
                  {isAdmin && (
                    <button
                      onClick={() => setAddCameraModal({
                        open: true,
                        projectId: project.id,
                        cameraName: ''
                      })}
                      style={{
                        padding: '2px 6px',
                        background: '#667eea',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '11px',
                        cursor: 'pointer'
                      }}
                    >
                      + Add Camera
                    </button>
                  )}
                </div>
                
                {project.cameras && project.cameras.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {project.cameras.map(camera => (
                      <div 
                        key={camera.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '4px 8px',
                          background: '#f5f5f5',
                          borderRadius: '4px',
                          fontSize: '12px'
                        }}
                      >
                        <span style={{ flex: 1 }}>{camera.name}</span>
                        <select
                          value={camera.stage}
                          onChange={(e) => updateCameraStage(project.id, camera.id, e.target.value)}
                          style={{
                            padding: '2px 4px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            background: getStageColor(camera.stage),
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '11px'
                          }}
                        >
                          <option value="WIP">WIP</option>
                          <option value="ICD">ICD</option>
                          <option value="R1">R1</option>
                          <option value="R2">R2</option>
                          <option value="R3">R3</option>
                          <option value="R4">R4</option>
                          <option value="R5">R5</option>
                          <option value="Approved">Approved</option>
                        </select>
                        
                        {isAdmin && (
                          <div style={{ display: 'flex', gap: '2px' }}>
                            <button
                              onClick={() => setEditCameraModal({
                                open: true,
                                projectId: project.id,
                                cameraId: camera.id,
                                cameraName: camera.name
                              })}
                              style={{
                                padding: '1px 4px',
                                background: '#667eea',
                                color: 'white',
                                border: 'none',
                                borderRadius: '2px',
                                fontSize: '10px',
                                cursor: 'pointer'
                              }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => setDeleteCameraModal({
                                open: true,
                                projectId: project.id,
                                cameraId: camera.id,
                                cameraName: camera.name
                              })}
                              style={{
                                padding: '1px 4px',
                                background: '#ff4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '2px',
                                fontSize: '10px',
                                cursor: 'pointer'
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#999', 
                    fontStyle: 'italic',
                    textAlign: 'center',
                    padding: '8px'
                  }}>
                    No cameras added
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ 
                display: 'flex', 
                gap: '8px',
                marginBottom: '10px',
                flexWrap: 'wrap'
              }}>
                <button
                  onClick={() => setCommentsForId(project.id)}
                  style={{
                    padding: '6px 12px',
                    background: '#667eea',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    flex: 1
                  }}
                >
                  Comments ({project.comments.filter(c => !c.ignored && !c.deleted).length})
                </button>
                
                <button
                  onClick={() => setHistoryForId(project.id)}
                  style={{
                    padding: '6px 12px',
                    background: '#666',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    flex: 1
                  }}
                >
                  History ({project.history.length})
                </button>
              </div>

              {/* Status Controls */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr',
                gap: '5px'
              }}>
                {['In Progress', 'Queued', 'Hold', 'Waiting'].map(status => (
                  <button
                    key={status}
                    onClick={() => {
                      if (project.status === status) return;
                      updateProject(
                        project.id, 
                        { status }, 
                        `${new Date().toLocaleString()}: Status changed from ${project.status} to ${status}`
                      );
                    }}
                    disabled={project.status === status}
                    style={{
                      padding: '6px 4px',
                      background: project.status === status ? 
                                (status === 'In Progress' ? '#4CAF50' :
                                 status === 'Queued' ? '#2196F3' :
                                 status === 'Hold' ? '#ff9800' : '#666') : 
                                '#f0f0f0',
                      color: project.status === status ? 'white' : '#333',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '11px',
                      cursor: project.status === status ? 'default' : 'pointer'
                    }}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Archived Projects */}
      {archivedProjects.length > 0 && (
        <div style={{ marginBottom: '30px' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px',
            marginBottom: '15px',
            cursor: 'pointer'
          }}
          onClick={() => setIsArchiveExpanded(!isArchiveExpanded)}
          >
            <h2 style={{ 
              color: '#333', 
              margin: 0,
              paddingBottom: '8px',
              borderBottom: '2px solid #999'
            }}>
              Archived Projects ({archivedProjects.length})
            </h2>
            <span style={{ fontSize: '18px', color: '#666' }}>
              {isArchiveExpanded ? '▼' : '▶'}
            </span>
          </div>
          
          {isArchiveExpanded && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
              gap: '20px'
            }}>
              {archivedProjects.map(project => (
                <div 
                  key={project.id}
                  style={{
                    background: 'white',
                    border: `2px solid ${getProjectColor(project)}`,
                    borderRadius: '10px',
                    padding: '15px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    opacity: 0.8
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start',
                    marginBottom: '10px'
                  }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ 
                        margin: 0, 
                        fontSize: '18px',
                        color: '#333',
                        textDecoration: 'line-through'
                      }}>
                        {project.name}
                      </h3>
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#666',
                        marginTop: '5px'
                      }}>
                        Completed • {formatDateForDisplay(project.dueDate)}
                      </div>
                    </div>

                    {isAdmin && (
                      <button
                        onClick={() => showConfirmDeleteModal(project.id)}
                        style={{
                          padding: '4px 8px',
                          background: '#ff4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '11px',
                          cursor: 'pointer'
                        }}
                      >
                        Delete
                      </button>
                    )}
                  </div>

                  <div style={{ 
                    display: 'flex', 
                    gap: '8px',
                    marginBottom: '10px'
                  }}>
                    <button
                      onClick={() => setCommentsForId(project.id)}
                      style={{
                        padding: '6px 12px',
                        background: '#667eea',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        flex: 1
                      }}
                    >
                      Comments ({project.comments.filter(c => !c.ignored && !c.deleted).length})
                    </button>
                    
                    <button
                      onClick={() => setHistoryForId(project.id)}
                      style={{
                        padding: '6px 12px',
                        background: '#666',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        flex: 1
                      }}
                    >
                      History ({project.history.length})
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {isAddModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '30px',
            borderRadius: '10px',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Add New Project</h3>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Project Name *
              </label>
              <input
                type="text"
                value={newProject.name}
                onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
                placeholder="Enter project name"
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Priority
              </label>
              <select
                value={newProject.priority}
                onChange={(e) => setNewProject(prev => ({ ...prev, priority: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  background: 'white'
                }}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Status
              </label>
              <select
                value={newProject.status}
                onChange={(e) => setNewProject(prev => ({ ...prev, status: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  background: 'white'
                }}
              >
                <option value="Waiting">Waiting</option>
                <option value="Queued">Queued</option>
                <option value="In Progress">In Progress</option>
                <option value="Hold">Hold</option>
              </select>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Start Date
              </label>
              <input
                type="date"
                value={newProject.startDate}
                onChange={(e) => setNewProject(prev => ({ ...prev, startDate: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Due Date
              </label>
              <input
                type="date"
                value={newProject.dueDate}
                onChange={(e) => setNewProject(prev => ({ ...prev, dueDate: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Busy Artists
              </label>
              <select
                value={newProject.busy}
                onChange={(e) => setNewProject(prev => ({ ...prev, busy: parseInt(e.target.value) }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  background: 'white'
                }}
              >
                {[...Array(total + 1).keys()].map(num => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setIsAddModalOpen(false)}
                style={{
                  padding: '8px 16px',
                  background: '#666',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={addProject}
                style={{
                  padding: '8px 16px',
                  background: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Add Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comments Modal */}
      {commentsForId && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '10px',
            width: '90%',
            maxWidth: '600px',
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '15px'
            }}>
              <h3 style={{ margin: 0 }}>
                Comments for {state.projects.find(p => p.id === commentsForId)?.name}
              </h3>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                {isAdmin && (
                  <button
                    onClick={() => setClearCommentsModal(commentsForId)}
                    style={{
                      padding: '6px 12px',
                      background: '#ff4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    Clear All
                  </button>
                )}
                <button
                  onClick={() => setCommentsForId(null)}
                  style={{
                    padding: '6px 12px',
                    background: '#666',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Close
                </button>
              </div>
            </div>

            <div style={{
              flex: 1,
              overflow: 'auto',
              marginBottom: '15px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              padding: '10px'
            }}>
              {state.projects.find(p => p.id === commentsForId)?.comments
                .filter(c => !c.ignored && !c.deleted)
                .map(comment => (
                  <div 
                    key={comment.id}
                    style={{
                      padding: '8px',
                      borderBottom: '1px solid #eee',
                      background: comment.id === editingId ? '#f0f8ff' : 'transparent'
                    }}
                  >
                    {editingId === comment.id ? (
                      <div>
                        <textarea
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          style={{
                            width: '100%',
                            minHeight: '60px',
                            padding: '8px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '14px',
                            resize: 'vertical',
                            boxSizing: 'border-box'
                          }}
                        />
                        <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
                          <button
                            onClick={async () => {
                              await updateComment(comment.id, { 
                                text: editingText,
                                editor: currentUser?.username || 'Unknown'
                              });
                              setEditingId(null);
                              setEditingText('');
                            }}
                            style={{
                              padding: '4px 8px',
                              background: '#4CAF50',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '12px',
                              cursor: 'pointer'
                            }}
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setEditingId(null);
                              setEditingText('');
                            }}
                            style={{
                              padding: '4px 8px',
                              background: '#666',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '12px',
                              cursor: 'pointer'
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                          {comment.creator} • {new Date(comment.ts).toLocaleString()}
                          {comment.editor && ` (edited by ${comment.editor})`}
                        </div>
                        <div style={{ whiteSpace: 'pre-wrap', fontSize: '14px' }}>
                          {comment.text}
                        </div>
                        <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
                          {(isAdmin || comment.creator === currentUser?.username) && (
                            <button
                              onClick={() => {
                                setEditingId(comment.id);
                                setEditingText(comment.text);
                              }}
                              style={{
                                padding: '2px 6px',
                                background: '#667eea',
                                color: 'white',
                                border: 'none',
                                borderRadius: '2px',
                                fontSize: '10px',
                                cursor: 'pointer'
                              }}
                            >
                              Edit
                            </button>
                          )}
                          <button
                            onClick={() => deleteComment(comment.id)}
                            style={{
                              padding: '2px 6px',
                              background: '#ff4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '2px',
                              fontSize: '10px',
                              cursor: 'pointer'
                            }}
                          >
                            {isAdmin ? 'Delete' : 'Ignore'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              
              {state.projects.find(p => p.id === commentsForId)?.comments.filter(c => !c.ignored && !c.deleted).length === 0 && (
                <div style={{ 
                  textAlign: 'center', 
                  color: '#999', 
                  fontStyle: 'italic',
                  padding: '20px'
                }}>
                  No comments yet
                </div>
              )}
            </div>

            <div>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Add a comment..."
                style={{
                  width: '100%',
                  minHeight: '60px',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                  marginBottom: '10px'
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  onClick={() => setCommentsForId(null)}
                  style={{
                    padding: '8px 16px',
                    background: '#666',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={addComment}
                  disabled={!draft.trim()}
                  style={{
                    padding: '8px 16px',
                    background: draft.trim() ? '#4CAF50' : '#ccc',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: draft.trim() ? 'pointer' : 'not-allowed'
                  }}
                >
                  Add Comment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {historyForId && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '10px',
            width: '90%',
            maxWidth: '700px',
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '15px'
            }}>
              <h3 style={{ margin: 0 }}>
                History for {state.projects.find(p => p.id === historyForId)?.name}
              </h3>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                {isAdmin && (
                  <button
                    onClick={() => setClearHistoryModal(historyForId)}
                    style={{
                      padding: '6px 12px',
                      background: '#ff4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    Clear History
                  </button>
                )}
                <button
                  onClick={() => setHistoryForId(null)}
                  style={{
                    padding: '6px 12px',
                    background: '#666',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Close
                </button>
              </div>
            </div>

            <div style={{
              flex: 1,
              overflow: 'auto',
              border: '1px solid #ddd',
              borderRadius: '4px',
              padding: '10px'
            }}>
              {state.projects.find(p => p.id === historyForId)?.history.map((entry, index) => (
                <div 
                  key={index}
                  style={{
                    padding: '8px',
                    borderBottom: '1px solid #eee',
                    fontSize: '14px',
                    fontFamily: 'monospace'
                  }}
                >
                  {entry}
                </div>
              ))}
              
              {state.projects.find(p => p.id === historyForId)?.history.length === 0 && (
                <div style={{ 
                  textAlign: 'center', 
                  color: '#999', 
                  fontStyle: 'italic',
                  padding: '20px'
                }}>
                  No history yet
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Password Modal */}
      {passwordModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '30px',
            borderRadius: '10px',
            width: '90%',
            maxWidth: '400px'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Admin Password</h3>
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Enter admin password"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '16px',
                marginBottom: '20px',
                boxSizing: 'border-box'
              }}
              onKeyPress={(e) => e.key === 'Enter' && checkPassword()}
            />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setPasswordModal(false);
                  setPasswordInput('');
                }}
                style={{
                  padding: '8px 16px',
                  background: '#666',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={checkPassword}
                style={{
                  padding: '8px 16px',
                  background: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Comments Modal */}
      {clearCommentsModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '30px',
            borderRadius: '10px',
            width: '90%',
            maxWidth: '400px'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Clear All Comments</h3>
            <p style={{ marginBottom: '20px' }}>
              Are you sure you want to clear all comments for this project? 
              This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setClearCommentsModal(null)}
                style={{
                  padding: '8px 16px',
                  background: '#666',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={clearAllComments}
                style={{
                  padding: '8px 16px',
                  background: '#ff4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear History Modal */}
      {clearHistoryModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '30px',
            borderRadius: '10px',
            width: '90%',
            maxWidth: '400px'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Clear History</h3>
            <p style={{ marginBottom: '20px' }}>
              Are you sure you want to clear all history for this project? 
              This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setClearHistoryModal(null)}
                style={{
                  padding: '8px 16px',
                  background: '#666',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={clearAllHistory}
                style={{
                  padding: '8px 16px',
                  background: '#ff4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Clear History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Project Name Modal */}
      {projectNameModal.open && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '30px',
            borderRadius: '10px',
            width: '90%',
            maxWidth: '400px'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Edit Project Name</h3>
            <input
              type="text"
              value={projectNameModal.name}
              onChange={(e) => setProjectNameModal(prev => ({ ...prev, name: e.target.value }))}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '16px',
                marginBottom: '20px',
                boxSizing: 'border-box'
              }}
            />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setProjectNameModal({ open: false, projectId: null, name: '' })}
                style={{
                  padding: '8px 16px',
                  background: '#666',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (projectNameModal.name.trim()) {
                    await updateProject(
                      projectNameModal.projectId,
                      { name: projectNameModal.name.trim() },
                      `${new Date().toLocaleString()}: Project name changed`
                    );
                  }
                  setProjectNameModal({ open: false, projectId: null, name: '' });
                }}
                style={{
                  padding: '8px 16px',
                  background: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Color Picker Modal */}
      {colorPickerModal.open && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '30px',
            borderRadius: '10px',
            width: '90%',
            maxWidth: '500px'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Choose Project Color</h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(8, 1fr)',
              gap: '8px',
              marginBottom: '20px'
            }}>
              {projectColors.map(color => (
                <button
                  key={color}
                  onClick={() => updateProjectColor(colorPickerModal.projectId, color)}
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    border: color === colorPickerModal.currentColor ? '3px solid #333' : '2px solid #ddd',
                    background: color,
                    cursor: 'pointer'
                  }}
                  title={color}
                />
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setColorPickerModal({ open: false, projectId: null, currentColor: '#8D6E63' })}
                style={{
                  padding: '8px 16px',
                  background: '#666',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteModal.open && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '30px',
            borderRadius: '10px',
            width: '90%',
            maxWidth: '400px'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Delete Project</h3>
            <p style={{ marginBottom: '20px' }}>
              Are you sure you want to delete this project? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={closeConfirmDeleteModal}
                style={{
                  padding: '8px 16px',
                  background: '#666',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => deleteProject(confirmDeleteModal.projectId)}
                style={{
                  padding: '8px 16px',
                  background: '#ff4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Confirmation Modal */}
      {confirmCompleteModal.open && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '30px',
            borderRadius: '10px',
            width: '90%',
            maxWidth: '400px'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Complete Project</h3>
            <p style={{ marginBottom: '20px' }}>
              Are you sure you want to mark this project as completed?
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={closeConfirmCompleteModal}
                style={{
                  padding: '8px 16px',
                  background: '#666',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => completeProject(confirmCompleteModal.projectId)}
                style={{
                  padding: '8px 16px',
                  background: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Complete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Camera Modal */}
      {addCameraModal.open && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '30px',
            borderRadius: '10px',
            width: '90%',
            maxWidth: '400px'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Add Camera</h3>
            <input
              type="text"
              value={addCameraModal.cameraName}
              onChange={(e) => setAddCameraModal(prev => ({ ...prev, cameraName: e.target.value }))}
              placeholder="Enter camera name"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '16px',
                marginBottom: '20px',
                boxSizing: 'border-box'
              }}
            />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setAddCameraModal({ open: false, projectId: null, cameraName: '' })}
                style={{
                  padding: '8px 16px',
                  background: '#666',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  addCamera(addCameraModal.projectId, addCameraModal.cameraName);
                  setAddCameraModal({ open: false, projectId: null, cameraName: '' });
                }}
                style={{
                  padding: '8px 16px',
                  background: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Add Camera
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Camera Modal */}
      {editCameraModal.open && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '30px',
            borderRadius: '10px',
            width: '90%',
            maxWidth: '400px'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Edit Camera</h3>
            <input
              type="text"
              value={editCameraModal.cameraName}
              onChange={(e) => setEditCameraModal(prev => ({ ...prev, cameraName: e.target.value }))}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '16px',
                marginBottom: '20px',
                boxSizing: 'border-box'
              }}
            />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setEditCameraModal({ open: false, projectId: null, cameraId: null, cameraName: '' })}
                style={{
                  padding: '8px 16px',
                  background: '#666',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  editCamera(editCameraModal.projectId, editCameraModal.cameraId, editCameraModal.cameraName);
                  setEditCameraModal({ open: false, projectId: null, cameraId: null, cameraName: '' });
                }}
                style={{
                  padding: '8px 16px',
                  background: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Camera Modal */}
      {deleteCameraModal.open && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '30px',
            borderRadius: '10px',
            width: '90%',
            maxWidth: '400px'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Delete Camera</h3>
            <p style={{ marginBottom: '20px' }}>
              Are you sure you want to delete camera "{deleteCameraModal.cameraName}"?
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setDeleteCameraModal({ open: false, projectId: null, cameraId: null, cameraName: '' })}
                style={{
                  padding: '8px 16px',
                  background: '#666',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteCamera(deleteCameraModal.projectId, deleteCameraModal.cameraId);
                  setDeleteCameraModal({ open: false, projectId: null, cameraId: null, cameraName: '' });
                }}
                style={{
                  padding: '8px 16px',
                  background: '#ff4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alert */}
      {isAlertOpen && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: '#333',
          color: 'white',
          padding: '12px 20px',
          borderRadius: '6px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          zIndex: 10000,
          maxWidth: '400px'
        }}>
          {alertMessage}
        </div>
      )}
    </div>
  );
};

export default ProjectStatusDashboard;