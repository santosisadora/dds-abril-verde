# DDS Abril Verde 2026 — AR Holográfico

Projeto de Realidade Aumentada para o DDS (Diálogo Diário de Segurança) da campanha **Abril Verde 2026**.

## 🚀 Como Rodar Localmente

```bash
npm install
npm run dev
```

O servidor inicia em `http://localhost:5173` e também na rede local (ex: `http://192.168.x.x:5173`) para testes no celular.

> **Atenção:** O acesso à câmera requer **HTTPS** em produção. Para testes locais, `localhost` é suficiente.

## 📁 Assets Necessários (pasta `/public`)

| Arquivo | Descrição |
|---|---|
| `targets.mind` | Arquivo de reconhecimento gerado pelo MindAR |
| `simbolo.jpg` | Imagem do laço com mãos e planta (Abril Verde) |

### Como gerar o `targets.mind`
1. Acesse: https://hiukim.github.io/mind-ar-js-doc/tools/compile
2. Faça upload da imagem marcadora (ex: logo da campanha)
3. Clique em **Compile** e baixe o arquivo `.mind`
4. Cole na pasta `/public` com o nome `targets.mind`

## 🏗️ Estrutura do Projeto

```
dds-abril-verde/
├── public/
│   ├── targets.mind          ← Arquivo MindAR (YOU NEED TO ADD)
│   └── simbolo.jpg           ← Imagem do símbolo (YOU NEED TO ADD)
├── src/
│   ├── main.js               ← Lógica JS (eventos AR)
│   └── style.css             ← Estilos (câmera fullscreen + UI)
├── index.html                ← Cena A-Frame AR
├── vite.config.js
└── package.json
```

## 🎨 Visual HUD Holográfico

- **Fundo:** Verde escuro translúcido com bordas neon
- **Título:** "DDS NA PALMA DA MAO"
- **Checklist:** EPI 100% / Ferramentas 90% / Área 100% com barras de progresso
- **Símbolo:** Imagem Abril Verde com efeito de transparência
- **Rodapé:** "A NOSSA CULTURA PROTEGE — Abril Verde 2026"

## 📱 Teste no Celular

1. Conecte o celular na mesma rede Wi-Fi do PC
2. Acesse o IP mostrado no terminal (ex: `http://192.168.1.100:5173`)
3. Permita o acesso à câmera
4. Aponte para o marcador e veja o HUD surgir!

## ⚙️ Tecnologias

- [Vite](https://vitejs.dev/) — Bundler
- [A-Frame 1.5.0](https://aframe.io/) — WebXR/WebGL
- [MindAR 1.2.5](https://hiukim.github.io/mind-ar-js-doc/) — Rastreamento de imagem AR
