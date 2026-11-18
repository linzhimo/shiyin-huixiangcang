/**
 * 页面渲染。所有函数返回 HTML 字符串，事件由 app.js 统一代理。
 */
import {
  COVERS,
  LIMITS,
  listCapsules,
  computeStats,
  getUser,
  getSettings,
  capsuleDetail,
  getCapsuleContent,
  listEchoes,
  matchEchoes
} from './store.js'
import {
  icon,
  escapeHtml,
  formatDate,
  formatDateCn,
  formatDuration,
  countdownText,
  greeting,
  avatarChar,
  progressPercent,
  pluralDays,
  todayInput,
  oneYearLaterInput,
  tenYearsLaterInput
} from './ui.js'

function topbar(title, { back = true, right = '' } = {}) {
  return (
    '<header class="topbar">' +
    (back
      ? '<button class="icon-btn" data-action="back" aria-label="返回">' + icon('back', 22) + '</button>'
      : '<span class="topbar-spacer"></span>') +
    '<h1 class="topbar-title">' +
    escapeHtml(title) +
    '</h1>' +
    (right || '<span class="topbar-spacer"></span>') +
    '</header>'
  )
}

function capsuleCard(item, nowMs) {
  const tone = item.isDraft ? 'draft' : item.locked ? 'locked' : 'unlocked'
  const stateText = item.isDraft ? '草稿' : item.locked ? '未解锁' : '已解锁'
  const stateIcon = item.isDraft ? 'edit' : item.locked ? 'lock' : 'play'
  let sub = ''
  let foot = ''
  let progress = 0

  if (item.isDraft) {
    sub = '封面与标题待补充'
    foot = '草稿 · 继续编辑'
  } else if (item.locked) {
    sub = formatDate(item.unlockAt, true) + ' 解锁'
    foot = '还有 ' + Math.max(1, Math.ceil((item.unlockAt - nowMs) / 86400000)) + ' 天'
    progress = progressPercent(item.createdAt, item.unlockAt, nowMs)
  } else {
    sub = '封存于 ' + formatDate(item.createdAt)
    foot = '已于 ' + Math.max(1, Math.floor((nowMs - item.unlockAt) / 86400000)) + ' 天前解锁'
    progress = 100
  }

  return (
    '<button class="capsule-card tone-' +
    tone +
    '" data-action="open-capsule" data-id="' +
    escapeHtml(item.id) +
    '" data-tone="' +
    tone +
    '">' +
    (item.coverImage ? '<img class="card-cover" src="' + item.coverImage + '" alt="">' : '') +
    '<span class="card-wash"></span>' +
    '<span class="card-state">' +
    icon(stateIcon, 13) +
    stateText +
    '</span>' +
    '<span class="card-body">' +
    '<span class="card-title">' +
    escapeHtml(item.title) +
    '</span>' +
    '<span class="card-sub">' +
    escapeHtml(sub) +
    '</span>' +
    '<span class="card-progress"><span style="width:' +
    progress +
    '%"></span></span>' +
    '<span class="card-foot">' +
    escapeHtml(foot) +
    '</span>' +
    '</span>' +
    '</button>'
  )
}

function echoCard(echo, index, { compact = false } = {}) {
  const meta =
    '解锁于 ' +
    formatDate(echo.sourceUnlockAt) +
    ' · 来自' +
    (echo.region || '远方')
  return (
    '<article class="echo-card' +
    (compact ? ' compact' : '') +
    '">' +
    '<div class="echo-head">' +
    '<div class="echo-avatar tone-' +
    (index % 3) +
    '">' +
    avatarChar(echo.alias) +
    '</div>' +
    '<div class="echo-who"><b>' +
    escapeHtml(echo.alias) +
    '</b><span>' +
    escapeHtml(meta) +
    '</span></div>' +
    '<button class="icon-btn heart ' +
    (echo.favorite ? 'on' : '') +
    '" data-action="favorite-echo" data-id="' +
    escapeHtml(echo.id) +
    '" aria-label="收藏回声" aria-pressed="' +
    (echo.favorite ? 'true' : 'false') +
    '">' +
    icon('heart', 18) +
    '</button>' +
    '</div>' +
    (echo.excerpt ? '<p class="echo-text">' + escapeHtml(echo.excerpt) + '</p>' : '') +
    (echo.hasAudio
      ? '<button class="echo-audio" data-action="play-echo" data-id="' +
        escapeHtml(echo.id) +
        '">' +
        icon('play', 13) +
        '<span class="wave-bars" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span>' +
        '<span>' +
        formatDuration(echo.audioDuration) +
        '</span></button>'
      : '') +
    '<div class="echo-foot"><button class="link-btn muted" data-action="report-echo" data-id="' +
    escapeHtml(echo.id) +
    '">举报</button></div>' +
    '</article>'
  )
}

/* ---------------- 首页 ---------------- */

export function renderHome(state) {
  const caps = listCapsules()
  const stats = computeStats()
  const user = getUser()
  const nowMs = Date.now()
  const locked = caps.filter((item) => item.locked).length
  const unlocked = caps.filter((item) => !item.isDraft && !item.locked).length
  const visible =
    state.filter === 'locked'
      ? caps.filter((item) => item.locked)
      : state.filter === 'unlocked'
        ? caps.filter((item) => !item.isDraft && !item.locked)
        : caps

  return (
    '<div class="page home-page">' +
    '<header class="home-hero">' +
    '<div class="hero-copy">' +
    '<p class="eyebrow">TIME ECHO · 时音回响仓</p>' +
    '<h1 class="greeting">' +
    greeting() +
    '，' +
    escapeHtml(user.nickname || '时光旅人') +
    '</h1>' +
    '<p class="muted">' +
    stats.sealed +
    ' 颗胶囊正在时光里酝酿</p>' +
    '</div>' +
    '<div class="avatar">' +
    avatarChar(user.nickname) +
    '</div>' +
    '</header>' +
    '<div class="chips" role="tablist" aria-label="胶囊筛选">' +
    '<button class="chip ' +
    (state.filter === 'all' ? 'active' : '') +
    '" data-action="filter" data-filter="all">全部</button>' +
    '<button class="chip ' +
    (state.filter === 'locked' ? 'active' : '') +
    '" data-action="filter" data-filter="locked">未解锁 ' +
    locked +
    '</button>' +
    '<button class="chip ' +
    (state.filter === 'unlocked' ? 'active' : '') +
    '" data-action="filter" data-filter="unlocked">已解锁 ' +
    unlocked +
    '</button>' +
    '</div>' +
    (visible.length
      ? '<div class="capsule-grid">' + visible.map((item) => capsuleCard(item, nowMs)).join('') + '</div>'
      : '<div class="empty-state">' +
        '<div class="empty-mark">' +
        icon('sparkle', 34) +
        '</div>' +
        '<h2>时光仓还是空的</h2>' +
        '<p>封存第一段时光，让未来的自己收到。</p>' +
        '<button class="btn btn-ghost" data-action="load-demo">载入演示胶囊</button>' +
        '</div>') +
    '<div class="fab-wrap"><button class="btn btn-primary fab" data-action="create">' +
    icon('plus', 18) +
    '封存一段时光</button></div>' +
    '</div>'
  )
}

/* ---------------- 创建 ---------------- */

function audioChip(form) {
  return (
    '<div class="audio-chip">' +
    '<button class="play-btn" data-action="toggle-create-audio" aria-label="试听录音">' +
    icon('play', 16) +
    '</button>' +
    '<span class="wave-bars" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></span>' +
    '<span class="audio-duration">' +
    formatDuration(form.audioDuration) +
    '</span>' +
    '<button class="icon-btn small" data-action="remove-audio" aria-label="删除录音">' +
    icon('close', 14) +
    '</button>' +
    '</div>'
  )
}

