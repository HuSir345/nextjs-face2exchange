import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const image = formData.get('image')

    if (!image) {
      return NextResponse.json(
        { success: false, error: 'No image provided' },
        { status: 400 }
      )
    }

    const IMGBB_API_KEY = process.env.IMGBB_API_KEY

    if (!IMGBB_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'API key not configured' },
        { status: 500 }
      )
    }

    // 处理图片数据
    let base64Image: string
    if (image instanceof Blob) {
      // 如果是 Blob，转换为 base64
      const buffer = await image.arrayBuffer()
      base64Image = Buffer.from(buffer).toString('base64')
    } else if (typeof image === 'string') {
      if (image.startsWith('data:')) {
        // 如果是 base64 数据 URL，提取 base64 部分
        base64Image = image.split(',')[1]
      } else {
        // 如果已经是 base64 字符串
        base64Image = image
      }
    } else {
      throw new Error('Unsupported image format')
    }

    // 使用 fetch 发送请求
    const response = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        key: IMGBB_API_KEY,
        image: base64Image,
      }).toString()
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('ImgBB API error response:', errorData)
      return NextResponse.json(
        { 
          success: false, 
          error: `ImgBB API error: ${errorData.error?.message || response.statusText}` 
        },
        { status: response.status }
      )
    }

    const data = await response.json()

    if (data.success) {
      return NextResponse.json({
        success: true,
        url: data.data.url,
      })
    } else {
      console.error('ImgBB upload failed:', data)
      return NextResponse.json(
        { success: false, error: data.error?.message || 'Upload failed' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
} 