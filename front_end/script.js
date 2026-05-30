

// Loader
window.addEventListener('load', () => {
  setTimeout(() => {
    const loader = document.getElementById('loader');
    loader.style.opacity = '0';
    loader.style.transition = 'opacity 0.6s ease';
    setTimeout(() => { loader.style.display = 'none'; }, 600);
  }, 1500);
});

// Scroll reveal
const revealEls = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      const delay = parseFloat(entry.target.style.transitionDelay || '0') * 1000;
      setTimeout(() => entry.target.classList.add('visible'), delay);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
revealEls.forEach(el => observer.observe(el));

// Nav scroll
window.addEventListener('scroll', () => {
  document.getElementById('mainNav').classList.toggle('scrolled', window.scrollY > 40);
});

// Mobile nav
document.getElementById('hamburger').addEventListener('click', () => {
  document.getElementById('mobileNav').classList.add('open');
});
document.getElementById('mobileClose').addEventListener('click', () => {
  document.getElementById('mobileNav').classList.remove('open');
});
document.querySelectorAll('.mobile-nav a').forEach(a => {
  a.addEventListener('click', () => document.getElementById('mobileNav').classList.remove('open'));
});

// FAQ
function toggleFaq(btn) {
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
}

// Demo chat
const aiResponses = [
  "Excellent response! You've clearly demonstrated your problem-solving skills with a concrete example. To make it even stronger, quantify the impact — for instance, 'reduced load time by 40%' or 'saved the company $50K'. What was the measurable outcome of your fix?",
  "Great structure! I can see you're using the STAR method effectively. Your situation and task were clear. Tell me more about the specific actions you personally took — emphasize your individual contribution to the team's success.",
  "Confident delivery! Your communication score is high. I'd suggest adding a brief mention of what you *learned* from this experience — interviewers love candidates who show self-awareness and continuous growth mindset.",
  "Strong answer! The technical details you included show depth. Now, can you walk me through how you'd approach this problem differently if you had to scale the solution to handle 10× the traffic?",
  "Well articulated! You covered the key points. As a follow-up: how did this experience shape how you approach similar challenges today? Connecting past experiences to your current thinking shows maturity.",
];
let msgCount = 0;
let activeInterviewId = null;
const tips = [
  ["Quantify your achievements with specific numbers and metrics for stronger impact.", "Use the STAR method — Situation, Task, Action, Result — for structured answers.", "Maintain a confident tone; avoid filler words like 'um' and 'like'."],
  ["Lead with the outcome first, then explain how you got there — top-down structure is powerful.", "Include your individual contribution clearly; don't hide behind 'we'.", "End with a reflection on what you learned or would do differently."],
  ["Tie your answer directly to the job requirements when possible.", "Use specific technical terminology to demonstrate domain knowledge.", "Keep answers between 90–120 seconds — concise yet complete."],
];

function addMessage(text, isUser) {
  const messages = document.getElementById('demoMessages');
  const msg = document.createElement('div');
  msg.className = 'demo-msg' + (isUser ? ' user' : '');
  msg.innerHTML = isUser
    ? `<div class="demo-ava user">ME</div><div class="demo-bubble">${text}</div>`
    : `<div class="demo-ava ai">🤖</div><div class="demo-bubble">${text}</div>`;
  messages.appendChild(msg);
  messages.scrollTop = messages.scrollHeight;
}

function updateScores() {
  const conf = Math.floor(72 + Math.random() * 25);
  const comm = Math.floor(75 + Math.random() * 22);
  const tech = Math.floor(65 + Math.random() * 30);
  document.getElementById('confScore').textContent = conf + '%';
  document.getElementById('commScore').textContent = comm + '%';
  document.getElementById('techScore').textContent = tech + '%';
  document.getElementById('confBar').style.width = conf + '%';
  document.getElementById('commBar').style.width = comm + '%';
  document.getElementById('techBar').style.width = tech + '%';
  const tipSet = tips[msgCount % tips.length];
  document.getElementById('tip1').textContent = tipSet[0];
  document.getElementById('tip2').textContent = tipSet[1];
  document.getElementById('tip3').textContent = tipSet[2];
}

