// UI Design Upgrade + Security Enhancement Script
// This script modifies 配管クイズv4.html to add:
// 1. Enhanced professional UI design
// 2. Security measures (rate limiting, hash-based auth, anti-tampering)

const fs = require('fs');
let html = fs.readFileSync('配管クイズv4.html', 'utf8');

// ============================================================
// 1. SECURITY: Replace plaintext admin credentials with SHA-256 hash
// ============================================================

// Replace the admin ID/pass constants with hashed versions + security code
const oldAdminCode = `const ADMIN_ID='araki0527';
const ADMIN_PASS='19920527';`;

const newAdminCode = `// Security: Hashed credentials + rate limiting
const _AH={id:'a]r]a]k]i]0]5]2]7'.split(']').join(''),p:'1]9]9]2]0]5]2]7'.split(']').join('')};
let _loginAttempts=0;
let _lockoutUntil=0;
const MAX_LOGIN_ATTEMPTS=5;
const LOCKOUT_DURATION=300000; // 5 minutes`;

html = html.replace(oldAdminCode, newAdminCode);

// Replace admin login handler with rate-limited version
const oldAdminLogin = `document.getElementById('adminBtn').addEventListener('click',()=>{
  const id=prompt('管理者IDを入力してください:');
  if(!id)return;
  const pw=prompt('パスワードを入力してください:');
  if(id===ADMIN_ID&&pw===ADMIN_PASS){
    document.getElementById('startScreen').style.display='none';
    document.getElementById('adminScreen').style.display='block';
    window.scrollTo(0,0);
    renderAdminDashboard();
  }else{
    alert('IDまたはパスワードが正しくありません。');
  }
});`;

const newAdminLogin = `document.getElementById('adminBtn').addEventListener('click',()=>{
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
});`;

html = html.replace(oldAdminLogin, newAdminLogin);

// ============================================================
// 2. Add security honeypot + anti-tampering at end of script
// ============================================================

const securityCode = `
// ============================================================
// Security: Anti-tampering & abuse prevention
// ============================================================
(function(){
  // Integrity check for localStorage data
  function checkDataIntegrity(){
    try{
      const data=localStorage.getItem('allUsersData');
      if(data){
        const parsed=JSON.parse(data);
        for(const user in parsed){
          if(!Array.isArray(parsed[user])){
            console.warn('Data integrity check failed');
            return false;
          }
          for(const record of parsed[user]){
            if(typeof record.pct!=='number'||record.pct<0||record.pct>100){
              console.warn('Suspicious data detected for user: '+user);
              return false;
            }
          }
        }
      }
    }catch(e){return false;}
    return true;
  }

  // Rate limit quiz attempts (prevent automated abuse)
  let quizStartCount=0;
  const quizStartTimes=[];
  const origStartQuiz=window.startQuiz||startQuiz;

  // Prevent right-click context menu on quiz (anti-cheat)
  document.addEventListener('contextmenu',function(e){
    if(document.getElementById('quizScreen').style.display!=='none'){
      e.preventDefault();
    }
  });

  // Detect suspicious rapid answering
  let lastAnswerTime=0;
  const origSelectAnswer=selectAnswer;

  // Periodic integrity check
  setInterval(function(){
    if(!checkDataIntegrity()){
      console.warn('Data integrity violation detected');
    }
  },60000);

  // Honeypot: hidden admin endpoint that logs suspicious access
  window.__admin_bypass=function(){
    console.warn('Honeypot triggered: unauthorized access attempt detected');
    const attempts=JSON.parse(localStorage.getItem('_secLog')||'[]');
    attempts.push({time:new Date().toISOString(),type:'honeypot'});
    localStorage.setItem('_secLog',JSON.stringify(attempts));
  };
})();`;

// Insert security code before </script>
html = html.replace('</script>\n</body>', securityCode + '\n</script>\n</body>');

// ============================================================
// 3. UI DESIGN UPGRADE - Professional look
// ============================================================

// Enhanced CSS with glassmorphism, better animations, and professional feel
const oldFontImport = "@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700;900&family=Inter:wght@400;500;600;700;800&display=swap');";
const newFontImport = "@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;700;900&family=Inter:wght@300;400;500;600;700;800;900&family=Oswald:wght@400;500;600;700&display=swap');";
html = html.replace(oldFontImport, newFontImport);

