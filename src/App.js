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
  const [workingWeekends, setWorkingWeekends] = useState(new Set());

  // Modal states
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

  // New custom modal states
  const [confirmDeleteModal, setConfirmDeleteModal] = useState({ open: false, projectId: null });
  const [confirmCompleteModal, setConfirmCompleteModal] = useState({ open: false, projectId: null });
  const [dateValidationModal, setDateValidationModal] = useState({ open: false, message: '', callback: null });

  // Camera and Stage states
  const [expandedProjectId, setExpandedProjectId] = useState(null);
  const [autoCollapseTimer, setAutoCollapseTimer] = useState(null);
  const [newCameraName, setNewCameraName] = useState('');
  const [stageModal, setStageModal] = useState({ open: false, projectId: null, cameraId: null });
  const [confirmRemoveCameraModal, setConfirmRemoveCameraModal] = useState({ open: false, projectId: null, cameraId: null });

  // CSS Variables for styling
  const cssVariables = {
    primary: '#007AFF',
    secondary: '#5856D6',
    success: '#34C759',
    warning: '#FF9500',
    danger: '#FF3B30',
    gray1: '#8E8E93',
    gray2: '#C7C7CC',
    gray3: '#D1D1D6',
    gray4: '#E5E5EA',
    gray5: '#F2F2F7',
    gray6: '#FFFFFF',
    textPrimary: '#000000',
    textSecondary: '#3C3C43',
    textTertiary: '#48484A',
    textQuaternary: '#8E8E93',
    bgPrimary: '#FFFFFF',
    bgSecondary: '#F2F2F7',
    bgTertiary: '#E5E5EA',
    separator: 'rgba(60, 60, 67, 0.12)',
    shadow: '0 0 20px rgba(0, 0, 0, 0.05)'
  };

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

      // Load holiday days
      const { data: holidays, error: holidaysError } = await supabase
        .from('holiday_days')
        .select('*');
      
      if (holidaysError && holidaysError.code !== 'PGRST116') {
        console.warn('Holiday days table not found, continuing without it');
      }

      // Load working weekends
      const { data: workingWeekendsData, error: workingWeekendsError } = await supabase
        .from('working_weekends')
        .select('*');
      
      if (workingWeekendsError && workingWeekendsError.code !== 'PGRST116') {
        console.warn('Working weekends table not found, continuing without it');
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
        color: project.color || null,
        comments: (project.project_comments || []).map(comment => ({
          id: comment.id,
          text: comment.text,
          ignored: comment.ignored,
          deleted: comment.deleted,
          ts: comment.created_at
        })),
        history: (project.project_history || [])
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .map(h => h.entry),
        cameras: project.cameras || []
      }));

      const totalArtists = settings?.find(s => s.key === 'totalArtists')?.value || 6;
      
      // Load holiday days
      const holidaySet = new Set();
      if (holidays && holidays.length > 0) {
        holidays.forEach(holiday => {
          holidaySet.add(holiday.date);
        });
      }
      setHolidayDays(holidaySet);

      // Load working weekends
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
          ...(projectData.color && { color: projectData.color }),
          cameras: projectData.cameras
        })
        .select();

      if (error) throw error;
      return data[0];
    } catch (err) {
      // If columns don't exist yet, save without them
      if (err.message?.includes("color") || err.message?.includes("cameras")) {
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

  // Load data on component mount
  useEffect(() => {
    loadInitialData();
  }, []);

  // Simulate connection status and periodic sync
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

  // Auto-collapse cameras list after 3 minutes
  useEffect(() => {
    if (expandedProjectId && !autoCollapseTimer) {
      const timer = setTimeout(() => {
        setExpandedProjectId(null);
        setAutoCollapseTimer(null);
      }, 180000);
      setAutoCollapseTimer(timer);
    }

    return () => {
      if (autoCollapseTimer) {
        clearTimeout(autoCollapseTimer);
      }
    };
  }, [expandedProjectId, autoCollapseTimer]);

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

  // Camera functions
  function toggleCameras(projectId) {
    if (expandedProjectId === projectId) {
      setExpandedProjectId(null);
      if (autoCollapseTimer) {
        clearTimeout(autoCollapseTimer);
        setAutoCollapseTimer(null);
      }
    } else {
      setExpandedProjectId(projectId);
      setNewCameraName('');
    }
  }

  function addCamera(projectId) {
    if (!newCameraName.trim()) {
      showAlert("Specify camera name!");
      return;
    }

    const project = state.projects.find(p => p.id === projectId);
    if (!project) return;

    const newCamera = {
      id: uid('cam'),
      name: newCameraName.trim(),
      stage: 'WIP'
    };

    const updatedCameras = [...(project.cameras || []), newCamera];
    updatedCameras.sort((a, b) => a.name.localeCompare(b.name));

    updateProjectCameras(projectId, updatedCameras, `Added camera: ${newCameraName.trim()}`);
    setNewCameraName('');
  }

  function removeCamera(projectId, cameraId) {
    const project = state.projects.find(p => p.id === projectId);
    if (!project) return;

    const camera = project.cameras.find(c => c.id === cameraId);
    if (!camera) return;

    const updatedCameras = project.cameras.filter(c => c.id !== cameraId);
    updateProjectCameras(projectId, updatedCameras, `Removed camera: ${camera.name}`);
    setConfirmRemoveCameraModal({ open: false, projectId: null, cameraId: null });
  }

  function updateCameraStage(projectId, cameraId, newStage) {
    const project = state.projects.find(p => p.id === projectId);
    if (!project) return;

    const camera = project.cameras.find(c => c.id === cameraId);
    if (!camera) return;

    const updatedCameras = project.cameras.map(c => 
      c.id === cameraId ? { ...c, stage: newStage } : c
    );

    updateProjectCameras(projectId, updatedCameras, `Camera ${camera.name} stage changed to ${newStage}`);
  }

  function increaseStageIteration(projectId, cameraId) {
    const project = state.projects.find(p => p.id === projectId);
    if (!project) return;

    const camera = project.cameras.find(c => c.id === cameraId);
    if (!camera) return;

    let newStage = camera.stage;

    if (camera.stage === 'WIP') {
      newStage = 'WIP01';
    } else if (camera.stage.startsWith('WIP')) {
      const currentNum = parseInt(camera.stage.replace('WIP', '')) || 0;
      if (currentNum < 99) {
        newStage = `WIP${(currentNum + 1).toString().padStart(2, '0')}`;
      }
    } else if (camera.stage === 'R') {
      newStage = 'R01';
    } else if (camera.stage.startsWith('R')) {
      const currentNum = parseInt(camera.stage.replace('R', '')) || 0;
      if (currentNum < 5) {
        newStage = `R${(currentNum + 1).toString().padStart(2, '0')}`;
      }
    }

    if (newStage !== camera.stage) {
      updateCameraStage(projectId, cameraId, newStage);
    }
  }

  function decreaseStageIteration(projectId, cameraId) {
    const project = state.projects.find(p => p.id === projectId);
    if (!project) return;

    const camera = project.cameras.find(c => c.id === cameraId);
    if (!camera) return;

    let newStage = camera.stage;

    if (camera.stage.startsWith('WIP')) {
      const currentNum = parseInt(camera.stage.replace('WIP', '')) || 0;
      if (currentNum > 1) {
        newStage = `WIP${(currentNum - 1).toString().padStart(2, '0')}`;
      } else if (currentNum === 1) {
        newStage = 'WIP';
      }
    } else if (camera.stage.startsWith('R')) {
      const currentNum = parseInt(camera.stage.replace('R', '')) || 0;
      if (currentNum > 1) {
        newStage = `R${(currentNum - 1).toString().padStart(2, '0')}`;
      } else if (currentNum === 1) {
        newStage = 'R';
      }
    }

    if (newStage !== camera.stage) {
      updateCameraStage(projectId, cameraId, newStage);
    }
  }

  function getStageColor(stage) {
    if (stage === 'WIP') return '#A0A0A0';
    if (stage.startsWith('WIP')) return '#A0A0A0';
    if (stage === 'ICD') return '#5A9BD4';
    if (stage === 'R') return '#FFD700';
    if (stage.startsWith('R')) {
      const num = parseInt(stage.replace('R', '')) || 1;
      const colors = ['#FFD700', '#FFA500', '#FF8C00', '#FF4500', '#FF0000'];
      return colors[Math.min(num - 1, 4)];
    }
    if (stage === 'Approved') return '#6BA66B';
    return '#A0A0A0';
  }

  function canDecreaseStage(stage) {
    if (stage === 'WIP' || stage === 'ICD' || stage === 'R' || stage === 'Approved') return false;
    if (stage.startsWith('WIP')) {
      const num = parseInt(stage.replace('WIP', '')) || 0;
      return num > 0;
    }
    if (stage.startsWith('R')) {
      const num = parseInt(stage.replace('R', '')) || 0;
      return num > 0;
    }
    return false;
  }

  function canIncreaseStage(stage) {
    if (stage === 'Approved') return false;
    if (stage.startsWith('WIP')) {
      const num = parseInt(stage.replace('WIP', '')) || 0;
      return num < 99;
    }
    if (stage.startsWith('R')) {
      const num = parseInt(stage.replace('R', '')) || 0;
      return num < 5;
    }
    return stage !== 'ICD';
  }

  function openStageModal(projectId, cameraId) {
    setStageModal({ open: true, projectId, cameraId });
  }

  function closeStageModal() {
    setStageModal({ open: false, projectId: null, cameraId: null });
  }

  function updateProjectCameras(projectId, cameras, historyEntry) {
    updateProject(projectId, { cameras }, historyEntry);
  }

  // Total Artists functions
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
          history: historyEntry ? [isAdmin ? `${historyEntry} [Admin]` : historyEntry, ...(p.history || [])] : p.history
        }) : p)
      }));

      setLastSync(new Date());
      
    } catch (err) {
      setError(`Failed to update project: ${err.message}`);
      console.error('Update error:', err);
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

  // Add Project function with new logic
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

  // Calendar functions
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

  // Timeline helpers
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

  function createDayBackground(dayKey) {
    const date = new Date(dayKey);
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isHoliday = holidayDays.has(dayKey);
    const isWorkingWeekend = workingWeekends.has(dayKey);
    
    if (isHoliday) {
      return cssVariables.bgSecondary;
    }
    
    if (isWeekend && !isWorkingWeekend) {
      return cssVariables.bgSecondary;
    }
    
    const projects = getProjectsForDay(dayKey);
    
    if (projects.length === 0) {
      return cssVariables.bgSecondary;
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
      return '3px solid #FF3B30';
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

  // New Project Status/Busy logic
  function handleNewProjectStatusChange(newStatus) {
    let newBusy = newProject.busy;
    
    if (newStatus === 'In Progress') {
      newBusy = 1;
    } else {
      newBusy = 0;
    }
    
    setNewProject({ ...newProject, status: newStatus, busy: newBusy });
  }

  function handleNewProjectBusyChange(newBusy) {
    let newStatus = newProject.status;
    
    if (newBusy === 0) {
      newStatus = 'Queued';
    } else if (newBusy > 0 && newProject.status === 'Queued') {
      newStatus = 'In Progress';
    }
    
    setNewProject({ ...newProject, busy: newBusy, status: newStatus });
  }

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
      background: cssVariables.gray5,
      minHeight: '100vh',
      color: cssVariables.textPrimary,
      fontSize: '17px',
      lineHeight: '1.47059',
      fontWeight: '400',
      letterSpacing: '-0.022em'
    }}>
      
      {/* Error notification */}
      {error && (
        <div style={{
          position: 'fixed',
          top: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 300,
          background: cssVariables.danger,
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
              fontSize: '16px'
            }}
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
        background: cssVariables.bgPrimary,
        padding: '8px 12px',
        borderRadius: '20px',
        boxShadow: cssVariables.shadow,
        fontSize: '12px'
      }}>
        <div style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: connected ? cssVariables.success : cssVariables.danger
        }}></div>
        {connected ? `Synced ${lastSync.toLocaleTimeString()}` : 'Reconnecting...'}
      </div>

      {/* Navigation Bar */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.72)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        borderBottom: `0.5px solid ${cssVariables.separator}`,
        marginBottom: '24px'
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
                background: cssVariables.bgSecondary,
                color: cssVariables.primary,
                border: 'none',
                padding: '8px 16px',
                borderRadius: '18px',
                fontSize: '15px',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              Refresh
            </button>
            <button
              onClick={handleAdminToggle}
              style={{
                background: cssVariables.bgSecondary,
                color: cssVariables.primary,
                border: 'none',
                padding: '8px 16px',
                borderRadius: '18px',
                fontSize: '15px',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              {isAdmin ? 'Admin Mode' : 'Admin'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '0 24px 24px'
      }}>

        {/* Header Section */}
        <div style={{
          textAlign: 'center',
          marginBottom: '32px',
          padding: '32px 20px',
          background: cssVariables.bgPrimary,
          borderRadius: '20px',
          boxShadow: cssVariables.shadow
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <img 
              src="/zigert-logo.png"
              alt="Zigert Logo"
              style={{
                width: '370px',
                height: 'auto'
              }}
            />
          </div>
          <div style={{
            fontSize: '14px',
            color: cssVariables.textQuaternary,
            marginTop: '16px'
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
            background: cssVariables.bgPrimary,
            padding: '20px',
            borderRadius: '20px',
            boxShadow: cssVariables.shadow,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '14px', color: cssVariables.textTertiary, marginBottom: '4px' }}>
              Total Artists{isAdmin ? ' (admin controls)' : ''}
            </div>
            {isAdmin ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                <button
                  onClick={() => updateTotalArtists(-1)}
                  disabled={state.totalArtists <= 1}
                  style={{
                    background: state.totalArtists <= 1 ? cssVariables.gray4 : cssVariables.bgSecondary,
                    border: 'none',
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: state.totalArtists <= 1 ? 'not-allowed' : 'pointer',
                    opacity: state.totalArtists <= 1 ? 0.5 : 1
                  }}
                >
                  <svg width="12" height="2" viewBox="0 0 12 2" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 1h10"/>
                  </svg>
                </button>
                <div style={{ fontSize: '32px', fontWeight: '600', color: cssVariables.textPrimary, minWidth: '60px' }}>
                  {total}
                </div>
                <button
                  onClick={() => updateTotalArtists(1)}
                  style={{
                    background: cssVariables.bgSecondary,
                    border: 'none',
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 1v10M1 6h10"/>
                  </svg>
                </button>
              </div>
            ) : (
              <div style={{ fontSize: '32px', fontWeight: '600', color: cssVariables.textPrimary }}>{total}</div>
            )}
          </div>
          <div style={{
            background: cssVariables.bgPrimary,
            padding: '20px',
            borderRadius: '20px',
            boxShadow: cssVariables.shadow,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '14px', color: cssVariables.textTertiary, marginBottom: '4px' }}>Busy</div>
            <div style={{ fontSize: '32px', fontWeight: '600', color: cssVariables.danger }}>{busy}</div>
          </div>
          <div style={{
            background: cssVariables.bgPrimary,
            padding: '20px',
            borderRadius: '20px',
            boxShadow: cssVariables.shadow,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '14px', color: cssVariables.textTertiary, marginBottom: '4px' }}>Free</div>
            <div style={{ fontSize: '32px', fontWeight: '600', color: cssVariables.success }}>{free}</div>
          </div>
          <div style={{
            background: cssVariables.bgPrimary,
            padding: '20px',
            borderRadius: '20px',
            boxShadow: cssVariables.shadow,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '14px', color: cssVariables.textTertiary, marginBottom: '4px' }}>Free %</div>
            <div style={{ fontSize: '32px', fontWeight: '600', color: cssVariables.success }}>{freePct}%</div>
          </div>
        </div>

        {/* Calendar Section */}
        <div style={{
          background: cssVariables.bgPrimary,
          borderRadius: '20px',
          boxShadow: cssVariables.shadow,
          marginBottom: '24px',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '20px 24px',
            borderBottom: `0.5px solid ${cssVariables.separator}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h2 style={{
              fontSize: '22px',
              fontWeight: '600',
              margin: 0,
              color: cssVariables.textPrimary
            }}>
              {monthNames[currentDate.month]} {currentDate.year}
            </h2>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                onClick={() => changeMonth(-1)}
                style={{
                  background: cssVariables.bgSecondary,
                  border: 'none',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 18l-6-6 6-6"/>
                </svg>
              </button>
              <button
                onClick={goToToday}
                style={{
                  background: cssVariables.bgSecondary,
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '16px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Today
              </button>
              <button
                onClick={() => changeMonth(1)}
                style={{
                  background: cssVariables.bgSecondary,
                  border: 'none',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
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
            gap: '6px',
            background: cssVariables.separator,
            padding: '8px'
          }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} style={{
                background: cssVariables.bgPrimary,
                padding: '12px',
                textAlign: 'center',
                fontSize: '14px',
                fontWeight: '500',
                color: cssVariables.textTertiary,
                borderRadius: '8px'
              }}>
                {day}
              </div>
            ))}
            
            {/* Empty cells for days before the first day of the month */}
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} style={{
                background: cssVariables.bgSecondary,
                minHeight: '28px',
                borderRadius: '8px'
              }}></div>
            ))}
            
            {/* Calendar days */}
            {monthDays.map(day => {
              const dayKey = formatDateToYYYYMMDD(day);
              const isToday = dayKey === todayKey;
              const dayOfWeek = day.getDay();
              const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
              const isHoliday = holidayDays.has(dayKey);
              const isWorkingWeekend = workingWeekends.has(dayKey);
              
              return (
                <div
                  key={dayKey}
                  style={{
                    background: createDayBackground(dayKey),
                    minHeight: '28px',
                    padding: '8px',
                    border: isHoliday ? '2px dashed #34C759' : (isWeekend && isWorkingWeekend ? '2px dashed #FF9500' : dayBorder(dayKey)),
                    borderRadius: '8px',
                    position: 'relative',
                    cursor: isAdmin ? 'pointer' : 'default'
                  }}
                  onClick={() => {
                    if (!isAdmin) return;
                    if (isHoliday) {
                      // toggleHolidayDay(dayKey);
                    } else if (isWeekend) {
                      // toggleWorkingWeekend(dayKey);
                    } else {
                      // toggleHolidayDay(dayKey);
                    }
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start'
                  }}>
                    <span style={{
                      fontSize: '12px',
                      fontWeight: isToday ? '600' : '400',
                      color: isToday ? cssVariables.danger : cssVariables.textPrimary,
                      background: isToday ? 'rgba(255, 255, 255, 0.9)' : 'transparent',
                      borderRadius: '8px',
                      padding: '1px 4px',
                      margin: '-1px -4px -1px -1px',
                      textDecoration: isHoliday ? 'line-through' : 'none'
                    }}>
                      {day.getDate()}
                    </span>
                    {isHoliday && (
                      <span style={{
                        background: 'rgba(52, 199, 89, 0.9)',
                        borderRadius: '4px',
                        padding: '1px 3px',
                        fontSize: '6px',
                        fontWeight: '500',
                        color: 'white'
                      }}>
                        Holiday
                      </span>
                    )}
                    {isWeekend && isWorkingWeekend && (
                      <span style={{
                        background: 'rgba(255, 149, 0, 0.9)',
                        borderRadius: '4px',
                        padding: '1px 3px',
                        fontSize: '6px',
                        fontWeight: '500',
                        color: 'white'
                      }}>
                        Work
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Projects Section */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <h2 style={{
            fontSize: '22px',
            fontWeight: '600',
            margin: 0,
            color: cssVariables.textPrimary
          }}>
            Projects ({state.projects.length})
          </h2>
          {isAdmin && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              style={{
                background: cssVariables.primary,
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '18px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Add Project
            </button>
          )}
        </div>

        {/* Projects Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          {state.projects.map(project => (
            <div
              key={project.id}
              style={{
                background: cssVariables.bgPrimary,
                borderRadius: '20px',
                boxShadow: cssVariables.shadow,
                padding: '20px',
                border: `0.5px solid ${cssVariables.separator}`
              }}
            >
              {/* Project Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '16px',
                gap: '12px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  flex: 1,
                  minWidth: 0
                }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: getProjectColor(project),
                    flexShrink: 0
                  }}></div>
                  <h3 style={{
                    margin: 0,
                    fontSize: '18px',
                    fontWeight: '600',
                    color: cssVariables.textPrimary,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    flex: 1,
                    minWidth: 0
                  }}>
                    {project.name}
                  </h3>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => setProjectNameModal({ open: true, projectId: project.id, name: project.name })}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: cssVariables.gray1,
                      cursor: 'pointer',
                      padding: '4px',
                      borderRadius: '6px',
                      flexShrink: 0
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                )}
              </div>

              {/* Project Details */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                marginBottom: '16px'
              }}>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ fontSize: '14px', color: cssVariables.textTertiary }}>Status:</span>
                    <select
                      value={project.status}
                      disabled={!isAdmin}
                      onChange={(e) => updateProject(project.id, { status: e.target.value }, `${new Date().toLocaleString()}: Status changed to ${e.target.value}`)}
                      style={{
                        background: statusColors[project.status] || cssVariables.bgSecondary,
                        color: 'white',
                        border: 'none',
                        padding: '4px 8px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '500',
                        cursor: isAdmin ? 'pointer' : 'not-allowed',
                        outline: 'none',
                        width: '120px',
                        textAlign: 'center',
                        opacity: isAdmin ? 1 : 0.7
                      }}
                    >
                      {Object.keys(statusColors).map(status => (
                        <option key={status} value={status} style={{ background: 'white', color: 'black' }}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ fontSize: '14px', color: cssVariables.textTertiary }}>Priority:</span>
                    <select
                      value={project.priority}
                      onChange={(e) => updateProject(project.id, { priority: e.target.value }, `${new Date().toLocaleString()}: Priority changed to ${e.target.value}`)}
                      style={{
                        background: priorityColors[project.priority] || cssVariables.bgSecondary,
                        color: 'white',
                        border: 'none',
                        padding: '4px 8px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        outline: 'none',
                        width: '120px',
                        textAlign: 'center'
                      }}
                    >
                      {Object.keys(priorityColors).map(priority => (
                        <option key={priority} value={priority} style={{ background: 'white', color: 'black' }}>
                          {priority}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ fontSize: '14px', color: cssVariables.textTertiary }}>Start:</span>
                    <input
                      type="date"
                      value={project.startDate}
                      disabled={!isAdmin}
                      onChange={(e) => {
                        const newStartDate = e.target.value;
                        updateProject(
                          project.id, 
                          { startDate: newStartDate }, 
                          `${new Date().toLocaleString()}: Start date changed to ${formatDateForDisplay(newStartDate)}`
                        );
                      }}
                      style={{
                        border: `0.5px solid ${cssVariables.separator}`,
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        outline: 'none',
                        width: '120px',
                        background: cssVariables.bgPrimary,
                        cursor: isAdmin ? 'pointer' : 'not-allowed',
                        opacity: isAdmin ? 1 : 0.7
                      }}
                    />
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ fontSize: '14px', color: cssVariables.textTertiary }}>Due:</span>
                    <input
                      type="date"
                      value={project.dueDate}
                      onChange={(e) => {
                        const newDueDate = e.target.value;
                        updateProject(
                          project.id, 
                          { dueDate: newDueDate }, 
                          `${new Date().toLocaleString()}: Due date changed to ${formatDateForDisplay(newDueDate)}`
                        );
                      }}
                      style={{
                        border: `0.5px solid ${cssVariables.separator}`,
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        outline: 'none',
                        width: '120px',
                        background: cssVariables.bgPrimary
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Busy Section */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px'
              }}>
                <span style={{ fontSize: '14px', color: cssVariables.textTertiary }}>Busy:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => updateProject(project.id, { busy: Math.max(0, project.busy - 1) }, `${new Date().toLocaleString()}: Busy decreased to ${Math.max(0, project.busy - 1)}`)}
                    disabled={project.busy <= 0 || !isAdmin}
                    style={{
                      background: (project.busy <= 0 || !isAdmin) ? cssVariables.gray4 : cssVariables.bgSecondary,
                      border: 'none',
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: (project.busy <= 0 || !isAdmin) ? 'not-allowed' : 'pointer',
                      opacity: (project.busy <= 0 || !isAdmin) ? 0.5 : 1
                    }}
                  >
                    <svg width="12" height="2" viewBox="0 0 12 2" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 1h10"/>
                    </svg>
                  </button>
                  <span style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: cssVariables.textPrimary,
                    minWidth: '20px',
                    textAlign: 'center'
                  }}>
                    {project.busy}
                  </span>
                  <button
                    onClick={() => updateProject(project.id, { busy: project.busy + 1 }, `${new Date().toLocaleString()}: Busy increased to ${project.busy + 1}`)}
                    disabled={busy >= total || !isAdmin}
                    style={{
                      background: (busy >= total || !isAdmin) ? cssVariables.gray4 : cssVariables.bgSecondary,
                      border: 'none',
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: (busy >= total || !isAdmin) ? 'not-allowed' : 'pointer',
                      opacity: (busy >= total || !isAdmin) ? 0.5 : 1
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
                  onClick={() => setCommentsForId(project.id)}
                  style={{
                    flex: 1,
                    background: cssVariables.bgSecondary,
                    color: cssVariables.textPrimary,
                    border: 'none',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Comments ({project.comments?.filter(c => !c.ignored && !c.deleted).length || 0})
                </button>
                <button
                  onClick={() => setHistoryForId(project.id)}
                  style={{
                    flex: 1,
                    background: cssVariables.bgSecondary,
                    color: cssVariables.textPrimary,
                    border: 'none',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  History
                </button>
              </div>

              {/* Cameras Section */}
              <div style={{ marginTop: '12px' }}>
                <button
                  onClick={() => toggleCameras(project.id)}
                  style={{
                    background: cssVariables.bgSecondary,
                    color: cssVariables.textPrimary,
                    border: 'none',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    width: '100%',
                    textAlign: 'left'
                  }}
                >
                  Images ({project.cameras ? project.cameras.length : 0})
                </button>

                {expandedProjectId === project.id && (
                  <div style={{
                    marginTop: '12px',
                    padding: '16px',
                    background: cssVariables.bgSecondary,
                    borderRadius: '12px',
                    border: `0.5px solid ${cssVariables.separator}`
                  }}>
                    {/* Список камер */}
                    {project.cameras && project.cameras.map(camera => (
                      <div key={camera.id} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 0',
                        borderBottom: `0.5px solid ${cssVariables.separator}`
                      }}>
                        <span style={{ fontSize: '14px', color: cssVariables.textPrimary }}>{camera.name}</span>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {/* Кнопка - */}
                          <button
                            disabled={!canDecreaseStage(camera.stage)}
                            onClick={() => decreaseStageIteration(project.id, camera.id)}
                            style={{
                              background: cssVariables.bgPrimary,
                              border: 'none',
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: canDecreaseStage(camera.stage) ? 'pointer' : 'not-allowed',
                              opacity: canDecreaseStage(camera.stage) ? 1 : 0.5
                            }}
                          >
                            <svg width="10" height="2" viewBox="0 0 10 2" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M1 1h8"/>
                            </svg>
                          </button>

                          {/* Окно Stage */}
                          <div
                            onClick={() => openStageModal(project.id, camera.id)}
                            style={{
                              padding: '4px 12px',
                              borderRadius: '8px',
                              fontSize: '12px',
                              fontWeight: '500',
                              color: 'white',
                              background: getStageColor(camera.stage),
                              cursor: 'pointer',
                              minWidth: '60px',
                              textAlign: 'center'
                            }}
                          >
                            {camera.stage}
                          </div>

                          {/* Кнопка + */}
                          <button
                            disabled={!canIncreaseStage(camera.stage)}
                            onClick={() => increaseStageIteration(project.id, camera.id)}
                            style={{
                              background: cssVariables.bgPrimary,
                              border: 'none',
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: canIncreaseStage(camera.stage) ? 'pointer' : 'not-allowed',
                              opacity: canIncreaseStage(camera.stage) ? 1 : 0.5
                            }}
                          >
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M5 1v8M1 5h8"/>
                            </svg>
                          </button>

                          {isAdmin && (
                            <button
                              onClick={() => setConfirmRemoveCameraModal({ open: true, projectId: project.id, cameraId: camera.id })}
                              style={{
                                background: cssVariables.danger,
                                color: 'white',
                                border: 'none',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                cursor: 'pointer'
                              }}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    ))}

                    {isAdmin && (
                      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                        <input
                          type="text"
                          value={newCameraName}
                          onChange={(e) => setNewCameraName(e.target.value)}
                          placeholder="New camera name"
                          style={{
                            flex: 1,
                            padding: '8px 12px',
                            border: `0.5px solid ${cssVariables.separator}`,
                            borderRadius: '8px',
                            fontSize: '14px',
                            outline: 'none',
                            background: cssVariables.bgPrimary
                          }}
                        />
                        <button
                          onClick={() => addCamera(project.id)}
                          style={{
                            background: cssVariables.primary,
                            color: 'white',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            fontSize: '14px',
                            cursor: 'pointer'
                          }}
                        >
                          Add
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Admin Actions */}
              {isAdmin && (
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  marginTop: '12px',
                  paddingTop: '12px',
                  borderTop: `0.5px solid ${cssVariables.separator}`
                }}>
                  <button
                    onClick={() => setColorPickerModal({ open: true, projectId: project.id, currentColor: getProjectColor(project) })}
                    style={{
                      flex: 1,
                      background: cssVariables.bgSecondary,
                      color: cssVariables.textPrimary,
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    Color
                  </button>
                  <button
                    onClick={() => setConfirmCompleteModal({ open: true, projectId: project.id })}
                    disabled={project.status === 'Completed'}
                    style={{
                      flex: 1,
                      background: project.status === 'Completed' ? cssVariables.gray4 : cssVariables.success,
                      color: project.status === 'Completed' ? cssVariables.textTertiary : 'white',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '500',
                      cursor: project.status === 'Completed' ? 'not-allowed' : 'pointer',
                      opacity: project.status === 'Completed' ? 0.6 : 1
                    }}
                  >
                    Complete
                  </button>
                  <button
                    onClick={() => setConfirmDeleteModal({ open: true, projectId: project.id })}
                    style={{
                      flex: 1,
                      background: cssVariables.danger,
                      color: 'white',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '500',
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
              background: cssVariables.bgPrimary,
              borderRadius: '20px',
              padding: '24px',
              width: '90%',
              maxWidth: '400px',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)'
            }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: '600' }}>Add New Project</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: cssVariables.textTertiary }}>Project Name</label>
                  <input
                    type="text"
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                    style={{
                      width: 'calc(100% - 24px)',
                      padding: '8px 12px',
                      border: `0.5px solid ${cssVariables.separator}`,
                      borderRadius: '10px',
                      fontSize: '16px',
                      outline: 'none',
                      background: cssVariables.bgPrimary
                    }}
                    placeholder="Enter project name"
                  />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: cssVariables.textTertiary }}>Start Date</label>
                    <input
                      type="date"
                      value={newProject.startDate}
                      onChange={(e) => setNewProject({ ...newProject, startDate: e.target.value })}
                      style={{
                        width: 'calc(100% - 24px)',
                        padding: '8px 12px',
                        border: `0.5px solid ${cssVariables.separator}`,
                        borderRadius: '10px',
                        fontSize: '14px',
                        outline: 'none',
                        background: cssVariables.bgPrimary
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: cssVariables.textTertiary }}>Due Date</label>
                    <input
                      type="date"
                      value={newProject.dueDate}
                      onChange={(e) => setNewProject({ ...newProject, dueDate: e.target.value })}
                      style={{
                        width: 'calc(100% - 24px)',
                        padding: '8px 12px',
                        border: `0.5px solid ${cssVariables.separator}`,
                        borderRadius: '10px',
                        fontSize: '14px',
                        outline: 'none',
                        background: cssVariables.bgPrimary
                      }}
                    />
                  </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: cssVariables.textTertiary }}>Status</label>
                    <select
                      value={newProject.status}
                      onChange={(e) => handleNewProjectStatusChange(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: `0.5px solid ${cssVariables.separator}`,
                        borderRadius: '10px',
                        fontSize: '14px',
                        outline: 'none',
                        background: cssVariables.bgPrimary
                      }}
                    >
                      {Object.keys(statusColors).map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: cssVariables.textTertiary }}>Priority</label>
                    <select
                      value={newProject.priority}
                      onChange={(e) => setNewProject({ ...newProject, priority: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: `0.5px solid ${cssVariables.separator}`,
                        borderRadius: '10px',
                        fontSize: '14px',
                        outline: 'none',
                        background: cssVariables.bgPrimary
                      }}
                    >
                      {Object.keys(priorityColors).map(priority => (
                        <option key={priority} value={priority}>{priority}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: cssVariables.textTertiary }}>Busy Artists</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                      onClick={() => handleNewProjectBusyChange(Math.max(0, newProject.busy - 1))}
                      style={{
                        background: cssVariables.bgSecondary,
                        border: 'none',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      <svg width="14" height="2" viewBox="0 0 14 2" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 1h12"/>
                      </svg>
                    </button>
                    <span style={{ fontSize: '18px', fontWeight: '600', minWidth: '30px', textAlign: 'center' }}>
                      {newProject.busy}
                    </span>
                    <button
                      onClick={() => handleNewProjectBusyChange(newProject.busy + 1)}
                      style={{
                        background: cssVariables.bgSecondary,
                        border: 'none',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M7 1v12M1 7h12"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  style={{
                    background: cssVariables.bgSecondary,
                    color: cssVariables.textPrimary,
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '14px',
                    fontSize: '16px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={addProject}
                  style={{
                    background: cssVariables.primary,
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '14px',
                    fontSize: '16px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Add Project
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stage Selection Modal */}
        {stageModal.open && (
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
              background: cssVariables.bgPrimary,
              borderRadius: '20px',
              padding: '24px',
              width: '90%',
              maxWidth: '400px',
              textAlign: 'center'
            }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600' }}>Select Stage</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {['WIP', 'ICD', 'R', 'Approved'].map(stage => {
                  const project = state.projects.find(p => p.id === stageModal.projectId);
                  const camera = project?.cameras.find(c => c.id === stageModal.cameraId);
                  const isCurrent = camera?.stage === stage || 
                    (stage === 'R' && camera?.stage.startsWith('R')) ||
                    (stage === 'WIP' && camera?.stage.startsWith('WIP'));
                  
                  return (
                    <button
                      key={stage}
                      onClick={() => {
                        let newStage = stage;
                        if (stage === 'R') newStage = 'R01';
                        if (stage === 'WIP') newStage = 'WIP';
                        
                        updateCameraStage(stageModal.projectId, stageModal.cameraId, newStage);
                        closeStageModal();
                      }}
                      style={{
                        padding: '12px',
                        borderRadius: '10px',
                        border: `2px solid ${isCurrent ? 'red' : 'transparent'}`,
                        background: getStageColor(stage),
                        color: 'white',
                        fontSize: '16px',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      {stage}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={closeStageModal}
                style={{
                  marginTop: '20px',
                  background: cssVariables.bgSecondary,
                  color: cssVariables.textPrimary,
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '14px',
                  fontSize: '16px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Confirm Remove Camera Modal */}
        {confirmRemoveCameraModal.open && (
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
            zIndex: 1100
          }}>
            <div style={{
              background: cssVariables.bgPrimary,
              borderRadius: '20px',
              padding: '24px',
              width: '90%',
              maxWidth: '400px',
              textAlign: 'center'
            }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: '600' }}>Delete Camera?</h3>
              <p style={{ margin: '0 0 24px 0', color: cssVariables.textTertiary }}>This action cannot be undone.</p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button
                  onClick={() => setConfirmRemoveCameraModal({ open: false, projectId: null, cameraId: null })}
                  style={{
                    background: cssVariables.bgSecondary,
                    color: cssVariables.textPrimary,
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
                  onClick={() => removeCamera(confirmRemoveCameraModal.projectId, confirmRemoveCameraModal.cameraId)}
                  style={{
                    background: cssVariables.danger,
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '14px',
                    fontSize: '16px',
                    cursor: 'pointer'
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Alert Message */}
        {isAlertOpen && (
          <div style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: cssVariables.danger,
            color: 'white',
            padding: '12px 24px',
            borderRadius: '20px',
            zIndex: 2000
          }}>
            {alertMessage}
          </div>
        )}

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          padding: '20px',
          color: cssVariables.textQuaternary,
          fontSize: '14px'
        }}>
          Zigert Project Management System • {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
};

export default ProjectStatusDashboard;