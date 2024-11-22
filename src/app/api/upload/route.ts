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
    let imageData: string | Blob = image
    if (image instanceof Blob) {
      // 如果是 Blob，转换为 base64
      const buffer = await image.arrayBuffer()
      imageData = Buffer.from(buffer).toString('base64')
    } else if (typeof image === 'string' && image.startsWith('data:')) {
      // 如果是 base64 数据 URL，提取 base64 部分
      imageData = image.split(',')[1]
    }

    // 创建新的 URLSearchParams 对象
    const params = new URLSearchParams()
    params.append('key', IMGBB_API_KEY)
    params.append('image', imageData.toString())

    const response = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString()
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('ImgBB API error response:', data)
      return NextResponse.json(
        { success: false, error: `ImgBB API error: ${data.error?.message || response.status}` },
        { status: response.status }
      )
    }

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