export function renderCreate(state) {
  const form = state.create
  const isEdit = !!form.draftId
  const canAddImage = form.images.length < LIMITS.MAX_IMAGES

  return (
    '<div class="page create-page">' +
    topbar(isEdit ? '编辑草稿' : '封存一段时光', {
      right: '<button class="text-btn" data-action="save-draft">存为草稿</button>'
    }) +
    (state.draftBanner
      ? '<div class="draft-banner">' +
        '<div><b>发现未写完的草稿</b><span>上次编辑的内容还没有封存。</span></div>' +
        '<div class="draft-banner-actions">' +
        '<button class="text-btn" data-action="restore-draft">继续</button>' +
        '<button class="text-btn muted" data-action="dismiss-draft">忽略</button>' +
        '</div></div>'
      : '') +
    '<div class="segmented" role="tablist" aria-label="收件对象">' +
    '<button class="' +
    (form.mode === 'self' ? 'active' : '') +
    '" data-action="set-mode" data-mode="self">给未来的自己</button>' +
    '<button class="' +
    (form.mode === 'anonymous' ? 'active' : '') +
    '" data-action="set-mode" data-mode="anonymous">匿名投递</button>' +
    '</div>' +
    (form.mode === 'anonymous'
      ? '<p class="mode-hint">' + icon('sparkle', 14) + '封存时生成随机昵称与地区，解锁时进入回声池。</p>'
      : '') +
    '<section class="form-section">' +
    '<div class="section-label">封面与标题</div>' +
    '<div class="cover-row">' +
    '<button class="cover-preview" data-action="pick-cover" style="background:' +
    form.coverColor +
    '" aria-label="选择封面图">' +
    (form.coverImage
      ? '<img src="' + form.coverImage + '" alt="">'
      : '<span class="cover-placeholder">' + icon('image', 24) + '<span>选择封面</span></span>') +
    '</button>' +
    '<div class="cover-side">' +
    '<input class="input title-input" data-field="title" maxlength="40" placeholder="给这颗胶囊起个名字" value="' +
    escapeHtml(form.title) +
    '" aria-label="胶囊标题">' +
    '<div class="swatches" aria-label="信纸颜色">' +
    COVERS.map(
      (color) =>
        '<button class="swatch ' +
        (color === form.coverColor ? 'active' : '') +
        '" style="background:' +
        color +
        '" data-action="set-cover" data-color="' +
        color +
        '" aria-label="封面颜色 ' +
        color +
        '"></button>'
    ).join('') +
    '</div>' +
    (form.coverImage
      ? '<button class="link-btn muted" data-action="remove-cover">移除封面图</button>'
      : '') +
    '</div>' +
    '</div>' +
    '<input type="file" accept="image/*" data-file="cover" hidden>' +
    '</section>' +
    '<section class="form-section">' +
    '<div class="section-label">内容</div>' +
    '<div class="text-wrap">' +
    '<textarea class="textarea" data-field="text" maxlength="' +
    LIMITS.MAX_TEXT +
    '" placeholder="此刻的心情、想对未来自己说的话……" aria-label="胶囊内容">' +
    escapeHtml(form.text) +
    '</textarea>' +
    '<span class="counter">' +
    form.text.length +
    ' / ' +
    LIMITS.MAX_TEXT +
    '</span>' +
    '</div>' +
    '<div class="thumb-grid">' +
    form.images
      .map(
        (src, index) =>
          '<div class="thumb"><img src="' +
          src +
          '" alt="照片 ' +
          (index + 1) +
          '"><button class="thumb-remove" data-action="remove-image" data-index="' +
          index +
          '" aria-label="删除照片">' +
          icon('close', 13) +
          '</button></div>'
      )
      .join('') +
    (canAddImage
      ? '<button class="thumb add" data-action="pick-images">' +
        icon('plus', 20) +
        '<span>照片</span></button>'
      : '') +
    '</div>' +
    '<input type="file" accept="image/*" multiple data-file="images" hidden>' +
    '<div class="audio-box">' +
    (state.recording
      ? '<div class="recording-row"><span class="recording-dot"></span><b>正在录音</b><span class="recording-time">' +
        formatDuration(state.recordSeconds) +
        '</span><button class="btn btn-ghost small" data-action="record-toggle">停止</button></div>'
      : form.audioId
        ? audioChip(form)
        : '<button class="record-btn" data-action="record-toggle">' +
          icon('mic', 18) +
          '<span>点击开始录音，最长 5 分钟</span></button>') +
    '</div>' +
    '</section>' +
    '<section class="form-section">' +
    '<div class="section-label">解锁时间</div>' +
    '<div class="datetime-row">' +
    '<label class="field"><span>日期</span><input type="date" data-field="date" value="' +
    form.date +
    '" min="' +
    todayInput() +
    '" max="' +
    tenYearsLaterInput() +
    '"></label>' +
    '<label class="field"><span>时刻</span><input type="time" data-field="time" value="' +
    form.time +
    '"></label>' +
    '</div>' +
    '<p class="hint">解锁前不会展示正文、照片与语音。本演示版以本机时间为准，最短 ' +
    LIMITS.MIN_UNLOCK_MINUTES +
    ' 分钟。</p>' +
    '</section>' +
    '<section class="form-section row-between">' +
    '<div class="toggle-copy"><div class="section-label">接收同期回声</div><p class="hint">解锁时会收到 1–2 条同期陌生人的心声。</p></div>' +
    '<label class="switch"><input type="checkbox" data-field="receiveEcho" ' +
    (form.receiveEcho ? 'checked' : '') +
    '><span></span></label>' +
    '</section>' +
    '<div class="form-actions">' +
    '<button class="btn btn-ghost" data-action="save-draft">保存草稿</button>' +
    '<button class="btn btn-primary" data-action="submit-capsule">封存并上锁</button>' +
    '</div>' +
    '</div>'
  )
}

/* ---------------- 详情（封存中） ---------------- */

export function renderDetail(state) {
  const d = capsuleDetail(state.route.id)
  const parts = []
  if (d.hasAudio) parts.push('1 条语音')
  if (d.hasImages) parts.push(d.hasImages + ' 张照片')
  if (d.hasText) parts.push('文字')
  const summary = parts.join(' · ') || '—'
  const progress = progressPercent(d.createdAt, d.unlockAt, d.serverTime)

  return (
    '<div class="page detail-page">' +
    topbar('胶囊详情', {
      right:
        '<button class="icon-btn" data-action="detail-more" aria-label="更多操作">' +
        icon('more', 20) +
        '</button>'
    }) +
    '<section class="detail-hero">' +
    '<div class="capsule-visual locked"><span class="capsule-glow"></span><span class="capsule-body">' +
    icon('lock', 42) +
    '</span><i class="spark s1"></i><i class="spark s2"></i><i class="spark s3"></i></div>' +
    '<h1>时光已封存</h1>' +
    '<p class="countdown" id="countdown">' +
    countdownText(d.unlockAt, d.serverTime) +
    '</p>' +
    '</section>' +
    '<div class="progress-block">' +
    '<div class="progress"><div class="progress-fill" id="progress-fill" style="width:' +
    progress +
    '%"></div></div>' +
    '<div class="progress-labels"><span>' +
    formatDate(d.createdAt, true) +
    ' 封存</span><span>' +
    formatDate(d.unlockAt, true) +
    ' 解锁</span></div>' +
    '</div>' +
    '<div class="info-card">' +
    '<div class="info-row"><span>内容</span><b>' +
    escapeHtml(summary) +
    '</b></div>' +
    '<div class="info-row"><span>收件对象</span><b>' +
    (d.mode === 'anonymous' ? '匿名投递' : '未来的自己') +
    '</b></div>' +
    '<div class="info-row"><span>时光回声</span><b>' +
    (d.receiveEcho ? '已开启' : '未开启') +
    '</b></div>' +
    '<div class="info-row"><span>封存凭证</span><b class="voucher">' +
    escapeHtml(d.voucher || '—') +
    '</b></div>' +
    '</div>' +
    '<div class="detail-actions">' +
    '<button class="btn btn-primary" disabled>未到时间，暂不可打开</button>' +
    '<button class="link-btn center" data-action="show-voucher">查看封存凭证</button>' +
    '<p class="hint center">解锁由本机时间判定，修改系统时间可能影响演示效果。</p>' +
    '</div>' +
    '</div>'
  )
}

/* ---------------- 解锁日 ---------------- */

