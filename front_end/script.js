/* ============================================================
   MockAI — Main Application Script
   Handles UI, AI interview flow, voice engine, dashboard,
   auth modal, resume upload, and all event wiring.

   Depends on: api.js (must load first)
   ============================================================ */

/* ── Global error handler — prevents white screen on JS errors ── */
window.onerror = function (msg, src, line, col, err) {
  console.warn('[MockAI Error]', msg, 'at', src + ':' + line);
  _forceHideLoader();
  return false;
};
window.addEventListener('unhandledrejection', function (e) {
  console.warn('[MockAI Unhandled Promise]', e.reason);
});

/* ════════════════════════════════════
   LOADER
════════════════════════════════════ */

// Hard 3-second fallback in case the window 'load' event never fires
// (e.g. a CDN script stalls or a resource 404s)
function _forceHideLoader() {
  try {
    var l = document.getElementById('loader');
    if (!l || l.style.display === 'none') return;
    l.style.transition = 'opacity 0.5s ease';
    l.style.opacity = '0';
    setTimeout(function () { if (l) l.style.display = 'none'; }, 500);
  } catch (e) {}
}

var _loaderFallback = setTimeout(_forceHideLoader, 3000);

window.addEventListener('load', function () {
  clearTimeout(_loaderFallback);
  setTimeout(_forceHideLoader, 800);
});

// If the page was already loaded before this script ran
if (document.readyState === 'complete') {
  clearTimeout(_loaderFallback);
  setTimeout(_forceHideLoader, 800);
}

/* ════════════════════════════════════
   TOAST NOTIFICATIONS
════════════════════════════════════ */

// Shows a small toast at the bottom-right corner.
// type: 'success' | 'error' | 'info' | 'warning'
function showToast(msg, type) {
  type = type || 'info';
  try {
    var t = document.getElementById('toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'toast';
      document.body.appendChild(t);
    }

    var colors = { success: '#10b981', error: '#ef4444', info: '#6366f1', warning: '#f59e0b' };
    var icons  = { success: '✓', error: '!', info: 'i', warning: '!' };
    var color  = colors[type] || colors.info;

    t.style.borderLeftColor = color;
    t.innerHTML = '';

    var iconEl = document.createElement('span');
    iconEl.style.cssText = 'color:' + color + ';font-weight:800;font-size:16px';
    iconEl.textContent = icons[type] || 'i';

    var msgEl = document.createElement('span');
    msgEl.style.flex = '1';
    msgEl.textContent = msg; // textContent prevents XSS

    var closeEl = document.createElement('button');
    closeEl.style.cssText = 'background:none;border:none;color:rgba(238,242,255,0.4);font-size:18px;line-height:1;cursor:pointer';
    closeEl.textContent = '×';
    closeEl.setAttribute('aria-label', 'Close notification');
    closeEl.addEventListener('click', function () { t.classList.remove('show'); });

    t.appendChild(iconEl);
    t.appendChild(msgEl);
    t.appendChild(closeEl);
    t.classList.add('show');

    clearTimeout(t._timer);
    t._timer = setTimeout(function () { t.classList.remove('show'); }, 5000);
  } catch (e) {
    console.warn('Toast error:', e);
  }
}
window.showToast = showToast;

/* ── Button loading state helper ── */
function setLoading(btn, loading) {
  if (!btn) return;
  try {
    if (loading) {
      btn.disabled = true;
      btn.dataset.orig = btn.innerHTML;
      btn.innerHTML = '<span style="display:inline-flex;align-items:center;gap:8px"><span class="mini-spinner"></span>Loading…</span>';
    } else {
      btn.disabled = false;
      btn.innerHTML = btn.dataset.orig || btn.innerHTML;
    }
  } catch (e) {}
}
window.setLoading = setLoading;

/* ════════════════════════════════════
   THREE.JS 3D BACKGROUND
════════════════════════════════════ */

// Skip on mobile to save battery. Gracefully skipped if CDN fails.
(function initThree() {
  if (window.innerWidth < 768 || navigator.maxTouchPoints > 1) return;

  var script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
  script.onerror = function () { console.warn('[Three.js] CDN failed — skipping 3D background'); };
  script.onload = function () {
    setTimeout(function () {
      try { _initThreeScene(); }
      catch (e) { console.warn('[Three.js] Scene init failed:', e.message); }
    }, 50);
  };
  document.head.appendChild(script);
})();

function _initThreeScene() {
  if (typeof THREE === 'undefined') return;
  var canvas = document.getElementById('bg-canvas');
  if (!canvas) return;

  var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  var scene  = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 5;

  // Floating particle nodes
  var nodes   = [];
  var nodeGeo = new THREE.SphereGeometry(0.04, 8, 8);
  var nodeMat = new THREE.MeshBasicMaterial({ color: 0x6366f1, transparent: true, opacity: 0.6 });
  for (var i = 0; i < 80; i++) {
    var m = new THREE.Mesh(nodeGeo, nodeMat.clone());
    m.position.set((Math.random() - 0.5) * 16, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 8);
    m.userData = { vx: (Math.random() - 0.5) * 0.003, vy: (Math.random() - 0.5) * 0.003 };
    scene.add(m);
    nodes.push(m);
  }

  var lineMat   = new THREE.LineBasicMaterial({ color: 0x6366f1, transparent: true, opacity: 0.08 });
  var lineGroup = new THREE.Group();
  scene.add(lineGroup);

  // Decorative torus rings
  var torus  = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.008, 16, 120), new THREE.MeshBasicMaterial({ color: 0x6366f1, transparent: true, opacity: 0.12 }));
  torus.rotation.x = 0.4;
  scene.add(torus);

  var torus2 = new THREE.Mesh(new THREE.TorusGeometry(3.2, 0.005, 16, 120), new THREE.MeshBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.08 }));
  torus2.rotation.x = -0.3; torus2.rotation.y = 0.5;
  scene.add(torus2);

  var ico = new THREE.Mesh(new THREE.IcosahedronGeometry(1.5, 1), new THREE.MeshBasicMaterial({ color: 0x8b5cf6, wireframe: true, transparent: true, opacity: 0.05 }));
  scene.add(ico);

  // Subtle mouse parallax
  var mouse = { x: 0, y: 0 };
  document.addEventListener('mousemove', function (e) {
    mouse.x =  (e.clientX / window.innerWidth  - 0.5) * 2;
    mouse.y = -(e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  var frame = 0;
  function animate() {
    requestAnimationFrame(animate);
    frame++;
    torus.rotation.z  += 0.0015; torus.rotation.y  += 0.001;
    torus2.rotation.z -= 0.001;  torus2.rotation.x += 0.0008;
    ico.rotation.y    += 0.002;  ico.rotation.x    += 0.001;

    camera.position.x += (mouse.x * 0.3 - camera.position.x) * 0.04;
    camera.position.y += (mouse.y * 0.2 - camera.position.y) * 0.04;

    nodes.forEach(function (n) {
      n.position.x += n.userData.vx;
      n.position.y += n.userData.vy;
      if (Math.abs(n.position.x) > 8) n.userData.vx *= -1;
      if (Math.abs(n.position.y) > 5) n.userData.vy *= -1;
    });

    // Rebuild connection lines every 60 frames (performance)
    if (frame % 60 === 0) {
      while (lineGroup.children.length) lineGroup.remove(lineGroup.children[0]);
      for (var a = 0; a < nodes.length; a++) {
        for (var b = a + 1; b < nodes.length; b++) {
          if (nodes[a].position.distanceTo(nodes[b].position) < 2.5) {
            var geo = new THREE.BufferGeometry().setFromPoints([nodes[a].position, nodes[b].position]);
            lineGroup.add(new THREE.Line(geo, lineMat));
          }
        }
      }
    }
    renderer.render(scene, camera);
  }
  animate();
}

/* ════════════════════════════════════
   SCROLL REVEAL
════════════════════════════════════ */

// Uses IntersectionObserver to animate elements into view as the user scrolls.
// Falls back to making everything visible immediately on older browsers.
function _initScrollReveal() {
  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll('.reveal,.reveal-right').forEach(function (el) {
      el.classList.add('visible');
    });
    return;
  }

  var ro = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        var delay = parseFloat(e.target.style.transitionDelay || '0') * 1000;
        setTimeout(function () { e.target.classList.add('visible'); }, delay);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal,.reveal-right').forEach(function (el) { ro.observe(el); });
}

/* ════════════════════════════════════
   NAVIGATION
════════════════════════════════════ */

function _initNav() {
  // Add 'scrolled' class to nav when user scrolls past 50px
  window.addEventListener('scroll', function () {
    var nav = document.getElementById('nav');
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 50);
  }, { passive: true });

  // Hamburger opens mobile menu
  var hamburger   = document.getElementById('hamburger');
  var mobileMenu  = document.getElementById('mobileMenu');
  var mobileClose = document.getElementById('mobileClose');

  if (hamburger)   hamburger.addEventListener('click',   function () { mobileMenu && mobileMenu.classList.add('open'); });
  if (mobileClose) mobileClose.addEventListener('click', function () { mobileMenu && mobileMenu.classList.remove('open'); });

  // Close mobile menu when a nav link is tapped
  document.querySelectorAll('.mm-link').forEach(function (a) {
    a.addEventListener('click', function () { mobileMenu && mobileMenu.classList.remove('open'); });
  });
}

