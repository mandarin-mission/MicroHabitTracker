// 請替換為您的 GAS Web App 部署網址
const API_URL = 'https://script.google.com/macros/s/AKfycbzYNUBHdlVuC33kX_nymd1jyRXqkEKcmGmEYO0v9SwHGePyykhSA0npuT3AP50njbCOcg/exec';

let currentUser = '', currentUsername = '', currentTitle = '', isAdmin = false, identity = '', userData = {}, chart = null, editableIdentity = false;
let adminRawData = [];

// 封裝 API 呼叫函式
async function apiCall(action, payload = {}, method = 'POST') {
  try {
    let url = `${API_URL}?action=${action}`;
    let options = { method: method };

    if (method === 'POST') {
      // GAS 接收 JSON POST 時使用 text/plain 可避免跨網域預檢 (Preflight CORS) 問題
      options.headers = { 'Content-Type': 'text/plain;charset=utf-8' };
      options.body = JSON.stringify(payload);
    } else {
      // GET 請求拼接 Query String
      for (let key in payload) {
        url += `&${key}=${encodeURIComponent(payload[key])}`;
      }
    }

    const res = await fetch(url, options);
    return await res.json();
  } catch (err) {
    console.error('API Call Error:', err);
    throw err;
  }
}

const dynamicButtonPhrases = [
  "今日跨出一小步，即刻打卡！✨", "微習慣，大改變！點擊打卡", "主裡同行，今日目標達成！🔥",
  "每一天的堅持，都是恩典！", "將微小交託主，立即打卡", "今日宣告：我做得到！🌱",
  "持之以恆，勝過一時熱血", "小習慣築起大生命，打卡！", "與主同步，打卡記錄",
  "今天也是靠主得勝的一天！", "點擊打卡，為今天畫上完美句號", "不積跬步，無以至千里",
  "今天你為生命投資了嗎？打卡！", "靠著那加給我力量的，衝呀！", "微小調整，向主對齊",
  "今日微習慣已解鎖！", "生命更新中，點擊打卡", "一步一腳印，與主同行",
  "今天也是恩典滿滿的一天", "今天做到了！為自己讚賞！", "專注當下，點擊打卡",
  "為主立志，今日達成！", "輕省前行，微習慣打卡", "建立屬靈節奏，打卡！",
  "又是得勝的一天，點擊打卡！", "今天持守了立志！讚！", "心意更新而變化，打卡！",
  "小事上忠心，大事上得力", "今天與主有個微小約定", "生命正在悄悄改變，打卡！",
  "為主多走一步，立刻打卡", "把今日的順服記錄下來", "微习惯，持守屬靈操練",
  "今天也是充滿盼望的一天！", "打卡！宣告神掌管今天", "在小事上經歷神，點擊！",
  "今天的立志，今天完成！", "每天進步1%，打卡！", "靠主恩典，今日達陣！",
  "為主而活的今天，打卡！", "生命成長的痕跡，點擊打卡", "今天的順服，明天的力量",
  "今日屬靈清單：已完成！", "在微小事上活出信仰", "點擊，留下得勝的記號",
  "每天與主同行多一點", "微習慣進行中，打卡！", "活出命定，從今日打卡開始",
  "今天完成了美好的操練！", "主看重你的堅持，打卡吧！"
];

const prayerVerbs = ["引領", "保守", "加力予", "恩待", "看顧", "激勵", "陪伴", "光照"];

function setDynamicButtonText() {
  const btn = document.getElementById('dynamicSubmitBtn');
  if (btn) {
    const randomIdx = Math.floor(Math.random() * dynamicButtonPhrases.length);
    btn.innerText = `${dynamicButtonPhrases[randomIdx]} 👉 提交`;
  }
}

function updateHeaderName(username, title) {
  const titleSuffix = title ? ` [${title}]` : '';
  document.getElementById('userNameHeader').innerText = username + titleSuffix;
}

