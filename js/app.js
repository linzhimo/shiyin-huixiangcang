/**
 * 时音回响仓 · 网页演示版
 * 单页应用：hash 路由 + localStorage + IndexedDB。
 */
import {
  COVERS,
  LIMITS,
  listCapsules,
  computeStats,
  getUser,
  saveUser,
  saveSettings,
  capsuleDetail,
  getCapsule,
  getCapsuleContent,
  getDraftContent,
  saveDraft,
  sealCapsule,
  deleteCapsule,
  listEchoes,
  matchEchoes,
  favoriteEcho,
  reportEcho,
  seedDemo,
  clearAllData
} from './store.js'
import {
  renderHome,
  renderCreate,
  renderDetail,
  renderUnlock,
  renderEcho,
  renderMine,
  renderSettings,
  renderNotFound
} from './views.js'
import {
  icon,
  toast,
  confirmAction,
  showModal,
  showSheet,
  showPrompt,
  compressImage,
  renderTabbar,
  formatDate,
  formatDuration,
  countdownText,
  progressPercent,
  dateInputValue,
  timeInputValue,
  oneYearLaterInput
} from './ui.js'
import {
  Recorder,
  isRecordingSupported,
  saveAudioBlob,
  getAudioUrl,
  deleteAudioBlob,
  clearAllAudio
} from './audio.js'

const LOCAL_DRAFT_KEY = 'shiyin_web_local_draft_v1'
const REPORT_REASONS = ['内容令人不适', '广告或骚扰', '侵犯隐私', '其他']

const state = {
  route: { name: 'home', id: '' },
  filter: 'all',
  echoFilter: 'all',
  create: null,
  createKey: null,
  draftBanner: null,
  recording: false,
  recordSeconds: 0,
  playingContent: false,
  playingCreate: false,
  playingEchoId: '',
  audioEl: null,
  audioUrl: '',
  recorder: null,
  countdownTimer: null,
  localDraftTimer: null
}

/* ---------------- 启动 ---------------- */

function boot() {
  const params = new URLSearchParams(window.location.search)
  if (params.get('demo') === '1') {
    try {
      seedDemo()
    } catch (err) {
      console.warn(err)
    }
  }

  window.addEventListener('hashchange', () => render())
  document.addEventListener('click', handleClick)
  document.addEventListener('input', handleInput)
  document.addEventListener('change', handleChange)
  window.addEventListener('beforeunload', () => {
    if (state.create) persistLocalDraft()
  })

  render()
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot)
} else {
  boot()
}

/* ---------------- 路由 ---------------- */

