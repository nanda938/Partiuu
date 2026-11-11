/* PARTIU? — base ilustrada do mapa (funciona sem internet).
   Terra e mar desenhados à mão, em estilo de imagem de satélite: costa SIMPLIFICADA e APROXIMADA do Rio de Janeiro,
   só para dar contexto visual. Não serve para medir nada. Fica por baixo do mapa-base de satélite: quando as imagens
   reais carregam, elas cobrem esta camada; sem internet (ou com o mapa-base bloqueado), esta é a imagem que aparece.
   Coordenadas [latitude, longitude]. Para ajustar a costa, edite as listas MAR_*. */
(() => {
  'use strict';
  const COR = { mar: '#1c4a56', marClaro: '#2f7480', terra: '#55714a', mata: '#37563a', costa: '#a8cfc6', areia: '#cdbd8c' };

  const TERRA = [[-23.6, -44.4], [-23.6, -42.5], [-22.3, -42.5], [-22.3, -44.4]];
  // Oceano Atlântico (a leste da entrada da baía, ao sul da costa, até a restinga da Marambaia)
  const MAR_ATLANTICO = [[-23.6, -42.5], [-22.96, -42.5], [-22.97, -43.00], [-22.965, -43.04], [-22.955, -43.10], [-22.945, -43.12], [-22.9395, -43.1327],
    [-22.9437, -43.1580], [-22.9500, -43.1590], [-22.9560, -43.1625], [-22.9600, -43.1650], [-22.9640, -43.1665], [-22.9690, -43.1745], [-22.9770, -43.1815], [-22.9860, -43.1875], [-22.9892, -43.1920], [-22.9867, -43.2060], [-22.9874, -43.2246], [-22.9930, -43.2330],
    [-22.9995, -43.2550], [-23.0075, -43.2870], [-23.0120, -43.3200], [-23.0150, -43.3600], [-23.0210, -43.4010], [-23.0290, -43.4600], [-23.0340, -43.4750],
    [-23.0440, -43.5050], [-23.0480, -43.5310], [-23.0680, -43.5640], [-23.0750, -43.6000], [-23.0750, -44.4], [-23.6, -44.4]];
  // Baía de Guanabara
  const MAR_GUANABARA = [[-22.9395, -43.1327], [-22.9437, -43.1580], [-22.9462, -43.1635], [-22.9510, -43.1668], [-22.9490, -43.1740], [-22.9466, -43.1815], [-22.9415, -43.1745], [-22.9300, -43.1680], [-22.9150, -43.1620], [-22.9070, -43.1640], [-22.8970, -43.1780],
    [-22.8840, -43.2200], [-22.8720, -43.2420], [-22.8400, -43.2620], [-22.8000, -43.2680], [-22.7600, -43.2700], [-22.7200, -43.2200], [-22.6900, -43.1800],
    [-22.6900, -43.0700], [-22.7200, -43.0700], [-22.7800, -43.0800], [-22.8400, -43.1000], [-22.8800, -43.1200], [-22.9050, -43.1250], [-22.9300, -43.1240]];
  // Baía de Sepetiba (atrás da restinga da Marambaia)
  const MAR_SEPETIBA = [[-23.0450, -43.6000], [-23.0450, -44.4], [-22.9850, -44.4], [-22.9650, -43.7400], [-22.9850, -43.6800], [-23.0050, -43.6200], [-23.0300, -43.5900]];
  const LAGOA = [[-22.9640, -43.2100], [-22.9610, -43.2000], [-22.9700, -43.1990], [-22.9780, -43.2060], [-22.9740, -43.2130]];
  const ILHA_GOVERNADOR = [[-22.8000, -43.2200], [-22.7850, -43.2000], [-22.7900, -43.1700], [-22.8150, -43.1650], [-22.8350, -43.1800], [-22.8350, -43.2150]];
  const ILHA_VILLEGAGNON = [[-22.9105, -43.1620], [-22.9105, -43.1575], [-22.9125, -43.1570], [-22.9130, -43.1615]];
  // Maciços cobertos de mata (manchas escuras): [lat, lng, raio em metros]
  const MATA = [[-22.9500, -43.2900, 7500], [-22.9700, -43.4500, 9000], [-22.8700, -43.5700, 8500], [-22.9900, -43.2400, 2500], [-23.0000, -43.6300, 6000]];

  // Suaviza os cantos (Chaikin) para a costa parecer desenhada à mão; os cantos de fora do mapa ficam como estão.
  function suave(pts, vezes = 2) {
    let a = pts;
    for (let k = 0; k < vezes; k++) {
      const b = [];
      a.forEach((p, i) => { const q = a[(i + 1) % a.length]; b.push([.75 * p[0] + .25 * q[0], .75 * p[1] + .25 * q[1]], [.25 * p[0] + .75 * q[0], .25 * p[1] + .75 * q[1]]); });
      a = b;
    }
    return a;
  }
  function adicionar(map) {
    const L = window.L; if (!L || !map) return null;
    if (!map.getPane('ilustrado')) { const p = map.createPane('ilustrado'); p.style.zIndex = 150; }
    const r = L.svg({ pane: 'ilustrado' });
    const g = L.layerGroup();
    const poli = (pts, o) => L.polygon(pts, Object.assign({ renderer: r, interactive: false, smoothFactor: 1 }, o)).addTo(g);
    poli(TERRA, { stroke: false, fillColor: COR.terra, fillOpacity: 1 });
    MATA.forEach(([la, ln, rd]) => L.circle([la, ln], { renderer: r, interactive: false, stroke: false, fillColor: COR.mata, fillOpacity: .55, radius: rd }).addTo(g));
    [MAR_ATLANTICO, MAR_GUANABARA, MAR_SEPETIBA, LAGOA].forEach(m => poli(suave(m, m === LAGOA ? 3 : 2), { color: COR.costa, weight: 1.4, opacity: .85, fillColor: COR.mar, fillOpacity: 1 }));
    [ILHA_GOVERNADOR, ILHA_VILLEGAGNON].forEach(m => poli(suave(m, 2), { color: COR.costa, weight: 1.2, opacity: .85, fillColor: COR.terra, fillOpacity: 1 }));
    const apoio = L.layerGroup().addTo(map);
    // Discos de terra sob os pontos que cairiam no mar (a costa é aproximada): o pino sempre fica em terra firme.
    // A Lagoa Rodrigo de Freitas fica de fora, para continuar sendo água.
    function apoiar(itens) {
      apoio.clearLayers();
      (itens || []).forEach(it => {
        const lat = Number(it.lat), lng = Number(it.lng); if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
        const pt = [lat, lng];
        if (dentro(pt, LAGOA)) return;
        if ([MAR_ATLANTICO, MAR_GUANABARA, MAR_SEPETIBA].some(m => dentro(pt, m)) && !dentro(pt, ILHA_VILLEGAGNON))
          L.circle(pt, { renderer: r, pane: 'ilustrado', interactive: false, radius: 300, color: COR.costa, weight: 1.2, opacity: .85, fillColor: COR.terra, fillOpacity: 1 }).addTo(apoio);
      });
    }
    g.addTo(map);
    return { grupo: g, apoiar };
  }
  function dentro(pt, poly) {      // ponto em polígono
    let c = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [yi, xi] = poly[i], [yj, xj] = poly[j];
      if (((yi > pt[0]) !== (yj > pt[0])) && (pt[1] < (xj - xi) * (pt[0] - yi) / (yj - yi) + xi)) c = !c;
    }
    return c;
  }
  window.PARTIU_BASE = { adicionar, COR, poligonos: { MAR_ATLANTICO, MAR_GUANABARA, MAR_SEPETIBA, LAGOA, ILHA_GOVERNADOR, ILHA_VILLEGAGNON } };
})();