async function loginUser() {
  const userId = document.getElementById('userId').value.trim();
  const password = document.getElementById('password').value;
  if (!userId || !password) {
    document.getElementById('error').innerText = '請輸入 User ID 和 Password';
    return;
  }

  document.getElementById('error').innerText = '登入中...';
  
  try {
    const res = await apiCall('login', { userId, password });
    if (res.success) {
      currentUser = userId;
      currentUsername = res.username;
      currentTitle = res.title;
      isAdmin = res.isAdmin;
      identity = res.identity;
      editableIdentity = res.editableIdentity;

      updateHeaderName(currentUsername, currentTitle);
      document.getElementById('login').style.display = 'none';
      document.getElementById('main').style.display = 'block';

      if (isAdmin) {
        document.getElementById('adminBtn').style.display = 'inline-block';
        document.getElementById('shareBtn').style.display = 'inline-block';
      }

      const data = await apiCall('getUserData', { userId: currentUser }, 'GET');
      userData = data;
      identity = data.identity || identity;
      currentTitle = data.title || currentTitle;
      updateHeaderName(currentUsername, currentTitle);

      if (userData.streak > 0) {
        const streakEl = document.getElementById('streakDisplay');
        streakEl.innerText = `🔥 您已連續 ${userData.streak} 週同行！加油！`;
        streakEl.style.display = 'block';
      }
      showRecording();
    } else {
      document.getElementById('error').innerText = '登入失敗，請檢查帳號密碼';
    }
  } catch (err) {
    document.getElementById('error').innerText = '連線失敗，請稍後再試';
  }
}

function showRecording() {
  hideAllViews();
  document.getElementById('recording').style.display = 'block';
  setDynamicButtonText();

  document.getElementById('currentWeek').innerText = userData.currentWeek || '-';
  document.getElementById('currentHabit').value = userData.currentHabit || '(首次無上週記錄)';

  document.getElementById('userTitleInput').value = currentTitle;
  document.getElementById('userTitleInput').disabled = !editableIdentity;

  document.getElementById('identity').value = identity;
  document.getElementById('identity').disabled = !editableIdentity;

  document.getElementById('weeklyProgress').value = userData.currentWeeklyProgress || '';
  toggleChange(false);

  const msgEl = document.getElementById('submitMsg');
  if (userData.hasSubmitted) {
    msgEl.innerText = '✨ 本週已成功打卡同行！若再次儲存將更新進展。';
    msgEl.style.color = '#4CAF50';
  } else {
    msgEl.innerText = '';
  }
}

function toggleChange(yes) {
  const btnYes = document.getElementById('changeYes');
  const btnNo = document.getElementById('changeNo');
  btnYes.style.background = yes ? '#e67e22' : '#eee';
  btnYes.style.color = yes ? '#fff' : '#000';
  btnNo.style.background = yes ? '#eee' : '#ccc';
  btnNo.style.color = yes ? '#000' : '#fff';

  document.getElementById('newHabitDiv').style.display = yes ? 'block' : 'none';
  if (yes && !document.getElementById('newHabit').value) {
    document.getElementById('newHabit').value = userData.prefillNewHabit || '';
  }
}

async function saveRecording() {
  const isChanging = document.getElementById('changeYes').style.background === 'rgb(230, 126, 34)' || document.getElementById('changeYes').style.background === '#e67e22';
  const newHabit = isChanging ? document.getElementById('newHabit').value.trim() : null;

  const currentIdentity = editableIdentity ? document.getElementById('identity').value.trim() : undefined;
  const currentTitleVal = editableIdentity ? document.getElementById('userTitleInput').value.trim() : undefined;
  const progress = document.getElementById('weeklyProgress').value.trim();

  document.getElementById('submitMsg').innerText = '儲存中...';

  try {
    await apiCall('saveData', {
      userId: currentUser,
      week: userData.currentWeek,
      habit: userData.currentHabit,
      newHabit: newHabit,
      newIdentity: currentIdentity,
      newTitle: currentTitleVal,
      weeklyProgress: progress
    });

    alert('打卡成功！');
    userData.hasSubmitted = true;
    if (isChanging && newHabit) userData.currentHabit = newHabit;
    userData.currentWeeklyProgress = progress;
    if (currentIdentity !== undefined) identity = currentIdentity;
    if (currentTitleVal !== undefined) currentTitle = currentTitleVal;

    updateHeaderName(currentUsername, currentTitle);

    const data = await apiCall('getUserData', { userId: currentUser }, 'GET');
    userData = data;
    if (userData.streak > 0) {
      const streakEl = document.getElementById('streakDisplay');
      streakEl.innerText = `🔥 您已連續 ${userData.streak} 週同行！加油！`;
      streakEl.style.display = 'block';
    }
    showRecording();
  } catch (err) {
    alert('儲存失敗，請重試');
  }
}

