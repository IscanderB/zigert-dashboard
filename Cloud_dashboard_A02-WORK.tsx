import React, { useState, useEffect } from 'react';

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

  // Project colors - unique color for each project
  const projectColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
    '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2',
    '#A3E4D7', '#F9E79F', '#FADBD8', '#D5F3FE', '#E8DAEF'
  ];

  function getProjectColor(projectId) {
    // Generate consistent color based on project ID
    let hash = 0;
    for (let i = 0; i < projectId.length; i++) {
      hash = projectId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % projectColors.length;
    return projectColors[index];
  }

  // Sample data
  const SAMPLE = {
    totalArtists: 6,
    projects: [
      { id: 'p1', name: 'Product Hero Shot', status: 'In Progress', startDate: '2025-09-01', dueDate: '2025-09-12', busy: 3, priority: 'High', comments: [], history: [] },
      { id: 'p2', name: 'Packaging Mockups', status: 'Waiting', startDate: '2025-09-05', dueDate: '2025-09-20', busy: 1, priority: 'Medium', comments: [], history: [] },
      { id: 'p3', name: 'Brand Study', status: 'Hold', startDate: '2025-08-10', dueDate: '2025-09-10', busy: 0, priority: 'Low', comments: [], history: [] }
    ]
  };

  function save(state) { 
    // Note: localStorage is not available in Claude artifacts, so we'll skip saving
  }
  
  function load() { 
    try { 
      // In real implementation, would return JSON.parse(localStorage.getItem('psd_v3')) || SAMPLE; 
      return SAMPLE; 
    } catch (e) { 
      return SAMPLE; 
    } 
  }

  // State management
  const [state, setState] = useState(() => load());
  const [isAdmin, setIsAdmin] = useState(false);

  // Comments modal state
  const [commentsForId, setCommentsForId] = useState(null);
  const [draft, setDraft] = useState('');
  const [confirmAddOpen, setConfirmAddOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [confirmIgnore, setConfirmIgnore] = useState(null);

  // History modal state
  const [historyForId, setHistoryForId] = useState(null);

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  // Add project modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    status: 'Waiting',
    startDate: new Date().toISOString().slice(0, 10),
    dueDate: new Date().toISOString().slice(0, 10),
    busy: 0,
    priority: 'Low'
  });

  // Edit project modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  // Alert modal state
  const [alertMessage, setAlertMessage] = useState('');
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  // Project name modal state
  const [projectNameModal, setProjectNameModal] = useState({ open: false, projectId: null, name: '' });

  useEffect(() => save(state), [state]);

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

  function updateProject(id, changes, historyEntry) {
    const project = state.projects.find(p => p.id === id);
    if (!project) return;

    // Automatic status change when Busy changes
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

    // Automatic Busy change when status changes
    if (changes.status !== undefined) {
      if (changes.status === 'Hold' || changes.status === 'Completed' || changes.status === 'Waiting') {
        changes.busy = 0;
      }
    }

    // Check artist availability
    if (changes.busy !== undefined) {
      const currentBusy = project.busy;
      const newBusyTotal = busy - currentBusy + parseInt(changes.busy);

      if (newBusyTotal > total) {
        showAlert("Not enough artists!");
        return;
      }
    }

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

  function addProject() {
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

  function editProject() {
    if (!editingProject) return;

    if (!editingProject.name.trim()) {
      showAlert("Specify project name!");
      return;
    }

    const currentProject = state.projects.find(p => p.id === editingProject.id);
    const currentBusy = currentProject ? currentProject.busy : 0;
    const newBusy = parseInt(editingProject.busy) || 0;
    const newBusyTotal = busy - currentBusy + newBusy;

    if (newBusyTotal > total) {
      showAlert("Not enough artists!");
      return;
    }

    const changes = {
      name: editingProject.name,
      status: editingProject.status,
      startDate: editingProject.startDate,
      dueDate: editingProject.dueDate,
      busy: newBusy,
      priority: editingProject.priority
    };

    updateProject(
      editingProject.id,
      changes,
      `${new Date().toLocaleString()}: Project details updated${isAdmin ? ' [Admin]' : ''}`
    );

    setIsEditModalOpen(false);
    setEditingProject(null);
  }

  function deleteProject(id) {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    setState(prev => ({ ...prev, projects: prev.projects.filter(p => p.id !== id) }));
  }

  function clearComments(projectId) {
    if (!window.confirm('Are you sure you want to clear all comments?')) return;
    setState(prev => ({
      ...prev,
      projects: prev.projects.map(p =>
        p.id === projectId
          ? { ...p, comments: [], history: [...(p.history || []), `${new Date().toLocaleString()}: All comments cleared${isAdmin ? ' [Admin]' : ''}`] }
          : p
      )
    }));
  }

  function clearHistory(projectId) {
    if (!window.confirm('Are you sure you want to clear all history?')) return;
    setState(prev => ({
      ...prev,
      projects: prev.projects.map(p =>
        p.id === projectId
          ? { ...p, history: [], history: [`${new Date().toLocaleString()}: History cleared${isAdmin ? ' [Admin]' : ''}`] }
          : p
      )
    }));
  }

  // Comments actions
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

  function addCommentConfirmed() {
    if (!commentsForId) return;
    if (!draft.trim()) return;
    const projectId = commentsForId;
    const ts = new Date().toISOString();
    setState(prev => ({
      ...prev,
      projects: prev.projects.map(p => p.id === projectId ? ({
        ...p,
        comments: [{ id: uid('c'), text: draft.trim(), ts, ignored: false, deleted: false }, ...p.comments],
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

  function saveEdit(commentId) {
    if (!commentsForId) return;
    const projectId = commentsForId;
    setState(prev => ({
      ...prev,
      projects: prev.projects.map(p => {
        if (p.id !== projectId) return p;
        const newComments = p.comments.map(c => {
          if (c.id !== commentId) return c;
          const now = new Date().toISOString();
          const trimmed = editingText.trim();
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

  function doIgnore() {
    if (!confirmIgnore) return;
    const { projectId, commentId } = confirmIgnore;
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

  // History actions
  function openHistory(projectId) { setHistoryForId(projectId); }
  function closeHistory() { setHistoryForId(null); }

  // Calendar navigation
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

  // Project name modal actions
  function openProjectNameModal(projectId, currentName) {
    setProjectNameModal({ open: true, projectId, name: currentName });
  }

  function closeProjectNameModal() {
    setProjectNameModal({ open: false, projectId: null, name: '' });
  }

  function saveProjectName() {
    if (!projectNameModal.name.trim()) {
      showAlert("Specify project name!");
      return;
    }

    updateProject(
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

  // New function to get projects for a specific day
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

  // New function to create multi-project day background
  function createDayBackground(dayKey) {
    const projects = getProjectsForDay(dayKey);
    
    if (projects.length === 0) {
      return 'var(--bg-secondary)';
    }

    if (projects.length === 1) {
      return getProjectColor(projects[0].id);
    }

    // Create striped background for multiple projects
    const stripeWidth = 100 / projects.length;
    const gradientStops = [];
    
    projects.forEach((project, index) => {
      const color = getProjectColor(project.id);
      const startPercent = index * stripeWidth;
      const endPercent = (index + 1) * stripeWidth;
      
      gradientStops.push(`${color} ${startPercent}%`);
      gradientStops.push(`${color} ${endPercent}%`);
    });

    return `linear-gradient(45deg, ${gradientStops.join(', ')})`;
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
    'In Progress': 'var(--primary)',
    'Waiting': 'var(--warning)',
    'Hold': 'var(--gray-1)',
    'Completed': 'var(--success)',
    'Queued': '#FFCC00'
  };

  const priorityColors = {
    'High': 'var(--danger)',
    'Medium': 'var(--warning)',
    'Low': 'var(--success)'
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
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'relative'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)'
          }}>
            <div style={{
              fontSize: '22px',
              fontWeight: 700,
              letterSpacing: '-0.024em',
              background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Zigert Visual
            </div>
            <div style={{
              fontSize: '20px',
              fontWeight: 600,
              color: 'var(--text-primary)'
            }}>
              Project Status Dashboard
            </div>
          </div>
          <div style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            position: 'absolute',
            right: '24px'
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
              transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              position: 'relative',
              overflow: 'hidden'
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
            {state.projects.map(project => (
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
                            updateProject(project.id, { status: 'Completed' }, `${new Date().toLocaleString()}: Marked Completed`);
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
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
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
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
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
                  gridTemplateColumns: '2fr 1fr 1fr 160px 80px 120px 120px',
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
                      gap: '8px'
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
                            padding: '4px 8px',
                            borderRadius: '8px',
                            border: '1px solid var(--gray-3)',
                            textAlign: 'center',
                            fontWeight: 600,
                            cursor: 'pointer',
                            background: 'var(--bg-primary)'
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
                          padding: '4px 8px',
                          borderRadius: '12px',
                          border: '1px solid transparent',
                          width: '140px',
                          textAlign: 'center',
                          fontWeight: 600,
                          backgroundColor: statusColors[project.status] || '#e5e5ea',
                          color: '#fff',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="Waiting">Waiting</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Queued">Queued</option>
                        <option value="Hold">Hold</option>
                        <option value="Completed">Completed</option>
                      </select>
                    ) : (
                      <div style={{
                        padding: '4px 12px',
                        borderRadius: '12px',
                        backgroundColor: statusColors[project.status] || '#e5e5ea',
                        color: '#fff',
                        fontWeight: 600,
                        fontSize: '14px'
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
                          cursor: 'pointer'
                        }}
                      />
                    ) : (
                      <div>{project.startDate}</div>
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
                          cursor: 'pointer'
                        }}
                      />
                    ) : (
                      <div>{project.dueDate}</div>
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
                          cursor: 'pointer'
                        }}
                      />
                    ) : (
                      <div style={{ width: 64, margin: '0 auto' }}>{project.busy}</div>
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
                        padding: '4px 8px',
                        borderRadius: '12px',
                        border: '1px solid transparent',
                        width: '140px',
                        textAlign: 'center',
                        fontWeight: 600,
                        backgroundColor: priorityColors[project.priority] || '#fff',
                        color: ['High', 'Medium'].includes(project.priority) ? '#fff' : '#000',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>

                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'center',
                    justifyContent: 'center'
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
                        fontSize: '18px',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      💬
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
                        transition: 'all 0.2s ease'
                      }}
                    >
                      ●
                    </div>
                  </div>
                </div>
              </div>
            ))}
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
                      transition: 'all 0.2s ease',
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
                <div style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.024em' }}>
                  Comments — {state.projects.find(p => p.id === commentsForId)?.name}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-quaternary)', marginTop: '2px' }}>
                  {state.projects.find(p => p.id === commentsForId)?.comments?.length || 0} comment(s)
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {isAdmin && (
                  <button
                    onClick={() => clearComments(commentsForId)}
                    style={{
                      background: 'var(--bg-tertiary)',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '10px',
                      fontSize: '14px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      color: 'var(--danger)'
                    }}
                  >
                    Clear All
                  </button>
                )}
                <button
                  onClick={closeComments}
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
                    <div style={{ fontSize: '14px' }}>No comments yet</div>
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: '14px',
                          lineHeight: 1.5,
                          color: (c.deleted || c.ignored) ? 'var(--text-quaternary)' : 'var(--text-primary)',
                          textDecoration: (c.deleted || c.ignored) ? 'line-through' : 'none'
                        }}>
                          {c.text || (c.deleted ? '(deleted)' : '')}
                        </div>
                        <div style={{
                          fontSize: '11px',
                          color: 'var(--text-quaternary)',
                          marginTop: '6px'
                        }}>
                          {c.ts ? new Date(c.ts).toLocaleString() : ''}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <button
                          onClick={() => startEdit(c.id, c.text)}
                          style={{
                            background: 'var(--bg-secondary)',
                            border: 'none',
                            padding: '6px 10px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            cursor: 'pointer',
                            color: 'var(--primary)'
                          }}
                        >
                          ✏️ Edit
                        </button>
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
                            color: c.ignored ? 'var(--text-quaternary)' : 'var(--danger)',
                            opacity: c.ignored ? 0.5 : 1
                          }}
                        >
                          {c.ignored ? 'Ignored' : 'Ignore'}
                        </button>
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
                            fontFamily: 'inherit',
                            fontSize: '14px',
                            background: 'var(--bg-primary)'
                          }}
                        />
                        <button
                          onClick={() => saveEdit(c.id)}
                          style={{
                            background: 'var(--primary)',
                            color: 'white',
                            border: 'none',
                            padding: '10px 20px',
                            borderRadius: '10px',
                            fontSize: '15px',
                            fontWeight: 600,
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
                            padding: '10px 20px',
                            borderRadius: '10px',
                            fontSize: '15px',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div style={{
                display: 'flex',
                gap: '8px',
                alignItems: 'center',
                marginTop: '8px'
              }}>
                <input
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  placeholder='Write a comment...'
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '12px',
                    border: '1px solid var(--gray-4)',
                    fontFamily: 'inherit',
                    fontSize: '14px',
                    background: 'var(--bg-primary)'
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
                    fontSize: '15px',
                    fontWeight: 600,
                    cursor: draft.trim() ? 'pointer' : 'not-allowed',
                    opacity: draft.trim() ? 1 : 0.5
                  }}
                >
                  Add
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
                <div style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.024em' }}>
                  History — {state.projects.find(p => p.id === historyForId)?.name}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-quaternary)', marginTop: '2px' }}>
                  {(state.projects.find(p => p.id === historyForId)?.history || []).length} record(s)
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {isAdmin && (
                  <button
                    onClick={() => clearHistory(historyForId)}
                    style={{
                      background: 'var(--bg-tertiary)',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '10px',
                      fontSize: '14px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      color: 'var(--danger)'
                    }}
                  >
                    Clear History
                  </button>
                )}
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
            </div>

            <div style={{ padding: '24px', overflow: 'auto', flex: 1 }}>
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {(state.projects.find(p => p.id === historyForId)?.history || []).length === 0 && (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-quaternary)' }}>
                    <div style={{ fontSize: '14px' }}>No history yet</div>
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
                      <div style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        color: 'var(--text-primary)'
                      }}>
                        {msgPart}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: 'var(--text-quaternary)',
                        marginTop: '6px'
                      }}>
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
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }} onClick={() => setIsAddModalOpen(false)}>
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
              <div style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.024em' }}>
                Add New Project
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
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
                Cancel
              </button>
            </div>

            <div style={{ padding: '24px', overflow: 'auto', flex: 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { label: 'Name:', name: 'name', type: 'text', placeholder: 'Project name' },
                  { label: 'Status:', name: 'status', type: 'select', options: ['Waiting', 'In Progress', 'Queued', 'Hold', 'Completed'] },
                  { label: 'Start Date:', name: 'startDate', type: 'date' },
                  { label: 'Due Date:', name: 'dueDate', type: 'date', min: newProject.startDate },
                  { label: 'Busy:', name: 'busy', type: 'number', min: '0', max: total },
                  { label: 'Priority:', name: 'priority', type: 'select', options: ['Low', 'Medium', 'High'] }
                ].map((field, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ width: '100px', fontWeight: 600 }}>{field.label}</div>
                    {field.type === 'select' ? (
                      <select
                        name={field.name}
                        value={newProject[field.name as keyof typeof newProject]}
                        onChange={(e) => setNewProject(prev => ({ ...prev, [field.name]: e.target.value }))}
                        style={{
                          flex: 1,
                          padding: '10px',
                          borderRadius: '12px',
                          border: '1px solid var(--gray-3)',
                          fontFamily: 'inherit',
                          fontSize: '14px',
                          background: 'var(--bg-primary)'
                        }}
                      >
                        {field.options?.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type}
                        name={field.name}
                        value={newProject[field.name as keyof typeof newProject]}
                        onChange={(e) => setNewProject(prev => ({ ...prev, [field.name]: e.target.value }))}
                        placeholder={field.placeholder}
                        min={field.min}
                        max={field.max}
                        style={{
                          flex: 1,
                          padding: '10px',
                          borderRadius: '12px',
                          border: '1px solid var(--gray-3)',
                          fontFamily: 'inherit',
                          fontSize: '14px',
                          background: 'var(--bg-primary)'
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button
                  onClick={addProject}
                  style={{
                    background: 'var(--primary)',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '10px',
                    fontSize: '15px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Add Project
                </button>
              </div>
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
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }} onClick={closeProjectNameModal}>
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
              <div style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.024em' }}>
                Edit Project Name
              </div>
              <button
                onClick={closeProjectNameModal}
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
                Cancel
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ width: '100px', fontWeight: 600 }}>Name:</div>
                <input
                  type="text"
                  value={projectNameModal.name}
                  onChange={e => setProjectNameModal({ ...projectNameModal, name: e.target.value })}
                  placeholder="Project name"
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '12px',
                    border: '1px solid var(--gray-3)',
                    fontFamily: 'inherit',
                    fontSize: '14px',
                    background: 'var(--bg-primary)'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button
                  onClick={saveProjectName}
                  style={{
                    background: 'var(--primary)',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '10px',
                    fontSize: '15px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      {isAlertOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
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
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            padding: '24px'
          }}>
            <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Attention</div>
            <div style={{ marginBottom: '20px' }}>{alertMessage}</div>
            <button
              onClick={() => setIsAlertOpen(false)}
              style={{
                background: 'var(--primary)',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              OK
            </button>
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
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.2)',
            maxWidth: '400px'
          }}>
            <div style={{ fontWeight: 700, marginBottom: '8px' }}>Are you sure?</div>
            <div style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>Add this comment to the project?</div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                onClick={() => setConfirmAddOpen(false)}
                style={{
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: 600,
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
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Ok
              </button>
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
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.2)',
            maxWidth: '400px'
          }}>
            <div style={{ fontWeight: 700, marginBottom: '8px' }}>Ignore comment?</div>
            <div style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>Are you sure you want to ignore this comment?</div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                onClick={() => setConfirmIgnore(null)}
                style={{
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                No
              </button>
              <button
                onClick={doIgnore}
                style={{
                  background: 'var(--primary)',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectStatusDashboard;