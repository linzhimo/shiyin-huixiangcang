/**
 * 时音回响仓 · 网页版数据层
 * 数据保存在浏览器 localStorage；语音 Blob 保存在 IndexedDB（见 audio.js）。
 * 所有时间以毫秒时间戳存储。
 */

export const COVERS = ['#F3E3C9', '#EFEBF6', '#EEF3EF', '#F7EBD5', '#E8EFF3', '#F2E4E4']

export const LIMITS = {
  MIN_UNLOCK_MINUTES: 5,
  MAX_TEXT: 500,
  MAX_IMAGES: 3,
  MAX_AUDIO_SECONDS: 300,
  DELETE_WINDOW_DAYS: 30
}

const KEY = 'shiyin_web_db_v2'
const DAY = 24 * 60 * 60 * 1000
const DELETE_WINDOW_MS = LIMITS.DELETE_WINDOW_DAYS * DAY

const PSEUDONYMS = [
  '海浪与风',
  '深夜电台',
  '七月的云',
  '南风知我意',
  '晚星',
  '橘子汽水',
  '山间来信',
  '迟到的邮差',
  '小岛日记',
  '月光邮局'
]

const REGIONS = ['青岛', '成都', '杭州', '厦门', '北京', '上海', '广州', '重庆', '南京', '长沙']

const SAMPLE_ECHOES = [
  {
    key: 'sample-1',
    alias: '深夜电台',
    region: '成都',
    text: '加班到十一点，楼下的便利店还亮着灯。希望一年后的我，已经学会早点睡。'
  },
  {
    key: 'sample-2',
    alias: '晚星',
    region: '杭州',
    text: '今天把想说的话写进了胶囊，等明年的自己来读。希望那时还记得今晚的风。'
  },
  {
    key: 'sample-3',
    alias: '橘子汽水',
    region: '厦门',
    text: '毕业那天没有哭，只在车站买了一杯橘子汽水。原来告别是很安静的事。'
  },
  {
    key: 'sample-4',
    alias: '山间来信',
    region: '重庆',
    text: '最近在学着不急着解释自己。把话留给时间，也留给愿意听的人。'
  },
  {
    key: 'sample-5',
    alias: '月光邮局',
    region: '南京',
    text: '如果你也刚好在等一个答案，希望它来的时候，你已经不再那么需要它了。'
  },
  {
    key: 'sample-6',
    alias: '七月的云',
    region: '青岛',
    text: '海边的风把头发吹乱了。那一刻突然觉得，很多事其实都可以慢慢来。'
  }
]

/* ---------------- 工具 ---------------- */

export function now() {
  return Date.now()
}

export function pick(list) {
  return list[Math.floor(Math.random() * list.length)]
}

export function uid(prefix = 'id') {
  const rand =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10)
  return prefix + '_' + Date.now().toString(36) + '_' + rand
}

export function toMs(value) {
  if (!value) return 0
  const d = new Date(value)
  return isNaN(d.getTime()) ? 0 : d.getTime()
}

function pad2(n) {
  return n < 10 ? '0' + n : '' + n
}

function voucherAt(ms) {
  const d = new Date(ms)
  const stamp = '' + d.getFullYear() + pad2(d.getMonth() + 1) + pad2(d.getDate())
  return 'TE-' + stamp + '-' + String(Math.floor(1000 + Math.random() * 9000))
}

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function stringList(value, max) {
  if (!Array.isArray(value)) return []
  return value.filter((item) => typeof item === 'string' && item).slice(0, max)
}

function fail(code, message) {
  const err = new Error(message)
  err.code = code
  return err
}

export function gradientImage(colors, label) {
  const [a, b] = colors
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="900" height="700">' +
    '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0" stop-color="' +
    a +
    '"/><stop offset="1" stop-color="' +
    b +
    '"/></linearGradient></defs>' +
    '<rect width="900" height="700" fill="url(#g)"/>' +
    '<circle cx="700" cy="150" r="90" fill="rgba(255,255,255,.32)"/>' +
    '<path d="M0 540 Q220 420 450 530 T900 480 V700 H0Z" fill="rgba(255,255,255,.24)"/>' +
    '<text x="70" y="620" font-family="PingFang SC,Microsoft YaHei,sans-serif" font-size="34" fill="rgba(43,50,74,.55)">' +
    label +
    '</text></svg>'
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
}

/* ---------------- 存储 ---------------- */

function seed() {
  const t = now()
  const data = {
    version: 2,
    user: { nickname: '时光旅人', avatarUrl: '', createdAt: t - 90 * DAY },
    settings: { hideRegion: false, unlockRemind: true },
    capsules: [],
    echoes: [],
    reports: []
  }

  data.capsules.push({
    id: 'demo-unlocked',
    title: '写给一年后的自己',
    text: '一年前的今天，我把这句话留给你：别急，慢慢来。你已经在路上了。',
    mode: 'self',
    coverColor: '#F7EBD5',
    coverImage: gradientImage(['#F5E7C8', '#E9C98F'], '写给一年后的自己'),
    images: [
      gradientImage(['#CAD6EE', '#8FA3CF'], '那天的天空'),
      gradientImage(['#F3D9C4', '#E2A98C'], '窗边的光')
    ],
    audioId: '',
    audioDuration: 0,
    createdAt: t - 400 * DAY,
    unlockAt: t - 5 * DAY,
    isDraft: false,
    deleted: false,
    voucher: voucherAt(t - 400 * DAY),
    echoCount: 2,
    echoMatched: true,
    receiveEcho: true,
    authorAlias: '',
    authorRegion: ''
  })

  data.capsules.push({
    id: 'demo-locked',
    title: '毕业那天的声音',
    text: '这段话被封存着，解锁前不应该出现在页面上。',
    mode: 'self',
    coverColor: '#EFEBF6',
    coverImage: '',
    images: [],
    audioId: '',
    audioDuration: 0,
    createdAt: t - 10 * DAY,
    unlockAt: t + 30 * DAY,
    isDraft: false,
    deleted: false,
    voucher: voucherAt(t - 10 * DAY),
    echoCount: 0,
    echoMatched: false,
    receiveEcho: true,
    authorAlias: '',
    authorRegion: ''
  })

  data.capsules.push({
    id: 'demo-draft',
    title: '还没想好的话',
    text: '最近总是想起一些很远的下午，想等想清楚了再封存。',
    mode: 'self',
    coverColor: '#EEF3EF',
    coverImage: '',
    images: [],
    audioId: '',
    audioDuration: 0,
    createdAt: t - 2 * DAY,
    unlockAt: t + 365 * DAY,
    isDraft: true,
    deleted: false,
    voucher: '',
    echoCount: 0,
    echoMatched: false,
    receiveEcho: true,
    authorAlias: '',
    authorRegion: ''
  })

  data.capsules.push({
    id: 'demo-anon',
    title: '给陌生的你',
    text: '今天路过海边，想起有人说过时间不会治愈一切，但会让它变得安静。',
    mode: 'anonymous',
    coverColor: '#E8EFF3',
    coverImage: gradientImage(['#CFE3E8', '#8FB6C0'], '给陌生的你'),
    images: [],
    audioId: '',
    audioDuration: 0,
    createdAt: t - 60 * DAY,
    unlockAt: t - 2 * DAY,
    isDraft: false,
    deleted: false,
    voucher: voucherAt(t - 60 * DAY),
    echoCount: 0,
    echoMatched: false,
    receiveEcho: true,
    authorAlias: '海浪与风',
    authorRegion: '青岛'
  })

  data.echoes.push({
    id: 'demo-echo-1',
    capsuleId: 'demo-unlocked',
    sourceKey: 'sample-1',
    alias: '深夜电台',
    region: '成都',
    excerpt: '加班到十一点，楼下的便利店还亮着灯。希望一年后的我，已经学会早点睡。',
    audioId: '',
    audioDuration: 0,
    sourceUnlockAt: t - 4 * DAY,
    matchedAt: t - 5 * DAY,
    favorite: false,
    reported: false
  })

  data.echoes.push({
    id: 'demo-echo-2',
    capsuleId: 'demo-unlocked',
    sourceKey: 'sample-2',
    alias: '晚星',
    region: '杭州',
    excerpt: '今天把想说的话写进了胶囊，等明年的自己来读。希望那时还记得今晚的风。',
    audioId: '',
    audioDuration: 0,
    sourceUnlockAt: t - 6 * DAY,
    matchedAt: t - 5 * DAY,
    favorite: false,
    reported: false
  })

  return data
}

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (data && data.version === 2) return data
  } catch (err) {
    console.warn('[store] 读取失败', err)
  }
  return null
}

