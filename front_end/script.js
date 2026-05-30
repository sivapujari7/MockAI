/* ============================================================
   MockAI — script.js  (fully functional, AI-powered)
   ============================================================ */

/* ── 1. Loader ── */
window.addEventListener('load', () => {
  setTimeout(() => {
    const loader = document.getElementById('loader');
    if (!loader) return;
    loader.style.opacity = '0';
    loader.style.transition = 'opacity 0.6s ease';
    setTimeout(() => { loader.style.display = 'none'; }, 600);
  }, 1400);
});

/* ── 2. Scroll reveal ── */
const revealEls = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const delay = parseFloat(entry.target.style.transitionDelay || '0') * 1000;
      setTimeout(() => entry.target.classList.add('visible'), delay);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
revealEls.forEach(el => revealObserver.observe(el));

/* ── 3. Nav scroll ── */
window.addEventListener('scroll', () => {
  document.getElementById('mainNav')?.classList.toggle('scrolled', window.scrollY > 40);
});

/* ── 4. Mobile nav ── */
document.getElementById('hamburger')?.addEventListener('click', () => {
  document.getElementById('mobileNav')?.classList.add('open');
});
document.getElementById('mobileClose')?.addEventListener('click', () => {
  document.getElementById('mobileNav')?.classList.remove('open');
});
document.querySelectorAll('.mobile-nav a').forEach(a => {
  a.addEventListener('click', () => document.getElementById('mobileNav')?.classList.remove('open'));
});

/* ── 5. FAQ ── */
window.toggleFaq = function(btn) {
  const item = btn.parentElement;
  const answer = item.querySelector('.faq-a');
  const isOpen = item.classList.contains('open');
  document.querySelectorAll('.faq-item').forEach(f => {
    f.classList.remove('open');
    f.querySelector('.faq-a').style.maxHeight = '0';
  });
  if (!isOpen) {
    item.classList.add('open');
    answer.style.maxHeight = answer.scrollHeight + 'px';
  }
};

/* ── 6. Smooth scroll ── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth' }); }
  });
});

/* ── 7. Role chips ── */
document.querySelectorAll('.job-role-selector').forEach(container => {
  container.querySelectorAll('.role-chip').forEach(chip => {
    chip.addEventListener('click', function () {
      container.querySelectorAll('.role-chip').forEach(c => c.classList.remove('active'));
      this.classList.add('active');
    });
  });
});

/* ── 8. Dashboard nav ── */
document.querySelectorAll('.dash-nav-item').forEach(item => {
  item.addEventListener('click', function () {
    document.querySelectorAll('.dash-nav-item').forEach(i => i.classList.remove('active'));
    this.classList.add('active');
  });
});
document.querySelectorAll('.dash-sidebar-item').forEach(item => {
  item.addEventListener('click', function () {
    document.querySelectorAll('.dash-sidebar-item').forEach(i => i.classList.remove('active'));
    this.classList.add('active');
  });
});

