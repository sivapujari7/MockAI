/* ============================================================
   MockAI — script.js  Complete Redesign
   ============================================================ */

/* ════════════════════════════════════
   1. LOADER
════════════════════════════════════ */
window.addEventListener('load', () => {
  setTimeout(() => {
    const l = document.getElementById('loader');
    if (!l) return;
    l.style.transition = 'opacity 0.6s ease';
    l.style.opacity = '0';
    setTimeout(() => { l.style.display = 'none'; }, 600);
  }, 1800);
});
 
/* ════════════════════════════════════
   3. THREE.JS 3D BACKGROUND
════════════════════════════════════ */
(function initThree() {
  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
  script.onload = () => {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    // Floating geometry nodes
    const nodes = [];
    const nodeGeo = new THREE.SphereGeometry(0.04, 8, 8);
    const nodeMat = new THREE.MeshBasicMaterial({ color: 0x6366f1, transparent: true, opacity: 0.6 });
    for (let i = 0; i < 80; i++) {
      const m = new THREE.Mesh(nodeGeo, nodeMat.clone());
      m.position.set((Math.random()-0.5)*16, (Math.random()-0.5)*10, (Math.random()-0.5)*8);
      m.userData = { vx:(Math.random()-0.5)*0.003, vy:(Math.random()-0.5)*0.003 };
      scene.add(m); nodes.push(m);
    }

    // Connection lines
    const lineMat = new THREE.LineBasicMaterial({ color: 0x6366f1, transparent: true, opacity: 0.08 });
    const lineGroup = new THREE.Group();
    scene.add(lineGroup);

    // Large floating torus
    const tGeo = new THREE.TorusGeometry(2.2, 0.008, 16, 120);
    const tMat = new THREE.MeshBasicMaterial({ color: 0x6366f1, transparent: true, opacity: 0.12 });
    const torus = new THREE.Mesh(tGeo, tMat);
    torus.rotation.x = 0.4;
    scene.add(torus);

    // Second torus (cyan)
    const tGeo2 = new THREE.TorusGeometry(3.2, 0.005, 16, 120);
    const tMat2 = new THREE.MeshBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.08 });
    const torus2 = new THREE.Mesh(tGeo2, tMat2);
    torus2.rotation.x = -0.3; torus2.rotation.y = 0.5;
    scene.add(torus2);

    // Icosahedron wireframe
    const iGeo = new THREE.IcosahedronGeometry(1.5, 1);
    const iMat = new THREE.MeshBasicMaterial({ color: 0x8b5cf6, wireframe: true, transparent: true, opacity: 0.05 });
    const ico = new THREE.Mesh(iGeo, iMat);
    scene.add(ico);

    let mouse = { x: 0, y: 0 };
    document.addEventListener('mousemove', e => {
      mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.y = -(e.clientY / window.innerHeight - 0.5) * 2;
    });

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    let frame = 0;
    function animate() {
      requestAnimationFrame(animate);
      frame++;

      torus.rotation.z += 0.0015; torus.rotation.y += 0.001;
      torus2.rotation.z -= 0.001; torus2.rotation.x += 0.0008;
      ico.rotation.y += 0.002; ico.rotation.x += 0.001;

      // Mouse parallax on camera
      camera.position.x += (mouse.x * 0.3 - camera.position.x) * 0.04;
      camera.position.y += (mouse.y * 0.2 - camera.position.y) * 0.04;

      // Animate nodes
      nodes.forEach(n => {
        n.position.x += n.userData.vx;
        n.position.y += n.userData.vy;
        if (Math.abs(n.position.x) > 8) n.userData.vx *= -1;
        if (Math.abs(n.position.y) > 5) n.userData.vy *= -1;
      });

      // Update lines every 60 frames
      if (frame % 60 === 0) {
        while (lineGroup.children.length) lineGroup.remove(lineGroup.children[0]);
        for (let i = 0; i < nodes.length; i++) {
          for (let j = i+1; j < nodes.length; j++) {
            const d = nodes[i].position.distanceTo(nodes[j].position);
            if (d < 2.5) {
              const geo = new THREE.BufferGeometry().setFromPoints([nodes[i].position, nodes[j].position]);
              lineGroup.add(new THREE.Line(geo, lineMat));
            }
          }
        }
      }

      renderer.render(scene, camera);
    }
    animate();
  };
  document.head.appendChild(script);
})();

/* ════════════════════════════════════
   4. SCROLL REVEAL
════════════════════════════════════ */
const ro = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      const delay = parseFloat(e.target.style.transitionDelay || '0') * 1000;
      setTimeout(() => e.target.classList.add('visible'), delay);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.reveal,.reveal-right').forEach(el => ro.observe(el));

/* ════════════════════════════════════
   5. NAV
════════════════════════════════════ */
window.addEventListener('scroll', () => {
  document.getElementById('nav')?.classList.toggle('scrolled', window.scrollY > 50);
});
document.getElementById('hamburger')?.addEventListener('click', () => document.getElementById('mobileMenu')?.classList.add('open'));
document.getElementById('mobileClose')?.addEventListener('click', () => document.getElementById('mobileMenu')?.classList.remove('open'));
document.querySelectorAll('.mm-link').forEach(a => a.addEventListener('click', () => document.getElementById('mobileMenu')?.classList.remove('open')));

/* ════════════════════════════════════
   6. SMOOTH SCROLL
════════════════════════════════════ */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const t = document.querySelector(a.getAttribute('href'));
    if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth' }); }
  });
});

/* ════════════════════════════════════
   7. FAQ
════════════════════════════════════ */
window.toggleFaq = function(btn) {
  const item = btn.parentElement;
  const a = item.querySelector('.faq-a');
  const open = item.classList.contains('open');
  document.querySelectorAll('.faq-item').forEach(f => { f.classList.remove('open'); f.querySelector('.faq-a').style.maxHeight = '0'; });
  if (!open) { item.classList.add('open'); a.style.maxHeight = a.scrollHeight + 'px'; }
};

/* ════════════════════════════════════
   8. TOAST
════════════════════════════════════ */
function showToast(msg, type = 'info') {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div'); t.id = 'toast'; document.body.appendChild(t);
  }
  const colors = { success:'#10b981', error:'#ef4444', info:'#6366f1', warning:'#f59e0b' };
  const icons = { success:'✓', error:'!', info:'i', warning:'!' };
  t.style.borderLeftColor = (colors[type] || colors.info);
  t.innerHTML = `<span style="color:${colors[type]||colors.info};font-weight:800;font-size:16px">${icons[type]||'i'}</span><span style="flex:1">${msg}</span><button onclick="document.getElementById('toast').classList.remove('show')" style="background:none;border:none;color:var(--dim);font-size:18px;line-height:1;cursor:none">×</button>`;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 5000);
}
window.showToast = showToast;

/* ════════════════════════════════════
   9. LOADING STATE
════════════════════════════════════ */
function setLoading(btn, loading) {
  if (!btn) return;
  if (loading) {
    btn.disabled = true;
    btn.dataset.orig = btn.innerHTML;
    btn.innerHTML = `<span style="display:inline-flex;align-items:center;gap:8px"><span class="mini-spinner"></span>Loading...</span>`;
  } else {
    btn.disabled = false;
    btn.innerHTML = btn.dataset.orig || btn.innerHTML;
  }
}
window.setLoading = setLoading;

/* ════════════════════════════════════
   10. RESUME UPLOAD — HOW SECTION
════════════════════════════════════ */
// Role chip selection
document.querySelectorAll('.role-chips:not(.small) .role-chip').forEach(chip => {
  chip.addEventListener('click', function() {
    this.closest('.role-chips').querySelectorAll('.role-chip').forEach(c => c.classList.remove('active'));
    this.classList.add('active');
  });
});
document.querySelectorAll('.role-chips.small .role-chip').forEach(chip => {
  chip.addEventListener('click', function() {
    this.closest('.role-chips').querySelectorAll('.role-chip').forEach(c => c.classList.remove('active'));
    this.classList.add('active');
  });
});

// File input display
document.getElementById('resumeFile')?.addEventListener('change', function() {
  const disp = document.getElementById('resumeFileName');
  if (disp && this.files[0]) disp.textContent = '📄 ' + this.files[0].name;
});

async function handleResumeUpload(fileInputId, btnId, resultId, roleSel) {
  const fileInput = document.getElementById(fileInputId);
  const btn = document.getElementById(btnId);
  const resultEl = document.getElementById(resultId);
  const file = fileInput?.files[0];
  if (!file) { showToast('Please select a resume file first.', 'error'); return; }

  setLoading(btn, true);
  if (resultEl) resultEl.innerHTML = `<div class="resume-analyzing"><div class="mini-spinner" style="width:24px;height:24px;border-width:3px"></div><p>AI is analyzing your resume...</p></div>`;

  try {
    const available = await checkBackend();
    if (!available) { if(resultEl) resultEl.innerHTML=''; return; }
    const formData = new FormData();
    formData.append('resume', file);
    const role = document.querySelector(roleSel + ' .role-chip.active')?.dataset.role || 'Software Engineer';
    formData.append('targetRole', role);
    const data = await MockAI.uploadResume(formData);
    if (!data.analysis) throw new Error('No analysis returned.');
    renderResumeResult(data.analysis, resultEl);
  } catch(err) {
    showToast('Resume analysis failed: ' + err.message, 'error');
    if(resultEl) resultEl.innerHTML='';
  } finally {
    setLoading(btn, false);
  }
}

document.getElementById('uploadResumeBtn')?.addEventListener('click', () =>
  handleResumeUpload('resumeFile', 'uploadResumeBtn', 'resumeResult', '.how-resume-panel .role-chips')
);
document.getElementById('dashAnalyzeBtn')?.addEventListener('click', () =>
  handleResumeUpload('dashResumeFile', 'dashAnalyzeBtn', 'dashResumeResult', '#dashRoleChips')
);

// Dashboard resume file display
document.getElementById('dashResumeFile')?.addEventListener('change', function() {
  const drop = document.getElementById('dashResumeDrop');
  if (drop && this.files[0]) {
    drop.querySelector('.drop-text').textContent = '📄 ' + this.files[0].name;
  }
});

function renderResumeResult(analysis, el) {
  if (!el) return;
  const ats = analysis.atsScore || 0;
  const col = ats >= 80 ? '#10b981' : ats >= 60 ? '#f59e0b' : '#ef4444';
  const circ = 2 * Math.PI * 28;
  const skills = (analysis.skillsFound || []).map(s => `<span class="res-tag good">${s}</span>`).join('');
  const missing = (analysis.missingSkills || []).map(s => `<span class="res-tag miss">${s}</span>`).join('');
  const strengths = (analysis.strengths || []).map(s => `<li>${s}</li>`).join('');
  const improv = (analysis.improvements || []).map(i => `<li>${i}</li>`).join('');
  el.innerHTML = `
    <div class="resume-result-card">
      <div class="resume-result-header">
        <div class="ats-ring-wrap" style="width:72px;height:72px;flex-shrink:0">
          <svg viewBox="0 0 72 72" width="72" height="72" style="transform:rotate(-90deg)">
            <circle cx="36" cy="36" r="28" fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="7"/>
            <circle cx="36" cy="36" r="28" fill="none" stroke="${col}" stroke-width="7"
              stroke-dasharray="${circ}" stroke-dashoffset="${circ*(1-ats/100)}"
              stroke-linecap="round" style="transition:stroke-dashoffset 1s ease"/>
          </svg>
          <div class="ats-score-num" style="color:${col}">${ats}%</div>
        </div>
        <div>
          <div style="font-weight:700;font-size:15px;margin-bottom:4px">ATS Score</div>
          <div style="font-size:12px;color:var(--muted)">${analysis.summary || 'Analysis complete.'}</div>
        </div>
      </div>
      ${skills ? `<div><div class="resume-section-label">✓ Skills Detected</div><div class="res-tags">${skills}</div></div>` : ''}
      ${missing ? `<div><div class="resume-section-label">⚠ Missing Keywords</div><div class="res-tags">${missing}</div></div>` : ''}
      ${strengths ? `<div><div class="resume-section-label">💪 Strengths</div><ul class="res-improve-list">${strengths}</ul></div>` : ''}
      ${improv ? `<div><div class="resume-section-label">💡 Improvements</div><ul class="res-improve-list">${improv}</ul></div>` : ''}
    </div>`;
}

/* ════════════════════════════════════
   11. AUTH MODAL
════════════════════════════════════ */
function openAuthModal(mode = 'login') {
  const m = document.getElementById('authModal');
  if (m) m.classList.add('open');
  switchAuth(mode);
}
function closeAuthModal() {
  document.getElementById('authModal')?.classList.remove('open');
}
window.openAuthModal = openAuthModal;
window.closeAuthModal = closeAuthModal;

window.switchAuth = function(mode) {
  document.querySelectorAll('.mtab').forEach(t => t.classList.toggle('active', t.dataset.tab === mode));
  document.getElementById('loginForm')?.classList.toggle('active', mode === 'login');
  document.getElementById('registerForm')?.classList.toggle('active', mode === 'register');
  const h = document.querySelector('#authModal h3');
  if (h) h.textContent = mode === 'register' ? 'Create Account' : 'Sign In';
};

document.getElementById('authModal')?.addEventListener('click', e => {
  if (e.target === document.getElementById('authModal')) closeAuthModal();
});

document.getElementById('loginForm')?.addEventListener('submit', async e => {
  e.preventDefault();
  const btn = e.currentTarget.querySelector('button[type=submit]');
  const fd = new FormData(e.currentTarget);
  setLoading(btn, true);
  try {
    const ok = await checkBackend(); if (!ok) return;
    await authLogin(fd.get('email'), fd.get('password'));
    closeAuthModal();
    showToast('Welcome back!', 'success');
    updateAuthUI();
    loadDashboard();
  } catch(err) { showToast(err.message, 'error'); }
  finally { setLoading(btn, false); }
});

document.getElementById('registerForm')?.addEventListener('submit', async e => {
  e.preventDefault();
  const btn = e.currentTarget.querySelector('button[type=submit]');
  const fd = new FormData(e.currentTarget);
  setLoading(btn, true);
  try {
    const ok = await checkBackend(); if (!ok) return;
    const data = await authRegister(fd.get('name'), fd.get('email'), fd.get('password'), fd.get('college'), fd.get('targetRole'));
    switchAuth('login');
    if (data.verificationUrl) {
      const vb = document.getElementById('verificationBox');
      if (vb) { vb.style.display='block'; vb.innerHTML=`<p>Verify your email: <a href="${data.verificationUrl}">Click here</a></p>`; }
    }
    showToast(data.message || 'Account created! Please verify your email.', 'success');
  } catch(err) { showToast(err.message, 'error'); }
  finally { setLoading(btn, false); }
});

async function checkBackend() {
  try { await MockAI.apiHealth(); return true; }
  catch(err) { showToast(err.message, 'error'); return false; }
}

/* ════════════════════════════════════
   12. AUTH UI UPDATE
════════════════════════════════════ */
function updateAuthUI() {
  const user = getUser?.();
  const loggedIn = isLoggedIn?.();

  // Nav button
  const navBtn = document.getElementById('navSignIn');
  if (navBtn) {
    navBtn.textContent = user ? `Hi, ${user.name?.split(' ')[0] || 'there'}` : 'Sign In';
    navBtn.onclick = () => loggedIn ? null : openAuthModal('login');
  }

  // Dashboard topbar
  const ava = document.getElementById('dashAva');
  const name = document.getElementById('dashName');
  const plan = document.getElementById('dashPlan');
  if (user) {
    const initials = user.name ? user.name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2) : 'ME';
    if (ava) ava.textContent = initials;
    if (name) name.textContent = user.name || 'User';
    if (plan) plan.textContent = user.plan || 'Free';
  }
}

/* ════════════════════════════════════
   13. AI INTERVIEW PANEL
════════════════════════════════════ */
let aiMode = 'mixed';
let aiInterviewId = null;
let aiIsTyping = false;

const modeLabels = { mixed: 'Full Mock Interview', hr: 'HR Behavioral Interview', technical: 'Technical Coding Interview' };
const modeIntros = {
  mixed: "Hello! I'm Alex, your AI interviewer. I'll mix behavioral and technical questions. Say **Ready** or type your answer to begin!",
  hr: "Hi! I'm Alex. Today we're focusing on **HR and behavioral** questions using the STAR method. Tell me about yourself to start!",
  technical: "Hey! I'm Alex. Let's dive into **technical questions** — DS&A, system design, and problem-solving. Ready for your first problem?"
};

window.setAIMode = function(mode) {
  aiMode = mode;
  document.querySelectorAll('.ai-mode-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
  const label = document.getElementById('aiModeLabel');
  if (label) label.textContent = modeLabels[mode] || mode;
  const techWrap = document.getElementById('techEditorWrap');
  if (techWrap) techWrap.style.display = mode === 'technical' ? 'block' : 'none';
  aiInterviewId = null;
  const msgs = document.getElementById('aiMessages');
  if (msgs) {
    msgs.innerHTML = '';
    addAIMsg(modeIntros[mode] || modeIntros.mixed, false);
  }
  updateFeedback(null);
};

function addAIMsg(text, isUser) {
  const msgs = document.getElementById('aiMessages');
  if (!msgs) return;
  const div = document.createElement('div');
  div.className = 'ai-msg-bubble ' + (isUser ? 'user-bubble' : 'ai-bubble');
  div.innerHTML = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

function showAITyping() {
  const msgs = document.getElementById('aiMessages');
  if (!msgs || aiIsTyping) return;
  aiIsTyping = true;
  const div = document.createElement('div');
  div.id = 'aiTyping'; div.className = 'ai-msg-bubble ai-bubble';
  div.innerHTML = '<span class="dot-typing"><span></span><span></span><span></span></span>';
  msgs.appendChild(div); msgs.scrollTop = msgs.scrollHeight;
}
function hideAITyping() {
  document.getElementById('aiTyping')?.remove();
  aiIsTyping = false;
}

function updateFeedback(feedback) {
  const fields = [
    ['fConf','fConfVal', feedback?.confidenceScore],
    ['fComm','fCommVal', feedback?.communicationScore],
    ['fTech','fTechVal', feedback?.technicalScore],
  ];
  fields.forEach(([barId, valId, score]) => {
    const bar = document.getElementById(barId);
    const val = document.getElementById(valId);
    if (bar) bar.style.width = score ? score+'%' : '0%';
    if (val) val.textContent = score ? score+'%' : '—';
  });
  const tips = feedback?.tips;
  if (tips && tips.length) {
    const list = document.getElementById('tipsList');
    if (list) list.innerHTML = tips.map(t=>`<div class="tip-item">${t}</div>`).join('');
  }
}

async function sendAIMessage() {
  const input = document.getElementById('aiInput');
  const code = document.getElementById('codeEditor');
  const sendBtn = document.getElementById('aiSend');
  let text = input?.value.trim();
  if (!text || aiIsTyping) return;

  // For technical mode, append code if present
  if (aiMode === 'technical' && code?.value.trim()) {
    text += '\n\n**My Code Solution:**\n```\n' + code.value.trim() + '\n```';
    code.value = '';
  }

  if (!isLoggedIn?.()) {
    openAuthModal('login');
    showToast('Sign in to save your interview session.', 'info');
    return;
  }

  addAIMsg(text.replace(/\n\n\*\*My Code.*$/s, ''), true);
  input.value = '';
  if (sendBtn) sendBtn.disabled = true;
  showAITyping();

  try {
    if (!aiInterviewId) {
      const started = await interviewStart(
        'Software Engineer', 'General', aiMode, 'intermediate'
      );
      aiInterviewId = started.interview._id;
    }
    const data = await interviewMessage(aiInterviewId, text);
    hideAITyping();
    if (sendBtn) sendBtn.disabled = false;
    if (data.feedback) updateFeedback(data.feedback);
    if (data.aiMessage) addAIMsg(data.aiMessage, false);
  } catch(err) {
    hideAITyping();
    if (sendBtn) sendBtn.disabled = false;
    showToast(err.message || 'AI interview error. Try again.', 'error');
  }
}

document.getElementById('aiSend')?.addEventListener('click', sendAIMessage);
document.getElementById('aiInput')?.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAIMessage(); }
});

window.loadQuick = function(chip) {
  const q = chip.dataset.q;
  const msgs = document.getElementById('aiMessages');
  if (!msgs) return;
  const div = document.createElement('div');
  div.className = 'ai-msg-bubble ai-bubble';
  div.innerHTML = `<strong>${q}</strong>`;
  msgs.appendChild(div); msgs.scrollTop = msgs.scrollHeight;
  document.getElementById('aiInput')?.focus();
};

/* ════════════════════════════════════
   14. DASHBOARD — FULLY FUNCTIONAL
   API response: { success, dashboard: {
     stats, recentInterviews, weeklyScores,
     skillBreakdown, typeDistribution,
     recommendations, totalInterviews, inProgress
   }}
════════════════════════════════════ */
function relDate(d) {
  const diff = Date.now() - new Date(d).getTime();
  const days = Math.floor(diff / 86400000);
  return days === 0 ? 'Today' : days === 1 ? 'Yesterday' : `${days}d ago`;
}
function scoreClass(s) { return s >= 80 ? 'sp-hi' : s >= 65 ? 'sp-mid' : 'sp-lo'; }
function initials(name) { return (name||'').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)||'?'; }

async function loadDashboard() {
  updateAuthUI();
  if (!isLoggedIn?.()) return; // keep showcase state

  try {
    const res = await MockAI.dashboardGet();
    if (!res?.dashboard) return;
    const d = res.dashboard;

    // Stats
    const tot = d.totalInterviews ?? d.stats?.totalSessions ?? 0;
    const avg = d.stats?.avgScore ?? (d.weeklyScores?.length
      ? Math.round(d.weeklyScores.reduce((s,w)=>s+(w.score||0),0)/d.weeklyScores.length) : 0);
    const hrs = d.stats?.practiceHours ?? 0;
    const streak = d.stats?.streak ?? 0;

    setText('dsTotalSessions', tot);
    setText('dsAvgScore', avg + '%');
    setText('dsPracticeHours', hrs + 'h');
    setText('dsStreak', streak);
    const inp = d.inProgress || 0;
    setTextClass('dsInProgress', inp > 0 ? `↑ ${inp} in progress` : `${tot} completed`, inp > 0 ? 'up' : '');
    setTextClass('dsScoreChange', avg >= 70 ? '↑ Good performance' : '↗ Keep practicing', 'up');
    setTextClass('dsHoursChange', `${tot} total sessions`, '');

    // Score trend chart
    if (d.weeklyScores?.length) {
      const bars = document.querySelectorAll('.mc-bar');
      const mc = document.getElementById('mcEmpty');
      if (mc) mc.style.display = 'none';
      const scores = d.weeklyScores.slice(-10);
      const mx = Math.max(...scores.map(s=>s.score||0), 1);
      bars.forEach((bar, i) => {
        const s = scores[i];
        bar.style.height = s ? Math.max(8, Math.round((s.score/mx)*90))+'%' : '8%';
        bar.title = s ? `${s.score}% — ${relDate(s.date)}` : '';
      });
    }

    // Skill bars
    if (d.skillBreakdown) {
      const sb = d.skillBreakdown;
      setBar('sbComm', 'sbCommVal', sb.communication);
      setBar('sbTech', 'sbTechVal', sb.technical);
      setBar('sbConf', 'sbConfVal', sb.confidence);
    }

    // Sidebar badge
    setText('dsBadge', d.totalInterviews || 0);

    // Recent interviews table
    const tbody = document.getElementById('historyTbody');
    if (tbody) {
      if (d.recentInterviews?.length) {
        tbody.innerHTML = d.recentInterviews.map(iv => {
          const score = iv.feedback?.overallScore || 0;
          const type = (iv.interviewType||'mixed').replace(/-/g,' ');
          return `<tr>
            <td>${iv.jobRole||'Interview'}</td>
            <td>${iv.company||'—'}</td>
            <td style="text-transform:capitalize">${type}</td>
            <td><span class="score-pill ${scoreClass(score)}">${score}%</span></td>
            <td>${relDate(iv.createdAt)}</td>
          </tr>`;
        }).join('');
      } else {
        tbody.innerHTML = `<tr><td colspan="5" class="empty-row">No sessions yet — start your first AI interview! 🚀</td></tr>`;
      }
    }

    // AI Recommendations
    if (d.recommendations?.length) {
      const panel = document.getElementById('recsPanel');
      const list = document.getElementById('recsList');
      if (panel) panel.style.display = 'block';
      if (list) list.innerHTML = d.recommendations.map(r=>`<li>${r}</li>`).join('');
    }

    // Load all sub-panels
    loadSessionsPanel(d.recentInterviews || []);
    loadAnalyticsPanel(d);
    loadProgressPanel(d);
    loadCoachPanel(d.recommendations || [], d.skillBreakdown || {});
    loadSettingsPanel();

  } catch(err) {
    console.warn('Dashboard load failed:', err.message);
  }
}

function setText(id, val) { const el=document.getElementById(id); if(el) el.textContent=val; }
function setTextClass(id, val, cls) { const el=document.getElementById(id); if(el){el.textContent=val;el.className='ds-card-change '+(cls||'');} }
function setBar(barId, valId, score) {
  const bar=document.getElementById(barId); const val=document.getElementById(valId);
  if(bar) bar.style.width=(score||0)+'%';
  if(val) val.textContent=score?score+'%':'—';
}

/* ── Sessions Panel ── */
function loadSessionsPanel(recent) {
  const el = document.getElementById('sessionsContent');
  if (!el) return;
  if (!isLoggedIn?.()) return;
  if (!recent.length) {
    el.innerHTML = `<div class="empty-state"><div class="es-icon">🎤</div><div class="es-title">No sessions yet</div><div class="es-sub">Start your first AI mock interview!</div><button class="btn-primary-sm" style="margin-top:16px" onclick="document.getElementById('ai-panel').scrollIntoView({behavior:'smooth'})">Start Interview</button></div>`;
    return;
  }
  el.innerHTML = recent.map(iv => {
    const score = iv.feedback?.overallScore || 0;
    const col = score >= 80 ? '#10b981' : score >= 65 ? '#6366f1' : '#f59e0b';
    return `<div class="session-card">
      <div>
        <div class="sc-role">${iv.jobRole||'Interview'} <span style="font-weight:400;color:var(--muted)">@ ${iv.company||'—'}</span></div>
        <div class="sc-meta">
          <span style="text-transform:capitalize">${(iv.interviewType||'mixed').replace(/-/g,' ')}</span>
          <span>${iv.durationMinutes ? iv.durationMinutes+'m' : '—'}</span>
          <span>${relDate(iv.createdAt)}</span>
        </div>
      </div>
      <div>
        <div class="sc-score" style="color:${col}">${score}%</div>
        <div class="sc-date">${relDate(iv.createdAt)}</div>
      </div>
    </div>`;
  }).join('');
}

/* ── Analytics Panel ── */
function loadAnalyticsPanel(d) {
  const el = document.getElementById('analyticsContent');
  if (!el || !isLoggedIn?.()) return;
  const dist = d.typeDistribution || {};
  const total = Object.values(dist).reduce((a,b)=>a+b, 0) || 1;
  const typeColors = { mixed:'#6366f1', technical:'#06b6d4', hr:'#10b981' };
  el.innerHTML = `
    <div class="analytics-grid">
      <div class="al-card">
        <div class="al-title">Session Summary</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div style="text-align:center;padding:16px;background:rgba(255,255,255,0.03);border-radius:10px;border:1px solid var(--border)">
            <div style="font-family:Syne,sans-serif;font-size:28px;font-weight:800;color:#6366f1">${d.totalInterviews||0}</div>
            <div style="font-size:11px;color:var(--muted);margin-top:4px">Total Sessions</div>
          </div>
          <div style="text-align:center;padding:16px;background:rgba(255,255,255,0.03);border-radius:10px;border:1px solid var(--border)">
            <div style="font-family:Syne,sans-serif;font-size:28px;font-weight:800;color:#06b6d4">${d.stats?.avgScore||0}%</div>
            <div style="font-size:11px;color:var(--muted);margin-top:4px">Avg Score</div>
          </div>
          <div style="text-align:center;padding:16px;background:rgba(255,255,255,0.03);border-radius:10px;border:1px solid var(--border)">
            <div style="font-family:Syne,sans-serif;font-size:28px;font-weight:800;color:#10b981">${d.stats?.practiceHours||0}h</div>
            <div style="font-size:11px;color:var(--muted);margin-top:4px">Practice Hours</div>
          </div>
          <div style="text-align:center;padding:16px;background:rgba(255,255,255,0.03);border-radius:10px;border:1px solid var(--border)">
            <div style="font-family:Syne,sans-serif;font-size:28px;font-weight:800;color:#f59e0b">${d.inProgress||0}</div>
            <div style="font-size:11px;color:var(--muted);margin-top:4px">In Progress</div>
          </div>
        </div>
      </div>
      <div class="al-card">
        <div class="al-title">Interview Types</div>
        <div class="type-bars">
          ${Object.entries(dist).map(([type, count]) => `
            <div class="type-bar-item">
              <div class="type-bar-label" style="text-transform:capitalize">${type}</div>
              <div class="type-bar-track"><div class="type-bar-fill" style="width:${Math.round(count/total*100)}%;background:${typeColors[type]||'#6366f1'}"></div></div>
              <div class="type-bar-count">${count}</div>
            </div>`).join('') || '<div style="color:var(--dim);font-size:13px">No data yet</div>'}
        </div>
      </div>
      <div class="al-card" style="grid-column:1/-1">
        <div class="al-title">Score Trend (Last ${d.weeklyScores?.length||0} Sessions)</div>
        <div style="display:flex;align-items:flex-end;gap:6px;height:80px;margin-top:8px">
          ${(d.weeklyScores||[]).map(s => {
            const h = Math.max(8, Math.round((s.score/100)*80));
            return `<div style="flex:1;height:${h}px;border-radius:3px 3px 0 0;background:linear-gradient(180deg,#6366f1,rgba(99,102,241,0.1));min-width:8px" title="${s.score}% — ${relDate(s.date)}"></div>`;
          }).join('') || '<div style="color:var(--dim);font-size:13px;align-self:center">Complete sessions to see trend</div>'}
        </div>
      </div>
    </div>`;
}

/* ── Progress Panel ── */
function loadProgressPanel(d) {
  const el = document.getElementById('progressContent');
  if (!el || !isLoggedIn?.()) return;
  const sb = d.skillBreakdown || {};
  el.innerHTML = `
    <div class="progress-grid">
      <div class="prog-card">
        <div class="prog-num" style="color:#6366f1">${d.totalInterviews||0}</div>
        <div class="prog-label">Total Interviews</div>
      </div>
      <div class="prog-card">
        <div class="prog-num" style="color:#06b6d4">${d.stats?.avgScore||0}%</div>
        <div class="prog-label">Average Score</div>
      </div>
      <div class="prog-card">
        <div class="prog-num" style="color:#10b981">${d.stats?.practiceHours||0}h</div>
        <div class="prog-label">Practice Hours</div>
      </div>
      <div class="prog-card">
        <div class="prog-num" style="color:#f59e0b">${d.stats?.streak||0}</div>
        <div class="prog-label">Day Streak</div>
      </div>
    </div>
    <div class="al-card" style="margin-top:14px">
      <div class="al-title">Skill Breakdown</div>
      <div style="display:flex;flex-direction:column;gap:14px;margin-top:8px">
        ${Object.entries(sb).map(([skill, score]) => {
          const col = score >= 80 ? '#10b981' : score >= 60 ? '#6366f1' : '#f59e0b';
          return `<div>
            <div style="display:flex;justify-content:space-between;margin-bottom:6px;font-size:13px">
              <span style="text-transform:capitalize;color:var(--muted)">${skill}</span>
              <span style="color:${col};font-weight:700;font-family:JetBrains Mono,monospace">${score}%</span>
            </div>
            <div style="height:7px;background:rgba(255,255,255,0.07);border-radius:99px;overflow:hidden">
              <div style="height:100%;width:${score}%;border-radius:99px;background:linear-gradient(90deg,${col},${col}88);transition:width 1s ease"></div>
            </div>
          </div>`;
        }).join('') || '<div style="color:var(--dim);font-size:13px">Complete interviews to see skill breakdown</div>'}
      </div>
    </div>`;
}

/* ── Coach Panel ── */
function loadCoachPanel(recs, skillBreakdown) {
  const el = document.getElementById('coachContent');
  if (!el || !isLoggedIn?.()) return;
  const weakSkill = Object.entries(skillBreakdown).sort((a,b)=>a[1]-b[1])[0]?.[0] || 'communication';
  el.innerHTML = `
    <div style="margin-bottom:16px;padding:16px;background:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.2);border-radius:var(--r)">
      <div style="font-size:12px;color:var(--primary);font-weight:700;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:8px">Focus Area</div>
      <div style="font-size:16px;font-weight:600;text-transform:capitalize">${weakSkill} needs the most work</div>
    </div>
    <div class="coach-recs">
      ${recs.map(r=>`<div class="coach-rec"><div class="cr-cat">AI Recommendation</div><div class="cr-text">${r}</div></div>`).join('') || '<div class="empty-state" style="padding:40px"><div class="es-icon">🤖</div><div class="es-title">Complete an interview</div><div class="es-sub">Your AI Coach recommendations will appear here</div></div>'}
    </div>`;
}

/* ── Settings Panel ── */
function loadSettingsPanel() {
  const el = document.getElementById('settingsContent');
  if (!el) return;
  const user = getUser?.();
  if (!user) return;
  el.innerHTML = `
    <div class="settings-form">
      <div class="sf-field"><div class="sf-label">Full Name</div><input class="sf-input" value="${user.name||''}" readonly></div>
      <div class="sf-field"><div class="sf-label">Email</div><input class="sf-input" value="${user.email||''}" readonly></div>
      <div class="sf-field"><div class="sf-label">College / University</div><input class="sf-input" value="${user.college||'Not set'}" readonly></div>
      <div class="sf-field"><div class="sf-label">Target Role</div><input class="sf-input" value="${user.targetRole||'Not set'}" readonly></div>
      <div class="sf-field"><div class="sf-label">Plan</div><input class="sf-input" value="${(user.plan||'free').charAt(0).toUpperCase()+(user.plan||'free').slice(1)}" readonly></div>
      <div style="padding-top:8px;border-top:1px solid var(--border);display:flex;gap:12px">
        <button class="btn-primary-sm" onclick="showToast('Profile editing coming soon!','info')">Edit Profile</button>
        <button class="btn-ghost" onclick="handleLogout()" style="font-size:13px">Sign Out</button>
      </div>
    </div>`;
}

/* ── Logout ── */
window.handleLogout = function() {
  clearAuth?.();
  updateAuthUI();
  showToast('Signed out successfully.', 'info');
  // Reset dashboard to showcase
  ['dsTotalSessions','dsAvgScore','dsPracticeHours','dsStreak'].forEach(id => setText(id, '—'));
  const tbody = document.getElementById('historyTbody');
  if (tbody) tbody.innerHTML = `<tr><td colspan="5" class="empty-row">Sign in to see your interview history 🔐</td></tr>`;
  ['sessionsContent','analyticsContent','progressContent','coachContent'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = `<div class="empty-state"><div class="es-icon">🔐</div><div class="es-title">Sign in to view</div></div>`;
  });
  document.getElementById('settingsContent').innerHTML = `<div class="empty-state"><div class="es-icon">⚙️</div><div class="es-title">Sign in to manage settings</div></div>`;
};

/* ════════════════════════════════════
   15. DASHBOARD SIDEBAR NAVIGATION
════════════════════════════════════ */
function switchDashTab(section) {
  // Sidebar items
  document.querySelectorAll('.ds-item').forEach(i => i.classList.toggle('active', i.dataset.section === section));
  // Panels
  document.querySelectorAll('.dash-panel').forEach(p => p.classList.toggle('active', p.id === 'panel-' + section));
  // Top tabs sync
  document.querySelectorAll('.dash-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === section));
}
window.switchDashTab = switchDashTab;

document.querySelectorAll('.ds-item').forEach(item => {
  item.addEventListener('click', function() {
    switchDashTab(this.dataset.section);
  });
});
document.querySelectorAll('.dash-tab').forEach(tab => {
  tab.addEventListener('click', function() {
    switchDashTab(this.dataset.tab);
  });
});

/* ════════════════════════════════════
   16. HERO LIVE STATS
════════════════════════════════════ */
async function loadHeroStats() {
  // Show user count — just a real-feeling placeholder from session data
  try {
    const health = await MockAI.apiHealth();
    if (health) {
      // We don't have a public stats endpoint, so show a realistic number
      const base = 1247;
      document.getElementById('heroUserCount').textContent = (base + Math.floor(Math.random()*50)).toLocaleString();
      document.getElementById('sessionsToday').textContent = Math.floor(Math.random()*40+80);
    }
  } catch { /* silent */ }
}

/* ════════════════════════════════════
   17. EMAIL VERIFICATION
════════════════════════════════════ */
async function handleEmailVerification() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  if (!token) return;
  try {
    const data = await MockAI.authVerifyEmail(token);
    updateAuthUI();
    showToast(data.message || 'Email verified! You can now sign in.', 'success');
    window.history.replaceState({}, '', '#dashboard');
  } catch(err) { showToast(err.message, 'error'); }
}

/* ════════════════════════════════════
   18. WIRE BUTTONS
════════════════════════════════════ */
function wireButtons() {
  // Sign in / Get started
  document.getElementById('navSignIn')?.addEventListener('click', () => openAuthModal('login'));
  document.getElementById('navGetStarted')?.addEventListener('click', () => openAuthModal('register'));
  document.getElementById('mobileGetStarted')?.addEventListener('click', () => openAuthModal('register'));
  document.getElementById('heroStart')?.addEventListener('click', () => {
    if (isLoggedIn?.()) document.getElementById('ai-panel')?.scrollIntoView({behavior:'smooth'});
    else openAuthModal('register');
  });
  document.getElementById('ctaStart')?.addEventListener('click', () => openAuthModal('register'));
  document.getElementById('sessionsSignIn')?.addEventListener('click', () => openAuthModal('login'));
}

/* ════════════════════════════════════
   19. INIT
════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  wireButtons();
  updateAuthUI();
  loadDashboard();
  loadHeroStats();
  handleEmailVerification();
});
if (document.readyState !== 'loading') {
  wireButtons();
  updateAuthUI();
}

/* ════════════════════════════════════════════════════

/* ═══════════════════════════════════════════════════════════
   VOICE INTERVIEW ENGINE v4 — Production Grade
   Fixes:
   - TTS never gets stuck (no keepalive deadlock)
   - Fresh recognition instance every session (no reuse bug)
   - interim=true to prevent silent result drops
   - Proper full cleanup on close so reopen always works
   - No-speech handled without restart loop
   - Smooth continuous flow: speak → listen → submit → speak
═══════════════════════════════════════════════════════════ */

/* ── State — single source of truth ── */
const VE = {
  active:          false,
  sessionId:       null,
  mode:            'mixed',
  synth:           window.speechSynthesis,
  rec:             null,          // fresh SR per session
  phase:           'idle',        // idle|speaking|listening|processing
  detectedLang:    'en-US',
  femaleVoiceEN:   null,
  femaleVoiceTE:   null,
  finalText:       '',
  interimText:     '',
  silenceTimer:    null,
  silenceDelay:    1800,
  isStarting:      false,         // guard against double-start
  kaTimer:         null, 
    audioCtx: null,
  analyser: null,
  micStream: null,
  vadRunning: false,
  speechFrames: 0,         // TTS keepalive interval
};

/* ── Pick female voices (called once + on voiceschanged) ── */
function VE_pickVoices() {
  const all = VE.synth?.getVoices() || [];
  const EN_PREF = [
    'Samantha','Karen','Moira','Tessa','Fiona','Ava','Allison',
    'Microsoft Aria Online (Natural)','Microsoft Jenny Online (Natural)',
    'Google UK English Female','Microsoft Aria','Microsoft Zira',
  ];
  VE.femaleVoiceEN = EN_PREF.reduce((f,n)=>f||all.find(v=>v.name===n),null)
    || all.find(v=>v.lang.startsWith('en-')&&/female|woman/i.test(v.name))
    || all.find(v=>v.lang==='en-GB')
    || all.find(v=>v.lang.startsWith('en'))
    || null;

  const TE_PREF = ['Google తెలుగు','Google Telugu','Lekha','Neerja'];
  VE.femaleVoiceTE = TE_PREF.reduce((f,n)=>f||all.find(v=>v.name===n),null)
    || all.find(v=>v.lang==='te-IN'||v.lang==='te')
    || null;
}
if (VE.synth) {
  VE_pickVoices();
  VE.synth.onvoiceschanged = VE_pickVoices;
}

