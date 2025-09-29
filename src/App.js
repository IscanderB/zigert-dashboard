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

  const [expandedImagesProjectId, setExpandedImagesProjectId] = useState(null);
  const [newCameraName, setNewCameraName] = useState('');
  const [confirmDeleteCamera, setConfirmDeleteCamera] = useState(null);
  const [stagePickerModal, setStagePickerModal] = useState({ open: false, projectId: null, cameraId: null, currentStage: 'WIP' });

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
          project_history(*)
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
        cameras: []
      }));

      const { data: cameras, error: camerasError } = await supabase
        .from('project_cameras')
        .select('*')
        .order('name', { ascending: true });
      
      if (camerasError && camerasError.code !== 'PGRST116') {
        console.warn('Project cameras table not found, continuing without it');
      }

      if (cameras && cameras.length > 0) {
        cameras.forEach(camera => {
          const project = transformedProjects.find(p => p.id === camera.project_id);
          if (project) {
            project.cameras.push({
              id: camera.id,
              name: camera.name,
              stage: camera.stage || 'WIP'
            });
          }
        });
      }

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

  async function addCamera(projectId, cameraName) {
    try {
      if (!cameraName.trim()) {
        showAlert("Specify camera name!");
        return;
      }

      const camera = {
        id: uid('cam'),
        project_id: projectId,
        name: cameraName.trim(),
        stage: 'WIP'
      };

      const { data, error } = await supabase
        .from('project_cameras')
        .insert(camera)
        .select();

      if (error) throw error;

      await addHistoryEntry(projectId, `${new Date().toLocaleString()}: Camera "${cameraName}" added${isAdmin ? ' [Admin]' : ''}`);

      setState(prev => ({
        ...prev,
        projects: prev.projects.map(p => p.id === projectId ? ({
          ...p,
          cameras: [...(p.cameras || []), { id: camera.id, name: camera.name, stage: camera.stage }].sort((a, b) => a.name.localeCompare(b.name)),
          history: [`${new Date().toLocaleString()}: Camera "${cameraName}" added${isAdmin ? ' [Admin]' : ''}`, ...(p.history || [])]
        }) : p)
      }));

      setNewCameraName('');
      setLastSync(new Date());
      showAlert(`Camera "${cameraName}" added!`);
    } catch (err) {
      if (err.message?.includes("project_cameras")) {
        setError('Camera table not found. Please create the table in Supabase first.');
      } else {
        setError(`Failed to add camera: ${err.message}`);
      }
      console.error('Add camera error:', err);
    }
  }

  async function deleteCamera(projectId, cameraId, cameraName) {
    try {
      const { error } = await supabase
        .from('project_cameras')
        .delete()
        .eq('id', cameraId);

      if (error) throw error;

      await addHistoryEntry(projectId, `${new Date().toLocaleString()}: Camera "${cameraName}" deleted [Admin]`);

      setState(prev => ({
        ...prev,
        projects: prev.projects.map(p => p.id === projectId ? ({
          ...p,
          cameras: (p.cameras || []).filter(c => c.id !== cameraId),
          history: [`${new Date().toLocaleString()}: Camera "${cameraName}" deleted [Admin]`, ...(p.history || [])]
        }) : p)
      }));

      setLastSync(new Date());
      setConfirmDeleteCamera(null);
      showAlert(`Camera "${cameraName}" deleted!`);
    } catch (err) {
      setError(`Failed to delete camera: ${err.message}`);
      console.error('Delete camera error:', err);
    }
  }

  async function updateCameraStage(projectId, cameraId, newStage) {
    try {
      const { error } = await supabase
        .from('project_cameras')
        .update({ stage: newStage })
        .eq('id', cameraId);

      if (error) throw error;

      const project = state.projects.find(p => p.id === projectId);
      const camera = project?.cameras?.find(c => c.id === cameraId);
      
      if (camera) {
        await addHistoryEntry(projectId, `${new Date().toLocaleString()}: Camera "${camera.name}" stage changed to ${newStage}`);
      }

      setState(prev => ({
        ...prev,
        projects: prev.projects.map(p => p.id === projectId ? ({
          ...p,
          cameras: (p.cameras || []).map(c => c.id === cameraId ? { ...c, stage: newStage } : c),
          history: camera ? [`${new Date().toLocaleString()}: Camera "${camera.name}" stage changed to ${newStage}`, ...(p.history || [])] : p.history
        }) : p)
      }));

      setLastSync(new Date());
    } catch (err) {
      setError(`Failed to update camera stage: ${err.message}`);
      console.error('Update camera stage error:', err);
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

  useEffect(() => {
    if (!expandedImagesProjectId) return;

    const timer = setTimeout(() => {
      setExpandedImagesProjectId(null);
    }, 180000);

    return () => clearTimeout(timer);
  }, [expandedImagesProjectId]);

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
  function closeHistory() { setHistoryForId(null); }

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

  function getStageColor(stage) {
    if (stage === 'WIP' || stage.startsWith('WIP')) {
      return '#8E8E93';
    } else if (stage === 'ICD' || stage.startsWith('ICD')) {
      return '#007AFF';
    } else if (stage.startsWith('R')) {
      const match = stage.match(/R(\d+)/);
      if (match) {
        const iteration = parseInt(match[1]);
        if (iteration === 1) return '#FFD60A';
        if (iteration === 2) return '#FF9500';
        if (iteration === 3) return '#FF9500';
        if (iteration === 4) return '#FF6B00';
        if (iteration >= 5) return '#FF3B30';
      }
      return '#FF9500';
    } else if (stage === 'Approved') {
      return '#34C759';
    }
    return '#8E8E93';
  }

  function incrementStage(currentStage) {
    if (currentStage === 'WIP') return 'WIP01';
    if (currentStage === 'ICD') return 'ICD01';
    if (currentStage === 'Approved') return 'Approved';
    
    const wipMatch = currentStage.match(/WIP(\d+)/);
    if (wipMatch) {
      const num = parseInt(wipMatch[1]);
      return `WIP${String(num + 1).padStart(2, '0')}`;
    }
    
    const icdMatch = currentStage.match(/ICD(\d+)/);
    if (icdMatch) {
      const num = parseInt(icdMatch[1]);
      return `ICD${String(num + 1).padStart(2, '0')}`;
    }
    
    const rMatch = currentStage.match(/R(\d+)/);
    if (rMatch) {
      const num = parseInt(rMatch[1]);
      return `R${String(num + 1).padStart(2, '0')}`;
    }
    
    return currentStage;
  }

  function decrementStage(currentStage) {
    if (currentStage === 'WIP' || currentStage === 'ICD' || currentStage === 'Approved') return currentStage;
    if (currentStage === 'R01') return currentStage;
    
    const wipMatch = currentStage.match(/WIP(\d+)/);
    if (wipMatch) {
      const num = parseInt(wipMatch[1]);
      if (num <= 1) return 'WIP';
      return `WIP${String(num - 1).padStart(2, '0')}`;
    }
    
    const icdMatch = currentStage.match(/ICD(\d+)/);
    if (icdMatch) {
      const num = parseInt(icdMatch[1]);
      if (num <= 1) return 'ICD';
      return `ICD${String(num - 1).padStart(2, '0')}`;
    }
    
    const rMatch = currentStage.match(/R(\d+)/);
    if (rMatch) {
      const num = parseInt(rMatch[1]);
      if (num <= 1) return 'R01';
      return `R${String(num - 1).padStart(2, '0')}`;
    }
    
    return currentStage;
  }

  function canDecrementStage(stage) {
    if (stage === 'WIP' || stage === 'ICD' || stage === 'R01' || stage === 'Approved') return false;
    return true;
  }

  function canIncrementStage(stage) {
    if (stage === 'Approved') return false;
    return true;
  }

  function openStagePicker(projectId, cameraId, currentStage) {
    setStagePickerModal({ open: true, projectId, cameraId, currentStage });
  }

  function closeStagePicker() {
    setStagePickerModal({ open: false, projectId: null, cameraId: null, currentStage: 'WIP' });
  }

  async function selectStage(stage) {
    if (!stagePickerModal.projectId || !stagePickerModal.cameraId) return;
    
    await updateCameraStage(stagePickerModal.projectId, stagePickerModal.cameraId, stage);
    closeStagePicker();
  }

  function toggleImagesSection(projectId) {
    if (expandedImagesProjectId === projectId) {
      setExpandedImagesProjectId(null);
    } else {
      setExpandedImagesProjectId(projectId);
    }
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
      '--primary': '#007AFF',
      '--success': '#34C759',
      '--warning': '#FF9500',
      '--danger': '#FF3B30',
      '--gray-1': '#8E8E93',
      '--gray-2': '#C7C7CC',
      '--gray-3': '#D1D1D6',
      '--gray-4': '#E5E5EA',
      '--bg-primary': '#FFFFFF',
      '--bg-secondary': '#F2F2F7',
      '--separator': 'rgba(60, 60, 67, 0.12)',
      '--shadow': '0 0 20px rgba(0, 0, 0, 0.05)'
    }}>
      
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
              fontSize: '16px'
            }}
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
        fontSize: '12px'
      }}>
        <div style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: connected ? '#34C759' : '#FF3B30'
        }}></div>
        {connected ? `Synced ${lastSync.toLocaleTimeString()}` : 'Reconnecting...'}
      </div>

      <div style={{
        background: 'rgba(255, 255, 255, 0.72)',
        backdropFilter: 'saturate(180%) blur(20px)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        borderBottom: '0.5px solid var(--separator)',
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
                background: 'var(--bg-secondary)',
                color: 'var(--primary)',
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
                background: 'var(--bg-secondary)',
                color: 'var(--primary)',
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

      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '0 24px 24px'
      }}>
        {/* Продолжение в следующем сообщении из-за лимита символов */}
      </div>
    </div>
  );
};

export default ProjectStatusDashboard;