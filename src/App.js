import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// ЗАМЕНИТЕ эти значения на ваши из Supabase Settings -> API
const supabaseUrl = 'https://xluhdjnauxwlmamotsob.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsdWhkam5hdXh3bG1hbW90c29iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxOTQ1MjgsImV4cCI6MjA3Mzc3MDUyOH0.rleQjZdGsxAXZ89vpcGXVl06idPY12QxMkcn1dc_yQc';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const ProjectStatusDashboard = () => {
  // Utility functions
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

  // Helper function to format date for display in MM/ DD/ YYYY format
  function formatDateForDisplay(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/ ${day}/ ${year}`;
  }

  // Calendar project colors
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
    // Если у проекта есть сохраненный цвет, используем его
    if (project && project.color) {
      return project.color;
    }
    
    // Иначе генерируем дефолтный цвет по ID
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

  // State management
  const [state, setState] = useState({
    totalArtists: 6,
    projects: []
  });
  const [isAdmin, setIsAdmin] = useState(false);
  const [connected, setConnected] = useState(true);
  const [lastSync, setLastSync] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [holidayDays, setHolidayDays] = useState(new Set());

  // Modal states
  const [commentsForId, setCommentsForId] = useState(null);
  const [draft, setDraft] = useState('');
  const [confirmAddOpen, setConfirmAddOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [confirmIgnore, setConfirmIgnore] = useState(null);
  const [historyForId, setHistoryForId] = useState(null);
  
  // ИСПРАВЛЕНО: Объединили month и year в одно состояние
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
  // ИЗМЕНЕНИЕ 3: Убираем totalArtistsModal из состояния, так как будут inline контролы
  // const [totalArtistsModal, setTotalArtistsModal] = useState({ open: false, value: 6 });

  // New custom modal states
  const [confirmDeleteModal, setConfirmDeleteModal] = useState({ open: false, projectId: null });
  const [confirmCompleteModal, setConfirmCompleteModal] = useState({ open: false, projectId: null });
  const [dateValidationModal, setDateValidationModal] = useState({ open: false, message: '', callback: null });

  // Supabase API functions
  async function loadInitialData() {
    try {
      setLoading(true);
      setError(null);

      // Load settings
      const { data: settings, error: settingsError } = await supabase
        .from('settings')
        .select('*');
      
      if (settingsError) throw settingsError;

      // ИЗМЕНЕНИЕ 4: Исправляем загрузку праздничных дней - используем правильное название таблицы
      try {
        const { data: holidays, error: holidaysError } = await supabase
          .from('holidays')
          .select('*');
        
        if (holidaysError && holidaysError.code !== 'PGRST116') {
          console.warn('Holidays table not found:', holidaysError);
        }
        
        // Load holiday days
        const holidaySet = new Set();
        if (holidays && holidays.length > 0) {
          holidays.forEach(holiday => {
            holidaySet.add(holiday.date);
          });
        }
        setHolidayDays(holidaySet);
      } catch (err) {
        console.warn('Could not load holiday days:', err);
        setHolidayDays(new Set()); // пустой Set если нет таблицы
      }

      // Load projects with comments and history
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select(`
          *,
          project_comments(*),
          project_history(*)
        `)
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;

      // Transform data to match component structure
      const transformedProjects = (projects || []).map(project => ({
        id: project.id,
        name: project.name,
        status: project.status,
        startDate: project.start_date,
        dueDate: project.due_date,
        busy: project.busy,
        priority: project.priority,
        color: project.color || null, // Handle missing color column gracefully
        comments: (project.project_comments || []).map(comment => ({
          id: comment.id,
          text: comment.text,
          ignored: comment.ignored,
          deleted: comment.deleted,
          ts: comment.created_at
        })),
        // ИЗМЕНЕНИЕ 2: Изменил сортировку истории - новые записи вверху
        history: (project.project_history || [])
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .map(h => h.entry)
      }));

      const totalArtists = settings?.find(s => s.key === 'totalArtists')?.value || 6;

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
          ...(projectData.color && { color: projectData.color }) // Only include color if it exists
        })
        .select();

      if (error) throw error;
      return data[0];
    } catch (err) {
      // If color column doesn't exist yet, save without it
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

  // ИЗМЕНЕНИЕ 4: Исправляем функцию сохранения праздничных дней
  async function saveHolidayDay(date, isHoliday) {
    try {
      if (isHoliday) {
        const { error } = await supabase
          .from('holidays')
          .upsert({ date });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('holidays')
          .delete()
          .eq('date', date);
        if (error) throw error;
      }
    } catch (err) {
      console.warn('Holiday days table might not exist:', err);
      throw err;
    }
  }

  async function addHistoryEntry(projectId, entry) {
    const { error } = await supabase
      .from('project_history')
      .insert({
        project_id: projectId,
        entry
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
        deleted: comment.deleted
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

  // Load data on component mount
  useEffect(() => {
    loadInitialData();
  }, []);

  // Simulate connection status and periodic sync
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate connection status changes
      setConnected(prev => {
        if (Math.random() > 0.98) { // 2% chance to disconnect
          setTimeout(() => setConnected(true), 1000 + Math.random() * 2000);
          return false;
        }
        return true;
      });

      // Update last sync time when connected
      if (connected) {
        setLastSync(new Date());
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [connected]);

  // Calculate stats
  const total = state.totalArtists;
  const busy = state.projects.reduce((s, p) => s + (p.status === 'Completed' ? 0 : p.busy), 0);
  const free = total - busy;
  const freePct = Math.round((free / total) * 100);

  // Helper functions
  function showAlert(message) {
    setAlertMessage(message);
    setIsAlertOpen(true);
    setTimeout(() => setIsAlertOpen(false), 3000);
  }

  // Custom modal functions
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

  // ИЗМЕНЕНИЕ 3: Убираем функции modal для totalArtists, так как будут inline контролы
  // function openTotalArtistsModal() {
  //   setTotalArtistsModal({ open: true, value: state.totalArtists });
  // }

  // function closeTotalArtistsModal() {
  //   setTotalArtistsModal({ open: false, value: 6 });
  // }

  // ИЗМЕНЕНИЕ 3: Новая функция для изменения общего количества артистов
  async function updateTotalArtists(newTotal) {
    try {
      await saveTotalArtists(newTotal);
      setState(prev => ({ ...prev, totalArtists: newTotal }));
      setLastSync(new Date());
      showAlert("Total artists updated!");
    } catch (err) {
      setError(`Failed to update total artists: ${err.message}`);
    }
  }

  // Holiday day functions
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

  // Password check for admin
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

      // Business logic validation
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

      // Save to database
      const updatedProject = { ...project, ...changes };
      await saveProject(updatedProject);

      // Add history entry
      if (historyEntry) {
        const entry = isAdmin ? `${historyEntry} [Admin]` : historyEntry;
        await addHistoryEntry(id, entry);
      }

      // Update local state
      setState(prev => ({
        ...prev,
        projects: prev.projects.map(p => p.id === id ? ({
          ...p,
          ...changes,
          // Добавляем новую запись истории в начало массива
          history: historyEntry ? [isAdmin ? `${historyEntry} [Admin]` : historyEntry, ...(p.history || [])] : p.history
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
        history: []
      };

      // Save to database
      await saveProject(newP);
      const historyEntry = `${new Date().toLocaleString()}: Project created${isAdmin ? ' [Admin]' : ''}`;
      await addHistoryEntry(newP.id, historyEntry);

      // Update local state
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

  // Comment functions
  function openComments(projectId) {
    setCommentsForId(projectId);
    setDraft('');
    setEditingId(null);
    setEditingText('');
    setConfirmAddOpen(false);
    setConfirmIgnore(null);
  }

  function closeComments() {
    setCommentsForId(null);
    setDraft('');
    setEditingId(null);
    setEditingText('');
    setConfirmAddOpen(false);
    setConfirmIgnore(null);
  }

  async function addComment() {
    try {
      if (!draft.trim()) return;

      const comment = {
        id: uid('c'),
        text: draft,
        ignored: false,
        deleted: false,
        ts: new Date().toISOString()
      };

      await saveComment(commentsForId, comment);
      const historyEntry = `${new Date().toLocaleString()}: Comment added: "${draft}"${isAdmin ? ' [Admin]' : ''}`;
      await addHistoryEntry(commentsForId, historyEntry);

      setState(prev => ({
        ...prev,
        projects: prev.projects.map(p => p.id === commentsForId ? ({
          ...p,
          comments: [comment, ...(p.comments || [])],
          history: [isAdmin ? `${historyEntry.replace(' [Admin]', '')} [Admin]` : historyEntry.replace(' [Admin]', ''), ...(p.history || [])]
        }) : p)
      }));

      setDraft('');
      setConfirmAddOpen(false);
      setLastSync(new Date());
    } catch (err) {
      setError(`Failed to add comment: ${err.message}`);
    }
  }

  async function deleteComment(commentId) {
    try {
      const project = state.projects.find(p => p.id === commentsForId);
      const comment = project?.comments?.find(c => c.id === commentId);
      
      if (!comment) return;

      const updatedComment = { ...comment, deleted: true };
      await saveComment(commentsForId, updatedComment);
      
      const historyEntry = `${new Date().toLocaleString()}: Comment deleted: "${comment.text}"${isAdmin ? ' [Admin]' : ''}`;
      await addHistoryEntry(commentsForId, historyEntry);

      setState(prev => ({
        ...prev,
        projects: prev.projects.map(p => p.id === commentsForId ? ({
          ...p,
          comments: p.comments.map(c => c.id === commentId ? updatedComment : c),
          history: [isAdmin ? `${historyEntry.replace(' [Admin]', '')} [Admin]` : historyEntry.replace(' [Admin]', ''), ...(p.history || [])]
        }) : p)
      }));

      setLastSync(new Date());
    } catch (err) {
      setError(`Failed to delete comment: ${err.message}`);
    }
  }

  async function toggleIgnoreComment(commentId) {
    try {
      const project = state.projects.find(p => p.id === commentsForId);
      const comment = project?.comments?.find(c => c.id === commentId);
      
      if (!comment) return;

      const updatedComment = { ...comment, ignored: !comment.ignored };
      await saveComment(commentsForId, updatedComment);
      
      const action = updatedComment.ignored ? 'ignored' : 'unignored';
      const historyEntry = `${new Date().toLocaleString()}: Comment ${action}: "${comment.text}"${isAdmin ? ' [Admin]' : ''}`;
      await addHistoryEntry(commentsForId, historyEntry);

      setState(prev => ({
        ...prev,
        projects: prev.projects.map(p => p.id === commentsForId ? ({
          ...p,
          comments: p.comments.map(c => c.id === commentId ? updatedComment : c),
          history: [isAdmin ? `${historyEntry.replace(' [Admin]', '')} [Admin]` : historyEntry.replace(' [Admin]', ''), ...(p.history || [])]
        }) : p)
      }));

      setConfirmIgnore(null);
      setLastSync(new Date());
    } catch (err) {
      setError(`Failed to toggle comment ignore: ${err.message}`);
    }
  }

  async function updateComment(commentId) {
    try {
      const project = state.projects.find(p => p.id === commentsForId);
      const comment = project?.comments?.find(c => c.id === commentId);
      
      if (!comment || !editingText.trim()) return;

      const updatedComment = { ...comment, text: editingText };
      await saveComment(commentsForId, updatedComment);
      
      const historyEntry = `${new Date().toLocaleString()}: Comment edited from "${comment.text}" to "${editingText}"${isAdmin ? ' [Admin]' : ''}`;
      await addHistoryEntry(commentsForId, historyEntry);

      setState(prev => ({
        ...prev,
        projects: prev.projects.map(p => p.id === commentsForId ? ({
          ...p,
          comments: p.comments.map(c => c.id === commentId ? updatedComment : c),
          history: [isAdmin ? `${historyEntry.replace(' [Admin]', '')} [Admin]` : historyEntry.replace(' [Admin]', ''), ...(p.history || [])]
        }) : p)
      }));

      setEditingId(null);
      setEditingText('');
      setLastSync(new Date());
    } catch (err) {
      setError(`Failed to update comment: ${err.message}`);
    }
  }

  async function clearAllComments() {
    try {
      const project = state.projects.find(p => p.id === clearCommentsModal);
      if (!project) return;

      for (const comment of project.comments) {
        if (!comment.deleted) {
          const updatedComment = { ...comment, deleted: true };
          await saveComment(clearCommentsModal, updatedComment);
        }
      }

      const historyEntry = `${new Date().toLocaleString()}: All comments cleared${isAdmin ? ' [Admin]' : ''}`;
      await addHistoryEntry(clearCommentsModal, historyEntry);

      setState(prev => ({
        ...prev,
        projects: prev.projects.map(p => p.id === clearCommentsModal ? ({
          ...p,
          comments: p.comments.map(c => ({ ...c, deleted: true })),
          history: [isAdmin ? `${historyEntry.replace(' [Admin]', '')} [Admin]` : historyEntry.replace(' [Admin]', ''), ...(p.history || [])]
        }) : p)
      }));

      setClearCommentsModal(null);
      setLastSync(new Date());
    } catch (err) {
      setError(`Failed to clear comments: ${err.message}`);
    }
  }

  // History functions
  function openHistory(projectId) {
    setHistoryForId(projectId);
  }

  function closeHistory() {
    setHistoryForId(null);
  }

  async function clearProjectHistory() {
    try {
      const { error } = await supabase
        .from('project_history')
        .delete()
        .eq('project_id', clearHistoryModal);

      if (error) throw error;

      setState(prev => ({
        ...prev,
        projects: prev.projects.map(p => p.id === clearHistoryModal ? ({
          ...p,
          history: []
        }) : p)
      }));

      setClearHistoryModal(null);
      setLastSync(new Date());
    } catch (err) {
      setError(`Failed to clear history: ${err.message}`);
    }
  }

  // Project name editing
  function openProjectNameModal(projectId) {
    const project = state.projects.find(p => p.id === projectId);
    setProjectNameModal({ open: true, projectId, name: project?.name || '' });
  }

  function closeProjectNameModal() {
    setProjectNameModal({ open: false, projectId: null, name: '' });
  }

  async function saveProjectName() {
    try {
      if (!projectNameModal.name.trim()) {
        showAlert("Project name cannot be empty!");
        return;
      }

      const oldName = state.projects.find(p => p.id === projectNameModal.projectId)?.name;
      const historyEntry = `${new Date().toLocaleString()}: Name changed from "${oldName}" to "${projectNameModal.name}"`;

      await updateProject(projectNameModal.projectId, { name: projectNameModal.name }, historyEntry);
      closeProjectNameModal();
    } catch (err) {
      setError(`Failed to update project name: ${err.message}`);
    }
  }

  // Color picker functions
  function openColorPickerModal(projectId) {
    const project = state.projects.find(p => p.id === projectId);
    setColorPickerModal({ 
      open: true, 
      projectId, 
      currentColor: project?.color || getProjectColor(project) 
    });
  }

  function closeColorPickerModal() {
    setColorPickerModal({ open: false, projectId: null, currentColor: '#8D6E63' });
  }

  async function saveProjectColor() {
    try {
      const historyEntry = `${new Date().toLocaleString()}: Color changed to ${colorPickerModal.currentColor}`;
      await updateProject(colorPickerModal.projectId, { color: colorPickerModal.currentColor }, historyEntry);
      closeColorPickerModal();
    } catch (err) {
      setError(`Failed to update project color: ${err.message}`);
    }
  }

  // ИСПРАВЛЕНО: Calendar functions
  const monthDays = getMonthDays(currentDate.year, currentDate.month);
  const firstDayIndex = monthDays.length > 0 ? monthDays[0].getDay() : 0;
  const todayKey = formatDateToYYYYMMDD(new Date());

  function changeMonth(direction) {
    setCurrentDate(prev => {
      let newMonth = prev.month + direction;
      let newYear = prev.year;
      
      if (newMonth < 0) {
        newMonth = 11;
        newYear -= 1;
      } else if (newMonth > 11) {
        newMonth = 0;
        newYear += 1;
      }
      
      return { month: newMonth, year: newYear };
    });
  }

  function goToToday() {
    const today = new Date();
    setCurrentDate({ month: today.getMonth(), year: today.getFullYear() });
  }

  function getProjectsForDay(dayKey) {
    const date = new Date(dayKey);
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isHoliday = holidayDays.has(dayKey);
    
    if (isWeekend || isHoliday) {
      return [];
    }

    return state.projects.filter(p => {
      if (p.status === 'Completed' || p.status === 'Hold') return false;
      const start = new Date(p.startDate);
      const end = new Date(p.dueDate);
      const day = new Date(dayKey);
      return start <= day && day <= end && p.busy > 0;
    });
  }

  function projectsOnDay(dayKey) {
    return state.projects.filter(p => {
      if (p.status === 'Completed' || p.status === 'Hold') return false;
      const start = new Date(p.startDate);
      const end = new Date(p.dueDate);
      const day = new Date(dayKey);
      return start <= day && day <= end;
    }).map(p => {
      if (p.status === 'In Progress' && p.busy === 0) {
        return `${p.name} (Queued)`;
      } else {
        return `${p.name} (${p.busy} artists)`;
      }
    });
  }

  function createDayBackground(dayKey) {
    const date = new Date(dayKey);
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isHoliday = holidayDays.has(dayKey);
    
    // Не закрашиваем выходные и праздничные дни
    if (isWeekend || isHoliday) {
      return 'var(--bg-secondary)';
    }
    
    const projects = getProjectsForDay(dayKey);
    
    if (projects.length === 0) {
      return 'var(--bg-secondary)';
    }

    if (projects.length === 1) {
      return getProjectColor(projects[0]);
    }

    const stripeHeight = 100 / projects.length;
    const gradientStops = [];
    
    projects.forEach((project, index) => {
      const color = getProjectColor(project);
      const startPercent = index * stripeHeight;
      const endPercent = (index + 1) * stripeHeight;
      
      gradientStops.push(`${color} ${startPercent}%`);
      gradientStops.push(`${color} ${endPercent}%`);
    });

    return `linear-gradient(to bottom, ${gradientStops.join(', ')})`;
  }

  function dayBorder(dayKey) {
    if (dayKey === todayKey) {
      return '3px solid var(--danger)';
    }
    return 'none';
  }

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const statusColors = {
    'In Progress': '#5A9BD4',
    'Waiting': '#D4A574', 
    'Hold': '#A0A0A0',
    'Completed': '#6BA66B',
    'Queued': '#C4B85A'
  };

  const priorityColors = {
    'High': '#D47A7A',
    'Medium': '#D4A574',
    'Low': '#6BA66B'
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif'
      }}>
        <div style={{
          fontSize: '18px',
          color: '#007AFF'
        }}>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif',
      background: '#F2F2F7',
      minHeight: '100vh',
      color: '#000000',
      fontSize: '17px',
      lineHeight: '1.47059',
      fontWeight: '400',
      letterSpacing: '-0.022em',
      '--primary': '#007AFF',
      '--secondary': '#5856D6',
      '--success': '#34C759',
      '--warning': '#FF9500',
      '--danger': '#FF3B30',
      '--gray-1': '#8E8E93',
      '--gray-2': '#C7C7CC',
      '--gray-3': '#D1D1D6',
      '--gray-4': '#E5E5EA',
      '--gray-5': '#F2F2F7',
      '--gray-6': '#FFFFFF',
      '--text-primary': '#000000',
      '--text-secondary': '#3C3C43',
      '--text-tertiary': '#48484A',
      '--text-quaternary': '#8E8E93',
      '--bg-primary': '#FFFFFF',
      '--bg-secondary': '#F2F2F7',
      '--bg-tertiary': '#E5E5EA',
      '--separator': 'rgba(60, 60, 67, 0.12)',
      '--shadow': '0 0 20px rgba(0, 0, 0, 0.05)'
    }}>
      
      {/* Error notification */}
      {error && (
        <div style={{
          position: 'fixed',
          top: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 300,
          background: '#FF3B30',
          color: 'white',
          padding: '12px 20px',
          borderRadius: '20px',
          fontSize: '14px',
          boxShadow: '0 4px 20px rgba(255, 59, 48, 0.3)'
        }}>
          {error}
          <button 
            onClick={() => setError(null)}
            style={{
              marginLeft: '12px',
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              fontSize: '16px',
              transition: 'opacity 0.2s ease'
            }}
            onMouseEnter={(e) => e.target.style.opacity = '0.7'}
            onMouseLeave={(e) => e.target.style.opacity = '1'}
          >
            ×
          </button>
        </div>
      )}

      {/* Status indicator for real-time connection */}
      <div style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: 'var(--bg-primary)',
        padding: '8px 12px',
        borderRadius: '20px',
        boxShadow: 'var(--shadow)',
        fontSize: '12px',
        transition: 'all 0.3s ease'
      }}>
        <div style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: connected ? '#34C759' : '#FF3B30',
          transition: 'background-color 0.3s ease'
        }}></div>
        {connected ? `Synced ${lastSync.toLocaleTimeString()}` : 'Reconnecting...'}
      </div>

      {/* Navigation Bar */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.72)',
        backdropFilter: 'saturate(180%) blur(20px)',
        WebkitBackdropFilter: 'saturate(180%) blur(20px)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        borderBottom: '0.5px solid var(--separator)',
        padding: '12px 0'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{
            fontSize: '20px',
            fontWeight: '600',
            color: 'var(--text-primary)'
          }}>
            Zigert Studios
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {isAdmin && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                style={{
                  background: 'var(--primary)',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#0056CC';
                  e.target.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'var(--primary)';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                + Add Project
              </button>
            )}
            <button
              onClick={handleAdminToggle}
              style={{
                background: isAdmin ? 'var(--danger)' : 'var(--bg-secondary)',
                color: isAdmin ? 'white' : 'var(--text-primary)',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (isAdmin) {
                  e.target.style.background = '#D70015';
                } else {
                  e.target.style.background = 'var(--gray-3)';
                }
                e.target.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                if (isAdmin) {
                  e.target.style.background = 'var(--danger)';
                } else {
                  e.target.style.background = 'var(--bg-secondary)';
                }
                e.target.style.transform = 'translateY(0)';
              }}
            >
              {isAdmin ? 'Exit Admin' : 'Admin'}
            </button>
          </div>
        </div>
      </div>

      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '20px'
      }}>
        {/* Header Section */}
        <div style={{
          textAlign: 'center',
          marginBottom: '32px',
          padding: '32px 20px',
          background: 'var(--bg-primary)',
          borderRadius: '20px',
          boxShadow: 'var(--shadow)',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'var(--shadow)';
        }}
        >
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: '8px'
          }}>
            <img 
              src="/zigert-logo.png"
              alt="Zigert Logo"
              style={{
                width: '392px', // ИЗМЕНЕНИЕ 1: Уменьшили на 30% (560px * 0.70 = 392px)
                height: 'auto',
                filter: 'grayscale(0)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'scale(1.05)';
                e.target.style.filter = 'grayscale(0) brightness(1.1)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)';
                e.target.style.filter = 'grayscale(0)';
              }}
            />
          </div>
          <div style={{
            fontSize: '24px',
            fontWeight: 600,
            color: 'var(--text-primary)'
          }}>
            Project Status Dashboard
          </div>
          <div style={{
            fontSize: '14px',
            color: 'var(--text-quaternary)',
            marginTop: '8px'
          }}>
            Real-time collaborative workspace
          </div>
        </div>

        {/* Stats Overview */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <div style={{
            background: 'var(--bg-primary)',
            padding: '20px',
            borderRadius: '20px',
            boxShadow: 'var(--shadow)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '14px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>
              Total Artists
              {/* ИЗМЕНЕНИЕ 3: Добавляем inline контролы в admin режиме */}
              {isAdmin && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginTop: '8px'
                }}>
                  <button
                    onClick={() => updateTotalArtists(Math.max(1, total - 1))}
                    disabled={total <= 1}
                    style={{
                      background: total <= 1 ? 'var(--gray-4)' : 'var(--bg-secondary)',
                      border: 'none',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: total <= 1 ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                      opacity: total <= 1 ? 0.5 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (total > 1) {
                        e.target.style.background = 'var(--gray-3)';
                        e.target.style.transform = 'translateY(-1px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (total > 1) {
                        e.target.style.background = 'var(--bg-secondary)';
                        e.target.style.transform = 'translateY(0)';
                      }
                    }}
                  >
                    <svg width="10" height="2" viewBox="0 0 10 2" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 1h8"/>
                    </svg>
                  </button>
                  <span style={{
                    fontSize: '32px',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    minWidth: '50px',
                    display: 'inline-block'
                  }}>
                    {total}
                  </span>
                  <button
                    onClick={() => updateTotalArtists(total + 1)}
                    style={{
                      background: 'var(--bg-secondary)',
                      border: 'none',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'var(--gray-3)';
                      e.target.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'var(--bg-secondary)';
                      e.target.style.transform = 'translateY(0)';
                    }}
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 1v8M1 5h8"/>
                    </svg>
                  </button>
                </div>
              )}
            </div>
            {/* Показываем цифру только если не в admin режиме */}
            {!isAdmin && (
              <div style={{ fontSize: '32px', fontWeight: '600', color: 'var(--text-primary)' }}>{total}</div>
            )}
          </div>
          <div style={{
            background: 'var(--bg-primary)',
            padding: '20px',
            borderRadius: '20px',
            boxShadow: 'var(--shadow)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '14px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>Busy</div>
            <div style={{ fontSize: '32px', fontWeight: '600', color: 'var(--danger)' }}>{busy}</div>
          </div>
          <div style={{
            background: 'var(--bg-primary)',
            padding: '20px',
            borderRadius: '20px',
            boxShadow: 'var(--shadow)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '14px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>Free</div>
            <div style={{ fontSize: '32px', fontWeight: '600', color: 'var(--success)' }}>{free}</div>
          </div>
          <div style={{
            background: 'var(--bg-primary)',
            padding: '20px',
            borderRadius: '20px',
            boxShadow: 'var(--shadow)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '14px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>Free %</div>
            <div style={{ fontSize: '32px', fontWeight: '600', color: 'var(--success)' }}>{freePct}%</div>
          </div>
        </div>

        {/* Calendar Section - ИЗМЕНЕНИЕ 2: Убираем анимации */}
        <div style={{
          background: 'var(--bg-primary)',
          borderRadius: '20px',
          boxShadow: 'var(--shadow)',
          marginBottom: '24px',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '20px 24px',
            borderBottom: '0.5px solid var(--separator)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h2 style={{
              fontSize: '22px',
              fontWeight: '600',
              margin: 0,
              color: 'var(--text-primary)'
            }}>
              {monthNames[currentDate.month]} {currentDate.year}
            </h2>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                onClick={() => changeMonth(-1)}
                style={{
                  background: 'var(--bg-secondary)',
                  border: 'none',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'var(--gray-3)';
                  e.target.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'var(--bg-secondary)';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 18l-6-6 6-6"/>
                </svg>
              </button>
              <button
                onClick={goToToday}
                style={{
                  background: 'var(--bg-secondary)',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '16px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'var(--gray-3)';
                  e.target.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'var(--bg-secondary)';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                Today
              </button>
              <button
                onClick={() => changeMonth(1)}
                style={{
                  background: 'var(--bg-secondary)',
                  border: 'none',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'var(--gray-3)';
                  e.target.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'var(--bg-secondary)';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </button>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '1px',
            background: 'var(--separator)'
          }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} style={{
                background: 'var(--bg-primary)',
                padding: '12px',
                textAlign: 'center',
                fontSize: '14px',
                fontWeight: '500',
                color: 'var(--text-tertiary)'
              }}>
                {day}
              </div>
            ))}
            
            {/* Empty cells for days before the first day of the month */}
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} style={{
                background: 'var(--bg-secondary)',
                minHeight: '40px'
              }}></div>
            ))}
            
            {/* Calendar days */}
            {monthDays.map(day => {
              const dayKey = formatDateToYYYYMMDD(day);
              const projects = getProjectsForDay(dayKey);
              const isToday = dayKey === todayKey;
              const isWeekend = day.getDay() === 0 || day.getDay() === 6;
              const isHoliday = holidayDays.has(dayKey);
              
              return (
                <div
                  key={dayKey}
                  style={{
                    background: createDayBackground(dayKey),
                    minHeight: '40px',
                    padding: '8px',
                    border: dayBorder(dayKey),
                    position: 'relative',
                    cursor: isAdmin ? 'pointer' : (projects.length > 0 ? 'pointer' : 'default'),
                    transition: 'all 0.2s ease'
                  }}
                  onClick={() => isAdmin ? toggleHolidayDay(dayKey) : null}
                  onMouseEnter={(e) => {
                    if (projects.length > 0 || isAdmin) {
                      e.target.style.transform = 'scale(1.02)';
                      e.target.style.zIndex = '10';
                      e.target.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.15)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'scale(1)';
                    e.target.style.zIndex = '1';
                    e.target.style.boxShadow = 'none';
                  }}
                  title={projectsOnDay(dayKey).join('\n') + (isAdmin ? '\n\nClick to toggle holiday' : '')}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start'
                  }}>
                    <span style={{
                      fontSize: '16px',
                      fontWeight: isToday ? '600' : '400',
                      color: isToday ? 'var(--danger)' : (isWeekend || isHoliday ? 'var(--text-tertiary)' : 'var(--text-primary)'),
                      background: isToday ? 'rgba(255, 255, 255, 0.9)' : 'transparent',
                      borderRadius: '12px',
                      padding: '2px 6px',
                      margin: '-2px -6px -2px -2px',
                      textDecoration: isHoliday ? 'line-through' : 'none'
                    }}>
                      {day.getDate()}
                    </span>
                    {projects.length > 0 && !isWeekend && !isHoliday && (
                      <span style={{
                        background: 'rgba(255, 255, 255, 0.9)',
                        borderRadius: '8px',
                        padding: '2px 6px',
                        fontSize: '12px',
                        fontWeight: '500',
                        color: 'var(--text-primary)'
                      }}>
                        {projects.length}
                      </span>
                    )}
                    {isHoliday && (
                      <span style={{
                        background: 'rgba(255, 0, 0, 0.7)',
                        borderRadius: '8px',
                        padding: '2px 6px',
                        fontSize: '10px',
                        fontWeight: '500',
                        color: 'white'
                      }}>
                        H
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Projects Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: '20px',
          marginBottom: '40px'
        }}>
          {state.projects.map(project => (
            <div key={project.id} style={{
              background: 'var(--bg-primary)',
              borderRadius: '20px',
              padding: '20px',
              boxShadow: 'var(--shadow)',
              transition: 'all 0.3s ease',
              border: '2px solid transparent'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.1)';
              e.currentTarget.style.borderColor = getProjectColor(project);
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'var(--shadow)';
              e.currentTarget.style.borderColor = 'transparent';
            }}
            >
              {/* Project Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '16px'
              }}>
                <div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '4px'
                  }}>
                    <div style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: getProjectColor(project),
                      flexShrink: 0
                    }}></div>
                    <h3 
                      style={{
                        fontSize: '18px',
                        fontWeight: '600',
                        color: 'var(--text-primary)',
                        margin: 0,
                        cursor: isAdmin ? 'pointer' : 'default',
                        transition: 'color 0.2s ease'
                      }}
                      onClick={isAdmin ? () => openProjectNameModal(project.id) : undefined}
                      onMouseEnter={isAdmin ? (e) => e.target.style.color = 'var(--primary)' : undefined}
                      onMouseLeave={isAdmin ? (e) => e.target.style.color = 'var(--text-primary)' : undefined}
                      title={isAdmin ? "Click to edit name" : ""}
                    >
                      {project.name}
                    </h3>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '500',
                      background: statusColors[project.status] + '20',
                      color: statusColors[project.status]
                    }}>
                      {project.status}
                    </span>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '500',
                      background: priorityColors[project.priority] + '20',
                      color: priorityColors[project.priority]
                    }}>
                      {project.priority}
                    </span>
                  </div>
                </div>
                <select
                  value={project.status}
                  onChange={(e) => updateProject(project.id, { status: e.target.value }, `${new Date().toLocaleString()}: Status changed to ${e.target.value}`)}
                  disabled={!isAdmin && project.status === 'Completed'}
                  style={{
                    background: statusColors[project.status] + '20',
                    color: statusColors[project.status],
                    border: `1px solid ${statusColors[project.status]}40`,
                    borderRadius: '8px',
                    padding: '6px 8px',
                    fontSize: '12px',
                    fontWeight: '500',
                    cursor: (!isAdmin && project.status === 'Completed') ? 'not-allowed' : 'pointer',
                    outline: 'none'
                  }}
                >
                  {Object.keys(statusColors).map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              {/* Date Information */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                marginBottom: '16px'
              }}>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '2px' }}>Start Date</div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
                    {formatDateForDisplay(project.startDate)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '2px' }}>Due Date</div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
                    {formatDateForDisplay(project.dueDate)}
                  </div>
                </div>
              </div>

              {/* Priority Section */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px'
              }}>
                <span style={{ fontSize: '14px', color: 'var(--text-tertiary)' }}>Priority:</span>
                <select
                  value={project.priority}
                  onChange={(e) => updateProject(project.id, { priority: e.target.value }, `${new Date().toLocaleString()}: Priority changed to ${e.target.value}`)}
                  disabled={!isAdmin}
                  style={{
                    background: priorityColors[project.priority] + '20',
                    color: priorityColors[project.priority],
                    border: `1px solid ${priorityColors[project.priority]}40`,
                    borderRadius: '8px',
                    padding: '4px 8px',
                    fontSize: '12px',
                    fontWeight: '500',
                    cursor: isAdmin ? 'pointer' : 'not-allowed',
                    opacity: isAdmin ? 1 : 0.7,
                    outline: 'none'
                  }}
                >
                  {Object.keys(priorityColors).map(priority => (
                    <option key={priority} value={priority}>{priority}</option>
                  ))}
                </select>
              </div>

              {/* Busy Section */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px'
              }}>
                <span style={{ fontSize: '14px', color: 'var(--text-tertiary)' }}>Busy:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => updateProject(project.id, { busy: Math.max(0, project.busy - 1) }, `${new Date().toLocaleString()}: Busy decreased to ${Math.max(0, project.busy - 1)}`)}
                    disabled={project.busy <= 0}
                    style={{
                      background: project.busy <= 0 ? 'var(--gray-4)' : 'var(--bg-secondary)',
                      border: 'none',
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: project.busy <= 0 ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                      opacity: project.busy <= 0 ? 0.5 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (project.busy > 0) {
                        e.target.style.background = 'var(--gray-3)';
                        e.target.style.transform = 'translateY(-1px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (project.busy > 0) {
                        e.target.style.background = 'var(--bg-secondary)';
                        e.target.style.transform = 'translateY(0)';
                      }
                    }}
                  >
                    <svg width="12" height="2" viewBox="0 0 12 2" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 1h10"/>
                    </svg>
                  </button>
                  <span style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    minWidth: '20px',
                    textAlign: 'center'
                  }}>
                    {project.busy}
                  </span>
                  <button
                    onClick={() => updateProject(project.id, { busy: project.busy + 1 }, `${new Date().toLocaleString()}: Busy increased to ${project.busy + 1}`)}
                    disabled={busy >= total}
                    style={{
                      background: busy >= total ? 'var(--gray-4)' : 'var(--bg-secondary)',
                      border: 'none',
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: busy >= total ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                      opacity: busy >= total ? 0.5 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (busy < total) {
                        e.target.style.background = 'var(--gray-3)';
                        e.target.style.transform = 'translateY(-1px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (busy < total) {
                        e.target.style.background = 'var(--bg-secondary)';
                        e.target.style.transform = 'translateY(0)';
                      }
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 1v10M1 6h10"/>
                    </svg>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                gap: '8px',
                justifyContent: 'space-between'
              }}>
                <button
                  onClick={() => openComments(project.id)}
                  style={{
                    flex: 1,
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    border: 'none',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    outline: 'none'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'var(--gray-3)';
                    e.target.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'var(--bg-secondary)';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  Comments ({project.comments?.filter(c => !c.ignored && !c.deleted).length || 0})
                </button>
                <button
                  onClick={() => openHistory(project.id)}
                  style={{
                    flex: 1,
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    border: 'none',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    outline: 'none'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'var(--gray-3)';
                    e.target.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'var(--bg-secondary)';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  History
                </button>
              </div>

              {/* Admin Actions */}
              {isAdmin && (
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  marginTop: '12px',
                  paddingTop: '12px',
                  borderTop: '0.5px solid var(--separator)'
                }}>
                  <button
                    onClick={() => openColorPickerModal(project.id)}
                    style={{
                      flex: 1,
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'var(--gray-3)';
                      e.target.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'var(--bg-secondary)';
                      e.target.style.transform = 'translateY(0)';
                    }}
                  >
                    Color
                  </button>
                  <button
                    onClick={() => showConfirmCompleteModal(project.id)}
                    disabled={project.status === 'Completed'}
                    style={{
                      flex: 1,
                      background: project.status === 'Completed' ? 'var(--gray-4)' : 'var(--success)',
                      color: project.status === 'Completed' ? 'var(--text-tertiary)' : 'white',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '500',
                      cursor: project.status === 'Completed' ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                      opacity: project.status === 'Completed' ? 0.6 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (project.status !== 'Completed') {
                        e.target.style.background = '#2AA44F';
                        e.target.style.transform = 'translateY(-1px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (project.status !== 'Completed') {
                        e.target.style.background = 'var(--success)';
                        e.target.style.transform = 'translateY(0)';
                      }
                    }}
                  >
                    Complete
                  </button>
                  <button
                    onClick={() => showConfirmDeleteModal(project.id)}
                    style={{
                      flex: 1,
                      background: 'var(--danger)',
                      color: 'white',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = '#D70015';
                      e.target.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'var(--danger)';
                      e.target.style.transform = 'translateY(0)';
                    }}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ИЗМЕНЕНИЕ 3: Убираем Total Artists Modal, так как теперь используются inline контролы */}

        {/* Add Project Modal */}
        {isAddModalOpen && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: 'var(--bg-primary)',
              borderRadius: '20px',
              padding: '24px',
              width: '90%',
              maxWidth: '400px',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)'
            }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: '600' }}>Add New Project</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: 'var(--text-tertiary)' }}>Project Name</label>
                  <input
                    type="text"
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '0.5px solid var(--separator)',
                      borderRadius: '10px',
                      fontSize: '16px',
                      outline: 'none',
                      background: 'var(--bg-primary)'
                    }}
                    placeholder="Enter project name"
                  />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: 'var(--text-tertiary)' }}>Start Date</label>
                    <input
                      type="date"
                      value={newProject.startDate}
                      onChange={(e) => setNewProject({ ...newProject, startDate: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '0.5px solid var(--separator)',
                        borderRadius: '10px',
                        fontSize: '14px',
                        outline: 'none',
                        background: 'var(--bg-primary)'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: 'var(--text-tertiary)' }}>Due Date</label>
                    <input
                      type="date"
                      value={newProject.dueDate}
                      onChange={(e) => setNewProject({ ...newProject, dueDate: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '0.5px solid var(--separator)',
                        borderRadius: '10px',
                        fontSize: '14px',
                        outline: 'none',
                        background: 'var(--bg-primary)'
                      }}
                    />
                  </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: 'var(--text-tertiary)' }}>Status</label>
                    <select
                      value={newProject.status}
                      onChange={(e) => setNewProject({ ...newProject, status: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '0.5px solid var(--separator)',
                        borderRadius: '10px',
                        fontSize: '14px',
                        outline: 'none',
                        background: 'var(--bg-primary)'
                      }}
                    >
                      {Object.keys(statusColors).map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: 'var(--text-tertiary)' }}>Priority</label>
                    <select
                      value={newProject.priority}
                      onChange={(e) => setNewProject({ ...newProject, priority: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '0.5px solid var(--separator)',
                        borderRadius: '10px',
                        fontSize: '14px',
                        outline: 'none',
                        background: 'var(--bg-primary)'
                      }}
                    >
                      {Object.keys(priorityColors).map(priority => (
                        <option key={priority} value={priority}>{priority}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: 'var(--text-tertiary)' }}>Busy Artists</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                      onClick={() => setNewProject({ ...newProject, busy: Math.max(0, newProject.busy - 1) })}
                      disabled={newProject.busy <= 0}
                      style={{
                        background: newProject.busy <= 0 ? 'var(--gray-4)' : 'var(--bg-secondary)',
                        border: 'none',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: newProject.busy <= 0 ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease',
                        opacity: newProject.busy <= 0 ? 0.5 : 1
                      }}
                      onMouseEnter={(e) => {
                        if (newProject.busy > 0) {
                          e.target.style.background = 'var(--gray-3)';
                          e.target.style.transform = 'translateY(-1px)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (newProject.busy > 0) {
                          e.target.style.background = 'var(--bg-secondary)';
                          e.target.style.transform = 'translateY(0)';
                        }
                      }}
                    >
                      <svg width="14" height="2" viewBox="0 0 14 2" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 1h12"/>
                      </svg>
                    </button>
                    <span style={{ fontSize: '20px', fontWeight: '600', minWidth: '40px', textAlign: 'center' }}>
                      {newProject.busy}
                    </span>
                    <button
                      onClick={() => setNewProject({ ...newProject, busy: newProject.busy + 1 })}
                      disabled={busy + newProject.busy >= total}
                      style={{
                        background: busy + newProject.busy >= total ? 'var(--gray-4)' : 'var(--bg-secondary)',
                        border: 'none',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: busy + newProject.busy >= total ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease',
                        opacity: busy + newProject.busy >= total ? 0.5 : 1
                      }}
                      onMouseEnter={(e) => {
                        if (busy + newProject.busy < total) {
                          e.target.style.background = 'var(--gray-3)';
                          e.target.style.transform = 'translateY(-1px)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (busy + newProject.busy < total) {
                          e.target.style.background = 'var(--bg-secondary)';
                          e.target.style.transform = 'translateY(0)';
                        }
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M7 1v12M1 7h12"/>
                      </svg>
                    </button>
                  </div>
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: 'var(--text-tertiary)' }}>Color</label>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(8, 1fr)',
                    gap: '8px'
                  }}>
                    {projectColors.slice(0, 16).map(color => (
                      <button
                        key={color}
                        onClick={() => setNewProject({ ...newProject, color })}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: color,
                          border: newProject.color === color ? '3px solid var(--primary)' : '2px solid var(--separator)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'scale(1.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'scale(1)';
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              
              <div style={{
                display: 'flex',
                gap: '12px',
                marginTop: '24px',
                justifyContent: 'flex-end'
              }}>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  style={{
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '14px',
                    fontSize: '16px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={addProject}
                  style={{
                    background: 'var(--primary)',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '14px',
                    fontSize: '16px',
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
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: 'var(--bg-primary)',
              borderRadius: '20px',
              padding: '24px',
              width: '90%',
              maxWidth: '600px',
              maxHeight: '80vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>
                  Comments - {state.projects.find(p => p.id === commentsForId)?.name}
                </h3>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {isAdmin && (
                    <button
                      onClick={() => setClearCommentsModal(commentsForId)}
                      style={{
                        background: 'var(--danger)',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      Clear All
                    </button>
                  )}
                  <button
                    onClick={closeComments}
                    style={{
                      background: 'var(--bg-secondary)',
                      border: 'none',
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      fontSize: '18px'
                    }}
                  >
                    ×
                  </button>
                </div>
              </div>

              <div style={{
                flex: 1,
                overflowY: 'auto',
                marginBottom: '16px',
                padding: '4px'
              }}>
                {state.projects.find(p => p.id === commentsForId)?.comments
                  ?.filter(c => !c.deleted)
                  ?.sort((a, b) => new Date(b.ts) - new Date(a.ts))
                  ?.map(comment => (
                  <div
                    key={comment.id}
                    style={{
                      background: comment.ignored ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
                      padding: '12px',
                      borderRadius: '12px',
                      marginBottom: '12px',
                      opacity: comment.ignored ? 0.5 : 1
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '8px'
                    }}>
                      <div style={{
                        fontSize: '12px',
                        color: 'var(--text-tertiary)'
                      }}>
                        {new Date(comment.ts).toLocaleString()}
                      </div>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          onClick={() => {
                            setEditingId(comment.id);
                            setEditingText(comment.text);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--primary)',
                            cursor: 'pointer',
                            fontSize: '12px',
                            padding: '2px 4px'
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setConfirmIgnore(comment.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--warning)',
                            cursor: 'pointer',
                            fontSize: '12px',
                            padding: '2px 4px'
                          }}
                        >
                          {comment.ignored ? 'Unignore' : 'Ignore'}
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => deleteComment(comment.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--danger)',
                              cursor: 'pointer',
                              fontSize: '12px',
                              padding: '2px 4px'
                            }}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                    {editingId === comment.id ? (
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input
                          type="text"
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          style={{
                            flex: 1,
                            padding: '6px 8px',
                            border: '0.5px solid var(--separator)',
                            borderRadius: '8px',
                            fontSize: '14px',
                            outline: 'none',
                            background: 'var(--bg-primary)'
                          }}
                        />
                        <button
                          onClick={() => updateComment(comment.id)}
                          style={{
                            background: 'var(--primary)',
                            color: 'white',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '8px',
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
                            background: 'var(--bg-secondary)',
                            color: 'var(--text-primary)',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div style={{
                        fontSize: '14px',
                        color: 'var(--text-primary)',
                        lineHeight: '1.4'
                      }}>
                        {comment.text}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Add a comment..."
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: '0.5px solid var(--separator)',
                    borderRadius: '12px',
                    fontSize: '14px',
                    outline: 'none',
                    background: 'var(--bg-secondary)'
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && draft.trim()) {
                      setConfirmAddOpen(true);
                    }
                  }}
                />
                <button
                  onClick={() => setConfirmAddOpen(true)}
                  disabled={!draft.trim()}
                  style={{
                    background: draft.trim() ? 'var(--primary)' : 'var(--gray-4)',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '12px',
                    fontSize: '14px',
                    cursor: draft.trim() ? 'pointer' : 'not-allowed',
                    opacity: draft.trim() ? 1 : 0.5
                  }}
                >
                  Add
                </button>
              </div>

              {confirmAddOpen && (
                <div style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(0, 0, 0, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1001
                }}>
                  <div style={{
                    background: 'var(--bg-primary)',
                    borderRadius: '16px',
                    padding: '20px',
                    maxWidth: '400px'
                  }}>
                    <h4 style={{ margin: '0 0 12px 0' }}>Add Comment</h4>
                    <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: 'var(--text-tertiary)' }}>
                      "{draft}"
                    </p>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => setConfirmAddOpen(false)}
                        style={{
                          background: 'var(--bg-secondary)',
                          color: 'var(--text-primary)',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={addComment}
                        style={{
                          background: 'var(--primary)',
                          color: 'white',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {confirmIgnore && (
                <div style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(0, 0, 0, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1001
                }}>
                  <div style={{
                    background: 'var(--bg-primary)',
                    borderRadius: '16px',
                    padding: '20px',
                    maxWidth: '400px'
                  }}>
                    <h4 style={{ margin: '0 0 12px 0' }}>
                      {state.projects.find(p => p.id === commentsForId)?.comments?.find(c => c.id === confirmIgnore)?.ignored ? 
                        'Unignore Comment' : 'Ignore Comment'}
                    </h4>
                    <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: 'var(--text-tertiary)' }}>
                      "{state.projects.find(p => p.id === commentsForId)?.comments?.find(c => c.id === confirmIgnore)?.text}"
                    </p>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => setConfirmIgnore(null)}
                        style={{
                          background: 'var(--bg-secondary)',
                          color: 'var(--text-primary)',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => toggleIgnoreComment(confirmIgnore)}
                        style={{
                          background: 'var(--warning)',
                          color: 'white',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        {state.projects.find(p => p.id === commentsForId)?.comments?.find(c => c.id === confirmIgnore)?.ignored ? 
                          'Unignore' : 'Ignore'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
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
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: 'var(--bg-primary)',
              borderRadius: '20px',
              padding: '24px',
              width: '90%',
              maxWidth: '600px',
              maxHeight: '80vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>
                  History - {state.projects.find(p => p.id === historyForId)?.name}
                </h3>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {isAdmin && (
                    <button
                      onClick={() => setClearHistoryModal(historyForId)}
                      style={{
                        background: 'var(--danger)',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      Clear All
                    </button>
                  )}
                  <button
                    onClick={closeHistory}
                    style={{
                      background: 'var(--bg-secondary)',
                      border: 'none',
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      fontSize: '18px'
                    }}
                  >
                    ×
                  </button>
                </div>
              </div>

              <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '4px'
              }}>
                {state.projects.find(p => p.id === historyForId)?.history?.map((entry, index) => (
                  <div
                    key={index}
                    style={{
                      background: 'var(--bg-secondary)',
                      padding: '12px',
                      borderRadius: '12px',
                      marginBottom: '8px',
                      fontSize: '14px',
                      color: 'var(--text-primary)'
                    }}
                  >
                    {entry}
                  </div>
                )) || (
                  <div style={{
                    textAlign: 'center',
                    color: 'var(--text-tertiary)',
                    fontSize: '14px',
                    padding: '20px'
                  }}>
                    No history available
                  </div>
                )}
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
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: 'var(--bg-primary)',
              borderRadius: '16px',
              padding: '20px',
              maxWidth: '400px',
              width: '90%'
            }}>
              <h4 style={{ margin: '0 0 16px 0' }}>Edit Project Name</h4>
              <input
                type="text"
                value={projectNameModal.name}
                onChange={(e) => setProjectNameModal({ ...projectNameModal, name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '0.5px solid var(--separator)',
                  borderRadius: '10px',
                  fontSize: '16px',
                  outline: 'none',
                  background: 'var(--bg-primary)',
                  marginBottom: '16px'
                }}
                placeholder="Enter project name"
              />
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  onClick={closeProjectNameModal}
                  style={{
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={saveProjectName}
                  style={{
                    background: 'var(--primary)',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '12px',
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
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: 'var(--bg-primary)',
              borderRadius: '16px',
              padding: '20px',
              maxWidth: '400px',
              width: '90%'
            }}>
              <h4 style={{ margin: '0 0 16px 0' }}>Choose Project Color</h4>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(6, 1fr)',
                gap: '12px',
                marginBottom: '20px'
              }}>
                {projectColors.map(color => (
                  <button
                    key={color}
                    onClick={() => setColorPickerModal({ ...colorPickerModal, currentColor: color })}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: color,
                      border: colorPickerModal.currentColor === color ? '3px solid var(--primary)' : '2px solid var(--separator)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'scale(1.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'scale(1)';
                    }}
                  />
                ))}
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  onClick={closeColorPickerModal}
                  style={{
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={saveProjectColor}
                  style={{
                    background: 'var(--primary)',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Save
                </button>
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
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: 'var(--bg-primary)',
              borderRadius: '16px',
              padding: '20px',
              maxWidth: '300px',
              width: '90%'
            }}>
              <h4 style={{ margin: '0 0 16px 0' }}>Enter Admin Password</h4>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '0.5px solid var(--separator)',
                  borderRadius: '10px',
                  fontSize: '16px',
                  outline: 'none',
                  background: 'var(--bg-primary)',
                  marginBottom: '16px'
                }}
                placeholder="Password"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    checkPassword();
                  }
                }}
              />
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => {
                    setPasswordModal(false);
                    setPasswordInput('');
                  }}
                  style={{
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={checkPassword}
                  style={{
                    background: 'var(--primary)',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Login
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Alert Messages */}
        {isAlertOpen && (
          <div style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 300,
            background: 'var(--primary)',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '20px',
            fontSize: '14px',
            boxShadow: '0 4px 20px rgba(0, 122, 255, 0.3)'
          }}>
            {alertMessage}
          </div>
        )}

        {/* Confirm Delete Modal */}
        {confirmDeleteModal.open && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: 'var(--bg-primary)',
              borderRadius: '16px',
              padding: '20px',
              maxWidth: '400px',
              width: '90%'
            }}>
              <h4 style={{ margin: '0 0 12px 0' }}>Delete Project</h4>
              <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: 'var(--text-tertiary)' }}>
                Are you sure you want to delete "{state.projects.find(p => p.id === confirmDeleteModal.projectId)?.name}"? 
                This action cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  onClick={closeConfirmDeleteModal}
                  style={{
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteProject(confirmDeleteModal.projectId)}
                  style={{
                    background: 'var(--danger)',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirm Complete Modal */}
        {confirmCompleteModal.open && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: 'var(--bg-primary)',
              borderRadius: '16px',
              padding: '20px',
              maxWidth: '400px',
              width: '90%'
            }}>
              <h4 style={{ margin: '0 0 12px 0' }}>Complete Project</h4>
              <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: 'var(--text-tertiary)' }}>
                Mark "{state.projects.find(p => p.id === confirmCompleteModal.projectId)?.name}" as completed? 
                This will set the busy count to 0.
              </p>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  onClick={closeConfirmCompleteModal}
                  style={{
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => completeProject(confirmCompleteModal.projectId)}
                  style={{
                    background: 'var(--success)',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Complete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Clear Comments Confirmation */}
        {clearCommentsModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1001
          }}>
            <div style={{
              background: 'var(--bg-primary)',
              borderRadius: '16px',
              padding: '20px',
              maxWidth: '400px',
              width: '90%'
            }}>
              <h4 style={{ margin: '0 0 12px 0' }}>Clear All Comments</h4>
              <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: 'var(--text-tertiary)' }}>
                Are you sure you want to clear all comments for "{state.projects.find(p => p.id === clearCommentsModal)?.name}"? 
                This action cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setClearCommentsModal(null)}
                  style={{
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={clearAllComments}
                  style={{
                    background: 'var(--danger)',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Clear History Confirmation */}
        {clearHistoryModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1001
          }}>
            <div style={{
              background: 'var(--bg-primary)',
              borderRadius: '16px',
              padding: '20px',
              maxWidth: '400px',
              width: '90%'
            }}>
              <h4 style={{ margin: '0 0 12px 0' }}>Clear All History</h4>
              <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: 'var(--text-tertiary)' }}>
                Are you sure you want to clear all history for "{state.projects.find(p => p.id === clearHistoryModal)?.name}"? 
                This action cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setClearHistoryModal(null)}
                  style={{
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={clearProjectHistory}
                  style={{
                    background: 'var(--danger)',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Date Validation Modal */}
        {dateValidationModal.open && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: 'var(--bg-primary)',
              borderRadius: '16px',
              padding: '20px',
              maxWidth: '400px',
              width: '90%'
            }}>
              <h4 style={{ margin: '0 0 12px 0' }}>Date Validation</h4>
              <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: 'var(--text-tertiary)' }}>
                {dateValidationModal.message}
              </p>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  onClick={closeDateValidationModal}
                  style={{
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                {dateValidationModal.callback && (
                  <button
                    onClick={() => {
                      dateValidationModal.callback();
                      closeDateValidationModal();
                    }}
                    style={{
                      background: 'var(--primary)',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    Continue
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectStatusDashboard;