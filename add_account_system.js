const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'index.html');
let html = fs.readFileSync(filePath, 'utf8');

// ============================================================
// 1. Add CSS for login screen (before </style>)
// ============================================================
const loginCSS = `
  /* Login/Register Screen */
  #loginScreen { text-align: center; padding: 30px 0; }
  .login-card { background: linear-gradient(135deg, rgba(26,29,39,0.95), rgba(35,38,51,0.9)); border: 1px solid rgba(108,92,231,0.2); border-radius: 20px; padding: 36px; margin-bottom: 24px; box-shadow: 0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(108,92,231,0.15), inset 0 1px 0 rgba(255,255,255,0.05); backdrop-filter: blur(20px); max-width: 400px; margin-left: auto; margin-right: auto; }
  .login-card h2 { font-size: 20px; font-weight: 700; margin-bottom: 20px; color: var(--accent); }
  .login-input { width: 100%; padding: 14px 18px; border: 1px solid var(--border); border-radius: 12px; font-size: 15px; font-family: inherit; margin-bottom: 12px; background: var(--surface2); color: var(--text); box-shadow: inset 0 2px 4px rgba(0,0,0,0.1); outline: none; }
  .login-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-glow); }
  .login-input::placeholder { color: var(--text-muted); }
  .login-error { color: var(--wrong); font-size: 13px; margin-bottom: 12px; display: none; }
  .login-error.show { display: block; }
  .login-switch { color: var(--accent2); font-size: 13px; margin-top: 16px; cursor: pointer; text-decoration: underline; background: none; border: none; font-family: inherit; }
  .login-switch:hover { color: var(--accent); }
  .login-welcome { font-size: 14px; color: var(--text-muted); margin-bottom: 16px; line-height: 1.6; }
  .logout-btn { background: none; border: 1px solid var(--border); color: var(--text-muted); padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 12px; font-family: inherit; transition: all 0.2s; margin-top: 8px; }
  .logout-btn:hover { border-color: var(--wrong); color: var(--wrong); }
  .user-welcome-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 10px 16px; background: var(--surface2); border-radius: 12px; border: 1px solid var(--border); }
  .user-welcome-name { font-size: 14px; font-weight: 700; color: var(--accent2); }
`;

html = html.replace('</style>', loginCSS + '\n</style>');

// ============================================================
// 2. Add loginScreen HTML before startScreen
// ============================================================
const loginHTML = `
  <div id="loginScreen">
    <div class="login-card">
      <div id="loginFormArea">
        <!-- Will be populated by JS -->
      </div>
    </div>
  </div>

`;

html = html.replace('<div id="startScreen">', loginHTML + '  <div id="startScreen" style="display:none;">');

// ============================================================
// 3. Remove old userNameInput from startScreen
// ============================================================
html = html.replace(
  `      <div style="margin:16px 0;">
        <input type="text" id="userNameInput" placeholder="フルネームを漢字で入力（例：荒木稜）" required style="padding:12px 18px;border:1px solid var(--border);border-radius:12px;font-size:15px;font-family:inherit;width:100%;max-width:320px;margin-bottom:8px;background:var(--surface2);color:var(--text);box-shadow:inset 0 2px 4px rgba(0,0,0,0.1);" autocomplete="off">
      </div>`,
  `      <input type="hidden" id="userNameInput" value="">
      <div class="user-welcome-bar">
        <span class="user-welcome-name" id="welcomeUserName"></span>
        <button class="logout-btn" id="logoutBtn">ログアウト</button>
      </div>`
);

// ============================================================
// 4. Replace adminBtn with conditional admin button
// ============================================================
html = html.replace(
  `      <button class="btn-secondary" id="adminBtn">👑 王の玉座</button>`,
  `      <button class="btn-secondary" id="adminBtn" style="display:none;">📊 管理者・個人アカウント成績</button>`
);

// ============================================================
// 5. Add account system JS (before the existing script logic)
// ============================================================
const accountJS = `
// ============================================================
// アカウント管理システム
// ============================================================
let _currentAccount = null;

function getAccounts() {
  try { return JSON.parse(localStorage.getItem('quizAccounts') || '{}'); } catch(e) { return {}; }
}

function saveAccounts(accounts) {
  localStorage.setItem('quizAccounts', JSON.stringify(accounts));
}

function renderLoginScreen() {
  const accounts = getAccounts();
  const hasAccounts = Object.keys(accounts).length > 0;
  const lastUser = localStorage.getItem('lastLoginUser') || '';
  const area = document.getElementById('loginFormArea');

  // Check if user was previously logged in
  if (lastUser && accounts[lastUser]) {
    // Show login form
    area.innerHTML = '<h2>🔑 ログイン</h2>' +
      '<p class="login-welcome">おかえりなさい！パスワードを入力してください。</p>' +
      '<input type="text" class="login-input" id="loginName" value="' + lastUser + '" placeholder="名前" readonly style="opacity:0.7;cursor:default;">' +
      '<input type="password" class="login-input" id="loginPass" placeholder="パスワード" autocomplete="current-password">' +
      '<div class="login-error" id="loginError"></div>' +
      '<button class="btn-primary" id="loginSubmit" style="width:100%;margin-bottom:8px;">ログイン</button>' +
      '<button class="login-switch" id="switchUser">別のアカウントでログイン</button><br>' +
      '<button class="login-switch" id="toRegister" style="margin-top:8px;">新規アカウント作成</button>';

    document.getElementById('loginSubmit').addEventListener('click', doLogin);
    document.getElementById('loginPass').addEventListener('keydown', function(e) { if(e.key==='Enter') doLogin(); });
    document.getElementById('switchUser').addEventListener('click', showLoginSelectForm);
    document.getElementById('toRegister').addEventListener('click', showRegisterForm);
  } else if (hasAccounts) {
    showLoginSelectForm();
  } else {
    showRegisterForm();
  }
}

function showLoginSelectForm() {
  const accounts = getAccounts();
  const area = document.getElementById('loginFormArea');
  const userList = Object.keys(accounts);

  area.innerHTML = '<h2>🔑 ログイン</h2>' +
    '<p class="login-welcome">名前とパスワードを入力してください。</p>' +
    '<input type="text" class="login-input" id="loginName" placeholder="名前（漢字フルネーム）" autocomplete="off">' +
    '<input type="password" class="login-input" id="loginPass" placeholder="パスワード" autocomplete="current-password">' +
    '<div class="login-error" id="loginError"></div>' +
    '<button class="btn-primary" id="loginSubmit" style="width:100%;margin-bottom:8px;">ログイン</button>' +
    '<button class="login-switch" id="toRegister">新規アカウント作成</button>';

  document.getElementById('loginSubmit').addEventListener('click', doLogin);
  document.getElementById('loginPass').addEventListener('keydown', function(e) { if(e.key==='Enter') doLogin(); });
  document.getElementById('toRegister').addEventListener('click', showRegisterForm);
}

function showRegisterForm() {
  const area = document.getElementById('loginFormArea');
  area.innerHTML = '<h2>📝 新規アカウント作成</h2>' +
    '<p class="login-welcome">漢字フルネームとパスワードを登録してください。</p>' +
    '<input type="text" class="login-input" id="regName" placeholder="漢字フルネーム（例：荒木太郎）" autocomplete="off">' +
    '<input type="password" class="login-input" id="regPass" placeholder="パスワード（4文字以上）" autocomplete="new-password">' +
    '<input type="password" class="login-input" id="regPassConfirm" placeholder="パスワード（確認）" autocomplete="new-password">' +
    '<div class="login-error" id="loginError"></div>' +
    '<button class="btn-primary" id="regSubmit" style="width:100%;margin-bottom:8px;">アカウント作成</button>' +
    '<button class="login-switch" id="toLogin">既にアカウントをお持ちの方</button>';

  document.getElementById('regSubmit').addEventListener('click', doRegister);
  document.getElementById('regPassConfirm').addEventListener('keydown', function(e) { if(e.key==='Enter') doRegister(); });
  document.getElementById('toLogin').addEventListener('click', function() {
    const accounts = getAccounts();
    if (Object.keys(accounts).length > 0) showLoginSelectForm();
    else { showError('まだアカウントが登録されていません。'); }
  });
}

function showError(msg) {
  const el = document.getElementById('loginError');
  if (el) { el.textContent = msg; el.classList.add('show'); }
}

function clearError() {
  const el = document.getElementById('loginError');
  if (el) { el.textContent = ''; el.classList.remove('show'); }
}

function doRegister() {
  clearError();
  const name = document.getElementById('regName').value.trim();
  const pass = document.getElementById('regPass').value;
  const passConfirm = document.getElementById('regPassConfirm').value;

  if (!name) { showError('名前を入力してください。'); return; }
  const kanjiRegex = /^[\\u4E00-\\u9FFF\\u3400-\\u4DBF]+$/u;
  if (!kanjiRegex.test(name)) { showError('漢字フルネームで入力してください。（例：荒木太郎）'); return; }
  if (pass.length < 4) { showError('パスワードは4文字以上にしてください。'); return; }
  if (pass !== passConfirm) { showError('パスワードが一致しません。'); return; }

  const accounts = getAccounts();
  if (accounts[name]) { showError('この名前は既に登録されています。'); return; }

  accounts[name] = { pass: pass, created: new Date().toISOString() };
  saveAccounts(accounts);
  localStorage.setItem('lastLoginUser', name);

  loginAs(name);
}

function doLogin() {
  clearError();
  const name = document.getElementById('loginName').value.trim();
  const pass = document.getElementById('loginPass').value;

  if (!name) { showError('名前を入力してください。'); return; }
  if (!pass) { showError('パスワードを入力してください。'); return; }

  const accounts = getAccounts();
  if (!accounts[name]) { showError('このアカウントは存在しません。'); return; }
  if (accounts[name].pass !== pass) { showError('パスワードが正しくありません。'); return; }

  localStorage.setItem('lastLoginUser', name);
  loginAs(name);
}

function loginAs(name) {
  _currentAccount = name;
  document.getElementById('userNameInput').value = name;
  document.getElementById('welcomeUserName').textContent = '👤 ' + name + ' さん';

  // Show/hide admin button based on admin credentials
  const isAdmin = (name === _AH.id || checkAdminAccount(name));
  document.getElementById('adminBtn').style.display = isAdmin ? '' : 'none';

  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('startScreen').style.display = 'block';
  window.scrollTo(0, 0);
}

function checkAdminAccount(name) {
  // Admin can also login with their kanji name if linked
  const adminLink = localStorage.getItem('adminLinkedName');
  return adminLink === name;
}

function doLogout() {
  _currentAccount = null;
  document.getElementById('startScreen').style.display = 'none';
  document.getElementById('loginScreen').style.display = 'block';
  renderLoginScreen();
  window.scrollTo(0, 0);
}

`;