/* ════════════════════════════════════
   SMOOTH SCROLL
════════════════════════════════════ */

function _initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var target = document.querySelector(a.getAttribute('href'));
      if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth' }); }
    });
  });
}

/* ════════════════════════════════════
   FAQ ACCORDION
════════════════════════════════════ */

// Called from onclick in HTML. Toggles the clicked FAQ item open/closed.
window.toggleFaq = function (btn) {
  if (!btn) return;
  var item = btn.parentElement;
  if (!item) return;
  var a    = item.querySelector('.faq-a');
  if (!a)  return;
  var open = item.classList.contains('open');

  // Close all items first
  document.querySelectorAll('.faq-item').forEach(function (f) {
    f.classList.remove('open');
    var fa = f.querySelector('.faq-a');
    if (fa) fa.style.maxHeight = '0';
  });

  // Open the clicked one if it was closed
  if (!open) {
    item.classList.add('open');
    a.style.maxHeight = a.scrollHeight + 'px';
  }
};

/* ════════════════════════════════════
   BACKEND HEALTH CHECK
════════════════════════════════════ */

// Pings the backend before any API call. Returns false and shows a toast if unreachable.
async function checkBackend() {
  try {
    if (typeof MockAI === 'undefined' || typeof MockAI.apiHealth !== 'function') {
      showToast('Service unavailable. Please refresh.', 'error');
      return false;
    }
    await MockAI.apiHealth();
    return true;
  } catch (err) {
    showToast(err && err.message ? err.message : 'Cannot reach server.', 'error');
    return false;
  }
}

/* ════════════════════════════════════
   RESUME UPLOAD
════════════════════════════════════ */

// Wires up role chip selection and file input display for both
// the landing page resume panel and the dashboard resume panel.
function _initResumeChips() {
  document.querySelectorAll('.role-chips .role-chip').forEach(function (chip) {
    chip.addEventListener('click', function () {
      var siblings = this.closest('.role-chips');
      if (siblings) siblings.querySelectorAll('.role-chip').forEach(function (c) { c.classList.remove('active'); });
      this.classList.add('active');
    });
  });

  // Show selected filename in the landing page drop zone
  var resumeFile = document.getElementById('resumeFile');
  if (resumeFile) {
    resumeFile.addEventListener('change', function () {
      var disp = document.getElementById('resumeFileName');
      if (disp && this.files[0]) disp.textContent = '📄 ' + this.files[0].name;
    });
  }

  // Show selected filename in the dashboard drop zone
  var dashFile = document.getElementById('dashResumeFile');
  if (dashFile) {
    dashFile.addEventListener('change', function () {
      var drop = document.getElementById('dashResumeDrop');
      if (drop && this.files[0]) {
        var dt = drop.querySelector('.drop-text');
        if (dt) dt.textContent = '📄 ' + this.files[0].name;
      }
    });
  }
}

// Handles the actual resume upload and renders the AI analysis result.
// fileInputId — the <input type="file"> element ID
// btnId       — the analyze button ID (for loading state)
// resultId    — the container where the result card is rendered
// roleSel     — CSS selector for the role chips container
async function handleResumeUpload(fileInputId, btnId, resultId, roleSel) {
  var fileInput = document.getElementById(fileInputId);
  var btn       = document.getElementById(btnId);
  var resultEl  = document.getElementById(resultId);
  var file      = fileInput && fileInput.files[0];

  if (!file) { showToast('Please select a resume file first.', 'error'); return; }

  setLoading(btn, true);
  if (resultEl) resultEl.innerHTML = '<div class="resume-analyzing"><div class="mini-spinner" style="width:24px;height:24px;border-width:3px"></div><p>AI is analyzing your resume…</p></div>';

  try {
    var available = await checkBackend();
    if (!available) { if (resultEl) resultEl.innerHTML = ''; return; }

    if (typeof MockAI === 'undefined' || typeof MockAI.uploadResume !== 'function') {
      showToast('Resume service not available.', 'error');
      if (resultEl) resultEl.innerHTML = '';
      return;
    }

    var formData = new FormData();
    formData.append('resume', file);

    var activeChip = document.querySelector(roleSel + ' .role-chip.active');
    var role = activeChip ? (activeChip.dataset.role || 'Software Engineer') : 'Software Engineer';
    formData.append('targetRole', role);

    var data = await MockAI.uploadResume(formData);
    if (!data || !data.analysis) throw new Error('No analysis returned.');
    renderResumeResult(data.analysis, resultEl);
  } catch (err) {
    showToast('Resume analysis failed: ' + (err.message || 'Unknown error'), 'error');
    if (resultEl) resultEl.innerHTML = '';
  } finally {
    setLoading(btn, false);
  }
}