function showReview() {
  hideAllViews();
  document.getElementById('review').style.display = 'block';
  showTable();
}

function showTable() {
  document.getElementById('tableView').style.display = 'block';
  document.getElementById('chartView').style.display = 'none';
  document.getElementById('identityTitle').innerText = `我的身份：${identity || '(未填寫)'}`;

  const tbody = document.getElementById('userHistoryTable').getElementsByTagName('tbody')[0];
  tbody.innerHTML = '';

  if (userData.history && userData.history.length > 0) {
    userData.history.forEach(row => {
      const tr = document.createElement('tr');
      let statusText = Number(row.score) === 1 ? '✅ 已打卡' : row.score;
      tr.innerHTML = `<td>第 ${row.week} 週</td><td style="text-align:left;">${row.habit}</td><td>${statusText}</td>`;
      tbody.appendChild(tr);
    });
  } else {
    tbody.innerHTML = '<tr><td colspan="3">暫無歷史記錄，開始你的第一次打卡吧！🌱</td></tr>';
  }
}

function showChart() {
  document.getElementById('tableView').style.display = 'none';
  document.getElementById('chartView').style.display = 'block';
  document.getElementById('identityTitleChart').innerText = `我的身份：${identity || '(未填寫)'}`;

  const ctx = document.getElementById('lineChart').getContext('2d');
  const labels = userData.history.map(row => `第 ${row.week} 週`);
  const scores = userData.history.map(row => row.score);

  if (chart) { chart.destroy(); }

  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: '歷史進度回顧 (1為已打卡)',
        data: scores,
        borderColor: '#e67e22',
        backgroundColor: 'rgba(230, 126, 34, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { y: { min: 0, max: 10 } }
    }
  });
}

async function showAdmin() {
  hideAllViews();
  document.getElementById('adminView').style.display = 'block';
  document.getElementById('prayerCardsContainer').innerHTML = '';

  try {
    const data = await apiCall('getAllUsersData', {}, 'GET');
    adminRawData = data.slice(1);
    filterAdminTable();
  } catch (err) {
    console.error(err);
  }
}

function filterAdminTable() {
  const filterText = document.getElementById('filterUser').value.trim().toLowerCase();
  const sortOrder = document.getElementById('sortWeek').value;

  let filtered = adminRawData.filter(row => row[1].toLowerCase().includes(filterText));
  filtered.sort((a, b) => sortOrder === 'desc' ? b[2] - a[2] : a[2] - b[2]);

  const tbody = document.getElementById('adminTable').getElementsByTagName('tbody')[0];
  tbody.innerHTML = '';

  filtered.forEach(row => {
    const tr = document.createElement('tr');
    let displayScore = Number(row[4]) === 1 ? '✅ 已打卡' : row[4];
    tr.innerHTML = `<td>${row[1]}</td><td>第 ${row[2]} 週</td><td style="text-align:left;">${row[3]}</td><td>${displayScore}</td>`;
    tbody.appendChild(tr);
  });
}

async function generatePrayerCards() {
  const container = document.getElementById('prayerCardsContainer');
  container.innerHTML = '正在產生本週立志代禱字卡...';

  try {
    const res = await apiCall('getAllCurrentWeekData', {}, 'GET');
    container.innerHTML = '';
    if (!res.data || res.data.length === 0) {
      container.innerHTML = '本週無成員提交數據。';
      return;
    }

    res.data.forEach(user => {
      if (!user.habit) return;

      const randomVerb = prayerVerbs[Math.floor(Math.random() * prayerVerbs.length)];
      const card = document.createElement('div');
      card.className = 'prayer-card';

      const displayTitleOnly = user.title ? user.title : '天路客';
      card.innerHTML = `願主 <strong>${randomVerb}</strong> <strong>${displayTitleOnly}</strong>，今個禮拜 <strong>${user.habit}</strong>，奉主名求，阿門。`;
      container.appendChild(card);
    });

    if (container.innerHTML === '') {
      container.innerHTML = '本週暫無已提交的微習慣。';
    }
  } catch (err) {
    container.innerHTML = '產生字卡失敗。';
  }
}

function showShareAdmin() {
  hideAllViews();
  document.getElementById('shareAdmin').style.display = 'block';
  document.getElementById('shareWeekDisplay').innerText = userData.currentWeek || '';
}

async function generateQRCodes() {
  const container = document.getElementById('qrContainer');
  container.innerHTML = '正在取得本週全體數據...';

  try {
    const res = await apiCall('getAllCurrentWeekData', {}, 'GET');
    container.innerHTML = '';
    if (!res.data || res.data.length === 0) {
      container.innerHTML = '本週暫無數據';
      return;
    }
    const baseUrl = window.location.href.split('?')[0];
    res.data.forEach(user => {
      const card = document.createElement('div');
      const qrDiv = document.createElement('div');
      const shareUrl = `${baseUrl}?mode=share&user=${encodeURIComponent(user.userId)}&week=${res.week}`;

      new QRCode(qrDiv, {
        text: shareUrl,
        width: 90,
        height: 90,
        correctLevel: QRCode.CorrectLevel.M
      });

      const label = document.createElement('span');
      const titleLabel = user.title ? ` [${user.title}]` : '';
      label.innerText = user.username + titleLabel;
      label.style.marginTop = '4px';
      label.style.fontWeight = 'bold';

      card.appendChild(qrDiv);
      card.appendChild(label);
      container.appendChild(card);
    });
  } catch (err) {
    container.innerHTML = '產生 QR Code 失敗。';
  }
}

function logout() {
  currentUser = ''; currentUsername = ''; currentTitle = ''; isAdmin = false; identity = ''; userData = {};
  if (chart) { chart.destroy(); chart = null; }
  document.getElementById('userId').value = '';
  document.getElementById('password').value = '';
  document.getElementById('main').style.display = 'none';
  document.getElementById('login').style.display = 'block';
  document.getElementById('adminBtn').style.display = 'none';
  document.getElementById('shareBtn').style.display = 'none';
  document.getElementById('streakDisplay').style.display = 'none';
}

function hideAllViews() {
  document.getElementById('recording').style.display = 'none';
  document.getElementById('review').style.display = 'none';
  document.getElementById('adminView').style.display = 'none';
  document.getElementById('shareAdmin').style.display = 'none';
}

/* ================= 處理分享模式 (Share View) 的 logic ================= */
let shareUserId = '';
let shareUserData = null;
let shareUserTitle = '';
let shareEditableTitle = false;

async function checkShareMode() {
  const urlParams = new URLSearchParams(window.location.search);
  const isShareMode = urlParams.get('mode') === 'share';

  if (isShareMode) {
    document.getElementById('appView').style.display = 'none';
    document.getElementById('shareView').style.display = 'block';

    shareUserId = urlParams.get('user') || '';
    const specifiedWeek = urlParams.get('week');

    // 建立請求參數，若沒有 specifiedWeek 則不傳遞 week 欄位
    const queryPayload = { userId: shareUserId };
    if (specifiedWeek && specifiedWeek !== 'null' && specifiedWeek !== 'undefined') {
      queryPayload.week = specifiedWeek;
    }

    try {
      const data = await apiCall('getShareData', queryPayload, 'GET');
      
      // 顯示週數與標題
      const displayWeek = data.week || '目前';
      document.getElementById('shareTitle').innerText = `${data.username || shareUserId} 本周微習慣 (第 ${displayWeek} 週)`;

      if (data.hasSubmitted) {
        document.getElementById('shareContent').innerText = data.habit || '(內容空白)';
        if (data.weeklyProgress && data.weeklyProgress.trim() !== '') {
          document.getElementById('progressText').innerText = data.weeklyProgress;
          document.getElementById('shareWeeklyProgress').style.display = 'block';
        } else {
          document.getElementById('shareWeeklyProgress').style.display = 'none';
        }
        document.getElementById('loginAndRecordForm').style.display = 'none';
      } else {
        document.getElementById('shareContent').innerHTML = '<span style="color:#999;">(尚未提交本週微習慣)</span>';
        document.getElementById('loginAndRecordForm').style.display = 'block';
        document.getElementById('loginUserId').value = shareUserId;
        document.getElementById('shareWeeklyProgress').style.display = 'none';
      }
    } catch (err) {
      document.getElementById('shareContent').innerText = '載入失敗，請稍後再試或聯絡管理員';
    }
  }
}

