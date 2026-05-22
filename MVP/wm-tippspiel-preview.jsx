import { useState, useEffect } from "react";

/* ─────────────────────────────────────────────
   GLOBAL STYLES
───────────────────────────────────────────── */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --gold:    #C9A84C;
    --gold-lt: #E8C97A;
    --gold-dk: #7A5C1E;
    --dark:    #0B0D18;
    --d2:      #12152A;
    --d3:      #1A1F38;
    --d4:      #252C4A;
    --d5:      #2E3660;
    --border:  rgba(201,168,76,0.18);
    --green:   #22C55E;
    --red:     #EF4444;
    --yellow:  #EAB308;
    --muted:   #6B7299;
    --text:    #E8E4D9;
  }

  body { font-family:'DM Sans',sans-serif; background:var(--dark); color:var(--text); -webkit-font-smoothing:antialiased; }

  .app { min-height:100vh; background:var(--dark); }
  .app::before { content:''; position:fixed; top:-300px; left:-200px; width:700px; height:700px; background:radial-gradient(ellipse,rgba(201,168,76,0.06) 0%,transparent 65%); pointer-events:none; z-index:0; }

  /* ── NAV ── */
  nav { position:sticky; top:0; z-index:200; background:rgba(11,13,24,0.94); backdrop-filter:blur(20px); border-bottom:1px solid var(--border); height:56px; display:flex; align-items:center; padding:0 20px; gap:0; }
  .nav-logo { font-family:'Bebas Neue',sans-serif; font-size:1.45rem; letter-spacing:0.1em; color:var(--gold); margin-right:28px; flex-shrink:0; }
  .nav-logo span { color:var(--text); }
  .nav-links { display:flex; gap:2px; flex:1; }
  .nl { background:none; border:none; cursor:pointer; color:var(--muted); font-family:'DM Sans',sans-serif; font-size:0.84rem; font-weight:500; padding:5px 12px; border-radius:6px; transition:all 0.15s; }
  .nl:hover { color:var(--text); background:var(--d3); }
  .nl.on { color:var(--gold); background:var(--d3); }
  .nav-right { display:flex; align-items:center; gap:10px; flex-shrink:0; }
  .avatar { width:30px; height:30px; border-radius:50%; background:linear-gradient(135deg,#2a3060,#3d4880); border:1px solid var(--border); display:flex; align-items:center; justify-content:center; font-size:0.68rem; font-weight:600; color:var(--gold-lt); }
  .nav-name { font-size:0.8rem; color:var(--muted); }

  /* ── LAYOUT ── */
  .wrap { max-width:960px; margin:0 auto; padding:28px 16px; position:relative; z-index:1; }
  .ph { display:flex; align-items:flex-end; justify-content:space-between; margin-bottom:26px; }
  .ptitle { font-family:'Bebas Neue',sans-serif; font-size:2.1rem; letter-spacing:0.08em; color:var(--text); line-height:1; }
  .ptitle span { color:var(--gold); }
  .prog-lbl { font-size:0.72rem; color:var(--muted); margin-bottom:4px; text-align:right; }
  .prog-bar { width:130px; height:4px; background:var(--d3); border-radius:99px; overflow:hidden; }
  .prog-fill { height:100%; background:linear-gradient(90deg,var(--gold-dk),var(--gold)); border-radius:99px; width:62.5%; }

  /* ── TABS ── */
  .tabs { display:flex; gap:0; border-bottom:1px solid var(--border); margin-bottom:24px; }
  .tab { background:none; border:none; border-bottom:2px solid transparent; cursor:pointer; color:var(--muted); font-family:'DM Sans',sans-serif; font-size:0.85rem; font-weight:500; padding:8px 16px; margin-bottom:-1px; transition:all 0.15s; }
  .tab:hover { color:var(--text); }
  .tab.on { color:var(--gold); border-bottom-color:var(--gold); }

  /* ── SECTION LABEL ── */
  .slbl { font-size:0.68rem; letter-spacing:0.12em; text-transform:uppercase; color:var(--muted); margin-bottom:8px; }
  .mlist { display:flex; flex-direction:column; gap:6px; margin-bottom:26px; }

  /* ══════════════════════════════════════════
     MATCH CARD – STATE A: COMPACT / READ-ONLY
  ══════════════════════════════════════════ */
  .card {
    background: var(--d2);
    border: 1px solid var(--border);
    border-radius: 10px;
    overflow: hidden;
    transition: border-color 0.2s, transform 0.15s, box-shadow 0.2s;
    cursor: pointer;
    position: relative;
  }
  .card:hover { border-color:rgba(201,168,76,0.4); transform:translateY(-1px); box-shadow:0 4px 24px rgba(0,0,0,0.3); }
  .card.finished { border-left:2px solid rgba(34,197,94,0.45); }
  .card.pending-late { border-left:2px solid rgba(234,179,8,0.45); }
  .card.no-tip:not(.finished) { border-left:2px solid rgba(239,68,68,0.35); }

  .card-inner { padding:12px 16px; }

  /* meta row */
  .cmeta { display:flex; align-items:center; gap:6px; margin-bottom:8px; flex-wrap:wrap; }
  .pill { font-size:0.62rem; letter-spacing:0.07em; text-transform:uppercase; border-radius:4px; padding:2px 6px; }
  .p-day { background:var(--d4); color:var(--gold); }
  .p-grp { background:var(--d4); color:var(--muted); }
  .cmeta-date { font-size:0.74rem; color:var(--muted); }
  .cmeta-urgent { font-size:0.7rem; color:var(--red); font-weight:600; animation:pulse 1.4s infinite; }
  .cmeta-soon   { font-size:0.7rem; color:var(--yellow); }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }

  /* teams row */
  .crow { display:grid; grid-template-columns:1fr auto 1fr; align-items:center; gap:8px; }
  .ct-home { display:flex; align-items:center; gap:7px; }
  .ct-away { display:flex; align-items:center; gap:7px; justify-content:flex-end; }
  .cflag { font-size:1.25rem; }
  .cname { font-size:0.92rem; font-weight:600; }
  .cscore-wrap { text-align:center; flex-shrink:0; }
  .cscore { font-family:'Bebas Neue',sans-serif; font-size:1.5rem; letter-spacing:0.06em; color:var(--gold); line-height:1; }
  .cscore.pending { color:var(--muted); font-size:1.1rem; letter-spacing:0.12em; }

  /* bottom strip */
  .cstrip {
    display:flex; align-items:center; justify-content:space-between;
    background:var(--d3); border-top:1px solid rgba(255,255,255,0.04);
    padding:7px 16px; gap:8px;
  }
  .cstrip-tip { display:flex; align-items:center; gap:6px; }
  .cstrip-lbl { font-size:0.7rem; color:var(--muted); }
  .cstrip-val { font-size:0.88rem; font-weight:700; }
  .cstrip-pts { font-size:0.68rem; border-radius:4px; padding:2px 6px; font-weight:500; }
  .pts-3 { background:rgba(34,197,94,0.15); color:var(--green); }
  .pts-2 { background:rgba(201,168,76,0.15); color:var(--gold); }
  .pts-1 { background:rgba(234,179,8,0.15); color:var(--yellow); }
  .pts-0 { background:rgba(239,68,68,0.1); color:#f87171; }

  .cstrip-action {
    font-size:0.72rem; font-weight:600; letter-spacing:0.04em;
    padding:4px 10px; border-radius:6px; flex-shrink:0;
    border:1px solid; cursor:pointer; background:none; font-family:'DM Sans',sans-serif;
    transition:background 0.15s;
  }
  .cstrip-action.tip    { color:var(--gold); border-color:rgba(201,168,76,0.4); }
  .cstrip-action.tip:hover { background:rgba(201,168,76,0.1); }
  .cstrip-action.edit   { color:var(--muted); border-color:rgba(255,255,255,0.1); }
  .cstrip-action.edit:hover { background:rgba(255,255,255,0.05); }
  .cstrip-action.late   { color:var(--yellow); border-color:rgba(234,179,8,0.35); }
  .cstrip-action.late:hover { background:rgba(234,179,8,0.08); }

  .no-tip-badge { font-size:0.7rem; color:#f87171; font-style:italic; }
  .late-badge { font-size:0.7rem; color:var(--yellow); display:flex; align-items:center; gap:4px; }

  /* ══════════════════════════════════════════
     TIP MODAL / EXPANDED STATE
  ══════════════════════════════════════════ */
  .modal-overlay {
    position: fixed; inset: 0; z-index: 500;
    background: rgba(5,6,14,0.7);
    backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center;
    padding: 20px;
    animation: fadeOverlay 0.2s ease;
  }
  @keyframes fadeOverlay { from{opacity:0} to{opacity:1} }

  .modal {
    background: var(--d2);
    border: 1px solid rgba(201,168,76,0.35);
    border-radius: 16px;
    width: 100%;
    max-width: 480px;
    box-shadow: 0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(201,168,76,0.08);
    overflow: hidden;
    animation: slideUp 0.22s cubic-bezier(0.34,1.3,0.64,1);
  }
  @keyframes slideUp { from{opacity:0;transform:translateY(24px) scale(0.97)} to{opacity:1;transform:none} }

  @media (max-width: 600px) {
    .modal-overlay { padding: 0; align-items: flex-end; }
    .modal { max-width: 100%; border-radius: 20px 20px 0 0; border-bottom:none; }
  }

  .modal-header {
    padding: 16px 20px 14px;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    display: flex; align-items: center; justify-content: space-between;
  }
  .modal-meta { display:flex; align-items:center; gap:6px; }
  .modal-close {
    background: var(--d4); border: 1px solid rgba(255,255,255,0.08);
    border-radius: 6px; color: var(--muted); cursor: pointer;
    font-size: 1rem; width: 30px; height: 30px;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.15s; flex-shrink:0;
  }
  .modal-close:hover { background:var(--d5); color:var(--text); }

  .modal-teams {
    padding: 20px 20px 16px;
    display: grid; grid-template-columns: 1fr auto 1fr;
    align-items: center; gap: 12px;
    border-bottom: 1px solid rgba(255,255,255,0.05);
  }
  .mt-home { display:flex; flex-direction:column; align-items:flex-start; gap:4px; }
  .mt-away { display:flex; flex-direction:column; align-items:flex-end; gap:4px; }
  .mt-flag { font-size:2rem; }
  .mt-name { font-size:1rem; font-weight:600; }
  .mt-result-wrap { text-align:center; }
  .mt-result { font-family:'Bebas Neue',sans-serif; font-size:1.8rem; letter-spacing:0.08em; color:var(--gold); line-height:1; }
  .mt-vs { font-size:0.8rem; color:var(--muted); }

  /* Late warning banner */
  .late-warning {
    margin: 0 20px 0; padding: 8px 12px;
    background: rgba(234,179,8,0.07); border:1px solid rgba(234,179,8,0.25);
    border-radius: 8px; display:flex; align-items:center; gap:8px;
    font-size:0.78rem; color:var(--yellow);
  }
  .late-warning-icon { font-size:1rem; flex-shrink:0; }

  /* Stepper area */
  .modal-tipping {
    padding: 24px 20px 20px;
    display: flex; flex-direction:column; gap:20px;
  }
  .tipping-label { font-size:0.75rem; color:var(--muted); letter-spacing:0.06em; text-transform:uppercase; text-align:center; }

  .steppers-row {
    display: flex; align-items: center; justify-content: center; gap:16px;
  }
  .stepper-group { display:flex; flex-direction:column; align-items:center; gap:8px; }
  .stepper-team-lbl { font-size:0.72rem; color:var(--muted); }

  /* THE STEPPER */
  .stepper {
    display: flex; flex-direction: column; align-items: center; gap: 0;
    user-select: none;
  }
  .step-btn {
    width: 56px; height: 52px;
    background: var(--d4);
    border: 1px solid rgba(255,255,255,0.12);
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: background 0.12s;
    -webkit-tap-highlight-color: transparent;
    position: relative;
  }
  .step-btn.top { border-radius: 10px 10px 0 0; border-bottom: none; }
  .step-btn.bot { border-radius: 0 0 10px 10px; border-top: 1px solid rgba(255,255,255,0.06); }
  .step-btn:hover  { background: var(--d5); }
  .step-btn:active { background: rgba(201,168,76,0.22); }
  .step-btn:disabled { opacity:0.2; cursor:default; }
  .step-btn:disabled:hover { background:var(--d4); }

  /* Crisp + / − using text */
  .step-btn .icon {
    font-size: 28px; font-weight: 200; line-height: 1;
    color: #fff; pointer-events: none;
    transition: color 0.12s;
  }
  .step-btn:hover .icon  { color: var(--gold-lt); }
  .step-btn:active .icon { color: var(--gold); }
  .step-btn:disabled .icon { color: #fff; }

  .step-number {
    width: 56px; height: 64px;
    background: var(--d3);
    border-left: 1px solid rgba(255,255,255,0.12);
    border-right: 1px solid rgba(255,255,255,0.12);
    display: flex; align-items: center; justify-content: center;
  }
  .step-num-val {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 2.6rem; letter-spacing: 0.04em;
    color: var(--text); line-height: 1;
    transition: color 0.15s;
  }
  .step-num-val.zero { color: var(--muted); }

  .step-colon {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 2.4rem; color: var(--muted);
    padding-bottom: 4px; flex-shrink: 0;
    align-self: center;
    margin-top: 4px;
  }

  @media (max-width: 600px) {
    .step-btn { width: 64px; height: 56px; }
    .step-btn .icon { font-size: 32px; }
    .step-number { width: 64px; height: 72px; }
    .step-num-val { font-size: 3rem; }
    .step-colon { font-size: 2.8rem; }
    .steppers-row { gap: 20px; }
  }

  /* Submit button */
  .submit-btn {
    width: 100%; padding: 14px;
    background: linear-gradient(135deg, var(--gold-dk), var(--gold));
    border: none; border-radius: 10px;
    color: var(--dark); font-family: 'DM Sans', sans-serif;
    font-size: 1rem; font-weight: 700; letter-spacing: 0.04em;
    cursor: pointer; transition: opacity 0.15s, transform 0.1s;
  }
  .submit-btn:hover { opacity: 0.88; transform: translateY(-1px); }
  .submit-btn:active { transform: translateY(0); }
  .submit-btn.late-submit {
    background: linear-gradient(135deg, #7a6000, var(--yellow));
    color: #1a1400;
  }
  .submit-btn.done {
    background: rgba(34,197,94,0.15);
    color: var(--green); border: 1px solid rgba(34,197,94,0.35);
  }

  /* others tips in modal */
  .modal-others { padding:0 20px 20px; }
  .modal-others-lbl { font-size:0.68rem; letter-spacing:0.1em; text-transform:uppercase; color:var(--muted); margin-bottom:8px; display:block; }
  .others-grid { display:flex; flex-wrap:wrap; gap:5px; }
  .other-chip { background:var(--d3); border:1px solid rgba(255,255,255,0.06); border-radius:6px; display:flex; align-items:center; gap:6px; font-size:0.78rem; padding:4px 9px; }
  .oc-who { color:var(--muted); }
  .oc-score { font-weight:700; }
  .oc-pts { font-size:0.66rem; border-radius:3px; padding:1px 5px; }

  /* ── RANGLISTE ── */
  .table-wrap { background:var(--d2); border:1px solid var(--border); border-radius:12px; overflow:hidden; }
  table { border-collapse:collapse; width:100%; }
  th { background:var(--d3); border-bottom:1px solid var(--border); color:var(--muted); font-size:0.68rem; font-weight:500; letter-spacing:0.09em; padding:10px 14px; text-align:left; text-transform:uppercase; }
  th.c { text-align:center; }
  tr { border-bottom:1px solid rgba(255,255,255,0.03); transition:background 0.12s; }
  tr:last-child { border-bottom:none; }
  tr:hover { background:var(--d3); }
  tr.me { background:rgba(201,168,76,0.07); }
  tr.me:hover { background:rgba(201,168,76,0.11); }
  td { padding:11px 14px; vertical-align:middle; }
  td.c { text-align:center; }
  .t-rank { font-size:1rem; }
  .t-name { font-size:0.9rem; font-weight:600; }
  .t-you { color:var(--gold); font-size:0.76rem; font-weight:400; }
  .t-pts { background:linear-gradient(135deg,#6B4A10,var(--gold)); border-radius:6px; color:var(--dark); display:inline-block; font-size:0.92rem; font-weight:700; min-width:36px; padding:2px 10px; text-align:center; }
  .t-g { color:var(--green); font-weight:600; font-size:0.85rem; }
  .t-s { color:var(--muted); font-size:0.85rem; }

  /* ── ADMIN ── */
  .asec { background:var(--d2); border:1px solid var(--border); border-radius:12px; padding:18px; margin-bottom:18px; }
  .asec-title { font-size:0.68rem; letter-spacing:0.11em; text-transform:uppercase; color:var(--muted); margin-bottom:14px; display:flex; align-items:center; gap:8px; }
  .nbadge { background:var(--gold); border-radius:99px; color:var(--dark); font-size:0.62rem; font-weight:700; padding:1px 6px; }
  .lrrow { background:rgba(234,179,8,0.05); border:1px solid rgba(234,179,8,0.2); border-radius:8px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px; padding:11px 13px; margin-bottom:7px; }
  .lr-who { font-size:0.88rem; font-weight:600; }
  .lr-match { font-size:0.78rem; color:var(--muted); }
  .lr-tip { color:var(--yellow); font-weight:700; }
  .lr-time { font-size:0.7rem; color:var(--muted); }
  .lr-btns { display:flex; gap:6px; }
  .btn-ok { background:rgba(34,197,94,0.12); border:1px solid rgba(34,197,94,0.35); border-radius:6px; color:var(--green); cursor:pointer; font-size:0.78rem; font-family:'DM Sans',sans-serif; padding:5px 11px; transition:background 0.15s; }
  .btn-ok:hover { background:rgba(34,197,94,0.22); }
  .btn-no { background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.3); border-radius:6px; color:#f87171; cursor:pointer; font-size:0.78rem; font-family:'DM Sans',sans-serif; padding:5px 11px; transition:background 0.15s; }
  .btn-no:hover { background:rgba(239,68,68,0.16); }

  .arow { background:var(--d3); border:1px solid rgba(255,255,255,0.04); border-radius:8px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px; padding:10px 14px; margin-bottom:7px; }
  .arow.done { border-left:2px solid rgba(34,197,94,0.5); }
  .arow-match { font-size:0.88rem; }
  .arow-entry { display:flex; align-items:center; gap:8px; }
  .arow-colon { color:var(--muted); font-size:1rem; }
  .arow-save { background:var(--d4); border:1px solid var(--border); border-radius:6px; color:var(--gold); cursor:pointer; font-family:'DM Sans',sans-serif; font-size:0.78rem; padding:5px 11px; height:36px; transition:background 0.15s; }
  .arow-save:hover { background:var(--d5); }
  .arow-done { color:var(--green); font-size:0.78rem; }

  /* Admin mini-stepper (horizontal) */
  .mini-stepper { display:flex; align-items:center; background:var(--d3); border:1px solid rgba(255,255,255,0.1); border-radius:8px; overflow:hidden; height:36px; }
  .ms-btn { background:var(--d4); border:none; cursor:pointer; width:36px; height:36px; display:flex; align-items:center; justify-content:center; transition:background 0.12s; -webkit-tap-highlight-color:transparent; }
  .ms-btn .icon { font-size:20px; font-weight:200; color:#fff; pointer-events:none; transition:color 0.12s; line-height:1; }
  .ms-btn:hover { background:var(--d5); }
  .ms-btn:hover .icon { color:var(--gold-lt); }
  .ms-btn:active { background:rgba(201,168,76,0.2); }
  .ms-btn:disabled { opacity:0.2; cursor:default; }
  .ms-btn.l { border-right:1px solid rgba(255,255,255,0.08); }
  .ms-btn.r { border-left:1px solid rgba(255,255,255,0.08); }
  .ms-val { font-size:1rem; font-weight:700; min-width:30px; text-align:center; color:var(--text); }

  /* ── LOGIN ── */
  .login-page { min-height:100vh; display:flex; align-items:center; justify-content:center; background:radial-gradient(ellipse at 30% 20%,rgba(201,168,76,0.07) 0%,transparent 55%),var(--dark); padding:20px; }
  .login-card { background:var(--d2); border:1px solid var(--border); border-radius:16px; padding:40px 28px; width:100%; max-width:350px; box-shadow:0 0 80px rgba(201,168,76,0.08); text-align:center; }
  .login-icon { font-size:3rem; margin-bottom:8px; filter:drop-shadow(0 0 16px rgba(201,168,76,0.5)); }
  .login-title { font-family:'Bebas Neue',sans-serif; font-size:1.9rem; letter-spacing:0.1em; color:var(--gold); margin-bottom:3px; }
  .login-sub { font-size:0.8rem; color:var(--muted); margin-bottom:26px; }
  .ff { text-align:left; margin-bottom:13px; }
  .fl { display:block; font-size:0.65rem; letter-spacing:0.1em; text-transform:uppercase; color:var(--muted); margin-bottom:4px; }
  .fi { width:100%; background:var(--d3); border:1px solid var(--border); border-radius:8px; color:var(--text); font-family:'DM Sans',sans-serif; font-size:0.93rem; padding:10px 12px; outline:none; transition:border-color 0.2s; }
  .fi:focus { border-color:var(--gold); }
  .login-btn { width:100%; margin-top:10px; background:linear-gradient(135deg,var(--gold-dk),var(--gold)); border:none; border-radius:8px; color:var(--dark); cursor:pointer; font-family:'DM Sans',sans-serif; font-size:0.95rem; font-weight:700; padding:13px; transition:opacity 0.2s,transform 0.1s; letter-spacing:0.04em; }
  .login-btn:hover { opacity:0.87; transform:translateY(-1px); }

  /* ── PAGE SWITCHER (demo only) ── */
  .switcher { display:flex; justify-content:center; gap:6px; padding:14px; border-top:1px solid var(--border); position:relative; z-index:1; }
  .sw { background:var(--d3); border:1px solid var(--border); border-radius:6px; color:var(--muted); cursor:pointer; font-family:'DM Sans',sans-serif; font-size:0.75rem; padding:5px 13px; transition:all 0.15s; }
  .sw:hover,.sw.on { background:var(--d4); color:var(--gold); border-color:rgba(201,168,76,0.4); }

  @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
  .fade { animation:fadeIn 0.25s ease forwards; }
`;

/* ─────────────────────────────────────────────
   STEPPER COMPONENT (vertical – for modal)
───────────────────────────────────────────── */
function Stepper({ value, onChange, isLate }) {
  return (
    <div className="stepper">
      <button
        className="step-btn top"
        onClick={() => onChange(Math.min(20, value + 1))}
      >
        <span className="icon">+</span>
      </button>
      <div className="step-number">
        <span className={`step-num-val${value === 0 ? " zero" : ""}`}>{value}</span>
      </div>
      <button
        className="step-btn bot"
        onClick={() => onChange(Math.max(0, value - 1))}
        disabled={value === 0}
      >
        <span className="icon">−</span>
      </button>
    </div>
  );
}

/* Mini horizontal stepper for admin */
function MiniStepper({ value, onChange }) {
  return (
    <div className="mini-stepper">
      <button className="ms-btn l" onClick={() => onChange(Math.max(0, value - 1))} disabled={value === 0}>
        <span className="icon">−</span>
      </button>
      <span className="ms-val">{value}</span>
      <button className="ms-btn r" onClick={() => onChange(Math.min(20, value + 1))}>
        <span className="icon">+</span>
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────
   TIP MODAL
───────────────────────────────────────────── */
const PTS_CLS = { 3:"pts-3", 2:"pts-2", 1:"pts-1", 0:"pts-0" };
const PTS_LBL = { 3:"✅ Treffer", 2:"〰 Differenz", 1:"↗ Tendenz", 0:"✗ Daneben" };

function TipModal({ m, onClose }) {
  const [h, setH] = useState(m.myTip?.h ?? 0);
  const [a, setA] = useState(m.myTip?.a ?? 0);
  const [done, setDone] = useState(false);

  // close on overlay click
  function overlayClick(e) { if (e.target === e.currentTarget) onClose(); }

  // close on Escape
  useEffect(() => {
    const fn = e => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, []);

  function submit() { setDone(true); setTimeout(onClose, 1400); }

  return (
    <div className="modal-overlay" onClick={overlayClick}>
      <div className="modal">

        {/* Header */}
        <div className="modal-header">
          <div className="modal-meta">
            <span className="pill p-day">Spieltag {m.matchday}</span>
            {m.group && <span className="pill p-grp">Gruppe {m.group}</span>}
            <span style={{fontSize:"0.76rem",color:"var(--muted)"}}>{m.date}</span>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Teams + result */}
        <div className="modal-teams">
          <div className="mt-home">
            <span className="mt-flag">{m.homeFlag}</span>
            <span className="mt-name">{m.home}</span>
          </div>
          <div className="mt-result-wrap">
            {m.finished
              ? <span className="mt-result">{m.result.h} : {m.result.a}</span>
              : <span className="mt-vs">–:–</span>}
          </div>
          <div className="mt-away">
            <span className="mt-flag">{m.awayFlag}</span>
            <span className="mt-name">{m.away}</span>
          </div>
        </div>

        {/* Late warning */}
        {m.urgent && (
          <div style={{padding:"12px 20px 0"}}>
            <div className="late-warning">
              <span className="late-warning-icon">⚠️</span>
              Deadline abgelaufen — Admin muss diesen Tipp bestätigen
            </div>
          </div>
        )}

        {/* Steppers */}
        <div className="modal-tipping">
          <div className="tipping-label">Dein Tipp</div>
          <div className="steppers-row">
            <div className="stepper-group">
              <span className="stepper-team-lbl">{m.home}</span>
              <Stepper value={h} onChange={setH} isLate={m.urgent} />
            </div>
            <span className="step-colon">:</span>
            <div className="stepper-group">
              <span className="stepper-team-lbl">{m.away}</span>
              <Stepper value={a} onChange={setA} isLate={m.urgent} />
            </div>
          </div>

          <button
            className={`submit-btn${m.urgent ? " late-submit" : ""}${done ? " done" : ""}`}
            onClick={submit}
            disabled={done}
          >
            {done
              ? "✓ Gespeichert!"
              : m.urgent
              ? "Anfrage senden"
              : m.myTip ? "Tipp aktualisieren" : "Tipp speichern"}
          </button>
        </div>

        {/* Other tips (after deadline) */}
        {m.tipsVisible && m.others?.length > 0 && (
          <div className="modal-others">
            <span className="modal-others-lbl">Alle Tipps</span>
            <div className="others-grid">
              {m.others.map((o, i) => (
                <div key={i} className="other-chip">
                  <span className="oc-who">{o.name}</span>
                  <span className="oc-score">{o.h}:{o.a}</span>
                  {m.finished && <span className={`oc-pts ${PTS_CLS[o.pts]}`}>{o.pts}P</span>}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MATCH CARD – compact state
───────────────────────────────────────────── */
function MatchCard({ m }) {
  const [modalOpen, setModalOpen] = useState(false);
  const hasTip      = !!m.myTip && !m.lateStatus;
  const latePending = m.lateStatus === "pending";
  const noTip       = !m.myTip && !m.urgent;
  const canTip      = !m.finished && (!m.myTip || m.urgent);

  let cardClass = "card";
  if (m.finished)    cardClass += " finished";
  if (latePending)   cardClass += " pending-late";
  if (noTip && !m.finished) cardClass += " no-tip";

  return (
    <>
      <div className={cardClass} onClick={() => setModalOpen(true)}>
        <div className="card-inner">
          {/* Meta */}
          <div className="cmeta">
            <span className="pill p-day">Spieltag {m.matchday}</span>
            {m.group && <span className="pill p-grp">Gruppe {m.group}</span>}
            <span className="cmeta-date">{m.date}</span>
            {m.urgent    && <span className="cmeta-urgent">⏱ Deadline in 38 Min!</span>}
            {m.countdown && <span className="cmeta-soon">⏱ {m.countdown}</span>}
          </div>

          {/* Teams */}
          <div className="crow">
            <div className="ct-home">
              <span className="cflag">{m.homeFlag}</span>
              <span className="cname">{m.home}</span>
            </div>
            <div className="cscore-wrap">
              {m.finished
                ? <span className="cscore">{m.result.h}:{m.result.a}</span>
                : <span className="cscore pending">–:–</span>}
            </div>
            <div className="ct-away">
              <span className="cname">{m.away}</span>
              <span className="cflag">{m.awayFlag}</span>
            </div>
          </div>
        </div>

        {/* Bottom strip */}
        <div className="cstrip">
          <div className="cstrip-tip">
            <span className="cstrip-lbl">Dein Tipp:</span>
            {hasTip && (
              <>
                <span className="cstrip-val">{m.myTip.h} : {m.myTip.a}</span>
                {m.finished && (
                  <span className={`cstrip-pts ${PTS_CLS[m.points]}`}>
                    {PTS_LBL[m.points]} · {m.points} Pkt
                  </span>
                )}
              </>
            )}
            {latePending && (
              <span className="late-badge">⏳ {m.myTip.h}:{m.myTip.a} <span style={{color:"var(--muted)",fontWeight:400}}>– wartet auf Admin</span></span>
            )}
            {noTip && !m.finished && <span className="no-tip-badge">Noch kein Tipp</span>}
            {noTip && m.finished  && <span className="no-tip-badge">Kein Tipp abgegeben</span>}
          </div>

          {!m.finished && !latePending && (
            <button
              className={`cstrip-action ${m.urgent ? "late" : hasTip ? "edit" : "tip"}`}
              onClick={e => { e.stopPropagation(); setModalOpen(true); }}
            >
              {m.urgent ? "⚠ Verspätet tippen" : hasTip ? "Ändern" : "Jetzt tippen →"}
            </button>
          )}
        </div>
      </div>

      {modalOpen && <TipModal m={m} onClose={() => setModalOpen(false)} />}
    </>
  );
}

/* ─────────────────────────────────────────────
   ADMIN ROW
───────────────────────────────────────────── */
function AdminRow({ match }) {
  const [rH, setRH] = useState(match.rH);
  const [rA, setRA] = useState(match.rA);
  const [done, setDone] = useState(match.done);
  return (
    <div className={`arow${done?" done":""}`}>
      <span className="arow-match">{match.home} vs {match.away}</span>
      <div className="arow-entry">
        <MiniStepper value={rH} onChange={setRH} />
        <span className="arow-colon">:</span>
        <MiniStepper value={rA} onChange={setRA} />
        <button className="arow-save" onClick={() => setDone(true)}>{done?"Update":"Speichern"}</button>
        {done && <span className="arow-done">✅ {rH}:{rA}</span>}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   DATA
───────────────────────────────────────────── */
const MATCHES = [
  { id:1, matchday:1, group:"A", home:"Deutschland", homeFlag:"🇩🇪", away:"Schottland", awayFlag:"🏴󠁧󠁢󠁳󠁣󠁴󠁿", date:"Fr 13.06  21:00",
    myTip:{h:3,a:0}, points:3, tipsVisible:true, finished:true, result:{h:5,a:1},
    others:[{name:"Anna",h:2,a:0,pts:2},{name:"Tom",h:3,a:0,pts:3},{name:"Lisa",h:1,a:0,pts:1}] },
  { id:2, matchday:1, group:"A", home:"Ungarn", homeFlag:"🇭🇺", away:"Schweiz", awayFlag:"🇨🇭", date:"Fr 13.06  15:00",
    myTip:{h:1,a:1}, points:3, tipsVisible:true, finished:true, result:{h:1,a:1},
    others:[{name:"Anna",h:0,a:2,pts:0},{name:"Tom",h:1,a:1,pts:3}] },
  { id:3, matchday:2, group:"A", home:"Deutschland", homeFlag:"🇩🇪", away:"Ungarn", awayFlag:"🇭🇺",
    date:"Mi 19.06  18:00", myTip:null, urgent:true, tipsVisible:false, finished:false, result:null },
  { id:4, matchday:2, group:"B", home:"Spanien", homeFlag:"🇪🇸", away:"Kroatien", awayFlag:"🇭🇷",
    date:"Sa 15.06  18:00", myTip:{h:2,a:1}, lateStatus:"pending", tipsVisible:false, finished:false, result:null },
  { id:5, matchday:3, group:"C", home:"Frankreich", homeFlag:"🇫🇷", away:"Polen", awayFlag:"🇵🇱",
    date:"So 25.06  21:00", myTip:null, countdown:"noch 3h 22min", tipsVisible:false, finished:false, result:null },
];
const LEADERBOARD = [
  { name:"Tom Müller",     pts:18, correct:3, diff:2, tendency:4, tipped:9 },
  { name:"Anna Schmidt",   pts:15, correct:2, diff:3, tendency:3, tipped:9, me:true },
  { name:"Max Mustermann", pts:12, correct:2, diff:2, tendency:2, tipped:8 },
  { name:"Lisa Weber",     pts:10, correct:1, diff:2, tendency:3, tipped:7 },
  { name:"Jan Koch",       pts: 8, correct:1, diff:1, tendency:3, tipped:6 },
  { name:"Sara Bauer",     pts: 7, correct:1, diff:1, tendency:2, tipped:6 },
  { name:"Felix Braun",    pts: 4, correct:0, diff:1, tendency:3, tipped:5 },
  { name:"Mia Schulz",     pts: 2, correct:0, diff:0, tendency:2, tipped:4 },
];
const ADMIN_MATCHES = [
  { home:"🇩🇪 Deutschland", away:"Schottland 🏴󠁧󠁢󠁳󠁣󠁴󠁿", done:true,  rH:5, rA:1 },
  { home:"🇪🇸 Spanien",     away:"Kroatien 🇭🇷",          done:false, rH:0, rA:0 },
  { home:"🇫🇷 Frankreich",  away:"Polen 🇵🇱",              done:false, rH:0, rA:0 },
];
const LATE_INIT = [
  { id:1, who:"Felix Braun", match:"🇩🇪 Deutschland vs Ungarn 🇭🇺", tip:"2 : 0", time:"18:47 Uhr" },
  { id:2, who:"Mia Schulz",  match:"🇪🇸 Spanien vs Kroatien 🇭🇷",  tip:"1 : 1", time:"17:55 Uhr" },
];
const MEDALS = ["🥇","🥈","🥉"];
const PAGES  = ["tipps","rangliste","admin","login"];

/* ─────────────────────────────────────────────
   APP
───────────────────────────────────────────── */
export default function App() {
  const [page, setPage] = useState("tipps");
  const [late, setLate] = useState(LATE_INIT);

  return (
    <>
      <style>{css}</style>
      <div className="app">

        {page !== "login" && (
          <nav>
            <div className="nav-logo">🏆 <span>WM</span> TIPP</div>
            <div className="nav-links">
              {["tipps","rangliste","admin"].map(p => (
                <button key={p} className={`nl${page===p?" on":""}`} onClick={() => setPage(p)}>
                  {p==="tipps"?"Tipps":p==="rangliste"?"Rangliste":"Admin"}
                </button>
              ))}
            </div>
            <div className="nav-right">
              <div className="avatar">AS</div>
              <span className="nav-name">Anna S.</span>
            </div>
          </nav>
        )}

        {/* ── TIPPS ── */}
        {page === "tipps" && (
          <div className="wrap fade" key="tipps">
            <div className="ph">
              <div className="ptitle">MEINE <span>TIPPS</span></div>
              <div>
                <div className="prog-lbl">5 / 8 getippt</div>
                <div className="prog-bar"><div className="prog-fill"/></div>
              </div>
            </div>
            <div className="tabs">
              <button className="tab on">Gruppenphase</button>
              <button className="tab">Achtelfinale</button>
              <button className="tab">Viertelfinale</button>
            </div>
            {[1,2,3].map(day => (
              <div key={day}>
                <div className="slbl">{day}. Spieltag</div>
                <div className="mlist">
                  {MATCHES.filter(m=>m.matchday===day).map(m=><MatchCard key={m.id} m={m}/>)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── RANGLISTE ── */}
        {page === "rangliste" && (
          <div className="wrap fade" key="rangliste">
            <div className="ph" style={{marginBottom:22}}>
              <div className="ptitle">🏆 <span>RANGLISTE</span></div>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th><th>Spieler</th>
                    <th className="c">Punkte</th>
                    <th className="c">✅</th>
                    <th className="c">〰</th>
                    <th className="c">↗</th>
                    <th className="c">Tipps</th>
                  </tr>
                </thead>
                <tbody>
                  {LEADERBOARD.map((p,i)=>(
                    <tr key={i} className={p.me?"me":""}>
                      <td><span className="t-rank">{i<3?MEDALS[i]:i+1}</span></td>
                      <td><span className="t-name">{p.name}</span>{p.me&&<span className="t-you"> (Du)</span>}</td>
                      <td className="c"><span className="t-pts">{p.pts}</span></td>
                      <td className="c"><span className="t-g">{p.correct}</span></td>
                      <td className="c"><span className="t-s">{p.diff}</span></td>
                      <td className="c"><span className="t-s">{p.tendency}</span></td>
                      <td className="c"><span className="t-s">{p.tipped}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{display:"flex",gap:14,marginTop:18,flexWrap:"wrap"}}>
              {[["pts-3","3 Pkt","Richtiges Ergebnis"],["pts-2","2 Pkt","Richtige Differenz"],["pts-1","1 Pkt","Richtige Tendenz"]].map(([c,l,d])=>(
                <div key={c} style={{display:"flex",alignItems:"center",gap:6,fontSize:"0.78rem",color:"var(--muted)"}}>
                  <span className={`cstrip-pts ${c}`}>{l}</span>{d}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── ADMIN ── */}
        {page === "admin" && (
          <div className="wrap fade" key="admin">
            <div className="ph" style={{marginBottom:22}}>
              <div className="ptitle">⚙️ <span>ADMIN</span></div>
            </div>
            <div className="asec">
              <div className="asec-title">
                ⏰ Verspätete Anfragen
                {late.length>0&&<span className="nbadge">{late.length}</span>}
              </div>
              {late.length===0
                ? <p style={{color:"var(--muted)",fontSize:"0.83rem",fontStyle:"italic"}}>Keine offenen Anfragen.</p>
                : late.map(r=>(
                  <div key={r.id} className="lrrow">
                    <div>
                      <div className="lr-who">👤 {r.who}</div>
                      <div className="lr-match">{r.match}</div>
                      <div style={{display:"flex",gap:10,marginTop:2,alignItems:"center"}}>
                        <span className="lr-tip">Tipp: {r.tip}</span>
                        <span className="lr-time">{r.time}</span>
                      </div>
                    </div>
                    <div className="lr-btns">
                      <button className="btn-ok" onClick={()=>setLate(x=>x.filter(i=>i.id!==r.id))}>✓ Genehmigen</button>
                      <button className="btn-no" onClick={()=>setLate(x=>x.filter(i=>i.id!==r.id))}>✗ Ablehnen</button>
                    </div>
                  </div>
                ))
              }
            </div>
            <div className="asec">
              <div className="asec-title">Ergebnisse eintragen</div>
              {ADMIN_MATCHES.map((m,i)=><AdminRow key={i} match={m}/>)}
            </div>
          </div>
        )}

        {/* ── LOGIN ── */}
        {page === "login" && (
          <div className="login-page fade" key="login">
            <div className="login-card">
              <div className="login-icon">🏆</div>
              <div className="login-title">WM TIPPSPIEL</div>
              <div className="login-sub">Melde dich an, um zu tippen</div>
              <div className="ff">
                <label className="fl">Benutzername</label>
                <input className="fi" type="text" placeholder="dein_name"/>
              </div>
              <div className="ff">
                <label className="fl">Passwort</label>
                <input className="fi" type="password" placeholder="••••••••"/>
              </div>
              <button className="login-btn" onClick={()=>setPage("tipps")}>Anmelden</button>
            </div>
          </div>
        )}

        <div className="switcher">
          {PAGES.map(p=>(
            <button key={p} className={`sw${page===p?" on":""}`} onClick={()=>setPage(p)}>
              {p==="tipps"?"Tipps":p==="rangliste"?"Rangliste":p==="admin"?"Admin":"Login"}
            </button>
          ))}
        </div>

      </div>
    </>
  );
}