// Renders the ATS score ring + skills/improvements into the result container.
function renderResumeResult(analysis, el) {
  if (!el || !analysis) return;
  var ats  = analysis.atsScore || 0;
  var col  = ats >= 80 ? '#10b981' : ats >= 60 ? '#f59e0b' : '#ef4444';
  var circ = 2 * Math.PI * 28;

  var skills    = (analysis.skillsFound   || []).map(function (s) { return '<span class="res-tag good">' + _esc(s) + '</span>'; }).join('');
  var missing   = (analysis.missingSkills || []).map(function (s) { return '<span class="res-tag miss">' + _esc(s) + '</span>'; }).join('');
  var strengths = (analysis.strengths     || []).map(function (s) { return '<li>' + _esc(s) + '</li>'; }).join('');
  var improv    = (analysis.improvements  || []).map(function (i) { return '<li>' + _esc(i) + '</li>'; }).join('');

  el.innerHTML =
    '<div class="resume-result-card">'
    + '<div class="resume-result-header">'
    + '<div class="ats-ring-wrap" style="width:72px;height:72px;flex-shrink:0">'
    + '<svg viewBox="0 0 72 72" width="72" height="72" style="transform:rotate(-90deg)">'
    + '<circle cx="36" cy="36" r="28" fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="7"/>'
    + '<circle cx="36" cy="36" r="28" fill="none" stroke="' + col + '" stroke-width="7"'
    + ' stroke-dasharray="' + circ + '" stroke-dashoffset="' + (circ * (1 - ats / 100)) + '"'
    + ' stroke-linecap="round" style="transition:stroke-dashoffset 1s ease"/>'
    + '</svg><div class="ats-score-num" style="color:' + col + '">' + ats + '%</div></div>'
    + '<div><div style="font-weight:700;font-size:15px;margin-bottom:4px">ATS Score</div>'
    + '<div style="font-size:12px;color:var(--muted)">' + _esc(analysis.summary || 'Analysis complete.') + '</div>'
    + '</div></div>'
    + (skills    ? '<div><div class="resume-section-label">✓ Skills Detected</div><div class="res-tags">'    + skills    + '</div></div>' : '')
    + (missing   ? '<div><div class="resume-section-label">⚠ Missing Keywords</div><div class="res-tags">'  + missing   + '</div></div>' : '')
    + (strengths ? '<div><div class="resume-section-label">💪 Strengths</div><ul class="res-improve-list">' + strengths + '</ul></div>'   : '')
    + (improv    ? '<div><div class="resume-section-label">💡 Improvements</div><ul class="res-improve-list">' + improv + '</ul></div>'   : '')
    + '</div>';
}

// Escapes HTML special characters to prevent XSS in rendered content
function _esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ════════════════════════════════════
   AUTH MODAL
════════════════════════════════════ */

// Opens the auth modal and switches to the given tab ('login' or 'register')
function openAuthModal(mode) {
  mode = mode || 'login';
  var m = document.getElementById('authModal');
  if (m) m.classList.add('open');
  switchAuth(mode);
}

// Closes the auth modal
function closeAuthModal() {
  var m = document.getElementById('authModal');
  if (m) m.classList.remove('open');
}

window.openAuthModal  = openAuthModal;
window.closeAuthModal = closeAuthModal;

// Switches between the Sign In and Register tabs inside the modal
window.switchAuth = function (mode) {
  document.querySelectorAll('.mtab').forEach(function (t) {
    t.classList.toggle('active', t.dataset.tab === mode);
  });
  var lf = document.getElementById('loginForm');
  var rf = document.getElementById('registerForm');
  if (lf) lf.classList.toggle('active', mode === 'login');
  if (rf) rf.classList.toggle('active', mode === 'register');
  var h = document.getElementById('modalTitle');
  if (h) h.textContent = mode === 'register' ? 'Create Account' : 'Sign In';
};

function _initAuthModal() {
  var modal = document.getElementById('authModal');
  if (modal) {
    // Close modal when clicking the dark backdrop
    modal.addEventListener('click', function (e) {
      if (e.target === modal) closeAuthModal();
    });
  }

  // Login form submission
  var loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      var btn = e.currentTarget.querySelector('button[type=submit]');
      var fd  = new FormData(e.currentTarget);
      setLoading(btn, true);
      try {
        var ok = await checkBackend();
        if (!ok) return;
        if (typeof authLogin !== 'function') throw new Error('Auth service not ready.');
        await authLogin(fd.get('email'), fd.get('password'));
        closeAuthModal();
        showToast('Welcome back!', 'success');
        updateAuthUI();
        loadDashboard();
      } catch (err) {
        showToast(err && err.message ? err.message : 'Login failed.', 'error');
      } finally {
        setLoading(btn, false);
      }
    });
  }

  // Register form submission
  var regForm = document.getElementById('registerForm');
  if (regForm) {
    regForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      var btn = e.currentTarget.querySelector('button[type=submit]');
      var fd  = new FormData(e.currentTarget);
      setLoading(btn, true);
      try {
        var ok = await checkBackend();
        if (!ok) return;
        if (typeof authRegister !== 'function') throw new Error('Auth service not ready.');
        var data = await authRegister(fd.get('name'), fd.get('email'), fd.get('password'), fd.get('college'), fd.get('targetRole'));
        switchAuth('login');
        if (data && data.verificationUrl) {
          var vb = document.getElementById('verificationBox');
          if (vb) {
            vb.style.display = 'block';
            vb.innerHTML = '<p>Verify your email: <a href="' + _esc(data.verificationUrl) + '">Click here</a></p>';
          }
        }
        showToast((data && data.message) || 'Account created! Please verify your email.', 'success');
      } catch (err) {
        showToast(err && err.message ? err.message : 'Registration failed.', 'error');
      } finally {
        setLoading(btn, false);
      }
    });
  }
}

/* ════════════════════════════════════
   AUTH UI STATE
════════════════════════════════════ */

// Updates the nav button and dashboard header to reflect the logged-in user
function updateAuthUI() {
  try {
    var user     = (typeof getUser    === 'function') ? getUser()    : null;
    var loggedIn = (typeof isLoggedIn === 'function') ? isLoggedIn() : false;

    var navBtn = document.getElementById('navSignIn');
    if (navBtn) {
      navBtn.textContent = (user && user.name) ? ('Hi, ' + user.name.split(' ')[0]) : 'Sign In';
      navBtn.onclick = loggedIn ? null : function () { openAuthModal('login'); };
    }

    var ava  = document.getElementById('dashAva');
    var name = document.getElementById('dashName');
    var plan = document.getElementById('dashPlan');
    if (user) {
      var initials = user.name
        ? user.name.split(' ').map(function (w) { return w[0]; }).join('').toUpperCase().slice(0, 2)
        : 'ME';
      if (ava)  ava.textContent  = initials;
      if (name) name.textContent = user.name  || 'User';
      if (plan) plan.textContent = user.plan  || 'Free';
    }
  } catch (e) {
    console.warn('updateAuthUI error:', e);
  }
}

/* ════════════════════════════════════
   AI INTERVIEW PANEL (text mode)
════════════════════════════════════ */

var aiMode        = 'mixed';   // current interview mode
var aiInterviewId = null;      // active interview session ID from backend
var aiIsTyping    = false;     // prevents double-sends while AI is responding

var modeLabels = {
  mixed:     'Full Mock Interview',
  hr:        'HR Behavioral Interview',
  technical: 'Technical Coding Interview'
};

var modeIntros = {
  mixed:     "Hello! I'm Alex, your AI interviewer. I'll mix behavioral and technical questions. Say **Ready** or type your answer to begin!",
  hr:        "Hi! I'm Alex. Today we're focusing on **HR and behavioral** questions using the STAR method. Tell me about yourself to start!",
  technical: "Hey! I'm Alex. Let's dive into **technical questions** — DS&A, system design, and problem-solving. Ready for your first problem?"
};

// Switches the AI panel to a different interview mode.
// Called from onclick attributes on the mode buttons and feature cards.
window.setAIMode = function (mode) {
  aiMode = mode;

  document.querySelectorAll('.ai-mode-btn').forEach(function (b) {
    b.classList.toggle('active', b.dataset.mode === mode);
  });

  var label = document.getElementById('aiModeLabel');
  if (label) label.textContent = modeLabels[mode] || mode;

  // Show code editor only in technical mode
  var techWrap = document.getElementById('techEditorWrap');
  if (techWrap) techWrap.style.display = mode === 'technical' ? 'block' : 'none';

  // Reset the session so a new interview starts fresh
  aiInterviewId = null;

  var msgs = document.getElementById('aiMessages');
  if (msgs) {
    msgs.innerHTML = '';
    addAIMsg(modeIntros[mode] || modeIntros.mixed, false);
  }

  updateFeedback(null);
};

// Appends a message bubble to the chat window.
// isUser = true renders it as the user's bubble (right-aligned, blue tint)
function addAIMsg(text, isUser) {
  var msgs = document.getElementById('aiMessages');
  if (!msgs) return;
  var div = document.createElement('div');
  div.className = 'ai-msg-bubble ' + (isUser ? 'user-bubble' : 'ai-bubble');
  // Allow **bold** markdown in AI messages
  div.innerHTML = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

// Shows the animated typing indicator while waiting for the AI response
function showAITyping() {
  var msgs = document.getElementById('aiMessages');
  if (!msgs || aiIsTyping) return;
  aiIsTyping = true;
  var div = document.createElement('div');
  div.id = 'aiTyping';
  div.className = 'ai-msg-bubble ai-bubble';
  div.innerHTML = '<span class="dot-typing"><span></span><span></span><span></span></span>';
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

function hideAITyping() {
  var el = document.getElementById('aiTyping');
  if (el) el.remove();
  aiIsTyping = false;
}

// Updates the live score bars and tips panel after each AI response
function updateFeedback(feedback) {
  var fields = [
    ['fConf', 'fConfVal', feedback && feedback.confidenceScore],
    ['fComm', 'fCommVal', feedback && feedback.communicationScore],
    ['fTech', 'fTechVal', feedback && feedback.technicalScore],
  ];
  fields.forEach(function (f) {
    var bar   = document.getElementById(f[0]);
    var val   = document.getElementById(f[1]);
    var score = f[2];
    if (bar) bar.style.width = score ? score + '%' : '0%';
    if (val) val.textContent = score ? score + '%' : '—';
  });

  var tips = feedback && feedback.tips;
  if (tips && tips.length) {
    var list = document.getElementById('tipsList');
    if (list) list.innerHTML = tips.map(function (t) { return '<div class="tip-item">' + _esc(t) + '</div>'; }).join('');
  }
}

// Sends the user's typed answer to the backend AI and displays the response.
// Requires the user to be logged in — prompts auth modal if not.
async function sendAIMessage() {
  var input   = document.getElementById('aiInput');
  var code    = document.getElementById('codeEditor');
  var sendBtn = document.getElementById('aiSend');
  var text    = input && input.value.trim();
  if (!text || aiIsTyping) return;

  // Append code solution to the message in technical mode
  if (aiMode === 'technical' && code && code.value.trim()) {
    text += '\n\n**My Code Solution:**\n```\n' + code.value.trim() + '\n```';
    code.value = '';
  }

  var loggedIn = (typeof isLoggedIn === 'function') ? isLoggedIn() : false;
  if (!loggedIn) {
    openAuthModal('login');
    showToast('Sign in to save your interview session.', 'info');
    return;
  }

  // Show user message and clear input
  addAIMsg(text.replace(/\n\n\*\*My Code[\s\S]*$/, ''), true);
  if (input) input.value = '';
  if (sendBtn) sendBtn.disabled = true;
  showAITyping();

  try {
    if (typeof interviewStart !== 'function' || typeof interviewMessage !== 'function') {
      throw new Error('Interview service not ready.');
    }

    // Start a new interview session if one isn't active yet
    if (!aiInterviewId) {
      var started = await interviewStart('Software Engineer', 'General', aiMode, 'intermediate');
      aiInterviewId = started.interview._id;
    }

    var data = await interviewMessage(aiInterviewId, text);
    hideAITyping();
    if (sendBtn) sendBtn.disabled = false;
    if (data.feedback)  updateFeedback(data.feedback);
    if (data.aiMessage) addAIMsg(data.aiMessage, false);
  } catch (err) {
    hideAITyping();
    if (sendBtn) sendBtn.disabled = false;
    showToast((err && err.message) || 'AI interview error. Try again.', 'error');
  }
}

function _initAIPanel() {
  var aiSend = document.getElementById('aiSend');
  if (aiSend) aiSend.addEventListener('click', sendAIMessage);

  var aiInput = document.getElementById('aiInput');
  if (aiInput) {
    aiInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAIMessage(); }
    });
  }
}

// Loads a quick-start question into the chat as an AI prompt bubble.
// The user can then type their answer in the input box.
window.loadQuick = function (chip) {
  if (!chip) return;
  var q    = chip.dataset.q;
  var msgs = document.getElementById('aiMessages');
  if (!msgs || !q) return;
  var div = document.createElement('div');
  div.className = 'ai-msg-bubble ai-bubble';
  div.innerHTML = '<strong>' + _esc(q) + '</strong>';
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
  var aiInput = document.getElementById('aiInput');
  if (aiInput) aiInput.focus();
};

/* ════════════════════════════════════
   DASHBOARD
════════════════════════════════════ */

// Switches the active dashboard panel.
// Works for both the top tab bar (.dash-tab) and the sidebar (.ds-item).
function switchDashTab(tab) {
  if (!tab) return;

  // Update top tabs
  document.querySelectorAll('.dash-tab').forEach(function (t) {
    t.classList.toggle('active', t.dataset.tab === tab);
  });

  // Update sidebar items
  document.querySelectorAll('.ds-item').forEach(function (item) {
    item.classList.toggle('active', item.dataset.section === tab);
  });

  // Show the matching panel, hide all others
  document.querySelectorAll('.dash-panel').forEach(function (p) {
    p.classList.toggle('active', p.id === 'panel-' + tab);
  });
}
window.switchDashTab = switchDashTab;

// Formats a date string into a human-readable relative label
function relDate(d) {
  try {
    var diff = Date.now() - new Date(d).getTime();
    var days = Math.floor(diff / 86400000);
    return days === 0 ? 'Today' : days === 1 ? 'Yesterday' : (days + 'd ago');
  } catch (e) { return '—'; }
}

// Returns a CSS class for a score pill based on the score value
function scoreClass(s) {
  return s >= 80 ? 'sp-hi' : s >= 65 ? 'sp-mid' : 'sp-lo';
}

// Convenience helpers for updating DOM text and bar widths
function setText(id, val) {
  var el = document.getElementById(id);
  if (el) el.textContent = val;
}
function setTextClass(id, val, cls) {
  var el = document.getElementById(id);
  if (el) { el.textContent = val; el.className = 'ds-card-change ' + (cls || ''); }
}
function setBar(barId, valId, score) {
  var bar = document.getElementById(barId);
  var val = document.getElementById(valId);
  if (bar) bar.style.width = (score || 0) + '%';
  if (val) val.textContent = score ? score + '%' : '—';
}

// Loads all dashboard data from the backend and populates every panel.
// Only runs when the user is logged in.
async function loadDashboard() {
  updateAuthUI();
  var loggedIn = (typeof isLoggedIn === 'function') ? isLoggedIn() : false;
  if (!loggedIn) return;

  try {
    if (typeof MockAI === 'undefined' || typeof MockAI.dashboardGet !== 'function') return;
    var res = await MockAI.dashboardGet();
    if (!res || !res.dashboard) return;
    var d = res.dashboard;

    // Overview stats
    var tot    = d.totalInterviews || (d.stats && d.stats.totalSessions) || 0;
    var avg    = (d.stats && d.stats.avgScore) || (d.weeklyScores && d.weeklyScores.length
      ? Math.round(d.weeklyScores.reduce(function (s, w) { return s + (w.score || 0); }, 0) / d.weeklyScores.length)
      : 0);
    var hrs    = (d.stats && d.stats.practiceHours) || 0;
    var streak = (d.stats && d.stats.streak) || 0;
    var inp    = d.inProgress || 0;

    setText('dsTotalSessions', tot);
    setText('dsAvgScore', avg + '%');
    setText('dsPracticeHours', hrs + 'h');
    setText('dsStreak', streak);
    setTextClass('dsInProgress', inp > 0 ? ('↑ ' + inp + ' in progress') : (tot + ' completed'), inp > 0 ? 'up' : '');
    setTextClass('dsScoreChange', avg >= 70 ? '↑ Good performance' : '↗ Keep practicing', 'up');
    setTextClass('dsHoursChange', tot + ' total sessions', '');

    // Score trend mini-chart
    if (d.weeklyScores && d.weeklyScores.length) {
      var bars = document.querySelectorAll('.mc-bar');
      var mc   = document.getElementById('mcEmpty');
      if (mc) mc.style.display = 'none';
      var scores = d.weeklyScores.slice(-10);
      var mx = Math.max.apply(null, scores.map(function (s) { return s.score || 0; }).concat([1]));
      bars.forEach(function (bar, i) {
        var s = scores[i];
        bar.style.height = s ? Math.max(8, Math.round((s.score / mx) * 90)) + '%' : '8%';
        bar.title = s ? (s.score + '% — ' + relDate(s.date)) : '';
      });
    }

    // Skill breakdown bars
    if (d.skillBreakdown) {
      var sb = d.skillBreakdown;
      setBar('sbComm', 'sbCommVal', sb.communication);
      setBar('sbTech', 'sbTechVal', sb.technical);
      setBar('sbConf', 'sbConfVal', sb.confidence);
    }

    setText('dsBadge', d.totalInterviews || 0);

    // Recent sessions table
    var tbody = document.getElementById('historyTbody');
    if (tbody) {
      if (d.recentInterviews && d.recentInterviews.length) {
        tbody.innerHTML = d.recentInterviews.map(function (iv) {
          var score = (iv.feedback && iv.feedback.overallScore) || 0;
          var type  = (iv.interviewType || 'mixed').replace(/-/g, ' ');
          return '<tr>'
            + '<td>' + _esc(iv.jobRole || 'Interview') + '</td>'
            + '<td>' + _esc(iv.company || '—') + '</td>'
            + '<td style="text-transform:capitalize">' + _esc(type) + '</td>'
            + '<td><span class="score-pill ' + scoreClass(score) + '">' + score + '%</span></td>'
            + '<td>' + relDate(iv.createdAt) + '</td>'
            + '</tr>';
        }).join('');
      } else {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-row">No sessions yet — start your first AI interview! 🚀</td></tr>';
      }
    }

    // AI recommendations panel
    if (d.recommendations && d.recommendations.length) {
      var panel = document.getElementById('recsPanel');
      var list  = document.getElementById('recsList');
      if (panel) panel.style.display = 'block';
      if (list)  list.innerHTML = d.recommendations.map(function (r) { return '<li>' + _esc(r) + '</li>'; }).join('');
    }

    // Populate sub-panels
    loadSessionsPanel(d.recentInterviews || []);
    loadAnalyticsPanel(d);
    loadProgressPanel(d);
    loadCoachPanel(d.recommendations || [], d.skillBreakdown || {});
    loadSettingsPanel();

  } catch (err) {
    console.warn('Dashboard load failed:', err && err.message);
  }
}

/* ── Sessions panel ── */
function loadSessionsPanel(recent) {
  var el = document.getElementById('sessionsContent');
  if (!el) return;
  var loggedIn = (typeof isLoggedIn === 'function') ? isLoggedIn() : false;
  if (!loggedIn) return;

  if (!recent.length) {
    el.innerHTML = '<div class="empty-state"><div class="es-icon">🎤</div><div class="es-title">No sessions yet</div><div class="es-sub">Start your first AI mock interview!</div><button class="btn-primary-sm" style="margin-top:16px" onclick="document.getElementById(\'ai-panel\').scrollIntoView({behavior:\'smooth\'})">Start Interview</button></div>';
    return;
  }

  el.innerHTML = recent.map(function (iv) {
    var score = (iv.feedback && iv.feedback.overallScore) || 0;
    var col   = score >= 80 ? '#10b981' : score >= 65 ? '#6366f1' : '#f59e0b';
    var type  = (iv.interviewType || 'mixed').replace(/-/g, ' ');
    return '<div class="session-card">'
      + '<div><div class="sc-role">' + _esc(iv.jobRole || 'Interview') + '</div>'
      + '<div class="sc-meta"><span>' + _esc(type) + '</span><span>' + _esc(iv.company || '—') + '</span></div></div>'
      + '<div><div class="sc-score" style="color:' + col + '">' + score + '%</div>'
      + '<div class="sc-date">' + relDate(iv.createdAt) + '</div></div>'
      + '</div>';
  }).join('');
}

/* ── Analytics panel ── */
function loadAnalyticsPanel(d) {
  var el = document.getElementById('analyticsContent');
  if (!el) return;
  var loggedIn = (typeof isLoggedIn === 'function') ? isLoggedIn() : false;
  if (!loggedIn) return;

  var sb = d.skillBreakdown || {};
  var typeData = [
    { label: 'Mixed',     count: d.mixedCount     || 0, color: '#6366f1' },
    { label: 'HR',        count: d.hrCount         || 0, color: '#06b6d4' },
    { label: 'Technical', count: d.technicalCount  || 0, color: '#10b981' },
  ];
  var maxCount = Math.max.apply(null, typeData.map(function (t) { return t.count; }).concat([1]));

  el.innerHTML = '<div class="analytics-grid">'
    + '<div class="al-card"><div class="al-title">Sessions by Type</div><div class="type-bars">'
    + typeData.map(function (t) {
        return '<div class="type-bar-item"><div class="type-bar-label">' + t.label + '</div>'
          + '<div class="type-bar-track"><div class="type-bar-fill" style="width:' + Math.round((t.count / maxCount) * 100) + '%;background:' + t.color + '"></div></div>'
          + '<div class="type-bar-count">' + t.count + '</div></div>';
      }).join('')
    + '</div></div>'
    + '<div class="al-card"><div class="al-title">Skill Averages</div><div class="type-bars">'
    + [['Communication', sb.communication || 0, '#6366f1'], ['Technical', sb.technical || 0, '#06b6d4'], ['Confidence', sb.confidence || 0, '#10b981']].map(function (s) {
        return '<div class="type-bar-item"><div class="type-bar-label">' + s[0] + '</div>'
          + '<div class="type-bar-track"><div class="type-bar-fill" style="width:' + (s[1]) + '%;background:' + s[2] + '"></div></div>'
          + '<div class="type-bar-count">' + s[1] + '%</div></div>';
      }).join('')
    + '</div></div></div>';
}

/* ── Progress panel ── */
function loadProgressPanel(d) {
  var el = document.getElementById('progressContent');
  if (!el) return;
  var loggedIn = (typeof isLoggedIn === 'function') ? isLoggedIn() : false;
  if (!loggedIn) return;

  var stats = d.stats || {};
  el.innerHTML = '<div class="progress-grid">'
    + _progCard(d.totalInterviews || 0, 'Total Sessions', '#6366f1')
    + _progCard((stats.avgScore || 0) + '%', 'Average Score', '#06b6d4')
    + _progCard((stats.practiceHours || 0) + 'h', 'Practice Hours', '#10b981')
    + _progCard(stats.streak || 0, 'Day Streak 🔥', '#f59e0b')
    + '</div>';
}

