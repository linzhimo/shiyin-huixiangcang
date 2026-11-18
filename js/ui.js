/**
 * 通用 UI：图标、格式化、Toast、Modal、ActionSheet、TabBar、图片压缩。
 */

const ICONS = {
  home: '<path d="M3 10.7 12 3l9 7.7V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
  echo:
    '<path d="M4 5.5h16v10.2H9.2L4 20z"/><path d="M8 9.2c1.2-1 2.8-1 4 0M8 12.2c1.2-1 2.8-1 4 0"/>',
  user: '<circle cx="12" cy="8" r="3.4"/><path d="M4.8 21c.6-3.8 3.4-6 7.2-6s6.6 2.2 7.2 6"/>',
  lock: '<rect x="5" y="10" width="14" height="10" rx="3"/><path d="M8.2 10V7.8a3.8 3.8 0 0 1 7.6 0V10"/><circle cx="12" cy="15" r="1.2" fill="currentColor" stroke="none"/>',
  play: '<path d="M8 5.5v13l10-6.5z" fill="currentColor" stroke="none"/>',
  pause: '<path d="M8 5h2.5v14H8zM13.5 5H16v14h-2.5z" fill="currentColor" stroke="none"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3M9 21h6"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  more: '<circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none"/>',
  heart: '<path d="M12 20.3 4.8 13a4.6 4.6 0 0 1 6.5-6.5l.7.7.7-.7A4.6 4.6 0 0 1 19.2 13z"/>',
  flag: '<path d="M6 21V4h9l1.5 3H21v9h-7l-1.5-3H6"/>',
  trash: '<path d="M4 7h16M9 7V4.8h6V7M6.5 7l.8 13h9.4l.8-13M10 11v5M14 11v5"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="16" rx="3"/><path d="M8 3v4M16 3v4M3.5 10h17"/>',
  bell: '<path d="M6 10a6 6 0 0 1 12 0c0 4 2 5.2 2 6.5H4C4 15.2 6 14 6 10zM10 20h4"/>',
  check: '<path d="M4.5 12.5 9.5 17.5 20 7"/>',
  image: '<rect x="3.5" y="4.5" width="17" height="15" rx="3"/><circle cx="9" cy="10" r="1.6"/><path d="m5 18 5-5 3 3 2.5-2.5L20 18"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  edit: '<path d="m4 20 4.2-1 10.6-10.6a2.4 2.4 0 0 0-3.4-3.4L4.8 15.6zM13.8 6.4l3.8 3.8"/>',
  settings:
    '<circle cx="12" cy="12" r="3"/><path d="M19.4 14.5a1.7 1.7 0 0 0 .3 1.9l.1.1-2.3 2.3-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-3.2v-.2a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1-2.3-2.3.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H4v-3.2h.2a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1 2.3-2.3.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6V4h3.2v.2a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1 2.3 2.3-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v3.2h-.2a1.7 1.7 0 0 0-1.6 1z"/>',
  help: '<circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.2A2.5 2.5 0 0 1 14.5 10c0 1.7-2.5 1.9-2.5 3.6"/><circle cx="12" cy="17" r="1" fill="currentColor" stroke="none"/>',
  crown: '<path d="m4 7 4.2 3L12 4l3.8 6L20 7l-1.4 11H5.4z"/><path d="M5.4 18h13.2"/>',
  letter: '<rect x="3.5" y="5" width="17" height="14" rx="2.5"/><path d="m4.5 7 7.5 6 7.5-6"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  sparkle: '<path d="M12 3.5 13.8 9l5.5 1.8L13.8 12.6 12 18l-1.8-5.4L4.7 10.8 10.2 9z"/><path d="M18.5 16.5v3M17 18h3"/>',
  arrow: '<path d="M9 5l7 7-7 7"/>',
  volume: '<path d="M4 9.5h4L13 5v14L8 14.5H4zM16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>',
  refresh: '<path d="M4.5 12a7.5 7.5 0 0 1 12.9-5.2L20 9.5M20 4.5v5h-5M19.5 12a7.5 7.5 0 0 1-12.9 5.2L4 14.5M4 19.5v-5h5"/>',
  quote: '<path d="M9 7H5.5A2.5 2.5 0 0 0 3 9.5V13h5V9.5M21 7h-3.5A2.5 2.5 0 0 0 15 9.5V13h5V9.5M8 13c0 2.5-1 4.2-3 5M20 13c0 2.5-1 4.2-3 5"/>'
}

export function icon(name, size = 20, cls = '') {
  const body = ICONS[name] || ''
  return (
    '<svg class="icon ' +
    cls +
    '" width="' +
    size +
    '" height="' +
    size +
    '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    body +
    '</svg>'
  )
}

export function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/* ---------------- 时间 ---------------- */

function pad(n) {
  return n < 10 ? '0' + n : '' + n
}