function parseRoute() {
  const raw = (window.location.hash || '#/').replace(/^#/, '') || '/'
  const parts = raw.split('/').filter(Boolean)
  if (!parts.length) return { name: 'home', id: '' }
  const name = parts[0]
  if (name === 'create' || name === 'detail' || name === 'unlock') {
    return { name, id: parts[1] || '' }
  }
  if (name === 'echo' || name === 'mine' || name === 'settings') {
    return { name, id: '' }
  }
  return { name: 'notfound', id: '' }
}

function navigate(path, { replace = false } = {}) {
  const target = '#' + path
  if (window.location.hash === target) {
    render()
    return
  }
  if (replace) {
    window.history.replaceState(null, '', target)
    render()
  } else {
    window.location.hash = target
  }
}

function goBack() {
  if (state.route.name === 'create') persistLocalDraft()
  if (window.history.length > 1) window.history.back()
  else navigate('/')
}

function render({ preserveScroll = false } = {}) {
  stopAudio()
  clearInterval(state.countdownTimer)
  state.countdownTimer = null

  const route = parseRoute()
  const previousKey = state.route.name + ':' + (state.route.id || '')
  const nextKey = route.name + ':' + (route.id || '')
  const sameRoute = previousKey === nextKey

  if (state.route.name === 'create' && route.name !== 'create') {
    persistLocalDraft()
    if (state.recorder) {
      state.recorder.cancel()
      state.recorder = null
      state.recording = false
    }
  }

  state.route = route

  /* 状态校验与重定向 */
  let redirect = ''
  if (route.name === 'detail' || route.name === 'unlock' || (route.name === 'create' && route.id)) {
    if (!route.id) {
      redirect = '/404'
    } else {
      try {
        const capsule = getCapsule(route.id)
        if (route.name === 'detail') {
          if (capsule.isDraft) redirect = '/create/' + route.id
          else if (!capsuleDetail(route.id).locked) redirect = '/unlock/' + route.id
        } else if (route.name === 'unlock') {
          const detail = capsuleDetail(route.id)
          if (detail.isDraft || detail.locked) {
            toast('胶囊还未解锁')
            redirect = '/'
          }
        } else if (route.name === 'create' && !capsule.isDraft) {
          redirect = capsuleDetail(route.id).locked ? '/detail/' + route.id : '/unlock/' + route.id
        }
      } catch (err) {
        redirect = '/404'
      }
    }
  }
  if (redirect) {
    navigate(redirect, { replace: true })
    return
  }

  /* 创建页表单初始化 */
  if (route.name === 'create') {
    const key = 'create:' + (route.id || 'new')
    if (state.createKey !== key) {
      try {
        initCreate(route.id)
        state.createKey = key
      } catch (err) {
        state.create = null
        state.createKey = null
        renderNotFoundView()
        return
      }
    }
  } else if (route.name !== 'create') {
    state.createKey = null
    state.create = null
    state.draftBanner = null
  }

  let html = ''
  let activeTab = ''
  let title = '时音回响仓'
  try {
    if (route.name === 'home') {
      html = renderHome(state)
      activeTab = 'home'
    } else if (route.name === 'create') {
      html = renderCreate(state)
      title = '封存一段时光 · 时音回响仓'
    } else if (route.name === 'detail') {
      html = renderDetail(state)
      title = '胶囊详情 · 时音回响仓'
    } else if (route.name === 'unlock') {
      html = renderUnlock(state)
      title = '解锁日 · 时音回响仓'
    } else if (route.name === 'echo') {
      html = renderEcho(state)
      activeTab = 'echo'
      title = '回声 · 时音回响仓'
    } else if (route.name === 'mine') {
      html = renderMine(state)
      activeTab = 'mine'
      title = '我的 · 时音回响仓'
    } else if (route.name === 'settings') {
      html = renderSettings(state)
      title = '隐私与匿名设置 · 时音回响仓'
    } else {
      html = renderNotFound()
      title = '页面不存在 · 时音回响仓'
    }
  } catch (err) {
    console.error('[render]', err)
    html = renderNotFound()
  }

  const app = document.getElementById('app')
  app.innerHTML = html
  app.classList.toggle('with-tabbar', !!activeTab)
  app.classList.toggle('with-fab', route.name === 'home')
  app.classList.toggle('with-form-actions', route.name === 'create')

  const tabbar = document.getElementById('tabbar')
  if (activeTab) {
    tabbar.hidden = false
    tabbar.innerHTML = renderTabbar(activeTab)
  } else {
    tabbar.hidden = true
    tabbar.innerHTML = ''
  }

  document.title = title
  if (!preserveScroll && !sameRoute) window.scrollTo(0, 0)

  if (route.name === 'detail') startCountdown(route.id)
}

function renderNotFoundView() {
  const app = document.getElementById('app')
  app.innerHTML = renderNotFound()
  app.classList.remove('with-tabbar', 'with-fab', 'with-form-actions')
  const tabbar = document.getElementById('tabbar')
  tabbar.hidden = true
  tabbar.innerHTML = ''
}

function startCountdown(id) {
  clearInterval(state.countdownTimer)
  state.countdownTimer = setInterval(() => {
    let detail
    try {
      detail = capsuleDetail(id)
    } catch (err) {
      clearInterval(state.countdownTimer)
      return
    }
    const nowMs = Date.now()
    if (detail.unlockAt <= nowMs) {
      clearInterval(state.countdownTimer)
      state.countdownTimer = null
      toast('胶囊已解锁')
      navigate('/unlock/' + id, { replace: true })
      return
    }
    const countEl = document.getElementById('countdown')
    if (countEl) countEl.textContent = countdownText(detail.unlockAt, nowMs)
    const fill = document.getElementById('progress-fill')
    if (fill) fill.style.width = progressPercent(detail.createdAt, detail.unlockAt, nowMs) + '%'
  }, 1000)
}

/* ---------------- 创建页状态 ---------------- */

function defaultCreateForm() {
  return {
    draftId: '',
    title: '',
    text: '',
    mode: 'self',
    coverColor: COVERS[0],
    coverImage: '',
    images: [],
    audioId: '',
    audioDuration: 0,
    date: oneYearLaterInput(),
    time: '20:00',
    receiveEcho: true
  }
}

function initCreate(id) {
  const form = defaultCreateForm()
  if (id) {
    const capsule = getCapsule(id)
    if (!capsule.isDraft) throw new Error('不是草稿')
    const draft = getDraftContent(id)
    const today = dateInputValue(Date.now())
    const date = draft.unlockAt ? dateInputValue(draft.unlockAt) : oneYearLaterInput()
    Object.assign(form, {
      draftId: id,
      title: draft.title || '',
      text: draft.text || '',
      mode: draft.mode === 'anonymous' ? 'anonymous' : 'self',
      coverColor: draft.coverColor || COVERS[0],
      coverImage: draft.coverImage || '',
      images: Array.isArray(draft.images) ? draft.images.slice(0, LIMITS.MAX_IMAGES) : [],
      audioId: draft.audioId || '',
      audioDuration: draft.audioDuration || 0,
      date: date < today ? oneYearLaterInput() : date,
      time: draft.unlockAt ? timeInputValue(draft.unlockAt) : '20:00',
      receiveEcho: draft.receiveEcho !== false
    })
    state.draftBanner = null
  } else {
    const draft = readLocalDraft()
    state.draftBanner =
      draft && (draft.title || draft.text || (draft.images && draft.images.length)) ? draft : null
  }
  state.create = form
  state.recording = false
  state.recordSeconds = 0
}

function computeUnlockAt() {
  if (!state.create) return 0
  const date = state.create.date
  const time = state.create.time
  if (!date || !time) return 0
  const [y, m, d] = date.split('-').map(Number)
  const [hh, mm] = time.split(':').map(Number)
  if (!y || !m || !d || isNaN(hh) || isNaN(mm)) return 0
  return new Date(y, m - 1, d, hh, mm, 0, 0).getTime()
}

/* ---------------- 本地草稿 ---------------- */

function readLocalDraft() {
  try {
    const raw = localStorage.getItem(LOCAL_DRAFT_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (!data || !data.savedAt || Date.now() - data.savedAt > 30 * 86400000) return null
    return data
  } catch (err) {
    return null
  }
}

function persistLocalDraft() {
  if (!state.create) return
  const f = state.create
  if (!f.title.trim() && !f.text.trim() && !f.images.length && !f.audioId) return
  try {
    localStorage.setItem(
      LOCAL_DRAFT_KEY,
      JSON.stringify({
        title: f.title,
        text: f.text,
        mode: f.mode,
        coverColor: f.coverColor,
        coverImage: f.coverImage,
        images: f.images,
        audioId: f.audioId,
        audioDuration: f.audioDuration,
        date: f.date,
        time: f.time,
        receiveEcho: f.receiveEcho,
        savedAt: Date.now()
      })
    )
  } catch (err) {
    console.warn('[draft] 本地草稿保存失败', err)
  }
}

function scheduleLocalDraft() {
  clearTimeout(state.localDraftTimer)
  state.localDraftTimer = setTimeout(persistLocalDraft, 800)
}

function clearLocalDraft() {
  clearTimeout(state.localDraftTimer)
  state.localDraftTimer = null
  try {
    localStorage.removeItem(LOCAL_DRAFT_KEY)
  } catch (err) {
    console.warn(err)
  }
}

function restoreLocalDraft() {
  const draft = state.draftBanner
  if (!draft) return
  state.create = Object.assign(defaultCreateForm(), {
    draftId: '',
    title: draft.title || '',
    text: draft.text || '',
    mode: draft.mode === 'anonymous' ? 'anonymous' : 'self',
    coverColor: draft.coverColor || COVERS[0],
    coverImage: draft.coverImage || '',
    images: Array.isArray(draft.images) ? draft.images.slice(0, LIMITS.MAX_IMAGES) : [],
    audioId: draft.audioId || '',
    audioDuration: draft.audioDuration || 0,
    date: draft.date || oneYearLaterInput(),
    time: draft.time || '20:00',
    receiveEcho: draft.receiveEcho !== false
  })
  state.draftBanner = null
  render({ preserveScroll: true })
}

function dismissLocalDraft() {
  clearLocalDraft()
  state.draftBanner = null
  render({ preserveScroll: true })
}

/* ---------------- 事件：点击 ---------------- */

async function handleClick(event) {
  const target = event.target.closest('[data-action]')
  if (!target) return
  const action = target.dataset.action
  if (target.tagName === 'BUTTON') event.preventDefault()

  switch (action) {
    case 'create':
      navigate('/create')
      break
    case 'back':
      goBack()
      break
    case 'back-home':
      navigate('/')
      break
    case 'open-capsule': {
      const id = target.dataset.id
      if (!id) break
      if (target.dataset.tone === 'draft') navigate('/create/' + id)
      else if (target.dataset.tone === 'unlocked') navigate('/unlock/' + id)
      else navigate('/detail/' + id)
      break
    }
    case 'filter':
      state.filter = target.dataset.filter || 'all'
      render({ preserveScroll: true })
      break
    case 'echo-filter':
      state.echoFilter = target.dataset.filter === 'fav' ? 'fav' : 'all'
      render({ preserveScroll: true })
      break
    case 'load-demo':
      await loadDemo()
      break
    case 'menu':
      await handleMenu(target.dataset.key)
      break
    case 'edit-nickname':
      await editNickname()
      break
    case 'detail-more':
    case 'unlock-more':
      await handleMore()
      break
    case 'show-voucher':
      showVoucher()
      break
    case 'delete-capsule':
      await deleteCurrent()
      break
    case 'preview-image':
      if (target.dataset.src) {
        await showModal({
          title: '照片',
          className: 'lightbox',
          body: '<img class="lightbox-img" src="' + target.dataset.src + '" alt="胶囊照片">',
          actions: [{ label: '关闭', value: true, kind: 'primary' }]
        })
      }
      break
    case 'play-content-audio':
      await toggleContentAudio()
      break
    case 'play-echo':
      await toggleEchoAudio(target.dataset.id)
      break
    case 'favorite-echo':
      await toggleFavorite(target)
      break
    case 'report-echo':
      await reportCurrentEcho(target.dataset.id)
      break
    case 'favorite-first':
      await favoriteFirst()
      break
    case 'set-mode':
      if (state.create) {
        state.create.mode = target.dataset.mode === 'anonymous' ? 'anonymous' : 'self'
        render({ preserveScroll: true })
        scheduleLocalDraft()
      }
      break
    case 'set-cover':
      if (state.create) {
        state.create.coverColor = target.dataset.color || COVERS[0]
        state.create.coverImage = ''
        render({ preserveScroll: true })
        scheduleLocalDraft()
      }
      break
    case 'pick-cover':
      document.querySelector('[data-file="cover"]')?.click()
      break
    case 'remove-cover':
      if (state.create) {
        state.create.coverImage = ''
        render({ preserveScroll: true })
        scheduleLocalDraft()
      }
      break
    case 'pick-images':
      document.querySelector('[data-file="images"]')?.click()
      break
    case 'remove-image':
      if (state.create) {
        state.create.images.splice(Number(target.dataset.index), 1)
        render({ preserveScroll: true })
        scheduleLocalDraft()
      }
      break
    case 'record-toggle':
      await toggleRecording()
      break
    case 'remove-audio':
      removeAudio()
      break
    case 'toggle-create-audio':
      await toggleCreateAudio()
      break
    case 'restore-draft':
      restoreLocalDraft()
      break
    case 'dismiss-draft':
      dismissLocalDraft()
      break
    case 'save-draft':
      saveCurrentDraft()
      break
    case 'submit-capsule':
      submitCapsule()
      break
    case 'clear-draft':
      clearLocalDraft()
      toast('已清除本地草稿')
      break
    case 'clear-data':
      await clearData()
      break
    default:
      break
  }
}

/* ---------------- 事件：输入 ---------------- */

function handleInput(event) {
  const target = event.target
  const field = target.dataset ? target.dataset.field : ''
  if (!field || !state.create) return

  if (field === 'title') state.create.title = target.value
  if (field === 'text') {
    state.create.text = target.value
    const wrap = target.closest('.text-wrap')
    const counter = wrap ? wrap.querySelector('.counter') : null
    if (counter) counter.textContent = target.value.length + ' / ' + LIMITS.MAX_TEXT
  }
  if (field === 'date') state.create.date = target.value
  if (field === 'time') state.create.time = target.value
  scheduleLocalDraft()
}

async function handleChange(event) {
  const target = event.target
  if (!target || !target.dataset) return

  if (target.dataset.file) {
    await handleFileInput(target, target.dataset.file)
    return
  }

  if (target.dataset.field === 'receiveEcho' && state.create) {
    state.create.receiveEcho = !!target.checked
    scheduleLocalDraft()
    return
  }

  if (target.dataset.setting) {
    await handleSetting(target.dataset.setting, !!target.checked)
  }
}

async function handleFileInput(input, kind) {
  const files = Array.from(input.files || [])
  if (!files.length) {
    input.value = ''
    return
  }
  if (!state.create) {
    input.value = ''
    return
  }

  try {
    if (kind === 'cover') {
      const dataUrl = await compressImage(files[0], 1000, 0.8)
      state.create.coverImage = dataUrl
      toast('封面已更新')
    } else {
      const remain = LIMITS.MAX_IMAGES - state.create.images.length
      if (remain <= 0) {
        toast('最多放 ' + LIMITS.MAX_IMAGES + ' 张照片')
      } else {
        const selected = files.slice(0, remain)
        if (files.length > remain) toast('最多放 ' + LIMITS.MAX_IMAGES + ' 张照片')
        for (const file of selected) {
          const dataUrl = await compressImage(file)
          state.create.images.push(dataUrl)
        }
        toast('照片已添加')
      }
    }
    render({ preserveScroll: true })
    scheduleLocalDraft()
  } catch (err) {
    toast(err.message || '图片处理失败')
  } finally {
    input.value = ''
  }
}

async function handleSetting(key, value) {
  try {
    saveSettings({ [key]: value })
    if (key === 'unlockRemind' && value && 'Notification' in window) {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') toast('浏览器通知未授权，设置已保存')
    }
  } catch (err) {
    toast(err.message || '设置保存失败')
  }
}

/* ---------------- 录音 ---------------- */

async function toggleRecording() {
  if (!state.create) return
  if (state.recording) {
    if (state.recorder) state.recorder.stop()
    return
  }
  if (!isRecordingSupported()) {
    toast('当前浏览器不支持录音，请换用 Chrome / Edge')
    return
  }

  const recorder = new Recorder({
    maxSeconds: LIMITS.MAX_AUDIO_SECONDS,
    onTick: (seconds) => {
      state.recordSeconds = seconds
      const el = document.querySelector('.recording-time')
      if (el) el.textContent = formatDuration(seconds)
    },
    onStop: async ({ blob, duration }) => {
      state.recording = false
      state.recorder = null
      const id = 'audio_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7)
      try {
        await saveAudioBlob(id, blob, duration)
        if (state.create) {
          state.create.audioId = id
          state.create.audioDuration = duration
        }
        toast('录音完成')
      } catch (err) {
        toast('语音保存失败')
      }
      render({ preserveScroll: true })
      scheduleLocalDraft()
    },
    onError: (err) => {
      state.recording = false
      state.recorder = null
      toast(err.message || '录音失败')
      render({ preserveScroll: true })
    }
  })

  state.recorder = recorder
  try {
    await recorder.start()
    state.recording = true
    state.recordSeconds = 0
    render({ preserveScroll: true })
  } catch (err) {
    state.recording = false
    state.recorder = null
    toast(err.message || '无法开始录音，请检查麦克风权限')
  }
}

function removeAudio() {
  if (!state.create) return
  const id = state.create.audioId
  state.create.audioId = ''
  state.create.audioDuration = 0
  if (id) deleteAudioBlob(id)
  stopAudio()
  render({ preserveScroll: true })
  scheduleLocalDraft()
}

/* ---------------- 音频播放 ---------------- */

function stopAudio() {
  if (state.audioEl) {
    state.audioEl.onended = null
    state.audioEl.onerror = null
    try {
      state.audioEl.pause()
    } catch (err) {}
    state.audioEl = null
  }
  if (state.audioUrl) {
    URL.revokeObjectURL(state.audioUrl)
    state.audioUrl = ''
  }
  state.playingContent = false
  state.playingCreate = false
  state.playingEchoId = ''
  updateContentAudioButton()
  updateCreateAudioButton()
}

function playAudio(url, onEnded) {
  stopAudio()
  const audio = new Audio(url)
  state.audioEl = audio
  state.audioUrl = url
  audio.onended = () => {
    state.audioEl = null
    if (state.audioUrl === url) {
      URL.revokeObjectURL(url)
      state.audioUrl = ''
    }
    if (onEnded) onEnded()
  }
  audio.onerror = () => {
    toast('播放失败')
    if (onEnded) onEnded()
  }
  audio.play().catch(() => toast('播放失败，请再点一次'))
}

function updateContentAudioButton() {
  const btn = document.querySelector('[data-action="play-content-audio"]')
  if (!btn) return
  btn.dataset.playing = state.playingContent ? 'true' : 'false'
  btn.classList.toggle('playing', state.playingContent)
  const circle = btn.querySelector('.play-circle')
  if (circle) circle.innerHTML = icon(state.playingContent ? 'pause' : 'play', 15)
}

function updateCreateAudioButton() {
  const btn = document.querySelector('[data-action="toggle-create-audio"]')
  if (!btn) return
  btn.classList.toggle('playing', state.playingCreate)
  btn.innerHTML = icon(state.playingCreate ? 'pause' : 'play', 16)
}

async function toggleContentAudio() {
  if (state.playingContent) {
    stopAudio()
    return
  }
  const detail = capsuleDetail(state.route.id)
  if (!detail.hasAudio) {
    toast('这颗胶囊没有语音')
    return
  }
  let content
  try {
    content = getCapsuleContent(detail.id)
  } catch (err) {
    toast(err.message)
    return
  }
  if (!content.audioId) {
    toast('这颗胶囊没有语音')
    return
  }
  const url = await getAudioUrl(content.audioId)
  if (!url) {
    toast('语音读取失败')
    return
  }
  playAudio(url, () => {
    state.playingContent = false
    updateContentAudioButton()
  })
  state.playingContent = true
  updateContentAudioButton()
}

async function toggleCreateAudio() {
  if (state.playingCreate) {
    stopAudio()
    return
  }
  if (!state.create || !state.create.audioId) return
  const url = await getAudioUrl(state.create.audioId)
  if (!url) {
    toast('语音读取失败')
    return
  }
  playAudio(url, () => {
    state.playingCreate = false
    updateCreateAudioButton()
  })
  state.playingCreate = true
  updateCreateAudioButton()
}

async function toggleEchoAudio(id) {
  if (!id) return
  if (state.playingEchoId === id) {
    stopAudio()
    return
  }
  const echo = listEchoes(false).items.find((item) => item.id === id)
  if (!echo || !echo.audioId) {
    toast('这条回声没有语音')
    return
  }
  const url = await getAudioUrl(echo.audioId)
  if (!url) {
    toast('语音读取失败')
    return
  }
  playAudio(url, () => {
    state.playingEchoId = ''
  })
  state.playingEchoId = id
}

/* ---------------- 保存 / 封存 ---------------- */

function saveCurrentDraft() {
  if (!state.create) return
  const form = state.create
  if (!form.title.trim() && !form.text.trim() && !form.images.length && !form.audioId) {
    toast('先写点什么吧')
    return
  }
  try {
    const res = saveDraft({
      draftId: form.draftId,
      title: form.title,
      text: form.text,
      mode: form.mode,
      coverColor: form.coverColor,
      coverImage: form.coverImage,
      images: form.images,
      audioId: form.audioId,
      audioDuration: form.audioDuration,
      unlockAt: computeUnlockAt(),
      receiveEcho: form.receiveEcho
    })
    form.draftId = res.id
    state.createKey = 'create:' + res.id
    clearLocalDraft()
    state.draftBanner = null
    window.history.replaceState(null, '', '#/create/' + res.id)
    toast('草稿已保存')
    render({ preserveScroll: true })
  } catch (err) {
    toast(err.message || '保存失败')
  }
}

function submitCapsule() {
  if (!state.create) return
  const form = state.create
  if (!form.title.trim()) {
    toast('请先给胶囊起个标题')
    return
  }
  if (!form.text.trim() && !form.images.length && !form.audioId) {
    toast('写点什么，或录一段声音、放几张照片')
    return
  }
  const unlockAt = computeUnlockAt()
  if (!unlockAt || unlockAt - Date.now() < LIMITS.MIN_UNLOCK_MINUTES * 60 * 1000) {
    toast('解锁时间至少要在 ' + LIMITS.MIN_UNLOCK_MINUTES + ' 分钟之后')
    return
  }
  try {
    const res = sealCapsule({
      draftId: form.draftId,
      title: form.title,
      text: form.text,
      mode: form.mode,
      coverColor: form.coverColor,
      coverImage: form.coverImage,
      images: form.images,
      audioId: form.audioId,
      audioDuration: form.audioDuration,
      unlockAt,
      receiveEcho: form.receiveEcho
    })
    clearLocalDraft()
    state.draftBanner = null
    state.create = null
    state.createKey = null
    toast('已封存')
    navigate('/detail/' + res.id, { replace: true })
  } catch (err) {
    toast(err.message || '封存失败')
  }
}

/* ---------------- 胶囊 / 回声操作 ---------------- */

function showVoucher() {
  const detail = capsuleDetail(state.route.id)
  showModal({
    title: '封存凭证',
    body:
      '<p class="voucher-code">' +
      escapeVoucher(detail.voucher) +
      '</p>' +
      '<p class="modal-text">封存于 ' +
      formatDate(detail.createdAt, true) +
      '<br>解锁于 ' +
      formatDate(detail.unlockAt, true) +
      '</p>' +
      '<p class="modal-text muted">此凭证用于核验胶囊的封存时间。</p>',
    actions: [{ label: '知道了', value: true, kind: 'primary' }]
  })
}

function escapeVoucher(value) {
  return String(value || '—').replace(/[<>&"]/g, '')
}

async function handleMore() {
  let detail
  try {
    detail = capsuleDetail(state.route.id)
  } catch (err) {
    toast('胶囊不存在')
    return
  }
  const items = [{ label: '查看封存凭证', value: 'voucher' }]
  if (detail.canDelete) items.push({ label: '删除这颗胶囊', value: 'delete', danger: true })
  const choice = await showSheet(items)
  if (choice === 'voucher') showVoucher()
  if (choice === 'delete') await deleteCurrent()
}

async function deleteCurrent() {
  const ok = await confirmAction({
    title: '删除胶囊',
    body: '删除后胶囊会从时光仓消失，已收到的回声会保留快照。确认删除吗？',
    confirmText: '删除',
    danger: true
  })
  if (!ok) return
  try {
    deleteCapsule(state.route.id)
    toast('已删除')
    navigate('/', { replace: true })
  } catch (err) {
    toast(err.message || '删除失败')
  }
}

async function toggleFavorite(button) {
  const id = button.dataset.id
  if (!id) return
  const next = !button.classList.contains('on')
  try {
    favoriteEcho(id, next)
    render({ preserveScroll: true })
  } catch (err) {
    toast(err.message || '操作失败')
  }
}

async function reportCurrentEcho(id) {
  if (!id) return
  const reason = await showSheet(REPORT_REASONS.map((item) => ({ label: item, value: item })))
  if (!reason) return
  try {
    if (state.playingEchoId === id) stopAudio()
    reportEcho(id, reason)
    toast('已收到举报')
    render({ preserveScroll: true })
  } catch (err) {
    toast(err.message || '提交失败')
  }
}

async function favoriteFirst() {
  let items = []
  try {
    items = matchEchoes(state.route.id).items
  } catch (err) {
    items = []
  }
  const first = items.find((item) => !item.favorite)
  if (!first) {
    toast(items.length ? '都已收藏啦' : '还没有回声')
    return
  }
  try {
    favoriteEcho(first.id, true)
    toast('已收藏')
    render({ preserveScroll: true })
  } catch (err) {
    toast(err.message || '收藏失败')
  }
}

/* ---------------- 我的 / 设置 ---------------- */

async function editNickname() {
  const user = getUser()
  const name = await showPrompt({
    title: '修改昵称',
    value: user.nickname || '时光旅人',
    placeholder: '请输入昵称',
    confirmText: '保存'
  })
  if (!name) return
  try {
    saveUser({ nickname: name })
    toast('已更新')
    render({ preserveScroll: true })
  } catch (err) {
    toast(err.message || '保存失败')
  }
}

async function handleMenu(key) {
  if (key === 'capsules') {
    navigate('/')
    return
  }
  if (key === 'privacy') {
    navigate('/settings')
    return
  }
  if (key === 'letter') {
    await showModal({
      title: '电子信纸',
      body: '<p class="modal-text">手绘信纸与专属封套正在绘制中，会在下一个版本与胶囊一起送给你。</p>',
      actions: [{ label: '期待', value: true, kind: 'primary' }]
    })
    return
  }
  if (key === 'member') {
    await showModal({
      title: '时光会员',
      body: '<p class="modal-text">更多胶囊数量、高清原图与专属信纸正在筹备中，暂未开放购买。</p>',
      actions: [{ label: '知道了', value: true, kind: 'primary' }]
    })
    return
  }
  if (key === 'help') {
    await showModal({
      title: '帮助与反馈',
      body:
        '<p class="modal-text">常见问题：<br>' +
        '1. 胶囊封存后不能修改，请确认解锁时间后再提交。<br>' +
        '2. 解锁以本机时间为准，修改系统时间会影响演示效果。<br>' +
        '3. 回声只展示匿名昵称与地区。<br><br>' +
        '反馈邮箱：help@shiyin.example</p>',
      actions: [{ label: '知道了', value: true, kind: 'primary' }]
    })
  }
}

async function loadDemo() {
  const hasData = listCapsules().length > 0
  if (hasData) {
    const ok = await confirmAction({
      title: '载入演示数据',
      body: '会替换当前本地的胶囊与回声，确定要载入吗？',
      confirmText: '载入'
    })
    if (!ok) return
  }
  try {
    seedDemo()
    state.filter = 'all'
    state.echoFilter = 'all'
    toast('演示数据已载入')
    navigate('/')
  } catch (err) {
    toast(err.message || '载入失败')
  }
}

async function clearData() {
  const ok = await confirmAction({
    title: '清空全部数据',
    body: '胶囊、回声、照片和语音都会删除，且无法恢复。确定清空吗？',
    confirmText: '清空',
    danger: true
  })
  if (!ok) return
  clearAllData()
  await clearAllAudio()
  clearLocalDraft()
  state.create = null
  state.createKey = null
  state.draftBanner = null
  toast('已清空')
  navigate('/', { replace: true })
}