function _progCard(val, label, color) {
  return '<div class="prog-card"><div class="prog-num" style="color:' + color + '">' + val + '</div><div class="prog-label">' + label + '</div></div>';
}

/* ── AI Coach panel ── */
function loadCoachPanel(recs, sb) {
  var el = document.getElementById('coachContent');
  if (!el) return;
  var loggedIn = (typeof isLoggedIn === 'function') ? isLoggedIn() : false;
  if (!loggedIn) return;

  if (!recs.length) {
    el.innerHTML = '<div class="empty-state"><div class="es-icon">🤖</div><div class="es-title">Complete more sessions</div><div class="es-sub">Your AI coach will generate personalized recommendations after a few interviews.</div></div>';
    return;
  }

  var weakest = Object.entries(sb).sort(function (a, b) { return a[1] - b[1]; })[0];
  var focusArea = weakest ? weakest[0] : 'overall performance';

  el.innerHTML = '<div class="coach-recs">'
    + '<div class="coach-rec"><div class="cr-cat">Focus Area</div><div class="cr-text">Based on your sessions, focus on improving your <strong>' + _esc(focusArea) + '</strong> score.</div></div>'
    + recs.map(function (r) {
        return '<div class="coach-rec"><div class="cr-cat">Recommendation</div><div class="cr-text">' + _esc(r) + '</div></div>';
      }).join('')
    + '</div>';
}

/* ── Settings panel ── */
function loadSettingsPanel() {
  var el = document.getElementById('settingsContent');
  if (!el) return;
  var loggedIn = (typeof isLoggedIn === 'function') ? isLoggedIn() : false;
  if (!loggedIn) return;

  var user = (typeof getUser === 'function') ? getUser() : null;
  if (!user) return;

  el.innerHTML = '<div class="settings-form">'
    + '<div class="sf-field"><div class="sf-label">Full Name</div><input class="sf-input" value="' + _esc(user.name || '') + '" readonly /></div>'
    + '<div class="sf-field"><div class="sf-label">Email</div><input class="sf-input" value="' + _esc(user.email || '') + '" readonly /></div>'
    + '<div class="sf-field"><div class="sf-label">Plan</div><input class="sf-input" value="' + _esc(user.plan || 'Free') + '" readonly /></div>'
    + '</div>';
}
/* ════════════════════════════════════
   VOICE INTERVIEW ENGINE V3 — PREMIUM
   ✓ Proper user voice detection
   ✓ Fast interruption
   ✓ Mobile optimized
   ✓ Noise rejection
════════════════════════════════════ */

var VE = {
  interviewId:   null,
  recognition:   null,
  synthesis:     window.speechSynthesis || null,
  stream:        null,
  audioContext:  null,
  analyser:      null,
  source:        null,
  scriptProcessor: null,
  
  state:         'idle',
  isListening:   false,
  isSpeaking:    false,
  wasInterrupted: false,
  
  currentAnswer: '',
  langMode:      'en-IN',
  teluguWords:   ['నమస్కారం','మీరు','నేను','ఏమి','అవును','కాదు','చేస్తాను','చేశాను','అని','కానీ'],
  
  // ── Advanced VAD with noise rejection ──
  vadActive:     false,
  vadInterval:   null,
  
  // Noise gating parameters
  noiseThreshold: 0.03,        // Only accept sounds above this level
  silenceFrames: 0,
  soundFrames:   0,
  silenceTolerance: 8,          // ~320ms of silence before submit
  soundTolerance:  5,           // ~120ms of sound to trigger speaking
  
  // RMS smoothing for stable detection
  rmsHistory:    [],
  rmsHistorySize: 5,
  minDecibels:   -100,
  maxDecibels:   -10,
};

// ── Open voice modal ──
function startVoiceInterview() {
  var modal = document.getElementById('voiceModal');
  if (modal) modal.classList.add('open');
}
window.startVoiceInterview = startVoiceInterview;

// ── Close voice modal & cleanup ──
function closeVoiceModal() {
  VE_cleanupAll();
  var modal = document.getElementById('voiceModal');
  if (modal) modal.classList.remove('open');
  
  var perm = document.getElementById('vScreenPermission');
  var intv = document.getElementById('vScreenInterview');
  if (perm) perm.style.display = '';
  if (intv) intv.style.display = 'none';
  
  VE_setAvatarState('idle');
}
window.closeVoiceModal = closeVoiceModal;

// ── Complete cleanup ──
function VE_cleanupAll() {
  VE_stopVAD();
  VE_stopListening();
  if (VE.synthesis) {
    try { VE.synthesis.cancel(); } catch (e) {}
  }
  VE_closeAudio();
  
  if (VE.interviewId && typeof interviewComplete === 'function') {
    interviewComplete(VE.interviewId, 0).catch(function () {});
  }
  VE.interviewId = null;
}

// ── Close audio context ──
function VE_closeAudio() {
  if (VE.scriptProcessor) {
    try { VE.scriptProcessor.disconnect(); } catch (e) {}
    VE.scriptProcessor = null;
  }
  if (VE.source) {
    try { VE.source.disconnect(); } catch (e) {}
    VE.source = null;
  }
  if (VE.analyser) {
    try { VE.analyser.disconnect(); } catch (e) {}
    VE.analyser = null;
  }
  if (VE.audioContext && VE.audioContext.state !== 'closed') {
    try { VE.audioContext.close(); } catch (e) {}
    VE.audioContext = null;
  }
  if (VE.stream) {
    try {
      VE.stream.getTracks().forEach(function (t) { t.stop(); });
    } catch (e) {}
    VE.stream = null;
  }
}

// ── Avatar state ──
function VE_setAvatarState(state) {
  VE.state = state;
  var wrap = document.getElementById('vaiWrap');
  var status = document.getElementById('vaiStatus');
  if (!wrap) return;
  
  wrap.classList.remove('speaking', 'listening', 'thinking');
  if (state !== 'idle') wrap.classList.add(state);
  
  var labels = {
    idle:      'Ready',
    speaking:  'Priya is speaking…',
    listening: 'Listening to you…',
    thinking:  'Processing your answer…'
  };
  if (status) status.textContent = labels[state] || '';
}

// ── Priya speaks ──
function VE_speak(text, onDone) {
  if (!VE.synthesis) {
    if (onDone) onDone();
    return;
  }
  
  VE.synthesis.cancel();
  VE_setAvatarState('speaking');
 VE.isSpeaking = true;
 VE_stopListening();

// KEEP VAD RUNNING SO USER CAN INTERRUPT
if (!VE.vadActive) {
  VE_startVAD();
}
  
  VE_typewriterEffect(text, document.getElementById('vaiSpeechText'));
  
  var utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'en-IN';
  utter.rate = 0.92;
  utter.pitch = 1.05;
  utter.volume = 1;
  
  var voices = VE.synthesis.getVoices();
  var femaleVoice = voices.find(function (v) {
    return v.lang.startsWith('en') && /female|woman|zira|samantha|victoria|google uk english/i.test(v.name);
  });
  if (femaleVoice) utter.voice = femaleVoice;
  utter.onend = function () {
  console.log('[Voice] Speech ended');

  VE.isSpeaking = false;

  if (VE.wasInterrupted) {
    VE.wasInterrupted = false;
    return;
  }

  VE_setAvatarState('listening');

  if (!VE.vadActive) {
    VE_startVAD();
  }

  if (onDone) onDone();
};
  utter.onerror = function (e) {
    console.warn('[Voice] Speech error:', e.error);
    VE.isSpeaking = false;
    VE_startVAD();
    if (onDone) onDone();
  };
  
  try {
    VE.synthesis.speak(utter);
  } catch (e) {
    console.warn('[Voice] Speak failed:', e);
    if (onDone) onDone();
  }
}

