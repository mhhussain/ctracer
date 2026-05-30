export function fmtDate2(iso) {
  try { return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" }); }
  catch { return iso; }
}

export default function LeaderboardView({ board, you, yourBest, onOpenPost, onUnpost }) {
  const yourRank = yourBest != null
    ? board.filter((e) => e.score > yourBest).length + 1
    : null;

  return (
    <div className="pe-leaderboard">
      {/* opt-in / status banner */}
      {yourBest == null ? (
        <div className="card pe-lb-banner">
          <div>
            <div className="pe-lb-banner-title">No timed score yet</div>
            <div className="pe-lb-banner-sub">Finish a timed exam to earn a leaderboard-eligible score, then choose whether to post it.</div>
          </div>
        </div>
      ) : !you ? (
        <div className="card pe-lb-banner is-cta">
          <div>
            <div className="pe-lb-banner-title">You're not on the board — yet</div>
            <div className="pe-lb-banner-sub">
              Your best timed score is <strong>{yourBest}%</strong>. That would rank <strong>#{yourRank}</strong> right now.
              Posting is opt-in; pick a handle or stay anonymous.
            </div>
          </div>
          <button className="primary-btn" onClick={onOpenPost}>Post my score →</button>
        </div>
      ) : (
        <div className="card pe-lb-banner is-posted">
          <div>
            <div className="pe-lb-banner-title">You're on the board as {you.anon ? "Anonymous" : you.handle}</div>
            <div className="pe-lb-banner-sub">Best timed score <strong>{you.score}%</strong> · posted {fmtDate2(you.date)}.</div>
          </div>
          <div className="pe-lb-banner-actions">
            <button className="ghost-btn-sm" onClick={onOpenPost}>Edit</button>
            <button className="ghost-btn-sm" onClick={onUnpost}>Remove</button>
          </div>
        </div>
      )}

      <div className="card pe-lb-table">
        <div className="card-head">
          <h3>Global leaderboard</h3>
          <span className="muted-xs">Best timed score per user</span>
        </div>
        {board.length === 0 ? (
          <div className="pe-empty pe-empty-sm"><div className="pe-empty-title">Empty board</div><div className="pe-empty-sub">Be the first to post a timed score.</div></div>
        ) : (
          <div className="pe-lb-rows">
            {board.map((e, i) => (
              <div key={i} className={`pe-lb-row ${e.isYou ? "is-you" : ""}`}>
                <span className={`pe-lb-rank ${i < 3 ? `top-${i + 1}` : ""}`}>{i + 1}</span>
                <span className="pe-lb-handle">
                  {e.anon ? <span className="pe-lb-anon">Anonymous</span> : e.handle}
                  {e.isYou ? <span className="pe-lb-you">YOU</span> : null}
                </span>
                <span className="pe-lb-score">{e.score}%</span>
                <span className="pe-lb-date">{fmtDate2(e.date)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