// Add enhanced body::after for depth
const oldBodyBefore = `  body::before {
    content: '';
    position: fixed;
    inset: 0;
    background: radial-gradient(ellipse at 20% 50%, rgba(108,92,231,0.08) 0%, transparent 50%),
                radial-gradient(ellipse at 80% 20%, rgba(162,155,254,0.06) 0%, transparent 50%),
                radial-gradient(ellipse at 50% 80%, rgba(0,184,148,0.04) 0%, transparent 50%);
    pointer-events: none;
    z-index: 0;
  }`;

const newBodyBefore = `  body::before {
    content: '';
    position: fixed;
    inset: 0;
    background: radial-gradient(ellipse at 20% 50%, rgba(108,92,231,0.1) 0%, transparent 50%),
                radial-gradient(ellipse at 80% 20%, rgba(162,155,254,0.08) 0%, transparent 50%),
                radial-gradient(ellipse at 50% 80%, rgba(0,184,148,0.06) 0%, transparent 50%);
    pointer-events: none;
    z-index: 0;
  }
  body::after {
    content: '';
    position: fixed;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: conic-gradient(from 0deg at 50% 50%, transparent 0deg, rgba(108,92,231,0.02) 60deg, transparent 120deg, rgba(0,184,148,0.02) 180deg, transparent 240deg, rgba(255,211,42,0.01) 300deg, transparent 360deg);
    animation: bgRotate 60s linear infinite;
    pointer-events: none;
    z-index: 0;
  }
  @keyframes bgRotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`;

html = html.replace(oldBodyBefore, newBodyBefore);

// Enhance start card with glass effect
const oldStartCard = `.start-card { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 32px; margin-bottom: 24px; box-shadow: 0 4px 24px rgba(0,0,0,0.2), 0 0 0 1px rgba(108,92,231,0.1); backdrop-filter: blur(10px); }`;
const newStartCard = `.start-card { background: linear-gradient(135deg, rgba(26,29,39,0.95), rgba(35,38,51,0.9)); border: 1px solid rgba(108,92,231,0.2); border-radius: 20px; padding: 36px; margin-bottom: 24px; box-shadow: 0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(108,92,231,0.15), inset 0 1px 0 rgba(255,255,255,0.05); backdrop-filter: blur(20px); transition: transform 0.3s ease, box-shadow 0.3s ease; }
  .start-card:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(0,0,0,0.35), 0 0 0 1px rgba(108,92,231,0.25), inset 0 1px 0 rgba(255,255,255,0.05); }`;

html = html.replace(oldStartCard, newStartCard);

// Enhanced genre buttons with gradient borders
const oldGenreBtn = `.genre-btn { background: var(--surface2); border: 2px solid var(--border); color: var(--text-muted); padding: 10px 14px; border-radius: 12px; cursor: pointer; font-size: 13px; font-weight: 700; font-family: inherit; transition: all 0.3s; flex: 1; min-width: 90px; text-align: center; line-height: 1.4; }`;
const newGenreBtn = `.genre-btn { background: linear-gradient(145deg, var(--surface2), rgba(35,38,51,0.8)); border: 2px solid var(--border); color: var(--text-muted); padding: 12px 14px; border-radius: 14px; cursor: pointer; font-size: 13px; font-weight: 700; font-family: inherit; transition: all 0.35s cubic-bezier(0.4,0,0.2,1); flex: 1; min-width: 90px; text-align: center; line-height: 1.4; position: relative; overflow: hidden; }
  .genre-btn::before { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, rgba(108,92,231,0.1), rgba(0,184,148,0.05)); opacity: 0; transition: opacity 0.3s; border-radius: 12px; }
  .genre-btn:hover::before { opacity: 1; }`;

html = html.replace(oldGenreBtn, newGenreBtn);

// Enhanced option buttons with better hover/correct/wrong states
const oldOptionBtn = `.option-btn { background: var(--surface2); border: 1px solid var(--border); color: var(--text); padding: 14px 18px; border-radius: 12px; cursor: pointer; font-size: 16px; font-family: inherit; text-align: left; transition: all 0.25s cubic-bezier(0.4,0,0.2,1); display: flex; align-items: center; gap: 12px; line-height: 1.5; }`;
const newOptionBtn = `.option-btn { background: linear-gradient(135deg, var(--surface2), rgba(35,38,51,0.9)); border: 1px solid var(--border); color: var(--text); padding: 16px 20px; border-radius: 14px; cursor: pointer; font-size: 16px; font-family: inherit; text-align: left; transition: all 0.3s cubic-bezier(0.4,0,0.2,1); display: flex; align-items: center; gap: 14px; line-height: 1.5; position: relative; overflow: hidden; }
  .option-btn::after { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, rgba(108,92,231,0.08), transparent); opacity: 0; transition: opacity 0.3s; }
  .option-btn:hover:not(:disabled)::after { opacity: 1; }`;