// ── Typewriter effect ──
function VE_typewriterEffect(text, el) {
  if (!el) return;
  el.textContent = '';
  var i = 0;
  var interval = setInterval(function () {
    if (i < text.length) {
      el.textContent += text[i++];
    } else {
      clearInterval(interval);
    }
  }, 28);
}

// ── Start Web Speech Recognition ──
function VE_startListening() {
  if (VE.isListening) return;
  var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    showToast('Speech recognition not supported.', 'warning');
    return;
  }
  
  if (VE.recognition) {
    try { VE.recognition.abort(); } catch (e) {}
  }
  
  VE.recognition = new SpeechRecognition();
  VE.recognition.continuous = false;
  VE.recognition.interimResults = true;
  VE.recognition.lang = VE.langMode;
  VE.currentAnswer = '';
  VE.isListening = true;
  
  VE.recognition.onstart = function () {
    console.log('[Voice] Listening started');
    VE_setAvatarState('listening');
  };
  
  VE.recognition.onresult = function (event) {
    var finalText = '';
    var interimText = '';
    
    for (var i = event.resultIndex; i < event.results.length; i++) {
      var transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalText += transcript + ' ';
        VE.silenceFrames = 0;  // Reset silence on new input
      } else {
        interimText += transcript;
      }
    }
    
    if (finalText) {
      VE.currentAnswer += finalText;
      
      // Auto-detect Telugu
      var istelugu = VE.teluguWords.some(function (w) { return finalText.includes(w); });
      if (istelugu) {
        VE.langMode = 'te-IN';
        var li = document.getElementById('vLangIndicator');
        if (li) li.textContent = '🇮🇳 Telugu';
      }
    }
    
    var transcript = document.getElementById('vuserTranscript');
    if (transcript) transcript.textContent = VE.currentAnswer + interimText;
  };
  
  VE.recognition.onerror = function (e) {
  console.warn('[Voice] Error:', e.error);

  VE.isListening = false;

  if (
    ['network', 'no-speech', 'aborted'].includes(e.error)
  ) {
    setTimeout(function () {
      if (
        VE.interviewId &&
        !VE.isListening &&
        VE.state !== 'thinking'
      ) {
        VE_startListening();
      }
    }, 500);
  }
};
  
 VE.recognition.onend = function () {
  console.log('[Voice] Recognition ended');

  VE.isListening = false;

  // Mobile browsers often stop recognition by themselves.
  // Only restart if we're actively waiting for the user.
  if (
    VE.interviewId &&
    VE.state === 'listening' &&
    !VE.isSpeaking &&
    !VE.isUserSpeaking
  ) {
    setTimeout(function () {
      if (!VE.isListening) {
        VE_startListening();
      }
    }, 1500);
  }
};
  
  try { VE.recognition.start(); }
  catch (e) { console.warn('[Voice] Start failed:', e); }
}

// ── Stop listening ──
function VE_stopListening() {
  if (VE.recognition) {
    try { VE.recognition.stop(); } catch (e) {}
    try { VE.recognition.abort(); } catch (e) {}
  }
  VE.isListening = false;
}

// ── Start VAD monitoring ──
function VE_startVAD() {
  if (!VE.stream || VE.vadActive) return;
  
  console.log('[VAD] Starting...');
  VE.vadActive = true;
  VE.silenceFrames = 0;
  VE.soundFrames = 0;
  VE.rmsHistory = [];
  
  try {
    var AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    
    if (VE.audioContext && VE.audioContext.state !== 'closed') {
      try { VE.audioContext.close(); } catch (e) {}
    }
    
    VE.audioContext = new AudioContext();
    VE.analyser = VE.audioContext.createAnalyser();
    VE.analyser.fftSize = 512;
    VE.analyser.minDecibels = VE.minDecibels;
    VE.analyser.maxDecibels = VE.maxDecibels;
    
    VE.source = VE.audioContext.createMediaStreamSource(VE.stream);
    VE.source.connect(VE.analyser);
    
    VE_vadMonitor();
  } catch (e) {
    console.warn('[VAD] Init failed:', e);
  }
}

// ── VAD monitoring loop ──
function VE_vadMonitor() {
  if (!VE.vadActive || !VE.analyser) return;
  
  var dataArray = new Float32Array(VE.analyser.frequencyBinCount);
  VE.analyser.getFloatTimeDomainData(dataArray);
  
  // Calculate RMS (root mean square)
  var sum = 0;
  for (var i = 0; i < dataArray.length; i++) {
    sum += dataArray[i] * dataArray[i];
  }
  var rms = Math.sqrt(sum / dataArray.length);
  
  // Smooth RMS with history
  VE.rmsHistory.push(rms);
  if (VE.rmsHistory.length > VE.rmsHistorySize) {
    VE.rmsHistory.shift();
  }
  var avgRms = VE.rmsHistory.reduce(function (a, b) { return a + b; }, 0) / VE.rmsHistory.length;
  
  // ── MAIN INTERRUPT LOGIC ──
  if (avgRms > VE.noiseThreshold) {
    // Sound detected
    VE.soundFrames++;
    VE.silenceFrames = 0;
    
    // If user just started speaking
    if (VE.soundFrames >= VE.soundTolerance && !VE.isUserSpeaking) {
      VE.isUserSpeaking = true;
      console.log('[VAD] User speaking detected');
      
      // ⚡ INTERRUPT AI IMMEDIATELY ⚡
      if (VE.isSpeaking) {
        console.log('[VAD] INTERRUPTING AI!');
   VE.wasInterrupted = true;

if (VE.synthesis) {
  VE.synthesis.cancel();
}

VE.isSpeaking = false;
VE_setAvatarState('listening');
VE_setAvatarState('listening');

if (!VE.isListening) {
  VE_startListening();
}
        
        // Show interrupt UI
        var fb = document.getElementById('vInterruptionFeedback');
        if (fb) {
          fb.style.display = 'flex';
          fb.style.opacity = '1';
          setTimeout(function () {
            fb.style.opacity = '0';
            setTimeout(function () { fb.style.display = 'none'; }, 300);
          }, 1200);
        }
        showToast('Listening...', 'info');
      }
    }
  } else {
    // Silence detected
    VE.soundFrames = 0;
    
    if (VE.isUserSpeaking) {
      VE.silenceFrames++;
      
      // If silence long enough & we have answer
      if (VE.silenceFrames >= VE.silenceTolerance) {
        var answer = VE.currentAnswer.trim();
        var wordCount = answer.split(/\s+/).filter(function (w) { return w.length > 0; }).length;
        
        // Need at least 2 words
        if (wordCount >= 2) {
          console.log('[VAD] Submitting answer after silence');
          VE.isUserSpeaking = false;
          VE_submitAnswer();
          VE.vadActive = false;
          return;
        }
      }
    }
  }
  
  VE.vadInterval = requestAnimationFrame(VE_vadMonitor);
}

// ── Stop VAD ──
function VE_stopVAD() {
  VE.vadActive = false;
  if (VE.vadInterval) {
    cancelAnimationFrame(VE.vadInterval);
    VE.vadInterval = null;
  }
  VE.isUserSpeaking = false;
}

