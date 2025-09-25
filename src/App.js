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
        history: (project.project_history || [])
          .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
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
          history: historyEntry ? [...(p.history || []), isAdmin ? `${historyEntry} [Admin]` : historyEntry] : p.history
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

  async function addCommentConfirmed() {
    try {
      if (!commentsForId || !draft.trim()) return;
      
      const comment = {
        id: uid('c'),
        text: draft.trim(),
        ignored: false,
        deleted: false,
        ts: new Date().toISOString()
      };

      await saveComment(commentsForId, comment);
      await addHistoryEntry(commentsForId, `${new Date().toLocaleString()}: Comment added${isAdmin ? ' [Admin]' : ''}`);

      setState(prev => ({
        ...prev,
        projects: prev.projects.map(p => p.id === commentsForId ? ({
          ...p,
          comments: [comment, ...p.comments],
          history: [...(p.history || []), `${new Date().toLocaleString()}: Comment added${isAdmin ? ' [Admin]' : ''}`]
        }) : p)
      }));
      
      setDraft('');
      setConfirmAddOpen(false);
      setLastSync(new Date());

    } catch (err) {
      setError(`Failed to add comment: ${err.message}`);
      console.error('Add comment error:', err);
    }
  }

  function startEdit(commentId, text) {
    setEditingId(commentId);
    setEditingText(text || '');
  }

  async function saveEdit(commentId) {
    try {
      if (!commentsForId) return;
      
      const trimmed = editingText.trim();
      
      // Find the current comment to preserve original text
      const project = state.projects.find(p => p.id === commentsForId);
      const comment = project?.comments.find(c => c.id === commentId);
      
      const updatedComment = {
        id: commentId,
        text: trimmed === '' ? comment?.text || '' : trimmed, // Keep original if empty
        deleted: false,
        ignored: trimmed === '', // Mark as ignored if empty text
        ts: new Date().toISOString()
      };

      await saveComment(commentsForId, updatedComment);
      const historyMessage = trimmed === '' ? 'Comment ignored' : 'Comment edited';
      await addHistoryEntry(commentsForId, `${new Date().toLocaleString()}: ${historyMessage}${isAdmin ? ' [Admin]' : ''}`);

      setState(prev => ({
        ...prev,
        projects: prev.projects.map(p => {
          if (p.id !== commentsForId) return p;
          const newComments = p.comments.map(c => {
            if (c.id !== commentId) return c;
            return { ...c, ...updatedComment };
          });
          return { 
            ...p, 
            comments: newComments, 
            history: [...(p.history || []), `${new Date().toLocaleString()}: ${historyMessage}${isAdmin ? ' [Admin]' : ''}`] 
          };
        })
      }));
      
      setEditingId(null);
      setEditingText('');
      setLastSync(new Date());

    } catch (err) {
      setError(`Failed to edit comment: ${err.message}`);
      console.error('Edit comment error:', err);
    }
  }

  function confirmIgnoreComment(commentId) {
    if (!commentsForId) return;
    setConfirmIgnore({ projectId: commentsForId, commentId });
  }

  async function doIgnore() {
    try {
      if (!confirmIgnore) return;
      
      const { projectId, commentId } = confirmIgnore;
      
      // Find the current comment to preserve its text
      const project = state.projects.find(p => p.id === projectId);
      const comment = project?.comments.find(c => c.id === commentId);
      
      if (!comment) return;
      
      const updatedComment = {
        id: commentId,
        text: comment.text, // Preserve the original text
        ignored: true,
        deleted: false,
        ts: new Date().toISOString()
      };

      await saveComment(projectId, updatedComment);
      await addHistoryEntry(projectId, `${new Date().toLocaleString()}: Comment ignored${isAdmin ? ' [Admin]' : ''}`);

      setState(prev => ({
        ...prev,
        projects: prev.projects.map(p => {
          if (p.id !== projectId) return p;
          const newComments = p.comments.map(c => c.id === commentId ? ({ ...c, ignored: true, deleted: false, ts: new Date().toISOString() }) : c);
          return { ...p, comments: newComments, history: [...(p.history || []), `${new Date().toLocaleString()}: Comment ignored${isAdmin ? ' [Admin]' : ''}`] };
        })
      }));
      
      setConfirmIgnore(null);
      setLastSync(new Date());

    } catch (err) {
      setError(`Failed to ignore comment: ${err.message}`);
      console.error('Ignore comment error:', err);
    }
  }

  // History functions
  function openHistory(projectId) { 
    setHistoryForId(projectId); 
  }
  function closeHistory() { setHistoryForId(null); }

  // Clear functions for Admin
  async function clearComments(projectId) {
    try {
      const project = state.projects.find(p => p.id === projectId);
      if (!project) return;

      // Delete all comments from database
      for (const comment of project.comments) {
        await supabase
          .from('project_comments')
          .delete()
          .eq('id', comment.id);
      }

      await addHistoryEntry(projectId, `${new Date().toLocaleString()}: All comments cleared [Admin]`);

      // Update local state
      setState(prev => ({
        ...prev,
        projects: prev.projects.map(p => p.id === projectId ? ({
          ...p,
          comments: [],
          history: [...(p.history || []), `${new Date().toLocaleString()}: All comments cleared [Admin]`]
        }) : p)
      }));

      setLastSync(new Date());
      setClearCommentsModal(null);

    } catch (err) {
      setError(`Failed to clear comments: ${err.message}`);
      console.error('Clear comments error:', err);
    }
  }

  async function clearHistory(projectId) {
    try {
      // Delete all history from database
      await supabase
        .from('project_history')
        .delete()
        .eq('project_id', projectId);

      // Update local state
      setState(prev => ({
        ...prev,
        projects: prev.projects.map(p => p.id === projectId ? ({
          ...p,
          history: []
        }) : p)
      }));

      setLastSync(new Date());
      setClearHistoryModal(null);

    } catch (err) {
      setError(`Failed to clear history: ${err.message}`);
      console.error('Clear history error:', err);
    }
  }

  // ИСПРАВЛЕНО: Calendar functions
  function changeMonth(delta) {
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

  function goToToday() {
    const today = new Date();
    setCurrentDate({
      month: today.getMonth(),
      year: today.getFullYear()
    });
  }

  // Project name modal
  function openProjectNameModal(projectId, currentName) {
    setProjectNameModal({ open: true, projectId, name: currentName });
  }

  function closeProjectNameModal() {
    setProjectNameModal({ open: false, projectId: null, name: '' });
  }

  async function saveProjectName() {
    if (!projectNameModal.name.trim()) {
      showAlert("Specify project name!");
      return;
    }

    await updateProject(
      projectNameModal.projectId,
      { name: projectNameModal.name },
      `${new Date().toLocaleString()}: Name changed to ${projectNameModal.name}`
    );

    closeProjectNameModal();
  }

  // Color picker modal functions
  function openColorPickerModal(projectId) {
    const project = state.projects.find(p => p.id === projectId);
    const currentColor = getProjectColor(project);
    setColorPickerModal({ open: true, projectId, currentColor });
  }

  function closeColorPickerModal() {
    setColorPickerModal({ open: false, projectId: null, currentColor: '#8D6E63' });
  }

  async function saveProjectColor() {
    if (!colorPickerModal.projectId) return;

    await updateProject(
      colorPickerModal.projectId,
      { color: colorPickerModal.currentColor },
      `${new Date().toLocaleString()}: Color changed`
    );

    closeColorPickerModal();
  }

  // ИСПРАВЛЕНО: Timeline helpers - используем currentDate вместо currentMonth/currentYear
  const monthDays = getMonthDays(currentDate.year, currentDate.month);
  const firstDayIndex = monthDays.length ? monthDays[0].getDay() : 0;
  const todayKey = formatDateToYYYYMMDD(new Date());

  function getProjectsForDay(dayKey) {
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
          boxShadow: '0 4px 20px rgba(255, 59, 48, 0.3)',
          animation: 'slideIn 0.3s ease-out'
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
        marginBottom: '24px',
        transition: 'all 0.3s ease'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center'
        }}>
          <div style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'center'
          }}>
            <button
              onClick={() => loadInitialData()}
              style={{
                background: 'var(--bg-secondary)',
                color: 'var(--primary)',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '18px',
                fontSize: '15px',
                fontWeight: 500,
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
              Refresh
            </button>
            <button
              onClick={handleAdminToggle}
              style={{
                background: 'var(--bg-secondary)',
                color: 'var(--primary)',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '18px',
                fontSize: '15px',
                fontWeight: 500,
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
              {isAdmin ? 'Partner View' : 'Admin View'}
            </button>
            {isAdmin && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                style={{
                  background: 'var(--primary)',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '18px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  outline: 'none'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#0056CC';
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 4px 12px rgba(0, 122, 255, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'var(--primary)';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                + Add
              </button>
            )}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
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
            marginBottom: '8px',
            animation: 'fadeInUp 0.6s ease-out'
          }}>
            <img 
              src="zigert-logo.png"
              alt="Zigert Logo"
              style={{
                width: '280px',
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
            color: 'var(--text-primary)',
            animation: 'fadeInUp 0.6s ease-out 0.1s both'
          }}>
            Project Status Dashboard
          </div>
          <div style={{
            fontSize: '14px',
            color: 'var(--text-quaternary)',
            marginTop: '8px',
            animation: 'fadeInUp 0.6s ease-out 0.2s both'
          }}>
            Real-time collaborative workspace
          </div>
        </div>

        {/* Stats Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '16px',
          marginBottom: '32px'
        }}>
          {[
            { label: 'Total Artists', value: total },
            { label: 'Busy', value: busy },
            { label: 'Free', value: free },
            { label: '% Free', value: freePct + '%', alert: freePct >= 50 }
          ].map((stat, idx) => (
            <div key={idx} style={{
              background: 'var(--bg-primary)',
              borderRadius: '20px',
              padding: '20px',
              boxShadow: 'var(--shadow)',
              textAlign: 'center',
              transition: 'all 0.3s ease',
              animation: `fadeInUp 0.6s ease-out ${0.1 * idx}s both`
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
              e.currentTarget.style.boxShadow = '0 12px 30px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = 'var(--shadow)';
            }}
            >
              <div style={{
                fontSize: '13px',
                fontWeight: 500,
                color: 'var(--text-quaternary)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '8px'
              }}>
                {stat.label}
              </div>
              <div style={{
                fontSize: '34px',
                fontWeight: 700,
                color: stat.alert ? 'var(--danger)' : 'var(--text-primary)',
                letterSpacing: '-0.024em',
                transition: 'color 0.3s ease'
              }}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* Active Projects */}
        <div style={{
          background: 'var(--bg-primary)',
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow: 'var(--shadow)',
          marginBottom: '32px',
          transition: 'all 0.3s ease',
          animation: 'fadeInUp 0.6s ease-out 0.4s both'
        }}>
          <div style={{
            padding: '24px',
            borderBottom: '0.5px solid var(--separator)'
          }}>
            <h3 style={{
              fontSize: '28px',
              fontWeight: 700,
              letterSpacing: '-0.024em',
              color: 'var(--text-primary)',
              margin: 0
            }}>
              Active Projects
            </h3>
          </div>
          <div style={{ padding: '24px' }}>
            {state.projects.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-quaternary)' }}>
                No projects yet. {isAdmin && 'Click "Add" to create your first project.'}
              </div>
            ) : (
              [...state.projects].sort((a, b) => {
                const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
                const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
                if (priorityDiff === 0) {
                  return a.name.localeCompare(b.name);
                }
                return priorityDiff;
              }).map((project, index) => (
                <div key={project.id} style={{
                  background: 'var(--bg-secondary)',
                  borderRadius: '16px',
                  padding: '20px',
                  marginBottom: '16px',
                  transition: 'all 0.3s ease',
                  animation: `fadeInUp 0.4s ease-out ${0.1 * index}s both`,
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateX(4px)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateX(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                >
                  {/* Color Bar - Left Side (Clickable in Admin) */}
                  <div style={{
                    position: 'absolute',
                    top: '0',
                    left: '0',
                    bottom: '0',
                    width: '12px',
                    borderRadius: '16px 0 0 16px',
                    background: getProjectColor(project),
                    cursor: isAdmin ? 'pointer' : 'default',
                    transition: 'all 0.2s ease'
                  }}
                  title={isAdmin ? "Click to change color" : ""}
                  onClick={isAdmin ? () => openColorPickerModal(project.id) : undefined}
                  onMouseEnter={isAdmin ? (e) => {
                    e.target.style.width = '24px';
                    e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
                  } : undefined}
                  onMouseLeave={isAdmin ? (e) => {
                    e.target.style.width = '12px';
                    e.target.style.boxShadow = 'none';
                  } : undefined}
                  ></div>

                  {/* Delete Button - Top Right */}
                  {isAdmin && (
                    <div style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      zIndex: 10
                    }}>
                      <button
                        onClick={() => showConfirmDeleteModal(project.id)}
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: 'var(--danger)',
                          color: 'white',
                          border: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: 700,
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'scale(1.1)';
                          e.target.style.boxShadow = '0 2px 8px rgba(255, 59, 48, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'scale(1)';
                          e.target.style.boxShadow = 'none';
                        }}
                        title="Delete project"
                      >
                        ×
                      </button>
                    </div>
                  )}

                  {/* Complete Button - Right Side */}
                  {isAdmin && (
                    <div style={{
                      position: 'absolute',
                      top: '0',
                      right: '0',
                      bottom: '0',
                      width: '12px',
                      borderRadius: '0 16px 16px 0',
                      background: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onClick={() => showConfirmCompleteModal(project.id)}
                    onMouseEnter={(e) => {
                      e.target.style.width = '24px';
                      e.target.style.boxShadow = '0 2px 8px rgba(0, 122, 255, 0.3)';
                      const checkmark = e.target.querySelector('.checkmark');
                      if (checkmark) {
                        checkmark.style.fontSize = '18px';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.width = '12px';
                      e.target.style.boxShadow = 'none';
                      const checkmark = e.target.querySelector('.checkmark');
                      if (checkmark) {
                        checkmark.style.fontSize = '14px';
                      }
                    }}
                    title="Mark as completed"
                    >
                      <div className="checkmark" style={{
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: 700,
                        transition: 'all 0.2s ease'
                      }}>
                        ✓
                      </div>
                    </div>
                  )}

                  {/* Project Details Grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '2.2fr 1.4fr 1.2fr 1.2fr 0.8fr 1.2fr 1fr',
                    gap: '16px',
                    alignItems: 'center'
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', textAlign: 'center' }}>
                      <div style={{
                        fontSize: '12px',
                        color: 'var(--text-quaternary)',
                        fontWeight: 500,
                        letterSpacing: '0.06em',
                        textAlign: 'center',
                        height: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        Project
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        height: '40px',
                        width: '100%',
                        justifyContent: 'center'
                      }}>
                        {isAdmin ? (
                          <div
                            onClick={() => openProjectNameModal(project.id, project.name)}
                            style={{
                              padding: '8px 12px',
                              borderRadius: '8px',
                              border: '1px solid var(--gray-3)',
                              textAlign: 'center',
                              fontWeight: 600,
                              cursor: 'pointer',
                              background: 'var(--bg-primary)',
                              transition: 'all 0.2s ease',
                              width: '100%',
                              height: '40px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '14px',
                              overflowWrap: 'break-word',
                              wordBreak: 'break-word',
                              whiteSpace: 'normal',
                              lineHeight: '1.2'
                            }}
                            title="Click to edit"
                            onMouseEnter={(e) => {
                              e.target.style.borderColor = 'var(--primary)';
                              e.target.style.transform = 'scale(1.02)';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.borderColor = 'var(--gray-3)';
                              e.target.style.transform = 'scale(1)';
                            }}
                          >
                            {project.name}
                          </div>
                        ) : (
                          <div style={{ 
                            fontWeight: 600, 
                            fontSize: '14px',
                            width: '100%',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '8px 12px',
                            overflowWrap: 'break-word',
                            wordBreak: 'break-word',
                            whiteSpace: 'normal',
                            lineHeight: '1.2',
                            textAlign: 'center'
                          }}>{project.name}</div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', textAlign: 'center' }}>
                      <div style={{
                        fontSize: '12px',
                        color: 'var(--text-quaternary)',
                        fontWeight: 500,
                        letterSpacing: '0.06em',
                        textAlign: 'center',
                        height: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        Status
                      </div>
                      {isAdmin ? (
                        <select
                          value={project.status}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateProject(project.id, { status: val }, `${new Date().toLocaleString()}: Status changed to ${val}`);
                          }}
                          style={{
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: '1px solid transparent',
                            width: '100%',
                            height: '40px',
                            textAlign: 'center',
                            fontWeight: 600,
                            backgroundColor: statusColors[project.status] || '#e5e5ea',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: '14px',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.transform = 'scale(1.02)';
                            e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.transform = 'scale(1)';
                            e.target.style.boxShadow = 'none';
                          }}
                        >
                          <option value="Waiting" style={{color: '#000', backgroundColor: '#fff'}}>Waiting</option>
                          <option value="In Progress" style={{color: '#000', backgroundColor: '#fff'}}>In Progress</option>
                          <option value="Queued" style={{color: '#000', backgroundColor: '#fff'}}>Queued</option>
                          <option value="Hold" style={{color: '#000', backgroundColor: '#fff'}}>Hold</option>
                          <option value="Completed" style={{color: '#000', backgroundColor: '#fff'}}>Completed</option>
                        </select>
                      ) : (
                        <div style={{
                          padding: '8px 12px',
                          borderRadius: '8px',
                          backgroundColor: statusColors[project.status] || '#e5e5ea',
                          color: '#fff',
                          fontWeight: 600,
                          fontSize: '14px',
                          height: '40px',
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s ease'
                        }}>
                          {project.status}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', textAlign: 'center' }}>
                      <div style={{
                        fontSize: '12px',
                        color: 'var(--text-quaternary)',
                        fontWeight: 500,
                        letterSpacing: '0.06em',
                        textAlign: 'center',
                        height: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        Start
                      </div>
                      {isAdmin ? (
                        <input
                          type='date'
                          value={project.startDate}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (new Date(val) > new Date(project.dueDate)) {
                              showDateValidationModal('Start date cannot be later than Due date', null);
                              return;
                            }
                            updateProject(project.id, { startDate: val }, `${new Date().toLocaleString()}: Start changed to ${val}`);
                          }}
                          style={{
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: '1px solid var(--gray-3)',
                            background: 'var(--bg-primary)',
                            fontFamily: 'inherit',
                            fontSize: '14px',
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            width: '100%',
                            height: '40px',
                            textAlign: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.borderColor = 'var(--primary)';
                            e.target.style.transform = 'scale(1.02)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.borderColor = 'var(--gray-3)';
                            e.target.style.transform = 'scale(1)';
                          }}
                        />
                      ) : (
                        <div style={{
                          height: '40px', 
                          width: '100%',
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          fontSize: '14px',
                          padding: '8px 12px',
                          border: '1px solid var(--gray-3)',
                          borderRadius: '8px',
                          background: 'var(--bg-primary)',
                          fontWeight: 600
                        }}>{formatDateForDisplay(project.startDate)}</div>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', textAlign: 'center' }}>
                      <div style={{
                        fontSize: '12px',
                        color: 'var(--text-quaternary)',
                        fontWeight: 500,
                        letterSpacing: '0.06em',
                        textAlign: 'center',
                        height: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        Due
                      </div>
                      <input
                        type='date'
                        value={project.dueDate}
                        min={project.startDate}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (new Date(val) < new Date(project.startDate)) {
                            showDateValidationModal('Due date cannot be earlier than Start date', null);
                            return;
                          }
                          updateProject(project.id, { dueDate: val }, `${new Date().toLocaleString()}: Due changed to ${val}`);
                        }}
                        style={{
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: '1px solid var(--gray-3)',
                          background: 'var(--bg-primary)',
                          fontFamily: 'inherit',
                          fontSize: '14px',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          width: '100%',
                          height: '40px',
                          textAlign: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.borderColor = 'var(--primary)';
                          e.target.style.transform = 'scale(1.02)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.borderColor = 'var(--gray-3)';
                          e.target.style.transform = 'scale(1)';
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', textAlign: 'center' }}>
                      <div style={{
                        fontSize: '12px',
                        color: 'var(--text-quaternary)',
                        fontWeight: 500,
                        letterSpacing: '0.06em',
                        textAlign: 'center',
                        height: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        Busy
                      </div>
                      {isAdmin ? (
                        <input
                          type='number'
                          value={project.busy}
                          onChange={(e) => updateProject(project.id, { busy: Math.max(0, Number(e.target.value) || 0) }, `${new Date().toLocaleString()}: Busy set to ${e.target.value}`)}
                          style={{
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: '1px solid var(--gray-3)',
                            background: 'var(--bg-primary)',
                            fontFamily: 'inherit',
                            fontSize: '14px',
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            width: '100%',
                            height: '40px',
                            textAlign: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.borderColor = 'var(--primary)';
                            e.target.style.transform = 'scale(1.02)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.borderColor = 'var(--gray-3)';
                            e.target.style.transform = 'scale(1)';
                          }}
                        />
                      ) : (
                        <div style={{ 
                          width: '100%', 
                          height: '40px', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          fontSize: '14px',
                          padding: '8px 12px',
                          border: '1px solid var(--gray-3)',
                          borderRadius: '8px',
                          background: 'var(--bg-primary)',
                          fontWeight: 600
                        }}>{project.busy}</div>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', textAlign: 'center' }}>
                      <div style={{
                        fontSize: '12px',
                        color: 'var(--text-quaternary)',
                        fontWeight: 500,
                        letterSpacing: '0.06em',
                        textAlign: 'center',
                        height: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        Priority
                      </div>
                      <select
                        value={project.priority}
                        onChange={(e) => updateProject(project.id, { priority: e.target.value }, `${new Date().toLocaleString()}: Priority changed to ${e.target.value}`)}
                        style={{
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: '1px solid var(--gray-3)',
                          width: '100%',
                          height: '40px',
                          textAlign: 'center',
                          fontWeight: 600,
                          backgroundColor: priorityColors[project.priority] || '#fff',
                          color: ['High', 'Medium'].includes(project.priority) ? '#fff' : '#000',
                          cursor: 'pointer',
                          fontSize: '14px',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'scale(1.02)';
                          e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'scale(1)';
                          e.target.style.boxShadow = 'none';
                        }}
                      >
                        <option value="Low" style={{color: '#000', backgroundColor: '#fff'}}>Low</option>
                        <option value="Medium" style={{color: '#000', backgroundColor: '#fff'}}>Medium</option>
                        <option value="High" style={{color: '#000', backgroundColor: '#fff'}}>High</option>
                      </select>
                    </div>

                    <div style={{
                      display: 'flex',
                      gap: '8px',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '40px',
                      marginTop: '24px'
                    }}>
                      <div
                        onClick={() => openComments(project.id)}
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '20px',
                          border: '1px solid var(--gray-3)',
                          background: 'var(--bg-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          fontSize: '16px',
                          transition: 'all 0.2s ease',
                          position: 'relative'
                        }}
                        title={isAdmin && project.comments.length > 0 ? "Comments (Right-click to clear)" : "Comments"}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'scale(1.1) rotate(5deg)';
                          e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'scale(1) rotate(0deg)';
                          e.target.style.boxShadow = 'none';
                        }}
                        onContextMenu={isAdmin && project.comments.length > 0 ? (e) => {
                          e.preventDefault();
                          setClearCommentsModal(project.id);
                        } : undefined}
                      >
                        💬
                        {project.comments.length > 0 && (
                          <span style={{ 
                            position: 'absolute',
                            top: '-4px',
                            right: '-4px',
                            fontSize: '10px', 
                            fontWeight: 600,
                            backgroundColor: 'var(--danger)',
                            color: 'white',
                            borderRadius: '50%',
                            width: '16px',
                            height: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            {project.comments.length}
                          </span>
                        )}
                      </div>
                      <div
                        title={isAdmin && project.history && project.history.length > 0 ? "History (Right-click to clear)" : "History"}
                        onClick={() => openHistory(project.id)}
                        onContextMenu={isAdmin && project.history && project.history.length > 0 ? (e) => {
                          e.preventDefault();
                          setClearHistoryModal(project.id);
                        } : undefined}
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '20px',
                          border: '1px solid var(--gray-3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          fontWeight: 700,
                          background: 'var(--bg-primary)',
                          fontSize: '16px',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'scale(1.1) rotate(-5deg)';
                          e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'scale(1) rotate(0deg)';
                          e.target.style.boxShadow = 'none';
                        }}
                      >
                        📋
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Timeline Calendar */}
        <div style={{
          background: 'var(--bg-primary)',
          borderRadius: '20px',
          padding: '24px',
          boxShadow: 'var(--shadow)',
          animation: 'fadeInUp 0.6s ease-out 0.6s both'
        }}>
          <div style={{
            padding: '0 0 24px 0',
            borderBottom: '0.5px solid var(--separator)'
          }}>
            <h3 style={{
              fontSize: '28px',
              fontWeight: 700,
              letterSpacing: '-0.024em',
              color: 'var(--text-primary)',
              margin: 0
            }}>
              Timeline Overview (Calendar)
            </h3>
          </div>
          
          <div style={{ marginTop: '16px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <button
                  onClick={() => changeMonth(-1)}
                  style={{
                    background: 'var(--bg-secondary)',
                    color: 'var(--primary)',
                    border: 'none',
                    padding: '8px 12px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 500,
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'var(--primary)';
                    e.target.style.color = 'white';
                    e.target.style.transform = 'translateX(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'var(--bg-secondary)';
                    e.target.style.color = 'var(--primary)';
                    e.target.style.transform = 'translateX(0)';
                  }}
                >
                  ←
                </button>
                <button
                  onClick={goToToday}
                  style={{
                    background: 'var(--bg-secondary)',
                    color: 'var(--primary)',
                    border: 'none',
                    padding: '8px 12px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 500,
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'var(--primary)';
                    e.target.style.color = 'white';
                    e.target.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'var(--bg-secondary)';
                    e.target.style.color = 'var(--primary)';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  Today
                </button>
                <button
                  onClick={() => changeMonth(1)}
                  style={{
                    background: 'var(--bg-secondary)',
                    color: 'var(--primary)',
                    border: 'none',
                    padding: '8px 12px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 500,
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'var(--primary)';
                    e.target.style.color = 'white';
                    e.target.style.transform = 'translateX(2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'var(--bg-secondary)';
                    e.target.style.color = 'var(--primary)';
                    e.target.style.transform = 'translateX(0)';
                  }}
                >
                  →
                </button>
              </div>
              <div style={{
                fontSize: '18px',
                fontWeight: 700
              }}>
                {monthNames[currentDate.month]} {currentDate.year}
              </div>
              <div style={{ width: 100 }}></div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '6px',
              marginBottom: '12px'
            }}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} style={{
                  fontWeight: 700,
                  fontSize: '12px',
                  textAlign: 'center',
                  color: 'var(--text-quaternary)',
                  textTransform: 'uppercase'
                }}>
                  {d}
                </div>
              ))}
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '6px'
            }}>
              {Array.from({ length: firstDayIndex }).map((_, i) => (
                <div key={'blank-' + i} style={{
                  padding: '10px',
                  borderRadius: '10px',
                  background: 'transparent',
                  textAlign: 'center'
                }}></div>
              ))}

              {monthDays.map((day, i) => {
                const key = formatDateToYYYYMMDD(day);
                const projects = getProjectsForDay(key);
                const tooltipText = projectsOnDay(key).join('\n');
                const titleAttr = `${key} — ${projects.length} project(s).\n${tooltipText}`;
                
                return (
                  <div
                    key={i}
                    style={{
                      padding: '10px',
                      borderRadius: '10px',
                      background: createDayBackground(key),
                      color: projects.length > 0 ? '#fff' : '#000',
                      textAlign: 'center',
                      border: dayBorder(key),
                      position: 'relative',
                      fontSize: '14px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      textShadow: projects.length > 0 ? '1px 1px 2px rgba(0,0,0,0.7)' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                    title={titleAttr}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'scale(1.1)';
                      e.target.style.zIndex = '10';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'scale(1)';
                      e.target.style.zIndex = '1';
                    }}
                  >
                    {day.getDate()}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Add CSS animations */}
      <style>
        {`
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateX(-50%) translateY(-20px);
            }
            to {
              opacity: 1;
              transform: translateX(-50%) translateY(0);
            }
          }
          
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.7;
            }
          }
          
          .modal-backdrop {
            animation: fadeIn 0.2s ease-out;
          }
          
          .modal-content {
            animation: slideInModal 0.3s ease-out;
          }
          
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          @keyframes slideInModal {
            from {
              opacity: 0;
              transform: scale(0.9) translateY(-10px);
            }
            to {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
          }
        `}
      </style>

      {/* Password Modal */}
      {passwordModal && (
        <div className="modal-backdrop" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.4)',
          zIndex: 1200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div className="modal-content" style={{
            background: 'var(--bg-primary)',
            borderRadius: '18px',
            maxWidth: '400px',
            textAlign: 'center',
            padding: '24px'
          }}>
            <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Admin Access Required</div>
            <input
              type="password"
              placeholder="Enter admin password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && checkPassword()}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '10px',
                border: '1px solid var(--gray-4)',
                marginBottom: '16px',
                fontSize: '16px'
              }}
              autoFocus
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button 
                onClick={() => {
                  setPasswordModal(false);
                  setPasswordInput('');
                }} 
                style={{
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
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
                  padding: '10px 20px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Login
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Date Validation Modal */}
      {dateValidationModal.open && (
        <div className="modal-backdrop" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.4)',
          zIndex: 1200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div className="modal-content" style={{
            background: 'var(--bg-primary)',
            borderRadius: '18px',
            maxWidth: '400px',
            textAlign: 'center',
            padding: '24px'
          }}>
            <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Attention</div>
            <div style={{ marginBottom: '20px' }}>{dateValidationModal.message}</div>
            <button 
              onClick={closeDateValidationModal} 
              style={{
                background: 'var(--primary)',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {confirmDeleteModal.open && (
        <div className="modal-backdrop" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.4)',
          zIndex: 1200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div className="modal-content" style={{
            background: 'var(--bg-primary)',
            borderRadius: '18px',
            maxWidth: '400px',
            textAlign: 'center',
            padding: '24px'
          }}>
            <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Attention</div>
            <div style={{ marginBottom: '20px' }}>Are you sure you want to delete this project?</div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button 
                onClick={closeConfirmDeleteModal} 
                style={{
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
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
                  padding: '10px 20px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
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
        <div className="modal-backdrop" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.4)',
          zIndex: 1200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div className="modal-content" style={{
            background: 'var(--bg-primary)',
            borderRadius: '18px',
            maxWidth: '400px',
            textAlign: 'center',
            padding: '24px'
          }}>
            <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Attention</div>
            <div style={{ marginBottom: '20px' }}>Are you sure you want to mark the project as completed?</div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button 
                onClick={closeConfirmCompleteModal} 
                style={{
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Cancel
              </button>
              <button 
                onClick={() => completeProject(confirmCompleteModal.projectId)} 
                style={{
                  background: 'var(--primary)',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Complete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Color Picker Modal */}
      {colorPickerModal.open && (
        <div className="modal-backdrop" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.4)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }} onClick={closeColorPickerModal}>
          <div className="modal-content" style={{
            background: 'var(--bg-primary)',
            borderRadius: '18px',
            width: '92%',
            maxWidth: '400px',
            padding: '24px'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Choose Project Color</div>
            
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', marginBottom: '8px', color: 'var(--text-secondary)' }}>Current Color:</div>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: colorPickerModal.currentColor,
                margin: '0 auto',
                marginBottom: '16px',
                border: '3px solid #fff',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
              }}></div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', marginBottom: '8px', color: 'var(--text-secondary)' }}>Select New Color:</div>
              <input
                type="color"
                value={colorPickerModal.currentColor}
                onChange={(e) => setColorPickerModal(prev => ({ ...prev, currentColor: e.target.value }))}
                style={{
                  width: '100%',
                  height: '40px',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', marginBottom: '8px', color: 'var(--text-secondary)' }}>Standard Color Palette:</div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(8, 1fr)',
                gap: '6px'
              }}>
                {[
                  // Reds
                  '#FF0000', '#FF3333', '#FF6666', '#FF9999',
                  // Oranges  
                  '#FF8C00', '#FFA500', '#FFB84D', '#FFCC80',
                  // Yellows
                  '#FFD700', '#FFFF00', '#FFFF66', '#FFFF99',
                  // Greens
                  '#008000', '#32CD32', '#90EE90', '#98FB98',
                  // Blues
                  '#0000FF', '#4169E1', '#87CEEB', '#ADD8E6',
                  // Purples
                  '#800080', '#9932CC', '#DDA0DD', '#E6E6FA',
                  // Pinks
                  '#FF1493', '#FF69B4', '#FFB6C1', '#FFC0CB',
                  // Browns
                  '#8B4513', '#A0522D', '#CD853F', '#D2B48C',
                  // Grays
                  '#000000', '#404040', '#808080', '#C0C0C0',
                  // Additional colors
                  '#FFFFFF', '#00FFFF', '#FF00FF', '#00FF00',
                  '#FFE4E1', '#F0E68C', '#E0FFFF', '#F5F5DC',
                  '#FF4500', '#DC143C', '#00CED1', '#9370DB',
                  '#228B22', '#B22222', '#4682B4', '#D2691E'
                ].map((color, idx) => (
                  <div
                    key={idx}
                    onClick={() => setColorPickerModal(prev => ({ ...prev, currentColor: color }))}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '4px',
                      backgroundColor: color,
                      cursor: 'pointer',
                      border: colorPickerModal.currentColor === color ? '3px solid var(--primary)' : color === '#FFFFFF' ? '2px solid #ddd' : '2px solid transparent',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'scale(1.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'scale(1)';
                    }}
                  ></div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button onClick={closeColorPickerModal} style={{
                background: 'var(--bg-secondary)', 
                padding: '8px 16px', 
                borderRadius: '10px', 
                border: 'none', 
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}>Cancel</button>
              <button onClick={saveProjectColor} style={{
                background: 'var(--primary)', 
                color: 'white', 
                padding: '8px 16px', 
                borderRadius: '10px', 
                border: 'none', 
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}>Save Color</button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      {isAlertOpen && (
        <div className="modal-backdrop" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.4)',
          zIndex: 1200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div className="modal-content" style={{
            background: 'var(--bg-primary)',
            borderRadius: '18px',
            maxWidth: '400px',
            textAlign: 'center',
            padding: '24px'
          }}>
            <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Attention</div>
            <div style={{ marginBottom: '20px' }}>{alertMessage}</div>
            <button onClick={() => setIsAlertOpen(false)} style={{
              background: 'var(--primary)',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '10px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}>OK</button>
          </div>
        </div>
      )}

      {/* Comments Modal */}
      {commentsForId && (
        <div className="modal-backdrop" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }} onClick={closeComments}>
          <div className="modal-content" style={{
            background: 'var(--bg-primary)',
            borderRadius: '18px',
            width: '92%',
            maxWidth: '920px',
            maxHeight: '86vh',
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            flexDirection: 'column'
          }} onClick={e => e.stopPropagation()}>
            <div style={{
              padding: '18px 24px',
              borderBottom: '0.5px solid var(--separator)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 700 }}>
                  Comments — {state.projects.find(p => p.id === commentsForId)?.name}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-quaternary)' }}>
                  {state.projects.find(p => p.id === commentsForId)?.comments?.length || 0} comment(s)
                </div>
              </div>
              <button onClick={closeComments} style={{
                background: 'var(--bg-tertiary)',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '10px',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}>Close</button>
            </div>
            <div style={{ padding: '24px', overflow: 'auto', flex: 1 }}>
              <div style={{
                border: '1px solid var(--separator)',
                borderRadius: '12px',
                padding: '12px',
                minHeight: '200px',
                maxHeight: '400px',
                overflowY: 'auto',
                background: 'var(--bg-secondary)',
                marginBottom: '16px'
              }}>
                {state.projects.find(p => p.id === commentsForId)?.comments?.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-quaternary)' }}>
                    No comments yet
                  </div>
                )}
                {state.projects.find(p => p.id === commentsForId)?.comments?.map(c => (
                  <div key={c.id} style={{
                    padding: '12px',
                    borderRadius: '10px',
                    background: c.deleted || c.ignored ? '#fafafa' : 'var(--bg-primary)',
                    marginBottom: '8px',
                    border: '1px solid var(--separator)',
                    transition: 'all 0.2s ease'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: '14px',
                          color: (c.deleted || c.ignored) ? 'var(--text-quaternary)' : 'var(--text-primary)',
                          textDecoration: (c.deleted || c.ignored) ? 'line-through' : 'none'
                        }}>
                          {c.text || (c.deleted ? '(deleted)' : '')}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-quaternary)', marginTop: '6px' }}>
                          {c.ts ? new Date(c.ts).toLocaleString() : ''}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <button onClick={() => startEdit(c.id, c.text)} style={{
                          background: 'var(--bg-secondary)',
                          border: 'none',
                          padding: '6px 10px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}>✏️ Edit</button>
                        <button 
                          disabled={c.ignored} 
                          onClick={() => confirmIgnoreComment(c.id)} 
                          style={{
                            background: 'var(--bg-secondary)',
                            border: 'none',
                            padding: '6px 10px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            cursor: c.ignored ? 'not-allowed' : 'pointer',
                            opacity: c.ignored ? 0.5 : 1,
                            transition: 'all 0.2s ease'
                          }}
                        >{c.ignored ? 'Ignored' : 'Ignore'}</button>
                      </div>
                    </div>
                    {editingId === c.id && (
                      <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                        <input
                          value={editingText}
                          onChange={e => setEditingText(e.target.value)}
                          placeholder='Edit comment...'
                          style={{
                            flex: 1,
                            padding: '8px',
                            borderRadius: '10px',
                            border: '1px solid var(--gray-4)',
                            transition: 'all 0.2s ease'
                          }}
                        />
                        <button onClick={() => saveEdit(c.id)} style={{
                          background: 'var(--primary)',
                          color: 'white',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}>Save</button>
                        <button onClick={() => { setEditingId(null); setEditingText(''); }} style={{
                          background: 'var(--bg-secondary)',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}>Cancel</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  placeholder='Write a comment...'
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '12px',
                    border: '1px solid var(--gray-4)',
                    transition: 'all 0.2s ease'
                  }}
                />
                <button
                  disabled={!draft.trim()}
                  onClick={() => setConfirmAddOpen(true)}
                  style={{
                    background: 'var(--primary)',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '10px',
                    cursor: draft.trim() ? 'pointer' : 'not-allowed',
                    opacity: draft.trim() ? 1 : 0.5,
                    transition: 'all 0.2s ease'
                  }}
                >Add</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {historyForId && (
        <div className="modal-backdrop" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }} onClick={closeHistory}>
          <div className="modal-content" style={{
            background: 'var(--bg-primary)',
            borderRadius: '18px',
            width: '92%',
            maxWidth: '920px',
            maxHeight: '86vh',
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            flexDirection: 'column'
          }} onClick={e => e.stopPropagation()}>
            <div style={{
              padding: '18px 24px',
              borderBottom: '0.5px solid var(--separator)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 700 }}>
                  History — {state.projects.find(p => p.id === historyForId)?.name}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-quaternary)' }}>
                  {(state.projects.find(p => p.id === historyForId)?.history || []).length} record(s)
                </div>
              </div>
              <button
                onClick={closeHistory}
                style={{
                  background: 'var(--bg-tertiary)',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  color: 'var(--text-primary)',
                  transition: 'all 0.2s ease'
                }}
              >
                Close
              </button>
            </div>
            <div style={{ padding: '24px', overflow: 'auto', flex: 1 }}>
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {(state.projects.find(p => p.id === historyForId)?.history || []).length === 0 && (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-quaternary)' }}>
                    No history yet
                  </div>
                )}
                {(state.projects.find(p => p.id === historyForId)?.history || []).slice().reverse().map((h, idx) => {
                  const sep = h.lastIndexOf(': ');
                  let datePart = '';
                  let msgPart = h;
                  if (sep !== -1) {
                    datePart = h.slice(0, sep);
                    msgPart = h.slice(sep + 2);
                  }
                  return (
                    <div key={idx} style={{
                      padding: '12px',
                      background: 'var(--bg-secondary)',
                      borderRadius: '10px',
                      marginBottom: '8px',
                      border: '1px solid var(--separator)',
                      transition: 'all 0.2s ease',
                      animation: `fadeInUp 0.3s ease-out ${0.05 * idx}s both`
                    }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {msgPart}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-quaternary)', marginTop: '6px' }}>
                        {datePart}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Project Modal */}
      {isAddModalOpen && (
        <div className="modal-backdrop" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.4)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }} onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-content" style={{
            background: 'var(--bg-primary)',
            borderRadius: '18px',
            width: '92%',
            maxWidth: '500px',
            padding: '24px'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Add New Project</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                type="text"
                placeholder="Project name"
                value={newProject.name}
                onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))}
                style={{ 
                  padding: '10px', 
                  borderRadius: '10px', 
                  border: '1px solid var(--gray-4)',
                  transition: 'all 0.2s ease'
                }}
              />
              <select
                value={newProject.status}
                onChange={(e) => setNewProject(prev => ({ ...prev, status: e.target.value }))}
                style={{ 
                  padding: '10px', 
                  borderRadius: '10px', 
                  border: '1px solid var(--gray-4)',
                  transition: 'all 0.2s ease'
                }}
              >
                <option value="Waiting">Waiting</option>
                <option value="In Progress">In Progress</option>
                <option value="Queued">Queued</option>
                <option value="Hold">Hold</option>
                <option value="Completed">Completed</option>
              </select>
              <input
                type="date"
                value={newProject.startDate}
                onChange={(e) => setNewProject(prev => ({ ...prev, startDate: e.target.value }))}
                style={{ 
                  padding: '10px', 
                  borderRadius: '10px', 
                  border: '1px solid var(--gray-4)',
                  transition: 'all 0.2s ease'
                }}
              />
              <input
                type="date"
                value={newProject.dueDate}
                onChange={(e) => setNewProject(prev => ({ ...prev, dueDate: e.target.value }))}
                style={{ 
                  padding: '10px', 
                  borderRadius: '10px', 
                  border: '1px solid var(--gray-4)',
                  transition: 'all 0.2s ease'
                }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <label style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Project Color:</label>
                <input
                  type="color"
                  value={newProject.color}
                  onChange={(e) => setNewProject(prev => ({ ...prev, color: e.target.value }))}
                  style={{ 
                    width: '40px', 
                    height: '30px', 
                    border: 'none', 
                    borderRadius: '6px', 
                    cursor: 'pointer' 
                  }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <button onClick={() => setIsAddModalOpen(false)} style={{
                background: 'var(--bg-secondary)', 
                padding: '8px 16px', 
                borderRadius: '10px', 
                border: 'none', 
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}>Cancel</button>
              <button onClick={addProject} style={{
                background: 'var(--primary)', 
                color: 'white', 
                padding: '8px 16px', 
                borderRadius: '10px', 
                border: 'none', 
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}>Add</button>
            </div>
          </div>
        </div>
      )}

      {/* Project Name Modal */}
      {projectNameModal.open && (
        <div className="modal-backdrop" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.4)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }} onClick={closeProjectNameModal}>
          <div className="modal-content" style={{
            background: 'var(--bg-primary)',
            borderRadius: '18px',
            width: '92%',
            maxWidth: '400px',
            padding: '24px'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Edit Project Name</div>
            <input
              type="text"
              value={projectNameModal.name}
              onChange={e => setProjectNameModal({ ...projectNameModal, name: e.target.value })}
              placeholder="Project name"
              style={{ 
                width: '100%', 
                padding: '10px', 
                borderRadius: '10px', 
                border: '1px solid var(--gray-4)', 
                marginBottom: '16px',
                transition: 'all 0.2s ease'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button onClick={closeProjectNameModal} style={{
                background: 'var(--bg-secondary)', 
                padding: '8px 16px', 
                borderRadius: '10px', 
                border: 'none', 
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}>Cancel</button>
              <button onClick={saveProjectName} style={{
                background: 'var(--primary)', 
                color: 'white', 
                padding: '8px 16px', 
                borderRadius: '10px', 
                border: 'none', 
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialogs */}
      {confirmAddOpen && (
        <div className="modal-backdrop" style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          background: 'rgba(0, 0, 0, 0.5)'
        }}>
          <div className="modal-content" style={{
            background: 'var(--bg-primary)',
            padding: '20px',
            borderRadius: '12px',
            maxWidth: '400px'
          }}>
            <div style={{ fontWeight: 700, marginBottom: '8px' }}>Are you sure?</div>
            <div style={{ marginBottom: '16px' }}>Add this comment to the project?</div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button onClick={() => setConfirmAddOpen(false)} style={{
                background: 'var(--bg-secondary)',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}>Cancel</button>
              <button onClick={addCommentConfirmed} style={{
                background: 'var(--primary)',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}>Ok</button>
            </div>
          </div>
        </div>
      )}

      {confirmIgnore && (
        <div className="modal-backdrop" style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          background: 'rgba(0, 0, 0, 0.5)'
        }}>
          <div className="modal-content" style={{
            background: 'var(--bg-primary)',
            padding: '20px',
            borderRadius: '12px',
            maxWidth: '400px'
          }}>
            <div style={{ fontWeight: 700, marginBottom: '8px' }}>Ignore comment?</div>
            <div style={{ marginBottom: '16px' }}>Are you sure you want to ignore this comment?</div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button onClick={() => setConfirmIgnore(null)} style={{
                background: 'var(--bg-secondary)',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}>No</button>
              <button onClick={doIgnore} style={{
                background: 'var(--primary)',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}>Yes</button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Comments Confirmation Modal */}
      {clearCommentsModal && (
        <div className="modal-backdrop" style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          background: 'rgba(0, 0, 0, 0.5)'
        }}>
          <div className="modal-content" style={{
            background: 'var(--bg-primary)',
            padding: '20px',
            borderRadius: '12px',
            maxWidth: '400px'
          }}>
            <div style={{ fontWeight: 700, marginBottom: '8px' }}>Clear All Comments?</div>
            <div style={{ marginBottom: '16px' }}>Are you sure you want to permanently delete all comments for this project? This action cannot be undone.</div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button onClick={() => setClearCommentsModal(null)} style={{
                background: 'var(--bg-secondary)',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}>Cancel</button>
              <button onClick={() => clearComments(clearCommentsModal)} style={{
                background: 'var(--danger)',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}>Clear All</button>
            </div>
          </div>
        </div>
      )}

      {/* Clear History Confirmation Modal */}
      {clearHistoryModal && (
        <div className="modal-backdrop" style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          background: 'rgba(0, 0, 0, 0.5)'
        }}>
          <div className="modal-content" style={{
            background: 'var(--bg-primary)',
            padding: '20px',
            borderRadius: '12px',
            maxWidth: '400px'
          }}>
            <div style={{ fontWeight: 700, marginBottom: '8px' }}>Clear All History?</div>
            <div style={{ marginBottom: '16px' }}>Are you sure you want to permanently delete all history records for this project? This action cannot be undone.</div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button onClick={() => setClearHistoryModal(null)} style={{
                background: 'var(--bg-secondary)',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}>Cancel</button>
              <button onClick={() => clearHistory(clearHistoryModal)} style={{
                background: 'var(--danger)',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}>Clear All</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectStatusDashboard;