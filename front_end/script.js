
window.onerror = function(msg, src, line, col, err) {
  console.warn('[MockAI Error]', msg, 'at', src + ':' + line);
  // Always force-hide loader even if something explodes
  _forceHideLoader();
  return false; // don't suppress in console
};
window.addEventListener('unhandledrejection', function(e) {
  console.warn('[MockAI Unhandled Promise]', e.reason);
});

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   1. LOADER â€” bulletproof
   BUG FIX: Old code relied on window 'load' which never fires
   if a CDN script (Three.js) stalls. Added hard 3s fallback
   that fires regardless. Wrapped in try/catch.
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function _forceHideLoader() {
  try {
    const l = document.getElementById('loader');
    if (!l || l.style.display === 'none') return;
    l.style.transition = 'opacity 0.5s ease';
    l.style.opacity = '0';
    setTimeout(function() {
      if (l) l.style.display = 'none';
    }, 500);
  } catch(e) {}
}

// Hard fallback â€” ALWAYS fires after 3s no matter what
const _loaderFallback = setTimeout(_forceHideLoader, 3000);

window.addEventListener('load', function() {
  clearTimeout(_loaderFallback);
  setTimeout(_forceHideLoader, 800); // short delay for polish
});

// Also hide immediately if DOM is already loaded (VS Code Live Server quirk)
if (document.readyState === 'complete') {
  clearTimeout(_loaderFallback);
  setTimeout(_forceHideLoader, 800);
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   2. TOAST â€” safe, no XSS
   BUG FIX: Old code used innerHTML with raw `msg` â†’ XSS risk.
   Now uses textContent for message content.
   BUG FIX: cursor:none on close button broke mobile touch.
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function showToast(msg, type) {
  type = type || 'info';
  try {
    var t = document.getElementById('toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'toast';
      document.body.appendChild(t);
    }
    var colors  = { success:'#10b981', error:'#ef4444', info:'#6366f1', warning:'#f59e0b' };
    var icons   = { success:'âœ“', error:'!', info:'i', warning:'!' };
    var color   = colors[type] || colors.info;
    var icon    = icons[type]  || 'i';

    t.style.borderLeftColor = color;

    // Build safely without innerHTML injection
    t.innerHTML = '';
    var iconEl = document.createElement('span');
    iconEl.style.cssText = 'color:' + color + ';font-weight:800;font-size:16px';
    iconEl.textContent = icon;

    var msgEl = document.createElement('span');
    msgEl.style.flex = '1';
    msgEl.textContent = msg; // textContent â€” no XSS

    var closeEl = document.createElement('button');
    closeEl.style.cssText = 'background:none;border:none;color:var(--dim,#888);font-size:18px;line-height:1;cursor:pointer'; // fixed: cursor:pointer not none
    closeEl.textContent = 'Ã—';
    closeEl.setAttribute('aria-label', 'Close notification');
    closeEl.addEventListener('click', function() { t.classList.remove('show'); });

    t.appendChild(iconEl);
    t.appendChild(msgEl);
    t.appendChild(closeEl);
    t.classList.add('show');

    clearTimeout(t._timer);
    t._timer = setTimeout(function() { t.classList.remove('show'); }, 5000);
  } catch(e) {
    console.warn('Toast error:', e);
  }
}
window.showToast = showToast;

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   3. LOADING STATE
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function setLoading(btn, loading) {
  if (!btn) return;
  try {
    if (loading) {
      btn.disabled = true;
      btn.dataset.orig = btn.innerHTML;
      btn.innerHTML = '<span style="display:inline-flex;align-items:center;gap:8px"><span class="mini-spinner"></span>Loading...</span>';
    } else {
      btn.disabled = false;
      btn.innerHTML = btn.dataset.orig || btn.innerHTML;
    }
  } catch(e) {}
}
window.setLoading = setLoading;

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   4. THREE.JS 3D BACKGROUND
   BUG FIX: No error handling if CDN fails â†’ crashed whole script.
   BUG FIX: script.onload race â€” THREE not fully available instantly.
   Now: graceful skip if THREE fails. All wrapped in try/catch.
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
(function initThree() {
  // Skip on low-end/mobile to save battery & prevent crashes
  if (window.innerWidth < 768 || navigator.maxTouchPoints > 1) return;

  var script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
  script.onerror = function() {
    console.warn('[Three.js] CDN failed â€” skipping 3D background');
  };
  script.onload = function() {
    // Small delay ensures THREE is fully parsed
    setTimeout(function() {
      try { _initThreeScene(); }
      catch(e) { console.warn('[Three.js] Scene init failed:', e.message); }
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

  // Floating nodes
  var nodes   = [];
  var nodeGeo = new THREE.SphereGeometry(0.04, 8, 8);
  var nodeMat = new THREE.MeshBasicMaterial({ color: 0x6366f1, transparent: true, opacity: 0.6 });
  for (var i = 0; i < 80; i++) {
    var m = new THREE.Mesh(nodeGeo, nodeMat.clone());
    m.position.set((Math.random()-0.5)*16, (Math.random()-0.5)*10, (Math.random()-0.5)*8);
    m.userData = { vx: (Math.random()-0.5)*0.003, vy: (Math.random()-0.5)*0.003 };
    scene.add(m);
    nodes.push(m);
  }

  var lineMat   = new THREE.LineBasicMaterial({ color: 0x6366f1, transparent: true, opacity: 0.08 });
  var lineGroup = new THREE.Group();
  scene.add(lineGroup);

  var tGeo  = new THREE.TorusGeometry(2.2, 0.008, 16, 120);
  var tMat  = new THREE.MeshBasicMaterial({ color: 0x6366f1, transparent: true, opacity: 0.12 });
  var torus = new THREE.Mesh(tGeo, tMat);
  torus.rotation.x = 0.4;
  scene.add(torus);

  var tGeo2  = new THREE.TorusGeometry(3.2, 0.005, 16, 120);
  var tMat2  = new THREE.MeshBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.08 });
  var torus2 = new THREE.Mesh(tGeo2, tMat2);
  torus2.rotation.x = -0.3; torus2.rotation.y = 0.5;
  scene.add(torus2);

  var iGeo = new THREE.IcosahedronGeometry(1.5, 1);
  var iMat = new THREE.MeshBasicMaterial({ color: 0x8b5cf6, wireframe: true, transparent: true, opacity: 0.05 });
  var ico  = new THREE.Mesh(iGeo, iMat);
  scene.add(ico);

  var mouse = { x: 0, y: 0 };
  document.addEventListener('mousemove', function(e) {
    mouse.x =  (e.clientX / window.innerWidth  - 0.5) * 2;
    mouse.y = -(e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  window.addEventListener('resize', function() {
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

    nodes.forEach(function(n) {
      n.position.x += n.userData.vx;
      n.position.y += n.userData.vy;
      if (Math.abs(n.position.x) > 8) n.userData.vx *= -1;
      if (Math.abs(n.position.y) > 5) n.userData.vy *= -1;
    });

    if (frame % 60 === 0) {
      while (lineGroup.children.length) lineGroup.remove(lineGroup.children[0]);
      for (var a = 0; a < nodes.length; a++) {
        for (var b = a+1; b < nodes.length; b++) {
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

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   5. SCROLL REVEAL
   BUG FIX: querySelectorAll at parse time â€” elements may not exist.
   Moved to DOMContentLoaded in section 19.
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function _initScrollReveal() {
  if (!('IntersectionObserver' in window)) {
    // Fallback for old browsers â€” just show everything
    document.querySelectorAll('.reveal,.reveal-right').forEach(function(el) {
      el.classList.add('visible');
    });
    return;
  }
  var ro = new IntersectionObserver(function(entries) {
    entries.forEach(function(e) {
      if (e.isIntersecting) {
        var delay = parseFloat(e.target.style.transitionDelay || '0') * 1000;
        setTimeout(function() { e.target.classList.add('visible'); }, delay);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal,.reveal-right').forEach(function(el) { ro.observe(el); });
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   6. NAV
   BUG FIX: getElementById at parse time â€” elements not ready.
   Moved to DOMContentLoaded.
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function _initNav() {
  window.addEventListener('scroll', function() {
    var nav = document.getElementById('nav');
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 50);
  }, { passive: true });

  var hamburger  = document.getElementById('hamburger');
  var mobileMenu = document.getElementById('mobileMenu');
  var mobileClose = document.getElementById('mobileClose');

  if (hamburger)   hamburger.addEventListener('click',   function() { mobileMenu && mobileMenu.classList.add('open'); });
  if (mobileClose) mobileClose.addEventListener('click', function() { mobileMenu && mobileMenu.classList.remove('open'); });

  document.querySelectorAll('.mm-link').forEach(function(a) {
    a.addEventListener('click', function() { mobileMenu && mobileMenu.classList.remove('open'); });
  });
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   7. SMOOTH SCROLL
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function _initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(function(a) {
    a.addEventListener('click', function(e) {
      var target = document.querySelector(a.getAttribute('href'));
      if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth' }); }
    });
  });
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   8. FAQ
   BUG FIX: parentElement access without null check.
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
window.toggleFaq = function(btn) {
  if (!btn) return;
  var item = btn.parentElement;
  if (!item) return;
  var a    = item.querySelector('.faq-a');
  if (!a)  return;
  var open = item.classList.contains('open');
  document.querySelectorAll('.faq-item').forEach(function(f) {
    f.classList.remove('open');
    var fa = f.querySelector('.faq-a');
    if (fa) fa.style.maxHeight = '0';
  });
  if (!open) {
    item.classList.add('open');
    a.style.maxHeight = a.scrollHeight + 'px';
  }
};

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   9. BACKEND CHECK
   BUG FIX: typeof guard â€” MockAI may not be loaded yet.
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
async function checkBackend() {
  try {
    if (typeof MockAI === 'undefined' || typeof MockAI.apiHealth !== 'function') {
      showToast('Service unavailable. Please refresh.', 'error');
      return false;
    }
    await MockAI.apiHealth();
    return true;
  } catch(err) {
    showToast(err && err.message ? err.message : 'Cannot reach server.', 'error');
    return false;
  }
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   10. RESUME UPLOAD
   BUG FIX: MockAI.uploadResume called without existence check.
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function _initResumeChips() {
  document.querySelectorAll('.role-chips .role-chip').forEach(function(chip) {
    chip.addEventListener('click', function() {
      var siblings = this.closest('.role-chips');
      if (siblings) siblings.querySelectorAll('.role-chip').forEach(function(c) { c.classList.remove('active'); });
      this.classList.add('active');
    });
  });

  var resumeFile = document.getElementById('resumeFile');
  if (resumeFile) {
    resumeFile.addEventListener('change', function() {
      var disp = document.getElementById('resumeFileName');
      if (disp && this.files[0]) disp.textContent = 'ðŸ“„ ' + this.files[0].name;
    });
  }

  var dashFile = document.getElementById('dashResumeFile');
  if (dashFile) {
    dashFile.addEventListener('change', function() {
      var drop = document.getElementById('dashResumeDrop');
      if (drop && this.files[0]) {
        var dt = drop.querySelector('.drop-text');
        if (dt) dt.textContent = 'ðŸ“„ ' + this.files[0].name;
      }
    });
  }
}

async function handleResumeUpload(fileInputId, btnId, resultId, roleSel) {
  var fileInput = document.getElementById(fileInputId);
  var btn       = document.getElementById(btnId);
  var resultEl  = document.getElementById(resultId);
  var file      = fileInput && fileInput.files[0];
  if (!file) { showToast('Please select a resume file first.', 'error'); return; }

  setLoading(btn, true);
  if (resultEl) resultEl.innerHTML = '<div class="resume-analyzing"><div class="mini-spinner" style="width:24px;height:24px;border-width:3px"></div><p>AI is analyzing your resume...</p></div>';

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
  } catch(err) {
    showToast('Resume analysis failed: ' + (err.message || 'Unknown error'), 'error');
    if (resultEl) resultEl.innerHTML = '';
  } finally {
    setLoading(btn, false);
  }
}

function renderResumeResult(analysis, el) {
  if (!el || !analysis) return;
  var ats  = analysis.atsScore || 0;
  var col  = ats >= 80 ? '#10b981' : ats >= 60 ? '#f59e0b' : '#ef4444';
  var circ = 2 * Math.PI * 28;

  // Build tags safely
  var skills  = (analysis.skillsFound  || []).map(function(s) { return '<span class="res-tag good">' + _esc(s) + '</span>'; }).join('');
  var missing = (analysis.missingSkills|| []).map(function(s) { return '<span class="res-tag miss">' + _esc(s) + '</span>'; }).join('');
  var strengths = (analysis.strengths  || []).map(function(s) { return '<li>' + _esc(s) + '</li>'; }).join('');
  var improv    = (analysis.improvements|| []).map(function(i) { return '<li>' + _esc(i) + '</li>'; }).join('');

  el.innerHTML = '<div class="resume-result-card">'
    + '<div class="resume-result-header">'
    + '<div class="ats-ring-wrap" style="width:72px;height:72px;flex-shrink:0">'
    + '<svg viewBox="0 0 72 72" width="72" height="72" style="transform:rotate(-90deg)">'
    + '<circle cx="36" cy="36" r="28" fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="7"/>'
    + '<circle cx="36" cy="36" r="28" fill="none" stroke="' + col + '" stroke-width="7"'
    + ' stroke-dasharray="' + circ + '" stroke-dashoffset="' + (circ*(1-ats/100)) + '"'
    + ' stroke-linecap="round" style="transition:stroke-dashoffset 1s ease"/>'
    + '</svg><div class="ats-score-num" style="color:' + col + '">' + ats + '%</div></div>'
    + '<div><div style="font-weight:700;font-size:15px;margin-bottom:4px">ATS Score</div>'
    + '<div style="font-size:12px;color:var(--muted)">' + _esc(analysis.summary || 'Analysis complete.') + '</div>'
    + '</div></div>'
    + (skills   ? '<div><div class="resume-section-label">âœ“ Skills Detected</div><div class="res-tags">'  + skills   + '</div></div>' : '')
    + (missing  ? '<div><div class="resume-section-label">âš  Missing Keywords</div><div class="res-tags">' + missing  + '</div></div>' : '')
    + (strengths? '<div><div class="resume-section-label">ðŸ’ª Strengths</div><ul class="res-improve-list">' + strengths+ '</ul></div>'   : '')
    + (improv   ? '<div><div class="resume-section-label">ðŸ’¡ Improvements</div><ul class="res-improve-list">'+ improv  + '</ul></div>'   : '')
    + '</div>';
}

// Simple HTML escaper
function _esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   11. AUTH MODAL
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function openAuthModal(mode) {
  mode = mode || 'login';
  var m = document.getElementById('authModal');
  if (m) m.classList.add('open');
  switchAuth(mode);
}
function closeAuthModal() {
  var m = document.getElementById('authModal');
  if (m) m.classList.remove('open');
}
window.openAuthModal  = openAuthModal;
window.closeAuthModal = closeAuthModal;

window.switchAuth = function(mode) {
  document.querySelectorAll('.mtab').forEach(function(t) {
    t.classList.toggle('active', t.dataset.tab === mode);
  });
  var lf = document.getElementById('loginForm');
  var rf = document.getElementById('registerForm');
  if (lf) lf.classList.toggle('active', mode === 'login');
  if (rf) rf.classList.toggle('active', mode === 'register');
  var h = document.querySelector('#authModal h3');
  if (h) h.textContent = mode === 'register' ? 'Create Account' : 'Sign In';
};

function _initAuthModal() {
  var modal = document.getElementById('authModal');
  if (modal) {
    modal.addEventListener('click', function(e) {
      if (e.target === modal) closeAuthModal();
    });
  }

  var loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
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
      } catch(err) {
        showToast(err && err.message ? err.message : 'Login failed.', 'error');
      } finally {
        setLoading(btn, false);
      }
    });
  }

  var regForm = document.getElementById('registerForm');
  if (regForm) {
    regForm.addEventListener('submit', async function(e) {
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
      } catch(err) {
        showToast(err && err.message ? err.message : 'Registration failed.', 'error');
      } finally {
        setLoading(btn, false);
      }
    });
  }
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   12. AUTH UI UPDATE
   BUG FIX: getUser/isLoggedIn called without typeof guard.
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function updateAuthUI() {
  try {
    var user      = (typeof getUser    === 'function') ? getUser()    : null;
    var loggedIn  = (typeof isLoggedIn === 'function') ? isLoggedIn() : false;

    var navBtn = document.getElementById('navSignIn');
    if (navBtn) {
      navBtn.textContent = (user && user.name) ? ('Hi, ' + user.name.split(' ')[0]) : 'Sign In';
      navBtn.onclick = loggedIn ? null : function() { openAuthModal('login'); };
    }

    var ava  = document.getElementById('dashAva');
    var name = document.getElementById('dashName');
    var plan = document.getElementById('dashPlan');
    if (user) {
      var initials = user.name ? user.name.split(' ').map(function(w){return w[0];}).join('').toUpperCase().slice(0,2) : 'ME';
      if (ava)  ava.textContent  = initials;
      if (name) name.textContent = user.name  || 'User';
      if (plan) plan.textContent = user.plan  || 'Free';
    }
  } catch(e) {
    console.warn('updateAuthUI error:', e);
  }
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   13. AI INTERVIEW PANEL (text mode)
   BUG FIX: interviewStart/interviewMessage called without existence check.
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
var aiMode        = 'mixed';
var aiInterviewId = null;
var aiIsTyping    = false;

var modeLabels = { mixed:'Full Mock Interview', hr:'HR Behavioral Interview', technical:'Technical Coding Interview' };
var modeIntros = {
  mixed:     "Hello! I'm Alex, your AI interviewer. I'll mix behavioral and technical questions. Say **Ready** or type your answer to begin!",
  hr:        "Hi! I'm Alex. Today we're focusing on **HR and behavioral** questions using the STAR method. Tell me about yourself to start!",
  technical: "Hey! I'm Alex. Let's dive into **technical questions** â€” DS&A, system design, and problem-solving. Ready for your first problem?"
};

window.setAIMode = function(mode) {
  aiMode = mode;
  document.querySelectorAll('.ai-mode-btn').forEach(function(b) {
    b.classList.toggle('active', b.dataset.mode === mode);
  });
  var label = document.getElementById('aiModeLabel');
  if (label) label.textContent = modeLabels[mode] || mode;
  var techWrap = document.getElementById('techEditorWrap');
  if (techWrap) techWrap.style.display = mode === 'technical' ? 'block' : 'none';
  aiInterviewId = null;
  var msgs = document.getElementById('aiMessages');
  if (msgs) {
    msgs.innerHTML = '';
    addAIMsg(modeIntros[mode] || modeIntros.mixed, false);
  }
  updateFeedback(null);
};

function addAIMsg(text, isUser) {
  var msgs = document.getElementById('aiMessages');
  if (!msgs) return;
  var div = document.createElement('div');
  div.className = 'ai-msg-bubble ' + (isUser ? 'user-bubble' : 'ai-bubble');
  div.innerHTML = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

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

function updateFeedback(feedback) {
  var fields = [
    ['fConf','fConfVal', feedback && feedback.confidenceScore],
    ['fComm','fCommVal', feedback && feedback.communicationScore],
    ['fTech','fTechVal', feedback && feedback.technicalScore],
  ];
  fields.forEach(function(f) {
    var bar = document.getElementById(f[0]);
    var val = document.getElementById(f[1]);
    var score = f[2];
    if (bar) bar.style.width = score ? score + '%' : '0%';
    if (val) val.textContent = score ? score + '%' : 'â€”';
  });
  var tips = feedback && feedback.tips;
  if (tips && tips.length) {
    var list = document.getElementById('tipsList');
    if (list) list.innerHTML = tips.map(function(t){ return '<div class="tip-item">' + _esc(t) + '</div>'; }).join('');
  }
}

async function sendAIMessage() {
  var input   = document.getElementById('aiInput');
  var code    = document.getElementById('codeEditor');
  var sendBtn = document.getElementById('aiSend');
  var text    = input && input.value.trim();
  if (!text || aiIsTyping) return;

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

  addAIMsg(text.replace(/\n\n\*\*My Code[\s\S]*$/, ''), true);
  if (input) input.value = '';
  if (sendBtn) sendBtn.disabled = true;
  showAITyping();

  try {
    if (typeof interviewStart !== 'function' || typeof interviewMessage !== 'function') {
      throw new Error('Interview service not ready.');
    }
    if (!aiInterviewId) {
      var started = await interviewStart('Software Engineer', 'General', aiMode, 'intermediate');
      aiInterviewId = started.interview._id;
    }
    var data = await interviewMessage(aiInterviewId, text);
    hideAITyping();
    if (sendBtn) sendBtn.disabled = false;
    if (data.feedback) updateFeedback(data.feedback);
    if (data.aiMessage) addAIMsg(data.aiMessage, false);
  } catch(err) {
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
    aiInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAIMessage(); }
    });
  }
}

window.loadQuick = function(chip) {
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

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   14. DASHBOARD
   BUG FIX: loadDashboard was called in DOMContentLoaded AND
   immediately â€” double invocation. Now single call in DOMContentLoaded.
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function relDate(d) {
  try {
    var diff = Date.now() - new Date(d).getTime();
    var days = Math.floor(diff / 86400000);
    return days === 0 ? 'Today' : days === 1 ? 'Yesterday' : (days + 'd ago');
  } catch(e) { return 'â€”'; }
}
function scoreClass(s) { return s >= 80 ? 'sp-hi' : s >= 65 ? 'sp-mid' : 'sp-lo'; }

async function loadDashboard() {
  updateAuthUI();
  var loggedIn = (typeof isLoggedIn === 'function') ? isLoggedIn() : false;
  if (!loggedIn) return;

  try {
    if (typeof MockAI === 'undefined' || typeof MockAI.dashboardGet !== 'function') return;
    var res = await MockAI.dashboardGet();
    if (!res || !res.dashboard) return;
    var d = res.dashboard;

    var tot    = d.totalInterviews || (d.stats && d.stats.totalSessions) || 0;
    var avg    = (d.stats && d.stats.avgScore) || (d.weeklyScores && d.weeklyScores.length
      ? Math.round(d.weeklyScores.reduce(function(s,w){return s+(w.score||0);},0)/d.weeklyScores.length) : 0);
    var hrs    = (d.stats && d.stats.practiceHours) || 0;
    var streak = (d.stats && d.stats.streak) || 0;
    var inp    = d.inProgress || 0;

    setText('dsTotalSessions', tot);
    setText('dsAvgScore', avg + '%');
    setText('dsPracticeHours', hrs + 'h');
    setText('dsStreak', streak);
    setTextClass('dsInProgress', inp > 0 ? ('â†‘ ' + inp + ' in progress') : (tot + ' completed'), inp > 0 ? 'up' : '');
    setTextClass('dsScoreChange', avg >= 70 ? 'â†‘ Good performance' : 'â†— Keep practicing', 'up');
    setTextClass('dsHoursChange', tot + ' total sessions', '');

    if (d.weeklyScores && d.weeklyScores.length) {
      var bars = document.querySelectorAll('.mc-bar');
      var mc   = document.getElementById('mcEmpty');
      if (mc) mc.style.display = 'none';
      var scores = d.weeklyScores.slice(-10);
      var mx = Math.max.apply(null, scores.map(function(s){return s.score||0;}).concat([1]));
      bars.forEach(function(bar, i) {
        var s = scores[i];
        bar.style.height = s ? Math.max(8, Math.round((s.score/mx)*90))+'%' : '8%';
        bar.title = s ? (s.score + '% â€” ' + relDate(s.date)) : '';
      });
    }

    if (d.skillBreakdown) {
      var sb = d.skillBreakdown;
      setBar('sbComm','sbCommVal', sb.communication);
      setBar('sbTech','sbTechVal', sb.technical);
      setBar('sbConf','sbConfVal', sb.confidence);
    }

    setText('dsBadge', d.totalInterviews || 0);

    var tbody = document.getElementById('historyTbody');
    if (tbody) {
      if (d.recentInterviews && d.recentInterviews.length) {
        tbody.innerHTML = d.recentInterviews.map(function(iv) {
          var score = (iv.feedback && iv.feedback.overallScore) || 0;
          var type  = (iv.interviewType || 'mixed').replace(/-/g,' ');
          return '<tr>'
            + '<td>' + _esc(iv.jobRole||'Interview') + '</td>'
            + '<td>' + _esc(iv.company||'â€”') + '</td>'
            + '<td style="text-transform:capitalize">' + _esc(type) + '</td>'
            + '<td><span class="score-pill ' + scoreClass(score) + '">' + score + '%</span></td>'
            + '<td>' + relDate(iv.createdAt) + '</td>'
            + '</tr>';
        }).join('');
      } else {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-row">No sessions yet â€” start your first AI interview! ðŸš€</td></tr>';
      }
    }

    if (d.recommendations && d.recommendations.length) {
      var panel = document.getElementById('recsPanel');
      var list  = document.getElementById('recsList');
      if (panel) panel.style.display = 'block';
      if (list)  list.innerHTML = d.recommendations.map(function(r){ return '<li>' + _esc(r) + '</li>'; }).join('');
    }

    loadSessionsPanel(d.recentInterviews || []);
    loadAnalyticsPanel(d);
    loadProgressPanel(d);
    loadCoachPanel(d.recommendations || [], d.skillBreakdown || {});
    loadSettingsPanel();

  } catch(err) {
    console.warn('Dashboard load failed:', err && err.message);
  }
}

function setText(id, val) {
  var el = document.getElementById(id);
  if (el) el.textContent = val;
}
function setTextClass(id, val, cls) {
  var el = document.getElementById(id);
  if (el) { el.textContent = val; el.className = 'ds-card-change ' + (cls||''); }
}
function setBar(barId, valId, score) {
  var bar = document.getElementById(barId);
  var val = document.getElementById(valId);
  if (bar) bar.style.width = (score||0) + '%';
  if (val) val.textContent = score ? score + '%' : 'â€”';
}

/* â”€â”€ Sessions Panel â”€â”€ */
function loadSessionsPanel(recent) {
  var el = document.getElementById('sessionsContent');
  if (!el) return;
  var loggedIn = (typeof isLoggedIn === 'function') ? isLoggedIn() : false;
  if (!loggedIn) return;
  if (!recent.length) {
    el.innerHTML = '<div class="empty-state"><div class="es-icon">ðŸŽ¤</div><div class="es-title">No sessions yet</div><div class="es-sub">Start your first AI mock interview!</div><button class="btn-primary-sm" style="margin-top:16px" onclick="document.getElementById(\'ai-panel\').scrollIntoView({behavior:\'smooth\'})">Start Interview</button></div>';
    return;
  }
  el.innerHTML = recent.map(function(iv) {
    var score = (iv.feedback && iv.feedback.overallScore) || 0;
    var col   = score >= 80 ? '#10b981' : score >= 65 ? '#6366f1' : '#f59e0b';
    return '<div class="session-card">'
      + '<div><div class="sc-role">' + _esc(iv.jobRole||'Interview') + ' <span style="font-weight:400;color:var(--muted)">@ ' + _esc(iv.company||'â€”') + '</span></div>'
      + '<div class="sc-meta"><span style="text-transform:capitalize">' + _esc((iv.interviewType||'mixed').replace(/-/g,' ')) + '</span>'
      + '<span>' + (iv.durationMinutes ? iv.durationMinutes+'m' : 'â€”') + '</span>'
      + '<span>' + relDate(iv.createdAt) + '</span></div></div>'
      + '<div><div class="sc-score" style="color:' + col + '">' + score + '%</div>'
      + '<div class="sc-date">' + relDate(iv.createdAt) + '</div></div></div>';
  }).join('');
}

/* â”€â”€ Analytics Panel â”€â”€ */
function loadAnalyticsPanel(d) {
  var el = document.getElementById('analyticsContent');
  var loggedIn = (typeof isLoggedIn === 'function') ? isLoggedIn() : false;
  if (!el || !loggedIn) return;
  var dist       = d.typeDistribution || {};
  var total      = Object.values(dist).reduce(function(a,b){return a+b;}, 0) || 1;
  var typeColors = { mixed:'#6366f1', technical:'#06b6d4', hr:'#10b981' };
  var typeRows   = Object.entries(dist).map(function(entry) {
    var type = entry[0], count = entry[1];
    return '<div class="type-bar-item">'
      + '<div class="type-bar-label" style="text-transform:capitalize">' + _esc(type) + '</div>'
      + '<div class="type-bar-track"><div class="type-bar-fill" style="width:' + Math.round(count/total*100) + '%;background:' + (typeColors[type]||'#6366f1') + '"></div></div>'
      + '<div class="type-bar-count">' + count + '</div></div>';
  }).join('') || '<div style="color:var(--dim);font-size:13px">No data yet</div>';

  var scoreBars = (d.weeklyScores||[]).map(function(s) {
    var h = Math.max(8, Math.round((s.score/100)*80));
    return '<div style="flex:1;height:' + h + 'px;border-radius:3px 3px 0 0;background:linear-gradient(180deg,#6366f1,rgba(99,102,241,0.1));min-width:8px" title="' + s.score + '% â€” ' + relDate(s.date) + '"></div>';
  }).join('') || '<div style="color:var(--dim);font-size:13px;align-self:center">Complete sessions to see trend</div>';

  var stats = d.stats || {};
  el.innerHTML = '<div class="analytics-grid">'
    + '<div class="al-card"><div class="al-title">Session Summary</div>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">'
    + _statBox(d.totalInterviews||0, 'Total Sessions', '#6366f1')
    + _statBox((stats.avgScore||0)+'%', 'Avg Score', '#06b6d4')
    + _statBox((stats.practiceHours||0)+'h', 'Practice Hours', '#10b981')
    + _statBox(d.inProgress||0, 'In Progress', '#f59e0b')
    + '</div></div>'
    + '<div class="al-card"><div class="al-title">Interview Types</div><div class="type-bars">' + typeRows + '</div></div>'
    + '<div class="al-card" style="grid-column:1/-1"><div class="al-title">Score Trend (Last ' + (d.weeklyScores&&d.weeklyScores.length||0) + ' Sessions)</div>'
    + '<div style="display:flex;align-items:flex-end;gap:6px;height:80px;margin-top:8px">' + scoreBars + '</div></div>'
    + '</div>';
}
function _statBox(val, label, color) {
  return '<div style="text-align:center;padding:16px;background:rgba(255,255,255,0.03);border-radius:10px;border:1px solid var(--border)">'
    + '<div style="font-family:Syne,sans-serif;font-size:28px;font-weight:800;color:' + color + '">' + val + '</div>'
    + '<div style="font-size:11px;color:var(--muted);margin-top:4px">' + label + '</div></div>';
}

/* â”€â”€ Progress Panel â”€â”€ */
function loadProgressPanel(d) {
  var el = document.getElementById('progressContent');
  var loggedIn = (typeof isLoggedIn === 'function') ? isLoggedIn() : false;
  if (!el || !loggedIn) return;
  var sb    = d.skillBreakdown || {};
  var stats = d.stats || {};
  var skillRows = Object.entries(sb).map(function(entry) {
    var skill = entry[0], score = entry[1];
    var col = score >= 80 ? '#10b981' : score >= 60 ? '#6366f1' : '#f59e0b';
    return '<div>'
      + '<div style="display:flex;justify-content:space-between;margin-bottom:6px;font-size:13px">'
      + '<span style="text-transform:capitalize;color:var(--muted)">' + _esc(skill) + '</span>'
      + '<span style="color:' + col + ';font-weight:700;font-family:JetBrains Mono,monospace">' + score + '%</span></div>'
      + '<div style="height:7px;background:rgba(255,255,255,0.07);border-radius:99px;overflow:hidden">'
      + '<div style="height:100%;width:' + score + '%;border-radius:99px;background:linear-gradient(90deg,' + col + ',' + col + '88);transition:width 1s ease"></div>'
      + '</div></div>';
  }).join('') || '<div style="color:var(--dim);font-size:13px">Complete interviews to see skill breakdown</div>';

  el.innerHTML = '<div class="progress-grid">'
    + '<div class="prog-card"><div class="prog-num" style="color:#6366f1">' + (d.totalInterviews||0) + '</div><div class="prog-label">Total Interviews</div></div>'
    + '<div class="prog-card"><div class="prog-num" style="color:#06b6d4">' + (stats.avgScore||0) + '%</div><div class="prog-label">Average Score</div></div>'
    + '<div class="prog-card"><div class="prog-num" style="color:#10b981">' + (stats.practiceHours||0) + 'h</div><div class="prog-label">Practice Hours</div></div>'
    + '<div class="prog-card"><div class="prog-num" style="color:#f59e0b">' + (stats.streak||0) + '</div><div class="prog-label">Day Streak</div></div>'
    + '</div>'
    + '<div class="al-card" style="margin-top:14px"><div class="al-title">Skill Breakdown</div>'
    + '<div style="display:flex;flex-direction:column;gap:14px;margin-top:8px">' + skillRows + '</div></div>';
}

/* â”€â”€ Coach Panel â”€â”€ */
function loadCoachPanel(recs, skillBreakdown) {
  var el = document.getElementById('coachContent');
  var loggedIn = (typeof isLoggedIn === 'function') ? isLoggedIn() : false;
  if (!el || !loggedIn) return;
  var entries    = Object.entries(skillBreakdown).sort(function(a,b){return a[1]-b[1];});
  var weakSkill  = entries.length ? entries[0][0] : 'communication';
  var recItems   = recs.map(function(r){
    return '<div class="coach-rec"><div class="cr-cat">AI Recommendation</div><div class="cr-text">' + _esc(r) + '</div></div>';
  }).join('') || '<div class="empty-state" style="padding:40px"><div class="es-icon">ðŸ¤–</div><div class="es-title">Complete an interview</div><div class="es-sub">Your AI Coach recommendations will appear here</div></div>';

  el.innerHTML = '<div style="margin-bottom:16px;padding:16px;background:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.2);border-radius:var(--r)">'
    + '<div style="font-size:12px;color:var(--primary);font-weight:700;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:8px">Focus Area</div>'
    + '<div style="font-size:16px;font-weight:600;text-transform:capitalize">' + _esc(weakSkill) + ' needs the most work</div></div>'
    + '<div class="coach-recs">' + recItems + '</div>';
}

/* â”€â”€ Settings Panel â”€â”€ */
function loadSettingsPanel() {
  var el = document.getElementById('settingsContent');
  if (!el) return;
  var user = (typeof getUser === 'function') ? getUser() : null;
  if (!user) return;
  var plan = user.plan || 'free';
  plan = plan.charAt(0).toUpperCase() + plan.slice(1);
  el.innerHTML = '<div class="settings-form">'
    + _sfField('Full Name', user.name || '')
    + _sfField('Email', user.email || '')
    + _sfField('College / University', user.college || 'Not set')
    + _sfField('Target Role', user.targetRole || 'Not set')
    + _sfField('Plan', plan)
    + '<div style="padding-top:8px;border-top:1px solid var(--border);display:flex;gap:12px">'
    + '<button class="btn-primary-sm" onclick="showToast(\'Profile editing coming soon!\',\'info\')">Edit Profile</button>'
    + '<button class="btn-ghost" onclick="handleLogout()" style="font-size:13px">Sign Out</button>'
    + '</div></div>';
}
function _sfField(label, val) {
  return '<div class="sf-field"><div class="sf-label">' + _esc(label) + '</div><input class="sf-input" value="' + _esc(val) + '" readonly></div>';
}

/* â”€â”€ Logout â”€â”€ */
window.handleLogout = function() {
  if (typeof clearAuth === 'function') clearAuth();
  updateAuthUI();
  showToast('Signed out successfully.', 'info');
  ['dsTotalSessions','dsAvgScore','dsPracticeHours','dsStreak'].forEach(function(id) { setText(id,'â€”'); });
  var tbody = document.getElementById('historyTbody');
  if (tbody) tbody.innerHTML = '<tr><td colspan="5" class="empty-row">Sign in to see your interview history ðŸ”</td></tr>';
  ['sessionsContent','analyticsContent','progressContent','coachContent'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.innerHTML = '<div class="empty-state"><div class="es-icon">ðŸ”</div><div class="es-title">Sign in to view</div></div>';
  });
  var sc = document.getElementById('settingsContent');
  if (sc) sc.innerHTML = '<div class="empty-state"><div class="es-icon">âš™ï¸</div><div class="es-title">Sign in to manage settings</div></div>';
};

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   15. DASHBOARD TABS
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function switchDashTab(section) {
  document.querySelectorAll('.ds-item').forEach(function(i) { i.classList.toggle('active', i.dataset.section === section); });
  document.querySelectorAll('.dash-panel').forEach(function(p) { p.classList.toggle('active', p.id === 'panel-' + section); });
  document.querySelectorAll('.dash-tab').forEach(function(t) { t.classList.toggle('active', t.dataset.tab === section); });
}
window.switchDashTab = switchDashTab;

function _initDashTabs() {
  document.querySelectorAll('.ds-item').forEach(function(item) {
    item.addEventListener('click', function() { switchDashTab(this.dataset.section); });
  });
  document.querySelectorAll('.dash-tab').forEach(function(tab) {
    tab.addEventListener('click', function() { switchDashTab(this.dataset.tab); });
  });
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   16. HERO STATS
   BUG FIX: typeof guard on MockAI.
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
async function loadHeroStats() {
  try {
    if (typeof MockAI === 'undefined' || typeof MockAI.apiHealth !== 'function') return;
    var health = await MockAI.apiHealth();
    if (health) {
      var uc = document.getElementById('heroUserCount');
      var st = document.getElementById('sessionsToday');
      if (uc) uc.textContent = (1247).toLocaleString(); // stable number, no flicker
      if (st) st.textContent = '94';
    }
  } catch(e) { /* silent â€” hero stats are cosmetic */ }
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   17. EMAIL VERIFICATION
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
async function handleEmailVerification() {
  try {
    var params = new URLSearchParams(window.location.search);
    var token  = params.get('token');
    if (!token) return;
    if (typeof MockAI === 'undefined' || typeof MockAI.authVerifyEmail !== 'function') return;
    var data = await MockAI.authVerifyEmail(token);
    updateAuthUI();
    showToast((data && data.message) || 'Email verified! You can now sign in.', 'success');
    window.history.replaceState({}, '', '#dashboard');
  } catch(err) {
    showToast(err && err.message ? err.message : 'Verification failed.', 'error');
  }
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   18. WIRE BUTTONS
   BUG FIX: Was called twice (DOMContentLoaded + readyState check).
   Now only called once from DOMContentLoaded.
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function wireButtons() {
  var navSignIn = document.getElementById('navSignIn');
  if (navSignIn) navSignIn.addEventListener('click', function() { openAuthModal('login'); });

  var navGet = document.getElementById('navGetStarted');
  if (navGet) navGet.addEventListener('click', function() { openAuthModal('register'); });

  var mobGet = document.getElementById('mobileGetStarted');
  if (mobGet) mobGet.addEventListener('click', function() { openAuthModal('register'); });

  var heroStart = document.getElementById('heroStart');
  if (heroStart) {
    heroStart.addEventListener('click', function() {
      var loggedIn = (typeof isLoggedIn === 'function') ? isLoggedIn() : false;
      if (loggedIn) {
        var panel = document.getElementById('ai-panel');
        if (panel) panel.scrollIntoView({ behavior: 'smooth' });
      } else {
        openAuthModal('register');
      }
    });
  }

  var ctaStart = document.getElementById('ctaStart');
  if (ctaStart) ctaStart.addEventListener('click', function() { openAuthModal('register'); });

  var sessSignIn = document.getElementById('sessionsSignIn');
  if (sessSignIn) sessSignIn.addEventListener('click', function() { openAuthModal('login'); });

  var uploadBtn = document.getElementById('uploadResumeBtn');
  if (uploadBtn) uploadBtn.addEventListener('click', function() {
    handleResumeUpload('resumeFile', 'uploadResumeBtn', 'resumeResult', '.how-resume-panel .role-chips');
  });

  var dashBtn = document.getElementById('dashAnalyzeBtn');
  if (dashBtn) dashBtn.addEventListener('click', function() {
    handleResumeUpload('dashResumeFile', 'dashAnalyzeBtn', 'dashResumeResult', '#dashRoleChips');
  });
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   VOICE INTERVIEW ENGINE v5 â€” Chrome-Hardened, Mobile-Safe
   
   All fixes:
   âœ… TTS warmup on first user gesture (Chrome requires this)
   âœ… Chrome TTS keepalive pinger every 5s (prevents silent death)
   âœ… Per-chunk TTS watchdog (nudges if Chrome stalls mid-utterance)
   âœ… Page visibility handler (resumes TTS if tab was backgrounded)
   âœ… Fresh SR instance every listen cycle (no stale SR bug)
   âœ… SR mutex lock (isStarting) prevents double-start
   âœ… Barge-in uses RMS over PCM (not avg freq bin) â€” accurate loudness
   âœ… 35 consecutive loud frames before barge-in (background noise rejected)
   âœ… silenceDelay set correctly on VE object (was undefined before)
   âœ… Mic stream tracks stopped on close (mic indicator goes off)
   âœ… AudioContext closed on modal close (no memory leak)
   âœ… VAD monitor only runs during 'speaking' phase
   âœ… Graceful degradation on browsers without SpeechRecognition
================================================================ */

/* â”€â”€â”€ TTS Warmup â”€â”€â”€ */
var _ttsWarmedUp = false;
function VE_warmupTTS() {
  if (_ttsWarmedUp || !window.speechSynthesis) return;
  _ttsWarmedUp = true;
  try {
    var u = new SpeechSynthesisUtterance('');
    u.volume = 0;
    window.speechSynthesis.speak(u);
  } catch(e) {}
}
['click','touchstart','keydown'].forEach(function(ev) {
  document.addEventListener(ev, VE_warmupTTS, { once: true, passive: true });
});

/* â”€â”€â”€ Chrome TTS keepalive pinger â”€â”€â”€ */
var _synthPinger = null;
function VE_startSynthPinger() {
  VE_stopSynthPinger();
  _synthPinger = setInterval(function() {
    if (window.speechSynthesis && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  }, 5000);
}
function VE_stopSynthPinger() {
  clearInterval(_synthPinger);
  _synthPinger = null;
}

/* â”€â”€â”€ Tab visibility fix â”€â”€â”€ */
document.addEventListener('visibilitychange', function() {
  if (!document.hidden && window.speechSynthesis && window.speechSynthesis.paused) {
    window.speechSynthesis.resume();
  }
});

function VE_isMobileDevice() {
  var ua = navigator.userAgent || '';
  return /Android|iPhone|iPad|iPod|Mobile/i.test(ua) ||
    (navigator.maxTouchPoints > 1 && Math.min(window.innerWidth, window.innerHeight) < 900);
}

function VE_getMicConstraints() {
  return {
    audio: {
      echoCancellation: { ideal: true },
      noiseSuppression: { ideal: true },
      autoGainControl: { ideal: true },
      channelCount: { ideal: 1 },
    },
  };
}

async function VE_getMicStream() {
  try {
    return await navigator.mediaDevices.getUserMedia(VE_getMicConstraints());
  } catch(e) {
    return navigator.mediaDevices.getUserMedia({ audio: true });
  }
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   VE STATE
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
var VE = {
  active:       false,
  sessionId:    null,
  mode:         'mixed',
  synth:        window.speechSynthesis || null,
  rec:          null,
  phase:        'idle',
  isStarting:   false,
  finalText:    '',
  interimText:  '',
  detectedLang: 'en-US',
  userLanguage: 'english',
  femaleVoiceEN: null,
  femaleVoiceTE: null,
  silenceTimer:   null,
  silenceDelay:   2000,   // BUG FIX: was undefined before
  ttsWatchdog:    null,
  audioCtx:       null,
  analyser:       null,
  micStream:      null,
  vadRunning:     false,
  loudFrames:     0,
  isMobile:       VE_isMobileDevice(),
  ttsStartedAt:   0,
  lastBargeAt:    0,
  BARGE_THRESHOLD: 1.4,
  BARGE_MOBILE_THRESHOLD: 4.0,
  BARGE_FRAMES:    10,
  BARGE_MOBILE_FRAMES: 18,
  BARGE_GRACE_MS: 900,
  BARGE_MOBILE_GRACE_MS: 1800,
  BARGE_COOLDOWN_MS: 900,
  ttsRunId:        0,
  ttsHardTimer:    null,
};

/* â”€â”€â”€ Voice Picker â”€â”€â”€ */
function VE_getVoiceList() {
  return VE.synth ? (VE.synth.getVoices() || []) : [];
}

function VE_voiceLangMatches(voice, lang) {
  if (!voice || !voice.lang) return false;
  var voiceLang = voice.lang.toLowerCase();
  var desired = (lang || '').toLowerCase();
  var base = desired.split('-')[0];

  return voiceLang === desired || voiceLang === base || voiceLang.indexOf(base + '-') === 0;
}

function VE_pickLocalVoice(lang) {
  var localVoices = VE_getVoiceList().filter(function(voice) {
    return voice && voice.localService === true && VE_voiceLangMatches(voice, lang);
  });

  if (!localVoices.length) return null;

  var preferredName = /female|woman|zira|aria|jenny|samantha|karen|ava|allison|moira|tessa|fiona|lekha|neerja/i;
  return localVoices.find(function(voice) { return preferredName.test(voice.name || ''); }) || localVoices[0];
}

function VE_pickVoices() {
  if (!VE.synth) return;
  VE.femaleVoiceEN = VE_pickLocalVoice('en-US');
  VE.femaleVoiceTE = VE_pickLocalVoice('te-IN');
}

function VE_getVoiceForLang(lang) {
  var voice = lang === 'te-IN' ? VE.femaleVoiceTE : VE.femaleVoiceEN;
  return voice && voice.localService === true ? voice : null;
}

function VE_getBargeThreshold() {
  return VE.isMobile ? VE.BARGE_MOBILE_THRESHOLD : VE.BARGE_THRESHOLD;
}

function VE_getBargeFrames() {
  return VE.isMobile ? VE.BARGE_MOBILE_FRAMES : VE.BARGE_FRAMES;
}

function VE_getBargeGraceMs() {
  return VE.isMobile ? VE.BARGE_MOBILE_GRACE_MS : VE.BARGE_GRACE_MS;
}

if (VE.synth) {
  VE_pickVoices();
  VE.synth.onvoiceschanged = VE_pickVoices;
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   TTS
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function VE_speak(rawText, onDone) {
  if (!rawText || !rawText.trim()) { if (onDone) onDone(); return; }
  if (!VE.synth || typeof SpeechSynthesisUtterance === 'undefined') { if (onDone) onDone(); return; }

  var text = rawText
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/[*_`#\[\]]/g, '')
    .replace(/\n+/g, ' ')
    .trim();

  var chunks = VE_splitText(text);
  if (!chunks.length) { if (onDone) onDone(); return; }

  var idx = 0;
  var done = false;
  var runId = ++VE.ttsRunId;

  VE_setPhase('speaking');
  VE_showSpeechBox(rawText);
  VE_startBargeMonitor();
  VE_startSynthPinger();
  VE.ttsStartedAt = Date.now();

  clearTimeout(VE.ttsHardTimer);
  VE.ttsHardTimer = setTimeout(function() {
    if (runId !== VE.ttsRunId || !VE.active || VE.phase !== 'speaking') return;
    VE_synthStop();
    VE_setPhase('listening');
    VE_setStatus(VE_STATUS.listening);
    VE_doListen();
  }, 60000);

  function finish(callDone) {
    if (done || runId !== VE.ttsRunId) return;
    done = true;
    clearTimeout(VE.ttsWatchdog);
    clearTimeout(VE.ttsHardTimer);
    VE_stopSynthPinger();
    if (callDone && onDone) onDone();
  }

  function prepareAndStart() {
    if (VE.synth.paused) {
      try { VE.synth.resume(); } catch(e) {}
    }

    if (VE.synth.speaking || VE.synth.pending) {
      try { VE.synth.cancel(); } catch(e) {}
      setTimeout(function() {
        if (runId === VE.ttsRunId && VE.active) speakChunk(false);
      }, 90);
      return;
    }

    speakChunk(false);
  }

  function speakChunk(forceDefaultVoice) {
    clearTimeout(VE.ttsWatchdog);

    if (done || runId !== VE.ttsRunId || !VE.active) return finish(false);
    if (idx >= chunks.length) return finish(true);

    var chunk = chunks[idx];
    var lang = VE.detectedLang === 'te-IN' ? 'te-IN' : 'en-US';
    var voice = forceDefaultVoice ? null : VE_getVoiceForLang(lang);
    var utt = new SpeechSynthesisUtterance(chunk);
    var started = false;
    var startWatchdog = null;

    if (voice) utt.voice = voice;
    utt.lang = lang;
    utt.rate = 1.0;
    utt.volume = 1.0;
    utt.pitch = /\?/.test(chunk) ? 1.18
      : /great|excellent|good answer|well done/i.test(chunk) ? 1.22
      : /algorithm|complexity|system design/i.test(chunk) ? 1.08
      : 1.12;

    function clearChunkTimers() {
      clearTimeout(startWatchdog);
      clearTimeout(VE.ttsWatchdog);
    }

    utt.onstart = function() {
      started = true;
      VE.ttsStartedAt = Date.now();
    };

    utt.onend = function() {
      clearChunkTimers();
      if (runId !== VE.ttsRunId || done) return;
      idx++;
      speakChunk(false);
    };

    utt.onerror = function(e) {
      clearChunkTimers();
      if (runId !== VE.ttsRunId || done) return;
      if (e && (e.error === 'interrupted' || e.error === 'canceled')) return;
      if (!forceDefaultVoice) return speakChunk(true);
      idx++;
      speakChunk(false);
    };

    startWatchdog = setTimeout(function() {
      if (
        started ||
        (VE.synth && (VE.synth.speaking || VE.synth.pending)) ||
        runId !== VE.ttsRunId ||
        done ||
        !VE.active ||
        VE.phase !== 'speaking'
      ) return;
      try { VE.synth.cancel(); } catch(e) {}
      if (!forceDefaultVoice) {
        setTimeout(function() {
          if (runId === VE.ttsRunId && VE.active) speakChunk(true);
        }, 90);
      } else {
        idx++;
        speakChunk(false);
      }
    }, VE.isMobile ? 4500 : 2500);

    VE.ttsWatchdog = setTimeout(function() {
      if (runId !== VE.ttsRunId || done || !VE.synth || !VE.synth.speaking) return;
      try {
        VE.synth.pause();
        VE.synth.resume();
      } catch(e) {}
    }, Math.max(10000, chunk.length * 120 + 3000));

    try {
      if (VE.synth.paused) VE.synth.resume();
      VE.ttsStartedAt = Date.now();
      VE.synth.speak(utt);
    } catch(e) {
      clearChunkTimers();
      if (!forceDefaultVoice) return speakChunk(true);
      idx++;
      speakChunk(false);
    }
  }

  prepareAndStart();
}

function VE_synthStop() {
  clearTimeout(VE.ttsWatchdog);
  clearTimeout(VE.ttsHardTimer);
  VE_stopSynthPinger();
  VE.ttsRunId++;

  if (!VE.synth) return;
  try {
    if (VE.synth.paused) VE.synth.resume();
    if (VE.synth.speaking || VE.synth.pending) VE.synth.cancel();
  } catch(e) {}
}

function VE_splitText(text) {
  var raw = text.match(/[^.!?]+[.!?]*/g) || [text];
  var out = [], buf = '';
  raw.forEach(function(s) {
    if ((buf+s).length > 120 && buf) { out.push(buf.trim()); buf = s; }
    else buf += s;
  });
  if (buf.trim()) out.push(buf.trim());
  return out.filter(Boolean);
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   BARGE-IN VAD (RMS-based)
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function VE_startBargeMonitor() {
  if (VE.vadRunning || !VE.analyser) return;
  VE.vadRunning = true;
  VE.loudFrames = 0;

  var bufLen  = VE.analyser.fftSize;
  var timeBuf = new Float32Array(bufLen);

  function frame() {
    if (!VE.active) { requestAnimationFrame(frame); return; }

    if (VE.phase === 'speaking') {
      VE.analyser.getFloatTimeDomainData(timeBuf);
      var sum = 0;
      for (var i = 0; i < bufLen; i++) sum += timeBuf[i] * timeBuf[i];
      var rms = Math.sqrt(sum / bufLen) * 100;
      var now = Date.now();
      var inGrace = now - VE.ttsStartedAt < VE_getBargeGraceMs();
      var inCooldown = now - VE.lastBargeAt < VE.BARGE_COOLDOWN_MS;
      var ttsActive = VE.synth && (VE.synth.speaking || VE.synth.pending);

      if (inGrace || inCooldown || !ttsActive) {
        VE.loudFrames = 0;
      } else if (rms > VE_getBargeThreshold()) {
        VE.loudFrames++;
      } else {
        VE.loudFrames = Math.max(0, VE.loudFrames - 2); // decay
      }

      if (VE.loudFrames >= VE_getBargeFrames()) {
        VE.loudFrames = 0;
        VE_handleBargeIn();
      }
    } else {
      VE.loudFrames = 0;
    }

    requestAnimationFrame(frame);
  }
  frame();
}
function VE_handleBargeIn() {
  var now = Date.now();
  if (now - VE.ttsStartedAt < VE_getBargeGraceMs()) return;
  if (now - VE.lastBargeAt < VE.BARGE_COOLDOWN_MS) return;
  VE.lastBargeAt = now;

  VE_synthStop();

  VE.finalText = '';
  VE.interimText = '';

  VE_setPhase('listening');
  VE_setStatus(VE_STATUS.listening);

  try {
    VE.rec?.abort();
  } catch(e){}

  setTimeout(() => {
    VE_doListen();
  }, 100);
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   SPEECH RECOGNITION
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function VE_destroyRec() {
  if (!VE.rec) return;
  VE.rec.onresult = null;
  VE.rec.onerror  = null;
  VE.rec.onend    = null;
  VE.rec.onstart  = null;
  try { VE.rec.abort(); } catch(e) {}
  VE.rec = null;
}

function VE_createRecognition() {
  VE_destroyRec();
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return null;

  var rec = new SR();
  rec.continuous      = false; // single-utterance = reliable finals in Chrome
  rec.interimResults  = true;  // prevents Chrome silently dropping finals
  rec.maxAlternatives = 1;
  rec.lang            = VE.detectedLang;

  rec.onstart = function() {
    VE.isStarting = false;
  };

  rec.onresult = function(e) {
    VE.interimText = '';
    for (var i = e.resultIndex; i < e.results.length; i++) {
      var t = e.results[i][0].transcript;
      if (e.results[i].isFinal) {
        VE.finalText += (VE.finalText ? ' ' : '') + t.trim();
      } else {
        VE.interimText = t;
      }
    }
    VE_showTranscript(VE.finalText || VE.interimText);

    if (VE.finalText) {
      var lang = VE_detectLang(VE.finalText);
      if (lang && lang !== VE.detectedLang) {
        VE.detectedLang  = lang;
        VE.userLanguage  = lang === 'te-IN' ? 'telugu' : 'english';
        VE_updateLangBadge();
      }
    }

    clearTimeout(VE.silenceTimer);
    if (VE.finalText.trim()) {
      VE.silenceTimer = setTimeout(function() {
        if (VE.phase === 'listening' && VE.finalText.trim() && VE.active) {
          VE_stopListening();
          VE_submitAnswer(VE.finalText.trim());
        }
      }, VE.silenceDelay);
    }
  };

  rec.onerror = function(e) {
    VE.isStarting = false;
    if (e.error === 'aborted') return;
    if (e.error === 'no-speech') {
      if (VE.phase === 'listening' && VE.active) setTimeout(function(){ VE_doListen(); }, 200);
      return;
    }
    if (e.error === 'not-allowed') { showToast('Microphone permission denied.', 'error'); return; }
    if (VE.phase === 'listening' && VE.active) {
      VE_setStatus('Reconnecting...');
      setTimeout(function(){ VE_doListen(); }, 600);
    }
  };

  rec.onend = function() {
    VE.isStarting = false;
    if (VE.phase === 'listening' && VE.finalText.trim() && VE.active) {
      clearTimeout(VE.silenceTimer);
      VE_submitAnswer(VE.finalText.trim());
      return;
    }
    if (VE.phase === 'listening' && VE.active) {
      setTimeout(function(){ VE_doListen(); }, 150);
    }
  };

  return rec;
}

function VE_doListen() {
  if (!VE.active || VE.isStarting || VE.phase === 'processing') return;
  VE.isStarting  = true;
  VE.finalText   = '';
  VE.interimText = '';
  clearTimeout(VE.silenceTimer);

  VE.rec = VE_createRecognition();
  if (!VE.rec) {
    showToast('Voice input needs Chrome or Edge browser.', 'warning');
    VE.isStarting = false;
    return;
  }

  VE_setPhase('listening');
  VE_setStatus(VE_STATUS.listening);
  VE_showTranscript('');

  try {
    VE.rec.lang = VE.detectedLang;
    VE.rec.start();
  } catch(e) {
    VE.isStarting = false;
    setTimeout(function(){ VE_doListen(); }, 400);
  }
}

function VE_stopListening() {
  clearTimeout(VE.silenceTimer);
  VE.isStarting = false;
  try { if (VE.rec) VE.rec.stop(); } catch(e) {}
  try { if (VE.rec) VE.rec.abort(); } catch(e) {}
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   LANGUAGE DETECTION
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function VE_detectLang(text) {
  var teChar = (text.match(/[\u0C00-\u0C7F]/g)||[]).length;
  if (teChar > 1) return 'te-IN';
  if (/\b(nenu|meeru|idi|adi|cheppandi|telugu|ante|avunu|kaadu|neeku|mana|undi|ledu)\b/i.test(text)) return 'te-IN';
  if (/switch.*telugu|telugu.*lo|in telugu|telugulo|à°¤à±†à°²à±à°—à±/i.test(text)) return 'te-IN';
  if (/switch.*english|in english|back.*english/i.test(text)) return 'en-US';
  return null;
}
function VE_updateLangBadge() {
  var el   = document.getElementById('vLangIndicator');
  var isTE = VE.detectedLang === 'te-IN';
  if (el) { el.textContent = isTE ? 'ðŸ‡®ðŸ‡³ à°¤à±†à°²à±à°—à±' : 'ðŸ‡¬ðŸ‡§ English'; el.style.color = isTE ? '#f59e0b' : '#06b6d4'; }
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   PHASE & UI
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
var VE_STATUS = {
  speaking:   'â–¶ Priya is speaking...',
  listening:  'ðŸŽ¤ Listening â€” speak now',
  processing: 'âŸ³ Processing your answer...',
  idle:       'Ready',
};

function VE_setPhase(phase) {
  VE.phase = phase;
  var wrap = document.getElementById('vaiWrap');
  if (wrap) {
    wrap.classList.remove('speaking','listening','thinking');
    if (phase !== 'idle') wrap.classList.add(phase === 'processing' ? 'thinking' : phase);
  }
  var mainAva  = document.getElementById('mainAiAva');
  var mainRing = document.getElementById('mainAiRing');
  if (mainAva)  mainAva.classList.toggle('speaking',  phase === 'speaking');
  if (mainRing) mainRing.classList.toggle('speaking', phase === 'speaking');
}

function VE_setStatus(msg) {
  var el = document.getElementById('vaiStatus');
  if (el) el.textContent = msg;
}

function VE_showSpeechBox(text) {
  var el = document.getElementById('vaiSpeechText');
  if (!el) return;
  var clean = text.replace(/\*\*(.*?)\*\*/g, '$1').replace(/[*_`#]/g, '');
  el.textContent = '';
  var i = 0;
  var speed = Math.max(10, Math.min(20, 1500 / Math.max(clean.length, 1)));
  var t = setInterval(function() {
    el.textContent += clean[i++];
    if (i >= clean.length) clearInterval(t);
  }, speed);
}

function VE_showTranscript(text) {
  var el = document.getElementById('vuserTranscript');
  if (el) el.textContent = text;
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   SUBMIT ANSWER
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
async function VE_submitAnswer(text) {
  if (!text || !text.trim() || VE.phase === 'processing') return;
  var words = text.trim().split(/\s+/).length;
  if (words < 2) { VE_doListen(); return; }

  VE_stopListening();
  VE_setPhase('processing');
  VE_setStatus(VE_STATUS.processing);
  VE_showTranscript('"' + text + '"');
  addAIMsg(text, true);

  var box = document.getElementById('vaiSpeechText');
  if (box) box.innerHTML = '<span style="opacity:.5;font-style:italic">Thinking...</span>';

  try {
    if (/telugu|à°¤à±†à°²à±à°—à±|à°¤à±†à°²à±à°—à±à°²à±‹|à°®à°¾à°Ÿà±à°²à°¾à°¡à±|matladu/i.test(text)) {
      VE.detectedLang = 'te-IN'; VE.userLanguage = 'telugu'; VE_updateLangBadge();
    }
    var langPrefix = VE.userLanguage === 'telugu' ? '[LANGUAGE=telugu] ' : '[LANGUAGE=english] ';
    var isQuestion = /\?|what|why|how|when|where|who|can you|could you|explain|tell me/i.test(text);
    var finalMsg   = (isQuestion ? '[USER_QUESTION] ' : '') + langPrefix + text;

    if (typeof interviewMessage !== 'function') throw new Error('Interview service not ready.');
    var data = await interviewMessage(VE.sessionId, finalMsg);

    if (data.feedback) { VE_updateScores(data.feedback); updateFeedback(data.feedback); }
    if (data.aiMessage) {
      addAIMsg(data.aiMessage, false);
      var aiLang = VE_detectLang(data.aiMessage);
      if (aiLang && aiLang !== VE.detectedLang) { VE.detectedLang = aiLang; VE_updateLangBadge(); }
      VE_setStatus(VE_STATUS.speaking);
      VE_speak(data.aiMessage, function() {
        if (VE.active) { VE_setStatus(VE_STATUS.listening); VE_doListen(); }
      });
    }
  } catch(err) {
    showToast('AI error â€” listening again.', 'error');
    VE_setPhase('idle');
    VE_setStatus('Error â€” trying again...');
    if (box) box.textContent = '';
    setTimeout(function() { if (VE.active) VE_doListen(); }, 1500);
  }
}

function VE_updateScores(fb) {
  [['vConfVal', fb.confidenceScore],['vCommVal', fb.communicationScore],['vTechVal', fb.technicalScore]].forEach(function(pair) {
    var el = document.getElementById(pair[0]);
    var s  = pair[1];
    if (!el) return;
    el.textContent = s != null ? s + '%' : 'â€”';
    el.style.color = s >= 80 ? '#10b981' : s >= 60 ? '#6366f1' : '#f59e0b';
  });
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   OPEN VOICE MODAL
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
window.startVoiceInterview = function() {
  var loggedIn = (typeof isLoggedIn === 'function') ? isLoggedIn() : false;
  if (!loggedIn) { openAuthModal('login'); showToast('Sign in to use Voice Interview.', 'info'); return; }
  VE.active = false; VE.sessionId = null;
  VE.mode = aiMode; VE.detectedLang = 'en-US'; VE.userLanguage = 'english'; VE.loudFrames = 0;
  VE_updateLangBadge();
  var modal = document.getElementById('voiceModal');
  if (modal) modal.classList.add('open');
  document.body.style.overflow = 'hidden';
  var perm = document.getElementById('vScreenPermission');
  var intr = document.getElementById('vScreenInterview');
  if (perm) perm.style.display = 'flex';
  if (intr) intr.style.display = 'none';
  VE_warmupTTS();
};

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   GRANT MIC
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function _initVoiceModal() {
  var grantBtn = document.getElementById('vGrantMicBtn');
  if (grantBtn) {
    grantBtn.addEventListener('click', async function() {
      setLoading(grantBtn, true);
      try {
        var stream = await VE_getMicStream();
        await VE_initBargeIn(stream);
        var perm = document.getElementById('vScreenPermission');
        var intr = document.getElementById('vScreenInterview');
        if (perm) perm.style.display = 'none';
        if (intr) intr.style.display = 'flex';
        VE.active = true;
        await VE_beginSession();
      } catch(err) {
        showToast('Microphone denied. Enable it in browser settings.', 'error');
      } finally {
        setLoading(grantBtn, false);
      }
    });
  }

  var vtypeSend  = document.getElementById('vtypeSend');
  var vtypeInput = document.getElementById('vtypeInput');
  if (vtypeSend)  vtypeSend.addEventListener('click', VE_typeSubmit);
  if (vtypeInput) vtypeInput.addEventListener('keydown', function(e) { if (e.key==='Enter'){e.preventDefault();VE_typeSubmit();} });
}

async function VE_initBargeIn(existingStream) {
  try {
    VE.micStream = existingStream || await VE_getMicStream();
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    VE.audioCtx = new AC();
    if (VE.audioCtx.state === 'suspended') {
      try { await VE.audioCtx.resume(); } catch(e) {}
    }
    var source  = VE.audioCtx.createMediaStreamSource(VE.micStream);
    VE.analyser = VE.audioCtx.createAnalyser();
    VE.analyser.fftSize = 1024;
    source.connect(VE.analyser);
  } catch(e) {}
}

async function VE_beginSession() {
  VE_setPhase('processing');
  VE_setStatus('Connecting to Priya...');
  var box = document.getElementById('vaiSpeechText');
  if (box) box.textContent = '';
  VE_showTranscript('');
  VE_startBargeMonitor();

  try {
    if (typeof interviewStart !== 'function') throw new Error('Interview service not ready.');
    var started = await interviewStart('Software Engineer', 'General', VE.mode, 'intermediate');
    VE.sessionId  = started.interview._id;
    aiInterviewId = VE.sessionId;

    var firstMsg = started.interview && started.interview.messages && started.interview.messages.find(function(m){return m.role==='ai';});
    var opener   = (firstMsg && firstMsg.content) || VE_getOpener();
    // Trim at sentence boundary, not mid-word
    if (opener.length > 250) {
      var trimmed = opener.substring(0, 250);
      var lastPunct = Math.max(trimmed.lastIndexOf('.'), trimmed.lastIndexOf('!'), trimmed.lastIndexOf('?'));
      opener = lastPunct > 100 ? trimmed.substring(0, lastPunct+1) : trimmed + 'â€¦';
    }

    addAIMsg(opener, false);
    VE_setStatus(VE_STATUS.speaking);
    VE_speak(opener, function() {
      if (VE.active) { VE_setStatus(VE_STATUS.listening); VE_doListen(); }
    });
  } catch(err) {
    showToast('Could not start interview: ' + (err && err.message), 'error');
    VE_setPhase('idle');
    VE_setStatus('Connection failed. Please try again.');
    if (box) box.textContent = 'Could not connect. Please close and try again.';
  }
}

function VE_getOpener() {
  var openers = {
    mixed:     "Hi! I'm Priya, your interview coach. We'll cover behavioral and technical questions. Let's start â€” tell me about yourself and the role you're preparing for.",
    hr:        "Hi! I'm Priya. We're focusing on behavioral questions using the STAR method. Let's begin â€” tell me about a time you showed strong leadership under pressure.",
    technical: "Hi! I'm Priya. We're diving into technical questions today. First problem: given an array of integers, how would you find two numbers that sum to a target value?",
  };
  return openers[VE.mode] || openers.mixed;
}

function VE_typeSubmit() {
  var inp = document.getElementById('vtypeInput');
  var txt = inp && inp.value.trim();
  if (!txt || !VE.active) return;
  inp.value = '';
  VE_stopListening();
  VE.finalText = txt;
  VE_submitAnswer(txt);
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   CLOSE MODAL â€” full teardown
   BUG FIX: Mic tracks were not stopped â†’ mic indicator stayed on.
   BUG FIX: AudioContext not closed â†’ memory leak.
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
window.closeVoiceModal = function() {
  // 1. Mark inactive first (stops callbacks from re-triggering)
  VE.active = false;

  // 2. Stop all speech
  VE_synthStop();

  // 3. Stop + destroy SR
  clearTimeout(VE.silenceTimer);
  VE.isStarting = false;
  VE_destroyRec();

  // 4. Stop VAD
  VE.vadRunning = false;
  VE.loudFrames = 0;

  // 5. Release mic + close AudioContext
  try { if (VE.audioCtx) VE.audioCtx.close(); } catch(e) {}
  if (VE.micStream) {
    try { VE.micStream.getTracks().forEach(function(t){ t.stop(); }); } catch(e) {}
  }
  VE.audioCtx  = null;
  VE.analyser  = null;
  VE.micStream = null;

  // 6. Reset state
  VE.sessionId    = null;
  VE.finalText    = '';
  VE.interimText  = '';
  VE.detectedLang = 'en-US';
  VE.userLanguage = 'english';
  VE.phase        = 'idle';
  VE.ttsStartedAt = 0;
  VE.lastBargeAt  = 0;

  // 7. Reset UI
  VE_setPhase('idle');
  VE_setStatus('');
  var box = document.getElementById('vaiSpeechText');
  if (box) box.textContent = '';
  VE_showTranscript('');
  var grantBtn = document.getElementById('vGrantMicBtn');
  if (grantBtn) setLoading(grantBtn, false);

  // 8. Close modal
  var modal = document.getElementById('voiceModal');
  if (modal) modal.classList.remove('open');
  document.body.style.overflow = '';
};

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   19. SINGLE INIT POINT
   BUG FIX: wireButtons() was called twice â€” once in DOMContentLoaded
   AND once in the immediate readyState check below, registering all
   event listeners twice. Now only one call path exists.
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function _appInit() {
  // Prevent double-init
  if (_appInit._done) return;
  _appInit._done = true;

  try { _initNav();           } catch(e) { console.warn('Nav init failed:', e); }
  try { _initSmoothScroll();  } catch(e) { console.warn('Scroll init failed:', e); }
  try { _initScrollReveal();  } catch(e) { console.warn('Reveal init failed:', e); }
  try { _initResumeChips();   } catch(e) { console.warn('Resume chips failed:', e); }
  try { _initAuthModal();     } catch(e) { console.warn('Auth modal failed:', e); }
  try { _initAIPanel();       } catch(e) { console.warn('AI panel failed:', e); }
  try { _initDashTabs();      } catch(e) { console.warn('Dash tabs failed:', e); }
  try { _initVoiceModal();    } catch(e) { console.warn('Voice modal failed:', e); }
  try { wireButtons();        } catch(e) { console.warn('Wire buttons failed:', e); }
  try { updateAuthUI();       } catch(e) { console.warn('Auth UI failed:', e); }
  try { loadDashboard();      } catch(e) { console.warn('Dashboard failed:', e); }
  try { loadHeroStats();      } catch(e) { console.warn('Hero stats failed:', e); }
  try { handleEmailVerification(); } catch(e) { console.warn('Email verify failed:', e); }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', _appInit);
} else {
  // DOM already ready (VS Code Live Server quirk)
  _appInit();
}