export function formatDate(input, withTime = false) {
  const ms = typeof input === 'number' ? input : new Date(input).getTime()
  if (!ms || isNaN(ms)) return ''
  const d = new Date(ms)
  const base = d.getFullYear() + '.' + pad(d.getMonth() + 1) + '.' + pad(d.getDate())
  return withTime ? base + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) : base
}

export function formatDateCn(input) {
  const ms = typeof input === 'number' ? input : new Date(input).getTime()
  if (!ms || isNaN(ms)) return ''
  const d = new Date(ms)
  return d.getFullYear() + ' 年 ' + (d.getMonth() + 1) + ' 月 ' + d.getDate() + ' 日'
}

export function formatDuration(seconds) {
  const s = Math.max(0, Math.round(Number(seconds) || 0))
  return Math.floor(s / 60) + ':' + pad(s % 60)
}

export function countdownText(ms, nowMs = Date.now()) {
  const diff = Math.max(0, ms - nowMs)
  const days = Math.floor(diff / 86400000)
  if (days >= 1) return '距离解锁还有 ' + days + ' 天'
  const hours = Math.floor(diff / 3600000)
  if (hours >= 1) return '距离解锁还有 ' + hours + ' 小时'
  const minutes = Math.max(1, Math.ceil(diff / 60000))
  return '距离解锁还有 ' + minutes + ' 分钟'
}

export function greeting(nowDate = new Date()) {
  const h = nowDate.getHours()
  if (h < 5) return '夜深了'
  if (h < 9) return '早上好'
  if (h < 12) return '上午好'
  if (h < 14) return '中午好'
  if (h < 18) return '下午好'
  if (h < 23) return '晚上好'
  return '夜深了'
}

export function dateInputValue(ms) {
  const d = new Date(ms)
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())
}

export function timeInputValue(ms) {
  const d = new Date(ms)
  return pad(d.getHours()) + ':' + pad(d.getMinutes())
}

export function todayInput() {
  return dateInputValue(Date.now())
}

export function oneYearLaterInput() {
  const d = new Date()
  d.setFullYear(d.getFullYear() + 1)
  return dateInputValue(d.getTime())
}

export function tenYearsLaterInput() {
  const d = new Date()
  d.setFullYear(d.getFullYear() + 10)
  return dateInputValue(d.getTime())
}

export function avatarChar(name) {
  const text = String(name || '时').trim()
  return text.slice(0, 1) || '时'
}

/* ---------------- Toast ---------------- */

let toastTimer = null

export function toast(message, type = '') {
  const el = document.getElementById('toast')
  if (!el) return
  el.textContent = message
  el.className = 'toast show ' + type
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    el.className = 'toast ' + type
  }, 2400)
}

/* ---------------- Modal ---------------- */

let activeModal = null

function closeActiveModal(value = null) {
  if (!activeModal) return
  const { root, resolve } = activeModal
  activeModal = null
  root.classList.add('is-closing')
  setTimeout(() => {
    root.remove()
  }, 160)
  resolve(value)
}

