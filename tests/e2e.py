import pathlib, re
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
URL = 'file://' + str(ROOT / 'index.html')
falhas = []
def check(n, ok, extra=''):
    print(('PASS ' if ok else 'FAIL ') + n + ('' if ok else ' -> ' + str(extra)))
    if not ok: falhas.append(n)
INIT = "window.addEventListener('load',()=>{const g=PARTIU_QUIZBAIRRO.gerar;PARTIU_QUIZBAIRRO.gerar=id=>{const r=g(id);window.__q=r;return r}})"
with sync_playwright() as p:
    b = p.chromium.launch()
    for (w, h) in [(1280, 900), (390, 800)]:
        pg = b.new_context(viewport={'width': w, 'height': h}).new_page()
        erros = []
        pg.on('pageerror', lambda e: erros.append(str(e)))
        pg.add_init_script(INIT)
        pg.route(re.compile(r'.*(stadiamaps|cartocdn|openstreetmap).*'), lambda r: r.abort())
        pg.goto(URL); pg.wait_for_timeout(300)
        pg.evaluate("PARTIU_PROGRESS.criarPerfil('Teste')"); pg.evaluate("location.hash='#/inicio'"); pg.wait_for_timeout(300)
        # Explorar
        pg.evaluate("location.hash='#/explorar?sel=praia-do-leme'"); pg.wait_for_timeout(1500)
        card = pg.locator('.sel-card')
        check(f'[{w}] explorar: cartão só com nome e endereço', card.is_visible() and card.locator('img, .foto, .sel-card__desc').count() == 0)
        print('   cartão:', card.inner_text().replace('\n', ' | '))
        pg.screenshot(path=f'explorar_{w}.png')
        # Bairro: zoom antes do texto
        pg.evaluate("location.hash='#/bairro/copacabana'"); pg.wait_for_timeout(1500)
        check(f'[{w}] bairro: sem "Confirmar visita"', pg.locator('text=Confirmar visita').count() == 0)
        check(f'[{w}] bairro: detalhe oculto no início', pg.locator('.bairro-detalhe').is_hidden())
        loc = pg.evaluate("PARTIU_DATA.patrimonios.filter(p=>p.bairro==='copacabana'&&p.lat!=null).map(p=>p.id)[0]")
        pg.locator(f'#scr-bairro .etapa[data-id="{loc}"] .etapa__nome').click(); pg.wait_for_timeout(120)
        oculto = pg.locator('.bairro-detalhe').is_hidden()
        pg.wait_for_timeout(2500)
        check(f'[{w}] bairro: detalhe só aparece depois do zoom', oculto and pg.locator('.bairro-detalhe').is_visible() and pg.locator('.bairro-detalhe h3').count() == 1, oculto)
        pg.screenshot(path=f'bairro_{w}.png', full_page=True)
        # Quiz pela interface: errar tudo
        pg.evaluate("location.hash='#/quiz/bairro-copacabana'"); pg.wait_for_timeout(400)
        pg.click('#scr-quiz button:has-text("Começar")')
        n = pg.evaluate("window.__q.perguntas.length")
        def jogar(acertar):
            for i in range(n):
                qs = pg.evaluate("window.__q.perguntas")
                txt = pg.locator('.quiz-q').inner_text()
                vis = sorted(pg.locator('.quiz-opt').all_inner_texts())
                q = next(x for x in qs if x['texto'] == txt and sorted(x['opcoes']) == vis)
                alvo = q['opcoes'][q['correta']] if acertar else next(o for k, o in enumerate(q['opcoes']) if k != q['correta'])
                pg.locator('.quiz-opt').filter(has_text=re.compile('^' + re.escape(alvo) + r'\s*$')).first.click(); pg.click('text=Confirmar resposta')
                pg.click('text=Próxima pergunta' if i + 1 < n else 'text=Ver resultado')
            pg.wait_for_timeout(300)
        jogar(False)
        check(f'[{w}] quiz: errar tudo não marca locais nem dá XP', pg.evaluate("PARTIU_PROGRESS.bairroInfo('copacabana').visitados") == 0 and pg.evaluate("PARTIU_PROGRESS.stats().xp") == 0)
        check(f'[{w}] quiz: oferece tentar de novo', pg.locator('#scr-quiz >> text=Tentar de novo').count() >= 1)
        pg.click('#scr-quiz button:has-text("Tentar de novo")'); pg.wait_for_timeout(200)
        n = pg.evaluate("window.__q.perguntas.length")
        jogar(True)
        info = pg.evaluate("PARTIU_PROGRESS.bairroInfo('copacabana')")
        check(f'[{w}] quiz: acertar marca todos os locais', info['completo'] and info['visitados'] == info['total'], info)
        pg.wait_for_selector('dialog[open]', timeout=3000)
        print('   diálogo:', pg.locator('dialog[open]').inner_text().replace('\n', ' | ')[:150])
        pg.screenshot(path=f'quiz_fim_{w}.png')
        pg.keyboard.press('Escape'); pg.wait_for_timeout(200)
        print('   XP:', pg.evaluate("PARTIU_PROGRESS.stats().xp"), '| próximo bairro:', pg.evaluate("PARTIU_PROGRESS.estadoBairro('ipanema')"))
        check(f'[{w}] bairro seguinte desbloqueado', pg.evaluate("PARTIU_PROGRESS.estadoBairro('ipanema')") in ('disponivel',))
        check(f'[{w}] sem erros de JS', not erros, erros)
        # mapa.html
        pg.goto('file://' + str(ROOT / 'html' / 'mapa.html')); pg.wait_for_timeout(1200)
        pg.locator('.partiu-pin').first.click(force=True); pg.wait_for_timeout(500)
        pop = pg.locator('.partiu-popup')
        print('   popup mapa.html:', pop.inner_text().replace('\n', ' | ') if pop.count() else 'nenhum')
    b.close()
print('FALHAS:', falhas)