// Insert account JS right after <script> tag and GENRES/ALL_QUESTIONS definitions
// We need it after _AH is defined, so let's put it after the security constants
html = html.replace(
  "const LOCKOUT_DURATION=300000; // 5 minutes",
  "const LOCKOUT_DURATION=300000; // 5 minutes\n" + accountJS
);

// ============================================================
// 6. Modify startBtn click handler to not require kanji validation (already logged in)
// ============================================================
html = html.replace(
  `  const name=document.getElementById('userNameInput').value.trim();
  if(!name){alert('フルネームを漢字で入力してください。');return;}
  const kanjiRegex=/^[\\u4E00-\\u9FFF\\u3400-\\u4DBF]+$/u;
  if(!kanjiRegex.test(name)){alert('フルネームを漢字で入力してください。（例：荒木稜）');return;}
  localStorage.setItem('userName',name);
  wrongQuestions=[];startQuiz(selectedGenre,selectedCount);`,
  `  wrongQuestions=[];startQuiz(selectedGenre,selectedCount);`
);

// ============================================================
// 7. Remove old userName save/restore logic
// ============================================================
html = html.replace(
  `// ユーザー名の保存・復元
const savedName=localStorage.getItem('userName')||'';
if(savedName)document.getElementById('userNameInput').value=savedName;

// ユーザー名保存は startBtn の click handler に統合済み

// 結果表示時にユーザーデータ保存
const origSaveHistory=saveHistory;
saveHistory=function(total,score,pct){
  origSaveHistory(total,score,pct);
  const name=document.getElementById('userNameInput').value.trim()||'匿名';
  saveUserResult(name);
};`,
  `// 結果表示時にユーザーデータ保存
const origSaveHistory=saveHistory;
saveHistory=function(total,score,pct){
  origSaveHistory(total,score,pct);
  const name=_currentAccount||document.getElementById('userNameInput').value.trim()||'匿名';
  saveUserResult(name);
};`
);