export function showModal({ title = '', body = '', actions = [], dismissible = true, className = '' } = {}) {
  if (activeModal) closeActiveModal(null)
  const root = document.getElementById('modal-root')
  const backdrop = document.createElement('div')
  backdrop.className = 'modal-backdrop'
  backdrop.innerHTML =
    '<div class="modal ' +
    className +
    '" role="dialog" aria-modal="true" aria-label="' +
    escapeHtml(title || '提示') +
    '">' +
    (title ? '<h3 class="modal-title">' + escapeHtml(title) + '</h3>' : '') +
    '<div class="modal-body">' +
    body +
    '</div>' +
    (actions.length
      ? '<div class="modal-actions">' +
        actions
          .map(
            (action, index) =>
              '<button class="modal-btn ' +
              (action.kind || 'ghost') +
              '" data-modal-index="' +
              index +
              '">' +
              escapeHtml(action.label) +
              '</button>'
          )
          .join('') +
        '</div>'
      : '') +
    '</div>'
  root.appendChild(backdrop)

  return new Promise((resolve) => {
    activeModal = { root: backdrop, resolve }

    const onAction = (event) => {
      const btn = event.target.closest('[data-modal-index]')
      if (!btn) return
      const action = actions[Number(btn.dataset.modalIndex)]
      closeActiveModal(action ? action.value : null)
    }

    const onBackdrop = (event) => {
      if (event.target === backdrop && dismissible) closeActiveModal(null)
    }

    const onKey = (event) => {
      if (event.key === 'Escape' && dismissible) closeActiveModal(null)
      if (event.key === 'Tab') {
        const focusables = backdrop.querySelectorAll('button, input, textarea, [tabindex]:not([tabindex="-1"])')
        if (!focusables.length) return
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }

    backdrop.addEventListener('click', onAction)
    backdrop.addEventListener('click', onBackdrop)
    document.addEventListener('keydown', onKey)

    const cleanup = () => {
      document.removeEventListener('keydown', onKey)
    }
    const originalResolve = activeModal.resolve
    activeModal.resolve = (value) => {
      cleanup()
      originalResolve(value)
    }

    setTimeout(() => {
      const firstBtn = backdrop.querySelector('.modal-actions button')
      if (firstBtn) firstBtn.focus()
    }, 30)
  })
}

export function confirmAction({ title, body, confirmText = '确认', cancelText = '取消', danger = false }) {
  return showModal({
    title,
    body: '<p class="modal-text">' + escapeHtml(body) + '</p>',
    actions: [
      { label: cancelText, value: false, kind: 'ghost' },
      { label: confirmText, value: true, kind: danger ? 'danger' : 'primary' }
    ]
  }).then((value) => value === true)
}

export function showSheet(items) {
  const actions = items.map((item) => ({
    label: item.label,
    value: item.value,
    kind: item.danger ? 'danger' : 'sheet'
  }))
  actions.push({ label: '取消', value: null, kind: 'ghost' })
  return showModal({
    title: '',
    className: 'sheet',
    body: '',
    actions
  })
}

export function showPrompt({ title, value = '', placeholder = '', confirmText = '保存' }) {
  const root = document.getElementById('modal-root')
  const backdrop = document.createElement('div')
  backdrop.className = 'modal-backdrop'
  backdrop.innerHTML =
    '<div class="modal" role="dialog" aria-modal="true">' +
    '<h3 class="modal-title">' +
    escapeHtml(title) +
    '</h3>' +
    '<div class="modal-body"><input class="modal-input" type="text" maxlength="20" value="' +
    escapeHtml(value) +
    '" placeholder="' +
    escapeHtml(placeholder) +
    '"></div>' +
    '<div class="modal-actions">' +
    '<button class="modal-btn ghost" data-prompt="cancel">取消</button>' +
    '<button class="modal-btn primary" data-prompt="ok">' +
    escapeHtml(confirmText) +
    '</button>' +
    '</div></div>'
  root.appendChild(backdrop)

  return new Promise((resolve) => {
    const input = backdrop.querySelector('.modal-input')
    const finish = (result) => {
      backdrop.classList.add('is-closing')
      setTimeout(() => backdrop.remove(), 160)
      document.removeEventListener('keydown', onKey)
      resolve(result)
    }
    const onKey = (event) => {
      if (event.key === 'Escape') finish(null)
      if (event.key === 'Enter') finish(input.value.trim() || null)
    }
    backdrop.addEventListener('click', (event) => {
      if (event.target === backdrop) return finish(null)
      const btn = event.target.closest('[data-prompt]')
      if (!btn) return
      if (btn.dataset.prompt === 'cancel') finish(null)
      if (btn.dataset.prompt === 'ok') finish(input.value.trim() || null)
    })
    document.addEventListener('keydown', onKey)
    setTimeout(() => {
      input.focus()
      input.select()
    }, 30)
  })
}

/* ---------------- TabBar ---------------- */

const TABS = [
  { key: 'home', label: '时光仓', icon: 'home', href: '#/' },
  { key: 'echo', label: '回声', icon: 'echo', href: '#/echo' },
  { key: 'mine', label: '我的', icon: 'user', href: '#/mine' }
]

export function renderTabbar(active) {
  return TABS.map(
    (tab) =>
      '<a class="tab-item ' +
      (tab.key === active ? 'active' : '') +
      '" href="' +
      tab.href +
      '" data-tab="' +
      tab.key +
      '">' +
      icon(tab.icon, 22) +
      '<span>' +
      tab.label +
      '</span></a>'
  ).join('')
}

/* ---------------- 图片压缩 ---------------- */

export function compressImage(file, maxDim = 1280, quality = 0.82) {
  return new Promise((resolve, reject) => {
    if (!file || !/^image\//.test(file.type)) {
      reject(new Error('请选择图片文件'))
      return
    }
    if (file.size > 15 * 1024 * 1024) {
      reject(new Error('图片不能超过 15MB'))
      return
    }
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      try {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
        const width = Math.max(1, Math.round(img.width * scale))
        const height = Math.max(1, Math.round(img.height * scale))
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.fillStyle = '#FAF7F2'
        ctx.fillRect(0, 0, width, height)
        ctx.drawImage(img, 0, 0, width, height)
        const dataUrl = canvas.toDataURL('image/jpeg', quality)
        URL.revokeObjectURL(url)
        resolve(dataUrl)
      } catch (err) {
        URL.revokeObjectURL(url)
        reject(new Error('图片处理失败'))
      }
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('图片读取失败'))
    }
    img.src = url
  })
}

/* ---------------- 其他 ---------------- */

export function progressPercent(createdAt, unlockAt, nowMs = Date.now()) {
  const total = unlockAt - createdAt
  if (!total || total <= 0) return 100
  return Math.min(100, Math.max(3, Math.round(((nowMs - createdAt) / total) * 100)))
}

export function pluralDays(ms) {
  return Math.max(1, Math.ceil(ms / 86400000))
}