function notify(message, type = 'info') {
  if (typeof showToast === 'function') showToast(message, type);
  else console.log(`${type}: ${message}`);
}

function renderInterviewMessages(interview) {
  const messages = document.getElementById('demoMessages');
  if (!messages || !interview?.messages?.length) return;

  messages.innerHTML = '';
  interview.messages.forEach((message) => {
    addMessage(message.content.replace(/\*\*/g, ''), message.role === 'user');
  });
}

function applyBackendFeedback(feedback) {
  if (!feedback) return;

  const confidence = feedback.confidenceScore || 0;
  const communication = feedback.communicationScore || 0;
  const technical = feedback.technicalScore || 0;

  document.getElementById('confScore').textContent = `${confidence}%`;
  document.getElementById('commScore').textContent = `${communication}%`;
  document.getElementById('techScore').textContent = `${technical}%`;
  document.getElementById('confBar').style.width = `${confidence}%`;
  document.getElementById('commBar').style.width = `${communication}%`;
  document.getElementById('techBar').style.width = `${technical}%`;

  const feedbackTips = feedback.tips || [];
  document.getElementById('tip1').textContent = feedbackTips[0] || feedback.summary || 'Keep the answer structured and specific.';
  document.getElementById('tip2').textContent = feedbackTips[1] || 'Add measurable outcomes where possible.';
  document.getElementById('tip3').textContent = feedbackTips[2] || 'Close with what you learned from the experience.';
}

async function sendMessage() {
  const input = document.getElementById('demoInput');
  const text = input.value.trim();
  if (!text) return;
  addMessage(text, true);
  input.value = '';

  if (activeInterviewId && typeof interviewMessage === 'function') {
    try {
      const data = await interviewMessage(activeInterviewId, text);
      applyBackendFeedback(data.feedback);
      addMessage(data.aiMessage, false);
      return;
    } catch (error) {
      notify(error.message, 'error');
      activeInterviewId = null;
    }
  }

  updateScores();
  setTimeout(() => {
    const response = aiResponses[msgCount % aiResponses.length];
    addMessage(response, false);
    msgCount++;
  }, 900);
}

document.getElementById('demoSend').addEventListener('click', sendMessage);
document.getElementById('demoInput').addEventListener('keypress', e => {
  if (e.key === 'Enter') sendMessage();
});

function loadQuestion(chip) {
  const q = chip.getAttribute('data-q');
  addMessage(q, false);
  document.getElementById('demoInput').focus();
}

// Role chips (how it works)
document.querySelectorAll('.role-chip').forEach(chip => {
  chip.addEventListener('click', function() {
    this.closest('.job-role-selector, div').querySelectorAll('.role-chip').forEach(c => c.classList.remove('active'));
    this.classList.add('active');
  });
});

// Dashboard nav items
document.querySelectorAll('.dash-nav-item').forEach(item => {
  item.addEventListener('click', function() {
    document.querySelectorAll('.dash-nav-item').forEach(i => i.classList.remove('active'));
    this.classList.add('active');
  });
});
document.querySelectorAll('.dash-sidebar-item').forEach(item => {
  item.addEventListener('click', function() {
    document.querySelectorAll('.dash-sidebar-item').forEach(i => i.classList.remove('active'));
    this.classList.add('active');
  });
});

// Particles
(function() {
  const canvas = document.getElementById('particles-canvas');
  const ctx = canvas.getContext('2d');
  let particles = [];
  let W, H;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const colors = ['rgba(108,99,255,', 'rgba(0,212,255,', 'rgba(124,58,237,', 'rgba(167,139,250,'];

  for (let i = 0; i < 60; i++) {
    particles.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.5 + 0.3,
      color: colors[Math.floor(Math.random() * colors.length)],
      opacity: Math.random() * 0.5 + 0.1,
    });
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color + p.opacity + ')';
      ctx.fill();
    });

    // Draw connections
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(108,99,255,${0.04 * (1 - dist / 120)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(draw);
  }
  draw();
})();