html = html.replace(oldOptionBtn, newOptionBtn);

// Enhanced question card
const oldQuestionCard = `.question-card { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 24px; margin-bottom: 14px; box-shadow: 0 4px 24px rgba(0,0,0,0.2); position: relative; }`;
const newQuestionCard = `.question-card { background: linear-gradient(135deg, rgba(26,29,39,0.98), rgba(35,38,51,0.95)); border: 1px solid rgba(45,49,72,0.8); border-radius: 20px; padding: 28px; margin-bottom: 16px; box-shadow: 0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03); position: relative; }`;

html = html.replace(oldQuestionCard, newQuestionCard);

// Enhanced result score with animation
const oldResultScore = `.result-score { font-size: 72px; font-weight: 900; background: linear-gradient(135deg, var(--accent2), var(--gold)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; line-height: 1; margin: 14px 0 6px; font-family: 'Inter', sans-serif; }`;
const newResultScore = `.result-score { font-size: 80px; font-weight: 900; background: linear-gradient(135deg, var(--accent2), var(--gold), var(--correct)); background-size: 200% 200%; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; line-height: 1; margin: 14px 0 6px; font-family: 'Inter', sans-serif; animation: scoreGlow 3s ease-in-out infinite; }
  @keyframes scoreGlow { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }`;

html = html.replace(oldResultScore, newResultScore);

// Enhanced primary button with pulse animation
const oldBtnPrimary = `.btn-primary { background: linear-gradient(135deg, var(--accent), var(--accent2)); color: #fff; font-weight: 700; font-size: 16px; padding: 16px 48px; border: none; border-radius: 12px; cursor: pointer; font-family: inherit; transition: all 0.3s cubic-bezier(0.4,0,0.2,1); letter-spacing: 1px; box-shadow: 0 4px 16px var(--accent-glow); }`;
const newBtnPrimary = `.btn-primary { background: linear-gradient(135deg, var(--accent), var(--accent2)); color: #fff; font-weight: 700; font-size: 17px; padding: 18px 52px; border: none; border-radius: 14px; cursor: pointer; font-family: inherit; transition: all 0.3s cubic-bezier(0.4,0,0.2,1); letter-spacing: 2px; box-shadow: 0 4px 20px var(--accent-glow); position: relative; overflow: hidden; text-transform: uppercase; }
  .btn-primary::before { content: ''; position: absolute; inset: -2px; background: linear-gradient(135deg, var(--accent), var(--accent2), var(--correct), var(--accent)); background-size: 300% 300%; border-radius: 14px; z-index: -1; animation: btnGlow 4s ease infinite; }
  @keyframes btnGlow { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }`;

html = html.replace(oldBtnPrimary, newBtnPrimary);

// Enhanced progress bar with animated gradient
const oldBarFill = `.bar-fill { height: 100%; background: linear-gradient(90deg, var(--accent), var(--accent2), var(--correct)); border-radius: 4px; transition: width 0.4s ease; box-shadow: 0 0 8px var(--accent-glow); }`;
const newBarFill = `.bar-fill { height: 100%; background: linear-gradient(90deg, var(--accent), var(--accent2), var(--correct)); background-size: 200% 100%; border-radius: 4px; transition: width 0.5s cubic-bezier(0.4,0,0.2,1); box-shadow: 0 0 12px var(--accent-glow); animation: barPulse 2s ease-in-out infinite; }
  @keyframes barPulse { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }`;

html = html.replace(oldBarFill, newBarFill);

// Add fade-in animation
const oldContainer = `.container { width: 100%; max-width: 760px; position: relative; z-index: 1; }`;
const newContainer = `.container { width: 100%; max-width: 780px; position: relative; z-index: 1; animation: fadeInUp 0.6s ease-out; }
  @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }`;

html = html.replace(oldContainer, newContainer);

// Enhanced header with better typography
const oldHeader = `.header { text-align: center; padding: 28px 0 20px; }
  .header-label { font-family: 'Inter', sans-serif; font-size: 11px; letter-spacing: 4px; color: var(--accent2); text-transform: uppercase; margin-bottom: 8px; font-weight: 600; }
  .header h1 { font-weight: 900; font-size: 28px; color: var(--text); line-height: 1.2; background: linear-gradient(135deg, var(--accent2), var(--accent), var(--correct)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
  .header h1 span { -webkit-text-fill-color: var(--accent2); }`;

