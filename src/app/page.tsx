'use client'

import { useState, useRef, useEffect } from 'react'
import styles from './page.module.css'

export default function Home() {
  const [pic1Url, setPic1Url] = useState('')
  const [pic2Url, setPic2Url] = useState('')
  const [resultUrl, setResultUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<{ [key: number]: File | null }>({
    1: null,
    2: null
  })
  const [previewUrls, setPreviewUrls] = useState<{ [key: number]: string }>({
    1: '',
    2: ''
  })

  const fileInputRef1 = useRef<HTMLInputElement>(null)
  const fileInputRef2 = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, picNum: number) => {
    setError(null)
    if (!e.target.files?.[0]) return
    
    const file = e.target.files[0]
    // 检查文件大小（小于32MB）
    if (file.size > 32 * 1024 * 1024) {
      setError('File size must be less than 32MB')
      return
    }

    setSelectedFiles(prev => ({
      ...prev,
      [picNum]: file
    }))

    // 创建本地预览URL
    const previewUrl = URL.createObjectURL(file)
    setPreviewUrls(prev => ({
      ...prev,
      [picNum]: previewUrl
    }))
  }

  const callCozeAPI = async (face_image: string, base_image: string) => {
    try {
      const response = await fetch('/api/coze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          face_image,
          base_image
        })
      })

      if (!response.ok) {
        throw new Error('Coze API call failed')
      }

      const data = await response.json()
      if (!data.success) {
        throw new Error(data.error || 'Coze API error')
      }

      return data.url
    } catch (error) {
      console.error('Coze API error:', error)
      throw error
    }
  }

  const uploadImageFromUrl = async (imageUrl: string) => {
    try {
      // 获取图片数据
      const response = await fetch(imageUrl)
      const blob = await response.blob()

      // 创建FormData对象上传到ImgBB
      const formData = new FormData()
      formData.append('image', blob)

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload result image')
      }

      const data = await uploadResponse.json()
      return data.url
    } catch (error) {
      console.error('Upload result image error:', error)
      throw error
    }
  }

  const handleUploadAll = async () => {
    if (!selectedFiles[1] || !selectedFiles[2]) {
      setError('Please select both images first')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // 首先上传两张原始图片
      const uploadPromises = [1, 2].map(async (picNum) => {
        const formData = new FormData()
        formData.append('image', selectedFiles[picNum]!)

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })
        
        if (!response.ok) {
          throw new Error(`Upload failed: ${response.statusText}`)
        }

        const data = await response.json()
        
        if (!data.success) {
          throw new Error(data.error || 'Upload failed')
        }

        return data
      })

      const [result1, result2] = await Promise.all(uploadPromises)

      setPic1Url(result1.url)
      setPic2Url(result2.url)

      // 调用Coze API
      const cozeResult = await callCozeAPI(result1.url, result2.url)
      
      // 将Coze返回的图片上传到ImgBB
      const finalImageUrl = await uploadImageFromUrl(cozeResult)
      setResultUrl(finalImageUrl)

    } catch (error) {
      console.error('Process failed:', error)
      setError(error instanceof Error ? error.message : 'Process failed')
    } finally {
      setLoading(false)
    }
  }

  const triggerFileInput = (picNum: number) => {
    if (picNum === 1) {
      fileInputRef1.current?.click()
    } else {
      fileInputRef2.current?.click()
    }
  }

  // 清理预览URL
  const cleanupPreviewUrls = () => {
    Object.values(previewUrls).forEach(url => {
      if (url) URL.revokeObjectURL(url)
    })
  }

  // 组件卸载时清理
  useEffect(() => {
    return () => cleanupPreviewUrls()
  }, [])

  return (
    <main className={styles.main}>
      <h1 className={styles.title}>一起玩换脸</h1>
      
      {error && (
        <div className={styles.errorMessage}>
          {error}
        </div>
      )}
      
      <div className={styles.uploadContainer}>
        {[1, 2].map((picNum) => (
          <div key={picNum} className={styles.uploadSection}>
            <input 
              ref={picNum === 1 ? fileInputRef1 : fileInputRef2}
              type="file" 
              accept="image/*"
              onChange={(e) => handleFileSelect(e, picNum)}
              className={styles.hiddenInput}
            />

            <div 
              className={`${styles.uploadArea} ${selectedFiles[picNum] ? styles.hasImage : ''}`} 
              onClick={() => triggerFileInput(picNum)}
            >
              {previewUrls[picNum] ? (
                <img 
                  src={previewUrls[picNum]} 
                  alt="Preview" 
                  className={styles.previewInBox}
                />
              ) : (
                <div className={styles.dropzone}>
                  <span>{picNum === 1 ? '选取一张人脸' : '选取一张被换人脸'}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {resultUrl && (
        <div className={styles.resultContainer}>
          <h3>效果咋样，不错吧！</h3>
          <img src={resultUrl} alt="Result" className={styles.resultImage} />
        </div>
      )}

      <div className={styles.uploadButtonContainer}>
        <button 
          className={styles.uploadButton}
          onClick={handleUploadAll}
          disabled={loading || !selectedFiles[1] || !selectedFiles[2]}
        >
          {loading ? 'Processing...' : '启动换脸'}
        </button>
      </div>
    </main>
  )
} 