function persist(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data))
  } catch (err) {
    console.warn('[store] 保存失败', err)
    throw new Error('本地存储空间不足，请减少图片数量或清理旧数据')
  }
}

let cache = null

function db() {
  if (!cache) {
    cache = load()
    if (!cache) {
      cache = seed()
      persist(cache)
    }
  }
  return cache
}

function save() {
  persist(db())
}

/* ---------------- 映射 ---------------- */

export function getUser() {
  return Object.assign({}, db().user)
}

export function saveUser(patch) {
  const data = db()
  if (typeof patch.nickname === 'string' && patch.nickname.trim()) {
    data.user.nickname = patch.nickname.trim().slice(0, 20)
  }
  if (typeof patch.avatarUrl === 'string') {
    data.user.avatarUrl = patch.avatarUrl
  }
  data.user.updatedAt = now()
  save()
  return Object.assign({}, data.user)
}

export function getSettings() {
  return Object.assign({ hideRegion: false, unlockRemind: true }, db().settings)
}

export function saveSettings(patch) {
  const data = db()
  data.settings = Object.assign(getSettings(), patch)
  save()
  return Object.assign({}, data.settings)
}

export function computeStats() {
  const data = db()
  const t = now()
  let sealed = 0
  let unlocked = 0
  let nextUnlockAt = 0

  data.capsules.forEach((doc) => {
    if (doc.deleted || doc.isDraft) return
    const unlockAt = toMs(doc.unlockAt)
    if (unlockAt > t) {
      sealed += 1
      if (!nextUnlockAt || unlockAt < nextUnlockAt) nextUnlockAt = unlockAt
    } else {
      unlocked += 1
    }
  })

  return {
    sealed,
    unlocked,
    echoes: data.echoes.filter((item) => !item.reported).length,
    nextUnlockAt
  }
}

export function listCapsules() {
  const data = db()
  const t = now()
  return data.capsules
    .filter((doc) => !doc.deleted)
    .sort((a, b) => toMs(b.createdAt) - toMs(a.createdAt))
    .map((doc) => {
      const unlockAt = toMs(doc.unlockAt)
      const isDraft = !!doc.isDraft
      return {
        id: doc.id,
        title: doc.title || '未命名的时光',
        mode: doc.mode || 'self',
        coverColor: doc.coverColor || '#EFEBF6',
        coverImage: doc.coverImage || '',
        isDraft,
        locked: !isDraft && unlockAt > t,
        unlockAt,
        createdAt: toMs(doc.createdAt),
        echoCount: doc.echoCount || 0,
        voucher: doc.voucher || ''
      }
    })
}

export function getCapsule(id) {
  const data = db()
  const doc = data.capsules.find((item) => item.id === id)
  if (!doc || doc.deleted) throw fail('NOT_FOUND', '胶囊不存在')
  return doc
}

export function capsuleDetail(id) {
  const doc = getCapsule(id)
  const t = now()
  const unlockAt = toMs(doc.unlockAt)
  const base = {
    id: doc.id,
    title: doc.title || '',
    mode: doc.mode || 'self',
    isDraft: !!doc.isDraft,
    locked: !doc.isDraft && unlockAt > t,
    unlockAt,
    createdAt: toMs(doc.createdAt),
    voucher: doc.voucher || '',
    echoCount: doc.echoCount || 0,
    receiveEcho: doc.receiveEcho !== false,
    coverColor: doc.coverColor || '#EFEBF6',
    coverImage: doc.coverImage || '',
    hasAudio: !!doc.audioId,
    hasText: !!doc.text,
    hasImages: Array.isArray(doc.images) ? doc.images.length : 0,
    audioDuration: doc.audioDuration || 0,
    canDelete: false,
    serverTime: t
  }

  if (doc.isDraft) {
    base.text = doc.text || ''
    base.canDelete = true
    return base
  }
  if (base.locked) return base

  base.text = doc.text || ''
  base.canDelete = t - unlockAt <= DELETE_WINDOW_MS
  return base
}

export function getCapsuleContent(id) {
  const doc = getCapsule(id)
  if (doc.isDraft) return { text: '', images: [], audioId: '', audioDuration: 0 }
  if (toMs(doc.unlockAt) > now()) throw fail('LOCKED', '胶囊尚未解锁')
  return {
    text: doc.text || '',
    images: Array.isArray(doc.images) ? doc.images : [],
    audioId: doc.audioId || '',
    audioDuration: doc.audioDuration || 0,
    coverImage: doc.coverImage || ''
  }
}

export function getDraftContent(id) {
  const doc = getCapsule(id)
  if (!doc.isDraft) return null
  return {
    id: doc.id,
    title: doc.title || '',
    text: doc.text || '',
    mode: doc.mode || 'self',
    coverColor: doc.coverColor || COVERS[0],
    coverImage: doc.coverImage || '',
    images: Array.isArray(doc.images) ? doc.images : [],
    audioId: doc.audioId || '',
    audioDuration: doc.audioDuration || 0,
    unlockAt: toMs(doc.unlockAt),
    receiveEcho: doc.receiveEcho !== false
  }
}

export function saveDraft(payload) {
  const data = db()
  const p = payload || {}
  const title = cleanText(p.title).slice(0, 40)
  const text = (typeof p.text === 'string' ? p.text : '').slice(0, LIMITS.MAX_TEXT)
  if (!title && !text && !p.images?.length && !p.audioId) {
    throw fail('EMPTY', '先写点什么吧')
  }

  let doc
  if (p.draftId) {
    doc = getCapsule(p.draftId)
    if (!doc.isDraft) throw fail('NOT_DRAFT', '该胶囊已封存，不能修改')
  } else {
    doc = {
      id: uid('capsule'),
      createdAt: now(),
      isDraft: true,
      deleted: false,
      voucher: '',
      echoCount: 0,
      echoMatched: false,
      authorAlias: '',
      authorRegion: ''
    }
    data.capsules.push(doc)
  }

  Object.assign(doc, {
    title,
    text,
    mode: p.mode === 'anonymous' ? 'anonymous' : 'self',
    coverColor: COVERS.indexOf(p.coverColor) >= 0 ? p.coverColor : COVERS[0],
    coverImage: typeof p.coverImage === 'string' ? p.coverImage : '',
    images: stringList(p.images, LIMITS.MAX_IMAGES),
    audioId: typeof p.audioId === 'string' ? p.audioId : '',
    audioDuration: Math.max(0, Math.min(LIMITS.MAX_AUDIO_SECONDS, Number(p.audioDuration) || 0)),
    unlockAt: Number(p.unlockAt) || 0,
    receiveEcho: p.receiveEcho !== false,
    isDraft: true,
    deleted: false,
    updatedAt: now()
  })

  save()
  return { id: doc.id }
}

