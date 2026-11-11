# PARTIU?

Plataforma gamificada de exploração do patrimônio histórico e cultural do Rio de Janeiro.
Site estático: HTML, CSS, JavaScript puro, dados locais e `localStorage`. Sem backend, banco de dados ou autenticação real.

## Como abrir no VS Code
O projeto é um **site estático** (HTML, CSS e JavaScript puro). Não há compilação nem framework: o que está nesta pasta é o código-fonte original.
Todo o conteúdo (lugares, bairros, regiões, quizzes) está em `js/patrimonios-data.js`.

**Opção A — Live Server (mais simples, sem instalar nada além da extensão)**
1. Extraia o ZIP e, no VS Code, vá em **Arquivo → Abrir Pasta…** e escolha a pasta `Partiu-main`.
2. Aceite a sugestão de instalar as extensões recomendadas (ou instale **Live Server**, de Ritwick Dey, em Extensões / Ctrl+Shift+X).
3. Clique com o botão direito em `index.html` → **Open with Live Server**. O navegador abre em `http://127.0.0.1:5500` e atualiza sozinho ao salvar.

**Opção B — Terminal (precisa do [Node.js](https://nodejs.org) 18 ou mais novo)**
1. No VS Code, abra o terminal (Ctrl+`) na pasta do projeto.
2. `npm install` (instala só o servidor local `http-server`).
3. `npm start` (abre o app em `http://localhost:5500`). Para parar: Ctrl+C.

Não abra o `index.html` com duplo clique: alguns recursos (mapa, imagens) funcionam melhor com um servidor local.
Leaflet e as fontes são **locais** (`assets/vendor`, `assets/fonts`); só o mapa de satélite (Esri) precisa de internet. Sem internet aparece o mapa ilustrado offline (`js/base-ilustrada.js`) e o resto do app continua funcionando.

## Estrutura
- `package.json` — scripts para rodar localmente (`npm start`) · `.vscode/` — configurações e extensões recomendadas.
- `index.html` — página inicial do app (fica na raiz); página única; telas são desenhadas por JS e escolhidas por rota (`#/inicio`, `#/explorar`, `#/missoes`, `#/perfil`,
  `#/regiao/<id>`, `#/bairro/<id>`, `#/patrimonio/<id>`, `#/quiz/<id>`). O botão "voltar" do navegador funciona.
- `html/mapa.html` — mapa em tela cheia (mesmos dados e progresso).
- `docs/` — documentação do conteúdo (`CONTEUDO-PENDENTE.md`). `assets/` — logo, fontes, imagens (`assets/img`) e bibliotecas (`assets/vendor`: Leaflet; `maplibre/` guardado sem uso).
- `css/style.css` — paleta, tipografia e componentes · `css/telas.css` — layouts das telas · `css/mapa.css` — Explorar e Leaflet.
- `js/patrimonios-data.js` — **todo o conteúdo** (zonas, bairros, patrimônios, quizzes). O esquema de campos está comentado no topo do arquivo.
- `js/progresso.js` — regras de XP, níveis, desbloqueios, estados das missões, conquistas e persistência.
- `js/navegacao.js` — roteador · `js/ui.js` — componentes (foto, etiquetas, diálogo, toast) · `js/app.js` — telas · `js/explorar.js` — busca/filtros/lista/mapa · `js/mapa.js` — controlador Leaflet · `js/mapa-pagina.js` — html/mapa.html · `js/quizbairro.js` — quiz de cada bairro (gerado) · `js/desafios.js` — desafios extras por região · `js/base-ilustrada.js` — base ilustrada do mapa.
- `tests/e2e.py` — testes de ponta a ponta (Playwright); `tests/antigos/` guarda testes da versão anterior (usavam "Confirmar visita"). `docs/CONTEUDO-PENDENTE.md` — o que falta cadastrar.

## Identidade visual
Paleta original em `:root` de `css/style.css` (`--creme #F4EBDD`, `--terracota #B65F45`, `--dourado #D5A84B`, `--oliva #65735A`, `--marrom #3D3028`);
todo o resto é derivado dela. A logo é sempre o arquivo original `assets/capa-badge.jpg` (sem filtros, proporção 1:1, recorte circular que
acompanha o contorno do próprio selo, como já era na versão anterior).

## Regras de jogo
- Não existe mais "Confirmar visita". Ao fim de cada bairro há um quiz gerado a partir dos dados cadastrados (3 a 8 perguntas); acertando cerca de 70% todos os locais do bairro contam como visitados (+10 XP cada) e o bairro rende +50 XP. Pode tentar de novo. Quiz: +10 XP por acerto, só na primeira conclusão. Para trocar as perguntas geradas, cadastre `quizzesBairro[<id do bairro>]` em `js/patrimonios-data.js`.
- Nível = 1 + XP ÷ 100. XP, nível e estados são calculados a partir do que está salvo.
- Um bairro libera o próximo da região; uma região libera a seguinte quando todos os seus bairros e o quiz estão concluídos.
- **Bairros e regiões sem patrimônios cadastrados ficam "em breve"**: não bloqueiam a sequência e não contam para a conclusão.
- Estados exibidos: disponível, em andamento, concluída, bloqueada, em breve.

## Como acrescentar conteúdo e fotos
Edite só `js/patrimonios-data.js`. Para uma foto: copie o arquivo para `assets/img/`, preencha `imagem: { src, alt, credito, licenca, fonte }`.
Sem foto, a interface mostra "foto a cadastrar" (nunca uma imagem genérica). Texto histórico, importância, curiosidades, categoria, endereço e fontes
só aparecem quando preenchidos; filtros de região/bairro/categoria surgem sozinhos quando houver opções. Para uma foto de capa, defina `PARTIU_DATA.hero`.

## Testes
Opcional (precisa de Python 3): `pip install -r tests/requirements.txt && playwright install chromium && python3 tests/e2e.py`

## Limitações
O progresso fica só neste navegador (pode ser apagado) e não há sincronização entre aparelhos nem senha. "Sair" encerra a sessão, mas o progresso continua salvo.
