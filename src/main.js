/**
 * DDS Abril Verde 2026 — main.js
 * Arquitetura modularizada:
 * 1. Holograma Sci-Fi (Scanline Biométrico, Glow Pulse, Laço 3D GLTF + Símbolo PNG Alpha)
 * 2. Interatividade de Campo (Checklist Clicável com som, Check-in Digital no Netlify Forms + CSV, Voz do DDS do Dia)
 * 3. Gestão & Negócio (Consumo dinâmico de /dds-hoje.json, Métricas de Engajamento AR, Modo Offline PWA)
 * 4. Modo Híbrido Desktop / 3D Viewer (inspeção 3D e holograma sem precisar de marcador físico no laptop)
 */

if (location.protocol === 'http:' && location.hostname !== 'localhost') {
  location.replace('https://' + location.host + location.pathname);
}

import './style.css';
import { playBeep, playSuccessChord } from './components/sound-fx.js';
import { Analytics } from './components/analytics-tracker.js';
import { registerArComponents } from './components/ar-hologram-fx.js';

// Registra Service Worker para Modo Offline (PWA)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => console.warn('[PWA]', err));
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Estado Padrão (sobrescrito dinamicamente por /dds-hoje.json)
// ─────────────────────────────────────────────────────────────────────────────
let DDS_CONFIG = {
  campanha: 'DDS ABRIL VERDE 2026',
  dataAtualizacao: 'HOJE',
  temaDoDia: 'Prevenção Ativa & Inspeção Diária de Segurança',
  liderResponsavel: 'SESMT / CIPA — Gestão da Floresta',
  mensagemVozUrl: '/audio.m4a',
  mensagemTextoGuiado:
    'Bom dia, equipe! No DDS de hoje da campanha Abril Verde, reforçamos que nenhum trabalho é tão urgente que não possa ser feito com segurança. Antes de iniciar sua atividade, confira seu capacete, óculos e protetor auricular, inspecione suas ferramentas e sinalize qualquer risco na área. A nossa cultura protege!',
  checklist: [
    { id: 'chk-epi', categoria: 'EPI (NR-6)', titulo: 'EPIs inspecionados e em uso correto (Capacete, Óculos, Abafador)' },
    { id: 'chk-ferramentas', categoria: 'FERRAMENTAS', titulo: 'Ferramentas e equipamentos verificados antes da operação' },
    { id: 'chk-area', categoria: 'ÁREA E SINALIZAÇÃO', titulo: 'Área de trabalho limpa, isolada e livre de condições inseguras' },
    { id: 'chk-equipe', categoria: 'COMUNICAÇÃO', titulo: 'Riscos da atividade alinhados com a equipe no DDS de hoje' }
  ],
  epis3d: [
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
  ],
  quiz: []
};