/* ── 9. Particles canvas ── */
(function () {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H;
  function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
  resize();
  window.addEventListener('resize', resize);
  const colors = ['rgba(108,99,255,', 'rgba(0,212,255,', 'rgba(124,58,237,', 'rgba(167,139,250,'];
  const particles = Array.from({ length: 60 }, () => ({
    x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight,
    vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
    r: Math.random() * 1.5 + 0.3,
    color: colors[Math.floor(Math.random() * colors.length)],
    opacity: Math.random() * 0.5 + 0.1,
  }));
  function draw() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color + p.opacity + ')'; ctx.fill();
    });
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x, dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(108,99,255,${0.04 * (1 - dist / 120)})`;
          ctx.lineWidth = 0.5; ctx.stroke();
        }
      }
    }
    requestAnimationFrame(draw);
  }
  draw();
})();

/* ── 10. Animate score bars on scroll ── */
const barObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.querySelectorAll('.bar-fill').forEach(bar => {
        const w = bar.style.width; bar.style.width = '0';
        setTimeout(() => { bar.style.width = w; }, 200);
      });
    }
  });
}, { threshold: 0.3 });
document.querySelectorAll('.feedback-panel').forEach(el => barObserver.observe(el));

/* ══════════════════════════════════════════
   12. AUTH MODAL
══════════════════════════════════════════ */
function createAuthModal() {
  if (document.getElementById('authModal')) return;
  const modal = document.createElement('div');
  modal.id = 'authModal';
  modal.className = 'auth-modal';
  modal.innerHTML = `
    <div class="auth-dialog" role="dialog" aria-modal="true" aria-labelledby="authTitle">
      <button class="auth-close" type="button" aria-label="Close">×</button>
      <div class="auth-kicker">MockAI Account</div>
      <h3 id="authTitle">Sign in</h3>
      <p id="authSub">Continue your interview practice with saved progress and backend feedback.</p>
      <div class="auth-tabs" role="tablist">
        <button class="auth-tab active" type="button" data-auth-tab="login">Sign In</button>
        <button class="auth-tab" type="button" data-auth-tab="register">Register</button>
      </div>
      <form class="auth-form active" id="loginForm">
        <label>Email<input type="email" name="email" autocomplete="email" required></label>
        <label>Password<input type="password" name="password" autocomplete="current-password" required></label>
        <button class="auth-submit" type="submit">Sign In</button>
      </form>
      <form class="auth-form" id="registerForm">
        <label>Name<input type="text" name="name" autocomplete="name" required></label>
        <label>Email<input type="email" name="email" autocomplete="email" required></label>
        <label>Password<input type="password" name="password" autocomplete="new-password" minlength="6" required></label>
        <label>College<input type="text" name="college" autocomplete="organization"></label>
        <label>Target Role<input type="text" name="targetRole" placeholder="Software Engineer"></label>
        <button class="auth-submit" type="submit">Create Account</button>
      </form>
      <div id="verificationFallback" hidden></div>
    </div>`;
  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal || e.target.classList.contains('auth-close')) closeAuthModal(); });
  modal.querySelectorAll('[data-auth-tab]').forEach(tab => tab.addEventListener('click', () => switchAuthMode(tab.dataset.authTab)));
  document.getElementById('loginForm').addEventListener('submit', handleLoginSubmit);
  document.getElementById('registerForm').addEventListener('submit', handleRegisterSubmit);
}

function switchAuthMode(mode) {
  const isReg = mode === 'register';
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.toggle('active', t.dataset.authTab === mode));
  document.getElementById('loginForm').classList.toggle('active', !isReg);
  document.getElementById('registerForm').classList.toggle('active', isReg);
  document.getElementById('authTitle').textContent = isReg ? 'Create account' : 'Sign in';
  document.getElementById('authSub').textContent = isReg
    ? 'Create your account to save interview history and get personalized analytics.'
    : 'Continue your practice with saved progress.';
}
function openAuthModal(mode = 'login') { createAuthModal(); switchAuthMode(mode); document.getElementById('authModal').classList.add('open'); }
function closeAuthModal() { document.getElementById('authModal')?.classList.remove('open'); }

async function ensureBackendAvailable() {
  try {
    await MockAI.apiHealth();
    return true;
  } catch (error) {
    showToast(error.message, 'error');
    return false;
  }
}

function showVerificationFallback(url) {
  const box = document.getElementById('verificationFallback');
  if (!box || !url) return;

  box.hidden = false;
  box.className = 'verification-fallback';
  box.innerHTML = `
    <p>Email delivery failed in this environment. Use this local verification link:</p>
    <a href="${url}">Verify my account</a>
  `;
}

async function handleLoginSubmit(e) {
  e.preventDefault();
  const submit = e.currentTarget.querySelector('[type=submit]');
  const form = new FormData(e.currentTarget);
  setLoading(submit, true);
  try {
    if (!(await ensureBackendAvailable())) return;
    await authLogin(form.get('email'), form.get('password'));
    closeAuthModal(); updateAuthButtons();
    showToast('Signed in successfully!', 'success');
  } catch (err) { showToast(err.message, 'error'); }
  finally { setLoading(submit, false); }
}

async function handleRegisterSubmit(e) {
  e.preventDefault();
  const submit = e.currentTarget.querySelector('[type=submit]');
  const form = new FormData(e.currentTarget);
  setLoading(submit, true);
  try {
    if (!(await ensureBackendAvailable())) return;
    const data = await authRegister(form.get('name'), form.get('email'), form.get('password'), form.get('college'), form.get('targetRole'));
    switchAuthMode('login');
    if (data.verificationUrl) showVerificationFallback(data.verificationUrl);
    showToast(data.message || 'Account created! Please verify your email.', 'success');
  } catch (err) { showToast(err.message, 'error'); }
  finally { setLoading(submit, false); }
}

function updateAuthButtons() {
  const user = getUser?.();
  document.querySelectorAll('[data-auth-button="login"]').forEach(btn => {
    btn.textContent = user ? `Hi, ${user.name?.split(' ')[0] || 'there'}` : 'Sign In';
  });
}

/* ══════════════════════════════════════════
   13. DEMO CHAT — FULLY AI-POWERED
══════════════════════════════════════════ */
const conversationHistory = [
  { role: 'ai', content: "Hello! I'm Alex, your AI interviewer today. We'll be doing a Software Engineer interview for a senior role. Ready to begin?" },
  { role: 'user', content: "Yes, I'm ready! Let's do this." },
  { role: 'ai', content: "Great energy! Let's start. **Tell me about yourself and your most impactful project so far.**" },
];

let activeInterviewId = null;
let currentJobRole = 'Software Engineer';
let isTyping = false;

function addDemoMessage(text, isUser) {
  const messages = document.getElementById('demoMessages');
  if (!messages) return;
  const msg = document.createElement('div');
  msg.className = 'demo-msg' + (isUser ? ' user' : '');
  const formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
  msg.innerHTML = isUser
    ? `<div class="demo-ava user">ME</div><div class="demo-bubble">${formatted}</div>`
    : `<div class="demo-ava ai">🤖</div><div class="demo-bubble">${formatted}</div>`;
  messages.appendChild(msg);
  messages.scrollTop = messages.scrollHeight;
  conversationHistory.push({ role: isUser ? 'user' : 'ai', content: text });
}

function showTypingIndicator() {
  const messages = document.getElementById('demoMessages');
  if (!messages || isTyping) return;
  isTyping = true;
  const el = document.createElement('div');
  el.className = 'demo-msg'; el.id = 'typingIndicator';
  el.innerHTML = `<div class="demo-ava ai">🤖</div>
    <div class="demo-bubble"><div class="typing-indicator">
      <div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>
    </div></div>`;
  messages.appendChild(el); messages.scrollTop = messages.scrollHeight;
}

function removeTypingIndicator() {
  document.getElementById('typingIndicator')?.remove();
  isTyping = false;
}

function updateScores(feedback) {
  if (!feedback) return;

  const conf = Number(feedback.confidenceScore) || 0;
  const comm = Number(feedback.communicationScore) || 0;
  const tech = Number(feedback.technicalScore) || 0;
  ['conf','comm','tech'].forEach((k, i) => {
    const val = [conf, comm, tech][i];
    const scoreEl = document.getElementById(k + 'Score');
    const barEl   = document.getElementById(k + 'Bar');
    if (scoreEl) scoreEl.textContent = val + '%';
    if (barEl) barEl.style.width = val + '%';
  });
  const tips = feedback?.tips || [
    'Quantify your achievements with specific numbers and metrics.',
    'Use the STAR method — Situation, Task, Action, Result.',
    'Maintain a confident tone; avoid filler words.',
  ];
  ['tip1','tip2','tip3'].forEach((id, i) => {
    const el = document.getElementById(id);
    if (el && tips[i]) el.textContent = tips[i];
  });
}

async function sendDemoMessage() {
  const input = document.getElementById('demoInput');
  const sendBtn = document.getElementById('demoSend');
  const text = input?.value.trim();
  if (!text || isTyping) return;

  if (!isLoggedIn?.()) {
    openAuthModal('login');
    showToast('Sign in first so your AI interview can be saved.', 'info');
    return;
  }

  addDemoMessage(text, true);
  input.value = '';
  if (sendBtn) sendBtn.disabled = true;
  showTypingIndicator();

  try {
    if (!activeInterviewId) {
      const started = await interviewStart(currentJobRole, 'General', 'mixed', 'intermediate');
      activeInterviewId = started.interview._id;
    }

    const data = await interviewMessage(activeInterviewId, text);
    removeTypingIndicator();
    if (sendBtn) sendBtn.disabled = false;
    if (data.feedback) updateScores(data.feedback);
    if (data.aiMessage) addDemoMessage(data.aiMessage, false);
  } catch (err) {
    removeTypingIndicator();
    if (sendBtn) sendBtn.disabled = false;
    showToast(err.message || 'AI interview failed. Please try again.', 'error');
    console.error(err);
  }
}

document.getElementById('demoSend')?.addEventListener('click', sendDemoMessage);
document.getElementById('demoInput')?.addEventListener('keypress', e => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendDemoMessage(); }
});
window.loadQuestion = function(chip) {
  const q = chip.getAttribute('data-q');
  const messages = document.getElementById('demoMessages');
  if (!messages) return;
  const msg = document.createElement('div');
  msg.className = 'demo-msg';
  msg.innerHTML = `<div class="demo-ava ai">🤖</div><div class="demo-bubble"><strong>${q}</strong></div>`;
  messages.appendChild(msg);
  messages.scrollTop = messages.scrollHeight;
  document.getElementById('demoInput')?.focus();
};

/* ── Update role from selector ── */
document.querySelectorAll('.job-role-selector .role-chip').forEach(chip => {
  chip.addEventListener('click', function () {
    currentJobRole = this.textContent.trim();
  });
});

/* ══════════════════════════════════════════
   14. RESUME ANALYSIS — FULLY FUNCTIONAL
══════════════════════════════════════════ */
async function handleResumeUpload() {
  const fileInput = document.getElementById('resumeFile');
  const btn = document.getElementById('uploadResumeBtn');
  const resultEl = document.getElementById('resumeResult');
  const file = fileInput?.files[0];

  if (!file) { showToast('Please select a resume file first.', 'error'); return; }
  const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
  if (!allowed.some(t => file.type === t) && !file.name.match(/\.(pdf|doc|docx|txt)$/i)) {
    showToast('Please upload a PDF, DOC, DOCX, or TXT file.', 'error'); return;
  }

  setLoading(btn, true);
  if (resultEl) {
    resultEl.innerHTML = `<div class="resume-analyzing">
      <div class="resume-spinner"></div>
      <p>Analyzing your resume with the backend AI...</p>
    </div>`;
  }

  try {
    if (!(await ensureBackendAvailable())) {
      if (resultEl) resultEl.innerHTML = '';
      return;
    }

    const formData = new FormData();
    formData.append('resume', file);
    const selectedRole = document.querySelector('.job-role-selector .role-chip.active')?.textContent?.trim() || 'Software Engineer';
    formData.append('targetRole', selectedRole);

    const data = await MockAI.uploadResume(formData);
    if (!data.analysis) throw new Error('Resume analysis returned no result.');
    renderResumeResult(data.analysis);
  } catch (err) {
    showToast('Resume analysis failed: ' + err.message, 'error');
    if (resultEl) resultEl.innerHTML = '';
  } finally {
    setLoading(btn, false);
  }
}
function renderResumeResult(analysis) {
  const resultEl = document.getElementById('resumeResult');
  if (!resultEl) return;
  const ats = analysis.atsScore || 0;
  const color = ats >= 80 ? '#00ff88' : ats >= 60 ? '#FFB547' : '#ff5f5f';
  const skills = (analysis.skillsFound || []).map(s => `<span class="res-tag res-tag-good">${s}</span>`).join('');
  const missing = (analysis.missingSkills || []).map(s => `<span class="res-tag res-tag-miss">${s}</span>`).join('');
  const improvements = (analysis.improvements || []).map(i => `<li>${i}</li>`).join('');

  resultEl.innerHTML = `
    <div class="resume-result-card">
      <div class="resume-result-header">
        <div class="ats-score-ring">
          <svg viewBox="0 0 80 80" style="width:80px;height:80px;transform:rotate(-90deg)">
            <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="8"/>
            <circle cx="40" cy="40" r="32" fill="none" stroke="${color}" stroke-width="8"
              stroke-dasharray="${2 * Math.PI * 32}" stroke-dashoffset="${2 * Math.PI * 32 * (1 - ats/100)}"
              stroke-linecap="round" style="transition:stroke-dashoffset 1s ease"/>
          </svg>
          <div class="ats-score-num" style="color:${color}">${ats}%</div>
        </div>
        <div>
          <div style="font-weight:700;font-size:16px;margin-bottom:4px">ATS Compatibility Score</div>
          <div style="font-size:13px;color:rgba(240,242,255,0.5)">${analysis.summary || 'Analysis complete.'}</div>
        </div>
      </div>
      ${skills ? `<div class="resume-section"><div class="resume-section-label">✓ Skills Found</div><div class="res-tags">${skills}</div></div>` : ''}
      ${missing ? `<div class="resume-section"><div class="resume-section-label">⚠ Missing Keywords</div><div class="res-tags">${missing}</div></div>` : ''}
      ${improvements ? `<div class="resume-section"><div class="resume-section-label">💡 Improvements</div><ul class="res-improve-list">${improvements}</ul></div>` : ''}
    </div>`;
}

document.getElementById('uploadResumeBtn')?.addEventListener('click', handleResumeUpload);

/* ══════════════════════════════════════════
   15. START INTERVIEW BUTTON
══════════════════════════════════════════ */
async function startAIInterview(btn) {
  const role = document.querySelector('.job-role-selector .role-chip.active')?.textContent?.trim() || 'Software Engineer';
  const company = document.querySelector('[data-company].active')?.textContent?.trim() || 'General';
  currentJobRole = role;

  if (!isLoggedIn?.()) {
    openAuthModal('login');
    showToast('Sign in first so your interview can be saved and scored.', 'info');
    return;
  }

  setLoading(btn, true);
  showTypingIndicator();

  try {
    if (!(await ensureBackendAvailable())) return;

    const data = await interviewStart(role, company, 'mixed', 'intermediate');
    activeInterviewId = data.interview._id;

    const messages = document.getElementById('demoMessages');
    if (messages) {
      messages.innerHTML = '';
      conversationHistory.length = 0;
      (data.interview.messages || []).forEach(m => addDemoMessage(m.content, m.role === 'user'));
    }

    showToast(`AI interview started for ${role}.`, 'success');
    document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' });
  } catch (err) {
    showToast('Failed to start interview: ' + err.message, 'error');
    console.error(err);
  } finally {
    removeTypingIndicator();
    setLoading(btn, false);
  }
}
/* ══════════════════════════════════════════
   16. WIRE UP ALL BUTTONS
══════════════════════════════════════════ */
function initAllButtons() {
  createAuthModal();

  document.querySelectorAll('button').forEach(btn => {
    const text = btn.textContent.replace(/\s+/g, ' ').trim().toLowerCase();

    // Sign In
    if ((text === 'sign in' || btn.dataset.authButton === 'login') && !btn.dataset.wired) {
      btn.dataset.authButton = 'login';
      btn.dataset.wired = '1';
      btn.addEventListener('click', () => openAuthModal('login'));
    }
    // Get Started / Register
    if ((text.includes('get started') || text.includes('start pro trial')) && !btn.dataset.wired) {
      btn.dataset.wired = '1';
      btn.addEventListener('click', () => openAuthModal('register'));
    }
    // CTA final buttons
    if (text.includes('get started free') && !btn.dataset.wired) {
      btn.dataset.wired = '1';
      btn.addEventListener('click', () => { document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' }); });
    }
    // "Talk to Placement Team"
    if (text.includes('talk to placement') && !btn.dataset.wired) {
      btn.dataset.wired = '1';
      btn.addEventListener('click', () => showToast('📧 Opening contact form — reach us at hello@mockai.in', 'info'));
    }
  });

  // Start Interview buttons (class .start-btn)
  document.querySelectorAll('.start-btn').forEach(btn => {
    if (btn.id === 'uploadResumeBtn') return; // already wired
    if (!btn.dataset.wired) {
      btn.dataset.wired = '1';
      btn.addEventListener('click', () => startAIInterview(btn));
    }
  });
  ensureBackendAvailable().then(available => {
    console.log(`Backend: ${available ? 'online' : 'offline'}`);
  });
}

// Make globally available
window.openAuthModal = openAuthModal;
window.closeAuthModal = closeAuthModal;

/* ══════════════════════════════════════════
   17. DYNAMIC DASHBOARD (pull real data if available)
══════════════════════════════════════════ */
async function loadDashboard() {
  try {
    if (!isLoggedIn?.()) return; // keep static preview

    const [dashData] = await Promise.all([MockAI.dashboardGet()]);
    if (!dashData?.data) return;

    const d = dashData.data;
    // Update stat cards
    const statVals = document.querySelectorAll('.dash-stat-val');
    if (statVals[0]) statVals[0].textContent = d.totalSessions || '0';
    if (statVals[1]) statVals[1].textContent = (d.avgScore || '0') + '%';
    if (statVals[2]) statVals[2].textContent = (d.practiceHours || '0') + 'h';
  } catch (e) {
    console.warn('Dashboard data unavailable:', e.message);
  }
}

/* ══════════════════════════════════════════
   18. EMAIL VERIFICATION
══════════════════════════════════════════ */
async function handleEmailVerification() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  if (!token) return;
  try {
    const data = await MockAI.authVerifyEmail(token);
    updateAuthButtons();
    showToast(data.message || 'Email verified!', 'success');
    window.history.replaceState({}, '', '#dashboard');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

/* ══════════════════════════════════════════
   19. INIT
══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  initAllButtons();
  loadDashboard();
  handleEmailVerification();
});

// Also init immediately in case DOMContentLoaded already fired
if (document.readyState !== 'loading') {
  initAllButtons();
}
document.querySelectorAll('[data-company]').forEach(chip => {
  chip.addEventListener('click', function () {
    document.querySelectorAll('[data-company]').forEach(c => {
      c.classList.remove('active');
    });

    this.classList.add('active');
  });
});