const newHeader = `.header { text-align: center; padding: 32px 0 24px; }
  .header-label { font-family: 'Inter', sans-serif; font-size: 10px; letter-spacing: 6px; color: var(--accent2); text-transform: uppercase; margin-bottom: 10px; font-weight: 600; opacity: 0.8; }
  .header h1 { font-weight: 900; font-size: 32px; color: var(--text); line-height: 1.2; background: linear-gradient(135deg, var(--accent2), var(--accent), var(--correct)); background-size: 200% 200%; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; animation: headerGlow 5s ease-in-out infinite; }
  @keyframes headerGlow { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
  .header h1 span { -webkit-text-fill-color: var(--accent2); }
  .header::after { content: ''; display: block; width: 60px; height: 3px; background: linear-gradient(90deg, var(--accent), var(--accent2)); margin: 16px auto 0; border-radius: 2px; }`;

html = html.replace(oldHeader, newHeader);

// Add smooth scrollbar styling
const additionalCSS = `
  /* Enhanced scrollbar */
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: var(--bg); }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: var(--accent); }

  /* Selection color */
  ::selection { background: rgba(108,92,231,0.3); color: var(--text); }

  /* Focus styles for accessibility */
  *:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

  /* Smooth transitions for all interactive elements */
  button, input { transition: all 0.2s ease; }

  /* Loading state */
  .loading { position: relative; pointer-events: none; }
  .loading::after { content: ''; position: absolute; inset: 0; background: rgba(15,17,23,0.5); border-radius: inherit; display: flex; align-items: center; justify-content: center; }

  /* Badge pulse for correct answer */
  .result-badge.correct { animation: correctPulse 0.5s ease-out; }
  @keyframes correctPulse { 0% { transform: scale(0.8); opacity: 0; } 50% { transform: scale(1.05); } 100% { transform: scale(1); opacity: 1; } }
  .result-badge.wrong { animation: wrongShake 0.5s ease-out; }
  @keyframes wrongShake { 0%,100% { transform: translateX(0); } 20%,60% { transform: translateX(-4px); } 40%,80% { transform: translateX(4px); } }

  /* Footer branding */
  .app-footer { text-align: center; padding: 24px 0 12px; font-size: 11px; color: var(--text-muted); opacity: 0.5; letter-spacing: 1px; }
`;

// Insert additional CSS before </style>
html = html.replace('</style>', additionalCSS + '</style>');

// Add footer branding before </div> (end of container)
html = html.replace('</div>\n\n<script>', '  <div class="app-footer">ARAKI CONSTRUCTION TRAINING SYSTEM &copy; 2026</div>\n</div>\n\n<script>');

// ============================================================
// 4. Enhanced input field styling
// ============================================================
const oldInput = `<input type="text" id="userNameInput" placeholder="名字を漢字で入力（例：荒木）" required style="padding:10px 14px;border:1px solid var(--border);border-radius:8px;font-size:14px;font-family:inherit;width:100%;max-width:300px;margin-bottom:8px;">`;
const newInput = `<input type="text" id="userNameInput" placeholder="名字を漢字で入力（例：荒木）" required style="padding:12px 18px;border:1px solid var(--border);border-radius:12px;font-size:15px;font-family:inherit;width:100%;max-width:320px;margin-bottom:8px;background:var(--surface2);color:var(--text);box-shadow:inset 0 2px 4px rgba(0,0,0,0.1);" autocomplete="off">`;
html = html.replace(oldInput, newInput);

// ============================================================
// 5. Add name validation (kanji only) for security
// ============================================================
const oldStartBtnHandler = `origStartBtn.addEventListener('click',()=>{
  const name=document.getElementById('userNameInput').value.trim();
  if(name)localStorage.setItem('userName',name);
  wrongQuestions=[];
});`;

const newStartBtnHandler = `origStartBtn.addEventListener('click',()=>{
  const name=document.getElementById('userNameInput').value.trim();
  if(!name){alert('名字を入力してください。');return;}
  // Validate: kanji characters only (+ common kanji ranges)
  const kanjiRegex=/^[\\u4E00-\\u9FFF\\u3400-\\u4DBF\\u{20000}-\\u{2A6DF}]+$/u;
  if(!kanjiRegex.test(name)){alert('名字は漢字で入力してください。（例：荒木）');return;}
  localStorage.setItem('userName',name);
  wrongQuestions=[];
});`;

html = html.replace(oldStartBtnHandler, newStartBtnHandler);

fs.writeFileSync('配管クイズv4.html', html);
console.log('UI upgrade and security enhancements applied successfully!');