export function sealCapsule(payload) {
  const data = db()
  const p = payload || {}
  const title = cleanText(p.title).slice(0, 40)
  const text = (typeof p.text === 'string' ? p.text : '').slice(0, LIMITS.MAX_TEXT)
  const images = stringList(p.images, LIMITS.MAX_IMAGES)
  const audioId = typeof p.audioId === 'string' ? p.audioId : ''

  if (!title) throw fail('TITLE_REQUIRED', '请给胶囊起一个标题')
  if (!text && !audioId && !images.length) {
    throw fail('CONTENT_REQUIRED', '写点什么，或录一段声音、放几张照片')
  }

  const unlockAt = Number(p.unlockAt)
  const t = now()
  if (!unlockAt || isNaN(unlockAt)) throw fail('TIME_REQUIRED', '请选择解锁时间')
  if (unlockAt - t < LIMITS.MIN_UNLOCK_MINUTES * 60 * 1000) {
    throw fail('TIME_TOO_SOON', '解锁时间至少要在 ' + LIMITS.MIN_UNLOCK_MINUTES + ' 分钟之后')
  }
  if (unlockAt - t > 10 * 365 * DAY) throw fail('TIME_TOO_FAR', '解锁时间不要超过十年')

  let doc
  if (p.draftId) {
    doc = getCapsule(p.draftId)
    if (!doc.isDraft) throw fail('NOT_DRAFT', '该胶囊已封存，不能修改')
  } else {
    doc = {
      id: uid('capsule'),
      createdAt: t,
      isDraft: true,
      deleted: false,
      voucher: '',
      echoCount: 0,
      echoMatched: false
    }
    data.capsules.push(doc)
  }

  const mode = p.mode === 'anonymous' ? 'anonymous' : 'self'
  Object.assign(doc, {
    title,
    text,
    mode,
    coverColor: COVERS.indexOf(p.coverColor) >= 0 ? p.coverColor : pick(COVERS),
    coverImage: typeof p.coverImage === 'string' ? p.coverImage : '',
    images,
    audioId,
    audioDuration: Math.max(0, Math.min(LIMITS.MAX_AUDIO_SECONDS, Number(p.audioDuration) || 0)),
    unlockAt,
    receiveEcho: p.receiveEcho !== false,
    isDraft: false,
    deleted: false,
    voucher: doc.voucher || voucherAt(t),
    echoCount: 0,
    echoMatched: false,
    updatedAt: t
  })

  if (mode === 'anonymous') {
    const settings = getSettings()
    doc.authorAlias = pick(PSEUDONYMS)
    doc.authorRegion = settings.hideRegion ? '远方' : pick(REGIONS)
  } else {
    doc.authorAlias = ''
    doc.authorRegion = ''
  }

  save()
  return { id: doc.id, voucher: doc.voucher }
}

export function deleteCapsule(id) {
  const data = db()
  const doc = getCapsule(id)
  const t = now()
  const unlockAt = toMs(doc.unlockAt)
  if (!doc.isDraft) {
    if (unlockAt > t) throw fail('STILL_LOCKED', '胶囊还封存着，解锁后才能删除')
    if (t - unlockAt > DELETE_WINDOW_MS) throw fail('TOO_LATE', '解锁满 30 天后不可再删除')
  }
  doc.deleted = true
  doc.deletedAt = t
  save()
  return { id: doc.id }
}

/* ---------------- 回声 ---------------- */

export function mapEcho(doc) {
  return {
    id: doc.id,
    capsuleId: doc.capsuleId,
    alias: doc.alias || '匿名旅人',
    region: doc.region || '远方',
    excerpt: doc.excerpt || '',
    hasAudio: !!doc.audioId,
    audioId: doc.audioId || '',
    audioDuration: doc.audioDuration || 0,
    favorite: !!doc.favorite,
    matchedAt: toMs(doc.matchedAt),
    sourceUnlockAt: toMs(doc.sourceUnlockAt)
  }
}