async function loginFromShare() {
  const userId = document.getElementById('loginUserId').value.trim();
  const password = document.getElementById('loginPassword').value;
  if (!userId || !password) {
    document.getElementById('loginError').innerText = '請輸入 User ID 和 Password';
    return;
  }

  try {
    const res = await apiCall('login', { userId, password });
    if (res.success) {
      if (userId !== shareUserId) {
        document.getElementById('loginError').innerText = '請使用自己的 User ID 登入';
        return;
      }
      shareUserTitle = res.title || '';
      shareEditableTitle = res.editableIdentity || false;
      
      document.getElementById('loginAndRecordForm').querySelector('h3').style.display = 'none';
      document.getElementById('loginUserId').style.display = 'none';
      document.getElementById('loginPassword').style.display = 'none';
      document.getElementById('loginError').innerText = '';
      document.querySelector('button[onclick="loginFromShare()"]').style.display = 'none';

      loadUserDataForShare(userId);
    } else {
      document.getElementById('loginError').innerText = '登入失敗，請檢查 User ID 或 Password';
    }
  } catch (err) {
    document.getElementById('loginError').innerText = '連線失敗';
  }
}

async function loadUserDataForShare(userId) {
  try {
    const data = await apiCall('getUserData', { userId: userId }, 'GET');
    shareUserData = data;
    document.getElementById('currentWeekShare').innerText = data.currentWeek;
    document.getElementById('currentHabitShare').value = data.currentHabit || '(首次無上週記錄)';
    document.getElementById('identityShare').value = data.identity || '';
    document.getElementById('weeklyProgressShare').value = data.weeklyProgress || '';
    document.getElementById('userTitleInputShare').value = shareUserTitle;
    document.getElementById('userTitleInputShare').disabled = !shareEditableTitle;
    toggleChangeShare(false);
    document.getElementById('recordingForm').style.display = 'block';
  } catch (err) {
    alert('獲取使用者資料失敗');
  }
}

function toggleChangeShare(yes) {
  document.getElementById('changeYesShare').style.background = yes ? '#4CAF50' : '';
  document.getElementById('changeNoShare').style.background = yes ? '' : '#ccc';
  document.getElementById('newHabitDivShare').style.display = yes ? 'block' : 'none';
  if (yes && !document.getElementById('newHabitShare').value) {
    document.getElementById('newHabitShare').value = shareUserData ? shareUserData.prefillNewHabit : '';
  }
}

async function saveFromShare() {
  const useNewHabit = document.getElementById('changeYesShare').style.background === 'rgb(76, 175, 80)';
  const newHabit = useNewHabit ? document.getElementById('newHabitShare').value.trim() : null;
  const identity = document.getElementById('identityShare').value.trim();
  const weeklyProgress = document.getElementById('weeklyProgressShare').value.trim();
  const userTitle = shareEditableTitle ? document.getElementById('userTitleInputShare').value.trim() : undefined;

  try {
    await apiCall('saveData', {
      userId: shareUserId,
      week: shareUserData.currentWeek,
      habit: shareUserData.currentHabit,
      newHabit: newHabit,
      newIdentity: identity,
      newTitle: userTitle,
      weeklyProgress: weeklyProgress
    });

    alert('儲存成功！感謝提交本週微習慣');
    document.getElementById('recordingForm').style.display = 'none';
    document.getElementById('shareContent').innerHTML = '<div style="font-size:1.5em; color:#4CAF50;">本週記錄已成功提交！</div>';
  } catch (err) {
    alert('提交失敗，請重試');
  }
}

// 頁面初始化
window.addEventListener('DOMContentLoaded', () => {
  checkShareMode();
});
