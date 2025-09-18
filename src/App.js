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

  // Calendar project colors
  const projectColors = [
    '#8D6E63', '#5D4037', '#795548', '#6D4C41', '#4E342E',
    '#3E2723', '#A1887F', '#8A6552', '#7B5E47', '#6B4E3D',
    '#5A4037', '#4A2C2A', '#78909C', '#607D8B', '#546E7A',
    '#455A64', '#37474F', '#263238', '#B0BEC5', '#90A4AE'
  ];

  function getProjectColor(projectId) {
    let hash = 0;
    for (let i = 0; i < projectId.length; i++) {
      hash = projectId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % projectColors.length;
    return projectColors[index];
  }

  // Sample data with real-time simulation
  const INITIAL_DATA = {
    totalArtists: 6,
    projects: [
      { 
        id: 'p1', 
        name: 'Product Hero Shot', 
        status: 'In Progress', 
        startDate: '2025-09-01', 
        dueDate: '2025-09-12', 
        busy: 3, 
        priority: 'High', 
        comments: [
          { id: 'c1', text: 'Need to adjust lighting for main shot', ignored: false, deleted: false, ts: new Date().toISOString() }
        ], 
        history: [
          `${new Date().toLocaleString()}: Project created`,
          `${new Date().toLocaleString()}: Status changed to In Progress`
        ]
      },
      { 
        id: 'p2', 
        name: 'Packaging Mockups', 
        status: 'Waiting', 
        startDate: '2025-09-05', 
        dueDate: '2025-09-20', 
        busy: 1, 
        priority: 'Medium', 
        comments: [], 
        history: [`${new Date().toLocaleString()}: Project created`]
      },
      { 
        id: 'p3', 
        name: 'Brand Study', 
        status: 'Hold', 
        startDate: '2025-08-10', 
        dueDate: '2025-09-10', 
        busy: 0, 
        priority: 'Low', 
        comments: [], 
        history: [`${new Date().toLocaleString()}: Project created`]
      }
    ]
  };

  // State management with real-time simulation
  const [state, setState] = useState(INITIAL_DATA);
  const [isAdmin, setIsAdmin] = useState(false);
  const [connected, setConnected] = useState(true);
  const [lastSync, setLastSync] = useState(new Date());

  // Modal states
  const [commentsForId, setCommentsForId] = useState(null);
  const [draft, setDraft] = useState('');
  const [confirmAddOpen, setConfirmAddOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [confirmIgnore, setConfirmIgnore] = useState(null);
  const [historyForId, setHistoryForId] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    status: 'Waiting',
    startDate: new Date().toISOString().slice(0, 10),
    dueDate: new Date().toISOString().slice(0, 10),
    busy: 0,
    priority: 'Low'
  });
  const [alertMessage, setAlertMessage] = useState('');
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [projectNameModal, setProjectNameModal] = useState({ open: false, projectId: null, name: '' });

  // Simulate real-time connection and periodic updates
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

      // Update last sync time
      if (connected) {
        setLastSync(new Date());
        
        // Simulate occasional random updates (like other users making changes)
        if (Math.random() > 0.97) { // 3% chance of simulated external update
          simulateExternalUpdate();
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [connected]);

  // Simulate external updates (other users making changes)
  function simulateExternalUpdate() {
    const updateTypes = ['comment', 'status', 'priority'];
    const updateType = updateTypes[Math.floor(Math.random() * updateTypes.length)];
    
    setState(prevState => {
      if (prevState.projects.length === 0) return prevState;
      
      const projectIndex = Math.floor(Math.random() * prevState.projects.length);
      const project = prevState.projects[projectIndex];
      const updatedProjects = [...prevState.projects];
      
      switch (updateType) {
        case 'comment':
          if (Math.random() > 0.5) {
            const newComment = {
              id: uid('c'),
              text: `System update: External change detected at ${new Date().toLocaleTimeString()}`,
              ignored: false,
              deleted: false,
              ts: new Date().toISOString()
            };
            updatedProjects[projectIndex] = {
              ...project,
              comments: [newComment, ...project.comments],
              history: [...project.history, `${new Date().toLocaleString()}: External comment added`]
            };
          }
          break;
          
        case 'status':
          const statuses = ['Waiting', 'In Progress', 'Queued', 'Hold'];
          const currentStatusIndex = statuses.indexOf(project.status);
          const newStatusIndex = (currentStatusIndex + 1) % statuses.length;
          const newStatus = statuses[newStatusIndex];
          
          updatedProjects[projectIndex] = {
            ...project,
            status: newStatus,
            busy: ['Hold', 'Completed', 'Waiting'].includes(newStatus) ? 0 : project.busy,
            history: [...project.history, `${new Date().toLocaleString()}: Status changed to ${newStatus} (External)`]
          };
          break;
          
        case 'priority':
          const priorities = ['Low', 'Medium', 'High'];
          const currentPriorityIndex = priorities.indexOf(project.priority);
          const newPriorityIndex = (currentPriorityIndex + 1) % priorities.length;
          const newPriority = priorities[newPriorityIndex];
          
          updatedProjects[projectIndex] = {
            ...project,
            priority: newPriority,
            history: [...project.history, `${new Date().toLocaleString()}: Priority changed to ${newPriority} (External)`]
          };
          break;
      }
      
      return {
        ...prevState,
        projects: updatedProjects
      };
    });
  }

  // Simulate saving to external database
  function simulateApiCall(operation, data) {
    return new Promise((resolve) => {
      // Simulate network delay
      setTimeout(() => {
        console.log(`API Call: ${operation}`, data);
        resolve({ success: true });
      }, 100 + Math.random() * 300);
    });
  }

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

  async function updateProject(id, changes, historyEntry) {
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

    // Simulate API call
    await simulateApiCall('updateProject', { id, changes });

    // Update state
    const entry = isAdmin ? `${historyEntry} [Admin]` : historyEntry;
    setState(prev => ({
      ...prev,
      projects: prev.projects.map(p => p.id === id ? ({
        ...p,
        ...changes,
        history: entry ? [...(p.history || []), entry] : p.history
      }) : p)
    }));
  }

  async function addProject() {
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
      comments: [],
      history: [`${new Date().toLocaleString()}: Project created${isAdmin ? ' [Admin]' : ''}`]
    };

    // Simulate API call
    await simulateApiCall('addProject', newP);

    setState(prev => ({ ...prev, projects: [newP, ...prev.projects] }));
    setIsAddModalOpen(false);
    setNewProject({
      name: '',
      status: 'Waiting',
      startDate: new Date().toISOString().slice(0, 10),
      dueDate: new Date().toISOString().slice(0, 10),
      busy: 0,
      priority: 'Low'
    });
  }

  async function deleteProject(id) {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    
    await simulateApiCall('deleteProject', { id });
    setState(prev => ({ ...prev, projects: prev.projects.filter(p => p.id !== id) }));
  }

  async function completeProject(id) {
    updateProject(id, { status: 'Completed' }, `${new Date().toLocaleString()}: Marked Completed`);
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
    if (!commentsForId || !draft.trim()) return;
    
    const comment = {
      id: uid('c'),
      text: draft.trim(),
      ignored: false,
      deleted: false,
      ts: new Date().toISOString()
    };

    await simulateApiCall('addComment', { projectId: commentsForId, comment });

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
  }

  function startEdit(commentId, text) {
    setEditingId(commentId);
    setEditingText(text || '');
  }

  async function saveEdit(commentId) {
    if (!commentsForId) return;
    
    const trimmed = editingText.trim();
    
    await simulateApiCall('editComment', { commentId, text: trimmed });

    setState(prev => ({
      ...prev,
      projects: prev.projects.map(p => {
        if (p.id !== commentsForId) return p;
        const newComments = p.comments.map(c => {
          if (c.id !== commentId) return c;
          const now = new Date().toISOString();
          if (trimmed === '') {
            return { ...c, deleted: true, ignored: false, ts: now };
          } else {
            return { ...c, text: trimmed, deleted: false, ignored: false, ts: now };
          }
        });
        return { ...p, comments: newComments, history: [...(p.history || []), `${new Date().toLocaleString()}: Comment edited${isAdmin ? ' [Admin]' : ''}`] };
      })
    }));
    
    setEditingId(null);
    setEditingText('');
  }

  function confirmIgnoreComment(commentId) {
    if (!commentsForId) return;
    setConfirmIgnore({ projectId: commentsForId, commentId });
  }

  async function doIgnore() {
    if (!confirmIgnore) return;
    
    const { projectId, commentId } = confirmIgnore;
    
    await simulateApiCall('ignoreComment', { commentId });

    setState(prev => ({
      ...prev,
      projects: prev.projects.map(p => {
        if (p.id !== projectId) return p;
        const newComments = p.comments.map(c => c.id === commentId ? ({ ...c, ignored: true, deleted: false, ts: new Date().toISOString() }) : c);
        return { ...p, comments: newComments, history: [...(p.history || []), `${new Date().toLocaleString()}: Comment ignored${isAdmin ? ' [Admin]' : ''}`] };
      })
    }));
    
    setConfirmIgnore(null);
  }

  // History functions
  function openHistory(projectId) { setHistoryForId(projectId); }
  function closeHistory() { setHistoryForId(null); }

  // Calendar functions
  function changeMonth(delta) {
    setCurrentMonth(prevMonth => {
      let newMonth = prevMonth + delta;
      let newYear = currentYear;

      if (newMonth < 0) {
        newMonth = 11;
        newYear--;
      } else if (newMonth > 11) {
        newMonth = 0;
        newYear++;
      }

      setCurrentYear(newYear);
      return newMonth;
    });
  }

  function goToToday() {
    const today = new Date();
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
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

  // Timeline helpers
  const monthDays = getMonthDays(currentYear, currentMonth);
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
      return getProjectColor(projects[0].id);
    }

    const stripeHeight = 100 / projects.length;
    const gradientStops = [];
    
    projects.forEach((project, index) => {
      const color = getProjectColor(project.id);
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
    } as React.CSSProperties}>
      
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
        fontSize: '12px'
      }}>
        <div style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: connected ? '#34C759' : '#FF3B30',
          animation: connected ? 'none' : 'pulse 1s infinite'
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
              onClick={() => setIsAdmin(v => !v)}
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
          boxShadow: 'var(--shadow)'
        }}>
          <div style={{
            fontSize: '32px',
            fontWeight: 700,
            letterSpacing: '-0.024em',
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '8px'
          }}>
            Zigert Visual
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
            Real-time collaborative workspace • Demo Mode
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
              transition: 'all 0.3s ease'
            }}>
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
                letterSpacing: '-0.024em'
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
          marginBottom: '32px'
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
              }).map(project => (
                <div key={project.id} style={{
                  background: 'var(--bg-secondary)',
                  borderRadius: '16px',
                  padding: '20px',
                  marginBottom: '16px',
                  transition: 'all 0.3s ease',
                  borderLeft: `6px solid ${getProjectColor(project.id)}`
                }}>
                  {isAdmin && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      alignItems: 'center',
                      marginBottom: '16px',
                      minHeight: '32px'
                    }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => {
                            if (window.confirm("Are you sure you want to mark the project as completed?")) {
                              completeProject(project.id);
                            }
                          }}
                          style={{
                            background: 'var(--bg-primary)',
                            color: 'var(--primary)',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '10px',
                            fontSize: '13px',
                            fontWeight: 500,
                            cursor: 'pointer'
                          }}
                        >
                          Complete
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this project?')) {
                              deleteProject(project.id);
                            }
                          }}
                          style={{
                            background: 'var(--bg-primary)',
                            color: 'var(--danger)',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '10px',
                            fontSize: '13px',
                            fontWeight: 500,
                            cursor: 'pointer'
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Project Details Grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr 160px 80px 160px 120px',
                    gap: '12px',
                    alignItems: 'center'
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center', textAlign: 'center' }}>
                      <div style={{
                        fontSize: '12px',
                        color: 'var(--text-quaternary)',
                        fontWeight: 500,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em'
                      }}>
                        Project
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        height: '34px'
                      }}>
                        <div style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          backgroundColor: getProjectColor(project.id),
                          flexShrink: 0
                        }}></div>
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
                              minHeight: '34px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            title="Click to edit"
                          >
                            {project.name}
                          </div>
                        ) : (
                          <div style={{ fontWeight: 600 }}>{project.name}</div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center', textAlign: 'center' }}>
                      <div style={{
                        fontSize: '12px',
                        color: 'var(--text-quaternary)',
                        fontWeight: 500,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em'
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
                            borderRadius: '12px',
                            border: '1px solid transparent',
                            width: '160px',
                            textAlign: 'center',
                            fontWeight: 600,
                            backgroundColor: statusColors[project.status] || '#e5e5ea',
                            color: '#fff',
                            cursor: 'pointer',
                            height: '34px',
                            fontSize: '12px'
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
                          borderRadius: '12px',
                          backgroundColor: statusColors[project.status] || '#e5e5ea',
                          color: '#fff',
                          fontWeight: 600,
                          fontSize: '12px',
                          height: '34px',
                          width: '160px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {project.status}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center', textAlign: 'center' }}>
                      <div style={{
                        fontSize: '12px',
                        color: 'var(--text-quaternary)',
                        fontWeight: 500,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em'
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
                              window.alert('Start date cannot be later than Due date');
                              return;
                            }
                            updateProject(project.id, { startDate: val }, `${new Date().toLocaleString()}: Start changed to ${val}`);
                          }}
                          style={{
                            padding: '8px 12px',
                            borderRadius: '12px',
                            border: '1px solid transparent',
                            background: 'var(--bg-primary)',
                            fontFamily: 'inherit',
                            fontSize: '14px',
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            width: '100%',
                            maxWidth: '120px',
                            textAlign: 'center',
                            cursor: 'pointer',
                            height: '34px'
                          }}
                        />
                      ) : (
                        <div style={{height: '34px', display: 'flex', alignItems: 'center'}}>{project.startDate}</div>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center', textAlign: 'center' }}>
                      <div style={{
                        fontSize: '12px',
                        color: 'var(--text-quaternary)',
                        fontWeight: 500,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em'
                      }}>
                        Due
                      </div>
                      {isAdmin ? (
                        <input
                          type='date'
                          value={project.dueDate}
                          min={project.startDate}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (new Date(val) < new Date(project.startDate)) {
                              window.alert('Due date cannot be earlier than Start date');
                              return;
                            }
                            updateProject(project.id, { dueDate: val }, `${new Date().toLocaleString()}: Due changed to ${val}`);
                          }}
                          style={{
                            padding: '8px 12px',
                            borderRadius: '12px',
                            border: '1px solid transparent',
                            background: 'var(--bg-primary)',
                            fontFamily: 'inherit',
                            fontSize: '14px',
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            width: '100%',
                            maxWidth: '120px',
                            textAlign: 'center',
                            cursor: 'pointer',
                            height: '34px'
                          }}
                        />
                      ) : (
                        <div style={{height: '34px', display: 'flex', alignItems: 'center'}}>{project.dueDate}</div>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center', textAlign: 'center' }}>
                      <div style={{
                        fontSize: '12px',
                        color: 'var(--text-quaternary)',
                        fontWeight: 500,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em'
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
                            borderRadius: '12px',
                            border: '1px solid transparent',
                            background: 'var(--bg-primary)',
                            fontFamily: 'inherit',
                            fontSize: '14px',
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            width: '64px',
                            textAlign: 'center',
                            margin: '0 auto',
                            cursor: 'pointer',
                            height: '34px'
                          }}
                        />
                      ) : (
                        <div style={{ width: 64, margin: '0 auto', height: '34px', display: 'flex', alignItems: 'center' }}>{project.busy}</div>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center', textAlign: 'center' }}>
                      <div style={{
                        fontSize: '12px',
                        color: 'var(--text-quaternary)',
                        fontWeight: 500,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em'
                      }}>
                        Priority
                      </div>
                      <select
                        value={project.priority}
                        onChange={(e) => updateProject(project.id, { priority: e.target.value }, `${new Date().toLocaleString()}: Priority changed to ${e.target.value}`)}
                        style={{
                          padding: '8px 12px',
                          borderRadius: '12px',
                          border: '1px solid transparent',
                          width: '160px',
                          textAlign: 'center',
                          fontWeight: 600,
                          backgroundColor: priorityColors[project.priority] || '#fff',
                          color: ['High', 'Medium'].includes(project.priority) ? '#fff' : '#000',
                          cursor: 'pointer',
                          height: '34px',
                          fontSize: '12px'
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
                      height: '34px'
                    }}>
                      <div
                        onClick={() => openComments(project.id)}
                        style={{
                          minWidth: '36px',
                          height: '36px',
                          padding: '0 8px',
                          borderRadius: '18px',
                          border: '1px solid rgba(0, 0, 0, 0.06)',
                          background: 'var(--bg-primary)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          cursor: 'pointer',
                          fontSize: '18px'
                        }}
                      >
                        💬
                        {project.comments.length > 0 && (
                          <span style={{ fontSize: '12px', fontWeight: 600 }}>
                            {project.comments.length}
                          </span>
                        )}
                      </div>
                      <div
                        title="History"
                        onClick={() => openHistory(project.id)}
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '18px',
                          border: '1px solid rgba(0, 0, 0, 0.06)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          fontWeight: 700,
                          background: 'var(--bg-primary)',
                          fontSize: '16px'
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
          boxShadow: 'var(--shadow)'
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
                    fontWeight: 500
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
                    fontWeight: 500
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
                    fontWeight: 500
                  }}
                >
                  →
                </button>
              </div>
              <div style={{
                fontSize: '18px',
                fontWeight: 700
              }}>
                {monthNames[currentMonth]} {currentYear}
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
                      textShadow: projects.length > 0 ? '1px 1px 2px rgba(0,0,0,0.7)' : 'none'
                    }}
                    title={titleAttr}
                  >
                    {day.getDate()}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* All Modals */}
      {/* Alert Modal */}
      {isAlertOpen && (
        <div style={{
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
          <div style={{
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
              cursor: 'pointer'
            }}>OK</button>
          </div>
        </div>
      )}

      {/* Comments Modal */}
      {commentsForId && (
        <div style={{
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
          <div style={{
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
                cursor: 'pointer'
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
                    border: '1px solid var(--separator)'
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
                          cursor: 'pointer'
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
                            opacity: c.ignored ? 0.5 : 1
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
                            border: '1px solid var(--gray-4)'
                          }}
                        />
                        <button onClick={() => saveEdit(c.id)} style={{
                          background: 'var(--primary)',
                          color: 'white',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '10px',
                          cursor: 'pointer'
                        }}>Save</button>
                        <button onClick={() => { setEditingId(null); setEditingText(''); }} style={{
                          background: 'var(--bg-secondary)',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '10px',
                          cursor: 'pointer'
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
                    border: '1px solid var(--gray-4)'
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
                    opacity: draft.trim() ? 1 : 0.5
                  }}
                >Add</button>
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
          <div style={{
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
                  color: 'var(--text-primary)'
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
                      border: '1px solid var(--separator)'
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
        <div style={{
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
          <div style={{
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
                style={{ padding: '10px', borderRadius: '10px', border: '1px solid var(--gray-4)' }}
              />
              <select
                value={newProject.status}
                onChange={(e) => setNewProject(prev => ({ ...prev, status: e.target.value }))}
                style={{ padding: '10px', borderRadius: '10px', border: '1px solid var(--gray-4)' }}
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
                style={{ padding: '10px', borderRadius: '10px', border: '1px solid var(--gray-4)' }}
              />
              <input
                type="date"
                value={newProject.dueDate}
                onChange={(e) => setNewProject(prev => ({ ...prev, dueDate: e.target.value }))}
                style={{ padding: '10px', borderRadius: '10px', border: '1px solid var(--gray-4)' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <button onClick={() => setIsAddModalOpen(false)} style={{
                background: 'var(--bg-secondary)', padding: '8px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer'
              }}>Cancel</button>
              <button onClick={addProject} style={{
                background: 'var(--primary)', color: 'white', padding: '8px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer'
              }}>Add</button>
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
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.4)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }} onClick={closeProjectNameModal}>
          <div style={{
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
              style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid var(--gray-4)', marginBottom: '16px' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button onClick={closeProjectNameModal} style={{
                background: 'var(--bg-secondary)', padding: '8px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer'
              }}>Cancel</button>
              <button onClick={saveProjectName} style={{
                background: 'var(--primary)', color: 'white', padding: '8px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer'
              }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialogs */}
      {confirmAddOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          background: 'rgba(0, 0, 0, 0.5)'
        }}>
          <div style={{
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
                cursor: 'pointer'
              }}>Cancel</button>
              <button onClick={addCommentConfirmed} style={{
                background: 'var(--primary)',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '10px',
                cursor: 'pointer'
              }}>Ok</button>
            </div>
          </div>
        </div>
      )}

      {confirmIgnore && (
        <div style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          background: 'rgba(0, 0, 0, 0.5)'
        }}>
          <div style={{
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
                cursor: 'pointer'
              }}>No</button>
              <button onClick={doIgnore} style={{
                background: 'var(--primary)',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '10px',
                cursor: 'pointer'
              }}>Yes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectStatusDashboard;