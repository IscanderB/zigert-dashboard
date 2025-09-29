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