export function renderUnlock(state) {
  const d = capsuleDetail(state.route.id)
  const content = getCapsuleContent(d.id)
  let echoes = []
  try {
    echoes = matchEchoes(d.id).items
  } catch (err) {
    echoes = []
  }

  return (
    '<div class="page unlock-page">' +
    topbar('解锁日 · ' + formatDate(d.unlockAt), {
      right:
        '<button class="icon-btn" data-action="unlock-more" aria-label="更多操作">' +
        icon('more', 20) +
        '</button>'
    }) +
    '<div class="section-head"><h2>来自过去的你</h2><span class="tag gold">已解锁</span></div>' +
    '<article class="content-card">' +
    (d.hasAudio
      ? '<button class="audio-player" data-action="play-content-audio" data-playing="false">' +
        '<span class="play-circle">' +
        icon('play', 15) +
        '</span><span class="wave-bars" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span><span class="audio-duration">' +
        formatDuration(d.audioDuration) +
        '</span></button>'
      : '') +
    '<h1 class="content-title">' +
    escapeHtml(d.title) +
    '</h1>' +
    (content.text ? '<p class="content-text">' + escapeHtml(content.text) + '</p>' : '') +
    (content.images.length
      ? '<div class="image-grid">' +
        content.images
          .map(
            (src, index) =>
              '<button class="content-img" data-action="preview-image" data-src="' +
              src +
              '" aria-label="查看照片 ' +
              (index + 1) +
              '"><img src="' +
              src +
              '" alt="照片 ' +
              (index + 1) +
              '"></button>'
          )
          .join('') +
        '</div>'
      : '') +
    '<div class="content-foot">封存于 ' +
    formatDate(d.createdAt, true) +
    ' · 此刻已开启</div>' +
    '</article>' +
    '<div class="section-head"><h2>同期的回声</h2>' +
    (echoes.length ? '<span class="muted">' + echoes.length + ' 条</span>' : '') +
    '</div>' +
    (echoes.length
      ? '<div class="echo-list">' + echoes.map((echo, index) => echoCard(echo, index)).join('') + '</div>'
      : '<div class="echo-empty">' +
        icon('echo', 24) +
        '<p>同期还没有其他胶囊，过些时候再来看看。</p></div>') +
    (echoes.length
      ? '<p class="echo-note">回声仅展示匿名昵称与地区，不暴露真实身份。</p>'
      : '') +
    '<div class="unlock-actions">' +
    '<button class="btn btn-ghost" data-action="favorite-first" ' +
    (echoes.length ? '' : 'disabled') +
    '>收藏回声</button>' +
    '<button class="btn btn-primary" data-action="create">再次封存此刻</button>' +
    '</div>' +
    '<button class="link-btn center" data-action="unlock-more">更多操作 · 封存凭证</button>' +
    '</div>'
  )
}

/* ---------------- 回声广场 ---------------- */

export function renderEcho(state) {
  const favorite = state.echoFilter === 'fav'
  const echoes = listEchoes(favorite).items
  return (
    '<div class="page echo-page">' +
    '<header class="simple-head"><h1>回声</h1><p class="muted">来自同期陌生人的心声</p></header>' +
    '<div class="segmented echo-tabs" role="tablist">' +
    '<button class="' +
    (!favorite ? 'active' : '') +
    '" data-action="echo-filter" data-filter="all">收到的回声</button>' +
    '<button class="' +
    (favorite ? 'active' : '') +
    '" data-action="echo-filter" data-filter="fav">收藏</button>' +
    '</div>' +
    (echoes.length
      ? '<div class="echo-list">' + echoes.map((echo, index) => echoCard(echo, index)).join('') + '</div>'
      : '<div class="empty-state echo-empty-state">' +
        '<div class="empty-mark">' +
        icon('echo', 30) +
        '</div>' +
        '<h2>' +
        (favorite ? '还没有收藏的回声' : '还没有收到回声') +
        '</h2>' +
        '<p>' +
        (favorite ? '在解锁日点亮一颗心，它会留在这里。' : '等一颗胶囊解锁后，同期的心声会送到这里。') +
        '</p></div>') +
    '<p class="echo-note">回声来自同期解锁的匿名胶囊，仅展示昵称与地区。</p>' +
    '</div>'
  )
}

/* ---------------- 我的 ---------------- */

function menuRow(key, label, iconName, tone) {
  return (
    '<button class="menu-row" data-action="menu" data-key="' +
    key +
    '">' +
    '<span class="menu-icon ' +
    tone +
    '">' +
    icon(iconName, 18) +
    '</span>' +
    '<span class="menu-label">' +
    escapeHtml(label) +
    '</span>' +
    icon('arrow', 16, 'menu-arrow') +
    '</button>'
  )
}