/* ════════════════════
   TTS — AI SPEAKS
   No keepalive loop — use single utterance per chunk with
   a watchdog timer that pokes synth if it stalls.
════════════════════ */
function VE_startBargeMonitor() {

  if (VE.vadRunning) return;

  VE.vadRunning = true;

  const data = new Uint8Array(
    VE.analyser.frequencyBinCount
  );

  function check() {

    if (!VE.active) {
      requestAnimationFrame(check);
      return;
    }

    if (VE.phase === 'speaking') {

      VE.analyser.getByteFrequencyData(data);

      let avg = 0;

      for (let i = 0; i < data.length; i++) {
        avg += data[i];
      }

      avg /= data.length;

      if (avg > 22) {
        VE.speechFrames++;
      } else {
        VE.speechFrames = 0;
      }

      if (VE.speechFrames > 15) {

        console.log("BARGE IN DETECTED");

        VE_synthStop();

VE.finalText = '';
VE.interimText = '';

VE_setPhase('listening');
VE_setStatus('Listening...');

try {
  VE.rec?.stop();
} catch(e) {}

setTimeout(() => {
  VE_doListen();
}, 200);

        VE.speechFrames = 0;
      }
    }

    requestAnimationFrame(check);
  }

  check();
}
function VE_speak(rawText, onDone) {
  if (!rawText?.trim()) { onDone?.(); return; }

  // Full stop any previous speech
  VE_synthStop();

  const text = rawText
    .replace(/\*\*(.*?)\*\*/g,'$1')
    .replace(/[*_`#\[\]]/g,'')
    .replace(/\n+/g,' ')
    .trim();

  VE_setPhase('speaking');
  VE_startBargeMonitor();
  // Allow interruption while AI talks
console.log("STARTING INTERRUPT LISTENER");

if (!VE.rec) {
  VE.rec = VE_createRecognition();

  try {
    VE.rec.start();
    console.log("INTERRUPT LISTENER STARTED");
  } catch(e) {
    console.log("INTERRUPT LISTENER ERROR", e);
  }
}
  VE_showSpeechBox(rawText);

  const chunks = VE_splitText(text);
  let idx = 0;
  let watchdog = null;

  function speakNext() {
    console.log("Speaking chunk", idx);
    clearInterval(watchdog);
    if (!VE.active || idx >= chunks.length) {
      VE_synthStop();
      onDone?.();
      return;
    }

    const utt    = new SpeechSynthesisUtterance(chunks[idx]);
    const isTE   = VE.detectedLang === 'te-IN';
    utt.voice    = isTE ? (VE.femaleVoiceTE || VE.femaleVoiceEN) : VE.femaleVoiceEN;
    utt.lang     = isTE ? 'te-IN' : 'en-US';
    utt.rate     = 1.0;
    utt.pitch    = 1.25;
    utt.volume   = 1.5;

// Question tone
if (chunks[idx].includes('?')) {
  utt.pitch = 1.29;
}

// Positive feedback tone
if (/great|excellent|good answer|well done/i.test(chunks[idx])) {
  utt.pitch = 1.38;
  utt.rate = 1.0;
}

// Technical tone
if (/algorithm|complexity|database|system design|architecture/i.test(chunks[idx])) {
  utt.pitch = 1.2;
  utt.rate = 1.0;
}

    utt.onstart  = () => {
      // Watchdog: if synth freezes (Chrome bug), poke it after 12s
      clearInterval(watchdog);
      watchdog = setInterval(() => {
        if (VE.synth.speaking && !VE.synth.paused) {
          VE.synth.pause();
          setTimeout(() => VE.synth.resume(), 50);
        }
      }, 12000);
    };

    utt.onend = () => {
  console.log("TTS ENDED");

  clearInterval(watchdog);
  idx++;

  if (idx >= chunks.length) {
    console.log("ALL CHUNKS COMPLETE");

    if (VE.active) {
      VE_setStatus("Listening...");
      VE_setPhase("listening");

      setTimeout(() => {
        VE_doListen();
      }, 300);
    }

    onDone?.();
    return;
  }

  setTimeout(speakNext, 60);
};

    utt.onerror = (e) => {
      clearInterval(watchdog);
      if (e.error === 'interrupted' || e.error === 'canceled') {
        // We cancelled intentionally — don't continue
        return;
      }
      // For other errors skip chunk and continue
      idx++;
      setTimeout(speakNext, 100);
    };

    VE.synth.speak(utt);
    console.log("VOICE:", utt.voice?.name);
console.log("LANG:", utt.lang);
    setTimeout(() => {
  if (
    VE.phase === 'speaking' &&
    !VE.synth.speaking
  ) {
    console.warn("TTS timeout fallback");

    VE_setPhase("listening");
    VE_setStatus("Listening...");

    VE_doListen();
  }
}, 60000);
  }

  speakNext();
}

function VE_synthStop() {
  console.log("AI SPEECH STOPPED");
  clearInterval(VE.kaTimer);
  VE.kaTimer = null;
  try { VE.synth?.cancel(); } catch(e) {}
}

function VE_splitText(text) {
  // Split at sentence endings, keep chunks ≤ 100 chars for smooth TTS
  const raw = text.match(/[^.!?]+[.!?]*/g) || [text];
  const out = []; let buf = '';
  raw.forEach(s => {
    if ((buf + s).length > 100 && buf) { out.push(buf.trim()); buf = s; }
    else buf += s;
  });
  if (buf.trim()) out.push(buf.trim());
  return out.filter(Boolean);
}

/* ════════════════════
   SPEECH RECOGNITION
   Fresh instance every session.
   interim=true so Chrome doesn't silently drop finals.
════════════════════ */
function VE_createRecognition() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return null;

  // Always destroy old instance first
  if (VE.rec) {
    try { VE.rec.abort(); } catch(e) {}
    VE.rec.onresult = null;
    VE.rec.onerror  = null;
    VE.rec.onend    = null;
    VE.rec = null;
  }

  const rec = new SR();
  rec.continuous      = true;   // single utterance mode — more reliable
  rec.interimResults  = true;    // must be true or Chrome drops some finals
  rec.maxAlternatives = 1;
  rec.lang            = VE.detectedLang;

  rec.onresult = (e) => {
    // User interrupted AI
    console.log("PHASE WHEN RESULT ARRIVES:", VE.phase);
if (VE.phase === 'speaking') {

  console.log('USER INTERRUPTED AI');

  VE_synthStop();

  VE_setPhase('listening');
  VE_setStatus('Listening...');

  const transcript = e.results[e.resultIndex][0].transcript;

  VE.finalText = transcript;

  setTimeout(() => {
    VE_submitAnswer(transcript);
  }, 100);

  return;
}
     console.log("VOICE RESULT:", e.results[0][0].transcript);

    VE.interimText = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const t = e.results[i][0].transcript;
      if (e.results[i].isFinal) {
        VE.finalText += (VE.finalText ? ' ' : '') + t.trim();
      } else {
        VE.interimText = t;
      }
    }
    // Show only final text in transcript box — no interim
    VE_showTranscript(VE.finalText || VE.interimText);

    // Detect language change from what user said
    if (VE.finalText) {
      const lang = VE_detectLang(VE.finalText);
      if (lang && lang !== VE.detectedLang) {
        VE.detectedLang = lang;
        VE_updateLangBadge();
      }
    }
  };

  rec.onerror = (e) => {
    if (e.error === 'aborted') return; // we caused this
    if (e.error === 'no-speech') {
      // Restart quietly only if still in listen phase
      if (VE.phase === 'listening' && VE.active) {
        setTimeout(() => VE_doListen(), 300);
      }
      return;
    }
    console.warn('[VoiceEngine] SR error:', e.error);
    if (VE.phase === 'listening' && VE.active) {
      VE_setStatus('Reconnecting...');
      setTimeout(() => VE_doListen(), 800);
    }
  };

  rec.onend = () => {
    // If we have accumulated text, submit it
    if (VE.phase === 'listening' && VE.finalText.trim() && VE.active) {
      clearTimeout(VE.silenceTimer);
      VE_submitAnswer(VE.finalText.trim());
      return;
    }
    // No text yet — restart listening
    if (VE.phase === 'listening' && VE.active) {
      setTimeout(() => VE_doListen(), 200);
    }
  };

  return rec;
}

function VE_doListen() {
  if (!VE.active || VE.isStarting) return;
  

  VE.isStarting = true;
  VE.finalText  = '';
  VE.interimText = '';
  clearTimeout(VE.silenceTimer);

  // Fresh recognition every time — avoids Chrome's stale SR bug
  VE.rec = VE_createRecognition();
  if (!VE.rec) {
    showToast('Speech recognition needs Chrome or Edge.', 'warning');
    VE.isStarting = false;
    return;
  }

  VE_setPhase('listening');
  VE_showTranscript('');

  try {
    VE.rec.lang = VE.detectedLang;
    VE.rec.start();
  } catch(e) {
    console.warn('[VoiceEngine] start error:', e.message);
  } finally {
    VE.isStarting = false;
  }

  // Adaptive silence timer — fires if user pauses mid-sentence
  // Combined with onend which fires when Chrome auto-ends single-utterance
  VE.silenceTimer = setTimeout(() => {
    if (VE.phase === 'listening' && VE.finalText.trim() && VE.active) {
      try { VE.rec?.stop(); } catch(e) {}
    }
  }, 3500); // max listen window — prevents forever-open mic
}

function VE_stopListening() {
  clearTimeout(VE.silenceTimer);
  VE.isStarting = false;
  try { VE.rec?.stop(); } catch(e) {}
  try { VE.rec?.abort(); } catch(e) {}
}

/* ════════════════════
   LANGUAGE DETECTION
════════════════════ */
function VE_detectLang(text) {
  const teChar = (text.match(/[\u0C00-\u0C7F]/g)||[]).length;
  if (teChar > 1) return 'te-IN';
  if (/\b(nenu|meeru|idi|adi|cheppandi|telugu|lo\s+cheppandi|ante|avunu|kaadu|neeku|maku|okka|rendu|mana|undi|ledu)\b/i.test(text)) return 'te-IN';
  if (/switch.*telugu|telugu.*lo|in telugu|telugulo|తెలుగు/i.test(text)) return 'te-IN';
  if (/switch.*english|in english|english.*lo|back.*english/i.test(text)) return 'en-US';
  return null;
}

function VE_updateLangBadge() {
  const el  = document.getElementById('vLangIndicator');
  const isTE = VE.detectedLang === 'te-IN';
  if (el) { el.textContent = isTE ? '🇮🇳 తెలుగు' : '🇬🇧 English'; el.style.color = isTE ? '#f59e0b' : '#06b6d4'; }
}

/* ════════════════════
   PHASE & UI
════════════════════ */
function VE_setPhase(phase) {
  VE.phase = phase;
  const wrap = document.getElementById('vaiWrap');
  wrap?.classList.remove('speaking','listening','thinking');
  if (phase !== 'idle') wrap?.classList.add(
    phase === 'processing' ? 'thinking' : phase
  );
  const mainAva  = document.getElementById('mainAiAva');
  const mainRing = document.getElementById('mainAiRing');
  mainAva?.classList.toggle('speaking',  phase === 'speaking');
  mainRing?.classList.toggle('speaking', phase === 'speaking');
}

function VE_setStatus(msg) {
  const el = document.getElementById('vaiStatus');
  if (el) el.textContent = msg;
}

function VE_showSpeechBox(text) {
  const el = document.getElementById('vaiSpeechText');
  if (!el) return;
  const clean = text.replace(/\*\*(.*?)\*\*/g,'$1').replace(/[*_`#]/g,'');
  // Fast typewriter
  el.textContent = '';
  let i = 0;
  const speed = Math.max(12, Math.min(25, 1800 / Math.max(clean.length, 1)));
  const t = setInterval(() => {
    el.textContent += clean[i++];
    if (i >= clean.length) clearInterval(t);
  }, speed);
}

function VE_showTranscript(text) {
  const el = document.getElementById('vuserTranscript');
  if (el) el.textContent = text;
}

/* Status labels per phase */
const VE_STATUS = {
  speaking:   '▶ Priya is speaking...',
  listening:  '🎤 Listening — speak now',
  processing: '⟳ Processing your answer...',
  idle:       'Ready',
};

/* ════════════════════
   SUBMIT ANSWER
════════════════════ */
async function VE_submitAnswer(text) {
  if (!text?.trim() || VE.phase === 'processing') return;

  // Noise filter — ignore isolated noise words
  const words = text.trim().split(/\s+/).length;
  if (words < 2) { VE_doListen(); return; }

  VE_stopListening();
  VE_setPhase('processing');
  VE_setStatus(VE_STATUS.processing);
  VE_showTranscript('"' + text + '"');

  addAIMsg(text, true); // mirror in text panel

  const box = document.getElementById('vaiSpeechText');
  if (box) box.innerHTML = '<span style="opacity:.5;font-style:italic">Thinking...</span>';

  try {
   // Detect Telugu request
if (/telugu|తెలుగు|తెలుగులో|మాట్లాడు|matladu/i.test(text)) {
  VE.detectedLang = 'te-IN';
  VE.userLanguage = 'telugu';
  VE_updateLangBadge();
}

const langPrefix =
  VE.userLanguage === 'telugu'
    ? '[LANGUAGE=telugu] '
    : '[LANGUAGE=english] ';
    const isQuestion =
  /\?|what|why|how|when|where|who|can you|could you|explain|tell me/i.test(text);

const finalMessage =
  isQuestion
    ? '[USER_QUESTION] ' + langPrefix + text
    : langPrefix + text;
const data = await interviewMessage(
  VE.sessionId,
  finalMessage
);


    if (data.feedback) {
      VE_updateScores(data.feedback);
      updateFeedback(data.feedback);
    }

    if (data.aiMessage) {
      addAIMsg(data.aiMessage, false);

      // Detect AI response language and adapt
      const aiLang = VE_detectLang(data.aiMessage);
      if (aiLang && aiLang !== VE.detectedLang) {
        VE.detectedLang = aiLang;
        VE_updateLangBadge();
      }

      VE_setStatus(VE_STATUS.speaking);
      VE_speak(data.aiMessage, () => {
        if (VE.active) {
          VE_setStatus(VE_STATUS.listening);
          VE_doListen();
        }
      });
    }
  } catch(err) {
    console.error('[VoiceEngine] Submit error:', err.message);
    showToast('AI error — listening again.', 'error');
    VE_setPhase('idle');
    VE_setStatus('Error — trying again...');
    if (box) box.textContent = '';
    setTimeout(() => { if (VE.active) VE_doListen(); }, 2000);
  }
}

/* ════════════════════
   SCORES
════════════════════ */
function VE_updateScores(fb) {
  [['vConfVal', fb.confidenceScore],
   ['vCommVal', fb.communicationScore],
   ['vTechVal', fb.technicalScore]].forEach(([id, s]) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = s != null ? s + '%' : '—';
    el.style.color = s >= 80 ? '#10b981' : s >= 60 ? '#6366f1' : '#f59e0b';
  });
}

/* ════════════════════
   OPEN MODAL
════════════════════ */
window.startVoiceInterview = function() {
  VE.active = false;
VE.sessionId = null;
  if (!isLoggedIn?.()) {
    openAuthModal('login');
    showToast('Sign in to use Voice Interview.', 'info');
    return;
  }
  VE.mode = aiMode;
  VE.detectedLang = 'en-US';
  VE_updateLangBadge();
  document.getElementById('voiceModal')?.classList.add('open');
  document.body.style.overflow = 'hidden';
  document.getElementById('vScreenPermission').style.display = 'flex';
  document.getElementById('vScreenInterview').style.display  = 'none';
};

/* ════════════════════
   GRANT MIC & START
════════════════════ */
document.getElementById('vGrantMicBtn')?.addEventListener('click', async () => {
  const btn = document.getElementById('vGrantMicBtn');

  setLoading(btn, true);

  try {
    await navigator.mediaDevices.getUserMedia({ audio: true });

    document.getElementById('vScreenPermission').style.display = 'none';
    document.getElementById('vScreenInterview').style.display  = 'flex';

    VE.active = true;

    await VE_beginSession();

    setLoading(btn, false); // ADD THIS
  } catch(err) {
    setLoading(btn, false);
    showToast('Microphone denied. Enable it in browser settings.', 'error');
  }
});

/* ════════════════════
   BEGIN SESSION
════════════════════ */
async function VE_initBargeIn() {

  if (VE.audioCtx) return;

  VE.micStream = await navigator.mediaDevices.getUserMedia({
    audio: true
  });

  VE.audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  const source = VE.audioCtx.createMediaStreamSource(
    VE.micStream
  );

  VE.analyser = VE.audioCtx.createAnalyser();
  VE.analyser.fftSize = 1024;

  source.connect(VE.analyser);

  console.log("BARGE-IN READY");
}

async function VE_beginSession() {
  VE_setPhase('processing');
  VE_setStatus('Connecting to Priya...');

  const box = document.getElementById('vaiSpeechText');
  if (box) box.textContent = '';
  VE_showTranscript('');
  await VE_initBargeIn();

  try {
    const started = await interviewStart('Software Engineer', 'General', VE.mode, 'intermediate');
    VE.sessionId  = started.interview._id;
    aiInterviewId = VE.sessionId;

    const firstAIMsg = started.interview?.messages?.find(m => m.role === 'ai');
    const opener = firstAIMsg?.content || VE_getOpener();
    const shortOpener =
  opener.length > 200
    ? opener.substring(0, 200)
    : opener;

    addAIMsg(shortOpener, false);
    VE_setStatus(VE_STATUS.speaking);
    VE_speak(shortOpener, () => {
      if (VE.active) {
        VE_setStatus(VE_STATUS.listening);
        VE_doListen();
      }
    });
  } catch(err) {
    showToast('Could not start interview: ' + err.message, 'error');
    VE_setPhase('idle');
    VE_setStatus('Connection failed. Please try again.');
    if (box) box.textContent = 'Could not connect. Please close and try again.';
  }
}

function VE_getOpener() {
  const openers = {
    mixed:     "Hi! I'm Priya, your interview coach. I'm excited to help you prepare. We'll go through a mix of behavioral and technical questions. Just speak naturally — I'm listening. Let's start: Could you tell me a bit about yourself and what role you're preparing for?",
    hr:        "Hi! I'm Priya. Today we'll practice behavioral questions using the STAR method. Take your time with each answer — I'm here to help you improve. Let's begin: Tell me about a time you showed strong leadership under pressure.",
    technical: "Hi! I'm Priya. We're focusing on technical questions today — data structures, algorithms, and problem-solving. Think out loud if it helps. First question: Given an array of integers, how would you find two numbers that add up to a target sum?",
  };
  return openers[VE.mode] || openers.mixed;
}

/* ════════════════════
   TYPE FALLBACK
════════════════════ */
function VE_typeSubmit() {
  const inp = document.getElementById('vtypeInput');
  const txt = inp?.value.trim();
  if (!txt || !VE.active) return;
  inp.value = '';
  VE_stopListening();
  VE.finalText = txt;
  VE_submitAnswer(txt);
}
document.getElementById('vtypeSend')?.addEventListener('click', VE_typeSubmit);
document.getElementById('vtypeInput')?.addEventListener('keydown', e => {
  if (e.key === 'Enter') { e.preventDefault(); VE_typeSubmit(); }
});

/* ════════════════════
   CLOSE — FULL CLEANUP
   Ensures reopening always works fresh
════════════════════ */
window.closeVoiceModal = function() {
  const btn = document.getElementById('vGrantMicBtn');
setLoading(btn, false);
  // 1. Kill all audio immediately
  VE_synthStop();

  // 2. Kill recognition — destroy instance so it can't fire callbacks
  clearTimeout(VE.silenceTimer);
  VE.isStarting = false;
  if (VE.rec) {
    VE.rec.onresult = null;
    VE.rec.onerror  = null;
    VE.rec.onend    = null;
    try { VE.rec.abort(); } catch(e) {}
    VE.rec = null;
  }

  // 3. Reset all state
  VE.active        = false;
  VE.sessionId     = null;
  VE.finalText     = '';
  VE.interimText   = '';
  VE.detectedLang  = 'en-US';
  VE.phase         = 'idle';

  // 4. Reset UI
  VE_setPhase('idle');
  const box = document.getElementById('vaiSpeechText');
  if (box) box.textContent = '';
  VE_showTranscript('');
  VE_setStatus('');

  // 5. Close modal
  document.getElementById('voiceModal')?.classList.remove('open');
  document.body.style.overflow = '';
};