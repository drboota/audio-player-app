import { useState, useRef, useEffect, useCallback } from 'react'
import { Files, Mic, Play, Pause, SkipBack, SkipForward, Repeat, Volume2, VolumeX, Music, Square, Trash2, FolderOpen } from './components/icons'

// أنواع التطبيق
type Tab = 'player' | 'record' | 'files'
type RecordFormat = 'mp3' | 'wav' | 'aac' | 'ogg'

interface AudioFile {
  name: string
  path: string
  size: number
  duration?: number
}

interface Recording {
  name: string
  path: string
  duration: number
  date: Date
  format: RecordFormat
}

// أيقونة الصوت
const MusicNote = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
  </svg>
)

// أيقونة المجلد
const FolderIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
  </svg>
)

// المكونات الفرعية
const IconButton = ({ 
  children, 
  onClick, 
  className = '', 
  active = false,
  size = 'medium'
}: { 
  children: React.ReactNode
  onClick?: () => void
  className?: string
  active?: boolean
  size?: 'small' | 'medium' | 'large'
}) => (
  <button 
    onClick={onClick}
    className={`icon-btn ${size} ${active ? 'active' : ''} ${className}`}
  >
    {children}
  </button>
)

// صفحة المشغل
const PlayerPage = ({ 
  currentFile, 
  showToast 
}: { 
  currentFile: AudioFile | null
  showToast: (msg: string) => void
}) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isRepeat, setIsRepeat] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)

  // تحديث وقت الصوت
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => {
      setCurrentTime(audio.currentTime)
      setDuration(audio.duration || 0)
    }

    const handleEnded = () => {
      if (isRepeat) {
        audio.currentTime = 0
        audio.play()
      } else {
        setIsPlaying(false)
        showToast('انتهى التشغيل')
      }
    }

    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('loadedmetadata', updateTime)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('loadedmetadata', updateTime)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [isRepeat, showToast])

  // التحكم في الصوت
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume
    }
  }, [volume, isMuted])

  // تشغيل/إيقاف
  const togglePlay = useCallback(() => {
    if (!audioRef.current) return
    
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play().catch(err => {
        console.error('Playback error:', err)
        showToast('خطأ في التشغيل')
      })
    }
    setIsPlaying(!isPlaying)
  }, [isPlaying, showToast])

  // تخطي للأمام
  const skipForward = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(
        audioRef.current.currentTime + 10,
        duration
      )
    }
  }, [duration])

  // تخطي للخلف
  const skipBack = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(
        audioRef.current.currentTime - 10,
        0
      )
    }
  }, [])

  // إعادة للنهاية (تكرار الملف كاملاً)
  const toggleRepeat = useCallback(() => {
    setIsRepeat(!isRepeat)
    showToast(isRepeat ? 'تم إيقاف التكرار' : 'تم تفعيل التكرار')
  }, [isRepeat, showToast])

  // تحريك شريط التقدم
  const handleProgressClick = useCallback((e: React.MouseEvent) => {
    if (!progressRef.current || !audioRef.current) return
    
    const rect = progressRef.current.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    const newTime = percent * duration
    
    audioRef.current.currentTime = newTime
    setCurrentTime(newTime)
  }, [duration])

  // تنسيق الوقت
  const formatTime = (time: number): string => {
    if (isNaN(time)) return '0:00'
    const mins = Math.floor(time / 60)
    const secs = Math.floor(time % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // تهيئة المشغل
  useEffect(() => {
    if (audioRef.current && currentFile) {
      audioRef.current.src = currentFile.path
      audioRef.current.load()
      if (isPlaying) {
        audioRef.current.play().catch(console.error)
      }
    }
  }, [currentFile])

  return (
    <div className="player-page">
      {/* شريط الصوت المخفي */}
      <audio ref={audioRef} />
      
      {/* صورة الألبوم */}
      <div className="player-cover">
        {isPlaying ? <MusicNote /> : <MusicNote />}
      </div>
      
      {/* معلومات الملف */}
      <div className="player-info">
        <div className="player-title">
          {currentFile?.name || 'لم يتم اختيار ملف'}
        </div>
        <div className="player-artist">
          {currentFile ? 'ملف صوتي' : 'اختر ملفًا من قائمة الملفات'}
        </div>
      </div>
      
      {/* شريط التقدم */}
      <div className="progress-container">
        <div 
          ref={progressRef}
          className="progress-bar"
          onClick={handleProgressClick}
        >
          <div 
            className="progress-fill"
            style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
          />
        </div>
        <div className="progress-time">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
      
      {/* أزرار التحكم */}
      <div className="player-controls">
        <IconButton 
          onClick={skipBack}
          size="small"
        >
          <SkipBack />
        </IconButton>
        
        <IconButton 
          onClick={togglePlay}
          size="large"
          className="play-btn"
        >
          {isPlaying ? <Pause /> : <Play />}
        </IconButton>
        
        <IconButton 
          onClick={skipForward}
          size="small"
        >
          <SkipForward />
        </IconButton>
      </div>
      
      {/* زر إعادة للنهاية */}
      <div className="player-controls" style={{ marginTop: '-10px' }}>
        <IconButton 
          onClick={toggleRepeat}
          size="medium"
          active={isRepeat}
        >
          <Repeat />
        </IconButton>
      </div>
      
      {/* التحكم في الصوت */}
      <div className="volume-container">
        <IconButton onClick={() => setIsMuted(!isMuted)} size="small">
          {isMuted ? <VolumeX /> : <Volume2 />}
        </IconButton>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={isMuted ? 0 : volume}
          onChange={(e) => {
            setVolume(parseFloat(e.target.value))
            setIsMuted(false)
          }}
          className="volume-slider"
        />
      </div>
    </div>
  )
}

// صفحة التسجيل
const RecordPage = ({ 
  showToast 
}: { 
  showToast: (msg: string) => void
}) => {
  const [isRecording, setIsRecording] = useState(false)
  const [recordTime, setRecordTime] = useState(0)
  const [format, setFormat] = useState<RecordFormat>('mp3')
  const [recordings, setRecordings] = useState<Recording[]>([])
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<number | null>(null)

  // بدء التسجيل
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = getMimeType(format)
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType })
      chunksRef.current = []
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType })
        const url = URL.createObjectURL(blob)
        const duration = recordTime
        
        const newRecording: Recording = {
          name: `تسجيل_${Date.now()}.${format}`,
          path: url,
          duration,
          date: new Date(),
          format
        }
        
        setRecordings(prev => [newRecording, ...prev])
        showToast('تم حفظ التسجيل')
        
        stream.getTracks().forEach(track => track.stop())
      }
      
      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start(1000)
      setIsRecording(true)
      setRecordTime(0)
      
      timerRef.current = window.setInterval(() => {
        setRecordTime(prev => prev + 1)
      }, 1000)
      
      showToast('جاري التسجيل...')
    } catch (err) {
      console.error('Recording error:', err)
      showToast('لا يمكن بدء التسجيل')
    }
  }

  // إيقاف التسجيل
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }

  // الحصول على نوع MIME
  const getMimeType = (fmt: RecordFormat): string => {
    const types: Record<RecordFormat, string> = {
      mp3: 'audio/mp3',
      wav: 'audio/wav',
      aac: 'audio/aac',
      ogg: 'audio/ogg'
    }
    return types[fmt]
  }

  // تنسيق الوقت
  const formatRecordTime = (time: number): string => {
    const mins = Math.floor(time / 60)
    const secs = time % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // تشغيل تسجيل
  const playRecording = (recording: Recording) => {
    const audio = new Audio(recording.path)
    audio.play()
    showToast(`جاري تشغيل: ${recording.name}`)
  }

  // حذف تسجيل
  const deleteRecording = (index: number) => {
    setRecordings(prev => prev.filter((_, i) => i !== index))
    showToast('تم حذف التسجيل')
  }

  return (
    <div className="record-page">
      {/* المؤقت */}
      <div className={`record-timer ${isRecording ? 'recording' : ''}`}>
        {formatRecordTime(recordTime)}
      </div>
      
      {/* زر التسجيل */}
      <button 
        className={`record-btn ${isRecording ? 'recording' : ''}`}
        onClick={isRecording ? stopRecording : startRecording}
      >
        {isRecording ? <Square /> : <Mic />}
      </button>
      
      {/* اختيار الامتداد */}
      <div className="format-selector">
        <span className="format-label">امتداد التسجيل:</span>
        <div className="format-options">
          {(['mp3', 'wav', 'aac', 'ogg'] as RecordFormat[]).map(fmt => (
            <button
              key={fmt}
              className={`format-option ${format === fmt ? 'active' : ''}`}
              onClick={() => setFormat(fmt)}
            >
              {fmt.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      
      {/* قائمة التسجيلات */}
      {recordings.length > 0 && (
        <div className="recordings-list">
          <div className="recordings-title">التسجيلات ({recordings.length})</div>
          {recordings.map((rec, index) => (
            <div key={index} className="recording-item">
              <div className="recording-info">
                <div className="recording-name">{rec.name}</div>
                <div className="recording-duration">
                  {formatRecordTime(rec.duration)} - {rec.format.toUpperCase()}
                </div>
              </div>
              <div className="recording-actions">
                <button onClick={() => playRecording(rec)}>
                  <Play />
                </button>
                <button onClick={() => deleteRecording(index)}>
                  <Trash2 />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// صفحة الملفات
const FilesPage = ({ 
  files, 
  setFiles,
  setCurrentFile,
  currentFile,
  showToast
}: { 
  files: AudioFile[]
  setFiles: React.Dispatch<React.SetStateAction<AudioFile[]>>
  setCurrentFile: (file: AudioFile) => void
  currentFile: AudioFile | null
  showToast: (msg: string) => void
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // محاكاة جلب الملفات (في التطبيق الحقيقي يستخدم Capacitor FileSystem)
  const loadSampleFiles = useCallback(() => {
    setIsLoading(true)
    setTimeout(() => {
      const sampleFiles: AudioFile[] = [
        { name: 'موسيقى هادئة.mp3', path: '', size: 3500000 },
        { name: 'صوت طبيعة.wav', path: '', size: 5200000 },
        { name: 'بودكاست.m4a', path: '', size: 2800000 },
        { name: 'محاضرة.aac', path: '', size: 4100000 },
        { name: 'أغنية.flac', path: '', size: 8500000 },
        { name: 'تسجيل.ogg', path: '', size: 1900000 },
        { name: 'نغمة.mp3', path: '', size: 450000 },
        { name: 'فيديو صوتي.mp4', path: '', size: 12000000 },
      ]
      setFiles(sampleFiles)
      setIsLoading(false)
      showToast('تم تحميل الملفات')
    }, 1000)
  }, [setFiles, showToast])

  // اختيار ملف من الجهاز
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      const audioFile: AudioFile = {
        name: file.name,
        path: url,
        size: file.size
      }
      setCurrentFile(audioFile)
      setFiles(prev => [audioFile, ...prev])
      showToast(`تم اختيار: ${file.name}`)
    }
  }

  // البحث في الملفات
  const filteredFiles = files.filter(file => 
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // تنسيق حجم الملف
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="files-page">
      {/* البحث */}
      <div className="search-container">
        <input
          type="text"
          placeholder="ابحث عن ملف صوتي..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
        <button className="search-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
        </button>
      </div>
      
      {/* أزرار المجلدات */}
      <div className="folders-grid">
        <button className="folder-btn" onClick={() => fileInputRef.current?.click()}>
          <FolderOpen />
          <span>اختر ملف</span>
        </button>
        <button className="folder-btn" onClick={loadSampleFiles}>
          <FolderIcon />
          <span>تحميل ملفات تجريبية</span>
        </button>
      </div>
      
      {/* إدخال ملف مخفي */}
      <input
        type="file"
        ref={fileInputRef}
        accept="audio/*"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />
      
      {/* قائمة الملفات */}
      {isLoading ? (
        <div className="loading">
          <div className="spinner" />
        </div>
      ) : filteredFiles.length > 0 ? (
        <div className="files-list">
          {filteredFiles.map((file, index) => (
            <div 
              key={index}
              className={`file-item ${currentFile?.name === file.name ? 'playing' : ''}`}
              onClick={() => setCurrentFile(file)}
            >
              <div className="file-icon">
                <Music />
              </div>
              <div className="file-info">
                <div className="file-name">{file.name}</div>
                <div className="file-size">{formatFileSize(file.size)}</div>
              </div>
              <IconButton onClick={() => setCurrentFile(file)} size="small">
                <Play />
              </IconButton>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Music />
          <p>لا توجد ملفات صوتية</p>
          <p>اختر ملفًا أو حمّل ملفات تجريبية</p>
        </div>
      )}
    </div>
  )
}

// التطبيق الرئيسي
function App() {
  const [activeTab, setActiveTab] = useState<Tab>('player')
  const [currentFile, setCurrentFile] = useState<AudioFile | null>(null)
  const [files, setFiles] = useState<AudioFile[]>([])
  const [toast, setToast] = useState<string | null>(null)

  // عرض رسالة toast
  const showToast = useCallback((message: string) => {
    setToast(message)
    setTimeout(() => setToast(null), 2000)
  }, [])

  return (
    <div className="app-container">
      {/* المحتوى الرئيسي */}
      <main className="main-content">
        {activeTab === 'player' && (
          <PlayerPage 
            currentFile={currentFile}
            showToast={showToast}
          />
        )}
        {activeTab === 'record' && (
          <RecordPage 
            showToast={showToast}
          />
        )}
        {activeTab === 'files' && (
          <FilesPage 
            files={files}
            setFiles={setFiles}
            setCurrentFile={setCurrentFile}
            currentFile={currentFile}
            showToast={showToast}
          />
        )}
      </main>
      
      {/* شريط التنقل السفلي */}
      <nav className="bottom-nav">
        <button 
          className={`nav-item ${activeTab === 'player' ? 'active' : ''}`}
          onClick={() => setActiveTab('player')}
        >
          <Play />
          <span>المشغل</span>
        </button>
        <button 
          className={`nav-item ${activeTab === 'record' ? 'active' : ''}`}
          onClick={() => setActiveTab('record')}
        >
          <Mic />
          <span>التسجيل</span>
        </button>
        <button 
          className={`nav-item ${activeTab === 'files' ? 'active' : ''}`}
          onClick={() => setActiveTab('files')}
        >
          <Files />
          <span>الملفات</span>
        </button>
      </nav>
      
      {/* رسالة Toast */}
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}

export default App