export function renderMine(state) {
  const user = getUser()
  const stats = computeStats()
  const total = stats.sealed + stats.unlocked
  return (
    '<div class="page mine-page">' +
    '<header class="simple-head"><h1>我的</h1><p class="muted">把时光收好，也把自己收好</p></header>' +
    '<section class="profile-card">' +
    '<div class="avatar big">' +
    avatarChar(user.nickname) +
    '</div>' +
    '<div class="profile-copy">' +
    '<h2>' +
    escapeHtml(user.nickname || '时光旅人') +
    '</h2>' +
    '<p>已封存 ' +
    total +
    ' 颗 · 解锁 ' +
    stats.unlocked +
    ' 颗</p>' +
    '<p class="muted">' +
    (stats.nextUnlockAt
      ? '下一个解锁日：' + formatDate(stats.nextUnlockAt)
      : '还没有在酝酿的胶囊') +
    '</p>' +
    '</div>' +
    '<button class="icon-btn" data-action="edit-nickname" aria-label="修改昵称">' +
    icon('edit', 18) +
    '</button>' +
    '</section>' +
    '<div class="stat-grid">' +
    '<div class="stat"><b>' +
    stats.sealed +
    '</b><span>正在酝酿</span></div>' +
    '<div class="stat"><b>' +
    stats.unlocked +
    '</b><span>已解锁</span></div>' +
    '<div class="stat"><b>' +
    stats.echoes +
    '</b><span>收到回声</span></div>' +
    '</div>' +
    '<div class="menu-card">' +
    menuRow('capsules', '我的时光胶囊', 'home', 'warm') +
    menuRow('letter', '电子信纸', 'letter', 'lav') +
    menuRow('member', '时光会员', 'crown', 'warm') +
    menuRow('privacy', '隐私与匿名设置', 'settings', 'lav') +
    menuRow('help', '帮助与反馈', 'help', 'warm') +
    '</div>' +
    '<section class="member-banner">' +
    '<div><b>时光会员</b><p>更多胶囊 · 高清原图 · 专属信纸</p></div>' +
    '<button class="pill-btn" data-action="menu" data-key="member">了解</button>' +
    '</section>' +
    '<p class="version-note">时音回响仓 · 网页演示版<br>数据保存在本机浏览器，不会上传</p>' +
    '</div>'
  )
}

/* ---------------- 设置 ---------------- */

export function renderSettings(state) {
  const settings = getSettings()
  return (
    '<div class="page settings-page">' +
    topbar('隐私与匿名设置') +
    '<section class="setting-card">' +
    '<div class="setting-row"><div><b>隐藏地区</b><p>匿名投递时不显示地区，统一记为「远方」。</p></div>' +
    '<label class="switch"><input type="checkbox" data-setting="hideRegion" ' +
    (settings.hideRegion ? 'checked' : '') +
    '><span></span></label></div>' +
    '<div class="setting-row"><div><b>解锁提醒</b><p>开启后，解锁前会尝试发送浏览器通知；需要你授权。</p></div>' +
    '<label class="switch"><input type="checkbox" data-setting="unlockRemind" ' +
    (settings.unlockRemind ? 'checked' : '') +
    '><span></span></label></div>' +
    '</section>' +
    '<div class="menu-card">' +
    '<button class="menu-row" data-action="clear-draft"><span class="menu-icon warm">' +
    icon('trash', 18) +
    '</span><span class="menu-label">清除本地草稿</span>' +
    icon('arrow', 16, 'menu-arrow') +
    '</button>' +
    '<button class="menu-row danger" data-action="load-demo"><span class="menu-icon lav">' +
    icon('sparkle', 18) +
    '</span><span class="menu-label">载入演示数据</span>' +
    icon('arrow', 16, 'menu-arrow') +
    '</button>' +
    '<button class="menu-row danger" data-action="clear-data"><span class="menu-icon danger">' +
    icon('trash', 18) +
    '</span><span class="menu-label">清空全部数据</span>' +
    icon('arrow', 16, 'menu-arrow') +
    '</button>' +
    '</div>' +
    '<section class="about-card">' +
    '<b>关于时音回响仓</b>' +
    '<p>这是一个网页演示版：胶囊、倒计时、解锁与回声都在浏览器本地完成，数据不会上传到服务器。清除浏览器数据会一并清除胶囊与语音。</p>' +
    '<p class="muted">正式版可根据需求接入云端数据库与对象存储。</p>' +
    '</section>' +
    '</div>'
  )
}

export function renderNotFound() {
  return (
    '<div class="page not-found">' +
    '<div class="empty-mark">' +
    icon('sparkle', 34) +
    '</div>' +
    '<h1>这段时光走丢了</h1>' +
    '<p>页面不存在，或胶囊已被删除。</p>' +
    '<button class="btn btn-primary" data-action="back-home">回到时光仓</button>' +
    '</div>'
  )
}
