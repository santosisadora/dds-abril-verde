/**
 * DDS Abril Verde 2026 — main.js
 * Versao simplificada: usa imagens PNG direto (checklist, simbolo, label-dds)
 * sem renderizacao canvas para o painel principal.
 */

if (location.protocol === 'http:' && location.hostname !== 'localhost') {
  location.replace('https://' + location.host + location.pathname);
}

import './style.css';

// ─────────────────────────────────────────────────────────────────────────────
// Logica AR
// ─────────────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const startUi    = document.getElementById('start-ui');
  const startBtn   = document.getElementById('start-btn');
  const scanningUi = document.getElementById('scanning-ui');
  const scene      = document.querySelector('a-scene');

  // Elementos de Áudio e Vídeo
  const controlsUi    = document.getElementById('controls-ui');
  const audioBtn      = document.getElementById('audio-btn');
  const audioEl       = document.getElementById('main-audio');
  const iconSoundOn   = document.getElementById('icon-sound-on');
  const iconSoundOff  = document.getElementById('icon-sound-off');

  const videoBtn      = document.getElementById('video-btn');
  const videoModal    = document.getElementById('video-modal');
  const videoClose    = document.getElementById('video-close');
  const videoEl       = document.getElementById('dds-video');

  function debug(msg, err) {
    err = err || false;
    console.log('[AR]', msg);
    const p2 = document.getElementById('debug-panel');
    if (!p2) return;
    
    // Mantem apenas as ultimas 20 mensagens para nao travar o celular
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

  // Evita race condition: evento 'loaded' pode disparar antes do listener
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

      // Mostra controles de HUD e inicia áudio
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

  document.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
  let lt = 0;
  document.addEventListener('touchend', e => {
    const n = Date.now();
    if (n - lt <= 300) e.preventDefault();
    lt = n;
  }, false);

  // Toggle do Áudio
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

  // Lógica do Vídeo
  if (videoBtn && videoModal && videoClose) {
    videoBtn.addEventListener('click', () => {
      // Pausa áudio de fundo para focar no vídeo
      audioEl.pause();
      videoModal.style.display = 'flex';
      videoEl.play().catch(e => debug('Erro play vídeo: ' + e.message));
    });

    videoClose.addEventListener('click', () => {
      videoEl.pause();
      videoEl.currentTime = 0;
      videoModal.style.display = 'none';

      // Retoma áudio se não estiver mutado no botão
      if (!audioBtn.classList.contains('muted')) {
        audioEl.play().catch(e => debug('Erro reresume áudio: ' + e.message));
      }
    });
  }
});
