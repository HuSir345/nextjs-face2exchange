import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { face_image, base_image } = await request.json()

    if (!face_image || !base_image) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    const COZE_API_KEY = process.env.COZE_API_KEY
    const COZE_WORKFLOW_ID = process.env.COZE_WORKFLOW_ID

    if (!COZE_API_KEY || !COZE_WORKFLOW_ID) {
      return NextResponse.json(
        { success: false, error: 'API configuration missing' },
        { status: 500 }
      )
    }

    const response = await fetch('https://api.coze.cn/v1/workflow/run', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${COZE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        workflow_id: COZE_WORKFLOW_ID,
        parameters: {
          face_image,
          base_image
        }
      })
    })

    if (!response.ok) {
      throw new Error('Coze API call failed')
    }

    const data = await response.json()
    
    if (data.code !== 0) {
      return NextResponse.json(
        { success: false, error: data.msg || 'Coze API error' },
        { status: 500 }
      )
    }

    const resultData = JSON.parse(data.data)
    
    return NextResponse.json({
      success: true,
      url: resultData.output
    })

  } catch (error) {
    console.error('Coze API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
} 