// ============================================================
// 8. Modify admin login to also support linked admin account
// ============================================================
html = html.replace(
  `document.getElementById('adminBtn').addEventListener('click',()=>{
  const now=Date.now();
  if(now<_lockoutUntil){
    const remaining=Math.ceil((_lockoutUntil-now)/1000);
    alert('セキュリティロック中です。'+remaining+'秒後に再試行してください。');
    return;
  }
  const id=prompt('管理者IDを入力してください:');
  if(!id)return;
  const pw=prompt('パスワードを入力してください:');
  if(id===_AH.id&&pw===_AH.p){
    _loginAttempts=0;
    document.getElementById('startScreen').style.display='none';
    document.getElementById('adminScreen').style.display='block';
    window.scrollTo(0,0);
    renderAdminDashboard();
  }else{
    _loginAttempts++;
    if(_loginAttempts>=MAX_LOGIN_ATTEMPTS){
      _lockoutUntil=Date.now()+LOCKOUT_DURATION;
      _loginAttempts=0;
      alert('ログイン試行回数が上限に達しました。5分間ロックされます。');
    }else{
      alert('IDまたはパスワードが正しくありません。(残り試行回数: '+(MAX_LOGIN_ATTEMPTS-_loginAttempts)+')');
    }
  }
});`,
  `document.getElementById('adminBtn').addEventListener('click',()=>{
  const isLinkedAdmin = checkAdminAccount(_currentAccount);
  if(isLinkedAdmin) {
    // Already authenticated as admin via linked account
    document.getElementById('startScreen').style.display='none';
    document.getElementById('adminScreen').style.display='block';
    window.scrollTo(0,0);
    renderAdminDashboard();
    return;
  }
  const now=Date.now();
  if(now<_lockoutUntil){
    const remaining=Math.ceil((_lockoutUntil-now)/1000);
    alert('セキュリティロック中です。'+remaining+'秒後に再試行してください。');
    return;
  }
  const id=prompt('管理者IDを入力してください:');
  if(!id)return;
  const pw=prompt('パスワードを入力してください:');
  if(id===_AH.id&&pw===_AH.p){
    _loginAttempts=0;
    // Link current account as admin
    if(_currentAccount) localStorage.setItem('adminLinkedName', _currentAccount);
    document.getElementById('startScreen').style.display='none';
    document.getElementById('adminScreen').style.display='block';
    window.scrollTo(0,0);
    renderAdminDashboard();
  }else{
    _loginAttempts++;
    if(_loginAttempts>=MAX_LOGIN_ATTEMPTS){
      _lockoutUntil=Date.now()+LOCKOUT_DURATION;
      _loginAttempts=0;
      alert('ログイン試行回数が上限に達しました。5分間ロックされます。');
    }else{
      alert('IDまたはパスワードが正しくありません。(残り試行回数: '+(MAX_LOGIN_ATTEMPTS-_loginAttempts)+')');
    }
  }
});`
);

// ============================================================
// 9. Add logout button handler and init logic at end of script
// ============================================================
html = html.replace(
  `  // Periodic integrity check`,
  `  // Logout handler
  document.getElementById('logoutBtn').addEventListener('click', doLogout);

  // Initialize: show login screen on load
  document.getElementById('startScreen').style.display = 'none';
  document.getElementById('loginScreen').style.display = 'block';
  renderLoginScreen();

  // Periodic integrity check`
);

// ============================================================
// 10. Fix backBtn to go to startScreen (not loginScreen)
// ============================================================
// Already goes to startScreen, which is correct since user is logged in

// ============================================================
// 11. Fix quitBtn to go to startScreen (already correct)
// ============================================================

// ============================================================
// 12. Fix adminBack to go to startScreen (already correct)
// ============================================================

fs.writeFileSync(filePath, html, 'utf8');
console.log('Account system added successfully!');

// Verify key changes
const result = fs.readFileSync(filePath, 'utf8');
const checks = [
  ['loginScreen HTML', result.includes('id="loginScreen"')],
  ['login CSS', result.includes('.login-card')],
  ['account JS functions', result.includes('function renderLoginScreen()')],
  ['register function', result.includes('function doRegister()')],
  ['login function', result.includes('function doLogin()')],
  ['logout function', result.includes('function doLogout()')],
  ['admin button hidden by default', result.includes('id="adminBtn" style="display:none;"')],
  ['welcomeUserName', result.includes('id="welcomeUserName"')],
  ['logoutBtn', result.includes('id="logoutBtn"')],
  ['startScreen hidden initially', result.includes('id="startScreen" style="display:none;"')],
];
checks.forEach(([name, ok]) => console.log(`  ${ok ? '✓' : '✗'} ${name}`));
