import { NextResponse } from 'next/server'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

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

    const imgbbFormData = new FormData()
    
    if (image instanceof Blob) {
      const buffer = await image.arrayBuffer()
      const base64 = Buffer.from(buffer).toString('base64')
      imgbbFormData.append('image', base64)
    } else {
      imgbbFormData.append('image', image)
    }

    const response = await fetch(
      `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
      {
        method: 'POST',
        body: imgbbFormData,
      }
    )

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