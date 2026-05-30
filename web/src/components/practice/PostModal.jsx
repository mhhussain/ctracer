// web/src/components/practice/PostModal.jsx
import { useState } from 'react'

export default function PostModal({ score, defaultHandle, defaultAnon, onClose, onPost }) {
  const [handle, setHandle] = useState(defaultHandle || '')
  const [anon, setAnon] = useState(defaultAnon || false)
  return (
    <div className="modal-veil" onClick={onClose}>
      <div className="card modal pe-modal" onClick={(e) => e.stopPropagation()}>
        <div className="pe-modal-head">
          <h2 className="modal-title">Post to leaderboard</h2>
          <button className="x-btn" onClick={onClose}>×</button>
        </div>
        <p className="pe-modal-sub">
          Posting your best timed score (<strong>{score}%</strong>) is opt-in. Choose how you appear — you can remove it anytime.
        </p>
        <label className={`pe-field ${anon ? 'is-disabled' : ''}`}>
          <span className="pe-field-label">Display handle</span>
          <input
            className="pe-input"
            placeholder="your handle"
            value={anon ? '' : handle}
            disabled={anon}
            onChange={(e) => setHandle(e.target.value)}
          />
        </label>
        <label className="pe-toggle">
          <input type="checkbox" checked={anon} onChange={(e) => setAnon(e.target.checked)} />
          <span className="pe-toggle-box" />
          <span>Post as <strong>Anonymous</strong></span>
        </label>
        <div className="pe-modal-foot">
          <button className="ghost-btn" onClick={onClose}>Cancel</button>
          <button className="primary-btn" onClick={() => onPost(handle.trim() || 'you', anon)}>
            {anon ? 'Post anonymously →' : 'Post →'}
          </button>
        </div>
      </div>
    </div>
  )
}
