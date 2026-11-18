/**
 * 语音存储与录音。
 * Blob 存在 IndexedDB，localStorage 只存 audioId。
 */

const DB_NAME = 'shiyin_audio_v1'
const STORE = 'blobs'

let dbPromise = null

function openDB() {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('当前浏览器不支持本地语音存储'))
      return
    }
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE)
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error || new Error('语音存储打开失败'))
  })
  return dbPromise
}

export async function saveAudioBlob(id, blob, duration) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put({ blob, duration, createdAt: Date.now() }, id)
    tx.oncomplete = () => resolve(id)
    tx.onerror = () => reject(tx.error || new Error('语音保存失败'))
  })
}

export async function getAudioRecord(id) {
  if (!id) return null
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).get(id)
    req.onsuccess = () => resolve(req.result || null)
    req.onerror = () => reject(req.error || new Error('语音读取失败'))
  })
}

export async function getAudioUrl(id) {
  const record = await getAudioRecord(id)
  if (!record || !record.blob) return ''
  return URL.createObjectURL(record.blob)
}

export async function deleteAudioBlob(id) {
  if (!id) return
  const db = await openDB()
  return new Promise((resolve) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => resolve()
  })
}

export async function clearAllAudio() {
  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).clear()
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
    })
  } catch (err) {
    return null
  }
}

export function isRecordingSupported() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder)
}

function pickMimeType() {
  if (!window.MediaRecorder || typeof MediaRecorder.isTypeSupported !== 'function') return ''
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus'
  ]
  return types.find((type) => MediaRecorder.isTypeSupported(type)) || ''
}

export class Recorder {
  constructor({ onTick, onStop, onError, maxSeconds = 300 } = {}) {
    this.onTick = onTick || (() => {})
    this.onStop = onStop || (() => {})
    this.onError = onError || (() => {})
    this.maxSeconds = maxSeconds
    this.mediaRecorder = null
    this.stream = null
    this.chunks = []
    this.startedAt = 0
    this.timer = null
    this.recording = false
    this.cancelled = false
  }

  async start() {
    if (this.recording) return
    if (!isRecordingSupported()) {
      throw new Error('当前浏览器不支持录音，请换用 Chrome / Edge')
    }
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const mimeType = pickMimeType()
    try {
      this.mediaRecorder = mimeType
        ? new MediaRecorder(this.stream, { mimeType })
        : new MediaRecorder(this.stream)
    } catch (err) {
      this.stopTracks()
      throw new Error('录音初始化失败，请检查麦克风权限')
    }

    this.chunks = []
    this.cancelled = false
    this.recording = true
    this.startedAt = Date.now()

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size) this.chunks.push(event.data)
    }

    this.mediaRecorder.onstop = () => {
      const duration = Math.max(0, Math.round((Date.now() - this.startedAt) / 1000))
      const blob = this.chunks.length
        ? new Blob(this.chunks, { type: this.mediaRecorder.mimeType || 'audio/webm' })
        : null
      this.recording = false
      this.stopTracks()
      clearInterval(this.timer)
      this.timer = null
      if (this.cancelled) return
      if (!blob || duration < 1) {
        this.onError(new Error('录音太短啦，再试一次'))
        return
      }
      this.onStop({ blob, duration })
    }

    this.mediaRecorder.start(1000)
    this.timer = setInterval(() => {
      const seconds = Math.floor((Date.now() - this.startedAt) / 1000)
      this.onTick(seconds)
      if (seconds >= this.maxSeconds) this.stop()
    }, 500)
  }

  stop() {
    if (!this.mediaRecorder || !this.recording) return
    try {
      this.mediaRecorder.stop()
    } catch (err) {
      this.stopTracks()
      this.recording = false
    }
  }

  cancel() {
    this.cancelled = true
    this.stop()
  }

  stopTracks() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop())
      this.stream = null
    }
  }
}