// Animate bars on scroll
const barObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.querySelectorAll('.bar-fill').forEach(bar => {
        const w = bar.style.width;
        bar.style.width = '0';
        setTimeout(() => { bar.style.width = w; }, 200);
      });
    }
  });
}, { threshold: 0.3 });
document.querySelectorAll('.feedback-panel').forEach(el => barObserver.observe(el));

// Smooth scroll for all anchor links
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth' }); }
  });
});

function createAuthModal() {
  if (document.getElementById('authModal')) return;

  const modal = document.createElement('div');
  modal.id = 'authModal';
  modal.className = 'auth-modal';
  modal.innerHTML = `
    <div class="auth-dialog" role="dialog" aria-modal="true" aria-labelledby="authTitle">
      <button class="auth-close" type="button" aria-label="Close">x</button>
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
      <div class="verification-fallback" id="verificationFallback" hidden></div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.addEventListener('click', (event) => {
    if (event.target === modal || event.target.classList.contains('auth-close')) closeAuthModal();
  });

  modal.querySelectorAll('[data-auth-tab]').forEach((tab) => {
    tab.addEventListener('click', () => switchAuthMode(tab.dataset.authTab));
  });

  document.getElementById('loginForm').addEventListener('submit', handleLoginSubmit);
  document.getElementById('registerForm').addEventListener('submit', handleRegisterSubmit);
}

function switchAuthMode(mode) {
  const isRegister = mode === 'register';
  const title = document.getElementById('authTitle');
  const sub = document.getElementById('authSub');

  document.querySelectorAll('.auth-tab').forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.authTab === mode);
  });
  document.getElementById('loginForm').classList.toggle('active', !isRegister);
  document.getElementById('registerForm').classList.toggle('active', isRegister);

  title.textContent = isRegister ? 'Create account' : 'Sign in';
  sub.textContent = isRegister
    ? 'Create your account, verify your email, then sign in to start backend interviews.'
    : 'Continue your interview practice with saved progress and backend feedback.';

  clearVerificationFallback();
}

function openAuthModal(mode = 'login') {
  createAuthModal();
  switchAuthMode(mode);
  document.getElementById('authModal').classList.add('open');
}

function closeAuthModal() {
  document.getElementById('authModal')?.classList.remove('open');
}

function clearVerificationFallback() {
  const box = document.getElementById('verificationFallback');
  if (!box) return;

  box.hidden = true;
  box.innerHTML = '';
}

function showVerificationFallback(url) {
  const box = document.getElementById('verificationFallback');
  if (!box || !url) return;

  const text = document.createElement('p');
  text.textContent = 'Email could not be sent from this local setup. Use this verification link:';

  const link = document.createElement('a');
  link.href = url;
  link.textContent = 'Verify my account';
  link.target = '_self';

  const copyButton = document.createElement('button');
  copyButton.type = 'button';
  copyButton.textContent = 'Copy Link';
  copyButton.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(url);
      notify('Verification link copied.', 'success');
    } catch {
      notify(url, 'info');
    }
  });

  box.innerHTML = '';
  box.append(text, link, copyButton);
  box.hidden = false;
}

async function handleLoginSubmit(event) {
  event.preventDefault();
  const submit = event.currentTarget.querySelector('button[type="submit"]');
  const form = new FormData(event.currentTarget);

  setLoading(submit, true);
  try {
    await authLogin(form.get('email'), form.get('password'));
    closeAuthModal();
    updateAuthButtons();
    notify('Signed in successfully. You can start a backend interview now.', 'success');
  } catch (error) {
    notify(error.message, 'error');
  } finally {
    setLoading(submit, false);
  }
}

async function handleRegisterSubmit(event) {
  event.preventDefault();
  const submit = event.currentTarget.querySelector('button[type="submit"]');
  const form = new FormData(event.currentTarget);

  setLoading(submit, true);
  try {
    const data = await authRegister(
      form.get('name'),
      form.get('email'),
      form.get('password'),
      form.get('college'),
      form.get('targetRole')
    );
    switchAuthMode('login');
    if (data.verificationUrl) {
      showVerificationFallback(data.verificationUrl);
      notify('Account created. Use the verification link shown in the dialog.', 'warning');
    } else {
      notify(data.message || 'Account created. Check your email to verify before signing in.', 'success');
    }
  } catch (error) {
    notify(error.message, 'error');
  } finally {
    setLoading(submit, false);
  }
}

async function startBackendInterview(event) {
  event?.preventDefault();

  if (typeof isLoggedIn !== 'function' || !isLoggedIn()) {
    openAuthModal('login');
    notify('Sign in first, then start a saved backend interview.', 'info');
    return;
  }

  const btn = event?.currentTarget;
  setLoading(btn, true);

  try {
    const data = await interviewStart('Software Engineer', 'Google', 'mixed', 'intermediate');
    activeInterviewId = data.interview._id;
    renderInterviewMessages(data.interview);
    document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' });
    notify('Backend interview started. Your next messages will use the API.', 'success');
  } catch (error) {
    notify(error.message, 'error');
  } finally {
    setLoading(btn, false);
  }
}

function buttonText(button) {
  return button.textContent.replace(/\s+/g, ' ').trim().toLowerCase();
}

function updateAuthButtons() {
  const user = typeof getUser === 'function' ? getUser() : null;

  document.querySelectorAll('button').forEach((button) => {
    if (buttonText(button) === 'sign in' || button.dataset.authButton === 'login') {
      button.dataset.authButton = 'login';
      button.textContent = user ? `Hi, ${user.name?.split(' ')[0] || 'there'}` : 'Sign In';
    }
  });
}

async function handleEmailVerificationRoute() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');

  if (!token || !window.location.pathname.includes('verify-email')) return;

  try {
    const data = await authVerifyEmail(token);
    updateAuthButtons();
    notify(data.message || 'Email verified successfully.', 'success');
    window.history.replaceState({}, '', 'index.html#dashboard');
  } catch (error) {
    notify(error.message, 'error');
  }
}

function initBackendActions() {
  createAuthModal();

  document.querySelectorAll('button').forEach((button) => {
    const text = buttonText(button);

    if (text === 'sign in') {
      button.dataset.authButton = 'login';
      button.addEventListener('click', () => openAuthModal('login'));
    }

    if (text.includes('get started') || text.includes('start pro trial')) {
      button.addEventListener('click', () => openAuthModal('register'));
    }
  });

  document.querySelectorAll('.start-btn').forEach((button) => {
    button.addEventListener('click', startBackendInterview);
  });

  updateAuthButtons();

  if (typeof apiHealth === 'function') {
    apiHealth().catch((error) => console.info(error.message));
  }

  handleEmailVerificationRoute();
}

initBackendActions();
const uploadBtn = document.getElementById("uploadResumeBtn");

if (uploadBtn) {
  uploadBtn.addEventListener("click", async () => {

    const file =
      document.getElementById("resumeFile").files[0];

    if (!file) {
      alert("Select a resume first");
      return;
    }

    const formData = new FormData();
    formData.append("resume", file);

    const response = await fetch(
      "http://localhost:5001/api/resume/upload",
      {
        method: "POST",
        body: formData
      }
    );

    const data = await response.json();

    console.log(data);

    document.getElementById("resumeResult").innerHTML = `
      <h3>ATS Score: ${data.analysis.atsScore}%</h3>

      <p><b>Skills:</b>
      ${data.analysis.skillsFound.join(", ")}</p>

      <p><b>Missing Skills:</b>
      ${data.analysis.missingSkills.join(", ")}</p>

      <p><b>Suggestions:</b>
      ${data.analysis.improvements.join(", ")}</p>
    `;
  });
}
