/**
 * DDS Abril Verde 2026 — main.js
 * Inclui:
 * - Rastreamento de imagem estável com MindAR + A-Frame
 * - Controles HUD (Áudio, Vídeo, Inspeção 3D de EPIs .GLB, e Quiz Gamificado)
 * - Rotação 3D interativa por toque/mouse e zoom por pinça/scroll
 */

if (location.protocol === 'http:' && location.hostname !== 'localhost') {
  location.replace('https://' + location.host + location.pathname);
}

import './style.css';

// ─────────────────────────────────────────────────────────────────────────────
// Dados dos Modelos 3D de EPI (NR-6)
// ─────────────────────────────────────────────────────────────────────────────
const EPI_ITEMS = [
  {
    id: 'model-capacete',
    title: 'Capacete de Segurança (Classe B)',
    desc: 'Proteção craniana contra impactos de objetos em queda e choques elétricos. Inspecione a carneira, ajuste a jugular e verifique trincas antes do uso.'
  },
  {
    id: 'model-protetor',
    title: 'Abafador de Ruídos Tipo Concha',
    desc: 'Proteção auditiva em ambientes com pressão sonora elevada (NR-15). As almofadas devem vedar totalmente ao redor da orelha, sem folgas.'
  },
  {
    id: 'model-oculos',
    title: 'Óculos de Proteção em Policarbonato',
    desc: 'Proteção ocular contra projeção de partículas volantes, poeiras e radiação UV. Mantenha as lentes limpas e sem riscos para visão clara.'
  }
];

// ─────────────────────────────────────────────────────────────────────────────
// Perguntas do Quiz de Segurança (Abril Verde)
// ─────────────────────────────────────────────────────────────────────────────
const QUIZ_QUESTIONS = [
  {
    question: '1. Qual é o objetivo principal da campanha Abril Verde nas empresas?',
    options: [
      'Aumentar a velocidade de produção mensal',
      'Promover a cultura de prevenção de acidentes e doenças do trabalho',
      'Substituir o uso de EPIs por treinamentos online',
      'Realizar manutenção apenas em equipamentos elétricos'
    ],
    correct: 1,
    explanation: 'Correto! O Abril Verde conscientiza trabalhadores e gestores sobre saúde, segurança e prevenção de acidentes.'
  },
  {
    question: '2. Segundo a NR-6, quando um EPI apresenta danos, trincas ou desgaste que comprometam a proteção, o que você deve fazer?',
    options: [
      'Continuar usando até o final do mês',
      'Tentar consertar com fita isolante ou cola',
      'Comunicar imediatamente o setor responsável e solicitar a substituição',
      'Emprestar o EPI de um colega de outro setor'
    ],
    correct: 2,
    explanation: 'Exato! Todo EPI danificado perde sua eficácia e deve ser substituído imediatamente.'
  },
  {
    question: '3. Qual é o papel do Diálogo Diário de Segurança (DDS) antes do início das atividades?',
    options: [
      'Alinhar os riscos da tarefa do dia e reforçar medidas preventivas em equipe',
      'Apenas cumprir uma formalidade burocrática no papel',
      'Avaliar o desempenho financeiro da semana',
      'Dispensar a necessidade de inspeção das ferramentas'
    ],
    correct: 0,
    explanation: 'Perfeito! O DDS mantém o foco e a atenção da equipe nos riscos reais antes de começar o trabalho.'
  },
  {
    question: '4. Ao identificar uma condição insegura (ex: piso escorregadio, cabo desencapado ou falta de sinalização), qual é a atitude correta?',
    options: [
      'Ignorar se não for na sua bancada de trabalho',
      'Interromper o risco se seguro, sinalizar a área e acionar a supervisão/SESMT',
      'Esperar que a equipe do próximo turno resolva',
      'Passar rapidamente pelo local sem avisar ninguém'
    ],
    correct: 1,
    explanation: 'Isso mesmo! Segurança é responsabilidade de todos: perceber o risco e agir evita acidentes graves.'
  },
  {
    question: '5. Sobre a proteção auditiva e ocular (Abafador e Óculos de Segurança), qual afirmação está CORRETA?',
    options: [
      'Só precisam ser usados quando o supervisor estiver olhando',
      'Podem ser retirados durante operações rápidas de 1 minuto',
      'Devem ser utilizados durante todo o tempo de exposição ao risco na área operacional',
      'Óculos de grau comuns substituem os óculos de segurança padrão'
    ],
    correct: 2,
    explanation: 'Excelente! Acidentes acontecem em frações de segundo; a proteção deve ser contínua enquanto houver exposição ao risco.'
  }
];

