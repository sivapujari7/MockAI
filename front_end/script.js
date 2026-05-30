

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

function sendMessage() {
  const input = document.getElementById('demoInput');
  const text = input.value.trim();
  if (!text) return;
  addMessage(text, true);
  input.value = '';
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