export function matchEchoes(capsuleId) {
  const data = db()
  const doc = getCapsule(capsuleId)
  if (doc.isDraft) throw fail('BAD_REQUEST', '草稿不能匹配回声')
  if (toMs(doc.unlockAt) > now()) throw fail('LOCKED', '胶囊尚未解锁')
  if (doc.receiveEcho === false) return { items: [], fresh: false }

  const existing = data.echoes.filter((item) => item.capsuleId === doc.id)
  const visible = existing.filter((item) => !item.reported)
  if (visible.length) return { items: visible.map(mapEcho), fresh: false }
  if (doc.echoMatched) return { items: [], fresh: false }

  const used = new Set(data.echoes.map((item) => item.sourceKey))
  let candidates = SAMPLE_ECHOES.filter((item) => !used.has(item.key))
  if (!candidates.length) candidates = SAMPLE_ECHOES.slice()

  const want = 1 + Math.floor(Math.random() * 2)
  const picked = candidates.sort(() => Math.random() - 0.5).slice(0, want)
  const t = now()
  const items = picked.map((src) => {
    const echo = {
      id: uid('echo'),
      capsuleId: doc.id,
      sourceKey: src.key,
      alias: src.alias,
      region: src.region,
      excerpt: src.text,
      audioId: '',
      audioDuration: 0,
      sourceUnlockAt: toMs(doc.unlockAt) - (1 + Math.floor(Math.random() * 3)) * DAY,
      matchedAt: t,
      favorite: false,
      reported: false
    }
    data.echoes.push(echo)
    return echo
  })

  if (items.length) {
    doc.echoMatched = true
    doc.echoCount = (doc.echoCount || 0) + items.length
  }

  save()
  return { items: items.map(mapEcho), fresh: true }
}

export function listEchoes(favorite) {
  const data = db()
  let items = data.echoes.filter((item) => !item.reported)
  if (favorite) items = items.filter((item) => item.favorite)
  items.sort((a, b) => toMs(b.matchedAt) - toMs(a.matchedAt))
  return { items: items.map(mapEcho) }
}

export function favoriteEcho(id, favorite) {
  const data = db()
  const echo = data.echoes.find((item) => item.id === id)
  if (!echo) throw fail('NOT_FOUND', '回声不存在')
  echo.favorite = !!favorite
  echo.favoritedAt = favorite ? now() : 0
  save()
  return { id: echo.id, favorite: echo.favorite }
}

export function reportEcho(id, reason) {
  const data = db()
  const echo = data.echoes.find((item) => item.id === id)
  if (!echo) throw fail('NOT_FOUND', '回声不存在')
  const text = typeof reason === 'string' ? reason.slice(0, 100) : '其他'
  data.reports.push({
    id: uid('report'),
    echoId: echo.id,
    sourceKey: echo.sourceKey || '',
    reason: text,
    createdAt: now()
  })
  echo.reported = true
  echo.reportedReason = text
  echo.reportedAt = now()
  save()
  return { id: echo.id }
}

/* ---------------- 演示数据 / 清理 ---------------- */

export function seedDemo() {
  const data = db()
  const fresh = seed()
  data.capsules = fresh.capsules
  data.echoes = fresh.echoes
  data.reports = []
  save()
  return true
}

export function clearAllData() {
  const empty = {
    version: 2,
    user: { nickname: '时光旅人', avatarUrl: '', createdAt: now() },
    settings: { hideRegion: false, unlockRemind: true },
    capsules: [],
    echoes: [],
    reports: []
  }
  cache = empty
  try {
    persist(empty)
  } catch (err) {
    console.warn('[store] 清理失败', err)
  }
}

export function exportSummary() {
  const data = db()
  return {
    capsules: data.capsules.length,
    echoes: data.echoes.length,
    reports: data.reports.length
  }
}
