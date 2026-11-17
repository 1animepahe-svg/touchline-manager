"""Optional UI integration test; requires Python Playwright and Chromium."""
import http.server, socketserver, threading, json
from pathlib import Path
from playwright.sync_api import sync_playwright

class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args): pass

with socketserver.TCPServer(('127.0.0.1',0),Handler) as httpd:
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    with sync_playwright() as pw:
        browser=pw.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox'])
        context=browser.new_context(viewport={'width':390,'height':844}, device_scale_factor=1, is_mobile=True, has_touch=True)
        page=context.new_page(); errors=[]
        page.on('pageerror', lambda exc: errors.append(str(exc)))
        page.goto(f'http://127.0.0.1:{httpd.server_address[1]}/',wait_until='load')
        page.get_by_role('heading',name='Your club, your call.').wait_for()
        assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth')
        page.screenshot(path='/tmp/touchline-home.png')
        page.get_by_role('button',name='Squad',exact=True).click()
        page.locator('#formation').select_option(label='4-4-2')
        page.locator('#slot-0').select_option('p1')
        state=lambda: json.loads(page.evaluate("localStorage.getItem('touchline-manager-v1')"))
        assert state()['formation']=='4-4-2' and state()['lineup'][0]=='p1' and state()['lineup'][1]=='p0'
        page.locator('#formation').select_option(label='4-3-1-2')
        page.get_by_role('button',name='Training',exact=True).click()
        page.locator('#trainee').select_option('p2')
        before=state()['roster'][2]['attack']
        page.get_by_role('button',name='Run session →').click()
        assert state()['roster'][2]['attack']==before+2 and state()['training']==2
        page.get_by_role('button',name='Market',exact=True).click()
        assert page.locator('[data-buy]:not([disabled])').count()>0
        page.locator('[data-buy]:not([disabled])').first.click()
        assert len(state()['roster'])==17
        page.get_by_role('button',name='Home',exact=True).click()
        page.get_by_role('button',name='Play match →').click()
        assert state()['round']==1 and state()['lastMatch']['round']==1
        page.reload();assert state()['round']==1 and len(state()['roster'])==17 and state()['formation']=='4-3-1-2'
        page.get_by_role('button',name='League',exact=True).click()
        assert page.locator('table tbody tr').count()==6
        assert page.get_by_text('MATCHWEEK 10',exact=True).count()==1
        assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth')
        page.evaluate('navigator.serviceWorker.ready')
        page.wait_for_function('navigator.serviceWorker.controller !== null')
        context.set_offline(True)
        page.reload(wait_until='load')
        assert state()['round']==1 and len(state()['roster'])==17
        page.get_by_role('button',name='Play match →').click()
        assert state()['round']==2
        assert not errors,errors
        print('PASS mobile UI: lineup, formation, training, transfer, match, league, localStorage reload, offline reload and offline match; no page errors or horizontal overflow')
        browser.close()
    httpd.shutdown()
