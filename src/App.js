import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xluhdjnauxwlmamotsob.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsdWhkam5hdXh3bG1hbW90c29iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxOTQ1MjgsImV4cCI6MjA3Mzc3MDUyOH0.rleQjZdGsxAXZ89vpcGXVl06idPY12QxMkcn1dc_yQc';

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
          ts: comment.created_at
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
    loadInitialData();
  }, []);

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

  function showAlert(message) {
    setAlertMessage(message);
    setIsAlertOpen(true);
    setTimeout(() => setIsAlertOpen(false), 3000);
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
        const entry = isAdmin ? `${historyEntry} [Admin]` : historyEntry;
        await addHistoryEntry(id, entry);
      }

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
      const historyEntry = `${new Date().toLocaleString()}: Project created${isAdmin ? ' [Admin]' : ''}`;
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
      
      if (imageTimers[projectId]) {
        clearTimeout(imageTimers[projectId]);
      }
      
      if (newExpanded[projectId]) {
        const timer = setTimeout(() => {
          setExpandedImages(curr => ({ ...curr, [projectId]: false }));
        }, 180000);
        
        setImageTimers(prev => ({ ...prev, [projectId]: timer }));
      }
      
      return newExpanded;
    });
  }

  function openAddCameraModal(projectId) {
    setAddCameraModal({ open: true, projectId, cameraName: '' });
  }

  function closeAddCameraModal() {
    setAddCameraModal({ open: false, projectId: null, cameraName: '' });
  }

  async function addCamera() {
    try {
      if (!addCameraModal.cameraName.trim()) {
        showAlert("Specify camera name!");
        return;
      }

      const camera = {
        id: uid('cam'),
        name: addCameraModal.cameraName.trim(),
        stage: 'WIP'
      };

      await saveCamera(addCameraModal.projectId, camera);
      await addHistoryEntry(addCameraModal.projectId, `${new Date().toLocaleString()}: Camera "${camera.name}" added [Admin]`);

      setState(prev => ({
        ...prev,
        projects: prev.projects.map(p => p.id === addCameraModal.projectId ? ({
          ...p,
          cameras: [...(p.cameras || []), camera].sort((a, b) => a.name.localeCompare(b.name)),
          history: [`${new Date().toLocaleString()}: Camera "${camera.name}" added [Admin]`, ...(p.history || [])]
        }) : p)
      }));

      setLastSync(new Date());
      closeAddCameraModal();
    } catch (err) {
      setError(`Failed to add camera: ${err.message}`);
      console.error('Add camera error:', err);
    }
  }

  function openDeleteCameraModal(projectId, cameraId, cameraName) {
    setDeleteCameraModal({ open: true, projectId, cameraId, cameraName });
  }

  function closeDeleteCameraModal() {
    setDeleteCameraModal({ open: false, projectId: null, cameraId: null, cameraName: '' });
  }

  async function deleteCamera() {
    try {
      await deleteCameraFromDB(deleteCameraModal.cameraId);
      await addHistoryEntry(deleteCameraModal.projectId, `${new Date().toLocaleString()}: Camera "${deleteCameraModal.cameraName}" deleted [Admin]`);

      setState(prev => ({
        ...prev,
        projects: prev.projects.map(p => p.id === deleteCameraModal.projectId ? ({
          ...p,
          cameras: (p.cameras || []).filter(c => c.id !== deleteCameraModal.cameraId),
          history: [`${new Date().toLocaleString()}: Camera "${deleteCameraModal.cameraName}" deleted [Admin]`, ...(p.history || [])]
        }) : p)
      }));

      setLastSync(new Date());
      closeDeleteCameraModal();
    } catch (err) {
      setError(`Failed to delete camera: ${err.message}`);
      console.error('Delete camera error:', err);
    }
  }

  function openStageModal(projectId, cameraId, currentStage) {
    setStageModal({ open: true, projectId, cameraId, currentStage });
  }

  function closeStageModal() {
    setStageModal({ open: false, projectId: null, cameraId: null, currentStage: 'WIP' });
  }

  async function selectStage(newStageBase) {
    try {
      const { projectId, cameraId } = stageModal;
      const newStage = newStageBase === 'Approved' ? 'Approved' : `${newStageBase}`;
      
      await updateCameraStage(projectId, cameraId, newStage);
      closeStageModal();
    } catch (err) {
      setError(`Failed to update stage: ${err.message}`);
      console.error('Update stage error:', err);
    }
  }

  async function updateCameraStage(projectId, cameraId, newStage) {
    try {
      const project = state.projects.find(p => p.id === projectId);
      const camera = project?.cameras.find(c => c.id === cameraId);
      
      if (!camera) return;

      const updatedCamera = { ...camera, stage: newStage };
      await saveCamera(projectId, updatedCamera);
      await addHistoryEntry(projectId, `${new Date().toLocaleString()}: Camera "${camera.name}" stage changed to ${newStage}`);

      setState(prev => ({
        ...prev,
        projects: prev.projects.map(p => p.id === projectId ? ({
          ...p,
          cameras: (p.cameras || []).map(c => c.id === cameraId ? updatedCamera : c),
          history: [`${new Date().toLocaleString()}: Camera "${camera.name}" stage changed to ${newStage}`, ...(p.history || [])]
        }) : p)
      }));

      setLastSync(new Date());
    } catch (err) {
      console.error('Update camera stage error:', err);
      throw err;
    }
  }

  function incrementStage(projectId, cameraId, currentStage) {
    if (currentStage === 'Approved' || currentStage === 'ICD') return;
    
    let newStage;
    if (currentStage === 'WIP') {
      newStage = 'WIP02';
    } else if (currentStage.startsWith('WIP')) {
      const num = parseInt(currentStage.substring(3)) || 0;
      newStage = `WIP${String(num + 1).padStart(2, '0')}`;
    } else if (currentStage === 'R') {
      newStage = 'R01';
    } else if (currentStage.startsWith('R')) {
      const num = parseInt(currentStage.substring(1)) || 0;
      newStage = `R${String(num + 1).padStart(2, '0')}`;
    } else {
      newStage = 'WIP02';
    }
    
    updateCameraStage(projectId, cameraId, newStage);
  }

  function decrementStage(projectId, cameraId, currentStage) {
    if (currentStage === 'WIP' || currentStage === 'ICD' || currentStage === 'R' || currentStage === 'R01' || currentStage === 'Approved') return;
    
    let newStage;
    if (currentStage.startsWith('WIP')) {
      const num = parseInt(currentStage.substring(3)) || 2;
      if (num > 2) {
        newStage = `WIP${String(num - 1).padStart(2, '0')}`;
      } else {
        return;
      }
    } else if (currentStage.startsWith('R')) {
      const num = parseInt(currentStage.substring(1)) || 1;
      if (num > 1) {
        newStage = `R${String(num - 1).padStart(2, '0')}`;
      } else {
        return;
      }
    } else {
      return;
    }
    
    updateCameraStage(projectId, cameraId, newStage);
  }

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
          history: [`${new Date().toLocaleString()}: Comment added${isAdmin ? ' [Admin]' : ''}`, ...(p.history || [])]
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
      
      const project = state.projects.find(p => p.id === commentsForId);
      const comment = project?.comments.find(c => c.id === commentId);
      
      const updatedComment = {
        id: commentId,
        text: trimmed === '' ? comment?.text || '' : trimmed,
        deleted: false,
        ignored: trimmed === '',
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
            history: [`${new Date().toLocaleString()}: ${historyMessage}${isAdmin ? ' [Admin]' : ''}`, ...(p.history || [])]
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
      
      const project = state.projects.find(p => p.id === projectId);
      const comment = project?.comments.find(c => c.id === commentId);
      
      if (!comment) return;
      
      const updatedComment = {
        id: commentId,
        text: comment.text,
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
          return { 
            ...p, 
            comments: newComments, 
            history: [`${new Date().toLocaleString()}: Comment ignored${isAdmin ? ' [Admin]' : ''}`, ...(p.history || [])]
          };
        })
      }));
      
      setConfirmIgnore(null);
      setLastSync(new Date());

    } catch (err) {
      setError(`Failed to ignore comment: ${err.message}`);
      console.error('Ignore comment error:', err);
    }
  }

  function openHistory(projectId) { 
    setHistoryForId(projectId); 
  }
  
  function closeHistory() { 
    setHistoryForId(null); 
  }

  async function clearComments(projectId) {
    try {
      const project = state.projects.find(p => p.id === projectId);
      if (!project) return;

      for (const comment of project.comments) {
        await supabase
          .from('project_comments')
          .delete()
          .eq('id', comment.id);
      }

      await addHistoryEntry(projectId, `${new Date().toLocaleString()}: All comments cleared [Admin]`);

      setState(prev => ({
        ...prev,
        projects: prev.projects.map(p => p.id === projectId ? ({
          ...p,
          comments: [],
          history: [`${new Date().toLocaleString()}: All comments cleared [Admin]`, ...(p.history || [])]
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
      await supabase
        .from('project_history')
        .delete()
        .eq('project_id', projectId);

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
    const date = new Date(dayKey);
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isHoliday = holidayDays.has(dayKey);
    const isWorkingWeekend = workingWeekends.has(dayKey);
    
    if (isHoliday) {
      return ['Holiday'];
    }
    
    if (isWeekend && !isWorkingWeekend) {
      return ['Weekend'];
    }
    
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
    const isWorkingWeekend = workingWeekends.has(dayKey);
    
    if (isHoliday) {
      return 'var(--bg-secondary)';
    }
    
    if (isWeekend && !isWorkingWeekend) {
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
      background: '#F2F2F7',
      minHeight: '100vh',
      color: '#000000',
      fontSize: '17px',
      lineHeight: '1.47059',
      fontWeight: '400',
      letterSpacing: '-0.022em'
    }}>
      <style>{`
        :root {
          --primary: #007AFF;
          --secondary: #5856D6;
          --success: #34C759;
          --warning: #FF9500;
          --danger: #FF3B30;
          --gray-1: #8E8E93;
          --gray-2: #C7C7CC;
          --gray-3: #D1D1D6;
          --gray-4: #E5E5EA;
          --gray-5: #F2F2F7;
          --gray-6: #FFFFFF;
          --text-primary: #000000;
          --text-secondary: #3C3C43;
          --text-tertiary: #48484A;
          --text-quaternary: #8E8E93;
          --bg-primary: #FFFFFF;
          --bg-secondary: #F2F2F7;
          --bg-tertiary: #E5E5EA;
          --separator: rgba(60, 60, 67, 0.12);
          --shadow: 0 0 20px rgba(0, 0, 0, 0.05);
        }
        
        @keyframes slideIn {
          from { transform: translateX(-50%) translateY(-20px); opacity: 0; }
          to { transform: translateX(-50%) translateY(0); opacity: 1; }
        }
        
        ::-webkit-scrollbar {
          width: 6px;
        }
        
        ::-webkit-scrollbar-track {
          background: var(--bg-secondary);
          border-radius: 3px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: var(--gray-2);
          border-radius: 3px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: var(--gray-1);
        }
        
        button:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible {
          outline: 2px solid var(--primary);
          outline-offset: 2px;
        }
      `}</style>

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
              {isAdmin ? 'Admin Mode' : 'Admin'}
            </button>
          </div>
        </div>
      </div>

      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '0 24px 24px'
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '32px',
          padding: '32px 20px',
          background: 'var(--bg-primary)',
          borderRadius: '20px',
          boxShadow: 'var(--shadow)',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          position: 'relative'
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
            animation: 'fadeInUp 0.6s ease-out'
          }}>
            <img 
              src="/zigert-logo.png"
              alt="Zigert Logo"
              style={{
                width: '370px',
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
            fontSize: '14px',
            color: 'var(--text-quaternary)',
            marginTop: '16px',
            animation: 'fadeInUp 0.6s ease-out 0.2s both'
          }}>
            Real-time collaborative workspace
          </div>
        </div>

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
              Total Artists{isAdmin ? ' (admin controls)' : ''}
            </div>
            {isAdmin ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                <button
                  onClick={() => updateTotalArtists(-1)}
                  disabled={state.totalArtists <= 1}
                  style={{
                    background: state.totalArtists <= 1 ? 'var(--gray-4)' : 'var(--bg-secondary)',
                    border: 'none',
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: state.totalArtists <= 1 ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    opacity: state.totalArtists <= 1 ? 0.5 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (state.totalArtists > 1) {
                      e.target.style.background = 'var(--gray-3)';
                      e.target.style.transform = 'translateY(-1px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (state.totalArtists > 1) {
                      e.target.style.background = 'var(--bg-secondary)';
                      e.target.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  <svg width="12" height="2" viewBox="0 0 12 2" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 1h10"/>
                  </svg>
                </button>
                <div style={{ fontSize: '32px', fontWeight: '600', color: 'var(--text-primary)', minWidth: '60px' }}>
                  {total}
                </div>
                <button
                  onClick={() => updateTotalArtists(1)}
                  style={{
                    background: 'var(--bg-secondary)',
                    border: 'none',
                    width: '28px',
                    height: '28px',
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
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 1v10M1 6h10"/>
                  </svg>
                </button>
              </div>
            ) : (
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
            gap: '6px',
            background: 'var(--separator)',
            padding: '8px'
          }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} style={{
                background: 'var(--bg-primary)',
                padding: '12px',
                textAlign: 'center',
                fontSize: '14px',
                fontWeight: '500',
                color: 'var(--text-tertiary)',
                borderRadius: '8px'
              }}>
                {day}
              </div>
            ))}
            
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} style={{
                background: 'var(--bg-secondary)',
                minHeight: '28px',
                borderRadius: '8px'
              }}></div>
            ))}
            
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
                      toggleHolidayDay(dayKey);
                    } else if (isWeekend) {
                      toggleWorkingWeekend(dayKey);
                    } else {
                      toggleHolidayDay(dayKey);
                    }
                  }}
                  title={projectsOnDay(dayKey).join('\n') + (isAdmin ? '\n\nClick to toggle holiday/working weekend' : '')}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start'
                  }}>
                    <span style={{
                      fontSize: '12px',
                      fontWeight: isToday ? '600' : '400',
                      color: isToday ? 'var(--danger)' : 'var(--text-primary)',
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
            color: 'var(--text-primary)'
          }}>
            Projects ({state.projects.length})
          </h2>
          {isAdmin && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              style={{
                background: 'var(--primary)',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '18px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                outline: 'none'
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
              Add Project
            </button>
          )}
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          {state.projects.map(project => (
            <div key={project.id}>
              <div
                style={{
                  background: 'var(--bg-primary)',
                  borderRadius: expandedImages[project.id] ? '20px 20px 0 0' : '20px',
                  boxShadow: 'var(--shadow)',
                  padding: '20px',
                  transition: 'all 0.3s ease',
                  border: '0.5px solid var(--separator)'
                }}
                onMouseEnter={(e) => {
                  if (!expandedImages[project.id]) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.12)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!expandedImages[project.id]) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'var(--shadow)';
                  }
                }}
              >
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
                      color: 'var(--text-primary)',
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
                      onClick={() => openProjectNameModal(project.id, project.name)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--gray-1)',
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '6px',
                        transition: 'all 0.2s ease',
                        flexShrink: 0
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = 'var(--bg-secondary)';
                        e.target.style.color = 'var(--text-primary)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = 'none';
                        e.target.style.color = 'var(--gray-1)';
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                  )}
                </div>

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
                      <span style={{ fontSize: '14px', color: 'var(--text-tertiary)' }}>Status:</span>
                      <select
                        value={project.status}
                        disabled={!isAdmin}
                        onChange={(e) => updateProject(project.id, { status: e.target.value }, `${new Date().toLocaleString()}: Status changed to ${e.target.value}`)}
                        style={{
                          background: statusColors[project.status] || 'var(--bg-secondary)',
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
                      <span style={{ fontSize: '14px', color: 'var(--text-tertiary)' }}>Priority:</span>
                      <select
                        value={project.priority}
                        onChange={(e) => updateProject(project.id, { priority: e.target.value }, `${new Date().toLocaleString()}: Priority changed to ${e.target.value}`)}
                        style={{
                          background: priorityColors[project.priority] || 'var(--bg-secondary)',
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
                      <span style={{ fontSize: '14px', color: 'var(--text-tertiary)' }}>Start:</span>
                      <input
                        type="date"
                        value={project.startDate}
                        disabled={!isAdmin}
                        onChange={(e) => {
                          const newStartDate = e.target.value;
                          const newDueDate = new Date(newStartDate) > new Date(project.dueDate) ? newStartDate : project.dueDate;
                          
                          if (new Date(newStartDate) > new Date(newDueDate)) {
                            showDateValidationModal(
                              "Start date cannot be after due date! Adjusting due date.",
                              () => updateProject(
                                project.id, 
                                { startDate: newStartDate, dueDate: newStartDate }, 
                                `${new Date().toLocaleString()}: Dates changed to ${formatDateForDisplay(newStartDate)}`
                              )
                            );
                          } else {
                            updateProject(
                              project.id, 
                              { startDate: newStartDate, dueDate: newDueDate }, 
                              `${new Date().toLocaleString()}: Dates changed to ${formatDateForDisplay(newStartDate)} - ${formatDateForDisplay(newDueDate)}`
                            );
                          }
                        }}
                        style={{
                          border: '0.5px solid var(--separator)',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          outline: 'none',
                          width: '120px',
                          background: 'var(--bg-primary)',
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
                      <span style={{ fontSize: '14px', color: 'var(--text-tertiary)' }}>Due:</span>
                      <input
                        type="date"
                        value={project.dueDate}
                        onChange={(e) => {
                          const newDueDate = e.target.value;
                          if (new Date(newDueDate) < new Date(project.startDate)) {
                            showDateValidationModal(
                              "Due date cannot be before start date!",
                              null
                            );
                          } else {
                            updateProject(
                              project.id, 
                              { dueDate: newDueDate }, 
                              `${new Date().toLocaleString()}: Due date changed to ${formatDateForDisplay(newDueDate)}`
                            );
                          }
                        }}
                        style={{
                          border: '0.5px solid var(--separator)',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          outline: 'none',
                          width: '120px',
                          background: 'var(--bg-primary)'
                        }}
                      />
                    </div>
                  </div>
                </div>

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
                      disabled={project.busy <= 0 || !isAdmin}
                      style={{
                        background: (project.busy <= 0 || !isAdmin) ? 'var(--gray-4)' : 'var(--bg-secondary)',
                        border: 'none',
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: (project.busy <= 0 || !isAdmin) ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease',
                        opacity: (project.busy <= 0 || !isAdmin) ? 0.5 : 1
                      }}
                      onMouseEnter={(e) => {
                        if (project.busy > 0 && isAdmin) {
                          e.target.style.background = 'var(--gray-3)';
                          e.target.style.transform = 'translateY(-1px)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (project.busy > 0 && isAdmin) {
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
                      disabled={busy >= total || !isAdmin}
                      style={{
                        background: (busy >= total || !isAdmin) ? 'var(--gray-4)' : 'var(--bg-secondary)',
                        border: 'none',
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: (busy >= total || !isAdmin) ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease',
                        opacity: (busy >= total || !isAdmin) ? 0.5 : 1
                      }}
                      onMouseEnter={(e) => {
                        if (busy < total && isAdmin) {
                          e.target.style.background = 'var(--gray-3)';
                          e.target.style.transform = 'translateY(-1px)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (busy < total && isAdmin) {
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

                <div style={{
                  borderTop: '0.5px solid var(--separator)',
                  marginTop: '12px',
                  paddingTop: '12px'
                }}>
                  <button
                    onClick={() => toggleImagesExpanded(project.id)}
                    style={{
                      width: '100%',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      border: 'none',
                      padding: '8px 12px',
                      borderRadius: '10px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      outline: 'none',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'var(--gray-3)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'var(--bg-secondary)';
                    }}
                  >
                    <span>Images ({project.cameras?.length || 0})</span>
                    <svg 
                      width="16" 
                      height="16" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2"
                      style={{
                        transform: expandedImages[project.id] ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.3s ease'
                      }}
                    >
                      <path d="M6 9l6 6 6-6"/>
                    </svg>
                  </button>
                </div>
              </div>

              {expandedImages[project.id] && (
                <div style={{
                  background: 'var(--bg-primary)',
                  borderRadius: '0 0 20px 20px',
                  boxShadow: 'var(--shadow)',
                  padding: '16px 20px',
                  border: '0.5px solid var(--separator)',
                  borderTop: 'none',
                  maxHeight: '400px',
                  overflowY: 'auto'
                }}>
                  {isAdmin && (
                    <button
                      onClick={() => openAddCameraModal(project.id)}
                      style={{
                        width: '100%',
                        background: 'var(--primary)',
                        color: 'white',
                        border: 'none',
                        padding: '8px 12px',
                        borderRadius: '10px',
                        fontSize: '13px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        marginBottom: '12px'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = '#0056CC';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = 'var(--primary)';
                      }}
                    >
                      + Add Camera
                    </button>
                  )}

                  {project.cameras && project.cameras.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {project.cameras.map((camera, index) => (
                        <div key={camera.id} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px',
                          background: 'var(--bg-secondary)',
                          borderRadius: '8px'
                        }}>
                          <span style={{
                            fontSize: '13px',
                            fontWeight: '500',
                            color: 'var(--text-tertiary)',
                            minWidth: '25px'
                          }}>
                            {index + 1}.
                          </span>
                          <span style={{
                            flex: 1,
                            fontSize: '14px',
                            color: 'var(--text-primary)'
                          }}>
                            {camera.name}
                          </span>
                          
                          <button
                            onClick={() => decrementStage(project.id, camera.id, camera.stage)}
                            disabled={camera.stage === 'WIP' || camera.stage === 'ICD' || camera.stage === 'R' || camera.stage === 'R01' || camera.stage === 'Approved' || camera.stage === 'WIP02'}
                            style={{
                              background: (camera.stage === 'WIP' || camera.stage === 'ICD' || camera.stage === 'R' || camera.stage === 'R01' || camera.stage === 'Approved' || camera.stage === 'WIP02') ? 'var(--gray-4)' : 'var(--bg-primary)',
                              border: '0.5px solid var(--separator)',
                              width: '24px',
                              height: '24px',
                              borderRadius: '6px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: (camera.stage === 'WIP' || camera.stage === 'ICD' || camera.stage === 'R' || camera.stage === 'R01' || camera.stage === 'Approved' || camera.stage === 'WIP02') ? 'not-allowed' : 'pointer',
                              opacity: (camera.stage === 'WIP' || camera.stage === 'ICD' || camera.stage === 'R' || camera.stage === 'R01' || camera.stage === 'Approved' || camera.stage === 'WIP02') ? 0.5 : 1,
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <svg width="10" height="2" viewBox="0 0 10 2" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M1 1h8"/>
                            </svg>
                          </button>
                          
                          <div
                            onClick={() => openStageModal(project.id, camera.id, camera.stage)}
                            style={{
                              background: getStageColor(camera.stage),
                              color: 'white',
                              padding: '4px 12px',
                              borderRadius: '8px',
                              fontSize: '12px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              minWidth: '60px',
                              textAlign: 'center',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.transform = 'scale(1.05)';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.transform = 'scale(1)';
                            }}
                          >
                            {camera.stage}
                          </div>
                          
                          <button
                            onClick={() => incrementStage(project.id, camera.id, camera.stage)}
                            disabled={camera.stage === 'Approved' || camera.stage === 'ICD'}
                            style={{
                              background: (camera.stage === 'Approved' || camera.stage === 'ICD') ? 'var(--gray-4)' : 'var(--bg-primary)',
                              border: '0.5px solid var(--separator)',
                              width: '24px',
                              height: '24px',
                              borderRadius: '6px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: (camera.stage === 'Approved' || camera.stage === 'ICD') ? 'not-allowed' : 'pointer',
                              opacity: (camera.stage === 'Approved' || camera.stage === 'ICD') ? 0.5 : 1,
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M5 1v8M1 5h8"/>
                            </svg>
                          </button>

                          {isAdmin && (
                            <button
                              onClick={() => openDeleteCameraModal(project.id, camera.id, camera.name)}
                              style={{
                                background: 'var(--danger)',
                                border: 'none',
                                color: 'white',
                                width: '24px',
                                height: '24px',
                                borderRadius: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                fontSize: '16px',
                                transition: 'all 0.2s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.background = '#D70015';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.background = 'var(--danger)';
                              }}
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{
                      textAlign: 'center',
                      color: 'var(--text-tertiary)',
                      fontSize: '14px',
                      fontStyle: 'italic',
                      padding: '20px'
                    }}>
                      No cameras yet
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
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
                    width: 'calc(100% - 24px)',
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
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: 'var(--text-tertiary)' }}>Start Date</label>
                  <input
                    type="date"
                    value={newProject.startDate}
                    onChange={(e) => setNewProject({ ...newProject, startDate: e.target.value })}
                    style={{
                      width: 'calc(100% - 24px)',
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
                      width: 'calc(100% - 24px)',
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
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: 'var(--text-tertiary)' }}>Status</label>
                  <select
                    value={newProject.status}
                    onChange={(e) => handleNewProjectStatusChange(e.target.value)}
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
                    onClick={() => handleNewProjectBusyChange(Math.max(0, newProject.busy - 1))}
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
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
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
                  background: 'var(--primary)',
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

      {addCameraModal.open && (
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
            background: 'var(--bg-primary)',
            borderRadius: '20px',
            padding: '24px',
            width: '90%',
            maxWidth: '400px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600' }}>Add Camera</h3>
            <input
              type="text"
              value={addCameraModal.cameraName}
              onChange={(e) => setAddCameraModal({ ...addCameraModal, cameraName: e.target.value })}
              placeholder="Enter camera name"
              style={{
                width: '100%',
                padding: '12px',
                border: '0.5px solid var(--separator)',
                borderRadius: '10px',
                fontSize: '16px',
                outline: 'none',
                marginBottom: '20px',
                background: 'var(--bg-primary)'
              }}
            />
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={closeAddCameraModal}
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
                onClick={addCamera}
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
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteCameraModal.open && (
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
            background: 'var(--bg-primary)',
            borderRadius: '20px',
            padding: '24px',
            width: '90%',
            maxWidth: '400px',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600' }}>Delete Camera?</h3>
            <p style={{ margin: '0 0 24px 0', color: 'var(--text-tertiary)' }}>
              Are you sure you want to delete camera "{deleteCameraModal.cameraName}"? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={closeDeleteCameraModal}
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
                onClick={deleteCamera}
                style={{
                  background: 'var(--danger)',
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
          zIndex: 1100
        }}>
          <div style={{
            background: 'var(--bg-primary)',
            borderRadius: '20px',
            padding: '24px',
            width: '90%',
            maxWidth: '300px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)'
          }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', textAlign: 'center' }}>Select Stage</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {['WIP', 'ICD', 'R', 'Approved'].map(stage => {
                const currentBase = stageModal.currentStage.match(/^[A-Z]+/)?.[0] || stageModal.currentStage;
                const isCurrentStage = (stage === 'Approved' && stageModal.currentStage === 'Approved') || 
                                      (stage !== 'Approved' && currentBase === stage);
                
                return (
                  <button
                    key={stage}
                    onClick={() => selectStage(stage)}
                    style={{
                      background: getStageColor(stage),
                      color: 'white',
                      border: isCurrentStage ? '3px solid var(--danger)' : 'none',
                      padding: '12px',
                      borderRadius: '12px',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
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
                width: '100%',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                border: 'none',
                padding: '10px',
                borderRadius: '14px',
                fontSize: '16px',
                cursor: 'pointer',
                marginTop: '16px'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

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
            maxWidth: '500px',
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>
                Comments for {state.projects.find(p => p.id === commentsForId)?.name}
              </h3>
              <button
                onClick={closeComments}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: 'var(--text-tertiary)'
                }}
              >
                ×
              </button>
            </div>

            <div style={{
              flex: 1,
              overflowY: 'auto',
              marginBottom: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {state.projects.find(p => p.id === commentsForId)?.comments
                ?.filter(c => !c.deleted)
                .sort((a, b) => new Date(b.ts) - new Date(a.ts))
                .map(comment => (
                  <div key={comment.id} style={{
                    background: comment.ignored ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                    border: `0.5px solid ${comment.ignored ? 'var(--gray-4)' : 'var(--separator)'}`,
                    borderRadius: '12px',
                    padding: '12px',
                    opacity: comment.ignored ? 0.6 : 1
                  }}>
                    {editingId === comment.id ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <textarea
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          style={{
                            width: '100%',
                            minHeight: '60px',
                            padding: '8px',
                            border: '0.5px solid var(--separator)',
                            borderRadius: '8px',
                            fontSize: '14px',
                            outline: 'none',
                            resize: 'vertical',
                            background: 'var(--bg-primary)'
                          }}
                        />
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => setEditingId(null)}
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
                          <button
                            onClick={() => saveEdit(comment.id)}
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
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontSize: '14px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>
                          {new Date(comment.ts).toLocaleString()}
                          {comment.ignored && ' (Ignored)'}
                        </div>
                        <div style={{ 
                          fontSize: '16px', 
                          color: 'var(--text-primary)', 
                          whiteSpace: 'pre-wrap',
                          textDecoration: comment.ignored ? 'line-through' : 'none'
                        }}>
                          {comment.text}
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                          <button
                            onClick={() => startEdit(comment.id, comment.text)}
                            style={{
                              background: 'var(--bg-secondary)',
                              color: 'var(--text-primary)',
                              border: 'none',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              cursor: 'pointer'
                            }}
                          >
                            Edit
                          </button>
                          {!comment.ignored && (
                            <button
                              onClick={() => confirmIgnoreComment(comment.id)}
                              style={{
                                background: 'var(--warning)',
                                color: 'white',
                                border: 'none',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                cursor: 'pointer'
                              }}
                            >
                              Ignore
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              
              {state.projects.find(p => p.id === commentsForId)?.comments?.filter(c => !c.deleted).length === 0 && (
                <div style={{
                  textAlign: 'center',
                  color: 'var(--text-tertiary)',
                  fontStyle: 'italic',
                  padding: '20px'
                }}>
                  No comments yet
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Add a new comment..."
                style={{
                  width: '100%',
                  minHeight: '80px',
                  padding: '12px',
                  border: '0.5px solid var(--separator)',
                  borderRadius: '12px',
                  fontSize: '16px',
                  outline: 'none',
                  resize: 'vertical',
                  background: 'var(--bg-primary)'
                }}
              />
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setConfirmAddOpen(true)}
                  disabled={!draft.trim()}
                  style={{
                    background: draft.trim() ? 'var(--primary)' : 'var(--gray-4)',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '14px',
                    fontSize: '16px',
                    fontWeight: '500',
                    cursor: draft.trim() ? 'pointer' : 'not-allowed'
                  }}
                >
                  Add Comment
                </button>
              </div>
            </div>

            {isAdmin && (
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '0.5px solid var(--separator)' }}>
                <button
                  onClick={() => setClearCommentsModal(commentsForId)}
                  style={{
                    background: 'var(--danger)',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '10px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    width: '100%'
                  }}
                >
                  Clear All Comments (Admin)
                </button>
              </div>
            )}
          </div>
        </div>
      )}

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
          zIndex: 1100
        }}>
          <div style={{
            background: 'var(--bg-primary)',
            borderRadius: '20px',
            padding: '24px',
            width: '90%',
            maxWidth: '400px',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600' }}>Add Comment?</h3>
            <p style={{ margin: '0 0 24px 0', color: 'var(--text-tertiary)' }}>Are you sure you want to add this comment?</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => setConfirmAddOpen(false)}
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
                onClick={addCommentConfirmed}
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
          zIndex: 1100
        }}>
          <div style={{
            background: 'var(--bg-primary)',
            borderRadius: '20px',
            padding: '24px',
            width: '90%',
            maxWidth: '400px',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600' }}>Ignore Comment?</h3>
            <p style={{ margin: '0 0 24px 0', color: 'var(--text-tertiary)' }}>This comment will be marked as ignored but not deleted.</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => setConfirmIgnore(null)}
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
                onClick={doIgnore}
                style={{
                  background: 'var(--warning)',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '14px',
                  fontSize: '16px',
                  cursor: 'pointer'
                }}
              >
                Ignore
              </button>
            </div>
          </div>
        </div>
      )}

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
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>
                History for {state.projects.find(p => p.id === historyForId)?.name}
              </h3>
              <button
                onClick={closeHistory}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: 'var(--text-tertiary)'
                }}
              >
                ×
              </button>
            </div>

            <div style={{
              flex: 1,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              {state.projects.find(p => p.id === historyForId)?.history?.map((entry, index) => (
                <div key={index} style={{
                  padding: '12px',
                  background: 'var(--bg-secondary)',
                  borderRadius: '10px',
                  fontSize: '14px',
                  color: 'var(--text-primary)'
                }}>
                  {entry}
                </div>
              ))}
              
              {(!state.projects.find(p => p.id === historyForId)?.history?.length) && (
                <div style={{
                  textAlign: 'center',
                  color: 'var(--text-tertiary)',
                  fontStyle: 'italic',
                  padding: '20px'
                }}>
                  No history yet
                </div>
              )}
            </div>

            {isAdmin && (
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '0.5px solid var(--separator)' }}>
                <button
                  onClick={() => setClearHistoryModal(historyForId)}
                  style={{
                    background: 'var(--danger)',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '10px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    width: '100%'
                  }}
                >
                  Clear History (Admin)
                </button>
              </div>
            )}
          </div>
        </div>
      )}

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
            borderRadius: '20px',
            padding: '24px',
            width: '90%',
            maxWidth: '400px',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600' }}>Admin Access</h3>
            <p style={{ margin: '0 0 20px 0', color: 'var(--text-tertiary)' }}>Enter admin password:</p>
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && checkPassword()}
              style={{
                width: 'calc(100% - 24px)',
                padding: '12px',
                border: '0.5px solid var(--separator)',
                borderRadius: '10px',
                fontSize: '16px',
                outline: 'none',
                marginBottom: '20px',
                background: 'var(--bg-primary)'
              }}
              placeholder="Password"
            />
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
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
                  borderRadius: '14px',
                  fontSize: '16px',
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
                  padding: '10px 20px',
                  borderRadius: '14px',
                  fontSize: '16px',
                  cursor: 'pointer'
                }}
              >
                Enter
              </button>
            </div>
          </div>
        </div>
      )}

      {isAlertOpen && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'var(--danger)',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '20px',
          zIndex: 2000,
          animation: 'slideIn 0.3s ease-out'
        }}>
          {alertMessage}
        </div>
      )}

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
          zIndex: 1100
        }}>
          <div style={{
            background: 'var(--bg-primary)',
            borderRadius: '20px',
            padding: '24px',
            width: '90%',
            maxWidth: '400px',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600' }}>Clear All Comments?</h3>
            <p style={{ margin: '0 0 24px 0', color: 'var(--text-tertiary)' }}>This action cannot be undone. All comments for this project will be permanently deleted.</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => setClearCommentsModal(null)}
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
                onClick={() => clearComments(clearCommentsModal)}
                style={{
                  background: 'var(--danger)',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '14px',
                  fontSize: '16px',
                  cursor: 'pointer'
                }}
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}

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
          zIndex: 1100
        }}>
          <div style={{
            background: 'var(--bg-primary)',
            borderRadius: '20px',
            padding: '24px',
            width: '90%',
            maxWidth: '400px',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600' }}>Clear History?</h3>
            <p style={{ margin: '0 0 24px 0', color: 'var(--text-tertiary)' }}>This action cannot be undone. All history entries for this project will be permanently deleted.</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => setClearHistoryModal(null)}
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
                onClick={() => clearHistory(clearHistoryModal)}
                style={{
                  background: 'var(--danger)',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '14px',
                  fontSize: '16px',
                  cursor: 'pointer'
                }}
              >
                Clear History
              </button>
            </div>
          </div>
        </div>
      )}

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
            borderRadius: '20px',
            padding: '24px',
            width: '90%',
            maxWidth: '400px'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600' }}>Edit Project Name</h3>
            <input
              type="text"
              value={projectNameModal.name}
              onChange={(e) => setProjectNameModal({ ...projectNameModal, name: e.target.value })}
              style={{
                width: '100%',
                padding: '12px',
                border: '0.5px solid var(--separator)',
                borderRadius: '10px',
                fontSize: '16px',
                outline: 'none',
                marginBottom: '20px',
                background: 'var(--bg-primary)'
              }}
              placeholder="Project name"
            />
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={closeProjectNameModal}
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
                onClick={saveProjectName}
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
                Save
              </button>
            </div>
          </div>
        </div>
      )}

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
            borderRadius: '20px',
            padding: '24px',
            width: '90%',
            maxWidth: '400px'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600' }}>Choose Project Color</h3>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(6, 1fr)',
              gap: '8px',
              marginBottom: '20px'
            }}>
              {projectColors.map(color => (
                <button
                  key={color}
                  onClick={() => setColorPickerModal({ ...colorPickerModal, currentColor: color })}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    border: colorPickerModal.currentColor === color ? '2px solid var(--primary)' : '2px solid transparent',
                    background: color,
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease'
                  }}
                />
              ))}
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={closeColorPickerModal}
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
                onClick={saveProjectColor}
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
                Save
              </button>
            </div>
          </div>
        </div>
      )}

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
          zIndex: 1100
        }}>
          <div style={{
            background: 'var(--bg-primary)',
            borderRadius: '20px',
            padding: '24px',
            width: '90%',
            maxWidth: '400px',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600' }}>Delete Project?</h3>
            <p style={{ margin: '0 0 24px 0', color: 'var(--text-tertiary)' }}>This action cannot be undone. The project and all its data will be permanently deleted.</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={closeConfirmDeleteModal}
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
                onClick={() => deleteProject(confirmDeleteModal.projectId)}
                style={{
                  background: 'var(--danger)',
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
          zIndex: 1100
        }}>
          <div style={{
            background: 'var(--bg-primary)',
            borderRadius: '20px',
            padding: '24px',
            width: '90%',
            maxWidth: '400px',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600' }}>Mark as Completed?</h3>
            <p style={{ margin: '0 0 24px 0', color: 'var(--text-tertiary)' }}>This project will be marked as completed and all busy artists will be freed up.</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={closeConfirmCompleteModal}
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
                onClick={() => completeProject(confirmCompleteModal.projectId)}
                style={{
                  background: 'var(--success)',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '14px',
                  fontSize: '16px',
                  cursor: 'pointer'
                }}
              >
                Complete
              </button>
            </div>
          </div>
        </div>
      )}

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
          zIndex: 1100
        }}>
          <div style={{
            background: 'var(--bg-primary)',
            borderRadius: '20px',
            padding: '24px',
            width: '90%',
            maxWidth: '400px',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600' }}>Date Validation</h3>
            <p style={{ margin: '0 0 24px 0', color: 'var(--text-tertiary)' }}>{dateValidationModal.message}</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={closeDateValidationModal}
                style={{
                  background: dateValidationModal.callback ? 'var(--bg-secondary)' : 'var(--primary)',
                  color: dateValidationModal.callback ? 'var(--text-primary)' : 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '14px',
                  fontSize: '16px',
                  cursor: 'pointer'
                }}
              >
                {dateValidationModal.callback ? 'Cancel' : 'OK'}
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
                    padding: '10px 20px',
                    borderRadius: '14px',
                    fontSize: '16px',
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
  );
};

export default ProjectStatusDashboard;