// ─────────────────────────────────────────────────────────────────────────────
// Logica AR e Interatividade
// ─────────────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const startUi    = document.getElementById('start-ui');
  const startBtn   = document.getElementById('start-btn');
  const scanningUi = document.getElementById('scanning-ui');
  const scene      = document.querySelector('a-scene');

  // Elementos de HUD
  const controlsUi    = document.getElementById('controls-ui');
  const audioBtn      = document.getElementById('audio-btn');
  const audioEl       = document.getElementById('main-audio');
  const iconSoundOn   = document.getElementById('icon-sound-on');
  const iconSoundOff  = document.getElementById('icon-sound-off');

  const videoBtn      = document.getElementById('video-btn');
  const videoModal    = document.getElementById('video-modal');
  const videoClose    = document.getElementById('video-close');
  const videoEl       = document.getElementById('dds-video');

  // Elementos de Inspeção 3D (EPI)
  const epiBtn        = document.getElementById('epi-btn');
  const epiHud        = document.getElementById('epi-hud');
  const epiClose      = document.getElementById('epi-close');
  const epiTitle      = document.getElementById('epi-title');
  const epiDesc       = document.getElementById('epi-desc');
  const epiTabs       = document.querySelectorAll('.epi-tab');
  const epiResetRot   = document.getElementById('epi-reset-rot');
  const arChecklist   = document.getElementById('ar-checklist-group');
  const arEpiGroup    = document.getElementById('ar-epi-group');
  const epiRotator    = document.getElementById('epi-rotator');

  // Elementos do Quiz
  const quizBtn          = document.getElementById('quiz-btn');
  const quizScorePill    = document.getElementById('quiz-score-pill');
  const quizModal        = document.getElementById('quiz-modal');
  const quizClose        = document.getElementById('quiz-close');
  const quizBody         = document.getElementById('quiz-body');
  const quizResult       = document.getElementById('quiz-result');
  const quizProgressText = document.getElementById('quiz-progress-text');
  const quizProgressFill = document.getElementById('quiz-progress-fill');
  const quizQuestionEl   = document.getElementById('quiz-question');
  const quizOptionsEl    = document.getElementById('quiz-options');
  const quizFeedbackEl   = document.getElementById('quiz-feedback');
  const quizFeedbackText = document.getElementById('quiz-feedback-text');
  const quizNextBtn      = document.getElementById('quiz-next-btn');
  const quizResultTitle  = document.getElementById('quiz-result-title');
  const quizResultScore  = document.getElementById('quiz-result-score');
  const quizResultMsg    = document.getElementById('quiz-result-msg');
  const quizRetryBtn     = document.getElementById('quiz-retry-btn');
  const quizDoneBtn      = document.getElementById('quiz-done-btn');

  // Elementos do Cartaz / QR Code
  const posterBtn        = document.getElementById('poster-btn');
  const startPosterBtn   = document.getElementById('start-poster-btn');
  const posterModal      = document.getElementById('poster-modal');
  const posterClose      = document.getElementById('poster-close');

  function debug(msg, err) {
    err = err || false;
    console.log('[AR]', msg);
    const p2 = document.getElementById('debug-panel');
    if (!p2) return;

    while (p2.children.length > 20) {
      p2.removeChild(p2.firstChild);
    }

    const p = document.createElement('p');
    p.textContent = msg;
    p.style.color = err ? '#ff6666' : '#00ff88';
    p2.appendChild(p);
    p2.scrollTop = p2.scrollHeight;
  }

  startBtn.disabled = true;
  startBtn.textContent = 'Carregando...';

  const enableBtn = () => {
    debug('Pronto');
    startBtn.disabled = false;
    startBtn.textContent = '\u25b6 TOQUE PARA INICIAR';
  };

  if (scene.hasLoaded) {
    enableBtn();
  } else {
    scene.addEventListener('loaded', enableBtn);
  }

  startBtn.addEventListener('click', async () => {
    debug('Iniciando camera...');
    startBtn.textContent = 'Iniciando...';
    startBtn.disabled = true;
    try {
      const system = scene.systems['mindar-image-system'];
      if (!system) throw new Error('Sistema AR nao carregado. Recarregue a pagina.');
      await system.start();
      startUi.style.display = 'none';
      scanningUi.style.display = 'flex';

      if (controlsUi) {
        controlsUi.style.display = 'flex';
        debug('Controles HUD visiveis');
      }
      audioEl.play().catch(e => debug('Erro play: ' + e.message));

    } catch (err) {
      debug('ERRO: ' + err.message, true);
      startBtn.textContent = 'Erro — Toque novamente';
      startBtn.disabled = false;
      alert(
        'Nao foi possivel acessar a camera.\n\n' +
        'Verifique:\n' +
        '- Permissao de camera concedida ao navegador\n' +
        '- Se outro app esta usando a camera\n\n' +
        'Erro: ' + err.message
      );
    }
  });

  const target = document.querySelector('[mindar-image-target]');
  if (target) {
    target.addEventListener('targetFound', () => {
      if (scanningUi) {
        scanningUi.style.opacity = '0';
        setTimeout(() => { scanningUi.style.display = 'none'; }, 500);
      }
    });
    target.addEventListener('targetLost', () => {
      if (scanningUi) {
        scanningUi.style.display = 'flex';
        requestAnimationFrame(() => { scanningUi.style.opacity = '1'; });
      }
    });
  }

  // Previne zoom acidental do navegador mantendo clique nos modais
  document.addEventListener('touchmove', e => {
    if (!e.target.closest('#quiz-modal')) {
      e.preventDefault();
    }
  }, { passive: false });

  let lt = 0;
  document.addEventListener('touchend', e => {
    const n = Date.now();
    if (n - lt <= 300) e.preventDefault();
    lt = n;
  }, false);

  // ───────────────────────────────────────────────────────────────────────────
  // 1. Toggle do Áudio
  // ───────────────────────────────────────────────────────────────────────────
  if (audioBtn) {
    audioBtn.addEventListener('click', () => {
      if (audioEl.paused) {
        audioEl.play();
        audioBtn.classList.remove('muted');
        iconSoundOn.style.display = 'block';
        iconSoundOff.style.display = 'none';
      } else {
        audioEl.pause();
        audioBtn.classList.add('muted');
        iconSoundOn.style.display = 'none';
        iconSoundOff.style.display = 'block';
      }
    });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 2. Lógica do Vídeo
  // ───────────────────────────────────────────────────────────────────────────
  if (videoBtn && videoModal && videoClose) {
    videoBtn.addEventListener('click', () => {
      audioEl.pause();
      videoModal.style.display = 'flex';
      videoEl.play().catch(e => debug('Erro play vídeo: ' + e.message));
    });

    videoClose.addEventListener('click', () => {
      videoEl.pause();
      videoEl.currentTime = 0;
      videoModal.style.display = 'none';

      if (!audioBtn.classList.contains('muted')) {
        audioEl.play().catch(e => debug('Erro resume áudio: ' + e.message));
      }
    });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 3. Inspeção 3D de EPIs (.GLB) + Rotação Touch/Mouse
  // ───────────────────────────────────────────────────────────────────────────
  let isEpiMode = false;
  let rotX = 15;
  let rotY = 0;
  let modelScale = 1.35;
  let autoSpinId = null;
  let isDragging = false;
  let prevX = 0;
  let prevY = 0;
  let prevPinchDist = null;

  function applyEpiTransform() {
    if (!epiRotator) return;
    epiRotator.setAttribute('rotation', `${rotX} ${rotY} 0`);
    epiRotator.setAttribute('scale', `${modelScale} ${modelScale} ${modelScale}`);
  }

  function startAutoSpin() {
    stopAutoSpin();
    const spin = () => {
      if (isEpiMode && !isDragging) {
        rotY = (rotY + 0.6) % 360;
        applyEpiTransform();
      }
      autoSpinId = requestAnimationFrame(spin);
    };
    autoSpinId = requestAnimationFrame(spin);
  }

  function stopAutoSpin() {
    if (autoSpinId) {
      cancelAnimationFrame(autoSpinId);
      autoSpinId = null;
    }
  }

  function setEpiMode(active) {
    isEpiMode = active;
    if (arChecklist) arChecklist.setAttribute('visible', !active);
    if (arEpiGroup) arEpiGroup.setAttribute('visible', active);
    if (epiHud) epiHud.style.display = active ? 'block' : 'none';
    if (epiBtn) epiBtn.classList.toggle('active', active);

    if (active) {
      startAutoSpin();
    } else {
      stopAutoSpin();
    }
  }

  function selectEpiModel(index) {
    const item = EPI_ITEMS[index];
    if (!item) return;

    EPI_ITEMS.forEach((epi, idx) => {
      const el = document.getElementById(epi.id);
      if (el) el.setAttribute('visible', idx === index);
    });

    if (epiTitle) epiTitle.textContent = item.title;
    if (epiDesc) epiDesc.textContent = item.desc;

    epiTabs.forEach((tab, idx) => {
      tab.classList.toggle('active', idx === index);
    });

    // Reseta ângulo ao trocar de EPI
    rotX = 15;
    rotY = 0;
    modelScale = 1.35;
    applyEpiTransform();
  }

  if (epiBtn) {
    epiBtn.addEventListener('click', () => {
      setEpiMode(!isEpiMode);
    });
  }

  if (epiClose) {
    epiClose.addEventListener('click', () => {
      setEpiMode(false);
    });
  }

  if (epiResetRot) {
    epiResetRot.addEventListener('click', () => {
      rotX = 15;
      rotY = 0;
      modelScale = 1.35;
      applyEpiTransform();
    });
  }

  epiTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const idx = parseInt(tab.getAttribute('data-epi'), 10);
      selectEpiModel(idx);
    });
  });

  // Gestos de Touch & Mouse para girar e dar zoom no modelo 3D
  window.addEventListener('pointerdown', e => {
    if (!isEpiMode) return;
    if (e.target.closest('#controls-ui, #epi-hud, #video-modal, #quiz-modal, #poster-modal')) return;
    isDragging = true;
    prevX = e.clientX;
    prevY = e.clientY;
  });

  window.addEventListener('pointermove', e => {
    if (!isEpiMode || !isDragging) return;
    const dx = e.clientX - prevX;
    const dy = e.clientY - prevY;
    prevX = e.clientX;
    prevY = e.clientY;

    rotY += dx * 0.65;
    rotX = Math.max(-65, Math.min(65, rotX + dy * 0.5));
    applyEpiTransform();
  });

  window.addEventListener('pointerup', () => {
    isDragging = false;
  });

  window.addEventListener('touchstart', e => {
    if (!isEpiMode || e.touches.length !== 2) return;
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    prevPinchDist = Math.hypot(dx, dy);
  }, { passive: true });

  window.addEventListener('touchmove', e => {
    if (!isEpiMode || e.touches.length !== 2 || !prevPinchDist) return;
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    const dist = Math.hypot(dx, dy);
    const ratio = dist / prevPinchDist;
    prevPinchDist = dist;

    modelScale = Math.max(0.75, Math.min(2.2, modelScale * ratio));
    applyEpiTransform();
  }, { passive: true });

  window.addEventListener('touchend', () => {
    prevPinchDist = null;
  });

  window.addEventListener('wheel', e => {
    if (!isEpiMode) return;
    modelScale = Math.max(0.75, Math.min(2.2, modelScale - e.deltaY * 0.001));
    applyEpiTransform();
  }, { passive: true });

  // ───────────────────────────────────────────────────────────────────────────
  // 4. Quiz de Segurança & Gamificação
  // ───────────────────────────────────────────────────────────────────────────
  let currentQuestion = 0;
  let score = 0;
  let answered = false;

  // Carrega pontuação salva se existir
  const savedScore = localStorage.getItem('abril_verde_quiz_score');
  if (savedScore !== null && quizScorePill) {
    quizScorePill.style.display = 'block';
    quizScorePill.textContent = `${savedScore}/${QUIZ_QUESTIONS.length}`;
  }

  function renderQuestion() {
    answered = false;
    const qData = QUIZ_QUESTIONS[currentQuestion];
    const total = QUIZ_QUESTIONS.length;

    quizBody.style.display = 'block';
    quizResult.style.display = 'none';
    quizFeedbackEl.style.display = 'none';

    quizProgressText.textContent = `${currentQuestion + 1} / ${total}`;
    quizProgressFill.style.width = `${((currentQuestion + 1) / total) * 100}%`;
    quizQuestionEl.textContent = qData.question;

    quizOptionsEl.innerHTML = '';
    qData.options.forEach((optText, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'quiz-opt-btn';
      btn.textContent = optText;
      btn.addEventListener('click', () => handleAnswer(idx, btn));
      quizOptionsEl.appendChild(btn);
    });
  }

  function handleAnswer(selectedIndex, clickedBtn) {
    if (answered) return;
    answered = true;

    const qData = QUIZ_QUESTIONS[currentQuestion];
    const allBtns = quizOptionsEl.querySelectorAll('.quiz-opt-btn');
    allBtns.forEach((b, idx) => {
      b.disabled = true;
      if (idx === qData.correct) {
        b.classList.add('correct');
      }
    });

    if (selectedIndex === qData.correct) {
      score++;
    } else {
      clickedBtn.classList.add('wrong');
    }

    quizFeedbackText.textContent = qData.explanation;
    quizNextBtn.textContent =
      currentQuestion < QUIZ_QUESTIONS.length - 1 ? 'PRÓXIMA PERGUNTA \u2192' : 'VER CERTIFICADO \u2605';
    quizFeedbackEl.style.display = 'flex';
  }

  function showQuizResults() {
    quizBody.style.display = 'none';
    quizResult.style.display = 'block';

    const total = QUIZ_QUESTIONS.length;
    const pct = Math.round((score / total) * 100);
    quizResultScore.textContent = `${score} / ${total} (${pct}%)`;

    if (score === total) {
      quizResultTitle.textContent = 'Guardião Mestre Abril Verde';
      quizResultMsg.textContent =
        'Parabéns! Você gabaritou o desafio e demonstrou domínio total das práticas de prevenção e uso de EPIs.';
    } else if (score >= 3) {
      quizResultTitle.textContent = 'Agente de Prevenção';
      quizResultMsg.textContent =
        'Ótimo resultado! Continue atento aos procedimentos de segurança e incentive sua equipe no DDS.';
    } else {
      quizResultTitle.textContent = 'Aprendiz de Segurança';
      quizResultMsg.textContent =
        'Bom começo! Revise o checklist e os EPIs em 3D na Realidade Aumentada e tente novamente para conquistar 100%.';
    }

    localStorage.setItem('abril_verde_quiz_score', String(score));
    if (quizScorePill) {
      quizScorePill.style.display = 'block';
      quizScorePill.textContent = `${score}/${total}`;
    }
  }

  function openQuiz() {
    currentQuestion = 0;
    score = 0;
    renderQuestion();
    quizModal.style.display = 'flex';
  }

  if (quizBtn) {
    quizBtn.addEventListener('click', openQuiz);
  }

  if (quizClose) {
    quizClose.addEventListener('click', () => {
      quizModal.style.display = 'none';
    });
  }

  if (quizDoneBtn) {
    quizDoneBtn.addEventListener('click', () => {
      quizModal.style.display = 'none';
    });
  }

  if (quizRetryBtn) {
    quizRetryBtn.addEventListener('click', openQuiz);
  }

  if (quizNextBtn) {
    quizNextBtn.addEventListener('click', () => {
      if (currentQuestion < QUIZ_QUESTIONS.length - 1) {
        currentQuestion++;
        renderQuestion();
      } else {
        showQuizResults();
      }
    });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 5. Modal do Cartaz / Marcador com QR Code
  // ───────────────────────────────────────────────────────────────────────────
  function openPosterModal() {
    if (posterModal) posterModal.style.display = 'flex';
  }

  if (posterBtn) {
    posterBtn.addEventListener('click', openPosterModal);
  }

  if (startPosterBtn) {
    startPosterBtn.addEventListener('click', openPosterModal);
  }

  if (posterClose) {
    posterClose.addEventListener('click', () => {
      posterModal.style.display = 'none';
    });
  }
});