// ─────────────────────────────────────────────────────────────────────────────
// Inicialização Principal
// ─────────────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  const startUi            = document.getElementById('start-ui');
  const startBtn           = document.getElementById('start-btn');
  const startDesktopBtn    = document.getElementById('start-desktop-btn');
  const startPosterBtn     = document.getElementById('start-poster-btn');
  const startDynamicTheme  = document.getElementById('start-dynamic-theme');
  const scanningUi         = document.getElementById('scanning-ui');
  const scene              = document.querySelector('a-scene');
  const mainCamera         = document.getElementById('main-camera');
  const targetAnchor       = document.getElementById('ar-target-anchor');

  // Banner Superior Dinâmico e Voz do Dia
  const ddsTopBanner       = document.getElementById('dds-top-banner');
  const ddsDateLabel       = document.getElementById('dds-date-label');
  const ddsThemeTitle      = document.getElementById('dds-theme-title');
  const voiceMsgBtn        = document.getElementById('voice-msg-btn');

  // Botões do HUD Lateral
  const controlsUi         = document.getElementById('controls-ui');
  const audioBtn           = document.getElementById('audio-btn');
  const audioEl            = document.getElementById('main-audio');
  const iconSoundOn        = document.getElementById('icon-sound-on');
  const iconSoundOff       = document.getElementById('icon-sound-off');

  const videoBtn           = document.getElementById('video-btn');
  const videoModal         = document.getElementById('video-modal');
  const videoClose         = document.getElementById('video-close');
  const videoEl            = document.getElementById('dds-video');

  const checklistBtn       = document.getElementById('checklist-btn');
  const checklistPctBadge  = document.getElementById('checklist-pct-badge');
  const checklistModal     = document.getElementById('checklist-modal');
  const checklistClose     = document.getElementById('checklist-close');
  const checklistProgLabel = document.getElementById('checklist-progress-label');
  const checklistProgFill  = document.getElementById('checklist-progress-fill');
  const checklistContainer = document.getElementById('checklist-items-container');
  const checkinForm        = document.getElementById('dds-checkin-form');
  const checkinSuccessMsg  = document.getElementById('checkin-success-msg');

  const epiBtn             = document.getElementById('epi-btn');
  const epiHud             = document.getElementById('epi-hud');
  const epiClose           = document.getElementById('epi-close');
  const epiTitle           = document.getElementById('epi-title');
  const epiDesc            = document.getElementById('epi-desc');
  const epiTabs            = document.querySelectorAll('.epi-tab');
  const epiResetRot        = document.getElementById('epi-reset-rot');
  const arChecklist        = document.getElementById('ar-checklist-group');
  const arEpiGroup         = document.getElementById('ar-epi-group');
  const epiRotator         = document.getElementById('epi-rotator');

  const desktopModeBtn     = document.getElementById('desktop-mode-btn');

  const quizBtn            = document.getElementById('quiz-btn');
  const quizScorePill      = document.getElementById('quiz-score-pill');
  const quizModal          = document.getElementById('quiz-modal');
  const quizClose          = document.getElementById('quiz-close');
  const quizBody           = document.getElementById('quiz-body');
  const quizResult         = document.getElementById('quiz-result');
  const quizProgressText   = document.getElementById('quiz-progress-text');
  const quizProgressFill   = document.getElementById('quiz-progress-fill');
  const quizQuestionEl     = document.getElementById('quiz-question');
  const quizOptionsEl      = document.getElementById('quiz-options');
  const quizFeedbackEl     = document.getElementById('quiz-feedback');
  const quizFeedbackText   = document.getElementById('quiz-feedback-text');
  const quizNextBtn        = document.getElementById('quiz-next-btn');
  const quizResultTitle    = document.getElementById('quiz-result-title');
  const quizResultScore    = document.getElementById('quiz-result-score');
  const quizResultMsg      = document.getElementById('quiz-result-msg');
  const quizRetryBtn       = document.getElementById('quiz-retry-btn');
  const quizDoneBtn        = document.getElementById('quiz-done-btn');

  const posterBtn          = document.getElementById('poster-btn');
  const posterModal        = document.getElementById('poster-modal');
  const posterClose        = document.getElementById('poster-close');
  const exportCheckinsBtn  = document.getElementById('export-checkins-btn');
  const metricSessionsEl   = document.getElementById('metric-sessions');
  const metricFocusEl      = document.getElementById('metric-focus');
  const metricCheckinsEl   = document.getElementById('metric-checkins');

  // 1. Registra A-Frame Components (Scanline, Glow Pulse, Spin e Target Listener)
  let isDesktop3DMode = false;

  registerArComponents({
    onTargetFound: () => {
      if (scanningUi) {
        scanningUi.style.opacity = '0';
        setTimeout(() => { scanningUi.style.display = 'none'; }, 500);
      }
      // Aciona o áudio guiado automaticamente ao detectar o target (se não estiver mutado)
      if (audioEl && audioEl.paused && !audioBtn.classList.contains('muted')) {
        audioEl.play().catch(() => {});
      }
    },
    onTargetLost: () => {
      if (!isDesktop3DMode && scanningUi) {
        scanningUi.style.display = 'flex';
        requestAnimationFrame(() => { scanningUi.style.opacity = '1'; });
      }
    }
  });

  // 2. Consome /dds-hoje.json dinamicamente
  try {
    const res = await fetch('/dds-hoje.json', { cache: 'no-cache' });
    if (res.ok) {
      const json = await res.json();
      DDS_CONFIG = { ...DDS_CONFIG, ...json };
    }
  } catch (err) {
    console.warn('[DDS JSON] Usando configuração local de fallback:', err);
  }

  if (startDynamicTheme) {
    startDynamicTheme.textContent = `Tema: ${DDS_CONFIG.temaDoDia}`;
  }
  if (ddsDateLabel) {
    ddsDateLabel.textContent = DDS_CONFIG.dataAtualizacao || 'HOJE';
  }
  if (ddsThemeTitle) {
    ddsThemeTitle.textContent = DDS_CONFIG.temaDoDia;
  }

  // 3. Habilita botão de início quando a cena A-Frame carregar
  startBtn.disabled = true;
  startBtn.textContent = 'Carregando...';

  const enableBtn = () => {
    startBtn.disabled = false;
    startBtn.textContent = '\u25b6 INICIAR CÂMERA AR';
  };

  if (scene.hasLoaded) {
    enableBtn();
  } else {
    scene.addEventListener('loaded', enableBtn);
  }

  function showHudAndBanner() {
    if (controlsUi) controlsUi.style.display = 'flex';
    if (ddsTopBanner) ddsTopBanner.style.display = 'flex';
  }

  // 4. Iniciar via Câmera AR (MindAR)
  startBtn.addEventListener('click', async () => {
    startBtn.textContent = 'Iniciando...';
    startBtn.disabled = true;
    Analytics.recordSessionStart();

    try {
      const system = scene.systems['mindar-image-system'];
      if (!system) throw new Error('Sistema AR nao carregado. Recarregue a pagina.');
      await system.start();
      startUi.style.display = 'none';
      scanningUi.style.display = 'flex';
      showHudAndBanner();
      audioEl.play().catch(() => {});
    } catch (err) {
      startBtn.textContent = 'Erro — Use Modo 3D / Laptop';
      startBtn.disabled = false;
      // Se não houver câmera disponível no desktop, oferece transição imediata para o Modo 3D Viewer
      activateDesktop3DMode(true);
    }
  });

  // 5. Modo Híbrido "3D Viewer / Desktop Fallback" (funciona sem marcador e sem câmera)
  function activateDesktop3DMode(openFromStart = false) {
    isDesktop3DMode = !isDesktop3DMode || openFromStart;
    if (openFromStart) {
      Analytics.recordSessionStart();
      startUi.style.display = 'none';
      showHudAndBanner();
    }

    if (isDesktop3DMode) {
      Analytics.recordDesktopMode();
      if (scanningUi) scanningUi.style.display = 'none';
      if (desktopModeBtn) desktopModeBtn.classList.add('active');

      // Posiciona câmera e força o holograma visível no centro da tela do laptop/PC
      if (mainCamera) {
        mainCamera.setAttribute('position', '0 0 3.6');
      }
      if (targetAnchor) {
        targetAnchor.object3D.visible = true;
        targetAnchor.setAttribute('visible', 'true');
        targetAnchor.setAttribute('position', '0 0.08 0');
        targetAnchor.setAttribute('rotation', '0 0 0');
        targetAnchor.setAttribute('scale', '0.72 0.72 0.72');
      }
      playBeep(980, 90, 'sine', 0.12);
    } else {
      if (desktopModeBtn) desktopModeBtn.classList.remove('active');
      if (mainCamera) {
        mainCamera.setAttribute('position', '0 0 0');
      }
      if (targetAnchor) {
        targetAnchor.setAttribute('scale', '1 1 1');
      }
      if (scanningUi) {
        scanningUi.style.display = 'flex';
        scanningUi.style.opacity = '1';
      }
    }
  }

  if (startDesktopBtn) {
    startDesktopBtn.addEventListener('click', () => {
      activateDesktop3DMode(true);
    });
  }

  if (desktopModeBtn) {
    desktopModeBtn.addEventListener('click', () => {
      activateDesktop3DMode(false);
    });
  }

  // Garante visibilidade contínua no Modo Desktop mesmo se o MindAR tentar ocultar o target
  setInterval(() => {
    if (isDesktop3DMode && targetAnchor) {
      targetAnchor.object3D.visible = true;
    }
  }, 200);

  // Previne zoom acidental mantendo scroll livre nos modais
  document.addEventListener('touchmove', e => {
    if (!e.target.closest('#quiz-modal, #checklist-modal, #poster-modal')) {
      e.preventDefault();
    }
  }, { passive: false });

  // ───────────────────────────────────────────────────────────────────────────
  // Áudio de Fundo + Botão "Ouvir Mensagem / Voz do DDS do Dia"
  // ───────────────────────────────────────────────────────────────────────────
  if (audioBtn) {
    audioBtn.addEventListener('click', () => {
      if (audioEl.paused) {
        audioEl.play().catch(() => {});
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

  if (voiceMsgBtn) {
    voiceMsgBtn.addEventListener('click', () => {
      playBeep(880, 70, 'sine', 0.1);
      // Usa síntese de voz nativa PT-BR para ler o tema e a mensagem guiada do dds-hoje.json, ou reinicia o audio.m4a
      if ('speechSynthesis' in window && DDS_CONFIG.mensagemTextoGuiado) {
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.cancel();
          voiceMsgBtn.classList.remove('speaking');
          voiceMsgBtn.innerHTML = '&#128266; VOZ DO DIA';
          return;
        }
        audioEl.pause();
        const utter = new SpeechSynthesisUtterance(
          `${DDS_CONFIG.temaDoDia}. ${DDS_CONFIG.mensagemTextoGuiado}`
        );
        utter.lang = 'pt-BR';
        utter.rate = 1.02;
        voiceMsgBtn.classList.add('speaking');
        voiceMsgBtn.textContent = '⏹ PARAR VOZ';
        utter.onend = () => {
          voiceMsgBtn.classList.remove('speaking');
          voiceMsgBtn.innerHTML = '&#128266; VOZ DO DIA';
        };
        window.speechSynthesis.speak(utter);
      } else if (audioEl) {
        audioEl.currentTime = 0;
        audioEl.play().catch(() => {});
      }
    });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Player de Vídeo do DDS
  // ───────────────────────────────────────────────────────────────────────────
  if (videoBtn && videoModal && videoClose) {
    videoBtn.addEventListener('click', () => {
      audioEl.pause();
      videoModal.style.display = 'flex';
      videoEl.play().catch(() => {});
    });

    videoClose.addEventListener('click', () => {
      videoEl.pause();
      videoEl.currentTime = 0;
      videoModal.style.display = 'none';
      if (!audioBtn.classList.contains('muted')) {
        audioEl.play().catch(() => {});
      }
    });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Checklist Clicável com Feedback Sonoro + Assinatura de Presença Digital
  // ───────────────────────────────────────────────────────────────────────────
  const checkedSet = new Set(
    JSON.parse(localStorage.getItem('abril_verde_checked_items') || '[]')
  );

  function renderChecklist() {
    if (!checklistContainer) return;
    const items = DDS_CONFIG.checklist || [];
    checklistContainer.innerHTML = '';

    items.forEach(item => {
      const isChecked = checkedSet.has(item.id);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'chk-item-btn' + (isChecked ? ' checked' : '');
      btn.innerHTML = `
        <div class="chk-box-indicator">&#10003;</div>
        <div class="chk-item-text">
          <span class="chk-item-cat">${item.categoria}</span>
          <span class="chk-item-title">${item.titulo}</span>
        </div>
      `;
      btn.addEventListener('click', () => {
        if (checkedSet.has(item.id)) {
          checkedSet.delete(item.id);
          playBeep(520, 70, 'sine', 0.1);
        } else {
          checkedSet.add(item.id);
          playBeep(1046, 95, 'triangle', 0.16);
        }
        localStorage.setItem('abril_verde_checked_items', JSON.stringify([...checkedSet]));
        renderChecklist();
        if (checkedSet.size === items.length) {
          playSuccessChord();
          Analytics.recordChecklistComplete();
        }
      });
      checklistContainer.appendChild(btn);
    });

    const total = items.length || 1;
    const done = checkedSet.size;
    const pct = Math.round((done / total) * 100);

    if (checklistProgLabel) checklistProgLabel.textContent = `${done} / ${total} (${pct}%)`;
    if (checklistProgFill) checklistProgFill.style.width = `${pct}%`;
    if (checklistPctBadge) checklistPctBadge.textContent = `${pct}%`;
  }

  renderChecklist();

  if (checklistBtn && checklistModal && checklistClose) {
    checklistBtn.addEventListener('click', () => {
      renderChecklist();
      checklistModal.style.display = 'flex';
    });
    checklistClose.addEventListener('click', () => {
      checklistModal.style.display = 'none';
    });
  }

  // Envio de Presença Digital (Netlify Forms AJAX + LocalStorage History)
  if (checkinForm) {
    checkinForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nome = document.getElementById('checkin-nome').value.trim();
      const matricula = document.getElementById('checkin-matricula').value.trim();
      const setor = document.getElementById('checkin-setor').value.trim();
      if (!nome || !matricula) return;

      const totalItems = (DDS_CONFIG.checklist || []).length || 4;
      const pctChecklist = `${Math.round((checkedSet.size / totalItems) * 100)}%`;
      const quizScore = localStorage.getItem('abril_verde_quiz_score') || 'Não realizado';
      const dataHora = new Date().toLocaleString('pt-BR');
      const focusSec = String(Analytics.getLiveFocusSeconds());

      const record = {
        colaborador: nome,
        matricula,
        setor,
        tema_dds: DDS_CONFIG.temaDoDia,
        checklist_concluido: pctChecklist,
        quiz_score: String(quizScore),
        tempo_foco_ar_seg: focusSec,
        data_hora: dataHora
      };

      // Salva localmente para histórico e exportação CSV
      const history = JSON.parse(localStorage.getItem('abril_verde_checkins_list') || '[]');
      history.push(record);
      localStorage.setItem('abril_verde_checkins_list', JSON.stringify(history));
      Analytics.recordCheckinSubmitted(nome, matricula);

      // Envia via POST para Netlify Forms (/ __forms.html)
      try {
        const bodyParams = new URLSearchParams({
          'form-name': 'presenca-dds-abril-verde',
          ...record
        });
        await fetch('/__forms.html', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: bodyParams.toString()
        });
      } catch (err) {
        console.warn('[Check-in Offline] Salvo localmente para sincronização:', err);
      }

      playSuccessChord();
      if (checkinSuccessMsg) {
        checkinSuccessMsg.style.display = 'block';
        checkinSuccessMsg.innerHTML = `
          <strong>&#10004; Presença Confirmada!</strong><br/>
          Colaborador: <b>${nome}</b> (Matrícula: ${matricula})<br/>
          Registrado em ${dataHora} • Checklist: ${pctChecklist}
        `;
      }
      checkinForm.reset();
    });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Inspeção 3D de EPIs (.GLB) + Rotação Touch/Mouse
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
    const list = DDS_CONFIG.epis3d || [];
    const item = list[index];
    if (!item) return;

    list.forEach((epi, idx) => {
      const el = document.getElementById(epi.id);
      if (el) el.setAttribute('visible', idx === index);
    });

    if (epiTitle) epiTitle.textContent = item.title;
    if (epiDesc) epiDesc.textContent = item.desc;

    epiTabs.forEach((tab, idx) => {
      tab.classList.toggle('active', idx === index);
    });

    rotX = 15;
    rotY = 0;
    modelScale = 1.35;
    applyEpiTransform();
    playBeep(780, 65, 'sine', 0.1);
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

  window.addEventListener('pointerdown', e => {
    if (!isEpiMode && !isDesktop3DMode) return;
    if (e.target.closest('#controls-ui, #epi-hud, #video-modal, #quiz-modal, #poster-modal, #checklist-modal, #dds-top-banner')) return;
    isDragging = true;
    prevX = e.clientX;
    prevY = e.clientY;
  });

  window.addEventListener('pointermove', e => {
    if (!isDragging) return;
    const dx = e.clientX - prevX;
    const dy = e.clientY - prevY;
    prevX = e.clientX;
    prevY = e.clientY;

    if (isEpiMode) {
      rotY += dx * 0.65;
      rotX = Math.max(-65, Math.min(65, rotX + dy * 0.5));
      applyEpiTransform();
    } else if (isDesktop3DMode && targetAnchor) {
      // Permite girar o painel holográfico completo com o mouse no Modo 3D / Laptop
      const currRot = targetAnchor.getAttribute('rotation') || { x: 0, y: 0, z: 0 };
      const ny = (currRot.y || 0) + dx * 0.45;
      const nx = Math.max(-35, Math.min(35, (currRot.x || 0) + dy * 0.3));
      targetAnchor.setAttribute('rotation', `${nx} ${ny} 0`);
    }
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
    if (isEpiMode) {
      modelScale = Math.max(0.75, Math.min(2.2, modelScale - e.deltaY * 0.001));
      applyEpiTransform();
    }
  }, { passive: true });

  // ───────────────────────────────────────────────────────────────────────────
  // Quiz de Segurança & Gamificação (consumindo de DDS_CONFIG.quiz)
  // ───────────────────────────────────────────────────────────────────────────
  let currentQuestion = 0;
  let score = 0;
  let answered = false;

  const savedScore = localStorage.getItem('abril_verde_quiz_score');
  if (savedScore !== null && quizScorePill) {
    quizScorePill.style.display = 'block';
    quizScorePill.textContent = `${savedScore}/${(DDS_CONFIG.quiz || []).length || 5}`;
  }

  function renderQuestion() {
    answered = false;
    const questions = DDS_CONFIG.quiz || [];
    const qData = questions[currentQuestion];
    if (!qData) return;
    const total = questions.length;

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

    const questions = DDS_CONFIG.quiz || [];
    const qData = questions[currentQuestion];
    const allBtns = quizOptionsEl.querySelectorAll('.quiz-opt-btn');
    allBtns.forEach((b, idx) => {
      b.disabled = true;
      if (idx === qData.correct) {
        b.classList.add('correct');
      }
    });

    if (selectedIndex === qData.correct) {
      score++;
      playBeep(1046, 100, 'triangle', 0.16);
    } else {
      clickedBtn.classList.add('wrong');
      playBeep(320, 140, 'sawtooth', 0.12);
    }

    quizFeedbackText.textContent = qData.explanation;
    quizNextBtn.textContent =
      currentQuestion < questions.length - 1 ? 'PRÓXIMA PERGUNTA \u2192' : 'VER CERTIFICADO \u2605';
    quizFeedbackEl.style.display = 'flex';
  }

  function showQuizResults() {
    quizBody.style.display = 'none';
    quizResult.style.display = 'block';
    playSuccessChord();

    const total = (DDS_CONFIG.quiz || []).length || 5;
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

  if (quizBtn) quizBtn.addEventListener('click', openQuiz);
  if (quizClose) quizClose.addEventListener('click', () => { quizModal.style.display = 'none'; });
  if (quizDoneBtn) quizDoneBtn.addEventListener('click', () => { quizModal.style.display = 'none'; });
  if (quizRetryBtn) quizRetryBtn.addEventListener('click', openQuiz);

  if (quizNextBtn) {
    quizNextBtn.addEventListener('click', () => {
      const total = (DDS_CONFIG.quiz || []).length;
      if (currentQuestion < total - 1) {
        currentQuestion++;
        renderQuestion();
      } else {
        showQuizResults();
      }
    });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Modal do Cartaz / QR Code + Dashboard de Métricas + Exportação CSV
  // ───────────────────────────────────────────────────────────────────────────
  function updateMetricsUI() {
    if (metricSessionsEl) metricSessionsEl.textContent = String(Analytics.metrics.sessionsCount);
    if (metricFocusEl) metricFocusEl.textContent = `${Analytics.getLiveFocusSeconds()}s`;
    if (metricCheckinsEl) metricCheckinsEl.textContent = String(Analytics.metrics.checkinsSubmitted);
  }

  function openPosterModal() {
    updateMetricsUI();
    if (posterModal) posterModal.style.display = 'flex';
  }

  if (posterBtn) posterBtn.addEventListener('click', openPosterModal);
  if (startPosterBtn) startPosterBtn.addEventListener('click', openPosterModal);
  if (posterClose) posterClose.addEventListener('click', () => { posterModal.style.display = 'none'; });

  if (exportCheckinsBtn) {
    exportCheckinsBtn.addEventListener('click', () => {
      const history = JSON.parse(localStorage.getItem('abril_verde_checkins_list') || '[]');
      const header = ['Data/Hora', 'Colaborador', 'Matricula', 'Setor', 'Tema DDS', 'Checklist', 'Quiz Score', 'Tempo Foco AR (s)'];
      const rows = history.map(r => [
        r.data_hora,
        r.colaborador,
        r.matricula,
        r.setor,
        r.tema_dds,
        r.checklist_concluido,
        r.quiz_score,
        r.tempo_foco_ar_seg
      ]);
      const csvContent =
        'data:text/csv;charset=utf-8,\uFEFF' +
        [header, ...rows].map(e => e.map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(';')).join('\n');

      const link = document.createElement('a');
      link.setAttribute('href', encodeURI(csvContent));
      link.setAttribute('download', `presencas-dds-abril-verde.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  }
});