// ── Submit answer ──
async function VE_submitAnswer() {
  var answer = VE.currentAnswer.trim();
  if (!answer || !VE.interviewId) return;
  
  VE_stopListening();
  VE_setAvatarState('thinking');
  
  var transcript = document.getElementById('vuserTranscript');
  if (transcript) transcript.textContent = answer;
  VE.currentAnswer = '';
  
  try {
    console.log('[Voice] Sending:', answer);
    var data = await interviewMessage(VE.interviewId, answer);
    console.log('[Voice] Response received');
    
    // Update scores
    if (data.feedback) {
      var f = data.feedback;
      document.getElementById('vConfVal').textContent = f.confidenceScore ? f.confidenceScore + '%' : '—';
      document.getElementById('vCommVal').textContent = f.communicationScore ? f.communicationScore + '%' : '—';
      document.getElementById('vTechVal').textContent = f.technicalScore ? f.technicalScore + '%' : '—';
    }
    
    // Priya responds
    if (data.aiMessage) {
      VE_speak(data.aiMessage, function () {
        if (VE.state === 'speaking' || VE.state === 'listening') {
          setTimeout(function () {
            VE_startListening();
            VE_startVAD();
          }, 300);
        }
      });
    }
  } catch (err) {
    console.error('[Voice] Error:', err);
    showToast('Error: ' + (err.message || 'Try again'), 'error');
    VE_setAvatarState('listening');
    VE_startListening();
    VE_startVAD();
  }
}

// ── Grant permission & start ──
async function VE_grantAndStart() {
  var btn = document.getElementById('vGrantMicBtn');
  setLoading(btn, true);
  
  // Check login FIRST
  var loggedIn = (typeof isLoggedIn === 'function') ? isLoggedIn() : false;
  if (!loggedIn) {
    setLoading(btn, false);
    closeVoiceModal();
    openAuthModal('login');
    showToast('Sign in first.', 'info');
    return;
  }
  
  try {
    // Mobile-optimized audio constraints
    var constraints = {
     audio: {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true
}
    };
    VE.stream = await navigator.mediaDevices.getUserMedia(constraints);
    console.log('[Voice] Mic granted');
  } catch (err) {
    setLoading(btn, false);
    console.error('[Voice] Mic error:', err);
    showToast('Mic denied. Allow permission.', 'error');
    return;
  }
  
  try {
    var started = await interviewStart('Software Engineer', 'General', 'mixed', 'intermediate');
    VE.interviewId = started.interview._id;
    console.log('[Voice] Interview started:', VE.interviewId);
  } catch (err) {
  console.error('INTERVIEW START ERROR:', err);

  setLoading(btn, false);

  showToast(
    err?.message || 'Start failed.',
    'error'
  );

  return;
}
  
  setLoading(btn, false);
  
  // Switch UI
  var perm = document.getElementById('vScreenPermission');
  var intv = document.getElementById('vScreenInterview');
  if (perm) perm.style.display = 'none';
  if (intv) intv.style.display = '';
  
  // Start listening first
  VE_startListening();
  
  // Then Priya speaks
  var intro = "Hello! I'm Priya, your AI interview coach. Tell me about yourself and your background.";
  VE_speak(intro, function () {
     VE_startListening(); // Start VAD monitoring after intro
  });
}

// ── Initialize ──
function _initVoiceModal() {
  var grantBtn = document.getElementById('vGrantMicBtn');
  if (grantBtn) grantBtn.addEventListener('click', VE_grantAndStart);
  
  // Typed fallback
  var vtypeInput = document.getElementById('vtypeInput');
  var vtypeSend = document.getElementById('vtypeSend');
  
  function submitTyped() {
    var val = vtypeInput && vtypeInput.value.trim();
    if (!val) return;
    if (vtypeInput) vtypeInput.value = '';
    VE.currentAnswer = val;
    VE_submitAnswer();
  }
  
  if (vtypeSend) vtypeSend.addEventListener('click', submitTyped);
  if (vtypeInput) vtypeInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); submitTyped(); }
  });
}
/* ════════════════════════════════════
   DASHBOARD TAB WIRING
════════════════════════════════════ */

// Wires click handlers to all dashboard top tabs and sidebar items.
// Must run after DOMContentLoaded so the elements exist.
// ── Smart voice interview start ──
function VE_voiceStart() {
  var loggedIn = (typeof isLoggedIn === 'function') ? isLoggedIn() : false;
  if (!loggedIn) {
    openAuthModal('login');
    showToast('Sign in to start voice interview.', 'info');
    return;
  }
  startVoiceInterview();
}
function _initDashboardTabs() {
  document.querySelectorAll('.dash-tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      switchDashTab(tab.dataset.tab);
    });
  });

  document.querySelectorAll('.ds-item').forEach(function (item) {
    item.addEventListener('click', function () {
      switchDashTab(item.dataset.section);
    });
  });
}

/* ════════════════════════════════════
   DOM READY — WIRE EVERYTHING UP
════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', function () {

  // Core UI
  _initScrollReveal();
  _initNav();
  _initSmoothScroll();
  _initResumeChips();
  _initAuthModal();
  _initAIPanel();
  _initVoiceModal();
  _initDashboardTabs();

  // Reflect login state in the nav and dashboard header
  updateAuthUI();

  // If already logged in (e.g. page refresh), load dashboard data immediately
  var loggedIn = (typeof isLoggedIn === 'function') ? isLoggedIn() : false;
  if (loggedIn) loadDashboard();

  // ── CTA buttons → open register modal ──
  // All "Get Started" buttons across the page open the register tab
  ['navGetStarted', 'heroStart', 'ctaStart', 'mobileGetStarted'].forEach(function (id) {
    var btn = document.getElementById(id);
    if (btn) {
      btn.addEventListener('click', function () {
        var loggedIn = (typeof isLoggedIn === 'function') ? isLoggedIn() : false;
        if (loggedIn) {
          // Already signed in — go to AI interview
          document.getElementById('ai-panel').scrollIntoView({ behavior: 'smooth' });
        } else {
          // Not signed in — show register modal
          openAuthModal('register');
        }
      });
    }
  });

  // ── Sign In button in sessions panel ──
  var ssi = document.getElementById('sessionsSignIn');
  if (ssi) ssi.addEventListener('click', function () { openAuthModal('login'); });

  // ── Landing page resume upload button ──
  var uploadBtn = document.getElementById('uploadResumeBtn');
  if (uploadBtn) {
    uploadBtn.addEventListener('click', function () {
      handleResumeUpload('resumeFile', 'uploadResumeBtn', 'resumeResult', '.how-resume-panel .role-chips');
    });
  }

  // ── Dashboard resume upload button ──
  var dashBtn = document.getElementById('dashAnalyzeBtn');
  if (dashBtn) {
    dashBtn.addEventListener('click', function () {
      handleResumeUpload('dashResumeFile', 'dashAnalyzeBtn', 'dashResumeResult', '#dashRoleChips');
    });
  }

  // ── Email verification link in URL ──
  // Handles the ?token=xxx link from the verification email
  var urlParams = new URLSearchParams(window.location.search);
  var verifyToken = urlParams.get('token');
  if (verifyToken && typeof authVerifyEmail === 'function') {
    authVerifyEmail(verifyToken)
      .then(function () {
        showToast('Email verified! You are now logged in.', 'success');
        updateAuthUI();
        loadDashboard();
        // Clean the token from the URL without reloading
        window.history.replaceState({}, '', window.location.pathname);
      })
      .catch(function (err) {
        showToast('Verification failed: ' + (err.message || 'Invalid token'), 'error');
      });
  }

});
/* ── End of MockAI script.js ── */