/* PARTIU? — quiz de cada bairro, GERADO a partir dos dados já cadastrados (nada é inventado aqui).
   O id do quiz é "bairro-<id do bairro>" (rota #/quiz/bairro-copacabana).
   Cada pergunta usa um campo cadastrado do patrimônio:
   - foto      → "Que lugar aparece na foto?"             (imagem)
   - categoria → "Qual é a categoria de ...?"             (categoria)
   - trecho    → "De qual lugar é este trecho?"            (um trecho da descrição que não cita o nome do lugar)
   Só entra o tipo de pergunta para o qual o patrimônio tem o dado cadastrado.
   Número de perguntas: entre 3 e 8, conforme o tamanho do bairro. Para concluir é preciso acertar cerca de 70%
   (LIMIAR_PCT). Quem acerta o mínimo marca todos os locais do bairro como visitados (regra em progresso.js).
   Para trocar por perguntas suas, cadastre em D.quizzesBairro[<id do bairro>] = { perguntas: [...] } no
   mesmo formato do quiz da região (texto, opcoes, correta, explicacao); elas passam a valer no lugar das geradas. */
(() => {
  'use strict';
  const MIN_N = 3, MAX_N = 8, LIMIAR_PCT = 0.7;
  const D = () => window.PARTIU_DATA || { zonas: [], bairros: [], patrimonios: [] };
  const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  const embaralhar = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const bairro = id => D().bairros.find(b => b.id === id);
  const temFoto = p => !!p.imagem && typeof (typeof p.imagem === 'string' ? p.imagem : p.imagem.src) === 'string';
  const srcFoto = p => (typeof p.imagem === 'string' ? p.imagem : p.imagem.src);
  const PARTES = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'a', 'o', 'em', 'na', 'no']);

  // Trechos da descrição (frases de 50 a 240 letras) que não repetem nenhuma palavra do nome do lugar.
  function trechos(p) {
    if (!p.descricao) return [];
    const palavras = norm(p.nome).split(/[^a-z0-9]+/).filter(w => w.length >= 4 && !PARTES.has(w));
    const frases = String(p.descricao).replace(/\s+/g, ' ').match(/[^.!?]+[.!?]/g) || [];
    return frases.map(f => f.trim()).filter(f => f.length >= 50 && f.length <= 240 && !palavras.some(w => norm(f).includes(w)));
  }
  function tiposDe(p) {
    const t = [];
    if (temFoto(p)) t.push('foto');
    if (p.categoria) t.push('categoria');
    if (trechos(p).length) t.push('trecho');
    return t;
  }
  const doBairro = id => D().patrimonios.filter(p => p.bairro === id);
  function candidatos(id) { const c = []; doBairro(id).forEach(p => tiposDe(p).forEach(tipo => c.push({ p, tipo }))); return c; }
  const manualDe = id => { const m = (D().quizzesBairro || {})[id]; return m && Array.isArray(m.perguntas) && m.perguntas.length ? m : null; };
  const totalDe = id => {
    const man = manualDe(id); if (man) return man.perguntas.length;
    const n = doBairro(id).length, cand = candidatos(id).length;
    return Math.min(cand, MAX_N, Math.max(MIN_N, n));
  };
  const limiarDe = total => (total <= 2 ? total : Math.max(1, Math.round(total * LIMIAR_PCT)));

  function info(id) {
    const m = /^bairro-([\w-]+)$/.exec(String(id || '')); if (!m) return null;
    const b = bairro(m[1]); if (!b) return null;
    const total = totalDe(b.id);
    return { id, tipo: 'bairro', bairroId: b.id, zonaId: b.zona, total, limiar: limiarDe(total), titulo: 'Quiz de ' + b.nome };
  }
  const disponivel = id => { const i = info(id); return !!i && i.total > 0; };
  const idDoBairro = bairroId => 'bairro-' + bairroId;

  function primeiraFrase(txt) {
    const t = String(txt || '').replace(/\s+/g, ' ').trim(); if (!t) return '';
    const m = /^(.{40,260}?[.!?])(\s|$)/.exec(t);
    return m ? m[1] : (t.length <= 260 ? t : '');
  }
  function explicacao(p) {
    const b = bairro(p.bairro), onde = p.endereco ? p.endereco : (b ? b.nome : '');
    return [p.nome + (onde ? ' — ' + onde + '.' : '.'), primeiraFrase(String(p.descricao || '').split(/\n\s*\n/)[0])].filter(Boolean).join(' ');
  }
  // Três alternativas erradas, preferindo as do mesmo bairro, depois da mesma região, depois do resto.
  function erradas(p, valor, qtd = 3) {
    const b = bairro(p.bairro), todos = D().patrimonios.filter(x => x.id !== p.id && (x.descricao || temFoto(x)));      // alternativas só de locais com dados
    const grupos = [todos.filter(x => x.bairro === p.bairro), todos.filter(x => x.bairro !== p.bairro && (bairro(x.bairro) || {}).zona === (b || {}).zona), todos];
    const vistos = new Set([norm(valor)]), saida = [];
    grupos.forEach(g => embaralhar(g).forEach(x => {
      const v = valor === p.nome ? x.nome : null;
      if (v && saida.length < qtd && !vistos.has(norm(v))) { vistos.add(norm(v)); saida.push(v); }
    }));
    return saida;
  }
  function erradasCampo(p, campo, valor, qtd = 3) {
    const b = bairro(p.bairro), todos = D().patrimonios.filter(x => x.id !== p.id && x[campo] && (x.descricao || temFoto(x)));
    const grupos = campo === 'categoria' ? [todos] : [todos.filter(x => x.bairro === p.bairro), todos.filter(x => x.bairro !== p.bairro && (bairro(x.bairro) || {}).zona === (b || {}).zona), todos];
    const vistos = new Set([norm(valor)]), saida = [];
    grupos.forEach(g => embaralhar(g).forEach(x => {
      if (saida.length < qtd && !vistos.has(norm(x[campo]))) { vistos.add(norm(x[campo])); saida.push(x[campo]); }
    }));
    return saida;
  }
  function montar(id, k, { p, tipo }) {
    const base = { id: id + '-' + k, explicacao: explicacao(p) };
    let texto, certa, outras, extra = {};
    if (tipo === 'foto') { texto = 'Que lugar aparece na foto?'; certa = p.nome; outras = erradas(p, p.nome); extra.imagem = { src: srcFoto(p) }; }
    else if (tipo === 'categoria') { texto = 'Qual é a categoria de “' + p.nome + '”?'; certa = p.categoria; outras = erradasCampo(p, 'categoria', p.categoria); }
    else { const fr = embaralhar(trechos(p))[0]; texto = 'De qual lugar fala este trecho? “' + fr + '”'; certa = p.nome; outras = erradas(p, p.nome); }
    const opcoes = embaralhar([certa, ...outras]);
    return Object.assign(base, { texto, opcoes, correta: opcoes.indexOf(certa) }, extra);
  }

  // Escolhe as perguntas: primeiro uma por patrimônio (sorteado); se faltar, repete o patrimônio com outro tipo.
  function gerar(id) {
    const i = info(id); if (!i || !i.total) return null;
    const man = manualDe(i.bairroId);
    if (man) return { titulo: i.titulo, perguntas: man.perguntas, desafio: i };
    const porP = new Map();
    embaralhar(candidatos(i.bairroId)).forEach(c => { if (!porP.has(c.p.id)) porP.set(c.p.id, []); porP.get(c.p.id).push(c); });
    const escolhidas = [];
    for (let rodada = 0; escolhidas.length < i.total; rodada++) {
      let achou = false;
      embaralhar([...porP.values()]).forEach(lista => { if (lista[rodada] && escolhidas.length < i.total) { escolhidas.push(lista[rodada]); achou = true; } });
      if (!achou) break;
    }
    const perguntas = embaralhar(escolhidas).map((c, k) => montar(id, k, c)).filter(q => q.correta >= 0 && q.opcoes.length >= 2);
    return { titulo: i.titulo, perguntas, desafio: i };
  }

  window.PARTIU_QUIZBAIRRO = { MIN_N, MAX_N, LIMIAR_PCT, info, disponivel, gerar, idDoBairro, limiarDe };
})();
